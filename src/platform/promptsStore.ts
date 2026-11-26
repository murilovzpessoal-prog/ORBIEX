import { useState, useEffect, useCallback } from 'react';
import { PROMPT_CARDS, type PromptCard } from './promptCards';
import { supabase } from '../lib/supabaseClient';
import { buildAdminHeaders, isCurrentUserAdmin } from './adminConfig';

export interface AdminPromptCard extends PromptCard {
  isGlobalAdmin?: boolean;
  createdAt?: number;
}

export const PROMPT_CATEGORIES = [
  'Animações',
  'Imagens',
  'Ambientes',
  'Trocas',
  'Influenciadoras',
  'YouTube Create',
  'POV',
  'Cabide',
  'Boomerang',
  'Plus Size',
  'One Prompt',
  'Mirror No Face',
  'No Face',
] as const;

const GLOBAL_CACHE_KEY = 'orbiex_global_prompts_cache_v1';
const GLOBAL_HIDDEN_CACHE_KEY = 'orbiex_global_hidden_prompts_v1';
const EVENT_KEY = 'orbiex_prompts_updated';
const PROMPT_ROW_PREFIX = 'orbiex_prompt::';
const HIDDEN_BASE_ROW_KEY = 'orbiex_catalog::hidden_base_prompts_v1';

const BASE_PROMPT_IDS = new Set(PROMPT_CARDS.map((p) => p.id));

let memoryGlobalPrompts: AdminPromptCard[] | null = null;
let memoryHiddenBaseIds: string[] | null = null;
let inflightGlobalFetch: Promise<AdminPromptCard[]> | null = null;
let lastGlobalFetchAt = 0;

export function normalizePromptMediaUrl(raw?: string): string {
  const s = String(raw || '').trim().replace(/^<|>$/g, '');
  if (!s) return '';
  if (s.startsWith('/') || s.startsWith('./') || s.startsWith('data:')) return s;
  const withScheme = /^https?:\/\//i.test(s) ? s : `https://${s.replace(/^\/+/, '')}`;

  try {
    const u = new URL(withScheme);
    const host = u.hostname.toLowerCase();

    if (host.includes('dropbox.com')) {
      u.searchParams.delete('dl');
      u.searchParams.set('raw', '1');
      return u.toString();
    }

    if (host.includes('drive.google.com')) {
      const m = u.pathname.match(/\/file\/d\/([^/]+)/i);
      if (m?.[1]) {
        return `https://drive.google.com/uc?export=download&id=${m[1]}`;
      }
    }

    if (host === 'i.imgur.com') {
      const cleanPath = u.pathname.replace(/\/+$/, '');
      const gifv = cleanPath.match(/^\/([A-Za-z0-9]{4,14})\.gifv$/i);
      if (gifv) return `https://i.imgur.com/${gifv[1]}.mp4`;
      const noExt = cleanPath.match(/^\/([A-Za-z0-9]{4,14})$/i);
      if (noExt) return `https://i.imgur.com/${noExt[1]}.mp4`;
      if (/^\/([A-Za-z0-9]{4,14})\.mp4$/i.test(cleanPath)) {
        return `https://i.imgur.com${cleanPath}`;
      }
    }

    if (host === 'imgur.com' || host === 'www.imgur.com' || host === 'm.imgur.com') {
      const parts = u.pathname.split('/').filter(Boolean);
      if (
        parts.length === 1 &&
        /^[A-Za-z0-9]{5,12}$/.test(parts[0]) &&
        !['upload', 'signin', 'register', 'search', 'hot', 'new', 'top', 'user', 'jobs'].includes(parts[0].toLowerCase())
      ) {
        return `https://i.imgur.com/${parts[0]}.mp4`;
      }
      if (parts.length >= 3 && (parts[0] === 't' || parts[0] === 'r') && /^[A-Za-z0-9]{5,12}$/.test(parts[2])) {
        return `https://i.imgur.com/${parts[2]}.mp4`;
      }
    }
  } catch {
    /* ignore malformed URL fallback */
  }

  return withScheme;
}

export function isImgurPageUrl(raw?: string): boolean {
  try {
    const s = String(raw || '').trim();
    if (!s || s.startsWith('/') || s.startsWith('data:')) return false;
    const u = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
    const host = u.hostname.toLowerCase();
    return host === 'imgur.com' || host === 'www.imgur.com' || host === 'm.imgur.com';
  } catch {
    return false;
  }
}

export function needsRemoteVideoResolve(raw?: string): boolean {
  const s = String(raw || '').trim();
  if (!s) return false;
  const normalized = normalizePromptMediaUrl(s);
  return isImgurPageUrl(normalized) || /\.gifv(\?|$)/i.test(normalized);
}

const resolvedVideoMemoryCache = new Map<string, string>();

function extractImgurAlbumOrPostId(rawUrl: string): string {
  try {
    const u = new URL(/^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`);
    const parts = u.pathname.split('/').filter(Boolean);
    if ((parts[0] === 'a' || parts[0] === 'gallery') && parts[1]) {
      const dash = parts[1].split('-').pop() || parts[1];
      return /^[A-Za-z0-9]{5,12}$/.test(dash) ? dash : parts[1];
    }
    const last = parts[parts.length - 1] || '';
    const dash = last.split('-').pop() || last;
    return /^[A-Za-z0-9]{5,12}$/.test(dash) ? dash : '';
  } catch {
    return '';
  }
}

export async function resolveRemoteVideoUrl(rawUrl: string): Promise<{
  ok: boolean;
  mediaUrl: string;
  resolved?: boolean;
  error?: string;
}> {
  const original = String(rawUrl || '').trim();
  const normalized = normalizePromptMediaUrl(original);
  if (!normalized) return { ok: false, mediaUrl: '', error: 'URL do vídeo vazia.' };

  if (resolvedVideoMemoryCache.has(original)) {
    return { ok: true, mediaUrl: resolvedVideoMemoryCache.get(original)!, resolved: true };
  }

  const shouldQueryRemote =
    isImgurPageUrl(original) || isImgurPageUrl(normalized) || /\.gifv(\?|$)/i.test(original);

  if (!shouldQueryRemote) {
    return { ok: true, mediaUrl: normalized, resolved: normalized !== original };
  }

  // 1. Tenta o endpoint do servidor Vercel (/api/prompts?action=resolve_video)
  try {
    const res = await fetch(`/api/prompts?action=resolve_video&url=${encodeURIComponent(original)}`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const json = await res.json().catch(() => null);
      if (json?.success && json.mediaUrl && !isImgurPageUrl(json.mediaUrl)) {
        resolvedVideoMemoryCache.set(original, json.mediaUrl);
        return { ok: true, mediaUrl: json.mediaUrl, resolved: true };
      }
    }
  } catch {
    /* fallback client-side Imgur public post API */
  }

  // 2. Fallback direto no endpoint público do Imgur via IP do usuário (suporta CORS)
  const postId = extractImgurAlbumOrPostId(original) || extractImgurAlbumOrPostId(normalized);
  if (postId) {
    const endpoints = [
      `https://api.imgur.com/post/v1/albums/${postId}?client_id=546c25a59c58ad7&include=media`,
      `https://api.imgur.com/post/v1/posts/${postId}?client_id=546c25a59c58ad7&include=media`,
    ];
    for (const ep of endpoints) {
      try {
        const resp = await fetch(ep, { referrerPolicy: 'no-referrer' });
        if (!resp.ok) continue;
        const json = await resp.json().catch(() => null);
        const mediaList = Array.isArray(json?.media) ? json.media : [];
        const videoMedia =
          mediaList.find(
            (m: { type?: string; mime_type?: string }) =>
              String(m?.type || '').toLowerCase() === 'video' || String(m?.mime_type || '').startsWith('video/')
          ) || mediaList[0];

        if (videoMedia?.url && /\.mp4/i.test(videoMedia.url)) {
          const clean = String(videoMedia.url).split('?')[0];
          resolvedVideoMemoryCache.set(original, clean);
          return { ok: true, mediaUrl: clean, resolved: true };
        }
        if (videoMedia?.id) {
          const clean = `https://i.imgur.com/${videoMedia.id}.mp4`;
          resolvedVideoMemoryCache.set(original, clean);
          return { ok: true, mediaUrl: clean, resolved: true };
        }
      } catch {
        /* tenta próximo endpoint */
      }
    }
  }

  if (!isImgurPageUrl(normalized)) {
    return { ok: true, mediaUrl: normalized, resolved: normalized !== original };
  }

  return {
    ok: false,
    mediaUrl: normalized,
    error:
      'Esse link do Imgur é uma página/álbum e não o vídeo .mp4 direto. No Imgur, clique com o botão direito em cima do vídeo > "Copiar endereço do vídeo" (link i.imgur.com/...mp4).',
  };
}

function getGlobalCache(): AdminPromptCard[] {
  if (memoryGlobalPrompts) return memoryGlobalPrompts;
  try {
    const raw = localStorage.getItem(GLOBAL_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      memoryGlobalPrompts = parsed;
      return parsed;
    }
  } catch {
    /* ignore */
  }
  return [];
}

function saveGlobalCache(list: AdminPromptCard[]): void {
  const clean = list.filter((p) => p && p.title && p.mediaUrl && p.prompt);
  memoryGlobalPrompts = clean;
  try {
    localStorage.setItem(GLOBAL_CACHE_KEY, JSON.stringify(clean));
  } catch {
    /* ignore */
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(EVENT_KEY));
  }
}

function getHiddenBaseCache(): string[] {
  if (memoryHiddenBaseIds) return memoryHiddenBaseIds;
  try {
    const raw = localStorage.getItem(GLOBAL_HIDDEN_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      memoryHiddenBaseIds = parsed.map(String);
      return memoryHiddenBaseIds;
    }
  } catch {
    /* ignore */
  }
  return [];
}

function saveHiddenBaseCache(ids: string[], emitEvent = true): void {
  const clean = Array.from(new Set(ids.map(String).filter(Boolean)));
  memoryHiddenBaseIds = clean;
  try {
    localStorage.setItem(GLOBAL_HIDDEN_CACHE_KEY, JSON.stringify(clean));
  } catch {
    /* ignore */
  }
  if (emitEvent && typeof window !== 'undefined') {
    window.dispatchEvent(new Event(EVENT_KEY));
  }
}

export function getAllPrompts(): AdminPromptCard[] {
  const globalItems = getGlobalCache();
  const hiddenSet = new Set(getHiddenBaseCache());
  const visibleBase: AdminPromptCard[] = PROMPT_CARDS.filter((p) => !hiddenSet.has(p.id));
  const merged = [...globalItems, ...visibleBase];
  const seen = new Set<string>();
  return merged.filter((item) => {
    if (!item?.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function parseSupabasePromptRows(rows: Array<{ avatar_url?: string | null }>): AdminPromptCard[] {
  const items: AdminPromptCard[] = [];
  for (const r of rows || []) {
    if (!r?.avatar_url) continue;
    try {
      const p = JSON.parse(r.avatar_url);
      if (!p || p.deleted || !p.title || !p.mediaUrl || !p.prompt) continue;
      items.push({ ...p, mediaUrl: normalizePromptMediaUrl(p.mediaUrl), isGlobalAdmin: true });
    } catch {
      /* ignore malformed row */
    }
  }
  return items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export async function fetchGlobalPrompts(force = false): Promise<AdminPromptCard[]> {
  const now = Date.now();
  if (!force && inflightGlobalFetch) return inflightGlobalFetch;
  if (!force && now - lastGlobalFetchAt < 8000 && memoryGlobalPrompts) {
    return memoryGlobalPrompts;
  }

  inflightGlobalFetch = (async () => {
    try {
      const res = await fetch('/api/prompts?t=' + Date.now(), { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json?.success && Array.isArray(json.prompts)) {
          lastGlobalFetchAt = Date.now();
          if (Array.isArray(json.hiddenBaseIds)) {
            saveHiddenBaseCache(json.hiddenBaseIds, false);
          }
          saveGlobalCache(json.prompts);
          return json.prompts;
        }
      }
    } catch {
      /* fallback direto para Supabase */
    }

    try {
      const [{ data, error }, { data: hiddenRow }] = await Promise.all([
        supabase
          .from('profiles')
          .select('user_email, name, avatar_url, updated_at')
          .like('user_email', `${PROMPT_ROW_PREFIX}%`)
          .order('updated_at', { ascending: false })
          .limit(200),
        supabase
          .from('profiles')
          .select('avatar_url')
          .eq('user_email', HIDDEN_BASE_ROW_KEY)
          .maybeSingle(),
      ]);

      if (hiddenRow?.avatar_url) {
        try {
          const parsedHidden = JSON.parse(hiddenRow.avatar_url);
          if (Array.isArray(parsedHidden?.ids)) {
            saveHiddenBaseCache(parsedHidden.ids, false);
          }
        } catch {
          /* ignore */
        }
      } else if (!error) {
        saveHiddenBaseCache([], false);
      }

      if (!error && Array.isArray(data)) {
        const parsed = parseSupabasePromptRows(data);
        lastGlobalFetchAt = Date.now();
        saveGlobalCache(parsed);
        return parsed;
      }
    } catch {
      /* ignore */
    }
    return getGlobalCache();
  })().finally(() => {
    inflightGlobalFetch = null;
  });

  return inflightGlobalFetch;
}

export async function publishGlobalPrompt(input: {
  title: string;
  mediaUrl: string;
  prompt: string;
  filterCategory?: string;
  description?: string;
  mediaType?: 'video' | 'image';
}): Promise<{ ok: boolean; promptCard?: AdminPromptCard; error?: string }> {
  if (!isCurrentUserAdmin()) {
    return { ok: false, error: 'Apenas a conta ADM pode publicar prompts globais.' };
  }

  const cleanTitle = input.title.trim();
  const rawMedia = input.mediaUrl.trim();
  const cleanPromptText = input.prompt.trim();
  const filterCategory = input.filterCategory?.trim() || 'Animações';
  const mediaType: 'video' | 'image' = input.mediaType === 'image' ? 'image' : 'video';

  if (!rawMedia || !cleanTitle || !cleanPromptText) {
    return { ok: false, error: 'Preencha a URL do vídeo, o nome do prompt e o texto do prompt.' };
  }

  let cleanMediaUrl = normalizePromptMediaUrl(rawMedia);
  if (mediaType === 'video') {
    const resolved = await resolveRemoteVideoUrl(rawMedia);
    if (!resolved.ok) {
      return { ok: false, error: resolved.error || 'Link de vídeo inválido ou não reproduzível.' };
    }
    cleanMediaUrl = resolved.mediaUrl;
  }

  const now = Date.now();
  const id = `global-prompt-${now}`;
  const payloadCard: AdminPromptCard = {
    id,
    originalId: id,
    cardNum: 9000 + (now % 1000),
    title: cleanTitle.toUpperCase(),
    filterCategory,
    mediaType,
    mediaUrl: cleanMediaUrl,
    description: input.description?.trim() || '',
    prompt: cleanPromptText,
    isReference: false,
    isGlobalAdmin: true,
    createdAt: now,
  };

  try {
    const headers = await buildAdminHeaders();
    const res = await fetch('/api/prompts', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...payloadCard,
        adminEmail: headers['x-orbiex-admin-email'],
        adminSecret: headers['x-orbiex-admin-secret'],
      }),
    });
    const json = await res.json().catch(() => null);
    if (res.ok && json?.success && json.prompt) {
      saveGlobalCache([json.prompt, ...getGlobalCache().filter((p) => p.id !== json.prompt.id)]);
      return { ok: true, promptCard: json.prompt };
    }
    if ((res.status === 400 || res.status === 403) && json?.error) {
      return { ok: false, error: json.error };
    }
  } catch {
    /* fallback direto para Supabase */
  }

  try {
    const { error } = await supabase.from('profiles').upsert(
      {
        user_email: `${PROMPT_ROW_PREFIX}${payloadCard.id}`,
        name: filterCategory,
        avatar_url: JSON.stringify({ ...payloadCard, deleted: false }),
        updated_at: new Date(now).toISOString(),
      },
      { onConflict: 'user_email' }
    );
    if (error) {
      return { ok: false, error: error.message };
    }
    saveGlobalCache([payloadCard, ...getGlobalCache().filter((p) => p.id !== payloadCard.id)]);
    return { ok: true, promptCard: payloadCard };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Erro ao publicar prompt.' };
  }
}

export async function removeGlobalPrompt(id: string): Promise<{ ok: boolean; error?: string }> {
  if (!isCurrentUserAdmin()) {
    return { ok: false, error: 'Apenas a conta ADM pode remover prompts globais.' };
  }
  const cleanId = String(id || '').trim();
  if (!cleanId) return { ok: false, error: 'ID inválido.' };

  const isBasePrompt = BASE_PROMPT_IDS.has(cleanId) || !cleanId.startsWith('global-prompt-');
  const prevGlobal = getGlobalCache();
  const prevHidden = getHiddenBaseCache();

  if (isBasePrompt) {
    saveHiddenBaseCache([...prevHidden, cleanId]);
  } else {
    saveGlobalCache(prevGlobal.filter((p) => p.id !== cleanId));
  }

  try {
    const headers = await buildAdminHeaders();
    const res = await fetch(`/api/prompts?id=${encodeURIComponent(cleanId)}`, {
      method: 'DELETE',
      headers,
    });
    const json = await res.json().catch(() => null);
    if (res.ok && json?.success) {
      if (Array.isArray(json.hiddenBaseIds)) {
        saveHiddenBaseCache(json.hiddenBaseIds);
      }
      return { ok: true };
    }
  } catch {
    /* fallback direto Supabase */
  }

  try {
    if (isBasePrompt) {
      const { data: latestRow } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('user_email', HIDDEN_BASE_ROW_KEY)
        .maybeSingle();
      let existingIds: string[] = [...prevHidden];
      if (latestRow?.avatar_url) {
        try {
          const parsed = JSON.parse(latestRow.avatar_url);
          if (Array.isArray(parsed?.ids)) existingIds = parsed.ids.map(String);
        } catch {
          /* ignore */
        }
      }
      const nextHidden = Array.from(new Set([...existingIds, cleanId]));
      const { error: updErr } = await supabase.from('profiles').upsert(
        {
          user_email: HIDDEN_BASE_ROW_KEY,
          name: 'hidden_base_prompts',
          avatar_url: JSON.stringify({ ids: nextHidden, updatedAt: Date.now() }),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_email' }
      );
      if (updErr) {
        saveHiddenBaseCache(prevHidden);
        return { ok: false, error: updErr.message };
      }
      saveHiddenBaseCache(nextHidden);
      return { ok: true };
    }

    const rowKey = `${PROMPT_ROW_PREFIX}${cleanId}`;
    const { error: delErr } = await supabase.from('profiles').delete().eq('user_email', rowKey);
    if (delErr) {
      const { error: updErr } = await supabase.from('profiles').upsert(
        {
          user_email: rowKey,
          name: 'deleted',
          avatar_url: JSON.stringify({ id: cleanId, deleted: true }),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_email' }
      );
      if (updErr) {
        saveGlobalCache(prevGlobal);
        return { ok: false, error: updErr.message };
      }
    }
    return { ok: true };
  } catch (err) {
    if (isBasePrompt) saveHiddenBaseCache(prevHidden);
    else saveGlobalCache(prevGlobal);
    return { ok: false, error: err instanceof Error ? err.message : 'Erro ao remover prompt.' };
  }
}

export async function restoreHiddenBasePrompts(): Promise<{ ok: boolean; error?: string }> {
  if (!isCurrentUserAdmin()) {
    return { ok: false, error: 'Apenas a conta ADM pode restaurar prompts.' };
  }
  saveHiddenBaseCache([]);
  try {
    const headers = await buildAdminHeaders();
    const res = await fetch('/api/prompts', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action: 'restore_base',
        adminEmail: headers['x-orbiex-admin-email'],
        adminSecret: headers['x-orbiex-admin-secret'],
      }),
    });
    if (res.ok) return { ok: true };
  } catch {
    /* fallback Supabase */
  }
  try {
    const { error } = await supabase.from('profiles').upsert(
      {
        user_email: HIDDEN_BASE_ROW_KEY,
        name: 'hidden_base_prompts',
        avatar_url: JSON.stringify({ ids: [], updatedAt: Date.now() }),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_email' }
    );
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Erro ao restaurar prompts.' };
  }
}

export function usePrompts() {
  const [prompts, setPrompts] = useState<AdminPromptCard[]>(() => getAllPrompts());
  const [globalPrompts, setGlobalPrompts] = useState<AdminPromptCard[]>(() => getGlobalCache());
  const [hiddenBaseIds, setHiddenBaseIds] = useState<string[]>(() => getHiddenBaseCache());
  const [loadingGlobal, setLoadingGlobal] = useState<boolean>(false);

  const refresh = useCallback(() => {
    setPrompts(getAllPrompts());
    setGlobalPrompts(getGlobalCache());
    setHiddenBaseIds(getHiddenBaseCache());
  }, []);

  const refreshGlobal = useCallback(async (force = false) => {
    setLoadingGlobal(true);
    try {
      await fetchGlobalPrompts(force);
    } finally {
      setLoadingGlobal(false);
    }
  }, []);

  useEffect(() => {
    refreshGlobal();
    const onFocus = () => {
      void fetchGlobalPrompts(false);
    };
    window.addEventListener(EVENT_KEY, refresh);
    window.addEventListener('storage', refresh);
    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener(EVENT_KEY, refresh);
      window.removeEventListener('storage', refresh);
      window.removeEventListener('focus', onFocus);
    };
  }, [refresh, refreshGlobal]);

  return {
    prompts,
    globalPrompts,
    hiddenBaseIds,
    loadingGlobal,
    refresh,
    refreshGlobal,
    publishGlobalPrompt,
    removeGlobalPrompt,
    restoreHiddenBasePrompts,
  };
}

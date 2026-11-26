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
  const s = String(raw || '').trim();
  if (!s) return '';
  if (s.startsWith('/') || s.startsWith('./') || s.startsWith('data:')) return s;
  const withScheme = /^https?:\/\//i.test(s) ? s : `https://${s.replace(/^\/+/, '')}`;
  if (withScheme.includes('dropbox.com') && withScheme.includes('dl=0')) {
    return withScheme.replace('dl=0', 'raw=1');
  }
  return withScheme;
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
      items.push({ ...p, isGlobalAdmin: true });
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
  const cleanMediaUrl = normalizePromptMediaUrl(input.mediaUrl);
  const cleanPromptText = input.prompt.trim();
  const filterCategory = input.filterCategory?.trim() || 'Animações';
  const mediaType: 'video' | 'image' = input.mediaType === 'image' ? 'image' : 'video';

  if (!cleanMediaUrl || !cleanTitle || !cleanPromptText) {
    return { ok: false, error: 'Preencha a URL do vídeo, o nome do prompt e o texto do prompt.' };
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
    if (res.status === 403 && json?.error) {
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

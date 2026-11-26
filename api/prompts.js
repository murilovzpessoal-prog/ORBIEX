/**
 * Orbiex Backend — Biblioteca Global de Prompts do ADM (visível para todos os usuários)
 * GET    /api/prompts?action=resolve_video&url=... -> resolve link do Imgur / hospedagem para .mp4 direto
 * GET    /api/prompts                              -> lista todos os prompts globais publicados + IDs base ocultos
 * POST   /api/prompts                              -> publica novo prompt global com vídeo (apenas ADM)
 * DELETE /api/prompts?id=...                       -> remove prompt global ou oculta prompt base (apenas ADM)
 */
const {
  supabase,
  setCorsHeaders,
  verifyAdminRequest,
  normalizeExternalUrl,
  isImgurAlbumOrPageUrl,
  resolveVideoMediaUrl,
  getJsonSettingArray,
  setJsonSettingArray,
  deleteOrTombstoneProfileRow,
} = require('./_supabase-admin.js');

const PROMPT_ROW_PREFIX = 'orbiex_prompt::';
const HIDDEN_BASE_PROMPTS_KEY = 'orbiex_catalog::hidden_base_prompts_v1';

function parsePromptRow(row) {
  if (!row || !row.avatar_url) return null;
  try {
    const parsed = JSON.parse(row.avatar_url);
    if (!parsed || parsed.deleted) return null;
    if (!parsed.title || !parsed.mediaUrl || !parsed.prompt) return null;
    return {
      ...parsed,
      isGlobalAdmin: true,
    };
  } catch {
    return null;
  }
}

async function healPromptIfNeeded(promptCard) {
  if (!promptCard || promptCard.mediaType !== 'video') return promptCard;
  const current = String(promptCard.mediaUrl || '').trim();
  const normalized = normalizeExternalUrl(current);

  const needsRemoteResolve =
    isImgurAlbumOrPageUrl(normalized) ||
    /(?:^|\/\/)imgur\.com\//i.test(current) ||
    /\.gifv(\?|$)/i.test(current);

  let nextUrl = normalized;
  if (needsRemoteResolve) {
    try {
      const resolved = await resolveVideoMediaUrl(current);
      if (resolved?.ok && resolved.mediaUrl) {
        nextUrl = resolved.mediaUrl;
      }
    } catch {
      /* mantém normalized como fallback */
    }
  }

  if (nextUrl && nextUrl !== current) {
    const healed = { ...promptCard, mediaUrl: nextUrl };
    // Persiste correção em segundo plano para acelerar carregamentos futuros
    supabase
      .from('profiles')
      .upsert(
        {
          user_email: `${PROMPT_ROW_PREFIX}${healed.id}`,
          name: healed.filterCategory || 'Animações',
          avatar_url: JSON.stringify(healed),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_email' }
      )
      .then(() => {})
      .catch(() => {});
    return healed;
  }

  return promptCard;
}

async function removeGlobalPrompt(id) {
  const cleanId = String(id || '').trim();
  if (!cleanId) return { ok: false, status: 400, error: 'ID do prompt não informado.' };

  if (!cleanId.startsWith('global-prompt-')) {
    const current = await getJsonSettingArray(HIDDEN_BASE_PROMPTS_KEY);
    const saved = await setJsonSettingArray(HIDDEN_BASE_PROMPTS_KEY, 'hidden_base_prompts', [...current, cleanId]);
    if (!saved.ok) return { ok: false, status: 500, error: saved.error };
    return { ok: true, id: cleanId, hiddenBaseIds: saved.ids };
  }

  const res = await deleteOrTombstoneProfileRow(`${PROMPT_ROW_PREFIX}${cleanId}`, cleanId);
  if (!res.ok) return { ok: false, status: 500, error: res.error };
  return { ok: true, id: cleanId };
}

module.exports = async function handler(req, res) {
  setCorsHeaders(res, 'GET,OPTIONS,POST,DELETE');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET' && req.query?.action === 'resolve_video') {
      const rawUrl = String(req.query?.url || '').trim();
      if (!rawUrl) {
        return res.status(400).json({ success: false, error: 'URL não informada.' });
      }
      const resolved = await resolveVideoMediaUrl(rawUrl);
      if (!resolved.ok) {
        return res.status(200).json({
          success: false,
          mediaUrl: resolved.mediaUrl,
          error: resolved.error,
        });
      }
      return res.status(200).json({
        success: true,
        mediaUrl: resolved.mediaUrl,
        resolved: Boolean(resolved.resolved),
      });
    }

    if (req.method === 'GET') {
      const [{ data, error }, hiddenBaseIds] = await Promise.all([
        supabase
          .from('profiles')
          .select('user_email, name, avatar_url, updated_at')
          .like('user_email', `${PROMPT_ROW_PREFIX}%`)
          .order('updated_at', { ascending: false })
          .limit(200),
        getJsonSettingArray(HIDDEN_BASE_PROMPTS_KEY),
      ]);

      if (error) {
        return res.status(500).json({ success: false, error: error.message });
      }

      const rawPrompts = (data || [])
        .map(parsePromptRow)
        .filter(Boolean)
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

      const prompts = await Promise.all(rawPrompts.map(healPromptIfNeeded));

      return res.status(200).json({ success: true, prompts, hiddenBaseIds });
    }

    const auth = await verifyAdminRequest(req);
    if (!auth.ok) {
      return res.status(403).json({ success: false, error: auth.error });
    }

    if (req.method === 'DELETE' || req.body?.action === 'delete') {
      const result = await removeGlobalPrompt(req.query?.id || req.body?.id);
      if (!result.ok) {
        return res.status(result.status || 500).json({ success: false, error: result.error });
      }
      return res.status(200).json({ success: true, id: result.id, hiddenBaseIds: result.hiddenBaseIds });
    }

    if (req.method === 'POST' && req.body?.action === 'restore_base') {
      const targetId = req.body?.id ? String(req.body.id).trim() : '';
      const current = await getJsonSettingArray(HIDDEN_BASE_PROMPTS_KEY);
      const next = targetId ? current.filter((x) => x !== targetId) : [];
      const saved = await setJsonSettingArray(HIDDEN_BASE_PROMPTS_KEY, 'hidden_base_prompts', next);
      if (!saved.ok) return res.status(500).json({ success: false, error: saved.error });
      return res.status(200).json({ success: true, hiddenBaseIds: saved.ids });
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      const title = String(body.title || body.name || '').trim();
      const rawMediaUrl = String(body.mediaUrl || body.videoUrl || '').trim();
      const promptText = String(body.prompt || '').trim();
      const filterCategory = String(body.filterCategory || body.category || 'Animações').trim() || 'Animações';
      const mediaType = body.mediaType === 'image' ? 'image' : 'video';

      if (!rawMediaUrl) return res.status(400).json({ success: false, error: 'Cole a URL do vídeo hospedado.' });
      if (!title) return res.status(400).json({ success: false, error: 'Informe o nome do prompt.' });
      if (!promptText) return res.status(400).json({ success: false, error: 'Cole o texto do prompt.' });

      let mediaUrl = normalizeExternalUrl(rawMediaUrl);
      if (mediaType === 'video') {
        const resolved = await resolveVideoMediaUrl(rawMediaUrl);
        if (!resolved.ok) {
          return res.status(400).json({ success: false, error: resolved.error });
        }
        mediaUrl = resolved.mediaUrl;
      }

      const now = Date.now();
      const id = String(body.id || `global-prompt-${now}`);
      const description = String(body.description || '').trim();

      const promptCard = {
        id,
        originalId: id,
        cardNum: Number(body.cardNum) || 9000,
        title: title.toUpperCase(),
        filterCategory,
        mediaType,
        mediaUrl,
        description,
        prompt: promptText,
        isReference: false,
        isGlobalAdmin: true,
        createdAt: now,
        deleted: false,
      };

      const { error } = await supabase.from('profiles').upsert(
        {
          user_email: `${PROMPT_ROW_PREFIX}${id}`,
          name: filterCategory,
          avatar_url: JSON.stringify(promptCard),
          updated_at: new Date(now).toISOString(),
        },
        { onConflict: 'user_email' }
      );

      if (error) {
        return res.status(500).json({ success: false, error: error.message });
      }

      return res.status(200).json({ success: true, prompt: promptCard });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (err) {
    console.error('Prompts API error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Internal server error' });
  }
};

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ywmhjdcuztfwhlatvlzp.supabase.co';
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_yOFFvnPP5ZH2-SwMHF_JLw_tM9VRGXS';

const ADMIN_EMAIL = 'adm@gmail.com';
const ADMIN_SECRET = process.env.ORBIEX_ADMIN_PASSWORD || 'Orbiex2026k';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

function setCorsHeaders(res, methods = 'GET,OPTIONS,POST,DELETE') {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, X-Orbiex-Admin-Email, X-Orbiex-Admin-Secret'
  );
  res.setHeader('Cache-Control', 'no-store');
}

function normalizeEmail(raw) {
  return String(raw || '').trim().toLowerCase();
}

async function verifyAdminRequest(req) {
  const headerEmail = normalizeEmail(req.headers?.['x-orbiex-admin-email']);
  const bodyEmail = normalizeEmail(req.body?.adminEmail);
  const queryEmail = normalizeEmail(req.query?.adminEmail);
  const adminEmail = headerEmail || bodyEmail || queryEmail;

  const headerSecret = String(req.headers?.['x-orbiex-admin-secret'] || '').trim();
  const bodySecret = String(req.body?.adminSecret || '').trim();
  const querySecret = String(req.query?.adminSecret || '').trim();
  const providedSecret = headerSecret || bodySecret || querySecret;

  if (adminEmail === ADMIN_EMAIL && providedSecret === ADMIN_SECRET) {
    return { ok: true, email: ADMIN_EMAIL };
  }

  const authHeader = String(req.headers?.authorization || '');
  const bearerToken = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7).trim() : '';
  if (bearerToken) {
    try {
      const { data } = await supabase.auth.getUser(bearerToken);
      if (normalizeEmail(data?.user?.email) === ADMIN_EMAIL) {
        return { ok: true, email: ADMIN_EMAIL };
      }
    } catch {
      /* ignore JWT error and fall through */
    }
  }

  return { ok: false, error: 'Acesso restrito ao administrador.' };
}

function normalizeExternalUrl(raw) {
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
      if (/^\/([A-Za-z0-9]{4,14})\.gifv$/i.test(cleanPath)) {
        const id = cleanPath.match(/^\/([A-Za-z0-9]{4,14})\.gifv$/i)[1];
        return `https://i.imgur.com/${id}.mp4`;
      }
      if (/^\/([A-Za-z0-9]{4,14})$/i.test(cleanPath)) {
        const id = cleanPath.slice(1);
        return `https://i.imgur.com/${id}.mp4`;
      }
      if (/^\/([A-Za-z0-9]{4,14})\.mp4$/i.test(cleanPath)) {
        return `https://i.imgur.com${cleanPath}`;
      }
    }

    if (host === 'imgur.com' || host === 'www.imgur.com' || host === 'm.imgur.com') {
      const parts = u.pathname.split('/').filter(Boolean);
      // Links diretos sem /a/ ou /gallery/ (ex: https://imgur.com/CNIIL6R ou /t/tag/CNIIL6R)
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

function isImgurAlbumOrPageUrl(raw) {
  try {
    const u = new URL(String(raw || '').trim());
    const host = u.hostname.toLowerCase();
    return host === 'imgur.com' || host === 'www.imgur.com' || host === 'm.imgur.com';
  } catch {
    return false;
  }
}

function extractImgurMp4FromHtml(html) {
  const unescaped = String(html || '').replace(/\\\//g, '/').replace(/&amp;/g, '&');
  const patterns = [
    /<meta[^>]+(?:property|name)=["'](?:og:video(?::url|:secure_url)?|twitter:player:stream)["'][^>]+content=["'](https:\/\/i\.imgur\.com\/[A-Za-z0-9]+\.mp4[^"']*)["']/i,
    /content=["'](https:\/\/i\.imgur\.com\/[A-Za-z0-9]+\.mp4[^"']*)["'][^>]+(?:property|name)=["'](?:og:video(?::url|:secure_url)?|twitter:player:stream)["']/i,
    /<source[^>]+src=["'](https:\/\/i\.imgur\.com\/[A-Za-z0-9]+\.mp4[^"']*)["']/i,
    /https:\/\/i\.imgur\.com\/([A-Za-z0-9]{5,14})\.mp4/i,
    /"hash"\s*:\s*"([A-Za-z0-9]{5,14})"[^}]{0,120}"ext"\s*:\s*"\.mp4"/i,
  ];
  for (const re of patterns) {
    const m = unescaped.match(re);
    if (!m) continue;
    const candidate = m[1].startsWith('http') ? m[1] : `https://i.imgur.com/${m[1]}.mp4`;
    return candidate.split('?')[0];
  }
  return '';
}

function extractAlbumOrPostId(rawUrl) {
  try {
    const u = new URL(rawUrl);
    const parts = u.pathname.split('/').filter(Boolean);
    if ((parts[0] === 'a' || parts[0] === 'gallery') && parts[1]) {
      const slug = parts[1];
      const dash = slug.split('-').pop() || slug;
      return /^[A-Za-z0-9]{5,12}$/.test(dash) ? dash : slug;
    }
    const last = parts[parts.length - 1] || '';
    const dash = last.split('-').pop() || last;
    return /^[A-Za-z0-9]{5,12}$/.test(dash) ? dash : '';
  } catch {
    return '';
  }
}

async function resolveVideoMediaUrl(raw, fetchImpl = fetch) {
  const original = String(raw || '').trim();
  const normalized = normalizeExternalUrl(original);
  if (!normalized) return { ok: false, mediaUrl: '', error: 'Cole a URL do vídeo hospedado.' };

  const isImgurOrigin = /(?:^|\/\/)(?:[a-z]+\.)?imgur\.com\//i.test(original);
  if (!isImgurOrigin) {
    return { ok: true, mediaUrl: normalized, resolved: normalized !== original };
  }

  // Se o link original era um post único (não /a/ nem /gallery/), tenta validar i.imgur.com/<id>.mp4 via HEAD
  if (!isImgurAlbumOrPageUrl(normalized) && /^https:\/\/i\.imgur\.com\/[A-Za-z0-9]+\.mp4$/i.test(normalized)) {
    try {
      const head = await fetchImpl(normalized, {
        method: 'HEAD',
        signal: AbortSignal.timeout ? AbortSignal.timeout(4000) : undefined,
      });
      const ct = String(head.headers?.get?.('content-type') || '').toLowerCase();
      if (head.ok && (ct.includes('video') || ct.includes('octet-stream') || !ct.includes('html'))) {
        return { ok: true, mediaUrl: normalized, resolved: normalized !== original };
      }
    } catch {
      /* se HEAD falhar e já for i.imgur.com/*.mp4, tenta resolver página original ou mantém */
      if (/^https:\/\/i\.imgur\.com\//i.test(original)) {
        return { ok: true, mediaUrl: normalized, resolved: normalized !== original };
      }
    }
  }

  // Resolve álbuns (/a/..., /gallery/...) ou links imgur.com/<id> cujo hash de mídia interno difere do ID da página
  const postId = extractAlbumOrPostId(original) || extractAlbumOrPostId(normalized);
  const fetchOpts = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36',
      Accept: 'text/html,application/json,*/*',
    },
    signal: AbortSignal.timeout ? AbortSignal.timeout(4500) : undefined,
  };

  const candidateUrls = [
    original.startsWith('http') ? original : `https://${original}`,
    ...(postId ? [`https://imgur.com/a/${postId}`, `https://imgur.com/${postId}`] : []),
  ];

  for (const pageUrl of Array.from(new Set(candidateUrls))) {
    try {
      const resp = await fetchImpl(pageUrl, fetchOpts);
      if (resp.ok) {
        const html = await resp.text();
        const found = extractImgurMp4FromHtml(html);
        if (found) {
          return { ok: true, mediaUrl: found, resolved: true };
        }
      }
    } catch {
      /* tenta próximo método */
    }
  }

  if (postId) {
    const apiUrls = [
      `https://api.imgur.com/post/v1/albums/${postId}?client_id=546c25a59c58ad7&include=media`,
      `https://api.imgur.com/post/v1/posts/${postId}?client_id=546c25a59c58ad7&include=media`,
    ];
    for (const apiUrl of apiUrls) {
      try {
        const resp = await fetchImpl(apiUrl, fetchOpts);
        if (!resp.ok) continue;
        const json = await resp.json().catch(() => null);
        const mediaList = Array.isArray(json?.media) ? json.media : [];
        const videoMedia =
          mediaList.find((m) => String(m?.type || '').toLowerCase() === 'video' || String(m?.mime_type || '').startsWith('video/')) ||
          mediaList[0];
        if (videoMedia?.url && /\.mp4/i.test(videoMedia.url)) {
          return { ok: true, mediaUrl: videoMedia.url.split('?')[0], resolved: true };
        }
        if (videoMedia?.id && (String(videoMedia?.mime_type || '').startsWith('video/') || videoMedia?.has_sound !== undefined)) {
          return { ok: true, mediaUrl: `https://i.imgur.com/${videoMedia.id}.mp4`, resolved: true };
        }
      } catch {
        /* tenta próximo endpoint */
      }
    }
  }

  if (!isImgurAlbumOrPageUrl(normalized)) {
    return { ok: true, mediaUrl: normalized, resolved: normalized !== original };
  }

  return {
    ok: false,
    mediaUrl: normalized,
    error:
      'Esse link do Imgur aponta para uma página/álbum e não para o arquivo .mp4 direto. No Imgur, clique com o botão direito no vídeo > "Copiar endereço do vídeo" (link i.imgur.com/...mp4).',
  };
}

async function getJsonSettingArray(rowKey) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('user_email', rowKey)
      .maybeSingle();
    if (error || !data?.avatar_url) return [];
    const parsed = JSON.parse(data.avatar_url);
    return Array.isArray(parsed?.ids) ? parsed.ids.map(String) : [];
  } catch {
    return [];
  }
}

async function setJsonSettingArray(rowKey, settingName, ids) {
  const uniqueIds = Array.from(new Set((ids || []).map(String).filter(Boolean)));
  const { error } = await supabase.from('profiles').upsert(
    {
      user_email: rowKey,
      name: settingName,
      avatar_url: JSON.stringify({ ids: uniqueIds, updatedAt: Date.now() }),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_email' }
  );
  if (error) return { ok: false, error: error.message };
  return { ok: true, ids: uniqueIds };
}

async function deleteOrTombstoneProfileRow(rowKey, id) {
  let deleted = false;
  try {
    const { error } = await supabase.from('profiles').delete().eq('user_email', rowKey);
    if (!error) deleted = true;
  } catch {
    deleted = false;
  }

  if (!deleted) {
    const { error: updErr } = await supabase.from('profiles').upsert(
      {
        user_email: rowKey,
        name: 'deleted',
        avatar_url: JSON.stringify({ id, deleted: true }),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_email' }
    );
    if (updErr) return { ok: false, error: updErr.message };
  }
  return { ok: true };
}

function isValidAdminPassword(raw) {
  return String(raw || '').trim() === ADMIN_SECRET;
}

module.exports = {
  supabase,
  ADMIN_EMAIL,
  isValidAdminPassword,
  setCorsHeaders,
  normalizeEmail,
  verifyAdminRequest,
  normalizeExternalUrl,
  isImgurAlbumOrPageUrl,
  extractImgurMp4FromHtml,
  resolveVideoMediaUrl,
  getJsonSettingArray,
  setJsonSettingArray,
  deleteOrTombstoneProfileRow,
};

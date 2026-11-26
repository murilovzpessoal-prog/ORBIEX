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
  const s = String(raw || '').trim();
  if (!s) return '';
  const withScheme = /^https?:\/\//i.test(s) ? s : `https://${s.replace(/^\/+/, '')}`;
  if (withScheme.includes('dropbox.com') && withScheme.includes('dl=0')) {
    return withScheme.replace('dl=0', 'raw=1');
  }
  return withScheme;
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

module.exports = {
  supabase,
  ADMIN_EMAIL,
  setCorsHeaders,
  normalizeEmail,
  verifyAdminRequest,
  normalizeExternalUrl,
  getJsonSettingArray,
  setJsonSettingArray,
  deleteOrTombstoneProfileRow,
};

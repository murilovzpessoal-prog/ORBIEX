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

module.exports = {
  supabase,
  ADMIN_EMAIL,
  setCorsHeaders,
  normalizeEmail,
  verifyAdminRequest,
};

/**
 * Orbiex Backend — Minha Jornada (Persistência 100% em Nuvem no Supabase)
 * GET  /api/journey?email=usuario@email.com -> retorna { success, activeTier, plansData, updatedAt }
 * POST /api/journey { email, activeTier, plansData } -> salva no Supabase e retorna confirmação
 */
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ywmhjdcuztfwhlatvlzp.supabase.co';
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_yOFFvnPP5ZH2-SwMHF_JLw_tM9VRGXS';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function journeyRowKey(email) {
  return `journey::${String(email || '').trim().toLowerCase()}`;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const email = String(req.query?.email || '').trim().toLowerCase();
      if (!email || !email.includes('@')) {
        return res.status(400).json({ success: false, error: 'E-mail inválido' });
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('name, avatar_url, updated_at')
        .eq('user_email', journeyRowKey(email))
        .maybeSingle();

      if (error) {
        return res.status(500).json({ success: false, error: error.message });
      }

      if (!data || !data.avatar_url) {
        return res.status(200).json({
          success: true,
          found: false,
          activeTier: 'month',
          plansData: {},
          updatedAt: null,
        });
      }

      let parsed = {};
      try {
        parsed = JSON.parse(data.avatar_url);
      } catch {
        parsed = {};
      }

      return res.status(200).json({
        success: true,
        found: true,
        activeTier: parsed.activeTier || data.name || 'month',
        plansData: parsed.plansData || {},
        updatedAt: parsed.updatedAt || data.updated_at || null,
      });
    }

    if (req.method === 'POST') {
      const { email: rawEmail, activeTier = 'month', plansData = {} } = req.body || {};
      const email = String(rawEmail || '').trim().toLowerCase();
      if (!email || !email.includes('@')) {
        return res.status(400).json({ success: false, error: 'E-mail inválido' });
      }

      const nowIso = new Date().toISOString();
      const payload = {
        activeTier: ['month', 'week', 'day'].includes(activeTier) ? activeTier : 'month',
        plansData: plansData && typeof plansData === 'object' ? plansData : {},
        updatedAt: nowIso,
      };

      const { error } = await supabase.from('profiles').upsert(
        {
          user_email: journeyRowKey(email),
          name: payload.activeTier,
          avatar_url: JSON.stringify(payload),
          updated_at: nowIso,
        },
        { onConflict: 'user_email' }
      );

      if (error) {
        return res.status(500).json({ success: false, error: error.message });
      }

      return res.status(200).json({
        success: true,
        updatedAt: nowIso,
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message || 'Erro interno' });
  }
};

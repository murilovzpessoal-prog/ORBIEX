import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ywmhjdcuztfwhlatvlzp.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_yOFFvnPP5ZH2-SwMHF_JLw_tM9VRGXS';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const emailRaw = (req.method === 'POST' ? req.body?.email : req.query?.email) || '';
  const email = String(emailRaw).trim().toLowerCase();

  if (!email) {
    return res.status(400).json({ authorized: false, error: 'E-mail nao informado.' });
  }

  try {
    const { data, error } = await supabase
      .from('authorized_buyers')
      .select('*')
      .ilike('email', email)
      .limit(1);

    if (error) {
      return res.status(500).json({ authorized: false, error: error.message });
    }

    if (!data || data.length === 0) {
      return res.status(200).json({
        authorized: false,
        message: 'E-mail nao localizado na base de compras aprovadas da Cakto.',
      });
    }

    const buyer = data[0];
    if (buyer.status !== 'approved') {
      return res.status(200).json({
        authorized: false,
        message: 'Acesso bloqueado: compra cancelada ou estornada.',
      });
    }

    return res.status(200).json({
      authorized: true,
      name: buyer.name || null,
      email: buyer.email,
    });
  } catch (err: any) {
    return res.status(500).json({ authorized: false, error: err.message || 'Erro interno' });
  }
}

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ywmhjdcuztfwhlatvlzp.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_yOFFvnPP5ZH2-SwMHF_JLw_tM9VRGXS';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Healthcheck
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'online',
      gateway: 'Cakto Webhook Integrator',
      timestamp: new Date().toISOString(),
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body || {};

    // Extrai os campos em diversos formatos suportados pela Cakto / Gateways
    const event = (body.event || body.type || body.status || '').toLowerCase();
    const customer = body.customer || body.buyer || body.client || body.data?.customer || body.data?.buyer || {};
    
    const email = (
      customer.email ||
      body.email ||
      body.customer_email ||
      body.data?.email ||
      body.data?.customer?.email ||
      ''
    ).trim().toLowerCase();

    const name = (
      customer.name ||
      customer.full_name ||
      body.name ||
      body.customer_name ||
      body.data?.name ||
      body.data?.customer?.name ||
      ''
    ).trim();

    const transactionId = (
      body.id ||
      body.transaction_id ||
      body.order_id ||
      body.data?.id ||
      body.data?.transaction_id ||
      null
    );

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'E-mail do comprador nao informado no webhook',
        receivedBody: body,
      });
    }

    // Detecta status da transacao
    const isRefund =
      event.includes('refund') ||
      event.includes('chargeback') ||
      event.includes('reembolso') ||
      event.includes('cancel') ||
      event.includes('estorn');

    const status = isRefund ? 'refunded' : 'approved';

    // Insere ou atualiza comprador autorizado no Supabase
    const { data, error } = await supabase
      .from('authorized_buyers')
      .upsert(
        {
          email,
          name: name || undefined,
          status,
          platform: 'cakto',
          transaction_id: transactionId ? String(transactionId) : undefined,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'email' }
      )
      .select();

    if (error) {
      console.error('Supabase error inserting buyer:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.status(200).json({
      success: true,
      message: `Comprador ${email} processado com status: ${status}`,
      buyer: data?.[0] || { email, status },
    });
  } catch (err: any) {
    console.error('Webhook error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
}

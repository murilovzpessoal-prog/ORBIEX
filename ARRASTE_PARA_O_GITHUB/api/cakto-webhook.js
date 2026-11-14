const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ywmhjdcuztfwhlatvlzp.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_yOFFvnPP5ZH2-SwMHF_JLw_tM9VRGXS';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

module.exports = async function handler(req, res) {
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

  // Healthcheck / Status
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

    const event = String(body.event || body.type || body.status || '').toLowerCase();
    const customer = body.customer || body.buyer || body.client || body.data?.customer || body.data?.buyer || {};

    const email = String(
      customer.email ||
      body.email ||
      body.customer_email ||
      body.data?.email ||
      body.data?.customer?.email ||
      ''
    ).trim().toLowerCase();

    const name = String(
      customer.name ||
      customer.full_name ||
      body.name ||
      body.customer_name ||
      body.data?.name ||
      body.data?.customer?.name ||
      ''
    ).trim();

    const transactionId = body.id || body.transaction_id || body.order_id || body.data?.id || body.data?.transaction_id || null;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'E-mail do comprador nao informado no webhook',
        receivedBody: body,
      });
    }

    // Somente reembolso/chargeback real revoga acesso; PIX expirado/cancelado nao pode bloquear quem ja tem compra aprovada
    const isHardRefund =
      event.includes('refund') ||
      event.includes('chargeback') ||
      event.includes('reembolso') ||
      event.includes('estorn');

    const isCanceledOrder = event.includes('cancel') || event.includes('expired') || event.includes('refused');

    // Verifica se o comprador ja possui compra aprovada antes de permitir downgrade por pedido duplicado cancelado
    let existingApproved = false;
    try {
      const { data: existingRows } = await supabase
        .from('authorized_buyers')
        .select('status')
        .ilike('email', email)
        .limit(1);
      if (existingRows && existingRows.length > 0 && existingRows[0].status === 'approved') {
        existingApproved = true;
      }
    } catch {}

    let status = 'approved';
    if (isHardRefund) {
      status = 'refunded';
    } else if (isCanceledOrder && !existingApproved) {
      status = 'canceled';
    }

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
      console.error('Supabase error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    // Cria automaticamente o usuario no Supabase Authentication (Authentication -> Users) e em profiles
    let authUserCreated = false;
    if (status === 'approved') {
      const displayName = name || email.split('@')[0];

      // 1. Cria automaticamente em Authentication -> Users (supabase.auth) com senha padrao inicial
      try {
        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
          email,
          password: process.env.DEFAULT_BUYER_PASSWORD || '123456',
          options: {
            data: {
              full_name: displayName,
              display_name: displayName,
              name: displayName,
              platform: 'cakto',
            },
          },
        });
        if (!signUpErr && signUpData?.user) {
          authUserCreated = true;
        }
      } catch (authErr) {
        console.warn('Supabase Auth auto-signup warning:', authErr);
      }

      // 2. Cria/atualiza automaticamente o perfil na tabela profiles
      try {
        await supabase.from('profiles').upsert(
          {
            user_email: email,
            name: displayName,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_email' }
        );
      } catch (profErr) {
        console.warn('Profile auto-create warning:', profErr);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Comprador ${email} processado automaticamente com status: ${status}`,
      authUserCreated,
      buyer: data?.[0] || { email, status },
    });
  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
};

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ywmhjdcuztfwhlatvlzp.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_yOFFvnPP5ZH2-SwMHF_JLw_tM9VRGXS';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function buildWelcomeEmailHtml(buyerName, buyerEmail) {
  const firstName = buyerName ? buyerName.split(' ')[0] : 'Membro';
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Seja bem-vindo(a) à OrbiEx AI</title>
</head>
<body style="margin:0;padding:0;background-color:#080501;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#080501;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background-color:#110c05;border:1px solid rgba(212,175,55,0.3);border-radius:20px;padding:36px 28px;box-shadow:0 20px 50px rgba(0,0,0,0.85);">
          <tr>
            <td align="center" style="padding-bottom:16px;">
              <span style="display:inline-block;padding:6px 14px;border-radius:999px;background-color:rgba(212,175,55,0.12);border:1px solid rgba(212,175,55,0.35);color:#f3e2a4;font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;">
                ACESSO LIBERADO • ORBIEX AI
              </span>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom:12px;">
              <h1 style="margin:0;font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">
                Seja bem-vindo(a) à <span style="color:#d4af37;">OrbiEx</span>, ${firstName}!
              </h1>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom:28px;">
              <p style="margin:0;font-size:15px;line-height:1.6;color:rgba(255,255,255,0.75);">
                Parabéns pela sua decisão! Sua inscrição foi confirmada e o seu acesso à plataforma oficial da <strong>OrbiEx AI</strong> já está liberado para o e-mail <strong>${buyerEmail}</strong>.
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom:30px;">
              <a href="https://www.orbiex.io/" target="_blank" style="display:inline-block;background:linear-gradient(90deg,#d4af37,#f3e2a4,#eab308);color:#000000;font-size:14px;font-weight:900;text-transform:uppercase;letter-spacing:1px;text-decoration:none;padding:16px 32px;border-radius:12px;">
                Acessar a OrbiEx Agora →
              </a>
              <p style="margin:10px 0 0 0;font-size:12px;color:rgba(255,255,255,0.5);">
                Link oficial: <a href="https://www.orbiex.io/" style="color:#d4af37;text-decoration:underline;">https://www.orbiex.io/</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#181107;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:24px;margin-bottom:20px;">
              <h2 style="margin:0 0 16px 0;font-size:16px;font-weight:800;color:#f3e2a4;text-transform:uppercase;letter-spacing:0.8px;">
                📋 Instruções de Como Acessar:
              </h2>
              <p style="margin:0 0 12px 0;font-size:14px;line-height:1.6;color:rgba(255,255,255,0.85);">
                <strong>1. Acesse o site oficial:</strong><br/>
                Entre em <a href="https://www.orbiex.io/" style="color:#d4af37;font-weight:bold;">www.orbiex.io</a> pelo seu celular ou computador.
              </p>
              <p style="margin:0 0 12px 0;font-size:14px;line-height:1.6;color:rgba(255,255,255,0.85);">
                <strong>2. Preencha seus dados:</strong><br/>
                Coloque o seu <strong>Nome</strong> e o seu <strong>E-mail da compra</strong> (${buyerEmail}).
              </p>
              <p style="margin:0;font-size:14px;line-height:1.6;color:rgba(255,255,255,0.85);">
                <strong>3. Digite a sua primeira senha:</strong><br/>
                No campo de senha, <strong>digite a primeira senha que você deseja criar</strong> para a sua conta e clique em <strong>"Entrar na Plataforma"</strong>.
              </p>
            </td>
          </tr>
          <tr><td style="height:16px;"></td></tr>
          <tr>
            <td style="background-color:rgba(212,175,55,0.1);border:1px solid rgba(212,175,55,0.4);border-radius:16px;padding:20px 24px;">
              <p style="margin:0 0 8px 0;font-size:13px;font-weight:800;color:#f3e2a4;text-transform:uppercase;letter-spacing:0.8px;">
                🔑 Senha Padrão de Acesso Imediato
              </p>
              <p style="margin:0 0 12px 0;font-size:13.5px;line-height:1.6;color:rgba(255,255,255,0.85);">
                Se por qualquer motivo você não conseguir entrar com a senha que tentar criar, você pode entrar imediatamente utilizando a <strong>senha padrão oficial</strong>:
              </p>
              <div style="background-color:#080501;border:1px dashed #d4af37;border-radius:10px;padding:12px;text-align:center;">
                <span style="font-family:monospace;font-size:20px;font-weight:900;letter-spacing:2px;color:#f3e2a4;">orbiex2026k</span>
              </div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:28px;">
              <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.4);line-height:1.5;">
                © 2026 OrbiEx AI — Ecossistema de Inteligência Artificial.<br/>
                Este é um e-mail automático enviado após a confirmação da sua compra.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

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

    // Cria automaticamente o usuario no Supabase Authentication (Authentication -> Users), authorized_buyers e profiles via RPC atomica
    let authUserCreated = false;
    if (status === 'approved') {
      const displayName = name || email.split('@')[0];

      // 1. Executa a RPC atomica que insere/atualiza direto em auth.users (ja confirmado com senha padrao orbiex2026k), authorized_buyers e profiles
      try {
        const { data: rpcData, error: rpcErr } = await supabase.rpc('orbiex_sync_user_account', {
          p_email: email,
          p_password: process.env.DEFAULT_BUYER_PASSWORD || 'orbiex2026k',
          p_name: displayName,
        });
        if (!rpcErr && rpcData?.ok) {
          authUserCreated = true;
        }
      } catch (rpcCatchErr) {
        console.warn('RPC sync warning:', rpcCatchErr);
      }

      // 2. Fallback caso a RPC nao tenha rodado: cria via signUp + profiles
      if (!authUserCreated) {
        try {
          const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
            email,
            password: process.env.DEFAULT_BUYER_PASSWORD || 'orbiex2026k',
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

      // 3. Dispara o e-mail automatico de Boas-Vindas com as instrucoes de acesso e a senha padrao orbiex2026k
      try {
        if (process.env.RESEND_API_KEY) {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: process.env.RESEND_FROM_EMAIL || 'OrbiEx AI <acesso@orbiex.io>',
              to: [email],
              subject: 'Seja bem-vindo(a) à OrbiEx AI — Seu acesso está liberado!',
              html: buildWelcomeEmailHtml(displayName, email),
            }),
          });
        } else {
          // Dispara o template "Seja bem-vindo(a) à OrbiEx AI" configurado no Supabase Auth
          await supabase.auth.signInWithOtp({
            email,
            options: {
              shouldCreateUser: false,
              emailRedirectTo: 'https://www.orbiex.io/',
            },
          });
        }
      } catch (mailErr) {
        console.warn('Welcome email dispatch warning:', mailErr);
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

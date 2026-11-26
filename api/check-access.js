const {
  supabase,
  ADMIN_EMAIL,
  isValidAdminPassword,
  setCorsHeaders,
  normalizeEmail,
} = require('./_supabase-admin.js');

const DEFAULT_BUYER_PASSWORD = process.env.DEFAULT_BUYER_PASSWORD || 'orbiex2026k';
const CLAIMED_PREFIX = 'orbiex_claimed::';
const MANUAL_USER_PREFIX = 'orbiex_manual_user::';

// Base legada de compradores iniciais (sempre sobrescrita se o banco marcar estorno/cancelamento)
const LEGACY_CAKTO_BUYERS = {
  'brunoaraujo1915@gmail.com': 'Bruno Fontes Araujo',
  'sol.liandra@gmail.com': 'Maria do Socorro Leandro da Rocha Cardoso',
  'valquiriaferres2014@gmail.com': 'Valquíria Inês Ferres',
  'nilceliasantos.souza04@gmail.com': 'Nilcelia dos Santos Souza',
  'mauriciocardoso0709@gmail.com': 'Maurício Cardoso da Silva',
  'diegorayn@gmail.com': 'Diego Ferreira da Silva',
  'jannesfc@hotmail.com': 'Janne da Silva Freitas Coelho',
};

async function markAccountClaimed(email) {
  try {
    await supabase.from('profiles').upsert(
      {
        user_email: `${CLAIMED_PREFIX}${email}`,
        name: 'claimed',
        avatar_url: JSON.stringify({ claimed: true, at: Date.now() }),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_email' }
    );
  } catch {
    /* ignore */
  }
}

async function resolveBuyerAuthorization(email) {
  if (email === ADMIN_EMAIL) {
    return {
      authorized: true,
      isAdmin: true,
      name: 'Administrador Orbiex',
      email,
      platform: 'admin',
      status: 'approved',
    };
  }

  const [{ data: rows, error: dbErr }, { data: manualRow }] = await Promise.all([
    supabase
      .from('authorized_buyers')
      .select('email, name, status, platform, transaction_id, updated_at')
      .ilike('email', email)
      .order('updated_at', { ascending: false })
      .limit(10),
    supabase
      .from('profiles')
      .select('name, avatar_url')
      .eq('user_email', `${MANUAL_USER_PREFIX}${email}`)
      .maybeSingle(),
  ]);

  if (dbErr) {
    return { error: dbErr.message, statusCode: 500 };
  }

  const list = Array.isArray(rows) ? rows : [];
  if (list.length > 0) {
    const latest = list[0];
    const hasBlockedLatest = latest.status !== 'approved';
    const hasRefundWithoutNewerTx =
      list.some((r) => r.status === 'refunded' || r.status === 'canceled' || r.status === 'revoked') &&
      !(latest.status === 'approved' && latest.transaction_id);

    if (hasBlockedLatest || hasRefundWithoutNewerTx) {
      return {
        authorized: false,
        blocked: true,
        status: latest.status,
        message: 'Acesso bloqueado: compra cancelada, estornada ou acesso revogado.',
      };
    }

    return {
      authorized: true,
      email: latest.email || email,
      name: latest.name || null,
      platform: latest.platform || 'cakto',
      status: 'approved',
    };
  }

  if (manualRow?.avatar_url) {
    try {
      const parsed = JSON.parse(manualRow.avatar_url);
      if (parsed?.status === 'revoked' || parsed?.status === 'refunded') {
        return {
          authorized: false,
          blocked: true,
          message: 'Acesso revogado pelo administrador.',
        };
      }
      if (parsed?.email) {
        return {
          authorized: true,
          email,
          name: parsed.name || manualRow.name || null,
          platform: 'admin_manual',
          status: 'approved',
        };
      }
    } catch {
      /* ignore */
    }
  }

  if (LEGACY_CAKTO_BUYERS[email]) {
    return {
      authorized: true,
      email,
      name: LEGACY_CAKTO_BUYERS[email],
      platform: 'cakto',
      status: 'approved',
    };
  }

  return {
    authorized: false,
    notFound: true,
    message:
      'Acesso exclusivo para compradores! O e-mail informado não foi encontrado na base de compras aprovadas da Cakto.',
  };
}

module.exports = async function handler(req, res) {
  setCorsHeaders(res, 'GET,OPTIONS,POST');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const body = req.body || {};
  const emailRaw = (req.method === 'POST' ? body.email : req.query?.email) || '';
  const email = normalizeEmail(emailRaw);
  const password = String(req.method === 'POST' ? body.password || '' : '').trim();
  const mode = String(body.mode || req.query?.mode || '').trim().toLowerCase();
  const displayNameInput = String(body.name || '').trim();

  if (!email) {
    return res.status(400).json({ authorized: false, error: 'E-mail não informado.' });
  }

  try {
    const authResult = await resolveBuyerAuthorization(email);
    if (authResult.error) {
      return res.status(authResult.statusCode || 500).json({ authorized: false, error: authResult.error });
    }

    if (!authResult.authorized) {
      return res.status(200).json(authResult);
    }

    if (mode !== 'login') {
      return res.status(200).json({
        authorized: true,
        isAdmin: Boolean(authResult.isAdmin),
        name: authResult.name || null,
        email: authResult.email || email,
        platform: authResult.platform || 'cakto',
      });
    }

    // Validação estrita de senha no modo login
    if (password.length < 3) {
      return res.status(200).json({
        authorized: false,
        wrongPassword: true,
        message: 'Informe uma senha válida (mínimo 3 caracteres).',
      });
    }

    if (email === ADMIN_EMAIL) {
      if (!isValidAdminPassword(password)) {
        return res.status(200).json({
          authorized: false,
          wrongPassword: true,
          message: 'Senha incorreta para a conta de administrador.',
        });
      }
      return res.status(200).json({
        authorized: true,
        isAdmin: true,
        name: authResult.name || 'Administrador Orbiex',
        email: ADMIN_EMAIL,
        platform: 'admin',
      });
    }

    const resolvedName =
      displayNameInput.length >= 2
        ? displayNameInput
        : authResult.name || email.split('@')[0].replace(/[._-]+/g, ' ').trim();

    // 1. Tenta autenticar com a senha digitada no Supabase Auth
    try {
      const { data: signData, error: signErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (!signErr && signData?.user) {
        if (password !== DEFAULT_BUYER_PASSWORD || authResult.platform === 'admin_manual') {
          await markAccountClaimed(email);
        }
        return res.status(200).json({
          authorized: true,
          email,
          name: authResult.name || signData.user.user_metadata?.full_name || resolvedName,
          platform: authResult.platform,
        });
      }
    } catch {
      /* continua verificação abaixo */
    }

    // 2. Verifica se essa conta já definiu senha própria ou foi criada pelo ADM com senha fixa
    const { data: claimedRow } = await supabase
      .from('profiles')
      .select('user_email')
      .eq('user_email', `${CLAIMED_PREFIX}${email}`)
      .maybeSingle();

    const isManualAccount = authResult.platform === 'admin_manual';
    const isAlreadyClaimed = Boolean(claimedRow) || isManualAccount;

    // Para compradores Cakto, a senha padrão oficial (orbiex2026k) funciona como contingência documentada
    const isCaktoContingencyPassword = !isManualAccount && password === DEFAULT_BUYER_PASSWORD;

    if (isAlreadyClaimed && !isCaktoContingencyPassword) {
      return res.status(200).json({
        authorized: false,
        wrongPassword: true,
        message: isManualAccount
          ? 'Senha incorreta para esta conta. Confira a senha liberada pelo administrador.'
          : 'Senha incorreta. Tente novamente ou use a senha padrão (orbiex2026k).',
      });
    }

    // Se ainda estava com a senha provisória do webhook (orbiex2026k), permite definir a senha pessoal no 1º acesso.
    // Se já existia com outra senha pessoal no Auth (sem claimedRow legado), checa antes se orbiex2026k ainda é a senha atual.
    if (!isAlreadyClaimed && !isCaktoContingencyPassword) {
      let unclaimedOrMissing = true;
      try {
        const { error: defaultCheckErr } = await supabase.auth.signInWithPassword({
          email,
          password: DEFAULT_BUYER_PASSWORD,
        });
        if (defaultCheckErr && /invalid/i.test(defaultCheckErr.message || '')) {
          // Pode ser conta antiga que definiu senha própria antes da flag orbiex_claimed existir.
          // Confirma se existe linha na tabela profiles indicando acesso anterior.
          const { data: existingProf } = await supabase
            .from('profiles')
            .select('user_email, updated_at')
            .eq('user_email', email)
            .maybeSingle();
          if (existingProf) {
            unclaimedOrMissing = false;
          }
        }
      } catch {
        unclaimedOrMissing = true;
      }

      if (!unclaimedOrMissing) {
        return res.status(200).json({
          authorized: false,
          wrongPassword: true,
          message: 'Senha incorreta para esta conta. Tente novamente ou use a senha padrão (orbiex2026k).',
        });
      }
    }

    // Comprador aprovado na Cakto no 1º acesso ou recuperando via senha padrão oficial:
    try {
      await supabase.rpc('orbiex_sync_user_account', {
        p_email: email,
        p_password: password,
        p_name: resolvedName,
      });
      if (password !== DEFAULT_BUYER_PASSWORD) {
        await markAccountClaimed(email);
      }
    } catch {
      /* segue autenticado se comprador está aprovado */
    }

    return res.status(200).json({
      authorized: true,
      email,
      name: resolvedName,
      platform: authResult.platform,
    });
  } catch (err) {
    return res.status(500).json({ authorized: false, error: err.message || 'Erro interno ao verificar acesso.' });
  }
};

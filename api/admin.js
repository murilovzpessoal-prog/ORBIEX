/**
 * Orbiex Backend — Painel ADM (Cadastro Manual e Listagem de Usuários)
 * GET  /api/admin?action=list_users -> lista usuários cadastrados (ADM + Cakto)
 * POST /api/admin                   -> cria cadastro de usuário (email, senha, nome opcional)
 */
const {
  supabase,
  setCorsHeaders,
  normalizeEmail,
  verifyAdminRequest,
} = require('./_supabase-admin.js');

const MANUAL_USER_PREFIX = 'orbiex_manual_user::';

function parseManualUserRow(row) {
  if (!row || !row.avatar_url) return null;
  try {
    const parsed = JSON.parse(row.avatar_url);
    if (!parsed || !parsed.email) return null;
    return {
      email: normalizeEmail(parsed.email),
      name: parsed.name || row.name || normalizeEmail(parsed.email).split('@')[0],
      status: parsed.status || 'approved',
      platform: parsed.platform || 'admin_manual',
      updated_at: parsed.createdAt ? new Date(parsed.createdAt).toISOString() : row.updated_at,
    };
  } catch {
    return null;
  }
}

module.exports = async function handler(req, res) {
  setCorsHeaders(res, 'GET,OPTIONS,POST,DELETE');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const auth = await verifyAdminRequest(req);
    if (!auth.ok) {
      return res.status(403).json({ success: false, error: auth.error });
    }

    if (req.method === 'DELETE' || req.body?.action === 'revoke_user') {
      const targetEmail = normalizeEmail(req.query?.email || req.body?.email);
      if (!targetEmail || !targetEmail.includes('@')) {
        return res.status(400).json({ success: false, error: 'Informe um e-mail válido.' });
      }
      const nowIso = new Date().toISOString();
      await supabase.from('authorized_buyers').delete().ilike('email', targetEmail);
      await supabase.from('profiles').delete().eq('user_email', `${MANUAL_USER_PREFIX}${targetEmail}`);
      await supabase.from('profiles').delete().eq('user_email', `orbiex_claimed::${targetEmail}`);
      // Garante caso DELETE seja restrito por RLS: rebaixa status para revoked
      const { data: leftover } = await supabase
        .from('authorized_buyers')
        .select('email')
        .ilike('email', targetEmail)
        .limit(1);
      if (leftover && leftover.length > 0) {
        await supabase
          .from('authorized_buyers')
          .update({ status: 'revoked', updated_at: nowIso })
          .ilike('email', targetEmail);
      }
      return res.status(200).json({ success: true, email: targetEmail });
    }

    if (req.method === 'GET') {
      const mergedMap = new Map();

      try {
        const { data: manualRows } = await supabase
          .from('profiles')
          .select('user_email, name, avatar_url, updated_at')
          .like('user_email', `${MANUAL_USER_PREFIX}%`)
          .order('updated_at', { ascending: false })
          .limit(120);

        for (const r of manualRows || []) {
          const item = parseManualUserRow(r);
          if (item && item.email) mergedMap.set(item.email, item);
        }
      } catch {
        /* fallback */
      }

      try {
        const { data: buyers } = await supabase
          .from('authorized_buyers')
          .select('email, name, status, platform, updated_at')
          .order('updated_at', { ascending: false })
          .limit(120);

        for (const b of buyers || []) {
          const email = normalizeEmail(b.email);
          if (!email) continue;
          const prev = mergedMap.get(email);
          mergedMap.set(email, {
            email,
            name: b.name || prev?.name || email.split('@')[0],
            status: b.status || prev?.status || 'approved',
            platform: b.platform || prev?.platform || 'cakto',
            updated_at: b.updated_at || prev?.updated_at || new Date().toISOString(),
          });
        }
      } catch {
        /* ignore */
      }

      const users = Array.from(mergedMap.values()).sort((a, b) => {
        const ta = new Date(a.updated_at || 0).getTime() || 0;
        const tb = new Date(b.updated_at || 0).getTime() || 0;
        return tb - ta;
      });

      return res.status(200).json({ success: true, users });
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      const cleanEmail = normalizeEmail(body.email);
      const cleanPassword = String(body.password || '').trim();
      const rawName = String(body.name || '').trim();

      if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
        return res.status(400).json({ success: false, error: 'Informe um e-mail válido.' });
      }
      if (cleanPassword.length < 3) {
        return res.status(400).json({ success: false, error: 'A senha precisa ter pelo menos 3 caracteres.' });
      }

      const displayName =
        rawName.length >= 2
          ? rawName
          : cleanEmail.split('@')[0].replace(/[._-]+/g, ' ').trim();
      const nowIso = new Date().toISOString();

      try {
        await supabase.from('authorized_buyers').upsert(
          {
            email: cleanEmail,
            name: displayName,
            status: 'approved',
            platform: 'admin_manual',
            updated_at: nowIso,
          },
          { onConflict: 'email' }
        );
      } catch (buyerErr) {
        console.warn('authorized_buyers upsert warning:', buyerErr);
      }

      try {
        await supabase.from('profiles').upsert(
          {
            user_email: `orbiex_claimed::${cleanEmail}`,
            name: 'claimed',
            avatar_url: JSON.stringify({ claimed: true, at: Date.now() }),
            updated_at: nowIso,
          },
          { onConflict: 'user_email' }
        );
      } catch {
        /* ignore */
      }

      let authSynced = false;
      try {
        const { data: rpcData, error: rpcErr } = await supabase.rpc('orbiex_sync_user_account', {
          p_email: cleanEmail,
          p_password: cleanPassword,
          p_name: displayName,
        });
        if (!rpcErr && (rpcData?.ok || !rpcData?.refunded)) {
          authSynced = true;
        }
      } catch (e) {
        console.warn('ADM RPC sync warning:', e);
      }

      if (!authSynced) {
        try {
          if (supabase.auth?.admin?.createUser) {
            const { error: admErr } = await supabase.auth.admin.createUser({
              email: cleanEmail,
              password: cleanPassword,
              email_confirm: true,
              user_metadata: { full_name: displayName, display_name: displayName, name: displayName },
            });
            if (!admErr) authSynced = true;
          }
          if (!authSynced) {
            const { data: signData, error: signErr } = await supabase.auth.signUp({
              email: cleanEmail,
              password: cleanPassword,
              options: {
                data: { full_name: displayName, display_name: displayName, name: displayName, platform: 'admin_manual' },
              },
            });
            if (!signErr && signData?.user) authSynced = true;
          }
        } catch (authErr) {
          console.warn('ADM fallback auth create warning:', authErr);
        }
      }

      try {
        await supabase.from('profiles').upsert(
          {
            user_email: cleanEmail,
            name: displayName,
            updated_at: nowIso,
          },
          { onConflict: 'user_email' }
        );
      } catch {
        /* ignore */
      }

      const registryRecord = {
        email: cleanEmail,
        name: displayName,
        status: 'approved',
        platform: 'admin_manual',
        createdAt: Date.now(),
      };

      const { error: regErr } = await supabase.from('profiles').upsert(
        {
          user_email: `${MANUAL_USER_PREFIX}${cleanEmail}`,
          name: displayName,
          avatar_url: JSON.stringify(registryRecord),
          updated_at: nowIso,
        },
        { onConflict: 'user_email' }
      );

      if (regErr) {
        return res.status(500).json({ success: false, error: regErr.message });
      }

      return res.status(200).json({
        success: true,
        authSynced,
        user: {
          email: cleanEmail,
          name: displayName,
          status: 'approved',
          platform: 'admin_manual',
          updated_at: nowIso,
        },
        message: `Cadastro de ${cleanEmail} criado com sucesso!`,
      });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (err) {
    console.error('Admin API error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Internal server error' });
  }
};

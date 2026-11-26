/**
 * Orbiex Backend — Catálogo Global de Produtos (visível para todos os usuários)
 * GET    /api/products                -> lista todos os produtos globais publicados pelo ADM
 * POST   /api/products                -> publica novo produto global (apenas ADM)
 * DELETE /api/products?id=prod_...    -> remove um produto global (apenas ADM)
 */
const { supabase, setCorsHeaders, verifyAdminRequest } = require('./_supabase-admin.js');

const PRODUCT_ROW_PREFIX = 'orbiex_product::';
const HIDDEN_BASE_ROW_KEY = 'orbiex_catalog::hidden_base_products_v1';

async function getHiddenBaseIds() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('user_email', HIDDEN_BASE_ROW_KEY)
      .maybeSingle();
    if (error || !data?.avatar_url) return [];
    const parsed = JSON.parse(data.avatar_url);
    return Array.isArray(parsed?.ids) ? parsed.ids.map(String) : [];
  } catch {
    return [];
  }
}

async function setHiddenBaseIds(ids) {
  const uniqueIds = Array.from(new Set((ids || []).map(String).filter(Boolean)));
  const { error } = await supabase.from('profiles').upsert(
    {
      user_email: HIDDEN_BASE_ROW_KEY,
      name: 'hidden_base_products',
      avatar_url: JSON.stringify({ ids: uniqueIds, updatedAt: Date.now() }),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_email' }
  );
  if (error) return { ok: false, error: error.message };
  return { ok: true, hiddenBaseIds: uniqueIds };
}

function formatPriceBRL(raw) {
  const str = String(raw || '').trim();
  if (!str) return 'R$ 49,90';
  if (/r\$/i.test(str)) return str;
  const cleaned = str.replace(/[^\d.,]/g, '');
  if (!cleaned) return str;
  const normalized = cleaned.includes(',') ? cleaned.replace(/\./g, '').replace(',', '.') : cleaned;
  const num = parseFloat(normalized);
  if (Number.isNaN(num)) return `R$ ${str}`;
  return `R$ ${num.toFixed(2).replace('.', ',')}`;
}

function computeCommission(priceStr, rateStr) {
  const clean = String(priceStr || '').replace(/[^\d,.-]/g, '').replace(',', '.');
  const price = parseFloat(clean);
  if (Number.isNaN(price) || price <= 0) {
    return { rate: '20%', amount: 'R$ 20,00' };
  }
  let rateNum = 0.2;
  if (rateStr) {
    const parsedRate = parseFloat(String(rateStr).replace(/[^\d.]/g, ''));
    if (!Number.isNaN(parsedRate) && parsedRate > 0) {
      rateNum = parsedRate > 1 ? parsedRate / 100 : parsedRate;
    }
  }
  const amountNum = price * rateNum;
  return {
    rate: `${Math.round(rateNum * 100)}%`,
    amount: `R$ ${amountNum.toFixed(2).replace('.', ',')}`,
  };
}

function normalizeUrl(raw) {
  const s = String(raw || '').trim();
  if (!s) return '#';
  if (/^https?:\/\//i.test(s)) return s;
  return `https://${s.replace(/^\/+/, '')}`;
}

function parseRow(row) {
  if (!row || !row.avatar_url) return null;
  try {
    const parsed = JSON.parse(row.avatar_url);
    if (!parsed || parsed.deleted) return null;
    if (!parsed.name || !parsed.image) return null;
    return {
      ...parsed,
      isCustom: false,
      isGlobalAdmin: true,
    };
  } catch {
    return null;
  }
}

async function removeGlobalProduct(id) {
  const cleanId = String(id || '').trim();
  if (!cleanId) return { ok: false, status: 400, error: 'ID do produto não informado.' };

  if (cleanId.startsWith('wp-')) {
    const current = await getHiddenBaseIds();
    const res = await setHiddenBaseIds([...current, cleanId]);
    if (!res.ok) return { ok: false, status: 500, error: res.error };
    return { ok: true, id: cleanId, hiddenBaseIds: res.hiddenBaseIds };
  }

  const rowKey = `${PRODUCT_ROW_PREFIX}${cleanId}`;
  let deleted = false;
  try {
    const { error: delErr } = await supabase.from('profiles').delete().eq('user_email', rowKey);
    if (!delErr) deleted = true;
  } catch {
    deleted = false;
  }

  // Fallback seguro caso a policy de DELETE restrinja anon/RLS: grava marcador deleted=true
  if (!deleted) {
    const { error: updErr } = await supabase.from('profiles').upsert(
      {
        user_email: rowKey,
        name: 'deleted',
        avatar_url: JSON.stringify({ id: cleanId, deleted: true }),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_email' }
    );
    if (updErr) {
      return { ok: false, status: 500, error: updErr.message };
    }
  }

  return { ok: true, id: cleanId };
}

module.exports = async function handler(req, res) {
  setCorsHeaders(res, 'GET,OPTIONS,POST,DELETE');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const [{ data, error }, hiddenBaseIds] = await Promise.all([
        supabase
          .from('profiles')
          .select('user_email, name, avatar_url, updated_at')
          .like('user_email', `${PRODUCT_ROW_PREFIX}%`)
          .order('updated_at', { ascending: false })
          .limit(200),
        getHiddenBaseIds(),
      ]);

      if (error) {
        return res.status(500).json({ success: false, error: error.message });
      }

      const products = (data || [])
        .map(parseRow)
        .filter(Boolean)
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

      return res.status(200).json({ success: true, products, hiddenBaseIds });
    }

    const auth = await verifyAdminRequest(req);
    if (!auth.ok) {
      return res.status(403).json({ success: false, error: auth.error });
    }

    if (req.method === 'DELETE' || req.body?.action === 'delete') {
      const result = await removeGlobalProduct(req.query?.id || req.body?.id);
      if (!result.ok) {
        return res.status(result.status || 500).json({ success: false, error: result.error });
      }
      return res.status(200).json({ success: true, id: result.id, hiddenBaseIds: result.hiddenBaseIds });
    }

    if (req.method === 'POST' && req.body?.action === 'restore_base') {
      const targetId = req.body?.id ? String(req.body.id).trim() : '';
      const current = await getHiddenBaseIds();
      const next = targetId ? current.filter((x) => x !== targetId) : [];
      const saved = await setHiddenBaseIds(next);
      if (!saved.ok) return res.status(500).json({ success: false, error: saved.error });
      return res.status(200).json({ success: true, hiddenBaseIds: saved.hiddenBaseIds });
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      const name = String(body.name || '').trim();
      const image = String(body.image || '').trim();
      const rawPrice = String(body.suggestedPrice || body.price || '').trim();
      const rawLink = String(body.link || body.url || '').trim();

      if (!name) return res.status(400).json({ success: false, error: 'Informe o nome do produto.' });
      if (!image) return res.status(400).json({ success: false, error: 'Adicione a imagem do produto.' });
      if (!rawPrice) return res.status(400).json({ success: false, error: 'Informe o valor do produto.' });
      if (!rawLink) return res.status(400).json({ success: false, error: 'Informe o link do produto.' });

      const now = Date.now();
      const id = String(body.id || `global-${now}`);
      const suggestedPrice = formatPriceBRL(rawPrice);
      const comm = computeCommission(suggestedPrice, body.commissionRate || '20%');
      const category = String(body.category || 'Fitness').trim() || 'Fitness';

      const product = {
        id,
        name: name.toUpperCase(),
        category,
        image,
        score: Number(body.score) || 97,
        sales: String(body.sales || 'Lançamento Oficial Orbiex'),
        suggestedPrice,
        costPrice: 'R$ 19,90',
        margin: '72%',
        commissionRate: comm.rate,
        commissionAmount: comm.amount,
        angle:
          String(body.angle || '').trim() ||
          `Mostre os detalhes de ${name} no corpo destacando acabamento e valor de ${suggestedPrice}.`,
        hook:
          String(body.hook || '').trim() ||
          `Esse achado viral acabou de entrar no catálogo: ${name} por ${suggestedPrice}.`,
        link: normalizeUrl(rawLink),
        isCustom: false,
        isGlobalAdmin: true,
        createdAt: now,
        deleted: false,
      };

      const { error } = await supabase.from('profiles').upsert(
        {
          user_email: `${PRODUCT_ROW_PREFIX}${id}`,
          name: category,
          avatar_url: JSON.stringify(product),
          updated_at: new Date(now).toISOString(),
        },
        { onConflict: 'user_email' }
      );

      if (error) {
        return res.status(500).json({ success: false, error: error.message });
      }

      return res.status(200).json({ success: true, product });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (err) {
    console.error('Products API error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Internal server error' });
  }
};

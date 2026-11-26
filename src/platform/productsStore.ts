import { useState, useEffect, useCallback } from 'react';
import type { PieceType } from './views/HeadlinesView';
import { supabase } from '../lib/supabaseClient';
import { buildAdminHeaders, isCurrentUserAdmin } from './adminConfig';

export type ProductCategory =
  | 'Fitness'
  | 'Moda Praia'
  | 'Croppeds'
  | 'Modeladores'
  | 'Vestidos'
  | 'Alfaiataria'
  | 'Plus Size'
  | 'Externo';

export interface WinningProduct {
  id: string;
  name: string;
  category: ProductCategory | string;
  image: string;
  score: number;
  sales: string;
  suggestedPrice: string;
  costPrice: string;
  margin: string;
  commissionRate?: string;
  commissionAmount?: string;
  angle: string;
  hook: string;
  link: string;
  isCustom?: boolean;
  isGlobalAdmin?: boolean;
  createdAt?: number;
}

export function computeAffiliateCommission(priceStr: string, rateStr?: string) {
  const clean = priceStr.replace(/[^\d,.-]/g, '').replace(',', '.');
  const price = parseFloat(clean);
  if (isNaN(price) || price <= 0) {
    return { rate: '20%', amount: 'R$ 20,00' };
  }
  let rateNum = 0.20;
  if (rateStr) {
    const parsedRate = parseFloat(rateStr.replace(/[^\d.]/g, ''));
    if (!isNaN(parsedRate) && parsedRate > 0) {
      rateNum = parsedRate > 1 ? parsedRate / 100 : parsedRate;
    }
  }
  const amountNum = price * rateNum;
  return {
    rate: `${Math.round(rateNum * 100)}%`,
    amount: `R$ ${amountNum.toFixed(2).replace('.', ',')}`,
  };
}

export const BASE_WINNING_PRODUCTS: WinningProduct[] = [
  {
    id: 'wp-1',
    name: 'CONJUNTO FEMININO FITNESS TOP E CALÇA LEGGING',
    category: 'Fitness',
    image: 'https://i.imgur.com/0FkLiB3.jpeg',
    score: 96,
    sales: '28.4k vendas/mês',
    suggestedPrice: 'R$ 119,90',
    costPrice: 'R$ 38,00',
    margin: '68%',
    angle: 'Efeito empina bumbum sem marcar e tecido zero transparência para treino pesado.',
    hook: 'Se você ainda treina com legging que fica transparente, você precisa ver esse conjunto.',
    link: 'https://vt.tiktok.com/ZS9ADHToDhTPh-qdCDt/',
  },
  {
    id: 'wp-2',
    name: 'SAÍDA DE PRAIA CONJUNTO CROCHÊ TRICO',
    category: 'Moda Praia',
    image: 'https://i.imgur.com/yPmBuKE.jpeg',
    score: 94,
    sales: '19.2k vendas/mês',
    suggestedPrice: 'R$ 97,90',
    costPrice: 'R$ 31,50',
    margin: '67%',
    angle: 'Look praiano sofisticado estilo influenciadora com caimento perfeito.',
    hook: 'A peça que todas as gringas estão usando na praia acabou de chegar no Brasil.',
    link: 'https://vt.tiktok.com/ZS9AD9M82xD3W-Uwpnp/',
  },
  {
    id: 'wp-3',
    name: 'TOP CROPPED FEMININO FRENTE ÚNICA',
    category: 'Croppeds',
    image: 'https://i.imgur.com/9QappSG.jpeg',
    score: 92,
    sales: '31.5k vendas/mês',
    suggestedPrice: 'R$ 59,90',
    costPrice: 'R$ 16,80',
    margin: '72%',
    angle: 'Básico essencial com sustentação que valoriza o colo e combina com tudo.',
    hook: 'O cropped de 50 reais que parece de grife de shopping de 400.',
    link: 'https://vt.tiktok.com/ZS9AD9AHj3yTf-Devo0/',
  },
  {
    id: 'wp-4',
    name: 'BLUSA CROPPED ALÇA FINA',
    category: 'Croppeds',
    image: 'https://i.imgur.com/CunT32T.jpeg',
    score: 90,
    sales: '22.8k vendas/mês',
    suggestedPrice: 'R$ 49,90',
    costPrice: 'R$ 13,50',
    margin: '73%',
    angle: 'Toque macio, tecido premium que não desbota e ajuste perfeito no corpo.',
    hook: 'Por que pagar caro em blusa de shopping se essa veste mil vezes melhor?',
    link: 'https://vt.tiktok.com/ZS9AD9H8sbg7v-pAF4k/',
  },
  {
    id: 'wp-5',
    name: 'MACAQUINHO FITNESS ALCINHA BLACKOUT',
    category: 'Fitness',
    image: 'https://i.imgur.com/K1umUq5.jpeg',
    score: 95,
    sales: '26.1k vendas/mês',
    suggestedPrice: 'R$ 89,90',
    costPrice: 'R$ 27,00',
    margin: '70%',
    angle: 'Compressão blackout anatômica que modela sem apertar nem marcar.',
    hook: 'O macaquinho viral que modela o corpo inteiro e não enrola na coxa.',
    link: 'https://vt.tiktok.com/ZS9AD9tMUdFeY-NaUKz/',
  },
  {
    id: 'wp-6',
    name: 'SHORTS MODELADOR YOGA EMPINA BUMBUM',
    category: 'Modeladores',
    image: 'https://i.imgur.com/VTTffov.jpeg',
    score: 98,
    sales: '44.3k vendas/mês',
    suggestedPrice: 'R$ 69,90',
    costPrice: 'R$ 18,50',
    margin: '74%',
    angle: 'Costura anatômica com franzido em V que empina o bumbum instantaneamente.',
    hook: 'O shorts que virou febre na gringa porque deixa qualquer bumbum desenhado.',
    link: 'https://vt.tiktok.com/ZS9ADxeYx4efk-mPO2U/',
  },
  {
    id: 'wp-7',
    name: 'VESTIDO MIDI FEMININO DE ALÇA EM RIBANA',
    category: 'Vestidos',
    image: 'https://i.imgur.com/2cQbml3.jpeg',
    score: 91,
    sales: '17.4k vendas/mês',
    suggestedPrice: 'R$ 79,90',
    costPrice: 'R$ 24,00',
    margin: '70%',
    angle: 'Vestido midi minimalista e elegante em malha canelada encorpada.',
    hook: 'Achei o vestido midi perfeito que veste do P ao GG sem marcar a barriga.',
    link: 'https://vt.tiktok.com/ZS9ADx6VuEG51-b6uYw/',
  },
  {
    id: 'wp-8',
    name: 'TOP CROPPED SLIM FIT DECOTE COM AMARRAÇÃO',
    category: 'Croppeds',
    image: 'https://i.imgur.com/aFmN5VH.jpeg',
    score: 89,
    sales: '14.8k vendas/mês',
    suggestedPrice: 'R$ 54,90',
    costPrice: 'R$ 15,00',
    margin: '73%',
    angle: 'Amarração frontal regulável com decote marcante e acabamento impecável.',
    hook: 'Meninas, esse cropped com amarração é o mais elogiado que eu já comprei.',
    link: 'https://vt.tiktok.com/ZS9ADxfYNYUm2-Lmfz1/',
  },
  {
    id: 'wp-9',
    name: 'BODY MAIÔ FEMININO BICOLOR ALCINHA',
    category: 'Moda Praia',
    image: 'https://i.imgur.com/DXiE0Et.jpeg',
    score: 93,
    sales: '18.9k vendas/mês',
    suggestedPrice: 'R$ 84,90',
    costPrice: 'R$ 23,50',
    margin: '72%',
    angle: 'Design bicolor minimalista estilo Pinterest que transita da praia para a cidade.',
    hook: 'Esse body bicolor é tão perfeito que dá para usar na praia e no rolê à noite.',
    link: 'https://vt.tiktok.com/ZS9ADxT5oFN48-U8O0T/',
  },
  {
    id: 'wp-10',
    name: 'VESTIDO SUPLEX PREMIUM LONGO',
    category: 'Vestidos',
    image: 'https://i.imgur.com/V4UKuHz.jpeg',
    score: 95,
    sales: '23.7k vendas/mês',
    suggestedPrice: 'R$ 119,90',
    costPrice: 'R$ 36,00',
    margin: '70%',
    angle: 'Caimento fluido de alta elasticidade com forro duplo e sem marcar.',
    hook: 'Parece vestido de boutique cara de shopping, mas custou menos de 100 reais.',
    link: 'https://vt.tiktok.com/ZS9ADQ6NVp4AF-zmFWw/',
  },
  {
    id: 'wp-11',
    name: 'SHORT FEMININO DUNA CINTURA ALTA',
    category: 'Alfaiataria',
    image: 'https://i.imgur.com/OJeBnvj.jpeg',
    score: 92,
    sales: '33.1k vendas/mês',
    suggestedPrice: 'R$ 59,90',
    costPrice: 'R$ 17,00',
    margin: '72%',
    angle: 'Tecido duna que não amarrota e não precisa passar, com corte soltinho.',
    hook: 'O shortinho em tecido duna mais confortável da vida que não amassa nada.',
    link: 'https://vt.tiktok.com/ZS9ADQDvfjCbM-2ooIc/',
  },
  {
    id: 'wp-12',
    name: 'MACAQUINHO FEMININO FITNESS ZERO TRANSPARÊNCIA',
    category: 'Fitness',
    image: 'https://i.imgur.com/eTa5NFn.jpeg',
    score: 94,
    sales: '20.6k vendas/mês',
    suggestedPrice: 'R$ 94,90',
    costPrice: 'R$ 28,00',
    margin: '71%',
    angle: 'Gramatura reforçada à prova de agachamento com costura reforçada.',
    hook: 'Fiz o teste do agachamento com luz forte e comprovou: zero transparência.',
    link: 'https://vt.tiktok.com/ZS9AUSaHNefBT-o5xBk/',
  },
  {
    id: 'wp-13',
    name: 'CALÇA FLARE ALFAIATARIA SOCIAL CINTURA ALTA',
    category: 'Alfaiataria',
    image: 'https://i.imgur.com/icKWKbv.jpeg',
    score: 95,
    sales: '27.4k vendas/mês',
    suggestedPrice: 'R$ 109,90',
    costPrice: 'R$ 32,00',
    margin: '71%',
    angle: 'Alfaiataria moderna para trabalho ou ocasiões sociais com acabamento de luxo.',
    hook: 'Como parecer rica e elegante em qualquer reunião gastando pouco.',
    link: 'https://vt.tiktok.com/ZS9AUANtheAFg-ORUE4/',
  },
  {
    id: 'wp-14',
    name: 'KIT CALÇA BICOLOR FEMININA FORRADA COM LISTAS',
    category: 'Alfaiataria',
    image: 'https://i.imgur.com/VQLdkyT.jpeg',
    score: 91,
    sales: '15.6k vendas/mês',
    suggestedPrice: 'R$ 99,90',
    costPrice: 'R$ 29,00',
    margin: '71%',
    angle: 'Faixas verticais contrastantes que afinam o quadril e alongam o corpo.',
    hook: 'A calça com listra lateral que afina o quadril e virou tendência absoluta.',
    link: 'https://vt.tiktok.com/ZS9SQ6bJTfKjN-aZz8R/',
  },
  {
    id: 'wp-15',
    name: 'CROPPED FITNESS MANGA CURTA SUPLEX ZÍPER',
    category: 'Fitness',
    image: 'https://i.imgur.com/yC7xIQq.jpeg',
    score: 90,
    sales: '16.2k vendas/mês',
    suggestedPrice: 'R$ 59,90',
    costPrice: 'R$ 16,50',
    margin: '72%',
    angle: 'Zíper frontal tratorado funcional com gola alta esportiva de alta compressão.',
    hook: 'O cropped fitness com zíper mais estiloso que você vai ver no TikTok hoje.',
    link: 'https://vt.tiktok.com/ZS9SQ6waHUdWW-vL3Ma/',
  },
  {
    id: 'wp-16',
    name: 'CORSELET SUPLEX COM TOQUE DE POLIAMIDA',
    category: 'Modeladores',
    image: 'https://i.imgur.com/CEQRiPT.jpeg',
    score: 94,
    sales: '25.3k vendas/mês',
    suggestedPrice: 'R$ 69,90',
    costPrice: 'R$ 19,00',
    margin: '73%',
    angle: 'Efeito espartilho com barbatanas flexíveis que desenham a cintura de pilão.',
    hook: 'Cintura de Barbie em 5 segundos: o corselet que esgota toda semana.',
    link: 'https://vt.tiktok.com/ZS9SQMNkK8SkU-Hk4M5/',
  },
  {
    id: 'wp-17',
    name: 'VESTIDO MIDI TOMARA QUE CAIA FEMININO CANELADO',
    category: 'Vestidos',
    image: 'https://i.imgur.com/hMA8ouq.jpeg',
    score: 92,
    sales: '18.1k vendas/mês',
    suggestedPrice: 'R$ 84,90',
    costPrice: 'R$ 24,00',
    margin: '72%',
    angle: 'Silhueta tubinho elegante com elástico reforçado no busto que não escorrega.',
    hook: 'Um tomara que caia que NÃO cai e abraça o corpo perfeitamente.',
    link: 'https://vt.tiktok.com/ZS9SQMAJ3Q5F8-cEYjc/',
  },
  {
    id: 'wp-18',
    name: 'VESTIDO FEMININO TUBINHO BÁSICO SUPLEX PREMIUM',
    category: 'Vestidos',
    image: 'https://i.imgur.com/rSfPva6.jpeg',
    score: 91,
    sales: '21.0k vendas/mês',
    suggestedPrice: 'R$ 69,90',
    costPrice: 'R$ 19,50',
    margin: '72%',
    angle: 'Peça curinga versátil para qualquer sobreposição ou look noturno.',
    hook: 'Se eu pudesse escolher só um vestido para usar pro resto do ano, seria esse.',
    link: 'https://vt.tiktok.com/ZS9SQMm6x2a36-NdyVc/',
  },
  {
    id: 'wp-19',
    name: 'CALÇA ALFAIATARIA FEMININA BÁSICA',
    category: 'Alfaiataria',
    image: 'https://i.imgur.com/Z57M2dq.jpeg',
    score: 93,
    sales: '29.5k vendas/mês',
    suggestedPrice: 'R$ 99,90',
    costPrice: 'R$ 28,00',
    margin: '72%',
    angle: 'Corte reto impecável com pregas frontais e bolso faca funcional.',
    hook: 'A alfaiataria baratinha que parece ter sido feita sob medida no alfaiate.',
    link: 'https://vt.tiktok.com/ZS9SQMqXy2Wu5-qO2uU/',
  },
  {
    id: 'wp-20',
    name: 'SHORT SAIA FEMININO COM DETALHE DOURADO NA FIVELA',
    category: 'Alfaiataria',
    image: 'https://i.imgur.com/XoTyLMa.jpeg',
    score: 94,
    sales: '24.7k vendas/mês',
    suggestedPrice: 'R$ 74,90',
    costPrice: 'R$ 21,50',
    margin: '71%',
    angle: 'Conforto do short por baixo com elegância da saia e fivela dourada premium.',
    hook: 'A perfeição em forma de short saia com detalhe dourado luxuoso.',
    link: 'https://vt.tiktok.com/ZS9SQMwAdxXN2-zEwvL/',
  },
  {
    id: 'wp-21',
    name: 'KIT 3 SHORT FITNESS FEMININO CANELADO',
    category: 'Fitness',
    image: 'https://i.imgur.com/uVUNQrI.jpeg',
    score: 97,
    sales: '52.1k vendas/mês',
    suggestedPrice: 'R$ 89,90',
    costPrice: 'R$ 22,00',
    margin: '76%',
    angle: 'Kit econômico campeão de vendas com alta rotatividade e compressão média.',
    hook: '3 shorts pelo preço de 1 que deixam o bumbum empinado e não ficam transparentes.',
    link: 'https://vt.tiktok.com/ZS9SQM41T624A-nQc1R/',
  },
  {
    id: 'wp-22',
    name: 'SHORTINHO SAIA COURO COURINO FEMININO CURTO',
    category: 'Plus Size',
    image: 'https://i.imgur.com/UU3inyg.jpeg',
    score: 93,
    sales: '19.2k vendas/mês',
    suggestedPrice: 'R$ 84,90',
    costPrice: 'R$ 25,00',
    margin: '71%',
    angle: 'Courino macio com elasticidade que não racha e não aperta na virilha.',
    hook: 'Short saia em courino que não aperta nada e deixa qualquer look poderoso.',
    link: 'https://vt.tiktok.com/ZS9SQkHPC87Sx-yyyQ6/',
  },
  {
    id: 'wp-23',
    name: 'VESTIDO ALÇA LONGO FENDA LATERAL CANELADO',
    category: 'Plus Size',
    image: 'https://i.imgur.com/jK20L85.jpeg',
    score: 96,
    sales: '27.9k vendas/mês',
    suggestedPrice: 'R$ 119,90',
    costPrice: 'R$ 35,00',
    margin: '71%',
    angle: 'Fenda lateral sensual e confortável com malha canelada pesada que disfarça marcas.',
    hook: 'O vestido longo canelado com fenda lateral que valoriza todas as curvas.',
    link: 'https://vt.tiktok.com/ZS9SQkWm5kbEp-rcjFa/',
  },
  {
    id: 'wp-24',
    name: 'CONJUNTO SHORT SAIA E TOP DO SLIM AO PLUS SIZE',
    category: 'Plus Size',
    image: 'https://i.imgur.com/kNHD8as.jpeg',
    score: 94,
    sales: '20.1k vendas/mês',
    suggestedPrice: 'R$ 119,90',
    costPrice: 'R$ 36,00',
    margin: '70%',
    angle: 'Grade ampla do 36 ao 54 com caimento estruturado e top com forro sustentador.',
    hook: 'Finalmente um conjunto que veste perfeitamente do slim ao plus size sem distorcer.',
    link: 'https://vt.tiktok.com/ZS9SQBdY9m54L-RUpdu/',
  },
  {
    id: 'wp-25',
    name: 'BLUSA CROPPED BATA BABADO PLUS SIZE',
    category: 'Plus Size',
    image: 'https://i.imgur.com/105FPvT.jpeg',
    score: 91,
    sales: '15.3k vendas/mês',
    suggestedPrice: 'R$ 64,90',
    costPrice: 'R$ 18,50',
    margin: '72%',
    angle: 'Modelagem bata com babados delicados que disfarça o braço e dá leveza.',
    hook: 'A bata cropped mais charmosa e fresquinha para usar com cintura alta.',
    link: 'https://vt.tiktok.com/ZS9SQByCRpdTf-VAf8D/',
  },
];

const STORAGE_KEY = 'orbiex_custom_products';
const FALLBACK_STORAGE_KEY = 'orbix_custom_products';
const GLOBAL_CACHE_KEY = 'orbiex_global_products_cache_v1';
const GLOBAL_HIDDEN_CACHE_KEY = 'orbiex_global_hidden_base_v1';
const EVENT_KEY = 'orbiex_products_updated';
const PRODUCT_ROW_PREFIX = 'orbiex_product::';
const HIDDEN_BASE_ROW_KEY = 'orbiex_catalog::hidden_base_products_v1';

let memoryGlobalProducts: WinningProduct[] | null = null;
let memoryHiddenBaseIds: string[] | null = null;
let inflightGlobalFetch: Promise<WinningProduct[]> | null = null;
let lastGlobalFetchAt = 0;

export function normalizeProductLink(raw?: string): string {
  const s = String(raw || '').trim();
  if (!s) return '#';
  if (/^https?:\/\//i.test(s) || s === '#') return s;
  return `https://${s.replace(/^\/+/, '')}`;
}

export function formatBRLPrice(raw?: string): string {
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

function getGlobalCache(): WinningProduct[] {
  if (memoryGlobalProducts) return memoryGlobalProducts;
  try {
    const raw = localStorage.getItem(GLOBAL_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      memoryGlobalProducts = parsed;
      return parsed;
    }
  } catch {
    /* ignore */
  }
  return [];
}

function saveGlobalCache(list: WinningProduct[]): void {
  const clean = list.filter((p) => p && p.name && p.image);
  memoryGlobalProducts = clean;
  try {
    localStorage.setItem(GLOBAL_CACHE_KEY, JSON.stringify(clean));
  } catch {
    /* ignore quota errors if cache gets huge */
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(EVENT_KEY));
  }
}

export function getCustomProducts(): WinningProduct[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(FALLBACK_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getHiddenBaseCache(): string[] {
  if (memoryHiddenBaseIds) return memoryHiddenBaseIds;
  try {
    const raw = localStorage.getItem(GLOBAL_HIDDEN_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      memoryHiddenBaseIds = parsed.map(String);
      return memoryHiddenBaseIds;
    }
  } catch {
    /* ignore */
  }
  return [];
}

function saveHiddenBaseCache(ids: string[], emitEvent = true): void {
  const clean = Array.from(new Set(ids.map(String).filter(Boolean)));
  memoryHiddenBaseIds = clean;
  try {
    localStorage.setItem(GLOBAL_HIDDEN_CACHE_KEY, JSON.stringify(clean));
  } catch {
    /* ignore */
  }
  if (emitEvent && typeof window !== 'undefined') {
    window.dispatchEvent(new Event(EVENT_KEY));
  }
}

export function getHiddenBaseProductIds(): string[] {
  return getHiddenBaseCache();
}

export function getAllProducts(): WinningProduct[] {
  const globalItems = getGlobalCache();
  const hiddenSet = new Set(getHiddenBaseCache());
  const custom = getCustomProducts();
  const visibleBase = BASE_WINNING_PRODUCTS.filter((p) => !hiddenSet.has(p.id));
  const merged = [...globalItems, ...custom, ...visibleBase];
  const seen = new Set<string>();
  return merged.filter((item) => {
    if (!item?.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function parseSupabaseProductRows(rows: Array<{ avatar_url?: string | null }>): WinningProduct[] {
  const items: WinningProduct[] = [];
  for (const r of rows || []) {
    if (!r?.avatar_url) continue;
    try {
      const p = JSON.parse(r.avatar_url);
      if (!p || p.deleted || !p.name || !p.image) continue;
      items.push({ ...p, isCustom: false, isGlobalAdmin: true });
    } catch {
      /* ignore malformed row */
    }
  }
  return items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export async function fetchGlobalProducts(force = false): Promise<WinningProduct[]> {
  const now = Date.now();
  if (!force && inflightGlobalFetch) return inflightGlobalFetch;
  if (!force && now - lastGlobalFetchAt < 8000 && memoryGlobalProducts) {
    return memoryGlobalProducts;
  }

  inflightGlobalFetch = (async () => {
    try {
      const res = await fetch('/api/products?t=' + Date.now(), { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json?.success && Array.isArray(json.products)) {
          lastGlobalFetchAt = Date.now();
          if (Array.isArray(json.hiddenBaseIds)) {
            saveHiddenBaseCache(json.hiddenBaseIds, false);
          }
          saveGlobalCache(json.products);
          return json.products;
        }
      }
    } catch {
      /* fallback direto no Supabase caso ambiente local Vite não sirva /api */
    }

    try {
      const [{ data, error }, { data: hiddenRow }] = await Promise.all([
        supabase
          .from('profiles')
          .select('user_email, name, avatar_url, updated_at')
          .like('user_email', `${PRODUCT_ROW_PREFIX}%`)
          .order('updated_at', { ascending: false })
          .limit(200),
        supabase
          .from('profiles')
          .select('avatar_url')
          .eq('user_email', HIDDEN_BASE_ROW_KEY)
          .maybeSingle(),
      ]);

      if (hiddenRow?.avatar_url) {
        try {
          const parsedHidden = JSON.parse(hiddenRow.avatar_url);
          if (Array.isArray(parsedHidden?.ids)) {
            saveHiddenBaseCache(parsedHidden.ids, false);
          }
        } catch {
          /* ignore */
        }
      } else if (!error) {
        saveHiddenBaseCache([], false);
      }

      if (!error && Array.isArray(data)) {
        const parsed = parseSupabaseProductRows(data);
        lastGlobalFetchAt = Date.now();
        saveGlobalCache(parsed);
        return parsed;
      }
    } catch {
      /* ignore */
    }
    return getGlobalCache();
  })().finally(() => {
    inflightGlobalFetch = null;
  });

  return inflightGlobalFetch;
}

export async function publishGlobalProduct(input: {
  name: string;
  image: string;
  price: string;
  link: string;
  category?: string;
  commissionRate?: string;
  angle?: string;
  hook?: string;
}): Promise<{ ok: boolean; product?: WinningProduct; error?: string }> {
  if (!isCurrentUserAdmin()) {
    return { ok: false, error: 'Apenas a conta ADM pode publicar produtos globais.' };
  }

  const cleanName = input.name.trim();
  const cleanImage = input.image.trim();
  const cleanPrice = formatBRLPrice(input.price);
  const cleanLink = normalizeProductLink(input.link);

  if (!cleanName || !cleanImage || !input.price.trim() || !input.link.trim()) {
    return { ok: false, error: 'Preencha imagem, nome, valor e link do produto.' };
  }

  const now = Date.now();
  const comm = computeAffiliateCommission(cleanPrice, input.commissionRate || '20%');
  const category = input.category?.trim() || 'Fitness';
  const payloadProduct: WinningProduct = {
    id: `global-${now}`,
    name: cleanName.toUpperCase(),
    category,
    image: cleanImage,
    score: 97,
    sales: 'Lançamento Oficial Orbiex',
    suggestedPrice: cleanPrice,
    costPrice: 'R$ 19,90',
    margin: '72%',
    commissionRate: comm.rate,
    commissionAmount: comm.amount,
    angle:
      input.angle?.trim() ||
      `Mostre os detalhes de ${cleanName} no corpo destacando acabamento e valor de ${cleanPrice}.`,
    hook:
      input.hook?.trim() ||
      `Esse achado viral acabou de entrar no catálogo: ${cleanName} por ${cleanPrice}.`,
    link: cleanLink,
    isCustom: false,
    isGlobalAdmin: true,
    createdAt: now,
  };

  try {
    const headers = await buildAdminHeaders();
    const res = await fetch('/api/products', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...payloadProduct,
        adminEmail: headers['x-orbiex-admin-email'],
        adminSecret: headers['x-orbiex-admin-secret'],
      }),
    });
    const json = await res.json().catch(() => null);
    if (res.ok && json?.success && json.product) {
      saveGlobalCache([json.product, ...getGlobalCache().filter((p) => p.id !== json.product.id)]);
      return { ok: true, product: json.product };
    }
    if (res.status === 403 && json?.error) {
      return { ok: false, error: json.error };
    }
  } catch {
    /* fallback direto para Supabase */
  }

  try {
    const { error } = await supabase.from('profiles').upsert(
      {
        user_email: `${PRODUCT_ROW_PREFIX}${payloadProduct.id}`,
        name: category,
        avatar_url: JSON.stringify({ ...payloadProduct, deleted: false }),
        updated_at: new Date(now).toISOString(),
      },
      { onConflict: 'user_email' }
    );
    if (error) {
      return { ok: false, error: error.message };
    }
    saveGlobalCache([payloadProduct, ...getGlobalCache().filter((p) => p.id !== payloadProduct.id)]);
    return { ok: true, product: payloadProduct };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Erro ao publicar produto.' };
  }
}

export async function removeGlobalProduct(id: string): Promise<{ ok: boolean; error?: string }> {
  if (!isCurrentUserAdmin()) {
    return { ok: false, error: 'Apenas a conta ADM pode remover produtos globais.' };
  }
  const cleanId = String(id || '').trim();
  if (!cleanId) return { ok: false, error: 'ID inválido.' };

  const isBaseProduct = cleanId.startsWith('wp-');
  const prevGlobal = getGlobalCache();
  const prevHidden = getHiddenBaseCache();

  // Atualiza UI instantaneamente para o ADM e notifica o catálogo
  if (isBaseProduct) {
    saveHiddenBaseCache([...prevHidden, cleanId]);
  } else {
    saveGlobalCache(prevGlobal.filter((p) => p.id !== cleanId));
  }

  try {
    const headers = await buildAdminHeaders();
    const res = await fetch(`/api/products?id=${encodeURIComponent(cleanId)}`, {
      method: 'DELETE',
      headers,
    });
    const json = await res.json().catch(() => null);
    if (res.ok && json?.success) {
      if (Array.isArray(json.hiddenBaseIds)) {
        saveHiddenBaseCache(json.hiddenBaseIds);
      }
      return { ok: true };
    }
  } catch {
    /* fallback direto Supabase */
  }

  try {
    if (isBaseProduct) {
      const { data: latestRow } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('user_email', HIDDEN_BASE_ROW_KEY)
        .maybeSingle();
      let existingIds: string[] = [...prevHidden];
      if (latestRow?.avatar_url) {
        try {
          const parsed = JSON.parse(latestRow.avatar_url);
          if (Array.isArray(parsed?.ids)) existingIds = parsed.ids.map(String);
        } catch {
          /* ignore */
        }
      }
      const nextHidden = Array.from(new Set([...existingIds, cleanId]));
      const { error: updErr } = await supabase.from('profiles').upsert(
        {
          user_email: HIDDEN_BASE_ROW_KEY,
          name: 'hidden_base_products',
          avatar_url: JSON.stringify({ ids: nextHidden, updatedAt: Date.now() }),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_email' }
      );
      if (updErr) {
        saveHiddenBaseCache(prevHidden);
        return { ok: false, error: updErr.message };
      }
      saveHiddenBaseCache(nextHidden);
      return { ok: true };
    }

    const rowKey = `${PRODUCT_ROW_PREFIX}${cleanId}`;
    const { error: delErr } = await supabase.from('profiles').delete().eq('user_email', rowKey);
    if (delErr) {
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
        saveGlobalCache(prevGlobal);
        return { ok: false, error: updErr.message };
      }
    }
    return { ok: true };
  } catch (err) {
    if (isBaseProduct) saveHiddenBaseCache(prevHidden);
    else saveGlobalCache(prevGlobal);
    return { ok: false, error: err instanceof Error ? err.message : 'Erro ao remover produto.' };
  }
}

export async function restoreHiddenBaseProducts(): Promise<{ ok: boolean; error?: string }> {
  if (!isCurrentUserAdmin()) {
    return { ok: false, error: 'Apenas a conta ADM pode restaurar produtos.' };
  }
  saveHiddenBaseCache([]);
  try {
    const headers = await buildAdminHeaders();
    const res = await fetch('/api/products', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action: 'restore_base',
        adminEmail: headers['x-orbiex-admin-email'],
        adminSecret: headers['x-orbiex-admin-secret'],
      }),
    });
    if (res.ok) return { ok: true };
  } catch {
    /* fallback Supabase */
  }
  try {
    const { error } = await supabase.from('profiles').upsert(
      {
        user_email: HIDDEN_BASE_ROW_KEY,
        name: 'hidden_base_products',
        avatar_url: JSON.stringify({ ids: [], updatedAt: Date.now() }),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_email' }
    );
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Erro ao restaurar.' };
  }
}

export function addCustomProduct(data: {
  name: string;
  category?: string;
  image: string;
  suggestedPrice?: string;
  costPrice?: string;
  commissionRate?: string;
  angle?: string;
  hook?: string;
  link?: string;
}): WinningProduct {
  const custom = getCustomProducts();
  const id = `custom-${Date.now()}`;
  const price = formatBRLPrice(data.suggestedPrice?.trim() || 'R$ 49,90');
  const comm = computeAffiliateCommission(price, data.commissionRate || data.costPrice);
  const newProduct: WinningProduct = {
    id,
    name: data.name.trim().toUpperCase(),
    category: data.category || 'Externo',
    image: data.image.trim(),
    score: 98,
    sales: 'Produto Externo',
    suggestedPrice: price,
    costPrice: data.costPrice?.trim() || 'R$ 15,00',
    margin: '70%',
    commissionRate: comm.rate,
    commissionAmount: comm.amount,
    angle: data.angle?.trim() || 'Visual de alto impacto com apelo imediato no TikTok Shop.',
    hook: data.hook?.trim() || `Você não vai acreditar no caimento dessa peça: ${data.name}!`,
    link: normalizeProductLink(data.link),
    isCustom: true,
    createdAt: Date.now(),
  };

  const updated = [newProduct, ...custom];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event(EVENT_KEY));
  } catch (e) {
    console.error('Falha ao salvar produto customizado', e);
  }

  return newProduct;
}

export function deleteCustomProduct(id: string): void {
  const isGlobal = getGlobalCache().some((p) => p.id === id);
  const isBase = id.startsWith('wp-');
  if (isGlobal || (isBase && isCurrentUserAdmin())) {
    void removeGlobalProduct(id);
    return;
  }
  const custom = getCustomProducts();
  const updated = custom.filter((p) => p.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event(EVENT_KEY));
  } catch (e) {
    console.error('Falha ao excluir produto customizado', e);
  }
}

export function useProducts() {
  const [products, setProducts] = useState<WinningProduct[]>(() => getAllProducts());
  const [globalProducts, setGlobalProducts] = useState<WinningProduct[]>(() => getGlobalCache());
  const [hiddenBaseIds, setHiddenBaseIds] = useState<string[]>(() => getHiddenBaseCache());
  const [loadingGlobal, setLoadingGlobal] = useState<boolean>(false);

  const refresh = useCallback(() => {
    setProducts(getAllProducts());
    setGlobalProducts(getGlobalCache());
    setHiddenBaseIds(getHiddenBaseCache());
  }, []);

  const refreshGlobal = useCallback(async (force = false) => {
    setLoadingGlobal(true);
    try {
      await fetchGlobalProducts(force);
    } finally {
      setLoadingGlobal(false);
    }
  }, []);

  useEffect(() => {
    refreshGlobal();
    const onFocus = () => {
      void fetchGlobalProducts(false);
    };
    window.addEventListener(EVENT_KEY, refresh);
    window.addEventListener('storage', refresh);
    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener(EVENT_KEY, refresh);
      window.removeEventListener('storage', refresh);
      window.removeEventListener('focus', onFocus);
    };
  }, [refresh, refreshGlobal]);

  return {
    products,
    globalProducts,
    hiddenBaseIds,
    loadingGlobal,
    refresh,
    refreshGlobal,
    addProduct: addCustomProduct,
    deleteProduct: deleteCustomProduct,
    publishGlobalProduct,
    removeGlobalProduct,
    restoreHiddenBaseProducts,
  };
}

/**
 * Mapeia inteligentemente o produto para a modelagem:
 * 'superior' (Tops, Croppeds, Camisas, Bodies)
 * 'inferior' (Calças, Shorts, Saias)
 * 'conjunto' (Vestidos, Macacões, Conjuntos, Kits)
 */
export function inferPieceType(product: WinningProduct): PieceType {
  const n = (product.name + ' ' + product.category).toUpperCase();

  // 1. Parte Inferior
  if (
    n.includes('CALÇA') ||
    n.includes('SHORT') ||
    n.includes('SAIA') ||
    n.includes('LEGGING') ||
    n.includes('BERMUDA') ||
    n.includes('FLARE') ||
    n.includes('PANTALONA')
  ) {
    // Se for "CONJUNTO SHORT SAIA", cai em conjunto
    if (n.includes('CONJUNTO') || n.includes('KIT')) {
      return 'conjunto';
    }
    return 'inferior';
  }

  // 2. Conjunto / Look Completo
  if (
    n.includes('VESTIDO') ||
    n.includes('MACACÃO') ||
    n.includes('MACAQUINHO') ||
    n.includes('CONJUNTO') ||
    n.includes('KIT') ||
    n.includes('SAÍDA DE PRAIA') ||
    n.includes('LOOK')
  ) {
    return 'conjunto';
  }

  // 3. Parte Superior
  if (
    n.includes('TOP') ||
    n.includes('CROPPED') ||
    n.includes('BLUSA') ||
    n.includes('REGATA') ||
    n.includes('BODY') ||
    n.includes('CORSET') ||
    n.includes('CORSELET') ||
    n.includes('JAQUETA') ||
    n.includes('CAMISA') ||
    n.includes('BATA') ||
    n.includes('MAIÔ')
  ) {
    return 'superior';
  }

  if (product.category === 'Vestidos') return 'conjunto';
  if (product.category === 'Croppeds') return 'superior';
  if (product.category === 'Alfaiataria') return 'inferior';

  return 'superior';
}

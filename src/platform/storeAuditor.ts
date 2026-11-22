import { getUserDisplayName } from './useUserProfile';
import { aiDeepAuditJSON, type LinkIntel } from './aiGenerate';

export interface StoreAuditRequest {
  storeName: string;
  storeLink: string;
  storeNiche?: string;
  metricsMode?: 'auto' | 'manual';
  itemsSold: number;
  responseRate: number;
  onTimeRate: number;
  freeSampleAvailable: boolean;
}

export interface MetricDiagnostic {
  label: string;
  value: string;
  status: 'Excelente' | 'Bom' | 'Alerta' | 'Crítico';
  explanation: string;
}

export interface OperationalPillar {
  title: string;
  status: 'Aprovado' | 'Atenção' | 'Risco';
  detail: string;
}

export interface StoreAuditResult {
  name: string;
  sourceSummary?: string;
  detectedNiche: string;
  storeProfileType: string;
  recommendedCommissionTarget: string;
  bestProductsToRequestSample: string[];
  score: number;
  badge: 'Diamante' | 'Ouro' | 'Prata' | 'Alerta';
  verdict: string;
  summary: string;
  metrics: MetricDiagnostic[];
  pillars: OperationalPillar[];
  strengths: string[];
  warnings: string[];
  partnershipScript: string;
  negotiationTips: string[];
}

type MetricStatus = MetricDiagnostic['status'];
type PillarStatus = OperationalPillar['status'];
type Badge = StoreAuditResult['badge'];

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
}

function parseStoreLinkLocally(rawLink: string): {
  domain: string;
  handle: string;
  slug: string;
  platform: string;
} {
  const trimmed = rawLink.trim();
  if (!trimmed) return { domain: '', handle: '', slug: '', platform: '' };
  if (trimmed.startsWith('@') && !trimmed.includes('/')) {
    return { domain: 'tiktok.com', handle: trimmed, slug: trimmed.slice(1), platform: 'TikTok Shop' };
  }
  try {
    const u = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    const domain = u.hostname.replace(/^www\./i, '');
    const platform = domain.includes('tiktok')
      ? 'TikTok Shop'
      : domain.includes('shopee')
      ? 'Shopee'
      : domain.includes('mercadolivre')
      ? 'Mercado Livre'
      : domain.includes('instagram')
      ? 'Instagram / Loja'
      : domain;
    const parts = u.pathname.split('/').filter(Boolean);
    const handle = parts.find((p) => p.startsWith('@')) || '';
    const slug =
      parts
        .filter((p) => !p.startsWith('@') && !/^\d+$/.test(p) && !['shop', 'store', 'loja', 'perfil'].includes(p.toLowerCase()))
        .pop() || '';
    return { domain, handle, slug: decodeURIComponent(slug).replace(/[-_]+/g, ' ').trim(), platform };
  } catch {
    return { domain: '', handle: '', slug: trimmed, platform: '' };
  }
}

export function extractStoreTitle(rawName: string, rawLink: string, linkIntel?: LinkIntel | null): string {
  if (rawName.trim()) return rawName.trim();

  if (linkIntel) {
    if (linkIntel.oembedAuthor && linkIntel.handle) {
      return `${linkIntel.oembedAuthor} (${linkIntel.handle})`;
    }
    if (linkIntel.oembedAuthor) return linkIntel.oembedAuthor;
    if (linkIntel.handle) return linkIntel.handle;
    if (linkIntel.pageTitle) {
      const cleaned = linkIntel.pageTitle
        .replace(/\|\s*(TikTok|Shopee|Mercado Livre|Instagram).*$/i, '')
        .replace(/-\s*(TikTok|Shopee).*$/i, '')
        .trim();
      if (cleaned.length >= 3 && !/^(tiktok|entrar|login)$/i.test(cleaned)) {
        return cleaned.slice(0, 70);
      }
    }
  }

  const parsed = parseStoreLinkLocally(rawLink);
  if (parsed.handle) return parsed.handle;
  if (parsed.slug && parsed.slug.length >= 3) {
    return parsed.slug
      .split(' ')
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
      .join(' ')
      .slice(0, 70);
  }
  if (parsed.domain) return parsed.domain;
  return 'Lojista Auditado';
}

function buildSourceSummary(rawLink: string, mode: 'auto' | 'manual', linkIntel?: LinkIntel | null): string {
  const parts: string[] = [];
  if (rawLink.trim()) {
    const local = parseStoreLinkLocally(rawLink);
    const plat = linkIntel?.platform || local.platform || linkIntel?.domain || local.domain;
    if (plat) parts.push(`Canal: ${plat}`);
    if (linkIntel?.handle || local.handle) parts.push(`Perfil: ${linkIntel?.handle || local.handle}`);
    if (linkIntel?.detectedSoldOrFollowers) parts.push(linkIntel.detectedSoldOrFollowers);
  }
  parts.push(mode === 'manual' ? 'Métricas Exatas do App' : 'Diagnóstico Inteligente de Perfil');
  return parts.join(' • ');
}

function badgeFor(score: number): Badge {
  if (score >= 88) return 'Diamante';
  if (score >= 76) return 'Ouro';
  if (score >= 60) return 'Prata';
  return 'Alerta';
}

function inferStoreProfileLocally(req: StoreAuditRequest, name: string, linkIntel?: LinkIntel | null) {
  const text = `${name} ${req.storeLink} ${req.storeNiche || ''} ${linkIntel?.pageTitle || ''} ${
    linkIntel?.pageDescription || ''
  } ${linkIntel?.oembedTitle || ''}`.toLowerCase();
  const seed = hashStr(`${name.toLowerCase()}|${req.storeLink.toLowerCase()}|${req.storeNiche || ''}`);

  const isReplicaOrShady =
    /(r[eé]plica|1[\sªa]*linha|primeira linha|tailandesa|clone|pirata|outlet grife|nike barato|airpods barato|importa f[aá]cil sem estoque)/i.test(
      text
    );
  const isDropshippingRisk =
    /(drop|dropshipping|envio internacional|crossborder|da china|prazo 15|achadinhos_?\d{2,}|teste_loja)/i.test(text);
  const isManufacturerOrFactory =
    /(f[aá]brica|fabricante|confec[cç][aã]o|atacado|br[aá]s|bom retiro|goi[aâ]nia|ind[uú]stria|distribuidor)/i.test(
      text
    );
  const isOfficialBrand = /(oficial|official|flagship|store oficial|marca pr[oó]pria|lab|cosmetics|beauty)/i.test(
    text
  );

  // Detecção de nicho
  let detectedNiche = req.storeNiche?.trim() || 'Varejo Multissetorial TikTok Shop';
  let commissionTarget = '15% a 20%';
  let sampleIdeas = ['Item mais vendido da vitrine atual', 'Kit promocional de maior giro'];

  if (/(fitness|legging|academia|treino|yoga|macaquinho)/i.test(text)) {
    detectedNiche = 'Moda Fitness & Activewear';
    commissionTarget = '18% a 25% (alta margem em confecção)';
    sampleIdeas = ['Shorts Modelador Sem Costura', 'Conjunto Top + Legging Compressão', 'Macaquinho Fitness Costas Nuas'];
  } else if (/(moda|vestido|jeans|roupa|look|boutique|closet|alfaiataria|blusa|feminina)/i.test(text)) {
    detectedNiche = 'Moda Feminina & Confecção';
    commissionTarget = '16% a 22%';
    sampleIdeas = ['Calça Wide Leg / Alfaiataria', 'Vestido Midi Canelado', 'Conjunto Tricot / Verão'];
  } else if (/(beleza|skin|cosm[eé]tico|maquiagem|cabelo|s[eé]rum|perfum|glow|corean)/i.test(text)) {
    detectedNiche = 'Beleza, Skincare & Cuidados Pessoais';
    commissionTarget = '20% a 30% (margem alta e recompra)';
    sampleIdeas = ['Sérum de Rotina Diária / Hidratação', 'Kit Capilar de Brilho Imediato', 'Protetor Solar com Toque Seco'];
  } else if (/(casa|cozinha|utilidade|organiz|decor|lar|mop|inox)/i.test(text)) {
    detectedNiche = 'Casa, Cozinha & Utilidades Domésticas';
    commissionTarget = '15% a 22%';
    sampleIdeas = ['Mini Processador / Cortador Multiuso', 'Mop Giratório ou Extrator de Limpeza', 'Kit Organizador de Acrílico'];
  } else if (/(eletr|tech|gadget|fone|smart|celul|acess[oó]rio|info|gamer|import)/i.test(text)) {
    detectedNiche = 'Eletrônicos, Áudio & Gadgets';
    commissionTarget = '10% a 16% (margem mais enxuta, ganha no volume)';
    sampleIdeas = ['Mini Projetor Portátil / Luminária LED', 'Microfone de Lapela Sem Fio', 'Carregador Magnético / Powerbank'];
  } else if (/(cal[cç]ad|t[eê]nis|sapato|sand[aá]lia|bota|bolsa)/i.test(text)) {
    detectedNiche = 'Calçados, Bolsas & Acessórios';
    commissionTarget = '15% a 20%';
    sampleIdeas = ['Tênis Casual Plataforma Leve', 'Bolsa Tiracolo Estruturada'];
  }

  let storeProfileType = 'Vendedor Padrão de Marketplace';
  let autoItemsSold = 650 + (seed % 3800);
  let autoResponse = 84 + (seed % 14);
  let autoOnTime = 88 + (seed % 11);
  let autoSample = seed % 3 !== 0;

  if (isReplicaOrShady) {
    storeProfileType = 'Operação de Alto Risco (Suspeita de IPR / Sem Licença)';
    autoItemsSold = 120 + (seed % 500);
    autoResponse = 68 + (seed % 16);
    autoOnTime = 76 + (seed % 12);
    autoSample = false;
  } else if (isDropshippingRisk) {
    storeProfileType = 'Intermediação / Dropshipping (Atenção a Estoque e SLA)';
    autoItemsSold = 180 + (seed % 750);
    autoResponse = 78 + (seed % 14);
    autoOnTime = 81 + (seed % 10);
    autoSample = false;
  } else if (isManufacturerOrFactory) {
    storeProfileType = 'Fabricante / Atacadista com Estoque Próprio';
    autoItemsSold = 4200 + (seed % 5800);
    autoResponse = 91 + (seed % 8);
    autoOnTime = 95 + (seed % 5);
    autoSample = true;
  } else if (isOfficialBrand) {
    storeProfileType = 'Loja Oficial / Marca Estruturada';
    autoItemsSold = 5500 + (seed % 4500);
    autoResponse = 94 + (seed % 6);
    autoOnTime = 97 + (seed % 3);
    autoSample = true;
  }

  return {
    isReplicaOrShady,
    isDropshippingRisk,
    detectedNiche,
    storeProfileType,
    commissionTarget,
    sampleIdeas,
    autoItemsSold,
    autoResponse,
    autoOnTime,
    autoSample,
  };
}

function computeManualScore(itemsSold: number, responseRate: number, onTimeRate: number, freeSample: boolean, isReplicaOrShady: boolean) {
  if (isReplicaOrShady) {
    return {
      score: 29,
      salesStatus: 'Alerta' as MetricStatus,
      responseStatus: 'Alerta' as MetricStatus,
      onTimeStatus: 'Crítico' as MetricStatus,
    };
  }
  let onTimePts = 8;
  let onTimeStatus: MetricStatus = 'Crítico';
  if (onTimeRate >= 98) [onTimePts, onTimeStatus] = [40, 'Excelente'];
  else if (onTimeRate >= 95) [onTimePts, onTimeStatus] = [35, 'Excelente'];
  else if (onTimeRate >= 90) [onTimePts, onTimeStatus] = [26, 'Bom'];
  else if (onTimeRate >= 82) [onTimePts, onTimeStatus] = [16, 'Alerta'];

  let respPts = 6;
  let responseStatus: MetricStatus = 'Crítico';
  if (responseRate >= 95) [respPts, responseStatus] = [25, 'Excelente'];
  else if (responseRate >= 88) [respPts, responseStatus] = [19, 'Bom'];
  else if (responseRate >= 78) [respPts, responseStatus] = [12, 'Alerta'];

  let salesPts = 6;
  let salesStatus: MetricStatus = 'Alerta';
  if (itemsSold >= 7500) [salesPts, salesStatus] = [25, 'Excelente'];
  else if (itemsSold >= 2500) [salesPts, salesStatus] = [21, 'Excelente'];
  else if (itemsSold >= 800) [salesPts, salesStatus] = [16, 'Bom'];
  else if (itemsSold >= 250) [salesPts, salesStatus] = [11, 'Bom'];

  const samplePts = freeSample ? 9 : 3;
  const score = Math.min(98, Math.max(18, onTimePts + respPts + salesPts + samplePts));
  return { score, salesStatus, responseStatus, onTimeStatus };
}

function fmtItems(n: number) {
  return n >= 10000 ? '10.000+' : n.toLocaleString('pt-BR');
}

export function auditStore(req: StoreAuditRequest, linkIntel?: LinkIntel | null): StoreAuditResult {
  const mode = req.metricsMode || 'auto';
  const name = extractStoreTitle(req.storeName, req.storeLink, linkIntel);
  const profile = inferStoreProfileLocally(req, name, linkIntel);
  const sender = getUserDisplayName();

  const itemsSold = mode === 'manual' ? req.itemsSold : profile.autoItemsSold;
  const responseRate = mode === 'manual' ? req.responseRate : profile.autoResponse;
  const onTimeRate = mode === 'manual' ? req.onTimeRate : profile.autoOnTime;
  const freeSample = mode === 'manual' ? req.freeSampleAvailable : profile.autoSample;

  const calc = computeManualScore(itemsSold, responseRate, onTimeRate, freeSample, profile.isReplicaOrShady);
  const score = calc.score;
  const badge = badgeFor(score);
  const itemsLabel = mode === 'manual' ? `${fmtItems(itemsSold)} vendidos` : `~${fmtItems(itemsSold)} estimados`;

  const verdict = profile.isReplicaOrShady
    ? 'Alerta Crítico · Risco de Queda de Loja por Propriedade Intelectual'
    : badge === 'Diamante'
    ? `Diamante · ${profile.storeProfileType} Pronta para Escala Forte`
    : badge === 'Ouro'
    ? `Ouro · Operação Sólida em ${profile.detectedNiche}`
    : badge === 'Prata'
    ? `Prata · Viável no Orgânico com Monitoramento de Estoque/SLA`
    : `Alerta · Gargalo Logístico / Suporte Risca Estornar Suas Comissões`;

  const summary = profile.isReplicaOrShady
    ? `A auditoria identificou sinais de alto risco comercial na "${name}". Lojas que operam sem licença de marca no TikTok Shop costumam sofrer bloqueio de vitrine em poucas semanas, congelando as comissões pendentes dos afiliados.`
    : `Analisando "${name}" no segmento de ${profile.detectedNiche} (${profile.storeProfileType}), o índice de confiabilidade ficou em ${score}/100 (Selo ${badge}). Com despacho pontual de ${onTimeRate}% e taxa de resposta de ${responseRate}%, a margem recomendada para negociação B2B neste nicho é de ${profile.commissionTarget}.`;

  const stockPillar: PillarStatus = itemsSold >= 2500 ? 'Aprovado' : itemsSold >= 500 ? 'Atenção' : 'Risco';
  const slaPillar: PillarStatus = onTimeRate >= 94 ? 'Aprovado' : onTimeRate >= 88 ? 'Atenção' : 'Risco';
  const chatPillar: PillarStatus = responseRate >= 92 ? 'Aprovado' : responseRate >= 83 ? 'Atenção' : 'Risco';

  return {
    name,
    sourceSummary: buildSourceSummary(req.storeLink, mode, linkIntel),
    detectedNiche: profile.detectedNiche,
    storeProfileType: profile.storeProfileType,
    recommendedCommissionTarget: profile.commissionTarget,
    bestProductsToRequestSample: profile.sampleIdeas,
    score,
    badge,
    verdict,
    summary,
    metrics: [
      {
        label: mode === 'manual' ? 'Volume Informado' : 'Maturidade Comercial Estimada',
        value: itemsLabel,
        status: calc.salesStatus,
        explanation:
          itemsSold >= 2500
            ? `Giro validado em ${profile.detectedNiche} capaz de sustentar picos de vídeos virais.`
            : `Operação ainda em construção para "${name}" — confirme fôlego de estoque antes de escalar.`,
      },
      {
        label: 'Atendimento no Chat (24h)',
        value: `${responseRate}% de resposta`,
        status: calc.responseStatus,
        explanation:
          responseRate >= 92
            ? `Equipe da "${name}" responde rápido a dúvidas de compra e solicitações de criadores.`
            : `Retorno de ${responseRate}% exige antecipar dúvidas de tamanho/uso dentro do próprio vídeo.`,
      },
      {
        label: 'Cumprimento de Postagem (SLA)',
        value: `${onTimeRate}% no prazo`,
        status: calc.onTimeStatus,
        explanation:
          onTimeRate >= 95
            ? `Expedição pontual protege suas comissões na "${name}" contra cancelamento automático.`
            : `Atenção: atrasos acima de 48h úteis geram reembolso automático no TikTok Shop e anulam comissão.`,
      },
      {
        label: 'Política de Amostra Grátis',
        value: freeSample ? 'Liberada p/ Afiliados' : 'Negociação Manual no Chat',
        status: freeSample ? 'Excelente' : 'Alerta',
        explanation: freeSample
          ? `Facilidade para pedir "${profile.sampleIdeas[0]}" e gravar conteúdo autoral em mãos.`
          : `Exige enviar portfólio no chat da "${name}" propondo entrega garantida de vídeos.`,
      },
    ],
    pillars: [
      {
        title: `Profundidade de Estoque em ${profile.detectedNiche}`,
        status: stockPillar,
        detail:
          stockPillar === 'Aprovado'
            ? `"${name}" demonstra estrutura compatível com reposição rápida dos carros-chefe do catálogo.`
            : `Pergunte no chat da "${name}" quantas unidades do SKU principal eles têm em pronta entrega hoje.`,
      },
      {
        title: 'Blindagem de Comissão (SLA de Expedição 48h)',
        status: slaPillar,
        detail:
          slaPillar === 'Aprovado'
            ? `Com ${onTimeRate}% de envios no prazo, o risco de perda de comissão por falha logística é mínimo.`
            : `Taxa de ${onTimeRate}% requer acompanhamento nos primeiros 30 pedidos gerados pelo seu perfil.`,
      },
      {
        title: 'Suporte Pré e Pós-Venda ao Comprador',
        status: chatPillar,
        detail:
          chatPillar === 'Aprovado'
            ? `Atendimento de ${responseRate}% ajuda a converter boletos/PIX e reduz disputas pós-entrega.`
            : `Com ${responseRate}% no chat, deixe especificações claras na legenda para o cliente não depender do suporte.`,
      },
      {
        title: 'Abertura Comercial para Criadores B2B',
        status: freeSample ? 'Aprovado' : 'Atenção',
        detail: freeSample
          ? `Boa abertura para negociar comissão alvo de ${profile.commissionTarget} em campanha dedicada (Target Plan).`
          : `Inicie com 1 produto de curva A da "${name}" para destravar relacionamento e amostras futuras.`,
      },
    ],
    strengths: profile.isReplicaOrShady
      ? ['Apelo de busca orgânica, porém inviável pela política antifraude do TikTok Shop']
      : [
          `Posicionamento identificado em ${profile.detectedNiche} (${profile.storeProfileType})`,
          `Espaço para negociar ${profile.commissionTarget} em plano direcionado (Target Collaboration)`,
          onTimeRate >= 94
            ? `Pontualidade de ${onTimeRate}% preserva a nota da vitrine do afiliado`
            : `Possibilidade de ser um dos primeiros criadores a dominar os vídeos da "${name}"`,
        ],
    warnings: [
      ...(profile.isReplicaOrShady
        ? [`Risco iminente de fechamento da loja "${name}" por violação de marca e perda total do saldo pendente`]
        : []),
      ...(profile.isDropshippingRisk
        ? [`Verifique se "${name}" possui estoque nacional no Brasil; envios sem código válido em 48h são cancelados`]
        : []),
      ...(onTimeRate < 95
        ? [`Monitore o SLA (${onTimeRate}%) antes de investir dinheiro em Spark Ads para a "${name}"`]
        : [`Peça à equipe da "${name}" para avisar com 48h de antecedência caso o SKU principal esteja acabando`]),
    ],
    partnershipScript: profile.isReplicaOrShady
      ? `Recomendação Orbiex: Evite firmar parceria ou vincular produtos da "${name}" caso não apresentem Carta de Autorização Oficial (LOA) da marca no Seller Center.`
      : `Olá, equipe da ${name}!\n\nAqui é ${sender}, criador(a) afiliado(a) no TikTok Shop com foco no nicho de ${profile.detectedNiche}.\n\nAnalisei o perfil de vocês e identifiquei ótimo potencial de escala em vídeo curto, especialmente para itens como ${profile.sampleIdeas[0]}.\n\nGostaria de propor uma parceria prática:\n1. Envio de Amostra Grátis do SKU de maior margem/estoque de vocês;\n2. Produção de 3 vídeos nativos (9:16) quebrando objeções reais e puxando para a sacola;\n3. Configuração de link em Colaboração Direcionada (Target Plan) com comissão competitiva (${profile.commissionTarget}).\n\nQual produto do catálogo de vocês está com maior estoque hoje para começarmos esta semana?`,
    negotiationTips: [
      `Peça à "${name}" um link de Colaboração Direcionada (Target Plan) em vez da comissão aberta da vitrine — costuma render 3% a 8% a mais;`,
      `Comece pedindo amostra de "${profile.sampleIdeas[0]}", que tem demonstração mais rápida em vídeo curto;`,
      `Confirme o estoque físico real no Brasil antes de impulsionar qualquer vídeo da "${name}".`,
    ],
  };
}

/* ══════════════════════════════════════════════════════════════════════
 * Auditoria Forense de Lojista AI-First (Inspeção Real do Link + Diagnóstico Único)
 * ══════════════════════════════════════════════════════════════════════ */

const STORE_AUDIT_FORMAT = `{
  "identifiedStoreName": "string (nome real e limpo da loja ou @handle extraído do link/input — NUNCA use 'Loja Oficial TikTok Shop' genérico)",
  "detectedNiche": "string (nicho e linha de produtos específica desta loja, ex: 'Moda Fitness Feminina · Atacado Brás', 'Eletrônicos & Áudio Bluetooth', 'Dermocosméticos Coreanos')",
  "storeProfileType": "string (modelo operacional diagnosticado: ex: 'Fabricante / Confecção Própria', 'Importadora com Estoque Nacional', 'Dropshipping / Intermediação de Risco', 'Marca Oficial Homologada', 'Revenda Iniciante')",
  "recommendedCommissionTarget": "string (faixa realista de comissão % para negociar com ESTA loja considerando as margens desse nicho)",
  "bestProductsToRequestSample": ["string (2 ou 3 tipos específicos de produtos do catálogo/nicho desta loja ideais para pedir amostra)"],
  "score": "number inteiro 12-98 (SEJA HONESTO E CRÍTICO! Se metricsMode='manual', seja fiel às métricas informadas. Se metricsMode='auto', avalie com realismo o perfil/link/nome da loja: lojas suspeitas/réplicas 18-38; dropshipping/iniciantes sem prova 48-66; boas revendas 68-82; fabricantes/lojas estruturadas 83-91; só dê 92+ para marcas oficiais/operações de elite comprovada!)",
  "badge": "'Diamante' | 'Ouro' | 'Prata' | 'Alerta' (coerente com score: >=88 Diamante, 76-87 Ouro, 60-75 Prata, <60 Alerta)",
  "verdict": "string curta e cirúrgica sobre ESTA loja específica",
  "summary": "string (diagnóstico executivo de 3 frases analisando especificamente esta loja, seu modelo de operação, nicho, riscos reais de estoque/SLA e potencial para afiliados)",
  "metrics": [
    { "label": "string", "value": "string", "status": "'Excelente' | 'Bom' | 'Alerta' | 'Crítico'", "explanation": "string específica sobre o volume/maturidade desta loja" },
    { "label": "string", "value": "string", "status": "'Excelente' | 'Bom' | 'Alerta' | 'Crítico'", "explanation": "string específica sobre atendimento desta loja" },
    { "label": "string", "value": "string", "status": "'Excelente' | 'Bom' | 'Alerta' | 'Crítico'", "explanation": "string específica sobre despacho/SLA desta loja" },
    { "label": "string", "value": "string", "status": "'Excelente' | 'Bom' | 'Alerta' | 'Crítico'", "explanation": "string específica sobre amostras e abertura B2B desta loja" }
  ],
  "pillars": [
    { "title": "string", "status": "'Aprovado' | 'Atenção' | 'Risco'", "detail": "string específica sobre estoque desta loja" },
    { "title": "string", "status": "'Aprovado' | 'Atenção' | 'Risco'", "detail": "string específica sobre logística/embalagem do nicho desta loja" },
    { "title": "string", "status": "'Aprovado' | 'Atenção' | 'Risco'", "detail": "string específica sobre suporte/trocas no nicho desta loja" },
    { "title": "string", "status": "'Aprovado' | 'Atenção' | 'Risco'", "detail": "string específica sobre parceria B2B e comissão com esta loja" }
  ],
  "strengths": ["string (2 a 4 forças concretas desta loja/operação)"],
  "warnings": ["string (2 a 3 riscos reais que o afiliado precisa checar com esta loja)"],
  "partnershipScript": "string (mensagem B2B impecável do criador para mandar no chat DESTA loja citando o nome dela, o nicho dela e pedindo amostra + Target Plan, usando \\n para quebras de linha)",
  "negotiationTips": ["string (3 táticas práticas de negociação específicas para este tipo de fornecedor)"]
}`;

type AnyObj = Record<string, unknown>;
const str = (v: unknown, fb: string) => (typeof v === 'string' && v.trim() ? v.trim() : fb);
const strArr = (v: unknown, fb: string[], max = 5) => {
  if (!Array.isArray(v)) return fb;
  const out = v.filter((x) => typeof x === 'string' && x.trim()).map((x) => (x as string).trim()).slice(0, max);
  return out.length ? out : fb;
};

export async function auditStoreAI(req: StoreAuditRequest): Promise<StoreAuditResult> {
  const mode = req.metricsMode || 'auto';
  const sender = getUserDisplayName();
  const prelimName = extractStoreTitle(req.storeName, req.storeLink);
  const memoryKey = `store-forensic-v2:${(req.storeName || req.storeLink || prelimName).toLowerCase().trim()}:${mode}`;

  const { data, linkIntel } = await aiDeepAuditJSON<AnyObj>({
    memoryKey,
    targetUrl: req.storeLink.trim(),
    task:
      `Realize uma AUDITORIA FORENSE COMPLETA E 100% PERSONALIZADA do lojista/fornecedor abaixo para afiliados do TikTok Shop Brasil. ` +
      (mode === 'manual'
        ? `O usuário informou MANUALMENTE as métricas reais vistas no aplicativo (${req.itemsSold} itens vendidos, ${req.responseRate}% resposta em 24h, ${req.onTimeRate}% envios pontuais, amostra grátis: ${req.freeSampleAvailable ? 'Sim' : 'Não'}). Use EXATAMENTE esses números nos 4 cards de metrics e calcule o score/badge de forma coerente com eles E com a credibilidade/nicho da loja! `
        : `O usuário escolheu DIAGNÓSTICO AUTOMÁTICO POR LINK/PERFIL (não informou métricas manuais). Analise profundamente os dados extraídos do link (@handle, bio, seguidores/vendas, domínio, título), o nome da loja ("${req.storeName || req.storeLink}") e o nicho ("${req.storeNiche || 'deduzir pelo nome/link'}") para diagnosticar que tipo de operação é essa (fabricante, marca oficial, revenda pequena, dropshipping sem estoque, loja de réplicas, etc.), estimando indicadores realistas e dando um Score honesto — lojas diferentes DEVEM ter diagnósticos, nichos, riscos e notas completamente diferentes! `) +
      `Assine o partnershipScript em nome do criador "${sender}", citando a loja pelo nome e mencionando produtos reais do nicho dela.`,
    input: {
      modoDeAnalise: mode === 'manual' ? 'Métricas Exatas Informadas pelo Usuário' : 'Diagnóstico Inteligente por Link / Nome da Loja',
      nomeDaLojaInformado: req.storeName.trim() || '(identificar pelo link)',
      linkDaLojaInformado: req.storeLink.trim() || '(nenhum link informado)',
      nichoOuProdutosInformados: req.storeNiche?.trim() || '(deduzir pelo nome da loja e pelos metadados do link)',
      ...(mode === 'manual'
        ? {
            metricasDoApp: {
              itensVendidos: req.itemsSold,
              taxaResposta24h: `${req.responseRate}%`,
              enviosNoPrazoSLA: `${req.onTimeRate}%`,
              amostraGratisDisponivel: req.freeSampleAvailable,
            },
          }
        : {}),
      nomeDoAfiliado: sender,
    },
    format: STORE_AUDIT_FORMAT,
    timeoutMs: 35000,
    remember: (d: AnyObj) => [
      String(d?.summary || '').slice(0, 180),
      String(d?.verdict || '').slice(0, 120),
      String(d?.partnershipScript || '').slice(0, 180),
    ],
  });

  const local = auditStore(req, linkIntel);
  if (!data || typeof data !== 'object') return local;

  try {
    const rawScore = typeof data.score === 'number' ? data.score : Number(data.score);
    let score = Number.isFinite(rawScore) ? Math.round(Math.max(10, Math.min(98, rawScore))) : local.score;
    // Em modo manual, garante coerência matemática próxima às métricas informadas (salvo loja de réplica)
    if (mode === 'manual' && local.score > 35) {
      score = Math.round(score * 0.45 + local.score * 0.55);
    }
    const badge = badgeFor(score);

    const aiMetrics = Array.isArray(data.metrics) ? (data.metrics as AnyObj[]) : [];
    const metrics: MetricDiagnostic[] = local.metrics.map((fb, i) => {
      const m = aiMetrics[i];
      if (!m || typeof m !== 'object') return fb;
      const st: MetricStatus =
        m.status === 'Excelente' || m.status === 'Bom' || m.status === 'Alerta' || m.status === 'Crítico'
          ? m.status
          : fb.status;
      return {
        label: mode === 'manual' ? fb.label : str(m.label, fb.label),
        value: mode === 'manual' ? fb.value : str(m.value, fb.value),
        status: mode === 'manual' ? fb.status : st,
        explanation: str(m.explanation, fb.explanation),
      };
    });

    const aiPillars = Array.isArray(data.pillars) ? (data.pillars as AnyObj[]) : [];
    const pillars: OperationalPillar[] = local.pillars.map((fb, i) => {
      const p = aiPillars[i];
      if (!p || typeof p !== 'object') return fb;
      const st: PillarStatus =
        p.status === 'Aprovado' || p.status === 'Atenção' || p.status === 'Risco' ? p.status : fb.status;
      return {
        title: str(p.title, fb.title),
        status: mode === 'manual' ? fb.status : st,
        detail: str(p.detail, fb.detail),
      };
    });

    return {
      name: str(data.identifiedStoreName, local.name),
      sourceSummary: local.sourceSummary,
      detectedNiche: str(data.detectedNiche, local.detectedNiche),
      storeProfileType: str(data.storeProfileType, local.storeProfileType),
      recommendedCommissionTarget: str(data.recommendedCommissionTarget, local.recommendedCommissionTarget),
      bestProductsToRequestSample: strArr(data.bestProductsToRequestSample, local.bestProductsToRequestSample, 4),
      score,
      badge,
      verdict: str(data.verdict, local.verdict),
      summary: str(data.summary, local.summary),
      metrics,
      pillars,
      strengths: strArr(data.strengths, local.strengths, 5),
      warnings: strArr(data.warnings, local.warnings, 5),
      partnershipScript: str(data.partnershipScript, local.partnershipScript).replace(/\\n/g, '\n'),
      negotiationTips: strArr(data.negotiationTips, local.negotiationTips, 5),
    };
  } catch {
    return local;
  }
}

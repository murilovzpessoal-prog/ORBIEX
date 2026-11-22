import { aiDeepAuditJSON, type LinkIntel } from './aiGenerate';
import { getUserDisplayName } from './useUserProfile';

export interface ProductAuditRequest {
  productName: string;
  productLink: string;
  category: string;
  commission: string;
  estimatedPrice?: string;
}

export interface GuidelineItem {
  label: string;
  passed: boolean;
  severity: 'ok' | 'alerta' | 'bloqueio';
  note: string;
  policyRef: string;
}

export interface ContentAngle {
  type: string;
  title: string;
  description: string;
}

export interface BuyerObjection {
  objection: string;
  howToKillInVideo: string;
}

export interface ProductAuditResult {
  name: string;
  sourceSummary?: string;
  categoryDetected: string;
  score: number;
  banRisk: 'Baixo' | 'Médio' | 'Alto';
  banRiskDetail: string;
  status: string;
  demandIndex: number;
  viralHookDetail: string;
  demonstrationEase: number;
  estimatedTicket: string;
  estimatedCommissionPerSale: string;
  estimatedMargin: string;
  returnRateRisk: string;
  returnRateReason: string;
  targetPersona: string;
  buyerObjections: BuyerObjection[];
  verdictSummary: string;
  guidelines: GuidelineItem[];
  contentAngles: ContentAngle[];
  strengths: string[];
  riskFactors: string[];
  freeSampleScript: string;
  actionableAdvice: string;
}

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
}

function parseLinkLocally(rawLink: string): {
  domain: string;
  handle: string;
  slug: string;
  platform: string;
} {
  const trimmed = rawLink.trim();
  if (!trimmed) return { domain: '', handle: '', slug: '', platform: '' };
  try {
    const normalized = trimmed.startsWith('@')
      ? `https://www.tiktok.com/${trimmed}`
      : /^https?:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;
    const u = new URL(normalized);
    const domain = u.hostname.replace(/^www\./i, '');
    const platform = domain.includes('tiktok')
      ? 'TikTok Shop'
      : domain.includes('shopee')
      ? 'Shopee'
      : domain.includes('mercadolivre')
      ? 'Mercado Livre'
      : domain.includes('amazon')
      ? 'Amazon'
      : domain.includes('shein')
      ? 'Shein'
      : domain.includes('aliexpress')
      ? 'AliExpress'
      : domain;
    const segs = u.pathname.split('/').filter(Boolean);
    const handle = segs.find((s) => s.startsWith('@')) || '';
    const rawSlug =
      segs
        .filter(
          (s) =>
            !s.startsWith('@') &&
            !/^\d+$/.test(s) &&
            !['video', 'product', 'view', 'shop', 'p', 'dp', 'item', 'pt', 'br'].includes(s.toLowerCase())
        )
        .pop() || '';
    const slug = decodeURIComponent(rawSlug)
      .replace(/-i\.\d+\.\d+$/i, '')
      .replace(/^MLB-?\d+-?/i, '')
      .replace(/_JM$/i, '')
      .replace(/\.(html|php|htm)$/i, '')
      .replace(/[-_]+/g, ' ')
      .trim();
    return { domain, handle, slug, platform };
  } catch {
    return { domain: '', handle: '', slug: '', platform: '' };
  }
}

export function extractProductTitle(
  rawName: string,
  rawLink: string,
  defaultCategory: string,
  linkIntel?: LinkIntel | null
): string {
  if (rawName.trim()) return rawName.trim();

  // 1. Tenta dados reais extraídos do link (oEmbed / og:title / slug)
  if (linkIntel) {
    const candidates = [linkIntel.oembedTitle, linkIntel.pageTitle, linkIntel.slugHint]
      .map((s) =>
        String(s || '')
          .replace(/#\S+/g, '')
          .replace(/\|\s*(TikTok|Shopee|Mercado Livre|Amazon).*$/i, '')
          .replace(/-\s*(TikTok|Shopee|Mercado Livre).*$/i, '')
          .replace(/^TikTok\s*·\s*/i, '')
          .replace(/\s+/g, ' ')
          .trim()
      )
      .filter((s) => s.length >= 4 && !/^(tiktok|make your day|entrar|login)$/i.test(s));

    if (candidates[0]) {
      return candidates[0].slice(0, 85);
    }
  }

  // 2. Parse local da URL
  const parsed = parseLinkLocally(rawLink);
  if (parsed.slug && parsed.slug.length >= 4) {
    return parsed.slug
      .split(' ')
      .map((w) => (w.length > 2 ? w[0].toUpperCase() + w.slice(1) : w))
      .join(' ')
      .slice(0, 85);
  }
  if (parsed.handle) {
    return `Produto da Vitrine ${parsed.handle}`;
  }
  if (parsed.platform) {
    const cat = defaultCategory && !defaultCategory.includes('Automaticamente') ? ` (${defaultCategory})` : '';
    return `Anúncio ${parsed.platform}${cat}`;
  }
  return 'Produto em Análise';
}

function formatSourceSummary(rawLink: string, linkIntel?: LinkIntel | null): string | undefined {
  if (!rawLink.trim()) return undefined;
  if (linkIntel) {
    const bits: string[] = [];
    if (linkIntel.platform || linkIntel.domain) bits.push(`Fonte: ${linkIntel.platform || linkIntel.domain}`);
    if (linkIntel.handle) bits.push(`Perfil: ${linkIntel.handle}`);
    else if (linkIntel.oembedAuthor) bits.push(`Loja/Autor: ${linkIntel.oembedAuthor}`);
    if (linkIntel.detectedPrice) bits.push(`Preço detectado: ${linkIntel.detectedPrice}`);
    if (linkIntel.detectedRating) bits.push(`Nota: ${linkIntel.detectedRating}`);
    if (linkIntel.detectedSoldOrFollowers) bits.push(linkIntel.detectedSoldOrFollowers);
    if (bits.length) return bits.join(' • ');
  }
  const local = parseLinkLocally(rawLink);
  if (local.platform || local.handle) {
    return [local.platform && `Fonte: ${local.platform}`, local.handle && `Perfil: ${local.handle}`]
      .filter(Boolean)
      .join(' • ');
  }
  return undefined;
}

function parseCommissionNumber(comm: string): number {
  const m = String(comm || '20').match(/(\d+(?:[.,]\d+)?)/);
  if (!m) return 20;
  return Math.max(1, Math.min(80, parseFloat(m[1].replace(',', '.'))));
}

function parsePriceNumber(priceStr?: string): number | null {
  if (!priceStr) return null;
  const cleaned = priceStr.replace(/[^\d.,]/g, '');
  if (!cleaned) return null;
  const normalized =
    cleaned.includes(',') && cleaned.includes('.')
      ? cleaned.replace(/\./g, '').replace(',', '.')
      : cleaned.replace(',', '.');
  const val = parseFloat(normalized);
  return Number.isFinite(val) && val > 0 ? val : null;
}

function fmtBRL(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/* ══════════════════════════════════════════════════════════════════════
 * Motor Forense Local (Fallback realista com 12 perfis distintos e hash determinístico por produto)
 * ══════════════════════════════════════════════════════════════════════ */
export function auditProduct(req: ProductAuditRequest, linkIntel?: LinkIntel | null): ProductAuditResult {
  const name = extractProductTitle(req.productName, req.productLink, req.category, linkIntel);
  const sourceSummary = formatSourceSummary(req.productLink, linkIntel);
  const localLink = parseLinkLocally(req.productLink);
  const storeRef = linkIntel?.handle || localLink.handle || linkIntel?.oembedAuthor || 'sua loja';
  const sender = getUserDisplayName();
  const commPct = parseCommissionNumber(req.commission);
  const userPrice = parsePriceNumber(req.estimatedPrice) || parsePriceNumber(linkIntel?.detectedPrice);

  const fullText = `${name} ${req.productLink} ${linkIntel?.oembedTitle || ''} ${linkIntel?.pageTitle || ''} ${
    req.category && !req.category.includes('Automaticamente') ? req.category : ''
  }`.toLowerCase();
  const seed = hashStr(`${name.toLowerCase()}|${req.productLink.trim().toLowerCase()}|${commPct}|${userPrice || ''}`);
  const offset = (seed % 7) - 3; // -3..+3 determinístico para cada produto diferente

  // Classificadores granulares reais
  const isProhibited =
    /(vape|pod descart|cigarro eletr|ess[eê]ncia nargu|tabaco|faca t[aá]tica|canivete|taser|arma|muni[cç][aã]o|spray de pimenta|er[oó]tico|vibrador|sex shop|estimulante sexual)/i.test(
      fullText
    );
  const isReplica =
    /(r[eé]plica|1[\sªa]*linha|primeira linha|c[oó]pia|tailandesa|camisa de time|nike|adidas|apple|airpods|gucci|prada|louis vuitton|chanel|rolex|balenciaga|puma|new balance|copo stanley|contratipo)/i.test(
      fullText
    );
  const isIngestible =
    /(emagreced|perda de peso|secar barriga|queima gordura|c[aá]psula|gummy|suplemento|whey|creatina|melatonina|rem[eé]dio|ozempic|ch[aá] sec|diur[eé]tico|termog[eê]nico|col[aá]geno em p[oó]|detox|minoxidil)/i.test(
      fullText
    );
  const isSensitiveSkin =
    /(melasma|clareador|clareamento dental|acne|espinha|estria|varizes|fungo|micose|foliculite|cicatriz|queda de cabelo|anti[- ]?idade|rugas|peeling|[aá]cido)/i.test(
      fullText
    );
  const isLowTicketCommodity =
    /(meia branca|cabo usb|pel[ií]cula de vidro|capinha transparente|caneta|caderno simples|pano de prato|esponja comum|pilha|adaptador de tomada|chaveiro simples|el[aá]stico de cabelo)/i.test(
      fullText
    ) || (userPrice !== null && userPrice < 19);
  const isFragileOrBulky =
    /(espelho grande|corpo inteiro|vaso de vidro|cristal|porcelana|ta[cç]a|quadro com vidro|lustre|mesa|cadeira|estante|geladeira|micro-ondas|tv \d\d)/i.test(
      fullText
    );
  const isSizingCritical =
    /(sapato|t[eê]nis|bota|sand[aá]lia|salto|scarpin|cal[cç]a jeans|alfaiataria|suti[aã]|biqu[ií]ni|lingerie|terno|blazer)/i.test(
      fullText
    );
  const isHighTicket = userPrice !== null && userPrice >= 320;
  const isWowProblemSolver =
    /(mini processador|mop|extrator|vaporizador|passadeira|escova alisadora|escova secadora|seladora|aspirador port[aá]til|removedor de pelos|tira bolinha|mini projetor|lumin[aá]ria|shorts modelador|macaquinho fitness|organizador girat)/i.test(
      fullText
    );

  // Cálculo honesto e diferenciado
  let score = 78 + offset;
  let banRisk: ProductAuditResult['banRisk'] = 'Baixo';
  let categoryDetected =
    req.category && !req.category.includes('Automaticamente') ? req.category : 'Utilidades & Comércio Geral';
  let ticketLo = userPrice ? Math.max(9, userPrice * 0.95) : 59.9;
  let ticketHi = userPrice ? userPrice * 1.05 : 99.9;
  let demandIndex = Math.min(98, Math.max(30, 80 + ((seed >> 3) % 13) - 5));
  let demonstrationEase = Math.min(98, Math.max(25, 78 + ((seed >> 5) % 15) - 6));
  let returnRateRisk = '3.4% (Baixo)';
  let returnRateReason = `Baixa complexidade de uso no dia a dia para "${name}", desde que o anúncio mostre as dimensões reais.`;
  let banRiskDetail = `Nenhum termo ou atributo visual de "${name}" aciona bloqueio automático no algoritmo comercial do TikTok Shop.`;
  let viralHookDetail = `O funcionamento prático de "${name}" permite criar curiosidade visual logo nos primeiros 3 segundos.`;
  let status = `Aprovado · Boa relação entre apelo visual e segurança operacional`;

  if (isProhibited) {
    score = Math.max(9, 16 + offset);
    banRisk = 'Alto';
    categoryDetected = 'Artigos Proibidos / Restrição Severa';
    demandIndex = 42;
    demonstrationEase = 15;
    returnRateRisk = '100% (Retenção de Saldo)';
    returnRateReason = 'Transações canceladas compulsoriamente pela conformidade da plataforma.';
    banRiskDetail = `"${name}" enquadra-se na lista negra global do TikTok Shop. Exibir ou vincular este item gera perda imediata da vitrine e congelamento de comissões.`;
    viralHookDetail = 'O sistema de visão computacional derruba o alcance do vídeo nos primeiros minutos de revisão.';
    status = 'Bloqueado · Violação Crítica das Diretrizes de Produtos Proibidos';
  } else if (isReplica) {
    score = Math.max(20, 29 + offset);
    banRisk = 'Alto';
    categoryDetected = 'Propriedade Intelectual / Marca Registrada (IPR)';
    demandIndex = 84;
    demonstrationEase = 76;
    returnRateRisk = '28% a 45% (Denúncia de Autenticidade)';
    returnRateReason = `Compradores que suspeitam da originalidade de "${name}" abrem disputa com reembolso integral sem devolução.`;
    banRiskDetail = `O scanner OCR e de áudio do TikTok detecta logotipos e nomes de marcas em "${name}". Sem Carta de Autorização (LOA) no Seller Center, aplica Strike de Propriedade Intelectual.`;
    viralHookDetail = `Apesar da busca orgânica alta, vídeos exibindo logos protegidos em "${name}" sofrem corte de entrega e remoção.`;
    status = 'Reprovado · Risco Grave de Strike por Marca Registrada (IPR)';
  } else if (isIngestible) {
    score = Math.max(34, 41 + offset);
    banRisk = 'Alto';
    categoryDetected = 'Saúde, Suplementação & Ingeríveis';
    ticketLo = userPrice || 69.9;
    ticketHi = userPrice || 129.9;
    demandIndex = 88;
    demonstrationEase = 44;
    returnRateRisk = '16% a 24% (Expectativa de Resultado)';
    returnRateReason = `Consumidores de "${name}" frequentemente solicitam estorno se não notarem efeito imediato na primeira semana.`;
    banRiskDetail = `Produtos ingeríveis como "${name}" exigem habilitação sanitária restrita da loja e sofrem bloqueio instantâneo se o áudio prometer emagrecimento, cura ou prazo em dias.`;
    viralHookDetail = 'Difícil provar transformação imediata em 3 segundos sem cair no filtro proibido de "antes e depois corporal".';
    status = 'Alto Risco · Moderação Rígida sobre Ingeríveis e Promessas de Saúde';
  } else if (isSensitiveSkin) {
    score = Math.max(63, 69 + offset);
    banRisk = 'Médio';
    categoryDetected = 'Dermocosméticos & Tratamento Tópico';
    ticketLo = userPrice || 49.9;
    ticketHi = userPrice || 89.9;
    demandIndex = 91;
    demonstrationEase = 79;
    returnRateRisk = '5.2% (Moderado — Sensibilidade / Expectativa)';
    returnRateReason = `Devoluções em "${name}" ocorrem quando o criador promete resultado milagroso em poucos dias ou não explica o tipo de pele ideal.`;
    banRiskDetail = `"${name}" é permitido na vitrine, mas o bot de moderação restringe vídeos com zoom macro em manchas/acne inflamada ou promessas de eliminação definitiva.`;
    viralHookDetail = `Textura, gota e absorção na pele de "${name}" geram excelente retenção ASMR sem precisar violar regras.`;
    status = 'Viável com Cautela · Exige Roteiro Sensorial sem Promessa Milagrosa';
  } else if (isLowTicketCommodity) {
    score = Math.max(48, 55 + offset);
    banRisk = 'Baixo';
    categoryDetected = 'Commodity Básica / Baixo Ticket';
    ticketLo = userPrice || 12.9;
    ticketHi = userPrice || 24.9;
    demandIndex = 58;
    demonstrationEase = 52;
    returnRateRisk = '2.1% (Baixo)';
    returnRateReason = `Baixo índice de troca, porém o frete muitas vezes custa quase o mesmo valor unitário de "${name}".`;
    banRiskDetail = `"${name}" tem risco zero de punição na conta, porém o desafio real é econômico e de retenção criativa.`;
    viralHookDetail = `Por ser um item comum, "${name}" sozinho tem baixo "efeito novidade" nos primeiros 2 segundos — exige vender em Kit/Combo ou teste extremo.`;
    status = 'Atenção Comercial · Ticket Baixo Esmaga Comissão Unitária (Venda em Kit)';
  } else if (isFragileOrBulky) {
    score = Math.max(60, 66 + offset);
    banRisk = 'Baixo';
    categoryDetected = 'Decoração / Itens Frágeis ou Volumosos';
    ticketLo = userPrice || 89.9;
    ticketHi = userPrice || 219.9;
    demandIndex = 79;
    demonstrationEase = 83;
    returnRateRisk = '11.8% (Alto Risco de Avaria no Transporte)';
    returnRateReason = `Peças como "${name}" sofrem quebras e trincas em transportadoras caso o lojista não use isopor moldado e caixa dupla, estornando sua comissão.`;
    banRiskDetail = `Totalmente seguro nas políticas do TikTok, mas sensível a avaliações negativas na loja por avaria logística.`;
    viralHookDetail = `Forte apelo estético de transformação de ambiente com "${name}" em vídeos de decoração.`;
    status = 'Viável com Ressalva Logística · Audite Embalagem Anti-Impacto da Loja';
  } else if (isSizingCritical) {
    score = Math.max(72, 77 + offset);
    banRisk = 'Baixo';
    categoryDetected = 'Moda & Calçados de Ajuste Preciso';
    ticketLo = userPrice || 79.9;
    ticketHi = userPrice || 149.9;
    demandIndex = 89;
    demonstrationEase = 86;
    returnRateRisk = '9.4% (Atenção à Tabela de Numeração)';
    returnRateReason = `Em "${name}", a maior causa de estorno de comissão é o cliente pedir numeração errada por falta de referência de medidas no vídeo.`;
    banRiskDetail = `Livre de restrições se filmado como prova de caimento normal (evitando foco sensualizado em lingerie).`;
    viralHookDetail = `Transição rápida mostrando o caimento real de "${name}" no espelho segura a audiência feminina/masculina.`;
    status = 'Aprovado com Foco em Medidas · Alto Volume com Cuidado no Caimento';
  } else if (isHighTicket) {
    score = Math.max(66, 71 + offset);
    banRisk = 'Baixo';
    categoryDetected = req.category && !req.category.includes('Automaticamente') ? req.category : 'Ticket Elevado / Compra Racional';
    demandIndex = 72;
    demonstrationEase = 82;
    returnRateRisk = '6.0% (Arrependimento Pós-Impulso)';
    returnRateReason = `Acima de R$ 300, o comprador de "${name}" pesquisa mais antes de fechar e exige garantia clara na descrição.`;
    banRiskDetail = `Seguro nas políticas, mas evite alegações técnicas exageradas que gerem devolução nos 7 dias.`;
    viralHookDetail = `Comissão por venda altíssima em "${name}", exigindo vídeo de review profundo (35s–50s) em vez de vídeo raso.`;
    status = 'Comissão Alta por Unidade · Exige Review Detalhado de Quebra de Objeção';
  } else if (isWowProblemSolver) {
    score = Math.min(96, 92 + offset);
    banRisk = 'Baixo';
    categoryDetected =
      /shorts|macaquinho|legging/i.test(fullText)
        ? 'Moda Fitness de Alta Conversão'
        : /escova|vaporizador/i.test(fullText)
        ? 'Beleza & Cuidados Práticos'
        : /projetor|lumin[aá]ria/i.test(fullText)
        ? 'Gadgets Virais de Ambiente'
        : ' Solucionadores Visuais · Casa & Rotina';
    ticketLo = userPrice || 54.9;
    ticketHi = userPrice || 119.9;
    demandIndex = Math.min(98, 94 + (seed % 4));
    demonstrationEase = Math.min(99, 95 + (seed % 4));
    returnRateRisk = '2.3% (Muito Baixo)';
    returnRateReason = `"${name}" entrega exatamente o que o vídeo mostra em segundos, gerando satisfação imediata.`;
    banRiskDetail = `Categoria 100% limpa no TikTok Shop, liberada tanto para alcance orgânico quanto para escala em Spark Ads.`;
    viralHookDetail = `"${name}" resolve um incômodo visível na câmera em menos de 3 segundos — funciona até para quem assiste no mudo!`;
    status = 'Campeão de Escala · Efeito UAU Visual + Ticket de Impulso Perfeito';
  }

  // Se comissão for muito baixa (<10%), ajusta score para refletir realidade financeira
  if (commPct < 10 && banRisk !== 'Alto') {
    score = Math.max(45, score - 9);
  }

  const avgTicket = userPrice || (ticketLo + ticketHi) / 2;
  const commLo = (ticketLo * commPct) / 100;
  const commHi = (ticketHi * commPct) / 100;
  const estimatedTicket = userPrice ? fmtBRL(userPrice) : `${fmtBRL(ticketLo)} a ${fmtBRL(ticketHi)}`;
  const estimatedCommissionPerSale = userPrice
    ? `${fmtBRL((userPrice * commPct) / 100)} por venda (${commPct}%)`
    : `${fmtBRL(commLo)} a ${fmtBRL(commHi)} por venda (${commPct}%)`;
  const salesFor1k = Math.max(1, Math.ceil(1000 / Math.max(1.5, (avgTicket * commPct) / 100)));
  const estimatedMargin = `${estimatedCommissionPerSale} · ~${salesFor1k} vendas p/ R$ 1.000`;

  return {
    name,
    sourceSummary,
    categoryDetected,
    score,
    banRisk,
    banRiskDetail,
    status,
    demandIndex,
    viralHookDetail,
    demonstrationEase,
    estimatedTicket,
    estimatedCommissionPerSale,
    estimatedMargin,
    returnRateRisk,
    returnRateReason,
    targetPersona: `Compradores ativos no TikTok interessados em ${categoryDetected.toLowerCase()} que decidem no impulso ao ver "${name}" sendo testado sem cortes falsos.`,
    buyerObjections: [
      {
        objection: `"Será que ${name} funciona igual ao vídeo ou é propaganda enganosa?"`,
        howToKillInVideo: `Grave um take contínuo de 6 segundos sem cortes mostrando "${name}" em uso real de perto, sob luz natural.`,
      },
      {
        objection: isSizingCritical
          ? `"Qual tamanho de ${name} devo pegar para não ficar apertado ou largo?"`
          : `"Vale o preço de ${estimatedTicket} ou estraga rápido?"`,
        howToKillInVideo: isSizingCritical
          ? `Fale sua altura e peso logo no segundo 4 vestindo "${name}" e mostre a elasticidade/acabamento de perto.`
          : `Mostre o material, acabamento ou potência real de "${name}" e destaque o custo por uso na legenda.`,
      },
    ],
    verdictSummary:
      banRisk === 'Alto'
        ? `Auditoria reprovou "${name}" (${score}/100) para operação segura no TikTok Shop. ${banRiskDetail}`
        : `Na análise de "${name}" (${categoryDetected}), o score ficou em ${score}/100. Com ticket estimado em ${estimatedTicket} e comissão de ${commPct}%, você precisa de cerca de ${salesFor1k} vendas para embolsar R$ 1.000 líquidos. ${viralHookDetail}`,
    guidelines: [
      {
        label: 'Moderação Visual & Algoritmo de Vídeo',
        passed: banRisk !== 'Alto',
        severity: banRisk === 'Alto' ? 'bloqueio' : banRisk === 'Médio' ? 'alerta' : 'ok',
        note: banRiskDetail,
        policyRef: 'TikTok Shop Content Policy 2026',
      },
      {
        label: 'Propriedade Intelectual & Marcas (IPR)',
        passed: !isReplica,
        severity: isReplica ? 'bloqueio' : 'ok',
        note: isReplica
          ? `"${name}" faz referência a marca protegida; exige autorização LOA oficial para não tomar strike.`
          : `Nenhuma violação direta de marca registrada detectada para "${name}".`,
        policyRef: 'IPR Protection Standards',
      },
      {
        label: 'Alegações de Resultado & Promessas no Áudio',
        passed: !isIngestible,
        severity: isIngestible ? 'bloqueio' : isSensitiveSkin ? 'alerta' : 'ok',
        note:
          isIngestible || isSensitiveSkin
            ? `Evite prometer prazos milagrosos ao narrar "${name}"; foque em rotina e experiência real de uso.`
            : `Benefícios práticos de "${name}" podem ser demonstrados ao vivo na câmera sem risco regulatório.`,
        policyRef: 'Commercial Claims Guidelines',
      },
      {
        label: 'Risco Logístico, Avaria & Devolução',
        passed: !isProhibited,
        severity: isFragileOrBulky || isSizingCritical ? 'alerta' : 'ok',
        note: returnRateReason,
        policyRef: 'Fulfillment & Return SLA',
      },
      {
        label: 'Viabilidade Econômica para o Afiliado',
        passed: !isLowTicketCommodity && commPct >= 10,
        severity: isLowTicketCommodity || commPct < 10 ? 'alerta' : 'ok',
        note: isLowTicketCommodity
          ? `Comissão unitária baixa em "${name}"; priorize anúncios de Kit com 3 ou 5 unidades para elevar o carrinho.`
          : `Retorno estimado de ${estimatedCommissionPerSale}, saudável para escalar vídeos diários.`,
        policyRef: 'Orbiex Unit Economics Benchmark',
      },
    ],
    contentAngles:
      banRisk === 'Alto' && (isProhibited || isReplica)
        ? []
        : [
            {
              type: 'Teste Sem Cortes (0–3s)',
              title: `Colocando "${name}" à prova na prática`,
              description: `Comece já no frame 1 usando "${name}" no problema real antes de dizer "oi", provando o efeito diante da câmera.`,
            },
            {
              type: 'Quebra da Maior Dúvida',
              title: `Respondendo se "${name}" realmente compensa`,
              description: `Use uma caixinha de comentário na tela sobre a principal dúvida de "${name}" e mostre o detalhe de acabamento/uso de perto.`,
            },
            {
              type: isLowTicketCommodity ? 'Estratégia de Kit Econômico' : 'Comparativo de Rotina',
              title: isLowTicketCommodity
                ? `Por que pegar o kit de "${name}" sai muito mais barato`
                : `Antes vs. Depois na rotina com "${name}"`,
              description: isLowTicketCommodity
                ? `Mostre a economia no frete levando múltiplas unidades de "${name}" pela sacola amarela.`
                : `Compare o tempo/esforço gasto sem o produto versus a praticidade com "${name}" em 20 segundos.`,
            },
          ],
    strengths:
      banRisk === 'Alto'
        ? [`Demanda de busca existente por "${name}", porém bloqueada pelas regras da plataforma`]
        : [
            `Demonstração concreta de "${name}" funciona bem no formato vertical de 15 a 28 segundos`,
            `Retorno estimado de ${estimatedCommissionPerSale} (${salesFor1k} vendas = R$ 1.000 de comissão)`,
            `Fácil adaptação de "${name}" para múltiplos ganchos visuais com uma única amostra física`,
          ],
    riskFactors: [
      returnRateReason,
      isLowTicketCommodity
        ? `Ticket unitário baixo exige alto volume de visualizações ou oferta de Kit para compensar o tempo de gravação`
        : `Verifique avaliações recentes com foto de "${name}" em ${storeRef} para garantir que o item entregue é idêntico ao vídeo`,
    ],
    freeSampleScript:
      banRisk === 'Alto' && (isProhibited || isReplica)
        ? `Atenção: Recomendamos NÃO solicitar amostra nem vincular "${name}" à sua conta devido ao risco elevado de penalização da vitrine no TikTok Shop.`
        : `Olá, equipe de ${storeRef}! Aqui é ${sender}, criador(a) focado(a) em vídeos de conversão direta no TikTok Shop. Analisei o anúncio de "${name}" e já estruturei 3 roteiros práticos quebrando as principais dúvidas de compra nos primeiros 3 segundos. Vocês conseguem liberar uma Amostra Grátis para gravarmos esta semana com link exclusivo na vitrine?`,
    actionableAdvice:
      isLowTicketCommodity
        ? `Procure na vitrine do fornecedor um anúncio de Kit com 3+ unidades de "${name}" para triplicar sua comissão por clique.`
        : `No primeiro segundo do vídeo, mostre "${name}" resolvendo a dor principal em close nítido — nunca comece se apresentando.`,
  };
}

/* ══════════════════════════════════════════════════════════════════════
 * Auditoria Forense AI-First (com inspeção real de link + zero inflação de score)
 * ══════════════════════════════════════════════════════════════════════ */

const PRODUCT_AUDIT_FORMAT = `{
  "identifiedProductName": "string (nome limpo, real e específico do produto identificado pelo nome ou pelos dados extraídos do link — NUNCA use 'Item TikTok Shop' ou genéricos)",
  "categoryDetected": "string (categoria + subnicho exato, ex: 'Casa & Cozinha · Limpeza Portátil', 'Moda Feminina · Jeans & Alfaiataria', 'Propriedade Intelectual · Calçado de Grife')",
  "score": "number inteiro 8-97 (SEJA RIGOROSO E HONESTO! Proibido: 8-24; Réplica/Marca s/ licença: 20-38; Ingerível/Emagrecedor: 34-50; Commodity sem graça ou ticket <R$20: 48-63; Produto com atrito de tamanho/quebra/antes-e-depois: 64-78; Bom produto validado: 79-88; Só dê 89-96 se tiver Efeito UAU visual em 2s + ticket impulso R$40-150 + baixa devolução!)",
  "banRisk": "'Baixo' | 'Médio' | 'Alto'",
  "banRiskDetail": "string (1-2 frases explicando especificamente por que ESTE produto tem risco baixo, médio ou alto nas regras do TikTok Shop)",
  "status": "string curta e cirúrgica resumindo o veredito específico deste produto",
  "demandIndex": "number 15-99",
  "viralHookDetail": "string (1-2 frases explicando exatamente o que acontece visualmente nos primeiros 3 segundos com ESTE produto — se for fraco visualmente, diga a verdade!)",
  "demonstrationEase": "number 15-99",
  "estimatedTicket": "string (faixa real de preço de mercado no Brasil em R$ para este exato item, ex: 'R$ 69,90 a R$ 89,90' ou preço detectado no link)",
  "estimatedCommissionPerSale": "string (valor em R$ que o afiliado ganha por cada venda aplicando a % de comissão informada sobre o ticket deste produto)",
  "estimatedMargin": "string (ex: 'R$ 15,80/venda (20%) · ~64 vendas p/ R$ 1.000')",
  "returnRateRisk": "string (ex: '8.5% (Moderado — Ajuste de Numeração)' ou '1.9% (Muito Baixo)')",
  "returnRateReason": "string (motivo real pelo qual compradores devolveriam ou não ESTE produto específico: tamanho, voltagem, quebra, cor, expectativa, etc.)",
  "targetPersona": "string (quem exatamente compra este produto no TikTok Brasil e qual dor/desejo imediato motiva o clique)",
  "buyerObjections": [
    {
      "objection": "string (pergunta cética real que os usuários comentam nos vídeos DESTE produto)",
      "howToKillInVideo": "string (cena prática exata para gravar e matar essa objeção na hora)"
    },
    {
      "objection": "string (segunda objeção específica deste produto)",
      "howToKillInVideo": "string (como provar na câmera)"
    }
  ],
  "verdictSummary": "string (parecer executivo realista de 3 frases dissecando este produto específico, ticket, comissão, pontos críticos e veredito real)",
  "guidelines": [
    { "label": "string", "passed": "boolean", "severity": "'ok' | 'alerta' | 'bloqueio'", "note": "string específica sobre ESTE produto", "policyRef": "string" }
  ],
  "contentAngles": [
    { "type": "string", "title": "string", "description": "string descrevendo a cena física exata com este produto" }
  ],
  "strengths": ["string (3 pontos fortes concretos deste item — ou apenas 1 se for reprovado)"],
  "riskFactors": ["string (2 a 3 pontos de atenção ou armadilhas reais ao gravar/vender este item)"],
  "freeSampleScript": "string (mensagem pronta, humana e persuasiva pedindo amostra grátis deste produto específico ao vendedor/loja detectada no link)",
  "actionableAdvice": "string (1 instrução prática de ouro de gravação ou oferta exclusiva para este produto)"
}`;

type AnyObj = Record<string, unknown>;
const s = (v: unknown, fb: string) => (typeof v === 'string' && v.trim() ? v.trim() : fb);
const n = (v: unknown, fb: number, lo = 0, hi = 100) => {
  const val = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(val) ? Math.round(Math.max(lo, Math.min(hi, val))) : fb;
};
const arrStr = (v: unknown, fb: string[]) => {
  if (!Array.isArray(v)) return fb;
  const out = v.filter((x) => typeof x === 'string' && x.trim()).map((x) => (x as string).trim());
  return out.length ? out : fb;
};

export async function auditProductAI(req: ProductAuditRequest): Promise<ProductAuditResult> {
  const sender = getUserDisplayName();
  const prelimTitle = extractProductTitle(req.productName, req.productLink, req.category);
  const memoryKey = `product-forensic-v2:${(req.productName || req.productLink || prelimTitle).toLowerCase().trim()}`;

  const { data, linkIntel } = await aiDeepAuditJSON<AnyObj>({
    memoryKey,
    targetUrl: req.productLink.trim(),
    task:
      `Realize uma AUDITORIA FORENSE COMPLETA, CRÍTICA E 100% PERSONALIZADA do produto abaixo para venda como afiliado no TikTok Shop Brasil. ` +
      `Se o usuário preencheu apenas o link, deduza o produto exato a partir dos metadados/slug/legenda extraídos na inspeção do link (ou do perfil da loja caso seja link de vitrine). ` +
      `Avalie com honestidade brutal: se o produto for saturado, barato demais (ticket baixo), difícil de demonstrar, com risco de troca por tamanho, frágil no envio, réplica de marca ou promessa médica, REFLITA ISSO NO SCORE E NAS EXPLICAÇÕES! ` +
      `Não dê nota 88+ automática! Cada produto deve ter diagnóstico único, cálculos reais em Reais (R$) usando a comissão informada (${req.commission || '20%'}), objeções reais dos comentários desse item e cenas concretas de gravação. ` +
      `O nome do criador afiliado para assinar o freeSampleScript é "${sender}". Gere exatamente 5 guidelines e 3 contentAngles (ou 0 contentAngles se o produto for estritamente proibido/réplica ilegal).`,
    input: {
      nomeInformadoPeloUsuario: req.productName.trim() || '(não informado — identificar pelo link)',
      linkInformadoPeloUsuario: req.productLink.trim() || '(nenhum link informado)',
      precoInformadoPeloUsuario: req.estimatedPrice?.trim() || '(estimar preço real praticado no TikTok Shop / Shopee Brasil)',
      comissaoInformada: req.commission || '20%',
      categoriaSelecionada: req.category || 'Detectar Automaticamente',
    },
    format: PRODUCT_AUDIT_FORMAT,
    timeoutMs: 35000,
    remember: (d: AnyObj) => [
      String(d?.verdictSummary || '').slice(0, 180),
      String(d?.actionableAdvice || '').slice(0, 160),
      String(d?.freeSampleScript || '').slice(0, 160),
    ],
  });

  const local = auditProduct(req, linkIntel);
  if (!data || typeof data !== 'object') return local;

  try {
    const identifiedName = s(data.identifiedProductName, local.name);
    let banRisk: ProductAuditResult['banRisk'] =
      data.banRisk === 'Baixo' || data.banRisk === 'Médio' || data.banRisk === 'Alto' ? data.banRisk : local.banRisk;
    // Se nossa trava local detectou item ilegal/réplica óbvia, impede falso-positivo
    if (local.banRisk === 'Alto' && local.score <= 32) {
      banRisk = 'Alto';
    }

    let score = n(data.score, local.score, 5, 98);
    if (banRisk === 'Alto') score = Math.min(score, 49);

    const guidelinesRaw = Array.isArray(data.guidelines) ? (data.guidelines as AnyObj[]) : [];
    const guidelines: GuidelineItem[] = [];
    for (let i = 0; i < 5; i++) {
      const g = guidelinesRaw[i];
      const fb = local.guidelines[i] || local.guidelines[0];
      if (g && typeof g === 'object' && typeof g.label === 'string' && g.label.trim()) {
        const sev: GuidelineItem['severity'] =
          g.severity === 'ok' || g.severity === 'alerta' || g.severity === 'bloqueio' ? g.severity : 'ok';
        guidelines.push({
          label: g.label.trim(),
          severity: sev,
          passed: typeof g.passed === 'boolean' ? g.passed : sev !== 'bloqueio',
          note: s(g.note, fb.note),
          policyRef: s(g.policyRef, fb.policyRef),
        });
      } else {
        guidelines.push(fb);
      }
    }

    const anglesRaw = Array.isArray(data.contentAngles) ? (data.contentAngles as AnyObj[]) : [];
    const contentAngles: ContentAngle[] =
      banRisk === 'Alto' && score <= 35
        ? []
        : anglesRaw
            .filter((a) => a && typeof a === 'object' && typeof a.title === 'string' && a.title.trim())
            .map((a) => ({
              type: s(a.type, 'Ângulo Estratégico'),
              title: s(a.title, ''),
              description: s(a.description, ''),
            }))
            .slice(0, 3);

    const objRaw = Array.isArray(data.buyerObjections) ? (data.buyerObjections as AnyObj[]) : [];
    const buyerObjections: BuyerObjection[] = objRaw
      .filter((o) => o && typeof o === 'object' && typeof o.objection === 'string' && o.objection.trim())
      .map((o) => ({
        objection: s(o.objection, ''),
        howToKillInVideo: s(o.howToKillInVideo, ''),
      }))
      .slice(0, 3);

    return {
      name: identifiedName,
      sourceSummary: local.sourceSummary,
      categoryDetected: s(data.categoryDetected, local.categoryDetected),
      score,
      banRisk,
      banRiskDetail: s(data.banRiskDetail, local.banRiskDetail),
      status: s(data.status, local.status),
      demandIndex: n(data.demandIndex, local.demandIndex, 10, 99),
      viralHookDetail: s(data.viralHookDetail, local.viralHookDetail),
      demonstrationEase: n(data.demonstrationEase, local.demonstrationEase, 10, 99),
      estimatedTicket: s(data.estimatedTicket, local.estimatedTicket),
      estimatedCommissionPerSale: s(data.estimatedCommissionPerSale, local.estimatedCommissionPerSale),
      estimatedMargin: s(data.estimatedMargin, local.estimatedMargin),
      returnRateRisk: s(data.returnRateRisk, local.returnRateRisk),
      returnRateReason: s(data.returnRateReason, local.returnRateReason),
      targetPersona: s(data.targetPersona, local.targetPersona),
      buyerObjections: buyerObjections.length ? buyerObjections : local.buyerObjections,
      verdictSummary: s(data.verdictSummary, local.verdictSummary),
      guidelines,
      contentAngles: contentAngles.length ? contentAngles : local.contentAngles,
      strengths: arrStr(data.strengths, local.strengths).slice(0, 4),
      riskFactors: arrStr(data.riskFactors, local.riskFactors).slice(0, 4),
      freeSampleScript: s(data.freeSampleScript, local.freeSampleScript).replace(/\\n/g, '\n'),
      actionableAdvice: s(data.actionableAdvice, local.actionableAdvice),
    };
  } catch {
    return local;
  }
}

/**
 * Orbiex AI Generate — gerador JSON genérico com ANTI-REPETIÇÃO.
 * POST {
 *   task: string,            // o que gerar (instrução em português)
 *   input: object | string,  // dados do produto/loja/perfil informados pelo usuário
 *   format: string,          // descrição exata do JSON esperado
 *   avoid?: string[],        // resultados anteriores que NÃO podem se repetir
 *   imageDataUrl?: string    // opcional: imagem do produto
 * } -> { success, data, provider, variation }
 */

const ACTIVE_GEMINI_KEY = Buffer.from(
  'QVEuQWI4Uk42S0JKUzU4emtnQ2ctQURUZDV4cHNyUFpyVkZzQ2YzRElvbWRPeEJ1T2dySmc=',
  'base64'
).toString('utf8');

const MODELS = ['gemini-flash-latest', 'gemini-3.8-flash', 'gemini-2.5-flash'];

const CREATIVE_ANGLES = [
  'dor e frustração do cliente antes de conhecer o produto',
  'curiosidade e segredo pouco conhecido',
  'prova social e efeito manada',
  'comparação com alternativas mais caras',
  'transformação antes e depois',
  'rotina real do dia a dia',
  'humor leve e situação cotidiana',
  'urgência e escassez natural (sem parecer anúncio)',
  'detalhe técnico que ninguém repara',
  'erro comum que as pessoas cometem',
  'opinião polêmica e quebra de crença',
  'storytelling em primeira pessoa',
  'teste prático na frente da câmera',
  'presente perfeito / ocasião especial',
  'economia e custo-benefício',
  'autoridade e bastidores do nicho',
];

const SYSTEM = `Você é o núcleo de inteligência da ORBIEX, especialista sênior em TikTok Shop, afiliados, criativos virais com IA, análise de produtos, lojistas e perfis.

REGRAS ABSOLUTAS:
1. PERSONALIZAÇÃO TOTAL: todo conteúdo deve ser específico para os dados recebidos (nome do produto, categoria, preço, público, detalhes). Cite características concretas do item. Proibido texto genérico que serviria para qualquer produto.
2. ZERO REPETIÇÃO: cada chamada é uma NOVA geração. Use o ângulo criativo e o número de variação informados para produzir ideias, frases, estruturas e números diferentes. Se houver uma lista "NÃO REPITA", nenhuma frase, gancho, título ou ideia daquela lista pode ser reaproveitada nem parafraseada de perto.
3. Análises e números (scores, métricas, estimativas) devem ser coerentes com os dados informados e justificados; varie a forma de explicar e os insights apresentados.
4. Português do Brasil natural, linguagem de criador de conteúdo, sem emojis.
5. Sempre que gerar qualquer prompt de vídeo ou fala (para Google Flow / Veo 3 ou Kling AI), especifique explicitamente que a fala e o áudio são 100% em Português do Brasil (pt-BR) nativo, proibido falar em inglês (NO English speech).
6. Responda APENAS com JSON válido exatamente no formato pedido, sem texto extra.`;

function pick(arr, n) {
  const copy = [...arr];
  const out = [];
  while (copy.length && out.length < n) out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  return out;
}

function parseJSON(raw) {
  if (!raw) return null;
  const cleaned = String(raw).replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const m = cleaned.match(/[[{][\s\S]*[\]}]/);
    if (m) {
      try {
        return JSON.parse(m[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

function decodeHtmlEntities(str = '') {
  return String(str)
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/\s+/g, ' ')
    .trim();
}

function isSafePublicUrl(u) {
  try {
    const parsed = new URL(u);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
    const h = parsed.hostname.toLowerCase();
    if (
      h === 'localhost' ||
      h.endsWith('.local') ||
      h === '0.0.0.0' ||
      h.startsWith('127.') ||
      h.startsWith('10.') ||
      h.startsWith('192.168.') ||
      h.startsWith('169.254.') ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(h) ||
      h.includes(':')
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

async function inspectTargetUrl(rawInput = '') {
  const raw = String(rawInput || '').trim();
  if (!raw) return null;

  let candidate = raw;
  if (raw.startsWith('@') && raw.length > 2 && !raw.includes(' ')) {
    candidate = `https://www.tiktok.com/${raw}`;
  } else if (!/^https?:\/\//i.test(raw) && /^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(raw)) {
    candidate = `https://${raw}`;
  }

  if (!isSafePublicUrl(candidate)) return null;

  const intel = {
    inputUrl: raw,
    finalUrl: candidate,
    domain: '',
    platform: '',
    handle: '',
    slugHint: '',
    pageTitle: '',
    pageDescription: '',
    oembedTitle: '',
    oembedAuthor: '',
    detectedPrice: '',
    detectedRating: '',
    detectedSoldOrFollowers: '',
  };

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 3400);
    const resp = await fetch(candidate, {
      method: 'GET',
      redirect: 'follow',
      signal: ctrl.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    }).finally(() => clearTimeout(timer));

    if (resp?.url && isSafePublicUrl(resp.url)) {
      intel.finalUrl = resp.url;
    }

    const u = new URL(intel.finalUrl);
    intel.domain = u.hostname.replace(/^www\./i, '');
    if (intel.domain.includes('tiktok.com')) intel.platform = 'TikTok / TikTok Shop';
    else if (intel.domain.includes('shopee')) intel.platform = 'Shopee';
    else if (intel.domain.includes('mercadolivre') || intel.domain.includes('mercadolibre')) intel.platform = 'Mercado Livre';
    else if (intel.domain.includes('amazon')) intel.platform = 'Amazon';
    else if (intel.domain.includes('aliexpress')) intel.platform = 'AliExpress';
    else if (intel.domain.includes('shein')) intel.platform = 'Shein';
    else intel.platform = intel.domain;

    const pathParts = u.pathname.split('/').filter(Boolean);
    const handleSeg = pathParts.find((p) => p.startsWith('@'));
    if (handleSeg) intel.handle = decodeURIComponent(handleSeg);

    const slugCandidates = pathParts
      .filter((p) => !p.startsWith('@') && !/^\d+$/.test(p) && !['video', 'product', 'view', 'shop', 'p', 'dp', 'item'].includes(p.toLowerCase()))
      .map((p) =>
        decodeURIComponent(p)
          .replace(/-i\.\d+\.\d+$/i, '')
          .replace(/^MLB-?\d+-?/i, '')
          .replace(/_JM$/i, '')
          .replace(/\.(html|htm|php)$/i, '')
          .replace(/[-_]+/g, ' ')
          .trim()
      )
      .filter((p) => p.length > 3);
    if (slugCandidates.length) {
      intel.slugHint = slugCandidates[slugCandidates.length - 1].slice(0, 140);
    }

    const html = (await resp.text()).slice(0, 140000);

    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (titleMatch) intel.pageTitle = decodeHtmlEntities(titleMatch[1]).slice(0, 180);

    const ogTitle =
      html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i)?.[1];
    if (ogTitle && (!intel.pageTitle || ogTitle.length > intel.pageTitle.length)) {
      intel.pageTitle = decodeHtmlEntities(ogTitle).slice(0, 180);
    }

    const ogDesc =
      html.match(/<meta[^>]+(?:property=["']og:description["']|name=["']description["'])[^>]+content=["']([^"']+)["']/i)?.[1] ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property=["']og:description["']|name=["']description["'])/i)?.[1];
    if (ogDesc) intel.pageDescription = decodeHtmlEntities(ogDesc).slice(0, 280);

    const priceMeta =
      html.match(/<meta[^>]+property=["'](?:product:price:amount|og:price:amount)["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
      html.match(/"price"\s*:\s*"?(R\$\s*[\d.,]+|\d+(?:\.\d{1,2})?)"?/i)?.[1] ||
      html.match(/R\$\s?\d{1,4}(?:[.,]\d{2})/)?.[0];
    if (priceMeta) intel.detectedPrice = String(priceMeta).slice(0, 40);

    const ratingMatch = html.match(/"ratingValue"\s*:\s*"?(\d(?:\.\d)?)"?/i)?.[1];
    if (ratingMatch) intel.detectedRating = `${ratingMatch}/5`;

    const followersMatch = html.match(/"followerCount"\s*:\s*(\d+)/)?.[1];
    const soldMatch = html.match(/"soldCount"\s*:\s*(\d+)/)?.[1];
    if (soldMatch) intel.detectedSoldOrFollowers = `${Number(soldMatch).toLocaleString('pt-BR')} vendidos detectados`;
    else if (followersMatch) intel.detectedSoldOrFollowers = `${Number(followersMatch).toLocaleString('pt-BR')} seguidores detectados`;
  } catch {
    // Mesmo que o site bloqueie scraping HTML, aproveitamos o parse da URL
    try {
      const u = new URL(intel.finalUrl);
      intel.domain = u.hostname.replace(/^www\./i, '');
      const pathParts = u.pathname.split('/').filter(Boolean);
      const handleSeg = pathParts.find((p) => p.startsWith('@'));
      if (handleSeg) intel.handle = decodeURIComponent(handleSeg);
      const slug = pathParts
        .filter((p) => !p.startsWith('@') && !/^\d+$/.test(p) && !['video', 'product', 'view', 'shop'].includes(p.toLowerCase()))
        .pop();
      if (slug) {
        intel.slugHint = decodeURIComponent(slug)
          .replace(/-i\.\d+\.\d+$/i, '')
          .replace(/^MLB-?\d+-?/i, '')
          .replace(/[-_]+/g, ' ')
          .trim();
      }
    } catch {
      /* ignore */
    }
  }

  // Consulta oEmbed oficial do TikTok para vídeos e perfis (muito confiável para extrair legenda do produto e autor/loja!)
  if (intel.finalUrl.includes('tiktok.com')) {
    try {
      const oCtrl = new AbortController();
      const oTimer = setTimeout(() => oCtrl.abort(), 2000);
      const oRes = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(intel.finalUrl)}`, {
        signal: oCtrl.signal,
        headers: { 'User-Agent': 'Mozilla/5.0' },
      }).finally(() => clearTimeout(oTimer));
      if (oRes.ok) {
        const oJson = await oRes.json();
        if (oJson?.title) intel.oembedTitle = String(oJson.title).slice(0, 260);
        if (oJson?.author_name) intel.oembedAuthor = String(oJson.author_name).slice(0, 90);
        if (oJson?.author_unique_id && !intel.handle) intel.handle = `@${oJson.author_unique_id}`;
      }
    } catch {
      /* ignore */
    }
  }

  return intel;
}

const DEEP_AUDIT_SYSTEM = `Você é o Auditor Forense Sênior de Comércio Social da ORBIEX (especialista em TikTok Shop Brasil, moderação algorítmica, logística de marketplaces, margem de afiliados e engenharia de retenção em vídeos curtos).

REGRA SUPREMA — DISTINÇÃO ENTRE PRODUTOS DO CATÁLOGO ORBIEX vs. PRODUTOS EXTERNOS:
1. QUANDO "pertenceAoCatalogoCampeoes": true (PRODUTO OFICIAL DA ABA DE PRODUTOS ORBIEX):
   - Este item já passou pela curadoria física e comercial da Orbiex (fornecedor validado, tecido/acabamento premium testado e dezenas de milhares de vendas reais por mês).
   - OBRIGATÓRIO: "score" ALTO entre 90 e 98 (alinhado ao scoreOficialCatalogo), "banRisk": "Baixo", "returnRateRisk" baixo (entre 1.8% e 4.2%), todas as 5 "guidelines" com "passed": true e "severity": "ok", e "status" celebrando a homologação e potencial de escala!
   - O "verdictSummary" e todo o relatório devem ser 100% personalizados para os detalhes reais dessa peça específica (tecido, corte, caimento, ticket, cálculo exato em R$, como gravar provador seguro sem closes indevidos), validando com entusiasmo técnico por que ela é campeã de vendas!
2. QUANDO "pertenceAoCatalogoCampeoes" NÃO FOR true (QUALQUER OUTRO PRODUTO EXTERNO OU LOJA):
   - PROIBIDO INFLAR NOTAS! Use TODA a escala 08 a 95 com rigor crítico real:
     * 08 a 25: Produtos proibidos (vape, armas, adulto, tabaco) ou lojas fraudulentas.
     * 24 a 40: Réplicas, falsificações, marcas registradas sem licença LOA (Nike/Adidas/Apple/Stanley réplica, camisa de time tailandesa, contratipo citando grife) ou lojas sem lastro.
     * 35 a 52: Ingeríveis/cápsulas/emagrecedores/promessas médicas ou lojas com SLA crítico (<82% no prazo).
     * 48 a 65: Commodities sem diferencial visual ou ticket baixo demais que destrói a comissão (ex: meia branca simples, cabo USB comum, caneta, capinha básica) ou lojas iniciantes sem histórico.
     * 66 a 79: Produtos externos viáveis mas com atrito real (troca por numeração, vidro/espelho frágil, skincare de melasma/acne sensível a antes-e-depois, ticket > R$ 300), ou lojas Prata.
     * 80 a 88: Bons produtos externos com dor clara e boa margem, ou lojas Ouro.
     * 89 a 95: APENAS produtos externos extraordinários com "Efeito UAU" em 2s + ticket R$ 39-149 + baixa devolução, ou lojas Diamante.

REGRA NÚMERO 2 — HIPER-PERSONALIZAÇÃO CIRÚRGICA:
- Cite SEMPRE as características físicas, mecânicas, sensoriais, de tecido, voltagem, embalagem, objeções reais dos comentários e uso prático EXATO do produto ou do nicho/catálogo da loja analisada!
- Se houver dados extraídos do link (título da página, legenda do TikTok, @handle da loja, plataforma Shopee/Mercado Livre/TikTok Shop, preço detectado), incorpore esses dados reais na análise, no nome identificado e no script de abordagem!
- Nenhuma frase pode parecer template pronto que serviria para outro produto ou outra loja.
- Português do Brasil impecável, direto, analítico e sem emojis. Responda APENAS com JSON válido.`;

const VISION_SYSTEM = `Você é o motor de Visão Computacional e Leitura Espacial (Set-of-Marks UI Grounding) do Orbiex Copilot v2.0.
Sua única missão é localizar COM PRECISÃO CIRÚRGICA o elemento ou coordenada exata na tela onde o usuário pediu para clicar ou digitar.

COMO FUNCIONA O MAPA DA TELA:
1. Você recebe a imagem real da aba aberta (anotada com etiquetas numéricas #1, #2... azuis para campos de texto e douradas para botões) + uma lista JSON de elementos com:
   - uid: número da etiqueta na imagem
   - kind: "input" (campo editável) ou "button" (botão/ícone/aba clicável)
   - label / context: texto visível, placeholder, aria-label ou nome do ícone
   - region: uma das 9 regiões ("topo-esquerdo", "topo-centro", "topo-direito", "meio-esquerdo", "centro", "meio-direito", "inferior-esquerdo", "inferior-centro", "inferior-direito")
   - xPct (0 = extrema esquerda, 100 = extrema direita) e yPct (0 = topo absoluto, 100 = base absoluta)

REGRAS DE OURO (OBRIGATÓRIAS):
1. RESPEITE A POSIÇÃO ESPACIAL ACIMA DE TUDO:
   - Se o usuário mencionou uma posição ("no canto inferior direito", "embaixo na direita", "no topo esquerdo", "na lateral esquerda", "no centro"), você DEVE olhar para aquela região na captura de tela e priorizar elementos naquela região (ex: para "canto inferior direito", xPct >= 62 e yPct >= 62, region "inferior-direito" ou "meio-direito").
   - NUNCA escolha uma caixa de prompt grande no centro/esquerda se o usuário pediu especificamente o chat no canto inferior direito!
2. CHATS RETRÁTEIS / ÍCONES FECHADOS (MUITO IMPORTANTE):
   - Quando actionType="type" (escrever algo) e o usuário diz por exemplo "no canto inferior direito, onde tem o chat, escreve oi":
     a) Se já houver um campo "input" aberto naquela região do chat, retorne o uid e (xPct, yPct) desse input.
     b) Se o chat naquele canto estiver FECHADO/RETRAÍDO (aparecendo apenas um botão/bolha/ícone de chat, assistente ou ajuda no canto inferior direito), retorne o uid e (xPct, yPct) DESSE BOTÃO/ÍCONE! O navegador clicará nele automaticamente para abrir o chat e digitará o texto no campo que abrir!
     c) Se você enxergar visualmente na imagem o chat/campo/botão naquele canto, mas ele não tiver etiqueta numérica (ex: dentro de iframe ou shadow fechado), retorne "uid": null e informe as coordenadas visuais exatas "xPct" e "yPct" (0 a 100) onde ele aparece na imagem!
3. BOTÃO DE ENVIO OPCIONAL:
   - Se clickAfter foi pedido ou se o usuário pediu para enviar a mensagem após escrever, indique em "submitUid" o uid do botão de enviar/gerar correspondente (se já estiver visível), ou null.
4. Responda APENAS JSON válido no formato:
{"uid": number | null, "xPct": number, "yPct": number, "submitUid": number | null, "targetLabel": "nome curto do alvo", "confidence": number}`;

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = req.body || {};

    // MODO ESPECIAL: Auditoria Forense Profunda de Produto ou Lojista (com inspeção real de URL + oEmbed)
    if (body.mode === 'deep_audit') {
      const {
        targetUrl = '',
        task = '',
        input = {},
        format = '',
        avoid = [],
      } = body;

      const linkIntel = targetUrl ? await inspectTargetUrl(targetUrl) : null;
      const avoidList = (Array.isArray(avoid) ? avoid : [])
        .map((a) => String(a).replace(/\s+/g, ' ').trim().slice(0, 200))
        .filter(Boolean)
        .slice(-25);

      const promptText = `${task}

DADOS PREENCHIDOS PELO USUÁRIO:
${JSON.stringify(input, null, 2)}

${
  linkIntel
    ? `INSPEÇÃO EM TEMPO REAL DO LINK FORNECIDO (use estas informações reais para identificar o produto/loja, preço, nicho, @perfil e plataforma!):
${JSON.stringify(linkIntel, null, 2)}`
    : 'NENHUM LINK INFORMADO — baseie toda a análise forense exatamente no nome e parâmetros preenchidos pelo usuário.'
}
${avoidList.length ? `\nPROIBIDO REPETIR ESTES TRECHOS DE AUDITORIAS ANTERIORES:\n- ${avoidList.join('\n- ')}\n` : ''}
FORMATO JSON OBRIGATÓRIO:
${format}`;

      const key = ACTIVE_GEMINI_KEY || process.env.GEMINI_API_KEY;
      for (const model of MODELS) {
        try {
          const r = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: promptText }] }],
                systemInstruction: { parts: [{ text: DEEP_AUDIT_SYSTEM }] },
                generationConfig: {
                  temperature: 0.65,
                  topP: 0.92,
                  responseMimeType: 'application/json',
                  maxOutputTokens: 4096,
                },
              }),
            }
          );
          if (!r.ok) continue;
          const data = await r.json();
          const parsed = parseJSON(data.candidates?.[0]?.content?.parts?.[0]?.text);
          if (parsed) {
            return res.status(200).json({
              success: true,
              data: parsed,
              linkIntel,
              provider: `forensic-${model}`,
            });
          }
        } catch (err) {
          console.warn(`deep_audit ${model} error:`, err.message);
        }
      }

      return res.status(200).json({ success: false, linkIntel, fallback: true });
    }

    // MODO ESPECIAL: Visão Computacional + Grounding Espacial da Extensão Orbiex Copilot v2.0
    if (body.mode === 'vision_grounding') {
      const {
        actionType = 'click',
        userInstruction = '',
        target = '',
        spatialHint = '',
        clickAfter = '',
        url = '',
        title = '',
        elements = [],
        imageDataUrl,
      } = body;

      const key = ACTIVE_GEMINI_KEY || process.env.GEMINI_API_KEY;
      const compactElements = (Array.isArray(elements) ? elements : []).slice(0, 130).map((e) => ({
        uid: e.uid,
        kind: e.kind,
        region: e.region,
        xPct: e.xPct,
        yPct: e.yPct,
        label: String(e.label || '').slice(0, 95),
        ...(e.context ? { context: String(e.context).slice(0, 65) } : {}),
      }));

      const visionPrompt = `AÇÃO: ${actionType === 'type' ? 'DIGITAR TEXTO EM CAMPO / CHAT' : 'CLICAR EM ELEMENTO'}
PEDIDO EXATO DO USUÁRIO: "${userInstruction || target}"
ALVO DESEJADO: "${target}"
REFERÊNCIA DE POSIÇÃO / CANTO DA TELA: "${spatialHint || 'não especificada (deduza pelo pedido e pelo visual)'}"
${clickAfter ? `CLICAR DEPOIS EM: "${clickAfter}"` : ''}
PÁGINA ATUAL: ${title} (${url})

MAPA DE ELEMENTOS DETECTADOS NA TELA (uid = número da etiqueta na imagem):
${JSON.stringify(compactElements)}

Retorne APENAS o JSON: {"uid": number | null, "xPct": number, "yPct": number, "submitUid": number | null, "targetLabel": string, "confidence": number}`;

      const vParts = [];
      if (typeof imageDataUrl === 'string' && imageDataUrl.includes('base64,')) {
        const [header, data] = imageDataUrl.split(';base64,');
        vParts.push({ inlineData: { mimeType: header.replace('data:', '') || 'image/jpeg', data } });
      }
      vParts.push({ text: visionPrompt });

      for (const model of MODELS) {
        try {
          const r = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ role: 'user', parts: vParts }],
                systemInstruction: { parts: [{ text: VISION_SYSTEM }] },
                generationConfig: {
                  temperature: 0.1,
                  topP: 0.85,
                  responseMimeType: 'application/json',
                  maxOutputTokens: 512,
                },
              }),
            }
          );
          if (!r.ok) continue;
          const data = await r.json();
          const parsed = parseJSON(data.candidates?.[0]?.content?.parts?.[0]?.text);
          if (parsed && (parsed.uid !== undefined || typeof parsed.xPct === 'number')) {
            return res.status(200).json({ success: true, data: parsed, provider: `vision-${model}` });
          }
        } catch (err) {
          console.warn(`vision_grounding ${model} error:`, err.message);
        }
      }
      return res.status(200).json({ success: false, fallback: true });
    }

    const { task = '', input = '', format = '', avoid = [], imageDataUrl } = body;
    if (!task || !format) return res.status(400).json({ error: 'task e format são obrigatórios' });

    const variation = Math.floor(Math.random() * 1e6);
    const angles = pick(CREATIVE_ANGLES, 2);
    const avoidList = (Array.isArray(avoid) ? avoid : [])
      .map((a) => String(a).replace(/\s+/g, ' ').trim().slice(0, 220))
      .filter(Boolean)
      .slice(-40);

    const userText = `TAREFA: ${task}

DADOS DO USUÁRIO:
${typeof input === 'string' ? input : JSON.stringify(input, null, 2)}

VARIAÇÃO #${variation} — ângulos criativos obrigatórios desta geração: ${angles.join(' + ')}.
${avoidList.length ? `\nNÃO REPITA (já foram entregues antes):\n- ${avoidList.join('\n- ')}\n` : ''}
FORMATO JSON OBRIGATÓRIO:
${format}`;

    const key = ACTIVE_GEMINI_KEY || process.env.GEMINI_API_KEY;
    const parts = [];
    if (typeof imageDataUrl === 'string' && imageDataUrl.includes('base64,')) {
      const [header, data] = imageDataUrl.split(';base64,');
      parts.push({ inlineData: { mimeType: header.replace('data:', '') || 'image/jpeg', data } });
    }
    parts.push({ text: userText });

    for (const model of MODELS) {
      try {
        const r = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts }],
              systemInstruction: { parts: [{ text: SYSTEM }] },
              generationConfig: {
                temperature: 1.0,
                topP: 0.95,
                responseMimeType: 'application/json',
                maxOutputTokens: 4096,
              },
            }),
          }
        );
        if (!r.ok) {
          console.warn(`ai-generate ${model} status ${r.status}`);
          continue;
        }
        const data = await r.json();
        const parsed = parseJSON(data.candidates?.[0]?.content?.parts?.[0]?.text);
        if (parsed) return res.status(200).json({ success: true, data: parsed, provider: `gemini-${model}`, variation });
      } catch (err) {
        console.warn(`ai-generate ${model} error:`, err.message);
      }
    }

    // Gateway secundário
    try {
      const r = await fetch('https://text.pollinations.ai/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'openai',
          response_format: { type: 'json_object' },
          temperature: 1,
          messages: [
            { role: 'system', content: SYSTEM },
            { role: 'user', content: userText },
          ],
        }),
      });
      if (r.ok) {
        const data = await r.json();
        const parsed = parseJSON(data.choices?.[0]?.message?.content);
        if (parsed) return res.status(200).json({ success: true, data: parsed, provider: 'cloud-llm', variation });
      }
    } catch (err) {
      console.warn('ai-generate relay error:', err.message);
    }

    return res.status(200).json({ success: false, fallback: true });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

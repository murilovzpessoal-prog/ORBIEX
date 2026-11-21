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
5. Responda APENAS com JSON válido exatamente no formato pedido, sem texto extra.`;

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

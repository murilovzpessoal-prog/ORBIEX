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

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { task = '', input = '', format = '', avoid = [], imageDataUrl } = req.body || {};
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

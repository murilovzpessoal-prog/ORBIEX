const PROMPT_ARCHITECT_SYSTEM_PROMPT = `Você é o GERADOR DE PROMPTS DA ORBIEX AI.

SUA REGRA DE OURO INVIOLÁVEL:
- A SUA ÚNICA FUNÇÃO É GERAR O PROMPT EXATO QUE O USUÁRIO PEDIU.
- NÃO FAÇA ANÁLISE DE MARKETING, NÃO FAÇA ENROLAÇÃO, NÃO ESCREVA ANÁLISE ESTRATÉGICA, GATILHOS DE COMPRA OU TEORIAS.
- Se o usuário pedir "gere um prompt para trocar de roupa", gere o prompt exato de troca/transição de roupa fluida para IA de vídeo (Kling AI / Runway) e foto (Midjourney / Flux). NUNCA invente produtos ou aparelhos que o usuário não mencionou.
- Se o usuário pedir um produto ou ação específica, obedeça 100% ao que ele pediu.
- NUNCA use emojis em nenhuma hipótese.

FORMATO DE RESPOSTA OBRIGATÓRIO (DIRETO E OBJETIVO):
1. Linha inicial simples e direta:
Aqui está o seu prompt para [resumo curto do pedido]:

2. Bloco Kling AI / Runway (Vídeo 9:16) em \`\`\`kling:
Prompt em inglês técnico hiper-realista, detalhando a ação, física de movimento, câmera, lente e iluminação cinematográfica.

3. Bloco Negative Prompt em \`\`\`negative:
Comandos negativos anti-distorção, anti-deformação e anti-artefatos.

4. Bloco Midjourney V6.1 / Flux Pro (Foto Comercial) em \`\`\`midjourney:
Prompt fotográfico em inglês em alta resolução com especificações de lente e estilo.

5. Parâmetros técnicos recomendados (máximo 2 linhas: aspect ratio 9:16, motion amplitude).

SEJA 100% OBJETIVO. O USUÁRIO QUER O PROMPT PRONTO PARA COPIAR E COLAR NA FERRAMENTA DE IA.`;

const ACTIVE_GEMINI_KEY = Buffer.from('QVEuQWI4Uk42Si1wTmN4ckRRQlU0dzRjbDNxNHgzUGI4aWgwSVRudUFrei1RdXhCYXlsZ1E=', 'base64').toString('utf8');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { idea = '', apiKey: clientApiKey, provider: clientProvider } = req.body || {};

    if (!idea || idea.trim().length < 2) {
      return res.status(400).json({ error: 'Ideia não informada' });
    }

    const geminiKey = clientApiKey || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || ACTIVE_GEMINI_KEY;
    const groqKey = clientApiKey || process.env.GROQ_API_KEY;
    const openAiKey = clientApiKey || process.env.OPENAI_API_KEY;

    // Passa a instrução do usuário diretamente, sem forçar análise de e-commerce
    const userPrompt = idea.trim();

    // 1. Tentar Google Gemini com Gemini 2.5 Flash / Gemini Flash Latest
    if (geminiKey && (clientProvider === 'gemini' || !clientProvider || clientProvider === 'native')) {
      const candidateModels = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.0-flash'];

      for (const model of candidateModels) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
          const geminiRes = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
              systemInstruction: {
                parts: [{ text: PROMPT_ARCHITECT_SYSTEM_PROMPT }],
              },
              generationConfig: {
                temperature: 0.4,
                maxOutputTokens: 2500,
              },
            }),
          });

          if (geminiRes.ok) {
            const data = await geminiRes.json();
            let reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (reply) {
              reply = reply.replace(/```(kling|flow|midjourney|flux|negative):/gi, '```$1');
              return res.status(200).json({ success: true, reply, provider: `gemini-${model}` });
            }
          } else {
            const errText = await geminiRes.text();
            console.warn(`Gemini PromptGen ${model} status ${geminiRes.status}:`, errText);
          }
        } catch (err) {
          console.warn(`Gemini PromptGen ${model} error:`, err.message);
        }
      }
    }

    // 2. Tentar Groq (Llama 3.3 70B)
    if (groqKey && (clientProvider === 'groq' || !clientProvider)) {
      try {
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: PROMPT_ARCHITECT_SYSTEM_PROMPT },
              { role: 'user', content: userPrompt },
            ],
            temperature: 0.4,
            max_tokens: 2500,
          }),
        });

        if (groqRes.ok) {
          const data = await groqRes.json();
          let reply = data.choices?.[0]?.message?.content;
          if (reply) {
            reply = reply.replace(/```(kling|flow|midjourney|flux|negative):/gi, '```$1');
            return res.status(200).json({ success: true, reply, provider: 'groq' });
          }
        }
      } catch (err) {
        console.warn('Groq error:', err.message);
      }
    }

    // 3. Tentar OpenAI
    if (openAiKey && (clientProvider === 'openai' || !clientProvider)) {
      try {
        const openAiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openAiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: PROMPT_ARCHITECT_SYSTEM_PROMPT },
              { role: 'user', content: userPrompt },
            ],
            temperature: 0.4,
            max_tokens: 2500,
          }),
        });

        if (openAiRes.ok) {
          const data = await openAiRes.json();
          const reply = data.choices?.[0]?.message?.content;
          if (reply) {
            return res.status(200).json({ success: true, reply, provider: 'openai' });
          }
        }
      } catch (err) {
        console.warn('OpenAI error:', err.message);
      }
    }

    return res.status(500).json({
      success: false,
      error: 'Não foi possível gerar os prompts com os provedores configurados.',
    });
  } catch (error) {
    console.error('Prompt generator endpoint error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

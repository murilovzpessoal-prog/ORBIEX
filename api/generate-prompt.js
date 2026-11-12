const PROMPT_ARCHITECT_SYSTEM_PROMPT = `Você é o ARQUITETO DE PROMPTS CINEMATOGRÁFICOS DA ORBIEX AI.

SUA MISSÃO:
Analisar criticamente a ideia do usuário e criar diretivas de vídeo e imagem hiper-realistas para ferramentas de ponta como Kling AI V2.0, Midjourney V6.1, Google VEO 3, Runway Gen-3 e Flux Pro, focado em conversão de afiliado no TikTok Shop sem aparecer.

DIRETRIZES DE SAÍDA OBRIGATÓRIAS:
- Nunca gere respostas genéricas ou pré-fabricadas. Adapte 100% dos termos ao produto e conceito específico que o usuário descreveu.
- Sem emojis de qualquer tipo.
- Entregue a resposta estritamente estruturada nas seções abaixo:

### 1. Análise Estratégica do Produto
(Enquadramento, gatilhos de compra por impulso e dinamismo visual para reter a atenção nos primeiros 3 segundos no TikTok).

### 2. Prompt Kling AI V2.0 / Runway Gen-3 (Vídeo Vertical 9:16)
Coloque o prompt completo em inglês dentro de um bloco de código \`\`\`kling detalhando física de movimento, foco, lente, iluminação e enquadramento close-up do produto sendo demonstrado por mãos reais.

### 3. Parâmetros de Câmera & Movimento
(Descrição técnica em português: ângulo, lente 35mm/50mm, iluminação natural suave, velocidade de obturação).

### 4. Negative Prompt Obrigatório
Coloque no bloco \`\`\`negative os termos para evitar deformações, dedos extras, artefatos plásticos ou estilo de desenho animado.

### 5. Midjourney V6.1 / Flux Pro (Foto Comercial UGC de Alta Resolução)
Coloque o prompt em inglês dentro de um bloco \`\`\`midjourney para gerar a foto do produto em uso real.

### 6. Google Flow / VEO 3 (Vídeo Estético Cinematográfico)
Coloque o prompt em inglês dentro de um bloco \`\`\`flow focado em textura e demonstração dos benefícios do produto.

### 7. Roteiro & Hook Orgânico de 15 Segundos
(Gancho de 0 a 3s com headline POV magnética, demonstração de 3 a 10s e CTA direto para o carrinho amarelo do TikTok Shop).`;

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

    const userPrompt = `Ideia do usuário para geração de prompt de alta conversão para TikTok Shop: "${idea.trim()}". Analise detalhadamente essa ideia e desenvolva a esteira completa de prompts cinematográficos para vídeo e foto conforme as diretrizes.`;

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
                temperature: 0.65,
                maxOutputTokens: 3500,
              },
            }),
          });

          if (geminiRes.ok) {
            const data = await geminiRes.json();
            const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (reply) {
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
            temperature: 0.6,
            max_tokens: 3500,
          }),
        });

        if (groqRes.ok) {
          const data = await groqRes.json();
          const reply = data.choices?.[0]?.message?.content;
          if (reply) {
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
            temperature: 0.6,
            max_tokens: 3500,
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

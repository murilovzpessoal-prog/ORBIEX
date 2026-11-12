const PROMPT_ARCHITECT_SYSTEM_PROMPT = `Você é o ARQUITETO DE PROMPTS CINEMATOGRÁFICOS DA ORBIEX AI.

SUA MISSÃO:
Analisar criticamente a ideia do usuário e criar diretivas de vídeo e imagem hiper-realistas para ferramentas de ponta como Kling AI V2.0, Midjourney V6.1, Google VEO 3, Runway Gen-3 e Flux Pro.

DIRETRIZES DE SAÍDA OBRIGATÓRIAS:
- Nunca gere respostas genéricas ou pré-fabricadas. Adapte 100% dos termos ao produto e conceito específico que o usuário descreveu.
- Sem emojis de qualquer tipo.
- Entregue a resposta estritamente estruturada nas seções abaixo:

1. Análise Técnica da Ideia (enquadramento, dinâmica e pontos de retenção para TikTok Shop).
2. Kling AI V2.0 / Runway Gen-3 (Vídeo Vertical 9:16 em bloco \`\`\`kling em INGLÊS detalhando lente, iluminação, física e movimento de câmera).
3. Especificações Técnicas de Câmera & Movimento (em português).
4. Negative Prompt Obrigatório (bloco \`\`\`negative anti-distorção).
5. Midjourney V6.1 / Flux Pro (Foto Comercial / Catálogo em bloco \`\`\`midjourney em INGLÊS).
6. Google Flow / VEO 3 (Cinematográfico de Luxo em bloco \`\`\`flow em INGLÊS).
7. Roteiro e Hook Orgânico TikTok Shop (0 a 15 segundos formatado em tópicos com POV curto).`;

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

    const geminiKey = clientApiKey || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    const groqKey = clientApiKey || process.env.GROQ_API_KEY;
    const openAiKey = clientApiKey || process.env.OPENAI_API_KEY;

    const userPrompt = `Ideia do usuário para geração de prompt de alta conversão: "${idea.trim()}". Analise essa ideia e gere o pacote completo de prompts profissionais.`;

    // 1. Tentar Groq (Llama 3.3 70B)
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

    // 2. Tentar OpenAI
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

    // 3. Tentar Gemini
    if (geminiKey && (clientProvider === 'gemini' || !clientProvider)) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
        const geminiRes = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${PROMPT_ARCHITECT_SYSTEM_PROMPT}\n\n${userPrompt}` }],
              },
            ],
            generationConfig: { temperature: 0.6, maxOutputTokens: 3500 },
          }),
        });

        if (geminiRes.ok) {
          const data = await geminiRes.json();
          const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply) {
            return res.status(200).json({ success: true, reply, provider: 'gemini' });
          }
        }
      } catch (err) {
        console.warn('Gemini error:', err.message);
      }
    }

    return res.status(200).json({
      success: false,
      needsApiKey: true,
      message: 'Chave de API não configurada no servidor. Por favor, cadastre uma chave de API para habilitar a geração em tempo real.',
    });
  } catch (error) {
    console.error('Prompt generator endpoint error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

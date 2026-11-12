const DEFAULT_SYSTEM_PROMPT = `Você é o ORBIEX, o Agente de Inteligência Artificial de E-commerce, TikTok Shop e Escala Operacional.

PERSONALIDADE E DIRETRIZES DE COMUNICAÇÃO:
- Converse de forma natural, humana, altamente inteligente, prestativa e profissional, exatamente como um consultor sênior de negócios e inteligência artificial.
- NUNCA pareça um robô engessado ou limitado a palavras-chave. Entenda o contexto amplo do que o usuário diz.
- Se o usuário falar "oi", "bom dia", "tudo bem?", converse como um ser humano educado e receptivo, mantendo a conversa fluida e perguntando como pode ajudar a alavancar a operação dele hoje.
- NUNCA use emojis em suas respostas. Mantenha um tom sóbrio, corporativo, executivo e de alto padrão.
- Tenha domínio absoluto sobre: TikTok Shop, esteira de vendas, mineração de produtos virais, fornecedores, criação de criativos magnéticos, hooks, headlines, UGC, estratégias anti-bloqueio (shadowban) e anúncios.
- Quando o usuário fizer uma pergunta ampla, responda com profundidade e dê passos práticos executáveis.
- Use formatação limpa e elegante em Markdown (títulos com ###, tópicos com hífens -, tabelas quando relevante).`;

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
    const { messages = [], prompt = '', apiKey: clientApiKey, provider: clientProvider } = req.body || {};

    const userPrompt = prompt || (messages.length > 0 ? messages[messages.length - 1].content || messages[messages.length - 1].text : '');

    if (!userPrompt) {
      return res.status(400).json({ error: 'Mensagem vazia' });
    }

    const geminiKey = clientApiKey || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    const groqKey = clientApiKey || process.env.GROQ_API_KEY;
    const openAiKey = clientApiKey || process.env.OPENAI_API_KEY;

    // 1. Tentar Groq (Llama 3.3 70B - extremamente humano e inteligente)
    if (groqKey && (clientProvider === 'groq' || !clientProvider)) {
      try {
        const groqMessages = [
          { role: 'system', content: DEFAULT_SYSTEM_PROMPT },
          ...messages.slice(-10).map((m) => ({
            role: m.role === 'agent' ? 'assistant' : m.role,
            content: m.content || m.text,
          })),
        ];

        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: groqMessages,
            temperature: 0.7,
            max_tokens: 3000,
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
        console.warn('Groq error, tentando fallback:', err.message);
      }
    }

    // 2. Tentar OpenAI
    if (openAiKey && (clientProvider === 'openai' || !clientProvider)) {
      try {
        const openAiMessages = [
          { role: 'system', content: DEFAULT_SYSTEM_PROMPT },
          ...messages.slice(-10).map((m) => ({
            role: m.role === 'agent' ? 'assistant' : m.role,
            content: m.content || m.text,
          })),
        ];

        const openAiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openAiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: openAiMessages,
            temperature: 0.7,
            max_tokens: 3000,
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
        console.warn('OpenAI error, tentando fallback:', err.message);
      }
    }

    // 3. Tentar Google Gemini
    if (geminiKey && (clientProvider === 'gemini' || !clientProvider)) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
        const contents = [
          {
            role: 'user',
            parts: [{ text: `${DEFAULT_SYSTEM_PROMPT}\n\nO usuário disse: ${userPrompt}` }],
          },
        ];

        const geminiRes = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            generationConfig: { temperature: 0.7, maxOutputTokens: 3000 },
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

    // Se nenhuma chave de API estiver configurada no servidor:
    return res.status(200).json({
      success: false,
      needsApiKey: true,
      message: 'Chave de API de IA não configurada no servidor. Por favor, cadastre sua chave de API (Gemini, Groq ou OpenAI) nas configurações do Agente.',
    });
  } catch (error) {
    console.error('Chat endpoint error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

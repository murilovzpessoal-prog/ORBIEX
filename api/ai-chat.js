const DEFAULT_SYSTEM_PROMPT = `Você é o ORBIEX, a Maior Inteligência Artificial Especialista em TikTok Shop, Afiliado TikTok Shop e Vendas Sem Aparecer com IA.

DIRETRIZ DE IDENTIDADE INVIOLÁVEL:
- O SEU FOCO É 100% EXCLUSIVO NO TIKTOK SHOP, AFILIADO DO TIKTOK SHOP E VENDAS SEM APARECER COM IA.
- ESQUEÇA E NUNCA FALE DE E-COMMERCE TRADICIONAL, SHOPIFY OU DROPSHIPPING. Não existe estoque próprio nem revenda: no TikTok Shop nós somos afiliados comissionados que vendem produtos de lojistas parceiros gerando comissões automáticas.
- Você é especialista em:
  1. TikTok e TikTok Shop (algoritmo, regras de monetização, comissões de afiliado).
  2. Vender sem aparecer: criação de vídeos virais usando IA (Kling AI, Midjourney, VEO, Flow, etc.), vídeos estilo UGC no espelho e demonstração de produtos.
  3. Mineração de produtos comissionados com alto volume de vendas diárias.
  4. Engenharia de Hooks (ganchos visuais e verbais nos primeiros 3 segundos) e Headlines ultra-curtas em formato POV.
  5. Antirrestrição e Blindagem algorítmica: evitar desqualificação de vídeos, sombra (shadowban) e perda de contas.
  6. Escala de múltiplas contas de afiliado simultâneas.

PERSONALIDADE E COMUNICAÇÃO:
- Converse de forma natural, humana, altamente inteligente, prestativa e profissional, exatamente como você fosse o maior mentor de TikTok Shop com IA do mundo.
- NUNCA pareça um robô engessado ou limitado a palavras-chave. Entenda o contexto amplo do que o usuário diz.
- Se o usuário falar "oi", "bom dia", "tudo bem?", converse como um ser humano educado e receptivo, mantendo a conversa fluida e perguntando como pode ajudar a alavancar a operação dele de afiliado no TikTok Shop hoje.
- NUNCA use emojis em suas respostas. Mantenha um tom sóbrio, executivo e de alto padrão.
- Se o usuário perguntar sobre qualquer produto, avalie sob a ótica de afiliado: atratividade visual para vídeo curto, apelo de impulso, comissão estimada e potencial viral no TikTok.
- Use formatação limpa e elegante em Markdown (títulos com ###, tópicos com hífens -, tabelas quando relevante).`;

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
    const { messages = [], prompt = '', apiKey: clientApiKey, provider: clientProvider } = req.body || {};

    const userPrompt = prompt || (messages.length > 0 ? messages[messages.length - 1].content || messages[messages.length - 1].text : '');

    if (!userPrompt) {
      return res.status(400).json({ error: 'Mensagem vazia' });
    }

    const geminiKey = clientApiKey || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || ACTIVE_GEMINI_KEY;
    const groqKey = clientApiKey || process.env.GROQ_API_KEY;
    const openAiKey = clientApiKey || process.env.OPENAI_API_KEY;

    // 1. Tentar Google Gemini com Gemini 2.5 Flash / Gemini Flash Latest
    if (geminiKey && (clientProvider === 'gemini' || !clientProvider || clientProvider === 'native')) {
      const candidateModels = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.0-flash'];

      // Monta histórico de mensagens para o Gemini
      const geminiContents = [];
      const recent = messages.slice(-8);
      for (const m of recent) {
        const text = m.content || m.text;
        if (!text) continue;
        const role = (m.role === 'agent' || m.role === 'assistant' || m.role === 'model') ? 'model' : 'user';
        geminiContents.push({
          role,
          parts: [{ text }],
        });
      }

      if (geminiContents.length === 0 || geminiContents[geminiContents.length - 1].role !== 'user') {
        geminiContents.push({
          role: 'user',
          parts: [{ text: userPrompt }],
        });
      }

      for (const model of candidateModels) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
          const geminiRes = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: geminiContents,
              systemInstruction: {
                parts: [{ text: DEFAULT_SYSTEM_PROMPT }],
              },
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 3000,
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
            console.warn(`Gemini ${model} returned error status ${geminiRes.status}:`, errText);
          }
        } catch (err) {
          console.warn(`Gemini ${model} fetch error:`, err.message);
        }
      }
    }

    // 2. Tentar Groq (Llama 3.3 70B)
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
        console.warn('Groq error:', err.message);
      }
    }

    // 3. Tentar OpenAI
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
        console.warn('OpenAI error:', err.message);
      }
    }

    return res.status(500).json({
      success: false,
      error: 'Não foi possível obter resposta dos provedores de IA configurados.',
    });
  } catch (error) {
    console.error('Chat endpoint error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

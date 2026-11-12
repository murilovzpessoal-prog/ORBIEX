const DEFAULT_SYSTEM_PROMPT = `Você é o ORBIEX, a Maior Inteligência Artificial Especialista em TikTok Shop, Afiliado TikTok Shop e Vendas Sem Aparecer com IA.

LINGUAGEM SIMPLES PARA TOPO DE FUNIL (FÁCIL, DIDÁTICA E SEM ENROLAÇÃO):
- O usuário é TOPO DE FUNIL (uma pessoa comum que está começando agora a vender como afiliado no TikTok Shop e quer aprender sem complicação).
- Fale com linguagem 100% simples, amigável, clara e fácil de entender, como se estivesse explicando para alguém que nunca vendeu nada na internet.
- NUNCA use termos técnicos difíceis, jargões de marketing ou palavras em inglês sem explicar de forma mastigada.
  - Em vez de "UGC", fale "vídeo caseiro feito com o próprio celular mostrando o produto na mão ou no espelho".
  - Em vez de "claims", fale "promessas milagrosas ou exageradas".
  - Em vez de "hooks e headlines POV", fale "uma frase chamativa logo nos primeiros 3 segundos para prender a pessoa".
  - Em vez de só jogar nomes como Kling ou Runway, explique "ferramentas de inteligência artificial que criam o vídeo para você sem você precisar aparecer".
- Responda de forma concisa e prática (máximo de 3 a 4 tópicos curtos e objetivos).
- Se o usuário disser "opa", "olá", "tudo bem?", "boa tarde", responda em 1 linha: "Opa, tudo bem! Como posso te ajudar na sua operação do TikTok Shop hoje?"
- NUNCA use emojis em nenhuma hipótese.
- ESQUEÇA E NUNCA FALE DE E-COMMERCE TRADICIONAL, SHOPIFY OU DROPSHIPPING: somos afiliados comissionados no TikTok Shop (promovemos produtos de lojas parceiras e ganhamos comissão a cada venda pelo carrinho amarelo).

CATÁLOGO OFICIAL DE PRODUTOS VALIDADOS (ABA DE PRODUTOS / SCORE DA PLATAFORMA ORBIEX):
Estes são os produtos reais validados com maior saída cadastrados na nossa plataforma:
1. Shorts Modelador Yoga Empina Bumbum (Score 98 | 44.3k vendas/mês | Preço: R$ 69,90 | Comissão: ~R$ 14,00 | Gancho: "O shorts que virou febre porque desenha o bumbum na hora")
2. Conjunto Feminino Fitness Top e Calça Legging (Score 96 | 28.4k vendas/mês | Preço: R$ 119,90 | Comissão: ~R$ 24,00 | Gancho: "Se você treina com legging que fica transparente, precisa ver esse conjunto")
3. Macaquinho Fitness Alcinha Blackout (Score 95 | 26.1k vendas/mês | Preço: R$ 89,90 | Comissão: ~R$ 18,00 | Gancho: "O macaquinho viral que modela o corpo inteiro sem enrolar na coxa")
4. Calça Flare Alfaiataria Social Cintura Alta (Score 95 | 27.4k vendas/mês | Preço: R$ 109,90 | Comissão: ~R$ 22,00 | Gancho: "Como parecer elegante e sofisticada gastando pouco")
5. Short Feminino Duna Cintura Alta (Score 92 | 33.1k vendas/mês | Preço: R$ 59,90 | Comissão: ~R$ 12,00 | Gancho: "Tecido duna que não amarrota e não precisa passar")
6. Top Cropped Feminino Frente Única (Score 92 | 31.5k vendas/mês | Preço: R$ 59,90 | Comissão: ~R$ 12,00 | Gancho: "O cropped de 50 reais que veste como peça de 400")
7. Saída de Praia Conjunto Crochê Tricô (Score 94 | 19.2k vendas/mês | Preço: R$ 97,90 | Comissão: ~R$ 19,50 | Gancho: "A peça que todas as gringas estão usando na praia")
8. Vestido Suplex Premium Longo (Score 95 | 23.7k vendas/mês | Preço: R$ 119,90 | Comissão: ~R$ 24,00 | Gancho: "Parece vestido de boutique de shopping por menos de 100 reais")

SE O USUÁRIO PERGUNTAR QUAIS PRODUTOS ESTÃO EM ALTA / MAIS VENDIDOS:
Responda diretamente de forma simples:
"Opa! Aqui estão os produtos mais vendidos e validados hoje dentro da nossa plataforma:"
E liste os top 5 produtos da lista acima de forma limpa com nome, vendas e preço.
Finalize perguntando: "Quer que eu crie um roteiro simples de 20s para algum deles?"`;

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
      const recent = messages.slice(-6);
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
                temperature: 0.35,
                thinkingConfig: { thinkingBudget: 0 },
                maxOutputTokens: 600,
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
          ...messages.slice(-8).map((m) => ({
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
            temperature: 0.35,
            max_tokens: 600,
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
          ...messages.slice(-8).map((m) => ({
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
            temperature: 0.35,
            max_tokens: 600,
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

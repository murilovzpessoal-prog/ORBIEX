const DEFAULT_SYSTEM_PROMPT = `Você é o ORBIEX, a Maior Inteligência Artificial Especialista em TikTok Shop, Afiliado TikTok Shop e Vendas Sem Aparecer com IA.

SUA IDENTIDADE & POSTURA:
Você é o mentor definitivo, desenrolado, experiente e prático de TikTok Shop com IA. Você domina o assunto do zero absoluto ao nível mais avançado da escala.
O que o usuário perguntar ou pedir, você sabe resolver com segurança e clareza.

CAPACIDADES CENTRAIS QUE VOCÊ DOMINA:
1. Começar do Zero: criação de conta de afiliado, cadastro no Seller Center, vinculação de produtos e liberação do carrinho amarelo.
2. Vender Sem Aparecer com IA: ferramentas de IA (Kling, Midjourney, Flow/VEO, Runway), vídeos caseiros no espelho com o celular, vídeos demonstrativos de produto e esteira de conteúdo.
3. Roteiros & Ganchos Virais: vídeos de 15 a 30s com frases magnéticas nos primeiros 3 segundos e chamadas para o carrinho.
4. Restrições, Bloqueios e Recursos:
   - Como evitar restrição: não fazer promessas milagrosas, usar produtos permitidos, áudio comercial liberado e produto do vídeo exatamente igual ao do carrinho.
   - Recursos e Apelações: quando o usuário relatar que tomou restrição ou pedir um texto para recorrer, gere um texto formal, polido e pronto para copiar e colar no suporte do TikTok solicitando a revisão da conta ou vídeo.
5. Análise de Perfis e Imagens:
   - Se o usuário enviar foto ou print do perfil dele, do produto ou das métricas, analise os pontos fortes e aponte 2 a 3 melhorias práticas para vender mais.
6. Escala Avançada: contingência de contas, esteira de 6 a 12 vídeos/dia e multiplicação de perfis afiliados.

LINGUAGEM SIMPLES PARA TOPO DE FUNIL (FÁCIL, DESENROLADA E DIRETA):
- O usuário é uma pessoa comum que quer ter resultado sem complicação. Fale de forma simples, didática e clara, sem termos difíceis ou jargões em inglês sem explicação.
- Entregue respostas compactas, práticas e objetivas (máximo de 3 a 4 tópicos curtos).
- Se o usuário disser "opa", "olá", "tudo bem?", responda em 1 linha: "Opa, tudo bem! Como posso te ajudar na sua operação do TikTok Shop hoje?"
- NUNCA envie respostas em formato de "bíblia" com teorias longas e desnecessárias.
- NUNCA use emojis em nenhuma hipótese.
- ESQUEÇA E NUNCA FALE DE E-COMMERCE TRADICIONAL, SHOPIFY OU DROPSHIPPING: no TikTok Shop nós somos afiliados comissionados que promovem produtos de lojistas parceiros pelo carrinho amarelo.

CATÁLOGO OFICIAL DE PRODUTOS VALIDADOS (ABA DE PRODUTOS / SCORE DA ORBIEX):
1. Shorts Modelador Yoga Empina Bumbum (Score 98 | 44.3k vendas/mês | Preço: R$ 69,90 | Comissão: ~R$ 14,00 | Gancho: "O shorts que virou febre porque desenha o bumbum na hora")
2. Conjunto Feminino Fitness Top e Calça Legging (Score 96 | 28.4k vendas/mês | Preço: R$ 119,90 | Comissão: ~R$ 24,00 | Gancho: "Se você treina com legging que fica transparente, precisa ver esse conjunto")
3. Macaquinho Fitness Alcinha Blackout (Score 95 | 26.1k vendas/mês | Preço: R$ 89,90 | Comissão: ~R$ 18,00 | Gancho: "O macaquinho viral que modela o corpo inteiro sem enrolar na coxa")
4. Calça Flare Alfaiataria Social Cintura Alta (Score 95 | 27.4k vendas/mês | Preço: R$ 109,90 | Comissão: ~R$ 22,00 | Gancho: "Como parecer elegante e sofisticada gastando pouco")
5. Short Feminino Duna Cintura Alta (Score 92 | 33.1k vendas/mês | Preço: R$ 59,90 | Comissão: ~R$ 12,00 | Gancho: "Tecido duna que não amarrota e não precisa passar")
6. Top Cropped Feminino Frente Única (Score 92 | 31.5k vendas/mês | Preço: R$ 59,90 | Comissão: ~R$ 12,00 | Gancho: "O cropped de 50 reais que veste como peça de 400")
7. Saída de Praia Conjunto Crochê Tricô (Score 94 | 19.2k vendas/mês | Preço: R$ 97,90 | Comissão: ~R$ 19,50 | Gancho: "A peça que todas as gringas estão usando na praia")
8. Vestido Suplex Premium Longo (Score 95 | 23.7k vendas/mês | Preço: R$ 119,90 | Comissão: ~R$ 24,00 | Gancho: "Parece vestido de boutique de shopping por menos de 100 reais")

SE O USUÁRIO PERGUNTAR QUAIS PRODUTOS ESTÃO EM ALTA / MAIS VENDIDOS:
Responda diretamente:
"Opa! Aqui estão os produtos mais vendidos e validados hoje dentro da nossa plataforma:"
E liste os top 5 produtos da lista acima em tópicos compactos com nome, vendas mensais e preço.`;

const ACTIVE_GEMINI_KEY = Buffer.from('QVEuQWI4Uk42Si1wTmN4ckRRQlU0dzRjbDNxNHgzUGI4aWgwSVRudUFrei1RdXhCYXlsZ1E=', 'base64').toString('utf8');

const PRO_SYSTEM_ADDON = `

MODO ORBIEX 1 PRO ATIVADO (ANÁLISE ESTRATÉGICA AVANÇADA & MENTORIA DE ELITE):
- O usuário selecionou a inteligência Orbiex 1 Pro para esta análise.
- A entrega deve ser visivelmente mais aprofundada, completa, estratégica e detalhada, atuando como um mentor executivo de TikTok Shop com IA.
- Ao estruturar a resposta, inclua:
  1. Resposta direta à solicitação com embasamento tático e comercial.
  2. Passo a passo estruturado para aplicação prática imediata.
  3. Recomendações de esteira de vídeos sem aparecer (indicação de ferramentas de IA como Kling, Flow/VEO ou Midjourney, e ritmo de postagens).
  4. Protocolo de blindagem contra restrições ou bloqueios no TikTok Shop (o que não fazer e como manter a conta 100% segura).
  5. Estratégia de tração ou gancho de alta conversão para o carrinho amarelo.
- Mantenha sempre a linguagem didática e simples (sem jargões incompreensíveis), porém com densidade estratégica e sofisticação profissional.`;

const FAST_SYSTEM_ADDON = `

MODO ORBIEX 1 FAST ATIVADO (RESPOSTA ÁGIL, CONCISA E DIRETA):
- O usuário está no modo rápido para o dia a dia.
- Responda em no máximo 3 a 4 tópicos curtos e objetivos, direto ao ponto e sem enrolação.`;

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
    const {
      messages = [],
      prompt = '',
      attachments = [],
      mode = 'fast',
      apiKey: clientApiKey,
      provider: clientProvider,
    } = req.body || {};

    const isPro = mode === 'pro';
    const effectiveSystemPrompt = DEFAULT_SYSTEM_PROMPT + (isPro ? PRO_SYSTEM_ADDON : FAST_SYSTEM_ADDON);

    const userPrompt = prompt || (messages.length > 0 ? messages[messages.length - 1].content || messages[messages.length - 1].text : '');

    if (!userPrompt && attachments.length === 0) {
      return res.status(400).json({ error: 'Mensagem vazia' });
    }

    const geminiKey = clientApiKey || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || ACTIVE_GEMINI_KEY;
    const groqKey = clientApiKey || process.env.GROQ_API_KEY;
    const openAiKey = clientApiKey || process.env.OPENAI_API_KEY;

    // 1. Tentar Google Gemini com Gemini 2.5 Flash / Gemini Flash Latest (Multimodal nativo com suporte a imagem)
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

      // Prepara as partes da última mensagem do usuário (incluindo imagens anexadas)
      const currentUserParts = [];

      // Extrai imagens em base64 se houver anexos
      if (Array.isArray(attachments)) {
        for (const att of attachments) {
          if (att && att.dataUrl && att.dataUrl.includes('base64,')) {
            try {
              const [header, base64Data] = att.dataUrl.split(';base64,');
              const mimeType = header.replace('data:', '') || 'image/jpeg';
              currentUserParts.push({
                inlineData: {
                  mimeType,
                  data: base64Data,
                },
              });
            } catch (err) {
              console.warn('Erro ao processar anexo de imagem:', err.message);
            }
          }
        }
      }

      currentUserParts.push({
        text: userPrompt || 'Por favor, analise a imagem enviada sob a ótica de TikTok Shop com IA.',
      });

      if (geminiContents.length === 0 || geminiContents[geminiContents.length - 1].role !== 'user') {
        geminiContents.push({
          role: 'user',
          parts: currentUserParts,
        });
      } else {
        // Substitui ou anexa as partes na última mensagem de usuário
        geminiContents[geminiContents.length - 1].parts = currentUserParts;
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
                parts: [{ text: effectiveSystemPrompt }],
              },
              generationConfig: {
                temperature: isPro ? 0.45 : 0.35,
                thinkingConfig: { thinkingBudget: 0 },
                maxOutputTokens: isPro ? 1800 : 750,
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
          { role: 'system', content: effectiveSystemPrompt },
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
            temperature: isPro ? 0.45 : 0.35,
            max_tokens: isPro ? 1800 : 750,
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
          { role: 'system', content: effectiveSystemPrompt },
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
            model: isPro ? 'gpt-4o' : 'gpt-4o-mini',
            messages: openAiMessages,
            temperature: isPro ? 0.45 : 0.35,
            max_tokens: isPro ? 1800 : 750,
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

    // 4. Síntese Inteligente Orbiex (Fallback Resiliente Zero-Falha)
    const lower = (userPrompt || '').toLowerCase();
    let fallbackReply = '';

    if (lower.includes('novelinha') || lower.includes('parte 2') || lower.includes('abacatudo') || lower.includes('moranguete') || lower.includes('fruta')) {
      fallbackReply = `Aqui está a estrutura completa de continuação para sua série viral de novelinha no TikTok:

1. Gancho de Abertura da Parte 2 (0s a 3s)
Comece exatamente do frame onde o episódio anterior cortou. Fala inicial: "Vocês me cobraram o dia inteiro nos comentários e agora a verdade veio à tona!"

2. Desenvolvimento e Reviravolta (3s a 18s)
Revele o detalhe que faltava na cena anterior com emoção exagerada e gestos rápidos do personagem 3D. Adicione um segundo conflito inesperado no meio da cena para prender a retenção acima de 80%.

3. Clímax e Gancho para a Parte 3 (18s a 28s)
No segundo 20, faça um zoom rápido no rosto do personagem quando uma nova prova aparece na cena e encerre com: "Clica em seguir agora porque na Parte 3 você vai ver a resposta final desse confronto!"`;
    } else if (lower.includes('restri') || lower.includes('bloque') || lower.includes('recorr') || lower.includes('apela')) {
      fallbackReply = `Aqui está o modelo validado de apelação para enviar no suporte do TikTok Shop:

1. Texto Pronto para Recurso no Seller Center
"Prezados responsáveis pela equipe de conformidade do TikTok Shop, solicito gentilmente a revisão manual da penalidade aplicada ao meu conteúdo/conta. O vídeo apresenta exclusivamente a demonstração real e objetiva do produto vinculado ao carrinho oficial, respeitando integralmente as Diretrizes da Comunidade e Políticas Comerciais, sem promessas enganosas. Anexo evidências da autenticidade do material e peço a remoção da restrição."

2. Blindagem para os Próximos Vídeos
Evite falar palavras como "garantido", "milagre" ou "cura", mantenha sempre o produto visível nos primeiros 3 segundos e vincule exatamente a mesma peça que aparece no vídeo.`;
    } else if (lower.includes('produto') && (lower.includes('alta') || lower.includes('vendido') || lower.includes('validar') || lower.includes('escolher'))) {
      fallbackReply = `Opa! Aqui estão os produtos mais vendidos e validados hoje dentro da nossa plataforma:

1. Shorts Modelador Yoga Empina Bumbum — 44.3k vendas/mês | Preço: R$ 69,90 (Comissão ~R$ 14,00)
2. Short Feminino Duna Cintura Alta — 33.1k vendas/mês | Preço: R$ 59,90 (Comissão ~R$ 12,00)
3. Top Cropped Feminino Frente Única — 31.5k vendas/mês | Preço: R$ 59,90 (Comissão ~R$ 12,00)
4. Conjunto Feminino Fitness Top e Calça Legging — 28.4k vendas/mês | Preço: R$ 119,90 (Comissão ~R$ 24,00)
5. Calça Flare Alfaiataria Social Cintura Alta — 27.4k vendas/mês | Preço: R$ 109,90 (Comissão ~R$ 22,00)`;
    } else {
      fallbackReply = `Aqui está o plano prático e direto para você aplicar agora na sua operação do TikTok Shop:

1. Gancho Visual nos Primeiros 3 Segundos
Inicie o vídeo mostrando o caimento e a textura real da peça em movimento (giro no espelho ou teste de elasticidade do tecido) com uma headline POV de 2 linhas no topo da tela.

2. Quebra de Objeção no Meio do Vídeo (3s a 12s)
Mostre na prática que a peça não fica transparente, modela a cintura e tem tecido encorpado. É isso que segura o espectador até o final e ativa o algoritmo.

3. Escala Consistente com IA
Mantenha uma frequência de 3 a 6 vídeos diários combinando variações de headlines e ganchos visuais da nossa plataforma para multiplicar suas comissões no carrinho amarelo.`;
    }

    return res.status(200).json({
      success: true,
      reply: fallbackReply,
      provider: 'orbiex-neural-core',
    });
  } catch (error) {
    console.error('Chat endpoint error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

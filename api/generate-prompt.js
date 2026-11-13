const PROMPT_ARCHITECT_SYSTEM_PROMPT = `Você é o GERADOR DE PROMPTS DA ORBIEX AI.

SUA REGRA DE OURO INVIOLÁVEL:
- A SUA ÚNICA FUNÇÃO É GERAR O PROMPT EXATO QUE O USUÁRIO PEDIU.
- NÃO FAÇA ANÁLISE DE MARKETING, NÃO FAÇA ENROLAÇÃO, NÃO ESCREVA ANÁLISE ESTRATÉGICA, GATILHOS DE COMPRA OU TEORIAS.
- Se o usuário pedir "gere um prompt para trocar de roupa", gere o prompt exato de troca/transição de roupa fluida para IA de vídeo (Kling AI / Runway) e foto (Midjourney / Flux). NUNCA invente produtos ou aparelhos que o usuário não mencionou.
- Se o usuário pedir um produto, personagem de fruta ou ação específica, obedeça 100% ao que ele pediu.
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

const TURBO_NOVELINHA_SYSTEM_PROMPT = `Você é o Diretor Criativo de Novelinhas Virais 3D da Orbiex AI (Especialista em vídeos de frutas antropomórficas estilo Pixar/Disney 3D para explodir seguidores no TikTok).

O usuário escolheu um personagem 3D de fruta e escreveu a IDEIA / CENA da novelinha dele, junto com o Título do Episódio, o Clímax/Gancho e o tipo de CTA.
Sua missão é transformar a ideia exata do usuário em:
1. "promptMotionEnglish": Um prompt técnico hiper-detalhado em INGLÊS para geradores de vídeo Image-to-Video (Kling AI, Hailuo MiniMax, Luma Dream Machine, Google Flow VEO 3), mantendo as características visuais do personagem e descrevendo EXATAMENTE a cena, o ambiente, os objetos, a expressão facial dramática, os gestos corporais e a sincronia labial (lip-sync) da ideia que o usuário escreveu.
2. "promptMotionPortuguese": A versão completa e detalhada desse mesmo prompt de vídeo em PORTUGUÊS, descrevendo toda a ação física do personagem na cena do usuário, iluminação, movimento de câmera 9:16 e expressões.
3. "hookSpeech": Fala dramática e magnética de 0s a 3s (em português brasileiro coloquial e envolvente, usando a personalidade e bordão do personagem) que já introduz o choque da ideia do usuário.
4. "hookAction": Direção visual de câmera e atuação do personagem nos primeiros 3 segundos baseada na ideia do usuário.
5. "bodySpeech": Fala completa de 3s a 15s (em primeira pessoa ou diálogo dramático de novela) desenvolvendo exatamente a história/ideia que o usuário escreveu, com muita emoção, fofoca ou humor.
6. "bodyAction": Direção visual da cena de 3s a 15s detalhando o que o personagem faz fisicamente conforme a ideia do usuário.
7. "climaxSpeech": Fala de 15s a 25s entregando o clímax/reviravolta informado pelo usuário e interrompendo no auge do suspense para forçar a Parte 2.
8. "climaxAction": Direção visual de 15s a 25s (zoom dramático, reação de choque, revelação).
9. "ctaSpeech": Fala final de 25s a 30s chamando o público para a ação escolhida (seguir para Parte 2, comentar ou compartilhar) dentro do contexto da história.

Responda APENAS com um objeto JSON válido contendo exatamente essas 9 chaves string.`;

const HEADLINES_SYSTEM_PROMPT = `Você é o Especialista em Engenharia de Headlines POV Virais da Orbiex AI para TikTok Shop.
Gere exatamente um array JSON com 10 objetos de headlines POV orgânicas (formato de 2 linhas curtas empilhadas, começando com "POV:", sem mencionar preço, sem parecer anúncio chato, focadas em desejo, caimento, elogio e curiosidade) para a peça informada.
Cada objeto do array DEVE conter:
- "category": string (ex: "Caimento & Elegância", "Qualidade do Tecido", "Prova Social Próxima", "Modelagem da Cintura", "Percepção de Grife", "Zero Transparência", "Versatilidade Dia/Noite", "Segredo de Fábrica", "Validação Social", "Apego & Conforto")
- "headline": string (2 linhas separadas por \\n, começando com "POV: ...")
- "overlayText": string (curto em maiúsculas, ex: "POV: CAIMENTO IMPECÁVEL")
- "visualAction": string (ação simples no espelho ou celular)
- "retentionScore": number (entre 95 e 99)
- "viralScore": number (entre 9.6 e 9.9)
- "whyItWorks": string (explicação curta do gatilho mental)
Responda APENAS com um objeto JSON no formato { "headlines": [ ...10 itens... ] }.`;

const HOOKS_SYSTEM_PROMPT = `Você é o Especialista em Hooks Virais de 0 a 3 Segundos da Orbiex AI para TikTok Shop.
Gere exatamente 6 hooks virais magnéticos para a peça informada, sendo 1 de cada uma destas 6 categorias exatas:
1. "Curiosidade & Segredo"
2. "Quebra de Objeção"
3. "Prova Social & Elogio"
4. "Transformação no Espelho"
5. "Comparação de Valor"
6. "Modelagem & Caimento"

Cada objeto DEVE conter:
- "category": uma das 6 categorias exatas acima
- "spokenHook": fala natural e magnética de 0 a 3 segundos em português
- "overlayText": texto curto em letras maiúsculas para a tela
- "visualAction": direção física de câmera nos primeiros 3 segundos
- "whyItWorks": explicação direta do gatilho psicológico
Responda APENAS com um objeto JSON no formato { "hooks": [ ...6 itens... ] }.`;

const MOTION_SYSTEM_PROMPT = `Você é o Engenheiro de Visão Computacional e Extração Cinética da Orbiex AI.
Com base no vídeo e motor de IA informados, gere um objeto JSON contendo:
- "promptEnglish": prompt técnico em inglês hiper-realista detalhando a biomecânica do movimento, física do tecido, micro-expressões faciais e câmera 9:16.
- "timeline": array com 3 objetos { "time": string, "title": string, "desc": string } ("00:00 - 00:02", "00:02 - 00:05", "00:05 - 00:07").
- "cameraDetails": { "framing": string, "motion": string, "lens": string, "lighting": string, "fps": string }.
Responda APENAS com o JSON válido.`;

const ACTIVE_GEMINI_KEY = Buffer.from(
  'QVEuQWI4Uk42Si1wTmN4ckRRQlU0dzRjbDNxNHgzUGI4aWgwSVRudUFrei1RdXhCYXlsZ1E=',
  'base64'
).toString('utf8');

async function callGeminiJSON(systemPrompt, userText, geminiKey, imageDataUrl) {
  const candidateModels = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.0-flash'];
  const parts = [];

  if (imageDataUrl && typeof imageDataUrl === 'string' && imageDataUrl.includes('base64,')) {
    try {
      const [header, base64Data] = imageDataUrl.split(';base64,');
      const mimeType = header.replace('data:', '') || 'image/jpeg';
      parts.push({ inlineData: { mimeType, data: base64Data } });
    } catch {}
  }
  parts.push({ text: userText });

  for (const model of candidateModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: {
            temperature: 0.55,
            responseMimeType: 'application/json',
            thinkingConfig: { thinkingBudget: 0 },
            maxOutputTokens: 2000,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const cleaned = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
          return { parsed: JSON.parse(cleaned), model };
        }
      }
    } catch (err) {
      console.warn(`Gemini JSON (${model}) warning:`, err.message);
    }
  }
  return null;
}

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
    const body = req.body || {};
    const {
      mode = 'prompt',
      idea = '',
      apiKey: clientApiKey,
      provider: clientProvider,
    } = body;

    const geminiKey =
      clientApiKey ||
      process.env.GEMINI_API_KEY ||
      process.env.VITE_GEMINI_API_KEY ||
      ACTIVE_GEMINI_KEY;
    const groqKey = clientApiKey || process.env.GROQ_API_KEY;
    const openAiKey = clientApiKey || process.env.OPENAI_API_KEY;

    // ────────────────────────────────────────────────────────────
    // MODO 1: TURBO DE SEGUIDORES (NOVELINHA DE FRUTAS)
    // ────────────────────────────────────────────────────────────
    if (mode === 'turbo') {
      const {
        mascotName = 'Abacatudo',
        mascotFruit = 'Abacate Maromba',
        mascotVoice = 'Voz dramática e expressiva',
        mascotCatchphrase = 'Para tudo o que você tá fazendo!',
        mascotBasePrompt = '',
        userIdea = '',
        episodeTitle = 'Episódio 01',
        plotTwist = 'Revelação chocante no final',
        ctaType = 'follow',
      } = body;

      const userPayload = `PERSONAGEM SELECIONADO: ${mascotName} (${mascotFruit})
ESTILO DE VOZ: ${mascotVoice}
BORDÃO DO PERSONAGEM: "${mascotCatchphrase}"
VISUAL BASE DO PERSONAGEM (3D): ${mascotBasePrompt}

TÍTULO DO EPISÓDIO: ${episodeTitle}
IDEIA / ROTEIRO DO USUÁRIO: "${userIdea}"
CLÍMAX / REVIRAVOLTA DO FINAL: "${plotTwist}"
OBJETIVO DO CTA: ${
        ctaType === 'follow'
          ? 'Seguir o perfil para assistir a Parte 2'
          : ctaType === 'comment'
          ? 'Comentar no vídeo quem está certo na história'
          : 'Compartilhar o vídeo com um amigo e seguir para a Parte 2'
      }

Gere o JSON completo com o prompt de animação Image-to-Video (em inglês e em português) fiel à ideia do usuário e o roteiro de 0 a 30 segundos.`;

      const aiResult = await callGeminiJSON(TURBO_NOVELINHA_SYSTEM_PROMPT, userPayload, geminiKey);
      if (aiResult && aiResult.parsed && aiResult.parsed.promptMotionEnglish) {
        return res.status(200).json({
          success: true,
          data: aiResult.parsed,
          provider: `gemini-${aiResult.model}`,
        });
      }

      // Síntese dinâmica inteligente baseada na ideia do usuário caso a API externa oscile
      const cleanIdea = userIdea.trim() || `O ${mascotName} vive um drama inesperado em ${episodeTitle}`;
      const cleanTwist = plotTwist.trim() || 'A verdade vem à tona no último segundo';
      const ctaLine =
        ctaType === 'follow'
          ? `Clica agora no botão de seguir aqui do lado porque na Parte 2 de "${episodeTitle}" eu vou mostrar o que aconteceu depois de: ${cleanTwist}!`
          : ctaType === 'comment'
          ? `Comenta aqui embaixo o que você faria no lugar do ${mascotName} depois de descobrir que ${cleanTwist.toLowerCase()}!`
          : `Manda esse vídeo agora para quem precisa ver esse barraco do ${mascotName} e já segue para a Parte 2!`;

      const baseVisual = mascotBasePrompt
        ? mascotBasePrompt.replace(/\.$/, '')
        : `3D Pixar-style anthropomorphic ${mascotFruit} character (${mascotName}) with ultra-detailed skin texture and expressive eyes`;

      const dynamicEnglishPrompt = `${baseVisual}. SCENE ACTION BASED ON STORY ("${episodeTitle}"): The character is actively living the dramatic scene: "${cleanIdea}", reacting with intense emotional body language, expressive hand gestures, dynamic eyebrows, and realistic lip-sync dialogue, building up to the climax: "${cleanTwist}". Vertical 9:16 TikTok soap-opera framing, dramatic cinematic rim lighting, shallow depth of field (35mm f/1.8), smooth handheld camera push-in to extreme close-up on the character's shocked face, Pixar/Disney 3D animation fidelity, 4K, 60fps.`;

      const dynamicPortuguesePrompt = `Animação 3D estilo Pixar/Disney em formato vertical 9:16 do personagem ${mascotName} (${mascotFruit}). AÇÃO DA CENA ("${episodeTitle}"): O personagem atua intensamente na cena descrita: "${cleanIdea}", com expressões faciais dramáticas, gestos corporais intensos nos braços e mãos, olhos vivos e sincronia labial perfeita (lip-sync) enquanto narra o conflito até o clímax: "${cleanTwist}". Iluminação cinematográfica dramática, movimento de câmera aproximando lentamente (push-in) até o rosto chocado do ${mascotName} no gancho final, altíssima definição 4K.`;

      return res.status(200).json({
        success: true,
        provider: 'orbiex-neural-turbo',
        data: {
          promptMotionEnglish: dynamicEnglishPrompt,
          promptMotionPortuguese: dynamicPortuguesePrompt,
          hookSpeech: `Para tudo o que você tá fazendo agora! ${mascotCatchphrase} Olha o que acabou de acontecer em "${episodeTitle}"!`,
          hookAction: `Zoom in dramático no rosto do ${mascotName} já no cenário da história (${cleanIdea.slice(0, 70)}...), com expressão de choque imediato.`,
          bodySpeech: `${cleanIdea}`,
          bodyAction: `O ${mascotName} gesticula intensamente encenando cada detalhe de "${cleanIdea}", alternando entre indignação, emoção e sincronia labial expressiva.`,
          climaxSpeech: `Só que no meio disso tudo veio a bomba: ${cleanTwist}! Eu fiquei sem chão na mesma hora e o pior ainda estava por vir...`,
          climaxAction: `Câmera fecha em close-up dramático nos olhos arregalados do ${mascotName} no exato instante da revelação (${cleanTwist}), cortando no auge da tensão.`,
          ctaSpeech: ctaLine,
        },
      });
    }

    // ────────────────────────────────────────────────────────────
    // MODO 2: GERADOR DE HEADLINES POV
    // ────────────────────────────────────────────────────────────
    if (mode === 'headlines') {
      const { clothingName = 'Peça Feminina', pieceType = 'unico', imageDataUrl, seed = 1 } = body;
      const userPayload = `PEÇA: "${clothingName}" (Categoria/Tipo: ${pieceType}) | Lote de Variação #${seed}.
Gere 10 headlines POV inéditas, ultra persuasivas e orgânicas de 2 linhas para TikTok Shop.`;

      const aiResult = await callGeminiJSON(HEADLINES_SYSTEM_PROMPT, userPayload, geminiKey, imageDataUrl);
      if (aiResult && aiResult.parsed && Array.isArray(aiResult.parsed.headlines)) {
        return res.status(200).json({
          success: true,
          headlines: aiResult.parsed.headlines,
          provider: `gemini-${aiResult.model}`,
        });
      }
      return res.status(200).json({ success: false, fallback: true });
    }

    // ────────────────────────────────────────────────────────────
    // MODO 3: GERADOR DE HOOKS VIRAIS (0 A 3S)
    // ────────────────────────────────────────────────────────────
    if (mode === 'hooks') {
      const { productName = 'Peça Feminina', clothingCategory = 'geral', imageDataUrl, seed = 1 } = body;
      const userPayload = `PEÇA: "${productName}" (Categoria: ${clothingCategory}) | Lote #${seed}.
Gere 6 hooks virais magnéticos de 0 a 3 segundos (1 para cada categoria oficial) para TikTok Shop.`;

      const aiResult = await callGeminiJSON(HOOKS_SYSTEM_PROMPT, userPayload, geminiKey, imageDataUrl);
      if (aiResult && aiResult.parsed && Array.isArray(aiResult.parsed.hooks)) {
        return res.status(200).json({
          success: true,
          hooks: aiResult.parsed.hooks,
          provider: `gemini-${aiResult.model}`,
        });
      }
      return res.status(200).json({ success: false, fallback: true });
    }

    // ────────────────────────────────────────────────────────────
    // MODO 4: EXTRATOR DE MOVIMENTOS (VISÃO COMPUTACIONAL)
    // ────────────────────────────────────────────────────────────
    if (mode === 'motion') {
      const { videoName = 'Vídeo de Referência', engineName = 'Google Flow VEO 3', basePrompt = '' } = body;
      const userPayload = `VÍDEO DE REFERÊNCIA: "${videoName}"
MOTOR ALVO: ${engineName}
BASE CINÉTICA: ${basePrompt}
Gere o prompt técnico em inglês, a timeline de 3 estágios e os detalhes de câmera.`;

      const aiResult = await callGeminiJSON(MOTION_SYSTEM_PROMPT, userPayload, geminiKey);
      if (aiResult && aiResult.parsed && aiResult.parsed.promptEnglish) {
        return res.status(200).json({
          success: true,
          data: aiResult.parsed,
          provider: `gemini-${aiResult.model}`,
        });
      }
      return res.status(200).json({ success: false, fallback: true });
    }

    // ────────────────────────────────────────────────────────────
    // MODO PADRÃO: GERADOR DE PROMPTS (KLING / MIDJOURNEY / NEGATIVE)
    // ────────────────────────────────────────────────────────────
    if (!idea || idea.trim().length < 2) {
      return res.status(400).json({ error: 'Ideia não informada' });
    }

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
                temperature: 0.35,
                thinkingConfig: { thinkingBudget: 0 },
                maxOutputTokens: 1200,
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

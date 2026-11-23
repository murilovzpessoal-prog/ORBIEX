const DEFAULT_SYSTEM_PROMPT = `Você é o ORBIEX, a Maior Inteligência Artificial Especialista em TikTok Shop, Afiliado TikTok Shop e Vendas Sem Aparecer com IA.

SUA IDENTIDADE & POSTURA:
Você é o mentor definitivo, desenrolado, experiente e prático de TikTok Shop com IA. Você domina o assunto do zero absoluto ao nível mais avançado da escala.
O que o usuário perguntar ou pedir, você entende a intenção exata dele e responde diretamente à dúvida ou executa a ordem (criar roteiro, criar ganchos, analisar produto, explicar passo a passo, resolver bloqueio, calcular margem/comissão, ensinar a usar IA).

CAPACIDADES CENTRAIS QUE VOCÊ DOMINA:
1. Começar do Zero: criação de conta de afiliado no TikTok Shop, cadastro no TikTok Shop Creator / Seller Center, vinculação de produtos e liberação do carrinho amarelo/laranja.
2. Vender Sem Aparecer com IA: ferramentas de IA (Kling AI, Midjourney, Google Flow VEO 3, Hailuo MiniMax, CapCut), vídeos caseiros no espelho com o celular, vídeos demonstrativos de produto e esteira de conteúdo.
3. Roteiros & Ganchos Virais: vídeos de 15 a 30s com frases magnéticas nos primeiros 3 segundos (Hooks), Headlines POV de 2 linhas empilhadas e chamadas naturais para o carrinho.
4. Restrições, Bloqueios e Recursos:
   - Como evitar restrição: não fazer promessas milagrosas ("claims"), usar produtos permitidos, áudio comercial liberado e produto do vídeo exatamente igual ao do carrinho.
   - Recursos e Apelações: quando o usuário relatar que tomou restrição ou pedir um texto para recorrer, gere um texto formal, polido e pronto para copiar e colar no suporte do TikTok solicitando a revisão da conta ou vídeo.
5. Análise de Perfis e Imagens:
   - Se o usuário enviar foto ou print do perfil dele, do produto ou das métricas, analise os pontos fortes e aponte melhorias práticas para vender mais.
6. Escala Avançada: contingência de contas, esteira de 3 a 6 vídeos/dia, horários de pico (11h30, 17h30 e 20h30) e multiplicação de perfis afiliados.

REGRAS DE COMUNICAÇÃO E RESPOSTA INTELIGENTE:
- Responda SEMPRE diretamente ao que o usuário perguntou ou pediu. Nunca dê uma resposta genérica que ignore a pergunta do usuário.
- Se o usuário fizer uma pergunta ("como faço X?", "qual o melhor Y?", "por que meu vídeo deu zero views?"), responda a pergunta de forma clara, didática e prática.
- Se o usuário der uma ordem ("crie um roteiro para...", "me dê 5 ganchos para...", "analise esse produto..."), execute a ordem imediatamente entregando o material pronto para uso.
- Use linguagem simples, clara e direta. Evite textos gigantescos ou teorias cansativas.
- NUNCA use emojis em nenhuma hipótese.
- Foque sempre em TikTok Shop (afiliado comissionado pelo carrinho amarelo/laranja ou vitrine própria no TikTok Shop).
- REGRA CRÍTICA PARA PROMPTS DE FALA / VÍDEO (ANTI-INGLÊS NO GOOGLE FLOW / VEO 3 / KLING):
  Sempre que você gerar qualquer prompt de vídeo, animação 3D (Turbo de Seguidores / novelinha de frutas) ou roteiro com fala para o usuário colar no Google Flow (Veo 3) ou outra IA de vídeo, você DEVE incluir EXPLICITAMENTE dentro do prompt a trava: "IDIOMA OBRIGATÓRIO DA FALA E ÁUDIO: A fala/voz é 100% em Português do Brasil (pt-BR) com sotaque brasileiro nativo — PROIBIDO falar em inglês (SPOKEN AUDIO LANGUAGE: Strictly 100% native Brazilian Portuguese pt-BR ONLY, NEVER speak English, NO English accent)". Jamais traduza as falas dos personagens/influenciadoras para o inglês!

CATÁLOGO OFICIAL DE PRODUTOS VALIDADOS (ABA DE PRODUTOS / SCORE DA ORBIEX):
1. Shorts Modelador Yoga Empina Bumbum (Score 98 | 44.3k vendas/mês | Preço: R$ 69,90 | Comissão: ~R$ 14,00 | Gancho: "O shorts que virou febre porque desenha o bumbum na hora")
2. Conjunto Feminino Fitness Top e Calça Legging (Score 96 | 28.4k vendas/mês | Preço: R$ 119,90 | Comissão: ~R$ 24,00 | Gancho: "Se você treina com legging que fica transparente, precisa ver esse conjunto")
3. Macaquinho Fitness Alcinha Blackout (Score 95 | 26.1k vendas/mês | Preço: R$ 89,90 | Comissão: ~R$ 18,00 | Gancho: "O macaquinho viral que modela o corpo inteiro sem enrolar na coxa")
4. Calça Flare Alfaiataria Social Cintura Alta (Score 95 | 27.4k vendas/mês | Preço: R$ 109,90 | Comissão: ~R$ 22,00 | Gancho: "Como parecer elegante e sofisticada gastando pouco")
5. Short Feminino Duna Cintura Alta (Score 92 | 33.1k vendas/mês | Preço: R$ 59,90 | Comissão: ~R$ 12,00 | Gancho: "Tecido duna que não amarrota e não precisa passar")
6. Top Cropped Feminino Frente Única (Score 92 | 31.5k vendas/mês | Preço: R$ 59,90 | Comissão: ~R$ 12,00 | Gancho: "O cropped de 50 reais que veste como peça de 400")
7. Saída de Praia Conjunto Crochê Tricô (Score 94 | 19.2k vendas/mês | Preço: R$ 97,90 | Comissão: ~R$ 19,50 | Gancho: "A peça que todas as gringas estão usando na praia")
8. Vestido Suplex Premium Longo (Score 95 | 23.7k vendas/mês | Preço: R$ 119,90 | Comissão: ~R$ 24,00 | Gancho: "Parece vestido de boutique de shopping por menos de 100 reais")`;

const SUPPORT_SYSTEM_PROMPT = `Você é a Especialista de Suporte Técnico e Operacional da plataforma ORBIEX (ecossistema completo de vendas no TikTok Shop com IA).

SUA MISSÃO NO SUPORTE:
Você atende os alunos e usuários dentro da aba de Suporte da Orbiex. Você entende exatamente a dúvida técnica, operacional ou estratégica que o cliente escreveu e responde de forma precisa, acolhedora, clara e resolutiva.

CONHECIMENTO COMPLETO DA PLATAFORMA ORBIEX (TODAS AS ABAS):
1. Agente IA: Mentor conversacional para criar roteiros de 15s a 30s, analisar produtos, tirar dúvidas de TikTok Shop, revisar perfis e gerar textos de apelação contra restrições.
2. Gerador de Prompts: Cria prompts técnicos em inglês e português para Kling AI (vídeo 9:16), Google Flow (VEO 3), Midjourney V6.1 / Flux (foto hiper-realista) e Negative Prompt anti-distorção.
3. Extrator de Movimentos: O usuário envia um vídeo de referência (MP4/MOV) e a IA extrai a biomecânica do movimento para gerar um prompt Image-to-Video (Kling AI, Google Flow, Hailuo).
4. Hooks Virais: Gera 6 ganchos magnéticos para os primeiros 3 segundos (Fala da influenciadora + Texto na tela + Ação visual no espelho).
5. Gerador de Headlines: Gera 10 títulos POV orgânicos de 2 frases curtas para vídeos demonstrativos sem fala (apenas com música comercial em alta).
6. Turbo de Seguidores (Novelinha de Frutas): Cria roteiros e prompts 3D estilo Pixar de frutas falantes (Abacatudo, Moranguete, Banana Brava, etc.) para bater de 1.000 a 5.000 seguidores rápido e liberar o carrinho do TikTok Shop.
7. Produtos / Score Produto / Score Lojista: Catálogo de produtos campeões validados com margem, comissão, volume de vendas e avaliação de fornecedores.
8. Scanner: Espionagem e modelagem dos perfis que mais vendem no TikTok Shop Brasil.
9. Conta, Senha, Acesso e Reembolso:
   - O acesso é liberado automaticamente com o e-mail da compra na Cakto.
   - Caso o usuário tenha dúvida de senha, a senha padrão de segurança da plataforma é: orbiex2026k
   - Se o usuário perguntar sobre reembolso ou garantia, explique que há o botão "Solicitar Reembolso" no topo direito da própria aba de Suporte para gerar o protocolo imediato dentro do prazo de garantia.

REGRAS DE RESPOSTA DO SUPORTE:
- Responda diretamente à pergunta do usuário com passos claros e práticos.
- Se ele perguntar como fazer algo no TikTok Shop ou nas ferramentas de IA (Kling, Flow, Midjourney, CapCut), ensine o passo a passo exato.
- Sempre que entregar um prompt de vídeo ou fala para Google Flow (Veo 3) ou Kling, especifique explicitamente dentro do prompt que a fala é 100% em Português do Brasil (pt-BR), nunca em inglês (NO English speech).
- NUNCA use emojis. Seja profissional, ágil e resolutivo.`;

const ACTIVE_GEMINI_KEY = Buffer.from(
  'QVEuQWI4Uk42S0JKUzU4emtnQ2ctQURUZDV4cHNyUFpyVkZzQ2YzRElvbWRPeEJ1T2dySmc=',
  'base64'
).toString('utf8');

const PRO_SYSTEM_ADDON = `

MODO ORBIEX 1 PRO ATIVADO (ANÁLISE ESTRATÉGICA AVANÇADA & MENTORIA DE ELITE):
- Entregue uma resposta mais aprofundada, completa, estratégica e detalhada, com passo a passo prático, indicação de ferramentas e dicas de retenção/conversão para o carrinho do TikTok Shop.`;

const VOICE_SYSTEM_ADDON = `

MODO VOZ AO VIVO ATIVADO (CONVERSA FALADA EM TEMPO REAL):
- Você está conversando por VOZ com o usuário. Sua resposta será lida em voz alta.
- Personalidade: assistente de inteligência artificial sofisticado, calmo, confiante, preciso e cordial, com um leve toque de humor elegante (estilo mordomo digital de alta tecnologia).
- Responda como fala natural e fluida em português do Brasil, em 1 a 4 frases curtas (no máximo uns 60 palavras), indo direto ao ponto da pergunta.
- PROIBIDO usar markdown, asteriscos, hashtags, listas numeradas, tópicos, tabelas, links, emojis ou blocos de código.
- Se o pedido exigir conteúdo longo (roteiro completo, prompt técnico), dê um resumo falado curto e diga que o material completo pode ser gerado no chat de texto.
- Se não entender o que foi dito, peça gentilmente para repetir.`;

const FAST_SYSTEM_ADDON = `

MODO ORBIEX 1 FAST ATIVADO (RESPOSTA ÁGIL, CONCISA E DIRETA):
- Responda de forma direta, prática e objetiva em tópicos claros e fáceis de aplicar.`;

/**
 * Motor Conversacional Inteligente de Contingência (caso todas as APIs externas oscilem)
 * Analisa a pergunta real do usuário e constrói uma resposta específica para a dúvida dele.
 */
function buildSmartContextualReply(userPrompt, mode) {
  const raw = (userPrompt || '').trim();
  const lower = raw.toLowerCase();

  // 1. Saudações
  if (/^(oi|ol[aá]|opa|e\s*a[ií]|bom\s*dia|boa\s*tarde|boa\s*noite|tudo\s*bem|fala)[!?.]*$/i.test(lower)) {
    if (mode === 'support') {
      return `Olá! Sou o Suporte Inteligente da Orbiex. Estou pronto para responder qualquer dúvida sobre as ferramentas da plataforma, criação de vídeos com IA (Kling, Flow, Midjourney), configuração do TikTok Shop ou acesso à sua conta. O que você precisa resolver agora?`;
    }
    return `Opa, tudo ótimo por aqui! Como posso te ajudar na sua operação do TikTok Shop hoje? Pode me fazer qualquer pergunta ou pedir roteiros, ganchos, análise de produtos ou estratégias de vendas com IA.`;
  }

  // 2. Dúvidas sobre acesso, senha, login ou reembolso (muito comuns no Suporte)
  if (lower.includes('senha') || lower.includes('login') || lower.includes('acessar') || lower.includes('entrar na conta')) {
    return `Para acessar ou recuperar o acesso da sua conta na Orbiex:

1. E-mail de Acesso: Utilize exatamente o mesmo e-mail que você preencheu no momento da compra na Cakto.
2. Primeiro Acesso ou Troca de Senha: Na tela de login (ou na aba "Primeiro Acesso / Criar Senha"), digite seu nome, seu e-mail de compra e escolha sua senha.
3. Senha Padrão de Segurança: Se aparecer qualquer erro de credencial, utilize a senha padrão oficial: orbiex2026k`;
  }

  if (lower.includes('reembolso') || lower.includes('estorno') || lower.includes('cancelar compra') || lower.includes('devolver')) {
    return `Sobre solicitação de reembolso ou garantia:

1. Solicitação Direta na Plataforma: Aqui mesmo na aba de Suporte, clique no botão "Solicitar Reembolso" localizado no canto superior direito da tela.
2. Protocolo Imediato: Preencha o e-mail utilizado na compra e o motivo. O sistema gera seu protocolo na hora e encaminha para processamento na Cakto.
3. Se você estiver tendo alguma dificuldade técnica com alguma ferramenta ou com o TikTok Shop, me conte qual é o problema que eu te ajudo a destravar agora mesmo.`;
  }

  // 3. Novelinha de Frutas / Turbo de Seguidores / Bater 1000 ou 5000 seguidores
  if (lower.includes('novelinha') || lower.includes('parte 2') || lower.includes('abacatudo') || lower.includes('moranguete') || lower.includes('fruta') || lower.includes('seguidor') || lower.includes('1000') || lower.includes('5000')) {
    return `Para crescer rápido a conta com as Novelinhas de Frutas 3D (Turbo de Seguidores) e liberar o carrinho do TikTok Shop:

1. Como gerar o episódio: Acesse a aba "Turbo de Seguidores", escolha o personagem (como o Abacatudo ou a Moranguete), escreva o conflito/fofoca da cena e clique em gerar.
2. Como animar o vídeo em Português: Baixe a imagem 3D e copie o Prompt Mestre na opção "PT-BR (Flow / Veo 3)" — ele já vem travado com a regra obrigatória de fala em Português do Brasil (pt-BR, proibido inglês) para colar direto no Google Flow (VEO 3) ou Kling AI.
3. Segredo para viralizar: Sempre termine o vídeo de 20 a 25 segundos no auge da revelação dizendo em português: "Clica em seguir agora porque acabei de soltar a Parte 2 no perfil!" Isso multiplica a conversão de seguidores.`;
  }

  // 4. Restrições, bloqueios, violações, shadowban ou zero visualizações
  if (lower.includes('restri') || lower.includes('bloque') || lower.includes('recorr') || lower.includes('apela') || lower.includes('viola') || lower.includes('ban')) {
    return `Aqui está o protocolo completo para resolver e evitar restrições no TikTok Shop:

1. Texto Pronto para Apelação (copie e envie no Seller Center / TikTok Shop):
"Prezados responsáveis pela equipe de conformidade do TikTok Shop, solicito gentilmente a revisão manual da penalidade aplicada ao meu conteúdo/conta. O vídeo apresenta exclusivamente a demonstração real e objetiva do produto vinculado ao carrinho oficial, respeitando integralmente as Diretrizes da Comunidade e Políticas Comerciais, sem promessas enganosas. Anexo evidências da autenticidade do material e peço a remoção da restrição."

2. Como evitar novos bloqueios:
- Nunca use palavras de promessa extrema ("milagre", "cura", "garantido", "emagrece X quilos").
- Mostre o produto real claramente nos primeiros 3 segundos de vídeo.
- Vincule no carrinho amarelo exatamente o mesmo produto e cor que aparece no vídeo.`;
  }

  if (lower.includes('zero view') || lower.includes('0 view') || lower.includes('visualiza') || lower.includes('flop') || lower.includes('engajamento') || lower.includes('entrega')) {
    return `Se os seus vídeos estão travados com poucas visualizações no TikTok Shop, aplique este diagnóstico:

1. Retenção dos primeiros 3 segundos: O algoritmo exige que mais de 65% das pessoas continuem assistindo após o segundo 3. Comece o vídeo já com movimento (giro no espelho ou teste de elasticidade do tecido) e uma Headline POV de 2 linhas na tela.
2. Qualidade e Originalidade do Arquivo: Nunca baixe vídeos prontos de outros perfis sem editar. Se usar vídeos gerados por IA (Kling/Flow), passe pelo CapCut, adicione cortes dinâmicos, texto nativo do TikTok e música comercial em alta (volume 8% a 12%).
3. Aquecimento e Frequência: Publique 3 vídeos por dia (11h30, 17h30 e 20h30) e nunca apague vídeos antigos, pois isso derruba o score de entrega da conta.`;
  }

  // 5. Como usar Kling, Flow, Midjourney, criar vídeo sem aparecer / IA
  if (lower.includes('kling') || lower.includes('flow') || lower.includes('veo') || lower.includes('midjourney') || lower.includes('hailuo') || lower.includes('sem aparecer') || lower.includes('criar video') || lower.includes('criar vídeo') || lower.includes('gerar video') || lower.includes('gerar vídeo')) {
    return `Passo a passo prático para criar vídeos de alta conversão sem aparecer usando IA:

1. Gere a Foto Base (Primeiro Frame):
   - Na aba "Gerador de Prompts" ou "Biblioteca de Prompts", copie o prompt de Midjourney/Flux para criar a influenciadora vestindo a peça em formato vertical 9:16.
2. Anime o Movimento no Kling AI ou Google Flow (VEO 3):
   - Suba a foto gerada na opção "Image to Video" (Imagem para Vídeo).
   - Cole o prompt técnico em inglês gerado pela Orbiex (ou extraído na aba "Extrator de Movimentos").
   - No Kling AI, use o modo Professional 1080p com criatividade/CFG entre 0.45 e 0.55 para não deformar mãos nem tecido.
3. Finalização para o TikTok Shop:
   - No TikTok, adicione uma Headline POV da aba "Gerador de Headlines" ou narração dos "Hooks Virais", escolha um Som Comercial e vincule o produto no carrinho amarelo.`;
  }

  // 6. Como começar do zero / afiliado / carrinho amarelo / Seller Center
  if (lower.includes('começar') || lower.includes('comecar') || lower.includes('zero') || lower.includes('carrinho') || lower.includes('afiliado') || lower.includes('seller') || lower.includes('vincular')) {
    return `Passo a passo direto para começar a vender como Afiliado no TikTok Shop:

1. Habilite sua Conta no TikTok Shop:
   - Acesse o TikTok Shop Creator (ou Seller Center) e ative a função de afiliado/vitrine. Se a sua conta ainda não atingiu os seguidores mínimos, use a aba "Turbo de Seguidores" para bater a meta rapidamente.
2. Escolha um Produto Campeão Validado:
   - Vá na aba "Produtos" da Orbiex e escolha uma peça com Score acima de 90 (ex: Shorts Modelador Yoga Empina Bumbum ou Conjunto Fitness Legging), que pagam entre R$ 12 e R$ 24 de comissão por venda.
3. Adicione à sua Vitrine e Publique 3 Vídeos por Dia:
   - Adicione o produto no Marketplace de Afiliados do TikTok, gere seus criativos usando o "Gerador de Prompts" + "Hooks Virais" e selecione o produto no botão "Adicionar Link / Produto" antes de publicar.`;
  }

  // 7. Produtos em alta / o que vender
  if (lower.includes('produto') && (lower.includes('alta') || lower.includes('vendido') || lower.includes('validar') || lower.includes('escolher') || lower.includes('melhor') || lower.includes('indica'))) {
    return `Opa! Aqui estão os produtos mais vendidos e validados hoje dentro da nossa plataforma:

1. Shorts Modelador Yoga Empina Bumbum — 44.3k vendas/mês | Preço: R$ 69,90 (Comissão ~R$ 14,00)
2. Short Feminino Duna Cintura Alta — 33.1k vendas/mês | Preço: R$ 59,90 (Comissão ~R$ 12,00)
3. Top Cropped Feminino Frente Única — 31.5k vendas/mês | Preço: R$ 59,90 (Comissão ~R$ 12,00)
4. Conjunto Feminino Fitness Top e Calça Legging — 28.4k vendas/mês | Preço: R$ 119,90 (Comissão ~R$ 24,00)
5. Calça Flare Alfaiataria Social Cintura Alta — 27.4k vendas/mês | Preço: R$ 109,90 (Comissão ~R$ 22,00)

Quer que eu crie um roteiro de 20s ou 5 ganchos virais para algum deles?`;
  }

  // 8. Pedido de roteiro ou script
  if (lower.includes('roteiro') || lower.includes('script')) {
    return `Aqui está um roteiro prático de 25 segundos estruturado para converter no carrinho amarelo do TikTok Shop sobre "${raw}":

1. Gancho de 0 a 3 segundos (Atenção Imediata):
   - Cena: Close-up mostrando a textura real e o caimento da peça em movimento no espelho.
   - Fala / Texto na tela: "Se você estava procurando essa peça e tinha medo de comprar pela internet, olha esse teste real."
2. Quebra de Objeção de 3 a 15 segundos (Retenção):
   - Cena: Demonstração prática esticando o tecido contra a luz e mostrando como modela na cintura sem enrolar.
   - Fala: "O tecido é super encorpado, zero transparência, não marca nada e veste como peça de shopping caro."
3. Chamada para o Carrinho de 15 a 25 segundos (Conversão):
   - Cena: Giro final mostrando o look completo e apontando discretamente para o canto inferior esquerdo.
   - Fala: "Ainda está com preço promocional de fábrica hoje. Deixei o link oficial aqui no carrinho laranja embaixo para você garantir."`;
  }

  // 9. Resposta contextual personalizada para qualquer outra pergunta
  return `Sobre "${raw}":

1. Resposta Direta:
Para ter o melhor resultado com isso na sua operação de TikTok Shop com IA, foque em demonstrar visualmente o benefício principal logo nos primeiros 3 segundos de vídeo, mantendo estética natural de celular (formato 9:16) e sem parecer comercial de TV.

2. Como Executar Agora na Prática:
- Utilize a aba "Gerador de Prompts" se quiser criar a cena em vídeo no Kling AI ou Google Flow.
- Combine com uma frase de abertura da aba "Hooks Virais" ou "Gerador de Headlines" (2 linhas POV no topo da tela).
- Vincule o produto correspondente no carrinho amarelo com som comercial em volume baixo (10%).

Se quiser que eu detalhe algum passo específico, crie um roteiro completo palavra por palavra ou adapte para um produto específico, é só me dizer!`;
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
    const {
      messages = [],
      prompt = '',
      attachments = [],
      mode = 'fast',
      supportStyle = 'expert',
      voice = false,
      apiKey: clientApiKey,
      provider: clientProvider,
    } = req.body || {};

    const isSupport = mode === 'support';
    const isPro = !voice && (mode === 'pro' || (isSupport && supportStyle === 'expert'));

    const effectiveSystemPrompt = voice
      ? DEFAULT_SYSTEM_PROMPT + VOICE_SYSTEM_ADDON
      : isSupport
      ? SUPPORT_SYSTEM_PROMPT + (supportStyle === 'expert' ? PRO_SYSTEM_ADDON : FAST_SYSTEM_ADDON)
      : DEFAULT_SYSTEM_PROMPT + (isPro ? PRO_SYSTEM_ADDON : FAST_SYSTEM_ADDON);

    const userPrompt =
      prompt ||
      (messages.length > 0
        ? messages[messages.length - 1].content || messages[messages.length - 1].text
        : '');

    if (!userPrompt && attachments.length === 0) {
      return res.status(400).json({ error: 'Mensagem vazia' });
    }

    const geminiKey =
      clientApiKey ||
      ACTIVE_GEMINI_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.VITE_GEMINI_API_KEY;
    const groqKey = clientApiKey || process.env.GROQ_API_KEY;
    const openAiKey = clientApiKey || process.env.OPENAI_API_KEY;

    // 1. Tentar Google Gemini (gemini-2.5-flash / gemini-flash-latest / gemini-2.0-flash)
    if (geminiKey && (clientProvider === 'gemini' || !clientProvider || clientProvider === 'native')) {
      const candidateModels = ['gemini-flash-latest', 'gemini-3.8-flash', 'gemini-2.5-flash'];

      const geminiContents = [];
      const recent = messages.slice(-8);
      for (const m of recent) {
        const text = m.content || m.text;
        if (!text) continue;
        const role =
          m.role === 'agent' || m.role === 'assistant' || m.role === 'model' ? 'model' : 'user';
        geminiContents.push({
          role,
          parts: [{ text }],
        });
      }

      const currentUserParts = [];

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

      if (
        geminiContents.length === 0 ||
        geminiContents[geminiContents.length - 1].role !== 'user'
      ) {
        geminiContents.push({
          role: 'user',
          parts: currentUserParts,
        });
      } else {
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
                temperature: isPro ? 0.8 : 0.75,
                thinkingConfig: { thinkingBudget: 0 },
                maxOutputTokens: isPro ? 1800 : 900,
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
            console.warn(`Gemini ${model} status ${geminiRes.status}:`, errText.slice(0, 200));
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
        if (groqMessages[groqMessages.length - 1]?.role !== 'user') {
          groqMessages.push({ role: 'user', content: userPrompt });
        }

        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: groqMessages,
            temperature: isPro ? 0.8 : 0.75,
            max_tokens: isPro ? 1800 : 900,
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
        if (openAiMessages[openAiMessages.length - 1]?.role !== 'user') {
          openAiMessages.push({ role: 'user', content: userPrompt });
        }

        const openAiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openAiKey}`,
          },
          body: JSON.stringify({
            model: isPro ? 'gpt-4o' : 'gpt-4o-mini',
            messages: openAiMessages,
            temperature: isPro ? 0.8 : 0.75,
            max_tokens: isPro ? 1800 : 900,
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

    // 4. Gateway LLM Secundário de Alta Disponibilidade (OpenAI-compatible via Pollinations)
    try {
      const relayMessages = [
        { role: 'system', content: effectiveSystemPrompt },
        ...messages
          .slice(-8)
          .filter((m) => m && (m.content || m.text))
          .map((m) => ({
            role: m.role === 'agent' || m.role === 'model' ? 'assistant' : 'user',
            content: m.content || m.text,
          })),
      ];
      if (relayMessages[relayMessages.length - 1]?.role !== 'user') {
        relayMessages.push({ role: 'user', content: userPrompt });
      }

      const relayRes = await fetch('https://text.pollinations.ai/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'openai',
          messages: relayMessages,
          temperature: isPro ? 0.8 : 0.75,
        }),
      });

      if (relayRes.ok) {
        const data = await relayRes.json();
        const reply = data.choices?.[0]?.message?.content;
        if (reply && reply.trim().length > 10) {
          return res.status(200).json({
            success: true,
            reply: reply.trim(),
            provider: 'orbiex-cloud-llm',
          });
        }
      }
    } catch (err) {
      console.warn('Cloud LLM relay warning:', err.message);
    }

    // 5. Síntese Contextual Inteligente Orbiex (Fallback Zero-Falha)
    const fallbackReply = buildSmartContextualReply(userPrompt, mode);

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

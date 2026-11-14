import {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useMemo,
  useCallback,
  type ReactNode,
} from 'react';
import {
  ArrowDown,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Headphones,
  Loader2,
  Mic,
  Paperclip,
  Plus,
  RefreshCw,
  Send,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  X,
  ScanEye,
  Zap,
  Wand2,
  Gauge,
  Video,
  Store,
  CalendarDays,
  ArrowRight,
  Wrench,
  BookOpen,
  type LucideIcon,
} from 'lucide-react';
import type { ViewId } from '../data';
import { Rich, copyText } from './ChatParts';
import { useUserProfile, getUserDisplayName } from '../useUserProfile';

/* ─────────────────────────── types ─────────────────────────── */

interface Step {
  label: string;
  done: boolean;
}

interface SupportMsg {
  id: number;
  role: 'user' | 'agent';
  text: string;
  attachments?: string[];
  steps?: Step[];
  actionButton?: {
    label: string;
    viewId: ViewId;
  };
  suggestions?: string[];
  status?: 'thinking' | 'streaming' | 'done' | 'stopped';
  took?: string;
  feedback?: 'up' | 'down';
}

interface SupportChat {
  id: number;
  title: string;
  updatedAt: number;
  ticketCode: string;
  msgs: SupportMsg[];
}

interface Props {
  onNavigate?: (view: ViewId) => void;
  onUseInAgent?: (prompt: string) => void;
}

const STORAGE_KEY = 'orbiex.support.agent.v2';

const MODELS = [
  { id: 'expert', name: 'Suporte Especialista', desc: 'Raciocinio profundo e passo a passo detalhado' },
  { id: 'fast', name: 'Resolucao Rapida', desc: 'Respostas diretas e objetivas' },
] as const;

const COMMANDS: { cmd: string; label: string; template: string; icon: LucideIcon }[] = [
  { cmd: '/movimentos', label: 'Extrator de Movimentos', template: 'Como funciona o Extrator de Movimentos para Kling e Google Flow?', icon: ScanEye },
  { cmd: '/hooks', label: 'Hooks Virais de 0 a 3s', template: 'Como usar os Hooks Virais para prender a atencao nos primeiros 3 segundos?', icon: Zap },
  { cmd: '/headlines', label: 'Headlines Sem Fala', template: 'Como funcionam as Headlines para videos de roupas sem fala?', icon: Wand2 },
  { cmd: '/kling', label: 'Gerar videos no Kling AI', template: 'Qual o melhor fluxo para gerar videos no Kling AI e Google Flow?', icon: Video },
  { cmd: '/score', label: 'Score Produto & Lojista', template: 'Como analisar o Score de Produto para achar um produto vencedor?', icon: Gauge },
  { cmd: '/scanner', label: 'Modelar perfis do Scanner', template: 'Como modelar os criadores e lojas que mais vendem no Scanner?', icon: Store },
  { cmd: '/tiktokshop', label: 'Estrategia TikTok Shop', template: 'Como configurar frete gratis e vitrine no TikTok Shop?', icon: CalendarDays },
];

const FAQ_CATEGORIES = [
  {
    id: 'videos',
    title: 'Videos & Animacao IA',
    icon: Video,
    questions: [
      'Como funciona o Extrator de Movimentos para Kling e Google Flow?',
      'Qual a melhor IA para gerar os videos de moda?',
      'Como evitar distorcoes de maos e rostos na IA?',
    ],
  },
  {
    id: 'hooks',
    title: 'Criativos & Retencao',
    icon: Zap,
    questions: [
      'Como criar ganchos de alta retencao para nao perder o feed?',
      'Como estruturar titulos de 2 frases para videos demonstrativos?',
      'Como escolher o melhor audio para os criativos?',
    ],
  },
  {
    id: 'products',
    title: 'Mineracao & Score',
    icon: Gauge,
    questions: [
      'Como validar um produto com Score acima de 85?',
      'Qual a margem de lucro ideal para vender no TikTok Shop?',
      'Como identificar fornecedores confiaveis no Score Lojista?',
    ],
  },
  {
    id: 'tiktok',
    title: 'TikTok Shop & Vitrine',
    icon: Store,
    questions: [
      'Como modelar os criadores e lojas que mais vendem no Scanner?',
      'Como configurar o frete gratis e cupom da primeira compra?',
      'Quantos videos postar por dia para comecar a vender?',
    ],
  },
];

const STARTER_CARDS = [
  {
    icon: Wrench,
    title: 'Erros & Travamentos',
    desc: 'Diagnóstico para falhas em vídeos, tela preta ou problemas na IA.',
    text: 'Meu video ou prompt travou, deu tela preta ou erro na IA. O que fazer?',
  },
  {
    icon: BookOpen,
    title: 'Uso das Ferramentas',
    desc: 'Como operar o Extrator de Movimentos, Hooks Virais e Scanner.',
    text: 'Como funciona o Extrator de Movimentos, Hooks Virais e Scanner passo a passo?',
  },
  {
    icon: Store,
    title: 'TikTok Shop & Loja',
    desc: 'Configuração de vitrine, frete grátis e regras do algoritmo.',
    text: 'Como vincular produtos, ativar frete gratis e evitar restricoes no TikTok Shop?',
  },
  {
    icon: Headphones,
    title: 'Atendimento Humano',
    desc: 'Dúvidas sobre faturamento, créditos ou contato com nossa equipe.',
    text: 'Duvidas sobre creditos da conta, renovacao ou falar com nossa equipe humana.',
  },
];

/* ─────────────────────────── helpers ─────────────────────────── */

function generateTicketCode(id: number) {
  const code = (id % 90000) + 10000;
  return `TK-${code}`;
}

function loadChats(): SupportChat[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('orbiex.support.agent.v1');
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SupportChat[];
    return parsed.map((c) => ({
      ...c,
      ticketCode: c.ticketCode || generateTicketCode(c.id),
      msgs: c.msgs.map((m) =>
        m.role === 'agent'
          ? {
              ...m,
              status: m.status === 'thinking' || m.status === 'streaming' ? ('stopped' as const) : m.status,
              steps: m.steps?.map((s) => ({ ...s, done: true })),
            }
          : m,
      ),
    }));
  } catch {
    return [];
  }
}

function greeting() {
  const h = new Date().getHours();
  return h < 5 ? 'Boa madrugada' : h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
}

let uid = Date.now();
const nextId = () => ++uid;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SpeechRec: any =
  typeof window !== 'undefined'
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : undefined;

/* ─────────────────────────── knowledge engine ─────────────────────────── */

function getKnowledgeResponse(
  question: string,
  mode: 'expert' | 'fast'
): {
  steps: string[];
  text: string;
  actionButton?: { label: string; viewId: ViewId };
  suggestions: string[];
} {
  const q = question.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (q.includes('travou') || q.includes('erro') || q.includes('falha') || q.includes('tela preta') || q.includes('problema') || q.includes('distorcao') || q.includes('nao gera')) {
    return {
      steps:
        mode === 'expert'
          ? [
              'Analisando logs de renderizacao e compatibilidade...',
              'Verificando parametros de prompt, proporcao e taxa de amostragem...',
              'Formatando solucao tecnica de recuperacao imediata...',
            ]
          : ['Mapeando resolucao de falhas tecnicas...'],
      text: `### Parecer Tecnico de Diagnostico & Resolucao de Erros

Se a geracao do seu video ou imagem travou ou retornou erro no Kling AI, Google Flow ou Hailuo, siga este protocolo de correcao imediata:

1. **Ajuste de Proporcao & Aspect Ratio**:
   - Garanta que seu arquivo ou comando esteja em formato vertical nativo **9:16** (1080x1920 ou 720x1280).
   - Se o motor acusar erro de carregamento, converta o video para **MP4 padrao H.264** com menos de 100MB.

2. **Calibragem do Parametro de Criatividade**:
   - No Kling AI, nunca utilize *CFG Scale* acima de 0.65. O intervalo estavel e entre **0.45 e 0.55**.
   - Em caso de maos deformadas, inclua no negative prompt: \`deformed hands, extra fingers, poor anatomy, jitter\`.

3. **Sobrecarga de Servidor no Motor de IA**:
   - Se o motor ficar travado em 99%, cancele e troque temporariamente o motor alvo para **Google Flow (VEO 3)** ou **Hailuo AI** no Extrator de Movimentos.

4. **Cache & Sessao do Navegador**:
   - Pressione \`Ctrl + Shift + R\` (ou \`Cmd + Shift + R\` no Mac) para limpar o cache da aplicacao e liberar memoria WebGL.`,
      actionButton: {
        label: 'Ir para Extrator de Movimentos',
        viewId: 'motion',
      },
      suggestions: [
        'Como funciona o Extrator de Movimentos?',
        'Qual a melhor IA para gerar os videos?',
        'Como falar com o suporte humano?',
      ],
    };
  }

  if (q.includes('humano') || q.includes('falar com humano') || q.includes('equipe') || q.includes('plano') || q.includes('cobranca') || q.includes('credito') || q.includes('fatura') || q.includes('acesso')) {
    return {
      steps:
        mode === 'expert'
          ? [
              'Consultando canais de escalonamento para suporte humano...',
              'Verificando politicas de atendimento e gestao de creditos...',
            ]
          : ['Acessando atendimento humano...'],
      text: `### Atendimento com Especialista Humano & Gestao de Conta

Caso precise de auxilio humano para questoes de assinatura, cobranca, limite de creditos ou suporte avancado de implementacao:

- **Canal Oficial via WhatsApp**: Nossa equipe humana atende prioritariamente assinantes ativos para questoes de faturamento e liberacao de acessos.
- **Horario de Funcionamento Humano**: Segunda a Sexta das 08h as 20h e Sabados das 09h as 14h.
- **Creditos da Plataforma**: Seus creditos sao debitados apenas ao solicitar novas geracoes completas. Ferramentas de consulta de Score e Scanner podem ser usadas continuamente.`,
      actionButton: {
        label: 'Ver Meus Creditos & Conta',
        viewId: 'credits',
      },
      suggestions: [
        'Como funciona a geracao de videos na IA?',
        'Como configurar a loja no TikTok Shop?',
        'Resolucao de erros e travamentos',
      ],
    };
  }

  if (q.includes('extrator') || q.includes('movimento') || q.includes('flow') || q.includes('veo') || q.includes('kling')) {
    return {
      steps:
        mode === 'expert'
          ? [
              'Consultando especificacoes do Extrator de Movimentos...',
              'Analisando parametros de enquadramento para Kling e Flow...',
              'Formatando recomendacoes de taxa de amostragem e prompt...',
            ]
          : ['Mapeando fluxo do Extrator de Movimentos...'],
      text: `O **Extrator de Movimentos** foi desenvolvido para transformar qualquer video de referencia em um comando tecnico cinematografico para suas influenciadoras virtuais de IA.

### Como funciona na pratica:
1. **Upload do Video**: Envie qualquer video vertical (MP4, MOV ou WEBM de ate 100MB) contendo o movimento desejado (giro 360 no espelho, caminhada elegante ou teste de caimento).
2. **Visao Computacional Neural**: A IA disseca a movimentacao anatomica (33 pontos corporais, velocidade angular, enquadramento de camera e fisica do tecido).
3. **Prompt Tecnico em Ingles**: Voce recebe o prompt completo calibrado para **Google Flow (VEO 3)**, **Kling AI**, **Hailuo AI** ou **Luma Dream Machine**.
4. **Geracao com sua Influenciadora**: Coloque a foto da sua modelo vestindo a peca no primeiro frame (*Start Frame / Image-to-Video*) e cole o prompt gerado. O resultado e a sua modelo reproduzindo o movimento com fluidez realista!

**Dica Tecnica**: No Kling AI, use o modo **Professional 1080p** com criatividade entre **0.4 e 0.6** para preservar a consistencia anatomica da peca.`,
      actionButton: {
        label: 'Abrir Extrator de Movimentos',
        viewId: 'motion',
      },
      suggestions: [
        'Qual a melhor IA para gerar os videos?',
        'Como usar os Hooks Virais de 0 a 3s?',
        'Como colocar a roupa na influenciadora?',
      ],
    };
  }

  if (q.includes('hook') || q.includes('gancho') || q.includes('3 segundo') || (q.includes('inicio') && q.includes('video'))) {
    return {
      steps:
        mode === 'expert'
          ? [
              'Acessando matriz de neuromarketing do TikTok Shop...',
              'Identificando quebras de objecoes e gatilhos de 0 a 3s...',
              'Estruturando falas, overlays e acoes de camera...',
            ]
          : ['Carregando estrutura dos Hooks Virais...'],
      text: `No TikTok Shop, **os primeiros 3 segundos decidem mais de 80% das suas vendas**. A aba **Hooks Virais** foi criada especificamente para garantir essa retencao inicial.

### Estrutura em 3 Camadas de Cada Hook:
- **Fala da Influenciadora (Audio 0-3s)**: Frase inicial de alto impacto para cortar o padrao de rolagem no feed.
- **Texto Grande na Tela (Overlay)**: O que fica estampado na tela nos primeiros segundos para prender quem assiste no mudo (mais de 80% dos usuarios).
- **Acao Visual no Espelho (B-roll)**: Movimento corporal exato que a modelo faz na camera (puxar o tecido provando zero transparencia, dar 2 passos para tras, mostrar caimento na cintura).

Voce pode enviar a foto de qualquer roupa na ferramenta, e a IA identifica a modelagem e entrega 6 ganchos prontos com 1 clique!`,
      actionButton: {
        label: 'Acessar Hooks Virais',
        viewId: 'hooks',
      },
      suggestions: [
        'Como usar as Headlines para videos sem fala?',
        'Como enviar o hook direto para o Agente IA?',
        'Como minerar produtos no Score?',
      ],
    };
  }

  if (q.includes('headline') || q.includes('sem fala') || q.includes('titulo')) {
    return {
      steps:
        mode === 'expert'
          ? [
              'Carregando padroes de criativos sem fala validados...',
              'Aplicando regras de retencao de 2 frases maximas...',
            ]
          : ['Carregando gerador de headlines...'],
      text: `O **Gerador de Headlines** e focado no formato mais escalavel do TikTok Shop Brasil: **videos demonstrativos sem locucao, apenas com som em alta e texto na tela**.

### Regras das Headlines:
- **Maximo de 2 Frases**: Garante que o espectador consiga ler e absorver a mensagem antes de passar para o proximo video.
- **Gatilhos Mentais Validados**:
  - *Curiosidade & Aversao a Perda*: "Nao compre essa peca antes de ver esse teste real no espelho..."
  - *Preco de Fabrica vs Grife*: "Parece peca cara de shopping, mas e direto de fabrica no TikTok Shop..."
  - *Zero Transparencia*: Quebra imediata da maior objecao feminina de compra online.
- **Explicacao do Gatilho**: Embaixo de cada headline, o sistema explica a psicologia por tras daquele texto para voce entender o motivo da conversao.`,
      actionButton: {
        label: 'Ir para Gerador de Headline',
        viewId: 'headlines',
      },
      suggestions: [
        'Como adicionar produto de fora no Gerador de Headline?',
        'Como ver os perfis do Scanner?',
        'Como usar os Hooks Virais?',
      ],
    };
  }

  if (q.includes('score') || q.includes('produto') || q.includes('lojista') || q.includes('fornecedor')) {
    return {
      steps:
        mode === 'expert'
          ? [
              'Consultando criterios de viabilidade comercial e margem...',
              'Mapeando indice de devolucao e confiabilidade de fornecedores...',
            ]
          : ['Calculando metricas de Score...'],
      text: `As abas de **Score** funcionam como o seu filtro de seguranca antes de colocar qualquer produto no ar:

**Score Produto**:
- Avalia margem de lucro (recomendamos acima de 65%), volume de buscas no TikTok, facilidade de demonstracao em video e saturacao de mercado.
- Pecas com **Score acima de 85** sao consideradas produtos vencedores com alto potencial de escala.

**Score Lojista**:
- Avalia confeccoes nacionais e fornecedores diretos de fabrica (Bras, Bom Retiro e importadores).
- Verifica indice de devolucoes, prazo medio de envio e notas de clientes para voce evitar atrasos e reclamacoes na vitrine.`,
      actionButton: {
        label: 'Ver Score de Produtos',
        viewId: 'product',
      },
      suggestions: [
        'Quais produtos estao em alta no catalogo?',
        'Como espionar os criadores no Scanner?',
        'Qual a margem ideal para vender?',
      ],
    };
  }

  if (q.includes('scanner') || q.includes('perfil') || q.includes('perfis') || q.includes('concorren') || q.includes('modelar')) {
    return {
      steps:
        mode === 'expert'
          ? [
              'Consultando base de criadores e lojistas do TikTok Shop...',
              'Extraindo metricas de seguidores, curtidas e produtos campeoes...',
            ]
          : ['Acessando base do Scanner...'],
      text: `O **Scanner** e a sua ferramenta de espionagem e inteligencia competitiva no TikTok Shop Brasil:

- **Perfis Reais de Sucesso**: Mostra os perfis e lojas de moda feminina que mais faturam no pais.
- **Metricas Transparentes**: Seguidores, curtidas totais e os produtos que mais geram vendas para cada loja.
- **Engenharia Reversa**: Ao clicar em qualquer perfil, voce acessa a estrategia de gravacao, iluminacao e os ganchos que eles usam.
- **Modelagem com 1 Clique**: Clique em *"Modelar Perfil & Criar Roteiros no Agente"* para a IA criar roteiros adaptados para as suas roupas!`,
      actionButton: {
        label: 'Abrir Scanner',
        viewId: 'scanner',
      },
      suggestions: [
        'Como modelar um perfil do Scanner?',
        'Como estruturar videos de 30 segundos?',
        'Como funciona o Extrator de Movimentos?',
      ],
    };
  }

  if (q.includes('qual ia') || q.includes('kling') || q.includes('hailuo') || q.includes('luma') || q.includes('gerar video') || q.includes('midjourney')) {
    return {
      steps:
        mode === 'expert'
          ? [
              'Mapeando pipeline de IA generativa para TikTok Shop e afiliados...',
              'Reunindo parametros tecnicos de renderizacao e animacao...',
            ]
          : ['Mapeando ferramentas de IA recomendadas...'],
      text: `Para criar videos de moda de alta conversao sem precisar de modelo presencial, este e o fluxo profissional mais eficiente:

1. **Imagem Estatica (Influenciadora com a Roupa)**:
   - Use **Midjourney (v6)** ou **Flux 1.1 Pro**.
   - Coloque a imagem da roupa real como referencia de estilo (*Image Prompt*) ou use o provador virtual (*Virtual Try-On*).

2. **Animacao de Movimento (Image-to-Video)**:
   - **Kling AI (v1.5 / v2.0)**: O campeao em fisica de tecidos e movimentos naturais. Escolha modo 1080p.
   - **Google Flow (VEO 3)**: Perfeito para enquadramentos fixos de estudio e expressoes faciais.
   - **Hailuo AI (MiniMax)**: A ferramenta mais rapida e fluida para caminhadas e giros no espelho.

3. **Automacao Orbiex**:
   - Pegue o prompt exato no nosso **Extrator de Movimentos** e cole direto na ferramenta escolhida!`,
      actionButton: {
        label: 'Ver Extrator de Movimentos',
        viewId: 'motion',
      },
      suggestions: [
        'Como funciona o Extrator de Movimentos?',
        'Como criar influenciadoras na Biblioteca de Prompts?',
        'Dicas para evitar maos deformadas na IA',
      ],
    };
  }

  if (q.includes('tiktok shop') || q.includes('vitrine') || q.includes('vender') || q.includes('frete') || q.includes('estrategia')) {
    return {
      steps:
        mode === 'expert'
          ? [
              'Carregando taticas de conversao da vitrine TikTok Shop...',
              'Estruturando regras de precificacao e frete subsidiado...',
            ]
          : ['Carregando estrategia do TikTok Shop...'],
      text: `Aqui esta o roteiro de validacao rapida no TikTok Shop:

1. **Escolha 1 Peca Campea**: Produto com Score acima de 85 na aba **Produtos**.
2. **Postagens Diarias**: Publique de 2 a 3 criativos UGC por dia usando as influenciadoras de IA demonstrando a peca no espelho.
3. **Preco de Impulso**: Pecas com boa saida de fornecedor direto vendem com facilidade no feed.
4. **Beneficios na Vitrine**:
   - Ative o frete gratis da primeira compra (subsidiado pelo TikTok).
   - Configure o cupom automatico para novos seguidores.
5. **Chamada de Acao (CTA)**: Nos ultimos 3 segundos do video, aponte diretamente para o carrinho laranja no canto inferior esquerdo!`,
      actionButton: {
        label: 'Ver Catalogo de Produtos',
        viewId: 'products',
      },
      suggestions: [
        'Como criar roteiros no Agente IA?',
        'Como usar os Hooks Virais?',
        'Qual IA usar para gerar videos?',
      ],
    };
  }

  if (q.includes('distorcao') || q.includes('mao') || q.includes('rosto') || q.includes('deformad')) {
    return {
      steps:
        mode === 'expert'
          ? [
              'Analisando padroes de deformacao em modelos generativos...',
              'Sintetizando parametros de prompt negativo e CFG scale...',
            ]
          : ['Mapeando correcao de maos e rostos...'],
      text: `### Guia Anti-Distorcao: Como Evitar Maos e Rostos Deformados na IA

Modelos de difusao e video generativo podem deformar extremidades quando a forca de movimento e muito agressiva. Siga este protocolo:

1. **Prompt Negativo Essencial**:
   Cole sempre no negative prompt do Kling AI ou Midjourney:
   \`deformed hands, mutated fingers, extra limbs, bad anatomy, poorly drawn hands, fused fingers, distorted face, floating limbs, blurred eyes\`.

2. **CFG Scale / Criatividade Controlada**:
   - Mantenha o **CFG Scale entre 0.45 e 0.55**.
   - Valores acima de 0.6 forcam a IA a alucinar detalhes nas maos; valores abaixo de 0.4 tornam o movimento plastico.

3. **Enquadramento Seguro da Camera**:
   - Utilize enquadramento de **Plano Medio (Cintura para Cima)** ou **Corpo Inteiro**. Evite enquadramentos muito distantes onde a resolucao facial cai para menos de 64 pixels.

4. **Frame Inicial de Alta Definicao**:
   - O primeiro frame (*Start Frame*) precisa estar em 4K ou 1080p nativo, gerado com a modelo em pose neutra ou com as maos repousadas naturalmente na cintura.`,
      actionButton: {
        label: 'Ver Extrator de Movimentos',
        viewId: 'motion',
      },
      suggestions: [
        'Qual a melhor IA para gerar os videos?',
        'Como funciona o Extrator de Movimentos?',
        'Como usar os Hooks de 0 a 3s?',
      ],
    };
  }

  if (q.includes('audio') || q.includes('som') || q.includes('musica') || q.includes('trilha')) {
    return {
      steps:
        mode === 'expert'
          ? [
              'Consultando metricas de sons em alta no TikTok Shop...',
              'Estruturando sincronia de audio e retencao...',
            ]
          : ['Carregando recomendacoes de audio...'],
      text: `### Estrategia de Audio & Sons Virais para TikTok Shop

No TikTok Shop, o som certo dobra o alcance organico e evita que o usuario pule o criativo:

1. **Uso de Sons Comerciais em Alta**:
   - No app do TikTok, filtre pela aba **Sons Comerciais** (Commercial Music Library). Sons nao-comerciais podem desativar a vitrine de venda do seu video.
   - Escolha sons que estejam no **Top 50 Brasil** na aba de criacao.

2. **Videos Sem Fala vs Com Fala**:
   - Se for um **Video Demonstrativo Sem Fala (Headlines)**: O volume da musica deve ficar em 100%, com a batida marcando a troca de angulo da peca no espelho.
   - Se for um **Video com Narracao (Hooks Virais)**: A voz da influenciadora deve ficar em 100% e o som de fundo em **8% a 12%**, para nao cobrir as quebras de objecao.

3. **Efeito Sonoro de Entrada (Whoosh / Pop)**:
   - Adicione um efeito sonoro de impacto nos primeiros 0.5s junto com o texto na tela para prender quem esta navegando no modo automatico.`,
      actionButton: {
        label: 'Ir para Hooks Virais',
        viewId: 'hooks',
      },
      suggestions: [
        'Como estruturar titulos de 2 frases?',
        'Quantos videos postar por dia?',
        'Como funciona o Gerador de Headlines?',
      ],
    };
  }

  if (q.includes('margem') || q.includes('lucro') || q.includes('precificacao') || q.includes('preco ideal')) {
    return {
      steps:
        mode === 'expert'
          ? [
              'Calculando estrutura de custos e taxas do TikTok Shop...',
              'Formatando margem de contribuicao saudavel para escala...',
            ]
          : ['Calculando margem ideal...'],
      text: `### Margem de Lucro Ideal para Escala no TikTok Shop

Para operar com lucro liquido saudavel mesmo absorvendo taxas de plataforma e custos de devolucao:

1. **Multiplicador de Markup Recomendado**:
   - **Minimo**: Markup de **2.5x** sobre o preco de custo do fornecedor.
   - **Ideal**: Markup de **3.0x a 3.5x**.
   - *Exemplo*: Uma regata comprada por R$ 15,00 no Bom Retiro/Bras deve ser anunciada entre **R$ 49,90 e R$ 54,90**.

2. **Composicao de Custos**:
   - Taxa de Comissao TikTok Shop: ~5% a 8% (com subsidios iniciais).
   - Embalagem e etiquetas: ~R$ 2,50 por pedido.
   - Reserva de Devolucoes/Trocas: 3% a 5% do faturamento.

3. **Margem Liquida Alvo**:
   - Sua margem liquida final no bolso deve ficar entre **35% e 45%** em operacoes organicas com influenciadoras de IA.`,
      actionButton: {
        label: 'Analisar Produtos no Score',
        viewId: 'product',
      },
      suggestions: [
        'Como validar fornecedores confiaveis?',
        'Como configurar frete gratis?',
        'Como minerar pecas campeas no catalogo?',
      ],
    };
  }

  if (q.includes('quantos video') || q.includes('postar por dia') || q.includes('frequencia') || q.includes('horario')) {
    return {
      steps:
        mode === 'expert'
          ? [
              'Mapeando diretrizes do algoritmo do TikTok Shop...',
              'Estruturando calendario editorial de alta frequencia...',
            ]
          : ['Calculando frequencia ideal de postagens...'],
      text: `### Frequencia e Volume de Postagens para Comecar a Vender

O algoritmo do TikTok Shop recompensa consistencia e volume rapido de dados nos primeiros 14 dias:

1. **Volume Ideal para Contas Novas**:
   - **3 criativos por dia** (manha, tarde e noite).
   - Se possivel, alterne entre 1 video com fala (Hooks Virais) e 2 videos demonstrativos sem fala (Headlines).

2. **Melhores Horarios de Postagem**:
   - **Manha**: 11h30 as 13h00 (horario de almoco).
   - **Fim de Tarde**: 17h30 as 19h00 (volta do trabalho).
   - **Noite (Pico)**: 20h30 as 22h30 (maior volume de compras por impulso).

3. **Regra de Ouro da Escala**:
   - Nunca delete videos que tiveram poucas visualizacoes. No TikTok Shop, e comum um video comecar a entregar vendas apos 48 a 72 horas de publicado.`,
      actionButton: {
        label: 'Ver Roteiros no Agente IA',
        viewId: 'agent',
      },
      suggestions: [
        'Como criar ganchos de alta retencao?',
        'Como modelar perfis do Scanner?',
        'Como configurar frete gratis?',
      ],
    };
  }

  if (q === 'oi' || q === 'ola' || q.includes('bom dia') || q.includes('boa tarde') || q.includes('boa noite') || q.includes('tudo bem')) {
    const currentUserName = getUserDisplayName();
    return {
      steps: ['Iniciando atendimento do Suporte Orbiex...'],
      text: `Ola, ${currentUserName}! O suporte tecnico da Orbiex esta ativo e a sua disposicao.

Sou a sua **Agente Tecnica de Suporte**. Posso te guiar em qualquer duvida tecnica ou operacional:
- Como extrair movimentos de videos para **Kling AI**, **Google Flow** e **Hailuo**
- Como gerar ganchos irresistiveis nos **Hooks Virais** e **Headlines**
- Como minerar produtos com o **Score** e espionar os lojistas do **Scanner**
- Como escalar sua operacao de roupas no **TikTok Shop**

Qual duvida ou processo podemos destravar agora?`,
      suggestions: [
        'Como funciona o Extrator de Movimentos?',
        'Como usar os Hooks Virais?',
        'Qual IA usar para gerar videos?',
      ],
    };
  }

  // Fallback inteligente
  return {
    steps:
      mode === 'expert'
        ? [
            'Pesquisando na base tecnica do ecossistema...',
            'Sintetizando orientacoes praticas de suporte...',
          ]
        : ['Consultando base de suporte...'],
    text: `Entendi sua duvida sobre **"${question}"**.

Aqui esta o guia rapido de onde resolver isso dentro da plataforma:
- **Movimentos e Videos de IA**: Use o **Extrator de Movimentos** para gerar prompts prontos para Kling AI ou Google Flow.
- **Primeiros 3 Segundos de Video**: Use a aba **Hooks Virais** para ter falas e acoes visuais no espelho.
- **Criativos Sem Fala**: Acesse o **Gerador de Headlines** para titulos curtos de 2 frases.
- **Validacao de Produtos e Fornecedores**: Consulte o **Score Produto** e **Score Lojista**.
- **Modelagem de Perfis de Sucesso**: Confira o **Scanner** de lojas virais.

Gostaria de um passo a passo detalhado sobre alguma ferramenta em especifico?`,
    suggestions: [
      'Como funciona o Extrator de Movimentos?',
      'Como usar os Hooks Virais?',
      'Como usar o Scanner?',
    ],
  };
}

/* ─────────────────────────── UI components ─────────────────────────── */

function ThinkingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="mvz-think-dot h-1.5 w-1.5 rounded-full bg-[var(--mvz-gold)]"
          style={{ animationDelay: `${i * 0.16}s` }}
        />
      ))}
    </span>
  );
}

function StepsView({ m }: { m: SupportMsg }) {
  const steps = m.steps ?? [];
  const working = m.status === 'thinking' || m.status === 'streaming';

  if (m.status === 'thinking' && steps.length === 0) {
    return (
      <div className="mb-2 flex items-center gap-2.5 text-[12.5px] text-[var(--mvz-gold-light)] font-medium">
        <ThinkingDots /> Analisando base tecnica do suporte...
      </div>
    );
  }
  if (steps.length === 0) return null;

  const list = (
    <div className="space-y-1.5 border-l-2 border-[var(--mvz-gold)]/40 pl-3.5 my-2">
      {steps.map((s) => (
        <div key={s.label} className="mvz-msg-in flex items-center gap-2 text-[11.5px] text-white/70">
          {s.done ? (
            <Check size={12} className="text-[#22c55e]" />
          ) : (
            <Loader2 size={12} className="animate-spin text-[var(--mvz-gold)]" />
          )}
          <span>{s.label}</span>
        </div>
      ))}
    </div>
  );

  if (working) return <div className="mb-3">{list}</div>;

  return (
    <details className="group mb-3">
      <summary className="flex w-fit cursor-pointer list-none items-center gap-1.5 text-[11.5px] font-medium text-[var(--mvz-muted)] hover:text-[var(--mvz-gold-light)]">
        <Check size={12} className="text-[var(--mvz-gold)]" />
        {m.took ? `Resolvido em ${m.took}s` : 'Analise Concluida'} · {steps.length}{' '}
        {steps.length === 1 ? 'etapa' : 'etapas'}
        <ChevronDown size={12} className="transition group-open:rotate-180" />
      </summary>
      <div className="mt-1">{list}</div>
    </details>
  );
}

function ActionIconBtn({
  children,
  onClick,
  label,
  active,
}: {
  children: ReactNode;
  onClick: () => void;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`flex h-7 w-7 items-center justify-center rounded-lg border text-[var(--mvz-muted)] transition hover:text-white ${
        active
          ? 'border-[var(--mvz-gold)] bg-[var(--mvz-gold)]/15 text-[var(--mvz-gold)]'
          : 'border-white/5 bg-white/[0.02] hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  );
}

/* ─────────────────────────── main view ─────────────────────────── */

export function SupportChatView({ onNavigate }: Props) {
  const { displayName } = useUserProfile();
  const [chats, setChats] = useState<SupportChat[]>(loadChats);
  const [activeId, setActiveId] = useState<number>(() => {
    const list = loadChats();
    if (list.length > 0) return list[0].id;
    const initialId = nextId();
    return initialId;
  });

  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [model, setModel] = useState<'expert' | 'fast'>('expert');
  const [files, setFiles] = useState<File[]>([]);
  const [listening, setListening] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [showJump, setShowJump] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('videos');
  const [historyOpen, setHistoryOpen] = useState(false);

  // Slash commands
  const [slashIdx, setSlashIdx] = useState(0);

  // Estado discreto de Solicitação de Reembolso
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundEmail, setRefundEmail] = useState(() => {
    try {
      return localStorage.getItem('orbiex_user_email') || localStorage.getItem('orbix_user_email') || '';
    } catch {
      return '';
    }
  });
  const [refundReason, setRefundReason] = useState('Dificuldade técnica na plataforma');
  const [refundNotes, setRefundNotes] = useState('');
  const [refundSubmitting, setRefundSubmitting] = useState(false);
  const [refundProtocol, setRefundProtocol] = useState<string | null>(null);

  const handleRefundSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundEmail.trim()) return;
    setRefundSubmitting(true);
    setTimeout(() => {
      const code = `RBX-${Math.floor(100000 + Math.random() * 900000)}`;
      setRefundProtocol(code);
      setRefundSubmitting(false);
    }, 900);
  };

  const scroller = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recRef = useRef<any>(null);
  const stick = useRef(true);
  const stopSig = useRef(false);

  // Garante pelo menos 1 chat ativo
  useEffect(() => {
    if (chats.length === 0) {
      const initial: SupportChat = {
        id: activeId,
        title: 'Novo Atendimento',
        updatedAt: Date.now(),
        ticketCode: generateTicketCode(activeId),
        msgs: [],
      };
      setChats([initial]);
    }
  }, [chats.length, activeId]);

  // Persistencia local segura
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
    } catch {
      // ignore
    }
  }, [chats]);

  const chat = chats.find((c) => c.id === activeId) || chats[0];
  const msgs = chat?.msgs ?? [];

  // Auto-resize do textarea
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [input]);

  // Scroll automatico com deteccao de stick
  const onScroll = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    stick.current = distanceToBottom < 60;
    setShowJump(distanceToBottom > 160);
  }, []);

  const jump = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    stick.current = true;
    setShowJump(false);
  }, []);

  useEffect(() => {
    if (stick.current) {
      const el = scroller.current;
      if (el) el.scrollTop = el.scrollHeight;
    }
  }, [msgs, busy]);

  const patch = (
    chatId: number,
    msgId: number,
    updater: (m: SupportMsg) => SupportMsg
  ) => {
    setChats((prev) =>
      prev.map((c) =>
        c.id === chatId
          ? {
              ...c,
              updatedAt: Date.now(),
              msgs: c.msgs.map((m) => (m.id === msgId ? updater(m) : m)),
            }
          : c
      )
    );
  };

  const newTicket = () => {
    const nid = nextId();
    const created: SupportChat = {
      id: nid,
      title: 'Novo Atendimento',
      updatedAt: Date.now(),
      ticketCode: generateTicketCode(nid),
      msgs: [],
    };
    setChats((prev) => [created, ...prev]);
    setActiveId(nid);
    setInput('');
    setFiles([]);
    setHistoryOpen(false);
  };

  const removeChat = (id: number) => {
    const nextList = chats.filter((c) => c.id !== id);
    setChats(nextList);
    if (id === activeId) {
      if (nextList.length > 0) {
        setActiveId(nextList[0].id);
      } else {
        const nid = nextId();
        const created: SupportChat = {
          id: nid,
          title: 'Novo Atendimento',
          updatedAt: Date.now(),
          ticketCode: generateTicketCode(nid),
          msgs: [],
        };
        setChats([created]);
        setActiveId(nid);
      }
    }
  };

  // Enviar Mensagem para o Agente de Suporte
  const send = async (override?: string) => {
    const text = (override ?? input).trim();
    if (!text && files.length === 0) return;
    if (busy) return;

    const attachmentNames = files.map((f) => f.name);
    setInput('');
    setFiles([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    const userMsgId = nextId();
    const userMsg: SupportMsg = {
      id: userMsgId,
      role: 'user',
      text,
      attachments: attachmentNames.length ? attachmentNames : undefined,
    };

    const isFirst = msgs.length === 0;
    const newTitle = isFirst ? text.slice(0, 42) || 'Duvida Geral' : chat?.title ?? 'Atendimento';

    setChats((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? {
              ...c,
              title: newTitle,
              updatedAt: Date.now(),
              msgs: [...c.msgs, userMsg],
            }
          : c
      )
    );

    const agentMsgId = nextId();
    const pendingMsg: SupportMsg = {
      id: agentMsgId,
      role: 'agent',
      text: '',
      status: 'thinking',
      steps: [],
    };

    setChats((prev) =>
      prev.map((c) =>
        c.id === activeId ? { ...c, msgs: [...c.msgs, pendingMsg] } : c
      )
    );

    setBusy(true);
    stopSig.current = false;
    const t0 = performance.now();

    // Consulta do conhecimento técnico
    const knowledge = getKnowledgeResponse(text, model);

    // Passo 1: Animação dos passos do suporte
    const stepsList: Step[] = knowledge.steps.map((label) => ({ label, done: false }));
    patch(activeId, agentMsgId, (m) => ({ ...m, steps: stepsList }));

    for (let i = 0; i < stepsList.length; i++) {
      if (stopSig.current) break;
      await new Promise((r) => setTimeout(r, model === 'expert' ? 380 : 180));
      stepsList[i].done = true;
      patch(activeId, agentMsgId, (m) => ({ ...m, steps: [...stepsList] }));
    }

    if (stopSig.current) {
      setBusy(false);
      return;
    }

    // Passo 2: Streaming suave da resposta técnica
    patch(activeId, agentMsgId, (m) => ({ ...m, status: 'streaming' }));

    const fullText = knowledge.text;
    const chunkSize = model === 'expert' ? 8 : 16;
    let curr = '';

    for (let i = 0; i < fullText.length; i += chunkSize) {
      if (stopSig.current) break;
      curr = fullText.slice(0, i + chunkSize);
      patch(activeId, agentMsgId, (m) => ({ ...m, text: curr }));
      await new Promise((r) => setTimeout(r, 14));
    }

    const tTotal = ((performance.now() - t0) / 1000).toFixed(1);

    patch(activeId, agentMsgId, (m) => ({
      ...m,
      text: fullText,
      status: 'done',
      took: tTotal,
      actionButton: knowledge.actionButton,
      suggestions: knowledge.suggestions,
    }));

    setBusy(false);
  };

  const stop = () => {
    stopSig.current = true;
    setBusy(false);
  };

  const regenerate = (agentMsgId: number) => {
    const list = [...msgs];
    const idx = list.findIndex((m) => m.id === agentMsgId);
    if (idx <= 0) return;
    const userMsg = list[idx - 1];
    if (userMsg?.role !== 'user') return;

    setChats((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? {
              ...c,
              msgs: c.msgs.filter((m) => m.id !== agentMsgId),
            }
          : c
      )
    );

    send(userMsg.text);
  };

  // Comandos de barra '/'
  const slashList = useMemo(() => {
    if (!input.startsWith('/')) return [];
    const query = input.slice(1).toLowerCase();
    return COMMANDS.filter(
      (c) => c.cmd.slice(1).startsWith(query) || c.label.toLowerCase().includes(query)
    );
  }, [input]);

  const pickCommand = (text: string) => {
    send(text);
  };

  // Audio / Voz
  const toggleVoice = () => {
    if (!SpeechRec) return;
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const rec = new SpeechRec();
    rec.lang = 'pt-BR';
    rec.interimResults = true;
    const base = input ? `${input} ` : '';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      let t = '';
      for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
      setInput(base + t);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  };

  const copyMsg = async (m: SupportMsg) => {
    if (await copyText(m.text)) {
      setCopiedId(m.id);
      setTimeout(() => setCopiedId((c) => (c === m.id ? null : c)), 1800);
    }
  };

  const empty = msgs.length === 0;
  const lastAgentId = [...msgs].reverse().find((m) => m.role === 'agent')?.id;

  return (
    <div className="mvz-fade-up relative flex h-[calc(100dvh-60px-2rem)] min-h-[560px] gap-4 md:h-[calc(100dvh-60px-3rem)]">
      {/* ── PAINEL LATERAL DE SUPORTE (ESQUERDA) ── */}
      <aside className="hidden lg:flex w-[290px] shrink-0 flex-col justify-between rounded-[22px] border border-white/[0.08] bg-[#0c0c0d] p-4 shadow-xl">
        <div className="flex flex-col space-y-4">
          {/* Identificação da Especialista & Novo Chamado */}
          <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--mvz-gold)]/40 bg-black text-[var(--mvz-gold)]">
                <Headphones size={17} />
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-black bg-[#22c55e]" />
              </div>
              <div>
                <div className="text-[13px] font-bold text-white leading-tight">Sophia</div>
                <div className="text-[10.5px] text-[var(--mvz-muted)]">Suporte Especialista</div>
              </div>
            </div>

            <button
              onClick={newTicket}
              className="flex items-center gap-1 rounded-lg border border-[var(--mvz-gold)]/30 bg-[var(--mvz-gold)]/10 px-2.5 py-1 text-[11px] font-bold text-[var(--mvz-gold-light)] hover:bg-[var(--mvz-gold)] hover:text-black transition cursor-pointer"
              title="Abrir novo chamado de suporte"
            >
              <Plus size={12} />
              <span>Novo</span>
            </button>
          </div>

          {/* Categorias Rápidas */}
          <div className="space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-white/40">
              Diagnostico Rapido
            </div>
            <div className="grid grid-cols-2 gap-1">
              {FAQ_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-[11px] font-medium transition cursor-pointer ${
                      isSelected
                        ? 'border border-[var(--mvz-gold)]/40 bg-[var(--mvz-gold)]/10 text-white'
                        : 'border border-transparent bg-white/[0.02] text-white/60 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <Icon size={12} className={isSelected ? 'text-[var(--mvz-gold)]' : 'text-white/40'} />
                    <span className="truncate">{cat.title.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>

            {/* Perguntas da Categoria */}
            <div className="space-y-1 pt-1">
              {FAQ_CATEGORIES.find((c) => c.id === selectedCategory)?.questions.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="group flex w-full items-start gap-2 rounded-lg border border-transparent p-2 text-left text-[11px] leading-snug text-white/70 hover:border-white/10 hover:bg-white/[0.03] hover:text-white transition cursor-pointer"
                >
                  <ChevronRight size={12} className="shrink-0 mt-0.5 text-[var(--mvz-gold)]/60 group-hover:text-[var(--mvz-gold)] group-hover:translate-x-0.5 transition" />
                  <span className="line-clamp-2">{q}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Histórico Compacto no Rodapé da Sidebar */}
        <div className="pt-3 border-t border-white/[0.06]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
              Historico ({chats.length})
            </span>
            {chats.length > 2 && (
              <button
                onClick={() => setHistoryOpen(!historyOpen)}
                className="text-[10px] text-[var(--mvz-gold)] hover:underline cursor-pointer"
              >
                {historyOpen ? 'Menos' : 'Ver todos'}
              </button>
            )}
          </div>

          <div className={`space-y-1 ${historyOpen ? 'max-h-40' : 'max-h-24'} overflow-y-auto pr-1`}>
            {chats.slice(0, historyOpen ? 10 : 3).map((c) => (
              <div
                key={c.id}
                className={`flex items-center justify-between rounded-lg px-2.5 py-1 text-[11px] transition ${
                  c.id === activeId
                    ? 'border border-[var(--mvz-gold)]/30 bg-[var(--mvz-gold)]/10 text-white font-medium'
                    : 'border border-transparent bg-white/[0.02] text-white/60 hover:text-white'
                }`}
              >
                <button
                  onClick={() => setActiveId(c.id)}
                  className="truncate text-left flex-1 cursor-pointer"
                >
                  <span className="truncate">{c.title}</span>
                </button>
                {chats.length > 1 && (
                  <button
                    onClick={() => removeChat(c.id)}
                    className="ml-1 text-white/30 hover:text-rose-400 p-1 cursor-pointer"
                    title="Excluir"
                  >
                    <Trash2 size={10} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Botão de Reembolso visível no rodapé da barra lateral */}
          <div className="mt-3 border-t border-white/[0.08] pt-3">
            <button
              type="button"
              onClick={() => {
                setRefundProtocol(null);
                setRefundOpen(true);
              }}
              className="flex w-full items-center justify-between rounded-xl border border-white/15 bg-white/[0.04] px-3.5 py-2.5 text-[12px] font-bold text-white/90 hover:border-[var(--mvz-gold)]/50 hover:bg-white/[0.08] hover:text-white transition cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <RefreshCw size={13} className="text-[var(--mvz-gold)]" />
                <span>Solicitar Reembolso</span>
              </span>
              <ChevronRight size={13} className="text-white/40" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── CONSOLE DE ATENDIMENTO (DIREITA) ── */}
      <section className="relative flex flex-1 flex-col overflow-hidden rounded-[22px] border border-white/[0.08] bg-[#0c0c0d] shadow-2xl">
        {/* Top Bar do Console */}
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-white/[0.06] px-4 sm:px-6">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="h-2 w-2 shrink-0 rounded-full bg-[#22c55e]" />
            <span className="text-[13px] font-bold text-white truncate">
              {chat?.title || 'Novo atendimento'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setRefundProtocol(null);
                setRefundOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.05] px-3 py-1.5 text-[11px] font-bold text-white/90 hover:border-[var(--mvz-gold)]/50 hover:bg-white/[0.1] hover:text-white transition cursor-pointer"
            >
              <RefreshCw size={12} className="text-[var(--mvz-gold)]" />
              <span>Reembolso</span>
            </button>

            {/* Toggle de Modo: Especialista / Rápido */}
            <div className="flex items-center gap-1 rounded-lg border border-white/[0.06] bg-black/40 p-0.5">
              {MODELS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setModel(m.id)}
                  className={`rounded-md px-2.5 py-1 text-[10.5px] font-medium transition cursor-pointer ${
                    model === m.id
                      ? 'bg-[var(--mvz-gold)] text-black font-bold'
                      : 'text-white/50 hover:text-white'
                  }`}
                >
                  {m.id === 'expert' ? 'Especialista' : 'Rapido'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Feed de Mensagens */}
        <div
          ref={scroller}
          onScroll={onScroll}
          className="mvz-scroll relative flex-1 overflow-y-auto p-4 sm:p-6 space-y-5"
        >
          {empty ? (
            <div className="my-auto flex flex-col items-center justify-center text-center py-6 sm:py-10 max-w-xl mx-auto">
              {/* Ícone Minimalista Sophia */}
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--mvz-gold)]/40 bg-black text-[var(--mvz-gold)] shadow-[0_0_20px_rgba(212,175,55,0.15)]">
                <Headphones size={22} />
              </div>

              <h2 className="text-[20px] font-bold tracking-tight text-white sm:text-[24px]">
                {greeting()}, {displayName}.
              </h2>
              <p className="mt-1 text-[13px] text-white/50 max-w-md">
                Como posso te ajudar no suporte tecnico hoje?
              </p>

              {/* 4 Starter Cards Minimalistas */}
              <div className="mt-7 grid w-full grid-cols-1 gap-2.5 sm:grid-cols-2 text-left">
                {STARTER_CARDS.map((card) => {
                  const Icon = card.icon;
                  return (
                    <button
                      key={card.title}
                      onClick={() => send(card.text)}
                      className="group flex flex-col rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5 transition duration-150 hover:border-[var(--mvz-gold)]/40 hover:bg-white/[0.04] cursor-pointer"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <Icon size={15} className="text-[var(--mvz-gold)] shrink-0" />
                        <span className="text-[12.5px] font-bold text-white group-hover:text-[var(--mvz-gold-light)] transition truncate">
                          {card.title}
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-white/50 line-clamp-2">
                        {card.desc}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 text-[11px] text-white/30">
                Digite sua duvida abaixo ou selecione um tema acima.
              </div>
            </div>
          ) : (
              <div className="space-y-6">
                {msgs.map((m) =>
                  m.role === 'user' ? (
                    <div key={m.id} className="mvz-msg-in flex flex-col items-end gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--mvz-dim)]">
                        Voce • Titular Orbiex
                      </span>
                      {m.attachments?.map((f) => (
                        <span
                          key={f}
                          className="flex items-center gap-1.5 rounded-lg border border-[var(--mvz-line)] bg-white/[0.03] px-2.5 py-1 text-[11px] text-[var(--mvz-muted)]"
                        >
                          <Paperclip size={11} /> {f}
                        </span>
                      ))}
                      <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tr-sm border border-[var(--mvz-gold)]/30 bg-gradient-to-r from-[var(--mvz-gold)]/15 to-[var(--mvz-gold)]/5 px-4 py-3 text-[13.5px] leading-relaxed text-white shadow-md">
                        {m.text}
                      </div>
                    </div>
                  ) : (
                    <div key={m.id} className="mvz-msg-in flex items-start gap-3.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--mvz-gold)] bg-black text-[var(--mvz-gold)] shadow-[0_0_15px_rgba(212,175,55,0.25)]">
                        <Headphones size={16} />
                      </div>

                      <div className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-[#0d0c0a] p-4 sm:p-5 shadow-xl">
                        <div className="flex items-center justify-between border-b border-white/[0.06] pb-2 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-[12.5px] font-black text-[var(--mvz-gold-light)]">
                              Sophia • Suporte Tecnico
                            </span>
                            <span className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[9px] font-bold text-white/60">
                              Parecer Oficial
                            </span>
                          </div>

                          {m.took && (
                            <span className="text-[10px] text-[var(--mvz-dim)] font-mono">
                              {m.took}s
                            </span>
                          )}
                        </div>

                        <StepsView m={m} />

                        {m.text && <Rich text={m.text} streaming={m.status === 'streaming'} />}

                        {/* Botão de Ação Direta para a Ferramenta */}
                        {m.actionButton && onNavigate && (
                          <div className="mt-4 pt-3 border-t border-white/[0.06]">
                            <button
                              onClick={() => onNavigate(m.actionButton!.viewId)}
                              className="inline-flex items-center gap-2 rounded-xl border border-[var(--mvz-gold)] bg-[var(--mvz-gold)]/15 px-4 py-2 text-[12px] font-black uppercase tracking-wider text-[var(--mvz-gold-light)] shadow-[0_0_20px_rgba(212,175,55,0.25)] transition hover:bg-[var(--mvz-gold)] hover:text-black cursor-pointer"
                            >
                              <span>{m.actionButton.label}</span>
                              <ArrowRight size={14} />
                            </button>
                          </div>
                        )}

                        {/* Ações da Mensagem: Copiar, Feedback, Regenerar */}
                        {(m.status === 'done' || m.status === 'stopped') && (
                          <div className="mt-3.5 flex items-center justify-between pt-2 border-t border-white/[0.04]">
                            <div className="flex items-center gap-1.5">
                              <ActionIconBtn onClick={() => copyMsg(m)} label="Copiar Parecer">
                                {copiedId === m.id ? (
                                  <Check size={13} className="text-[#22c55e]" />
                                ) : (
                                  <Copy size={13} />
                                )}
                              </ActionIconBtn>
                              <ActionIconBtn
                                onClick={() =>
                                  patch(chat!.id, m.id, (x) => ({
                                    ...x,
                                    feedback: x.feedback === 'up' ? undefined : 'up',
                                  }))
                                }
                                label="Util"
                                active={m.feedback === 'up'}
                              >
                                <ThumbsUp size={13} />
                              </ActionIconBtn>
                              <ActionIconBtn
                                onClick={() =>
                                  patch(chat!.id, m.id, (x) => ({
                                    ...x,
                                    feedback: x.feedback === 'down' ? undefined : 'down',
                                  }))
                                }
                                label="Nao ajudou"
                                active={m.feedback === 'down'}
                              >
                                <ThumbsDown size={13} />
                              </ActionIconBtn>
                              {m.id === lastAgentId && (
                                <ActionIconBtn
                                  onClick={() => regenerate(m.id)}
                                  label="Gerar novamente"
                                >
                                  <RefreshCw size={13} />
                                </ActionIconBtn>
                              )}
                            </div>

                            <span className="text-[10px] text-white/40">
                              Orbiex Helpdesk IA
                            </span>
                          </div>
                        )}

                        {/* Sugestões de Próximas Perguntas */}
                        {m.status === 'done' && m.id === lastAgentId && m.suggestions && m.suggestions.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-1.5 pt-2">
                            {m.suggestions.map((s) => (
                              <button
                                key={s}
                                onClick={() => send(s)}
                                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-[var(--mvz-gold-light)] hover:bg-[var(--mvz-gold)]/15 hover:border-[var(--mvz-gold)]/40 transition cursor-pointer"
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          {/* Jump to bottom */}
          {showJump && !empty && (
            <button
              onClick={jump}
              className="absolute bottom-24 right-8 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--mvz-gold)] bg-black text-[var(--mvz-gold)] shadow-xl hover:scale-105 transition cursor-pointer"
              title="Rolar para o fim"
            >
              <ArrowDown size={15} />
            </button>
          )}

          {/* Composer do Helpdesk */}
          <div className="relative border-t border-white/[0.08] bg-[#0d0c0a] p-4">
            {/* Pop-up de Comandos de Barra '/' */}
            {slashList.length > 0 && (
              <div className="absolute bottom-full left-4 right-4 mb-2 overflow-hidden rounded-2xl border border-[var(--mvz-gold)]/40 bg-[#0d0c0a] p-2 shadow-2xl z-30">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--mvz-gold)]">
                  Comandos de Suporte Tecnico
                </div>
                {slashList.map((c, i) => {
                  const Icon = c.icon;
                  return (
                    <button
                      key={c.cmd}
                      onMouseEnter={() => setSlashIdx(i)}
                      onClick={() => pickCommand(c.template)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[12.5px] transition cursor-pointer ${
                        i === slashIdx ? 'bg-[var(--mvz-gold)]/15 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <Icon size={14} className="text-[var(--mvz-gold)]" />
                      <div className="flex-1">
                        <span className="font-bold">{c.label}</span>
                        <span className="ml-2 font-mono text-[10px] text-white/40">{c.cmd}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Anexos Pendentes */}
            {files.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {files.map((f, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-white/80"
                  >
                    <Paperclip size={12} className="text-[var(--mvz-gold)]" />
                    <span>{f.name}</span>
                    <button
                      onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                      className="ml-1 text-white/50 hover:text-rose-400"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-end gap-2">
              <input
                ref={fileInput}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) setFiles([...files, ...Array.from(e.target.files)]);
                }}
              />

              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition cursor-pointer"
                title="Anexar arquivo ou print de erro"
              >
                <Paperclip size={16} />
              </button>

              <button
                type="button"
                onClick={toggleVoice}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition cursor-pointer ${
                  listening
                    ? 'border-rose-500 bg-rose-500/20 text-rose-400 animate-pulse'
                    : 'border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                }`}
                title="Falar por voz"
              >
                <Mic size={16} />
              </button>

              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={1}
                placeholder="Descreva sua duvida tecnica ou digite / para comandos..."
                className="max-h-36 min-h-[42px] flex-1 resize-none rounded-xl border border-white/10 bg-black/60 px-4 py-2.5 text-[13px] text-white placeholder-white/40 focus:border-[var(--mvz-gold)] focus:outline-none"
              />

              {busy ? (
                <button
                  type="button"
                  onClick={stop}
                  className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 text-[11px] font-extrabold uppercase text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
                >
                  <X size={14} />
                  <span>Parar</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => send()}
                  disabled={!input.trim() && files.length === 0}
                  className="flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-[var(--mvz-gold)] bg-gradient-to-r from-[var(--mvz-gold)] via-[var(--mvz-gold-light)] to-[var(--mvz-gold)] px-4 text-[12px] font-black uppercase text-black shadow-[0_0_20px_rgba(212,175,55,0.3)] transition hover:opacity-90 disabled:opacity-40 cursor-pointer"
                >
                  <span>Enviar</span>
                  <Send size={13} />
                </button>
              )}
            </div>

            {/* Botão de reembolso visível no rodapé do console */}
            <div className="mt-2.5 flex items-center justify-end">
              <button
                type="button"
                onClick={() => {
                  setRefundProtocol(null);
                  setRefundOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold text-white/75 hover:border-[var(--mvz-gold)]/50 hover:bg-white/[0.08] hover:text-white transition cursor-pointer"
              >
                <RefreshCw size={11} className="text-[var(--mvz-gold)]" />
                <span>Solicitar Reembolso</span>
              </button>
            </div>
          </div>
        </section>

        {/* Modal de Solicitação de Reembolso */}
        {refundOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0d0c0a] p-6 shadow-2xl">
              <button
                type="button"
                onClick={() => setRefundOpen(false)}
                className="absolute right-4 top-4 rounded-lg p-1.5 text-white/40 hover:bg-white/5 hover:text-white transition cursor-pointer"
                aria-label="Fechar"
              >
                <X size={16} />
              </button>

              {refundProtocol ? (
                <div className="space-y-4 text-center py-2">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-[#22c55e]/40 bg-[#22c55e]/10 text-[#22c55e]">
                    <Check size={20} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-[16px] font-bold text-white">
                      Reembolso Solicitado
                    </h3>
                    <p className="text-[12px] text-white/70 leading-relaxed">
                      O motivo da sua solicitação foi captado com sucesso e o seu reembolso foi solicitado.
                    </p>
                    <p className="text-[11.5px] text-white/55 leading-relaxed">
                      A equipe da Orbiex analisará criteriosamente todos os fatores e tudo o que foi descrito na sua justificativa anterior. Como cada caso passa por análise detalhada do motivo informado, o prazo é de até <strong className="text-white/85">7 dias</strong> para conclusão e retorno com o resultado do reembolso no seu e-mail.
                    </p>
                  </div>
                  <div className="space-y-1 rounded-xl border border-white/10 bg-black/60 px-4 py-3 text-[11.5px] text-white/80">
                    <div>
                      Status: <strong className="text-[#22c55e]">Solicitado • Em Análise (até 7 dias)</strong>
                    </div>
                    <div>
                      Protocolo: <strong className="font-mono text-[var(--mvz-gold)]">{refundProtocol}</strong>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRefundOpen(false)}
                    className="w-full rounded-xl border border-white/15 bg-white/10 py-2.5 text-[12px] font-bold text-white hover:bg-white/15 transition cursor-pointer"
                  >
                    Fechar
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRefundSubmit} className="space-y-4">
                  <div>
                    <h3 className="text-[15px] font-bold text-white">
                      Solicitar Reembolso
                    </h3>
                    <p className="mt-1 text-[11.5px] text-white/50 leading-relaxed">
                      Preencha os dados da sua conta e descreva sua justificativa para análise da equipe da Orbiex.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10.5px] font-bold uppercase tracking-wider text-white/60">
                      E-mail da conta
                    </label>
                    <input
                      type="email"
                      required
                      value={refundEmail}
                      onChange={(e) => setRefundEmail(e.target.value)}
                      placeholder="seuemail@exemplo.com"
                      className="h-10 w-full rounded-xl border border-white/10 bg-black/60 px-3.5 text-[12.5px] text-white placeholder-white/30 focus:border-[var(--mvz-gold)] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10.5px] font-bold uppercase tracking-wider text-white/60">
                      Motivo principal
                    </label>
                    <select
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      className="h-10 w-full rounded-xl border border-white/10 bg-black/60 px-3 text-[12.5px] text-white focus:border-[var(--mvz-gold)] focus:outline-none"
                    >
                      <option value="Dificuldade técnica na plataforma">Dificuldade técnica na plataforma</option>
                      <option value="Não tive tempo para aplicar">Não tive tempo para aplicar</option>
                      <option value="Não me adaptei ao formato">Não me adaptei ao formato</option>
                      <option value="Comprei por engano">Comprei por engano</option>
                      <option value="Outro motivo">Outro motivo</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10.5px] font-bold uppercase tracking-wider text-white/60">
                      Justificativa detalhada
                    </label>
                    <textarea
                      rows={3}
                      value={refundNotes}
                      onChange={(e) => setRefundNotes(e.target.value)}
                      placeholder="Explique detalhadamente o motivo da sua solicitação para análise da equipe..."
                      className="w-full resize-none rounded-xl border border-white/10 bg-black/60 p-3 text-[12.5px] text-white placeholder-white/30 focus:border-[var(--mvz-gold)] focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setRefundOpen(false)}
                      className="rounded-xl border border-white/10 px-4 py-2 text-[11.5px] font-semibold text-white/60 hover:text-white transition cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={refundSubmitting || !refundEmail.trim()}
                      className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f3e2a4] to-[#eab308] px-4 py-2 text-[11.5px] font-extrabold text-black hover:brightness-110 disabled:opacity-40 transition cursor-pointer shadow-[0_0_15px_rgba(212,175,55,0.25)]"
                    >
                      {refundSubmitting && <Loader2 size={13} className="animate-spin text-black" />}
                      <span>{refundSubmitting ? 'Enviando...' : 'Solicitar Reembolso'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

import { useState, useMemo, useEffect } from 'react';
import {
  Play,
  CheckCircle2,
  Check,
  Search,
  ArrowRight,
  ArrowLeft,
  Clock,
  ExternalLink,
  GraduationCap,
  RotateCcw,
  Edit3,
  Video,
  Bot,
  Compass,
  ShoppingBag,
  Bookmark,
  Gauge,
  Store,
  Radar,
  Type,
  Zap,
  Clapperboard,
  Terminal,
  ShieldAlert,
  Rocket,
  type LucideIcon,
} from 'lucide-react';

export interface LessonItem {
  id: string;
  number: string;
  title: string;
  toolViewId: string;
  category: 'ia' | 'estrategia' | 'mineracao' | 'criativos' | 'seguranca';
  categoryLabel: string;
  duration: string;
  videoUrl?: string;
  coverImage?: string;
  coverFallback?: string;
  shortDescription: string;
  fullDescription: string;
  keyPoints: string[];
  practicalSteps: string[];
  accentColor: string;
  cardGlow: string;
  icon: LucideIcon;
}

const LESSONS_CATALOG: LessonItem[] = [
  {
    id: 'aula-1',
    number: '01',
    title: 'Agente IA',
    toolViewId: 'agent',
    category: 'ia',
    categoryLabel: 'Núcleo de IA',
    duration: '18 min',
    shortDescription: 'Como usar o mentor inteligente da Orbiex para minerar ofertas, criar roteiros e tirar dúvidas.',
    fullDescription:
      'Nesta aula completa, você aprenderá a operar o Agente de IA da Orbiex com máxima precisão. Veja na prática a diferença entre o modo Orbiex 1 (respostas ágeis e diretas ao ponto) e o Orbiex 1 Pro (mentoria estratégica avançada, com análise de imagem de perfis, auditoria de produtos e geração de textos de apelação para contas com restrição).',
    keyPoints: [
      'Diferença prática entre Orbiex 1 (Ágil) e Orbiex 1 Pro (Avançado com raciocínio profundo).',
      'Envio de prints e fotos de produtos ou perfis para análise multimodal com IA.',
      'Uso de comandos rápidos (/produto, /roteiro, /hooks) para acelerar a esteira diária.',
      'Como pedir ganchos personalizados e roteiros sem aparecer em segundos.',
    ],
    practicalSteps: [
      'Acesse a aba Agente IA no menu lateral da plataforma.',
      'Defina se deseja o modo Orbiex 1 (para o dia a dia) ou Orbiex 1 Pro (para estratégias complexas).',
      'Digite sua dúvida ou arraste uma foto do seu perfil/produto para a caixa de mensagem.',
      'Copie os roteiros e orientações geradas diretamente para seu bloco de notas ou ferramentas de vídeo.',
    ],
    accentColor: '#d4af37',
    cardGlow: 'rgba(212, 175, 55, 0.25)',
    coverImage: '/assets/capa-modulo-orbiex.jpg',
    coverFallback: 'https://i.imgur.com/069c3d94.jpg',
    icon: Bot,
  },
  {
    id: 'aula-2',
    number: '02',
    title: 'Minha Jornada',
    toolViewId: 'journey',
    category: 'estrategia',
    categoryLabel: 'Estratégia & Metas',
    duration: '14 min',
    shortDescription: 'Defina sua meta de faturamento (1k/mês, 1k/sem ou 1k/dia) e acompanhe seu lucro diário.',
    fullDescription:
      'Aprenda a utilizar o mapa de execução da Minha Jornada para destravar a consistência de vendas no TikTok Shop. Descubra como escolher sua patente atual (Bronze 1k/mês, Diamante 1k/sem ou Ouro 1k/dia), cumprir as tarefas diárias e registrar cada comissão ganha para alimentar os gráficos de 7 dias e 4 semanas em tempo real.',
    keyPoints: [
      'Escolha da meta ideal de acordo com seu momento atual de faturamento.',
      'Checklist diário de 5 passos para blindar sua rotina de postagem.',
      'Registro financeiro em tempo real com atualização automática dos saldos.',
      'Leitura do gráfico dinâmico e metas acumuladas dos últimos 30 dias.',
    ],
    practicalSteps: [
      'Entre na aba Minha Jornada e selecione o seu objetivo financeiro atual.',
      'Execute as etapas diárias listadas no Mapa de Execução.',
      'No final do dia, insira os valores das suas comissões geradas no campo de registro.',
      'Acompanhe o crescimento das barras do gráfico e a evolução da sua conta.',
    ],
    accentColor: '#22c55e',
    cardGlow: 'rgba(34, 197, 94, 0.25)',
    coverImage: '/assets/capas/capa-jornada.jpg',
    coverFallback: 'https://i.imgur.com/Clz4itZ.jpg',
    icon: Compass,
  },
  {
    id: 'aula-3',
    number: '03',
    title: 'Produtos',
    toolViewId: 'products',
    category: 'mineracao',
    categoryLabel: 'Mineração & Catálogo',
    duration: '16 min',
    shortDescription: 'Catálogo oficial de produtos físicos validados com alta comissão e liberação no carrinho.',
    fullDescription:
      'Aprenda a minerar e selecionar produtos vencedores diretamente na vitrine da Orbiex. Você entenderá quais nichos convertem mais rápido, como calcular sua margem líquida de lucro por venda e como vincular os produtos liberados ao carrinho amarelo do seu perfil de afiliado.',
    keyPoints: [
      'Identificação de produtos com efeito visual imediato e alto apelo de compra por impulso.',
      'Cálculo de retorno financeiro: comissão por venda x volume estimado.',
      'Como vincular os produtos diretamente no TikTok Shop para Criadores.',
      'Filtros por categorias quentes: moda fitness, modeladores, utilidades e beleza.',
    ],
    practicalSteps: [
      'Abra a aba Produtos para visualizar o acervo validado.',
      'Analise o volume mensal de vendas e o valor da comissão oferecida pelo lojista.',
      'Clique em "Usar no Agente" para gerar ideias de roteiros para o produto escolhido.',
      'Adicione o produto à sua vitrine no aplicativo do TikTok.',
    ],
    accentColor: '#3b82f6',
    cardGlow: 'rgba(59, 130, 246, 0.25)',
    coverImage: '/assets/capas/capa-produtos.jpg',
    coverFallback: 'https://i.imgur.com/gcXSGHY.jpg',
    icon: ShoppingBag,
  },
  {
    id: 'aula-4',
    number: '04',
    title: 'Biblioteca de Prompts',
    toolViewId: 'prompts',
    category: 'criativos',
    categoryLabel: 'Criativos & Prompts',
    duration: '15 min',
    shortDescription: 'Acervo categorizado de prompts de alta conversão para Kling AI, Midjourney, VEO e Runway.',
    fullDescription:
      'Descubra como copiar e aplicar prompts profissionais prontos para gerar vídeos cinematográficos com inteligência artificial sem aparecer. Aprenda a estruturar comandos de troca de roupa, demonstração de produto em uso, efeitos de zoom dinâmico e iluminação de estúdio.',
    keyPoints: [
      'Como escolher prompts validados por nicho (Moda, Casa, Beleza, Gadgets).',
      'Configuração do formato vertical nativo (proporção 9:16) para TikTok.',
      'Uso correto de prompts negativos para evitar deformidades e mãos estranhas.',
      'Técnica de cópia em 1 clique e adaptação rápida para novos produtos.',
    ],
    practicalSteps: [
      'Navegue pela Biblioteca de Prompts e selecione a categoria desejada.',
      'Clique no botão de copiar o prompt principal e o prompt negativo.',
      'Cole na sua ferramenta de geração de vídeo por IA (Kling, Flow, Runway ou Midjourney).',
      'Faça o download do vídeo gerado e leve para edição final.',
    ],
    accentColor: '#d946ef',
    cardGlow: 'rgba(217, 70, 239, 0.25)',
    coverImage: '/assets/capas/capa-prompts-bib.jpg',
    coverFallback: 'https://i.imgur.com/6AXWzpj.jpg',
    icon: Bookmark,
  },
  {
    id: 'aula-5',
    number: '05',
    title: 'Score de Produto',
    toolViewId: 'product',
    category: 'mineracao',
    categoryLabel: 'Mineração & Catálogo',
    duration: '13 min',
    shortDescription: 'Auditoria algorítmica para descobrir se um produto tem potencial viral antes de gravar.',
    fullDescription:
      'Nesta aula, você aprenderá a ler e interpretar o algoritmo de pontuação de 0 a 100 da Orbiex. Descubra os 4 pilares analisados pelo sistema (Apelo Visual, Dor Resolvida, Margem de Lucro e Concorrência) para nunca mais perder tempo criando vídeos para produtos fracos.',
    keyPoints: [
      'Por que você só deve trabalhar com produtos com Score acima de 85.',
      'Como o fator "Efeito Uau nos 3 primeiros segundos" afeta a pontuação.',
      'Identificação de produtos saturados que o algoritmo do TikTok já não entrega.',
      'Validação de produtos antes de solicitar amostras ou iniciar produção de vídeos.',
    ],
    practicalSteps: [
      'Acesse a ferramenta Score de Produto.',
      'Consulte a pontuação detalhada do item que pretende divulgar.',
      'Verifique os pontos fortes e os pontos de atenção apontados pela auditoria.',
      'Decida se o produto está aprovado para a sua esteira de publicações.',
    ],
    accentColor: '#10b981',
    cardGlow: 'rgba(16, 185, 129, 0.25)',
    coverImage: '/assets/capas/capa-score-produto.jpg',
    coverFallback: 'https://i.imgur.com/MnAzAIK.jpg',
    icon: Gauge,
  },
  {
    id: 'aula-6',
    number: '06',
    title: 'Score do Lojista',
    toolViewId: 'store',
    category: 'seguranca',
    categoryLabel: 'Segurança & Blindagem',
    duration: '12 min',
    shortDescription: 'Como avaliar a reputação do fornecedor parceiro para garantir envio rápido e comissão paga.',
    fullDescription:
      'Descubra como evitar surpresas desagradáveis com cancelamento de pedidos. A ferramenta Score do Lojista audita a confiabilidade da loja parceira dentro do TikTok Shop: velocidade de despacho, índice de avaliações positivas de compradores, taxa de devolução e estabilidade de estoque.',
    keyPoints: [
      'Como verificar se o lojista realmente despacha os pedidos em até 48 horas.',
      'Prevenção de cancelamentos que anulam a comissão do afiliado.',
      'Identificação de lojistas verificados com suporte prioritário a afiliados.',
      'Dicas para abordar o lojista e negociar comissões mais altas.',
    ],
    practicalSteps: [
      'Abra a ferramenta Score do Lojista.',
      'Verifique os índices de atendimento, entrega e notas dos compradores.',
      'Priorize lojistas com selo de alta confiabilidade.',
      'Vincule seus links de afiliado com a certeza de que as vendas serão entregues.',
    ],
    accentColor: '#06b6d4',
    cardGlow: 'rgba(6, 182, 212, 0.25)',
    coverImage: '/assets/capas/capa-score-lojista.jpg',
    coverFallback: 'https://i.imgur.com/JPoVtiW.jpg',
    icon: Store,
  },
  {
    id: 'aula-7',
    number: '07',
    title: 'Scanner',
    toolViewId: 'scanner',
    category: 'mineracao',
    categoryLabel: 'Mineração & Catálogo',
    duration: '17 min',
    shortDescription: 'Espione concorrentes e descubra anúncios e vídeos que estão escalando e vendendo agora.',
    fullDescription:
      'Aprenda a utilizar o Scanner da Orbiex para monitorar em tempo real os vídeos que estão estourando de vendas no TikTok Shop Brasil e Estados Unidos. Veja como analisar a estrutura dos vídeos dos concorrentes, extrair os ângulos de conversão e recriar versões superiores usando IA.',
    keyPoints: [
      'Como filtrar vídeos por visualizações crescentes nas últimas 24 e 48 horas.',
      'Identificação de padrões visuais que fazem o algoritmo recomendar o vídeo.',
      'Modelagem ética de criativos: como inspirar-se sem tomar restrição de originalidade.',
      'Mapeamento dos criadores mais consistentes de cada nicho.',
    ],
    practicalSteps: [
      'Abra a ferramenta Scanner e defina o nicho de interesse.',
      'Ordene os resultados pelos vídeos mais recentes com alto engajamento.',
      'Assista aos criativos e anote o gancho, a transição e a chamada para o carrinho.',
      'Use o Agente IA ou o Gerador de Prompts para recriar o conceito com originalidade.',
    ],
    accentColor: '#f59e0b',
    cardGlow: 'rgba(245, 158, 11, 0.25)',
    coverImage: '/assets/capas/capa-scanner.jpg',
    coverFallback: 'https://i.imgur.com/5EKpkWs.jpg',
    icon: Radar,
  },
  {
    id: 'aula-8',
    number: '08',
    title: 'Gerador de Headline',
    toolViewId: 'headlines',
    category: 'criativos',
    categoryLabel: 'Criativos & Prompts',
    duration: '11 min',
    shortDescription: 'Crie títulos persuasivos e textos na tela que forçam a pessoa a parar de rolar o feed.',
    fullDescription:
      'Uma boa headline na tela é responsável por 80% do sucesso de retenção de um vídeo curto. Nesta aula, você aprenderá a usar o Gerador de Headline para criar títulos com alto gatilho de curiosidade, quebra de padrão e urgência para posicionar nos primeiros 3 segundos do seu vídeo de produto.',
    keyPoints: [
      'Fórmulas comprovadas de headlines para produtos de moda, beleza e utilidades.',
      'Posicionamento correto do texto na tela para não cobrir botões do TikTok.',
      'Como testar 3 variações de manchete para o mesmo vídeo.',
      'Combinação de cores e fontes para máxima leitura no celular.',
    ],
    practicalSteps: [
      'Acesse a ferramenta Gerador de Headline.',
      'Selecione o nicho do produto e o ângulo de apelo desejado.',
      'Gere 10 opções instantâneas e escolha as 2 mais chamativas.',
      'Insira como texto fixo com fundo contrastante nos primeiros segundos da edição.',
    ],
    accentColor: '#e11d48',
    cardGlow: 'rgba(225, 29, 72, 0.25)',
    coverImage: '/assets/capas/capa-headlines.jpg',
    coverFallback: 'https://i.imgur.com/DgPmWKa.jpg',
    icon: Type,
  },
  {
    id: 'aula-9',
    number: '09',
    title: 'Hooks Virais',
    toolViewId: 'hooks',
    category: 'criativos',
    categoryLabel: 'Criativos & Prompts',
    duration: '14 min',
    shortDescription: 'Ganchos magnéticos falados e visuais para prender a atenção nos primeiros 3 segundos.',
    fullDescription:
      'Aprenda a dominar a arte dos Hooks Virais. O algoritmo do TikTok decide se vai distribuir seu vídeo nos primeiros 3 segundos de visualização. Veja como aplicar ganchos visuais, frases de impacto sonoro e quebras de expectativa que aumentam drasticamente a taxa de retenção e as vendas.',
    keyPoints: [
      'Os 5 tipos de ganchos com maior taxa de conversão no TikTok Shop.',
      'Ganchos de problema evidente vs ganchos de curiosidade irresistível.',
      'Como sincronizar o gancho falado com uma ação visual impactante do produto.',
      'Transição suave do gancho para a chamada do carrinho amarelo.',
    ],
    practicalSteps: [
      'Abra a ferramenta de Hooks Virais.',
      'Explore a lista de ganchos categorizados por dor, curiosidade e transformação.',
      'Copie o gancho ideal e adapte a primeira frase do seu roteiro.',
      'Gere o áudio ou legenda e garanta que ele aconteça imediatamente no segundo 01 do vídeo.',
    ],
    accentColor: '#eab308',
    cardGlow: 'rgba(234, 179, 8, 0.25)',
    coverImage: '/assets/capas/capa-hooks.jpg',
    coverFallback: 'https://i.imgur.com/KoXi9AI.jpg',
    icon: Zap,
  },
  {
    id: 'aula-10',
    number: '10',
    title: 'Extrator de Movimentos',
    toolViewId: 'motion',
    category: 'ia',
    categoryLabel: 'Núcleo de IA',
    duration: '16 min',
    shortDescription: 'Isole movimentos, gestos de mãos e ações de demonstração de vídeos para replicar em IA.',
    fullDescription:
      'Aprenda a dissecar vídeos virais de sucesso e extrair a movimentação exata do produto ou das mãos para recriar com inteligência artificial. Esta aula ensina como alimentar ferramentas como Kling AI e Runway com parâmetros cinéticos precisos para gerar vídeos hiper-realistas.',
    keyPoints: [
      'Como analisar a velocidade, enquadramento e ângulo de movimento da câmera.',
      'Transformação de gestos humanos em descrições de movimento aceitas por IA.',
      'Replicação de demonstrações práticas de produtos físicos sem precisar gravar.',
      'Eliminação de movimentos robóticos ou artificiais na geração de IA.',
    ],
    practicalSteps: [
      'Entre na ferramenta Extrator de Movimentos.',
      'Envie o link ou arquivo do vídeo viral de referência que deseja analisar.',
      'Copie o relatório de movimentos e os comandos de prompt cinético gerados.',
      'Aplique os parâmetros na sua plataforma de geração de vídeo por IA.',
    ],
    accentColor: '#8b5cf6',
    cardGlow: 'rgba(139, 92, 246, 0.25)',
    coverImage: '/assets/capas/capa-motion.jpg',
    coverFallback: 'https://i.imgur.com/qZu8hTx.jpg',
    icon: Clapperboard,
  },
  {
    id: 'aula-11',
    number: '11',
    title: 'Gerador de Prompts',
    toolViewId: 'prompt-gen',
    category: 'ia',
    categoryLabel: 'Núcleo de IA',
    duration: '15 min',
    shortDescription: 'IA calibrada especificamente para criar prompts técnicos de imagem e vídeo em formato vertical.',
    fullDescription:
      'Descubra como o Gerador de Prompts da Orbiex elimina a necessidade de você aprender engenharia de prompts. Diga o produto e o que você deseja mostrar, e a inteligência artificial retorna os códigos técnicos exatos em inglês para Kling AI, Flow/VEO e Midjourney, com proporção 9:16 e prompt negativo embutido.',
    keyPoints: [
      'Como solicitar prompts cinematográficos em apenas uma frase em português.',
      'Formatação automática para proporção vertical de celular (aspect ratio 9:16).',
      'Inclusão automática de parâmetros de iluminação volumétrica, lentes e textura 4k.',
      'Prompt negativo incluso para garantir mãos perfeitas e produtos sem distorção.',
    ],
    practicalSteps: [
      'Acesse o Gerador de Prompts.',
      'Digite uma descrição simples (ex: "mulher no espelho experimentando vestido longo preto").',
      'Copie os 3 blocos gerados: Prompt de Vídeo, Prompt Negativo e Prompt de Imagem.',
      'Cole na sua ferramenta de IA e gere o criativo em alta definição.',
    ],
    accentColor: '#f97316',
    cardGlow: 'rgba(249, 115, 22, 0.25)',
    coverImage: '/assets/capas/capa-prompt-gen.jpg',
    coverFallback: 'https://i.imgur.com/ct4Sz5O.jpg',
    icon: Terminal,
  },
  {
    id: 'aula-12',
    number: '12',
    title: 'Antirrestrição',
    toolViewId: 'antirestriction',
    category: 'seguranca',
    categoryLabel: 'Segurança & Blindagem',
    duration: '20 min',
    shortDescription: 'Blindagem total da sua conta, esteira de apelações e regras para nunca tomar banimento.',
    fullDescription:
      'Esta é uma das aulas mais importantes do treinamento. Você aprenderá como blindar seu perfil contra as políticas rígidas do TikTok Shop. Descubra quais palavras nunca dizer, como evitar penalidades de "conteúdo não original", e use nossos modelos de apelação prontos para recuperar contas e vídeos bloqueados injustamente.',
    keyPoints: [
      'Lista negra de termos proibidos (promessas exageradas, falsas curas, termos agressivos).',
      'A regra de ouro da conformidade: produto mostrado no vídeo 100% idêntico ao carrinho.',
      'Como utilizar áudios da biblioteca comercial para não perder o som do vídeo.',
      'Modelos formais de apelação para copiar e colar no suporte do TikTok Shop.',
    ],
    practicalSteps: [
      'Acesse o módulo de Antirrestrição.',
      'Revise a lista de verificação antes de publicar qualquer novo criativo.',
      'Em caso de advertência ou vídeo rejeitado, consulte a aba de Apelações.',
      'Copie o texto de recurso adequado e submeta imediatamente no painel de suporte do TikTok.',
    ],
    accentColor: '#ef4444',
    cardGlow: 'rgba(239, 68, 68, 0.25)',
    coverImage: '/assets/capas/capa-antirrestricao.jpg',
    coverFallback: 'https://i.imgur.com/mXr6ST1.jpg',
    icon: ShieldAlert,
  },
  {
    id: 'aula-13',
    number: '13',
    title: 'Turbo de Seguidores',
    toolViewId: 'turbo',
    category: 'estrategia',
    categoryLabel: 'Estratégia & Metas',
    duration: '13 min',
    shortDescription: 'Estratégia orgânica acelerada para bater os primeiros 1.000 a 5.000 seguidores e liberar o Shop.',
    fullDescription:
      'Aprenda como aquecer contas novas do zero e conquistar os requisitos de seguidores necessários para liberar o TikTok Shop de Criadores. Veja como usar formatos de vídeos magnéticos de alta retenção, sons virais e técnicas orgânicas sem gastar nenhum centavo com anúncios ou compras de seguidores falsos.',
    keyPoints: [
      'Processo correto de aquecimento de conta nos primeiros 3 dias.',
      'Formatos de vídeos rápidos de 7 a 11 segundos para acumular seguidores em massa.',
      'Por que nunca comprar seguidores fakes e como isso destrói a entrega do algoritmo.',
      'Transição do perfil de aquecimento para a máquina de vendas com carrinho amarelo.',
    ],
    practicalSteps: [
      'Abra a ferramenta Turbo de Seguidores.',
      'Siga o cronograma de 7 dias de publicações de aquecimento.',
      'Aplique os modelos de vídeos rápidos com áudios em tendência.',
      'Assim que bater os seguidores necessários, ative o programa de afiliados do TikTok Shop.',
    ],
    accentColor: '#ec4899',
    cardGlow: 'rgba(236, 72, 153, 0.25)',
    coverImage: '/assets/capas/capa-turbo.jpg',
    coverFallback: 'https://i.imgur.com/Nv7Uaqy.jpg',
    icon: Rocket,
  },
];

interface MembersViewProps {
  onNavigate?: (view: any) => void;
}

export function MembersView({ onNavigate }: MembersViewProps) {
  const [selectedLesson, setSelectedLesson] = useState<LessonItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('todos');

  // Custom video URLs saved by user/admin
  const [customVideos, setCustomVideos] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem('orbiex_custom_lesson_videos');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const [editingVideoUrl, setEditingVideoUrl] = useState(false);
  const [videoUrlInput, setVideoUrlInput] = useState('');

  // Completed lessons tracking
  const [completedLessons, setCompletedLessons] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('orbiex_completed_lessons_v2');
      return stored ? JSON.parse(stored) : ['aula-1'];
    } catch {
      return ['aula-1'];
    }
  });

  const totalLessons = LESSONS_CATALOG.length;

  const progressPercentage = useMemo(() => {
    if (totalLessons === 0) return 0;
    return Math.round((completedLessons.length / totalLessons) * 100);
  }, [completedLessons.length, totalLessons]);

  const toggleLessonCompleted = (lessonId: string) => {
    setCompletedLessons((prev) => {
      const updated = prev.includes(lessonId)
        ? prev.filter((id) => id !== lessonId)
        : [...prev, lessonId];
      try {
        localStorage.setItem('orbiex_completed_lessons_v2', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleSaveVideoUrl = (lessonId: string) => {
    const updated = { ...customVideos, [lessonId]: videoUrlInput.trim() };
    setCustomVideos(updated);
    try {
      localStorage.setItem('orbiex_custom_lesson_videos', JSON.stringify(updated));
    } catch {}
    setEditingVideoUrl(false);
  };

  const filteredLessons = useMemo(() => {
    return LESSONS_CATALOG.filter((lesson) => {
      const matchesCategory =
        activeCategory === 'todos' || lesson.category === activeCategory;
      const matchesSearch =
        searchQuery === '' ||
        lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lesson.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lesson.keyPoints.some((p) => p.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const handleSelectLesson = (lesson: LessonItem) => {
    setSelectedLesson(lesson);
    setEditingVideoUrl(false);
    setVideoUrlInput(customVideos[lesson.id] || lesson.videoUrl || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNextLesson = () => {
    if (!selectedLesson) return;
    const currentIndex = LESSONS_CATALOG.findIndex((l) => l.id === selectedLesson.id);
    if (currentIndex < LESSONS_CATALOG.length - 1) {
      handleSelectLesson(LESSONS_CATALOG[currentIndex + 1]);
    }
  };

  const handlePrevLesson = () => {
    if (!selectedLesson) return;
    const currentIndex = LESSONS_CATALOG.findIndex((l) => l.id === selectedLesson.id);
    if (currentIndex > 0) {
      handleSelectLesson(LESSONS_CATALOG[currentIndex - 1]);
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedLesson]);

  /* ══════════════════════════════════════════════════════════════════
     TELA 2: VISUALIZADOR DA AULA (CINEMATIC PLAYER + DETALHES + PLAYLIST)
  ══════════════════════════════════════════════════════════════════ */
  if (selectedLesson) {
    const isCompleted = completedLessons.includes(selectedLesson.id);
    const currentIndex = LESSONS_CATALOG.findIndex((l) => l.id === selectedLesson.id);
    const activeVideo = customVideos[selectedLesson.id] || selectedLesson.videoUrl || '';
    const LessonIcon = selectedLesson.icon;

    // Helper to format embed url if needed
    const getEmbedUrl = (raw: string): string => {
      if (!raw) return '';
      if (raw.includes('youtube.com/watch?v=')) {
        const id = raw.split('v=')[1]?.split('&')[0];
        return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
      }
      if (raw.includes('youtu.be/')) {
        const id = raw.split('youtu.be/')[1]?.split('?')[0];
        return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
      }
      if (raw.includes('vimeo.com/')) {
        const id = raw.split('vimeo.com/')[1]?.split('?')[0];
        return `https://player.vimeo.com/video/${id}?autoplay=1`;
      }
      return raw;
    };

    const embedUrl = getEmbedUrl(activeVideo);

    return (
      <div className="mvz-fade-up pb-24 space-y-6 max-w-7xl mx-auto">
        {/* ── Top Bar: Voltar para Aulas + Progresso + Navegação ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <button
            type="button"
            onClick={() => setSelectedLesson(null)}
            className="group inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-[12.5px] font-bold text-white/80 transition-all duration-200 hover:border-[var(--mvz-gold)]/60 hover:bg-white/[0.07] hover:text-[var(--mvz-gold-light)]"
          >
            <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-1 text-[var(--mvz-gold)]" />
            <span>Voltar para Grade de Aulas</span>
          </button>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[12px] text-white/50">
              Aula <strong className="text-white">{currentIndex + 1}</strong> de <strong>{totalLessons}</strong>
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrevLesson}
                disabled={currentIndex === 0}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] text-white/70 hover:bg-white/[0.08] hover:text-white disabled:opacity-30 disabled:pointer-events-none transition"
                title="Aula anterior"
              >
                <ArrowLeft size={14} />
              </button>
              <button
                type="button"
                onClick={handleNextLesson}
                disabled={currentIndex === LESSONS_CATALOG.length - 1}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] text-white/70 hover:bg-white/[0.08] hover:text-white disabled:opacity-30 disabled:pointer-events-none transition"
                title="Próxima aula"
              >
                <ArrowRight size={14} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => toggleLessonCompleted(selectedLesson.id)}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-[12px] font-bold transition-all duration-200 active:scale-95 ${
                isCompleted
                  ? 'border-[#22c55e]/40 bg-[#22c55e]/15 text-[#22c55e] shadow-[0_0_15px_rgba(34,197,94,0.3)]'
                  : 'border-white/10 bg-white/[0.03] text-white/70 hover:border-white/30 hover:text-white'
              }`}
            >
              {isCompleted ? <Check size={14} strokeWidth={3} /> : <CheckCircle2 size={14} />}
              <span>{isCompleted ? 'Aula Concluída' : 'Marcar como Concluída'}</span>
            </button>
          </div>
        </div>

        {/* ── Grid Principal: Player de Vídeo + Detalhes + Playlist Lateral ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Coluna Esquerda: Player & Detalhes da Aula (8 colunas) */}
          <div className="space-y-6 lg:col-span-8">
            {/* ── Player de Vídeo Cinematográfico ── */}
            <div className="relative aspect-video w-full overflow-hidden rounded-[24px] border border-white/10 bg-[#070605] shadow-[0_20px_60px_rgba(0,0,0,0.9)]">
              {activeVideo ? (
                embedUrl.includes('youtube.com') || embedUrl.includes('player.vimeo.com') ? (
                  <iframe
                    src={embedUrl}
                    title={selectedLesson.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="h-full w-full border-0"
                  />
                ) : (
                  <video
                    src={activeVideo}
                    controls
                    autoPlay
                    className="h-full w-full object-contain"
                  />
                )
              ) : (
                /* Placeholder Cinematográfico Elegante usando a capa oficial */
                <div className="relative flex h-full w-full flex-col items-center justify-center p-8 text-center overflow-hidden">
                  <img
                    src={selectedLesson.coverImage || '/assets/capa-modulo-orbiex.jpg'}
                    onError={(e) => {
                      if (selectedLesson.coverFallback && e.currentTarget.src !== selectedLesson.coverFallback) {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = selectedLesson.coverFallback;
                      }
                    }}
                    alt={selectedLesson.title}
                    className="absolute inset-0 h-full w-full object-cover object-center opacity-40 filter contrast-125"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/75 to-black/50" />

                  <div className="relative z-10 flex flex-col items-center">
                    <div
                      className="flex h-20 w-20 items-center justify-center rounded-3xl border border-white/15 bg-white/[0.05] shadow-2xl backdrop-blur-md mb-5"
                      style={{ borderColor: `${selectedLesson.accentColor}55` }}
                    >
                      <LessonIcon size={36} style={{ color: selectedLesson.accentColor }} />
                    </div>

                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-widest text-white/70 mb-2">
                      AULA {selectedLesson.number} • {selectedLesson.categoryLabel}
                    </div>

                    <h2 className="text-[26px] sm:text-[32px] font-black tracking-tight text-white">
                      {selectedLesson.title}
                    </h2>

                    <p className="mt-2 max-w-md text-[13px] text-white/60 leading-relaxed">
                      {selectedLesson.shortDescription}
                    </p>

                    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                      <div className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--mvz-gold)]/40 bg-[var(--mvz-gold)]/10 px-4 py-2 text-[12px] font-bold text-[var(--mvz-gold-light)]">
                        <Clock size={14} />
                        <span>Duração: {selectedLesson.duration}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setEditingVideoUrl(true)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.05] px-4 py-2 text-[12px] font-bold text-white/90 hover:border-white/40 hover:bg-white/10 transition"
                      >
                        <Edit3 size={14} />
                        <span>Configurar Link do Vídeo</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Painel de Configuração Rápida do Link do Vídeo (para o usuário colar seu link do YouTube/Vimeo/Panda/MP4) */}
            {editingVideoUrl && (
              <div className="rounded-2xl border border-[var(--mvz-gold)]/30 bg-[#12100c] p-4 text-[13px] animate-fade-in shadow-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-[var(--mvz-gold-light)] flex items-center gap-2">
                    <Video size={15} />
                    <span>Vincular Link de Vídeo para: {selectedLesson.title}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditingVideoUrl(false)}
                    className="text-white/40 hover:text-white text-[12px]"
                  >
                    Fechar
                  </button>
                </div>
                <p className="text-[11.5px] text-white/60 mb-3">
                  Cole o link direto do YouTube, Vimeo, Panda Video ou link direto .mp4. Ele ficará salvo automaticamente.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={videoUrlInput}
                    onChange={(e) => setVideoUrlInput(e.target.value)}
                    placeholder="Ex: https://www.youtube.com/watch?v=XXXX ou link direto MP4"
                    className="h-10 flex-1 rounded-xl border border-white/15 bg-black/60 px-3.5 text-[13px] text-white placeholder-white/30 focus:border-[var(--mvz-gold)] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveVideoUrl(selectedLesson.id)}
                    className="h-10 rounded-xl bg-[var(--mvz-gold)] px-5 text-[12px] font-black text-black hover:bg-[var(--mvz-gold-light)] transition"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            )}

            {/* ── Informações Detalhadas da Aula ── */}
            <div className="rounded-[24px] border border-white/10 bg-[#0d0c0a] p-6 sm:p-7 shadow-[0_16px_45px_rgba(0,0,0,0.85)] space-y-6">
              {/* Título & Atalho para abrir a ferramenta */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10.5px] font-extrabold uppercase tracking-wider text-white/70 mb-2">
                    <span>AULA {selectedLesson.number}</span>
                    <span>•</span>
                    <span style={{ color: selectedLesson.accentColor }}>{selectedLesson.categoryLabel}</span>
                  </div>
                  <h1 className="text-[24px] sm:text-[28px] font-black text-white tracking-tight">
                    {selectedLesson.title}
                  </h1>
                </div>

                {onNavigate && (
                  <button
                    type="button"
                    onClick={() => onNavigate(selectedLesson.toolViewId)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/[0.06] border border-white/15 px-4 py-2.5 text-[12.5px] font-extrabold text-white transition hover:border-[var(--mvz-gold)] hover:bg-[var(--mvz-gold)]/10 hover:text-[var(--mvz-gold-light)]"
                  >
                    <span>Abrir Ferramenta no Painel</span>
                    <ExternalLink size={14} className="text-[var(--mvz-gold)]" />
                  </button>
                )}
              </div>

              {/* Descrição Geral */}
              <div>
                <h3 className="text-[13px] font-black uppercase tracking-wider text-white/50 mb-2">
                  Visão Geral da Função
                </h3>
                <p className="text-[14px] leading-relaxed text-white/80">
                  {selectedLesson.fullDescription}
                </p>
              </div>

              {/* O que você vai dominar (Pontos Chave) */}
              <div>
                <h3 className="text-[13px] font-black uppercase tracking-wider text-white/50 mb-3">
                  O Que Você Vai Dominar Nesta Aula
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedLesson.keyPoints.map((point, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 rounded-xl border border-white/[0.06] bg-black/40 p-3"
                    >
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--mvz-gold)]/15 text-[var(--mvz-gold-light)] text-[11px] font-black">
                        {idx + 1}
                      </div>
                      <span className="text-[12.5px] text-white/80 leading-snug">{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Passo a Passo de Operação */}
              <div>
                <h3 className="text-[13px] font-black uppercase tracking-wider text-white/50 mb-3">
                  Passo a Passo de Aplicação Prática
                </h3>
                <div className="space-y-2.5">
                  {selectedLesson.practicalSteps.map((step, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] px-3.5 py-2.5 text-[12.5px] text-white/75"
                    >
                      <CheckCircle2 size={16} className="text-[#22c55e] shrink-0" />
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Coluna Direita: Playlist com as 13 Aulas (4 colunas) */}
          <div className="space-y-4 lg:col-span-4">
            <div className="rounded-[24px] border border-white/10 bg-[#0d0c0a] p-5 shadow-[0_16px_45px_rgba(0,0,0,0.85)] sticky top-6">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-4">
                <div>
                  <h3 className="text-[15px] font-black text-white tracking-tight flex items-center gap-2">
                    <GraduationCap size={18} className="text-[var(--mvz-gold)]" />
                    <span>Grade de Aulas</span>
                  </h3>
                  <p className="text-[11px] text-white/50 mt-0.5">
                    {completedLessons.length} de {totalLessons} concluídas ({progressPercentage}%)
                  </p>
                </div>

                <div className="h-2 w-16 overflow-hidden rounded-full bg-white/10">
                  <div
                    style={{ width: `${progressPercentage}%` }}
                    className="h-full rounded-full bg-gradient-to-r from-[var(--mvz-gold)] to-white"
                  />
                </div>
              </div>

              {/* Lista das 13 Aulas em Scroll */}
              <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1 mvz-scroll">
                {LESSONS_CATALOG.map((item) => {
                  const isCurrent = item.id === selectedLesson.id;
                  const itemCompleted = completedLessons.includes(item.id);
                  const ItemIcon = item.icon;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectLesson(item)}
                      className={`group flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all duration-200 border ${
                        isCurrent
                          ? 'border-[var(--mvz-gold)]/60 bg-[var(--mvz-gold)]/10 shadow-[0_0_20px_rgba(212,175,55,0.15)]'
                          : 'border-white/[0.04] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]'
                      }`}
                    >
                      {/* Número / Ícone */}
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-black text-[12px] transition ${
                          isCurrent
                            ? 'bg-[var(--mvz-gold)] text-black'
                            : itemCompleted
                            ? 'bg-[#22c55e]/15 text-[#22c55e]'
                            : 'bg-white/[0.05] text-white/50 group-hover:text-white'
                        }`}
                      >
                        {itemCompleted ? (
                          <Check size={16} strokeWidth={3} />
                        ) : (
                          <ItemIcon size={16} />
                        )}
                      </div>

                      {/* Informações da Aula */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="text-[10px] font-black uppercase tracking-wider text-white/40">
                            AULA {item.number}
                          </span>
                          <span className="text-[10px] font-semibold text-white/40">
                            {item.duration}
                          </span>
                        </div>
                        <h4
                          className={`truncate text-[13px] font-bold ${
                            isCurrent
                              ? 'text-[var(--mvz-gold-light)]'
                              : 'text-white/90 group-hover:text-white'
                          }`}
                        >
                          {item.title}
                        </h4>
                      </div>

                      {isCurrent && (
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--mvz-gold)] shrink-0 animate-ping" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════════
     TELA 1: GRADE COMPLETA DAS 13 AULAS (CAPINHAS TOP E DESIGN PREMIUM)
  ══════════════════════════════════════════════════════════════════ */
  return (
    <div className="mvz-fade-up pb-24 space-y-8 max-w-7xl mx-auto">
      {/* ────────────────────────────────────────────────────────────
          CINEMATIC HERO BANNER: ORBIEX ACADEMY (BANNER ORIGINAL)
      ──────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#121216] via-[#09090b] to-black p-6 sm:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
        {/* Glow ambient background */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full bg-[#d4af37]/15 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-80 w-80 rounded-full bg-[#38bdf8]/10 blur-[140px]" />

        {/* Mentor / Founder Photo overlay on desktop com alta nitidez e claridade */}
        <div className="pointer-events-none absolute right-0 top-0 hidden h-full w-[52%] overflow-hidden lg:block">
          <img
            src="/assets/login-orbix-man.jpg"
            alt="Murilo Vaz • Orbiex Founder"
            className="h-full w-full object-cover object-[center_25%] opacity-85 filter contrast-110 brightness-105"
          />
          {/* Metade esquerda escurecida para manter a leitura dos textos impecável */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#121216] via-[#121216]/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 max-w-2xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--mvz-gold)]/40 bg-[var(--mvz-gold)]/10 px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-widest text-[#f5df93]">
            <GraduationCap size={13} className="text-[#d4af37]" />
            <span>Área de Membros • Formação Oficial</span>
          </div>

          <h1 className="mt-4 text-[28px] font-black leading-tight tracking-tight text-white sm:text-[38px]">
            Orbiex <span className="bg-gradient-to-r from-[#fffdf0] via-[#d4af37] to-[#a37418] bg-clip-text text-transparent">Academy</span>
          </h1>
          <p className="mt-3 text-[14px] leading-relaxed text-[#9a9aa3] sm:text-[15px]">
            O método prático para construir e escalar operações lucrativas de afiliado no TikTok Shop com Inteligência Artificial, mineração preditiva e blindagem algorítmica.
          </p>

          {/* Student Progress Bar (Mais compacto, menos largo e proporcional) */}
          <div className="mt-7 w-full max-w-[340px] rounded-2xl border border-white/10 bg-black/60 p-3.5 backdrop-blur-md">
            <div className="flex items-center justify-between text-[11.5px]">
              <span className="font-bold text-white/90">Seu Progresso</span>
              <span className="font-extrabold text-[#d4af37]">{progressPercentage}% Concluído</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#d4af37] via-[#f5df93] to-[#aa7b1e] transition-all duration-500 shadow-[0_0_12px_rgba(212,175,55,0.4)]"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[10.5px] text-[#70707a]">
              <span>{completedLessons.length} de {totalLessons} aulas concluídas</span>
              {completedLessons.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setCompletedLessons([]);
                    try {
                      localStorage.setItem('orbiex_completed_lessons_v2', JSON.stringify([]));
                    } catch {}
                  }}
                  className="inline-flex items-center gap-1 text-[10px] text-white/40 hover:text-white/80 transition"
                  title="Resetar progresso das aulas"
                >
                  <RotateCcw size={10} />
                  <span>Zerar</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────
          2. FILTROS POR CATEGORIA & BARRA DE BUSCA
      ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Filtros em Pílulas */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'todos', label: 'Todas as Aulas (13)' },
            { id: 'ia', label: 'Núcleo de IA' },
            { id: 'estrategia', label: 'Estratégia & Metas' },
            { id: 'mineracao', label: 'Mineração & Produtos' },
            { id: 'criativos', label: 'Criativos & Prompts' },
            { id: 'seguranca', label: 'Segurança & Blindagem' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`rounded-xl px-3.5 py-2 text-[12px] font-extrabold transition-all duration-200 ${
                activeCategory === cat.id
                  ? 'bg-[var(--mvz-gold)] text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]'
                  : 'border border-white/10 bg-white/[0.02] text-white/60 hover:border-white/20 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Campo de Busca Rápida */}
        <div className="relative w-full md:w-72">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar aula ou ferramenta..."
            className="h-10 w-full rounded-xl border border-white/10 bg-black/60 pl-9 pr-3.5 text-[12.5px] text-white placeholder-white/30 transition focus:border-[var(--mvz-gold)] focus:outline-none"
          />
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────
          3. GRADE DAS 13 AULAS (CAPINHAS TOP COM DESIGN DE ALTO NÍVEL)
      ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredLessons.map((lesson) => {
          const isDone = completedLessons.includes(lesson.id);

          return (
            <div
              key={lesson.id}
              onClick={() => handleSelectLesson(lesson)}
              className="group relative flex flex-col justify-between overflow-hidden rounded-[24px] border border-white/10 bg-[#0d0c0a] p-0 shadow-[0_16px_45px_rgba(0,0,0,0.85)] transition-all duration-300 hover:-translate-y-1.5 hover:border-[var(--mvz-gold)]/60 hover:shadow-[0_20px_60px_rgba(212,175,55,0.2)] cursor-pointer"
            >
              {/* ── Capinha Cinematográfica (Aspect Ratio 16:9) do Risco Superior para Cima ── */}
              <div className="relative aspect-video w-full overflow-hidden border-b border-white/[0.08]">
                {/* Imagem Oficial da Capa do Módulo */}
                <img
                  src={lesson.coverImage || '/assets/capa-modulo-orbiex.jpg'}
                  onError={(e) => {
                    if (lesson.coverFallback && e.currentTarget.src !== lesson.coverFallback) {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = lesson.coverFallback;
                    }
                  }}
                  alt={lesson.title}
                  className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                />

                {/* Overlay de gradiente suave para leitura perfeita das tags */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/60" />

                {/* Conteúdo sobreposto */}
                <div className="relative z-10 flex h-full w-full flex-col justify-between p-4">
                  {/* Topo da Capinha: Badge da Aula + Duração */}
                  <div className="flex items-center justify-between">
                    <span className="rounded-lg border border-white/20 bg-black/70 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-md shadow-lg">
                      AULA {lesson.number}
                    </span>

                    <span className="flex items-center gap-1 rounded-lg border border-white/15 bg-black/70 px-2 py-1 text-[10.5px] font-bold text-white/90 backdrop-blur-md shadow-lg">
                      <Clock size={12} className="text-[var(--mvz-gold)]" />
                      <span>{lesson.duration}</span>
                    </span>
                  </div>

                  {/* Centro: Botão de Play que surge ao passar o mouse */}
                  <div className="flex items-center justify-center my-auto">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--mvz-gold)] text-black shadow-[0_0_24px_rgba(212,175,55,0.7)] opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110">
                      <Play size={18} fill="black" className="ml-0.5" />
                    </div>
                  </div>

                  {/* Rodapé da Capinha: Categoria da Ferramenta + Status */}
                  <div className="flex items-center justify-between">
                    <span
                      className="rounded-md border border-white/15 bg-black/75 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-md"
                      style={{ color: lesson.accentColor }}
                    >
                      {lesson.categoryLabel}
                    </span>

                    {isDone && (
                      <span className="inline-flex items-center gap-1 rounded-md border border-[#22c55e]/40 bg-[#22c55e]/30 px-2 py-0.5 text-[9.5px] font-black text-[#22c55e] backdrop-blur-md">
                        <Check size={11} strokeWidth={3} />
                        CONCLUÍDA
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Corpo do Card: Nome da Aula + Descrição + Ação ── */}
              <div className="flex flex-1 flex-col justify-between p-5 space-y-4">
                <div>
                  <h3 className="text-[18px] font-extrabold text-white tracking-tight group-hover:text-[var(--mvz-gold-light)] transition-colors">
                    {lesson.title}
                  </h3>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-white/60 line-clamp-2">
                    {lesson.shortDescription}
                  </p>
                </div>

                {/* Botão Assistir Aula */}
                <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                  <span className="text-[12px] font-bold text-[var(--mvz-gold)] flex items-center gap-1.5 group-hover:translate-x-1 transition-transform">
                    <span>Assistir Aula</span>
                    <ArrowRight size={14} />
                  </span>

                  <span className="text-[11px] text-white/40 font-medium">
                    {isDone ? 'Rever aula' : 'Pendente'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

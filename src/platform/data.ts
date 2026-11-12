import {
  Home,
  Bot,
  Gauge,
  Store,
  Radar,
  Zap,
  Library,
  Workflow,
  LifeBuoy,
  CircleHelp,
  Sparkles,
  ScanSearch,
  Wand2,
  Package,
  Flame,
  ScanEye,
  Compass,
  ShieldAlert,
  type LucideIcon,
} from 'lucide-react';

export type ViewId =
  | 'home'
  | 'agent'
  | 'journey'
  | 'products'
  | 'product'
  | 'store'
  | 'scanner'
  | 'motion'
  | 'turbo'
  | 'headlines'
  | 'hooks'
  | 'prompts'
  | 'prompt-gen'
  | 'antirestriction'
  | 'automations'
  | 'credits'
  | 'community'
  | 'support'
  | 'help';

export type Tone = 'cyan' | 'pink' | 'violet' | 'green' | 'amber';

export interface NavItem {
  id: ViewId;
  label: string;
  icon: LucideIcon;
  badge?: { text: string; tone: Tone };
}

/** Sidebar structure — groups are separated by dividers, like the reference. */
export const NAV_GROUPS: NavItem[][] = [
  [
    { id: 'home', label: 'Início', icon: Home },
    { id: 'agent', label: 'Agente IA', icon: Bot },
    { id: 'journey', label: 'Minha Jornada', icon: Compass },
    { id: 'products', label: 'Produtos', icon: Package },
    { id: 'prompts', label: 'Biblioteca de Prompts', icon: Library },
  ],
  [
    { id: 'product', label: 'Score Produto', icon: Gauge },
    { id: 'store', label: 'Score Lojista', icon: Store },
    { id: 'scanner', label: 'Scanner', icon: ScanSearch },
  ],
  [
    { id: 'headlines', label: 'Gerador de Headline', icon: Wand2 },
    { id: 'hooks', label: 'Hooks Virais', icon: Zap },
    { id: 'motion', label: 'Extrator de Movimentos', icon: ScanEye },
    { id: 'prompt-gen', label: 'Gerador de Prompts', icon: Sparkles },
    { id: 'antirestriction', label: 'Antirrestrição', icon: ShieldAlert },
    { id: 'turbo', label: 'Turbo Seguidores', icon: Flame },
  ],
];

export const NAV_FOOTER: NavItem[] = [
  { id: 'support', label: 'Suporte', icon: LifeBuoy },
  { id: 'help', label: 'Ajuda', icon: CircleHelp },
];

export const ALL_NAV: NavItem[] = [...NAV_GROUPS.flat(), ...NAV_FOOTER];

export const VIEW_TITLES: Record<ViewId, string> = {
  home: 'Início',
  agent: 'Agente IA',
  prompts: 'Biblioteca de Prompts',
  'prompt-gen': 'Gerador de Prompts',
  antirestriction: 'Antirrestrição',
  products: 'Produtos',
  product: 'Score Produto',
  store: 'Score Lojista',
  scanner: 'Scanner',
  headlines: 'Gerador de Headline',
  hooks: 'Hooks Virais',
  motion: 'Extrator de Movimentos',
  turbo: 'Turbo Seguidores',
  journey: 'Minha Jornada',
  automations: 'Automações',
  credits: 'Créditos',
  community: 'Comunidade',
  support: 'Suporte',
  help: 'Ajuda',
};

/* ─────────────── Ecosystem tools (home + tools hub) ─────────────── */

export interface ToolCard {
  id: string;
  view: ViewId;
  title: string;
  desc: string;
  icon: LucideIcon;
  tone: Tone;
  category: 'Análise' | 'Criação' | 'Automação' | 'Conhecimento';
  badge?: string;
}

export const TOOLS: ToolCard[] = [
  {
    id: 'agent',
    view: 'agent',
    title: 'Agente IA',
    desc: 'Converse, delegue tarefas e deixe o agente usar todas as ferramentas por você.',
    icon: Bot,
    tone: 'cyan',
    category: 'Automação',
  },
  {
    id: 'prompts',
    view: 'prompts',
    title: 'Biblioteca de Prompts',
    desc: 'Prompts testados para vídeo, copy, anúncios e estratégia — prontos para usar.',
    icon: Library,
    tone: 'cyan',
    category: 'Criação',
  },
  {
    id: 'products',
    view: 'products',
    title: 'Produtos Vencedores',
    desc: 'Arsenal de ofertas validadas com alto lucro prontas para modelar e escalar.',
    icon: Package,
    tone: 'amber',
    category: 'Análise',
  },
  {
    id: 'product',
    view: 'product',
    title: 'Score Produto',
    desc: 'Score de 0 a 100 com demanda, concorrência, margem e potencial viral.',
    icon: Gauge,
    tone: 'pink',
    category: 'Análise',
  },
  {
    id: 'store',
    view: 'store',
    title: 'Score Lojista',
    desc: 'Diagnóstico completo de reputação, catálogo, preço e conversão.',
    icon: Store,
    tone: 'violet',
    category: 'Análise',
  },
  {
    id: 'scanner',
    view: 'scanner',
    title: 'Scanner',
    desc: 'Descubra o que os concorrentes vendem, postam e onde estão as brechas.',
    icon: Radar,
    tone: 'violet',
    category: 'Análise',
  },
  {
    id: 'headlines',
    view: 'headlines',
    title: 'Gerador de Headline',
    desc: 'Headlines virais para vídeos sem fala focadas em caimento e conversão.',
    icon: Wand2,
    tone: 'amber',
    category: 'Criação',
  },
  {
    id: 'hooks',
    view: 'hooks',
    title: 'Hooks Virais',
    desc: 'Aberturas que prendem nos 3 primeiros segundos, por estilo e produto.',
    icon: Zap,
    tone: 'amber',
    category: 'Criação',
  },
  {
    id: 'motion',
    view: 'motion',
    title: 'Extrator de Movimentos',
    desc: 'Visão computacional que disseca movimentos de vídeo em prompts prontos para Kling, Hailuo e Flow.',
    icon: ScanEye,
    tone: 'amber',
    category: 'Criação',
  },
  {
    id: 'turbo',
    view: 'turbo',
    title: 'Turbo Seguidores',
    desc: 'Mascotes 3D virais e roteiros de duelos com alta retenção para explodir seguidores.',
    icon: Flame,
    tone: 'pink',
    category: 'Criação',
  },
  {
    id: 'antirestriction',
    view: 'antirestriction',
    title: 'Antirrestrição de Vídeo',
    desc: 'Scanner visual e auditivo de criativos com veredito direto para evitar bloqueios no TikTok Shop e Meta.',
    icon: ShieldAlert,
    tone: 'amber',
    category: 'Análise',
  },
];

/* ─────────────── Prompt library ─────────────── */

export const PROMPT_CATEGORIES = ['Todos', 'Vídeo', 'Copy', 'Produto', 'Loja', 'Anúncios', 'Estratégia'] as const;
export type PromptCategory = (typeof PROMPT_CATEGORIES)[number];

export interface PromptItem {
  id: string;
  title: string;
  category: Exclude<PromptCategory, 'Todos'>;
  text: string;
  uses: number;
  tag?: string;
}

export const PROMPTS: PromptItem[] = [
  {
    id: 'p1',
    title: 'Roteiro de vídeo sem aparecer',
    category: 'Vídeo',
    tag: 'Mais usado',
    uses: 2840,
    text: 'Crie um roteiro de 30 segundos para TikTok sobre [PRODUTO], sem mostrar o rosto. Estrutura: hook de 3s, problema, demonstração, prova social e CTA. Use frases curtas e indique o que mostrar em cada cena.',
  },
  {
    id: 'p2',
    title: 'Hook de curiosidade',
    category: 'Vídeo',
    uses: 1932,
    text: 'Escreva 10 hooks de curiosidade para um vídeo sobre [PRODUTO]. Cada hook deve ter no máximo 12 palavras e gerar a pergunta "como assim?" na cabeça do espectador.',
  },
  {
    id: 'p3',
    title: 'Descrição que converte',
    category: 'Copy',
    uses: 1604,
    text: 'Reescreva a descrição de [PRODUTO] focando em benefícios, não em características. Use 3 bullets curtos, uma frase de urgência e termine com uma chamada para ação clara.',
  },
  {
    id: 'p4',
    title: 'Quebra de objeções',
    category: 'Copy',
    uses: 1211,
    text: 'Liste as 7 principais objeções de compra de [PRODUTO] e escreva uma resposta curta e persuasiva para cada uma, em tom natural de conversa.',
  },
  {
    id: 'p5',
    title: 'Validação de produto',
    category: 'Produto',
    tag: 'Essencial',
    uses: 2377,
    text: 'Analise [PRODUTO] como oportunidade de venda no TikTok Shop. Avalie demanda, concorrência, margem estimada, potencial viral e riscos. Dê uma nota final de 0 a 100 com justificativa.',
  },
  {
    id: 'p6',
    title: 'Ângulos de venda',
    category: 'Produto',
    uses: 987,
    text: 'Gere 8 ângulos de venda diferentes para [PRODUTO], cada um com público-alvo, dor principal e uma frase de abertura.',
  },
  {
    id: 'p7',
    title: 'Diagnóstico de loja',
    category: 'Loja',
    uses: 744,
    text: 'Faça um diagnóstico da minha loja [LOJA]: identifique os 5 maiores gargalos de conversão e proponha um plano de ação de 7 dias, priorizado por impacto.',
  },
  {
    id: 'p8',
    title: 'Organização de catálogo',
    category: 'Loja',
    uses: 512,
    text: 'Sugira uma estrutura de catálogo para a loja [LOJA] com categorias, produto âncora, produtos de ticket baixo e upsells.',
  },
  {
    id: 'p9',
    title: 'Criativos para anúncio',
    category: 'Anúncios',
    uses: 1386,
    text: 'Crie 5 conceitos de criativo em vídeo para anunciar [PRODUTO]. Para cada um: hook, cena a cena, texto na tela e CTA. Foque em retenção.',
  },
  {
    id: 'p10',
    title: 'Teste A/B de copy',
    category: 'Anúncios',
    uses: 698,
    text: 'Crie 4 variações de copy para o anúncio de [PRODUTO] para teste A/B, variando gatilho (urgência, prova social, curiosidade, autoridade).',
  },
  {
    id: 'p11',
    title: 'Plano de 30 dias',
    category: 'Estratégia',
    tag: 'Completo',
    uses: 1520,
    text: 'Monte um plano de 30 dias para escalar [PRODUTO] no TikTok Shop: calendário de conteúdo, metas semanais, métricas para acompanhar e critérios para matar ou escalar.',
  },
  {
    id: 'p12',
    title: 'Análise de concorrente',
    category: 'Estratégia',
    uses: 835,
    text: 'Analise o concorrente [CONCORRENTE]: o que ele vende, como posiciona, o que funciona nos vídeos dele e 3 brechas que eu posso explorar.',
  },
];

/* ─────────────── Home sample data ─────────────── */

export const TRENDING = [
  { name: 'Mini Processador Portátil', cat: 'Cozinha', score: 91, trend: '+248%' },
  { name: 'Luminária Pôr do Sol', cat: 'Casa', score: 87, trend: '+192%' },
  { name: 'Organizador Magnético', cat: 'Organização', score: 82, trend: '+131%' },
  { name: 'Massageador Cervical', cat: 'Bem-estar', score: 78, trend: '+96%' },
  { name: 'Escova Removedora de Pelos', cat: 'Pets', score: 74, trend: '+71%' },
];

export const ACTIVITY = [
  { icon: Gauge, tone: 'pink' as Tone, text: 'Produto analisado', sub: 'Mini Processador · score 91', time: '2h' },
  { icon: Wand2, tone: 'violet' as Tone, text: 'Roteiro gerado', sub: 'Vídeo 30s sem aparecer', time: '5h' },
  { icon: Workflow, tone: 'cyan' as Tone, text: 'Automação executada', sub: 'Relatório diário de tendências', time: '8h' },
  { icon: Sparkles, tone: 'amber' as Tone, text: 'Perfil atualizado', sub: '+3 preferências salvas', time: '1d' },
];

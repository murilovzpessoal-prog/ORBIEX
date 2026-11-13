import { useState, useMemo, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import {
  LifeBuoy,
  Package,
  Wand2,
  ScanSearch,
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
  Gauge,
  Store,
  Zap,
  Clapperboard,
  Terminal,
  ShieldAlert,
  Rocket,
  Star,
  Award,
  FileText,
  Download,
  Copy,
  Maximize2,
  Minimize2,
  Sparkles,
  ChevronRight,
  BookOpen,
  Layers,
  LayoutGrid,
  ListFilter,
  CheckSquare,
  Square,
  MessageSquare,
  HelpCircle,
  Printer,
  X,
  type LucideIcon,
} from 'lucide-react';
import { getUserDisplayName } from '../useUserProfile';

/* ══════════════════════════════════════════════════════════════════
   TIPAGEM E MODELO DE DADOS DAS AULAS & MÓDULOS DO PROJETO
══════════════════════════════════════════════════════════════════ */

export interface LessonResource {
  title: string;
  type: 'pdf' | 'template' | 'sheet' | 'link';
  sizeOrTag: string;
  downloadName?: string;
  contentSnippet?: string;
}

export interface LessonFAQ {
  question: string;
  answer: string;
}

export interface LessonItem {
  id: string;
  number: string;
  moduleId: string;
  moduleName: string;
  title: string;
  toolViewId: string;
  category: 'ia' | 'estrategia' | 'mineracao' | 'criativos' | 'seguranca';
  categoryLabel: string;
  duration: string;
  videoUrl?: string;
  coverImage: string;
  coverFallback: string;
  shortDescription: string;
  fullDescription: string;
  executiveSummary: string;
  keyPoints: string[];
  practicalSteps: string[];
  resources: LessonResource[];
  faqs: LessonFAQ[];
  accentColor: string;
  icon: LucideIcon;
}

export interface CourseModule {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  badge: string;
  accent: string;
  lessonIds: string[];
}

export const COURSE_MODULES: CourseModule[] = [
  {
    id: 'mod-1',
    number: '01',
    title: 'Fundação Estratégica & Rotina de Alto Lucro',
    subtitle: 'Boas-vindas, comando do Agente de IA e definição de metas diárias de faturamento.',
    badge: 'MÉTODO BASE',
    accent: '#d4af37',
    lessonIds: ['aula-1', 'aula-2', 'aula-7'],
  },
  {
    id: 'mod-2',
    number: '02',
    title: 'Inteligência de Mercado & Mineração Preditiva',
    subtitle: 'Garimpo algorítmico de produtos vencedores, radar de tendências e auditoria de lojistas.',
    badge: 'MINERAÇÃO & ANÁLISE',
    accent: '#38bdf8',
    lessonIds: ['aula-6', 'aula-10', 'aula-11', 'aula-12'],
  },
  {
    id: 'mod-3',
    number: '03',
    title: 'Engenharia Criativa & Produção de Alta Retenção',
    subtitle: 'Prompts cinematográficos, extração cinética, ganchos visuais e headlines de alto CTR.',
    badge: 'CRIATIVOS & CONVERSÃO',
    accent: '#eab308',
    lessonIds: ['aula-3', 'aula-4', 'aula-8', 'aula-9'],
  },
  {
    id: 'mod-4',
    number: '04',
    title: 'Blindagem de Contas, Escala & Suporte Especializado',
    subtitle: 'Prevenção de banimentos no TikTok Shop, aquecimento turbo de seguidores e canal direto de mentoria.',
    badge: 'BLINDAGEM & SUPORTE',
    accent: '#ec4899',
    lessonIds: ['aula-5', 'aula-13', 'aula-14'],
  },
];

export const LESSONS_CATALOG: LessonItem[] = [
  {
    id: 'aula-1',
    number: '01',
    moduleId: 'mod-1',
    moduleName: 'Módulo 01: Fundação Estratégica',
    title: 'Seja bem vindo',
    toolViewId: 'home',
    category: 'estrategia',
    categoryLabel: 'Introdução & Onboarding',
    duration: '12 min',
    videoUrl: 'https://stream.cakto.com.br/1d6bb2fa-3d0c-4f94-957a-cf646572f84d/1080p/video.m3u8',
    coverImage: '/assets/capas/capa-bem-vindo.jpg',
    coverFallback: '/assets/capas-modulos/modulo-1.jpg',
    icon: Sparkles,
    shortDescription: 'Boas-vindas oficiais ao Projeto: visão estratégica do ecossistema, mentalidade de execução e primeiros passos para lucrar no TikTok Shop.',
    fullDescription: 'Seja muito bem-vindo ao Projeto! Nesta aula inaugural em 1080p Full HD, você vai entender como funciona o nosso ecossistema, os pilares da operação e qual deve ser a sua postura desde o primeiro dia para construir resultados reais no TikTok Shop.',
    executiveSummary: 'Conheça o mapa de execução da formação e prepare sua estrutura para faturar com consistência no TikTok Shop sem aparecer.',
    keyPoints: [
      'Visão geral completa da Formação Oficial.',
      'Como funciona o ecossistema de ferramentas e o suporte.',
      'Mentalidade de execução acelerada para afiliados.',
    ],
    practicalSteps: [
      'Assista à aula de boas-vindas até o final.',
      'Alinhe sua rotina diária de operação no Projeto.',
      'Siga a ordem dos módulos práticos.',
    ],
    resources: [
      {
        title: 'Manual de Onboarding do Membro (PDF)',
        type: 'pdf',
        sizeOrTag: 'PDF • 1.1 MB',
        downloadName: 'Manual-Onboarding-Membro.txt',
        contentSnippet: 'ROTA DE SUCESSO DO MEMBRO:\n1. Assistir a todas as 14 aulas da Formação Oficial.\n2. Conectar com o Agente de IA para validar produtos.\n3. Executar o cronograma do Turbo de Seguidores.',
      },
    ],
    faqs: [
      {
        question: 'Preciso ter experiência prévia com vendas online?',
        answer: 'Não. Todas as ferramentas da Orbiex foram desenhadas para que qualquer pessoa consiga operar de forma intuitiva, mesmo começando do absoluto zero.',
      },
    ],
    accentColor: '#d4af37',
  },
  {
    id: 'aula-2',
    number: '02',
    moduleId: 'mod-1',
    moduleName: 'Módulo 01: Fundação Estratégica',
    title: 'Como usar o agente de IA',
    toolViewId: 'agent',
    category: 'ia',
    categoryLabel: 'Núcleo de IA',
    duration: '18 min',
    videoUrl: 'https://stream.cakto.com.br/70cec96b-9b44-47b0-84b6-595bd9a549e8/1080p/video.m3u8',
    coverImage: '/assets/capa-modulo-orbiex.jpg',
    coverFallback: 'https://i.imgur.com/069c3d94.jpg',
    icon: Bot,
    shortDescription: 'Comande o cérebro cognitivo do Agente Orbiex para criar roteiros virais, copys persuasivas e estratégias de venda.',
    fullDescription: 'Nesta aula de operação, você aprenderá a dominar a inteligência central do sistema. Entenda a distinção estratégica entre respostas executivas diretas e raciocínio profundo com o modo Orbiex 1 Pro para estruturar roteiros completos sem aparecer.',
    executiveSummary: 'O Agente de IA é o núcleo de tomada de decisão do Projeto. Utilize-o diariamente para validar produtos antes de gravar, gerar roteiros de alta retenção e receber diagnósticos precisos em segundos.',
    keyPoints: [
      'Diferença prática entre respostas ágeis de rotina e raciocínio estratégico profundo.',
      'Uso de comandos mestres para gerar ganchos e roteiros validados.',
      'Refinamento de copys persuasivas e ângulos de venda sem necessidade de gravação facial.',
    ],
    practicalSteps: [
      'Acesse a aba Agente IA no painel principal.',
      'Selecione o modo Orbiex 1 Pro para análises estratégicas detalhadas.',
      'Peça um roteiro no formato de 15 segundos para o produto escolhido.',
    ],
    resources: [
      {
        title: 'Checklist Executivo do Agente IA',
        type: 'pdf',
        sizeOrTag: 'PDF • 1.2 MB',
        downloadName: 'Checklist-Agente-IA.txt',
        contentSnippet: 'CHECKLIST DO AGENTE IA:\n1. Defina nicho e público comprador.\n2. Solicite 3 variações de gancho.\n3. Gere a chamada para o carrinho amarelo.',
      },
    ],
    faqs: [
      {
        question: 'O Agente IA já vem configurado com as diretrizes do TikTok Shop?',
        answer: 'Sim, o motor da Orbiex foi calibrado especificamente com a linguagem e regras do algoritmo do TikTok Shop.',
      },
    ],
    accentColor: '#38bdf8',
  },
  {
    id: 'aula-3',
    number: '03',
    moduleId: 'mod-3',
    moduleName: 'Módulo 03: Engenharia Criativa',
    title: 'Como gerar prompt',
    toolViewId: 'prompt-gen',
    category: 'ia',
    categoryLabel: 'Núcleo de IA',
    duration: '15 min',
    videoUrl: 'https://stream.cakto.com.br/af883d8c-357d-47b3-84b4-fa68a523af86/1080p/video.m3u8',
    coverImage: '/assets/capas/capa-prompt-gen.jpg',
    coverFallback: 'https://i.imgur.com/ct4Sz5O.jpg',
    icon: Terminal,
    shortDescription: 'Criação de prompts técnicos com parâmetros de estúdio, iluminação volumétrica e prompt negativo embutido no formato 9:16.',
    fullDescription: 'Elimine a necessidade de dominar termos avançados em inglês. Diga em português comum o que deseja demonstrar e o gerador formula os parâmetros técnicos ideais para Kling AI, Midjourney e Runway no formato vertical de smartphone.',
    executiveSummary: 'Gere criativos com aspecto de produção cinematográfica sem precisar de câmera, estúdio ou modelos presenciais.',
    keyPoints: [
      'Formulação automática em inglês técnico a partir de frases em português.',
      'Aspect ratio 9:16 padronizado para preencher 100% da tela do celular.',
      'Prompt negativo embutido para blindar deformidades anatômicas.',
    ],
    practicalSteps: [
      'Abra o Gerador de Prompts.',
      'Descreva a cena desejada em uma frase simples.',
      'Copie os blocos técnicos gerados e renderize no seu gerador favorito.',
    ],
    resources: [
      {
        title: 'Modelo de Prompt Negativo Mestre 9:16',
        type: 'template',
        sizeOrTag: 'Snippet de Código',
        contentSnippet: 'NEGATIVE PROMPT:\nugly, deformed, disfigured, poor details, bad anatomy, extra limbs, fused fingers, low resolution, blurry, watermark, 3d render look',
      },
    ],
    faqs: [
      {
        question: 'Preciso saber inglês para operar a ferramenta?',
        answer: 'Não. Você digita em português e o gerador traduz e calibra a terminologia técnica para o padrão exigido pelas ferramentas de IA.',
      },
    ],
    accentColor: '#f97316',
  },
  {
    id: 'aula-4',
    number: '04',
    moduleId: 'mod-3',
    moduleName: 'Módulo 03: Engenharia Criativa',
    title: 'Como usar o extrator de movimentos',
    toolViewId: 'motion',
    category: 'ia',
    categoryLabel: 'Núcleo de IA',
    duration: '16 min',
    videoUrl: 'https://stream.cakto.com.br/a6dc1079-39a4-4af6-a6c2-7d111a7a252e/1080p/video.m3u8',
    coverImage: '/assets/capas/capa-motion.jpg',
    coverFallback: 'https://i.imgur.com/qZu8hTx.jpg',
    icon: Clapperboard,
    shortDescription: 'Disseque movimentos, ações de mãos e ângulos de câmera para replicar em vídeos hiper-realistas por IA.',
    fullDescription: 'Aprenda a analisar vídeos reais de demonstração e extrair os parâmetros exatos de movimentação para alimentar geradores como Kling AI e Runway. Transforme gestos humanos reais em prompts cinéticos estruturados sem falhas de anatomia.',
    executiveSummary: 'Elimine o aspecto artificial e robótico de vídeos gerados por IA com parâmetros cinéticos precisos para cada tipo de produto físico.',
    keyPoints: [
      'Análise de velocidade e enquadramento de lentes cinematográficas.',
      'Conversão de gestos cotidianos em descritores cinéticos precisos.',
      'Eliminação de artefatos e distorções em produtos em uso.',
    ],
    practicalSteps: [
      'Acesse a ferramenta Extrator de Movimentos.',
      'Faça upload do vídeo ou insira o link de referência.',
      'Copie o relatório cinético gerado e use na geração do vídeo.',
    ],
    resources: [
      {
        title: 'Tabela de Termos Cinéticos para Vídeo por IA',
        type: 'pdf',
        sizeOrTag: 'PDF • 620 KB',
        downloadName: 'Termos-Cinetica-Video-IA.txt',
        contentSnippet: 'TERMOS DE CÂMERA:\n• Slow push-in tracking shot\n• Dutch angle dynamic macro\n• 360 seamless orbital pan',
      },
    ],
    faqs: [
      {
        question: 'O extrator funciona com qualquer resolução de vídeo?',
        answer: 'Sim, mas vídeos de referência em 1080p proporcionam uma leitura mais nítida dos vetores de movimento.',
      },
    ],
    accentColor: '#8b5cf6',
  },
  {
    id: 'aula-5',
    number: '05',
    moduleId: 'mod-4',
    moduleName: 'Módulo 04: Blindagem & Escala',
    title: 'Antirrestrição',
    toolViewId: 'antirestriction',
    category: 'seguranca',
    categoryLabel: 'Segurança & Compliance',
    duration: '20 min',
    videoUrl: 'https://stream.cakto.com.br/648a6301-ec09-4e07-81eb-e7026ca69283/1080p/video.m3u8',
    coverImage: '/assets/capas/capa-antirrestricao.jpg',
    coverFallback: 'https://i.imgur.com/mXr6ST1.jpg',
    icon: ShieldAlert,
    shortDescription: 'Protocolo de blindagem contra punições do TikTok Shop, lista de termos proibidos e modelos formais de apelação.',
    fullDescription: 'Uma das aulas mais vitais para proteger seu patrimônio digital. Conheça as políticas do TikTok Shop em profundidade: termos proibidos que causam desmonetização, regras de conformidade com o produto físico e acervo de recursos formais prontos para reverter penalidades.',
    executiveSummary: 'Proteja sua conta contra penalidades e recupere vídeos retidos com os modelos técnicos de apelação formal.',
    keyPoints: [
      'Lista restrita de termos e promessas proibidas pelas diretrizes do TikTok Shop.',
      'A regra de ouro da correspondência idêntica entre o vídeo e o item do carrinho.',
      'Modelos formais de apelação para copiar e enviar ao suporte oficial.',
    ],
    practicalSteps: [
      'Consulte a aba Antirrestrição antes de publicar qualquer novo criativo.',
      'Passe seu roteiro pelo verificador de conformidade.',
      'Em caso de vídeo retido, localize o modelo de recurso adequado.',
    ],
    resources: [
      {
        title: 'Dicionário de Termos Proibidos no TikTok Shop',
        type: 'pdf',
        sizeOrTag: 'PDF • 1.1 MB',
        downloadName: 'Termos-Proibidos-Compliance-TikTok.txt',
        contentSnippet: 'TERMOS PROIBIDOS:\n• Promessas de cura médica ou milagres imediatos.\n• Alegações de "único no mundo" sem laudo.\n• Linguagem excessivamente apelativa.',
      },
    ],
    faqs: [
      {
        question: 'Quanto tempo leva para uma apelação ser avaliada?',
        answer: 'Apelações técnicas estruturadas com nossos modelos costumam ser respondidas entre 4 e 24 horas úteis pela equipe do TikTok Shop.',
      },
    ],
    accentColor: '#ef4444',
  },
  {
    id: 'aula-6',
    number: '06',
    moduleId: 'mod-2',
    moduleName: 'Módulo 02: Mineração Preditiva',
    title: 'Aba de produtos',
    toolViewId: 'products',
    category: 'mineracao',
    categoryLabel: 'Mineração & Catálogo',
    duration: '14 min',
    videoUrl: 'https://stream.cakto.com.br/77a9954a-3792-4610-8209-abf79185269b/1080p/video.m3u8',
    coverImage: '/assets/capas/capa-produtos.jpg',
    coverFallback: 'https://i.imgur.com/gcXSGHY.jpg',
    icon: Package,
    shortDescription: 'Catálogo de produtos vencedores validados no TikTok Shop com métricas de margem, comissão e viralidade.',
    fullDescription: 'Aprenda a explorar o acervo de produtos minerados pela Orbiex. Filtre por margem de lucro, comissão líquida de afiliado e momentum algorítmico para escolher ofertas com alto potencial de escala.',
    executiveSummary: 'Economize centenas de horas de pesquisa acessando uma esteira de produtos já auditados e validados para venda.',
    keyPoints: [
      'Critérios de seleção de produtos com alta taxa de conversão.',
      'Análise do ticket médio ideal para vendas sem atrito no TikTok Shop.',
      'Como enviar um produto com 1 clique direto para o Agente de IA.',
    ],
    practicalSteps: [
      'Navegue até a Aba de Produtos.',
      'Utilize os filtros de margem e comissão recomendada.',
      'Selecione a oferta e envie para o Agente estruturar os criativos.',
    ],
    resources: [
      {
        title: 'Checklist de Validação de Ofertas Físicas',
        type: 'sheet',
        sizeOrTag: 'Planilha • PDF',
        downloadName: 'Checklist-Validacao-Ofertas.txt',
        contentSnippet: 'CRITÉRIOS DE PRODUTO VENCEDOR:\n1. Preço de venda entre R$ 49 e R$ 149.\n2. Efeito visual "UAU" nos primeiros 2 segundos.\n3. Comissão mínima de 20% para o afiliado.',
      },
    ],
    faqs: [
      {
        question: 'Os produtos da lista são atualizados com que frequência?',
        answer: 'Nosso scanner atualiza o catálogo diariamente com base nos dados em tempo real do TikTok Shop.',
      },
    ],
    accentColor: '#06b6d4',
  },
  {
    id: 'aula-7',
    number: '07',
    moduleId: 'mod-1',
    moduleName: 'Módulo 01: Fundação Estratégica',
    title: 'Metas',
    toolViewId: 'journey',
    category: 'estrategia',
    categoryLabel: 'Estratégia & Metas',
    duration: '11 min',
    videoUrl: 'https://stream.cakto.com.br/29b9c9ff-cb01-4d5a-9fda-852bce88bc2c/1080p/video.m3u8',
    coverImage: '/assets/capas/capa-jornada.jpg',
    coverFallback: 'https://i.imgur.com/Clz4itZ.jpg',
    icon: Compass,
    shortDescription: 'Plano de metas diárias, controle de faturamento e rotina de consistência para alcançar múltiplos 5 dígitos.',
    fullDescription: 'Descubra como transformar grandes objetivos financeiros em tarefas diárias executáveis. Aprenda a usar a aba Minha Jornada para registrar ganhos, acompanhar a evolução nos últimos 30 dias e manter a disciplina necessária.',
    executiveSummary: 'O sucesso no TikTok Shop é consequência de um processo previsível. Estabeleça metas claras e acompanhe cada degrau da sua evolução.',
    keyPoints: [
      'Divisão de metas mensais em microetapas diárias.',
      'Acompanhamento do gráfico de faturamento em tempo real.',
      'Registro diário de comissões para calibrar a escala.',
    ],
    practicalSteps: [
      'Acesse a aba Minha Jornada.',
      'Defina sua meta do mês no painel superior.',
      'Marque o faturamento de cada dia para alimentar o saldo dos últimos 30 dias.',
    ],
    resources: [
      {
        title: 'Planilha de Acompanhamento Diário de Comissões',
        type: 'sheet',
        sizeOrTag: 'Planilha Executiva',
        downloadName: 'Acompanhamento-Comissoes-Diarias.txt',
        contentSnippet: 'METAS DE ESTEIRA:\n• Meta Inicial: R$ 100/dia líquido\n• Meta de Validação: R$ 500/dia líquido\n• Meta de Escala: R$ 1.500/dia líquido',
      },
    ],
    faqs: [
      {
        question: 'O saldo da aba Minha Jornada começa zerado para novos usuários?',
        answer: 'Sim, a plataforma inicia com todos os saldos zerados para que você acompanhe a sua evolução real conforme registra seus ganhos.',
      },
    ],
    accentColor: '#10b981',
  },
  {
    id: 'aula-8',
    number: '08',
    moduleId: 'mod-3',
    moduleName: 'Módulo 03: Engenharia Criativa',
    title: 'Gerador de headline',
    toolViewId: 'headlines',
    category: 'criativos',
    categoryLabel: 'Engenharia Criativa',
    duration: '12 min',
    videoUrl: 'https://stream.cakto.com.br/218356eb-e3ca-4511-a266-0a6aaf876302/1080p/video.m3u8',
    coverImage: '/assets/capas/capa-headlines.jpg',
    coverFallback: 'https://i.imgur.com/DgPmWKa.jpg',
    icon: Wand2,
    shortDescription: 'Criação de manchetes magnéticas de alto impacto para prender a atenção no feed nos primeiros 2 segundos.',
    fullDescription: 'A manchete na tela é responsável por até 60% da decisão do usuário de parar o scroll. Aprenda a utilizar o Gerador de Headline com gatilhos de urgência, contraste e curiosidade para explodir o CTR dos seus vídeos.',
    executiveSummary: 'Domine a arte dos textos de abertura que forçam a audiência a prestar atenção na sua demonstração de produto.',
    keyPoints: [
      'Fórmula dos ganchos textuais que quebram o padrão do feed.',
      'Tamanho e contraste de fonte ideais para leitura rápida no celular.',
      'Evitando promessas agressivas que acionam filtros de restrição.',
    ],
    practicalSteps: [
      'Abra o Gerador de Headline.',
      'Informe o nicho e o principal benefício do produto.',
      'Escolha a variação mais impactante para estampar no início do criativo.',
    ],
    resources: [
      {
        title: 'Guia das 50 Headlines de Maior Retenção',
        type: 'pdf',
        sizeOrTag: 'PDF • 850 KB',
        downloadName: '50-Headlines-Maior-Retencao.txt',
        contentSnippet: 'FÓRMULAS DE HEADLINE:\n1. "O que ninguém te conta sobre [PRODUTO]..."\n2. "Eu testei isso por 7 dias e esse foi o resultado..."\n3. "Se você usa [ITEM], pare agora mesmo..."',
      },
    ],
    faqs: [
      {
        question: 'Devo colocar a headline em texto nativo do TikTok ou na edição?',
        answer: 'Texto nativo do TikTok aumenta a indexação pelo algoritmo de busca (SEO do TikTok), enquanto texto estilizado na edição retém melhor o olhar visual.',
      },
    ],
    accentColor: '#a855f7',
  },
  {
    id: 'aula-9',
    number: '09',
    moduleId: 'mod-3',
    moduleName: 'Módulo 03: Engenharia Criativa',
    title: 'Hooks virais',
    toolViewId: 'hooks',
    category: 'criativos',
    categoryLabel: 'Engenharia Criativa',
    duration: '13 min',
    videoUrl: 'https://stream.cakto.com.br/2c8b209e-d034-4c88-a1f2-a284362de4eb/1080p/video.m3u8',
    coverImage: '/assets/capas/capa-hooks.jpg',
    coverFallback: 'https://i.imgur.com/KoXi9AI.jpg',
    icon: Zap,
    shortDescription: 'Biblioteca de aberturas visuais e sonoras comprovadas para maximizar a retenção nos primeiros 3 segundos.',
    fullDescription: 'A retenção inicial dita quantas pessoas o algoritmo alcançará. Veja como utilizar ganchos sonoros e visuais magnéticos para eliminar o abandono prematuro dos seus vídeos e guiar o espectador até a chamada de compra.',
    executiveSummary: 'Ganchos fracos geram abandono imediato. Use a fórmula de 3 segundos para transformar visitantes casuais em compradores.',
    keyPoints: [
      'Os 5 formatos de ganchos com maior taxa de conversão em compras.',
      'Sincronização entre áudio falado de impacto e quebra visual imediata.',
      'Transição natural do gancho para a oferta do carrinho amarelo.',
    ],
    practicalSteps: [
      'Abra a ferramenta de Hooks Virais.',
      'Filtre pelo nicho correspondente.',
      'Gere a locução com IA ou grave com voz humana convincente.',
    ],
    resources: [
      {
        title: 'Acervo de Áudios e Frases de Abertura Viral',
        type: 'template',
        sizeOrTag: 'Pack de Hooks',
        contentSnippet: 'HOOK VISUAL: Despejar líquido no chão e limpar em 1 segundo.\nHOOK SONORO: "Se você sofre com isso todos os dias, você precisa ver esse produto agora..."',
      },
    ],
    faqs: [
      {
        question: 'Posso usar voz sintética gerada por IA nos hooks?',
        answer: 'Sim, desde que utilize vozes naturais e fluidas (como as do ElevenLabs ou do próprio TikTok), evitando vozes robóticas antigas.',
      },
    ],
    accentColor: '#eab308',
  },
  {
    id: 'aula-10',
    number: '10',
    moduleId: 'mod-2',
    moduleName: 'Módulo 02: Mineração Preditiva',
    title: 'Scaner',
    toolViewId: 'scanner',
    category: 'mineracao',
    categoryLabel: 'Mineração Preditiva',
    duration: '15 min',
    videoUrl: 'https://stream.cakto.com.br/1ee3398a-6c98-438b-9178-bc0e74849619/1080p/video.m3u8',
    coverImage: '/assets/capas/capa-scanner.jpg',
    coverFallback: 'https://i.imgur.com/5EKpkWs.jpg',
    icon: ScanSearch,
    shortDescription: 'Radar algorítmico de detecção de tendências antes da saturação com métricas de velocidade e volume de vendas.',
    fullDescription: 'Aprenda a operar o Scanner da Orbiex para interceptar tendências embrionárias no TikTok Shop antes que a concorrência perceba. Identifique produtos com curva ascendente de buscas e alta demanda reprimida.',
    executiveSummary: 'Chegar primeiro em uma tendência é o segredo para comissões massivas com custo por clique próximo de zero.',
    keyPoints: [
      'Leitura de gráficos de momentum e crescimento de vendas.',
      'Diferenciação entre modismos passageiros e tendências lucrativas.',
      'Validação rápida de demanda antes de produzir criativos.',
    ],
    practicalSteps: [
      'Acesse o Scanner no menu lateral.',
      'Analise os produtos no topo do ranking de velocidade.',
      'Exporte os dados para direcionar a produção da semana.',
    ],
    resources: [
      {
        title: 'Checklist de Triagem do Scanner Algorítmico',
        type: 'pdf',
        sizeOrTag: 'PDF • 780 KB',
        downloadName: 'Checklist-Scanner-Algoritmico.txt',
        contentSnippet: 'SINAIS DE ALERTA NO SCANNER:\n• Aumento repentino de vídeos com mais de 50k views nas últimas 48h.\n• Menos de 10 afiliados divulgando ativamente.\n• Estoque confirmado com envio nacional.',
      },
    ],
    faqs: [
      {
        question: 'O Scanner monitora lojas nacionais e internacionais?',
        answer: 'Sim, o radar analisa operações do TikTok Shop com foco prioritário em produtos com entrega rápida no Brasil.',
      },
    ],
    accentColor: '#6366f1',
  },
  {
    id: 'aula-11',
    number: '11',
    moduleId: 'mod-2',
    moduleName: 'Módulo 02: Mineração Preditiva',
    title: 'Scaner do produto',
    toolViewId: 'product',
    category: 'mineracao',
    categoryLabel: 'Mineração Preditiva',
    duration: '14 min',
    videoUrl: 'https://stream.cakto.com.br/a77ae187-6d4b-4ce4-ba32-5521bc707b4a/1080p/video.m3u8',
    coverImage: '/assets/capas/capa-score-produto.jpg',
    coverFallback: 'https://i.imgur.com/MnAzAIK.jpg',
    icon: Gauge,
    shortDescription: 'Auditoria algorítmica de viabilidade de produto: margem líquida, taxa de reembolso e facilidade de demonstração em vídeo.',
    fullDescription: 'Não perca tempo com produtos inviáveis. O Score de Produto analisa automaticamente a precificação, margem líquida de comissão, risco de devolução e apelo visual para garantir que apenas itens altamente rentáveis entrem na sua vitrine.',
    executiveSummary: 'Audite qualquer produto em segundos e tome decisões baseadas em dados matemáticos, nunca em suposições.',
    keyPoints: [
      'Cálculo de margem real após descontar taxas do marketplace.',
      'Verificação de potencial de demonstração visual no formato de 15 segundos.',
      'Identificação de produtos com histórico negativo de reclamações.',
    ],
    practicalSteps: [
      'Abra o Score de Produto.',
      'Insira os dados do item que você pretende divulgar.',
      'Confira a pontuação geral antes de investir tempo na criação de vídeos.',
    ],
    resources: [
      {
        title: 'Matriz de Score e Decisão de Ofertas',
        type: 'sheet',
        sizeOrTag: 'Matriz • PDF',
        downloadName: 'Matriz-Score-Ofertas.txt',
        contentSnippet: 'SCORE RECOMENDADO:\n• 80 a 100: Produto Aprovado para Escala Imediata.\n• 60 a 79: Teste com 2 a 3 criativos.\n• Abaixo de 60: Descarte imediato.',
      },
    ],
    faqs: [
      {
        question: 'Posso auditar um produto que não está na lista da Orbiex?',
        answer: 'Sim, você pode inserir os dados de qualquer link de produto do TikTok Shop para receber a análise completa.',
      },
    ],
    accentColor: '#14b8a6',
  },
  {
    id: 'aula-12',
    number: '12',
    moduleId: 'mod-2',
    moduleName: 'Módulo 02: Mineração Preditiva',
    title: 'Scaner do lojista',
    toolViewId: 'store',
    category: 'mineracao',
    categoryLabel: 'Mineração Preditiva',
    duration: '13 min',
    videoUrl: 'https://stream.cakto.com.br/cc2876b0-e1b9-4cb6-990b-9f1cccb88753/1080p/video.m3u8',
    coverImage: '/assets/capas/capa-score-lojista.jpg',
    coverFallback: 'https://i.imgur.com/JPoVtiW.jpg',
    icon: Store,
    shortDescription: 'Auditoria de confiabilidade do lojista: prazo de despacho, taxa de cancelamento e integridade de estoque.',
    fullDescription: 'Divulgar um lojista ruim pode destruir a reputação do seu perfil. Aprenda a avaliar a saúde operacional do fornecedor: velocidade de envio, estoque real no Brasil e histórico de atendimento para garantir que suas comissões sejam pagas sem cancelamentos.',
    executiveSummary: 'Venda com a certeza de que o cliente receberá o produto no prazo e que suas comissões estarão seguras na sua conta.',
    keyPoints: [
      'Métricas vitais de despacho em menos de 48 horas.',
      'Análise da taxa de cancelamento por falta de estoque.',
      'Como filtrar apenas vendedores oficiais verificados pelo TikTok.',
    ],
    practicalSteps: [
      'Acesse o Score do Lojista.',
      'Analise o perfil do lojista vinculado à oferta.',
      'Valide a nota de corte recomendada pelo Projeto antes de associar o produto.',
    ],
    resources: [
      {
        title: 'Checklist de Avaliação de Fornecedores TikTok Shop',
        type: 'pdf',
        sizeOrTag: 'PDF • 600 KB',
        downloadName: 'Checklist-Avaliacao-Fornecedores.txt',
        contentSnippet: 'CRITÉRIOS DE FORNECEDOR CONFIÁVEL:\n• Taxa de envio no prazo superior a 95%.\n• Menos de 2% de cancelamento por falta de estoque.\n• Tempo médio de resposta no chat inferior a 1 hora.',
      },
    ],
    faqs: [
      {
        question: 'O que fazer se o lojista pausar o produto durante a escala?',
        answer: 'O Score do Lojista ajuda a identificar lojas com alto volume de estoque, minimizando o risco de pausas bruscas.',
      },
    ],
    accentColor: '#3b82f6',
  },
  {
    id: 'aula-13',
    number: '13',
    moduleId: 'mod-4',
    moduleName: 'Módulo 04: Blindagem & Escala',
    title: 'Turbo de seguidores',
    toolViewId: 'turbo',
    category: 'estrategia',
    categoryLabel: 'Estratégia & Escala',
    duration: '14 min',
    videoUrl: 'https://stream.cakto.com.br/1a116310-a9ae-4646-b85e-29b5b617af45/1080p/video.m3u8',
    coverImage: '/assets/capas/capa-turbo.jpg',
    coverFallback: 'https://i.imgur.com/Nv7Uaqy.jpg',
    icon: Rocket,
    shortDescription: 'Estratégia orgânica de aquecimento acelerado para conquistar seguidores e desbloquear o carrinho de afiliado.',
    fullDescription: 'Aprenda como estruturar uma conta virgem e acelerar a conquista dos seguidores necessários para liberar o TikTok Shop de Criadores. Veja como usar formatos magnéticos de 7 a 11 segundos com áudios em tendência sem gastar 1 centavo com seguidores falsos.',
    executiveSummary: 'Comprar seguidores destrói a retenção da conta para sempre. Utilize nosso método orgânico de aquecimento para desbloquear o carrinho de forma limpa e com público comprador.',
    keyPoints: [
      'Protocolo de aquecimento de conta nos primeiros 3 dias de criação.',
      'Formatos ultracurtos de alta retenção para viralização orgânica rápida.',
      'Transição suave do perfil de aquecimento para a máquina de vendas ativas.',
    ],
    practicalSteps: [
      'Abra a ferramenta Turbo de Seguidores.',
      'Siga o cronograma de 7 dias de publicações curtas e calibradas.',
      'Ao bater os requisitos mínimos, submeta o cadastro do TikTok Shop.',
    ],
    resources: [
      {
        title: 'Cronograma de 7 Dias de Aquecimento de Perfil',
        type: 'sheet',
        sizeOrTag: 'Cronograma • PDF',
        downloadName: 'Cronograma-Aquecimento-Perfil.txt',
        contentSnippet: 'DIA 1: Configuração de bio limpa e 30 min de consumo no nicho.\nDIA 2: 1º vídeo de curiosidade (8s) com áudio em alta.\nDIA 3: 2 vídeos rápidos de demonstração visual sem venda direta.\nDIA 4 a 7: Intensificação com hooks magnéticos.',
      },
    ],
    faqs: [
      {
        question: 'Quantos seguidores são necessários para ativar o TikTok Shop?',
        answer: 'No Brasil e nos EUA, os requisitos variam entre 1.000 e 5.000 seguidores para contas de criador ou liberação imediata via vinculação de conta comercial autorizada.',
      },
    ],
    accentColor: '#ec4899',
  },
  {
    id: 'aula-14',
    number: '14',
    moduleId: 'mod-4',
    moduleName: 'Módulo 04: Blindagem & Escala',
    title: 'Suporte',
    toolViewId: 'support',
    category: 'estrategia',
    categoryLabel: 'Atendimento & Mentoria',
    duration: '10 min',
    videoUrl: 'https://stream.cakto.com.br/d06a0971-12d4-44d0-baa6-ca239714c93f/1080p/video.m3u8',
    coverImage: '/assets/capas/capa-suporte.jpg',
    coverFallback: '/assets/capas-modulos/modulo-15.jpg',
    icon: LifeBuoy,
    shortDescription: 'Como acionar o time de especialistas do Projeto, tirar dúvidas operacionais e acelerar sua jornada de resultados.',
    fullDescription: 'Você nunca estará sozinho na sua jornada. Nesta aula você vai entender como utilizar os canais oficiais de suporte, como formular dúvidas técnicas de forma precisa e como obter direcionamento rápido do nosso time de especialistas.',
    executiveSummary: 'Conheça todos os pontos de contato e suporte exclusivo disponível para acelerar o seu progresso no Projeto.',
    keyPoints: [
      'Canais de atendimento prioritário para membros.',
      'Boas práticas para envio de dúvidas e prints da sua operação.',
      'Horários de atendimento e comunidade de networking.',
    ],
    practicalSteps: [
      'Abra o chat de Suporte pelo menu lateral quando precisar.',
      'Descreva detalhadamente a sua dúvida ou cenário.',
      'Receba a orientação estratégica da equipe especializada.',
    ],
    resources: [
      {
        title: 'Canais Oficiais de Suporte & Comunidade VIP',
        type: 'link',
        sizeOrTag: 'Acesso VIP',
        contentSnippet: 'SUPORTE PRIORITÁRIO:\n• Chat interno da plataforma Orbiex\n• Canal direto no WhatsApp exclusivo para membros\n• Atendimento especializado de segunda a sábado',
      },
    ],
    faqs: [
      {
        question: 'Qual é o tempo médio de resposta do suporte?',
        answer: 'Nosso time de mentores responde a maioria das dúvidas técnicas em até poucas horas durante o horário comercial.',
      },
    ],
    accentColor: '#22c55e',
  },
];

function HlsVideoPlayer({ src, poster }: { src: string; poster?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    if (src.includes('.m3u8')) {
      if (Hls.isSupported()) {
        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });
        hlsRef.current = hls;
        hls.loadSource(src);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => {});
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src;
        video.play().catch(() => {});
      } else {
        video.src = src;
      }
    } else {
      video.src = src;
      video.play().catch(() => {});
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src]);

  return (
    <video
      ref={videoRef}
      poster={poster}
      controls
      playsInline
      className="h-full w-full object-contain bg-black"
    />
  );
}

interface MembersViewProps {
  onNavigate?: (view: any) => void;
}

export function MembersView({ onNavigate }: MembersViewProps) {
  // Navigation and active views
  const [selectedLesson, setSelectedLesson] = useState<LessonItem | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'resources' | 'notes' | 'faq'>('overview');
  const [viewMode, setViewMode] = useState<'modules' | 'grid' | 'syllabus'>('modules');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('todos');
  const [theaterMode, setTheaterMode] = useState(false);
  const [certificateModalOpen, setCertificateModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // User display name from profile
  const studentName = getUserDisplayName() || 'Membro do Projeto';

  // Persistence: Completed Lessons
  const [completedLessons, setCompletedLessons] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('projeto_completed_lessons_v2');
      if (stored) return JSON.parse(stored);
      // Fallback to legacy orbiex key if available
      const legacy = localStorage.getItem('orbiex_completed_lessons_v2');
      return legacy ? JSON.parse(legacy) : ['aula-1'];
    } catch {
      return ['aula-1'];
    }
  });

  // Persistence: Favorite Lessons
  const [favoriteLessons, setFavoriteLessons] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('projeto_favorite_lessons');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Persistence: Custom Video URLs
  const [customVideos, setCustomVideos] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem('projeto_custom_lesson_videos');
      if (stored) return JSON.parse(stored);
      const legacy = localStorage.getItem('orbiex_custom_lesson_videos');
      return legacy ? JSON.parse(legacy) : {};
    } catch {
      return {};
    }
  });

  // State for video URL edit modal/input
  const [editingVideoUrl, setEditingVideoUrl] = useState(false);
  const [videoUrlInput, setVideoUrlInput] = useState('');

  // Persistence: Student Notes per lesson
  const [lessonNotes, setLessonNotes] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem('projeto_lessons_notes');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Persistence: Interactive Checklist per lesson
  const [checkedTasks, setCheckedTasks] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem('projeto_checked_tasks');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Toast feedback helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Calculations
  const totalLessons = LESSONS_CATALOG.length;
  const progressPercentage = useMemo(() => {
    if (totalLessons === 0) return 0;
    return Math.round((completedLessons.length / totalLessons) * 100);
  }, [completedLessons.length, totalLessons]);

  // Next up / Continue Watching lesson
  const nextLessonToWatch = useMemo(() => {
    return LESSONS_CATALOG.find((l) => !completedLessons.includes(l.id)) || LESSONS_CATALOG[0];
  }, [completedLessons]);

  // Toggle completion
  const toggleLessonCompleted = (lessonId: string) => {
    setCompletedLessons((prev) => {
      const updated = prev.includes(lessonId)
        ? prev.filter((id) => id !== lessonId)
        : [...prev, lessonId];
      try {
        localStorage.setItem('projeto_completed_lessons_v2', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Toggle favorite
  const toggleFavorite = (lessonId: string) => {
    setFavoriteLessons((prev) => {
      const updated = prev.includes(lessonId)
        ? prev.filter((id) => id !== lessonId)
        : [...prev, lessonId];
      try {
        localStorage.setItem('projeto_favorite_lessons', JSON.stringify(updated));
      } catch {}
      showToast(updated.includes(lessonId) ? 'Aula adicionada aos favoritos ⭐' : 'Aula removida dos favoritos');
      return updated;
    });
  };

  // Save Video URL
  const handleSaveVideoUrl = (lessonId: string) => {
    const updated = { ...customVideos, [lessonId]: videoUrlInput.trim() };
    setCustomVideos(updated);
    try {
      localStorage.setItem('projeto_custom_lesson_videos', JSON.stringify(updated));
    } catch {}
    setEditingVideoUrl(false);
    showToast('Link do vídeo salvo com sucesso!');
  };

  // Save Notes for current lesson
  const handleSaveNotes = (lessonId: string, text: string) => {
    const updated = { ...lessonNotes, [lessonId]: text };
    setLessonNotes(updated);
    try {
      localStorage.setItem('projeto_lessons_notes', JSON.stringify(updated));
    } catch {}
  };

  // Toggle practical step task
  const toggleTask = (taskKey: string) => {
    setCheckedTasks((prev) => {
      const updated = { ...prev, [taskKey]: !prev[taskKey] };
      try {
        localStorage.setItem('projeto_checked_tasks', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Copy snippet helper
  const handleCopySnippet = (snippet: string, title: string) => {
    navigator.clipboard.writeText(snippet);
    showToast(`Conteúdo de "${title}" copiado para a área de transferência!`);
  };

  // Download snippet as txt helper
  const handleDownloadResource = (resource: LessonResource) => {
    const filename = resource.downloadName || `${resource.title.replace(/\s+/g, '-')}.txt`;
    const content = resource.contentSnippet || `MATERIAL EXECUTIVO DO PROJETO\n${resource.title}\n\nConteúdo disponível na plataforma do Projeto.`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Download de "${filename}" iniciado!`);
  };

  // Select lesson handler
  const handleSelectLesson = (lesson: LessonItem) => {
    setSelectedLesson(lesson);
    setActiveTab('overview');
    setEditingVideoUrl(false);
    setVideoUrlInput(customVideos[lesson.id] || lesson.videoUrl || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Prev / Next lesson
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

  // Filter lessons
  const filteredLessons = useMemo(() => {
    return LESSONS_CATALOG.filter((lesson) => {
      // Filter tab
      let matchesFilter = true;
      if (activeFilter === 'todos') {
        matchesFilter = true;
      } else if (activeFilter === 'favoritas') {
        matchesFilter = favoriteLessons.includes(lesson.id);
      } else if (activeFilter === 'pendentes') {
        matchesFilter = !completedLessons.includes(lesson.id);
      } else if (activeFilter === 'concluidas') {
        matchesFilter = completedLessons.includes(lesson.id);
      } else {
        matchesFilter = lesson.category === activeFilter;
      }

      // Search query
      const matchesSearch =
        searchQuery === '' ||
        lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lesson.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lesson.keyPoints.some((p) => p.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, searchQuery, favoriteLessons, completedLessons]);

  // Scroll to top when selecting lesson
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedLesson]);

  // Video embed helper
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

  /* ══════════════════════════════════════════════════════════════════
     MODAL: CERTIFICADO DE CONCLUSÃO OFICIAL DO PROJETO
  ══════════════════════════════════════════════════════════════════ */
  const renderCertificateModal = () => {
    if (!certificateModalOpen) return null;

    const verificationHash = 'PRJ-8849-BR-2026';
    const currentDate = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
        <div className="relative w-full max-w-3xl overflow-hidden rounded-[28px] border border-[var(--mvz-gold)]/40 bg-[#0a0a0c] p-6 sm:p-10 shadow-[0_25px_80px_rgba(0,0,0,0.95)]">
          {/* Close button */}
          <button
            type="button"
            onClick={() => setCertificateModalOpen(false)}
            className="absolute top-5 right-5 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition"
          >
            <X size={16} />
          </button>

          {/* Certificate Inner Frame */}
          <div className="relative rounded-2xl border-2 border-[var(--mvz-gold)]/30 bg-gradient-to-b from-[#14120e] via-[#0d0c0a] to-[#070708] p-6 sm:p-10 text-center shadow-inner">
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--mvz-gold)]/50 bg-[var(--mvz-gold)]/10 px-4 py-1 text-[11px] font-black uppercase tracking-[0.25em] text-[var(--mvz-gold-light)] mb-4">
              <Award size={14} className="text-[var(--mvz-gold)]" />
              <span>PROJETO • CERTIFICADO DE FORMAÇÃO OFICIAL</span>
            </div>

            <h2 className="text-[24px] sm:text-[32px] font-serif font-black tracking-tight text-white mb-2">
              Certificado de Conclusão Executiva
            </h2>

            <p className="text-[13px] text-white/60 max-w-lg mx-auto mb-6">
              Certificamos que o membro abaixo completou integralmente a formação operacional em estratégias avançadas de escala e mineração no TikTok Shop.
            </p>

            {/* Student Name */}
            <div className="my-6 border-b border-t border-[var(--mvz-gold)]/30 py-5">
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--mvz-gold)]">
                OUTORGADO A
              </span>
              <div className="text-[26px] sm:text-[34px] font-bold text-white tracking-wide mt-1 font-sans">
                {studentName}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left my-6 border border-white/5 rounded-xl bg-white/[0.02] p-4 text-[12px]">
              <div>
                <span className="text-white/40 block text-[10px] uppercase font-bold">Carga Horária</span>
                <span className="text-white font-extrabold text-[13px]">14 Horas Curriculares</span>
              </div>
              <div>
                <span className="text-white/40 block text-[10px] uppercase font-bold">Data de Emissão</span>
                <span className="text-white font-extrabold text-[13px]">{currentDate}</span>
              </div>
              <div>
                <span className="text-white/40 block text-[10px] uppercase font-bold">Código de Autenticidade</span>
                <span className="text-[var(--mvz-gold-light)] font-mono font-bold text-[13px]">{verificationHash}</span>
              </div>
            </div>

            {/* Status Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-5 border-t border-white/10">
              <div className="text-left">
                <span className="text-[10px] text-white/40 uppercase font-black tracking-wider block">Assinatura Digital</span>
                <span className="text-[13px] font-serif text-[var(--mvz-gold-light)] italic font-semibold">Diretoria de Estratégia do Projeto</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    window.print();
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--mvz-gold)] px-5 py-2.5 text-[12px] font-black text-black hover:bg-[var(--mvz-gold-light)] shadow-[0_0_20px_rgba(212,175,55,0.4)] transition"
                >
                  <Printer size={15} />
                  <span>Imprimir / Salvar PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ══════════════════════════════════════════════════════════════════
     TELA 2: VISUALIZADOR DA AULA (CINEMA PLAYER + ABAS + PLAYLIST)
  ══════════════════════════════════════════════════════════════════ */
  if (selectedLesson) {
    const isCompleted = completedLessons.includes(selectedLesson.id);
    const isFavorite = favoriteLessons.includes(selectedLesson.id);
    const currentIndex = LESSONS_CATALOG.findIndex((l) => l.id === selectedLesson.id);
    const activeVideo = customVideos[selectedLesson.id] || selectedLesson.videoUrl || '';
    const LessonIcon = selectedLesson.icon;
    const embedUrl = getEmbedUrl(activeVideo);
    const currentNotes = lessonNotes[selectedLesson.id] || '';

    return (
      <div className="mvz-fade-up pb-28 space-y-6 max-w-7xl mx-auto px-2 sm:px-4">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl border border-[var(--mvz-gold)]/40 bg-[#12100d] px-4 py-3 text-[13px] font-bold text-white shadow-2xl backdrop-blur-xl animate-fade-in">
            <Sparkles size={16} className="text-[var(--mvz-gold)]" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Certificate Modal */}
        {renderCertificateModal()}

        {/* ── Top Bar: Voltar + Breadcrumb + Ações Rápidas ── */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSelectedLesson(null)}
              className="group inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-[12.5px] font-bold text-white/80 transition-all duration-200 hover:border-[var(--mvz-gold)]/60 hover:bg-white/[0.07] hover:text-[var(--mvz-gold-light)]"
            >
              <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-1 text-[var(--mvz-gold)]" />
              <span>Voltar para Área de Membros</span>
            </button>

            <span className="hidden sm:inline-block text-[12px] text-white/40">/</span>
            <span className="hidden sm:inline-block text-[12px] font-medium text-white/60">
              {selectedLesson.moduleName}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Favorite button */}
            <button
              type="button"
              onClick={() => toggleFavorite(selectedLesson.id)}
              className={`flex h-9 w-9 items-center justify-center rounded-xl border transition ${
                isFavorite
                  ? 'border-[var(--mvz-gold)] bg-[var(--mvz-gold)]/15 text-[var(--mvz-gold)]'
                  : 'border-white/10 bg-white/[0.02] text-white/50 hover:text-white hover:border-white/20'
              }`}
              title={isFavorite ? 'Remover dos favoritos' : 'Favoritar aula'}
            >
              <Star size={15} fill={isFavorite ? 'currentColor' : 'none'} />
            </button>

            {/* Theater Mode Toggle */}
            <button
              type="button"
              onClick={() => setTheaterMode(!theaterMode)}
              className="hidden md:flex h-9 items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.02] px-3 text-[12px] font-semibold text-white/60 hover:text-white hover:border-white/20 transition"
              title="Modo Cinema"
            >
              {theaterMode ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              <span>{theaterMode ? 'Modo Padrão' : 'Modo Cinema'}</span>
            </button>

            {/* Previous & Next Arrows */}
            <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.02] p-0.5">
              <button
                type="button"
                onClick={handlePrevLesson}
                disabled={currentIndex === 0}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition"
                title="Aula anterior"
              >
                <ArrowLeft size={14} />
              </button>
              <span className="px-2 text-[11px] font-bold text-white/40">
                {currentIndex + 1}/{totalLessons}
              </span>
              <button
                type="button"
                onClick={handleNextLesson}
                disabled={currentIndex === totalLessons - 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition"
                title="Próxima aula"
              >
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Concluir Aula button */}
            <button
              type="button"
              onClick={() => toggleLessonCompleted(selectedLesson.id)}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-[12px] font-extrabold transition-all duration-200 active:scale-95 ${
                isCompleted
                  ? 'border-[#22c55e]/40 bg-[#22c55e]/15 text-[#22c55e] shadow-[0_0_15px_rgba(34,197,94,0.3)]'
                  : 'border-[var(--mvz-gold)]/40 bg-[var(--mvz-gold)]/10 text-[var(--mvz-gold-light)] hover:bg-[var(--mvz-gold)]/20'
              }`}
            >
              {isCompleted ? <Check size={14} strokeWidth={3} /> : <CheckCircle2 size={14} />}
              <span>{isCompleted ? 'Aula Concluída' : 'Marcar como Concluída'}</span>
            </button>
          </div>
        </div>

        {/* ── Main Stage Grid: Player & Class Controls ── */}
        <div className={`grid grid-cols-1 gap-6 ${theaterMode ? 'lg:grid-cols-1' : 'lg:grid-cols-12'}`}>
          {/* Main Column: Cinema Player & Tabs (8 cols or full width) */}
          <div className={`space-y-6 ${theaterMode ? 'lg:col-span-12' : 'lg:col-span-8'}`}>
            {/* ── Video Player Container ── */}
            <div className="relative aspect-video w-full overflow-hidden rounded-[24px] border border-white/10 bg-[#070605] shadow-[0_20px_70px_rgba(0,0,0,0.95)]">
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
                  <HlsVideoPlayer src={activeVideo} poster={selectedLesson.coverImage} />
                )
              ) : (
                /* Poster Preview Cinematográfico de Alto Padrão */
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
                    className="absolute inset-0 h-full w-full object-cover object-center opacity-35 filter contrast-125 transition-transform duration-700 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/40" />

                  <div className="relative z-10 flex flex-col items-center max-w-lg">
                    <div
                      className="flex h-20 w-20 items-center justify-center rounded-3xl border border-white/15 bg-black/60 shadow-2xl backdrop-blur-md mb-4"
                      style={{ borderColor: `${selectedLesson.accentColor}55` }}
                    >
                      <LessonIcon size={34} style={{ color: selectedLesson.accentColor }} />
                    </div>

                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-widest text-white/70 mb-2">
                      AULA {selectedLesson.number} • {selectedLesson.categoryLabel}
                    </div>

                    <h2 className="text-[24px] sm:text-[30px] font-black tracking-tight text-white">
                      {selectedLesson.title}
                    </h2>

                    <p className="mt-2 text-[13px] text-white/60 leading-relaxed line-clamp-2">
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
                        className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2 text-[12px] font-bold text-white hover:border-white/40 hover:bg-white/15 transition shadow-lg"
                      >
                        <Edit3 size={14} />
                        <span>Configurar Link do Vídeo</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Configuração do Link de Vídeo (se ativado) */}
            {editingVideoUrl && (
              <div className="rounded-2xl border border-[var(--mvz-gold)]/30 bg-[#12100c] p-4 text-[13px] animate-fade-in shadow-2xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-[var(--mvz-gold-light)] flex items-center gap-2">
                    <Video size={15} />
                    <span>Vincular URL de Vídeo para: {selectedLesson.title}</span>
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
                  Insira o link direto do YouTube, Vimeo, Panda Video, Loom ou link direto MP4. O vídeo será executado dentro do player do Projeto.
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

            {/* ── Header da Aula: Título, Ferramenta & Abas ── */}
            <div className="rounded-[24px] border border-white/10 bg-[#0d0c0a] p-6 sm:p-7 shadow-[0_16px_50px_rgba(0,0,0,0.85)] space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10.5px] font-black uppercase tracking-wider text-white/60 mb-2">
                    <span>AULA {selectedLesson.number}</span>
                    <span>•</span>
                    <span style={{ color: selectedLesson.accentColor }}>{selectedLesson.categoryLabel}</span>
                  </div>
                  <h1 className="text-[24px] sm:text-[28px] font-black text-white tracking-tight">
                    {selectedLesson.title}
                  </h1>
                </div>

                {onNavigate && selectedLesson.toolViewId && (
                  <button
                    type="button"
                    onClick={() => onNavigate(selectedLesson.toolViewId)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/[0.06] border border-white/15 px-4 py-2.5 text-[12.5px] font-extrabold text-white transition hover:border-[var(--mvz-gold)] hover:bg-[var(--mvz-gold)]/10 hover:text-[var(--mvz-gold-light)] shrink-0"
                  >
                    <span>Executar Ferramenta Agora</span>
                    <ExternalLink size={14} className="text-[var(--mvz-gold)]" />
                  </button>
                )}
              </div>

              {/* ── Abas de Conteúdo da Aula ── */}
              <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] pb-3">
                {[
                  { id: 'overview', label: 'Visão Geral & Ementa', icon: BookOpen },
                  { id: 'resources', label: `Materiais (${selectedLesson.resources.length})`, icon: Download },
                  { id: 'notes', label: 'Caderno de Anotações', icon: FileText },
                  { id: 'faq', label: 'Dúvidas & Suporte', icon: HelpCircle },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[12.5px] font-extrabold transition-all duration-200 ${
                        isActive
                          ? 'border border-[var(--mvz-gold)]/40 bg-[var(--mvz-gold)]/10 text-[var(--mvz-gold-light)] shadow-sm'
                          : 'border border-transparent text-white/60 hover:text-white hover:bg-white/[0.03]'
                      }`}
                    >
                      <Icon size={14} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* ── ABA 1: VISÃO GERAL & EMENTA ── */}
              {activeTab === 'overview' && (
                <div className="space-y-6 animate-fade-in">
                  {/* Resumo Executivo */}
                  <div className="rounded-2xl border border-[var(--mvz-gold)]/20 bg-[var(--mvz-gold)]/[0.03] p-4 text-[13.5px] leading-relaxed text-white/85">
                    <div className="text-[11px] font-black uppercase tracking-wider text-[var(--mvz-gold)] mb-1 flex items-center gap-1.5">
                      <Sparkles size={13} />
                      <span>Diretriz Executiva da Aula</span>
                    </div>
                    {selectedLesson.executiveSummary}
                  </div>

                  {/* Descrição Completa */}
                  <div>
                    <h3 className="text-[12px] font-black uppercase tracking-wider text-white/50 mb-2">
                      Contexto Operacional
                    </h3>
                    <p className="text-[14px] leading-relaxed text-white/75">
                      {selectedLesson.fullDescription}
                    </p>
                  </div>

                  {/* Pilares que você vai dominar */}
                  <div>
                    <h3 className="text-[12px] font-black uppercase tracking-wider text-white/50 mb-3">
                      Pilares Dominados Nesta Formação
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedLesson.keyPoints.map((point, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-black/40 p-3.5"
                        >
                          <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--mvz-gold)]/15 text-[var(--mvz-gold-light)] text-[11px] font-black">
                            {idx + 1}
                          </div>
                          <span className="text-[12.5px] text-white/85 leading-snug">{point}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Checklist Prático Interativo (com LocalStorage) */}
                  <div>
                    <h3 className="text-[12px] font-black uppercase tracking-wider text-white/50 mb-3">
                      Checklist Prático de Execução (Clique para marcar)
                    </h3>
                    <div className="space-y-2">
                      {selectedLesson.practicalSteps.map((step, idx) => {
                        const taskKey = `${selectedLesson.id}_task_${idx}`;
                        const isDone = checkedTasks[taskKey] || false;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => toggleTask(taskKey)}
                            className={`flex w-full items-start gap-3 rounded-xl border p-3.5 text-left text-[13px] transition ${
                              isDone
                                ? 'border-[#22c55e]/30 bg-[#22c55e]/10 text-white line-through opacity-85'
                                : 'border-white/[0.06] bg-white/[0.02] text-white/80 hover:border-white/20 hover:bg-white/[0.04]'
                            }`}
                          >
                            <span className="mt-0.5 shrink-0">
                              {isDone ? (
                                <CheckSquare size={16} className="text-[#22c55e]" />
                              ) : (
                                <Square size={16} className="text-white/40" />
                              )}
                            </span>
                            <span className="leading-snug">{step}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ── ABA 2: MATERIAIS & RECURSOS ── */}
              {activeTab === 'resources' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="text-[13px] text-white/60 mb-2">
                    Faça download de documentos complementares, prompts e matrizes operacionais desta aula.
                  </div>

                  {selectedLesson.resources.map((res, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-black/40 p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--mvz-gold)]/10 text-[var(--mvz-gold)] border border-[var(--mvz-gold)]/20">
                          <FileText size={20} />
                        </div>
                        <div>
                          <div className="text-[13.5px] font-bold text-white">{res.title}</div>
                          <div className="text-[11px] font-semibold text-white/40">{res.sizeOrTag}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {res.contentSnippet && (
                          <button
                            type="button"
                            onClick={() => handleCopySnippet(res.contentSnippet!, res.title)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.05] px-3.5 py-2 text-[12px] font-bold text-white hover:bg-white/10 transition"
                          >
                            <Copy size={13} />
                            <span>Copiar</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDownloadResource(res)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--mvz-gold)] px-4 py-2 text-[12px] font-black text-black hover:bg-[var(--mvz-gold-light)] transition"
                        >
                          <Download size={13} />
                          <span>Baixar Arquivo</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── ABA 3: CADERNO DE ANOTAÇÕES ── */}
              {activeTab === 'notes' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-[14px] font-bold text-white">Suas Anotações Pessoais</h4>
                      <p className="text-[11.5px] text-white/50">
                        O texto é salvo automaticamente no seu navegador para consultas futuras.
                      </p>
                    </div>

                    {currentNotes && (
                      <button
                        type="button"
                        onClick={() => handleCopySnippet(currentNotes, 'Minhas Anotações')}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11.5px] font-bold text-white/70 hover:text-white transition"
                      >
                        <Copy size={13} />
                        <span>Copiar Anotações</span>
                      </button>
                    )}
                  </div>

                  <textarea
                    value={currentNotes}
                    onChange={(e) => handleSaveNotes(selectedLesson.id, e.target.value)}
                    placeholder="Escreva aqui insights, estratégias, ideias de produtos e observações sobre esta aula..."
                    rows={8}
                    className="w-full rounded-2xl border border-white/10 bg-black/60 p-4 text-[13.5px] text-white placeholder-white/30 focus:border-[var(--mvz-gold)] focus:outline-none transition leading-relaxed font-sans"
                  />
                  <div className="text-[11px] text-white/40 flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="text-[#22c55e]" />
                    <span>Sincronizado localmente com o Projeto.</span>
                  </div>
                </div>
              )}

              {/* ── ABA 4: DÚVIDAS & SUPORTE ── */}
              {activeTab === 'faq' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="text-[13px] text-white/60 mb-2">
                    Perguntas frequentes selecionadas pela mentoria sobre o tema desta aula.
                  </div>

                  {selectedLesson.faqs.map((faq, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-white/[0.06] bg-black/40 p-4 space-y-2"
                    >
                      <div className="text-[13px] font-bold text-[var(--mvz-gold-light)] flex items-center gap-2">
                        <MessageSquare size={14} className="text-[var(--mvz-gold)]" />
                        <span>{faq.question}</span>
                      </div>
                      <p className="text-[12.5px] text-white/75 leading-relaxed pl-5">
                        {faq.answer}
                      </p>
                    </div>
                  ))}

                  {/* Botão de Chamar Suporte */}
                  {onNavigate && (
                    <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between">
                      <span className="text-[12px] text-white/60">Ainda tem dúvidas técnicas?</span>
                      <button
                        type="button"
                        onClick={() => onNavigate('support')}
                        className="inline-flex items-center gap-2 rounded-xl border border-[var(--mvz-gold)]/40 bg-[var(--mvz-gold)]/10 px-4 py-2 text-[12px] font-bold text-[var(--mvz-gold-light)] hover:bg-[var(--mvz-gold)]/20 transition"
                      >
                        <HelpCircle size={14} />
                        <span>Abrir Chat de Suporte</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Lateral Column: Playlist / Ementa Completa (4 cols) */}
          {!theaterMode && (
            <div className="space-y-4 lg:col-span-4">
              <div className="rounded-[24px] border border-white/10 bg-[#0d0c0a] p-5 shadow-[0_16px_45px_rgba(0,0,0,0.85)] sticky top-6">
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-4">
                  <div>
                    <h3 className="text-[15px] font-black text-white tracking-tight flex items-center gap-2">
                      <GraduationCap size={18} className="text-[var(--mvz-gold)]" />
                      <span>Ementa Curricular</span>
                    </h3>
                    <p className="text-[11px] text-white/50 mt-0.5">
                      {completedLessons.length} de {totalLessons} aulas ({progressPercentage}%)
                    </p>
                  </div>

                  <div className="h-2 w-16 overflow-hidden rounded-full bg-white/10">
                    <div
                      style={{ width: `${progressPercentage}%` }}
                      className="h-full rounded-full bg-gradient-to-r from-[var(--mvz-gold)] to-white"
                    />
                  </div>
                </div>

                {/* Lista de Aulas com Módulos */}
                <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1 mvz-scroll">
                  {LESSONS_CATALOG.map((item) => {
                    const isCurrent = item.id === selectedLesson.id;
                    const itemCompleted = completedLessons.includes(item.id);
                    const isFav = favoriteLessons.includes(item.id);
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

                        {isFav && (
                          <Star size={12} className="text-[var(--mvz-gold)] shrink-0" fill="currentColor" />
                        )}

                        {isCurrent && (
                          <span className="h-1.5 w-1.5 rounded-full bg-[var(--mvz-gold)] shrink-0 animate-ping" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════════
     TELA 1: DASHBOARD & CURRÍCULO DA ÁREA DE MEMBROS DO PROJETO
  ══════════════════════════════════════════════════════════════════ */
  return (
    <div className="mvz-fade-up pb-28 space-y-10 max-w-7xl mx-auto px-2 sm:px-4">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl border border-[var(--mvz-gold)]/40 bg-[#12100d] px-4 py-3 text-[13px] font-bold text-white shadow-2xl backdrop-blur-xl animate-fade-in">
          <Sparkles size={16} className="text-[var(--mvz-gold)]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Certificate Modal */}
      {renderCertificateModal()}

      {/* ────────────────────────────────────────────────────────────
          1. HERO BANNER EXECUTIVO: ÁREA DE MEMBROS DO PROJETO
      ──────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-[#131217] via-[#09090b] to-black p-6 sm:p-10 shadow-[0_25px_80px_rgba(0,0,0,0.85)]">
        {/* Ambient atmospheric glows */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-[#d4af37]/15 blur-[130px]" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-80 w-80 rounded-full bg-[#38bdf8]/10 blur-[150px]" />

        {/* Imagem de Fundo Oficial do Banner */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <img
            src="/assets/banner-membros-novo.png"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = 'https://i.imgur.com/Vcjy313.png';
            }}
            alt="Área de Membros do Projeto"
            className="h-full w-full object-cover object-right filter brightness-95 contrast-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/75 to-transparent sm:via-black/60" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
        </div>

        <div className="relative z-10 max-w-3xl">
          {/* Executive Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--mvz-gold)]/40 bg-[var(--mvz-gold)]/10 px-4 py-1 text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#f5df93]">
            <GraduationCap size={14} className="text-[#d4af37]" />
            <span>Área de Membros do Projeto • Formação Master</span>
          </div>

          <h1 className="mt-4 text-[30px] sm:text-[44px] font-black leading-[1.08] tracking-tight text-white">
            Membros do <span className="bg-gradient-to-r from-[#fffdf0] via-[#d4af37] to-[#a37418] bg-clip-text text-transparent">Projeto</span>
          </h1>

          <p className="mt-3.5 max-w-xl text-[14px] sm:text-[15.5px] leading-relaxed text-[#a0a0ab]">
            Metodologia prática e executiva para estruturar, blindar e escalar operações lucrativas de produtos físicos com inteligência operacional no TikTok Shop.
          </p>

          {/* ── Métricas Executivas de Formação ── */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3.5 max-w-xl">
            {/* Progresso Geral */}
            <div className="rounded-2xl border border-white/10 bg-black/60 p-3.5 backdrop-blur-md">
              <div className="flex items-center justify-between text-[11px] mb-1.5">
                <span className="font-bold text-white/80">Progresso</span>
                <span className="font-extrabold text-[var(--mvz-gold-light)]">{progressPercentage}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10 mb-1.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#d4af37] to-white transition-all duration-500 shadow-[0_0_10px_rgba(212,175,55,0.4)]"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <div className="text-[10px] text-white/50 flex items-center justify-between">
                <span>{completedLessons.length} de {totalLessons} aulas</span>
                {completedLessons.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setCompletedLessons([]);
                      try {
                        localStorage.setItem('projeto_completed_lessons_v2', JSON.stringify([]));
                      } catch {}
                      showToast('Progresso zerado.');
                    }}
                    className="inline-flex items-center gap-0.5 text-white/40 hover:text-white/80 transition"
                  >
                    <RotateCcw size={9} />
                    <span>Zerar</span>
                  </button>
                )}
              </div>
            </div>

            {/* Carga Horária */}
            <div className="rounded-2xl border border-white/10 bg-black/60 p-3.5 backdrop-blur-md">
              <div className="text-[11px] font-bold text-white/80 mb-0.5">Tempo Curricular</div>
              <div className="text-[17px] font-black text-white">~3.5 Horas</div>
              <div className="text-[10px] text-white/50 mt-0.5">13 aulas 100% práticas</div>
            </div>

            {/* Certificado Oficial */}
            <button
              type="button"
              onClick={() => setCertificateModalOpen(true)}
              className="group rounded-2xl border border-[var(--mvz-gold)]/30 bg-gradient-to-br from-[var(--mvz-gold)]/15 to-black/60 p-3.5 text-left backdrop-blur-md hover:border-[var(--mvz-gold)] transition-all hover:scale-[1.02]"
            >
              <div className="flex items-center justify-between text-[11px] font-bold text-[var(--mvz-gold-light)] mb-0.5">
                <span className="flex items-center gap-1">
                  <Award size={13} />
                  <span>Certificado</span>
                </span>
                <ChevronRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </div>
              <div className="text-[14px] font-black text-white">
                {progressPercentage === 100 ? 'Liberado 🏆' : 'Visualizar Modelo'}
              </div>
              <div className="text-[10px] text-[var(--mvz-gold)]/80 mt-0.5">Clique para abrir</div>
            </button>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────
          2. BANNER DE CONTINUIDADE (RESUME WATCHING / NEXT UP)
      ──────────────────────────────────────────────────────────── */}
      {nextLessonToWatch && (
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0d0c0a] p-4 sm:p-5 shadow-[0_12px_35px_rgba(0,0,0,0.8)] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black">
              <img
                src={nextLessonToWatch.coverImage}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = nextLessonToWatch.coverFallback;
                }}
                alt={nextLessonToWatch.title}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <Play size={16} fill="white" className="text-white ml-0.5 opacity-90" />
              </div>
            </div>

            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-[var(--mvz-gold)]">
                CONTINUAR DE ONDE PAROU • AULA {nextLessonToWatch.number}
              </div>
              <h3 className="text-[16px] font-extrabold text-white tracking-tight">
                {nextLessonToWatch.title}
              </h3>
              <p className="text-[11.5px] text-white/50 line-clamp-1 max-w-lg">
                {nextLessonToWatch.shortDescription}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleSelectLesson(nextLessonToWatch)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--mvz-gold)] px-6 py-3 text-[12.5px] font-black text-black hover:bg-[var(--mvz-gold-light)] shadow-[0_0_20px_rgba(212,175,55,0.35)] transition-all shrink-0"
          >
            <Play size={14} fill="black" />
            <span>Assistir Agora ({nextLessonToWatch.duration})</span>
          </button>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────
          3. CONTROLES: FILTROS, MODO DE VISÃO & BUSCA
      ──────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
          {/* Filtros em Pílulas */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {[
              { id: 'todos', label: 'Todas as Aulas (13)' },
              { id: 'favoritas', label: `Favoritas (${favoriteLessons.length})` },
              { id: 'pendentes', label: 'Pendentes' },
              { id: 'concluidas', label: 'Concluídas' },
              { id: 'ia', label: 'Núcleo de IA' },
              { id: 'mineracao', label: 'Mineração' },
              { id: 'criativos', label: 'Criativos' },
              { id: 'seguranca', label: 'Blindagem' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFilter(f.id)}
                className={`rounded-xl px-3.5 py-2 text-[12px] font-extrabold transition-all duration-200 ${
                  activeFilter === f.id
                    ? 'bg-[var(--mvz-gold)] text-black shadow-[0_0_15px_rgba(212,175,55,0.35)]'
                    : 'border border-white/10 bg-white/[0.02] text-white/60 hover:border-white/20 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Busca & Switch de Visualização */}
          <div className="flex items-center gap-3">
            {/* Campo de Busca Rápida */}
            <div className="relative flex-1 sm:w-64">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar aula ou ferramenta..."
                className="h-9 w-full rounded-xl border border-white/10 bg-black/60 pl-9 pr-3.5 text-[12.5px] text-white placeholder-white/30 transition focus:border-[var(--mvz-gold)] focus:outline-none"
              />
            </div>

            {/* Alternar Visualização: Módulos / Grade / Lista */}
            <div className="flex items-center rounded-xl border border-white/10 bg-black/60 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('modules')}
                className={`p-1.5 rounded-lg text-white/60 transition ${
                  viewMode === 'modules' ? 'bg-white/10 text-white' : 'hover:text-white'
                }`}
                title="Visão por Módulos Estruturados"
              >
                <Layers size={16} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-white/60 transition ${
                  viewMode === 'grid' ? 'bg-white/10 text-white' : 'hover:text-white'
                }`}
                title="Visão em Grade"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('syllabus')}
                className={`p-1.5 rounded-lg text-white/60 transition ${
                  viewMode === 'syllabus' ? 'bg-white/10 text-white' : 'hover:text-white'
                }`}
                title="Visão em Lista Curricular"
              >
                <ListFilter size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────
          4. VISÃO 1: MÓDULOS ESTRUTURADOS (MASTERCLASS VIEW)
      ──────────────────────────────────────────────────────────── */}
      {viewMode === 'modules' && (
        <div className="space-y-10">
          {COURSE_MODULES.map((module) => {
            const moduleLessons = filteredLessons.filter((l) => l.moduleId === module.id);
            if (moduleLessons.length === 0 && (searchQuery || activeFilter !== 'todos')) {
              return null;
            }

            const moduleCompletedCount = moduleLessons.filter((l) => completedLessons.includes(l.id)).length;
            const moduleProgress = moduleLessons.length > 0 ? Math.round((moduleCompletedCount / moduleLessons.length) * 100) : 0;

            return (
              <div key={module.id} className="space-y-4">
                {/* Module Header Strip */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
                  <div>
                    <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] mb-1" style={{ color: module.accent }}>
                      <span>MÓDULO {module.number}</span>
                      <span>•</span>
                      <span>{module.badge}</span>
                    </div>
                    <h2 className="text-[20px] font-black text-white tracking-tight">
                      {module.title}
                    </h2>
                    <p className="text-[12px] text-white/50">
                      {module.subtitle}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[11px] font-bold text-white/50">
                      {moduleCompletedCount}/{moduleLessons.length} concluídas ({moduleProgress}%)
                    </span>
                    <div className="h-2 w-20 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${moduleProgress}%`,
                          backgroundColor: module.accent,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Module Lessons Grid */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {moduleLessons.map((lesson) => {
                    const isDone = completedLessons.includes(lesson.id);
                    const isFav = favoriteLessons.includes(lesson.id);

                    return (
                      <div
                        key={lesson.id}
                        onClick={() => handleSelectLesson(lesson)}
                        className="group relative flex flex-col justify-between overflow-hidden rounded-[24px] border border-white/10 bg-[#0d0c0a] shadow-[0_16px_45px_rgba(0,0,0,0.85)] transition-all duration-300 hover:-translate-y-1.5 hover:border-[var(--mvz-gold)]/60 hover:shadow-[0_20px_60px_rgba(212,175,55,0.2)] cursor-pointer"
                      >
                        {/* Capinha Cinematográfica 16:9 */}
                        <div className="relative aspect-video w-full overflow-hidden border-b border-white/[0.08]">
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

                          <div className="absolute inset-0 bg-black/15 group-hover:bg-black/45 transition-colors" />

                          {/* Top Badges: Concluída & Favorita */}
                          <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between">
                            <span className="rounded-md border border-white/10 bg-black/75 px-2 py-0.5 text-[9.5px] font-black uppercase text-white/70 backdrop-blur-md">
                              AULA {lesson.number}
                            </span>

                            <div className="flex items-center gap-1.5">
                              {isFav && (
                                <span className="rounded-md bg-[var(--mvz-gold)]/20 p-1 text-[var(--mvz-gold)] backdrop-blur-md">
                                  <Star size={11} fill="currentColor" />
                                </span>
                              )}
                              {isDone && (
                                <span className="inline-flex items-center gap-1 rounded-md border border-[#22c55e]/40 bg-black/75 px-2 py-0.5 text-[9.5px] font-black text-[#22c55e] backdrop-blur-md shadow-lg">
                                  <Check size={10} strokeWidth={3} />
                                  CONCLUÍDA
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Botão de Play central */}
                          <div className="relative z-10 flex h-full w-full items-center justify-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--mvz-gold)] text-black shadow-[0_0_25px_rgba(212,175,55,0.7)] opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110">
                              <Play size={18} fill="black" className="ml-0.5" />
                            </div>
                          </div>

                          {/* Duration bottom-right badge */}
                          <div className="absolute bottom-2.5 right-2.5 z-10">
                            <span className="rounded-md bg-black/80 px-2 py-0.5 text-[10px] font-bold text-white/80 backdrop-blur-md">
                              {lesson.duration}
                            </span>
                          </div>
                        </div>

                        {/* Corpo do Card */}
                        <div className="flex flex-1 flex-col justify-between p-5 space-y-4">
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">
                              {lesson.categoryLabel}
                            </div>
                            <h3 className="text-[17px] font-extrabold text-white tracking-tight group-hover:text-[var(--mvz-gold-light)] transition-colors">
                              {lesson.title}
                            </h3>
                            <p className="mt-1.5 text-[12px] leading-relaxed text-white/60 line-clamp-2">
                              {lesson.shortDescription}
                            </p>
                          </div>

                          {/* Action Footer */}
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
          })}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────
          5. VISÃO 2: GRADE COMPLETA (DIRECT 3-COL GRID)
      ──────────────────────────────────────────────────────────── */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredLessons.map((lesson) => {
            const isDone = completedLessons.includes(lesson.id);
            const isFav = favoriteLessons.includes(lesson.id);

            return (
              <div
                key={lesson.id}
                onClick={() => handleSelectLesson(lesson)}
                className="group relative flex flex-col justify-between overflow-hidden rounded-[24px] border border-white/10 bg-[#0d0c0a] shadow-[0_16px_45px_rgba(0,0,0,0.85)] transition-all duration-300 hover:-translate-y-1.5 hover:border-[var(--mvz-gold)]/60 hover:shadow-[0_20px_60px_rgba(212,175,55,0.2)] cursor-pointer"
              >
                <div className="relative aspect-video w-full overflow-hidden border-b border-white/[0.08]">
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

                  <div className="absolute inset-0 bg-black/15 group-hover:bg-black/45 transition-colors" />

                  <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between">
                    <span className="rounded-md border border-white/10 bg-black/75 px-2 py-0.5 text-[9.5px] font-black uppercase text-white/70 backdrop-blur-md">
                      AULA {lesson.number}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {isFav && (
                        <span className="rounded-md bg-[var(--mvz-gold)]/20 p-1 text-[var(--mvz-gold)] backdrop-blur-md">
                          <Star size={11} fill="currentColor" />
                        </span>
                      )}
                      {isDone && (
                        <span className="inline-flex items-center gap-1 rounded-md border border-[#22c55e]/40 bg-black/75 px-2 py-0.5 text-[9.5px] font-black text-[#22c55e] backdrop-blur-md shadow-lg">
                          <Check size={10} strokeWidth={3} />
                          CONCLUÍDA
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="relative z-10 flex h-full w-full items-center justify-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--mvz-gold)] text-black shadow-[0_0_25px_rgba(212,175,55,0.7)] opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110">
                      <Play size={18} fill="black" className="ml-0.5" />
                    </div>
                  </div>

                  <div className="absolute bottom-2.5 right-2.5 z-10">
                    <span className="rounded-md bg-black/80 px-2 py-0.5 text-[10px] font-bold text-white/80 backdrop-blur-md">
                      {lesson.duration}
                    </span>
                  </div>
                </div>

                <div className="flex flex-1 flex-col justify-between p-5 space-y-4">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">
                      {lesson.categoryLabel}
                    </div>
                    <h3 className="text-[17px] font-extrabold text-white tracking-tight group-hover:text-[var(--mvz-gold-light)] transition-colors">
                      {lesson.title}
                    </h3>
                    <p className="mt-1.5 text-[12px] leading-relaxed text-white/60 line-clamp-2">
                      {lesson.shortDescription}
                    </p>
                  </div>

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
      )}

      {/* ────────────────────────────────────────────────────────────
          6. VISÃO 3: LISTA CURRICULAR (SYLLABUS / LINEAR VIEW)
      ──────────────────────────────────────────────────────────── */}
      {viewMode === 'syllabus' && (
        <div className="rounded-[24px] border border-white/10 bg-[#0d0c0a] overflow-hidden shadow-2xl">
          <div className="divide-y divide-white/[0.06]">
            {filteredLessons.map((lesson) => {
              const isDone = completedLessons.includes(lesson.id);
              const isFav = favoriteLessons.includes(lesson.id);
              const ItemIcon = lesson.icon;

              return (
                <div
                  key={lesson.id}
                  onClick={() => handleSelectLesson(lesson)}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 hover:bg-white/[0.03] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-bold text-[13px] border ${
                        isDone
                          ? 'border-[#22c55e]/30 bg-[#22c55e]/15 text-[#22c55e]'
                          : 'border-white/10 bg-white/[0.03] text-white/70 group-hover:border-[var(--mvz-gold)]/50 group-hover:text-[var(--mvz-gold)]'
                      }`}
                    >
                      {isDone ? <Check size={18} strokeWidth={3} /> : <ItemIcon size={18} />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-white/40">
                          AULA {lesson.number}
                        </span>
                        <span className="text-white/20">•</span>
                        <span className="text-[11px] font-semibold text-[var(--mvz-gold)]">
                          {lesson.categoryLabel}
                        </span>
                        {isFav && <Star size={11} fill="currentColor" className="text-[var(--mvz-gold)]" />}
                      </div>

                      <h4 className="text-[15px] font-bold text-white group-hover:text-[var(--mvz-gold-light)] transition-colors">
                        {lesson.title}
                      </h4>
                      <p className="text-[12px] text-white/50 line-clamp-1 max-w-xl">
                        {lesson.shortDescription}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 self-end sm:self-center">
                    <span className="text-[12px] font-semibold text-white/40">
                      {lesson.duration}
                    </span>

                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-xl bg-white/[0.05] border border-white/10 px-3.5 py-1.5 text-[12px] font-bold text-white group-hover:border-[var(--mvz-gold)] group-hover:bg-[var(--mvz-gold)] group-hover:text-black transition"
                    >
                      <span>Acessar</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

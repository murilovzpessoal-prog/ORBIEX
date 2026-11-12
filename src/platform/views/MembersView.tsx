import { useState, useMemo } from 'react';
import {
  Play,
  CheckCircle2,
  Search,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  GraduationCap,
  Clock,
  BookOpen,
  FileText,
  Check,
  ChevronRight,
  MessageCircle,
  ExternalLink,
} from 'lucide-react';

export interface Lesson {
  id: string;
  title: string;
  duration: string;
  videoUrl?: string;
  description: string;
  keyTakeaways: string[];
  resources?: { name: string; type: string; url?: string }[];
}

export interface Module {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  category: 'fundamentos' | 'produtos' | 'criativos' | 'escala' | 'comunidade';
  thumbnailUrl: string;
  accentColor: string;
  lessons: Lesson[];
}

const MODULES_DATA: Module[] = [
  {
    id: 'mod-1',
    number: '01',
    title: 'Boas-Vindas & Mentalidade Orbiex',
    subtitle: 'Alinhamento estratégico do ecossistema e primeiros passos para a escala.',
    category: 'fundamentos',
    thumbnailUrl: '/assets/login-orbix-man.jpg',
    accentColor: '#d4af37',
    lessons: [
      {
        id: 'l-1-1',
        title: 'Seja bem-vindo à Orbiex AI: O Novo Jogo do TikTok Shop',
        duration: '08:45',
        description: 'Apresentação geral da plataforma, visão estratégica do modelo de afiliados e como o ecossistema Orbiex foi construído para gerar receita previsível.',
        keyTakeaways: [
          'Entendimento de como a IA acelera a esteira de vendas.',
          'Diferença entre revenda tradicional e modelo de afiliado comissionado.',
          'Mapa de rota para os primeiros 10k faturados.',
        ],
        resources: [
          { name: 'Manual de Boas-Vindas Orbiex (PDF)', type: 'pdf' },
          { name: 'Checklist de Inicialização Rápida', type: 'doc' },
        ],
      },
      {
        id: 'l-1-2',
        title: 'Tour Completo: Como Dominar as Ferramentas da Plataforma',
        duration: '14:20',
        description: 'Passo a passo por cada menu da Orbiex: do Agente IA ao Scanner de Produtos, geradores e biblioteca de prompts.',
        keyTakeaways: [
          'Como conversar com o Agente para minerar ângulos de vendas.',
          'Utilização prática dos menus de Score e Scanner.',
          'Como salvar e reaproveitar prompts de alta conversão.',
        ],
      },
      {
        id: 'l-1-3',
        title: 'Mentalidade de Escala & Gestão de Rotina',
        duration: '11:15',
        description: 'Como organizar seu dia para postar, analisar dados e escalar sem sobrecarga.',
        keyTakeaways: [
          'Rotina ideal de 60 minutos diários com IA.',
          'Métricas diárias que você deve acompanhar.',
        ],
      },
      {
        id: 'l-1-4',
        title: 'Regras de Ouro e Compliance de Afiliado',
        duration: '09:30',
        description: 'Os pontos vitais para não violar as diretrizes do TikTok e manter sua esteira sempre segura.',
        keyTakeaways: [
          'Diretrizes essenciais de comissão e links.',
          'O que nunca fazer em vídeos de produtos físicos.',
        ],
      },
    ],
  },
  {
    id: 'mod-2',
    number: '02',
    title: 'Setup da Máquina de Vendas',
    subtitle: 'Estruturação profissional de conta, verificação e esteira de aprovação.',
    category: 'fundamentos',
    thumbnailUrl: '/assets/banner-jornada-novo.jpeg',
    accentColor: '#38bdf8',
    lessons: [
      {
        id: 'l-2-1',
        title: 'Criação e Configuração da Conta TikTok Shop Afiliado',
        duration: '16:50',
        description: 'Tutorial na prática de como criar uma conta pronta para receber comissões e vincular os produtos certos.',
        keyTakeaways: [
          'Passo a passo no app do TikTok e TikTok Shop.',
          'Configurações fiscais e dados de recebimento bancário.',
        ],
      },
      {
        id: 'l-2-2',
        title: 'Aquecimento Seguro de Perfis Novos',
        duration: '12:10',
        description: 'Como aquecer seu perfil nos primeiros 5 dias para o algoritmo entender que é uma conta legítima de criador.',
        keyTakeaways: [
          'Interações corretas para treinar o algoritmo.',
          'Quando e como postar o primeiro vídeo de produto.',
        ],
      },
      {
        id: 'l-2-3',
        title: 'Esteira Anti-Bloqueio e Segurança Operacional',
        duration: '10:40',
        description: 'Como blindar seus dispositivos e conexões para criar múltiplas contas sem cruzamento de dados.',
        keyTakeaways: [
          'Boas práticas de IP, dispositivos e cookies.',
          'Checklist preventivo antes de cada publicação.',
        ],
      },
    ],
  },
  {
    id: 'mod-3',
    number: '03',
    title: 'Mineração de Produtos Vencedores',
    subtitle: 'Utilize os Scores e o Scanner Orbiex para encontrar produtos de alto volume.',
    category: 'produtos',
    thumbnailUrl: '/images/f8Or7ZQ.png',
    accentColor: '#a855f7',
    lessons: [
      {
        id: 'l-3-1',
        title: 'O Scanner de Tendências: Detectando Produtos Antes da Saturação',
        duration: '15:30',
        description: 'Como filtrar a base de produtos da Orbiex para localizar itens em ascensão exponencial de vendas.',
        keyTakeaways: [
          'Critérios de pontuação do Score Produto.',
          'Como identificar curva ascendente de pedidos semanais.',
        ],
      },
      {
        id: 'l-3-2',
        title: 'Score do Lojista: Segurança na Entrega e Comissão Garantida',
        duration: '13:00',
        description: 'Como analisar a reputação da loja parceira para garantir que o cliente receba rápido e sua comissão seja paga sem estorno.',
        keyTakeaways: [
          'Fatores críticos: tempo de despacho, nota média e estoque.',
          'Como negociar comissões mais altas com lojistas parceiros.',
        ],
      },
      {
        id: 'l-3-3',
        title: 'Engenharia de Nichos: Beleza, Casa, Gadgets e Bem-Estar',
        duration: '18:25',
        description: 'Raio-x dos nichos que mais geram compras impulsivas no TikTok e como se posicionar em cada um.',
        keyTakeaways: [
          'Gatilhos psicológicos de compra rápida.',
          'Faixa de preço ideal (sweet spot de ticket médio).',
        ],
      },
    ],
  },
  {
    id: 'mod-4',
    number: '04',
    title: 'Engenharia de Criativos & Hooks Virais',
    subtitle: 'Criação de vídeos magnéticos com IA que prendem a atenção e vendem.',
    category: 'criativos',
    thumbnailUrl: '/images/4b8qE4r.png',
    accentColor: '#ec4899',
    lessons: [
      {
        id: 'l-4-1',
        title: 'Os Primeiros 3 Segundos: Criando Hooks Irresistíveis',
        duration: '21:10',
        description: 'A anatomia de hooks visuais e verbais com 80%+ de retenção. Como usar a ferramenta Hooks Virais da Orbiex.',
        keyTakeaways: [
          'Quebra de padrão nos primeiros quadros.',
          'Prompts de hooks que geram curiosidade incontrolável.',
        ],
      },
      {
        id: 'l-4-2',
        title: 'Engenharia de Headlines & Copies Persuasivas',
        duration: '14:40',
        description: 'Como utilizar o Gerador de Headline para criar títulos magnéticos e scripts de alta conversão.',
        keyTakeaways: [
          'Fórmulas de headline validadas no mercado americano.',
          'Palavras magnéticas que estimulam o clique no produto.',
        ],
      },
      {
        id: 'l-4-3',
        title: 'Extrator de Movimentos: Modelando Vídeos Validados',
        duration: '16:00',
        description: 'Como decompor criativos campeões, extrair o ritmo e aplicar o mesmo padrão aos seus produtos sem plágio.',
        keyTakeaways: [
          'Ritmo de cortes, transições e efeitos sonoros.',
          'Aceleração de produção com IA.',
        ],
      },
    ],
  },
  {
    id: 'mod-5',
    number: '05',
    title: 'Blindagem & Antirrestrição na Prática',
    subtitle: 'Técnicas avançadas para manter suas contas saudáveis e protegidas de quedas.',
    category: 'escala',
    thumbnailUrl: '/images/YrGOOCH.png',
    accentColor: '#10b981',
    lessons: [
      {
        id: 'l-5-1',
        title: 'Como o Algoritmo do TikTok Analisa Seus Vídeos',
        duration: '17:35',
        description: 'Entenda a visão computacional, metadados e filtros de moderação que o TikTok aplica em cada upload.',
        keyTakeaways: [
          'Gatilhos que causam 0 visualizações (Shadowban).',
          'Como a ferramenta Antirrestrição da Orbiex pré-analisa seu arquivo.',
        ],
      },
      {
        id: 'l-5-2',
        title: 'Higienização de Metadados e Alteração de Hash',
        duration: '12:50',
        description: 'O processo técnico para tornar qualquer criativo 100% original aos olhos da IA de moderação.',
        keyTakeaways: [
          'Limpeza de EXIF, taxa de quadros e camadas de áudio.',
          'Checklist de exportação final.',
        ],
      },
      {
        id: 'l-5-3',
        title: 'Plano de Ação para Recuperar Contas Bloqueadas',
        duration: '11:20',
        description: 'O que fazer caso um vídeo seja desqualificado ou uma conta sofra restrição temporária.',
        keyTakeaways: [
          'Modelos de apelação que funcionam.',
          'Como reativar o alcance em menos de 48 horas.',
        ],
      },
    ],
  },
  {
    id: 'mod-6',
    number: '06',
    title: 'Escala Rápida & Turbo de Seguidores',
    subtitle: 'Explosão de tráfego orgânico, multiplicação de contas e rotina de alta renda.',
    category: 'escala',
    thumbnailUrl: '/assets/banner-jornada-novo.jpeg',
    accentColor: '#f59e0b',
    lessons: [
      {
        id: 'l-6-1',
        title: 'Estratégias de Crescimento Acelerado de Seguidores',
        duration: '19:40',
        description: 'Como atingir os primeiros 1.000 a 5.000 seguidores orgânicos em tempo recorde para desbloquear todos os recursos.',
        keyTakeaways: [
          'Loops virais e técnicas de retenção forçada.',
          'Uso da ferramenta Turbo Seguidores da plataforma.',
        ],
      },
      {
        id: 'l-6-2',
        title: 'Operação Multi-Contas: Atingindo 5 a 10 Vendas Diárias',
        duration: '22:15',
        description: 'A estrutura para rodar 3 a 5 perfis simultâneos com produtos complementares e faturamento em esteira.',
        keyTakeaways: [
          'Organização de pastas, cronogramas e agendamento.',
          'Como delegar ou automatizar 80% do trabalho diário.',
        ],
      },
    ],
  },
  {
    id: 'mod-7',
    number: '07',
    title: 'Comunidade VIP & Networking de Elite',
    subtitle: 'Conexão direta com os maiores criadores e suporte prioritário no WhatsApp e Discord.',
    category: 'comunidade',
    thumbnailUrl: '/assets/login-orbix-man.jpg',
    accentColor: '#22c55e',
    lessons: [
      {
        id: 'l-7-1',
        title: 'Como Aproveitar o Grupo VIP de Alunos no WhatsApp',
        duration: '06:30',
        description: 'Orientações para tirar dúvidas rápidas, participar de bate-papos sobre produtos em alta e suporte da equipe.',
        keyTakeaways: [
          'Regras de convivência e networking ético.',
          'Compartilhamento diário de vitórias e testes.',
        ],
        resources: [
          { name: 'Link Oficial de Entrada no WhatsApp VIP', type: 'link', url: 'https://chat.whatsapp.com' },
        ],
      },
      {
        id: 'l-7-2',
        title: 'Acesso ao Servidor Oficial no Discord',
        duration: '07:15',
        description: 'Estrutura dos canais no Discord: salas de call, compartilhamento de criativos, avisos de produtos quentes e suporte técnico.',
        keyTakeaways: [
          'Como vincular seu cargo de Membro Oficial.',
          'Participação nas calls semanais de análise.',
        ],
        resources: [
          { name: 'Convite Oficial para o Servidor Discord', type: 'link', url: 'https://discord.gg' },
        ],
      },
    ],
  },
];

export function MembersView() {
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('todos');

  // Estado de aulas concluídas com persistência local
  const [completedLessons, setCompletedLessons] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('orbiex_completed_lessons');
      return stored ? JSON.parse(stored) : ['l-1-1'];
    } catch {
      return ['l-1-1'];
    }
  });

  const totalLessons = useMemo(() => {
    return MODULES_DATA.reduce((acc, m) => acc + m.lessons.length, 0);
  }, []);

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
        localStorage.setItem('orbiex_completed_lessons', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const filteredModules = useMemo(() => {
    return MODULES_DATA.filter((m) => {
      const matchesCategory = activeCategory === 'todos' || m.category === activeCategory;
      const matchesSearch =
        searchQuery === '' ||
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.lessons.some((l) => l.title.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const handleOpenModule = (mod: Module, lesson?: Lesson) => {
    setSelectedModule(mod);
    setSelectedLesson(lesson || mod.lessons[0]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNextLesson = () => {
    if (!selectedModule || !selectedLesson) return;
    const currentIndex = selectedModule.lessons.findIndex((l) => l.id === selectedLesson.id);
    if (currentIndex < selectedModule.lessons.length - 1) {
      setSelectedLesson(selectedModule.lessons[currentIndex + 1]);
    } else {
      // Procura o próximo módulo
      const modIndex = MODULES_DATA.findIndex((m) => m.id === selectedModule.id);
      if (modIndex < MODULES_DATA.length - 1) {
        const nextMod = MODULES_DATA[modIndex + 1];
        setSelectedModule(nextMod);
        setSelectedLesson(nextMod.lessons[0]);
      }
    }
  };

  const handlePrevLesson = () => {
    if (!selectedModule || !selectedLesson) return;
    const currentIndex = selectedModule.lessons.findIndex((l) => l.id === selectedLesson.id);
    if (currentIndex > 0) {
      setSelectedLesson(selectedModule.lessons[currentIndex - 1]);
    } else {
      // Volta para o módulo anterior
      const modIndex = MODULES_DATA.findIndex((m) => m.id === selectedModule.id);
      if (modIndex > 0) {
        const prevMod = MODULES_DATA[modIndex - 1];
        setSelectedModule(prevMod);
        setSelectedLesson(prevMod.lessons[prevMod.lessons.length - 1]);
      }
    }
  };

  // Se o aluno está dentro de uma aula (Player View)
  if (selectedModule && selectedLesson) {
    const isCompleted = completedLessons.includes(selectedLesson.id);
    const currentIndex = selectedModule.lessons.findIndex((l) => l.id === selectedLesson.id);

    return (
      <div className="space-y-6 pb-16 animate-in fade-in duration-300">
        {/* Top Breadcrumb & Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
          <button
            type="button"
            onClick={() => setSelectedModule(null)}
            className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-[12.5px] font-bold text-white transition hover:bg-white/10 active:scale-95"
          >
            <ArrowLeft size={15} />
            <span>Voltar para Módulos</span>
          </button>

          <div className="flex items-center gap-2 text-[12px] text-[#909099]">
            <span>Módulo {selectedModule.number}</span>
            <ChevronRight size={13} className="text-white/30" />
            <span className="font-semibold text-white">Aula {currentIndex + 1} de {selectedModule.lessons.length}</span>
          </div>
        </div>

        {/* Video Player & Lesson Details Container */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Column: Video Player & Description */}
          <div className="space-y-6 lg:col-span-2">
            {/* Cinematic Video Player Container */}
            <div className="relative aspect-video w-full overflow-hidden rounded-3xl border border-white/10 bg-black shadow-[0_12px_40px_rgba(0,0,0,0.8)]">
              {/* Fallback Poster / Player Screen */}
              <div className="relative flex h-full w-full items-center justify-center bg-[#09090b]">
                <img
                  src={selectedModule.thumbnailUrl}
                  alt={selectedLesson.title}
                  className="absolute inset-0 h-full w-full object-cover opacity-35 filter brightness-75"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                {/* Big Golden Play Button Overlay */}
                <div className="relative z-10 flex flex-col items-center gap-3 text-center">
                  <div className="flex h-18 w-18 items-center justify-center rounded-full bg-gradient-to-br from-[#d4af37] to-[#8c6d1f] shadow-[0_0_40px_rgba(212,175,55,0.6)] transition-transform hover:scale-110 cursor-pointer">
                    <Play size={28} className="translate-x-0.5 fill-black text-black" />
                  </div>
                  <div className="text-[13px] font-bold tracking-wider uppercase text-white/90">
                    Clique para iniciar a aula
                  </div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-[11px] font-mono text-[#d4af37] backdrop-blur-md border border-white/10">
                    <Clock size={12} />
                    <span>Duração: {selectedLesson.duration}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Lesson Info Header & Action Buttons */}
            <div className="rounded-3xl border border-white/10 bg-[#0e0e12] p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-[var(--mvz-gold)]/40 bg-[var(--mvz-gold)]/10 px-3.5 py-1 text-[10.5px] font-extrabold uppercase tracking-widest text-[#f5df93]">
                    <Sparkles size={11} className="text-[#d4af37]" />
                    <span>Módulo {selectedModule.number} • Aula {currentIndex + 1}</span>
                  </div>
                  <h1 className="mt-3 text-[20px] font-black tracking-tight text-white sm:text-[26px]">
                    {selectedLesson.title}
                  </h1>
                </div>

                {/* Mark as Complete Button */}
                <button
                  type="button"
                  onClick={() => toggleLessonCompleted(selectedLesson.id)}
                  className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-[12.5px] font-extrabold uppercase tracking-wider transition-all active:scale-95 ${
                    isCompleted
                      ? 'border border-emerald-500/30 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                      : 'bg-gradient-to-r from-[#d4af37] to-[#aa7b1e] text-black shadow-[0_4px_20px_rgba(212,175,55,0.3)] hover:brightness-110'
                  }`}
                >
                  <Check size={16} />
                  <span>{isCompleted ? 'Aula Concluída' : 'Marcar como Concluída'}</span>
                </button>
              </div>

              {/* Lesson Description */}
              <div className="mt-6 border-t border-white/10 pt-6">
                <h3 className="text-[13px] font-extrabold uppercase tracking-wider text-[#909099]">
                  Sobre esta aula
                </h3>
                <p className="mt-2 text-[14px] leading-relaxed text-[#c4c4cc]">
                  {selectedLesson.description}
                </p>
              </div>

              {/* Key Takeaways */}
              {selectedLesson.keyTakeaways.length > 0 && (
                <div className="mt-6 border-t border-white/10 pt-6">
                  <h3 className="text-[13px] font-extrabold uppercase tracking-wider text-[#909099]">
                    O que você vai dominar
                  </h3>
                  <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {selectedLesson.keyTakeaways.map((item, i) => (
                      <div key={i} className="flex items-start gap-2.5 rounded-xl bg-white/[0.03] p-3 text-[12.5px] text-white">
                        <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-[#d4af37]" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resources / Downloads */}
              {selectedLesson.resources && selectedLesson.resources.length > 0 && (
                <div className="mt-6 border-t border-white/10 pt-6">
                  <h3 className="text-[13px] font-extrabold uppercase tracking-wider text-[#909099]">
                    Materiais & Recursos Complementares
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {selectedLesson.resources.map((res, i) => (
                      <a
                        key={i}
                        href={res.url || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-[12px] font-bold text-white transition hover:bg-white/10"
                      >
                        <FileText size={14} className="text-[#d4af37]" />
                        <span>{res.name}</span>
                        <ExternalLink size={12} className="text-white/40" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Navigation Footer (Prev / Next) */}
              <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-6">
                <button
                  type="button"
                  onClick={handlePrevLesson}
                  disabled={currentIndex === 0 && MODULES_DATA[0].id === selectedModule.id}
                  className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-[12px] font-bold text-white transition hover:bg-white/5 disabled:opacity-40"
                >
                  <ArrowLeft size={14} />
                  <span>Aula Anterior</span>
                </button>

                <button
                  type="button"
                  onClick={handleNextLesson}
                  className="flex items-center gap-2 rounded-xl bg-white/10 px-5 py-2.5 text-[12px] font-bold text-white transition hover:bg-white/20 active:scale-95"
                >
                  <span>Próxima Aula</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Module Lessons List */}
          <div className="space-y-4">
            <div className="rounded-3xl border border-white/10 bg-[#0e0e12] p-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#d4af37]">
                    Aulas do Módulo {selectedModule.number}
                  </div>
                  <h3 className="text-[15px] font-black text-white">
                    {selectedModule.title}
                  </h3>
                </div>
                <span className="rounded-lg bg-white/10 px-2 py-1 text-[11px] font-bold text-white">
                  {selectedModule.lessons.length} aulas
                </span>
              </div>

              {/* Lessons List */}
              <div className="mt-4 space-y-2">
                {selectedModule.lessons.map((lesson, idx) => {
                  const active = lesson.id === selectedLesson.id;
                  const completed = completedLessons.includes(lesson.id);

                  return (
                    <button
                      key={lesson.id}
                      type="button"
                      onClick={() => setSelectedLesson(lesson)}
                      className={`flex w-full items-start gap-3 rounded-2xl p-3.5 text-left transition-all ${
                        active
                          ? 'border border-[#d4af37]/40 bg-[#d4af37]/10'
                          : 'border border-transparent bg-white/[0.02] hover:bg-white/5'
                      }`}
                    >
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLessonCompleted(lesson.id);
                        }}
                        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition ${
                          completed
                            ? 'border-emerald-500 bg-emerald-500 text-black'
                            : 'border-white/20 bg-black/40 text-transparent hover:border-white/40'
                        }`}
                      >
                        <Check size={13} className={completed ? 'block' : 'opacity-0'} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8a8a93]">
                            Aula {idx + 1}
                          </span>
                          <span className="text-[10.5px] font-mono text-[#70707a]">
                            {lesson.duration}
                          </span>
                        </div>
                        <div className={`mt-0.5 text-[13px] font-bold leading-snug line-clamp-2 ${active ? 'text-[#f5df93]' : 'text-white'}`}>
                          {lesson.title}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Other Modules Quick Switch */}
            <div className="rounded-3xl border border-white/10 bg-[#0e0e12] p-5">
              <h4 className="text-[12px] font-extrabold uppercase tracking-wider text-[#8a8a93]">
                Outros Módulos
              </h4>
              <div className="mt-3 space-y-2">
                {MODULES_DATA.filter((m) => m.id !== selectedModule.id).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleOpenModule(m)}
                    className="flex w-full items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-3 text-left transition hover:border-white/15 hover:bg-white/5"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="text-[10px] font-bold uppercase text-[#d4af37]">Módulo {m.number}</div>
                      <div className="truncate text-[12.5px] font-bold text-white">{m.title}</div>
                    </div>
                    <ChevronRight size={14} className="shrink-0 text-white/40" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Visualização Principal: Grade de Módulos (Estilo Netflix / Formação de Alto Padrão)
  return (
    <div className="space-y-8 pb-16">
      {/* ────────────────────────────────────────────────────────────
          CINEMATIC HERO BANNER: ORBIEX ACADEMY
      ──────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#121216] via-[#09090b] to-black p-6 sm:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
        {/* Glow ambient background */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full bg-[#d4af37]/15 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-80 w-80 rounded-full bg-[#38bdf8]/10 blur-[140px]" />

        {/* Mentor / Founder Photo overlay on desktop */}
        <div className="pointer-events-none absolute right-0 top-0 hidden h-full w-[45%] overflow-hidden lg:block">
          <img
            src="/assets/login-orbix-man.jpg"
            alt="Murilo Vaz • Orbiex Founder"
            className="h-full w-full object-cover object-[center_30%] opacity-30 filter contrast-125"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#121216] via-[#121216]/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
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

          {/* Student Progress Bar */}
          <div className="mt-8 rounded-2xl border border-white/10 bg-black/60 p-4 backdrop-blur-md max-w-lg">
            <div className="flex items-center justify-between text-[12px]">
              <span className="font-bold text-white">Seu Progresso no Curso</span>
              <span className="font-extrabold text-[#d4af37]">{progressPercentage}% Concluído</span>
            </div>
            <div className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#d4af37] via-[#f5df93] to-[#aa7b1e] transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-[#70707a]">
              <span>{completedLessons.length} de {totalLessons} aulas concluídas</span>
              <span>{MODULES_DATA.length} Módulos Disponíveis</span>
            </div>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────
          FILTER TABS & SEARCH BAR
      ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'todos', label: 'Todos os Módulos' },
            { id: 'fundamentos', label: 'Fundamentos' },
            { id: 'produtos', label: 'Mineração & Produtos' },
            { id: 'criativos', label: 'Criativos & Hooks' },
            { id: 'escala', label: 'Escala & Blindagem' },
            { id: 'comunidade', label: 'Comunidade VIP' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`rounded-full px-4 py-2 text-[12px] font-bold transition-all ${
                activeCategory === cat.id
                  ? 'bg-white text-black shadow-[0_2px_15px_rgba(255,255,255,0.2)]'
                  : 'border border-white/10 bg-white/5 text-[#9a9aa3] hover:border-white/20 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative min-w-[240px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#60606b]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar aula ou tema..."
            className="w-full rounded-2xl border border-white/10 bg-[#121215] py-2 pl-9 pr-4 text-[12.5px] text-white placeholder-[#50505a] outline-none focus:border-white/30"
          />
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────
          MODULES GRID (CARDS DE ALTO IMPACTO)
      ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredModules.map((mod) => {
          const modCompletedCount = mod.lessons.filter((l) => completedLessons.includes(l.id)).length;
          const isFullyCompleted = modCompletedCount === mod.lessons.length && mod.lessons.length > 0;

          return (
            <div
              key={mod.id}
              onClick={() => handleOpenModule(mod)}
              className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-[#0e0e12] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.6)] transition-all hover:-translate-y-1.5 hover:border-white/25 hover:shadow-[0_16px_50px_rgba(0,0,0,0.9)] cursor-pointer"
            >
              {/* Thumbnail Container with Cover Image & Overlay */}
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-black">
                <img
                  src={mod.thumbnailUrl}
                  alt={mod.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-70 filter brightness-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

                {/* Module Number Tag */}
                <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-xl bg-black/70 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white backdrop-blur-md border border-white/10">
                  <span className="text-[#d4af37]">MÓDULO</span>
                  <span>{mod.number}</span>
                </div>

                {/* Status Badge */}
                {isFullyCompleted ? (
                  <div className="absolute right-3 top-3 flex items-center gap-1 rounded-xl bg-emerald-500/90 px-2.5 py-1 text-[10.5px] font-black uppercase tracking-wider text-black backdrop-blur-md">
                    <Check size={12} />
                    <span>Concluído</span>
                  </div>
                ) : (
                  <div className="absolute right-3 top-3 flex items-center gap-1 rounded-xl bg-black/70 px-2.5 py-1 text-[10.5px] font-bold text-white/80 backdrop-blur-md border border-white/10">
                    <BookOpen size={11} className="text-[#d4af37]" />
                    <span>{mod.lessons.length} aulas</span>
                  </div>
                )}

                {/* Play Button on Hover */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#d4af37] to-[#8c6d1f] shadow-[0_0_30px_rgba(212,175,55,0.7)]">
                    <Play size={22} className="translate-x-0.5 fill-black text-black" />
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="mt-4 flex flex-1 flex-col justify-between">
                <div>
                  <h3 className="text-[17px] font-extrabold text-white transition-colors group-hover:text-[#f5df93]">
                    {mod.title}
                  </h3>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#8a8a93] line-clamp-2">
                    {mod.subtitle}
                  </p>
                </div>

                {/* Card Footer / Progress Bar */}
                <div className="mt-5 border-t border-white/10 pt-4">
                  <div className="flex items-center justify-between text-[11px] text-[#70707a]">
                    <span>{modCompletedCount} de {mod.lessons.length} aulas concluídas</span>
                    <span className="font-bold text-white">{Math.round((modCompletedCount / mod.lessons.length) * 100)}%</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#d4af37] to-[#aa7b1e]"
                      style={{ width: `${(modCompletedCount / mod.lessons.length) * 100}%` }}
                    />
                  </div>

                  {/* Open Module Action */}
                  <div className="mt-3.5 flex items-center justify-between text-[12px] font-bold text-[#d4af37] group-hover:text-white transition">
                    <span>Acessar Aulas</span>
                    <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ────────────────────────────────────────────────────────────
          COMMUNITY & VIP NETWORKING BOTTOM BANNER
      ──────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-[#0c0c10] via-[#14141c] to-[#0c0c10] p-6 sm:p-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <MessageCircle size={28} />
            </div>
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-400">
                Suporte & Networking em Tempo Real
              </div>
              <h3 className="text-[18px] font-black text-white sm:text-[20px]">
                Participe da Comunidade Oficial no WhatsApp & Discord
              </h3>
              <p className="mt-1 text-[13px] text-[#8a8a93]">
                Tire dúvidas com os mentores, compartilhe resultados e receba alertas diários de produtos validados.
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <button
              type="button"
              onClick={() => handleOpenModule(MODULES_DATA[6])}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#aa7b1e] px-5 py-3 text-[12.5px] font-extrabold uppercase tracking-wider text-black transition hover:brightness-110 active:scale-95 shadow-[0_4px_20px_rgba(212,175,55,0.3)]"
            >
              <span>Entrar nos Grupos</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

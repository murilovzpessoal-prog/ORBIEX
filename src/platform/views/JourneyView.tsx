import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Lightbulb,
  CheckCircle2,
  Plus,
  DollarSign,
  TrendingUp,
  Zap,
  Check,
  Calendar,
  BarChart3,
  Award,
} from 'lucide-react';

interface MissionStep {
  id: number;
  title: string;
  description: string;
}

interface MissionTier {
  id: 'month' | 'week' | 'day';
  badge: string;
  badgeTone: 'silver' | 'emerald' | 'diamond';
  targetDailyRevenue: string;
  targetMonthlyRevenue: string;
  salesPerDay: string;
  focusTitle: string;
  tip: string;
  steps: MissionStep[];
  imageUrl: string;
}

const BANNER_BG_PRIMARY = '/assets/banner-jornada-novo.jpeg';
const BANNER_BG_ALT = 'https://i.imgur.com/c4bESBE.jpeg';

const MISSION_TIERS: MissionTier[] = [
  {
    id: 'month',
    badge: '1K POR MÊS',
    badgeTone: 'silver',
    targetDailyRevenue: 'R$ 33,33 / dia',
    targetMonthlyRevenue: 'R$ 1.000,00 / mês',
    salesPerDay: '1 a 2 pedidos/dia',
    focusTitle: 'Fase 1: Validação & Primeiro Produto Vencedor',
    tip: 'Não tente acertar um vídeo perfeito. Encontre um formato replicável, teste produtos todos os dias e, quando uma combinação vender, pare de procurar novidade e escale o que funcionou.',
    steps: [
      {
        id: 1,
        title: 'Domine o formato que mais converte',
        description: 'Assista ao módulo Estilo POV e escolha uma estrutura de vídeo para replicar.',
      },
      {
        id: 2,
        title: 'Escolha 3 produtos para atacar',
        description: 'Selecione 3 produtos validados, com potencial de venda, e concentre sua produção neles. Nada de testar 15 produtos ao mesmo tempo.',
      },
      {
        id: 3,
        title: 'Entre em modo de execução',
        description: 'Publique 3 vídeos por dia, utilizando os formatos ensinados, e registre diariamente seu resultado no painel.',
      },
      {
        id: 4,
        title: 'Identifique o vencedor e escale',
        description: 'Ao encontrar produto ou vídeo gerando vendas, assista ao módulo Escala e multiplique o que funcionou até alcançar R$1.000 no mês.',
      },
    ],
    imageUrl: 'https://i.imgur.com/Ewrl5P1.png',
  },
  {
    id: 'week',
    badge: '1K POR SEMANA',
    badgeTone: 'emerald',
    targetDailyRevenue: 'R$ 142,85 / dia',
    targetMonthlyRevenue: 'R$ 4.000,00 / mês',
    salesPerDay: '4 a 6 pedidos/dia',
    focusTitle: 'Fase 2: Consistência & Escala de Criativos',
    tip: 'Agora o foco é repetição inteligente. Identifique os produtos e formatos que já venderam, replique os padrões vencedores e aumente o volume.',
    steps: [
      {
        id: 1,
        title: 'Identifique o que já vendeu',
        description: 'Analise seus últimos vídeos e encontre os produtos, formatos e hooks que mais geraram vendas.',
      },
      {
        id: 2,
        title: 'Transforme acertos em padrão',
        description: 'Crie novas variações dos vídeos vencedores, mantendo produto, estrutura e abordagem que já funcionaram.',
      },
      {
        id: 3,
        title: 'Aumente o volume de conteúdo',
        description: 'Publique de 6 a 9 vídeos por dia, no mínimo, priorizando os produtos e formatos que já demonstraram potencial de venda.',
      },
      {
        id: 4,
        title: 'Escale até R$1K na semana',
        description: 'Assista ao módulo Escala, aumente a produção dos vencedores e acompanhe diariamente seus ganhos no painel.',
      },
    ],
    imageUrl: 'https://i.imgur.com/BX2AO1g.png',
  },
  {
    id: 'day',
    badge: '1K POR DIA',
    badgeTone: 'diamond',
    targetDailyRevenue: 'R$ 1.000,00 / dia',
    targetMonthlyRevenue: 'R$ 30.000,00 / mês',
    salesPerDay: '20 a 30 pedidos/dia',
    focusTitle: 'Fase 3: Dominação & Máquina de Vendas Contínua',
    tip: 'Escala vem de teste e repetição. Teste constantemente novos produtos e ambientes. Quando encontrar o que vende, pare de tratar como teste e multiplique o vencedor.',
    steps: [
      {
        id: 1,
        title: 'Teste produtos todos os dias',
        description: 'Aumente seu volume de testes e experimente diferentes produtos diariamente. Quanto mais testes, maiores as chances de encontrar novos vencedores.',
      },
      {
        id: 2,
        title: 'Teste produto + ambiente',
        description: 'Não teste apenas o produto. Varie cenários, ambientes e formas de apresentação para descobrir qual combinação gera mais vendas.',
      },
      {
        id: 3,
        title: 'Encontrou um vencedor? Replique',
        description: 'Quando um produto começar a vender, multiplique imediatamente o que funcionou, criando novas variações sem abandonar a estrutura vencedora.',
      },
      {
        id: 4,
        title: 'Entre em volume de escala',
        description: 'Publique de 12 a 26 vídeos por dia, no mínimo, concentrando a produção nos produtos que já estão vendendo e mantendo novos testes constantemente.',
      },
    ],
    imageUrl: 'https://i.imgur.com/O1rTGPJ.png',
  },
];

interface DayRecord {
  id: string;
  label: string; // 'D-6', 'D-5', ..., 'HOJE'
  sublabel: string; // e.g., '05/11'
  amount: number;
}

interface WeekRecord {
  id: string;
  label: string; // 'Semana 1', 'Semana 2', 'Semana 3', 'Esta Semana'
  sublabel: string;
  amount: number;
}

export function JourneyView({ onUse: _onUse }: { onUse?: (text: string) => void } = {}) {
  // Screen mode: 'selection' (3 mission cards) | 'execution' (detailed dashboard)
  const [screenMode, setScreenMode] = useState<'selection' | 'execution'>('selection');

  // Active tier
  const [activeTierId, setActiveTierId] = useState<'month' | 'week' | 'day'>(() => {
    try {
      const saved = localStorage.getItem('orbiex_active_mission') || localStorage.getItem('orbix_active_mission');
      return (saved as any) || 'month';
    } catch {
      return 'month';
    }
  });

  // Chart view mode: 'daily' | 'weekly'
  const [chartMode, setChartMode] = useState<'daily' | 'weekly'>('daily');

  // Daily Checklist items completed for today
  const [completedSteps, setCompletedSteps] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('orbiex_daily_checklist_v3') || localStorage.getItem('orbix_daily_checklist_v3');
      return saved ? JSON.parse(saved) : [1];
    } catch {
      return [1];
    }
  });

  const toggleStep = (stepId: number) => {
    setCompletedSteps((prev) => {
      const next = prev.includes(stepId) ? prev.filter((id) => id !== stepId) : [...prev, stepId];
      try {
        localStorage.setItem('orbix_daily_checklist_v3', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Daily data (last 7 days)
  const [dailyData, setDailyData] = useState<DayRecord[]>(() => {
    try {
      const saved = localStorage.getItem('orbiex_chart_daily_v3') || localStorage.getItem('orbix_chart_daily_v3');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      { id: 'd-6', label: 'D-6', sublabel: '05/11', amount: 480 },
      { id: 'd-5', label: 'D-5', sublabel: '06/11', amount: 650 },
      { id: 'd-4', label: 'D-4', sublabel: '07/11', amount: 920 },
      { id: 'd-3', label: 'D-3', sublabel: '08/11', amount: 1100 },
      { id: 'd-2', label: 'D-2', sublabel: '09/11', amount: 1450 },
      { id: 'd-1', label: 'D-1', sublabel: '10/11', amount: 1850 },
      { id: 'today', label: 'HOJE', sublabel: 'Hoje', amount: 2650 },
    ];
  });

  // Weekly data (last 4 weeks)
  const [weeklyData, setWeeklyData] = useState<WeekRecord[]>(() => {
    try {
      const saved = localStorage.getItem('orbiex_chart_weekly_v3') || localStorage.getItem('orbix_chart_weekly_v3');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      { id: 'w-1', label: 'Sem 1', sublabel: 'Out 14 - 20', amount: 4850 },
      { id: 'w-2', label: 'Sem 2', sublabel: 'Out 21 - 27', amount: 6920 },
      { id: 'w-3', label: 'Sem 3', sublabel: 'Out 28 - 03', amount: 8400 },
      { id: 'w-cur', label: 'Sem Atual', sublabel: 'Esta Semana', amount: 9100 },
    ];
  });

  // Input value for registering revenue
  const [inputVal, setInputVal] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Active mission data
  const activeTier = useMemo(() => {
    return MISSION_TIERS.find((t) => t.id === activeTierId) || MISSION_TIERS[0];
  }, [activeTierId]);

  // Color theme tailored for each mission tier matching user's screenshots
  const tierTheme = useMemo(() => {
    if (activeTier.badgeTone === 'emerald') {
      return {
        badgeText: 'text-[#22c55e]',
        badgeBg: 'bg-[#22c55e]/15',
        badgeBorder: 'border-[#22c55e]/40',
        dotBg: 'bg-[#22c55e]',
        btnAction: 'bg-[#22c55e] text-black hover:bg-[#16a34a] hover:shadow-[0_4px_20px_rgba(34,197,94,0.4)]',
        cardBorderGlow: 'border-[#22c55e]/30',
        iconBg: 'bg-[#22c55e]/15 text-[#22c55e]',
        barGradient: 'bg-gradient-to-t from-[#15803d] via-[#22c55e] to-white shadow-[0_0_24px_rgba(34,197,94,0.5)]',
        checkBg: 'border-[#22c55e] bg-[#22c55e] text-black shadow-[0_0_12px_rgba(34,197,94,0.5)]',
        quickBtn: 'border-[#22c55e]/30 bg-[#22c55e]/10 text-[#22c55e] hover:bg-[#22c55e]/20',
        badgeGlow: 'text-[#22c55e]',
      };
    }
    if (activeTier.badgeTone === 'diamond') {
      return {
        badgeText: 'text-[#d946ef]',
        badgeBg: 'bg-[#d946ef]/15',
        badgeBorder: 'border-[#d946ef]/40',
        dotBg: 'bg-[#d946ef]',
        btnAction: 'bg-[#d946ef] text-white hover:bg-[#c026d3] hover:shadow-[0_4px_20px_rgba(217,70,239,0.4)]',
        cardBorderGlow: 'border-[#d946ef]/30',
        iconBg: 'bg-[#d946ef]/15 text-[#d946ef]',
        barGradient: 'bg-gradient-to-t from-[#a21caf] via-[#d946ef] to-white shadow-[0_0_24px_rgba(217,70,239,0.5)]',
        checkBg: 'border-[#d946ef] bg-[#d946ef] text-white shadow-[0_0_12px_rgba(217,70,239,0.5)]',
        quickBtn: 'border-[#d946ef]/30 bg-[#d946ef]/10 text-[#d946ef] hover:bg-[#d946ef]/20',
        badgeGlow: 'text-[#d946ef]',
      };
    }
    return {
      badgeText: 'text-[var(--mvz-gold-light)]',
      badgeBg: 'bg-[var(--mvz-gold)]/15',
      badgeBorder: 'border-[var(--mvz-gold)]/40',
      dotBg: 'bg-[var(--mvz-gold)]',
      btnAction: 'bg-white text-black hover:bg-[var(--mvz-gold-light)] hover:shadow-[0_4px_20px_rgba(255,255,255,0.3)]',
      cardBorderGlow: 'border-[var(--mvz-gold)]/25',
      iconBg: 'bg-[var(--mvz-gold)]/15 text-[var(--mvz-gold)]',
      barGradient: 'bg-gradient-to-t from-[var(--mvz-gold)] via-[var(--mvz-gold-light)] to-white shadow-[0_0_25px_rgba(212,175,55,0.6)]',
      checkBg: 'border-[var(--mvz-gold)] bg-[var(--mvz-gold)] text-black shadow-[0_0_12px_rgba(212,175,55,0.5)]',
      quickBtn: 'border-[var(--mvz-gold)]/30 bg-[var(--mvz-gold)]/10 text-[var(--mvz-gold-light)] hover:bg-[var(--mvz-gold)]/20',
      badgeGlow: 'text-[var(--mvz-gold-light)]',
    };
  }, [activeTier]);

  // Total 30 days calculation
  const totalLast30Days = useMemo(() => {
    const dailySum = dailyData.reduce((acc, curr) => acc + curr.amount, 0);
    // Baseline simulated monthly past balance
    const baseBalance = 3200;
    return baseBalance + dailySum;
  }, [dailyData]);

  // Max value for Daily scaling
  const maxDailyValue = useMemo(() => {
    const highest = Math.max(...dailyData.map((d) => d.amount), 500);
    return Math.ceil(highest * 1.15);
  }, [dailyData]);

  // Max value for Weekly scaling
  const maxWeeklyValue = useMemo(() => {
    const highest = Math.max(...weeklyData.map((w) => w.amount), 1000);
    return Math.ceil(highest * 1.15);
  }, [weeklyData]);

  // Parse numeric input from currency or plain string
  const parseInputValue = (val: string): number => {
    if (!val) return 0;
    // Remove "R$", spaces, replace dots with nothing (if used as thousand separator) and comma with dot
    let cleaned = val.replace(/[^\d,.]/g, '').trim();
    if (cleaned.includes(',') && cleaned.includes('.')) {
      // 3.000,00 -> 3000.00
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else if (cleaned.includes(',')) {
      // 3000,00 -> 3000.00
      cleaned = cleaned.replace(',', '.');
    }
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  // Register earnings
  const handleRegisterRevenue = (customAmount?: number) => {
    const amountToAdd = customAmount !== undefined ? customAmount : parseInputValue(inputVal);
    if (amountToAdd <= 0) return;

    // 1. Update Daily data (HOJE)
    const updatedDaily = dailyData.map((item) => {
      if (item.id === 'today') {
        return { ...item, amount: item.amount + amountToAdd };
      }
      return item;
    });
    setDailyData(updatedDaily);

    // 2. Update Weekly data (Sem Atual)
    const updatedWeekly = weeklyData.map((item) => {
      if (item.id === 'w-cur') {
        return { ...item, amount: item.amount + amountToAdd };
      }
      return item;
    });
    setWeeklyData(updatedWeekly);

    // 3. Mark step 4 (Registrar ganhos) as completed in the checklist automatically!
    if (!completedSteps.includes(4)) {
      setCompletedSteps((prev) => {
        const next = [...prev, 4];
        try {
          localStorage.setItem('orbix_daily_checklist_v3', JSON.stringify(next));
        } catch {}
        return next;
      });
    }

    // Persist
    try {
      localStorage.setItem('orbix_chart_daily_v3', JSON.stringify(updatedDaily));
      localStorage.setItem('orbix_chart_weekly_v3', JSON.stringify(updatedWeekly));
    } catch {}

    setInputVal('');
    setFeedbackMsg(`+ ${formatCurrency(amountToAdd)} registrado com sucesso no gráfico!`);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleActivateMission = (tier: MissionTier, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveTierId(tier.id);
    try {
      localStorage.setItem('orbix_active_mission', tier.id);
    } catch {}
    setScreenMode('execution');
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(val);
  };

  const formatShortCurrency = (val: number) => {
    if (val >= 1000) {
      return `R$ ${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k`;
    }
    return `R$ ${val}`;
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [screenMode]);

  /* ══════════════════════════════════════════════════════════════════
     TELA 2: EXECUÇÃO DETALHADA (DIRETO AO PONTO, SEM O QUADRADINHO FEIO)
  ══════════════════════════════════════════════════════════════════ */
  if (screenMode === 'execution') {
    const checklistProgress = Math.round((completedSteps.length / activeTier.steps.length) * 100);

    return (
      <div className="mvz-fade-up pb-24 space-y-6 max-w-7xl mx-auto">
        {/* ── 1. Top Navigation: Voltar para Escolha de Metas ── */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setScreenMode('selection')}
            className="group inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-[12px] font-bold text-white/80 transition-all duration-200 hover:border-[var(--mvz-gold)]/60 hover:bg-white/[0.07] hover:text-[var(--mvz-gold-light)]"
          >
            <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-1 text-[var(--mvz-gold)]" />
            <span>Voltar para Escolha de Metas</span>
          </button>

          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--mvz-gold)]/30 bg-[var(--mvz-gold)]/10 px-3.5 py-1 text-[11px] font-semibold text-[var(--mvz-gold-light)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--mvz-gold)] animate-ping" />
            Operação em Tempo Real
          </div>
        </div>

        {/* ── 2. Mission Header: APENAS "MISSÃO ATIVA" + TÍTULO DA META (SEM O QUADRADINHO FEIO!) ── */}
        <div className="pt-2 pb-1">
          <div className="flex flex-col space-y-1">
            <div className="inline-flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full border ${tierTheme.badgeBorder} ${tierTheme.badgeBg} px-3 py-1 text-[10.5px] font-extrabold uppercase tracking-[0.22em] ${tierTheme.badgeText} shadow-sm`}>
                <span className={`h-1.5 w-1.5 rounded-full ${tierTheme.dotBg} animate-pulse`} />
                MISSÃO ATIVA
              </span>
            </div>

            <h1 className="text-[34px] sm:text-[44px] font-black uppercase tracking-tight text-white leading-none">
              {activeTier.badge}
            </h1>
          </div>
        </div>

        {/* ── 3. Grid Principal ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          {/* ══════════════════════════════════════════════════════════════
              COLUNA ESQUERDA (5 Colunas): Dica da Missão + Mapa de Execução
          ══════════════════════════════════════════════════════════════ */}
          <div className="space-y-6 lg:col-span-5">
            {/* ── Card: Dica da Missão ── */}
            <div className={`relative overflow-hidden rounded-[24px] border ${tierTheme.cardBorderGlow} bg-[#0d0c0a] p-6 sm:p-7 shadow-[0_16px_45px_rgba(0,0,0,0.85)]`}>
              {/* Marca d'água de lâmpada sutil ao fundo */}
              <Lightbulb
                size={130}
                className="pointer-events-none absolute -right-6 -bottom-6 text-white/[0.025] stroke-1"
              />

              {/* Cabeçalho */}
              <div className="relative z-10 flex items-center gap-2.5">
                <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${tierTheme.iconBg}`}>
                  <Lightbulb size={15} />
                </div>
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-white/90">
                  DICA DA MISSÃO
                </h3>
              </div>

              {/* Texto explicativo */}
              <p className="relative z-10 mt-4 text-[13px] sm:text-[13.5px] leading-relaxed text-white/80">
                {activeTier.tip}
              </p>
            </div>

            {/* ── Card: Mapa de Execução ── */}
            <div className="relative rounded-[24px] border border-white/10 bg-[#0d0c0a] p-6 sm:p-7 shadow-[0_16px_45px_rgba(0,0,0,0.85)]">
              {/* Cabeçalho com Barra de Progresso */}
              <div className="pb-5 border-b border-white/[0.08]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${tierTheme.iconBg}`}>
                      <CheckCircle2 size={16} />
                    </div>
                    <div>
                      <h3 className="text-[14.5px] font-black tracking-tight text-white">
                        Mapa de Execução
                      </h3>
                      <p className="text-[11px] text-white/50 font-medium">
                        Marque suas ações para garantir a meta diária
                      </p>
                    </div>
                  </div>

                  <span className={`rounded-full border ${tierTheme.badgeBorder} ${tierTheme.badgeBg} px-2.5 py-0.5 text-[10.5px] font-bold ${tierTheme.badgeText}`}>
                    {completedSteps.length} de {activeTier.steps.length}
                  </span>
                </div>

                {/* Barra de Progresso do Dia */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-[10.5px] font-bold text-white/60 mb-1.5">
                    <span>Progresso de Hoje</span>
                    <span className={tierTheme.badgeText}>{checklistProgress}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      style={{ width: `${checklistProgress}%` }}
                      className="h-full rounded-full bg-gradient-to-r from-[var(--mvz-gold)] via-[var(--mvz-gold-light)] to-white transition-all duration-500 shadow-[0_0_12px_rgba(212,175,55,0.4)]"
                    />
                  </div>
                </div>
              </div>

              {/* Lista dos Passos do Mapa de Execução */}
              <div className="relative mt-6 space-y-3.5">
                {activeTier.steps.map((step) => {
                  const isDone = completedSteps.includes(step.id);

                  return (
                    <div
                      key={step.id}
                      onClick={() => toggleStep(step.id)}
                      className={`group relative flex cursor-pointer items-start gap-3.5 rounded-xl border p-3 transition-all duration-200 ${
                        isDone
                          ? 'border-white/15 bg-white/[0.03]'
                          : 'border-white/[0.06] bg-black/40 hover:border-white/20 hover:bg-white/[0.02]'
                      }`}
                    >
                      {/* Checkbox circular interativo */}
                      <button
                        type="button"
                        className={`relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-extrabold transition-all duration-200 ${
                          isDone
                            ? tierTheme.checkBg
                            : 'border border-white/20 bg-white/[0.04] text-white/60 group-hover:border-white/50 group-hover:text-white'
                        }`}
                      >
                        {isDone ? <Check size={14} strokeWidth={3} /> : step.id}
                      </button>

                      {/* Texto do Passo */}
                      <div className="flex-1">
                        <h4
                          className={`text-[13px] font-bold leading-snug transition-colors duration-200 ${
                            isDone ? 'text-white/95 line-through decoration-white/40' : 'text-white'
                          }`}
                        >
                          {step.title}
                        </h4>
                        <p className="mt-1 text-[11.5px] leading-relaxed text-white/55">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Status de Conclusão se 100% */}
              {checklistProgress === 100 && (
                <div className={`mt-5 flex items-center gap-2.5 rounded-xl border ${tierTheme.badgeBorder} ${tierTheme.badgeBg} p-3 text-[11.5px] font-bold ${tierTheme.badgeText} animate-fade-in`}>
                  <Award size={16} />
                  <span>Parabéns! Todas as etapas de execução de hoje foram cumpridas.</span>
                </div>
              )}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              COLUNA DIREITA (7 Colunas): Registro + Total + Gráfico Funcional
          ══════════════════════════════════════════════════════════════ */}
          <div className="space-y-6 lg:col-span-7">
            {/* ── Topo: 2 Cards (Registrar Ganhos Hoje + Total Últimos 30 Dias) ── */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {/* Card 1: REGISTRAR GANHOS HOJE */}
              <div className="relative rounded-[24px] border border-white/10 bg-[#0d0c0a] p-5 sm:p-6 shadow-[0_16px_45px_rgba(0,0,0,0.85)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/60">
                      REGISTRAR GANHOS HOJE
                    </span>
                    <span className={`text-[10px] font-bold ${tierTheme.badgeText}`}>
                      Alimenta o Gráfico
                    </span>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleRegisterRevenue();
                    }}
                    className="mt-3.5 flex items-center gap-2"
                  >
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={inputVal}
                        onChange={(e) => setInputVal(e.target.value)}
                        placeholder="Ex: R$ 3.000,00"
                        className="h-12 w-full rounded-xl border border-white/15 bg-black/60 px-4 text-[15px] font-extrabold text-white placeholder-white/30 transition-all focus:border-[var(--mvz-gold)] focus:bg-black focus:outline-none focus:ring-1 focus:ring-[var(--mvz-gold)]"
                      />
                    </div>

                    <button
                      type="submit"
                      title="Adicionar ganho de hoje"
                      className={`group flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-black transition-all duration-200 hover:scale-105 active:scale-95 ${tierTheme.btnAction}`}
                    >
                      <Plus size={20} strokeWidth={2.8} className="transition-transform group-hover:rotate-90" />
                    </button>
                  </form>

                  {/* Atalhos Rápidos para Testar ou Registrar */}
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-[9.5px] font-bold uppercase tracking-wider text-white/40">Rápido:</span>
                    <button
                      type="button"
                      onClick={() => handleRegisterRevenue(500)}
                      className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] font-bold text-white/70 hover:border-white/30 hover:text-white transition"
                    >
                      + R$ 500
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRegisterRevenue(1000)}
                      className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] font-bold text-white/70 hover:border-white/30 hover:text-white transition"
                    >
                      + R$ 1.000
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRegisterRevenue(3000)}
                      className={`rounded-lg border px-2 py-1 text-[10px] font-bold transition ${tierTheme.quickBtn}`}
                    >
                      + R$ 3.000
                    </button>
                  </div>
                </div>

                {feedbackMsg && (
                  <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-[#22c55e] animate-fade-in">
                    <Check size={13} strokeWidth={3} />
                    <span>{feedbackMsg}</span>
                  </div>
                )}
              </div>

              {/* Card 2: TOTAL ÚLTIMOS 30 DIAS */}
              <div className="relative overflow-hidden rounded-[24px] border border-[var(--mvz-gold)]/20 bg-gradient-to-b from-[#13110d] to-[#0a0907] p-5 sm:p-6 shadow-[0_16px_45px_rgba(0,0,0,0.85)] flex flex-col justify-between">
                <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[var(--mvz-gold)]/10 blur-2xl" />

                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/60">
                      TOTAL ÚLTIMOS 30 DIAS
                    </span>
                    <div className="mt-2 text-[26px] sm:text-[30px] font-black tracking-tight text-white">
                      {formatCurrency(totalLast30Days)}
                    </div>
                  </div>

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/80 shadow-inner">
                    <DollarSign size={20} strokeWidth={2.4} />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between pt-3 border-t border-white/[0.06] text-[11px] text-white/60">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[var(--mvz-gold-light)] font-bold">Meta:</span>
                    <span>{activeTier.targetMonthlyRevenue}</span>
                  </div>
                  <span className="text-[#22c55e] font-bold">● Ativa</span>
                </div>
              </div>
            </div>

            {/* ── Card: Evolução Funcional (Alternância DIA e SEMANA) ── */}
            <div className="relative rounded-[24px] border border-white/10 bg-[#0d0c0a] p-6 sm:p-7 shadow-[0_16px_45px_rgba(0,0,0,0.85)]">
              {/* Topo do Gráfico: Título + Seletor de Período [ Por Dia ] / [ Por Semana ] */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <BarChart3 size={18} className="text-[var(--mvz-gold)]" />
                    <h3 className="text-[17px] font-bold text-white tracking-tight">
                      Evolução Financeira
                    </h3>
                  </div>
                  <p className="mt-0.5 text-[11.5px] font-medium text-white/50">
                    {chartMode === 'daily'
                      ? 'Últimos 7 dias registrados — atualizado em tempo real'
                      : 'Últimas 4 semanas consolidadas'}
                  </p>
                </div>

                {/* Seletor Por Dia / Por Semana */}
                <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-black/60 p-1">
                  <button
                    type="button"
                    onClick={() => setChartMode('daily')}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider transition-all duration-200 ${
                      chartMode === 'daily'
                        ? 'bg-[var(--mvz-gold)] text-black shadow-[0_0_12px_rgba(212,175,55,0.4)]'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    <Calendar size={12} />
                    <span>Por Dia</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setChartMode('weekly')}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider transition-all duration-200 ${
                      chartMode === 'weekly'
                        ? 'bg-[var(--mvz-gold)] text-black shadow-[0_0_12px_rgba(212,175,55,0.4)]'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    <TrendingUp size={12} />
                    <span>Por Semana</span>
                  </button>
                </div>
              </div>

              {/* Badge Informativo do Topo */}
              <div className="mt-4 flex items-center justify-between border-b border-white/[0.06] pb-3 text-[11px]">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-0.5 font-bold text-white/80">
                  <TrendingUp size={12} className="text-[#22c55e]" />
                  <span>+12% vs período anterior</span>
                </div>

                <div className="text-white/50 font-medium text-[11px]">
                  Teto do Gráfico:{' '}
                  <strong className="text-white">
                    {formatCurrency(chartMode === 'daily' ? maxDailyValue : maxWeeklyValue)}
                  </strong>
                </div>
              </div>

              {/* ── ÁREA DO GRÁFICO (ALTURA TOTAL EXPLÍCITA GARANTIDA: 240px) ── */}
              <div className="relative mt-6 h-[240px] w-full flex flex-col justify-end">
                {/* Linhas de Grade de Fundo com Valores */}
                <div className="pointer-events-none absolute inset-0 flex flex-col justify-between opacity-30">
                  <div className="border-b border-dashed border-white/20 w-full" />
                  <div className="border-b border-dashed border-white/15 w-full" />
                  <div className="border-b border-white/10 w-full" />
                </div>

                {/* ── MODO 1: GRÁFICO POR DIA (7 DIAS) ── */}
                {chartMode === 'daily' && (
                  <div className="relative z-10 grid grid-cols-7 gap-2 sm:gap-4 h-[210px] items-end w-full">
                    {dailyData.map((d) => {
                      const isToday = d.id === 'today';
                      // Percentage of height inside 180px
                      const heightPercent = Math.max(8, Math.min(100, Math.round((d.amount / maxDailyValue) * 100)));

                      return (
                        <div
                          key={d.id}
                          className="group/bar relative flex flex-col items-center justify-end h-full"
                        >
                          {/* Tooltip com valor em destaque */}
                          <div className="pointer-events-none absolute -top-8 z-30 opacity-0 group-hover/bar:opacity-100 transition-opacity rounded-md border border-[var(--mvz-gold)]/40 bg-black/95 px-2 py-1 text-[10px] font-black text-[var(--mvz-gold-light)] shadow-xl whitespace-nowrap">
                            {formatCurrency(d.amount)}
                          </div>

                          {/* Tag de Valor Fixo acima da barra do dia atual */}
                          {isToday && (
                            <span className={`mb-1 text-[10px] font-extrabold ${tierTheme.badgeText} drop-shadow`}>
                              {formatShortCurrency(d.amount)}
                            </span>
                          )}

                          {/* Container da Barra com altura fixa para o CSS percentual calcular 100% perfeitamente */}
                          <div className="relative w-full max-w-[48px] h-[160px] flex items-end justify-center rounded-xl bg-white/[0.03] p-1 border border-white/[0.04]">
                            <div
                              style={{ height: `${heightPercent}%` }}
                              className={`w-full rounded-lg transition-all duration-700 ease-out ${
                                isToday
                                  ? `${tierTheme.barGradient} brightness-110`
                                  : 'bg-[#1c1a16] border border-white/[0.1] hover:border-white/30 hover:bg-[#2a2620]'
                              }`}
                            />
                          </div>

                          {/* Rótulo do Dia (D-6, D-5, ..., HOJE) */}
                          <span
                            className={`mt-2.5 text-[10.5px] font-black uppercase tracking-wider ${
                              isToday ? tierTheme.badgeText : 'text-white/45'
                            }`}
                          >
                            {d.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ── MODO 2: GRÁFICO POR SEMANA (4 SEMANAS) ── */}
                {chartMode === 'weekly' && (
                  <div className="relative z-10 grid grid-cols-4 gap-4 sm:gap-8 h-[210px] items-end w-full">
                    {weeklyData.map((w) => {
                      const isCurrentWeek = w.id === 'w-cur';
                      const heightPercent = Math.max(8, Math.min(100, Math.round((w.amount / maxWeeklyValue) * 100)));

                      return (
                        <div
                          key={w.id}
                          className="group/bar relative flex flex-col items-center justify-end h-full"
                        >
                          {/* Tooltip com valor em destaque */}
                          <div className="pointer-events-none absolute -top-8 z-30 opacity-0 group-hover/bar:opacity-100 transition-opacity rounded-md border border-white/20 bg-black/95 px-2 py-1 text-[10px] font-black text-white shadow-xl whitespace-nowrap">
                            {formatCurrency(w.amount)}
                          </div>

                          {/* Tag de Valor Fixo na Semana Atual */}
                          {isCurrentWeek && (
                            <span className={`mb-1 text-[10.5px] font-extrabold ${tierTheme.badgeText} drop-shadow`}>
                              {formatShortCurrency(w.amount)}
                            </span>
                          )}

                          {/* Container da Barra */}
                          <div className="relative w-full max-w-[64px] h-[160px] flex items-end justify-center rounded-xl bg-white/[0.03] p-1.5 border border-white/[0.04]">
                            <div
                              style={{ height: `${heightPercent}%` }}
                              className={`w-full rounded-lg transition-all duration-700 ease-out ${
                                isCurrentWeek
                                  ? `${tierTheme.barGradient} brightness-110`
                                  : 'bg-[#1c1a16] border border-white/[0.1] hover:border-white/30 hover:bg-[#2a2620]'
                              }`}
                            />
                          </div>

                          {/* Rótulo da Semana */}
                          <span
                            className={`mt-2.5 text-[11px] font-black uppercase tracking-wider ${
                              isCurrentWeek ? tierTheme.badgeText : 'text-white/50'
                            }`}
                          >
                            {w.label}
                          </span>
                          <span className="text-[9px] text-white/35 font-medium">{w.sublabel}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Rodapé Informativo */}
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-white/[0.06] pt-3.5 text-[11px] text-white/50">
                <div>
                  Faturamento acumulado:{' '}
                  <strong className="text-white font-bold">
                    {formatCurrency(
                      chartMode === 'daily'
                        ? dailyData.reduce((a, b) => a + b.amount, 0)
                        : weeklyData.reduce((a, b) => a + b.amount, 0)
                    )}
                  </strong>
                </div>

                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[var(--mvz-gold)]" />
                    <span className="text-[var(--mvz-gold-light)] font-semibold">
                      {chartMode === 'daily' ? 'Hoje em destaque' : 'Semana atual em destaque'}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════════
     TELA 1: ESCOLHA DE METAS (3 CARDS COM IMAGENS DAS PATENTES)
  ══════════════════════════════════════════════════════════════════ */
  return (
    <div className="mvz-fade-up pb-16">
      {/* ────────────────────────────────────────────────────────────
          1. HERO BANNER: "DEFINA A META. ACERTE O ALVO." (MAIS ENCORPADO / MAIS GORDO)
      ──────────────────────────────────────────────────────────── */}
      <div className="relative mb-8 min-h-[360px] sm:min-h-[390px] lg:min-h-[420px] overflow-hidden rounded-[28px] border border-[rgba(212,175,55,0.25)] bg-[#070605] shadow-[0_24px_70px_rgba(0,0,0,0.9)]">
        <img
          src={BANNER_BG_PRIMARY}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = BANNER_BG_ALT;
          }}
          alt="Defina a Meta. Acerte o Alvo."
          className="absolute inset-0 h-full w-full object-cover object-right select-none pointer-events-none"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent sm:via-black/35" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="pointer-events-none absolute -right-10 -top-20 h-96 w-96 rounded-full bg-[radial-gradient(circle,_rgba(212,175,55,0.18)_0%,_transparent_70%)] blur-3xl" />

        <div className="relative z-10 flex min-h-[360px] sm:min-h-[390px] lg:min-h-[420px] flex-col justify-center p-8 sm:p-12 lg:p-16 max-w-2xl">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-black/60 px-4 py-1.5 backdrop-blur-md">
            <span className="text-[10.5px] font-extrabold uppercase tracking-[0.2em] text-white/90">
              Plano de Ação
            </span>
          </div>

          <h1 className="mt-5 text-[32px] font-black tracking-tight text-white sm:text-[44px] lg:text-[50px] leading-[1.06]">
            DEFINA A META <br />
            <span className="mvz-grad-text drop-shadow-[0_2px_18px_rgba(212,175,55,0.4)]">
              ACERTE O ALVO
            </span>
          </h1>

          <p className="mt-4 max-w-xl text-[14px] leading-relaxed text-white/85 sm:text-[15px]">
            A estratégia é o seu arco. A execução é a sua flecha. Escolha o seu próximo destino abaixo
            e destrave o mapa tático para chegar lá.
          </p>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────
          2. CARDS DAS 3 MISSÕES: 1K POR MÊS, 1K POR SEMANA, 1K POR DIA (TAMANHO MAIS COMPACTO E PROPORCIONAL)
      ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {MISSION_TIERS.map((tier) => {
          const isActive = activeTierId === tier.id;

          const theme =
            tier.badgeTone === 'silver'
              ? {
                  badgeColor: 'text-[#e2e8f0]',
                  borderCard: isActive
                    ? 'border-white/40 shadow-[0_0_35px_rgba(255,255,255,0.15)] ring-1 ring-white/30'
                    : 'border-white/[0.12] hover:border-white/35',
                  buttonStyle: isActive
                    ? 'border-white/40 bg-white/15 text-white shadow-[0_0_20px_rgba(255,255,255,0.2)]'
                    : 'border-white/20 bg-white/[0.06] text-white/85 hover:border-white/40 hover:bg-white/[0.12] hover:text-white',
                  iconColor: 'text-white',
                }
              : tier.badgeTone === 'emerald'
              ? {
                  badgeColor: 'text-[#22c55e]',
                  borderCard: isActive
                    ? 'border-[#22c55e]/60 shadow-[0_0_40px_rgba(34,197,94,0.25)] ring-1 ring-[#22c55e]/40'
                    : 'border-[#22c55e]/30 hover:border-[#22c55e]/55',
                  buttonStyle: isActive
                    ? 'border-[#22c55e]/60 bg-[#22c55e]/20 text-[#22c55e] shadow-[0_0_20px_rgba(34,197,94,0.3)]'
                    : 'border-[#22c55e]/30 bg-[#22c55e]/[0.06] text-[#22c55e]/85 hover:border-[#22c55e]/60 hover:bg-[#22c55e]/15 hover:text-[#22c55e]',
                  iconColor: 'text-[#22c55e]',
                }
              : {
                  badgeColor: 'text-[#d946ef]',
                  borderCard: isActive
                    ? 'border-[#d946ef]/60 shadow-[0_0_45px_rgba(217,70,239,0.3)] ring-1 ring-[#d946ef]/40'
                    : 'border-[#d946ef]/30 hover:border-[#d946ef]/55',
                  buttonStyle: isActive
                    ? 'border-[#d946ef]/60 bg-[#d946ef]/20 text-[#d946ef] shadow-[0_0_20px_rgba(217,70,239,0.3)]'
                    : 'border-[#d946ef]/30 bg-[#d946ef]/[0.06] text-[#d946ef]/85 hover:border-[#d946ef]/60 hover:bg-[#d946ef]/15 hover:text-[#d946ef]',
                  iconColor: 'text-[#d946ef]',
                };

          return (
            <div
              key={tier.id}
              onClick={() => handleActivateMission(tier)}
              className={`group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-[26px] border h-[420px] sm:h-[450px] bg-black shadow-[0_20px_55px_rgba(0,0,0,0.95)] transition-all duration-300 hover:-translate-y-1.5 ${theme.borderCard}`}
            >
              <img
                src={tier.imageUrl}
                alt={`Insígnia ${tier.badge}`}
                className="absolute inset-0 h-full w-full object-cover object-center select-none pointer-events-none scale-100 transition-transform duration-700 ease-out group-hover:scale-105"
                loading="lazy"
              />

              <div className="relative z-10 pt-6 sm:pt-7 text-center select-none">
                <span
                  className={`text-[12px] font-extrabold uppercase tracking-[0.25em] drop-shadow-md ${theme.badgeColor}`}
                >
                  {tier.badge}
                </span>
              </div>

              <div className="relative z-0 flex-1" />

              <div className="relative z-10 p-6 pt-0">
                <button
                  onClick={(e) => handleActivateMission(tier, e)}
                  className={`flex h-11 w-full items-center justify-center gap-2 rounded-xl border text-[11.5px] font-bold uppercase tracking-[0.2em] backdrop-blur-md transition-all duration-200 ${theme.buttonStyle}`}
                >
                  <Zap size={13} className={isActive ? 'fill-current' : theme.iconColor} />
                  <span>{isActive ? 'MISSÃO ATIVA' : 'ATIVAR MISSÃO'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

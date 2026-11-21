import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  RotateCcw,
  Cloud,
  RefreshCw,
  Flame,
  ArrowUpRight,
  Loader2,
} from 'lucide-react';
import type { ViewId } from '../data';
import { supabase } from '../../lib/supabaseClient';
import { aiGenerateJSON, addGenMemory, getGenMemory } from '../aiGenerate';

export type TierId = 'month' | 'week' | 'day';

interface MissionStep {
  id: number;
  title: string;
  description: string;
  toolView?: ViewId;
  toolLabel?: string;
}

interface DailyMissionPack {
  dateKey: string;
  tip: string;
  steps: MissionStep[];
  aiGenerated?: boolean;
}

interface TierConfig {
  id: TierId;
  badge: string;
  subtitle: string;
  badgeTone: 'silver' | 'emerald' | 'diamond';
  dailyGoalNum: number;
  periodGoalNum: number;
  periodLabel: string;
  targetDailyRevenue: string;
  targetMonthlyRevenue: string;
  salesPerDay: string;
  videosPerDay: string;
  accountsSetup: string;
  quickAmounts: [number, number, number];
  defaultChartDailyMax: number;
  defaultChartWeeklyMax: number;
  focusTitle: string;
  cardSummary: string;
  imageUrl: string;
}

interface PlanProgressData {
  revenueByDate: Record<string, number>;
  completedByDate: Record<string, number[]>;
  dailyMissionsByDate: Record<string, DailyMissionPack>;
}

type PlansDataMap = Record<TierId, PlanProgressData>;

interface PersistedJourneyPayload {
  activeTier: TierId;
  plansData: Partial<PlansDataMap>;
  updatedAt: string;
}

const BANNER_BG_PRIMARY = '/assets/banner-jornada-novo.jpeg';
const BANNER_BG_ALT = 'https://i.imgur.com/MIWLyef.jpeg';

/* ══════════════════════════════════════════════════════════════════════
   CONFIGURAÇÃO 100% DISTINTA DE CADA PLANO (1K/MÊS vs 1K/SEMANA vs 1K/DIA)
══════════════════════════════════════════════════════════════════════ */
const MISSION_TIERS: TierConfig[] = [
  {
    id: 'month',
    badge: '1K POR MÊS',
    subtitle: 'Plano de Destrave & Validação Inicial',
    badgeTone: 'silver',
    dailyGoalNum: 33.34,
    periodGoalNum: 1000,
    periodLabel: 'Meta de 30 Dias',
    targetDailyRevenue: 'R$ 33,33 / dia',
    targetMonthlyRevenue: 'R$ 1.000,00 / mês',
    salesPerDay: '1 a 2 vendas/dia',
    videosPerDay: '3 vídeos/dia',
    accountsSetup: '1 perfil focado',
    quickAmounts: [18, 35, 100],
    defaultChartDailyMax: 100,
    defaultChartWeeklyMax: 350,
    focusTitle: 'Fase 1: Sair do Zero & Destravar Comissões Diárias',
    cardSummary: '1 a 2 vendas por dia · 3 criativos diários · Validação de 3 produtos campeões',
    imageUrl: 'https://i.imgur.com/Ewrl5P1.png',
  },
  {
    id: 'week',
    badge: '1K POR SEMANA',
    subtitle: 'Plano de Consistência & Multiplicação de Vencedores',
    badgeTone: 'emerald',
    dailyGoalNum: 142.86,
    periodGoalNum: 1000,
    periodLabel: 'Meta da Semana',
    targetDailyRevenue: 'R$ 142,85 / dia',
    targetMonthlyRevenue: 'R$ 4.300,00 / mês',
    salesPerDay: '6 a 8 vendas/dia',
    videosPerDay: '6 a 9 vídeos/dia',
    accountsSetup: '2 perfis ativos',
    quickAmounts: [50, 145, 350],
    defaultChartDailyMax: 250,
    defaultChartWeeklyMax: 1200,
    focusTitle: 'Fase 2: Esteira de 6 a 9 Criativos & Clonagem de Padrões',
    cardSummary: '6 a 8 vendas por dia · 6 a 9 criativos diários · Modelagem de top perfis',
    imageUrl: 'https://i.imgur.com/BX2AO1g.png',
  },
  {
    id: 'day',
    badge: '1K POR DIA',
    subtitle: 'Plano de Escala Industrial & Operação Multi-Contas IA',
    badgeTone: 'diamond',
    dailyGoalNum: 1000,
    periodGoalNum: 1000,
    periodLabel: 'Meta de Hoje',
    targetDailyRevenue: 'R$ 1.000,00 / dia',
    targetMonthlyRevenue: 'R$ 30.000,00 / mês',
    salesPerDay: '35 a 50 vendas/dia',
    videosPerDay: '12 a 24 vídeos/dia',
    accountsSetup: '3 a 5 contas dark IA',
    quickAmounts: [250, 500, 1000],
    defaultChartDailyMax: 1200,
    defaultChartWeeklyMax: 7500,
    focusTitle: 'Fase 3: Máquina Multi-Contas, Comissões VIP & Escala Pesada',
    cardSummary: '35 a 50 vendas por dia · 12 a 24 criativos IA · Contingência multi-contas',
    imageUrl: 'https://i.imgur.com/O1rTGPJ.png',
  },
];

/* ══════════════════════════════════════════════════════════════════════
   MATRIZ DE MISSÕES DIÁRIAS ROTATIVAS (EXCLUSIVAS POR PLANO E POR DIA)
   Cada plano tem seu próprio banco de missões táticas separadas em 4 pilares
   para que NENHUM dia seja igual ao anterior e NENHUM plano seja igual ao outro.
══════════════════════════════════════════════════════════════════════ */
const DAILY_TIPS_BY_TIER: Record<TierId, string[]> = {
  month: [
    'Para bater R$ 1.000/mês você só precisa de R$ 33,33 por dia — literalmente 2 comissões de R$ 17. Foque em 1 produto validado e capriche nos primeiros 3 segundos.',
    'Quem está no plano de 1K/mês não pode dispersar em 10 produtos. Concentre seus 3 vídeos de hoje na mesma peça mudando apenas a frase do topo.',
    'Vídeo sem fala com Headline POV de 2 linhas e música comercial em 100% é o atalho mais rápido para destravar a primeira venda sem aparecer.',
    'Nunca apague um vídeo que deu 200 views hoje. No TikTok Shop, vídeos de afiliado costumam engatar vendas 48h depois de postados.',
    'Responda qualquer comentário perguntando tamanho ou tecido com um novo vídeo curto vinculado ao carrinho amarelo: a taxa de compra passa de 15%.',
    'Horários de ouro para quem posta 3 vídeos ao dia: 11h30 (almoço), 17h45 (saída do trabalho) e 20h30 (pico noturno de compras por impulso).',
    'Confira sempre se a peça que aparece no vídeo é exatamente da mesma cor e modelo do link do carrinho para manter sua conta 100% blindada.',
  ],
  week: [
    'Para fazer R$ 1.000 toda semana (R$ 142,85/dia), o segredo é o formato 2+4: 2 vídeos com narração de Hook Viral e 4 vídeos rápidos POV sem fala.',
    'Quando um vídeo seu bater mais de 3.000 views ou gerar 2 vendas, não invente outro produto: crie 4 novos começos diferentes para esse mesmo produto hoje.',
    'No nível de 1K/semana, pedir amostra grátis para os lojistas com nosso script multiplica sua conversão porque você grava provas reais de tecido na mão.',
    'Use o Scanner hoje para olhar os 3 vídeos mais recentes dos top perfis de moda feminina e adapte o mesmo enquadramento para as suas peças.',
    'Aumente seu ticket médio escolhendo conjuntos ou macaquinhos de R$ 89 a R$ 119 (comissão de R$ 18 a R$ 24): com apenas 6 vendas você já bate os R$ 142 do dia.',
    'Fixe um comentário seu no topo de cada vídeo respondendo a maior dúvida da peça (ex: "Meninas, não fica transparente e o tamanho M veste 38/40").',
    'Audite a nota de envio do lojista no Score Lojista antes de escalar um produto na semana — lojista que atrasa derruba sua comissão líquida.',
  ],
  day: [
    'R$ 1.000 por dia exige mentalidade de fábrica criativa: opere de 3 a 5 perfis nichados simultâneos alimentados por lotes de vídeos gerados no Kling AI e Flow.',
    'Negocie comissão VIP (+18% a 25%) com os fabricantes que você já validou usando o script do Score Lojista — subir 5% de comissão adiciona R$ 250/dia no mesmo volume.',
    'Antes de subir lotes de 12 a 24 vídeos, passe os criativos mais agressivos no Scanner Antirrestrição para proteger todas as contas da operação.',
    'Extraia a movimentação dos vídeos que estão explodindo na gringa usando o Extrator de Movimentos e gere 5 variações de ambiente no Kling AI 9:16.',
    'Na meta de 1K/dia, 70% dos seus vídeos diários devem ir para os 2 produtos campeões que já pagam suas contas e 30% para testar 2 apostas novas.',
    'Use o Turbo de Seguidores em paralelo nas contas secundárias para destravar novos carrinhos amarelos toda semana e nunca depender de um único perfil.',
    'Analise o horário em que saíram os picos de comissão de ontem e concentre uma rajada dupla de criativos 30 minutos antes dessa janela hoje.',
  ],
};

const DAILY_SLOTS_BY_TIER: Record<TierId, [MissionStep[], MissionStep[], MissionStep[], MissionStep[]]> = {
  month: [
    // Slot 1: Seleção / Preparação (1K/mês)
    [
      { id: 1, title: 'Escolher 1 peça Score 90+ para focar hoje', description: 'Entre na aba Produtos e selecione 1 peça com comissão acima de R$ 14 e alta saída para concentrar seus 3 vídeos do dia.', toolView: 'products', toolLabel: 'Abrir Produtos' },
      { id: 1, title: 'Validar segurança do produto no Score Produto', description: 'Rode uma auditoria rápida na peça escolhida hoje para confirmar margem, demanda e zero risco de bloqueio.', toolView: 'product', toolLabel: 'Abrir Score Produto' },
      { id: 1, title: 'Estudar 1 aula prática na Área de Membros', description: 'Assista 1 aula curta de estrutura POV ou liberação de carrinho e anote 1 ajuste simples para aplicar hoje.', toolView: 'members', toolLabel: 'Ir para Aulas' },
      { id: 1, title: 'Mapear 1 perfil vencedor no Scanner', description: 'Abra o Scanner, escolha 1 perfil que vende moda feminina e observe como ele mostra a roupa nos primeiros 3 segundos.', toolView: 'scanner', toolLabel: 'Abrir Scanner' },
      { id: 1, title: 'Separar 1 vídeo de crescimento no Turbo', description: 'Caso sua conta ainda precise ganhar tração e seguidores rápidos, gere 1 episódio curto no Turbo de Seguidores.', toolView: 'turbo', toolLabel: 'Abrir Turbo' },
      { id: 1, title: 'Escolher 1 referência na Biblioteca de Prompts', description: 'Selecione 1 ambiente limpo de espelho ou quarto iluminado na Biblioteca de Prompts para manter padrão estético.', toolView: 'prompts', toolLabel: 'Ver Biblioteca' },
      { id: 1, title: 'Checar vitrine e link do carrinho amarelo', description: 'Confirme no TikTok Shop que o produto de hoje está com estoque ativo e frete subsidiado disponível.', toolView: 'products', toolLabel: 'Conferir Catálogo' },
    ],
    // Slot 2: Criação do Criativo (1K/mês)
    [
      { id: 2, title: 'Gerar 6 ganchos de 0 a 3s nos Hooks Virais', description: 'Suba o nome ou foto da peça de hoje na aba Hooks Virais e escolha os 2 ganchos mais naturais para seus vídeos.', toolView: 'hooks', toolLabel: 'Gerar Hooks' },
      { id: 2, title: 'Criar 3 Headlines POV curtas sem parecer anúncio', description: 'Gere títulos de 2 linhas no Gerador de Headlines (zero preço na tela) focados em caimento e zero transparência.', toolView: 'headlines', toolLabel: 'Gerar Headlines' },
      { id: 2, title: 'Montar 1 prompt 9:16 no Gerador de Prompts', description: 'Peça no Gerador de Prompts uma cena realista no espelho para animar no Kling AI ou Google Flow.', toolView: 'prompt-gen', toolLabel: 'Gerador de Prompts' },
      { id: 2, title: 'Pedir 1 roteiro de 20s sem aparecer no Agente IA', description: 'Peça ao Agente IA um roteiro simples de 20 segundos quebrando a principal dúvida da peça de hoje.', toolView: 'agent', toolLabel: 'Abrir Agente IA' },
      { id: 2, title: 'Extrair movimento fluido de 1 vídeo referência', description: 'Use o Extrator de Movimentos em um vídeo de provador para gerar um prompt sem mãos deformadas.', toolView: 'motion', toolLabel: 'Extrator de Movimentos' },
      { id: 2, title: 'Montar 2 variações de capa/abertura para o mesmo vídeo', description: 'Pegue 1 vídeo pronto e crie 2 versões trocando apenas a frase POV dos primeiros 2 segundos.', toolView: 'headlines', toolLabel: 'Variar Headlines' },
      { id: 2, title: 'Passar seu vídeo principal no Antirrestrição', description: 'Antes de publicar, escaneie o criativo no Scanner Antirrestrição para garantir 100% de aprovação no carrinho.', toolView: 'antirestriction', toolLabel: 'Escanear Vídeo' },
    ],
    // Slot 3: Execução & Postagem para R$ 33/dia (1K/mês)
    [
      { id: 3, title: 'Publicar os 3 vídeos do dia nos horários de pico', description: 'Solte 1 vídeo no almoço (11h30), 1 no fim da tarde (17h45) e 1 à noite (20h30) com som comercial e carrinho vinculado.' },
      { id: 3, title: 'Postar 2 vídeos POV sem fala + 1 vídeo com gancho falado', description: 'Combine 2 criativos rápidos com música em alta e 1 criativo respondendo objeção de tamanho/tecido para destravar R$ 33 hoje.' },
      { id: 3, title: 'Publicar sequência de 3 ângulos da mesma peça', description: 'Mostre caimento frontal no vídeo 1, teste de zero transparência no vídeo 2 e detalhes da costura no vídeo 3.' },
      { id: 3, title: 'Subir 3 criativos com legenda curta e pergunta final', description: 'Finalize a descrição com uma pergunta simples ("Usaria preto ou vinho?") para dobrar comentários e entrega orgânica.' },
      { id: 3, title: 'Postar lote diário de 3 vídeos usando áudio comercial Top 50', description: 'Selecione músicas da biblioteca comercial em 10% a 15% de volume e posicione a headline na zona segura superior.' },
      { id: 3, title: 'Publicar 3 vídeos focados em peça de ticket R$ 59 a R$ 89', description: 'Peças nessa faixa geram compra por impulso imediata e batem a meta diária de R$ 33,33 com apenas 2 pedidos.' },
      { id: 3, title: 'Cumprir a meta inegociável de 3 postagens de hoje', description: 'Publique os 3 criativos planejados sem pular janela de horário e mantenha todos os vídeos anteriores no ar.' },
    ],
    // Slot 4: Conversão & Fechamento Diário (1K/mês)
    [
      { id: 4, title: 'Fixar comentário quebrando objeção e registrar ganhos', description: 'Comente no próprio vídeo informando qual tamanho a modelo veste, fixe no topo e lance suas comissões do dia no painel ao lado.' },
      { id: 4, title: 'Responder dúvidas de seguidoras e atualizar seu gráfico', description: 'Responda todos os comentários dos vídeos das últimas 48h chamando para o carrinho laranja e registre o resultado de hoje.' },
      { id: 4, title: 'Identificar o vídeo com maior retenção de hoje', description: 'Veja nas métricas qual dos 3 vídeos segurou mais gente após os 3s para repetir o formato amanhã e anote seu faturamento.' },
      { id: 4, title: 'Solicitar 1 amostra grátis com o script do Score Produto', description: 'Envie o script pronto para 1 lojista da peça que você postou hoje e registre seu avanço rumo aos R$ 1.000 do mês.', toolView: 'product', toolLabel: 'Pegar Script' },
      { id: 4, title: 'Revisar cliques no carrinho amarelo e lançar comissões', description: 'Confira quantas visitas o produto recebeu hoje no TikTok Shop Creator e registre suas vendas no painel.' },
      { id: 4, title: 'Deixar a peça de amanhã separada nos favoritos', description: 'Já deixe salvo no catálogo qual produto você vai atacar amanhã cedo e feche o dia registrando seus ganhos.' },
      { id: 4, title: 'Consolidar fechamento semanal rumo a R$ 250/semana', description: 'Verifique no gráfico ao lado sua soma da semana para se manter acima da linha de R$ 33,33/dia.' },
    ],
  ],

  week: [
    // Slot 1: Inteligência & Engenharia Reversa (1K/semana)
    [
      { id: 1, title: 'Espionar 2 perfis no Scanner e mapear o vídeo campeão', description: 'Identifique no Scanner 2 criativos que passaram de 50 mil views nesta semana e anote o gancho visual exato.', toolView: 'scanner', toolLabel: 'Abrir Scanner' },
      { id: 1, title: 'Auditar 2 fornecedores no Score Lojista', description: 'Garanta que os 2 produtos principais da sua esteira semanal têm envio rápido e nota alta para não perder comissão por cancelamento.', toolView: 'store', toolLabel: 'Score Lojista' },
      { id: 1, title: 'Selecionar dupla de produtos com comissão R$ 18 a R$ 25', description: 'Escolha 1 conjunto fitness e 1 vestido/alfaiataria no catálogo: 6 a 7 vendas somam os R$ 142,85 da meta de hoje.', toolView: 'products', toolLabel: 'Escolher Dupla' },
      { id: 1, title: 'Validar 1 produto novo de aposta no Score Produto', description: 'Mantenha 80% da energia no que já vende e audite 1 peça nova com potencial viral para renovar sua vitrine da semana.', toolView: 'product', toolLabel: 'Auditar Produto' },
      { id: 1, title: 'Mapear as 3 maiores objeções nos comentários concorrentes', description: 'Abra os comentários da peça concorrente (transparência, cós enrolando, tamanho) para transformar cada dúvida em 1 vídeo hoje.', toolView: 'agent', toolLabel: 'Pedir Análise IA' },
      { id: 1, title: 'Enviar 3 pedidos de amostra grátis para lojistas parceiros', description: 'Use o script personalizado do Score Produto para solicitar 3 peças físicas e elevar sua taxa de conversão na semana.', toolView: 'product', toolLabel: 'Gerar Script' },
      { id: 1, title: 'Revisar qual criativo dos últimos 3 dias teve maior CTR', description: 'Descubra qual vídeo gerou mais cliques no carrinho amarelo proporcionalmente às visualizações para clonar hoje.' },
    ],
    // Slot 2: Produção em Lote de 6 a 9 Criativos (1K/semana)
    [
      { id: 2, title: 'Gerar lote inédito de 10 Headlines POV para esteira sem fala', description: 'Use o Gerador de Headlines para criar 5 aberturas de curiosidade e 5 de prova de qualidade para seus vídeos rápidos.', toolView: 'headlines', toolLabel: 'Gerar 10 Headlines' },
      { id: 2, title: 'Criar 6 Hooks Virais de 0 a 3s para os criativos narrados', description: 'Gere falas de impacto no módulo Hooks Virais e grave/gere 2 aberturas magnéticas que segurem 70%+ da audiência.', toolView: 'hooks', toolLabel: 'Gerar 6 Hooks' },
      { id: 2, title: 'Produzir 3 cenas em ambientes diferentes no Gerador de Prompts', description: 'Gere prompts 9:16 variando o cenário (quarto clean, closet iluminado, luz solar de janela) para a mesma peça vencedora.', toolView: 'prompt-gen', toolLabel: 'Criar Prompts' },
      { id: 2, title: 'Clonar biomecânica de giro no espelho no Extrator de Movimentos', description: 'Suba 1 vídeo campeão no Extrator de Movimentos e gere novos takes fluidos para Kling AI ou Flow VEO 3.', toolView: 'motion', toolLabel: 'Extrair Movimento' },
      { id: 2, title: 'Gerar 3 roteiros curtos de quebra de objeção no Agente IA', description: 'Peça ao Agente IA 3 roteiros de 18s (1 sobre caimento, 1 sobre tecido não marcar e 1 comparando com loja de shopping).', toolView: 'agent', toolLabel: 'Criar Roteiros' },
      { id: 2, title: 'Auditar os criativos mais ousados no Scanner Antirrestrição', description: 'Passe seus vídeos de modeladores, moda praia ou fitness no Antirrestrição antes de soltar a esteira do dia.', toolView: 'antirestriction', toolLabel: 'Blindar Vídeos' },
      { id: 2, title: 'Reciclar seu melhor vídeo da semana com 3 novos primeiros frames', description: 'Troque os primeiros 2,5 segundos e o texto POV do seu vídeo mais vendido para atingir um público novo sem regravar tudo.', toolView: 'headlines', toolLabel: 'Novas Aberturas' },
    ],
    // Slot 3: Distribuição Consistente para R$ 142,85/dia (1K/semana)
    [
      { id: 3, title: 'Publicar de 6 a 8 criativos bem espaçados ao longo do dia', description: 'Distribua 2 vídeos pela manhã, 2 à tarde e 3 a 4 entre 19h e 22h30 priorizando os 2 produtos que mais convertem.' },
      { id: 3, title: 'Executar a regra 70/30 na grade de postagens de hoje', description: 'Destine 5 vídeos para o produto que já colocou comissão no seu bolso e 2 vídeos para testar uma nova peça promissora.' },
      { id: 3, title: 'Publicar 2 vídeos-resposta direto em comentários de clientes', description: 'Transforme perguntas reais ("marca na barriga?", "qual tamanho pedir?") em vídeos-resposta com carrinho amarelo ativo.' },
      { id: 3, title: 'Subir bateria noturna de 3 vídeos POV no horário nobre (20h–22h)', description: 'Aproveite a janela de maior compra por impulso da semana soltando 3 variações visuais com sons comerciais em alta.' },
      { id: 3, title: 'Testar duelo de ângulos: Elegância vs Conforto em 6 vídeos', description: 'Publique 3 criativos destacando sofisticação ("parece peça cara") e 3 destacando conforto/zero transparência.' },
      { id: 3, title: 'Manter cadência de 6+ vídeos ativos nos seus 2 perfis', description: 'Alimente sua conta principal e sua segunda conta reserva hoje para somar de 6 a 8 vendas diárias (R$ 142,85+).' },
      { id: 3, title: 'Publicar série de "1 Peça, 3 Ocasiões" para puxar salvamentos', description: 'Vídeos versáteis disparam a taxa de salvamento no TikTok e empurram o carrinho amarelo por vários dias seguidos.' },
    ],
    // Slot 4: Otimização & Meta de R$ 1.000 na Semana (1K/semana)
    [
      { id: 4, title: 'Conferir meta diária de R$ 142,85 e lançar ganhos no gráfico', description: 'Registre todas as comissões aprovadas de hoje no painel ao lado e acompanhe quanto falta para fechar R$ 1.000 nesta semana.' },
      { id: 4, title: 'Cortar produtos sem clique após 9 vídeos e dobrar o campeão', description: 'Se uma peça não gerou cliques no carrinho após 9 tentativas, substitua por outra Score 92+ e lance o resultado do dia.' },
      { id: 4, title: 'Fixar prova social e guia de medidas nos vídeos que engajaram', description: 'Adicione comentário fixado nos criativos que passaram de 1.000 views hoje para destravar indecisas e registre suas vendas.' },
      { id: 4, title: 'Negociar comissão extra com lojista que você já gerou vendas', description: 'Use o script do Score Lojista mostrando suas vendas da semana para pedir +3% a +5% de comissão na vitrine.', toolView: 'store', toolLabel: 'Script de Parceria' },
      { id: 4, title: 'Deixar 4 rascunhos prontos para a manhã seguinte', description: 'Adiante metade da esteira de amanhã hoje à noite para nunca falhar na consistência semanal e atualize seu saldo.' },
      { id: 4, title: 'Analisar taxa de clique por horário e consolidar faturamento', description: 'Identifique qual faixa de horário rendeu mais pedidos hoje e registre o valor exato no gráfico semanal.' },
      { id: 4, title: 'Bater o check-up semanal rumo aos R$ 4.300/mês', description: 'Compare a barra da Semana Atual com as semanas anteriores no gráfico e ajuste o volume de criativos dos próximos dias.' },
    ],
  ],

  day: [
    // Slot 1: Comando Estratégico & Comissões VIP (1K/dia)
    [
      { id: 1, title: 'Negociar comissão VIP (18% a 25%) em 2 lojas com Score Lojista', description: 'Rode auditoria no Score Lojista e envie proposta executiva de volume para elevar sua comissão por pedido acima de R$ 22.', toolView: 'store', toolLabel: 'Negociar no Score Lojista' },
      { id: 1, title: 'Mapear 3 tendências emergentes no Scanner antes da saturação', description: 'Analise no Scanner os produtos que aceleraram nas últimas 48h nos top perfis para sair na frente com lote massivo hoje.', toolView: 'scanner', toolLabel: 'Espionar no Scanner' },
      { id: 1, title: 'Selecionar mix de ticket alto (R$ 99 a R$ 149) para 35–50 vendas/dia', description: 'Monte sua grade do dia com conjuntos, vestidos longos e alfaiataria que pagam R$ 20 a R$ 30 por venda única.', toolView: 'products', toolLabel: 'Mix de Alta Comissão' },
      { id: 1, title: 'Auditar risco e estoque de todo o portfólio ativo da operação', description: 'Passe os produtos novos no Score Produto garantindo estoque profundo no lojista para aguentar picos de 50+ pedidos/dia.', toolView: 'product', toolLabel: 'Auditar Portfólio' },
      { id: 1, title: 'Ativar aquecimento de nova conta de contingência com o Turbo', description: 'Gere 2 episódios virais 3D no Turbo de Seguidores para bater 1.000+ seguidores em mais uma conta backup da sua rede.', toolView: 'turbo', toolLabel: 'Escalar no Turbo' },
      { id: 1, title: 'Solicitar plano tático Pro de escala multi-contas no Agente IA', description: 'Use o modo Orbiex Pro no Agente IA para desenhar novos ângulos inexplorados para o seu produto #1 de faturamento.', toolView: 'agent', toolLabel: 'Agente IA Pro' },
      { id: 1, title: 'Distribuir metas de faturamento entre suas 3 a 5 contas dark', description: 'Defina qual produto âncora cada perfil da sua contingência vai dominar hoje para somar R$ 1.000,00 sem canibalizar.' },
    ],
    // Slot 2: Fábrica de Criativos IA em Escala (1K/dia)
    [
      { id: 2, title: 'Extrair 3 movimentos campeões para lote no Kling AI / Flow', description: 'Use o Extrator de Movimentos em 3 vídeos de altíssima conversão para gerar uma bateria de 12 takes inéditos em 9:16.', toolView: 'motion', toolLabel: 'Extrator Cinético' },
      { id: 2, title: 'Gerar matriz de 20 Headlines POV + 6 Hooks de retenção máxima', description: 'Combine o Gerador de Headlines e os Hooks Virais para alimentar todas as contas da operação sem repetir nenhuma frase.', toolView: 'headlines', toolLabel: 'Matriz de Headlines' },
      { id: 2, title: 'Variar 4 ambientes de luxo para o mesmo produto vencedor', description: 'Gere no Gerador de Prompts variações em closet de alto padrão, luz natural dourada, estúdio minimalista e espelho urbano.', toolView: 'prompt-gen', toolLabel: 'Multiplicar Cenários' },
      { id: 2, title: 'Blindar lote diário no Scanner Antirrestrição (Zero Ban)', description: 'Em escala de 12 a 24 vídeos/dia, uma restrição custa caro: valide os criativos principais no Antirrestrição antes de subir.', toolView: 'antirestriction', toolLabel: 'Blindagem Total' },
      { id: 2, title: 'Montar variações de micro-cortes (1,5s) para segurar 80% nos 3s', description: 'Gere 6 aberturas visuais diferentes nos Hooks Virais para acoplar no mesmo corpo de demonstração que já vende.', toolView: 'hooks', toolLabel: 'Hooks de Escala' },
      { id: 2, title: 'Selecionar novas influenciadoras virtuais na Biblioteca de Prompts', description: 'Diversifique o rosto/estilo das modelos IA entre seus perfis usando referências em alta resolução da Biblioteca.', toolView: 'prompts', toolLabel: 'Biblioteca IA' },
      { id: 2, title: 'Produzir bateria comparativa "Boutique R$ 400 vs Fábrica"', description: 'Use o Agente IA para gerar 4 variações de ancoragem de valor sem citar preço proibido na tela.', toolView: 'agent', toolLabel: 'Gerar Variações' },
    ],
    // Slot 3: Volume de Dominação — 12 a 24 Vídeos/Dia (1K/dia)
    [
      { id: 3, title: 'Executar esteira pesada de 12 a 20 vídeos distribuídos nas contas', description: 'Publique de 4 a 5 criativos por conta nos picos (11h, 15h, 18h30 e 21h) focando 70% do volume nos campeões validados.' },
      { id: 3, title: 'Disparar onda tripla no horário nobre (19h30 às 22h30)', description: 'Suba variações simultâneas do seu top 1 de vendas em perfis diferentes com áudios comerciais distintos para dominar a For You.' },
      { id: 3, title: 'Testar 3 produtos novos em paralelo sem frear os vencedores', description: 'Rode bateria rápida de 3 vídeos para cada aposta nova enquanto mantém 12+ vídeos empurrando as peças que já pagam R$ 500+/dia.' },
      { id: 3, title: 'Multiplicar em 5 variações o vídeo que bateu venda mais rápido hoje', description: 'Assim que um criativo da manhã converter acima da média, solte 5 variações de headline dele para capturar o pico da noite.' },
      { id: 3, title: 'Operar cruzamento de formatos: Provador IA + Detalhe Macro + Resposta', description: 'Em cada perfil ativo, alterne vídeo de corpo inteiro no espelho, close de textura do tecido e resposta a comentário real.' },
      { id: 3, title: 'Publicar lote de fim de tarde focado em kits e conjuntos de alto ticket', description: 'Priorize peças acima de R$ 109 com alta comissão para alcançar R$ 1.000 no dia com menos pedidos necessários.' },
      { id: 3, title: 'Manter 15+ criativos diários no ar com zero repetição de arquivo', description: 'Garanta metadados limpos, cortes únicos e legendas nativas diferentes em cada conta para entrega máxima do algoritmo.' },
    ],
    // Slot 4: Auditoria de Escala & Fechamento R$ 1.000/Dia (1K/dia)
    [
      { id: 4, title: 'Auditar faturamento por conta e cravar o fechamento de R$ 1.000 hoje', description: 'Some as comissões de todos os perfis da sua operação, lance no painel ao lado e valide o avanço rumo aos R$ 30k/mês.' },
      { id: 4, title: 'Dobrar orçamento criativo nos top 20% vídeos que geraram 80% da receita', description: 'Identifique os 2 criativos responsáveis pelo grosso das vendas de hoje, programe 6 derivações para amanhã e registre o caixa.' },
      { id: 4, title: 'Verificar saúde das contas (zero violação) e atualizar painel em nuvem', description: 'Cheque o status de conformidade de cada conta afiliada no TikTok Shop Creator e salve seu resultado diário no gráfico.' },
      { id: 4, title: 'Substituir imediatamente lojista com queda de estoque', description: 'Se algum item campeão baixou estoque, aponte seus próximos vídeos para fornecedor equivalente no Score Lojista e feche o caixa.', toolView: 'store', toolLabel: 'Trocar Fornecedor' },
      { id: 4, title: 'Deixar esteira matinal de amanhã (6 primeiros vídeos) engatilhada', description: 'Garanta que suas contas já entrem performando no pico das 11h de amanhã e consolide os ganhos de hoje no painel.' },
      { id: 4, title: 'Analisar comissão média por pedido e otimizar mix da semana', description: 'Priorize os itens que entregaram maior retorno por 1.000 visualizações (RPM) hoje e registre o faturamento total.' },
      { id: 4, title: 'Consolidar batida de meta rumo a R$ 7.000 na semana / R$ 30.000 no mês', description: 'Revise sua curva diária e semanal no gráfico ao lado mantendo a disciplina diária de execução.' },
    ],
  ],
};

/* ───────── Funções Utilitárias de Datas Reais & Sincronização ───────── */

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getTodayKey(): string {
  return toDateKey(new Date());
}

function dayOrdinal(dateKey: string): number {
  const [y, m, d] = dateKey.split('-').map(Number);
  return Math.floor(Date.UTC(y || 2026, (m || 1) - 1, d || 1) / 86_400_000);
}

function getWeekdayPt(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  return [
    'Domingo',
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado',
  ][dt.getDay()] || 'Hoje';
}

function formatDateBr(dateKey: string): string {
  const [, m, d] = dateKey.split('-');
  return `${d}/${m}`;
}

/** Constrói o pacote diário determinístico rotativo para (plano + data) — cada dia do ano monta uma combinação diferente */
function buildCuratedDailyPack(tierId: TierId, dateKey: string, extraOffset = 0): DailyMissionPack {
  const ord = dayOrdinal(dateKey) + extraOffset;
  const tips = DAILY_TIPS_BY_TIER[tierId];
  const slots = DAILY_SLOTS_BY_TIER[tierId];

  // Primos distintos em cada slot para gerar combinações inéditas dia após dia
  const tip = tips[Math.abs(ord * 3) % tips.length];
  const s1 = slots[0][Math.abs(ord) % slots[0].length];
  const s2 = slots[1][Math.abs(ord * 2 + 1) % slots[1].length];
  const s3 = slots[2][Math.abs(ord * 5 + 2) % slots[2].length];
  const s4 = slots[3][Math.abs(ord * 7 + 3) % slots[3].length];

  return {
    dateKey,
    tip,
    steps: [
      { ...s1, id: 1 },
      { ...s2, id: 2 },
      { ...s3, id: 3 },
      { ...s4, id: 4 },
    ],
  };
}

function emptyPlanData(): PlanProgressData {
  return {
    revenueByDate: {},
    completedByDate: {},
    dailyMissionsByDate: {},
  };
}

function emptyAllPlans(): PlansDataMap {
  return {
    month: emptyPlanData(),
    week: emptyPlanData(),
    day: emptyPlanData(),
  };
}

function getCurrentUserEmail(): string | null {
  try {
    const raw =
      localStorage.getItem('orbiex_user_email') ||
      localStorage.getItem('orbix_user_email') ||
      localStorage.getItem('orbiex_last_account');
    return raw ? raw.trim().toLowerCase() : null;
  } catch {
    return null;
  }
}

function getLocalStorageKey(): string {
  const email = getCurrentUserEmail() || 'guest';
  return `orbiex_journey_v5_${email}`;
}

function normalizePlansMap(raw?: Partial<PlansDataMap> | null): PlansDataMap {
  const base = emptyAllPlans();
  if (!raw || typeof raw !== 'object') return base;
  (['month', 'week', 'day'] as TierId[]).forEach((tid) => {
    const src = raw[tid];
    if (src && typeof src === 'object') {
      base[tid] = {
        revenueByDate: src.revenueByDate && typeof src.revenueByDate === 'object' ? { ...src.revenueByDate } : {},
        completedByDate: src.completedByDate && typeof src.completedByDate === 'object' ? { ...src.completedByDate } : {},
        dailyMissionsByDate:
          src.dailyMissionsByDate && typeof src.dailyMissionsByDate === 'object'
            ? { ...src.dailyMissionsByDate }
            : {},
      };
    }
  });
  return base;
}

/** Migra dados locais v4 antigos (caso o usuário já tivesse registrado algum ganho antes da atualização) */
function loadInitialLocalJourney(): { activeTier: TierId; plansData: PlansDataMap; updatedAt: string | null } {
  try {
    const rawV5 = localStorage.getItem(getLocalStorageKey());
    if (rawV5) {
      const parsed = JSON.parse(rawV5) as PersistedJourneyPayload;
      const tier: TierId =
        parsed.activeTier === 'week' || parsed.activeTier === 'day' ? parsed.activeTier : 'month';
      return {
        activeTier: tier,
        plansData: normalizePlansMap(parsed.plansData),
        updatedAt: parsed.updatedAt || null,
      };
    }

    // Migração suave da v4 se existir
    const savedMission =
      localStorage.getItem('orbiex_active_mission') || localStorage.getItem('orbix_active_mission');
    const activeTier: TierId =
      savedMission === 'week' || savedMission === 'day' ? savedMission : 'month';
    const plansData = emptyAllPlans();
    const todayKey = getTodayKey();

    const oldChecklist = localStorage.getItem('orbiex_daily_checklist_v4');
    if (oldChecklist) {
      const arr = JSON.parse(oldChecklist);
      if (Array.isArray(arr) && arr.length > 0) {
        plansData[activeTier].completedByDate[todayKey] = arr.filter((n) => typeof n === 'number');
      }
    }

    const oldDaily = localStorage.getItem('orbiex_chart_daily_v4');
    if (oldDaily) {
      const arr = JSON.parse(oldDaily);
      if (Array.isArray(arr)) {
        const today = new Date();
        arr.forEach((slot: any) => {
          const amt = Number(slot?.amount) || 0;
          if (amt <= 0) return;
          if (slot.id === 'today') {
            plansData[activeTier].revenueByDate[todayKey] = amt;
          } else if (typeof slot.id === 'string' && slot.id.startsWith('d-')) {
            const diff = parseInt(slot.id.slice(2), 10);
            if (diff > 0) {
              const d = new Date(today);
              d.setDate(today.getDate() - diff);
              plansData[activeTier].revenueByDate[toDateKey(d)] = amt;
            }
          }
        });
      }
    }

    return { activeTier, plansData, updatedAt: null };
  } catch {
    return { activeTier: 'month', plansData: emptyAllPlans(), updatedAt: null };
  }
}

const VALID_VIEWS: Record<string, { view: ViewId; label: string }> = {
  products: { view: 'products', label: 'Abrir Produtos' },
  product: { view: 'product', label: 'Score Produto' },
  store: { view: 'store', label: 'Score Lojista' },
  scanner: { view: 'scanner', label: 'Abrir Scanner' },
  hooks: { view: 'hooks', label: 'Hooks Virais' },
  headlines: { view: 'headlines', label: 'Gerar Headlines' },
  'prompt-gen': { view: 'prompt-gen', label: 'Gerador de Prompts' },
  prompts: { view: 'prompts', label: 'Biblioteca' },
  motion: { view: 'motion', label: 'Extrator de Movimentos' },
  turbo: { view: 'turbo', label: 'Turbo de Seguidores' },
  'antirestriction': { view: 'antirestriction', label: 'Antirrestrição' },
  agent: { view: 'agent', label: 'Agente IA' },
  members: { view: 'members', label: 'Ver Aulas' },
};

export function JourneyView({
  onUse: _onUse,
  onNavigate,
}: {
  onUse?: (text: string) => void;
  onNavigate?: (view: ViewId) => void;
} = {}) {
  const initial = useMemo(loadInitialLocalJourney, []);

  const [screenMode, setScreenMode] = useState<'selection' | 'execution'>('selection');
  const [activeTierId, setActiveTierId] = useState<TierId>(initial.activeTier);
  const [plansData, setPlansData] = useState<PlansDataMap>(initial.plansData);
  const [chartMode, setChartMode] = useState<'daily' | 'weekly'>('daily');
  const [todayKey, setTodayKey] = useState<string>(getTodayKey);

  const [inputVal, setInputVal] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'loading' | 'saving' | 'synced' | 'local'>('loading');
  const [generatingMissions, setGeneratingMissions] = useState<boolean>(false);

  const latestUpdatedAtRef = useRef<string | null>(initial.updatedAt);
  const aiFetchingKeyRef = useRef<string | null>(null);

  // Virada automática de meia-noite: quando muda o dia, renova automaticamente as 4 missões diárias
  useEffect(() => {
    const timer = window.setInterval(() => {
      const nowKey = getTodayKey();
      setTodayKey((prev) => (prev !== nowKey ? nowKey : prev));
    }, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  /* ───── Persistência Completa no Backend (Supabase + /api/journey + localStorage) ───── */
  const persistJourney = useCallback(async (nextTier: TierId, nextPlans: PlansDataMap) => {
    const nowIso = new Date().toISOString();
    latestUpdatedAtRef.current = nowIso;

    const payload: PersistedJourneyPayload = {
      activeTier: nextTier,
      plansData: nextPlans,
      updatedAt: nowIso,
    };

    try {
      localStorage.setItem(getLocalStorageKey(), JSON.stringify(payload));
      localStorage.setItem('orbiex_active_mission', nextTier);
      localStorage.setItem('orbix_active_mission', nextTier);
    } catch {
      /* ignore quota */
    }

    const email = getCurrentUserEmail();
    if (!email) {
      setSyncStatus('local');
      return;
    }

    setSyncStatus('saving');
    let savedCloud = false;

    // 1. Salva via API Serverless Oficial (/api/journey -> Supabase PostgreSQL)
    try {
      const res = await fetch('/api/journey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          activeTier: nextTier,
          plansData: nextPlans,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json?.success) savedCloud = true;
      }
    } catch {
      /* fallback direto ao cliente Supabase abaixo */
    }

    // 2. Fallback / espelhamento direto no Supabase (funciona mesmo em dev local)
    if (!savedCloud) {
      try {
        const { error } = await supabase.from('profiles').upsert(
          {
            user_email: `journey::${email}`,
            name: nextTier,
            avatar_url: JSON.stringify(payload),
            updated_at: nowIso,
          },
          { onConflict: 'user_email' }
        );
        if (!error) savedCloud = true;
      } catch {
        /* ignore */
      }
    }

    // 3. Espelha também no user_metadata da conta autenticada no Supabase Auth
    try {
      supabase.auth.updateUser({ data: { orbiex_journey_v2: payload } }).catch(() => {});
    } catch {
      /* ignore */
    }

    setSyncStatus(savedCloud ? 'synced' : 'local');
  }, []);

  /* ───── Carregamento Inicial do Progresso no Backend (Supabase) ───── */
  useEffect(() => {
    let cancelled = false;
    const email = getCurrentUserEmail();
    if (!email) {
      setSyncStatus('local');
      return;
    }

    (async () => {
      let remotePayload: PersistedJourneyPayload | null = null;

      // 1. Tenta via endpoint /api/journey
      try {
        const res = await fetch(`/api/journey?email=${encodeURIComponent(email)}`);
        if (res.ok) {
          const json = await res.json();
          if (json?.success && json?.found && json.plansData) {
            remotePayload = {
              activeTier: json.activeTier === 'week' || json.activeTier === 'day' ? json.activeTier : 'month',
              plansData: json.plansData,
              updatedAt: json.updatedAt || new Date().toISOString(),
            };
          }
        }
      } catch {
        /* tenta cliente Supabase direto */
      }

      // 2. Tenta direto na tabela profiles do Supabase
      if (!remotePayload) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('name, avatar_url, updated_at')
            .eq('user_email', `journey::${email}`)
            .maybeSingle();

          if (!error && data?.avatar_url) {
            const parsed = JSON.parse(data.avatar_url);
            remotePayload = {
              activeTier:
                parsed.activeTier === 'week' || parsed.activeTier === 'day'
                  ? parsed.activeTier
                  : data.name === 'week' || data.name === 'day'
                  ? (data.name as TierId)
                  : 'month',
              plansData: parsed.plansData || {},
              updatedAt: parsed.updatedAt || data.updated_at || new Date().toISOString(),
            };
          }
        } catch {
          /* ignore */
        }
      }

      if (cancelled) return;

      if (remotePayload) {
        const localTime = latestUpdatedAtRef.current ? Date.parse(latestUpdatedAtRef.current) : 0;
        const remoteTime = remotePayload.updatedAt ? Date.parse(remotePayload.updatedAt) : 0;

        if (!localTime || remoteTime >= localTime) {
          const normalized = normalizePlansMap(remotePayload.plansData);
          setActiveTierId(remotePayload.activeTier);
          setPlansData(normalized);
          latestUpdatedAtRef.current = remotePayload.updatedAt;
          try {
            localStorage.setItem(
              getLocalStorageKey(),
              JSON.stringify({
                activeTier: remotePayload.activeTier,
                plansData: normalized,
                updatedAt: remotePayload.updatedAt,
              })
            );
          } catch {}
        }
        setSyncStatus('synced');
      } else {
        // Se ainda não existia registro na nuvem para este aluno, sobe o estado inicial agora
        await persistJourney(initial.activeTier, initial.plansData);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ───── Dados do Plano Ativo (100% Isolados por Plano) ───── */
  const activeTier = useMemo(
    () => MISSION_TIERS.find((t) => t.id === activeTierId) || MISSION_TIERS[0],
    [activeTierId]
  );

  const currentPlanData = plansData[activeTierId] || emptyPlanData();

  // Missões de HOJE para este plano específico (muda todo santo dia!)
  const todayMissionPack: DailyMissionPack = useMemo(() => {
    const savedPack = currentPlanData.dailyMissionsByDate?.[todayKey];
    if (savedPack && Array.isArray(savedPack.steps) && savedPack.steps.length === 4) {
      return savedPack;
    }
    return buildCuratedDailyPack(activeTierId, todayKey);
  }, [activeTierId, currentPlanData.dailyMissionsByDate, todayKey]);

  const completedSteps: number[] = useMemo(() => {
    return currentPlanData.completedByDate?.[todayKey] || [];
  }, [currentPlanData.completedByDate, todayKey]);

  // Sequência de dias consecutivos com missões cumpridas neste plano
  const streakDays = useMemo(() => {
    let count = 0;
    const base = new Date();
    for (let i = 0; i < 60; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() - i);
      const k = toDateKey(d);
      const done = currentPlanData.completedByDate?.[k]?.length || 0;
      if (done > 0) count++;
      else if (i > 0) break;
    }
    return count;
  }, [currentPlanData.completedByDate]);

  // Série dos últimos 7 dias reais para o gráfico diário deste plano
  const dailyData = useMemo(() => {
    const list: { id: string; dateKey: string; label: string; sublabel: string; amount: number }[] = [];
    const base = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(base);
      d.setDate(base.getDate() - i);
      const k = toDateKey(d);
      const isToday = i === 0;
      list.push({
        id: isToday ? 'today' : `d-${i}`,
        dateKey: k,
        label: isToday ? 'HOJE' : `D-${i}`,
        sublabel: formatDateBr(k),
        amount: Number(currentPlanData.revenueByDate?.[k]) || 0,
      });
    }
    return list;
  }, [currentPlanData.revenueByDate, todayKey]);

  // Série das últimas 4 semanas reais (blocos de 7 dias) para o gráfico semanal deste plano
  const weeklyData = useMemo(() => {
    const labels = [
      { id: 'w-1', label: 'Sem 1', sublabel: '3 sem atrás', startDaysAgo: 27, endDaysAgo: 21 },
      { id: 'w-2', label: 'Sem 2', sublabel: '2 sem atrás', startDaysAgo: 20, endDaysAgo: 14 },
      { id: 'w-3', label: 'Sem 3', sublabel: 'Semana passada', startDaysAgo: 13, endDaysAgo: 7 },
      { id: 'w-cur', label: 'Sem Atual', sublabel: 'Últimos 7 dias', startDaysAgo: 6, endDaysAgo: 0 },
    ];
    const base = new Date();
    return labels.map((w) => {
      let sum = 0;
      for (let i = w.startDaysAgo; i >= w.endDaysAgo; i--) {
        const d = new Date(base);
        d.setDate(base.getDate() - i);
        sum += Number(currentPlanData.revenueByDate?.[toDateKey(d)]) || 0;
      }
      return { id: w.id, label: w.label, sublabel: w.sublabel, amount: sum };
    });
  }, [currentPlanData.revenueByDate, todayKey]);

  // Total acumulado dos últimos 30 dias reais neste plano
  const totalLast30Days = useMemo(() => {
    let sum = 0;
    const base = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() - i);
      sum += Number(currentPlanData.revenueByDate?.[toDateKey(d)]) || 0;
    }
    return sum;
  }, [currentPlanData.revenueByDate, todayKey]);

  const todayEarnings = useMemo(
    () => Number(currentPlanData.revenueByDate?.[todayKey]) || 0,
    [currentPlanData.revenueByDate, todayKey]
  );

  const currentWeekEarnings = useMemo(
    () => weeklyData.find((w) => w.id === 'w-cur')?.amount || 0,
    [weeklyData]
  );

  // Progresso real rumo à meta específica do plano escolhido
  const goalProgressPercent = useMemo(() => {
    const currentVal =
      activeTier.id === 'month'
        ? totalLast30Days
        : activeTier.id === 'week'
        ? currentWeekEarnings
        : todayEarnings;
    return Math.min(100, Math.round((currentVal / activeTier.periodGoalNum) * 100));
  }, [activeTier, totalLast30Days, currentWeekEarnings, todayEarnings]);

  /* ───── Geração Inteligente via IA das 4 Missões Diárias Personalizadas ───── */
  const generatePersonalizedDailyMissions = useCallback(
    async (tierCfg: TierConfig, dateKeyTarget: string, forceNew = false) => {
      const lockKey = `${tierCfg.id}:${dateKeyTarget}`;
      if (!forceNew && aiFetchingKeyRef.current === lockKey) return;
      aiFetchingKeyRef.current = lockKey;
      setGeneratingMissions(true);

      const memKey = `journey-missions:${tierCfg.id}`;
      const previousTitles = getGenMemory(memKey);
      const weekday = getWeekdayPt(dateKeyTarget);

      try {
        const ai = await aiGenerateJSON<{
          tip?: string;
          steps?: Array<{ title?: string; description?: string; toolView?: string }>;
        }>({
          memoryKey: memKey,
          task: `Gere o plano tático DIÁRIO de HOJE (${weekday}, ${formatDateBr(dateKeyTarget)}) com 1 dica prática curta e EXATAMENTE 4 missões diárias acionáveis, 100% personalizadas para um afiliado do TikTok Shop com IA que está no plano "${tierCfg.badge}" (meta de ${tierCfg.targetDailyRevenue}, ritmo de ${tierCfg.videosPerDay}, ${tierCfg.salesPerDay}, estrutura: ${tierCfg.accountsSetup}). As missões deste plano DEVEM ser totalmente compatíveis com o tamanho dessa meta (1K/mês é iniciante validando 3 vídeos/dia; 1K/semana é consistência de 6-9 vídeos/dia e clonagem de vencedores; 1K/dia é operação pesada multi-contas de 12-24 vídeos/dia e comissões VIP).`,
          input: {
            plano: tierCfg.badge,
            focoDoPlano: tierCfg.focusTitle,
            metaDiaria: tierCfg.targetDailyRevenue,
            volumeVideosDia: tierCfg.videosPerDay,
            pedidosPorDia: tierCfg.salesPerDay,
            diaDaSemana: weekday,
            data: dateKeyTarget,
            ganhoHoje: todayEarnings,
            ganhoUltimos7Dias: currentWeekEarnings,
            ganhoUltimos30Dias: totalLast30Days,
            ferramentasDisponiveis: [
              'products (Catálogo de Produtos Campeões)',
              'product (Score Produto & Script de Amostra)',
              'store (Score Lojista & Script de Comissão VIP)',
              'scanner (Scanner de Perfis Virais)',
              'hooks (Hooks Virais de 0 a 3s)',
              'headlines (Gerador de Headlines POV)',
              'prompt-gen (Gerador de Prompts Kling/Flow)',
              'motion (Extrator de Movimentos)',
              'turbo (Turbo de Seguidores / Novelinha 3D)',
              'antirestriction (Scanner Antirrestrição)',
              'agent (Agente IA)',
              'members (Aulas)',
            ],
          },
          format: `{
  "tip": "dica tática inédita de 2 frases focada na meta de hoje deste plano",
  "steps": [
    { "title": "título curto e direto da missão 1 (escolha/inteligência)", "description": "instrução prática específica do que executar hoje", "toolView": "products|product|store|scanner|hooks|headlines|prompt-gen|motion|turbo|antirestriction|agent|members" },
    { "title": "título curto e direto da missão 2 (criação de criativos IA)", "description": "instrução prática específica do que criar hoje", "toolView": "hooks|headlines|prompt-gen|motion|antirestriction|agent" },
    { "title": "título curto e direto da missão 3 (publicação no ritmo da meta)", "description": "instrução prática com quantidade exata de vídeos e horários do plano", "toolView": "" },
    { "title": "título curto e direto da missão 4 (conversão/escala e registro no painel)", "description": "ação final para converter cliques em vendas e registrar o faturamento de hoje", "toolView": "" }
  ]
}`,
          remember: (d) =>
            Array.isArray(d?.steps) ? d.steps.map((s: any) => String(s?.title || '')).filter(Boolean) : [],
        });

        let nextPack: DailyMissionPack;

        if (ai && Array.isArray(ai.steps) && ai.steps.length >= 4) {
          const fallbackPack = buildCuratedDailyPack(
            tierCfg.id,
            dateKeyTarget,
            Math.floor(Math.random() * 30) + 1
          );
          nextPack = {
            dateKey: dateKeyTarget,
            tip: String(ai.tip || fallbackPack.tip).trim(),
            aiGenerated: true,
            steps: [0, 1, 2, 3].map((idx) => {
              const rawStep = ai.steps![idx] || {};
              const fb = fallbackPack.steps[idx];
              const tvKey = String(rawStep.toolView || '').trim();
              const mappedTool = VALID_VIEWS[tvKey];
              return {
                id: idx + 1,
                title: String(rawStep.title || fb.title).trim(),
                description: String(rawStep.description || fb.description).trim(),
                toolView: mappedTool ? mappedTool.view : fb.toolView,
                toolLabel: mappedTool ? mappedTool.label : fb.toolLabel,
              };
            }),
          };
        } else {
          nextPack = buildCuratedDailyPack(
            tierCfg.id,
            dateKeyTarget,
            forceNew ? previousTitles.length + Math.floor(Math.random() * 20) + 1 : 0
          );
          addGenMemory(
            memKey,
            nextPack.steps.map((s) => s.title)
          );
        }

        setPlansData((prev) => {
          const tierState = prev[tierCfg.id] || emptyPlanData();
          const nextPlans: PlansDataMap = {
            ...prev,
            [tierCfg.id]: {
              ...tierState,
              // Se o usuário clicou manualmente em "Novas Missões", zera os checks de hoje para o novo lote
              completedByDate: forceNew
                ? { ...tierState.completedByDate, [dateKeyTarget]: [] }
                : tierState.completedByDate,
              dailyMissionsByDate: {
                ...tierState.dailyMissionsByDate,
                [dateKeyTarget]: nextPack,
              },
            },
          };
          persistJourney(tierCfg.id, nextPlans);
          return nextPlans;
        });
      } finally {
        setGeneratingMissions(false);
        if (aiFetchingKeyRef.current === lockKey) aiFetchingKeyRef.current = null;
      }
    },
    [currentWeekEarnings, persistJourney, todayEarnings, totalLast30Days]
  );

  // Quando o aluno abre a tela de execução em um novo dia e ainda não há pacote IA salvo para hoje neste plano, personaliza automaticamente!
  useEffect(() => {
    if (screenMode !== 'execution') return;
    const saved = plansData[activeTierId]?.dailyMissionsByDate?.[todayKey];
    if (!saved?.aiGenerated) {
      generatePersonalizedDailyMissions(activeTier, todayKey, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screenMode, activeTierId, todayKey]);

  /* ───── Tema Visual Exclusivo de Cada Plano ───── */
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
        progressFill: 'bg-gradient-to-r from-[#15803d] via-[#22c55e] to-[#86efac]',
        checkBg: 'border-[#22c55e] bg-[#22c55e] text-black shadow-[0_0_12px_rgba(34,197,94,0.5)]',
        quickBtn: 'border-[#22c55e]/30 bg-[#22c55e]/10 text-[#22c55e] hover:bg-[#22c55e]/20',
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
        progressFill: 'bg-gradient-to-r from-[#a21caf] via-[#d946ef] to-[#f5d0fe]',
        checkBg: 'border-[#d946ef] bg-[#d946ef] text-white shadow-[0_0_12px_rgba(217,70,239,0.5)]',
        quickBtn: 'border-[#d946ef]/30 bg-[#d946ef]/10 text-[#d946ef] hover:bg-[#d946ef]/20',
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
      progressFill: 'bg-gradient-to-r from-[var(--mvz-gold)] via-[var(--mvz-gold-light)] to-white',
      checkBg: 'border-[var(--mvz-gold)] bg-[var(--mvz-gold)] text-black shadow-[0_0_12px_rgba(212,175,55,0.5)]',
      quickBtn: 'border-[var(--mvz-gold)]/30 bg-[var(--mvz-gold)]/10 text-[var(--mvz-gold-light)] hover:bg-[var(--mvz-gold)]/20',
    };
  }, [activeTier]);

  const maxDailyValue = useMemo(() => {
    const highest = Math.max(...dailyData.map((d) => d.amount), 0);
    return highest > 0 ? Math.ceil(highest * 1.25) : activeTier.defaultChartDailyMax;
  }, [dailyData, activeTier.defaultChartDailyMax]);

  const maxWeeklyValue = useMemo(() => {
    const highest = Math.max(...weeklyData.map((w) => w.amount), 0);
    return highest > 0 ? Math.ceil(highest * 1.25) : activeTier.defaultChartWeeklyMax;
  }, [weeklyData, activeTier.defaultChartWeeklyMax]);

  /* ───── Ações do Usuário (todas salvam 100% no Supabase!) ───── */

  const toggleStep = (stepId: number) => {
    setPlansData((prev) => {
      const tierState = prev[activeTierId] || emptyPlanData();
      const prevToday = tierState.completedByDate?.[todayKey] || [];
      const nextToday = prevToday.includes(stepId)
        ? prevToday.filter((id) => id !== stepId)
        : [...prevToday, stepId];

      const nextPlans: PlansDataMap = {
        ...prev,
        [activeTierId]: {
          ...tierState,
          completedByDate: {
            ...tierState.completedByDate,
            [todayKey]: nextToday,
          },
          dailyMissionsByDate: {
            ...tierState.dailyMissionsByDate,
            [todayKey]: todayMissionPack,
          },
        },
      };
      persistJourney(activeTierId, nextPlans);
      return nextPlans;
    });
  };

  const parseInputValue = (val: string): number => {
    if (!val) return 0;
    let cleaned = val.replace(/[^\d,.]/g, '').trim();
    if (cleaned.includes(',') && cleaned.includes('.')) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else if (cleaned.includes(',')) {
      cleaned = cleaned.replace(',', '.');
    }
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(val);

  const formatShortCurrency = (val: number) => {
    if (val >= 1000) {
      return `R$ ${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k`;
    }
    return `R$ ${Math.round(val)}`;
  };

  const handleRegisterRevenue = (customAmount?: number) => {
    const amountToAdd = customAmount !== undefined ? customAmount : parseInputValue(inputVal);
    if (amountToAdd <= 0) return;

    setPlansData((prev) => {
      const tierState = prev[activeTierId] || emptyPlanData();
      const prevAmt = Number(tierState.revenueByDate?.[todayKey]) || 0;
      const prevDone = tierState.completedByDate?.[todayKey] || [];
      const nextDone = prevDone.includes(4) ? prevDone : [...prevDone, 4];

      const nextPlans: PlansDataMap = {
        ...prev,
        [activeTierId]: {
          ...tierState,
          revenueByDate: {
            ...tierState.revenueByDate,
            [todayKey]: Number((prevAmt + amountToAdd).toFixed(2)),
          },
          completedByDate: {
            ...tierState.completedByDate,
            [todayKey]: nextDone,
          },
          dailyMissionsByDate: {
            ...tierState.dailyMissionsByDate,
            [todayKey]: todayMissionPack,
          },
        },
      };
      persistJourney(activeTierId, nextPlans);
      return nextPlans;
    });

    setInputVal('');
    setFeedbackMsg(`+ ${formatCurrency(amountToAdd)} salvo no plano ${activeTier.badge}!`);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleResetData = () => {
    setPlansData((prev) => {
      const nextPlans: PlansDataMap = {
        ...prev,
        [activeTierId]: emptyPlanData(),
      };
      persistJourney(activeTierId, nextPlans);
      return nextPlans;
    });
    setFeedbackMsg(`Histórico do plano ${activeTier.badge} zerado com sucesso!`);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleActivateMission = (tier: TierConfig, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveTierId(tier.id);
    persistJourney(tier.id, plansData);
    setScreenMode('execution');
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [screenMode]);

  /* ══════════════════════════════════════════════════════════════════
     TELA 2: PAINEL DE EXECUÇÃO PERSONALIZADO DO PLANO ESCOLHIDO
  ══════════════════════════════════════════════════════════════════ */
  if (screenMode === 'execution') {
    const checklistProgress = Math.round((completedSteps.length / 4) * 100);
    const weekdayName = getWeekdayPt(todayKey);

    return (
      <div className="mvz-fade-up pb-24 space-y-6 max-w-7xl mx-auto">
        {/* ── 1. Barra Superior: Voltar + Troca Rápida de Plano + Status de Nuvem ── */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setScreenMode('selection')}
              className="group inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-[12px] font-bold text-white/80 transition-all duration-200 hover:border-[var(--mvz-gold)]/60 hover:bg-white/[0.07] hover:text-[var(--mvz-gold-light)]"
            >
              <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-1 text-[var(--mvz-gold)]" />
              <span>Trocar Plano</span>
            </button>

            {/* Seletor rápido entre os 3 planos independentes */}
            <div className="hidden sm:flex items-center gap-1 rounded-xl border border-white/10 bg-black/50 p-1">
              {MISSION_TIERS.map((t) => {
                const selected = t.id === activeTierId;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleActivateMission(t)}
                    className={`rounded-lg px-3 py-1.5 text-[10.5px] font-extrabold uppercase tracking-wider transition ${
                      selected
                        ? `${tierTheme.badgeBg} ${tierTheme.badgeText} border ${tierTheme.badgeBorder}`
                        : 'text-white/45 hover:text-white/80'
                    }`}
                  >
                    {t.badge}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {streakDays > 0 && (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-bold text-amber-300">
                <Flame size={13} className="text-amber-400" />
                <span>{streakDays} {streakDays === 1 ? 'dia em sequência' : 'dias em sequência'}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleResetData}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.02] px-3.5 py-2 text-[11px] font-bold text-white/60 transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300"
              title="Zerar ganhos e tarefas deste plano"
            >
              <RotateCcw size={13} />
              <span>Zerar Plano</span>
            </button>

            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-[11px] font-semibold text-white/80">
              {syncStatus === 'saving' || syncStatus === 'loading' ? (
                <>
                  <Loader2 size={12} className="animate-spin text-[var(--mvz-gold)]" />
                  <span>Sincronizando...</span>
                </>
              ) : syncStatus === 'synced' ? (
                <>
                  <Cloud size={13} className="text-[#22c55e]" />
                  <span className="text-[#22c55e]">Salvo na Nuvem</span>
                </>
              ) : (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--mvz-gold)]" />
                  <span>Salvo Localmente</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── 2. Cabeçalho Personalizado do Plano Ativo + Parâmetros Exclusivos ── */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between pt-1 pb-1">
          <div className="space-y-1.5">
            <div className="inline-flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full border ${tierTheme.badgeBorder} ${tierTheme.badgeBg} px-3 py-1 text-[10.5px] font-extrabold uppercase tracking-[0.22em] ${tierTheme.badgeText} shadow-sm`}>
                <span className={`h-1.5 w-1.5 rounded-full ${tierTheme.dotBg} animate-pulse`} />
                MISSÃO ATIVA
              </span>
              <span className="text-[11.5px] font-bold text-white/55">
                {activeTier.focusTitle}
              </span>
            </div>

            <h1 className="text-[32px] sm:text-[42px] font-black uppercase tracking-tight text-white leading-none">
              {activeTier.badge}
            </h1>
          </div>

          {/* 3 Pílulas de Parâmetros Exclusivos deste Plano */}
          <div className="grid grid-cols-3 gap-2.5 sm:w-auto">
            <div className="rounded-2xl border border-white/10 bg-[#0d0c0a] px-3.5 py-2.5">
              <span className="block text-[9.5px] font-extrabold uppercase tracking-wider text-white/40">Alvo Diário</span>
              <span className={`text-[12.5px] font-black ${tierTheme.badgeText}`}>{activeTier.targetDailyRevenue}</span>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#0d0c0a] px-3.5 py-2.5">
              <span className="block text-[9.5px] font-extrabold uppercase tracking-wider text-white/40">Ritmo Diário</span>
              <span className="text-[12.5px] font-black text-white">{activeTier.videosPerDay}</span>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#0d0c0a] px-3.5 py-2.5">
              <span className="block text-[9.5px] font-extrabold uppercase tracking-wider text-white/40">Conversão</span>
              <span className="text-[12.5px] font-black text-white">{activeTier.salesPerDay}</span>
            </div>
          </div>
        </div>

        {/* ── 3. Grid Principal ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          {/* ══════════════════════════════════════════════════════════════
              COLUNA ESQUERDA (5 Colunas): Dica do Dia + 4 Missões Diárias Inéditas
          ══════════════════════════════════════════════════════════════ */}
          <div className="space-y-6 lg:col-span-5">
            {/* ── Card: Diretriz Tática de Hoje ── */}
            <div className={`relative overflow-hidden rounded-[24px] border ${tierTheme.cardBorderGlow} bg-[#0d0c0a] p-6 sm:p-7 shadow-[0_16px_45px_rgba(0,0,0,0.85)]`}>
              <Lightbulb
                size={130}
                className="pointer-events-none absolute -right-6 -bottom-6 text-white/[0.025] stroke-1"
              />

              <div className="relative z-10 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${tierTheme.iconBg}`}>
                    <Lightbulb size={15} />
                  </div>
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-white/90">
                    DIRETRIZ DE HOJE • {weekdayName.toUpperCase()}
                  </h3>
                </div>
                <span className="text-[10.5px] font-mono text-white/40">{formatDateBr(todayKey)}</span>
              </div>

              <p className="relative z-10 mt-4 text-[13px] sm:text-[13.5px] leading-relaxed text-white/80">
                {todayMissionPack.tip}
              </p>
            </div>

            {/* ── Card: 4 Missões Diárias (Renovadas Todo Santo Dia!) ── */}
            <div className="relative rounded-[24px] border border-white/10 bg-[#0d0c0a] p-6 sm:p-7 shadow-[0_16px_45px_rgba(0,0,0,0.85)]">
              <div className="pb-5 border-b border-white/[0.08]">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${tierTheme.iconBg}`}>
                      <CheckCircle2 size={16} />
                    </div>
                    <div>
                      <h3 className="text-[14.5px] font-black tracking-tight text-white">
                        Missões de Hoje ({formatDateBr(todayKey)})
                      </h3>
                      <p className="text-[11px] text-white/50 font-medium">
                        4 tarefas inéditas por dia calibradas para {activeTier.badge}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => generatePersonalizedDailyMissions(activeTier, todayKey, true)}
                      disabled={generatingMissions}
                      title="Sortear e gerar 4 novas missões táticas para hoje"
                      className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] font-bold text-white/70 transition hover:border-white/25 hover:text-white disabled:opacity-50"
                    >
                      <RefreshCw size={11} className={generatingMissions ? 'animate-spin text-[var(--mvz-gold)]' : ''} />
                      <span>{generatingMissions ? 'Gerando...' : 'Renovar'}</span>
                    </button>

                    <span className={`rounded-full border ${tierTheme.badgeBorder} ${tierTheme.badgeBg} px-2.5 py-0.5 text-[10.5px] font-bold ${tierTheme.badgeText}`}>
                      {completedSteps.length} de 4
                    </span>
                  </div>
                </div>

                {/* Barra de Progresso das 4 Tarefas de Hoje */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-[10.5px] font-bold text-white/60 mb-1.5">
                    <span>Execução Diária ({weekdayName})</span>
                    <span className={tierTheme.badgeText}>{checklistProgress}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      style={{ width: `${checklistProgress}%` }}
                      className={`h-full rounded-full ${tierTheme.progressFill} transition-all duration-500`}
                    />
                  </div>
                </div>
              </div>

              {/* Lista das 4 Missões de Hoje */}
              <div className="relative mt-5 space-y-3.5">
                {todayMissionPack.steps.map((step) => {
                  const isDone = completedSteps.includes(step.id);

                  return (
                    <div
                      key={`${todayKey}-${activeTierId}-${step.id}-${step.title}`}
                      onClick={() => toggleStep(step.id)}
                      className={`group relative flex cursor-pointer items-start gap-3.5 rounded-xl border p-3.5 transition-all duration-200 ${
                        isDone
                          ? 'border-white/15 bg-white/[0.03]'
                          : 'border-white/[0.06] bg-black/40 hover:border-white/20 hover:bg-white/[0.02]'
                      }`}
                    >
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

                      <div className="flex-1 min-w-0">
                        <h4
                          className={`text-[13px] font-bold leading-snug transition-colors duration-200 ${
                            isDone ? 'text-white/80 line-through decoration-white/40' : 'text-white'
                          }`}
                        >
                          {step.title}
                        </h4>
                        <p className="mt-1 text-[11.5px] leading-relaxed text-white/55">
                          {step.description}
                        </p>

                        {onNavigate && step.toolView && step.toolLabel && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigate(step.toolView!);
                            }}
                            className={`mt-2.5 inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[10.5px] font-bold transition ${tierTheme.quickBtn}`}
                          >
                            <span>{step.toolLabel}</span>
                            <ArrowUpRight size={11} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="mt-4 text-center text-[10.5px] text-white/35">
                Novas 4 missões táticas liberadas automaticamente à meia-noite.
              </p>

              {checklistProgress === 100 && (
                <div className={`mt-4 flex items-center gap-2.5 rounded-xl border ${tierTheme.badgeBorder} ${tierTheme.badgeBg} p-3 text-[11.5px] font-bold ${tierTheme.badgeText} animate-fade-in`}>
                  <Award size={16} className="shrink-0" />
                  <span>Meta operacional cumprida hoje! Seu progresso está salvo na nuvem.</span>
                </div>
              )}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              COLUNA DIREITA (7 Colunas): Registro + Meta do Plano + Gráfico Real
          ══════════════════════════════════════════════════════════════ */}
          <div className="space-y-6 lg:col-span-7">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {/* Card 1: REGISTRAR GANHOS HOJE (Atalhos calibrados para o plano!) */}
              <div className="relative rounded-[24px] border border-white/10 bg-[#0d0c0a] p-5 sm:p-6 shadow-[0_16px_45px_rgba(0,0,0,0.85)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/60">
                      REGISTRAR COMISSÃO HOJE
                    </span>
                    <span className={`text-[10px] font-bold ${tierTheme.badgeText}`}>
                      Alvo: {activeTier.targetDailyRevenue}
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
                        placeholder={`Ex: ${formatCurrency(activeTier.quickAmounts[1])}`}
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

                  {/* Atalhos Rápidos Exclusivos do Plano Ativo */}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="text-[9.5px] font-bold uppercase tracking-wider text-white/40">Rápido:</span>
                    <button
                      type="button"
                      onClick={() => handleRegisterRevenue(activeTier.quickAmounts[0])}
                      className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] font-bold text-white/70 hover:border-white/30 hover:text-white transition"
                    >
                      + R$ {activeTier.quickAmounts[0]}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRegisterRevenue(activeTier.quickAmounts[1])}
                      className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] font-bold text-white/70 hover:border-white/30 hover:text-white transition"
                    >
                      + R$ {activeTier.quickAmounts[1]}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRegisterRevenue(activeTier.quickAmounts[2])}
                      className={`rounded-lg border px-2 py-1 text-[10px] font-bold transition ${tierTheme.quickBtn}`}
                    >
                      + R$ {activeTier.quickAmounts[2]}
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

              {/* Card 2: ACUMULADO & BARRA DE META DO PLANO */}
              <div className="relative overflow-hidden rounded-[24px] border border-[var(--mvz-gold)]/20 bg-gradient-to-b from-[#13110d] to-[#0a0907] p-5 sm:p-6 shadow-[0_16px_45px_rgba(0,0,0,0.85)] flex flex-col justify-between">
                <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[var(--mvz-gold)]/10 blur-2xl" />

                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/60">
                      {activeTier.id === 'month'
                        ? 'ACUMULADO 30 DIAS (META R$ 1.000)'
                        : activeTier.id === 'week'
                        ? 'ACUMULADO SEMANA (META R$ 1.000)'
                        : 'ACUMULADO HOJE (META R$ 1.000)'}
                    </span>
                    <div className="mt-2 text-[26px] sm:text-[30px] font-black tracking-tight text-white">
                      {formatCurrency(
                        activeTier.id === 'month'
                          ? totalLast30Days
                          : activeTier.id === 'week'
                          ? currentWeekEarnings
                          : todayEarnings
                      )}
                    </div>
                  </div>

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/80 shadow-inner">
                    <DollarSign size={20} strokeWidth={2.4} />
                  </div>
                </div>

                {/* Barra de Atingimento da Meta de R$ 1.000 do Plano */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[10px] font-bold text-white/55 mb-1">
                    <span>{activeTier.periodLabel}</span>
                    <span className={tierTheme.badgeText}>{goalProgressPercent}% de R$ 1.000,00</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]">
                    <div
                      style={{ width: `${goalProgressPercent}%` }}
                      className={`h-full rounded-full ${tierTheme.progressFill} transition-all duration-500`}
                    />
                  </div>
                </div>

                {/* Sub-métricas: Hoje, Semana e 30 Dias */}
                <div className="mt-3.5 grid grid-cols-3 gap-2 rounded-xl border border-white/[0.06] bg-black/40 p-2.5">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-white/40 block font-bold">Hoje</span>
                    <span className={`text-[11.5px] font-extrabold ${todayEarnings > 0 ? tierTheme.badgeText : 'text-white/60'}`}>
                      {formatCurrency(todayEarnings)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-white/40 block font-bold">7 Dias</span>
                    <span className={`text-[11.5px] font-extrabold ${currentWeekEarnings > 0 ? tierTheme.badgeText : 'text-white/60'}`}>
                      {formatCurrency(currentWeekEarnings)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-white/40 block font-bold">30 Dias</span>
                    <span className="text-[11.5px] font-extrabold text-white/85">
                      {formatCurrency(totalLast30Days)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Card: Evolução Financeira do Plano ── */}
            <div className="relative rounded-[24px] border border-white/10 bg-[#0d0c0a] p-6 sm:p-7 shadow-[0_16px_45px_rgba(0,0,0,0.85)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <BarChart3 size={18} className="text-[var(--mvz-gold)]" />
                    <h3 className="text-[17px] font-bold text-white tracking-tight">
                      Evolução — {activeTier.badge}
                    </h3>
                  </div>
                  <p className="mt-0.5 text-[11.5px] font-medium text-white/50">
                    {chartMode === 'daily'
                      ? `Últimos 7 dias deste plano · Alvo diário ${activeTier.targetDailyRevenue}`
                      : 'Últimas 4 semanas consolidadas na nuvem'}
                  </p>
                </div>

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

              <div className="mt-4 flex items-center justify-between border-b border-white/[0.06] pb-3 text-[11px]">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-0.5 font-bold text-white/80">
                  <TrendingUp size={12} className="text-[#22c55e]" />
                  <span>Meta Projetada: {activeTier.targetMonthlyRevenue}</span>
                </div>

                <div className="text-white/50 font-medium text-[11px]">
                  Escala do Gráfico:{' '}
                  <strong className="text-white">
                    {formatCurrency(chartMode === 'daily' ? maxDailyValue : maxWeeklyValue)}
                  </strong>
                </div>
              </div>

              <div className="relative mt-6 h-[240px] w-full flex flex-col justify-end">
                <div className="pointer-events-none absolute inset-0 flex flex-col justify-between opacity-30">
                  <div className="border-b border-dashed border-white/20 w-full" />
                  <div className="border-b border-dashed border-white/15 w-full" />
                  <div className="border-b border-white/10 w-full" />
                </div>

                {chartMode === 'daily' && (
                  <div className="relative z-10 grid grid-cols-7 gap-2 sm:gap-4 h-[210px] items-end w-full">
                    {dailyData.map((d) => {
                      const isToday = d.id === 'today';
                      const isZero = d.amount <= 0;
                      const heightPercent = isZero
                        ? 2
                        : Math.max(8, Math.min(100, Math.round((d.amount / maxDailyValue) * 100)));

                      return (
                        <div
                          key={d.dateKey}
                          className="group/bar relative flex flex-col items-center justify-end h-full"
                        >
                          <div className="pointer-events-none absolute -top-8 z-30 opacity-0 group-hover/bar:opacity-100 transition-opacity rounded-md border border-[var(--mvz-gold)]/40 bg-black/95 px-2 py-1 text-[10px] font-black text-[var(--mvz-gold-light)] shadow-xl whitespace-nowrap">
                            {d.sublabel}: {formatCurrency(d.amount)}
                          </div>

                          {isToday && d.amount > 0 && (
                            <span className={`mb-1 text-[10px] font-extrabold ${tierTheme.badgeText} drop-shadow`}>
                              {formatShortCurrency(d.amount)}
                            </span>
                          )}

                          <div className="relative w-full max-w-[48px] h-[160px] flex items-end justify-center rounded-xl bg-white/[0.03] p-1 border border-white/[0.04]">
                            <div
                              style={{ height: `${heightPercent}%` }}
                              className={`w-full rounded-lg transition-all duration-700 ease-out ${
                                isZero
                                  ? 'bg-white/[0.05] border border-dashed border-white/[0.08]'
                                  : isToday
                                  ? `${tierTheme.barGradient} brightness-110`
                                  : 'bg-[#1c1a16] border border-white/[0.1] hover:border-white/30 hover:bg-[#2a2620]'
                              }`}
                            />
                          </div>

                          <span
                            className={`mt-2 text-[10.5px] font-black uppercase tracking-wider ${
                              isToday ? tierTheme.badgeText : 'text-white/45'
                            }`}
                          >
                            {d.label}
                          </span>
                          <span className="text-[9px] text-white/30">{d.sublabel}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {chartMode === 'weekly' && (
                  <div className="relative z-10 grid grid-cols-4 gap-4 sm:gap-8 h-[210px] items-end w-full">
                    {weeklyData.map((w) => {
                      const isCurrentWeek = w.id === 'w-cur';
                      const isZero = w.amount <= 0;
                      const heightPercent = isZero
                        ? 2
                        : Math.max(8, Math.min(100, Math.round((w.amount / maxWeeklyValue) * 100)));

                      return (
                        <div
                          key={w.id}
                          className="group/bar relative flex flex-col items-center justify-end h-full"
                        >
                          <div className="pointer-events-none absolute -top-8 z-30 opacity-0 group-hover/bar:opacity-100 transition-opacity rounded-md border border-white/20 bg-black/95 px-2 py-1 text-[10px] font-black text-white shadow-xl whitespace-nowrap">
                            {formatCurrency(w.amount)}
                          </div>

                          {isCurrentWeek && w.amount > 0 && (
                            <span className={`mb-1 text-[10.5px] font-extrabold ${tierTheme.badgeText} drop-shadow`}>
                              {formatShortCurrency(w.amount)}
                            </span>
                          )}

                          <div className="relative w-full max-w-[64px] h-[160px] flex items-end justify-center rounded-xl bg-white/[0.03] p-1.5 border border-white/[0.04]">
                            <div
                              style={{ height: `${heightPercent}%` }}
                              className={`w-full rounded-lg transition-all duration-700 ease-out ${
                                isZero
                                  ? 'bg-white/[0.05] border border-dashed border-white/[0.08]'
                                  : isCurrentWeek
                                  ? `${tierTheme.barGradient} brightness-110`
                                  : 'bg-[#1c1a16] border border-white/[0.1] hover:border-white/30 hover:bg-[#2a2620]'
                              }`}
                            />
                          </div>

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

              <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-white/[0.06] pt-3.5 text-[11px] text-white/50">
                <div>
                  Acumulado no período:{' '}
                  <strong className="text-white font-bold">
                    {formatCurrency(
                      chartMode === 'daily'
                        ? dailyData.reduce((a, b) => a + b.amount, 0)
                        : weeklyData.reduce((a, b) => a + b.amount, 0)
                    )}
                  </strong>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <span>Hoje: <strong className="text-white font-bold">{formatCurrency(todayEarnings)}</strong></span>
                  <span className="text-white/20">|</span>
                  <span>7 dias: <strong className="text-white font-bold">{formatCurrency(currentWeekEarnings)}</strong></span>
                  <span className="text-white/20">|</span>
                  <span className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${tierTheme.dotBg}`} />
                    <span className={`${tierTheme.badgeText} font-semibold`}>
                      Plano {activeTier.badge}
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
     TELA 1: ESCOLHA DE METAS (3 PLANOS INDEPENDENTES COM RESUMO PRÓPRIO)
  ══════════════════════════════════════════════════════════════════ */
  return (
    <div className="mvz-fade-up pb-16">
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
              Plano de Ação Personalizado
            </span>
          </div>

          <h1 className="mt-5 text-[32px] font-black tracking-tight text-white sm:text-[44px] lg:text-[50px] leading-[1.06]">
            DEFINA A META <br />
            <span className="mvz-grad-text drop-shadow-[0_2px_18px_rgba(212,175,55,0.4)]">
              ACERTE O ALVO
            </span>
          </h1>

          <p className="mt-4 max-w-xl text-[14px] leading-relaxed text-white/85 sm:text-[15px]">
            Cada meta possui sua própria estratégia, volume diário e 4 missões inéditas liberadas todos os dias, com todo o seu progresso salvo na nuvem.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {MISSION_TIERS.map((tier) => {
          const isActive = activeTierId === tier.id;
          const tierDoneToday = plansData[tier.id]?.completedByDate?.[todayKey]?.length || 0;

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
              className={`group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-[26px] border h-[440px] sm:h-[465px] bg-black shadow-[0_20px_55px_rgba(0,0,0,0.95)] transition-all duration-300 hover:-translate-y-1.5 ${theme.borderCard}`}
            >
              <img
                src={tier.imageUrl}
                alt={`Insígnia ${tier.badge}`}
                className="absolute inset-0 h-full w-full object-cover object-center select-none pointer-events-none scale-100 transition-transform duration-700 ease-out group-hover:scale-105"
                loading="lazy"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/95 via-black/70 to-transparent" />

              <div className="relative z-10 pt-6 sm:pt-7 px-5 text-center select-none">
                <span
                  className={`text-[12px] font-extrabold uppercase tracking-[0.25em] drop-shadow-md ${theme.badgeColor}`}
                >
                  {tier.badge}
                </span>
                {tierDoneToday > 0 && (
                  <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/70 px-2.5 py-0.5 text-[10px] font-bold text-white/85 backdrop-blur-md">
                    <Check size={11} className={theme.badgeColor} />
                    <span>Hoje: {tierDoneToday}/4 missões</span>
                  </div>
                )}
              </div>

              <div className="relative z-0 flex-1" />

              <div className="relative z-10 p-6 pt-0 space-y-3">
                <div className="text-center">
                  <div className="text-[11px] font-extrabold text-white/90">{tier.targetDailyRevenue}</div>
                  <p className="mt-0.5 text-[10.5px] text-white/60 leading-snug">{tier.cardSummary}</p>
                </div>

                <button
                  onClick={(e) => handleActivateMission(tier, e)}
                  className={`flex h-11 w-full items-center justify-center gap-2 rounded-xl border text-[11.5px] font-bold uppercase tracking-[0.2em] backdrop-blur-md transition-all duration-200 ${theme.buttonStyle}`}
                >
                  <Zap size={13} className={isActive ? 'fill-current' : theme.iconColor} />
                  <span>{isActive ? 'ABRIR PLANO ATIVO' : 'ATIVAR ESTE PLANO'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { getUserDisplayName } from './useUserProfile';
import { aiGenerateJSON, shuffle, pickOne, jitter } from './aiGenerate';

export interface StoreAuditRequest {
  storeName: string;
  storeLink: string;
  itemsSold: number;
  responseRate: number;
  onTimeRate: number;
  freeSampleAvailable: boolean;
}

export interface MetricDiagnostic {
  label: string;
  value: string;
  status: 'Excelente' | 'Bom' | 'Alerta' | 'Crítico';
  explanation: string;
}

export interface OperationalPillar {
  title: string;
  status: 'Aprovado' | 'Atenção' | 'Risco';
  detail: string;
}

export interface StoreAuditResult {
  name: string;
  score: number;
  badge: 'Diamante' | 'Ouro' | 'Prata' | 'Alerta';
  verdict: string;
  summary: string;
  metrics: MetricDiagnostic[];
  pillars: OperationalPillar[];
  strengths: string[];
  warnings: string[];
  partnershipScript: string;
  negotiationTips: string[];
}

type MetricStatus = MetricDiagnostic['status'];
type PillarStatus = OperationalPillar['status'];
type Badge = StoreAuditResult['badge'];

export function extractStoreTitle(rawName: string, rawLink: string): string {
  const trimmedName = rawName.trim();
  if (trimmedName) return trimmedName;

  const trimmedLink = rawLink.trim();
  if (trimmedLink) {
    try {
      const clean = trimmedLink.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
      const parts = clean.split('/').filter(Boolean);
      // Look for @handle
      const handlePart = parts.find((p) => p.startsWith('@'));
      if (handlePart) {
        const cleanHandle = handlePart.replace('@', '').replace(/[_-]/g, ' ');
        return cleanHandle.charAt(0).toUpperCase() + cleanHandle.slice(1);
      }
      if (parts.length > 0) {
        const last = parts[parts.length - 1];
        if (last.length > 2) {
          const decoded = decodeURIComponent(last).replace(/[-_]+/g, ' ');
          return decoded.charAt(0).toUpperCase() + decoded.slice(1);
        }
      }
    } catch {
      // ignore
    }
    return 'Lojista TikTok Shop';
  }

  return 'Loja Oficial TikTok Shop';
}

/* ───────────────────────── Base determinística (coerência) ───────────────────────── */

interface BaseScores {
  onTimePoints: number;
  onTimeStatus: MetricStatus;
  responsePoints: number;
  responseStatus: MetricStatus;
  salesPoints: number;
  salesStatus: MetricStatus;
  samplePoints: number;
  total: number;
  badge: Badge;
}

function computeBase(req: StoreAuditRequest): BaseScores {
  let onTimePoints = 5;
  let onTimeStatus: MetricStatus = 'Crítico';
  if (req.onTimeRate >= 98) [onTimePoints, onTimeStatus] = [40, 'Excelente'];
  else if (req.onTimeRate >= 95) [onTimePoints, onTimeStatus] = [36, 'Excelente'];
  else if (req.onTimeRate >= 90) [onTimePoints, onTimeStatus] = [26, 'Bom'];
  else if (req.onTimeRate >= 80) [onTimePoints, onTimeStatus] = [15, 'Alerta'];

  let responsePoints = 5;
  let responseStatus: MetricStatus = 'Crítico';
  if (req.responseRate >= 96) [responsePoints, responseStatus] = [25, 'Excelente'];
  else if (req.responseRate >= 90) [responsePoints, responseStatus] = [20, 'Bom'];
  else if (req.responseRate >= 80) [responsePoints, responseStatus] = [12, 'Alerta'];

  let salesPoints = 6;
  let salesStatus: MetricStatus = 'Alerta';
  if (req.itemsSold >= 8000) [salesPoints, salesStatus] = [25, 'Excelente'];
  else if (req.itemsSold >= 3000) [salesPoints, salesStatus] = [22, 'Excelente'];
  else if (req.itemsSold >= 1000) [salesPoints, salesStatus] = [18, 'Bom'];
  else if (req.itemsSold >= 300) [salesPoints, salesStatus] = [12, 'Bom'];

  const samplePoints = req.freeSampleAvailable ? 10 : 3;
  const total = Math.min(100, Math.max(15, onTimePoints + responsePoints + salesPoints + samplePoints));

  return {
    onTimePoints,
    onTimeStatus,
    responsePoints,
    responseStatus,
    salesPoints,
    salesStatus,
    samplePoints,
    total,
    badge: badgeFor(total),
  };
}

function badgeFor(score: number): Badge {
  if (score >= 90) return 'Diamante';
  if (score >= 80) return 'Ouro';
  if (score >= 68) return 'Prata';
  return 'Alerta';
}

const BADGE_BANDS: Record<Badge, [number, number]> = {
  Diamante: [90, 100],
  Ouro: [80, 89],
  Prata: [68, 79],
  Alerta: [15, 67],
};

/** Score coerente: varia levemente em torno da base, sem trocar de faixa/selo. */
function coherentScore(base: BaseScores, proposed?: number): number {
  const [lo, hi] = BADGE_BANDS[base.badge];
  const raw = typeof proposed === 'number' && Number.isFinite(proposed) ? proposed : jitter(base.total, 3, 15, 100);
  const nearBase = Math.max(base.total - 5, Math.min(base.total + 5, Math.round(raw)));
  return Math.max(lo, Math.min(hi, nearBase));
}

function fmtItems(n: number) {
  return n >= 10000 ? '10.000+' : n.toLocaleString('pt-BR');
}

/* ───────────────────────── Fallback local variado ───────────────────────── */

const EXPLAIN: Record<'onTime' | 'response' | 'sales', Record<MetricStatus, string[]>> = {
  onTime: {
    Excelente: [
      'Postagem dentro do SLA de 48h quase sem exceções — comissão protegida contra cancelamento.',
      'Despacho no padrão de excelência exigido pelo TikTok Shop, ideal para escalar vídeos.',
      'Pedidos saem no prazo mesmo em pico; risco mínimo de estorno de comissão.',
      'Logística afinada: o cliente recebe rápido e as avaliações tendem a subir.',
    ],
    Bom: [
      'Aceitável, mas com pequenos gargalos em dias de alto volume.',
      'Bom ritmo de envio; vale monitorar em datas promocionais.',
      'Prazo cumprido na maioria dos pedidos, com atrasos pontuais em picos.',
    ],
    Alerta: [
      'Atrasos frequentes podem gerar cancelamentos e derrubar sua comissão.',
      'Ritmo de despacho instável — combine prazos antes de divulgar forte.',
      'Parte relevante dos pedidos sai fora do SLA; risco real de reclamação.',
    ],
    Crítico: [
      'Risco severo de atrasos e cancelamentos de pedidos.',
      'SLA muito abaixo do mínimo; vendas podem virar estorno.',
      'Envio fora do prazo em larga escala — evite tráfego pago aqui.',
    ],
  },
  response: {
    Excelente: [
      'Responde rápido no chat oficial, convertendo dúvidas em compra na hora.',
      'Atendimento ágil que reduz devolução por falta de informação.',
      'Chat ativo e veloz: o comprador indeciso é atendido antes de desistir.',
    ],
    Bom: [
      'Atendimento dentro do prazo regular de 24 horas.',
      'Responde bem, mas pode demorar em horários de pico.',
      'Suporte consistente, com espaço para ganhar velocidade.',
    ],
    Alerta: [
      'Demora nas respostas pode frustrar dúvidas de clientes.',
      'Algumas mensagens ficam sem retorno — risco de abandono de carrinho.',
      'Atendimento irregular; antecipe as dúvidas comuns no seu vídeo.',
    ],
    Crítico: [
      'Atendimento lento; risco alto de abandono no carrinho.',
      'Muitas mensagens sem resposta — pós-venda fragilizado.',
      'Suporte quase ausente; o cliente fica sem ajuda após a compra.',
    ],
  },
  sales: {
    Excelente: [
      'Operação madura com fornecimento contínuo de mercadorias.',
      'Volume que comprova demanda e estoque preparado para viralizar.',
      'Histórico robusto de pedidos — prova social forte para o seu vídeo.',
    ],
    Bom: [
      'Volume consistente em tração de crescimento.',
      'Catálogo validado com centenas de pedidos entregues.',
      'Demanda comprovada, ainda com espaço para crescer junto com afiliados.',
    ],
    Alerta: [
      'Loja recente com histórico inicial de vendas.',
      'Poucos pedidos até aqui — valide estoque antes de escalar.',
      'Operação em fase inicial; bom para negociar condições exclusivas.',
    ],
    Crítico: ['Histórico de vendas insuficiente para avaliar.', 'Quase sem vendas registradas até o momento.'],
  },
};

const VERDICTS: Record<Badge, string[]> = {
  Diamante: [
    'Fornecedor Diamante · Homologado para Escala e Tráfego Pago',
    'Selo Diamante · Parceiro Prioritário para Escalar com Segurança',
    'Diamante · Operação Pronta para Viralização e Anúncios',
  ],
  Ouro: [
    'Fornecedor Ouro · Seguro para Afiliados e Parcerias Oficiais',
    'Selo Ouro · Confiável para Amostras e Vitrine',
    'Ouro · Parceiro Sólido com Indicadores Saudáveis',
  ],
  Prata: [
    'Fornecedor Prata · Operação Regular com Monitoramento',
    'Selo Prata · Viável no Orgânico, Cautela no Pago',
    'Prata · Bom Potencial com Pontos a Alinhar',
  ],
  Alerta: [
    'Fornecedor em Risco Operacional · Atenção Redobrada',
    'Alerta · Risco de Cancelamento e Comissão Estornada',
    'Selo Alerta · Só Avance Após Alinhar Prazos e Estoque',
  ],
};

function buildSummary(name: string, req: StoreAuditRequest, badge: Badge): string {
  const items = fmtItems(req.itemsSold);
  const pools: Record<Badge, string[]> = {
    Diamante: [
      `A ${name} entrega um padrão de topo: ${req.onTimeRate}% de envios no prazo, ${req.responseRate}% de resposta no chat e ${items} itens vendidos. Estrutura pronta para aguentar picos de vídeos virais.`,
      `Com ${items} pedidos e ${req.onTimeRate}% de pontualidade, a ${name} é o tipo de fornecedor que sustenta tráfego pago sem quebrar a experiência do comprador.`,
      `Indicadores de elite na ${name}: atendimento a ${req.responseRate}% e SLA de ${req.onTimeRate}%. Ideal para concentrar esforço de conteúdo e escalar.`,
    ],
    Ouro: [
      `A ${name} mostra saúde sólida no Seller Center (${req.onTimeRate}% no prazo, ${req.responseRate}% de resposta). Ótima parceira para amostras e conteúdos com a sacola amarela.`,
      `Loja confiável: ${items} itens vendidos e chat respondendo ${req.responseRate}% das mensagens. Dá para divulgar com tranquilidade e testar escala aos poucos.`,
      `A ${name} tem base consistente para afiliados. Com ${req.onTimeRate}% de pontualidade, o risco de comissão estornada é baixo.`,
    ],
    Prata: [
      `A ${name} é viável para afiliação orgânica, mas alinhe estoque e prazos antes de colocar anúncios — ${req.onTimeRate}% de pontualidade pede monitoramento.`,
      `Operação regular: ${items} itens vendidos e ${req.responseRate}% de resposta. Funciona bem para testes, com cautela ao escalar.`,
      `A ${name} tem potencial, porém precisa provar consistência. Comece com vídeos orgânicos e acompanhe cancelamentos.`,
    ],
    Alerta: [
      `A ${name} está abaixo do padrão recomendado: ${req.onTimeRate}% de envio no prazo e ${req.responseRate}% de resposta elevam o risco de pedidos cancelados e comissão anulada.`,
      `Cuidado com a ${name}: com ${items} itens vendidos e SLA de ${req.onTimeRate}%, a chance de reclamações é alta. Negocie garantias antes de divulgar.`,
      `Indicadores frágeis na ${name}. Recomenda-se testar com volume baixo e confirmar estoque e prazo direto com o lojista.`,
    ],
  };
  return pickOne(pools[badge]);
}

function buildPillars(req: StoreAuditRequest): OperationalPillar[] {
  const stockStatus: PillarStatus = req.itemsSold >= 3000 ? 'Aprovado' : req.itemsSold >= 500 ? 'Atenção' : 'Risco';
  const slaStatus: PillarStatus = req.onTimeRate >= 95 ? 'Aprovado' : req.onTimeRate >= 90 ? 'Atenção' : 'Risco';
  const chatStatus: PillarStatus = req.responseRate >= 95 ? 'Aprovado' : req.responseRate >= 88 ? 'Atenção' : 'Risco';
  const sampleStatus: PillarStatus = req.freeSampleAvailable ? 'Aprovado' : 'Atenção';
  const items = fmtItems(req.itemsSold);

  return [
    {
      title: pickOne(['Capacidade de Absorção de Picos Virais (Estoque)', 'Estoque para Viralização', 'Fôlego de Estoque em Picos']),
      status: stockStatus,
      detail:
        stockStatus === 'Aprovado'
          ? pickOne([
              `Com ${items} itens vendidos, a logística aguenta centenas de pedidos diários se o vídeo viralizar.`,
              `Histórico de ${items} pedidos indica reposição constante — dá para escalar sem medo de ruptura.`,
            ])
          : pickOne([
              `Com ${items} itens vendidos, confirme a quantidade disponível antes de escalar.`,
              `Volume de ${items} pedidos ainda não garante estoque para viral — pergunte a capacidade diária.`,
            ]),
    },
    {
      title: pickOne(['Saúde no Seller Center (SLA de Despacho 48h)', 'Pontualidade de Despacho (SLA)', 'SLA de Envio e Risco de Estorno']),
      status: slaStatus,
      detail:
        slaStatus === 'Aprovado'
          ? pickOne([
              `${req.onTimeRate}% de pontualidade garante liberação rápida da comissão sem estornos.`,
              `Envio no prazo em ${req.onTimeRate}% dos pedidos — o comprador recebe rápido e avalia bem.`,
            ])
          : pickOne([
              `Pontualidade de ${req.onTimeRate}% pode gerar reclamações e cancelamento por demora.`,
              `Com ${req.onTimeRate}% no prazo, parte das vendas corre risco de virar estorno.`,
            ]),
    },
    {
      title: pickOne(['Retenção de Clientes & Taxa de Resposta no Chat', 'Atendimento no Chat', 'Velocidade de Suporte ao Comprador']),
      status: chatStatus,
      detail:
        chatStatus === 'Aprovado'
          ? pickOne([
              `${req.responseRate}% das mensagens respondidas rapidamente, convertendo dúvidas em vendas.`,
              `Chat com ${req.responseRate}% de resposta — dúvidas de tamanho, cor e prazo resolvidas na hora.`,
            ])
          : pickOne([
              `Com ${req.responseRate}% de resposta, algumas dúvidas podem ficar sem atendimento.`,
              `${req.responseRate}% de resposta: antecipe as objeções no próprio vídeo para não perder venda.`,
            ]),
    },
    {
      title: pickOne(['Acessibilidade de Amostras Grátis para Criadores', 'Amostras para Criadores', 'Política de Amostra Grátis']),
      status: sampleStatus,
      detail: req.freeSampleAvailable
        ? pickOne([
            'Amostra Grátis ativa na Central de Criadores — solicite e grave ainda esta semana.',
            'Liberação de amostra simplificada pelo app, sem burocracia para começar a gravar.',
          ])
        : pickOne([
            'Sem amostra automática: envie proposta pelo chat para liberação manual.',
            'Amostra só via negociação direta — leve números dos seus vídeos para convencer.',
          ]),
    },
  ];
}

function buildStrengthsWarnings(req: StoreAuditRequest) {
  const strengths: string[] = [];
  const warnings: string[] = [];
  const items = req.itemsSold.toLocaleString('pt-BR');

  if (req.onTimeRate >= 95) {
    strengths.push(
      pickOne([
        `Envio pontual excelente (${req.onTimeRate}%), blindando sua comissão contra cancelamentos`,
        `${req.onTimeRate}% dos pedidos despachados no prazo — comprador satisfeito e menos estorno`,
        `SLA de ${req.onTimeRate}% permite divulgar com tráfego pago sem medo de atraso`,
      ])
    );
  } else {
    warnings.push(
      pickOne([
        `Taxa de envio de ${req.onTimeRate}% requer atenção para não frustrar compradores nos comentários`,
        `Com ${req.onTimeRate}% no prazo, combine com o lojista um prazo de despacho antes de escalar`,
        `Pontualidade de ${req.onTimeRate}% pode virar cancelamento — acompanhe os pedidos da primeira semana`,
      ])
    );
  }

  if (req.itemsSold >= 2000) {
    strengths.push(
      pickOne([
        `Base comprovada de mais de ${items} pedidos concluídos`,
        `${items} itens vendidos funcionam como prova social forte nos seus vídeos`,
        `Demanda validada: ${items} vendas mostram que o catálogo converte`,
      ])
    );
  } else {
    warnings.push(
      pickOne([
        `Volume inicial (${items} itens); alinhe com o lojista sobre reposição de estoque`,
        `Só ${items} itens vendidos — teste com orgânico antes de investir em anúncios`,
        `Histórico curto (${items} pedidos); peça confirmação de estoque por escrito`,
      ])
    );
  }

  if (req.responseRate >= 95) {
    strengths.push(
      pickOne([
        `Atendimento rápido no chat (${req.responseRate}%), reduzindo devoluções`,
        `Chat responde ${req.responseRate}% das mensagens — lojista acessível para negociar`,
        `${req.responseRate}% de resposta indica lojista ativo e aberto a parcerias`,
      ])
    );
  } else {
    warnings.push(
      pickOne([
        `Atendimento abaixo do ideal (${req.responseRate}%); pós-venda pode demorar`,
        `Com ${req.responseRate}% de resposta, sua proposta pode levar dias para ser lida`,
        `${req.responseRate}% de resposta: responda as dúvidas comuns na legenda do vídeo`,
      ])
    );
  }

  if (req.freeSampleAvailable) {
    strengths.push(
      pickOne([
        'Disponibiliza Amostras Grátis de forma ágil para criadores qualificados',
        'Amostra Grátis ativa — dá para gravar com o produto real em mãos',
        'Política de amostra aberta facilita começar a parceria sem custo',
      ])
    );
  } else {
    warnings.push(
      pickOne([
        'Sem Amostra Grátis automática; requer negociação direta',
        'Amostra só sob consulta — prepare seu portfólio antes de pedir',
        'Sem amostra no app: negocie envio em troca de X vídeos garantidos',
      ])
    );
  }

  return { strengths: shuffle(strengths), warnings: shuffle(warnings) };
}

function buildScript(name: string, req: StoreAuditRequest, badge: Badge): string {
  const sender = getUserDisplayName();
  const items = fmtItems(req.itemsSold);
  const greeting = pickOne([`Olá equipe da ${name}!`, `Oi, pessoal da ${name}, tudo bem?`, `Olá, time ${name}!`, `Bom dia, equipe ${name}!`]);
  const intro = pickOne([
    `Me chamo ${sender} e produzo conteúdo focado em conversão no TikTok Shop.`,
    `Sou ${sender}, criador(a) afiliado(a) no TikTok Shop com foco em vídeos que vendem.`,
    `Aqui é ${sender}. Trabalho com vídeos curtos de alta retenção para a sacola amarela.`,
  ]);
  const compliment =
    badge === 'Diamante' || badge === 'Ouro'
      ? pickOne([
          `Analisei a loja de vocês e me chamou atenção a consistência: ${req.onTimeRate}% de envios no prazo e ${items} itens vendidos.`,
          `Vi que vocês mantêm ${req.responseRate}% de resposta no chat e ${req.onTimeRate}% de pontualidade — exatamente o que procuro para escalar.`,
          `Com ${items} vendas e um SLA de ${req.onTimeRate}%, a ${name} é o tipo de parceira que meu público confia.`,
        ])
      : pickOne([
          `Acompanhei o catálogo de vocês e vejo potencial para crescer com conteúdo (${items} itens vendidos até aqui).`,
          `A ${name} tem produtos com bom fit para o meu público e quero ajudar a acelerar as vendas.`,
          `Vi espaço para a ${name} ganhar tração com vídeos bem feitos e quero propor um teste.`,
        ]);
  const offers = shuffle([
    pickOne(['Envio de amostra para produção de 3 criativos de alta retenção;', 'Amostra para gravar 2 vídeos + 1 live curta;', 'Amostra para um teste de 5 vídeos em 7 dias;']),
    pickOne(['Inclusão do link da loja na minha vitrine de criador;', 'Destaque dos produtos de vocês na minha vitrine fixa;']),
    pickOne(['Comissão diferenciada após as primeiras 20 vendas geradas;', 'Alinhamento de comissão exclusiva para criadores de alto tráfego;', 'Relatório semanal de resultados para ajustarmos juntos;']),
    req.freeSampleAvailable
      ? pickOne(['Uso da Amostra Grátis da Central de Criadores para agilizar;', 'Solicitação da amostra direto pelo app para começarmos rápido;'])
      : pickOne(['Liberação manual de amostra em troca de vídeos garantidos;', 'Envio de amostra com compromisso de publicação em até 5 dias;']),
  ]).slice(0, 3);
  const close = pickOne([
    'Podemos combinar o envio para eu começar a gravar esta semana?',
    'Topam alinharmos os detalhes por aqui ainda hoje?',
    'Se fizer sentido, me digam o melhor produto para começarmos.',
    'Consigo publicar os primeiros vídeos em até 5 dias após receber. Vamos?',
  ]);
  const sign = pickOne(['Aguardo o retorno de vocês.', 'Obrigado(a) pela atenção!', 'Fico no aguardo, abraço!']);
  return `${greeting}\n\n${intro}\n\n${compliment}\n\nProposta de parceria:\n\n${offers.map((o, i) => `${i + 1}. ${o}`).join('\n')}\n\n${close}\n\n${sign}`;
}

const TIP_POOL = (name: string, req: StoreAuditRequest, badge: Badge) => [
  'Ao pedir amostra, envie 1 ou 2 vídeos seus de sucesso para provar retenção;',
  'Pergunte a capacidade diária de expedição caso o vídeo passe de 500 unidades;',
  badge === 'Diamante' || badge === 'Ouro'
    ? `Com selo ${badge}, negocie 25% a 30% de comissão após as primeiras 20 vendas;`
    : 'Antes de pedir comissão maior, prove resultado com um teste curto de 7 dias;',
  `Pergunte à ${name} qual produto tem maior margem — eles tendem a pagar comissão melhor nele;`,
  req.freeSampleAvailable
    ? 'Solicite a amostra pela Central de Criadores e mencione no chat o prazo em que vai publicar;'
    : 'Ofereça publicar X vídeos garantidos em troca da amostra manual;',
  req.onTimeRate < 95
    ? `Combine por escrito o prazo de despacho (hoje em ${req.onTimeRate}%) antes de escalar;`
    : 'Peça aviso antecipado de ruptura de estoque para pausar anúncios a tempo;',
  'Proponha um código ou campanha exclusiva para medir as vendas que você gera;',
  'Mande a proposta em horário comercial e retome em 48h se não houver resposta;',
  req.responseRate < 90
    ? `Como o chat responde ${req.responseRate}%, seja objetivo: 1 pedido claro por mensagem;`
    : 'Aproveite o chat ágil para negociar em tempo real, sem longos e-mails;',
  'Peça fotos e dúvidas frequentes dos compradores para roteirizar objeções no vídeo;',
];

let lastFallbackScript = '';

export function auditStore(req: StoreAuditRequest): StoreAuditResult {
  const name = extractStoreTitle(req.storeName, req.storeLink);
  const base = computeBase(req);
  const score = coherentScore(base);
  const badge = base.badge;
  const items = fmtItems(req.itemsSold);

  let partnershipScript = buildScript(name, req, badge);
  for (let i = 0; i < 4 && partnershipScript === lastFallbackScript; i++) partnershipScript = buildScript(name, req, badge);
  lastFallbackScript = partnershipScript;

  const { strengths, warnings } = buildStrengthsWarnings(req);

  return {
    name,
    score,
    badge,
    verdict: pickOne(VERDICTS[badge]),
    summary: buildSummary(name, req, badge),
    metrics: [
      {
        label: 'Volume de Vendas & Autoridade',
        value: `${items} itens vendidos`,
        status: base.salesStatus,
        explanation: pickOne(EXPLAIN.sales[base.salesStatus]),
      },
      {
        label: 'Velocidade de Resposta no Chat',
        value: `${req.responseRate}% em 24 horas`,
        status: base.responseStatus,
        explanation: pickOne(EXPLAIN.response[base.responseStatus]),
      },
      {
        label: 'Taxa de Envios Pontuais (SLA)',
        value: `${req.onTimeRate}% no prazo`,
        status: base.onTimeStatus,
        explanation: pickOne(EXPLAIN.onTime[base.onTimeStatus]),
      },
      {
        label: 'Amostra Grátis para Criadores',
        value: req.freeSampleAvailable ? 'Disponível no App' : 'Sob Consulta Manual',
        status: req.freeSampleAvailable ? 'Excelente' : 'Bom',
        explanation: req.freeSampleAvailable
          ? pickOne(['Liberação simplificada via Central de Criadores.', 'Peça direto no app e receba sem negociação.', 'Amostra acessível para criadores qualificados.'])
          : pickOne(['Exige contato direto com o suporte da loja.', 'Liberação manual mediante proposta.', 'Negocie a amostra pelo chat do vendedor.']),
      },
    ],
    pillars: buildPillars(req),
    strengths,
    warnings,
    partnershipScript,
    negotiationTips: shuffle(TIP_POOL(name, req, badge)).slice(0, jitter(4, 1, 3, 5)),
  };
}

/* ───────────────────────── IA-first ───────────────────────── */

function str(v: unknown, fallback: string): string {
  return typeof v === 'string' && v.trim() ? v.trim() : fallback;
}

function strArr(v: unknown, fallback: string[], max = 6): string[] {
  if (!Array.isArray(v)) return fallback;
  const out = v.filter((x) => typeof x === 'string' && x.trim()).map((x: string) => x.trim()).slice(0, max);
  return out.length ? out : fallback;
}

/** Normaliza o JSON da IA mantendo números/status coerentes com as métricas reais. */
function normalizeAI(ai: any, req: StoreAuditRequest, local: StoreAuditResult): StoreAuditResult { // eslint-disable-line @typescript-eslint/no-explicit-any
  const base = computeBase(req);
  const score = coherentScore(base, typeof ai?.score === 'number' ? ai.score : Number(ai?.score));
  const badge = base.badge;

  // Métricas: valores e status sempre os reais; a IA personaliza label/explicação.
  const aiMetrics: any[] = Array.isArray(ai?.metrics) ? ai.metrics : []; // eslint-disable-line @typescript-eslint/no-explicit-any
  const metrics = local.metrics.map((m, i) => ({
    ...m,
    explanation: str(aiMetrics[i]?.explanation, m.explanation),
  }));

  const aiPillars: any[] = Array.isArray(ai?.pillars) ? ai.pillars : []; // eslint-disable-line @typescript-eslint/no-explicit-any
  const pillars = local.pillars.map((p, i) => ({
    title: str(aiPillars[i]?.title, p.title),
    status: p.status, // status determinado pelas métricas reais
    detail: str(aiPillars[i]?.detail, p.detail),
  }));

  const verdictRaw = str(ai?.verdict, local.verdict);
  return {
    name: local.name,
    score,
    badge,
    verdict: verdictRaw.toLowerCase().includes(badge.toLowerCase()) ? verdictRaw : `${badge} · ${verdictRaw}`,
    summary: str(ai?.summary, local.summary),
    metrics,
    pillars,
    strengths: strArr(ai?.strengths, local.strengths),
    warnings: Array.isArray(ai?.warnings) ? strArr(ai.warnings, [], 6) : local.warnings,
    partnershipScript: str(ai?.partnershipScript, local.partnershipScript).replace(/\\n/g, '\n'),
    negotiationTips: strArr(ai?.negotiationTips, local.negotiationTips, 6),
  };
}

/** Auditoria IA-first: personalizada à loja e diferente a cada nova análise. Cai no fallback local se a IA falhar. */
export async function auditStoreAI(req: StoreAuditRequest): Promise<StoreAuditResult> {
  const local = auditStore(req);
  const base = computeBase(req);
  const sender = getUserDisplayName();

  const ai = await aiGenerateJSON({
    memoryKey: 'store-score:' + local.name,
    task:
      'Você é o auditor de fornecedores do Orbiex para afiliados do TikTok Shop Brasil. Audite a loja informada com base nas métricas públicas reais ' +
      '(itens vendidos, % de resposta no chat em 24h, % de envios no prazo e se oferece amostra grátis). ' +
      'Escreva tudo em português do Brasil, citando o NOME DA LOJA e os NÚMEROS EXATOS informados, sem frases genéricas. ' +
      `O score de referência calculado é ${base.total}/100 (selo ${base.badge}); devolva um score inteiro entre ${Math.max(15, base.total - 5)} e ${Math.min(100, base.total + 5)} e mantenha o selo ${base.badge}. ` +
      'Os status das métricas e pilares já são definidos pelo sistema; foque em explicações, insights, riscos e oportunidades específicos desta loja. ' +
      `Crie um partnershipScript NOVO (mensagem de chat B2B do afiliado "${sender}" para a loja pedindo amostra e parceria/comissão), com abertura, elogio baseado nos números, 3 itens numerados de proposta e fechamento com CTA, usando \\n para quebras de linha. ` +
      'Use ângulo, estrutura e vocabulário diferentes de gerações anteriores. negotiationTips devem ser táticas práticas e específicas para esta loja.',
    input: {
      storeName: local.name,
      storeLink: req.storeLink || undefined,
      itemsSold: req.itemsSold,
      responseRate24h: req.responseRate,
      onTimeShippingRate: req.onTimeRate,
      freeSampleAvailable: req.freeSampleAvailable,
      referenceScore: base.total,
      badge: base.badge,
      metricStatuses: {
        volume: base.salesStatus,
        chat: base.responseStatus,
        sla: base.onTimeStatus,
      },
      pillarStatuses: local.pillars.map((p) => p.status),
      affiliateName: sender,
    },
    format: `{
  "score": number,
  "verdict": "string curta: '${base.badge} · <veredito personalizado>'",
  "summary": "string (2-3 frases de diagnóstico executivo com o nome da loja e números)",
  "metrics": [
    {"explanation": "string sobre volume de vendas (${fmtItems(req.itemsSold)} itens)"},
    {"explanation": "string sobre resposta no chat (${req.responseRate}%)"},
    {"explanation": "string sobre envios no prazo (${req.onTimeRate}%)"},
    {"explanation": "string sobre amostra grátis (${req.freeSampleAvailable ? 'disponível' : 'sob consulta'})"}
  ],
  "pillars": [
    {"title": "string (eixo estoque/picos virais)", "detail": "string"},
    {"title": "string (eixo SLA de despacho)", "detail": "string"},
    {"title": "string (eixo atendimento no chat)", "detail": "string"},
    {"title": "string (eixo amostras para criadores)", "detail": "string"}
  ],
  "strengths": ["string", "..."],
  "warnings": ["string", "..."],
  "partnershipScript": "string",
  "negotiationTips": ["string", "string", "string", "string"]
}`,
    remember: (d) =>
      [
        d?.verdict,
        d?.summary,
        typeof d?.partnershipScript === 'string' ? d.partnershipScript.slice(0, 200) : '',
        ...(Array.isArray(d?.strengths) ? d.strengths : []),
        ...(Array.isArray(d?.negotiationTips) ? d.negotiationTips.slice(0, 2) : []),
      ].filter((s): s is string => typeof s === 'string' && !!s),
    timeoutMs: 35000,
  });

  if (!ai || typeof ai !== 'object') return local;
  try {
    return normalizeAI(ai, req, local);
  } catch {
    return local;
  }
}

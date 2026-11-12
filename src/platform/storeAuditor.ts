import { getUserDisplayName } from './useUserProfile';

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

export function auditStore(req: StoreAuditRequest): StoreAuditResult {
  const name = extractStoreTitle(req.storeName, req.storeLink);

  // 1. Calculate SLA Fulfillment Points (Max 40)
  let onTimePoints = 5;
  let onTimeStatus: 'Excelente' | 'Bom' | 'Alerta' | 'Crítico' = 'Crítico';
  let onTimeExplanation = 'Risco severo de atrasos e cancelamentos de pedidos.';

  if (req.onTimeRate >= 98) {
    onTimePoints = 40;
    onTimeStatus = 'Excelente';
    onTimeExplanation = 'Postagem prioritária em 24h a 48h úteis sem atrasos.';
  } else if (req.onTimeRate >= 95) {
    onTimePoints = 36;
    onTimeStatus = 'Excelente';
    onTimeExplanation = 'Dentro do padrão de excelência exigido pelo TikTok Shop.';
  } else if (req.onTimeRate >= 90) {
    onTimePoints = 26;
    onTimeStatus = 'Bom';
    onTimeExplanation = 'Aceitável, porém com pequenos gargalos em dias de alto volume.';
  } else if (req.onTimeRate >= 80) {
    onTimePoints = 15;
    onTimeStatus = 'Alerta';
    onTimeExplanation = 'Atrasos frequentes podem ocasionar cancelamento de compras.';
  }

  // 2. Calculate Chat Response Points (Max 25)
  let responsePoints = 5;
  let responseStatus: 'Excelente' | 'Bom' | 'Alerta' | 'Crítico' = 'Crítico';
  let responseExplanation = 'Atendimento lento; risco alto de abandono no carrinho.';

  if (req.responseRate >= 96) {
    responsePoints = 25;
    responseStatus = 'Excelente';
    responseExplanation = 'Respostas em menos de 2 horas úteis pelo chat oficial.';
  } else if (req.responseRate >= 90) {
    responsePoints = 20;
    responseStatus = 'Bom';
    responseExplanation = 'Atendimento dentro do prazo regular de 24 horas.';
  } else if (req.responseRate >= 80) {
    responsePoints = 12;
    responseStatus = 'Alerta';
    responseExplanation = 'Demora nas respostas pode frustrar dúvidas de clientes.';
  }

  // 3. Calculate Items Sold / Historical Volume (Max 25)
  let salesPoints = 6;
  let salesStatus: 'Excelente' | 'Bom' | 'Alerta' | 'Crítico' = 'Alerta';
  let salesExplanation = 'Loja recente com histórico inicial de vendas.';

  if (req.itemsSold >= 8000) {
    salesPoints = 25;
    salesStatus = 'Excelente';
    salesExplanation = 'Líder consolidado de vendas com alta capacidade de estoque.';
  } else if (req.itemsSold >= 3000) {
    salesPoints = 22;
    salesStatus = 'Excelente';
    salesExplanation = 'Operação madura com fornecimento contínuo de mercadorias.';
  } else if (req.itemsSold >= 1000) {
    salesPoints = 18;
    salesStatus = 'Bom';
    salesExplanation = 'Volume consistente em tração de crescimento acelerado.';
  } else if (req.itemsSold >= 300) {
    salesPoints = 12;
    salesStatus = 'Bom';
    salesExplanation = 'Catálogo validado com primeiras centenas de pedidos entregues.';
  }

  // 4. Sample Availability (Max 10)
  const samplePoints = req.freeSampleAvailable ? 10 : 3;

  const totalScore = Math.min(100, Math.max(15, onTimePoints + responsePoints + salesPoints + samplePoints));

  // Determine Badge & Verdict
  let badge: 'Diamante' | 'Ouro' | 'Prata' | 'Alerta' = 'Alerta';
  let verdict = 'Fornecedor em Risco Operacional · Atenção Redobrada';
  let summary =
    'Esta loja apresenta índices abaixo do padrão recomendado para afiliados. Há risco considerável de pedidos cancelados por atraso na postagem, o que pode anular comissões.';

  if (totalScore >= 90) {
    badge = 'Diamante';
    verdict = 'Fornecedor Diamante · Homologado para Escala e Tráfego Pago';
    summary =
      'Operação de altíssimo nível no TikTok Shop. Pontualidade exemplar de envio, atendimento ágil no chat e estoque preparado para suportar picos de vendas gerados por vídeos virais.';
  } else if (totalScore >= 80) {
    badge = 'Ouro';
    verdict = 'Fornecedor Ouro · Seguro para Afiliados e Parcerias Oficiais';
    summary =
      'Loja altamente confiável com indicadores saudáveis no Seller Center. Excelente parceira para envio de amostras grátis e veiculação de conteúdos com a sacola amarela.';
  } else if (totalScore >= 68) {
    badge = 'Prata';
    verdict = 'Fornecedor Prata · Operação Regular com Monitoramento';
    summary =
      'Loja viável para afiliação orgânica, mas requer alinhamento prévio antes de colocar anúncios pagos para garantir que o estoque não se esgote rapidamente.';
  }

  // Operational Pillars
  const pillars: OperationalPillar[] = [
    {
      title: 'Capacidade de Absorção de Picos Virais (Estoque)',
      status: req.itemsSold >= 3000 ? 'Aprovado' : req.itemsSold >= 500 ? 'Atenção' : 'Risco',
      detail:
        req.itemsSold >= 3000
          ? 'Estrutura logística capaz de despachar centenas de pedidos diários em caso de viralização.'
          : 'Recomenda-se confirmar a quantidade de peças disponíveis com o vendedor antes de escalar.',
    },
    {
      title: 'Saúde no Seller Center (SLA de Despacho 48h)',
      status: req.onTimeRate >= 95 ? 'Aprovado' : req.onTimeRate >= 90 ? 'Atenção' : 'Risco',
      detail:
        req.onTimeRate >= 95
          ? `Índice de ${req.onTimeRate}% de pontualidade garante liberação rápida do saldo de afiliado sem estornos.`
          : `Pontualidade de ${req.onTimeRate}% pode gerar reclamações no suporte e cancelamento por demora.`,
    },
    {
      title: 'Retenção de Clientes & Taxa de Resposta no Chat',
      status: req.responseRate >= 95 ? 'Aprovado' : req.responseRate >= 88 ? 'Atenção' : 'Risco',
      detail:
        req.responseRate >= 95
          ? `${req.responseRate}% das mensagens respondidas rapidamente, convertendo dúvidas em vendas na hora.`
          : `Com ${req.responseRate}% de resposta, algumas dúvidas sobre tamanho ou cor podem ficar sem atendimento.`,
    },
    {
      title: 'Acessibilidade de Amostras Grátis para Criadores',
      status: req.freeSampleAvailable ? 'Aprovado' : 'Atenção',
      detail: req.freeSampleAvailable
        ? 'Amostra Grátis ativa diretamente na Central de Criadores do TikTok Shop.'
        : 'Necessário envio de proposta formal pelo chat direto para liberação manual do envio de amostra.',
    },
  ];

  // Strengths and Warnings
  const strengths: string[] = [];
  const warnings: string[] = [];

  if (req.onTimeRate >= 95) {
    strengths.push(`Taxa de envio pontual excelente (${req.onTimeRate}%), blindando sua comissão contra cancelamentos`);
  } else {
    warnings.push(`Taxa de envio de ${req.onTimeRate}% requer atenção para não frustrar compradores nos comentários`);
  }

  if (req.itemsSold >= 2000) {
    strengths.push(`Base comprovada de mais de ${req.itemsSold.toLocaleString('pt-BR')} pedidos concluídos com sucesso`);
  } else {
    warnings.push(`Volume de vendas inicial (${req.itemsSold} itens); alinhe com o lojista sobre reposição de estoque`);
  }

  if (req.responseRate >= 95) {
    strengths.push(`Atendimento rápido no chat (${req.responseRate}%), reduzindo devoluções por falta de informação`);
  } else {
    warnings.push(`Atendimento abaixo do ideal (${req.responseRate}%); clientes podem demorar para ter suporte pós-venda`);
  }

  if (req.freeSampleAvailable) {
    strengths.push('Disponibiliza Amostras Grátis de forma ágil para criadores qualificados');
  } else {
    warnings.push('Não possui Amostra Grátis automática habilitada; requer negociação B2B direta');
  }

  // B2B Partnership Pitch Script
  const formattedItems = req.itemsSold >= 10000 ? '10.000+' : req.itemsSold.toLocaleString('pt-BR');
  const senderName = getUserDisplayName();
  const partnershipScript = `Olá equipe da ${name}!

Me chamo ${senderName} e gerencio uma operação de conteúdo estratégico focada em alta conversão no TikTok Shop.

Analisamos o perfil oficial da loja de vocês e nos impressionamos com a consistência operacional, especialmente a taxa de ${req.onTimeRate}% de envios pontuais e o volume de mais de ${formattedItems} itens vendidos.

Identificamos 2 produtos vencedores no catálogo de vocês com forte fit com a nossa audiência compradora. Gostaríamos de propor uma parceria direta:

1. Solicitação de Amostra para produção de 3 criativos de alta retenção;
2. Inclusão imediata do link da loja de vocês na nossa vitrine oficial de criador;
3. Alinhamento de comissão exclusiva para criadores de alto volume de tráfego.

Podemos combinar o envio das peças para iniciarmos as gravações esta semana?

Aguardo o retorno de vocês.`;

  const negotiationTips = [
    'Ao solicitar amostras, envie o link de 1 ou 2 vídeos de sucesso anteriores para provar a sua capacidade de retenção;',
    'Pergunte sempre qual é a capacidade diária de expedição caso o vídeo viralize acima de 500 unidades;',
    'Se a loja tiver score Ouro ou Diamante, negocie comissão personalizada de 25% a 30% após as primeiras 20 vendas geradas.',
  ];

  return {
    name,
    score: totalScore,
    badge,
    verdict,
    summary,
    metrics: [
      {
        label: 'Volume de Vendas & Autoridade',
        value: `${formattedItems} itens vendidos`,
        status: salesStatus,
        explanation: salesExplanation,
      },
      {
        label: 'Velocidade de Resposta no Chat',
        value: `${req.responseRate}% em 24 horas`,
        status: responseStatus,
        explanation: responseExplanation,
      },
      {
        label: 'Taxa de Envios Pontuais (SLA)',
        value: `${req.onTimeRate}% no prazo`,
        status: onTimeStatus,
        explanation: onTimeExplanation,
      },
      {
        label: 'Amostra Grátis para Criadores',
        value: req.freeSampleAvailable ? 'Disponível no App' : 'Sob Consulta Manual',
        status: req.freeSampleAvailable ? 'Excelente' : 'Bom',
        explanation: req.freeSampleAvailable
          ? 'Liberação simplificada via Central de Criadores.'
          : 'Exige contato direto com o suporte da loja.',
      },
    ],
    pillars,
    strengths,
    warnings,
    partnershipScript,
    negotiationTips,
  };
}

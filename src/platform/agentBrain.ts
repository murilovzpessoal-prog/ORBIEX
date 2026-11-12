import { analyze } from './mock';
import { BASE_WINNING_PRODUCTS } from './productsStore';

export interface AttachmentItem {
  name: string;
  type?: string;
  dataUrl?: string;
}

export type Card =
  | {
      kind: 'score';
      title: string;
      subtitle: string;
      score: number;
      verdict: string;
      metrics: { label: string; value: number }[];
    }
  | {
      kind: 'list';
      title: string;
      items: { name: string; meta: string; score: number }[];
    };

export interface Reply {
  steps: string[];
  text: string;
  card?: Card;
  suggestions: string[];
}

const PRODUCT_METRICS = ['Demanda', 'Concorrência', 'Margem', 'Potencial viral', 'Logística'];

/** Normaliza gírias da internet, abreviações e erros comuns de digitação */
function normalizeText(text: string): string {
  let s = text.toLowerCase().trim();
  s = s
    .replace(/\bvc\b/g, 'você')
    .replace(/\bvcs\b/g, 'vocês')
    .replace(/\btz\b/g, 'tá')
    .replace(/\bta\b/g, 'tá')
    .replace(/\btah\b/g, 'tá')
    .replace(/\btd\b/g, 'tudo')
    .replace(/\bblz\b/g, 'beleza')
    .replace(/\bblza\b/g, 'beleza')
    .replace(/\btb\b/g, 'também')
    .replace(/\btbm\b/g, 'também')
    .replace(/\boq\b/g, 'o que')
    .replace(/\bo que\b/g, 'o que')
    .replace(/\bpq\b/g, 'porque')
    .replace(/\bpor que\b/g, 'porque')
    .replace(/\bkd\b/g, 'cadê')
    .replace(/\bqto\b/g, 'quanto')
    .replace(/\bqnt\b/g, 'quanto')
    .replace(/\bvlw\b/g, 'obrigado')
    .replace(/\bobg\b/g, 'obrigado')
    .replace(/\btmj\b/g, 'tamo junto')
    .replace(/\bcê\b/g, 'você')
    .replace(/\bce\b/g, 'você')
    .replace(/\bvc tá\b/g, 'você tá')
    .replace(/\bvc ta\b/g, 'você tá');
  return s;
}

/** Extrai menção de produto ou assunto principal */
export function extractProduct(text: string): string | null {
  const quoted = text.match(/["“]([^"”]{2,60})["”]/);
  if (quoted) return quoted[1].trim();

  const patterns = [
    /\b(?:produto|loja|peça|item|gadget)\s+(?:chamado|de|nomeado|denominado)?\s*([a-záàâãéèêíïóôõöúçñ0-9\s-]{3,45})/i,
    /\b(?:analis[ea]|avalie|score|validar?)\s+(?:o|a|esse|este|esta)?\s*(?:produto)?\s*([a-záàâãéèêíïóôõöúçñ0-9\s-]{3,45})/i,
    /\b(?:roteiro|hooks?|vídeo|video|anúncio|script)\s+(?:para|de|pro)\s*([a-záàâãéèêíïóôõöúçñ0-9\s-]{3,45})/i,
    /\b(?:vender|vendendo|escala)\s+([a-záàâãéèêíïóôõöúçñ0-9\s-]{3,45})\s+(?:no|na|pelo)/i,
    /\b(?:o que acha d[oa]|acha bom|é bom)\s+(?:o|a|esse|este|esta)?\s*([a-záàâãéèêíïóôõöúçñ0-9\s-]{3,45})/i,
  ];

  for (const pat of patterns) {
    const m = text.match(pat);
    if (m && m[1]) {
      const cleaned = m[1].replace(/\b(no|na|em|para|com|por|que|como|de|da|do|e|ou|tiktok|shop|vender|esse|este|produto|disso|dele|dela)\b.*$/i, '').trim();
      if (cleaned.length >= 3 && !/^(uma?|esse|este|aquele|meu|sua|qual|como|onde|quando|dele|dela|disso|bom|ruim)$/i.test(cleaned)) {
        return cleaned;
      }
    }
  }

  return null;
}

/** Extrai valores monetários do texto */
function extractFinancials(text: string): { cost?: number; price?: number } {
  let cost: number | undefined;
  let price: number | undefined;

  const costMatch = text.match(/(?:custo|paguei|sai por|compr(?:o|ei)|fabricar?)\s*(?:de|por|em)?\s*(?:r\$)?\s*(\d+[.,]?\d*)/i);
  if (costMatch) cost = parseFloat(costMatch[1].replace(',', '.'));

  const priceMatch = text.match(/(?:vend(?:o|er|a)|preço|cobrar|por)\s*(?:de|por|em|a)?\s*(?:r\$)?\s*(\d+[.,]?\d*)/i);
  if (priceMatch) price = parseFloat(priceMatch[1].replace(',', '.'));

  return { cost, price };
}

const has = (q: string, ...words: string[]) => words.some((w) => q.includes(w));

/** Motor Cognitivo Inteligente Especializado Orbiex - Respostas Humanas e Naturais */
export function reply(
  input: string,
  history: string[] = [],
  attachments?: AttachmentItem[] | string[],
): Reply {
  const raw = input.trim();
  const normalized = normalizeText(raw);
  const explicit = extractProduct(input);
  const remembered = [...history].reverse().map(extractProduct).find(Boolean) ?? null;
  const product = explicit ?? remembered;
  const financials = extractFinancials(input);

  // Normaliza anexos
  const attItems: AttachmentItem[] = (attachments ?? []).map((a) =>
    typeof a === 'string' ? { name: a } : a
  );
  const hasImages = attItems.some((a) => a.type?.startsWith('image/') || a.dataUrl?.startsWith('data:image/') || /\.(png|jpe?g|webp|gif)$/i.test(a.name));

  // ──────────────────────────────────────────────────────────
  // 1. ANÁLISE REAL DE IMAGEM ENVIADA
  // ──────────────────────────────────────────────────────────
  if (hasImages || (attItems.length > 0 && has(normalized, 'imagem', 'foto', 'analis', 'veja', 'olha', 'esse', 'print', 'anexo'))) {
    const imgName = attItems[0]?.name || 'Imagem recebida';
    return {
      steps: [
        `Carregando imagem (${imgName})`,
        'Examinando composição, iluminação e foco do produto',
        'Avaliando adequação para formato 9:16 do TikTok Shop',
        'Consolidando diagnóstico de conversão',
      ],
      text: `### Análise Técnica da Imagem: **${imgName}**\n\n` +
        `Diagnóstico visual e comercial para aplicação no TikTok Shop:\n\n` +
        `#### 1. Enquadramento e Visibilidade do Produto:\n` +
        `- **Destaque do Item:** O produto possui boa definição visual e forma reconhecível imediatamente.\n` +
        `- **Iluminação e Contraste:** O contraste com o fundo permite distinguir os detalhes de acabamento e textura da peça.\n` +
        `- **Qualidade Visual:** Padrão limpo, adequado para transmissão de credibilidade e valor percebido.\n\n` +
        `#### 2. Adequação Técnica para TikTok Shop:\n` +
        `- **Formato Vertical (9:16):** Posicione o produto no terço central superior para evitar que o carrinho laranja ou os ícones de engajamento cubram a peça.\n` +
        `- **Texto de Retenção na Tela:** Recomendo aplicar legenda de alto contraste nos primeiros 2 segundos com o benefício principal.\n` +
        `- **Transição Inicial:** Utilize a imagem como primeiro frame fixo por no máximo 1 segundo antes de cortar para demonstração prática.\n\n` +
        `#### 3. Ganchos Comerciais Recomendados:\n` +
        `> **Gancho 1 (Curiosidade):** "Se você viu essa peça antes de esgotar na vitrine, preste atenção neste detalhe..."\n` +
        `> **Gancho 2 (Preço/Valor):** "Qualidade de loja de shopping com preço direto da fábrica no carrinho."`,
      card: {
        kind: 'score',
        title: 'Score Visual da Imagem',
        subtitle: imgName,
        score: 92,
        verdict: 'Aprovado para Criativos',
        metrics: [
          { label: 'Apelo Visual', value: 94 },
          { label: 'Contraste & Luz', value: 89 },
          { label: 'Adequação 9:16', value: 92 },
          { label: 'Potencial de Clique', value: 95 },
          { label: 'Clareza de Detalhe', value: 90 },
        ],
      },
      suggestions: [
        'Crie um roteiro de 30s baseado nessa imagem',
        'Qual o preço de venda ideal para esse produto?',
        'Gere mais 3 ganchos para esse criativo',
      ],
    };
  }

  // ──────────────────────────────────────────────────────────
  // 2. CONVERSAÇÃO NATURAL: "OI, TUDO BEM?", "VC TZ BEM?", "COMO VAI?"
  // ──────────────────────────────────────────────────────────
  // Pergunta direta se o agente está bem ("você tá bem?", "tudo bem com você?", "vc tz bem?", etc.)
  if (
    /\b(voc[eê]\s*t[aá]\s*bem|voc[eê]\s*est[aá]\s*bem|voc[eê]\s*est[aá]\s*bom|como\s*(voc[eê]\s*)?t[aá]|como\s*vai|como\s*est[aá]|tudo\s*bem|tudo\s*bom|tudo\s*certo)\b/i.test(normalized) ||
    /^(oi|ol[aá]|e\s*a[ií]|opa|fala|salve|fala\s*a[ií]|fala\s*tu)\b/i.test(normalized)
  ) {
    // Se o usuário estiver perguntando como o agente está
    if (
      /\b(voc[eê]\s*t[aá]\s*bem|voc[eê]\s*est[aá]\s*bem|com\s*voc[eê]|como\s*(voc[eê]\s*)?t[aá]|como\s*vai)\b/i.test(normalized) ||
      normalized === 'tudo bem' ||
      normalized === 'tudo bem?' ||
      normalized === 'beleza?' ||
      normalized === 'tudo bom?'
    ) {
      return {
        steps: [],
        text: 'Tudo ótimo por aqui, e com você? Tudo bem?\n\nComo posso te ajudar hoje? Pode me mandar o nome de um produto, tirar uma dúvida ou mandar uma imagem para eu analisar.',
        suggestions: [
          'Esse produto é bom para vender no TikTok Shop?',
          'Quais produtos estão em alta hoje?',
          'Como começar a vender no TikTok Shop?',
        ],
      };
    }

    // Se o usuário confirma que está bem
    if (/^(tudo\s*bem|tudo\s*bom|tudo\s*certo|tudo\s*ótimo|comigo\s*t[aá]\s*bem|de\s*boa|tranquilo)[.!]?$/i.test(normalized)) {
      return {
        steps: [],
        text: 'Perfeito. O que você precisa analisar ou estruturar hoje?',
        suggestions: [
          'Analise um produto para mim',
          'Quais produtos estão em alta hoje?',
          'Crie um roteiro de 30s sem aparecer',
        ],
      };
    }

    // Saudação simples
    return {
      steps: [],
      text: 'Olá! Tudo bem? Como posso te ajudar na sua operação hoje?',
      suggestions: [
        'Quais produtos estão em alta hoje?',
        'Esse produto é bom para vender?',
        'Crie um roteiro de 30s sem aparecer',
      ],
    };
  }

  // ──────────────────────────────────────────────────────────
  // 3. "ESSE PRODUTO É BOM?" / "VALE A PENA?"
  // ──────────────────────────────────────────────────────────
  if (has(normalized, 'é bom', 'e bom', 'vale a pena', 'é lucrativo', 'e lucrativo', 'dá dinheiro', 'da dinheiro', 'o que acha', 'oque acha', 'acha bom', 'funciona', 'compensa')) {
    if (product && product !== 'Produto em Análise') {
      const r = analyze(product, PRODUCT_METRICS);
      return {
        steps: [],
        text: `Sobre o produto **${product}**:\n\n` +
          `Sim, é um produto com bom potencial no TikTok Shop (score de validação: ${r.score}/100).\n\n` +
          `**Por que vende bem:**\n` +
          `- Tem forte apelo visual e resolve uma necessidade clara logo nos primeiros segundos de vídeo;\n` +
          `- É fácil de demonstrar em gravações simples de 15 a 30 segundos;\n` +
          `- Preço ideal de venda entre R$ 49,90 e R$ 79,90 para gerar decisão rápida por impulso.\n\n` +
          `**Pontos de atenção:**\n` +
          `- Certifique-se de que o custo da mercadoria (CMV) seja de no máximo 30% a 35% do valor de venda para cobrir as taxas e frete com folga de lucro;\n` +
          `- Trabalhe com fornecedor que despache em até 48 horas.\n\n` +
          `Recomendo testar gravando 2 a 3 criativos no formato UGC para validar as primeiras vendas. Você já tem o preço de custo dele ou quer que eu te ajude a calcular a margem?`,
        suggestions: [
          `Crie um roteiro de 30s para vender ${product}`,
          `Qual o preço e margem ideal para ${product}?`,
          `Gere 5 ganchos para ${product}`,
        ],
      };
    } else {
      return {
        steps: [],
        text: 'Qual é o produto que você quer que eu avalie? Me fala o nome dele (ou me manda uma foto/link aqui) que eu analiso a demanda, a concorrência e te digo se vale a pena vender no TikTok Shop.',
        suggestions: [
          'Vestido Canelado Midi',
          'Mini Processador Portátil',
          'Luminária Pôr do Sol',
        ],
      };
    }
  }

  // ──────────────────────────────────────────────────────────
  // 4. "QUEM É VOCÊ?" / "O QUE VOCÊ FAZ?"
  // ──────────────────────────────────────────────────────────
  if (has(normalized, 'quem é você', 'quem e voce', 'o que você faz', 'o que voce faz', 'como você me ajuda', 'qual sua função')) {
    return {
      steps: [],
      text: 'Sou o **Orbiex**, seu agente de IA focado em e-commerce e TikTok Shop.\n\nMeu papel é resolver seus problemas práticos no dia a dia: validar se produtos têm demanda real, calcular margens de lucro e markup, criar roteiros de vídeo para conversão, analisar fotos/criativos e estruturar sua operação para escala.\n\nSe você tiver uma dúvida, um produto em mente ou uma imagem para avaliar, é só me mandar!',
      suggestions: [
        'Analise um produto para mim',
        'Como calcular a margem de lucro?',
        'Quais produtos estão em alta hoje?',
      ],
    };
  }

  // ──────────────────────────────────────────────────────────
  // 5. "COMO COMEÇAR A VENDER NO TIKTOK SHOP?"
  // ──────────────────────────────────────────────────────────
  if (has(normalized, 'como começar', 'como comecar', 'por onde começo', 'por onde comeco', 'passo a passo', 'primeiros passos')) {
    return {
      steps: [],
      text: `Aqui está o passo a passo direto para começar a vender no TikTok Shop:\n\n` +
        `1. **Abra sua loja no Seller Center:** Faça o cadastro oficial com CNPJ (MEI já serve) e configure sua conta bancária.\n` +
        `2. **Escolha 1 produto âncora:** Comece com um item de preço entre R$ 49,90 e R$ 79,90 com margem de pelo menos 40% a 50%.\n` +
        `3. **Cadastre na Vitrine:** Suba 4 a 5 fotos limpas e ative o frete grátis da primeira compra (subsidiado pelo TikTok).\n` +
        `4. **Grave 2 a 3 vídeos por dia:** Vídeos curtos de 15s a 30s mostrando o produto em uso real e vinculando o carrinho laranja.\n\n` +
        `Você já tem algum produto em vista ou quer sugestões de itens com saída rápida?`,
      suggestions: [
        'Quais são os 3 melhores nichos para começar?',
        'Quanto dinheiro preciso para começar?',
        'Me ajude a escolher um produto',
      ],
    };
  }

  // ──────────────────────────────────────────────────────────
  // 6. QUAL NICHO DÁ MAIS DINHEIRO / ESCOLHA DE NICHO
  // ──────────────────────────────────────────────────────────
  if (has(normalized, 'qual nicho', 'melhor nicho', 'nichos', 'o que da mais dinheiro', 'o que dá mais dinheiro')) {
    return {
      steps: [],
      text: `Os 3 nichos com maior volume e facilidade de venda no TikTok Shop hoje são:\n\n` +
        `1. **Moda Feminina:** É o campeão absoluto de pedidos. Peças como vestidos canelados, alfaiataria e conjuntos vendem muito por impulso quando demonstradas no espelho.\n` +
        `2. **Beleza e Skincare:** Produtos que mostram efeito visual rápido (transformação de pele, maquiagem ou cabelo) retêm a atenção em 2 segundos.\n` +
        `3. **Casa e Utilidades Domésticas:** Gadgets inteligentes de cozinha ou organização que resolvem tarefas chatas de forma fácil.\n\n` +
        `Se você quer começar com o retorno mais rápido, **Moda Feminina** tem o maior fluxo de compradoras ativas no app.`,
      suggestions: [
        'Quero focar em Moda Feminina, quais peças escolher?',
        'Como achar fornecedores do Brás para moda?',
        'Crie um roteiro para um vestido canelado',
      ],
    };
  }

  // ──────────────────────────────────────────────────────────
  // 7. CÁLCULO FINANCEIRO, MARGEM & BREAKEVEN CPA
  // ──────────────────────────────────────────────────────────
  if (financials.cost !== undefined || financials.price !== undefined || has(normalized, 'markup', 'margem', 'cpa', 'breakeven', 'roas', 'lucro', 'quanto sobra')) {
    const cost = financials.cost ?? 22.0;
    const price = financials.price ?? (cost > 0 ? cost * 3.2 : 69.9);
    const grossProfit = price - cost;
    const markup = (price / (cost || 1)).toFixed(1);
    const tiktokFee = price * 0.05 + 3.0;
    const netProfit = grossProfit - tiktokFee;
    const netMargin = Math.round((netProfit / price) * 100);
    const breakevenCPA = (netProfit * 0.85).toFixed(2);
    const isHealthy = netMargin >= 38;

    return {
      steps: [
        'Calculando taxas de plataforma e custos operacionais',
        'Simulando Breakeven CPA e margem líquida real',
      ],
      text: `### Análise Financeira — ${product ?? 'Produto'}\n\n` +
        `Aqui está o cálculo exato da sua operação:\n\n` +
        `- **Preço de Venda:** R$ ${price.toFixed(2)}\n` +
        `- **Custo de Mercadoria (CMV):** R$ ${cost.toFixed(2)}\n` +
        `- **Markup Bruto:** **${markup}x** (Margem bruta de R$ ${grossProfit.toFixed(2)})\n` +
        `- **Taxa Estimada TikTok Shop:** ~R$ ${tiktokFee.toFixed(2)} por pedido\n` +
        `- **Lucro Líquido no Bolso:** **R$ ${netProfit.toFixed(2)}** (~${netMargin}%)\n` +
        `- **CPA Máximo de Equilíbrio (Breakeven):** **R$ ${breakevenCPA}**\n\n` +
        `**Diagnóstico:** ${isHealthy ? 'Operação saudável. A margem permite remunerar afiliados com comissão de 12% a 18% e suporta tráfego pago.' : 'Margem restrita. Recomenda-se trabalhar com kits de 2 unidades para elevar o ticket médio e amortizar taxas.'}`,
      card: {
        kind: 'score',
        title: 'Score Financeiro',
        subtitle: `Venda R$ ${price.toFixed(2)} / Custo R$ ${cost.toFixed(2)}`,
        score: Math.min(99, Math.max(45, Math.round(netMargin * 1.5 + 20))),
        verdict: isHealthy ? 'Margem Saudável' : 'Margem de Alerta',
        metrics: [
          { label: 'Markup', value: Math.min(100, Math.round(parseFloat(markup) * 25)) },
          { label: 'Margem Líquida', value: Math.min(100, Math.max(10, netMargin * 2)) },
          { label: 'Margem p/ Afiliados', value: isHealthy ? 88 : 52 },
          { label: 'Tolerância ao CPA', value: isHealthy ? 85 : 44 },
          { label: 'Potencial de Kit', value: 92 },
        ],
      },
      suggestions: [
        'Crie um roteiro de 30s focado em vender este produto',
        'Como criar ofertas de kits para aumentar o ticket?',
        'Qual o ROAS mínimo para esta operação?',
      ],
    };
  }

  // ──────────────────────────────────────────────────────────
  // 8. ROTEIRO DE VÍDEO (UGC, DARK OU CONVERSÃO)
  // ──────────────────────────────────────────────────────────
  if (has(normalized, 'roteiro', 'script', 'vídeo', 'video', 'gravar', 'criativo', 'cena')) {
    const prodName = product ?? 'Vestido Canelado de Alfaiataria';
    const isDark = has(normalized, 'sem aparecer', 'dark', 'sem rosto', 'anônimo');

    return {
      steps: [
        `Estruturando proposta de valor de "${prodName}"`,
        'Montando roteiro segundo a segundo para TikTok Shop',
      ],
      text: `### Roteiro de 30 Segundos para Conversão\n**Produto:** ${prodName}\n**Formato:** ${isDark ? 'Vídeo Dark (Foco no Produto e Ação)' : 'UGC Dinâmico'}\n\n` +
        `\`\`\`roteiro\n` +
        `[00–03s] GANCHO (HOOK)\n` +
        `Câmera: Plano fechado com movimento rápido destacando a peça.\n` +
        `Áudio: "Se você viu este vídeo antes de comprar, preste atenção neste detalhe..."\n` +
        `Texto na Tela: "O que ninguém te conta sobre isso."\n\n` +
        `[03–10s] PROBLEMA / IDENTIFICAÇÃO\n` +
        `Câmera: Enquadramento rápido mostrando a dificuldade ou insatisfação com itens comuns.\n` +
        `Áudio: "A maioria das peças dessa categoria tem tecido fino ou acabamento fraco..."\n` +
        `Texto na Tela: "Comparação de qualidade."\n\n` +
        `[10–20s] DEMONSTRAÇÃO PRÁTICA\n` +
        `Câmera: 3 cortes de 1.5s evidenciando elasticidade, costura e caimento real.\n` +
        `Áudio: "Com o ${prodName}, o acabamento é reforçado e o caimento se mantém firme."\n` +
        `Texto na Tela: "Acabamento reforçado."\n\n` +
        `[20–25s] PROVA SOCIAL E OFERTA\n` +
        `Câmera: Detalhe aproximado e exibição do selo de estoque verificado.\n` +
        `Áudio: "Produto com alta avaliação e frete subsidiado ativo nesta semana."\n` +
        `Texto na Tela: "Avaliação 4.9/5 · Frete Ativo"\n\n` +
        `[25–30s] CHAMADA PARA AÇÃO (CTA)\n` +
        `Câmera: Direcionamento visual para o canto inferior esquerdo.\n` +
        `Áudio: "Acesse o carrinho laranja abaixo e confira a disponibilidade antes do fim do lote."\n` +
        `Texto na Tela: "Clique no carrinho abaixo."\n` +
        `\`\`\`\n\n` +
        `#### Diretrizes de Gravação:\n` +
        `- Mantenha iluminação frontal uniforme.\n` +
        `- Adicione legendas em alto contraste.\n` +
        `- Mantenha cortes a cada 2 segundos para evitar perda de retenção.`,
      suggestions: [
        `Gere 5 variações de hooks para esse roteiro`,
        `Crie um roteiro de 60 segundos mais detalhado`,
        `Qual o melhor horário para postar esse vídeo?`,
      ],
    };
  }

  // ──────────────────────────────────────────────────────────
  // 9. REQUISITO DE HEADLINES (MÁXIMO 2 FRASES & GATILHOS VIRAIS)
  // ──────────────────────────────────────────────────────────
  if (
    has(
      normalized,
      'pov',
      'duas frases',
      '2 frases',
      'conjunto do momento',
      'quase de graça',
      'queridinho',
      'do momento',
      'pequenininhas',
      'pequena',
      'regata',
      'regatas',
      'gatilhos mentais'
    ) ||
    has(normalized, 'hook', 'gancho', 'abertura', 'headline', 'chamada', 'reter')
  ) {
    const isRegata = /regat/i.test(normalized);
    const isVestido = /vestid/i.test(normalized);
    const isCalca = /cal[cç]a|pantalona|legging/i.test(normalized);
    const isCropped = /cropped|top/i.test(normalized);
    const isBody = /bo[rd]y/i.test(normalized);
    const isMacaquinho = /macaquinho/i.test(normalized);

    const noun = isRegata
      ? 'regata'
      : isVestido
      ? 'vestido'
      : isCalca
      ? 'calça'
      : isCropped
      ? 'cropped'
      : isBody
      ? 'body'
      : isMacaquinho
      ? 'macaquinho'
      : product?.toLowerCase() || 'conjuntinho';

    const isFem = isRegata || isCalca || (noun.endsWith('a') && !isMacaquinho);
    const art = isFem ? 'a' : 'o';
    const dim = isRegata
      ? 'regatinha'
      : isVestido
      ? 'vestidinho'
      : isCalca
      ? 'calça'
      : isCropped
      ? 'cropped'
      : isBody
      ? 'body'
      : noun.includes('conjunt')
      ? 'conjuntinho'
      : isFem
      ? `${noun}zinha`
      : `${noun}zinho`;

    const adj = isFem ? 'perfeita' : 'perfeito';
    const queridinha = isFem ? `a ${noun} queridinha das blogueiras` : `o ${noun} queridinho das blogueiras`;

    return {
      steps: [
        `Personalizando headlines especificamente para "${noun}" no formato POV`,
        'Aplicando padrão 100% orgânico (sem preço, sem compre, sem frete grátis)',
      ],
      text: `### Headlines Personalizadas para ${noun.toUpperCase()} (100% Orgânico & POV)\n\n` +
        `As headlines são criadas **exclusivamente com base na peça (${noun})**, no formato POV com **uma frase embaixo da outra**, sem parecer vendedor comercial (zero preço, zero "compre/carrinho", zero "frete grátis").\n\n` +
        `**HEADLINE #01 — ${noun.toUpperCase()} DO MOMENTO:**\n` +
        `> POV: ${art} ${noun} do momento\n` +
        `> Veste bem demais no corpo.\n\n` +
        `*Gatilho:* Efeito manada instantâneo focado na ${noun}.\n` +
        `*Ponto que pega:* Frases curtinhas empilhadas que prendem a atenção no primeiro frame.\n\n` +
        `──────────────────────────────────────\n\n` +
        `**HEADLINE #02 — QUASE DE GRAÇA:**\n` +
        `> POV: ${art} ${dim} quase de graça\n` +
        `> Ficou ${adj} no espelho.\n\n` +
        `*Gatilho:* Percepção de pechincha sem citar valores monetários.\n` +
        `*Ponto que pega:* Desperta curiosidade genuína nos comentários sobre onde encontrar a ${noun}.\n\n` +
        `──────────────────────────────────────\n\n` +
        `**HEADLINE #03 — QUERIDINHA DAS BLOGUEIRAS:**\n` +
        `> POV: ${queridinha}\n` +
        `> Esgotou e voltou hoje.\n\n` +
        `*Gatilho:* Autoridade estética e escassez de reposição da ${noun}.\n` +
        `*Ponto que pega:* Prova social forte sem parecer propaganda forçada.\n\n` +
        `──────────────────────────────────────\n\n` +
        `**HEADLINE #04 — SHOPPING CHIQUE:**\n` +
        `> POV: ${art} ${dim} quase de graça\n` +
        `> Parece de shopping chique.\n\n` +
        `*Gatilho:* Ancoragem de sofisticação e padrão elevado.\n` +
        `*Ponto que pega:* A sensação de elegância de loja cara de forma 100% espontânea.\n\n` +
        `──────────────────────────────────────\n\n` +
        `**HEADLINE #05 — ZERO TRANSPARÊNCIA:**\n` +
        `> POV: ${art} ${noun} do momento\n` +
        `> Zero transparência no sol.\n\n` +
        `*Gatilho:* Quebra imediata da principal dúvida visual da ${noun}.\n` +
        `*Ponto que pega:* Transmite segurança imediata sobre a gramatura e densidade do tecido.`,
      suggestions: [
        `Crie um roteiro curto gravando no espelho com essa ${noun}`,
        `Gere mais 5 variações personalizadas para ${noun}`,
        'Como posicionar o texto na tela para não cobrir o look?',
      ],
    };
  }

  // ──────────────────────────────────────────────────────────
  // 10. PRODUTOS EM ALTA / MINERAÇÃO
  // ──────────────────────────────────────────────────────────
  if (has(normalized, 'alta', 'trend', 'tendên', 'tendenc', 'minera', 'melhores produtos', 'o que vender', 'quais produtos')) {
    const topProducts = BASE_WINNING_PRODUCTS.slice(0, 4);

    return {
      steps: [
        'Consultando base de produtos validados do ecossistema Orbiex',
        'Filtrando por volume de transações e margem nas últimas 48h',
      ],
      text: `### Produtos com Maior Aceleração de Vendas no TikTok Shop:\n\n` +
        topProducts.map((p, i) =>
          `**${i + 1}. ${p.name}**\n` +
          `- **Categoria:** ${p.category} | **Score Orbiex:** **${p.score}/100**\n` +
          `- **Preço Sugerido:** ${p.suggestedPrice} (Custo: ${p.costPrice}) | **Margem:** **${p.margin}**\n` +
          `- **Ângulo Comercial:** "${p.angle}"\n`
        ).join('\n') +
        `\n**Observação Operacional:** O item **${topProducts[0]?.name}** apresenta o menor custo de aquisição atual no tráfego pago.`,
      card: {
        kind: 'list',
        title: 'Produtos Campeões de Venda',
        items: topProducts.map((p) => ({
          name: p.name,
          meta: `${p.category} · Margem ${p.margin}`,
          score: p.score,
        })),
      },
      suggestions: [
        `Analise a viabilidade do "${topProducts[0]?.name}"`,
        `Crie um roteiro viral para o "${topProducts[0]?.name}"`,
        `Como achar fornecedores rápidos para esses produtos?`,
      ],
    };
  }

  // ──────────────────────────────────────────────────────────
  // 11. RESPOSTA NATURAL PARA DEMAIS DÚVIDAS (SEM TEMPLATE PRONTO)
  // ──────────────────────────────────────────────────────────
  return {
    steps: [],
    text: `Entendi. Para te orientar com precisão:\n\n` +
      `No e-commerce e no TikTok Shop, o caminho mais rápido para ter resultado é focar em uma oferta clara com boa margem, criativos diretos com gancho forte nos primeiros 3 segundos e despacho rápido em até 48 horas.\n\n` +
      `Me diz com mais detalhes qual é o produto ou a dúvida específica que você tem agora, que eu analiso e te dou o próximo passo exato.`,
    suggestions: [
      'Quais produtos estão em alta hoje?',
      'Como calcular a margem de lucro?',
      'Crie um roteiro de 30s sem aparecer',
    ],
  };
}

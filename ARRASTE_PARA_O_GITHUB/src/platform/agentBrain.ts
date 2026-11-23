import { analyze, verdictLabel } from './mock';
import { BASE_WINNING_PRODUCTS } from './productsStore';
import { shuffle, pickOne, jitter } from './aiGenerate';

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

/* ─────────────────────────── utilitários de variação ─────────────────────────── */

function pickN<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, Math.max(0, n));
}

function brl(v: number): string {
  return v.toFixed(2).replace('.', ',');
}

/** Preço psicológico terminando em ,90 */
function price90(v: number): number {
  return Math.max(9.9, Math.floor(v) + 0.9);
}

function clampText(s: string, max = 110): string {
  const t = s.replace(/\s+/g, ' ').trim();
  return t.length > max ? `${t.slice(0, max - 1).trim()}…` : t;
}

/* ─────────────────────────── contexto por categoria ─────────────────────────── */

type Cat = 'fitness' | 'moda' | 'beleza' | 'tech' | 'casa' | 'pet' | 'infantil' | 'acessorio' | 'geral';

interface CatData {
  label: string;
  benefits: string[];
  objections: string[];
  demos: string[];
  pains: string[];
  audiences: string[];
  price: [number, number];
}

const CAT_RULES: { cat: Cat; re: RegExp }[] = [
  { cat: 'fitness', re: /legging|fitness|academia|treino|macaquinho|suplex|yoga|top esportivo|modelador/i },
  { cat: 'tech', re: /fone|carregador|smartwatch|rel[óo]gio inteligente|gadget|\bled\b|celular|caixa de som|power ?bank|cabo|ring ?light|trip[ée]|mouse|teclado|c[âa]mera|mini projetor/i },
  { cat: 'moda', re: /vestid|cal[cç]a|saia|blusa|cropped|regata|\bbody\b|conjunt|short|blazer|camisa|alfaiataria|jaqueta|moletom|biqu[ií]ni|mai[ôo]|lingerie|suti[ãa]|pijama|sa[ií]da de praia|flare/i },
  { cat: 'beleza', re: /s[ée]rum|creme|batom|maquiagem|skin ?care|perfume|cabelo|shampoo|m[áa]scara|hidratante|protetor|esmalte|escova secadora|chapinha|cosm[ée]tico|gloss/i },
  { cat: 'casa', re: /lumin[áa]ria|organizador|cozinha|processador|\bmop\b|panela|garrafa|copo|t[ée]rmic|lixeira|tapete|cortina|almofada|liquidificador|air ?fryer|umidificador|aspirador|pote/i },
  { cat: 'pet', re: /\bpet\b|cachorro|gato|coleira|ra[çc][ãa]o|arranhador/i },
  { cat: 'infantil', re: /beb[êe]|infantil|crian[çc]a|brinquedo|mamadeira/i },
  { cat: 'acessorio', re: /rel[óo]gio|colar|anel|brinco|pulseira|[óo]culos|bolsa|carteira|joia|bon[ée]/i },
];

const CAT_DATA: Record<Cat, CatData> = {
  fitness: {
    label: 'Moda Fitness',
    benefits: ['não fica transparente no agachamento', 'tem cós que não enrola', 'modela sem apertar', 'segura tudo no treino pesado', 'seca rápido e não marca suor', 'empina e desenha o corpo na hora'],
    objections: ['transparência no agachamento', 'cós que enrola', 'tecido que esgarça', 'tamanho que não serve', 'costura que marca'],
    demos: ['agachamento profundo de costas para a câmera', 'tecido esticado contra a luz da janela', 'giro de 360° no espelho da academia', 'mão puxando o cós para mostrar a firmeza', 'pulo e corrida curta mostrando que nada sai do lugar'],
    pains: ['treinar puxando a legging o tempo todo', 'passar vergonha com legging transparente', 'comprar conjunto que esgarça na segunda lavagem'],
    audiences: ['mulheres que treinam 3x por semana', 'iniciantes de academia', 'quem faz yoga e pilates', 'mães que treinam em casa'],
    price: [59, 129],
  },
  moda: {
    label: 'Moda Feminina',
    benefits: ['veste bem em vários tipos de corpo', 'não amassa nem precisa passar', 'valoriza a cintura na hora', 'parece peça de boutique', 'tem zero transparência', 'combina do trabalho ao happy hour'],
    objections: ['tecido fino', 'tamanho errado', 'cor diferente da foto', 'caimento duvidoso', 'costura frágil'],
    demos: ['giro lento no espelho mostrando o caimento', 'close na costura e no forro', 'antes e depois trocando de look', 'tecido esticado e solto para provar que não deforma', 'caminhada em direção à câmera'],
    pains: ['gastar com roupa que não veste bem', 'comprar peça que chega diferente da foto', 'ficar sem roupa para ocasião especial'],
    audiences: ['mulheres de 20 a 40 anos', 'quem trabalha em escritório', 'quem ama look básico e elegante', 'quem compra por impulso no feed'],
    price: [49, 119],
  },
  beleza: {
    label: 'Beleza & Cuidados',
    benefits: ['mostra resultado visível no primeiro uso', 'tem textura leve e absorve rápido', 'dura o dia todo', 'substitui dois produtos de uma vez', 'deixa a pele com efeito glow'],
    objections: ['alergia ou irritação', 'resultado que demora', 'textura pegajosa', 'produto falsificado', 'cheiro forte'],
    demos: ['metade do rosto com e metade sem o produto', 'textura em close na mão', 'teste de duração depois de 8 horas', 'aplicação em tempo real sem cortes', 'antes e depois com a mesma luz'],
    pains: ['gastar com produto que não entrega nada', 'acordar com a pele opaca', 'retocar a maquiagem toda hora'],
    audiences: ['quem tem pele oleosa', 'iniciantes em skincare', 'mulheres de 25 a 45 anos', 'quem quer rotina rápida de manhã'],
    price: [29, 99],
  },
  tech: {
    label: 'Eletrônicos & Gadgets',
    benefits: ['resolve um problema chato em segundos', 'cabe no bolso', 'tem bateria que dura dias', 'funciona sem configuração complicada', 'parece produto de marca cara'],
    objections: ['bateria fraca', 'parar de funcionar rápido', 'compatibilidade com o celular', 'qualidade de som ou imagem', 'demora na entrega'],
    demos: ['unboxing rápido seguido do primeiro uso', 'comparação lado a lado com o modelo comum', 'teste de queda ou resistência', 'demonstração em primeira pessoa no dia a dia', 'cronômetro na tela mostrando a velocidade'],
    pains: ['ficar sem bateria na rua', 'perder tempo com aparelho que trava', 'pagar caro em marca famosa'],
    audiences: ['quem trabalha com o celular', 'estudantes', 'quem ama gadget de utilidade', 'motoristas de aplicativo'],
    price: [39, 149],
  },
  casa: {
    label: 'Casa & Utilidades',
    benefits: ['economiza tempo na rotina', 'organiza tudo em poucos minutos', 'é fácil de limpar', 'deixa o ambiente com cara de revista', 'ocupa pouco espaço'],
    objections: ['material frágil', 'difícil de limpar', 'tamanho menor que o esperado', 'não funcionar como no vídeo', 'chegar quebrado'],
    demos: ['antes e depois do ambiente', 'uso real na cozinha em tempo acelerado', 'close no material e no encaixe', 'satisfying de organização em 10 segundos', 'comparação com o jeito antigo de fazer'],
    pains: ['perder tempo com tarefa chata em casa', 'viver com a casa bagunçada', 'gastar com utensílio que quebra'],
    audiences: ['donas de casa', 'quem mora sozinho', 'casais recém-casados', 'quem ama casa organizada'],
    price: [29, 109],
  },
  pet: {
    label: 'Pet',
    benefits: ['deixa o pet calmo e feliz', 'facilita a rotina do tutor', 'é resistente a mordidas', 'é fácil de lavar'],
    objections: ['o pet não se adaptar', 'material tóxico', 'tamanho errado para a raça', 'durar pouco'],
    demos: ['reação do pet no primeiro contato', 'teste de resistência com mordida', 'rotina do tutor antes e depois', 'close no material'],
    pains: ['ver o pet entediado em casa', 'limpar sujeira do pet todo dia', 'jogar dinheiro em brinquedo que dura um dia'],
    audiences: ['tutores de cachorro', 'tutores de gato', 'quem mora em apartamento com pet'],
    price: [25, 89],
  },
  infantil: {
    label: 'Infantil & Bebê',
    benefits: ['entretém a criança por horas', 'é seguro e sem peças soltas', 'facilita a vida dos pais', 'estimula o desenvolvimento'],
    objections: ['segurança do material', 'a criança enjoar rápido', 'tamanho e idade indicada', 'difícil de limpar'],
    demos: ['reação da criança usando', 'close no material e acabamento', 'rotina dos pais antes e depois', 'teste de resistência'],
    pains: ['não ter um minuto livre com a criança', 'gastar com brinquedo que quebra', 'sofrer na hora de dar banho ou comida'],
    audiences: ['mães de primeira viagem', 'pais de crianças de 1 a 6 anos', 'avós que gostam de presentear'],
    price: [29, 119],
  },
  acessorio: {
    label: 'Acessórios',
    benefits: ['eleva qualquer look básico', 'não escurece nem descasca', 'parece peça de grife', 'é presente perfeito'],
    objections: ['escurecer com o tempo', 'parecer barato', 'tamanho no corpo', 'causar alergia'],
    demos: ['close macro com reflexo de luz', 'comparação com peça de grife', 'look completo antes e depois do acessório', 'teste com água e perfume'],
    pains: ['ter acessório que escurece em uma semana', 'pagar caro em joalheria', 'ficar sem presente de última hora'],
    audiences: ['quem ama look elegante', 'quem procura presente', 'mulheres de 18 a 40 anos'],
    price: [29, 99],
  },
  geral: {
    label: 'Achadinhos',
    benefits: ['resolve um problema real no dia a dia', 'é fácil de demonstrar em vídeo', 'tem preço de impulso', 'gera efeito "eu preciso disso"'],
    objections: ['qualidade duvidosa', 'demora na entrega', 'não funcionar como no vídeo', 'tamanho diferente do esperado'],
    demos: ['demonstração em primeira pessoa', 'antes e depois', 'unboxing com primeiro uso', 'comparação com a alternativa comum'],
    pains: ['perder tempo com solução que não funciona', 'gastar com coisa que não dura', 'passar raiva com o jeito antigo de fazer'],
    audiences: ['quem compra por impulso no feed', 'público de 18 a 45 anos', 'quem ama achadinho útil'],
    price: [29, 99],
  },
};

interface ProductCtx extends CatData {
  name: string;
  cat: Cat;
}

function productCtx(name: string): ProductCtx {
  const rule = CAT_RULES.find((r) => r.re.test(name));
  const cat: Cat = rule ? rule.cat : 'geral';
  return { name, cat, ...CAT_DATA[cat] };
}

/** Faixa de preço sugerida coerente com a categoria, variando a cada chamada */
function suggestedPriceRange(ctx: ProductCtx): [number, number] {
  const [lo, hi] = ctx.price;
  const a = price90(jitter(lo + (hi - lo) * 0.2, (hi - lo) * 0.12, lo, hi));
  const b = price90(jitter(lo + (hi - lo) * 0.7, (hi - lo) * 0.12, a + 10, hi + 20));
  return [a, Math.max(b, a + 10)];
}

/** Análise do produto com variação coerente (base do analyze + jitter) */
function varyAnalysis(product: string) {
  const base = analyze(product, PRODUCT_METRICS);
  const values = base.values.map((v) => jitter(v, 6, 35, 99));
  const score = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  return { values, score };
}

function hookPool(ctx: ProductCtx): string[] {
  const n = ctx.name;
  const b = pickOne(ctx.benefits);
  const o = pickOne(ctx.objections);
  const d = pickOne(ctx.demos);
  const p = pickOne(ctx.pains);
  return [
    `Se você ainda não conhece ${n}, presta atenção nesses 3 segundos...`,
    `Eu duvidei que ${n} ${b}. Olha isso.`,
    `Ninguém te conta isso sobre ${n}...`,
    `Parei de ${p} depois que achei ${n}.`,
    `Teste real sem cortes: ${d}.`,
    `Se ${o} é o seu medo, assiste até o final.`,
    `POV: você finalmente achou ${n} que ${b}.`,
    `3 motivos para ${n} estar esgotando no TikTok Shop.`,
    `Comprei ${n} achando que era golpe. Me enganei feio.`,
    `Antes de comprar ${n}, veja esse detalhe.`,
    `O que acontece quando ${n} encontra ${pickOne(ctx.audiences)}...`,
    `Eu fiz o teste mais cruel com ${n}: ${d}.`,
  ];
}

const has = (q: string, ...words: string[]) => words.some((w) => q.includes(w));

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
    .replace(/\bpq\b/g, 'porque')
    .replace(/\bpor que\b/g, 'porque')
    .replace(/\bkd\b/g, 'cadê')
    .replace(/\bqto\b/g, 'quanto')
    .replace(/\bqnt\b/g, 'quanto')
    .replace(/\bvlw\b/g, 'obrigado')
    .replace(/\bobg\b/g, 'obrigado')
    .replace(/\btmj\b/g, 'tamo junto')
    .replace(/\bcê\b/g, 'você')
    .replace(/\bce\b/g, 'você');
  return s;
}

/** Extrai menção de produto ou assunto principal */
export function extractProduct(text: string): string | null {
  const quoted = text.match(/["“]([^"”]{2,60})["”]/);
  if (quoted) return quoted[1].trim();

  const patterns = [
    /\b(?:produto|loja|peça|item|gadget)\s+(?:chamado|de|nomeado|denominado)?\s*([a-záàâãéèêíïóôõöúçñ0-9\s-]{3,45})/i,
    /\b(?:analis[ea]|avalie|score|validar?)\s+(?:o|a|esse|este|esta)?\s*(?:produto)?\s*([a-záàâãéèêíïóôõöúçñ0-9\s-]{3,45})/i,
    /\b(?:roteiro|hooks?|ganchos?|headlines?|vídeo|video|anúncio|script)\s+(?:de\s+\d+\s*s\w*\s+)?(?:para|de|pro|pra|do|da)\s*(?:o|a|um|uma)?\s*([a-záàâãéèêíïóôõöúçñ0-9\s-]{3,45})/i,
    /\b(?:vender|vendendo|escala)\s+([a-záàâãéèêíïóôõöúçñ0-9\s-]{3,45})\s+(?:no|na|pelo)/i,
    /\b(?:o que acha d[oa]|acha bom|é bom)\s+(?:o|a|esse|este|esta)?\s*([a-záàâãéèêíïóôõöúçñ0-9\s-]{3,45})/i,
  ];

  for (const pat of patterns) {
    const m = text.match(pat);
    if (m && m[1]) {
      const cleaned = m[1].replace(/\b(no|na|em|para|com|por|que|como|e|ou|tiktok|shop|vender|esse|este|produto|disso|dele|dela|sem|aparecer)\b.*$/i, '').trim();
      if (cleaned.length >= 3 && !/^(uma?|esse|este|aquele|meu|sua|qual|como|onde|quando|dele|dela|disso|bom|ruim|\d+\s*s\w*)$/i.test(cleaned)) {
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

/* ─────────────────────────── motor principal ─────────────────────────── */

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

  const attItems: AttachmentItem[] = (attachments ?? []).map((a) =>
    typeof a === 'string' ? { name: a } : a
  );
  const hasImages = attItems.some((a) => a.type?.startsWith('image/') || a.dataUrl?.startsWith('data:image/') || /\.(png|jpe?g|webp|gif)$/i.test(a.name));

  // ──────────────────────────────────────────────────────────
  // 1. ANÁLISE DE IMAGEM ENVIADA
  // ──────────────────────────────────────────────────────────
  if (hasImages || (attItems.length > 0 && has(normalized, 'imagem', 'foto', 'analis', 'veja', 'olha', 'esse', 'print', 'anexo'))) {
    const imgName = attItems[0]?.name || 'Imagem recebida';
    const subject = product ?? imgName.replace(/\.[a-z0-9]+$/i, '').replace(/[_-]+/g, ' ');
    const ctx = productCtx(subject);
    const metrics = [
      { label: 'Apelo Visual', value: jitter(86, 9, 55, 99) },
      { label: 'Contraste & Luz', value: jitter(80, 12, 45, 99) },
      { label: 'Adequação 9:16', value: jitter(78, 14, 40, 99) },
      { label: 'Potencial de Clique', value: jitter(84, 10, 50, 99) },
      { label: 'Clareza de Detalhe', value: jitter(81, 11, 45, 99) },
    ];
    const score = Math.round(metrics.reduce((a, m) => a + m.value, 0) / metrics.length);
    const weakest = [...metrics].sort((a, b) => a.value - b.value)[0];
    const strongest = [...metrics].sort((a, b) => b.value - a.value)[0];

    const fixByMetric: Record<string, string[]> = {
      'Apelo Visual': ['Coloque um elemento de contexto (mão, ambiente real) para o produto não parecer foto de catálogo.', 'Teste um fundo de cor contrastante com o produto para ele "saltar" no feed.'],
      'Contraste & Luz': ['Grave de frente para uma janela, com luz difusa, para tirar as sombras duras.', 'Suba a exposição em +0,3 no CapCut e reduza levemente os realces para revelar a textura.'],
      'Adequação 9:16': ['Recorte em 9:16 deixando o produto no terço central superior, longe do carrinho e dos ícones laterais.', 'Afaste um pouco a câmera: hoje as bordas cortam parte do produto no formato vertical.'],
      'Potencial de Clique': ['Adicione um texto de 2 linhas no topo com o benefício principal nos primeiros 2 segundos.', 'Use a imagem como primeiro frame por no máximo 1 segundo e corte para a demonstração.'],
      'Clareza de Detalhe': ['Faça um close extra no acabamento: é o detalhe que mais quebra a objeção de qualidade.', 'Evite zoom digital; aproxime o celular fisicamente para manter a nitidez.'],
    };

    const intro = pickOne([
      `### Análise da Imagem: **${imgName}**\n\nOlhei a composição pensando em como ela performa no feed do TikTok Shop${product ? ` para **${product}**` : ''}.`,
      `### Diagnóstico Visual — **${subject}**\n\nAvaliei a imagem como se ela fosse o primeiro frame de um criativo de ${ctx.label.toLowerCase()}.`,
      `### Leitura Comercial da Imagem (**${imgName}**)\n\nAqui vai o que ajuda e o que atrapalha a conversão dessa foto${product ? ` de **${product}**` : ''}.`,
    ]);

    const hooks = pickN(hookPool(ctx), 3);

    return {
      steps: shuffle([
        `Carregando imagem (${imgName})`,
        'Examinando composição, iluminação e foco',
        'Simulando o frame no formato 9:16 com a interface do TikTok',
      ]).concat('Consolidando diagnóstico de conversão'),
      text:
        `${intro}\n\n` +
        `#### Ponto mais forte: ${strongest.label} (${strongest.value}/100)\n` +
        `${pickOne([
          'Esse é o ativo que você deve explorar logo no primeiro segundo do vídeo.',
          'Mantenha esse padrão nos próximos criativos, ele sustenta a credibilidade.',
          'É o que segura o dedo de quem está rolando o feed.',
        ])}\n\n` +
        `#### Ponto a melhorar: ${weakest.label} (${weakest.value}/100)\n` +
        `- ${pickOne(fixByMetric[weakest.label] ?? ['Ajuste esse ponto antes de subir o criativo.'])}\n` +
        `- ${pickOne(shuffle(Object.values(fixByMetric).flat()))}\n\n` +
        `#### Ganchos para usar com essa imagem:\n` +
        hooks.map((h, i) => `> **Gancho ${i + 1}:** "${h}"`).join('\n'),
      card: {
        kind: 'score',
        title: 'Score Visual da Imagem',
        subtitle: imgName,
        score,
        verdict: score >= 85 ? 'Aprovado para Criativos' : score >= 72 ? 'Bom, com ajustes' : 'Refazer antes de postar',
        metrics,
      },
      suggestions: pickN([
        `Crie um roteiro de 30s para ${subject}`,
        'Qual o preço de venda ideal para esse produto?',
        `Gere mais 3 ganchos para ${subject}`,
        'Como melhorar a iluminação dessa foto?',
        `Crie headlines POV para ${subject}`,
      ], 3),
    };
  }

  // ──────────────────────────────────────────────────────────
  // 2. CONVERSAÇÃO NATURAL
  // ──────────────────────────────────────────────────────────
  if (
    /\b(voc[eê]\s*t[aá]\s*bem|voc[eê]\s*est[aá]\s*bem|voc[eê]\s*est[aá]\s*bom|como\s*(voc[eê]\s*)?t[aá]|como\s*vai|como\s*est[aá]|tudo\s*bem|tudo\s*bom|tudo\s*certo)\b/i.test(normalized) ||
    /^(oi|ol[aá]|e\s*a[ií]|opa|fala|salve|fala\s*a[ií]|fala\s*tu)\b/i.test(normalized)
  ) {
    const starterSuggestions = pickN([
      'Esse produto é bom para vender no TikTok Shop?',
      'Quais produtos estão em alta hoje?',
      'Como começar a vender no TikTok Shop?',
      'Crie um roteiro de 30s sem aparecer',
      'Gere 5 ganchos para o meu produto',
      'Como calcular a margem de lucro?',
    ], 3);

    if (
      /\b(voc[eê]\s*t[aá]\s*bem|voc[eê]\s*est[aá]\s*bem|com\s*voc[eê]|como\s*(voc[eê]\s*)?t[aá]|como\s*vai)\b/i.test(normalized) ||
      /^(tudo bem|beleza|tudo bom)\??$/.test(normalized)
    ) {
      return {
        steps: [],
        text: pickOne([
          'Tudo ótimo por aqui, e com você?\n\nMe conta: tem algum produto em mente, uma dúvida ou uma imagem para eu analisar?',
          'Por aqui tudo certo e pronto para trabalhar! E você, como está?\n\nSe quiser, já me manda o produto que você está pensando em vender.',
          'Tudo bem sim, obrigado por perguntar! E aí, como anda a operação?\n\nPosso validar um produto, criar roteiro ou montar ganchos agora mesmo.',
          'Estou bem e com a cabeça cheia de ideias de criativo. E você?\n\nQual é o desafio de hoje no TikTok Shop?',
        ]),
        suggestions: starterSuggestions,
      };
    }

    if (/^(tudo\s*bem|tudo\s*bom|tudo\s*certo|tudo\s*ótimo|comigo\s*t[aá]\s*bem|de\s*boa|tranquilo)[.!]?$/i.test(normalized)) {
      return {
        steps: [],
        text: pickOne([
          'Perfeito. O que você precisa analisar ou estruturar hoje?',
          'Que bom! Bora fazer o dia render: qual produto ou dúvida vamos atacar?',
          'Show. Me fala o que está travando sua operação que eu te ajudo a destravar.',
        ]),
        suggestions: starterSuggestions,
      };
    }

    return {
      steps: [],
      text: pickOne([
        'Olá! Tudo bem? Como posso te ajudar na sua operação hoje?',
        'Opa! Seja bem-vindo. Quer validar um produto, criar um roteiro ou tirar alguma dúvida?',
        'Fala! Estou por aqui. Me manda o nome do produto ou sua dúvida e a gente resolve junto.',
        'Oi! Pronto para trabalhar. Qual é o foco de hoje: produto, criativo ou estratégia?',
      ]),
      suggestions: starterSuggestions,
    };
  }

  // ──────────────────────────────────────────────────────────
  // 3. "ESSE PRODUTO É BOM?" / "VALE A PENA?"
  // ──────────────────────────────────────────────────────────
  if (has(normalized, 'é bom', 'e bom', 'vale a pena', 'é lucrativo', 'e lucrativo', 'dá dinheiro', 'da dinheiro', 'o que acha', 'oque acha', 'acha bom', 'funciona', 'compensa')) {
    if (product && product !== 'Produto em Análise') {
      const ctx = productCtx(product);
      const r = varyAnalysis(product);
      const verdict = verdictLabel(r.score);
      const [pMin, pMax] = suggestedPriceRange(ctx);
      const cmv = jitter(30, 4, 22, 40);
      const metrics = PRODUCT_METRICS.map((label, i) => ({ label, value: r.values[i] }));
      const best = [...metrics].sort((a, b) => b.value - a.value)[0];
      const worst = [...metrics].sort((a, b) => a.value - b.value)[0];
      const positive = r.score >= 72;

      const opening = pickOne(
        positive
          ? [
              `Sobre **${product}**: sim, vejo potencial real no TikTok Shop (score ${r.score}/100, ${verdict.toLowerCase()}).`,
              `**${product}** passa no meu filtro: ${r.score}/100. O ponto mais forte é **${best.label.toLowerCase()}** (${best.value}).`,
              `Analisei **${product}** dentro de ${ctx.label}: score de ${r.score}/100, o que coloca ele como ${verdict.toLowerCase()}.`,
            ]
          : [
              `Sobre **${product}**: dá para vender, mas com cuidado (score ${r.score}/100, ${verdict.toLowerCase()}).`,
              `**${product}** ficou em ${r.score}/100. Não descartaria, mas o gargalo é **${worst.label.toLowerCase()}** (${worst.value}).`,
              `Olhei **${product}** com calma: ${r.score}/100. É um produto que exige criativo muito bom para compensar.`,
            ],
      );

      const reasons = pickN(ctx.benefits, 2).map((b) => `- Quando o vídeo prova que ele ${b}, a decisão de compra fica fácil;`);
      reasons.push(pickOne([
        `- Público com mais chance de compra: ${pickOne(ctx.audiences)};`,
        `- Demonstração que mais converte: ${pickOne(ctx.demos)};`,
        `- A dor que ele resolve é clara: parar de ${pickOne(ctx.pains)};`,
      ]));

      const risks = shuffle([
        `- A principal objeção vai ser **${pickOne(ctx.objections)}**: quebre isso nos primeiros 10 segundos;`,
        `- O custo da mercadoria deve ficar em no máximo ~${cmv}% do preço de venda para sobrar margem depois das taxas;`,
        `- ${worst.label} está no ponto mais baixo (${worst.value}/100), então ${worst.label === 'Concorrência' ? 'diferencie pelo ângulo do criativo, não pelo preço' : worst.label === 'Logística' ? 'priorize fornecedor que despache em até 48h' : 'teste antes de investir pesado'};`,
        `- Trabalhe com fornecedor que despache rápido e tenha estoque das variações mais vendidas;`,
      ]).slice(0, 2);

      const closing = pickOne([
        `Quer que eu calcule a margem com o seu custo real de ${product}?`,
        `Posso montar agora um roteiro de 30s focado em ${pickOne(ctx.objections)}. Quer?`,
        `Me passa o preço de custo que eu te digo exatamente quanto sobra por venda.`,
        `Recomendo testar 2 a 3 criativos diferentes. Quer que eu escreva os ganchos?`,
      ]);

      return {
        steps: [],
        text:
          `${opening}\n\n` +
          `**${pickOne(['Por que pode vender bem', 'O que joga a favor', 'Pontos fortes'])}:**\n${reasons.join('\n')}\n` +
          `- Faixa de preço que eu testaria: **R$ ${brl(pMin)} a R$ ${brl(pMax)}**.\n\n` +
          `**${pickOne(['Pontos de atenção', 'Onde pode travar', 'Cuidados antes de escalar'])}:**\n${risks.join('\n')}\n\n` +
          closing,
        card: {
          kind: 'score',
          title: 'Score do Produto',
          subtitle: product,
          score: r.score,
          verdict,
          metrics,
        },
        suggestions: pickN([
          `Crie um roteiro de 30s para vender ${product}`,
          `Qual o preço e margem ideal para ${product}?`,
          `Gere 5 ganchos para ${product}`,
          `Crie headlines POV para ${product}`,
          `Qual o público ideal para ${product}?`,
        ], 3),
      };
    }
    return {
      steps: [],
      text: pickOne([
        'Qual é o produto que você quer que eu avalie? Me fala o nome (ou manda uma foto) que eu analiso demanda, concorrência e margem.',
        'Me diz o nome do produto que você está de olho. Com isso eu te dou o score, a faixa de preço e os riscos.',
        'Para eu te responder com precisão, preciso saber qual produto é. Pode escrever entre aspas, tipo "luminária pôr do sol".',
      ]),
      suggestions: pickN(
        ['Vestido Canelado Midi', 'Mini Processador Portátil', 'Luminária Pôr do Sol', ...BASE_WINNING_PRODUCTS.slice(0, 6).map((p) => p.name)],
        3,
      ).map((n) => `"${n}" é bom para vender?`),
    };
  }

  // ──────────────────────────────────────────────────────────
  // 4. "QUEM É VOCÊ?"
  // ──────────────────────────────────────────────────────────
  if (has(normalized, 'quem é você', 'quem e voce', 'o que você faz', 'o que voce faz', 'como você me ajuda', 'qual sua função')) {
    const skills = pickN([
      'validar se um produto tem demanda real no TikTok Shop',
      'calcular comissão, margem e CPA de equilíbrio',
      'criar roteiros de 15 a 60 segundos com gancho forte',
      'escrever headlines POV e ganchos para os primeiros 3 segundos',
      'analisar fotos, prints e criativos',
      'montar estratégia para vender sem aparecer',
    ], 4);
    return {
      steps: [],
      text: pickOne([
        `Sou o **Orbiex**, seu agente de IA para **TikTok Shop, afiliados e vendas sem aparecer**.\n\nNa prática eu consigo:\n${skills.map((s) => `- ${s};`).join('\n')}\n\nMe manda um produto ou uma dúvida que eu já começo.`,
        `Prazer, sou o **Orbiex**. Pense em mim como um sócio que entende de TikTok Shop.\n\nPosso ${skills.slice(0, 3).join(', ')} e ${skills[3]}.\n\nPor onde você quer começar?`,
        `Eu sou o **Orbiex**, o agente de IA da sua operação.\n\nMeu trabalho é ${skills[0]}, ${skills[1]} e ${skills[2]}. Tudo focado em gerar venda, sem teoria.\n\nQual o seu próximo passo hoje?`,
      ]),
      suggestions: pickN(['Analise um produto para mim', 'Como calcular a margem de lucro?', 'Quais produtos estão em alta hoje?', 'Crie um roteiro de 30s sem aparecer'], 3),
    };
  }

  // ──────────────────────────────────────────────────────────
  // 5. COMO COMEÇAR
  // ──────────────────────────────────────────────────────────
  if (has(normalized, 'como começar', 'como comecar', 'por onde começo', 'por onde comeco', 'passo a passo', 'primeiros passos')) {
    const isAffiliate = has(normalized, 'afiliad', 'comiss');
    const prod = product ? `**${product}**` : 'um produto âncora';
    const steps = isAffiliate
      ? [
          `**Ative sua conta de criador:** habilite o TikTok Shop for Creators e cumpra os requisitos de seguidores (se faltar, use o Turbo de Seguidores).`,
          `**Escolha ${prod}:** prefira itens com comissão acima de ${jitter(12, 3, 8, 20)}% e muitos vídeos recentes vendendo.`,
          `**Adicione à vitrine:** solicite a amostra grátis quando disponível, isso melhora muito o criativo.`,
          `**Poste ${pickOne(['2 a 3', '3', '3 a 4'])} vídeos por dia:** 15 a 30 segundos, com o produto aparecendo no primeiro segundo.`,
          `**Analise depois de 7 dias:** mantenha os ângulos que trouxeram cliques e descarte o resto.`,
        ]
      : [
          `**Abra sua loja no Seller Center:** CNPJ (MEI já serve) e conta bancária configurada.`,
          `**Escolha ${prod}:** preço entre R$ ${brl(price90(jitter(45, 6, 29, 60)))} e R$ ${brl(price90(jitter(80, 10, 60, 120)))} e margem de pelo menos ${jitter(42, 5, 35, 55)}%.`,
          `**Cadastre na vitrine:** ${pickOne(['4 a 5 fotos limpas', 'fotos em fundo claro e uma em uso real', 'pelo menos uma foto mostrando tamanho/escala'])} e ative o frete grátis da primeira compra.`,
          `**Grave ${pickOne(['2 a 3', '3'])} vídeos por dia:** produto em uso real e carrinho vinculado.`,
          `**Convide afiliados:** ofereça comissão de ${jitter(15, 4, 8, 25)}% para multiplicar os criadores falando do produto.`,
        ];
    return {
      steps: [],
      text:
        pickOne([
          'Aqui está o passo a passo direto:',
          `Vamos ao caminho mais curto${product ? ` para começar com ${product}` : ''}:`,
          'Sem enrolação, é assim que eu começaria hoje:',
        ]) +
        '\n\n' +
        steps.slice(0, pickOne([4, 5])).map((s, i) => `${i + 1}. ${s}`).join('\n') +
        '\n\n' +
        pickOne([
          'Você já tem algum produto em vista ou quer sugestões de itens com saída rápida?',
          'Quer que eu valide um produto antes de você começar?',
          'Se me disser seu orçamento inicial, eu ajusto esse plano para você.',
        ]),
      suggestions: pickN(['Quais são os 3 melhores nichos para começar?', 'Quanto dinheiro preciso para começar?', 'Me ajude a escolher um produto', 'Como funciona a comissão de afiliado?'], 3),
    };
  }

  // ──────────────────────────────────────────────────────────
  // 6. NICHOS
  // ──────────────────────────────────────────────────────────
  if (has(normalized, 'qual nicho', 'melhor nicho', 'nichos', 'o que da mais dinheiro', 'o que dá mais dinheiro')) {
    const niches = [
      { name: 'Moda Feminina', why: 'campeã de pedidos; peças demonstradas no espelho vendem por impulso', ex: ['vestido canelado', 'calça flare', 'cropped frente única', 'conjunto de linho'] },
      { name: 'Moda Fitness', why: 'compra recorrente e prova visual fácil (agachamento, transparência)', ex: ['shorts modelador', 'legging empina bumbum', 'macaquinho blackout'] },
      { name: 'Beleza e Skincare', why: 'efeito visual rápido segura a atenção em 2 segundos', ex: ['sérum facial', 'escova secadora', 'gloss labial'] },
      { name: 'Casa e Utilidades', why: 'vídeos "satisfying" de antes e depois viralizam com facilidade', ex: ['organizador de geladeira', 'mini processador', 'luminária pôr do sol'] },
      { name: 'Gadgets', why: 'efeito "eu preciso disso" e ótima retenção em demonstração', ex: ['mini projetor', 'fone sem fio', 'carregador portátil'] },
      { name: 'Pet', why: 'público apaixonado e vídeos com reação do pet engajam muito', ex: ['comedouro lento', 'escova removedora de pelos', 'brinquedo interativo'] },
    ];
    const chosen = pickN(niches, 3);
    const top = pickOne(chosen);
    return {
      steps: [],
      text:
        pickOne([
          'Hoje eu olharia para estes 3 nichos no TikTok Shop:',
          'Se fosse começar agora, minha escolha seria entre:',
          'Os nichos com melhor relação volume x facilidade agora são:',
        ]) +
        '\n\n' +
        chosen.map((n, i) => `${i + 1}. **${n.name}:** ${n.why}. Exemplos: ${pickN(n.ex, 2).join(' e ')}.`).join('\n') +
        `\n\n${pickOne([
          `Para retorno mais rápido, eu começaria por **${top.name}**.`,
          `Minha aposta para começar: **${top.name}**, pela facilidade de criar vídeos.`,
          `Se tiver que escolher um só, vá de **${top.name}** e teste 2 produtos ao mesmo tempo.`,
        ])}`,
      suggestions: [
        `Quero focar em ${top.name}, quais produtos escolher?`,
        `Crie um roteiro para ${pickOne(top.ex)}`,
        pickOne(['Como achar fornecedores confiáveis?', 'Qual margem mínima para esse nicho?']),
      ],
    };
  }

  // ──────────────────────────────────────────────────────────
  // 7. CÁLCULO FINANCEIRO
  // ──────────────────────────────────────────────────────────
  if (financials.cost !== undefined || financials.price !== undefined || has(normalized, 'markup', 'margem', 'cpa', 'breakeven', 'roas', 'lucro', 'quanto sobra')) {
    const assumedCost = financials.cost === undefined;
    const cost = financials.cost ?? jitter(22, 6, 10, 40);
    const price = financials.price ?? price90(cost > 0 ? cost * (3 + Math.random() * 0.5) : 69.9);
    const grossProfit = price - cost;
    const markupNum = price / (cost || 1);
    const markup = markupNum.toFixed(1);
    const tiktokFee = price * 0.05 + 3.0;
    const netProfit = grossProfit - tiktokFee;
    const netMargin = Math.round((netProfit / price) * 100);
    const breakevenCPA = netProfit * 0.85;
    const minRoas = breakevenCPA > 0 ? price / breakevenCPA : 0;
    const isHealthy = netMargin >= 38;
    const name = product ?? 'seu produto';

    const advice = isHealthy
      ? pickN([
          `A margem permite pagar comissão de ${jitter(14, 3, 10, 20)}% para afiliados sem apertar o caixa.`,
          `Dá para rodar tráfego pago com ROAS mínimo de ${minRoas.toFixed(1)}.`,
          `Considere um kit de 2 unidades para subir o ticket e diluir a taxa fixa.`,
          `Reserve ~${jitter(4, 1, 3, 6)}% do faturamento para trocas e devoluções.`,
        ], 2)
      : pickN([
          'Trabalhe com kits de 2 unidades para elevar o ticket e amortizar taxas.',
          `Tente negociar o custo para perto de R$ ${brl(price * 0.3)} com o fornecedor.`,
          `Suba o preço para R$ ${brl(price90(cost * 3.2))} e teste se a conversão se mantém.`,
          'Evite tráfego pago por enquanto: priorize orgânico e afiliados.',
        ], 2);

    return {
      steps: shuffle(['Calculando taxas de plataforma e custos operacionais', 'Simulando Breakeven CPA e margem líquida real']),
      text:
        `### ${pickOne(['Análise Financeira', 'Raio-X da Margem', 'Conta Real da Operação'])} — ${name}\n\n` +
        (assumedCost ? `_Você não informou o custo, então simulei com R$ ${brl(cost)}. Me passe o valor real para um cálculo exato._\n\n` : '') +
        `- **Preço de Venda:** R$ ${brl(price)}\n` +
        `- **Custo de Mercadoria (CMV):** R$ ${brl(cost)}\n` +
        `- **Markup Bruto:** **${markup}x** (margem bruta de R$ ${brl(grossProfit)})\n` +
        `- **Taxa Estimada TikTok Shop:** ~R$ ${brl(tiktokFee)} por pedido\n` +
        `- **Lucro Líquido no Bolso:** **R$ ${brl(netProfit)}** (~${netMargin}%)\n` +
        `- **CPA Máximo de Equilíbrio:** **R$ ${brl(breakevenCPA)}**\n\n` +
        `**Diagnóstico:** ${isHealthy ? pickOne(['Operação saudável.', 'Margem confortável.', 'Números bons para escalar.']) : pickOne(['Margem restrita.', 'A conta está apertada.', 'Cuidado: sobra pouco por venda.'])} ${advice.join(' ')}`,
      card: {
        kind: 'score',
        title: 'Score Financeiro',
        subtitle: `Venda R$ ${brl(price)} / Custo R$ ${brl(cost)}`,
        score: Math.min(99, Math.max(30, Math.round(netMargin * 1.5 + 20))),
        verdict: isHealthy ? 'Margem Saudável' : 'Margem de Alerta',
        metrics: [
          { label: 'Markup', value: Math.min(100, Math.round(markupNum * 25)) },
          { label: 'Margem Líquida', value: Math.min(100, Math.max(5, netMargin * 2)) },
          { label: 'Margem p/ Afiliados', value: jitter(isHealthy ? 86 : 50, 6, 20, 99) },
          { label: 'Tolerância ao CPA', value: jitter(isHealthy ? 83 : 44, 6, 15, 99) },
          { label: 'Potencial de Kit', value: jitter(85, 8, 50, 99) },
        ],
      },
      suggestions: pickN([
        `Crie um roteiro de 30s para vender ${name}`,
        'Como criar ofertas de kits para aumentar o ticket?',
        'Qual o ROAS mínimo para esta operação?',
        'Quanto pagar de comissão para afiliados?',
      ], 3),
    };
  }

  // ──────────────────────────────────────────────────────────
  // 8. ROTEIRO DE VÍDEO
  // ──────────────────────────────────────────────────────────
  if (has(normalized, 'roteiro', 'script', 'vídeo', 'video', 'gravar', 'criativo', 'cena')) {
    const prodName = product ?? pickOne(BASE_WINNING_PRODUCTS.slice(0, 8)).name;
    const ctx = productCtx(prodName);
    const isDark = has(normalized, 'sem aparecer', 'dark', 'sem rosto', 'anônimo', 'anonimo');
    const secMatch = normalized.match(/(\d{2})\s*(s\b|seg)/);
    const total = secMatch ? Math.min(90, Math.max(15, parseInt(secMatch[1], 10))) : pickOne([20, 25, 30]);
    const cut = (f: number) => Math.round(total * f);
    const t = (a: number, b: number) => `[${String(a).padStart(2, '0')}–${String(b).padStart(2, '0')}s]`;
    const b1 = cut(0.12), b2 = cut(0.35), b3 = cut(0.68), b4 = cut(0.85);
    const [benefitA, benefitB] = pickN(ctx.benefits, 2);
    const objection = pickOne(ctx.objections);
    const [demoA, demoB] = pickN(ctx.demos, 2);
    const hook = pickOne(hookPool(ctx));

    const cam = (opts: string[]) => (isDark ? pickOne(opts.map((o) => o.replace(/rosto|influenciadora|modelo/gi, 'mãos'))) : pickOne(opts));

    const script =
      `IDIOMA OBRIGATÓRIO DA FALA E ÁUDIO (GOOGLE FLOW / VEO 3): Fala 100% em Português do Brasil (pt-BR) nativo — PROIBIDO falar em inglês (SPOKEN AUDIO LANGUAGE: Strictly Brazilian Portuguese pt-BR ONLY, NEVER speak English).\n\n` +
      `${t(0, b1)} GANCHO\n` +
      `Câmera: ${cam(['Close rápido no produto com movimento de entrada.', 'Plano detalhe já em ação, sem introdução.', 'Mãos entrando no quadro segurando o produto.'])}\n` +
      `Áudio (Fala em Português do Brasil): "${hook}"\n` +
      `Texto na Tela: "${pickOne([`${objection}? Olha isso.`, 'Assiste até o final.', `${prodName}: teste real`, 'Eu não acreditei.'])}"\n\n` +
      `${t(b1, b2)} PROBLEMA / IDENTIFICAÇÃO\n` +
      `Câmera: ${cam(['Corte para a situação comum que dá errado.', 'Comparação lado a lado com a versão comum.', 'Expressão de frustração da modelo antes do produto.'])}\n` +
      `Áudio: "${pickOne([`Quem nunca sofreu com ${objection}?`, `Eu cansei de ${pickOne(ctx.pains)}.`, `O problema de quase todo produto assim é ${objection}.`])}"\n\n` +
      `${t(b2, b3)} DEMONSTRAÇÃO\n` +
      `Câmera: ${demoA[0].toUpperCase() + demoA.slice(1)}; depois ${demoB}.\n` +
      `Áudio: "${pickOne([`Com ${prodName} é diferente: ele ${benefitA}.`, `Olha só: ${prodName} ${benefitA} e ainda ${benefitB}.`, `Repara como ele ${benefitA}. Sem truque.`])}"\n` +
      `Texto na Tela: "${pickOne([benefitA, benefitB, 'Sem cortes, sem filtro'])}"\n\n` +
      `${t(b3, b4)} PROVA SOCIAL\n` +
      `Câmera: ${pickOne(['Print das avaliações sobreposto ao produto.', 'Close no acabamento com a embalagem ao fundo.', 'Sequência rápida de 3 usos diferentes.'])}\n` +
      `Áudio: "${pickOne([`Por isso ${prodName} tá com milhares de avaliações boas.`, 'Já é o segundo que eu compro.', `Todo mundo que viu aqui em casa pediu o link.`])}"\n\n` +
      `${t(b4, total)} CHAMADA PARA AÇÃO\n` +
      `Câmera: ${pickOne(['Apontar para o canto inferior esquerdo.', 'Produto em destaque e zoom out suave.', 'Mão tocando a tela na altura do carrinho.'])}\n` +
      `Áudio: "${pickOne(['Deixei o link no carrinho laranja aqui embaixo.', 'Corre no carrinho que esse lote acaba rápido.', `O link de ${prodName} tá fixado aqui embaixo.`])}"`;

    return {
      steps: [`Estruturando proposta de valor de "${prodName}"`, `Montando roteiro de ${total}s segundo a segundo`],
      text:
        `### Roteiro de ${total} Segundos ${pickOne(['para Conversão', 'Focado em Venda', 'com Gancho Forte'])}\n**Produto:** ${prodName}\n**Formato:** ${isDark ? 'Vídeo Dark (sem rosto, foco no produto e nas mãos)' : pickOne(['UGC Dinâmico', 'UGC Depoimento', 'Demonstração Real'])}\n**Público:** ${pickOne(ctx.audiences)}\n\n` +
        '```roteiro\n' + script + '\n```\n\n' +
        `#### Diretrizes de Gravação:\n` +
        pickN([
          '- Mantenha iluminação frontal uniforme (janela ou ring light).',
          '- Legendas em alto contraste, longe da área do carrinho.',
          '- Cortes a cada 1,5 a 2 segundos para segurar a retenção.',
          `- Mostre ${prodName} logo no primeiro frame.`,
          '- Use som comercial em alta com volume baixo sob a fala.',
          `- Grave uma versão alternativa abrindo com a quebra de "${objection}".`,
        ], 3).join('\n'),
      suggestions: pickN([
        `Gere 5 variações de hooks para ${prodName}`,
        `Crie um roteiro de 60 segundos para ${prodName}`,
        'Qual o melhor horário para postar esse vídeo?',
        `Crie headlines POV para ${prodName}`,
        `Crie outro roteiro sem aparecer para ${prodName}`,
      ], 3),
    };
  }

  // ──────────────────────────────────────────────────────────
  // 9. HEADLINES / HOOKS
  // ──────────────────────────────────────────────────────────
  if (
    has(normalized, 'pov', 'duas frases', '2 frases', 'conjunto do momento', 'quase de graça', 'queridinho', 'do momento', 'pequenininhas', 'pequena', 'regata', 'regatas', 'gatilhos mentais') ||
    has(normalized, 'hook', 'gancho', 'abertura', 'headline', 'chamada', 'reter')
  ) {
    const isRegata = /regat/i.test(normalized);
    const isVestido = /vestid/i.test(normalized);
    const isCalca = /cal[cç]a|pantalona|legging/i.test(normalized);
    const isCropped = /cropped|\btop\b/i.test(normalized);
    const isBody = /\bbo[rd]y\b/i.test(normalized);
    const isMacaquinho = /macaquinho/i.test(normalized);

    const noun = isRegata ? 'regata' : isVestido ? 'vestido' : isCalca ? 'calça' : isCropped ? 'cropped' : isBody ? 'body' : isMacaquinho ? 'macaquinho' : product?.toLowerCase() || 'conjuntinho';
    const isFem = isRegata || isCalca || (/a$/.test(noun.split(' ')[0]) && !isMacaquinho);
    const art = isFem ? 'a' : 'o';
    const head = noun.split(' ')[0];
    const dim = isRegata ? 'regatinha' : isVestido ? 'vestidinho' : isCalca ? 'calça' : isCropped ? 'cropped' : isBody ? 'body' : noun.includes('conjunt') ? 'conjuntinho' : noun.includes(' ') ? noun : isFem ? `${head.replace(/a$/, '')}inha` : `${head.replace(/o$/, '')}inho`;
    const adj = isFem ? 'perfeita' : 'perfeito';
    const ctx = productCtx(noun);

    const pool: { l1: string; l2: string; gat: string; ponto: string }[] = [
      { l1: `POV: ${art} ${noun} do momento`, l2: pickOne(['Veste bem demais no corpo.', 'Todo mundo perguntando onde comprei.', 'Não tiro mais do corpo.']), gat: 'Efeito manada', ponto: 'Frases curtas empilhadas que prendem no primeiro frame.' },
      { l1: `POV: ${art} ${dim} quase de graça`, l2: pickOne([`Ficou ${adj} no espelho.`, 'Parece de shopping chique.', 'Ninguém acredita no valor.']), gat: 'Percepção de pechincha sem citar preço', ponto: `Gera comentários perguntando onde encontrar ${art} ${noun}.` },
      { l1: `POV: ${isFem ? `a ${noun} queridinha` : `o ${noun} queridinho`} das blogueiras`, l2: pickOne(['Esgotou e voltou hoje.', 'Agora eu entendi o motivo.', 'Finalmente chegou o meu.']), gat: 'Autoridade estética + escassez', ponto: 'Prova social forte sem parecer propaganda.' },
      { l1: `POV: você achou ${art} ${noun} que ${pickOne(ctx.benefits)}`, l2: pickOne(['E não quer mais outro.', 'Demorou, mas achou.', 'Salva antes que suma.']), gat: 'Resolução de dor', ponto: 'Mostra o benefício sem soar vendedor.' },
      { l1: `Ninguém fala disso sobre ${art} ${noun}`, l2: pickOne([`Mas ${pickOne(ctx.objections)} aqui não existe.`, 'Olha esse detalhe.', 'Repara no acabamento.']), gat: 'Curiosidade', ponto: 'Obriga a pessoa a assistir para descobrir o detalhe.' },
      { l1: `Eu tinha medo de ${pickOne(ctx.objections)}`, l2: `Até provar ${art} ${noun}.`, gat: 'Quebra de objeção', ponto: 'Fala a dúvida que a cliente já tem na cabeça.' },
      { l1: `${isFem ? 'A' : 'O'} ${noun} que eu repetiria todo dia`, l2: pickOne(['Sem vergonha nenhuma.', 'E ainda recebo elogio.', 'Combina com tudo.']), gat: 'Identificação', ponto: 'Tom de amiga indicando, gera confiança.' },
      { l1: `POV: ${art} ${noun} chegou`, l2: pickOne(['E é melhor que na foto.', 'E eu já quero outra cor.', 'E servi certinho.']), gat: 'Expectativa x realidade', ponto: 'Quebra o medo de comprar online.' },
      { l1: `Teste do espelho com ${art} ${noun}`, l2: pickOne(['Zero transparência no sol.', 'Agachei e nada apareceu.', 'Caimento que não marca.']), gat: 'Prova visual', ponto: 'Promete uma demonstração e entrega no vídeo.' },
      { l1: `Se você é baixinha, ${art} ${noun}`, l2: pickOne(['Foi feito para você.', 'Vai virar seu favorito.', 'Alonga demais a silhueta.']), gat: 'Segmentação', ponto: 'Chama um público específico, que se sente visto.' },
      { l1: `${isFem ? 'A' : 'O'} ${noun} mais elogiad${art} do meu armário`, l2: pickOne(['E foi o mais barato.', 'E ninguém acredita de onde é.', 'Toda vez que uso alguém pergunta.']), gat: 'Prova social pessoal', ponto: 'Desperta desejo pela reação dos outros.' },
    ];
    const chosen = pickN(pool, 5);

    return {
      steps: [`Personalizando headlines para "${noun}" no formato POV`, 'Aplicando padrão orgânico (sem preço, sem "compre", sem frete grátis)'],
      text:
        `### Headlines para ${noun.toUpperCase()} (${pickOne(['Orgânico & POV', 'Sem Fala, 2 Linhas', 'Estilo Blogueira'])})\n\n` +
        `${pickOne([
          `Criei cada headline pensando só ${isFem ? 'na' : 'no'} ${noun}, uma frase embaixo da outra, sem cara de anúncio.`,
          `Todas focadas ${isFem ? 'na' : 'no'} ${noun}, com tom de indicação de amiga e zero preço ou "compre".`,
          `Duas linhas curtas, leitura em menos de 2 segundos, tudo sobre ${art} ${noun}.`,
        ])}\n\n` +
        chosen
          .map(
            (h, i) =>
              `**HEADLINE #${String(i + 1).padStart(2, '0')}:**\n> ${h.l1}\n> ${h.l2}\n\n*Gatilho:* ${h.gat}.\n*Ponto que pega:* ${h.ponto}`,
          )
          .join('\n\n──────────────────────────────────────\n\n'),
      suggestions: pickN([
        `Crie um roteiro curto gravando no espelho com ${art} ${noun}`,
        `Gere mais 5 variações para ${noun}`,
        'Como posicionar o texto na tela para não cobrir o look?',
        `Crie 5 ganchos falados para ${noun}`,
      ], 3),
    };
  }

  // ──────────────────────────────────────────────────────────
  // 10. PRODUTOS EM ALTA
  // ──────────────────────────────────────────────────────────
  if (has(normalized, 'alta', 'trend', 'tendên', 'tendenc', 'minera', 'melhores produtos', 'o que vender', 'quais produtos')) {
    const topProducts = pickN(BASE_WINNING_PRODUCTS.slice(0, 10), 4)
      .map((p) => ({ ...p, live: jitter(p.score, 2, 50, 99) }))
      .sort((a, b) => b.live - a.live);
    const lead = topProducts[0];

    return {
      steps: ['Consultando base de produtos validados do ecossistema Orbiex', pickOne(['Filtrando por volume de transações nas últimas 48h', 'Cruzando margem, comissão e aceleração de vendas'])],
      text:
        `### ${pickOne(['Produtos com Maior Aceleração Agora', 'Radar de Produtos em Alta', 'Seleção de Hoje no TikTok Shop'])}\n\n` +
        topProducts
          .map(
            (p, i) =>
              `**${i + 1}. ${p.name}**\n` +
              `- **Categoria:** ${p.category} | **Score Orbiex:** **${p.live}/100**\n` +
              `- **Preço Sugerido:** ${p.suggestedPrice} (Custo: ${p.costPrice}) | **Margem:** **${p.margin}**\n` +
              `- **${pickOne(['Ângulo Comercial', 'Melhor ângulo', 'Como vender'])}:** "${pickOne([p.angle, p.hook].filter(Boolean))}"\n`,
          )
          .join('\n') +
        `\n**${pickOne(['Observação', 'Minha leitura', 'Dica'])}:** ${pickOne([
          `${lead?.name} é o que eu testaria primeiro hoje.`,
          `${lead?.name} está com a melhor aceleração do grupo.`,
          `Comece por ${lead?.name} e use ${topProducts[1]?.name} como segundo teste.`,
        ])}`,
      card: {
        kind: 'list',
        title: 'Produtos Campeões de Venda',
        items: topProducts.map((p) => ({ name: p.name, meta: `${p.category} · Margem ${p.margin}`, score: p.live })),
      },
      suggestions: [
        `"${lead?.name}" é bom para vender?`,
        `Crie um roteiro viral para "${pickOne(topProducts).name}"`,
        pickOne(['Como achar fornecedores rápidos para esses produtos?', 'Qual desses tem a melhor comissão?']),
      ],
    };
  }

  // ──────────────────────────────────────────────────────────
  // 11. DEMAIS DÚVIDAS — responde usando as palavras do usuário
  // ──────────────────────────────────────────────────────────
  const topicTips: { re: RegExp; tips: string[] }[] = [
    { re: /comiss|afiliad/, tips: ['Priorize produtos com comissão acima de 12% e vídeos recentes vendendo.', 'Peça amostra grátis ao vendedor: vídeo com produto real converte muito mais.', 'Compare a comissão em reais, não só em porcentagem.'] },
    { re: /seguidor|crescer|engaj/, tips: ['Poste 3 vídeos por dia por 14 dias seguidos antes de avaliar.', 'Use séries (parte 1, parte 2) para transformar visualização em seguidor.', 'Responda comentários com vídeo, o algoritmo adora.'] },
    { re: /live/, tips: ['Comece com lives de 40 a 60 minutos em horário fixo.', 'Tenha 3 produtos e um roteiro de oferta a cada 10 minutos.', 'Fixe um comentário com o produto principal.'] },
    { re: /restri|bloque|viola|ban/, tips: ['Evite promessas absolutas ("cura", "garantido", "emagrece").', 'O produto do vídeo tem que ser idêntico ao do carrinho.', 'Use apenas sons da biblioteca comercial.'] },
    { re: /view|visualiza|flop|alcance/, tips: ['Os 3 primeiros segundos decidem: comece já com movimento e texto na tela.', 'Não apague vídeos fracos; alguns começam a entregar depois de 48h.', 'Varie o ângulo do gancho a cada vídeo, não só a legenda.'] },
    { re: /ia|kling|flow|midjourney|prompt/, tips: ['Use o Gerador de Prompts para criar a cena e o Extrator de Movimentos para animar.', 'Mantenha CFG entre 0,45 e 0,55 no Kling para não deformar.', 'Finalize no CapCut com legenda nativa e som comercial.'] },
    { re: /fornecedor|estoque|entrega|frete/, tips: ['Prefira fornecedor que despache em até 48h.', 'Peça fotos e vídeo real do estoque antes de fechar.', 'Ative o frete grátis da primeira compra na vitrine.'] },
  ];
  const matched = topicTips.filter((t) => t.re.test(normalized));
  const tipPool = matched.length
    ? matched.flatMap((m) => m.tips)
    : [
        'Foque em uma oferta validada e demonstre o benefício nos 3 primeiros segundos.',
        'Mantenha estética natural de celular, sem cara de comercial de TV.',
        'Poste com consistência diária e analise os números semanalmente.',
        'Teste ângulos diferentes de gancho antes de mudar de produto.',
        'Use a vitrine com no máximo 5 produtos para não dispersar a atenção.',
      ];
  const quote = clampText(raw, 100);

  return {
    steps: [],
    text:
      pickOne([
        `Sobre "${quote}":`,
        `Entendi sua pergunta ("${quote}"). Vamos por partes:`,
        `Boa pergunta. Pensando em "${quote}", eu faria assim:`,
        `Sobre o que você perguntou — "${quote}" — vai aqui o caminho prático:`,
      ]) +
      '\n\n' +
      pickN(tipPool, 3).map((t, i) => `${i + 1}. ${t}`).join('\n') +
      '\n\n' +
      pickOne([
        `${product ? `Como você mencionou **${product}**, ` : ''}me dá mais detalhes que eu monto o próximo passo exato.`,
        'Se me disser o produto ou o objetivo exato, eu personalizo isso para o seu caso.',
        'Quer que eu transforme isso em um plano de 7 dias?',
      ]),
    suggestions: pickN([
      'Quais produtos estão em alta hoje?',
      'Como calcular a margem de lucro?',
      'Crie um roteiro de 30s sem aparecer',
      'Como ganhar mais seguidores rápido?',
      'Como evitar restrição no TikTok Shop?',
      product ? `Analise "${product}" para mim` : 'Analise um produto para mim',
    ], 3),
  };
}

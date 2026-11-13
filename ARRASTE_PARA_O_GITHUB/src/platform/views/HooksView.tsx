import React, { useState, useRef, useMemo } from 'react';
import {
  Upload,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  Flame,
  ShieldCheck,
  ArrowRight,
  ScanEye,
  Zap,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useProducts, type WinningProduct } from '../productsStore';

export interface ViralHook {
  id: string;
  category:
    | 'Quebra de Objeção'
    | 'Efeito Visual'
    | 'Padrão de Grife'
    | 'Curiosidade Extrema'
    | 'Composição de Estilo'
    | 'Modelagem & Caimento';
  spokenHook: string;
  overlayText: string;
  visualAction: string;
  whyItWorks: string;
}

export type ClothingCategory =
  | 'fitness'
  | 'vestido'
  | 'cropped'
  | 'modelador'
  | 'alfaiataria'
  | 'praia'
  | 'geral';

const CATEGORY_LABELS: Record<ClothingCategory, string> = {
  fitness: 'Moda Fitness / Legging',
  vestido: 'Vestidos & Macacões',
  cropped: 'Croppeds & Tops',
  modelador: 'Modeladores & Cintas',
  alfaiataria: 'Alfaiataria & Blazers',
  praia: 'Moda Praia & Biquínis',
  geral: 'Moda Feminina Geral',
};

// Amostras padrão para demonstração instantânea
const SAMPLE_PRODUCTS = [
  {
    name: 'Vestido Midi Canelado com Fenda Lateral',
    image: 'https://i.imgur.com/2cQbml3.jpeg',
    category: 'vestido' as ClothingCategory,
  },
  {
    name: 'Conjunto Fitness Top & Calça Legging Anatômica',
    image: 'https://i.imgur.com/0FkLiB3.jpeg',
    category: 'fitness' as ClothingCategory,
  },
  {
    name: 'Macaquinho Fitness Blackout Zero Transparência',
    image: 'https://i.imgur.com/K1umUq5.jpeg',
    category: 'fitness' as ClothingCategory,
  },
  {
    name: 'Top Cropped Frente Única com Amarração',
    image: 'https://i.imgur.com/9QappSG.jpeg',
    category: 'cropped' as ClothingCategory,
  },
  {
    name: 'Body Modelador Anatômico Invisível',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
    category: 'modelador' as ClothingCategory,
  },
];

interface PieceGrammar {
  article: string;
  demonstrative: string;
  noun: string;
  diminutive: string;
  adjective: string;
  gender: 'f' | 'm';
}

function extractPieceGrammar(name: string): PieceGrammar {
  const clean = name.toLowerCase().trim();

  if (/regat/i.test(clean)) {
    return { article: 'a', demonstrative: 'essa', noun: 'regata', diminutive: 'regatinha', adjective: 'perfeita', gender: 'f' };
  }
  if (/vestid/i.test(clean)) {
    return { article: 'o', demonstrative: 'esse', noun: 'vestido', diminutive: 'vestidinho', adjective: 'perfeito', gender: 'm' };
  }
  if (/bo[rd]y|mai[oô]/i.test(clean)) {
    return { article: 'o', demonstrative: 'esse', noun: 'body', diminutive: 'bodyzinho', adjective: 'perfeito', gender: 'm' };
  }
  if (/cropped|top/i.test(clean)) {
    return { article: 'o', demonstrative: 'esse', noun: 'cropped', diminutive: 'croppedzinho', adjective: 'perfeito', gender: 'm' };
  }
  if (/cal[cç]a|pantalona|legging/i.test(clean)) {
    const isLegging = /legging/i.test(clean);
    const word = isLegging ? 'legging' : /pantalona/i.test(clean) ? 'pantalona' : 'calça';
    return { article: 'a', demonstrative: 'essa', noun: word, diminutive: word, adjective: 'perfeita', gender: 'f' };
  }
  if (/saia/i.test(clean)) {
    const isShortSaia = /short/i.test(clean);
    return { article: isShortSaia ? 'o' : 'a', demonstrative: isShortSaia ? 'esse' : 'essa', noun: isShortSaia ? 'short saia' : 'saia', diminutive: isShortSaia ? 'short saia' : 'saiinha', adjective: isShortSaia ? 'perfeito' : 'perfeita', gender: isShortSaia ? 'm' : 'f' };
  }
  if (/short|bermuda/i.test(clean)) {
    const isBermuda = /bermuda/i.test(clean);
    return { article: isBermuda ? 'a' : 'o', demonstrative: isBermuda ? 'essa' : 'esse', noun: isBermuda ? 'bermuda' : 'short', diminutive: isBermuda ? 'bermudinha' : 'shortinho', adjective: isBermuda ? 'perfeita' : 'perfeito', gender: isBermuda ? 'f' : 'm' };
  }
  if (/macaquinho/i.test(clean)) {
    return { article: 'o', demonstrative: 'esse', noun: 'macaquinho', diminutive: 'macaquinho', adjective: 'perfeito', gender: 'm' };
  }
  if (/macac[aã]o/i.test(clean)) {
    return { article: 'o', demonstrative: 'esse', noun: 'macacão', diminutive: 'macacãozinho', adjective: 'perfeito', gender: 'm' };
  }
  if (/conjunt/i.test(clean)) {
    return { article: 'o', demonstrative: 'esse', noun: 'conjunto', diminutive: 'conjuntinho', adjective: 'perfeito', gender: 'm' };
  }
  if (/camisa|blusa|blusinha/i.test(clean)) {
    const word = /camisa/i.test(clean) ? 'camisa' : 'blusa';
    return { article: 'a', demonstrative: 'essa', noun: word, diminutive: 'blusinha', adjective: 'perfeita', gender: 'f' };
  }
  if (/jaqueta|casaco|cardigan|moletom|blazer/i.test(clean)) {
    const isFem = /jaqueta/i.test(clean);
    const word = clean.match(/jaqueta|casaco|cardigan|moletom|blazer/i)?.[0]?.toLowerCase() || 'peça';
    return { article: isFem ? 'a' : 'o', demonstrative: isFem ? 'essa' : 'esse', noun: word, diminutive: word, adjective: isFem ? 'perfeita' : 'perfeito', gender: isFem ? 'f' : 'm' };
  }

  const firstWord = clean.replace(/^(o|a|os|as|um|uma)\s+/i, '').split(/\s+/)[0] || 'peça';
  const endsWithA = firstWord.endsWith('a');
  return {
    article: endsWithA ? 'a' : 'o',
    demonstrative: endsWithA ? 'essa' : 'esse',
    noun: firstWord,
    diminutive: endsWithA ? `${firstWord.slice(0, -1)}inha` : `${firstWord}zinho`,
    adjective: endsWithA ? 'perfeita' : 'perfeito',
    gender: endsWithA ? 'f' : 'm',
  };
}

function inferCategoryFromName(name: string): ClothingCategory {
  const n = name.toLowerCase();
  if (n.includes('fitness') || n.includes('legging') || n.includes('macaquinho') || n.includes('academia') || n.includes('short') || n.includes('treino')) {
    return 'fitness';
  }
  if (n.includes('vestido') || n.includes('longo') || n.includes('midi') || n.includes('fenda') || n.includes('macacão') || n.includes('macacao')) {
    return 'vestido';
  }
  if (n.includes('cropped') || n.includes('corset') || n.includes('regata') || n.includes('blusa') || n.includes('top')) {
    return 'cropped';
  }
  if (n.includes('modelador') || n.includes('cinta') || n.includes('lipo') || n.includes('body')) {
    return 'modelador';
  }
  if (n.includes('alfaiataria') || n.includes('blazer') || n.includes('pantalona') || n.includes('camisa') || n.includes('social')) {
    return 'alfaiataria';
  }
  if (n.includes('praia') || n.includes('biquíni') || n.includes('biquini') || n.includes('maiô') || n.includes('saída') || n.includes('crochê') || n.includes('croche')) {
    return 'praia';
  }
  return 'geral';
}

export function HooksView({ onUse: _onUse }: { onUse?: (text: string) => void }) {
  // Passos: 'input' (seleção/upload) | 'analyzing' (laser scanner) | 'results' (hooks prontos)
  const [viewStep, setViewStep] = useState<'input' | 'analyzing' | 'results'>('input');

  // Dados da peça
  const [productName, setProductName] = useState('Vestido Midi Canelado com Fenda Lateral');
  const [productImage, setProductImage] = useState<string>('https://i.imgur.com/2cQbml3.jpeg');
  const [clothingCategory, setClothingCategory] = useState<ClothingCategory>('vestido');

  // Estado da análise neural
  const [scanProgress, setScanProgress] = useState(0);
  const [scanPhaseText, setScanPhaseText] = useState('Dissecando silhueta e textura da peça...');
  const [scanTags, setScanTags] = useState<string[]>(['Modelagem Detectada', 'Visão Computacional Ativa']);

  // Filtro de estilo nos resultados
  const [activeFilter, setActiveFilter] = useState<string>('Todos');

  // Estados de feedback de cópia
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [generationSeed, setGenerationSeed] = useState(1);
  const [aiHooks, setAiHooks] = useState<ViralHook[] | null>(null);

  const requestBackendHooks = (
    nameTarget: string,
    catTarget: ClothingCategory,
    imgTarget: string,
    seedTarget: number
  ) => {
    fetch('/api/generate-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'hooks',
        productName: nameTarget,
        clothingCategory: catTarget,
        seed: seedTarget,
        imageDataUrl: imgTarget?.startsWith('data:image/') ? imgTarget : undefined,
      }),
    })
      .then(async (res) => {
        if (!res.ok) return;
        const json = await res.json();
        if (Array.isArray(json?.hooks) && json.hooks.length >= 4) {
          const validCats: ViralHook['category'][] = [
            'Quebra de Objeção',
            'Efeito Visual',
            'Padrão de Grife',
            'Curiosidade Extrema',
            'Composição de Estilo',
            'Modelagem & Caimento',
          ];
          setAiHooks(
            json.hooks.map((h: any, idx: number) => ({
              id: `hook-ai-${seedTarget}-${idx}`,
              category: validCats.includes(h.category)
                ? h.category
                : validCats[idx % validCats.length],
              spokenHook: String(h.spokenHook || '').trim(),
              overlayText: String(h.overlayText || '').trim(),
              visualAction: String(h.visualAction || '').trim(),
              whyItWorks: String(h.whyItWorks || '').trim(),
            }))
          );
        }
      })
      .catch(() => {
        // Fallback automático para a engine local
      });
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const catalogScrollRef = useRef<HTMLDivElement>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);

  const scrollCatalog = (direction: 'left' | 'right') => {
    if (catalogScrollRef.current) {
      const scrollAmount = 360;
      catalogScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!catalogScrollRef.current) return;
    setIsMouseDown(true);
    setStartX(e.pageX - catalogScrollRef.current.offsetLeft);
    setScrollLeftState(catalogScrollRef.current.scrollLeft);
  };

  const handleMouseLeaveOrUp = () => {
    setIsMouseDown(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDown || !catalogScrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - catalogScrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    catalogScrollRef.current.scrollLeft = scrollLeftState - walk;
  };

  // Catálogo salvo na plataforma
  const { products } = useProducts();

  // Upload local de imagem da roupa
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setProductImage(reader.result);
          // Sugerir nome da peça pelo arquivo
          const cleanName = file.name
            .replace(/\.[^/.]+$/, '')
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, (l) => l.toUpperCase());
          setProductName(cleanName);
          setClothingCategory(inferCategoryFromName(cleanName));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setProductImage(reader.result);
          const cleanName = file.name
            .replace(/\.[^/.]+$/, '')
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, (l) => l.toUpperCase());
          setProductName(cleanName);
          setClothingCategory(inferCategoryFromName(cleanName));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Selecionar produto do catálogo
  const handleSelectCatalogProduct = (p: WinningProduct) => {
    const inferred = inferCategoryFromName(p.name);
    setProductName(p.name);
    setProductImage(p.image);
    setClothingCategory(inferred);
    setAiHooks(null);
    startScanAnalysis(p.name, inferred, p.image);
  };

  // Selecionar produto rápido de demonstração
  const handleSelectSample = (sample: (typeof SAMPLE_PRODUCTS)[0]) => {
    setProductName(sample.name);
    setProductImage(sample.image);
    setClothingCategory(sample.category);
    setAiHooks(null);
  };

  // Disparo da Análise Neural Realista (~3.8s) + Chamada Real à API
  const startScanAnalysis = (
    overrideName?: string | React.MouseEvent,
    overrideCat?: ClothingCategory,
    overrideImg?: string
  ) => {
    const targetName = typeof overrideName === 'string' ? overrideName : productName;
    const targetCat = overrideCat ?? clothingCategory;
    const targetImg = overrideImg ?? productImage;

    setViewStep('analyzing');
    setScanProgress(0);
    setScanPhaseText('Dissecando modelagem, silhueta e corte da peça...');
    setScanTags(['Modelagem Identificada', 'IA Vision Ativa']);
    requestBackendHooks(targetName, targetCat, targetImg, generationSeed);

    const startTime = Date.now();
    const totalDuration = 3800;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, Math.round((elapsed / totalDuration) * 100));
      setScanProgress(progress);

      if (progress < 25) {
        setScanPhaseText('Dissecando silhueta, costura e elasticidade aparente...');
        setScanTags(['Corte e Decote', 'Gramatura de Tecido']);
      } else if (progress < 55) {
        setScanPhaseText('Mapeando principais objeções femininas (transparência, caimento, cintura)...');
        setScanTags(['Quebra de Objeções', 'Gatilho do Espelho', 'Retenção Alta']);
      } else if (progress < 85) {
        setScanPhaseText('Identificando dinâmicas visuais de 0 a 3 segundos para o feed do TikTok...');
        setScanTags(['Ganchos de 0-3s', 'UGC Autêntico', 'Áudio de Abertura']);
      } else {
        setScanPhaseText('Estruturando 6 hooks virais com falas, overlays e ações de câmera...');
        setScanTags(['Hooks Prontos', 'TikTok Shop Validado', 'Neuromarketing 99%']);
      }

      if (elapsed >= totalDuration) {
        clearInterval(interval);
        setTimeout(() => {
          setViewStep('results');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 200);
      }
    }, 50);
  };

  // Gerador de Hooks Virais ultra-especializados com base no produto analisado (100% focado no nome da peça, ZERO menção a preço)
  const hooksList = useMemo<ViralHook[]>(() => {
    if (aiHooks && aiHooks.length > 0) {
      return aiHooks;
    }
    const g = extractPieceGrammar(productName);
    const cycle = (generationSeed - 1) % 3;

    if (cycle === 1) {
      return [
        {
          id: `hook-rot2-1-${generationSeed}`,
          category: 'Quebra de Objeção',
          spokenHook: `O maior medo de comprar ${g.noun} pela internet é o tecido enrolar ou amassar fácil. Olha a densidade e o caimento reto dessa peça.`,
          overlayText: `NÃO ENROLA E NÃO MARCA: O CAIMENTO D${g.article.toUpperCase()} ${g.noun.toUpperCase()}`,
          visualAction: 'Pressionar suavemente o tecido com os dedos e soltar no espelho, comprovando que a peça não cria vincos e mantém a estrutura.',
          whyItWorks: `Desmonta de imediato a desconfiança sobre durabilidade e firmeza do tecido de ${g.article} ${g.noun} sem artifícios comerciais.`,
        },
        {
          id: `hook-rot2-2-${generationSeed}`,
          category: 'Efeito Visual',
          spokenHook: `Gravei esse vídeo só para mostrar as costas e o caimento lateral d${g.article} ${g.noun}. A postura no corpo fica impecável.`,
          overlayText: `OLHA AS COSTAS E O CAIMENTO D${g.article.toUpperCase()} ${g.noun.toUpperCase()}`,
          visualAction: 'Virar de costas para o espelho olhando por cima do ombro, exibindo o alinhamento das costuras e o desenho traseiro.',
          whyItWorks: 'Vídeos que mostram o caimento traseiro e lateral geram os picos de maior retenção orgânica em vídeos de moda.',
        },
        {
          id: `hook-rot2-3-${generationSeed}`,
          category: 'Padrão de Grife',
          spokenHook: `A gramatura e a textura d${g.article} ${g.noun} deixam claro que se trata de uma confecção com corte estruturado e tecido premium.`,
          overlayText: `CORTE ESTRUTURADO: TEXTURA E TOQUE PREMIUM`,
          visualAction: 'Deslizar a mão pela superfície do tecido revelando o relevo e a consistência da malha diante da luz.',
          whyItWorks: 'Transmite autoridade estética e elegância imediata sem fazer qualquer menção a preço ou valores.',
        },
        {
          id: `hook-rot2-4-${generationSeed}`,
          category: 'Curiosidade Extrema',
          spokenHook: `O motivo exato pelo qual todo mundo no TikTok está comentando sobre o caimento d${g.article} ${g.noun}... Olha como veste no espelho.`,
          overlayText: `O MOTIVO D${g.article.toUpperCase()} ${g.noun.toUpperCase()} CHAMAR TANTA ATENÇÃO`,
          visualAction: 'Dar um passo à frente com expressão de aprovação genuína e afastar para mostrar o conjunto do look.',
          whyItWorks: 'Gatilho de prova social indireta e tendência de feed que induz o espectador a assistir até o fim.',
        },
        {
          id: `hook-rot2-5-${generationSeed}`,
          category: 'Composição de Estilo',
          spokenHook: `Aquela peça coringa do guarda-roupa que você veste em dois minutos e já está pronta e elegante para sair.`,
          overlayText: `PEÇA CORINGA: PRONTA E ELEGANTE EM DOIS MINUTOS`,
          visualAction: 'Ajeitar o look com movimentos rápidos e fluidos, pegando a bolsa e conferindo o visual com segurança.',
          whyItWorks: 'Resolve a dor da indecisão diária sobre o que vestir, valorizando a praticidade e sofisticação da peça.',
        },
        {
          id: `hook-rot2-6-${generationSeed}`,
          category: 'Modelagem & Caimento',
          spokenHook: `Se você procura ${g.noun} que valorize a cintura com conforto absoluto o dia inteiro, essa modelagem é a resposta.`,
          overlayText: `VALORIZA A CINTURA COM CONFORTO ABSOLUTO`,
          visualAction: 'Colocar as mãos na cintura em postura alinhada, respirando e demonstrando que a peça não sufoca nem aperta.',
          whyItWorks: 'Une os dois maiores anseios femininos: elegância estética sem abrir mão do bem-estar diário.',
        },
      ];
    }

    if (cycle === 2) {
      return [
        {
          id: `hook-rot3-1-${generationSeed}`,
          category: 'Quebra de Objeção',
          spokenHook: `Fiz o teste contra a luz para mostrar que ${g.demonstrative} ${g.noun} tem forro reforçado e zero transparência em qualquer ângulo.`,
          overlayText: `TESTE CONTRA A LUZ: FORRO REFORÇADO E ZERO TRANSPARÊNCIA`,
          visualAction: 'Posicionar a peça próxima à iluminação da janela esticando suavemente, provando opacidade completa.',
          whyItWorks: 'Elimina qualquer receio de transparência com prova visual irrefutável nos instantes iniciais.',
        },
        {
          id: `hook-rot3-2-${generationSeed}`,
          category: 'Efeito Visual',
          spokenHook: `Dificilmente uma peça veste tão bem logo na primeira prova. Olha o caimento d${g.article} ${g.noun} sem precisar de nenhum ajuste.`,
          overlayText: `CAIMENTO IMPECÁVEL SEM PRECISAR DE NENHUM AJUSTE`,
          visualAction: 'Dar uma volta completa no espelho com um sorriso espontâneo, admirando a fluidez do tecido no corpo.',
          whyItWorks: 'Gera empatia instantânea pela sensação de encontrar uma roupa com caimento impecável de primeira.',
        },
        {
          id: `hook-rot3-3-${generationSeed}`,
          category: 'Padrão de Grife',
          spokenHook: `O caimento dos ombros e a simetria das costuras d${g.article} ${g.noun} comprovam o nível de acabamento dessa confecção.`,
          overlayText: `SIMETRIA E CORTE ALINHADO: NÍVEL DE ALTA COSTURA`,
          visualAction: 'Ajustar os ombros ou decote com precisão no espelho, destacando o caimento simétrico e bem assentado.',
          whyItWorks: 'Foca no refinamento dos detalhes construtivos da roupa, atraindo um público qualificado.',
        },
        {
          id: `hook-rot3-4-${generationSeed}`,
          category: 'Curiosidade Extrema',
          spokenHook: `Aquele achadinho que você só encontra depois de pesquisar muito e que supera qualquer expectativa ao vivo.`,
          overlayText: `O ACHADINHO QUE SUPEROU TODAS AS EXPECTATIVAS`,
          visualAction: 'Expressão de quem fez uma descoberta incrível, recuando para mostrar o visual montado com harmonia.',
          whyItWorks: 'O gatilho do achadinho secreto estimula o compartilhamento e o engajamento imediato.',
        },
        {
          id: `hook-rot3-5-${generationSeed}`,
          category: 'Composição de Estilo',
          spokenHook: `Como usar ${g.demonstrative} ${g.noun} em ocasiões formais ou casuais apenas trocando os complementos do look.`,
          overlayText: `VERSATILIDADE PURA: DO FORMAL AO CASUAL`,
          visualAction: 'Demonstrar a postura da peça com braços soltos e passos leves, provando conforto em qualquer ambiente.',
          whyItWorks: 'Multiplica a percepção de utilidade da peça no cotidiano da consumidora.',
        },
        {
          id: `hook-rot3-6-${generationSeed}`,
          category: 'Modelagem & Caimento',
          spokenHook: `A estrutura dessa modelagem desenha as linhas do corpo com naturalidade e leveza. Simplesmente não dá vontade de tirar.`,
          overlayText: `DESENHA AS CURVAS COM NATURALIDADE E LEVEZA`,
          visualAction: 'Movimento suave de caminhar em direção à câmera, admirando a fluidez da peça em movimento.',
          whyItWorks: 'Cria conexão sensorial com o prazer de vestir uma roupa confortável e visualmente encantadora.',
        },
      ];
    }

    // cycle === 0 (Lote Base)
    return [
      {
        id: `hook-rot1-1-${generationSeed}`,
        category: 'Quebra de Objeção',
        spokenHook: `Se você tem receio de ${g.noun} marcar o corpo ou ficar transparente, olha a estrutura desse tecido no teste do espelho.`,
        overlayText: `ZERO TRANSPARÊNCIA: O TESTE REAL D${g.article.toUpperCase()} ${g.noun.toUpperCase()}`,
        visualAction: 'Dar dois passos para trás no espelho em silêncio, conferindo o caimento frontal e traseiro da peça sob luz natural.',
        whyItWorks: 'Elimina de imediato a maior barreira de compra de vestuário online, demonstrando segurança de caimento sem tom comercial.',
      },
      {
        id: `hook-rot1-2-${generationSeed}`,
        category: 'Efeito Visual',
        spokenHook: `Olha o que o corte d${g.article} ${g.noun} faz com a silhueta no corpo. O caimento assenta com perfeição sem apertar nada.`,
        overlayText: `O CAIMENTO D${g.article.toUpperCase()} ${g.noun.toUpperCase()} QUE VALORIZA A SILHUETA`,
        visualAction: 'Passar as mãos contornando suavemente a cintura no espelho e realizar um giro suave de 360 graus mostrando o desenho da peça.',
        whyItWorks: 'Apresenta o movimento real do look no corpo, retendo o espectador no feed pelo impacto estético imediato.',
      },
      {
        id: `hook-rot1-3-${generationSeed}`,
        category: 'Padrão de Grife',
        spokenHook: `O acabamento e a costura d${g.article} ${g.noun} têm exatamente o mesmo padrão de peças estruturadas de alta costura.`,
        overlayText: `PADRÃO DE ALTA COSTURA: ACABAMENTO E COSTURA REFORÇADA`,
        visualAction: 'Aproximar o tecido da câmera mostrando o forro duplo, as costuras embutidas e a firmeza da barra.',
        whyItWorks: 'Ancoragem de sofisticação e qualidade técnica de confecção sem fazer qualquer menção a preço ou valores.',
      },
      {
        id: `hook-rot1-4-${generationSeed}`,
        category: 'Curiosidade Extrema',
        spokenHook: `Não use ${g.demonstrative} ${g.noun} se você não gosta que as pessoas fiquem perguntando de onde é a sua roupa o dia inteiro.`,
        overlayText: `CUIDADO AO USAR: TODO MUNDO VAI PERGUNTAR DE ONDE É`,
        visualAction: 'Começar com expressão intrigada diante da câmera e recuar revelando o look completo com postura confiante.',
        whyItWorks: 'Psicologia reversa que ativa a curiosidade imediata para conferir todos os detalhes da peça até o final.',
      },
      {
        id: `hook-rot1-5-${generationSeed}`,
        category: 'Composição de Estilo',
        spokenHook: `Três formas elegantes de compor ${g.demonstrative} ${g.noun} no seu dia a dia, do visual casual até produções sofisticadas.`,
        overlayText: `1 PEÇA, 3 COMPOSIÇÕES ELEGANTES COM ${g.noun.toUpperCase()}`,
        visualAction: 'Transição ágil demonstrando a versatilidade da peça com sobreposição de jaqueta e troca rápida de calçado.',
        whyItWorks: 'Conteúdo de alta utilidade prática que evidencia a facilidade de criar looks completos com a mesma roupa.',
      },
      {
        id: `hook-rot1-6-${generationSeed}`,
        category: 'Modelagem & Caimento',
        spokenHook: `A modelagem d${g.article} ${g.noun} veste como se tivesse sido feita sob medida no corpo. Veste ${g.adjective} do decote até a barra.`,
        overlayText: `MODELAGEM QUE VESTE COMO SE FOSSE SOB MEDIDA`,
        visualAction: 'Ajustar a peça no corpo com naturalidade diante do espelho, exibindo o caimento fluido sem vincos.',
        whyItWorks: 'Ativa o desejo por modelagens precisas que valorizam a silhueta natural com extremo conforto.',
      },
    ];
  }, [productName, generationSeed]);

  // Filtragem dos hooks pelo estilo
  const filteredHooks = useMemo(() => {
    if (activeFilter === 'Todos') return hooksList;
    return hooksList.filter((h) => h.category === activeFilter);
  }, [hooksList, activeFilter]);

  // Copiar hook completo
  const copyHookContent = (hook: ViralHook) => {
    const textToCopy = `HOOK VIRAL (${hook.category.toUpperCase()})\n\nFala (0 a 3s):\n"${hook.spokenHook}"\n\nTexto na Tela (Overlay):\n${hook.overlayText}\n\nAção de Câmera:\n${hook.visualAction}\n\nGatilho Psicológico:\n${hook.whyItWorks}`;

    navigator.clipboard.writeText(textToCopy);
    setCopiedId(hook.id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  // Copiar todos os hooks
  const copyAllHooks = () => {
    const fullText = filteredHooks
      .map(
        (h, i) =>
          `HOOK #${i + 1} [${h.category.toUpperCase()}]\nFala: "${h.spokenHook}"\nTexto na Tela: ${h.overlayText}\nAção de Câmera: ${h.visualAction}\nGatilho: ${h.whyItWorks}\n`
      )
      .join('\n──────────────────────────────────────\n\n');

    navigator.clipboard.writeText(fullText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2200);
  };

  const handleRegenerate = () => {
    const nextSeed = generationSeed + 1;
    setGenerationSeed(nextSeed);
    setAiHooks(null);
    requestBackendHooks(productName, clothingCategory, productImage, nextSeed);
  };

  return (
    <div className="mvz-fade-up pb-16">
      {/* ────────────────────────────────────────────────────────────
          1. HEADER PRINCIPAL • PADRÃO OFICIAL (TURBO & HEADLINES)
      ──────────────────────────────────────────────────────────── */}
      <div className="relative mb-8 overflow-hidden rounded-[32px] border border-[var(--mvz-line)] bg-gradient-to-br from-[#0e0c08] via-[#080705] to-[#040404] p-6 shadow-[0_25px_60px_rgba(0,0,0,0.85)] md:p-8">
        <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-[var(--mvz-gold)]/10 blur-[90px]" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-[#f43f5e]/10 blur-[95px]" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--mvz-gold)]/30 bg-[var(--mvz-gold)]/10 px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-widest text-[var(--mvz-gold)] shadow-[0_0_20px_rgba(212,175,55,0.2)]">
              <Zap size={13} className="text-[var(--mvz-gold)]" />
              <span>Estúdio de Criação • Hooks Virais</span>
            </div>

            <h1 className="text-[28px] font-black tracking-tight text-white sm:text-[36px] md:text-[40px] leading-tight">
              Hooks{' '}
              <span className="bg-gradient-to-r from-[#d4af37] via-[#f3e2a4] to-[#eab308] bg-clip-text text-transparent">
                Virais
              </span>
            </h1>

            <p className="text-[13.5px] leading-relaxed text-white/75 sm:text-[14.5px]">
              Suba a foto da sua roupa para analisar a modelagem e gerar inícios de vídeo magnéticos de 0 a 3 segundos validados para prender o feed no TikTok Shop.
            </p>
          </div>

          {/* Card Resumo da Peça Ativa */}
          <div className="flex items-center gap-4 rounded-2xl border border-[var(--mvz-line-strong)] bg-[#0d0c0a]/90 p-4 backdrop-blur-md lg:w-80">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-[var(--mvz-gold)]/50 bg-black shadow-[0_0_15px_rgba(212,175,55,0.3)]">
              <img
                src={productImage}
                alt={productName}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--mvz-gold)]">
                {viewStep === 'results' ? 'Peça Analisada' : 'Peça em Destaque'}
              </div>
              <div className="truncate text-[13px] font-black text-white">{productName}</div>
              <div className="text-[11px] font-semibold text-[var(--mvz-gold-light)]">Hooks de Retenção Visual</div>
            </div>

            {viewStep === 'results' && (
              <button
                onClick={() => setViewStep('input')}
                className="rounded-lg border border-white/10 p-2 text-white/60 hover:text-white hover:bg-white/5 transition"
                title="Trocar Peça"
              >
                <ArrowRight size={14} className="rotate-180" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────
          2. PASSO 1: UPLOAD DA ROUPA & FORMULÁRIO DE ENTRADA
      ──────────────────────────────────────────────────────────── */}
      {viewStep === 'input' && (
        <div className="space-y-8">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/jpg"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Grid Principal: Upload Grande + Parâmetros */}
          <div className="grid grid-cols-1 gap-7 lg:grid-cols-12">
            {/* Box de Upload da Foto com Prévia de Alto Impacto */}
            <div className="lg:col-span-6 xl:col-span-5">
              <div className="rounded-[28px] border border-[var(--mvz-line)] bg-[#0d0c0a] p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--mvz-gold)]/15 text-[11px] font-black text-[var(--mvz-gold)]">
                      01
                    </span>
                    <h3 className="text-[13px] font-extrabold uppercase tracking-wider text-white">
                      Foto da Roupa
                    </h3>
                  </div>
                  <span className="text-[11px] font-medium text-[var(--mvz-dim)]">
                    JPG, PNG, WEBP
                  </span>
                </div>

                {/* Dropzone com Prévia Instantânea */}
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative flex aspect-[4/3] w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-[var(--mvz-gold)]/40 bg-gradient-to-b from-[#110e09] via-[#090806] to-[#040404] transition-all hover:border-[var(--mvz-gold)] hover:shadow-[0_0_35px_rgba(212,175,55,0.2)]"
                >
                  {productImage ? (
                    <>
                      <img
                        src={productImage}
                        alt="Foto da roupa para análise"
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/15 opacity-80 group-hover:opacity-60 transition" />

                      <div className="relative z-10 flex flex-col items-center gap-2 p-4 text-center">
                        <span className="inline-flex items-center gap-2 rounded-full border border-black/50 bg-black/80 px-4 py-1.5 text-[11.5px] font-black text-white backdrop-blur-md shadow-lg">
                          <Upload size={13} className="text-[var(--mvz-gold)]" />
                          Clique para Trocar a Foto
                        </span>
                        <span className="text-[11px] text-white/80">
                          Arraste outra imagem aqui se desejar
                        </span>
                      </div>

                      <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 rounded-lg border border-[var(--mvz-gold)]/40 bg-black/85 px-3 py-1 text-[10.5px] font-extrabold uppercase tracking-wider text-[var(--mvz-gold-light)] backdrop-blur-md">
                        <ShieldCheck size={12} className="text-[#7fcf9f]" />
                        Pronto para Análise
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-3 p-6 text-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--mvz-gold)]/40 bg-[var(--mvz-gold)]/10 text-[var(--mvz-gold)] shadow-[0_0_25px_rgba(212,175,55,0.2)]">
                        <Upload size={28} />
                      </div>
                      <p className="text-[15px] font-black text-white">
                        Arraste a foto da roupa aqui ou clique
                      </p>
                      <p className="text-[12px] text-[var(--mvz-dim)] max-w-xs">
                        Envie uma foto nítida da peça para a IA dissecar a modelagem e caimento.
                      </p>
                    </div>
                  )}
                </div>

                {/* Exemplos Rápidos de Demonstração */}
                <div className="pt-2">
                  <div className="text-[10.5px] font-bold uppercase tracking-wider text-[var(--mvz-dim)] mb-2">
                    Ou teste com uma peça pronta de demonstração:
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {SAMPLE_PRODUCTS.slice(0, 3).map((sample) => (
                      <button
                        key={sample.name}
                        onClick={() => handleSelectSample(sample)}
                        className={`truncate rounded-xl border p-2 text-left text-[11px] font-semibold transition ${
                          productName === sample.name
                            ? 'border-[var(--mvz-gold)] bg-[var(--mvz-gold)]/15 text-white'
                            : 'border-white/10 bg-white/[0.02] text-white/70 hover:border-white/30 hover:text-white'
                        }`}
                      >
                        <div className="truncate font-black">{sample.name.split(' ')[0]} {sample.name.split(' ')[1]}</div>
                        <div className="text-[9.5px] text-[var(--mvz-gold-light)] capitalize">{sample.category}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Parâmetros da Peça & Botão de Análise */}
            <div className="lg:col-span-6 xl:col-span-7 flex flex-col justify-between rounded-[28px] border border-[var(--mvz-line)] bg-[#0d0c0a] p-6 shadow-xl space-y-6">
              <div className="space-y-5">
                <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--mvz-gold)]/15 text-[11px] font-black text-[var(--mvz-gold)]">
                    02
                  </span>
                  <h3 className="text-[13px] font-extrabold uppercase tracking-wider text-white">
                    Identificação da Peça & Modelagem
                  </h3>
                </div>

                {/* Nome da Roupa */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--mvz-dim)]">
                    Nome da Peça / Produto
                  </label>
                  <input
                    value={productName}
                    onChange={(e) => {
                      setProductName(e.target.value);
                      setClothingCategory(inferCategoryFromName(e.target.value));
                    }}
                    placeholder="Ex.: Vestido Midi Canelado com Fenda Lateral"
                    className="mvz-input mt-1.5 h-12 w-full px-4 text-[13.5px] font-semibold text-white"
                  />
                  <p className="mt-1 text-[11px] text-[var(--mvz-dim)]">
                    A IA usará o nome e os atributos da peça para calibrar as falas e os textos na tela de forma 100% personalizada.
                  </p>
                </div>

                {/* Categoria / Tipo de Modelagem */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--mvz-dim)]">
                    Tipo de Modelagem (Ajuste Rápido)
                  </label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(Object.keys(CATEGORY_LABELS) as ClothingCategory[]).map((catKey) => (
                      <button
                        key={catKey}
                        onClick={() => setClothingCategory(catKey)}
                        className={`rounded-xl border px-3 py-1.5 text-[11.5px] font-bold transition ${
                          clothingCategory === catKey
                            ? 'border-[var(--mvz-gold)] bg-[var(--mvz-gold)]/15 text-[var(--mvz-gold-light)] shadow-[0_0_15px_rgba(212,175,55,0.2)]'
                            : 'border-white/10 bg-white/[0.02] text-white/60 hover:text-white hover:border-white/30'
                        }`}
                      >
                        {CATEGORY_LABELS[catKey]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Botão de Disparo da Análise */}
              <div className="pt-4 border-t border-white/[0.08]">
                <button
                  onClick={startScanAnalysis}
                  className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-[var(--mvz-gold)] bg-gradient-to-r from-[var(--mvz-gold)] via-[var(--mvz-gold-light)] to-[var(--mvz-gold)] text-[13px] font-black uppercase tracking-wider text-black shadow-[0_0_35px_rgba(212,175,55,0.4)] transition hover:opacity-95 hover:shadow-[0_0_45px_rgba(212,175,55,0.6)]"
                >
                  <ScanEye size={20} className="fill-black" />
                  <span>Analisar Peça & Gerar Hooks Virais</span>
                  <ArrowRight size={18} />
                </button>
                <div className="mt-2 text-center text-[11px] text-[var(--mvz-dim)]">
                  Análise profunda de caimento, transparência e primeiros 3 segundos de retenção.
                </div>
              </div>
            </div>
          </div>

          {/* Produtos do Catálogo Salvo (Carrossel com Scroll Horizontal e Arraste para o Lado) */}
          {products.length > 0 && (
            <div className="rounded-[28px] border border-[var(--mvz-line)] bg-[#0d0c0a] p-6 shadow-xl space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.08] pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--mvz-gold)]/15 text-[var(--mvz-gold)]">
                    <Sparkles size={15} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-[14px] font-black text-white">
                        Ou Selecione Direto do Seu Catálogo
                      </h3>
                      <span className="hidden sm:inline-flex rounded-full border border-[var(--mvz-gold)]/30 bg-[var(--mvz-gold)]/10 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-[var(--mvz-gold-light)]">
                        {products.length} Produtos
                      </span>
                    </div>
                    <p className="text-[11.5px] text-[var(--mvz-dim)]">
                      Arraste para o lado para ver todos os produtos ou use as setas de navegação.
                    </p>
                  </div>
                </div>

                {/* Controles de Navegação Esquerda/Direita */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => scrollCatalog('left')}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/70 hover:border-[var(--mvz-gold)] hover:bg-[var(--mvz-gold)]/10 hover:text-white transition shadow-sm"
                    title="Rolar para esquerda"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => scrollCatalog('right')}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/70 hover:border-[var(--mvz-gold)] hover:bg-[var(--mvz-gold)]/10 hover:text-white transition shadow-sm"
                    title="Rolar para direita"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* Trilha do Carrossel com Scroll Horizontal e Drag com Mouse */}
              <div
                ref={catalogScrollRef}
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeaveOrUp}
                onMouseUp={handleMouseLeaveOrUp}
                onMouseMove={handleMouseMove}
                className="flex items-stretch gap-3.5 overflow-x-auto pb-3 pt-1 scroll-smooth select-none cursor-grab active:cursor-grabbing"
                style={{ scrollbarWidth: 'thin' }}
              >
                {products.map((prod) => {
                  const isSelected = productName === prod.name;

                  return (
                    <div
                      key={prod.id}
                      onClick={() => handleSelectCatalogProduct(prod)}
                      className={`group relative w-36 sm:w-44 shrink-0 cursor-pointer overflow-hidden rounded-2xl border p-2.5 transition-all hover:-translate-y-1 hover:border-[var(--mvz-gold)] hover:shadow-[0_10px_30px_rgba(212,175,55,0.25)] ${
                        isSelected
                          ? 'border-[var(--mvz-gold)] bg-[var(--mvz-gold)]/15 shadow-[0_0_20px_rgba(212,175,55,0.3)] ring-1 ring-[var(--mvz-gold)]'
                          : 'border-white/10 bg-black/40 hover:bg-black/60'
                      }`}
                    >
                      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-black">
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          draggable={false}
                        />
                      </div>
                      <div className="mt-2.5">
                        <div className="truncate text-[12px] font-black text-white group-hover:text-[var(--mvz-gold-light)] transition">
                          {prod.name}
                        </div>
                        <div className="text-[10.5px] font-bold text-[var(--mvz-gold)] mt-0.5">
                          {prod.suggestedPrice || 'R$ 49,90'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────
          3. PASSO 2: ANÁLISE NEURAL EM TEMPO REAL (LASER SCANNER)
      ──────────────────────────────────────────────────────────── */}
      {viewStep === 'analyzing' && (
        <div className="flex min-h-[480px] flex-col items-center justify-center rounded-[32px] border border-[var(--mvz-gold)]/35 bg-gradient-to-b from-[#110e09] via-[#090806] to-[#040404] p-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.9)] animate-in fade-in">
          {/* Card com a Foto e Linha de Varredura Laser */}
          <div className="relative h-64 w-52 overflow-hidden rounded-2xl border-2 border-[var(--mvz-gold)]/60 bg-black shadow-[0_0_40px_rgba(212,175,55,0.35)]">
            <img
              src={productImage}
              alt={productName}
              className="h-full w-full object-cover filter brightness-95"
            />
            {/* Linha de Scanner Laser */}
            <div
              className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[var(--mvz-gold)] to-transparent shadow-[0_0_20px_rgba(212,175,55,0.9)]"
              style={{
                top: `${(scanProgress * 0.9) % 100}%`,
                transition: 'top 0.1s linear',
              }}
            />
            {/* Grid overlay futurista sutil */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,_rgba(212,175,55,0.15)_1px,_transparent_1px)] bg-[size:12px_12px] opacity-60" />
          </div>

          <div className="mt-6 flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-widest text-[var(--mvz-gold)]">
            <ScanEye size={16} className="animate-pulse" />
            <span>Dissecando Peça & Modelagem</span>
          </div>

          <h3 className="mt-2 text-[20px] font-black text-white sm:text-[24px]">
            {productName}
          </h3>

          <p className="mt-2 text-[13px] text-white/80 max-w-md min-h-[22px]">
            {scanPhaseText}
          </p>

          {/* Barra de Progresso Realista */}
          <div className="mt-5 w-full max-w-md">
            <div className="flex items-center justify-between text-[11px] font-bold text-white/70 mb-1.5">
              <span>Varredura Neural</span>
              <span className="font-mono text-[var(--mvz-gold)]">{scanProgress}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full border border-white/10 bg-white/5 p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--mvz-gold)] via-[var(--mvz-gold-light)] to-[#fff0a8] shadow-[0_0_15px_rgba(212,175,55,0.6)] transition-all duration-100 ease-out"
                style={{ width: `${scanProgress}%` }}
              />
            </div>
          </div>

          {/* Badges de Detecção em Tempo Real */}
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {scanTags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 rounded-full border border-[var(--mvz-gold)]/30 bg-[var(--mvz-gold)]/10 px-3 py-1 text-[11px] font-semibold text-[var(--mvz-gold-light)]"
              >
                <Check size={12} className="text-[#7fcf9f]" />
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────
          4. PASSO 3: HOOKS VIRAIS PRONTOS (RESULTADOS DE ALTA RETENÇÃO)
      ──────────────────────────────────────────────────────────── */}
      {viewStep === 'results' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Barra de Controle de Resultados */}
          <div className="flex flex-col justify-between gap-4 rounded-2xl border border-[var(--mvz-line)] bg-[#0d0c0a] p-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--mvz-gold)]/15 text-[var(--mvz-gold)]">
                <Flame size={18} />
              </div>
              <div>
                <div className="text-[13.5px] font-black text-white">
                  6 Hooks Virais Gerados Sob Medida
                </div>
                <div className="text-[11px] text-[var(--mvz-dim)]">
                  Falas de 0 a 3 segundos, textos na tela e ações visuais no espelho.
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleRegenerate}
                className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2 text-[11.5px] font-bold text-white/80 transition hover:border-white/30 hover:text-white"
              >
                <RefreshCw size={13} />
                <span>Gerar Mais Variações</span>
              </button>

              <button
                onClick={copyAllHooks}
                className="flex items-center gap-1.5 rounded-xl border border-[var(--mvz-gold)]/60 bg-[var(--mvz-gold)]/15 px-4 py-2 text-[11.5px] font-black uppercase tracking-wider text-[var(--mvz-gold-light)] transition hover:bg-[var(--mvz-gold)] hover:text-black shadow-[0_0_20px_rgba(212,175,55,0.2)]"
              >
                {copiedAll ? <Check size={14} className="text-black" /> : <Copy size={13} />}
                <span>{copiedAll ? 'Todos Copiados!' : 'Copiar Todos os Hooks'}</span>
              </button>
            </div>
          </div>

          {/* Filtros Rápidos por Ângulo de Abordagem */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              'Todos',
              'Quebra de Objeção',
              'Efeito Visual',
              'Padrão de Grife',
              'Curiosidade Extrema',
              'Composição de Estilo',
              'Modelagem & Caimento',
            ].map((fil) => (
              <button
                key={fil}
                onClick={() => setActiveFilter(fil)}
                className={`rounded-xl border px-3.5 py-1.5 text-[11px] font-extrabold transition ${
                  activeFilter === fil
                    ? 'border-[var(--mvz-gold)] bg-[var(--mvz-gold)]/15 text-[var(--mvz-gold-light)] shadow-[0_0_15px_rgba(212,175,55,0.2)]'
                    : 'border-white/10 bg-[#0d0c0a] text-white/60 hover:text-white hover:border-white/20'
                }`}
              >
                {fil}
              </button>
            ))}
          </div>

          {/* Grid de Cards de Hooks (2 por linha em desktop) */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {filteredHooks.map((hook, index) => {
              const isHookCopied = copiedId === hook.id;

              return (
                <div
                  key={hook.id}
                  className="mvz-card mvz-card-hover relative flex flex-col justify-between overflow-hidden rounded-[24px] border border-[var(--mvz-line)] bg-[#0d0c0a] p-5 shadow-[0_15px_40px_rgba(0,0,0,0.7)] transition-all duration-300 hover:border-[rgba(212,175,55,0.4)] sm:p-6"
                >
                  <div>
                    {/* Top Bar do Card: Título Objetivo & Botão Único de Copiar */}
                    <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-4">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--mvz-gold)]">
                        Hook #{String(index + 1).padStart(2, '0')} • {hook.category.toUpperCase()}
                      </span>
                      <button
                        onClick={() => copyHookContent(hook)}
                        className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11.5px] font-bold transition ${
                          isHookCopied
                            ? 'border-[#7fcf9f] bg-[#7fcf9f]/15 text-[#7fcf9f]'
                            : 'border-white/10 bg-white/[0.03] text-white/80 hover:border-[var(--mvz-gold)] hover:text-white'
                        }`}
                      >
                        {isHookCopied ? <Check size={13} className="text-[#7fcf9f]" /> : <Copy size={13} />}
                        <span>{isHookCopied ? 'Copiado!' : 'Copiar Hook'}</span>
                      </button>
                    </div>

                    {/* Conteúdo em Camadas Claras e Profissionais */}
                    <div className="space-y-3.5">
                      {/* 1. Fala da Criadora (0 a 3s) */}
                      <div className="rounded-2xl border border-white/10 bg-black/60 p-4">
                        <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-[var(--mvz-gold)] block mb-1.5">
                          Fala da Criadora (Áudio 0 a 3s)
                        </span>
                        <p className="text-[14px] font-bold leading-relaxed text-white">
                          “{hook.spokenHook}”
                        </p>
                      </div>

                      {/* 2. Texto na Tela (Overlay Visual) */}
                      <div className="rounded-2xl border border-white/10 bg-black/40 p-3.5">
                        <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-[#f3e2a4] block mb-1">
                          Texto na Tela (Overlay)
                        </span>
                        <p className="font-mono text-[13px] font-black tracking-wide text-white/95 uppercase">
                          {hook.overlayText}
                        </p>
                      </div>

                      {/* 3. Ação Visual Recomendada na Câmera */}
                      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5">
                        <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-white/50 block mb-1">
                          Ação Visual na Câmera
                        </span>
                        <p className="text-[12px] leading-relaxed text-white/80">
                          {hook.visualAction}
                        </p>
                      </div>

                      {/* 4. Gatilho Psicológico */}
                      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5">
                        <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-[#7fcf9f] block mb-1">
                          Gatilho Psicológico:
                        </span>
                        <p className="text-[12px] leading-relaxed text-white/80">
                          {hook.whyItWorks}
                        </p>
                      </div>
                    </div>
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

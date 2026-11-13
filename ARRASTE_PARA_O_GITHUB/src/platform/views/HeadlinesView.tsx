import React, { useState, useRef, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Upload,
  Sparkles,
  Zap,
  Copy,
  Check,
  ArrowRight,
  Flame,
  Shirt,
  ArrowDownToLine,
  Plus,
  X,
  Trash2,
} from 'lucide-react';
import {
  useProducts,
  inferPieceType,
  type WinningProduct,
} from '../productsStore';

export type PieceType = 'superior' | 'inferior' | 'conjunto';

export interface HeadlineItem {
  id: string;
  category: string;
  headline: string;
  overlayText: string;
  visualAction: string;
  retentionScore: number;
  viralScore: number;
  whyItWorks: string;
}

interface PieceGrammar {
  article: string;
  noun: string;
  diminutive: string;
  adjective: string;
  gender: 'f' | 'm';
}

function extractPieceGrammar(name: string, fallbackType?: PieceType): PieceGrammar {
  const clean = name.toLowerCase().trim();

  // 1. Regata / Regatinha
  if (/regat/i.test(clean)) {
    return {
      article: 'a',
      noun: 'regata',
      diminutive: 'regatinha',
      adjective: 'perfeita',
      gender: 'f',
    };
  }

  // 2. Vestido / Vestidinho
  if (/vestid/i.test(clean)) {
    return {
      article: 'o',
      noun: 'vestido',
      diminutive: 'vestidinho',
      adjective: 'perfeito',
      gender: 'm',
    };
  }

  // 3. Body / Bory / Maiô
  if (/bo[rd]y|mai[oô]/i.test(clean)) {
    return {
      article: 'o',
      noun: 'body',
      diminutive: 'bodyzinho',
      adjective: 'perfeito',
      gender: 'm',
    };
  }

  // 4. Cropped / Top
  if (/cropped|top/i.test(clean)) {
    return {
      article: 'o',
      noun: 'cropped',
      diminutive: 'croppedzinho',
      adjective: 'perfeito',
      gender: 'm',
    };
  }

  // 5. Calça / Pantalona / Legging
  if (/cal[cç]a|pantalona|legging/i.test(clean)) {
    const isLegging = /legging/i.test(clean);
    return {
      article: 'a',
      noun: isLegging ? 'legging' : /pantalona/i.test(clean) ? 'pantalona' : 'calça',
      diminutive: isLegging ? 'legging' : 'calça',
      adjective: 'perfeita',
      gender: 'f',
    };
  }

  // 6. Saia / Short Saia
  if (/saia/i.test(clean)) {
    const isShortSaia = /short/i.test(clean);
    return {
      article: isShortSaia ? 'o' : 'a',
      noun: isShortSaia ? 'short saia' : 'saia',
      diminutive: isShortSaia ? 'short saia' : 'saiinha',
      adjective: isShortSaia ? 'perfeito' : 'perfeita',
      gender: isShortSaia ? 'm' : 'f',
    };
  }

  // 7. Short / Bermuda
  if (/short|bermuda/i.test(clean)) {
    const isBermuda = /bermuda/i.test(clean);
    return {
      article: isBermuda ? 'a' : 'o',
      noun: isBermuda ? 'bermuda' : 'short',
      diminutive: isBermuda ? 'bermudinha' : 'shortinho',
      adjective: isBermuda ? 'perfeita' : 'perfeito',
      gender: isBermuda ? 'f' : 'm',
    };
  }

  // 8. Macaquinho
  if (/macaquinho/i.test(clean)) {
    return {
      article: 'o',
      noun: 'macaquinho',
      diminutive: 'macaquinho',
      adjective: 'perfeito',
      gender: 'm',
    };
  }

  // 9. Macacão
  if (/macac[aã]o/i.test(clean)) {
    return {
      article: 'o',
      noun: 'macacão',
      diminutive: 'macacãozinho',
      adjective: 'perfeito',
      gender: 'm',
    };
  }

  // 10. Conjunto / Conjuntinho
  if (/conjunt/i.test(clean)) {
    return {
      article: 'o',
      noun: 'conjunto',
      diminutive: 'conjuntinho',
      adjective: 'perfeito',
      gender: 'm',
    };
  }

  // 11. Camisa / Blusa / Blusinha
  if (/camisa|blusa|blusinha/i.test(clean)) {
    return {
      article: 'a',
      noun: /camisa/i.test(clean) ? 'camisa' : 'blusa',
      diminutive: /camisa/i.test(clean) ? 'camisinha' : 'blusinha',
      adjective: 'perfeita',
      gender: 'f',
    };
  }

  // 12. Jaqueta / Casaco / Cardigan / Moletom / Blazer
  if (/jaqueta|casaco|cardigan|moletom|blazer/i.test(clean)) {
    const isFem = /jaqueta/i.test(clean);
    const word = clean.match(/jaqueta|casaco|cardigan|moletom|blazer/i)?.[0]?.toLowerCase() || 'peça';
    return {
      article: isFem ? 'a' : 'o',
      noun: word,
      diminutive: word,
      adjective: isFem ? 'perfeita' : 'perfeito',
      gender: isFem ? 'f' : 'm',
    };
  }

  // Fallback inteligente pegando o primeiro termo significativo ou fallbackType
  let firstWord = clean.replace(/^(o|a|os|as|um|uma)\s+/i, '').split(/\s+/)[0] || '';
  if (!firstWord || firstWord === 'peça' || firstWord === 'look') {
    if (fallbackType === 'superior') firstWord = 'cropped';
    else if (fallbackType === 'inferior') firstWord = 'calça';
    else firstWord = 'conjunto';
  }

  const endsWithA = firstWord.endsWith('a');
  return {
    article: endsWithA ? 'a' : 'o',
    noun: firstWord,
    diminutive: endsWithA ? `${firstWord.slice(0, -1)}inha` : `${firstWord}zinho`,
    adjective: endsWithA ? 'perfeita' : 'perfeito',
    gender: endsWithA ? 'f' : 'm',
  };
}

export function HeadlinesView({ onUse: _onUse }: { onUse?: (text: string) => void }) {
  // Passos: 1 = Catálogo de Produtos | 3 = Headlines Prontas
  const [step, setStep] = useState<1 | 3>(1);

  // Parâmetros selecionados
  const [pieceType, setPieceType] = useState<PieceType>('conjunto');
  const [clothingName, setClothingName] = useState('Vestido Midi Canelado com Fenda Lateral');
  const [clothingImage, setClothingImage] = useState<string>('https://i.imgur.com/2cQbml3.jpeg');
  
  // Estados de análise e geração
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanPhaseText, setScanPhaseText] = useState('Escaneando textura e silhueta da peça...');
  const [scanTags, setScanTags] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [seed, setSeed] = useState(1);
  const [aiHeadlines, setAiHeadlines] = useState<HeadlineItem[] | null>(null);

  const requestBackendHeadlines = (nameTarget: string, typeTarget: PieceType, imgTarget: string, nextSeed: number) => {
    fetch('/api/generate-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'headlines',
        clothingName: nameTarget,
        pieceType: typeTarget,
        seed: nextSeed,
        imageDataUrl: imgTarget?.startsWith('data:image/') ? imgTarget : undefined,
      }),
    })
      .then(async (res) => {
        if (!res.ok) return;
        const json = await res.json();
        if (Array.isArray(json?.headlines) && json.headlines.length >= 6) {
          setAiHeadlines(
            json.headlines.map((item: any, idx: number) => ({
              id: `hl-ai-${nextSeed}-${idx}`,
              category: String(item.category || 'Caimento & Elegância'),
              headline: String(item.headline || '').trim(),
              overlayText: String(item.overlayText || 'POV: CAIMENTO IMPECÁVEL'),
              visualAction: String(item.visualAction || 'Girar no espelho mostrando o caimento.'),
              retentionScore: Number(item.retentionScore) || 98,
              viralScore: Number(item.viralScore) || 9.9,
              whyItWorks: String(item.whyItWorks || 'Gatilho orgânico de retenção para TikTok Shop.'),
            }))
          );
        }
      })
      .catch(() => {
        // Fallback automático para a engine local
      });
  };

  // Integração com a esteira de produtos
  const { products, addProduct, deleteProduct } = useProducts();
  const [showAddExternalModal, setShowAddExternalModal] = useState(false);

  // Formulário de produto externo
  const [extName, setExtName] = useState('');
  const [extPieceType, setExtPieceType] = useState<PieceType>('superior');
  const [extImage, setExtImage] = useState('');
  const [extAngle, setExtAngle] = useState('');
  const extFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showAddExternalModal) {
      const orig = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = orig;
      };
    }
  }, [showAddExternalModal]);

  const handleSelectProductAndGenerate = (product: WinningProduct) => {
    const inferred = inferPieceType(product);
    setPieceType(inferred);
    setClothingName(product.name);
    setClothingImage(product.image);
    setAiHeadlines(null);
    triggerAiGeneration(product.name, inferred, product.image);
  };

  const handleSaveExternalProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!extName.trim() || !extImage.trim()) return;

    const catLabel =
      extPieceType === 'superior'
        ? 'Croppeds'
        : extPieceType === 'inferior'
        ? 'Alfaiataria'
        : 'Vestidos';

    const saved = addProduct({
      name: extName,
      category: catLabel,
      image: extImage,
      suggestedPrice: 'R$ 49,90',
      costPrice: 'R$ 15,00',
      angle: extAngle,
    });

    setClothingName(saved.name);
    setClothingImage(saved.image);
    setPieceType(extPieceType);
    setAiHeadlines(null);

    setExtName('');
    setExtImage('');
    setExtAngle('');
    setShowAddExternalModal(false);

    triggerAiGeneration(saved.name, extPieceType, saved.image);
  };

  const handleExtImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setExtImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Simulação realista de análise neural profunda (~3.8s) + Chamada Real à API
  const triggerAiGeneration = (
    overrideName?: string | React.MouseEvent,
    overrideType?: PieceType,
    overrideImg?: string
  ) => {
    const targetName = typeof overrideName === 'string' ? overrideName : clothingName;
    const targetType = overrideType ?? pieceType;
    const targetImg = overrideImg ?? clothingImage;

    setIsAnalyzing(true);
    setScanProgress(0);
    setScanPhaseText('Escaneando textura e silhueta da peça...');
    setScanTags(['Modelagem Detectada', 'Scanner Ativo']);
    requestBackendHeadlines(targetName, targetType, targetImg, seed);

    const startTime = Date.now();
    const totalDuration = 3800; // 3.8s para transmitir análise autêntica

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, Math.round((elapsed / totalDuration) * 100));
      setScanProgress(progress);

      if (progress < 25) {
        setScanPhaseText('Escaneando textura, caimento e silhueta da peça...');
        setScanTags(['Modelagem Detectada', 'Gramatura do Tecido']);
      } else if (progress < 55) {
        setScanPhaseText('Mapeando pontos de caimento no espelho e quebra de objeções...');
        setScanTags(['Modelagem Detectada', 'Zero Transparência', 'Efeito no Espelho']);
      } else if (progress < 85) {
        setScanPhaseText('Identificando gatilhos virais para vídeos sem fala no TikTok...');
        setScanTags(['Modelagem Detectada', 'Zero Transparência', 'Vídeo Sem Fala', 'Gatilho 0-3s']);
      } else {
        setScanPhaseText('Formatando 10 headlines de até 2 frases para tela...');
        setScanTags(['Modelagem Detectada', 'Zero Transparência', 'Headlines Prontas']);
      }

      if (elapsed >= totalDuration) {
        clearInterval(interval);
        setTimeout(() => {
          setIsAnalyzing(false);
          setStep(3);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 200);
      }
    }, 50);
  };

  // Headlines geradas dinamicamente com formato POV e personalizadas pela peça (100% orgânico, sem preço, sem venda, sem frete grátis)
  // Cada clique em "Gerar Mais Variações" avança o seed e entrega um lote 100% novo de headlines
  const headlinesList = useMemo<HeadlineItem[]>(() => {
    if (aiHeadlines && aiHeadlines.length > 0) {
      return aiHeadlines;
    }
    const g = extractPieceGrammar(clothingName, pieceType);

    const nounPhrase = `${g.article} ${g.noun} do momento`;
    const dimPhrase = `${g.article} ${g.diminutive} quase de graça`;
    const queridinhoBlogueiras = g.gender === 'f' ? `a ${g.noun} queridinha das blogueiras` : `o ${g.noun} queridinho das blogueiras`;
    const queridinhoMeninas = g.gender === 'f' ? 'a queridinha das meninas' : 'o queridinho das meninas';
    const queridinhoMomento = g.gender === 'f' ? `a ${g.noun} queridinha do momento` : `o ${g.noun} queridinho do momento`;
    const adjCap = g.adjective.charAt(0).toUpperCase() + g.adjective.slice(1);
    const cadaCorPhrase = g.gender === 'f' ? 'Quero uma de cada cor.' : 'Quero um de cada cor.';

    const cycle = (seed - 1) % 4;

    if (cycle === 1) {
      return [
        {
          id: `hl-caimento-2-${seed}`,
          category: 'Caimento & Elegância',
          headline: `POV: ${queridinhoMomento}\nO caimento ficou impecável.`,
          overlayText: 'POV: CAIMENTO IMPECÁVEL',
          visualAction: 'Girar lentamente no espelho mostrando o caimento perfeito.',
          retentionScore: 99,
          viralScore: 9.9,
          whyItWorks: `Gatilho: Desejo estético imediato pelo caimento. Ponto que pega: Realça como ${g.article} ${g.noun} assenta perfeitamente no corpo sem apertar.`,
        },
        {
          id: `hl-tecido-2-${seed}`,
          category: 'Qualidade do Tecido',
          headline: `POV: ${nounPhrase}\nO tecido é super encorpado.`,
          overlayText: 'POV: TECIDO ENCORPADO',
          visualAction: 'Puxar levemente o tecido para demonstrar a textura e elasticidade.',
          retentionScore: 98,
          viralScore: 9.9,
          whyItWorks: `Gatilho: Quebra de objeção sobre espessura do tecido. Ponto que pega: Confirma a gramatura premium de ${g.article} ${g.noun} de forma orgânica.`,
        },
        {
          id: `hl-amigas-2-${seed}`,
          category: 'Prova Social Próxima',
          headline: `POV: ${dimPhrase}\nMinhas amigas acharam lindo.`,
          overlayText: 'POV: MINHAS AMIGAS AMARAM',
          visualAction: 'Sorriso espontâneo no espelho conferindo o look completo.',
          retentionScore: 97,
          viralScore: 9.8,
          whyItWorks: 'Gatilho: Validação social de amigas próximas. Ponto que pega: Mostra aceitação imediata e elogios sinceros no dia a dia.',
        },
        {
          id: `hl-praticidade-2-${seed}`,
          category: 'Praticidade Extrema',
          headline: `POV: ${queridinhoBlogueiras}\nNão amassa e não encolhe.`,
          overlayText: 'POV: NÃO AMASSA',
          visualAction: 'Movimento natural no espelho testando o conforto da peça.',
          retentionScore: 98,
          viralScore: 9.8,
          whyItWorks: 'Gatilho: Alívio de manutenção da roupa. Ponto que pega: Peça prática que não dá trabalho para passar ou cuidar.',
        },
        {
          id: `hl-cintura-2-${seed}`,
          category: 'Modelagem da Cintura',
          headline: `POV: ${nounPhrase}\nValorizou muito a cintura.`,
          overlayText: 'POV: VALORIZOU A CINTURA',
          visualAction: 'Passar as mãos contornando a cintura com suavidade.',
          retentionScore: 99,
          viralScore: 9.9,
          whyItWorks: `Gatilho: Realce da silhueta feminina. Ponto que pega: Mostra como ${g.article} ${g.noun} desenha a cintura no espelho.`,
        },
        {
          id: `hl-grife-2-${seed}`,
          category: 'Percepção de Grife',
          headline: `POV: ${dimPhrase}\nParece peça de grife cara.`,
          overlayText: 'POV: PARECE DE GRIFE',
          visualAction: 'Afastar no espelho para mostrar o look completo com postura.',
          retentionScore: 97,
          viralScore: 9.8,
          whyItWorks: 'Gatilho: Status visual sem parecer ostensivo. Ponto que pega: Alto valor percebido gerado pelo caimento sofisticado.',
        },
        {
          id: `hl-teste-2-${seed}`,
          category: 'Teste Autêntico',
          headline: `POV: ${queridinhoMeninas}\nTestei no espelho e aprovei.`,
          overlayText: 'POV: TESTEI E APROVEI',
          visualAction: 'Conferir os ângulos no espelho com aprovação sincera.',
          retentionScore: 96,
          viralScore: 9.7,
          whyItWorks: 'Gatilho: Autenticidade de criadora de conteúdo real. Ponto que pega: Reação 100% natural sem tom de anúncio ou propaganda.',
        },
        {
          id: `hl-versatilidade-2-${seed}`,
          category: 'Versatilidade',
          headline: `POV: ${nounPhrase}\n${adjCap} pro dia a dia.`,
          overlayText: 'POV: PRO DIA A DIA',
          visualAction: 'Dar uma caminhada leve até o espelho.',
          retentionScore: 96,
          viralScore: 9.7,
          whyItWorks: `Gatilho: Usabilidade universal. Ponto que pega: Mostra que ${g.article} ${g.noun} serve perfeitamente para qualquer rotina.`,
        },
        {
          id: `hl-acabamento-2-${seed}`,
          category: 'Acabamento & Detalhes',
          headline: `POV: ${dimPhrase}\nAcabamento surreal de lindo.`,
          overlayText: 'POV: ACABAMENTO SURREAL',
          visualAction: 'Aproximar da câmera mostrando os detalhes de barra e costura.',
          retentionScore: 98,
          viralScore: 9.8,
          whyItWorks: 'Gatilho: Foco em qualidade de manufatura. Ponto que pega: Detalhes bem acabados encantam e retêm o público no vídeo.',
        },
        {
          id: `hl-colecao-2-${seed}`,
          category: 'Desejo de Coleção',
          headline: `POV: ${queridinhoMomento}\n${cadaCorPhrase}`,
          overlayText: 'POV: QUERO DE CADA COR',
          visualAction: 'Trocar o peso do corpo no espelho em sinal de animação.',
          retentionScore: 99,
          viralScore: 9.9,
          whyItWorks: `Gatilho: Efeito coleção compulsiva. Ponto que pega: Sinaliza que ${g.article} ${g.noun} é tão perfeita que dá vontade de ter todas as cores.`,
        },
      ];
    }

    if (cycle === 2) {
      return [
        {
          id: `hl-costura-3-${seed}`,
          category: 'Costura & Resistência',
          headline: `POV: ${dimPhrase}\nCostura reforçada de verdade.`,
          overlayText: 'POV: COSTURA REFORÇADA',
          visualAction: 'Mostrar de perto os pontos de costura e o acabamento lateral.',
          retentionScore: 98,
          viralScore: 9.8,
          whyItWorks: 'Gatilho: Garantia de durabilidade. Ponto que pega: Elimina a desconfiança comum de compras pela internet.',
        },
        {
          id: `hl-sustentacao-3-${seed}`,
          category: 'Sustentação & Conforto',
          headline: `POV: ${nounPhrase}\nSegura tudo sem apertar nada.`,
          overlayText: 'POV: SEGURA TUDO',
          visualAction: 'Ajeitar a peça no corpo demonstrando conforto e firmeza.',
          retentionScore: 99,
          viralScore: 9.9,
          whyItWorks: `Gatilho: Conforto corporal extremo. Ponto que pega: Promete que ${g.article} ${g.noun} sustenta perfeitamente sem machucar.`,
        },
        {
          id: `hl-sonhos-3-${seed}`,
          category: 'Modelagem Perfeita',
          headline: `POV: ${queridinhoMomento}\nCaimento dos sonhos no corpo.`,
          overlayText: 'POV: CAIMENTO DOS SONHOS',
          visualAction: 'Volta completa no espelho admirando a peça.',
          retentionScore: 99,
          viralScore: 9.9,
          whyItWorks: 'Gatilho: Ideal estético alcançado. Ponto que pega: Duas frases curtas e de altíssimo impacto sobre o caimento no corpo.',
        },
        {
          id: `hl-achadinho-3-${seed}`,
          category: 'Achadinho TikTok Shop',
          headline: `POV: ${dimPhrase}\nAchadinho que salvou meu look.`,
          overlayText: 'POV: ACHADINHO DE OURO',
          visualAction: 'Conferir o visual de cima a baixo com expressão de satisfação.',
          retentionScore: 98,
          viralScore: 9.9,
          whyItWorks: 'Gatilho: Sensação de descoberta única ("achadinho"). Ponto que pega: Termo viral orgânico de maior conversão entre criadoras.',
        },
        {
          id: `hl-defeitos-3-${seed}`,
          category: 'Perfeição Visual',
          headline: `POV: ${nounPhrase}\nZero defeitos nessa peça.`,
          overlayText: 'POV: ZERO DEFEITOS',
          visualAction: 'Girar no espelho em silêncio mostrando os ângulos.',
          retentionScore: 97,
          viralScore: 9.8,
          whyItWorks: `Gatilho: Aprovação categórica e espontânea. Ponto que pega: Comunica alta qualidade de ${g.article} ${g.noun} em pouquíssimas palavras.`,
        },
        {
          id: `hl-curiosidade-3-${seed}`,
          category: 'Curiosidade Viral',
          headline: `POV: ${queridinhoBlogueiras}\nTodo mundo pergunta de onde é.`,
          overlayText: 'POV: DE ONDE É ESSA PEÇA',
          visualAction: 'Ajeitar o cabelo e conferir o caimento no espelho.',
          retentionScore: 99,
          viralScore: 9.9,
          whyItWorks: 'Gatilho: Desejo social irresistível. Ponto que pega: Dispara dezenas de comentários orgânicos perguntando a procedência.',
        },
        {
          id: `hl-toque-3-${seed}`,
          category: 'Toque & Maciez',
          headline: `POV: ${dimPhrase}\nTecido macio que abraça o corpo.`,
          overlayText: 'POV: TECIDO SUPER MACIO',
          visualAction: 'Tocar o tecido delicadamente em frente à câmera.',
          retentionScore: 96,
          viralScore: 9.7,
          whyItWorks: 'Gatilho: Sensação de toque agradável. Ponto que pega: Conecta o espectador com a sensação gostosa de vestir o tecido.',
        },
        {
          id: `hl-ocasiao-3-${seed}`,
          category: 'Ocasião Universal',
          headline: `POV: ${nounPhrase}\nCombina com qualquer ocasião.`,
          overlayText: 'POV: COMBINA COM TUDO',
          visualAction: 'Dar passos leves mostrando a fluidez da peça.',
          retentionScore: 96,
          viralScore: 9.6,
          whyItWorks: `Gatilho: Praticidade e versatilidade de guarda-roupa. Ponto que pega: Multiplica o valor percebido de ${g.article} ${g.noun}.`,
        },
        {
          id: `hl-elegancia-3-${seed}`,
          category: 'Elegância & Postura',
          headline: `POV: ${queridinhoMeninas}\nSuper elegante e confortável.`,
          overlayText: 'POV: ELEGANTE E CONFORTÁVEL',
          visualAction: 'Postura ereta no espelho demonstrando o caimento limpo.',
          retentionScore: 97,
          viralScore: 9.7,
          whyItWorks: 'Gatilho: O equilíbrio perfeito que toda mulher procura: estar elegante sem abrir mão do conforto.',
        },
        {
          id: `hl-escolha-3-${seed}`,
          category: 'Satisfação Total',
          headline: `POV: ${queridinhoMomento}\nMelhor escolha que já fiz.`,
          overlayText: 'POV: MELHOR ESCOLHA',
          visualAction: 'Sorriso de satisfação ao conferir o look completo.',
          retentionScore: 98,
          viralScore: 9.8,
          whyItWorks: 'Gatilho: Certeza absoluta de acerto. Ponto que pega: Passa segurança total para quem está assistindo no feed.',
        },
      ];
    }

    if (cycle === 3) {
      return [
        {
          id: `hl-postura-4-${seed}`,
          category: 'Postura & Autoestima',
          headline: `POV: ${nounPhrase}\nDeu outra postura no corpo.`,
          overlayText: 'POV: OUTRA POSTURA',
          visualAction: 'Ajeitar a coluna e conferir a transformação visual no espelho.',
          retentionScore: 99,
          viralScore: 9.9,
          whyItWorks: `Gatilho: Autoestima e transformação postural. Ponto que pega: Mostra como ${g.article} ${g.noun} valoriza a presença e o porte.`,
        },
        {
          id: `hl-qualidade-4-${seed}`,
          category: 'Qualidade Tátil',
          headline: `POV: ${dimPhrase}\nQualidade absurda no toque.`,
          overlayText: 'POV: QUALIDADE ABSURDA',
          visualAction: 'Sentir o tecido com as mãos aproximando da luz.',
          retentionScore: 98,
          viralScore: 9.8,
          whyItWorks: 'Gatilho: Surpresa positiva com o material. Ponto que pega: Demonstra valor superior sem precisar falar de dinheiro.',
        },
        {
          id: `hl-luz-4-${seed}`,
          category: 'Teste Contra a Luz',
          headline: `POV: ${queridinhoMomento}\nNão é transparente de jeito nenhum.`,
          overlayText: 'POV: NADA TRANSPARENTE',
          visualAction: 'Posicionar-se contra a luz da janela mostrando a opacidade perfeita.',
          retentionScore: 99,
          viralScore: 9.9,
          whyItWorks: 'Gatilho: Quebra de objeção crítica contra a luz. Ponto que pega: Dá segurança total na hora de usar em público.',
        },
        {
          id: `hl-modelagem-4-${seed}`,
          category: 'Tendência & Desejo',
          headline: `POV: ${queridinhoBlogueiras}\nA modelagem que todo mundo quer.`,
          overlayText: 'POV: MODELAGEM DESEJADA',
          visualAction: 'Girar 360 no espelho destacando os recortes e costuras.',
          retentionScore: 98,
          viralScore: 9.9,
          whyItWorks: `Gatilho: Efeito manada e urgência de tendência. Ponto que pega: Destaca o formato exclusivo de ${g.article} ${g.noun}.`,
        },
        {
          id: `hl-rapidez-4-${seed}`,
          category: 'Rapidez & Praticidade',
          headline: `POV: ${dimPhrase}\nPronta pra sair em 2 minutos.`,
          overlayText: 'POV: PRONTA EM 2 MINUTOS',
          visualAction: 'Dar o último ajuste no look e pegar a bolsa para sair.',
          retentionScore: 97,
          viralScore: 9.8,
          whyItWorks: 'Gatilho: Economia de tempo. Ponto que pega: Resolve o estresse de não saber o que vestir com rapidez e estilo.',
        },
        {
          id: `hl-destaque-4-${seed}`,
          category: 'Destaque Visual',
          headline: `POV: ${nounPhrase}\nRealçou o visual sem esforço.`,
          overlayText: 'POV: REALÇOU O VISUAL',
          visualAction: 'Dar um passo para trás mostrando a harmonia do look no espelho.',
          retentionScore: 97,
          viralScore: 9.7,
          whyItWorks: `Gatilho: Beleza sem esforço (effortless chic). Ponto que pega: Prova que ${g.article} ${g.noun} transforma qualquer produção.`,
        },
        {
          id: `hl-costas-4-${seed}`,
          category: 'Caimento de Costas',
          headline: `POV: ${queridinhoMeninas}\nCaimento impecável de costas.`,
          overlayText: 'POV: IMPECÁVEL DE COSTAS',
          visualAction: 'Virar de costas para o espelho olhando por cima do ombro.',
          retentionScore: 99,
          viralScore: 9.9,
          whyItWorks: 'Gatilho: Confirmação do caimento traseiro. Ponto que pega: Vídeos mostrando o caimento de costas geram retenção altíssima no TikTok.',
        },
        {
          id: `hl-unboxing-4-${seed}`,
          category: 'Chegada da Peça',
          headline: `POV: ${dimPhrase}\nAcabou de chegar e já amei.`,
          overlayText: 'POV: JÁ AMEI DE CARA',
          visualAction: 'Retirar da embalagem ou provar no primeiro segundo.',
          retentionScore: 98,
          viralScore: 9.8,
          whyItWorks: 'Gatilho: Empolgação autêntica de unboxing. Ponto que pega: O sentimento de provar a peça na hora e se apaixonar.',
        },
        {
          id: `hl-coringa-4-${seed}`,
          category: 'Peça Coringa',
          headline: `POV: ${nounPhrase}\nPeça coringa do guarda-roupa.`,
          overlayText: 'POV: PEÇA CORINGA',
          visualAction: 'Ajustar no corpo com naturalidade em frente ao espelho.',
          retentionScore: 96,
          viralScore: 9.7,
          whyItWorks: `Gatilho: Item indispensável no armário. Ponto que pega: Fixa ${g.article} ${g.noun} como compra obrigatória para qualquer ocasião.`,
        },
        {
          id: `hl-surpresa-4-${seed}`,
          category: 'Efeito Surpresa',
          headline: `POV: ${queridinhoMomento}\nNunca vesti nada tão bom assim.`,
          overlayText: 'POV: NUNCA VESTI NADA TÃO BOM',
          visualAction: 'Olhar surpreso no espelho com aprovação nítida.',
          retentionScore: 99,
          viralScore: 9.9,
          whyItWorks: 'Gatilho: Hiper-satisfação autêntica. Ponto que pega: Gancho verbal de altíssima curiosidade para o feed do TikTok.',
        },
      ];
    }

    // cycle === 0 (Lote Inicial Padrão)
    return [
      // 1. POV: [Peça] do Momento
      {
        id: `hl-momento-1-${seed}`,
        category: 'Tendência & Efeito Manada',
        headline: `POV: ${nounPhrase}\nVeste bem demais no corpo.`,
        overlayText: `POV: ${nounPhrase.toUpperCase()}`,
        visualAction: 'Girar 360 no espelho mostrando o caimento natural da peça.',
        retentionScore: 99,
        viralScore: 9.9,
        whyItWorks: `Gatilho: Efeito manada imediato ("${g.noun} do momento") em formato POV. Ponto que pega: Frase 100% natural sem parecer vendedor, prendendo a atenção no primeiro frame.`,
      },

      // 2. POV: [Peça] Quase de Graça
      {
        id: `hl-quase-1-${seed}`,
        category: 'Percepção de Valor Orgânica',
        headline: `POV: ${dimPhrase}\nFicou ${g.adjective} no espelho.`,
        overlayText: `POV: ${g.diminutive.toUpperCase()} QUASE DE GRAÇA`,
        visualAction: 'Dar um passo para trás em silêncio conferindo o caimento real.',
        retentionScore: 99,
        viralScore: 9.9,
        whyItWorks: `Gatilho: Percepção de pechincha ("${g.diminutive} quase de graça") sem citar preços ou números. Ponto que pega: Gera curiosidade espontânea sobre onde encontrar a peça.`,
      },

      // 3. POV: O Queridinho das Blogueiras
      {
        id: `hl-queridinho-1-${seed}`,
        category: 'Prova Social & Autoridade',
        headline: `POV: ${queridinhoBlogueiras}\nEsgotou e voltou hoje.`,
        overlayText: 'POV: ESGOTOU E VOLTOU HOJE',
        visualAction: 'Aproximar o tecido para mostrar a gramatura e afastar revelando o caimento.',
        retentionScore: 98,
        viralScore: 9.9,
        whyItWorks: `Gatilho: Autoridade estética ("${g.noun} queridinha") associada à escassez de reposição. Ponto que pega: Prova social sem empurrar produto comercialmente.`,
      },

      // 4. POV: Parece de Shopping Chique
      {
        id: `hl-shopping-1-${seed}`,
        category: 'Ancoragem Visual',
        headline: `POV: ${dimPhrase}\nParece de shopping chique.`,
        overlayText: 'POV: PARECE DE SHOPPING',
        visualAction: 'Passar a mão no tecido mostrando a textura encorpada.',
        retentionScore: 97,
        viralScore: 9.8,
        whyItWorks: 'Gatilho: Alto padrão estético com custo mínimo. Ponto que pega: A sensação de elegância de grife de forma totalmente orgânica.',
      },

      // 5. POV: Zero Transparência
      {
        id: `hl-espelho-1-${seed}`,
        category: 'Quebra de Objeção',
        headline: `POV: ${nounPhrase}\nZero transparência no sol.`,
        overlayText: 'POV: ZERO TRANSPARÊNCIA',
        visualAction: 'Puxar e esticar levemente o tecido em frente ao espelho com luz natural.',
        retentionScore: 99,
        viralScore: 9.9,
        whyItWorks: `Gatilho: Quebra de objeção visual instantânea em 2 frases curtinhas sobre ${g.noun}. Ponto que pega: Elimina a maior dúvida feminina sobre tecidos finos.`,
      },

      // 6. POV: Modela a Cintura
      {
        id: `hl-queridinho-2-${seed}`,
        category: 'Modelagem & Curvas',
        headline: `POV: ${queridinhoMeninas}\nModela o corpo na hora.`,
        overlayText: 'POV: MODELA O CORPO',
        visualAction: 'Passar as mãos contornando a silhueta no espelho.',
        retentionScore: 96,
        viralScore: 9.7,
        whyItWorks: 'Gatilho: Transformação estética imediata e conforto. Ponto que pega: Promete valorizar a silhueta com caimento natural sem aperto.',
      },

      // 7. POV: Não Marca Nada
      {
        id: `hl-marca-1-${seed}`,
        category: 'Conforto & Caimento',
        headline: `POV: ${nounPhrase}\nNão marca nada no corpo.`,
        overlayText: 'POV: NÃO MARCA NADA',
        visualAction: 'Girar no espelho mostrando o caimento suave.',
        retentionScore: 97,
        viralScore: 9.8,
        whyItWorks: `Gatilho: Segurança corporal e conforto. Ponto que pega: Tranquilidade de vestir ${g.article} ${g.noun} que valoriza o corpo sem marcar.`,
      },

      // 8. POV: Direto de Fábrica
      {
        id: `hl-secreto-1-${seed}`,
        category: 'Segredo de Fábrica',
        headline: `POV: ${dimPhrase}\nPeguei direto de fábrica.`,
        overlayText: 'POV: DIRETO DE FÁBRICA',
        visualAction: 'Ajeitar o look no espelho com naturalidade.',
        retentionScore: 96,
        viralScore: 9.7,
        whyItWorks: 'Gatilho: Vantagem de fábrica sem parecer propaganda comercial. Ponto que pega: Curiosidade natural sobre a procedência da peça.',
      },

      // 9. POV: Todo Mundo Elogiou
      {
        id: `hl-trabalho-1-${seed}`,
        category: 'Validação Social',
        headline: `POV: ${nounPhrase}\nTodo mundo me elogiou hoje.`,
        overlayText: 'POV: TODO MUNDO ELOGIOU',
        visualAction: 'Ajustar a peça no espelho com elegância e sorriso espontâneo.',
        retentionScore: 95,
        viralScore: 9.6,
        whyItWorks: 'Gatilho: Validação social de terceiros. Ponto que pega: Desejo de receber elogios no dia a dia ao vestir a roupa.',
      },

      // 10. POV: Coloquei e Não Tiro Mais
      {
        id: `hl-lote-1-${seed}`,
        category: 'Apego & Conforto',
        headline: `POV: ${queridinhoMomento}\nColoquei e não tiro mais.`,
        overlayText: 'POV: NÃO TIRO MAIS',
        visualAction: 'Movimento natural no espelho demonstrando o caimento.',
        retentionScore: 98,
        viralScore: 9.8,
        whyItWorks: `Gatilho: Sensação de peça favorita e confortável. Ponto que pega: Duas frases curtas, naturais e espontâneas sobre ${g.article} ${g.noun}.`,
      },
    ];
  }, [clothingName, pieceType, seed]);

  const copyHeadline = (item: HeadlineItem) => {
    navigator.clipboard.writeText(item.headline);
    setCopiedId(item.id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const handleGenerateMore = () => {
    const nextSeed = seed + 1;
    setAiHeadlines(null);
    requestBackendHeadlines(clothingName, pieceType, clothingImage, nextSeed);
    setIsAnalyzing(true);
    setScanProgress(0);
    setScanPhaseText('Gerando novo lote de variações virais...');
    setScanTags(['Novo Lote POV', 'Radar de Retenção Ativo', 'Sem Menção a Preço']);

    const startTime = Date.now();
    const totalDuration = 2600; // 2.6s para experiência dinâmica e autêntica

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, Math.round((elapsed / totalDuration) * 100));
      setScanProgress(progress);

      if (progress < 30) {
        setScanPhaseText('Explorando novos ângulos de retenção e quebra de objeções...');
        setScanTags(['Novo Lote POV', 'Gatilhos Orgânicos', 'Zero Transparência']);
      } else if (progress < 65) {
        setScanPhaseText('Calculando gatilhos mentais alternativos para o TikTok Shop...');
        setScanTags(['Efeito Manada', 'Achadinho Viral', 'Modelagem Perfeita']);
      } else if (progress < 90) {
        setScanPhaseText('Formatando 10 novas headlines em formato POV de 2 frases...');
        setScanTags(['POV Empilhado', '10 Novas Headlines', 'Prontas Para Gravar']);
      } else {
        setScanPhaseText('Novas headlines concluídas!');
        setScanTags(['Lote Atualizado', '10 Novas Headlines']);
      }

      if (elapsed >= totalDuration) {
        clearInterval(interval);
        setSeed((s) => s + 1);
        setTimeout(() => {
          setIsAnalyzing(false);
          setStep(3);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 120);
      }
    }, 45);
  };

  const copyAll = () => {
    const all = headlinesList
      .map(
        (h, i) =>
          `HEADLINE #${i + 1}:\n"${h.headline}"\n\nPor que essa headline é boa & Gatilho Mental:\n${h.whyItWorks}\n`
      )
      .join('\n──────────────────────────────────────\n\n');

    navigator.clipboard.writeText(all);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2200);
  };

  return (
    <div className="mvz-fade-up pb-16">
      {/* ────────────────────────────────────────────────────────────
          1. HEADER PRINCIPAL • ENGENHARIA DE HEADLINES (PADRÃO TURBO)
      ──────────────────────────────────────────────────────────── */}
      <div className="relative mb-8 overflow-hidden rounded-[32px] border border-[var(--mvz-line)] bg-gradient-to-br from-[#0e0c08] via-[#080705] to-[#040404] p-6 shadow-[0_25px_60px_rgba(0,0,0,0.85)] md:p-8">
        <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-[var(--mvz-gold)]/10 blur-[90px]" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-[#f43f5e]/10 blur-[95px]" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--mvz-gold)]/30 bg-[var(--mvz-gold)]/10 px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-widest text-[var(--mvz-gold)] shadow-[0_0_20px_rgba(212,175,55,0.2)]">
              <Flame size={13} className="text-[var(--mvz-gold)] animate-pulse" />
              <span>Estúdio de Criação • Engenharia de Headlines</span>
            </div>

            <h1 className="text-[28px] font-black tracking-tight text-white sm:text-[36px] md:text-[40px] leading-tight">
              Engenharia de{' '}
              <span className="bg-gradient-to-r from-[#d4af37] via-[#f3e2a4] to-[#eab308] bg-clip-text text-transparent">
                Headlines
              </span>
            </h1>

            <p className="text-[13.5px] leading-relaxed text-white/75 sm:text-[14.5px]">
              Selecione seu produto vencedor ou envie sua peça para gerar headlines virais de alta conversão para o TikTok Shop.
            </p>
          </div>

          {/* Card Resumo da Peça Ativa (Padrão Fiel ao Turbo Seguidores) */}
          <div className="flex items-center gap-4 rounded-2xl border border-[var(--mvz-line-strong)] bg-[#0d0c0a]/90 p-4 backdrop-blur-md lg:w-80">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-[var(--mvz-gold)]/50 bg-black shadow-[0_0_15px_rgba(212,175,55,0.3)]">
              <img
                src={clothingImage}
                alt={clothingName}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--mvz-gold)]">
                {step === 3 ? 'Peça Analisada' : 'Peça em Destaque'}
              </div>
              <div className="truncate text-[14px] font-black text-white">{clothingName}</div>
              <div className="text-[11px] font-semibold text-[var(--mvz-gold-light)]">Moda Feminina TikTok Shop</div>
            </div>

            {step === 3 && (
              <button
                onClick={() => setStep(1)}
                className="rounded-lg border border-white/10 p-2 text-white/60 hover:text-white hover:bg-white/5 transition"
                title="Trocar peça"
              >
                <ArrowRight size={14} className="rotate-180" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────
          PASSO 1: ESCOLHA DA CATEGORIA EM CARDS 3D DE ALTO IMPACTO
      ──────────────────────────────────────────────────────────── */}
      {step === 1 && !isAnalyzing && (
        <div className="space-y-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--mvz-gold)]/35 bg-[var(--mvz-gold)]/10 px-3.5 py-1 text-[10.5px] font-bold uppercase tracking-wider text-[var(--mvz-gold-light)]">
                  <Sparkles size={12} />
                  Passo 1 • Seleção do Produto
                </div>
                <h2 className="mt-2 text-[22px] font-black text-white sm:text-[28px]">
                  Selecione o Produto para Gerar Headlines
                </h2>
                <p className="mt-1 text-[13px] text-[var(--mvz-muted)]">
                  Clique em qualquer produto da sua vitrine para gerar as headlines na hora, ou use o primeiro card para subir o seu próprio produto.
                </p>
              </div>

              <button
                onClick={() => setShowAddExternalModal(true)}
                className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-[var(--mvz-gold)]/60 bg-[var(--mvz-gold)]/15 px-4 text-[12px] font-bold uppercase tracking-wider text-[var(--mvz-gold-light)] backdrop-blur-md transition hover:bg-[var(--mvz-gold)] hover:text-black shadow-[0_0_20px_rgba(212,175,55,0.2)]"
              >
                <Plus size={16} />
                <span>Adicionar Produto de Fora</span>
              </button>
            </div>

            {/* Grid dos Produtos com Card de Subir Próprio Produto em 1º Lugar */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
              {/* CARD 1: SUBIR MEU PRÓPRIO PRODUTO (CENTRALIZADO & DESTACADO) */}
              <div
                onClick={() => setShowAddExternalModal(true)}
                className="group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-[26px] border-2 border-dashed border-[var(--mvz-gold)]/45 bg-gradient-to-b from-[rgba(212,175,55,0.08)] via-[#0d0c0a] to-[#060605] p-6 shadow-[0_12px_35px_rgba(0,0,0,0.7)] transition-all duration-300 hover:-translate-y-2 hover:border-[var(--mvz-gold)] hover:shadow-[0_22px_55px_rgba(212,175,55,0.28)] min-h-[420px]"
              >
                <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-[radial-gradient(circle,_rgba(212,175,55,0.22)_0%,_transparent_70%)] blur-2xl transition-opacity opacity-70 group-hover:opacity-100" />

                {/* Top Badge */}
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--mvz-gold)]/50 bg-[var(--mvz-gold)]/20 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[var(--mvz-gold-light)] shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                    <Plus size={12} />
                    <span>Peça Personalizada</span>
                  </div>
                  <span className="rounded-full border border-white/10 bg-black/60 px-2.5 py-0.5 text-[9.5px] font-semibold text-white/50 backdrop-blur-md">
                    Externo
                  </span>
                </div>

                {/* Conteúdo Perfeitamente Centralizado Verticalmente e Horizontalmente */}
                <div className="my-auto flex flex-1 flex-col items-center justify-center text-center py-6">
                  <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-[var(--mvz-gold)]/50 bg-gradient-to-br from-[var(--mvz-gold)]/25 to-[var(--mvz-gold)]/5 text-[var(--mvz-gold)] shadow-[0_0_35px_rgba(212,175,55,0.25)] transition-transform duration-500 group-hover:scale-110">
                    <Upload size={32} />
                  </div>

                  <h3 className="mt-5 text-[17px] font-black uppercase tracking-tight text-white group-hover:text-[var(--mvz-gold-light)] transition">
                    Subir Meu Próprio Produto
                  </h3>
                  <p className="mt-2.5 max-w-[240px] text-[12px] leading-relaxed text-white/70">
                    Envie a foto e o nome da sua peça para a IA analisar o caimento e gerar as headlines na hora.
                  </p>
                </div>

                {/* Botão de Rodapé Alinhado com os outros cards */}
                <div className="pt-4 border-t border-white/[0.08]">
                  <div className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[var(--mvz-gold)] bg-[var(--mvz-gold)]/15 text-[12px] font-bold uppercase tracking-wider text-[var(--mvz-gold-light)] transition group-hover:bg-[var(--mvz-gold)] group-hover:text-black shadow-[0_0_20px_rgba(212,175,55,0.2)]">
                    <Plus size={15} />
                    <span>Cadastrar Peça de Fora</span>
                  </div>
                </div>
              </div>

              {/* DEMAIS CARDS: PRODUTOS VALIDADOS COM 1-CLIQUE */}
              {products.map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => handleSelectProductAndGenerate(prod)}
                  className="group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-[24px] border border-[var(--mvz-line)] bg-[#0d0c0a] shadow-[0_12px_30px_rgba(0,0,0,0.6)] transition-all duration-300 hover:-translate-y-2 hover:border-[var(--mvz-gold)] hover:shadow-[0_20px_45px_rgba(212,175,55,0.25)] min-h-[420px]"
                >
                  {/* Foto do produto */}
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-black">
                    <img
                      src={prod.image}
                      alt={prod.name}
                      loading="lazy"
                      className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-108"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0d0c0a] via-transparent to-transparent opacity-90" />

                    {/* Tag customizada (apenas para produtos externos) */}
                    {prod.isCustom && (
                      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
                        <span className="rounded-full border border-[var(--mvz-gold)]/40 bg-[var(--mvz-gold)]/20 px-2.5 py-0.5 text-[9.5px] font-extrabold uppercase text-[var(--mvz-gold-light)] backdrop-blur-md">
                          Externo
                        </span>
                      </div>
                    )}

                    {/* Botão de exclusão (apenas para produtos customizados) */}
                    {prod.isCustom && (
                      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteProduct(prod.id);
                          }}
                          className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/40 hover:text-white transition cursor-pointer"
                          title="Excluir produto"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    )}

                    {/* Preço flutuante no rodapé da imagem */}
                    <div className="absolute bottom-3 left-3 z-10">
                      <span className="rounded-lg border border-white/10 bg-black/80 px-2.5 py-1 text-[12px] font-extrabold text-white backdrop-blur-md">
                        {prod.suggestedPrice}
                      </span>
                    </div>
                  </div>

                  {/* Detalhes & Botão de Ação Direta */}
                  <div className="relative z-10 flex flex-1 flex-col justify-between p-4 pt-3">
                    <div>
                      <h4 className="line-clamp-2 text-[12px] font-black uppercase leading-tight text-white group-hover:text-[var(--mvz-gold-light)] transition">
                        {prod.name}
                      </h4>
                      <p className="mt-1 line-clamp-1 text-[11px] text-[var(--mvz-dim)]">
                        {prod.sales}
                      </p>
                    </div>

                    <div className="mt-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectProductAndGenerate(prod);
                        }}
                        className="flex h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-[var(--mvz-gold)] bg-gradient-to-r from-[var(--mvz-gold)] to-[var(--mvz-gold-light)] text-[12px] font-black uppercase tracking-wider text-black transition hover:opacity-95 shadow-[0_0_20px_rgba(212,175,55,0.35)]"
                      >
                        <Zap size={14} className="fill-black" />
                        <span>Gerar Headlines</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
      )}

      {/* ────────────────────────────────────────────────────────────
          FEEDBACK DE ANÁLISE EM PROGRESSO COM SCANNER VISUAL DA PEÇA
      ──────────────────────────────────────────────────────────── */}
      {isAnalyzing && (
        <div className="mx-auto max-w-2xl py-12 text-center animate-in fade-in duration-300">
          <div className="relative mx-auto flex h-48 w-48 items-center justify-center">
            {/* Anéis pulsantes e radar */}
            <div
              className="absolute inset-0 rounded-full border-2 border-dashed border-[var(--mvz-gold)]/40 animate-spin"
              style={{ animationDuration: '7s' }}
            />
            <div className="absolute -inset-4 rounded-full border border-[var(--mvz-gold)]/20 animate-ping opacity-25" />

            {/* Thumbnail com Scanner Laser Vertical */}
            <div className="relative h-40 w-40 overflow-hidden rounded-3xl border-2 border-[var(--mvz-gold)] bg-black shadow-[0_0_50px_rgba(212,175,55,0.45)]">
              <img
                src={clothingImage}
                alt={clothingName}
                className="h-full w-full object-cover scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

              {/* Mira / Brackets nos 4 cantos */}
              <div className="pointer-events-none absolute left-2 top-2 h-3 w-3 border-l-2 border-t-2 border-[var(--mvz-gold)]" />
              <div className="pointer-events-none absolute right-2 top-2 h-3 w-3 border-r-2 border-t-2 border-[var(--mvz-gold)]" />
              <div className="pointer-events-none absolute bottom-2 left-2 h-3 w-3 border-b-2 border-l-2 border-[var(--mvz-gold)]" />
              <div className="pointer-events-none absolute bottom-2 right-2 h-3 w-3 border-b-2 border-r-2 border-[var(--mvz-gold)]" />

              {/* Feixe Laser Animado */}
              <div
                className="pointer-events-none absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[var(--mvz-gold-light)] to-transparent shadow-[0_0_15px_rgba(212,175,55,1)] animate-bounce"
                style={{ animationDuration: '2s' }}
              />

              <div className="absolute bottom-2 inset-x-0 text-center">
                <span className="rounded-full border border-[var(--mvz-gold)]/50 bg-black/80 px-2.5 py-0.5 text-[9.5px] font-black uppercase tracking-wider text-[var(--mvz-gold-light)] backdrop-blur-md">
                  Escaneando Foto
                </span>
              </div>
            </div>
          </div>

          <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-[var(--mvz-gold)]/40 bg-[var(--mvz-gold)]/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--mvz-gold-light)] shadow-[0_0_20px_rgba(212,175,55,0.2)]">
            <Sparkles size={13} className="animate-spin text-[var(--mvz-gold)]" />
            <span>Motor Neural de Retenção Visual</span>
          </div>

          <h3 className="mt-4 text-[22px] font-black text-white sm:text-[26px]">
            {seed > 1 ? 'Gerando novas variações de headlines...' : 'Analisando o produto...'}
          </h3>

          <p className="mt-2 text-[13.5px] font-medium text-[var(--mvz-gold-light)] min-h-[22px]">
            {scanPhaseText}
          </p>

          {/* Barra de Progresso Realista */}
          <div className="mx-auto mt-5 max-w-md">
            <div className="flex items-center justify-between text-[11px] font-extrabold text-white/60 mb-2">
              <span className="uppercase tracking-wider">
                {seed > 1 ? 'Processando Novos Ganchos' : 'Processando Caimento'}
              </span>
              <span className="font-mono text-[13px] text-[var(--mvz-gold)]">{scanProgress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full border border-white/10 bg-white/5 p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--mvz-gold)] via-[var(--mvz-gold-light)] to-[#fff0a8] shadow-[0_0_15px_rgba(212,175,55,0.7)] transition-all duration-100 ease-out"
                style={{ width: `${scanProgress}%` }}
              />
            </div>
          </div>

          {/* Chips de Detecção Neural em Tempo Real */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {scanTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-xl border border-[var(--mvz-gold)]/30 bg-black/60 px-3 py-1 text-[11px] font-semibold text-white/80 animate-in fade-in"
              >
                <Check size={12} className="text-[#7fcf9f]" />
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────
          PASSO 3: PAINEL DE HEADLINES PRONTAS PARA GRAVAR
      ──────────────────────────────────────────────────────────── */}
      {step === 3 && !isAnalyzing && (
        <div className="space-y-7">
          {/* Card Resumo do Produto Analisado */}
          <div className="rounded-[28px] border border-[rgba(212,175,55,0.3)] bg-gradient-to-r from-[#17140e] via-[#0d0c0a] to-[#070605] p-5 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.9)]">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              {/* Informações da Peça */}
              <div className="flex items-center gap-4 min-w-0">
                <div className="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-2xl border border-[var(--mvz-gold)]/40 bg-black shadow-[0_0_20px_rgba(212,175,55,0.2)]">
                  <img
                    src={clothingImage}
                    alt={clothingName}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                </div>

                <div className="min-w-0">
                  <h2 className="text-[18px] sm:text-[22px] font-black text-white truncate max-w-sm sm:max-w-md">
                    {clothingName}
                  </h2>
                  <p className="mt-1 text-[12px] font-semibold text-[var(--mvz-muted)]">
                    Formato: <span className="text-[var(--mvz-gold)]">POV Natural (Máx. 2 Frases)</span> • Sem preço e sem vendedor
                  </p>
                </div>
              </div>

              {/* Botões de Ação do Header - Alinhados Lado a Lado (flex-nowrap) */}
              <div className="flex items-center gap-2.5 sm:gap-3 flex-nowrap shrink-0 overflow-x-auto pb-1 lg:pb-0">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-[12px] font-bold text-white/80 hover:border-[var(--mvz-gold)] hover:text-white transition shrink-0 whitespace-nowrap"
                  title="Trocar de Produto"
                >
                  <ArrowRight size={13} className="rotate-180" />
                  <span>Trocar</span>
                </button>

                <button
                  onClick={handleGenerateMore}
                  disabled={isAnalyzing}
                  className="flex items-center gap-1.5 rounded-xl border border-[rgba(212,175,55,0.45)] bg-[rgba(212,175,55,0.12)] px-4 py-2.5 text-[12px] font-bold text-[var(--mvz-gold-light)] hover:bg-[var(--mvz-gold)] hover:text-black transition shrink-0 whitespace-nowrap shadow-[0_0_15px_rgba(212,175,55,0.15)]"
                >
                  <Sparkles size={14} className="text-[var(--mvz-gold)]" />
                  <span>Gerar Mais Variações</span>
                </button>

                <button
                  onClick={copyAll}
                  className="mvz-btn-grad flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[12px] font-bold uppercase text-black shrink-0 whitespace-nowrap shadow-[0_0_20px_rgba(212,175,55,0.3)]"
                >
                  {copiedAll ? <Check size={14} className="stroke-[3]" /> : <Copy size={13} />}
                  <span>{copiedAll ? 'Todas Copiadas!' : 'Copiar Todas'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Grid de Cards de Headlines (1 Headline por Quadradinho, Máx 2 Frases + Explicação) */}
          <div
            key={`headlines-batch-${seed}`}
            className="grid grid-cols-1 gap-5 sm:grid-cols-2"
          >
            {headlinesList.map((item, index) => {
              const isHeadlineCopied = copiedId === item.id;

              return (
                <div
                  key={item.id}
                  className="mvz-card mvz-card-hover relative flex flex-col justify-between overflow-hidden rounded-[24px] border border-[var(--mvz-line)] bg-[#0d0c0a] p-6 shadow-[0_12px_35px_rgba(0,0,0,0.6)] transition-all duration-300 hover:border-[rgba(212,175,55,0.4)] hover:shadow-[0_16px_45px_rgba(212,175,55,0.15)]"
                >
                  <div>
                    {/* Topo do Card: Identificador Limpo & Botão de Copiar */}
                    <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-4">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--mvz-gold)]">
                        Headline #{String(index + 1).padStart(2, '0')}
                      </span>
                      <button
                        onClick={() => copyHeadline(item)}
                        className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11.5px] font-bold transition ${
                          isHeadlineCopied
                            ? 'border-[#7fcf9f] bg-[#7fcf9f]/15 text-[#7fcf9f]'
                            : 'border-white/10 bg-white/[0.03] text-white/80 hover:border-[var(--mvz-gold)] hover:text-white'
                        }`}
                      >
                        {isHeadlineCopied ? <Check size={13} className="text-[#7fcf9f]" /> : <Copy size={13} />}
                        <span>{isHeadlineCopied ? 'Copiada!' : 'Copiar Headline'}</span>
                      </button>
                    </div>

                    {/* A Headline: 2 frases pequenininhas uma embaixo da outra */}
                    <div className="rounded-2xl border border-white/10 bg-black/60 p-4 mb-4">
                      <p className="text-[16px] font-black leading-relaxed text-white whitespace-pre-line font-mono">
                        {item.headline}
                      </p>
                    </div>

                    {/* Explicação: Ponto que a headline pega & Por que é boa (Gatilho Mental) */}
                    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                      <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-[#7fcf9f] flex items-center gap-1.5">
                        <Zap size={13} />
                        Por que essa headline é boa & Gatilho Mental:
                      </span>
                      <p className="mt-2 text-[12.5px] leading-relaxed text-white/80">
                        {item.whyItWorks}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal para Adicionar Produto de Fora */}
      {showAddExternalModal &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
              onClick={() => setShowAddExternalModal(false)}
            />
            <div className="relative z-10 w-full max-w-lg rounded-[28px] border border-[var(--mvz-gold)]/40 bg-[#0d0c0a] p-6 shadow-[0_25px_80px_rgba(0,0,0,0.95)] sm:p-8 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--mvz-gold)]/15 text-[var(--mvz-gold)] shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                    <Plus size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Cadastrar Produto de Fora</h3>
                    <p className="text-xs text-[var(--mvz-muted)]">
                      Adicione qualquer produto externo para gerar headlines imediatas
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddExternalModal(false)}
                  className="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveExternalProduct} className="mt-5 space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-white/80">
                    Nome da Peça / Roupa *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Blusa Canelada Gola Alta com Abertura"
                    value={extName}
                    onChange={(e) => setExtName(e.target.value)}
                    className="mvz-input mt-1.5 h-11 w-full px-3.5 text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-white/80">
                    Modelagem da Roupa *
                  </label>
                  <div className="mt-1.5 grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setExtPieceType('superior')}
                      className={`flex flex-col items-center justify-center rounded-xl border p-2.5 text-center transition ${
                        extPieceType === 'superior'
                          ? 'border-[var(--mvz-gold)] bg-[var(--mvz-gold)]/15 text-white'
                          : 'border-white/10 bg-white/[0.02] text-white/60 hover:text-white'
                      }`}
                    >
                      <Shirt size={16} className={extPieceType === 'superior' ? 'text-[var(--mvz-gold)]' : ''} />
                      <span className="mt-1 text-[11px] font-bold">Parte Superior</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setExtPieceType('inferior')}
                      className={`flex flex-col items-center justify-center rounded-xl border p-2.5 text-center transition ${
                        extPieceType === 'inferior'
                          ? 'border-[#22c55e] bg-[#22c55e]/15 text-white'
                          : 'border-white/10 bg-white/[0.02] text-white/60 hover:text-white'
                      }`}
                    >
                      <ArrowDownToLine size={16} className={extPieceType === 'inferior' ? 'text-[#22c55e]' : ''} />
                      <span className="mt-1 text-[11px] font-bold">Parte Inferior</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setExtPieceType('conjunto')}
                      className={`flex flex-col items-center justify-center rounded-xl border p-2.5 text-center transition ${
                        extPieceType === 'conjunto'
                          ? 'border-[#d946ef] bg-[#d946ef]/15 text-white'
                          : 'border-white/10 bg-white/[0.02] text-white/60 hover:text-white'
                      }`}
                    >
                      <Sparkles size={16} className={extPieceType === 'conjunto' ? 'text-[#d946ef]' : ''} />
                      <span className="mt-1 text-[11px] font-bold">Conjunto / Look</span>
                    </button>
                  </div>
                </div>

                {/* Upload ou URL da Foto */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-white/80">
                    Foto da Roupa *
                  </label>
                  
                  <div className="mt-1.5 space-y-2">
                    {/* Seletor de Arquivo */}
                    <div
                      onClick={() => extFileInputRef.current?.click()}
                      className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-black/40 p-3 text-center transition hover:border-[var(--mvz-gold)]"
                    >
                      <input
                        ref={extFileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleExtImageUpload(file);
                        }}
                        className="hidden"
                      />
                      <Upload size={16} className="text-[var(--mvz-gold)]" />
                      <span className="text-xs text-white/70">
                        {extImage.startsWith('data:') ? 'Foto do arquivo carregada com sucesso' : 'Clique para selecionar foto do computador'}
                      </span>
                    </div>

                    {/* Ou Link da Imagem */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold text-[var(--mvz-dim)]">Ou cole URL:</span>
                      <input
                        type="text"
                        placeholder="https://i.imgur.com/... ou link direto da imagem"
                        value={extImage.startsWith('data:') ? '' : extImage}
                        onChange={(e) => setExtImage(e.target.value)}
                        className="mvz-input h-9 flex-1 px-3 text-xs"
                      />
                    </div>

                    {extImage && (
                      <div className="mt-2 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-2">
                        <img
                          src={extImage}
                          alt="Preview"
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                        <span className="text-xs text-[#7fcf9f] font-semibold">Prévia carregada com sucesso</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddExternalModal(false)}
                    className="rounded-xl border border-white/10 px-4 py-2.5 text-xs font-bold text-white/70 hover:bg-white/5 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="mvz-btn-grad flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold shadow-[0_0_20px_rgba(212,175,55,0.3)]"
                  >
                    <Zap size={14} className="fill-black" />
                    <span>Salvar & Gerar Headlines Agora</span>
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

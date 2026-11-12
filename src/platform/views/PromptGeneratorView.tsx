import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  Wand2,
  Video,
  Image as ImageIcon,
  FileText,
  Terminal,
  ArrowRight,
  Download,
  Trash2,
  Mic,
  Zap,
  ShieldCheck,
  Camera,
  Sun,
  History,
} from 'lucide-react';
import type { ViewId } from '../data';
import { copyText } from './ChatParts';
import { useUserProfile } from '../useUserProfile';

interface GeneratedPrompt {
  id: string;
  engine: 'kling' | 'flow' | 'hailuo' | 'midjourney' | 'chatgpt';
  engineLabel: string;
  category: 'video' | 'image' | 'script' | 'master';
  title: string;
  promptEn: string;
  promptPt: string;
  negativePrompt?: string;
  cameraMotion?: string;
  lighting?: string;
  aspectRatio: string;
  tags: string[];
  createdAt: number;
}

interface Props {
  onUseInAgent?: (prompt: string) => void;
  onNavigate?: (view: ViewId) => void;
}

const TEMPLATE_IDEAS = [
  {
    title: 'Vídeo Viral Moda Fitness TikTok',
    desc: 'Demonstração de legging blackout e top com giro 360 no espelho sem transparência.',
    text: 'Vídeo vertical no espelho mostrando um conjunto fitness feminino na cor vinho, modelo agacha suavemente e faz um giro de 360 graus mostrando a compressão na cintura e zero transparência do tecido.',
    engine: 'kling',
    aspect: '9:16',
  },
  {
    title: 'Fotografia Editorial de Vestido',
    desc: 'Ensaio fotográfico de vestido midi em cenário minimalista com luz natural de fim de tarde.',
    text: 'Ensaio fotográfico editorial de alta moda com vestido canelado elegante em ambiente minimalista, iluminação suave de fim de tarde entrando pela janela, cores naturais e textura rica de tecido.',
    engine: 'midjourney',
    aspect: '9:16',
  },
  {
    title: 'Comercial Cinematográfico de Produto',
    desc: 'Animação de câmera fluida com iluminação de estúdio luxuoso destacando detalhes.',
    text: 'Câmera lenta cinematográfica com iluminação de estúdio profissional em fundo escuro, câmera se aproxima suavemente destacando acabamentos dourados e costura de alta qualidade.',
    engine: 'flow',
    aspect: '16:9',
  },
  {
    title: 'Roteiro UGC com Quebra de Objeção',
    desc: 'Influenciadora testando a peça na prática nos primeiros 3 segundos para reter o feed.',
    text: 'Roteiro de criativo UGC com influenciadora provando na prática que a peça não aperta nem marca, fala energética nos primeiros 2 segundos e chamada para ação no carrinho laranja.',
    engine: 'chatgpt',
    aspect: '9:16',
  },
];

const AI_ENGINES = [
  { id: 'all', label: 'Todos os Motores', desc: 'Gera versões para todas as IAs' },
  { id: 'kling', label: 'Kling AI V1.5/V2', desc: 'Especialista em movimento realista' },
  { id: 'flow', label: 'Google Flow / VEO', desc: 'Cinematográfico e iluminação 4K' },
  { id: 'hailuo', label: 'Hailuo AI (Minimax)', desc: 'Fluidez dinâmica e física natural' },
  { id: 'midjourney', label: 'Midjourney / Flux', desc: 'Render fotorrealista e editorial' },
  { id: 'chatgpt', label: 'Roteiro / Copy UGC', desc: 'Roteiros de fala e texto na tela' },
];

const ASPECT_RATIOS = [
  { id: '9:16', label: '9:16 Vertical', desc: 'TikTok, Reels & Shorts' },
  { id: '16:9', label: '16:9 Cinema', desc: 'YouTube & Widescreen' },
  { id: '1:1', label: '1:1 Quadrado', desc: 'Feed Instagram' },
  { id: '4:5', label: '4:5 Retrato', desc: 'Carrossel & Anúncios' },
];

const CAMERA_STYLES = [
  'UGC Natural (Câmera na Mão / iPhone)',
  'Cinematográfico 35mm (Arri Alexa)',
  'Giro Suave 360 Graus (Orbit Camera)',
  'Espelho Vertical POV (Estilo Provador)',
  'Macro Close-up Detalhado (Textura)',
];

const LIGHTING_STYLES = [
  'Luz Natural Difusa de Janela',
  'Golden Hour Suave (Pôr do Sol)',
  'Estúdio Minimalista Softbox 5600K',
  'Dark Luxury com Reflexos Dourados',
  'Luz Direta de Provador Realista',
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SpeechRec: any =
  typeof window !== 'undefined'
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : undefined;

const STORAGE_KEY = 'orbiex_prompt_generator_history_v1';

export function PromptGeneratorView({ onUseInAgent, onNavigate }: Props) {
  const { displayName } = useUserProfile();

  // Entradas do Usuário
  const [rawIdea, setRawIdea] = useState('');
  const [targetEngine, setTargetEngine] = useState('all');
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [cameraStyle, setCameraStyle] = useState(CAMERA_STYLES[0]);
  const [lightingStyle, setLightingStyle] = useState(LIGHTING_STYLES[0]);
  const [includeNegative, setIncludeNegative] = useState(true);
  const [includeCameraTags, setIncludeCameraTags] = useState(true);

  // Estados de Interface
  const [listening, setListening] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genStep, setGenStep] = useState(0);
  const [activeTab, setActiveTab] = useState<'all' | 'video' | 'image' | 'script' | 'history'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Histórico e Resultados
  const [results, setResults] = useState<GeneratedPrompt[]>([]);
  const [history, setHistory] = useState<GeneratedPrompt[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Salva no localStorage quando novos prompts forem gerados
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 30)));
    } catch {}
  }, [history]);

  // Entrada por Voz
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recRef = useRef<any>(null);
  const toggleVoice = () => {
    if (!SpeechRec) return;
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const rec = new SpeechRec();
    rec.lang = 'pt-BR';
    rec.interimResults = true;
    const base = rawIdea ? `${rawIdea} ` : '';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      let t = '';
      for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
      setRawIdea(base + t);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  };

  const handleCopy = async (id: string, text: string) => {
    if (await copyText(text)) {
      setCopiedId(id);
      setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 2000);
    }
  };

  // Motor Inteligente de Construção de Prompts
  const generatePrompts = useCallback(() => {
    if (!rawIdea.trim()) return;

    setGenerating(true);
    setGenStep(1);

    setTimeout(() => setGenStep(2), 500);
    setTimeout(() => setGenStep(3), 1100);

    setTimeout(() => {
      const idea = rawIdea.trim();
      const now = Date.now();
      const generatedList: GeneratedPrompt[] = [];

      // 1. Prompt para Kling AI (Vídeo & Movimento Realista)
      if (targetEngine === 'all' || targetEngine === 'kling') {
        generatedList.push({
          id: `p-kling-${now}`,
          engine: 'kling',
          engineLabel: 'Kling AI V1.5 / V2.0',
          category: 'video',
          title: 'Prompt Cinematográfico de Movimento Vertical (Kling AI)',
          promptEn: `High-end commercial video, vertical format ${aspectRatio}. ${idea}. Shot on realistic mobile camera, authentic UGC social media aesthetic, natural body proportions, rich textile fabric texture, authentic skin tones. ${cameraStyle}, subtle camera movement, natural motion blur, seamless flow, ${lightingStyle}. Ultra sharp focus, 8k resolution, raw quality, 30fps.`,
          promptPt: `Vídeo comercial vertical em formato ${aspectRatio}. ${idea}. Capturado em ângulo realista, estética natural de rede social, proporções anatômicas fiéis, textura nítida do tecido. ${cameraStyle}, movimento suave de câmera, ${lightingStyle}. Foco ultranítido e alta fidelidade.`,
          negativePrompt: includeNegative
            ? 'deformed hands, extra fingers, mutated anatomy, blur, jitter, artifacts, cartoonish, 3d render, plastic skin, oversaturation, distortion, face glitch, bad proportions'
            : undefined,
          cameraMotion: includeCameraTags
            ? 'Camera: Handheld organic pan, smooth slow orbit, gentle zoom-in, steady gimbal stabilization'
            : undefined,
          lighting: lightingStyle,
          aspectRatio,
          tags: ['Kling AI', 'Vídeo Vertical', 'Física Realista', 'Sem Distorção'],
          createdAt: now,
        });
      }

      // 2. Prompt para Google Flow / VEO (Hiper-realismo Cinematográfico)
      if (targetEngine === 'all' || targetEngine === 'flow') {
        generatedList.push({
          id: `p-flow-${now}`,
          engine: 'flow',
          engineLabel: 'Google Flow / VEO 3',
          category: 'video',
          title: 'Prompt de Alta Fidelidade Cinematográfica (Google Flow)',
          promptEn: `Cinematic commercial fashion shot, aspect ratio ${aspectRatio}. ${idea}. Filmed on 35mm Arri Alexa camera with master prime lens f/1.8. ${lightingStyle}, soft volumetric shadows, natural color grade, accurate fabric micro-textures. ${cameraStyle}, steady cinematic tracking, photorealistic depth of field, 4k master render.`,
          promptPt: `Plano cinematográfico comercial de moda em formato ${aspectRatio}. ${idea}. Filmado em lente nobre 35mm f/1.8 com profundidade de campo suave. ${lightingStyle}, sombras volumétricas sutis, gradação de cores naturais e microtextura do tecido. ${cameraStyle}, rastreamento estável e render 4K.`,
          negativePrompt: includeNegative
            ? 'flicker, anatomical distortion, low resolution, noisy, plastic textures, blown-out highlights, artifacts, extra limbs, bad eyes'
            : undefined,
          cameraMotion: includeCameraTags
            ? 'Camera: Smooth dynamic tracking, subtle slow tilt down, steady frame centering'
            : undefined,
          lighting: lightingStyle,
          aspectRatio,
          tags: ['Google Flow', 'VEO 3', 'Cinematográfico 4K', 'Lente 35mm'],
          createdAt: now + 1,
        });
      }

      // 3. Prompt para Midjourney / Flux (Render e Fotografia Imersiva)
      if (targetEngine === 'all' || targetEngine === 'midjourney') {
        generatedList.push({
          id: `p-midjourney-${now}`,
          engine: 'midjourney',
          engineLabel: 'Midjourney V6.1 / Flux Pro',
          category: 'image',
          title: 'Prompt de Fotografia Editorial Hiper-realista (Midjourney / Flux)',
          promptEn: `High fashion editorial photograph, full shot. ${idea}. Modern aesthetic, authentic human model with realistic skin texture, intricate cloth weave, luxury aesthetic. ${lightingStyle}, soft specular highlights, clean minimalist composition. Shot with Hasselblad X2D 100C, 85mm portrait lens, shallow depth of field --ar ${aspectRatio.replace(':', ':')} --v 6.1 --style raw --q 2`,
          promptPt: `Fotografia editorial de alta moda em plano inteiro. ${idea}. Estética moderna, modelo autêntica com textura de pele fotorrealista, tecido de alta densidade e acabamento refinado. ${lightingStyle}, reflexos suaves e composição limpa. Capturada com Hasselblad X2D 100C em lente 85mm.`,
          negativePrompt: includeNegative
            ? '--no cartoon, 3d, render, illustration, bad anatomy, deformed fingers, extra limbs, oversaturated, blurry, text, watermark'
            : undefined,
          cameraMotion: undefined,
          lighting: lightingStyle,
          aspectRatio,
          tags: ['Midjourney', 'Flux Pro', 'Fotografia 8K', 'Editorial'],
          createdAt: now + 2,
        });
      }

      // 4. Prompt para Hailuo AI (Física e Fluidez Orgânica)
      if (targetEngine === 'all' || targetEngine === 'hailuo') {
        generatedList.push({
          id: `p-hailuo-${now}`,
          engine: 'hailuo',
          engineLabel: 'Hailuo AI (Minimax)',
          category: 'video',
          title: 'Prompt de Dinâmica Natural e Tecido (Hailuo AI)',
          promptEn: `Ultra-fluid video sequence, ${aspectRatio}. ${idea}. Natural physical cloth dynamics, realistic fabric elasticity and tension. Model performs smooth organic motion, confident posture, engaging facial expression. ${cameraStyle}, clear front focus, ${lightingStyle}. High definition output, zero artifacting.`,
          promptPt: `Sequência de vídeo ultrafluida em ${aspectRatio}. ${idea}. Física natural do caimento e elasticidade do tecido durante o movimento. Movimento orgânico e expressivo da modelo. ${cameraStyle}, foco frontal nítido e ${lightingStyle}. Alta definição sem artefatos.`,
          negativePrompt: includeNegative
            ? 'body deformation, unrealistic movement, jerky motion, low frame rate, artificial look, duplicate bodies, distorted face'
            : undefined,
          cameraMotion: includeCameraTags
            ? 'Camera: Continuous smooth follow-through, subtle vertical pan'
            : undefined,
          lighting: lightingStyle,
          aspectRatio,
          tags: ['Hailuo AI', 'Minimax', 'Física de Tecidos', 'Fluidez'],
          createdAt: now + 3,
        });
      }

      // 5. Prompt de Roteiro e Copy UGC (Para TikTok Shop / Anúncios)
      if (targetEngine === 'all' || targetEngine === 'chatgpt') {
        generatedList.push({
          id: `p-script-${now}`,
          engine: 'chatgpt',
          engineLabel: 'Roteiro & Copy Viral UGC',
          category: 'script',
          title: 'Estrutura Completa de Fala & Texto na Tela (0 a 15 Segundos)',
          promptEn: `[HOOK 0-3S]: "Se você achava que ${idea.slice(0, 45)} ia ficar transparente ou marcar no corpo, para tudo e olha esse teste real no espelho!"\n[AÇÃO DE CÂMERA]: Modelo agacha no limite de costas, se levanta suavemente e passa a mão lateral na cintura mostrando o ajuste anatômico perfeito.\n[TEXTO NA TELA]: "ZERO TRANSPARÊNCIA?! Teste real no espelho (Não enrola o cós)"\n[CORPO 4-10S]: "O tecido é duplo, com compressão inteligente que modela sem sufocar. Não desce durante o agachamento e o toque é macio."\n[CTA 11-15S]: "Está com frete grátis liberado na loja hoje. Clica no link do carrinho aqui embaixo antes que esgote o lote!"`,
          promptPt: `Roteiro estruturado para alta conversão no TikTok Shop com gancho de retenção nos primeiros 3 segundos, quebra de objeção visual no espelho, demonstração do benefício principal e chamada direta de compra para o carrinho.`,
          negativePrompt: undefined,
          cameraMotion: 'Câmera na altura da cintura com enquadramento vertical aproximando nos detalhes',
          lighting: 'Iluminação frontal de anel de luz ou janela direta',
          aspectRatio: '9:16',
          tags: ['Roteiro UGC', 'TikTok Shop', 'Gancho 0 a 3s', 'Conversão'],
          createdAt: now + 4,
        });
      }

      setResults(generatedList);
      setHistory((prev) => [...generatedList, ...prev.filter((p) => !generatedList.some((g) => g.id === p.id))]);
      setGenerating(false);
      setGenStep(0);
    }, 1600);
  }, [rawIdea, targetEngine, aspectRatio, cameraStyle, lightingStyle, includeNegative, includeCameraTags]);

  const displayedList = useMemo(() => {
    if (activeTab === 'history') return history;
    if (activeTab === 'video') return results.filter((p) => p.category === 'video');
    if (activeTab === 'image') return results.filter((p) => p.category === 'image');
    if (activeTab === 'script') return results.filter((p) => p.category === 'script');
    return results;
  }, [activeTab, results, history]);

  const clearAll = () => {
    setResults([]);
    setRawIdea('');
  };

  const exportAllAsTxt = () => {
    if (results.length === 0) return;
    const content = results
      .map(
        (r, i) =>
          `========================================\nPROMPT #${i + 1} • ${r.engineLabel.toUpperCase()}\nTITULO: ${r.title}\nPROPORÇÃO: ${r.aspectRatio}\n\n[PROMPT EM INGLÊS]:\n${r.promptEn}\n\n${r.negativePrompt ? `[NEGATIVE PROMPT]:\n${r.negativePrompt}\n\n` : ''}${r.cameraMotion ? `[MOVIMENTO DE CÂMERA]:\n${r.cameraMotion}\n\n` : ''}[TRADUÇÃO E DETALHES]:\n${r.promptPt}\n========================================\n\n`
      )
      .join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `orbiex_prompts_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mvz-fade-up space-y-6 pb-12">
      {/* ────────────────────────────────────────────────────────────
          1. HEADER VIP DO GERADOR DE PROMPTS
      ──────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-[26px] border border-[var(--mvz-line)] bg-gradient-to-br from-[#100d07] via-[#090805] to-[#040404] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.85)] sm:p-8">
        <div className="pointer-events-none absolute -top-20 -left-20 h-72 w-72 rounded-full bg-[var(--mvz-gold)]/10 blur-[85px]" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-[#3b82f6]/10 blur-[90px]" />

        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--mvz-gold)]/30 bg-[var(--mvz-gold)]/10 px-3.5 py-1 text-[10px] font-extrabold uppercase tracking-widest text-[var(--mvz-gold)] shadow-[0_0_15px_rgba(212,175,55,0.2)]">
              <Sparkles size={12} className="text-[var(--mvz-gold)]" />
              <span>Prompt Architect IA • Engine V3</span>
            </div>

            <h1 className="text-[26px] font-black tracking-tight text-white sm:text-[34px] leading-tight">
              Gerador de Prompts{' '}
              <span className="bg-gradient-to-r from-[#d4af37] via-[#f3e2a4] to-[#eab308] bg-clip-text text-transparent">
                Profissional
              </span>
            </h1>

            <p className="max-w-2xl text-[13px] leading-relaxed text-white/70">
              Transforme qualquer ideia bruta em comandos neurais de alta precisão parametrizados para Kling AI, Google Flow, Midjourney, Hailuo e roteiros de conversão.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate?.('prompts')}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-[12px] font-bold text-white/80 transition hover:bg-white/[0.08] hover:text-white cursor-pointer"
            >
              <span>Ver Biblioteca de Prompts</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────
          2. ESTÚDIO DIVIDIDO EM 2 COLUNAS: CRIAÇÃO & RESULTADOS
      ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* ── COLUNA ESQUERDA: ENTRADA & PARAMETRIZAÇÃO (5 cols) ── */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          <div className="rounded-[24px] border border-white/[0.08] bg-[#0c0c0d] p-5 shadow-xl space-y-5">
            {/* Header da Seção */}
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <Wand2 size={16} className="text-[var(--mvz-gold)]" />
                <h3 className="text-[13px] font-black uppercase tracking-wider text-white">
                  Expressar Ideia Criativa
                </h3>
              </div>
              <span className="text-[10px] text-white/40">Entrada Livre</span>
            </div>

            {/* Ideias Modelo / Templates Rápidos */}
            <div className="space-y-1.5">
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-white/50">
                Inspiração Rápida:
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {TEMPLATE_IDEAS.map((tpl) => (
                  <button
                    key={tpl.title}
                    onClick={() => {
                      setRawIdea(tpl.text);
                      setTargetEngine(tpl.engine);
                      setAspectRatio(tpl.aspect);
                    }}
                    className="flex flex-col text-left rounded-xl border border-white/5 bg-white/[0.02] p-2.5 hover:border-[var(--mvz-gold)]/40 hover:bg-white/[0.04] transition cursor-pointer"
                  >
                    <span className="truncate text-[11px] font-bold text-white leading-tight">
                      {tpl.title}
                    </span>
                    <span className="line-clamp-1 text-[9.5px] text-white/40 mt-0.5">
                      {tpl.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Campo Textarea Principal da Ideia */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-white/70">
                  Descreva o que você deseja criar:
                </label>
                <button
                  type="button"
                  onClick={toggleVoice}
                  className={`flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-bold transition cursor-pointer ${
                    listening
                      ? 'border-rose-500 bg-rose-500/20 text-rose-400 animate-pulse'
                      : 'border-white/10 bg-white/5 text-white/60 hover:text-white'
                  }`}
                  title="Falar por voz"
                >
                  <Mic size={11} />
                  <span>{listening ? 'Ouvindo...' : 'Falar por Voz'}</span>
                </button>
              </div>

              <textarea
                value={rawIdea}
                onChange={(e) => setRawIdea(e.target.value)}
                rows={4}
                placeholder="Exemplo: Quero um vídeo demonstrativo de um macaquinho fitness marrom em estúdio, mostrando a elasticidade do tecido, giro suave de corpo e zero transparência no agachamento..."
                className="w-full resize-none rounded-2xl border border-white/10 bg-black/60 p-4 text-[13px] leading-relaxed text-white placeholder-white/30 transition focus:border-[var(--mvz-gold)] focus:outline-none"
              />
              <div className="flex items-center justify-between text-[10px] text-white/40">
                <span>{rawIdea.length} caracteres digitados</span>
                {rawIdea && (
                  <button
                    onClick={() => setRawIdea('')}
                    className="text-white/40 hover:text-rose-400 transition cursor-pointer"
                  >
                    Limpar texto
                  </button>
                )}
              </div>
            </div>

            {/* Seleção do Motor Alvo */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-white/70">
                Motor Alvo de Inteligência Artificial:
              </label>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                {AI_ENGINES.map((eng) => (
                  <button
                    key={eng.id}
                    onClick={() => setTargetEngine(eng.id)}
                    className={`flex flex-col text-left rounded-xl border p-2.5 transition cursor-pointer ${
                      targetEngine === eng.id
                        ? 'border-[var(--mvz-gold)] bg-[var(--mvz-gold)]/15 text-white shadow-sm'
                        : 'border-white/5 bg-white/[0.02] text-white/60 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <span className="truncate text-[11px] font-bold leading-tight">
                      {eng.label}
                    </span>
                    <span className="truncate text-[9.5px] text-white/40 mt-0.5">
                      {eng.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Proporção / Aspect Ratio */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-white/70">
                Proporção do Enquadramento (Aspect Ratio):
              </label>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                {ASPECT_RATIOS.map((asp) => (
                  <button
                    key={asp.id}
                    onClick={() => setAspectRatio(asp.id)}
                    className={`flex flex-col text-center rounded-xl border p-2 transition cursor-pointer ${
                      aspectRatio === asp.id
                        ? 'border-[var(--mvz-gold)] bg-[var(--mvz-gold)]/15 text-white font-bold'
                        : 'border-white/5 bg-white/[0.02] text-white/60 hover:text-white'
                    }`}
                  >
                    <span className="text-[11px] font-bold">{asp.id}</span>
                    <span className="text-[8.5px] text-white/40 truncate">{asp.desc.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Parâmetros de Câmera & Iluminação */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-white/60">
                  <Camera size={11} className="text-[var(--mvz-gold)]" />
                  <span>Estilo de Câmera:</span>
                </label>
                <select
                  value={cameraStyle}
                  onChange={(e) => setCameraStyle(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/60 p-2.5 text-[11px] text-white focus:border-[var(--mvz-gold)] focus:outline-none cursor-pointer"
                >
                  {CAMERA_STYLES.map((c) => (
                    <option key={c} value={c} className="bg-neutral-900 text-white">
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-white/60">
                  <Sun size={11} className="text-[var(--mvz-gold)]" />
                  <span>Iluminação:</span>
                </label>
                <select
                  value={lightingStyle}
                  onChange={(e) => setLightingStyle(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/60 p-2.5 text-[11px] text-white focus:border-[var(--mvz-gold)] focus:outline-none cursor-pointer"
                >
                  {LIGHTING_STYLES.map((l) => (
                    <option key={l} value={l} className="bg-neutral-900 text-white">
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Toggles Técnicos */}
            <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px]">
              <label className="flex items-center gap-2 text-white/70 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeNegative}
                  onChange={(e) => setIncludeNegative(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-white/20 bg-black text-[var(--mvz-gold)] accent-[var(--mvz-gold)]"
                />
                <span>Incluir Negative Prompt Pro</span>
              </label>

              <label className="flex items-center gap-2 text-white/70 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeCameraTags}
                  onChange={(e) => setIncludeCameraTags(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-white/20 bg-black text-[var(--mvz-gold)] accent-[var(--mvz-gold)]"
                />
                <span>Tags de Movimento de Câmera</span>
              </label>
            </div>

            {/* Botão de Geração */}
            <button
              onClick={generatePrompts}
              disabled={generating || !rawIdea.trim()}
              className="w-full flex h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--mvz-gold)] bg-gradient-to-r from-[var(--mvz-gold)] via-[var(--mvz-gold-light)] to-[var(--mvz-gold)] px-6 text-[13px] font-black uppercase text-black shadow-[0_0_25px_rgba(212,175,55,0.3)] transition hover:opacity-95 disabled:opacity-40 cursor-pointer"
            >
              {generating ? (
                <>
                  <Wand2 size={16} className="animate-spin text-black" />
                  <span>
                    {genStep === 1 && 'Decompondo intenção semântica...'}
                    {genStep === 2 && 'Calibrando pesos e vocabulário técnico...'}
                    {genStep === 3 && 'Formatando prompts profissionais...'}
                  </span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Gerar Prompts Profissionais</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── COLUNA DIREITA: TERMINAL DE RESULTADOS & PROMPTS (7 cols) ── */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          {/* Barra de Filtros & Ações dos Resultados */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-white/[0.08] bg-[#0c0c0d] p-3 shadow-lg">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setActiveTab('all')}
                className={`rounded-xl px-3 py-1.5 text-[11px] font-bold transition cursor-pointer ${
                  activeTab === 'all'
                    ? 'border border-[var(--mvz-gold)]/40 bg-[var(--mvz-gold)]/15 text-white'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Todos ({results.length})
              </button>
              <button
                onClick={() => setActiveTab('video')}
                className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-[11px] font-bold transition cursor-pointer ${
                  activeTab === 'video'
                    ? 'border border-[var(--mvz-gold)]/40 bg-[var(--mvz-gold)]/15 text-white'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Video size={12} />
                <span>Vídeos</span>
              </button>
              <button
                onClick={() => setActiveTab('image')}
                className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-[11px] font-bold transition cursor-pointer ${
                  activeTab === 'image'
                    ? 'border border-[var(--mvz-gold)]/40 bg-[var(--mvz-gold)]/15 text-white'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <ImageIcon size={12} />
                <span>Imagens</span>
              </button>
              <button
                onClick={() => setActiveTab('script')}
                className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-[11px] font-bold transition cursor-pointer ${
                  activeTab === 'script'
                    ? 'border border-[var(--mvz-gold)]/40 bg-[var(--mvz-gold)]/15 text-white'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <FileText size={12} />
                <span>Roteiros</span>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-[11px] font-bold transition cursor-pointer ${
                  activeTab === 'history'
                    ? 'border border-[var(--mvz-gold)]/40 bg-[var(--mvz-gold)]/15 text-white'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <History size={12} />
                <span>Histórico ({history.length})</span>
              </button>
            </div>

            {results.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={exportAllAsTxt}
                  className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[10.5px] font-bold text-white/80 hover:bg-white/10 transition cursor-pointer"
                  title="Baixar todos os prompts gerados em arquivo .txt"
                >
                  <Download size={11} />
                  <span>Exportar .TXT</span>
                </button>
                <button
                  onClick={clearAll}
                  className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10.5px] text-white/50 hover:text-rose-400 transition cursor-pointer"
                  title="Limpar resultados da tela"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            )}
          </div>

          {/* Listagem de Cards de Prompts Gerados */}
          {displayedList.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-[24px] border border-dashed border-white/10 bg-[#0c0c0d]/60 p-12 text-center min-h-[460px]">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--mvz-gold)]/30 bg-black/60 text-[var(--mvz-gold)] shadow-[0_0_20px_rgba(212,175,55,0.15)] mb-4">
                <Terminal size={24} />
              </div>
              <h3 className="text-[17px] font-black text-white">
                Pronto para arquitetar seus prompts, {displayName}?
              </h3>
              <p className="mt-1.5 max-w-md text-[12.5px] leading-relaxed text-white/50">
                Descreva sua ideia no painel ao lado ou selecione uma das ideias modelo para gerar prompts calibrados para os motores mais avançados do mercado.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayedList.map((item) => (
                <div
                  key={item.id}
                  className="group rounded-[22px] border border-white/[0.08] bg-[#0c0c0d] p-5 shadow-xl transition-all duration-200 hover:border-[var(--mvz-gold)]/40 hover:shadow-[0_10px_35px_rgba(0,0,0,0.8)]"
                >
                  {/* Cabeçalho do Card */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="rounded-lg border border-[var(--mvz-gold)]/30 bg-[var(--mvz-gold)]/10 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-[var(--mvz-gold-light)]">
                        {item.engineLabel}
                      </span>
                      <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[9.5px] font-bold text-white/50 font-mono">
                        {item.aspectRatio}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleCopy(item.id, item.promptEn)}
                        className="flex items-center gap-1 rounded-lg border border-[var(--mvz-gold)]/30 bg-[var(--mvz-gold)]/15 px-3 py-1.5 text-[11px] font-extrabold text-[var(--mvz-gold-light)] hover:bg-[var(--mvz-gold)] hover:text-black transition cursor-pointer"
                        title="Copiar prompt em inglês"
                      >
                        {copiedId === item.id ? (
                          <>
                            <Check size={12} className="text-[#22c55e]" />
                            <span>Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            <span>Copiar Prompt</span>
                          </>
                        )}
                      </button>

                      {onUseInAgent && (
                        <button
                          onClick={() => onUseInAgent(item.promptEn)}
                          className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] font-bold text-white/70 hover:bg-white/10 hover:text-white transition cursor-pointer"
                          title="Enviar este prompt direto para o Agente IA"
                        >
                          <Zap size={11} className="text-[var(--mvz-gold)]" />
                          <span className="hidden sm:inline">Testar no Agente</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Título do Prompt */}
                  <h4 className="text-[13.5px] font-bold text-white mb-2 leading-snug">
                    {item.title}
                  </h4>

                  {/* Bloco de Código / Prompt em Inglês Técnico */}
                  <div className="relative rounded-xl border border-white/5 bg-black/80 p-3.5 font-mono text-[11.5px] leading-relaxed text-neutral-200 select-all">
                    {item.promptEn}
                  </div>

                  {/* Negative Prompt (se houver) */}
                  {item.negativePrompt && (
                    <div className="mt-3 rounded-xl border border-rose-500/20 bg-rose-500/[0.04] p-3 text-[11px]">
                      <div className="flex items-center justify-between mb-1">
                        <span className="flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-wider text-rose-400">
                          <ShieldCheck size={11} /> Negative Prompt (Filtro de Erros & Distorções)
                        </span>
                        <button
                          onClick={() => handleCopy(`${item.id}-neg`, item.negativePrompt!)}
                          className="text-[10px] text-rose-400/80 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                        >
                          {copiedId === `${item.id}-neg` ? <Check size={10} /> : <Copy size={10} />}
                          <span>{copiedId === `${item.id}-neg` ? 'Copiado' : 'Copiar'}</span>
                        </button>
                      </div>
                      <p className="font-mono text-[10.5px] text-rose-200/70 select-all leading-normal">
                        {item.negativePrompt}
                      </p>
                    </div>
                  )}

                  {/* Parâmetros de Câmera */}
                  {item.cameraMotion && (
                    <div className="mt-2.5 flex items-start gap-2 text-[11px] text-white/60 bg-white/[0.02] border border-white/5 rounded-lg p-2.5">
                      <Camera size={13} className="text-[var(--mvz-gold)] shrink-0 mt-0.5" />
                      <span>{item.cameraMotion}</span>
                    </div>
                  )}

                  {/* Explicação em Português */}
                  <div className="mt-3 pt-2.5 border-t border-white/[0.04] text-[11.5px] text-white/50 leading-relaxed">
                    <span className="font-bold text-white/70 mr-1.5">Estrutura:</span>
                    {item.promptPt}
                  </div>

                  {/* Tags */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md border border-white/5 bg-white/[0.02] px-2 py-0.5 text-[9px] font-semibold text-white/40"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

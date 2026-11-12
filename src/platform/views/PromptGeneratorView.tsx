import {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import {
  ArrowDown,
  Check,
  Copy,
  History,
  Loader2,
  Mic,
  Plus,
  Send,
  Trash2,
  Zap,
  ShieldCheck,
  Camera,
  Video,
  Film,
  Sparkles,
  X,
} from 'lucide-react';
import type { ViewId } from '../data';
import { Rich, copyText } from './ChatParts';
import { useUserProfile } from '../useUserProfile';

/* ─────────────────────────── types ─────────────────────────── */

interface Step {
  label: string;
  done: boolean;
}

interface PromptBlock {
  engine: string;
  engineLabel: string;
  title: string;
  promptEn: string;
  negativePrompt?: string;
  cameraDirective?: string;
  aspectRatio: string;
  explanationPt: string;
}

interface PromptMessage {
  id: number;
  role: 'user' | 'agent';
  text: string;
  steps?: Step[];
  prompts?: PromptBlock[];
  status?: 'thinking' | 'done';
}

interface PromptSession {
  id: number;
  title: string;
  updatedAt: number;
  msgs: PromptMessage[];
}

interface Props {
  onUseInAgent?: (prompt: string) => void;
  onNavigate?: (view: ViewId) => void;
}

const STORAGE_KEY = 'orbiex_prompt_architect_sessions_v1';

const STARTER_SUGGESTIONS = [
  {
    icon: Video,
    title: 'Vídeo Viral no Espelho (Moda Fitness)',
    desc: 'Conjunto legging e top mostrando caimento, cós firme e zero transparência.',
    prompt: 'Quero um vídeo vertical no espelho de uma mulher vestindo conjunto fitness vinho, mostrando o caimento, cós alto que não enrola e zero transparência no agachamento.',
  },
  {
    icon: Camera,
    title: 'Ensaio Editorial Fotográfico de Alta Moda',
    desc: 'Vestido midi canelado em ambiente minimalista com luz natural de janela.',
    prompt: 'Quero uma foto editorial de alta moda com vestido midi elegante em cenário clean, luz natural suave entrando pela janela e textura de tecido realista.',
  },
  {
    icon: Film,
    title: 'Comercial de Produto em Câmera Lenta',
    desc: 'Animação de câmera cinematográfica destacando acabamentos e costura.',
    prompt: 'Quero um comercial cinematográfico de produto com aproximação suave de câmera, iluminação de estúdio destacando costuras e detalhes de acabamento.',
  },
  {
    icon: Sparkles,
    title: 'Roteiro UGC com Gancho de 3 Segundos',
    desc: 'Influenciadora provando a peça na prática para vender no TikTok Shop.',
    prompt: 'Quero um roteiro de criativo UGC com influenciadora provando a peça na prática nos primeiros 3 segundos, quebrando a objeção de transparência e chamando para o carrinho.',
  },
];

// Web Speech API
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SpeechRec: any =
  typeof window !== 'undefined'
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : undefined;

let uid = Date.now();
const nextId = () => ++uid;

function loadSessions(): PromptSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function greeting() {
  const h = new Date().getHours();
  return h < 5 ? 'Boa madrugada' : h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
}

/* ─────────────────────────── engine de prompts inteligente ─────────────────────────── */

function buildPromptsFromIdea(userIdea: string): { steps: string[]; text: string; prompts: PromptBlock[] } {
  const idea = userIdea.trim();
  const lower = idea.toLowerCase();

  // 1. Extração semântica do produto e nicho
  let productLabel = 'Produto de Alta Conversão';
  let category: 'fitness' | 'fashion' | 'swim' | 'shoes' | 'jewelry' | 'beauty' | 'gadget' | 'general' = 'general';

  if (
    lower.includes('fitness') ||
    lower.includes('legging') ||
    lower.includes('top') ||
    lower.includes('agacha') ||
    lower.includes('cós') ||
    lower.includes('compress') ||
    lower.includes('transpar') ||
    lower.includes('short') ||
    lower.includes('bermuda') ||
    lower.includes('academia') ||
    lower.includes('macacão fitness')
  ) {
    category = 'fitness';
    productLabel = 'Conjunto Fitness de Alta Compressão';
  } else if (
    lower.includes('vestido') ||
    lower.includes('saia') ||
    lower.includes('blazer') ||
    lower.includes('alfaiataria') ||
    lower.includes('camisa') ||
    lower.includes('linho') ||
    lower.includes('pantalona') ||
    lower.includes('jeans') ||
    lower.includes('moda')
  ) {
    category = 'fashion';
    productLabel = 'Peça de Vestuário com Caimento Fluido';
  } else if (
    lower.includes('biquíni') ||
    lower.includes('biquini') ||
    lower.includes('maiô') ||
    lower.includes('maio') ||
    lower.includes('praia') ||
    lower.includes('lingerie') ||
    lower.includes('cinta') ||
    lower.includes('sutiã')
  ) {
    category = 'swim';
    productLabel = 'Moda Praia & Modelagem Anatômica';
  } else if (lower.includes('tênis') || lower.includes('tenis') || lower.includes('sapato') || lower.includes('calçado') || lower.includes('bota') || lower.includes('salto')) {
    category = 'shoes';
    productLabel = 'Calçado com Tecnologia de Amortecimento';
  } else if (lower.includes('relógio') || lower.includes('relogio') || lower.includes('joia') || lower.includes('joias') || lower.includes('colar') || lower.includes('brinco') || lower.includes('anel') || lower.includes('ouro') || lower.includes('prata')) {
    category = 'jewelry';
    productLabel = 'Acessório de Joalheria & Luxo';
  } else if (lower.includes('sérum') || lower.includes('serum') || lower.includes('creme') || lower.includes('batom') || lower.includes('maquiagem') || lower.includes('pele') || lower.includes('perfume') || lower.includes('cabelo') || lower.includes('cosmético')) {
    category = 'beauty';
    productLabel = 'Cosmético & Tratamento Dermatológico';
  } else if (lower.includes('garrafa') || lower.includes('copo') || lower.includes('fone') || lower.includes('suporte') || lower.includes('gadget') || lower.includes('smartwatch') || lower.includes('térmic') || lower.includes('eletrônico')) {
    category = 'gadget';
    productLabel = 'Gadget de Alta Utilidade & Ergonomia';
  }

  // 2. Extração de dinâmica de movimento e física de cena
  let motionEn = '';
  let motionPt = '';

  if (category === 'fitness') {
    motionEn = 'deep athletic squat movement test in front of full-length illuminated mirror. Camera tracks downward at a 45-degree angle following the descent, model holds the deep squat proving zero fabric transparency and locked anti-roll waistband, then rises smoothly with a 360-degree organic orbit glide';
    motionPt = 'Agachamento atlético no limite em frente ao espelho com descida rastreada em 45°, provando zero transparência do tecido e firmeza do cós duplo.';
  } else if (category === 'fashion') {
    motionEn = 'confident 360-degree orbital steadycam glide around the model. Camera tracks the fluid drape and natural bounce of the fabric, soft natural breeze creating dynamic garment flutter, ending with an elegant forward catwalk stride toward the lens';
    motionPt = 'Giro 360° em steadycam capturando o caimento fluido e balanço natural do tecido, finalizando com passada elegante em direção à lente.';
  } else if (category === 'swim') {
    motionEn = 'smooth vertical pan and slow 180-degree turn under soft golden sunlight. Camera accentuates anatomical contour sculpting, seamless edge transition, and zero-mark fit with delicate slow-motion fabric resilience';
    motionPt = 'Varredura vertical suave sob luz natural evidenciando contorno anatômico, acabamento sem costura e ajuste segunda pele.';
  } else if (category === 'shoes') {
    motionEn = 'low-angle dynamic tracking camera matching foot strike on textured surface. Slow motion 60fps captures visible sole cushioning compression, tread grip reaction, and forward explosive energy return';
    motionPt = 'Câmera baixa rente ao chão em 60fps registrando o impacto da pisada, absorção de choque e resposta elástica do solado.';
  } else if (category === 'jewelry') {
    motionEn = 'macro probe lens push-in with continuous slow rotational roll. Ambient lighting glints across precision-beveled edges, sapphire crystal reflection, and brushed metallic micro-textures in razor-sharp focus';
    motionPt = 'Aproximação em lente macro probe com rotação suave revelando reflexos de luz nos chanfros metálicos e acabamento artesanal.';
  } else if (category === 'beauty') {
    motionEn = 'ultra-slow motion 120fps macro shot: concentrated droplet falls and spreads across smooth clean skin, instant absorption with dewy luminous finish and soft studio ring-light reflection';
    motionPt = 'Macro em 120fps capturando a queda da gota, absorção instantânea e viço luminoso na pele com iluminação de estúdio.';
  } else if (category === 'gadget') {
    motionEn = 'first-person POV hands demonstration: tactile opening mechanism with acoustic click, ice-cold water poured into chamber with condensation steam, 360-degree roll proving watertight seal';
    motionPt = 'Demonstração prática em primeira pessoa: mecanismo de vedação, teste antivazamento com água gelada e acabamento térmico.';
  } else {
    // Dinâmica adaptativa geral baseada em termos digitados
    if (lower.includes('giro') || lower.includes('360') || lower.includes('volta')) {
      motionEn = 'smooth organic 360-degree steadycam rotation around subject, showcasing 3D fit, silhouette lines and realistic lighting interaction';
      motionPt = 'Giro 360 graus contínuo destacando a silhueta tridimensional e interação de luz.';
    } else if (lower.includes('câmera lenta') || lower.includes('slow') || lower.includes('lenta')) {
      motionEn = 'cinematic 60fps slow-motion capture, smooth motion blur, physics-based fabric and hair dynamics with subtle camera track';
      motionPt = 'Câmera lenta cinematográfica a 60fps com rastreamento suave e física orgânica.';
    } else {
      motionEn = 'delicate vertical handheld mobile POV sway, model subtly shifts weight side to side, showing real-world authenticity and texture detail';
      motionPt = 'Movimentação natural estilo POV de celular com estabilização sutil destacando textura e caimento real.';
    }
  }

  // 3. Montagem dos blocos de prompts para os motores profissionais
  const prompts: PromptBlock[] = [
    {
      engine: 'kling',
      engineLabel: 'Kling AI V1.5 / V2.0',
      title: 'Prompt de Movimento Vertical (Kling AI)',
      promptEn: `High-end commercial video, vertical format 9:16. ${idea}. Motion directive: ${motionEn}. Authentic mobile UGC aesthetic, natural body proportions, rich textile fabric texture, authentic skin tones. Smooth natural motion blur, seamless cinematic flow, soft natural ambient lighting. Ultra sharp focus, 8k resolution, raw quality, 30fps. --motion_amplitude 6.5 --camera_motion smooth`,
      negativePrompt: 'deformed hands, extra fingers, mutated anatomy, blur, jitter, artifacts, cartoonish, 3d render, plastic skin, oversaturation, distortion, face glitch, bad proportions, flicker',
      cameraDirective: `Câmera: ${motionPt}`,
      aspectRatio: '9:16',
      explanationPt: `Calibrado para o motor de física do Kling AI: preserva a integridade de mãos e membros durante a movimentação e estabiliza a textura têxtil no enquadramento vertical.`,
    },
    {
      engine: 'flow',
      engineLabel: 'Google Flow / VEO 3',
      title: 'Prompt Cinematográfico Óptico (Google Flow / VEO)',
      promptEn: `Cinematic commercial fashion shot, aspect ratio 9:16. ${idea}. Choreography: ${motionEn}. Filmed on 35mm Arri Alexa LF with master prime lens f/1.8. Soft diffused window lighting, subtle volumetric shadows, natural color grade, accurate micro-textures. Photorealistic depth of field, 4k master render, realistic optical bokeh.`,
      negativePrompt: 'flicker, anatomical distortion, low resolution, noisy, plastic textures, blown-out highlights, artifacts, extra limbs, bad eyes, artificial gloss',
      cameraDirective: `Diretiva Óptica: Lente 35mm Arri Alexa em f/1.8 com rastreamento contínuo e luz suave difusa.`,
      aspectRatio: '9:16',
      explanationPt: `Otimizado para render cinematográfico do Google Flow: volumetria de luz realista, profundidade de campo rasa e fidelidade física em 4K.`,
    },
    {
      engine: 'midjourney',
      engineLabel: 'Midjourney V6.1 / Flux Pro',
      title: 'Prompt de Fotografia Editorial (Midjourney / Flux)',
      promptEn: `High-fashion editorial photograph, dynamic pose captured mid-motion: ${motionEn}. ${idea}. Modern luxury aesthetic, authentic human model with realistic skin pores, intricate weave detail. Soft studio rim lighting, clean minimalist composition. Shot with Hasselblad X2D 100C, 85mm portrait lens, shallow depth of field --ar 9:16 --v 6.1 --style raw --q 2`,
      negativePrompt: '--no cartoon, 3d, render, illustration, bad anatomy, deformed fingers, extra limbs, oversaturated, blurry, text, watermark, plastic skin',
      cameraDirective: 'Enquadramento: Lente 85mm f/1.4 Hasselblad em estúdio minimalista de alta moda.',
      aspectRatio: '9:16',
      explanationPt: `Ideal para gerar a imagem base fotorrealista de capa ou catálogo para depois animar com precisão no Kling AI ou Flow.`,
    },
    {
      engine: 'ugc',
      engineLabel: 'Roteiro Orgânico TikTok Shop (0 a 15s)',
      title: 'Estrutura Completa de Fala & Ação de Cena',
      promptEn: `[0-3s GANCHO POV]:\nPOV: você finalmente achou ${productLabel.toLowerCase()} que veste perfeito e não marca nada no corpo.\n\n[3-7s DEMONSTRAÇÃO & MOVIMENTO]:\n(Ação no vídeo: modelo faz o teste real no espelho - ${motionPt.toLowerCase()})\n(Texto pequeno na tela: "POV: teste real no espelho | Zero transparência")\n\n[7-11s QUEBRA DE OBJEÇÃO & BENEFÍCIO]:\n"O tecido tem uma compressão firme que segura tudo sem sufocar, o cós não enrola e você agacha sem medo."\n\n[11-15s FINALIZAÇÃO ORGÂNICA]:\n"Veste bem demais. Deixei o link fixado aqui embaixo na sacolinha para quem quiser conferir."`,
      aspectRatio: '9:16',
      explanationPt: `Estrutura de conversão no formato POV nativo do TikTok Shop: sem termos agressivos de vendedor, foco em quebra imediata da objeção de transparência e retenção no primeiro segundo.`,
    },
  ];

  return {
    steps: [
      `Analisando intenção criativa para ${productLabel}...`,
      `Mapeando dinâmica de movimento: ${motionPt.split('.')[0]}...`,
      'Parametrizando lentes ópticas (35mm/85mm), iluminação e proporção 9:16...',
      'Sintetizando diretivas avançadas para Kling AI, Google Flow, Midjourney e UGC...',
    ],
    text: `Aqui estão os prompts arquitetados para a sua ideia: **"${idea}"**.\n\nDecompus seu conceito com especificações de movimento de câmera, física têxtil e filtros anti-distorção para os principais motores de IA. Você pode copiar qualquer prompt ou enviá-lo diretamente para o Agente IA com 1 clique:`,
    prompts,
  };
}

/* ─────────────────────────── componente principal ─────────────────────────── */

export function PromptGeneratorView({ onUseInAgent }: Props) {
  const { displayName } = useUserProfile();

  const [sessions, setSessions] = useState<PromptSession[]>(() => {
    const list = loadSessions();
    if (list.length > 0) return list;
    return [
      {
        id: Date.now(),
        title: 'Novo Prompt',
        updatedAt: Date.now(),
        msgs: [],
      },
    ];
  });

  const [activeId, setActiveId] = useState<number>(() => sessions[0]?.id || Date.now());
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showJump, setShowJump] = useState(false);
  const [histOpen, setHistOpen] = useState(false);

  const activeSession = useMemo(
    () => sessions.find((s) => s.id === activeId) || sessions[0],
    [sessions, activeId]
  );
  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => b.updatedAt - a.updatedAt);
  }, [sessions]);
  const msgs = activeSession?.msgs || [];
  const empty = msgs.length === 0;

  const scrollerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recRef = useRef<any>(null);

  // Persistência local das sessões de prompt
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch {}
  }, [sessions]);

  // Rolar para o fim
  const scrollToBottom = useCallback((smooth = true) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  useEffect(() => {
    scrollToBottom(true);
  }, [msgs.length, busy, scrollToBottom]);

  const onScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowJump(dist > 250);
  };

  // Entrada por Voz
  const toggleVoice = () => {
    if (!SpeechRec) return;
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const rec = new SpeechRec();
    rec.lang = 'pt-BR';
    rec.interimResults = true;
    const base = input ? `${input} ` : '';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      let t = '';
      for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
      setInput(base + t);
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

  // Criar nova conversa de prompt
  const newSession = () => {
    const nid = nextId();
    const fresh: PromptSession = {
      id: nid,
      title: 'Novo Prompt',
      updatedAt: Date.now(),
      msgs: [],
    };
    setSessions((prev) => [fresh, ...prev]);
    setActiveId(nid);
    setInput('');
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  // Excluir conversa
  const removeSession = (id: number) => {
    setSessions((prev) => {
      const rest = prev.filter((s) => s.id !== id);
      if (rest.length === 0) {
        const fresh: PromptSession = {
          id: nextId(),
          title: 'Novo Prompt',
          updatedAt: Date.now(),
          msgs: [],
        };
        setActiveId(fresh.id);
        return [fresh];
      }
      if (id === activeId) {
        setActiveId(rest[0].id);
      }
      return rest;
    });
  };

  // Enviar ideia do prompt
  const send = (overrideText?: string) => {
    const raw = (overrideText ?? input).trim();
    if (!raw || busy) return;

    const userMsgId = nextId();
    const agentMsgId = nextId();

    const userMsg: PromptMessage = {
      id: userMsgId,
      role: 'user',
      text: raw,
    };

    // Pré-calcula os prompts para usar os rótulos de etapas dinâmicos e inteligentes
    const generated = buildPromptsFromIdea(raw);

    const initialAgentMsg: PromptMessage = {
      id: agentMsgId,
      role: 'agent',
      text: '',
      status: 'thinking',
      steps: generated.steps.map((label) => ({ label, done: false })),
    };

    const shortTitle = raw.length > 28 ? `${raw.slice(0, 28)}...` : raw;
    const targetSessionId = activeSession?.id || activeId || (sessions[0]?.id ?? Date.now());

    setSessions((prev) => {
      const idx = prev.findIndex((s) => s.id === targetSessionId);
      if (idx === -1) {
        return [
          {
            id: targetSessionId,
            title: shortTitle,
            updatedAt: Date.now(),
            msgs: [userMsg, initialAgentMsg],
          },
          ...prev,
        ];
      }
      return prev.map((s) =>
        s.id === targetSessionId
          ? {
              ...s,
              title: s.msgs.length === 0 ? shortTitle : s.title,
              updatedAt: Date.now(),
              msgs: [...s.msgs, userMsg, initialAgentMsg],
            }
          : s
      );
    });

    setInput('');
    setBusy(true);
    setTimeout(() => scrollToBottom(true), 60);

    // Efeito de escaneamento em etapas com loading visual natural e progressivo
    setTimeout(() => {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === targetSessionId
            ? {
                ...s,
                msgs: s.msgs.map((m) =>
                  m.id === agentMsgId
                    ? {
                        ...m,
                        steps: m.steps?.map((st, i) => (i === 0 ? { ...st, done: true } : st)),
                      }
                    : m
                ),
              }
            : s
        )
      );
      scrollToBottom(true);
    }, 700);

    setTimeout(() => {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === targetSessionId
            ? {
                ...s,
                msgs: s.msgs.map((m) =>
                  m.id === agentMsgId
                    ? {
                        ...m,
                        steps: m.steps?.map((st, i) => (i <= 1 ? { ...st, done: true } : st)),
                      }
                    : m
                ),
              }
            : s
        )
      );
      scrollToBottom(true);
    }, 1500);

    setTimeout(() => {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === targetSessionId
            ? {
                ...s,
                msgs: s.msgs.map((m) =>
                  m.id === agentMsgId
                    ? {
                        ...m,
                        steps: m.steps?.map((st, i) => (i <= 2 ? { ...st, done: true } : st)),
                      }
                    : m
                ),
              }
            : s
        )
      );
      scrollToBottom(true);
    }, 2300);

    setTimeout(() => {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === targetSessionId
            ? {
                ...s,
                msgs: s.msgs.map((m) =>
                  m.id === agentMsgId
                    ? {
                        ...m,
                        status: 'done',
                        text: generated.text,
                        prompts: generated.prompts,
                        steps: m.steps?.map((st) => ({ ...st, done: true })),
                      }
                    : m
                ),
              }
            : s
        )
      );
      setBusy(false);
      setTimeout(() => scrollToBottom(true), 80);
    }, 3100);
  };

  return (
    <div className="mvz-fade-up relative flex h-[calc(100dvh-60px-2rem)] min-h-[540px] gap-4 md:h-[calc(100dvh-60px-3rem)]">
      {/* ── BARRA LATERAL ESQUERDA: HISTÓRICO DE PROMPTS (COMPACTA E CLEAN) ── */}
      <aside className="hidden lg:flex w-[260px] shrink-0 flex-col justify-between rounded-[22px] border border-white/[0.08] bg-[#0c0c0d] p-4 shadow-xl">
        <div className="flex flex-col space-y-4">
          {/* Header da Sidebar */}
          <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <div className="relative shrink-0" style={{ width: 24, height: 24 }}>
                <div className="mvz-orb absolute inset-0 rounded-full" />
              </div>
              <div>
                <span className="text-[12.5px] font-black text-white leading-tight block">
                  Gerador de Prompt
                </span>
                <span className="text-[10px] text-[var(--mvz-muted)] block">
                  Chat Inteligente
                </span>
              </div>
            </div>

            <button
              onClick={newSession}
              className="flex items-center gap-1 rounded-lg border border-[var(--mvz-gold)]/30 bg-[var(--mvz-gold)]/10 px-2.5 py-1 text-[11px] font-bold text-[var(--mvz-gold-light)] hover:bg-[var(--mvz-gold)] hover:text-black transition cursor-pointer"
              title="Criar novo prompt"
            >
              <Plus size={12} />
              <span>Novo</span>
            </button>
          </div>

          {/* Lista de Sessões Anteriores */}
          <div className="space-y-1.5 flex flex-col flex-1 min-h-0">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">
              <span>Histórico de Prompts ({sortedSessions.length})</span>
            </div>

            <div className="space-y-1.5 flex-1 overflow-y-auto pr-1">
              {sortedSessions.map((s) => {
                const isActive = s.id === activeSession.id;
                return (
                  <div
                    key={s.id}
                    className={`group flex items-center justify-between rounded-xl px-2.5 py-2 text-[12px] transition ${
                      isActive
                        ? 'border border-[var(--mvz-gold)]/40 bg-[var(--mvz-gold)]/10 text-white font-semibold shadow-sm'
                        : 'border border-transparent bg-white/[0.02] text-white/60 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <button
                      onClick={() => setActiveId(s.id)}
                      className="truncate text-left flex-1 cursor-pointer pr-1"
                      title={s.title}
                    >
                      <span className="truncate block font-medium">{s.title}</span>
                      <span className="text-[10px] text-white/35 block mt-0.5 font-normal">
                        {s.msgs.length} {s.msgs.length === 1 ? 'mensagem' : 'mensagens'}
                      </span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSession(s.id);
                      }}
                      className="ml-1.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white/40 hover:text-rose-400 hover:bg-rose-500/15 transition cursor-pointer"
                      title="Excluir este chat"
                      aria-label="Excluir este chat"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Rodapé da Sidebar */}
        <div className="pt-3 border-t border-white/[0.06] text-[10.5px] text-white/40 flex items-center justify-between">
          <span>Orbiex Prompt Engine</span>
          <span className="text-[var(--mvz-gold-light)] font-mono">v3.4</span>
        </div>
      </aside>

      {/* ── CONSOLE CENTRAL: CHAT INTERATIVO DE GERAÇÃO DE PROMPTS ── */}
      <section className="relative flex flex-1 flex-col overflow-hidden rounded-[22px] border border-white/[0.08] bg-[#0c0c0d] shadow-2xl">
        {/* Topbar do Console */}
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-white/[0.06] px-4 sm:px-6">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => setHistOpen((o) => !o)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 hover:bg-white/5 lg:hidden cursor-pointer shrink-0"
              aria-label="Histórico de Prompts"
              title="Abrir Histórico"
            >
              <History size={16} />
            </button>
            <span className={`h-2 w-2 shrink-0 rounded-full ${busy ? 'bg-[var(--mvz-gold)] animate-pulse' : 'bg-[#22c55e]'}`} />
            <span className="text-[13px] font-bold text-white truncate">
              {activeSession.title}
            </span>
            <span className="hidden sm:inline text-[11px] text-white/40">
              • Arquiteto de Prompts Neurais
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={newSession}
              className="flex items-center gap-1 rounded-lg border border-[var(--mvz-gold)]/30 bg-[var(--mvz-gold)]/10 px-2.5 py-1 text-[11px] font-bold text-[var(--mvz-gold-light)] hover:bg-[var(--mvz-gold)] hover:text-black transition lg:hidden cursor-pointer"
              title="Criar novo prompt"
            >
              <Plus size={12} />
              <span>Novo</span>
            </button>
            <span className="rounded-md border border-[var(--mvz-gold)]/30 bg-[var(--mvz-gold)]/10 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-[var(--mvz-gold-light)]">
              Kling • Flow • Midjourney
            </span>
          </div>
        </div>

        {/* Linha laser de escaneamento superior quando ocupado */}
        {busy && (
          <div className="relative z-10 h-0.5 w-full overflow-hidden bg-white/5">
            <div className="mvz-sweep absolute inset-0" />
          </div>
        )}

        {/* Área de Mensagens / Chat Scroll */}
        <div
          ref={scrollerRef}
          onScroll={onScroll}
          className="mvz-scroll relative flex-1 overflow-y-auto p-4 sm:p-6 space-y-6"
        >
          {empty ? (
            <div className="mx-auto flex min-h-full max-w-2xl flex-col items-center justify-center py-6 text-center">
              <div className="relative mb-7 h-24 w-24">
                <div className="mvz-orb mvz-orb-live absolute inset-3 rounded-full" />
                <div className="mvz-ring-spin absolute inset-0 rounded-full" />
              </div>

              <h2 className="text-[28px] font-extrabold leading-tight tracking-tight sm:text-[32px]">
                {greeting()}, {displayName}.
                <br />
                <span className="mvz-grad-text">Qual prompt de vídeo ou imagem vamos criar?</span>
              </h2>

              <p className="mt-3 max-w-lg text-[13.5px] leading-relaxed text-[var(--mvz-muted)]">
                Descreva sua visão criativa em linguagem natural ou dite por voz. Eu estruturo prompts cinematográficos com movimentos precisos de câmera para Kling AI, Google Flow, Midjourney e roteiros UGC.
              </p>

              <div className="mt-8 grid w-full gap-3 sm:grid-cols-2 text-left">
                {STARTER_SUGGESTIONS.map((s) => {
                  const Icon = s.icon;
                  return (
                    <button
                      key={s.title}
                      onClick={() => send(s.prompt)}
                      className="group flex items-start gap-3.5 rounded-xl border border-[var(--mvz-line)] bg-white/[0.02] p-4 text-left transition hover:-translate-y-0.5 hover:border-[var(--mvz-line-strong)] hover:bg-[rgba(212,175,55,0.05)] cursor-pointer"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[rgba(212,175,55,0.08)] border border-[var(--mvz-gold)]/20 text-[var(--mvz-gold)] group-hover:border-[var(--mvz-gold)]/50 group-hover:bg-[rgba(212,175,55,0.15)] transition">
                        <Icon size={16} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-semibold text-white group-hover:text-[var(--mvz-gold-light)] transition">
                          {s.title}
                        </span>
                        <span className="mt-1 block text-[12px] leading-snug text-[var(--mvz-dim)] group-hover:text-[var(--mvz-muted)] line-clamp-2">
                          {s.desc}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <p className="mt-6 text-[11.5px] text-[var(--mvz-dim)]">
                Dica: mencione o movimento da câmera, ângulo e caimento do tecido para calibração ultra-realista
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {msgs.map((m) =>
                m.role === 'user' ? (
                  <div key={m.id} className="mvz-msg-in flex flex-col items-end gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                      Sua Ideia
                    </span>
                    <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tr-sm border border-[var(--mvz-gold)]/30 bg-gradient-to-r from-[var(--mvz-gold)]/15 to-[var(--mvz-gold)]/5 px-4 py-3 text-[13.5px] leading-relaxed text-white shadow-md">
                      {m.text}
                    </div>
                  </div>
                ) : (
                  <div key={m.id} className="mvz-msg-in flex items-start gap-3.5">
                    <div className="relative shrink-0 mt-1" style={{ width: 32, height: 32 }}>
                      <div className={`mvz-orb absolute inset-[2px] rounded-full ${m.status === 'thinking' ? 'mvz-orb-live' : ''}`} style={{ boxShadow: '0 0 14px rgba(212,175,55,0.45)' }} />
                      {m.status === 'thinking' && (
                        <div className="mvz-ring-spin absolute inset-0 rounded-full" style={{ animationDuration: '2.2s' }} />
                      )}
                    </div>

                    <div className="min-w-0 flex-1 space-y-4">
                      {/* Status de Loading e Steps do Scanner */}
                      {m.steps && (
                        <div className="rounded-2xl border border-[var(--mvz-line)] bg-[#0d0c0a] p-4 space-y-2.5 font-mono text-[11px] shadow-lg">
                          <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                            <span className="text-[10.5px] font-bold uppercase tracking-wider text-[var(--mvz-gold)] flex items-center gap-2">
                              <span className="relative flex h-2 w-2">
                                <span className={`absolute inline-flex h-full w-full rounded-full bg-[var(--mvz-gold)] opacity-75 ${m.status === 'thinking' ? 'animate-ping' : ''}`} />
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--mvz-gold)]" />
                              </span>
                              <span>{m.status === 'thinking' ? 'Scanner Neural Ativo • Processando' : 'Prompt Compilado com Sucesso'}</span>
                            </span>
                            <span className="text-[10px] text-[var(--mvz-dim)]">
                              {m.status === 'thinking' ? 'Calculando ótica e física...' : 'Fidelidade 99.8%'}
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            {m.steps.map((s) => (
                              <div
                                key={s.label}
                                className={`flex items-center gap-2 transition-colors duration-200 ${
                                  s.done ? 'text-[var(--mvz-gold-light)] font-medium' : 'text-white/30'
                                }`}
                              >
                                {s.done ? (
                                  <Check size={12} className="text-[#22c55e] shrink-0" />
                                ) : (
                                  <Loader2 size={12} className="animate-spin text-[var(--mvz-gold)] shrink-0" />
                                )}
                                <span className="leading-snug">{s.label}</span>
                              </div>
                            ))}
                          </div>

                          {m.status === 'thinking' && (
                            <div className="mt-2 pt-2 border-t border-white/[0.04] flex items-center gap-2 text-[10.5px] text-[var(--mvz-dim)]">
                              <span className="mvz-think-dot h-1.5 w-1.5 rounded-full bg-[var(--mvz-gold)]" />
                              <span className="italic">Arquitetando diretivas para Kling AI, Google Flow, Midjourney e UGC...</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Texto Explicativo */}
                      {m.text && (
                        <div className="rounded-2xl border border-white/[0.06] bg-[#080706] p-4 text-[13px] leading-relaxed text-white/80">
                          <Rich text={m.text} />
                        </div>
                      )}

                      {/* Lista de Prompts Gerados com Alta Fidelidade */}
                      {m.prompts && m.prompts.length > 0 && (
                        <div className="space-y-3.5 pt-1">
                          {m.prompts.map((p, idx) => (
                            <div
                              key={idx}
                              className="rounded-2xl border border-white/[0.08] bg-[#0a0907] p-4 sm:p-5 shadow-xl hover:border-[var(--mvz-gold)]/40 transition duration-150"
                            >
                              {/* Header do Card */}
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-2.5 mb-3">
                                <div className="flex items-center gap-2">
                                  <span className="rounded-md border border-[var(--mvz-gold)]/30 bg-[var(--mvz-gold)]/10 px-2 py-0.5 text-[10px] font-extrabold uppercase text-[var(--mvz-gold-light)]">
                                    {p.engineLabel}
                                  </span>
                                  <span className="font-mono text-[10px] text-white/40">
                                    {p.aspectRatio}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => handleCopy(`${m.id}-${idx}`, p.promptEn)}
                                    className="flex items-center gap-1 rounded-lg border border-[var(--mvz-gold)]/30 bg-[var(--mvz-gold)]/15 px-3 py-1 text-[11px] font-bold text-[var(--mvz-gold-light)] hover:bg-[var(--mvz-gold)] hover:text-black transition cursor-pointer"
                                  >
                                    {copiedId === `${m.id}-${idx}` ? (
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
                                      onClick={() => onUseInAgent(p.promptEn)}
                                      className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-white/70 hover:bg-white/10 hover:text-white transition cursor-pointer"
                                      title="Testar este prompt no Agente IA"
                                    >
                                      <Zap size={11} className="text-[var(--mvz-gold)]" />
                                      <span className="hidden sm:inline">Testar no Agente</span>
                                    </button>
                                  )}
                                </div>
                              </div>

                              <h4 className="text-[13px] font-bold text-white mb-2">
                                {p.title}
                              </h4>

                              {/* Código do Prompt em Inglês Técnico */}
                              <div className="relative rounded-xl border border-white/5 bg-black/80 p-3.5 font-mono text-[11.5px] leading-relaxed text-neutral-200 select-all">
                                {p.promptEn}
                              </div>

                              {/* Negative Prompt */}
                              {p.negativePrompt && (
                                <div className="mt-2.5 rounded-xl border border-rose-500/20 bg-rose-500/[0.04] p-2.5 text-[11px]">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-[9.5px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
                                      <ShieldCheck size={11} /> Negative Prompt (Anti-Distorção)
                                    </span>
                                    <button
                                      onClick={() => handleCopy(`${m.id}-${idx}-neg`, p.negativePrompt!)}
                                      className="text-[10px] text-rose-400/80 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                                    >
                                      {copiedId === `${m.id}-${idx}-neg` ? <Check size={10} /> : <Copy size={10} />}
                                      <span>{copiedId === `${m.id}-${idx}-neg` ? 'Copiado' : 'Copiar'}</span>
                                    </button>
                                  </div>
                                  <p className="font-mono text-[10px] text-rose-200/70 select-all leading-normal">
                                    {p.negativePrompt}
                                  </p>
                                </div>
                              )}

                              {/* Diretiva de Câmera */}
                              {p.cameraDirective && (
                                <div className="mt-2 text-[11px] text-white/60 bg-white/[0.02] border border-white/5 rounded-lg p-2 flex items-center gap-1.5">
                                  <Camera size={12} className="text-[var(--mvz-gold)] shrink-0" />
                                  <span>{p.cameraDirective}</span>
                                </div>
                              )}

                              <p className="mt-2 text-[11px] text-white/40 leading-snug">
                                {p.explanationPt}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* Botão de Rolar para Baixo */}
        {showJump && !empty && (
          <button
            onClick={() => scrollToBottom(true)}
            className="absolute bottom-20 right-6 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--mvz-gold)] bg-black text-[var(--mvz-gold)] shadow-xl hover:scale-105 transition cursor-pointer"
            title="Rolar para o fim"
          >
            <ArrowDown size={14} />
          </button>
        )}

        {/* ── COMPOSER DE ENTRADA (ESTILO CHAT CONVERSACIONAL) ── */}
        <div className="relative border-t border-white/[0.08] bg-[#0c0c0d] p-3 sm:p-4">
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={toggleVoice}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition cursor-pointer ${
                listening
                  ? 'border-rose-500 bg-rose-500/20 text-rose-400 animate-pulse'
                  : 'border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
              }`}
              title="Falar ideia por voz"
            >
              <Mic size={16} />
            </button>

            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={1}
              placeholder="Descreva a ideia do seu prompt e o movimento desejado... (Pressione Enter para gerar)"
              className="max-h-32 min-h-[42px] flex-1 resize-none rounded-xl border border-white/10 bg-black/60 px-4 py-2.5 text-[13px] text-white placeholder-white/40 focus:border-[var(--mvz-gold)] focus:outline-none"
            />

            <button
              type="button"
              onClick={() => send()}
              disabled={!input.trim() || busy}
              className="flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-[var(--mvz-gold)] bg-gradient-to-r from-[var(--mvz-gold)] via-[var(--mvz-gold-light)] to-[var(--mvz-gold)] px-4 text-[12px] font-black uppercase text-black shadow-[0_0_20px_rgba(212,175,55,0.3)] transition hover:opacity-90 disabled:opacity-40 cursor-pointer"
            >
              {busy ? (
                <Loader2 size={13} className="animate-spin text-black" />
              ) : (
                <>
                  <span>Gerar</span>
                  <Send size={13} />
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* ── DRAWER MOBILE DE HISTÓRICO ── */}
      {histOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-black/80 backdrop-blur-sm">
          <div className="w-[280px] bg-[#0c0c0d] border-r border-white/10 p-4 flex flex-col justify-between h-full shadow-2xl">
            <div className="space-y-4 flex flex-col flex-1 min-h-0">
              <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  <div className="relative shrink-0" style={{ width: 22, height: 22 }}>
                    <div className="mvz-orb absolute inset-0 rounded-full" />
                  </div>
                  <div>
                    <span className="text-[12.5px] font-black text-white leading-tight block">Histórico</span>
                    <span className="text-[9.5px] text-white/40 block">Prompts Anteriores</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      newSession();
                      setHistOpen(false);
                    }}
                    className="p-1.5 text-[var(--mvz-gold)] hover:text-white cursor-pointer"
                    title="Novo Chat"
                  >
                    <Plus size={16} />
                  </button>
                  <button
                    onClick={() => setHistOpen(false)}
                    className="p-1.5 text-white/50 hover:text-white cursor-pointer"
                    title="Fechar"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 overflow-y-auto flex-1 pr-1">
                {sortedSessions.map((s) => {
                  const isActive = s.id === activeSession.id;
                  return (
                    <div
                      key={s.id}
                      className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-[12px] transition ${
                        isActive
                          ? 'border border-[var(--mvz-gold)]/40 bg-[var(--mvz-gold)]/10 text-white font-semibold'
                          : 'border border-transparent bg-white/[0.02] text-white/60 hover:text-white'
                      }`}
                    >
                      <button
                        onClick={() => {
                          setActiveId(s.id);
                          setHistOpen(false);
                        }}
                        className="truncate text-left flex-1 cursor-pointer pr-1"
                        title={s.title}
                      >
                        <span className="truncate block font-medium">{s.title}</span>
                        <span className="text-[10px] text-white/35 block mt-0.5 font-normal">
                          {s.msgs.length} {s.msgs.length === 1 ? 'mensagem' : 'mensagens'}
                        </span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSession(s.id);
                        }}
                        className="ml-1.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white/40 hover:text-rose-400 hover:bg-rose-500/15 transition cursor-pointer"
                        title="Excluir este chat"
                        aria-label="Excluir este chat"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-white/[0.06] text-[10.5px] text-white/40 flex items-center justify-between">
              <span>Orbiex Prompt Studio</span>
              <span className="text-[var(--mvz-gold-light)] font-mono">v3.4</span>
            </div>
          </div>
          <div className="flex-1" onClick={() => setHistOpen(false)} />
        </div>
      )}
    </div>
  );
}

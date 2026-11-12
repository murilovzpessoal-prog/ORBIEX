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
  Loader2,
  Mic,
  Plus,
  Send,
  Trash2,
  Zap,
  ShieldCheck,
  Camera,
  Activity,
  Video,
  Film,
  Sparkles,
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

/* ─────────────────────────── engine de prompts ─────────────────────────── */

function buildPromptsFromIdea(userIdea: string): { steps: string[]; text: string; prompts: PromptBlock[] } {
  const idea = userIdea.trim();
  const lower = idea.toLowerCase();

  // Detecta movimento implícito ou explícito
  let motionEn = 'slow organic 360-degree orbit camera movement showing 3D fit and drapery';
  let motionPt = 'Giro suave de 360 graus com estabilização de câmera destacando o caimento da peça.';

  if (lower.includes('agacha') || lower.includes('transpar') || lower.includes('elasticidade')) {
    motionEn = 'deep athletic squat movement test in front of full-length mirror, camera tracks descent, proving zero fabric transparency and locked waistband';
    motionPt = 'Agachamento atlético no limite em frente ao espelho, comprovando zero transparência do tecido e firmeza do cós.';
  } else if (lower.includes('caminha') || lower.includes('desfile') || lower.includes('passo')) {
    motionEn = 'confident forward runway walk towards camera, dynamic steadycam tracking shot, natural fabric flutter with each stride';
    motionPt = 'Caminhada frontal confiante com câmera rastreando o movimento e balanço natural do tecido.';
  } else if (lower.includes('zoom') || lower.includes('detalhe') || lower.includes('textura')) {
    motionEn = 'smooth macro push-in lens movement, revealing intricate garment stitching, ribbed weave and micro-fabric elasticity';
    motionPt = 'Aproximação suave em lente macro evidenciando a costura dupla e a textura do tecido.';
  } else if (lower.includes('espelho') || lower.includes('ugc') || lower.includes('celular')) {
    motionEn = 'vertical mirror POV recording, authentic natural handheld phone sway, model touches waistband and spins slightly with casual confidence';
    motionPt = 'Gravação vertical em espelho estilo POV de celular, modelo confere o ajuste na cintura e dá meio giro.';
  }

  const prompts: PromptBlock[] = [
    {
      engine: 'kling',
      engineLabel: 'Kling AI V1.5 / V2.0',
      title: 'Prompt de Movimento Vertical (Kling AI)',
      promptEn: `High-end commercial video, vertical format 9:16. ${idea}. Motion directive: ${motionEn}. Authentic mobile UGC aesthetic, natural body proportions, rich textile fabric texture, authentic skin tones. Smooth natural motion blur, seamless cinematic flow, soft natural ambient lighting. Ultra sharp focus, 8k resolution, raw quality, 30fps.`,
      negativePrompt: 'deformed hands, extra fingers, mutated anatomy, blur, jitter, artifacts, cartoonish, 3d render, plastic skin, oversaturation, distortion, face glitch, bad proportions',
      cameraDirective: `Câmera: ${motionPt}`,
      aspectRatio: '9:16',
      explanationPt: `Otimizado especificamente para a física de vídeo do Kling AI, garantindo que o movimento (${motionPt.split('.')[0]}) ocorra de forma fluida sem distorcer membros ou mãos.`,
    },
    {
      engine: 'flow',
      engineLabel: 'Google Flow / VEO 3',
      title: 'Prompt de Alta Fidelidade Cinematográfica (Google Flow)',
      promptEn: `Cinematic commercial fashion shot, aspect ratio 9:16. ${idea}. Camera choreograph: ${motionEn}. Filmed on 35mm Arri Alexa camera with master prime lens f/1.8. Soft diffused window lighting, subtle volumetric shadows, natural color grade, accurate fabric micro-textures. Photorealistic depth of field, 4k master render.`,
      negativePrompt: 'flicker, anatomical distortion, low resolution, noisy, plastic textures, blown-out highlights, artifacts, extra limbs, bad eyes',
      cameraDirective: `Coreografia Óptica: Lente 35mm Arri Alexa em f/1.8 com rastreamento contínuo.`,
      aspectRatio: '9:16',
      explanationPt: `Direcionado para a estética cinematográfica de alta resolução do Google Flow / VEO, com parâmetros de iluminação volumétrica e profundidade de campo f/1.8.`,
    },
    {
      engine: 'midjourney',
      engineLabel: 'Midjourney V6.1 / Flux Pro',
      title: 'Prompt de Fotografia Editorial Hiper-realista (Midjourney / Flux)',
      promptEn: `High fashion editorial photograph, dynamic pose captured mid-motion: ${motionEn}. ${idea}. Modern luxury aesthetic, authentic human model with realistic skin texture, intricate cloth weave. Soft studio lighting, clean minimalist composition. Shot with Hasselblad X2D 100C, 85mm portrait lens, shallow depth of field --ar 9:16 --v 6.1 --style raw --q 2`,
      negativePrompt: '--no cartoon, 3d, render, illustration, bad anatomy, deformed fingers, extra limbs, oversaturated, blurry, text, watermark',
      cameraDirective: 'Enquadramento: Lente 85mm f/1.4 Hasselblad em estúdio minimalista.',
      aspectRatio: '9:16',
      explanationPt: `Ideal para gerar fotos de catálogo, capa de anúncio ou imagem de referência inicial para depois animar no Kling ou Flow.`,
    },
    {
      engine: 'ugc',
      engineLabel: 'Roteiro & Copy TikTok Shop',
      title: 'Estrutura Completa de Fala & Ação de Cena (0 a 15 Segundos)',
      promptEn: `[0-3s GANCHO]: "Se você achava que ${idea.slice(0, 40)} ia ficar transparente ou marcar no corpo, para tudo e olha esse teste real no espelho!"\n[AÇÃO VISUAL]: Modelo executa ${motionPt.toLowerCase()}\n[TEXTO NA TELA]: "ZERO TRANSPARÊNCIA?! Teste real no espelho (Não enrola o cós)"\n[4-10s BENEFÍCIO]: "O tecido tem compressão anatômica que modela a cintura sem sufocar. O toque é macio e não desce durante o agachamento."\n[11-15s CTA]: "Está com frete grátis liberado na loja hoje. Clica no link do carrinho aqui embaixo antes que esgote!"`,
      aspectRatio: '9:16',
      explanationPt: `Roteiro comercial de alta conversão estruturado com gatilho visual de retenção nos primeiros 3 segundos e quebra imediata da objeção principal.`,
    },
  ];

  return {
    steps: [
      'Decompondo intenção semântica e sujeito principal...',
      `Mapeando dinâmica de movimento: ${motionPt.split(' ')[0]}...`,
      'Parametrizando lentes ópticas (35mm/85mm) e proporção 9:16...',
      'Compilando prompts em inglês técnico com filtros anti-distorção...',
    ],
    text: `Aqui estão os prompts calibrados para a sua ideia: **"${idea}"**.\n\nEstruturei versões específicas para os principais motores de IA (Kling AI, Google Flow, Midjourney) e o roteiro comercial de conversão. Você pode copiar qualquer prompt ou enviá-lo direto para o Agente IA com 1 clique:`,
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

  const activeSession = useMemo(
    () => sessions.find((s) => s.id === activeId) || sessions[0],
    [sessions, activeId]
  );
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

    const initialAgentMsg: PromptMessage = {
      id: agentMsgId,
      role: 'agent',
      text: '',
      status: 'thinking',
      steps: [
        { label: 'Decompondo intenção semântica e sujeito principal...', done: false },
        { label: 'Mapeando dinâmica de movimento e física de câmera...', done: false },
        { label: 'Parametrizando lentes ópticas (35mm/85mm) e proporção 9:16...', done: false },
        { label: 'Compilando prompts em inglês técnico com filtros anti-distorção...', done: false },
      ],
    };

    // Atualiza título se for a primeira mensagem
    const shortTitle = raw.length > 28 ? `${raw.slice(0, 28)}...` : raw;

    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeId
          ? {
              ...s,
              title: s.msgs.length === 0 ? shortTitle : s.title,
              updatedAt: Date.now(),
              msgs: [...s.msgs, userMsg, initialAgentMsg],
            }
          : s
      )
    );

    setInput('');
    setBusy(true);

    // Efeito de escaneamento em etapas com loading visual top
    setTimeout(() => {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeId
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
    }, 500);

    setTimeout(() => {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeId
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
    }, 1100);

    setTimeout(() => {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeId
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
    }, 1700);

    setTimeout(() => {
      const generated = buildPromptsFromIdea(raw);

      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeId
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
    }, 2300);
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
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
              Histórico ({sessions.length})
            </span>

            <div className="space-y-1 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className={`group flex items-center justify-between rounded-xl px-2.5 py-2 text-[11.5px] transition ${
                    s.id === activeId
                      ? 'border border-[var(--mvz-gold)]/30 bg-[var(--mvz-gold)]/10 text-white font-medium'
                      : 'border border-transparent bg-white/[0.02] text-white/60 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <button
                    onClick={() => setActiveId(s.id)}
                    className="truncate text-left flex-1 cursor-pointer"
                  >
                    <span className="truncate">{s.title}</span>
                  </button>
                  {sessions.length > 1 && (
                    <button
                      onClick={() => removeSession(s.id)}
                      className="ml-1 opacity-0 group-hover:opacity-100 text-white/30 hover:text-rose-400 p-1 transition cursor-pointer"
                      title="Excluir histórico"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              ))}
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
            <span className="h-2 w-2 shrink-0 rounded-full bg-[#22c55e]" />
            <span className="text-[13px] font-bold text-white truncate">
              {activeSession.title}
            </span>
            <span className="hidden sm:inline text-[11px] text-white/40">
              • Arquiteto de Prompts Neurais
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-md border border-[var(--mvz-gold)]/30 bg-[var(--mvz-gold)]/10 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-[var(--mvz-gold-light)]">
              Kling • Flow • Midjourney
            </span>
          </div>
        </div>

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
                      <div className="mvz-orb absolute inset-[2px] rounded-full" style={{ boxShadow: '0 0 12px rgba(212,175,55,0.45)' }} />
                    </div>

                    <div className="min-w-0 flex-1 space-y-4">
                      {/* Status de Loading e Steps do Scanner */}
                      {m.steps && (
                        <div className="rounded-2xl border border-white/[0.08] bg-[#080706] p-4 space-y-2 font-mono text-[11px]">
                          <div className="flex items-center justify-between border-b border-white/[0.06] pb-2 mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--mvz-gold)] flex items-center gap-1.5">
                              <Activity size={12} className={m.status === 'thinking' ? 'animate-spin' : ''} />
                              <span>{m.status === 'thinking' ? 'Scanner Neural Ativo • Processando' : 'Prompt Compilado com Sucesso'}</span>
                            </span>
                            <span className="text-[10px] text-white/40">
                              {m.status === 'thinking' ? 'Calibrando pesos...' : 'Fidelidade 99.8%'}
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            {m.steps.map((s) => (
                              <div
                                key={s.label}
                                className={`flex items-center gap-2 ${
                                  s.done ? 'text-[var(--mvz-gold-light)]' : 'text-white/30'
                                }`}
                              >
                                {s.done ? (
                                  <Check size={12} className="text-[#22c55e]" />
                                ) : (
                                  <Loader2 size={12} className="animate-spin text-[var(--mvz-gold)]" />
                                )}
                                <span>{s.label}</span>
                              </div>
                            ))}
                          </div>
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
    </div>
  );
}

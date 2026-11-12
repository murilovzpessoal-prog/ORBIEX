import {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import {
  ArrowDown,
  History,
  Loader2,
  Mic,
  Plus,
  Send,
  Trash2,
  Camera,
  Video,
  Film,
  Sparkles,
  X,
} from 'lucide-react';
import type { ViewId } from '../data';
import { Rich } from './ChatParts';
import { useUserProfile } from '../useUserProfile';

/* ─────────────────────────── small UI ─────────────────────────── */

function AgentAvatar({ size = 30, live = false }: { size?: number; live?: boolean }) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className={`mvz-orb absolute inset-[3px] rounded-full ${live ? 'mvz-orb-live' : ''}`}
        style={{ boxShadow: '0 0 14px rgba(212,175,55,0.45)' }}
      />
      {live && (
        <div
          className="mvz-ring-spin absolute inset-0 rounded-full"
          style={{ animationDuration: '2.2s' }}
        />
      )}
    </div>
  );
}

function ThinkingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="mvz-think-dot h-1.5 w-1.5 rounded-full bg-[var(--mvz-gold)]"
          style={{ animationDelay: `${i * 0.16}s` }}
        />
      ))}
    </span>
  );
}

/* ─────────────────────────── types ─────────────────────────── */

interface PromptMessage {
  id: number;
  role: 'user' | 'agent';
  text: string;
  status?: 'thinking' | 'streaming' | 'done';
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
    desc: 'Conjunto legging e top mostrando caimento, cós firme e zero transparência no agachamento.',
    prompt: 'Quero um vídeo vertical no espelho de uma mulher vestindo conjunto fitness vinho, mostrando o caimento, cós alto que não enrola e zero transparência no agachamento.',
  },
  {
    icon: Camera,
    title: 'Ensaio Editorial Fotográfico de Alta Moda',
    desc: 'Vestido midi canelado em ambiente minimalista com luz natural de janela e acabamento fotorrealista.',
    prompt: 'Quero uma foto editorial de alta moda com vestido midi elegante em cenário clean, luz natural suave entrando pela janela e textura de tecido realista.',
  },
  {
    icon: Film,
    title: 'Comercial de Produto em Câmera Lenta',
    desc: 'Animação de câmera cinematográfica destacando acabamentos, costura dupla e lente macro.',
    prompt: 'Quero um comercial cinematográfico de produto com aproximação suave de câmera, iluminação de estúdio destacando costuras e detalhes de acabamento.',
  },
  {
    icon: Sparkles,
    title: 'Roteiro UGC com Gancho de 3 Segundos',
    desc: 'Influenciadora provando a peça na prática para converter no TikTok Shop.',
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

/* ─────────────────────────── assistente inteligente estilo ChatGPT ─────────────────────────── */

function generatePromptAssistantReply(userIdea: string, history: PromptMessage[]): string {
  const idea = userIdea.trim();
  const lower = idea.toLowerCase();

  // 1. Detecta se é continuação / ajuste de um prompt anterior
  const previousAssistantMsg = [...history].reverse().find((m) => m.role === 'agent' && m.text);
  const isAdjustment =
    history.length > 1 &&
    (lower.startsWith('muda') ||
      lower.startsWith('troca') ||
      lower.startsWith('ajusta') ||
      lower.startsWith('adiciona') ||
      lower.startsWith('agora') ||
      lower.startsWith('faz') ||
      lower.includes('em vez de') ||
      lower.includes('outro') ||
      lower.includes('mais'));

  if (isAdjustment && previousAssistantMsg) {
    return (
      `Perfeito! Analisei a sua observação e atualizei a composição do prompt incorporando: **"${idea}"**.\n\n` +
      `Aqui está a versão revisada e calibrada para o **Kling AI (Vídeo Vertical 9:16)**:\n\n` +
      `\`\`\`kling\n` +
      `High-end commercial vertical video 9:16, authentic mobile UGC aesthetic. Updated scene directive: ${idea}. Authentic model proportions, rich fabric texture, natural skin tones, smooth 60fps cinematic camera tracking flow, ultra sharp focus, 8k resolution, raw photorealism. --motion_amplitude 6.5 --camera_motion smooth\n` +
      `\`\`\`\n\n` +
      `### Ajustes Aplicados na Cena:\n` +
      `- **Foco do Ajuste:** Modificação solicitada integrada na física de movimento sem distorcer membros ou textura têxtil.\n` +
      `- **Negative Prompt (Anti-Distorção):**\n` +
      `\`\`\`negative\n` +
      `deformed anatomy, extra fingers, mutated hands, blur, jitter, artifacts, cartoonish, 3d render, plastic textures, oversaturation, distortion, low resolution\n` +
      `\`\`\`\n\n` +
      `Se precisar de mais algum ajuste fino no ângulo, iluminação ou tempo de cena, só me avisar.`
    );
  }

  // 2. Análise semântica profunda da ideia
  let productLabel = 'o seu produto';
  let motionEn = 'slow organic 360-degree orbit camera movement showing 3D fit and drapery';
  let motionPt = 'Giro suave de 360 graus com estabilização de câmera destacando o caimento da peça.';

  if (lower.includes('mao na cintura') || lower.includes('mão na cintura') || (lower.includes('cintura') && !lower.includes('vestido'))) {
    productLabel = 'peça com destaque na cintura e compressão anatômica';
    motionEn =
      'natural mobile UGC video in front of mirror. Model confidently places hands on waistband, subtly shifting posture and rotating 45 degrees to highlight waist sculpting, zero waistband rolling, and firm compressive hold. Clean organic motion with natural ambient illumination';
    motionPt =
      'Modelo posiciona as mãos na cintura em frente ao espelho com rotação sutil de 45°, evidenciando a firmeza do cós e o ajuste anatômico sem dobras.';
  } else if (
    lower.includes('fitness') ||
    lower.includes('legging') ||
    lower.includes('top') ||
    lower.includes('agacha') ||
    lower.includes('compress') ||
    lower.includes('transpar') ||
    lower.includes('short') ||
    lower.includes('bermuda') ||
    lower.includes('academia')
  ) {
    productLabel = 'conjunto fitness feminino de alta compressão';
    motionEn =
      'deep athletic squat movement test in front of full-length illuminated mirror. Camera tracks downward at a 45-degree angle following the descent, model holds the deep squat proving zero fabric transparency and locked anti-roll waistband, then smoothly rises with a 360-degree organic orbit glide';
    motionPt =
      'Descida angular em 45° acompanhando o agachamento no limite, provando zero transparência do tecido e firmeza do cós duplo sem enrolar, seguido de giro 360°.';
  } else if (
    lower.includes('vestido') ||
    lower.includes('saia') ||
    lower.includes('blazer') ||
    lower.includes('alfaiataria') ||
    lower.includes('camisa') ||
    lower.includes('linho') ||
    lower.includes('pantalona') ||
    lower.includes('moda')
  ) {
    productLabel = 'peça de vestuário de alta moda';
    motionEn =
      'confident 360-degree orbital steadycam glide around the model. Camera tracks the fluid drape and natural bounce of the fabric, soft natural window breeze creating dynamic garment flutter, ending with an elegant forward catwalk stride toward the lens';
    motionPt =
      'Giro orbital suave de 360° em steadycam capturando o caimento fluido do tecido e o movimento elegante da barra, finalizando com passada frontal confiante.';
  } else if (
    lower.includes('biquíni') ||
    lower.includes('biquini') ||
    lower.includes('maiô') ||
    lower.includes('praia') ||
    lower.includes('lingerie') ||
    lower.includes('cinta')
  ) {
    productLabel = 'peça de modelagem anatômica';
    motionEn =
      'smooth vertical pan and slow 180-degree turn under soft golden sunlight. Camera accentuates anatomical contour sculpting, seamless edge transition, and zero-mark fit with delicate slow-motion fabric resilience';
    motionPt =
      'Varredura vertical sob luz natural destacando o contorno anatômico e acabamento sem costura.';
  } else if (
    lower.includes('tênis') ||
    lower.includes('tenis') ||
    lower.includes('sapato') ||
    lower.includes('calçado')
  ) {
    productLabel = 'tênis esportivo';
    motionEn =
      'low-angle dynamic tracking camera matching foot strike on textured surface. Slow motion 60fps captures visible sole cushioning compression, tread grip reaction, and forward explosive energy return';
    motionPt =
      'Câmera baixa rente ao chão registrando o impacto da pisada e a compressão do sistema de amortecimento a 60fps.';
  } else if (
    lower.includes('relógio') ||
    lower.includes('relogio') ||
    lower.includes('joia') ||
    lower.includes('colar') ||
    lower.includes('anel') ||
    lower.includes('óculos')
  ) {
    productLabel = 'acessório de luxo';
    motionEn =
      'macro probe lens push-in with continuous slow rotational roll. Ambient lighting glints across precision-beveled edges, sapphire crystal reflection, and brushed metallic micro-textures in razor-sharp focus';
    motionPt =
      'Aproximação em lente macro probe com rotação suave revelando reflexos de luz nos chanfros metálicos e acabamento artesanal.';
  } else if (
    lower.includes('sérum') ||
    lower.includes('creme') ||
    lower.includes('batom') ||
    lower.includes('maquiagem') ||
    lower.includes('pele') ||
    lower.includes('cosmético')
  ) {
    productLabel = 'cosmético dermatológico';
    motionEn =
      'ultra-slow motion 120fps macro shot: concentrated droplet falls and spreads across smooth clean skin, instant absorption with dewy luminous finish and soft studio ring-light reflection';
    motionPt =
      'Macro a 120fps capturando a queda da gota, absorção instantânea e viço luminoso na pele.';
  } else if (
    lower.includes('garrafa') ||
    lower.includes('copo') ||
    lower.includes('gadget') ||
    lower.includes('térmic')
  ) {
    productLabel = 'gadget utilitário';
    motionEn =
      'first-person POV hands demonstration: tactile opening mechanism with acoustic click, ice-cold water poured into chamber with condensation steam, 360-degree roll proving watertight seal';
    motionPt =
      'Demonstração em primeira pessoa com abertura tátil, teste antivazamento com água gelada e acabamento ergonômico.';
  }

  // 3. Resposta conversacional estruturada como ChatGPT / Agente
  return (
    `Analisando a sua ideia para **${productLabel}**, estruturei as diretivas cinematográficas exatas para transformar seu conceito em um resultado profissional, sem distorção e com física realista.\n\n` +
    `### Kling AI V1.5 / V2.0 (Vídeo Vertical 9:16)\n` +
    `\`\`\`kling\n` +
    `High-end commercial video, vertical format 9:16. ${idea}. Motion directive: ${motionEn}. Authentic mobile UGC aesthetic, natural body proportions, rich textile fabric texture, authentic skin tones. Smooth natural motion blur, seamless cinematic flow, soft natural ambient lighting. Ultra sharp focus, 8k resolution, raw quality, 30fps. --motion_amplitude 6.5 --camera_motion smooth\n` +
    `\`\`\`\n\n` +
    `### Especificações Técnicas & Câmera:\n` +
    `- **Movimento de Câmera:** ${motionPt}\n` +
    `- **Enquadramento:** Vertical 9:16 otimizado para retenção no feed do TikTok e Reels.\n` +
    `- **Iluminação:** Luz natural difusa de janela com contraste suave nas texturas.\n\n` +
    `### Negative Prompt (Anti-Distorção Obrigatório):\n` +
    `\`\`\`negative\n` +
    `deformed hands, extra fingers, mutated anatomy, blur, jitter, artifacts, cartoonish, 3d render, plastic skin, transparent fabric, waistband rolling, oversaturation, distortion, face glitch, bad proportions, flicker\n` +
    `\`\`\`\n\n` +
    `### Google Flow / VEO 3 (Cinematográfico):\n` +
    `\`\`\`flow\n` +
    `Cinematic commercial fashion shot, aspect ratio 9:16. ${idea}. Choreography: ${motionEn}. Filmed on 35mm Arri Alexa LF with master prime lens f/1.8. Soft diffused window lighting, subtle volumetric shadows, natural color grade, accurate micro-textures. Photorealistic depth of field, 4k master render, realistic optical bokeh.\n` +
    `\`\`\`\n\n` +
    `### Midjourney V6.1 / Flux Pro (Foto Editorial / Catálogo):\n` +
    `\`\`\`midjourney\n` +
    `High-fashion editorial photograph, dynamic pose captured mid-motion: ${motionEn}. ${idea}. Modern luxury aesthetic, authentic human model with realistic skin pores, intricate weave detail. Soft studio rim lighting, clean minimalist composition. Shot with Hasselblad X2D 100C, 85mm portrait lens, shallow depth of field --ar 9:16 --v 6.1 --style raw --q 2\n` +
    `\`\`\`\n\n` +
    `### Roteiro Orgânico TikTok Shop (0 a 15s):\n` +
    `- **0 a 3s (Gancho POV):** "POV: você finalmente achou ${productLabel} que veste perfeito e tem zero transparência no corpo."\n` +
    `- **3 a 7s (Ação no Vídeo):** Modelo faz a demonstração prática no espelho (${motionPt.toLowerCase()})\n` +
    `- **7 a 11s (Quebra de Objeção):** "O tecido tem compressão firme que modela a cintura sem sufocar, o cós não enrola e você agacha sem medo."\n` +
    `- **11 a 15s (Chamada Orgânica):** "Veste bem demais. Deixei o link fixado aqui embaixo na sacolinha para quem quiser conferir."\n\n` +
    `Se você quiser mudar algum detalhe do cenário, alterar a cor ou ajustar o movimento, é só me falar que eu adapto aqui.`
  );
}

/* ─────────────────────────── componente principal ─────────────────────────── */

export function PromptGeneratorView({ onUseInAgent: _onUseInAgent }: Props) {
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
  const intervalRef = useRef<number | null>(null);

  // Limpa timer se desmontar
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

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
              title: s.msgs.length === 0 || s.title === 'Novo Prompt' ? shortTitle : s.title,
              updatedAt: Date.now(),
              msgs: [...s.msgs, userMsg, initialAgentMsg],
            }
          : s
      );
    });

    setInput('');
    setBusy(true);
    setTimeout(() => scrollToBottom(true), 60);

    const historySnapshot = activeSession?.msgs ?? [];

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // 1. Tempo de raciocínio natural e inteligente da IA (1800ms)
    setTimeout(() => {
      const fullText = generatePromptAssistantReply(raw, historySnapshot);
      const words = fullText.split(/(\s+)/);
      let pos = 0;
      const step = 3;

      // Inicia digitação progressiva
      setSessions((prev) =>
        prev.map((s) =>
          s.id === targetSessionId
            ? {
                ...s,
                msgs: s.msgs.map((m) =>
                  m.id === agentMsgId
                    ? {
                        ...m,
                        status: 'streaming',
                        text: '',
                      }
                    : m
                ),
              }
            : s
        )
      );

      const tick = window.setInterval(() => {
        pos += step;
        const finished = pos >= words.length;
        const slice = words.slice(0, pos).join('');

        setSessions((prev) =>
          prev.map((s) =>
            s.id === targetSessionId
              ? {
                  ...s,
                  msgs: s.msgs.map((m) =>
                    m.id === agentMsgId
                      ? {
                          ...m,
                          status: finished ? 'done' : 'streaming',
                          text: finished ? fullText : slice,
                        }
                      : m
                  ),
                }
              : s
          )
        );

        scrollToBottom(false);

        if (finished) {
          clearInterval(tick);
          intervalRef.current = null;
          setBusy(false);
          setTimeout(() => scrollToBottom(true), 60);
        }
      }, 26);

      intervalRef.current = tick;
    }, 1800);
  };

  return (
    <div className="mvz-fade-up relative flex h-[calc(100dvh-60px-2rem)] min-h-[540px] gap-4 md:h-[calc(100dvh-60px-3rem)]">
      {/* ── BARRA LATERAL ESQUERDA: HISTÓRICO DE PROMPTS ── */}
      <aside className="hidden lg:flex w-[260px] shrink-0 flex-col justify-between rounded-[22px] border border-white/[0.08] bg-[#0c0c0d] p-4 shadow-xl">
        <div className="flex flex-col space-y-4">
          {/* Header da Sidebar */}
          <div className="flex items-center gap-2.5 pb-3.5 border-b border-white/[0.06]">
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

      {/* ── CONSOLE CENTRAL: CHAT CONVERSACIONAL ESTILO CHATGPT / AGENTE ── */}
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
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${
                busy ? 'bg-[var(--mvz-gold)] animate-pulse' : 'bg-[#22c55e]'
              }`}
            />
            <span className="text-[13px] font-bold text-white truncate">
              {activeSession.title}
            </span>
            <span className="hidden sm:inline text-[11px] text-white/40">
              • Arquiteto de Prompts
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={newSession}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-white/70 hover:text-white hover:border-[var(--mvz-gold)]/40 hover:bg-white/[0.06] transition cursor-pointer"
              title="Novo Chat"
            >
              <Plus size={12} className="text-[var(--mvz-gold)]" />
              <span>Novo Chat</span>
            </button>
            <span className="hidden sm:inline-block rounded-md border border-[var(--mvz-gold)]/30 bg-[var(--mvz-gold)]/10 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-[var(--mvz-gold-light)]">
              Kling • Flow • Midjourney
            </span>
          </div>
        </div>

        {/* Linha laser superior quando ocupado */}
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
                Descreva sua visão criativa em linguagem natural ou dite por voz. Eu analiso o conceito e entrego os prompts calibrados com movimento de câmera, iluminação e negativos em inglês técnico.
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
            <div className="mx-auto max-w-3xl space-y-6">
              {msgs.map((m) =>
                m.role === 'user' ? (
                  <div key={m.id} className="mvz-msg-in flex flex-col items-end gap-1.5">
                    <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md border border-[rgba(212,175,55,0.22)] bg-[rgba(212,175,55,0.09)] px-4 py-3 text-[14px] leading-relaxed text-[#fff7df]">
                      {m.text}
                    </div>
                  </div>
                ) : (
                  <div key={m.id} className="mvz-msg-in flex gap-3.5">
                    <AgentAvatar live={m.status === 'thinking' || m.status === 'streaming'} />
                    <div className="min-w-0 flex-1 pt-0.5">
                      <div className="mb-1.5 text-[12px] font-bold text-[var(--mvz-gold-light)]">
                        Orbiex
                      </div>
                      {m.status === 'thinking' && !m.text && (
                        <div className="py-2 flex items-center gap-2.5 text-[13px] text-[var(--mvz-muted)]">
                          <ThinkingDots />
                          <span>Analisando conceito criativo e calculando física...</span>
                        </div>
                      )}
                      {m.text && (
                        <div className="text-[13.5px] leading-relaxed text-white/90">
                          <Rich text={m.text} streaming={m.status === 'streaming'} />
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
              placeholder="Descreva a ideia do seu prompt e o movimento desejado... (Pressione Enter para enviar)"
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
                  <span>Enviar</span>
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
                    <span className="text-[12.5px] font-black text-white leading-tight block">
                      Histórico
                    </span>
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

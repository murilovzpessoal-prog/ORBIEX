import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  Copy,
  CalendarDays,
  Gauge,
  History,
  Loader2,
  Mic,
  Paperclip,
  Plus,
  RefreshCw,
  Square,
  Store,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  TrendingUp,
  Video,
  X,
  Zap,
  Sliders,
  type LucideIcon,
} from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Card, AttachmentItem } from '../agentBrain';
import { generateAIReply, getAIConfig, type AIConfig } from '../aiService';
import { AISettingsModal } from '../AISettingsModal';
import { useUserProfile } from '../useUserProfile';
import { ResultCard, Rich, copyText } from './ChatParts';

/* ─────────────────────────── types ─────────────────────────── */

interface Step {
  label: string;
  done: boolean;
}

interface Msg {
  id: number;
  role: 'user' | 'agent';
  text: string;
  attachments?: AttachmentItem[];
  steps?: Step[];
  card?: Card;
  suggestions?: string[];
  status?: 'thinking' | 'streaming' | 'done' | 'stopped';
  took?: string;
  feedback?: 'up' | 'down';
  prompt?: string;
}

interface Chat {
  id: number;
  title: string;
  updatedAt: number;
  msgs: Msg[];
}

const STORAGE_KEY = 'orbiex.chats.v1';

const MODELS = [
  { id: 'fast', name: 'Orbiex 1', desc: 'Rápido para o dia a dia' },
  { id: 'pro', name: 'Orbiex 1 Pro', desc: 'Raciocínio profundo e mais etapas' },
] as const;

const COMMANDS: { cmd: string; label: string; template: string; icon: LucideIcon }[] = [
  { cmd: '/produto', label: 'Analisar produto', template: 'Analise o produto ', icon: Gauge },
  { cmd: '/loja', label: 'Diagnosticar loja', template: 'Faça o diagnóstico da loja ', icon: Store },
  { cmd: '/scanner', label: 'Escanear concorrentes', template: 'Escaneie os concorrentes de ', icon: TrendingUp },
  { cmd: '/hooks', label: 'Criar hooks virais', template: 'Crie 5 hooks virais para ', icon: Zap },
  { cmd: '/roteiro', label: 'Roteiro de vídeo', template: 'Crie um roteiro de 30s sem aparecer para ', icon: Video },
  { cmd: '/plano', label: 'Plano de 30 dias', template: 'Monte um plano de 30 dias para escalar ', icon: CalendarDays },
  { cmd: '/tendencias', label: 'Produtos em alta', template: 'Quais produtos estão em alta hoje?', icon: TrendingUp },
];

const STARTERS: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Gauge, title: 'Analisar um produto', text: 'Analise o produto "Mini Processador Portátil"' },
  { icon: Video, title: 'Criar um roteiro', text: 'Crie um roteiro de 30s sem aparecer' },
  { icon: CalendarDays, title: 'Plano de escala', text: 'Monte um plano de 30 dias para escalar' },
  { icon: TrendingUp, title: 'Ver o que está em alta', text: 'Quais produtos estão em alta hoje?' },
];

/* ─────────────────────────── helpers ─────────────────────────── */

function loadChats(): Chat[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('orbix.chats.v1');
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Chat[];
    return parsed.map((c) => ({
      ...c,
      msgs: c.msgs.map((m) =>
        m.role === 'agent'
          ? {
              ...m,
              status: m.status === 'thinking' || m.status === 'streaming' ? ('stopped' as const) : m.status,
              steps: m.steps?.map((s) => ({ ...s, done: true })),
            }
          : m,
      ),
    }));
  } catch {
    return [];
  }
}

function greeting() {
  const h = new Date().getHours();
  return h < 5 ? 'Boa madrugada' : h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
}

let uid = Date.now();
const nextId = () => ++uid;

// Web Speech API is not in the TS DOM lib — feature-detect it.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SpeechRec: any = typeof window !== 'undefined' ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition : undefined;

/* ─────────────────────────── small UI ─────────────────────────── */

function AgentAvatar({ size = 30, live = false }: { size?: number; live?: boolean }) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div className={`mvz-orb absolute inset-[3px] rounded-full ${live ? 'mvz-orb-live' : ''}`} style={{ boxShadow: '0 0 14px rgba(212,175,55,0.45)' }} />
      {live && <div className="mvz-ring-spin absolute inset-0 rounded-full" style={{ animationDuration: '2.2s' }} />}
    </div>
  );
}

function ThinkingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <span key={i} className="mvz-think-dot h-1.5 w-1.5 rounded-full bg-[var(--mvz-gold)]" style={{ animationDelay: `${i * 0.16}s` }} />
      ))}
    </span>
  );
}

function StepsView({ m }: { m: Msg }) {
  const steps = m.steps ?? [];
  const working = m.status === 'thinking' || m.status === 'streaming';

  if (m.status === 'thinking' && steps.length === 0) {
    return (
      <div className="mb-2 flex items-center gap-2.5 text-[13px] text-[var(--mvz-muted)]">
        <ThinkingDots /> Pensando…
      </div>
    );
  }
  if (steps.length === 0) return null;

  const list = (
    <div className="space-y-1.5 border-l border-[var(--mvz-line-strong)] pl-3.5">
      {steps.map((s) => (
        <div key={s.label} className="mvz-msg-in flex items-center gap-2 text-[12px] text-[var(--mvz-muted)]">
          {s.done ? <Check size={12} className="text-[var(--mvz-gold)]" /> : <Loader2 size={12} className="animate-spin text-[var(--mvz-gold)]" />}
          {s.label}
        </div>
      ))}
    </div>
  );

  if (working) return <div className="mb-3">{list}</div>;

  return (
    <details className="group mb-3">
      <summary className="flex w-fit cursor-pointer list-none items-center gap-1.5 text-[12px] font-medium text-[var(--mvz-muted)] hover:text-[var(--mvz-gold-light)]">
        <Check size={12} className="text-[var(--mvz-gold)]" />
        {m.took ? `Concluído em ${m.took}s` : 'Concluído'} · {steps.length} {steps.length === 1 ? 'etapa' : 'etapas'}
        <ChevronDown size={12} className="transition group-open:rotate-180" />
      </summary>
      <div className="mt-2">{list}</div>
    </details>
  );
}

function IconBtn({ children, onClick, label, active }: { children: ReactNode; onClick: () => void; label: string; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex h-7 w-7 items-center justify-center rounded-lg transition hover:bg-white/[0.07] ${active ? 'text-[var(--mvz-gold)]' : 'text-[var(--mvz-dim)] hover:text-white'}`}
    >
      {children}
    </button>
  );
}

/* ─────────────────────────── main view ─────────────────────────── */

interface Props {
  seed?: string;
  onSeedUsed?: () => void;
  startNew?: boolean;
  onStarted?: () => void;
}

export function AgentView({ seed, onSeedUsed, startNew, onStarted }: Props) {
  const { displayName } = useUserProfile();
  const [chats, setChats] = useState<Chat[]>(loadChats);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [model, setModel] = useState<(typeof MODELS)[number]['id']>('fast');
  const [modelOpen, setModelOpen] = useState(false);
  const [plusOpen, setPlusOpen] = useState(false);
  const [histOpen, setHistOpen] = useState(false);
  const [files, setFiles] = useState<AttachmentItem[]>([]);
  const [listening, setListening] = useState(false);
  const [showJump, setShowJump] = useState(false);
  const [slashIdx, setSlashIdx] = useState(0);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [aiSettingsOpen, setAiSettingsOpen] = useState(false);
  const [aiConfig, setAiConfig] = useState<AIConfig>(getAIConfig);

  const handleAddFiles = useCallback((fileList: FileList | File[]) => {
    Array.from(fileList).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = (e.target?.result as string) || '';
        setFiles((prev) => [...prev, { name: file.name, type: file.type, dataUrl }]);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const scroller = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const timers = useRef<number[]>([]);
  const active = useRef<{ chatId: number; msgId: number } | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recRef = useRef<any>(null);

  const chat = chats.find((c) => c.id === activeId) ?? null;
  const msgs = chat?.msgs ?? [];
  const sorted = useMemo(() => [...chats].sort((a, b) => b.updatedAt - a.updatedAt), [chats]);

  /* persistence */
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chats.slice(0, 40)));
    } catch {
      /* storage full / unavailable */
    }
  }, [chats]);

  /* textarea autosize */
  useLayoutEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [input]);

  /* auto-scroll while the agent writes */
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    if (msgs.length === 0) el.scrollTop = 0;
    else if (stick.current) el.scrollTop = el.scrollHeight;
  }, [msgs]);

  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 90;
    stick.current = near;
    setShowJump(!near);
  };

  const jump = () => {
    const el = scroller.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  };

  /* ───── engine ───── */

  const clearTimers = () => {
    timers.current.forEach((t) => {
      clearTimeout(t);
      clearInterval(t);
    });
    timers.current = [];
  };

  useEffect(
    () => () => {
      clearTimers();
      recRef.current?.stop?.();
    },
    [],
  );

  const patch = useCallback((chatId: number, msgId: number, fn: (m: Msg) => Msg) => {
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, updatedAt: Date.now(), msgs: c.msgs.map((m) => (m.id === msgId ? fn(m) : m)) } : c)),
    );
  }, []);

  const run = useCallback(
    async (
      chatId: number,
      msgId: number,
      prompt: string,
      history: Array<{ role: 'user' | 'agent'; text: string }>,
      attachments?: AttachmentItem[],
    ) => {
      const pro = model === 'pro';
      const t0 = Date.now();
      active.current = { chatId, msgId };
      setBusy(true);

      const at = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));

      // Estado de pensamento natural (exatamente como o ChatGPT)
      patch(chatId, msgId, (m) => ({
        ...m,
        status: 'thinking',
        steps: [],
      }));

      try {
        const r = await generateAIReply(prompt, history, model, attachments);
        const steps = pro && r.steps.length > 0 ? [...r.steps, 'Revisando métricas e precisão'] : r.steps;

        if (steps.length === 0) {
          // Conversa fluida estilo ChatGPT:
          // Pequeno tempo de pensamento natural (~1100ms)
          const thinkDelay = 1100;
          at(thinkDelay, () => {
            patch(chatId, msgId, (m) => ({
              ...m,
              status: 'streaming',
            }));

            // Digitação palavra a palavra no ritmo do ChatGPT
            const words = r.text.split(/(\s+)/);
            let pos = 0;
            const step = 2;
            const tick = window.setInterval(() => {
              pos += step;
              const finished = pos >= words.length;
              const slice = words.slice(0, pos).join('');
              if (finished) {
                clearInterval(tick);
                patch(chatId, msgId, (m) => ({
                  ...m,
                  text: r.text,
                  status: 'done',
                  card: r.card,
                  suggestions: r.suggestions,
                  took: ((Date.now() - t0) / 1000).toFixed(1),
                }));
                active.current = null;
                setBusy(false);
              } else {
                patch(chatId, msgId, (m) => ({ ...m, text: slice }));
              }
            }, 26);
            timers.current.push(tick);
          });
        } else {
          // Análise com etapas reais (ex: auditoria visual ou de produto)
          const stepMs = pro ? 650 : 500;

          steps.forEach((label, i) => {
            at(200 + i * stepMs, () =>
              patch(chatId, msgId, (m) => ({
                ...m,
                steps: [...(m.steps ?? []).filter((s) => s.label !== label), { label, done: false }],
              }))
            );
            at(200 + (i + 1) * stepMs - 80, () =>
              patch(chatId, msgId, (m) => ({
                ...m,
                steps: m.steps?.map((s) => (s.label === label ? { ...s, done: true } : s)),
              }))
            );
          });

          const startStream = 200 + steps.length * stepMs;
          at(startStream, () => {
            patch(chatId, msgId, (m) => ({
              ...m,
              status: 'streaming',
              steps: m.steps?.map((s) => ({ ...s, done: true })),
            }));

            const words = r.text.split(/(\s+)/);
            let pos = 0;
            const step = pro ? 3 : 4;
            const tick = window.setInterval(() => {
              pos += step;
              const finished = pos >= words.length;
              const slice = words.slice(0, pos).join('');
              if (finished) {
                clearInterval(tick);
                patch(chatId, msgId, (m) => ({
                  ...m,
                  text: r.text,
                  status: 'done',
                  card: r.card,
                  suggestions: r.suggestions,
                  took: ((Date.now() - t0) / 1000).toFixed(1),
                }));
                active.current = null;
                setBusy(false);
              } else {
                patch(chatId, msgId, (m) => ({ ...m, text: slice }));
              }
            }, 22);
            timers.current.push(tick);
          });
        }
      } catch (err: any) {
        console.error('Erro na execução do agente:', err);
        patch(chatId, msgId, (m) => ({
          ...m,
          text: 'Ocorreu uma instabilidade ao processar sua pergunta. Por favor, tente enviar novamente.',
          status: 'done',
          took: ((Date.now() - t0) / 1000).toFixed(1),
        }));
        active.current = null;
        setBusy(false);
      }
    },
    [model, patch],
  );

  const stop = useCallback(() => {
    clearTimers();
    const a = active.current;
    if (a) {
      patch(a.chatId, a.msgId, (m) => ({ ...m, status: 'stopped', steps: m.steps?.map((s) => ({ ...s, done: true })) }));
      active.current = null;
    }
    setBusy(false);
  }, [patch]);

  const send = useCallback(
    (raw: string) => {
      let text = raw.trim();
      if ((!text && files.length === 0) || busy) return;
      if (!text && files.length > 0) {
        text = 'Por favor, analise a imagem e as informações que anexei.';
      }
      const userMsg: Msg = { id: nextId(), role: 'user', text, attachments: files.length ? files : undefined };
      const agentMsg: Msg = { id: nextId(), role: 'agent', text: '', steps: [], status: 'thinking', prompt: text };
      const history = msgs.map((m) => ({ role: m.role, text: m.text }));

      let chatId = activeId;
      if (chatId === null) {
        const newId = nextId();
        chatId = newId;
        const title = text.length > 40 ? `${text.slice(0, 40)}…` : text;
        setChats((prev) => [{ id: newId, title, updatedAt: Date.now(), msgs: [userMsg, agentMsg] }, ...prev]);
        setActiveId(newId);
      } else {
        const id = chatId;
        setChats((prev) => prev.map((c) => (c.id === id ? { ...c, updatedAt: Date.now(), msgs: [...c.msgs, userMsg, agentMsg] } : c)));
      }

      stick.current = true;
      setInput('');
      setFiles([]);
      setPlusOpen(false);
      run(chatId, agentMsg.id, text, history, userMsg.attachments);
    },
    [activeId, busy, files, msgs, run],
  );

  const regenerate = (agentId: number) => {
    if (!chat || busy) return;
    const idx = chat.msgs.findIndex((m) => m.id === agentId);
    const prompt = chat.msgs[idx]?.prompt;
    if (!prompt) return;
    const history = chat.msgs
      .slice(0, idx)
      .map((m) => ({ role: m.role, text: m.text }));
    const attachments = chat.msgs[idx - 1]?.attachments;
    patch(chat.id, agentId, (m) => ({ ...m, text: '', steps: [], card: undefined, suggestions: undefined, status: 'thinking', feedback: undefined, took: undefined }));
    stick.current = true;
    run(chat.id, agentId, prompt, history, attachments);
  };

  const newChat = useCallback(() => {
    clearTimers();
    active.current = null;
    setBusy(false);
    setActiveId(null);
    setInput('');
    setFiles([]);
    stick.current = true;
    setTimeout(() => taRef.current?.focus(), 30);
  }, []);

  const removeChat = (id: number) => {
    setChats((prev) => prev.filter((c) => c.id !== id));
    if (id === activeId) newChat();
  };

  /* external triggers (topbar "Nova conversa", prompt library "Usar no agente") */
  useEffect(() => {
    if (startNew) {
      newChat();
      onStarted?.();
    }
  }, [startNew, newChat, onStarted]);

  useEffect(() => {
    if (seed) {
      setInput(seed);
      onSeedUsed?.();
      setTimeout(() => taRef.current?.focus(), 30);
    }
  }, [seed, onSeedUsed]);

  /* ───── composer: slash commands, files, voice ───── */

  const slashOpen = input.startsWith('/') && !input.includes(' ');
  const slashList = useMemo(() => (slashOpen ? COMMANDS.filter((c) => c.cmd.startsWith(input.toLowerCase())) : []), [slashOpen, input]);
  useEffect(() => setSlashIdx(0), [input]);

  const pick = (template: string) => {
    setInput(template);
    setPlusOpen(false);
    setTimeout(() => {
      const el = taRef.current;
      el?.focus();
      el?.setSelectionRange(template.length, template.length);
    }, 10);
  };

  const toggleMic = () => {
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

  const copyMsg = async (m: Msg) => {
    if (await copyText(m.text)) {
      setCopiedId(m.id);
      setTimeout(() => setCopiedId((c) => (c === m.id ? null : c)), 1500);
    }
  };

  const lastAgentId = [...msgs].reverse().find((m) => m.role === 'agent')?.id;
  const currentModel = MODELS.find((m) => m.id === model)!;
  const empty = msgs.length === 0;

  /* ───────────────────────── render ───────────────────────── */

  return (
    <div className="mvz-fade-up relative flex h-[calc(100dvh-60px-2rem)] min-h-[520px] gap-4 md:h-[calc(100dvh-60px-3rem)]">
      {/* ── history ── */}
      {histOpen && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setHistOpen(false)} />}
      <aside
        className={`mvz-card z-40 w-[264px] shrink-0 flex-col overflow-hidden ${
          histOpen ? 'absolute inset-y-0 left-0 flex' : 'hidden'
        } lg:static lg:flex`}
      >
        <div className="p-3">
          <button
            onClick={() => {
              newChat();
              setHistOpen(false);
            }}
            className="mvz-btn-grad flex h-10 w-full items-center justify-center gap-2 text-[12.5px]"
          >
            <Plus size={15} /> Nova conversa
          </button>
        </div>
        <div className="px-4 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--mvz-dim)]">Histórico</div>
        <div className="mvz-scroll flex-1 space-y-0.5 overflow-y-auto px-2 pb-3">
          {sorted.length === 0 && <p className="px-3 py-4 text-[12px] leading-relaxed text-[var(--mvz-dim)]">Suas conversas aparecerão aqui.</p>}
          {sorted.map((c) => (
            <div key={c.id} className={`group flex items-center rounded-lg transition ${c.id === activeId ? 'bg-[rgba(212,175,55,0.1)]' : 'hover:bg-white/[0.04]'}`}>
              <button
                onClick={() => {
                  if (busy) stop();
                  setActiveId(c.id);
                  setHistOpen(false);
                  stick.current = true;
                }}
                className={`min-w-0 flex-1 truncate px-3 py-2.5 text-left text-[12.5px] ${c.id === activeId ? 'font-semibold text-[var(--mvz-gold-light)]' : 'text-[var(--mvz-muted)] group-hover:text-white'}`}
              >
                {c.title}
              </button>
              <button
                onClick={() => removeChat(c.id)}
                aria-label="Excluir conversa"
                className="mr-1.5 hidden h-7 w-7 items-center justify-center rounded-md text-[var(--mvz-dim)] hover:text-[var(--mvz-pink)] group-hover:flex"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* ── chat ── */}
      <section className="mvz-card relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(ellipse_at_50%_-30%,rgba(212,175,55,0.16),transparent_70%)]" />

        {/* header */}
        <header className="relative z-20 flex h-14 shrink-0 items-center gap-3 border-b border-[var(--mvz-line)] px-4">
          <button onClick={() => setHistOpen(true)} className="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 hover:bg-white/5 lg:hidden" aria-label="Histórico">
            <History size={16} />
          </button>

          <div className="relative">
            <button onClick={() => setModelOpen((o) => !o)} className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13.5px] font-bold hover:bg-white/[0.05]">
              {currentModel.name}
              <ChevronDown size={14} className={`text-[var(--mvz-dim)] transition ${modelOpen ? 'rotate-180' : ''}`} />
            </button>
            {modelOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setModelOpen(false)} />
                <div className="mvz-pop absolute left-0 top-full z-20 mt-1.5 w-[270px] overflow-hidden rounded-xl border border-[var(--mvz-line-strong)] bg-[#0d0c0a] p-1.5 shadow-[0_20px_60px_rgba(0,0,0,0.7)]">
                  {MODELS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setModel(m.id);
                        setModelOpen(false);
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-white/[0.05]"
                    >
                      <div className="flex-1">
                        <div className="text-[13px] font-semibold">{m.name}</div>
                        <div className="text-[11px] text-[var(--mvz-dim)]">{m.desc}</div>
                      </div>
                      {m.id === model && <Check size={14} className="text-[var(--mvz-gold)]" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Badge & Botão de Configuração de IA */}
          <button
            onClick={() => setAiSettingsOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-[var(--mvz-line)] bg-white/[0.03] px-3 py-1.5 text-[11.5px] font-bold text-white/90 hover:border-[var(--mvz-gold)] hover:bg-[rgba(212,175,55,0.08)] transition group shadow-sm"
            title="Configurações do Motor de IA (Google Gemini, OpenAI, Groq, DeepSeek ou Nativo)"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <span className="hidden sm:inline">
              {aiConfig.provider === 'native'
                ? 'IA: Motor Orbiex (Nativo)'
                : `IA: ${aiConfig.provider.toUpperCase()} (${aiConfig.model})`}
            </span>
            <span className="sm:hidden">
              {aiConfig.provider === 'native' ? 'IA Nativa' : aiConfig.provider.toUpperCase()}
            </span>
            <Sliders size={12} className="text-[var(--mvz-gold)] group-hover:rotate-45 transition-transform" />
          </button>

          <span className="hidden min-w-0 flex-1 truncate text-center text-[12.5px] text-[var(--mvz-dim)] sm:block">{chat?.title ?? 'Nova conversa'}</span>

          <div className="ml-auto flex items-center gap-2 text-[11px] font-semibold text-[var(--mvz-muted)]">
            <span className={`h-1.5 w-1.5 rounded-full ${busy ? 'mvz-dot bg-[var(--mvz-gold)]' : 'bg-[var(--mvz-green)]'}`} />
            {busy ? 'Trabalhando…' : 'Online'}
          </div>
        </header>
        {busy && (
          <div className="relative z-10 h-px w-full overflow-hidden bg-[var(--mvz-line)]">
            <div className="mvz-sweep absolute inset-0" />
          </div>
        )}

        {/* messages */}
        <div ref={scroller} onScroll={onScroll} className="mvz-scroll relative flex-1 overflow-y-auto px-4 py-6 sm:px-8">
          {empty ? (
            <div className="mx-auto flex min-h-full max-w-2xl flex-col items-center justify-center py-6 text-center">
              <div className="relative mb-7 h-24 w-24">
                <div className="mvz-orb mvz-orb-live absolute inset-3 rounded-full" />
                <div className="mvz-ring-spin absolute inset-0 rounded-full" />
              </div>
              <h2 className="text-[28px] font-extrabold leading-tight tracking-tight sm:text-[32px]">
                {greeting()}, {displayName}.
                <br />
                <span className="mvz-grad-text">O que vamos criar hoje?</span>
              </h2>
              <p className="mt-3 max-w-md text-[13.5px] leading-relaxed text-[var(--mvz-muted)]">
                Converse comigo como em um chat. Eu processo suas tarefas e mostro cada passo.
              </p>
              <div className="mt-8 grid w-full gap-3 sm:grid-cols-2">
                {STARTERS.map((s) => {
                  const Icon = s.icon;
                  return (
                    <button
                      key={s.title}
                      onClick={() => send(s.text)}
                      className="group flex items-start gap-3 rounded-xl border border-[var(--mvz-line)] bg-white/[0.02] p-4 text-left transition hover:-translate-y-0.5 hover:border-[var(--mvz-line-strong)] hover:bg-[rgba(212,175,55,0.05)]"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[rgba(212,175,55,0.1)] text-[var(--mvz-gold)]">
                        <Icon size={15} />
                      </span>
                      <span>
                        <span className="block text-[13px] font-semibold">{s.title}</span>
                        <span className="mt-0.5 block text-[12px] leading-snug text-[var(--mvz-dim)] group-hover:text-[var(--mvz-muted)]">{s.text}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-6 text-[11.5px] text-[var(--mvz-dim)]">
                Dica: digite <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10.5px] text-[var(--mvz-gold-light)]">/</kbd> para comandos rápidos
              </p>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-8">
              {msgs.map((m) =>
                m.role === 'user' ? (
                  <div key={m.id} className="mvz-msg-in flex flex-col items-end gap-1.5">
                    {m.attachments?.map((att, idx) => {
                      const isImage =
                        att.dataUrl?.startsWith('data:image/') ||
                        att.type?.startsWith('image/') ||
                        /\.(png|jpe?g|webp|gif)$/i.test(att.name);
                      return isImage && att.dataUrl ? (
                        <div
                          key={idx}
                          className="overflow-hidden rounded-xl border border-[var(--mvz-line-strong)] bg-black/60 shadow-lg my-1"
                        >
                          <img
                            src={att.dataUrl}
                            alt={att.name}
                            className="max-h-60 max-w-xs object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                            onClick={() => window.open(att.dataUrl, '_blank')}
                          />
                          <div className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-[var(--mvz-gold-light)] bg-black/80 border-t border-white/10">
                            <Paperclip size={11} />
                            <span className="truncate max-w-[200px]">{att.name}</span>
                          </div>
                        </div>
                      ) : (
                        <span
                          key={idx}
                          className="flex items-center gap-1.5 rounded-lg border border-[var(--mvz-line)] bg-white/[0.03] px-2.5 py-1 text-[11.5px] text-[var(--mvz-muted)]"
                        >
                          <Paperclip size={11} /> {att.name}
                        </span>
                      );
                    })}
                    <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md border border-[rgba(212,175,55,0.22)] bg-[rgba(212,175,55,0.09)] px-4 py-3 text-[14px] leading-relaxed text-[#fff7df]">
                      {m.text}
                    </div>
                  </div>
                ) : (
                  <div key={m.id} className="mvz-msg-in flex gap-3.5">
                    <AgentAvatar live={m.status === 'thinking' || m.status === 'streaming'} />
                    <div className="min-w-0 flex-1 pt-0.5">
                      <div className="mb-1.5 text-[12px] font-bold text-[var(--mvz-gold-light)]">Orbiex</div>
                      <StepsView m={m} />
                      {m.status === 'thinking' && !m.text && (!m.steps || m.steps.length === 0) && (
                        <div className="py-2">
                          <ThinkingDots />
                        </div>
                      )}
                      {m.text && <Rich text={m.text} streaming={m.status === 'streaming'} />}
                      {m.status === 'stopped' && <p className="mt-2 text-[11.5px] italic text-[var(--mvz-dim)]">Resposta interrompida.</p>}
                      {m.card && <ResultCard card={m.card} onAsk={send} />}

                      {(m.status === 'done' || m.status === 'stopped') && (
                        <div className="mt-2 flex items-center gap-0.5">
                          <IconBtn onClick={() => copyMsg(m)} label="Copiar">
                            {copiedId === m.id ? <Check size={14} className="text-[var(--mvz-green)]" /> : <Copy size={14} />}
                          </IconBtn>
                          <IconBtn onClick={() => patch(chat!.id, m.id, (x) => ({ ...x, feedback: x.feedback === 'up' ? undefined : 'up' }))} label="Gostei" active={m.feedback === 'up'}>
                            <ThumbsUp size={14} />
                          </IconBtn>
                          <IconBtn onClick={() => patch(chat!.id, m.id, (x) => ({ ...x, feedback: x.feedback === 'down' ? undefined : 'down' }))} label="Não gostei" active={m.feedback === 'down'}>
                            <ThumbsDown size={14} />
                          </IconBtn>
                          {m.id === lastAgentId && (
                            <IconBtn onClick={() => regenerate(m.id)} label="Gerar novamente">
                              <RefreshCw size={14} />
                            </IconBtn>
                          )}
                        </div>
                      )}

                      {m.status === 'done' && m.id === lastAgentId && m.suggestions && m.suggestions.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {m.suggestions.map((s) => (
                            <button
                              key={s}
                              onClick={() => send(s)}
                              className="mvz-msg-in rounded-full border border-[var(--mvz-line-strong)] px-3.5 py-1.5 text-[12px] font-medium text-[var(--mvz-gold-light)] transition hover:bg-[rgba(212,175,55,0.1)]"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </div>

        {showJump && !empty && (
          <button
            onClick={jump}
            aria-label="Ir para o fim"
            className="mvz-pop absolute bottom-[132px] left-1/2 z-20 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border border-[var(--mvz-line-strong)] bg-[#0d0c0a] text-[var(--mvz-gold)] shadow-lg hover:bg-[#15120d]"
          >
            <ArrowDown size={15} />
          </button>
        )}

        {/* composer */}
        <div className="relative z-20 px-4 pb-4 pt-2 sm:px-8">
          <div className="relative mx-auto max-w-3xl">
            {slashList.length > 0 && (
              <div className="mvz-pop absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-xl border border-[var(--mvz-line-strong)] bg-[#0d0c0a] p-1.5 shadow-[0_20px_60px_rgba(0,0,0,0.7)]">
                <div className="px-3 pb-1 pt-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--mvz-dim)]">Comandos</div>
                {slashList.map((c, i) => {
                  const Icon = c.icon;
                  return (
                    <button
                      key={c.cmd}
                      onMouseEnter={() => setSlashIdx(i)}
                      onClick={() => pick(c.template)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[13px] ${i === slashIdx ? 'bg-[rgba(212,175,55,0.1)]' : ''}`}
                    >
                      <Icon size={14} className="text-[var(--mvz-gold)]" />
                      <span className="font-mono text-[12px] font-semibold text-[var(--mvz-gold-light)]">{c.cmd}</span>
                      <span className="text-[var(--mvz-muted)]">{c.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {plusOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setPlusOpen(false)} />
                <div className="mvz-pop absolute bottom-full left-0 z-20 mb-2 w-[280px] overflow-hidden rounded-xl border border-[var(--mvz-line-strong)] bg-[#0d0c0a] p-1.5 shadow-[0_20px_60px_rgba(0,0,0,0.7)]">
                  <button
                    onClick={() => {
                      fileRef.current?.click();
                      setPlusOpen(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] hover:bg-white/[0.05]"
                  >
                    <Paperclip size={14} className="text-[var(--mvz-gold)]" /> Anexar arquivo
                  </button>
                  <div className="my-1 h-px bg-[var(--mvz-line)]" />
                  {COMMANDS.map((c) => {
                    const Icon = c.icon;
                    return (
                      <button key={c.cmd} onClick={() => pick(c.template)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[13px] hover:bg-white/[0.05]">
                        <Icon size={14} className="text-[var(--mvz-gold)]" />
                        <span className="text-[var(--mvz-muted)]">{c.label}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            <input
              ref={fileRef}
              type="file"
              multiple
              accept="image/*,.pdf,.txt,.csv,.json"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) handleAddFiles(e.target.files);
                e.target.value = '';
              }}
            />

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (busy) stop();
                else send(input);
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  handleAddFiles(e.dataTransfer.files);
                }
              }}
              className="mvz-input rounded-2xl p-2.5 shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
              style={{ background: 'rgba(14,12,9,0.9)' }}
            >
              {files.length > 0 && (
                <div className="mb-2.5 flex flex-wrap gap-2 px-1">
                  {files.map((f, i) => {
                    const isImg =
                      f.dataUrl?.startsWith('data:image/') ||
                      f.type?.startsWith('image/') ||
                      /\.(png|jpe?g|webp|gif)$/i.test(f.name);
                    return (
                      <div
                        key={`${f.name}-${i}`}
                        className="group relative flex items-center gap-2 rounded-xl border border-[var(--mvz-line-strong)] bg-black/70 p-1.5 pr-2.5 text-[11.5px] text-[var(--mvz-gold-light)] shadow-md"
                      >
                        {isImg && f.dataUrl ? (
                          <img
                            src={f.dataUrl}
                            alt={f.name}
                            className="h-9 w-9 rounded-lg object-cover border border-white/10"
                          />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[rgba(212,175,55,0.1)] text-[var(--mvz-gold)]">
                            <Paperclip size={15} />
                          </div>
                        )}
                        <span className="max-w-[140px] truncate font-medium text-white/90">
                          {f.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => setFiles((p) => p.filter((_, k) => k !== i))}
                          aria-label={`Remover ${f.name}`}
                          className="ml-1 rounded-full p-1 text-white/50 hover:bg-white/10 hover:text-white transition"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="flex items-end gap-1.5">
                <button
                  type="button"
                  onClick={() => setPlusOpen((o) => !o)}
                  aria-label="Ações e anexos"
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition hover:bg-white/[0.07] ${plusOpen ? 'rotate-45 text-[var(--mvz-gold)]' : 'text-white/60'}`}
                >
                  <Plus size={18} />
                </button>
                <textarea
                  ref={taRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onPaste={(e) => {
                    const items = e.clipboardData.items;
                    const imageFiles: File[] = [];
                    for (let i = 0; i < items.length; i++) {
                      if (items[i].type.indexOf('image') !== -1) {
                        const file = items[i].getAsFile();
                        if (file) imageFiles.push(file);
                      }
                    }
                    if (imageFiles.length > 0) {
                      handleAddFiles(imageFiles);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (slashList.length > 0) {
                      if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        setSlashIdx((i) => (i + 1) % slashList.length);
                        return;
                      }
                      if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        setSlashIdx((i) => (i - 1 + slashList.length) % slashList.length);
                        return;
                      }
                      if (e.key === 'Enter' || e.key === 'Tab') {
                        e.preventDefault();
                        pick(slashList[slashIdx].template);
                        return;
                      }
                      if (e.key === 'Escape') {
                        setInput('');
                        return;
                      }
                    }
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (!busy) send(input);
                    }
                  }}
                  rows={1}
                  placeholder={listening ? 'Ouvindo… fale agora' : 'Pergunte qualquer coisa ao Orbiex…'}
                  className="max-h-[200px] min-h-[36px] flex-1 resize-none bg-transparent px-1.5 py-2 text-[14px] leading-relaxed outline-none placeholder:text-[var(--mvz-dim)]"
                />
                {SpeechRec && (
                  <button
                    type="button"
                    onClick={toggleMic}
                    aria-label={listening ? 'Parar de ouvir' : 'Falar'}
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition hover:bg-white/[0.07] ${listening ? 'mvz-listening bg-[rgba(212,175,55,0.15)] text-[var(--mvz-gold)]' : 'text-white/60'}`}
                  >
                    <Mic size={16} />
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!busy && !input.trim()}
                  aria-label={busy ? 'Parar' : 'Enviar'}
                  className="mvz-btn-grad flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                >
                  {busy ? <Square size={13} fill="currentColor" /> : <ArrowUp size={17} strokeWidth={2.5} />}
                </button>
              </div>
            </form>
            <p className="mt-2 text-center text-[10.5px] text-[var(--mvz-dim)]">
              Orbiex Inteligência Artificial · E-commerce & TikTok Shop · <span className="text-[var(--mvz-muted)]">Enter</span> envia · <span className="text-[var(--mvz-muted)]">Shift+Enter</span> nova linha
            </p>
          </div>
        </div>
      </section>

      {/* Modal de Configuração de IA */}
      <AISettingsModal
        open={aiSettingsOpen}
        onClose={() => setAiSettingsOpen(false)}
        onConfigSaved={(cfg) => setAiConfig(cfg)}
      />
    </div>
  );
}

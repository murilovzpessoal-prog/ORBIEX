import { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, MicOff, X } from 'lucide-react';
import { generateAIReply } from '../aiService';

/* ───────────────────────────────────────────────────────────────
   ORBIEX VOICE — Modo de conversa por voz em tempo real
   Escuta (Web Speech API) → pensa (Gemini /api/ai-chat) →
   fala (Gemini TTS /api/tts, voz grave estilo assistente de IA)
   ─────────────────────────────────────────────────────────────── */

type Phase = 'starting' | 'listening' | 'thinking' | 'speaking' | 'paused' | 'error';

interface Turn {
  role: 'user' | 'agent';
  text: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  history: Turn[];
  onTurn: (userText: string, agentText: string) => void;
  userName?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SpeechRec: any =
  typeof window !== 'undefined'
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : undefined;

const PHASE_LABEL: Record<Phase, string> = {
  starting: 'Inicializando sistemas',
  listening: 'Ouvindo',
  thinking: 'Processando',
  speaking: 'Respondendo',
  paused: 'Microfone pausado',
  error: 'Atenção',
};

/* ───────── helpers ───────── */

function toSpeech(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/^\s{0,3}#{1,6}\s*/gm, '')
    .replace(/^\s*[-*•>]\s+/gm, '')
    .replace(/^\s*\d+[.)]\s+/gm, '')
    .replace(/[*_#|~]/g, '')
    .replace(/\s*\n+\s*/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** Divide em blocos: o 1º curto (começa a falar rápido), os demais maiores. */
function chunkSentences(text: string): string[] {
  const sentences = text.match(/[^.!?…]+[.!?…]+["')\]]*|[^.!?…]+$/g)?.map((s) => s.trim()).filter(Boolean) ?? [text];
  const chunks: string[] = [];
  let buf = '';
  for (const s of sentences) {
    const limit = chunks.length === 0 ? 120 : 280;
    if (!buf) buf = s;
    else if ((buf + ' ' + s).length <= limit) buf += ' ' + s;
    else {
      chunks.push(buf);
      buf = s;
    }
    if (chunks.length === 0 && buf.length >= 40) {
      chunks.push(buf);
      buf = '';
    }
  }
  if (buf) chunks.push(buf);
  return chunks;
}

function rms(analyser: AnalyserNode | null, buf: Uint8Array<ArrayBuffer> | null): number {
  if (!analyser || !buf) return 0;
  analyser.getByteTimeDomainData(buf);
  let sum = 0;
  for (let i = 0; i < buf.length; i++) {
    const v = (buf[i] - 128) / 128;
    sum += v * v;
  }
  return Math.min(1, Math.sqrt(sum / buf.length) * 3.2);
}

function pickFallbackVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis?.getVoices?.() ?? [];
  const pt = voices.filter((v) => v.lang?.toLowerCase().startsWith('pt'));
  return (
    pt.find((v) => /felipe|daniel|ricardo|antonio|ant[oô]nio|male|masculin/i.test(v.name)) ||
    pt.find((v) => /br/i.test(v.lang)) ||
    pt[0] ||
    null
  );
}

/* ───────── component ───────── */

export function VoiceMode({ open, onClose, history, onTurn, userName }: Props) {
  const [phase, setPhase] = useState<Phase>('starting');
  const [caption, setCaption] = useState('');
  const [reply, setReply] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const phaseRef = useRef<Phase>('starting');
  const turnRef = useRef(0);
  const openRef = useRef(false);
  const histRef = useRef<Turn[]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const outAnalyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recRef = useRef<any>(null);
  const abortRef = useRef<AbortController | null>(null);
  const fakeLevelRef = useRef(0);

  const onTurnRef = useRef(onTurn);
  onTurnRef.current = onTurn;

  const go = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  /* ───── parar tudo que está tocando / ouvindo ───── */
  const haltAudio = useCallback(() => {
    try {
      sourceRef.current?.stop();
    } catch {
      /* noop */
    }
    sourceRef.current = null;
    window.speechSynthesis?.cancel();
    fakeLevelRef.current = 0;
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const stopRecognition = useCallback(() => {
    const rec = recRef.current;
    recRef.current = null;
    if (rec) {
      rec.onresult = null;
      rec.onend = null;
      rec.onerror = null;
      try {
        rec.abort();
      } catch {
        /* noop */
      }
    }
  }, []);

  /* ───── FALA: TTS Gemini em pipeline por frases ───── */
  const fetchTTS = useCallback(async (text: string, signal: AbortSignal): Promise<AudioBuffer | null> => {
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: 'Charon' }),
        signal,
      });
      if (!res.ok || !(res.headers.get('content-type') || '').includes('audio')) return null;
      const arr = await res.arrayBuffer();
      const ctx = ctxRef.current;
      if (!ctx) return null;
      return await ctx.decodeAudioData(arr);
    } catch {
      return null;
    }
  }, []);

  const playBuffer = useCallback((buffer: AudioBuffer, myTurn: number) => {
    return new Promise<void>((resolve) => {
      const ctx = ctxRef.current;
      if (!ctx || myTurn !== turnRef.current) return resolve();
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.connect(outAnalyserRef.current ?? ctx.destination);
      src.onended = () => resolve();
      sourceRef.current = src;
      src.start();
    });
  }, []);

  const speakFallback = useCallback((text: string, myTurn: number) => {
    return new Promise<void>((resolve) => {
      if (!window.speechSynthesis || myTurn !== turnRef.current) return resolve();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'pt-BR';
      const v = pickFallbackVoice();
      if (v) u.voice = v;
      u.pitch = 0.78;
      u.rate = 1.02;
      let t: number | undefined;
      u.onstart = () => {
        t = window.setInterval(() => {
          fakeLevelRef.current = 0.25 + Math.random() * 0.45;
        }, 90);
      };
      const done = () => {
        if (t) clearInterval(t);
        fakeLevelRef.current = 0;
        resolve();
      };
      u.onend = done;
      u.onerror = done;
      window.speechSynthesis.speak(u);
    });
  }, []);

  // listen é definido abaixo; usamos ref para evitar dependência circular
  const listenRef = useRef<() => void>(() => {});

  const speak = useCallback(
    async (text: string, myTurn: number) => {
      const spoken = toSpeech(text);
      if (!spoken) return listenRef.current();
      go('speaking');
      await ctxRef.current?.resume().catch(() => {});

      const controller = new AbortController();
      abortRef.current = controller;
      const chunks = chunkSentences(spoken);
      // dispara todos em paralelo, toca em ordem → latência mínima entre frases
      const pending = chunks.map((c) => fetchTTS(c, controller.signal));

      for (let i = 0; i < chunks.length; i++) {
        if (myTurn !== turnRef.current) return;
        const buffer = await pending[i];
        if (myTurn !== turnRef.current) return;
        if (buffer) await playBuffer(buffer, myTurn);
        else await speakFallback(chunks[i], myTurn);
      }

      if (myTurn === turnRef.current && openRef.current) listenRef.current();
    },
    [fetchTTS, go, playBuffer, speakFallback],
  );

  /* ───── PENSA: envia para a IA ───── */
  const think = useCallback(
    async (userText: string) => {
      const myTurn = ++turnRef.current;
      go('thinking');
      setReply('');
      const hist = histRef.current.slice(-10);

      let answer = '';
      try {
        const controller = new AbortController();
        abortRef.current = controller;
        const res = await fetch('/api/ai-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: userText,
            messages: [...hist, { role: 'user', text: userText }].map((m) => ({ role: m.role, content: m.text })),
            mode: 'fast',
            voice: true,
          }),
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.reply) answer = String(data.reply);
        }
      } catch {
        /* fallback abaixo */
      }
      if (myTurn !== turnRef.current) return;

      if (!answer) {
        try {
          const r = await generateAIReply(userText, hist, 'fast');
          answer = r.text;
        } catch {
          answer = 'Tive uma pequena instabilidade na conexão. Pode repetir, por favor?';
        }
      }
      if (myTurn !== turnRef.current) return;

      const clean = toSpeech(answer);
      histRef.current = [...histRef.current, { role: 'user', text: userText }, { role: 'agent', text: answer }];
      onTurnRef.current(userText, answer);
      setReply(clean);
      await speak(answer, myTurn);
    },
    [go, speak],
  );

  /* ───── OUVE: reconhecimento de voz ───── */
  const listen = useCallback(() => {
    if (!openRef.current) return;
    if (!SpeechRec) {
      setErrorMsg('Seu navegador não suporta conversa por voz. Use o Google Chrome, Edge ou Safari atualizado.');
      go('error');
      return;
    }
    stopRecognition();
    ctxRef.current?.resume().catch(() => {});

    const rec = new SpeechRec();
    rec.lang = 'pt-BR';
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;

    let finalText = '';
    let interim = '';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += t;
        else interim += t;
      }
      setCaption((finalText + ' ' + interim).trim());
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onerror = (e: any) => {
      if (e?.error === 'not-allowed' || e?.error === 'service-not-allowed') {
        recRef.current = null;
        setErrorMsg('Permita o acesso ao microfone no navegador (ícone de cadeado na barra de endereço) e tente novamente.');
        go('error');
      }
    };
    rec.onend = () => {
      if (recRef.current !== rec) return;
      recRef.current = null;
      const said = (finalText || interim).trim();
      if (!openRef.current || phaseRef.current !== 'listening') return;
      if (said.length > 1) think(said);
      else listen(); // silêncio: continua ouvindo
    };

    recRef.current = rec;
    setCaption('');
    go('listening');
    try {
      rec.start();
    } catch {
      /* já iniciado */
    }
  }, [go, stopRecognition, think]);

  listenRef.current = listen;

  /* ───── ciclo de vida: abrir / fechar ───── */
  useEffect(() => {
    if (!open) return;
    openRef.current = true;
    histRef.current = history.filter((h) => h.text).slice(-10);
    setReply('');
    setCaption('');
    setErrorMsg('');
    go('starting');

    let cancelled = false;
    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const AC = window.AudioContext || (window as any).webkitAudioContext;
        const ctx: AudioContext = new AC();
        ctxRef.current = ctx;
        const out = ctx.createAnalyser();
        out.fftSize = 1024;
        out.connect(ctx.destination);
        outAnalyserRef.current = out;
        await ctx.resume().catch(() => {});

        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
          });
          if (cancelled) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          micStreamRef.current = stream;
          const mic = ctx.createAnalyser();
          mic.fftSize = 1024;
          ctx.createMediaStreamSource(stream).connect(mic);
          micAnalyserRef.current = mic;
        } catch {
          setErrorMsg('Não consegui acessar seu microfone. Permita o acesso no navegador e tente novamente.');
          go('error');
          return;
        }
      } catch {
        /* sem Web Audio: segue apenas com reconhecimento */
      }
      if (!cancelled) listen();
    })();

    return () => {
      cancelled = true;
      openRef.current = false;
      turnRef.current++;
      stopRecognition();
      haltAudio();
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
      micAnalyserRef.current = null;
      outAnalyserRef.current = null;
      ctxRef.current?.close().catch(() => {});
      ctxRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  /* ESC fecha */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  /* ───── animação da esfera (canvas) ───── */
  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const g = canvas.getContext('2d');
    if (!g) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const SIZE = 340;
    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
    g.scale(dpr, dpr);

    const micBuf = new Uint8Array(new ArrayBuffer(1024));
    const outBuf = new Uint8Array(new ArrayBuffer(1024));
    let level = 0;
    let raf = 0;
    const t0 = performance.now();
    let spin = 0;

    const draw = () => {
      const t = (performance.now() - t0) / 1000;
      const p = phaseRef.current;

      let target = 0;
      if (p === 'listening') target = rms(micAnalyserRef.current, micBuf);
      else if (p === 'speaking') target = Math.max(rms(outAnalyserRef.current, outBuf), fakeLevelRef.current);
      level += (target - level) * (target > level ? 0.35 : 0.08);

      const cx = SIZE / 2;
      const cy = SIZE / 2;
      g.clearRect(0, 0, SIZE, SIZE);

      // brilho de fundo
      const glowR = 150 + level * 30;
      const glow = g.createRadialGradient(cx, cy, 20, cx, cy, glowR);
      const glowA = p === 'paused' || p === 'error' ? 0.12 : 0.28 + level * 0.35;
      glow.addColorStop(0, `rgba(212,175,55,${glowA})`);
      glow.addColorStop(1, 'rgba(212,175,55,0)');
      g.fillStyle = glow;
      g.fillRect(0, 0, SIZE, SIZE);

      // anéis HUD rotativos
      spin += p === 'thinking' ? 0.045 : p === 'starting' ? 0.03 : 0.006 + level * 0.02;
      const ring = (r: number, segs: number, gap: number, width: number, alpha: number, dir: number) => {
        g.save();
        g.translate(cx, cy);
        g.rotate(spin * dir);
        g.strokeStyle = `rgba(244,215,122,${alpha})`;
        g.lineWidth = width;
        const step = (Math.PI * 2) / segs;
        for (let i = 0; i < segs; i++) {
          g.beginPath();
          g.arc(0, 0, r, i * step, i * step + step * (1 - gap));
          g.stroke();
        }
        g.restore();
      };
      const hudA = p === 'paused' || p === 'error' ? 0.12 : 0.35;
      ring(150, 3, 0.18, 1.2, hudA * 0.9, 1);
      ring(140, 48, 0.55, 3, hudA * 0.55, -0.6);
      if (p === 'thinking' || p === 'starting') ring(128, 6, 0.5, 2, 0.7, 2.2);

      // esfera orgânica
      const base = p === 'paused' || p === 'error' ? 78 : 88;
      const breath = Math.sin(t * 1.6) * 3;
      const amp = p === 'thinking' ? 5 : 4 + level * 26;
      const N = 140;
      g.beginPath();
      for (let i = 0; i <= N; i++) {
        const a = (i / N) * Math.PI * 2;
        const n =
          Math.sin(a * 3 + t * 2.1) * 0.5 +
          Math.sin(a * 5 - t * 2.7) * 0.3 +
          Math.sin(a * 2 + t * 1.3) * 0.4;
        const r = base + breath + level * 22 + n * amp;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        if (i === 0) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
      g.closePath();
      const hx = cx - 25 + Math.cos(t * 0.8) * 12;
      const hy = cy - 30 + Math.sin(t * 0.9) * 12;
      const fill = g.createRadialGradient(hx, hy, 8, cx, cy, base + 40);
      if (p === 'paused' || p === 'error') {
        fill.addColorStop(0, '#8a8a8a');
        fill.addColorStop(0.6, '#3a3a3a');
        fill.addColorStop(1, '#151515');
      } else {
        fill.addColorStop(0, '#fff3c4');
        fill.addColorStop(0.35, '#f4d77a');
        fill.addColorStop(0.7, '#d4af37');
        fill.addColorStop(1, '#6b4d0e');
      }
      g.shadowColor = 'rgba(212,175,55,0.7)';
      g.shadowBlur = 30 + level * 40;
      g.fillStyle = fill;
      g.fill();
      g.shadowBlur = 0;

      // reflexo interno
      g.globalCompositeOperation = 'lighter';
      const sheen = g.createRadialGradient(hx, hy, 0, hx, hy, 60);
      sheen.addColorStop(0, 'rgba(255,255,255,0.35)');
      sheen.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = sheen;
      g.beginPath();
      g.arc(hx, hy, 60, 0, Math.PI * 2);
      g.fill();
      g.globalCompositeOperation = 'source-over';

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [open]);

  /* ───── ações do usuário ───── */
  const onOrbClick = () => {
    ctxRef.current?.resume().catch(() => {});
    const p = phaseRef.current;
    if (p === 'speaking' || p === 'thinking') {
      // interrompe e volta a ouvir
      turnRef.current++;
      haltAudio();
      listen();
    } else if (p === 'listening') {
      // finaliza a fala do usuário agora
      try {
        recRef.current?.stop();
      } catch {
        /* noop */
      }
    } else if (p === 'paused' || p === 'error') {
      setErrorMsg('');
      listen();
    }
  };

  const toggleMute = () => {
    if (phaseRef.current === 'paused') {
      listen();
    } else {
      turnRef.current++;
      stopRecognition();
      haltAudio();
      go('paused');
    }
  };

  if (!open) return null;

  const hint =
    phase === 'listening'
      ? 'Fale naturalmente. Toque na esfera para enviar.'
      : phase === 'speaking'
      ? 'Toque na esfera para interromper.'
      : phase === 'thinking'
      ? 'Analisando sua pergunta...'
      : phase === 'paused'
      ? 'Toque no microfone ou na esfera para continuar.'
      : phase === 'starting'
      ? 'Conectando ao núcleo de voz Orbiex...'
      : '';

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-between bg-[#050505]/[0.97] px-6 py-8 backdrop-blur-xl mvz-fade-up">
      {/* topo */}
      <div className="flex w-full max-w-xl items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span
            className={`h-2 w-2 rounded-full ${
              phase === 'error' || phase === 'paused' ? 'bg-white/30' : 'animate-pulse bg-[var(--mvz-gold)]'
            }`}
          />
          <span className="text-[12px] font-bold uppercase tracking-[0.22em] text-[var(--mvz-gold-light,#f4d77a)]">
            Orbiex Voice
          </span>
        </div>
        <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/45">{PHASE_LABEL[phase]}</span>
      </div>

      {/* esfera */}
      <div className="flex flex-1 flex-col items-center justify-center">
        <button
          type="button"
          onClick={onOrbClick}
          aria-label="Esfera de voz Orbiex"
          className="relative cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--mvz-gold)]"
        >
          <canvas ref={canvasRef} style={{ width: 340, height: 340 }} className="max-w-[86vw] max-h-[86vw]" />
        </button>

        <div className="mt-6 min-h-[96px] w-full max-w-xl text-center">
          {phase === 'error' ? (
            <p className="text-[14px] leading-relaxed text-rose-300/90">{errorMsg}</p>
          ) : phase === 'speaking' || (phase === 'thinking' && reply) ? (
            <p className="mx-auto max-h-[140px] overflow-y-auto text-[16px] leading-relaxed text-white/90">{reply}</p>
          ) : caption ? (
            <p className="text-[18px] font-medium leading-relaxed text-white">“{caption}”</p>
          ) : phase === 'listening' ? (
            <p className="text-[17px] text-white/70">
              {userName ? `Olá, ${userName}. ` : 'Olá. '}Pode falar, estou ouvindo.
            </p>
          ) : null}
          <p className="mt-3 text-[11.5px] text-white/35">{hint}</p>
        </div>
      </div>

      {/* controles */}
      <div className="flex items-center gap-6">
        <button
          type="button"
          onClick={toggleMute}
          aria-label={phase === 'paused' ? 'Ativar microfone' : 'Pausar microfone'}
          className={`flex h-14 w-14 items-center justify-center rounded-full border transition ${
            phase === 'paused'
              ? 'border-white/20 bg-white text-black'
              : 'border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.12]'
          }`}
        >
          {phase === 'paused' ? <MicOff size={22} /> : <Mic size={22} />}
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Encerrar conversa por voz"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/90 text-white transition hover:bg-rose-500"
        >
          <X size={24} />
        </button>
      </div>
    </div>
  );
}

/** Ícone de ondas sonoras (botão de abrir o modo voz) */
export function VoiceWaveIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round">
      <line x1="4" y1="10" x2="4" y2="14" />
      <line x1="8" y1="6" x2="8" y2="18" />
      <line x1="12" y1="3" x2="12" y2="21" />
      <line x1="16" y1="7" x2="16" y2="17" />
      <line x1="20" y1="10" x2="20" y2="14" />
    </svg>
  );
}

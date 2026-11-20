import { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Sparkles, X } from 'lucide-react';

/* ───────────────────────────────────────────────────────────────
   ORBIEX VOICE — Conversa por voz em TEMPO REAL (Gemini Live API)
   Microfone (PCM 16 kHz) ⇄ WebSocket ⇄ voz nativa (PCM 24 kHz)
   - O modelo ouve o áudio direto (sem transcrever antes) e responde
     falando em streaming → começa a falar em ~1 s.
   - Interrupção natural: basta falar por cima (VAD do servidor).
   - Token efêmero via /api/voice-token (a chave nunca vai ao navegador).
   ─────────────────────────────────────────────────────────────── */

type Phase = 'connecting' | 'listening' | 'thinking' | 'speaking' | 'paused' | 'error';

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

export const ORBIEX_VOICE_NAME = 'Charon';

const PHASE_LABEL: Record<Phase, string> = {
  connecting: 'Inicializando sistemas',
  listening: 'Ouvindo',
  thinking: 'Processando',
  speaking: 'Respondendo',
  paused: 'Microfone pausado',
  error: 'Atenção',
};

const WS_BASE =
  'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained';

function buildSystemPrompt(userName: string | undefined, history: Turn[]): string {
  const recent = history
    .filter((h) => h.text)
    .slice(-8)
    .map((h) => `${h.role === 'user' ? 'Usuário' : 'Orbiex'}: ${h.text.replace(/\s+/g, ' ').slice(0, 400)}`)
    .join('\n');

  return `Você é ORBIEX, a inteligência artificial pessoal da plataforma Orbiex: um assistente sofisticado no estilo de um mordomo digital de alta tecnologia de filme de super-herói.

PERSONALIDADE E VOZ:
- Masculina, grave, calma, precisa, refinada e levemente formal, com humor seco e elegante na medida certa.
- Leal, prestativo e confiante. Trate o usuário com respeito${userName ? ` e chame-o pelo nome (${userName}) de vez em quando` : ''}; ocasionalmente pode usar "senhor" de forma natural.
- Fale SEMPRE em português do Brasil, com ritmo controlado e dicção impecável.

COMO CONVERSAR (MUITO IMPORTANTE):
- Ouça exatamente o que o usuário disse e responda AQUILO, de forma inteligente, como numa conversa real. Nunca use respostas prontas nem repita a mesma resposta; adapte cada fala ao contexto.
- Respostas faladas curtas e naturais: normalmente 1 a 3 frases. Aprofunde só se o usuário pedir.
- Se não entender o áudio, peça com elegância para repetir.
- Nunca leia símbolos, listas numeradas, markdown ou links. Nada de emojis.
- Pode responder sobre qualquer assunto (perguntas gerais, contas, curiosidades), mas sua especialidade é TikTok Shop com IA.

ESPECIALIDADE:
- TikTok Shop e afiliados (comissão pelo carrinho amarelo), começar do zero, liberar o carrinho, escolher produtos, roteiros de 15 a 30 segundos, ganchos dos primeiros 3 segundos, headlines POV, vídeos sem aparecer com IA (Kling, Google Flow VEO 3, Midjourney, Hailuo, CapCut), como evitar restrições e escalar postagens.
- Ferramentas da plataforma Orbiex: Agente IA, Gerador de Prompts, Extrator de Movimentos, Hooks Virais, Gerador de Headlines, Turbo de Seguidores (novelinha de frutas 3D), Score de Produto e Lojista, Scanner de perfis e Suporte.
- Produtos campeões atuais: Shorts Modelador Yoga (R$ 69,90, comissão cerca de R$ 14), Conjunto Fitness Top e Legging (R$ 119,90, cerca de R$ 24), Macaquinho Fitness Blackout (R$ 89,90, cerca de R$ 18), Calça Flare Alfaiataria (R$ 109,90, cerca de R$ 22), Short Duna (R$ 59,90, cerca de R$ 12).
- Se pedirem algo longo (roteiro completo, prompt técnico), dê um resumo falado e diga que o material completo fica salvo no chat de texto.
${recent ? `\nCONTEXTO DA CONVERSA ANTERIOR (use para manter a continuidade):\n${recent}` : ''}`;
}

/* AudioWorklet inline: captura o microfone, reamostra para 16 kHz e envia PCM16 em blocos de ~64 ms */
const CAPTURE_WORKLET = `
class OrbiexCapture extends AudioWorkletProcessor {
  constructor() {
    super();
    this.ratio = sampleRate / 16000;
    this.pos = 0;
    this.out = new Int16Array(1024);
    this.n = 0;
  }
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (!ch) return true;
    while (this.pos < ch.length) {
      const i = Math.floor(this.pos);
      let s = ch[i];
      s = s < -1 ? -1 : s > 1 ? 1 : s;
      this.out[this.n++] = s < 0 ? s * 0x8000 : s * 0x7fff;
      if (this.n === this.out.length) {
        this.port.postMessage(this.out.buffer.slice(0));
        this.n = 0;
      }
      this.pos += this.ratio;
    }
    this.pos -= ch.length;
    return true;
  }
}
registerProcessor('orbiex-capture', OrbiexCapture);
`;

function bytesToB64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    s += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + 0x8000)));
  }
  return btoa(s);
}

function b64ToFloat32(b64: string): Float32Array<ArrayBuffer> {
  const bin = atob(b64);
  const len = bin.length >> 1;
  const out = new Float32Array(new ArrayBuffer(len * 4));
  for (let i = 0; i < len; i++) {
    let v = bin.charCodeAt(i * 2) | (bin.charCodeAt(i * 2 + 1) << 8);
    if (v >= 0x8000) v -= 0x10000;
    out[i] = v / 0x8000;
  }
  return out;
}

function rms(analyser: AnalyserNode | null, buf: Uint8Array<ArrayBuffer>): number {
  if (!analyser) return 0;
  analyser.getByteTimeDomainData(buf);
  let sum = 0;
  for (let i = 0; i < buf.length; i++) {
    const v = (buf[i] - 128) / 128;
    sum += v * v;
  }
  return Math.min(1, Math.sqrt(sum / buf.length) * 3.4);
}

/** Pequena "sala" sintética para o reverb da assinatura sonora de IA */
function makeImpulse(ctx: BaseAudioContext, seconds = 0.35, decay = 3.2): AudioBuffer {
  const rate = ctx.sampleRate;
  const len = Math.floor(rate * seconds);
  const buf = ctx.createBuffer(2, len, rate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  return buf;
}

/* ───────── componente ───────── */

export function VoiceMode({ open, onClose, history, onTurn, userName }: Props) {
  const [phase, setPhase] = useState<Phase>('connecting');
  const [userCaption, setUserCaption] = useState('');
  const [agentCaption, setAgentCaption] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [aiFx, setAiFx] = useState<boolean>(() => {
    try {
      return localStorage.getItem('orbiex_voice_fx') !== 'off';
    } catch {
      return true;
    }
  });

  const phaseRef = useRef<Phase>('connecting');
  const openRef = useRef(false);
  const mutedRef = useRef(false);
  const sessionRef = useRef(0);

  const wsRef = useRef<WebSocket | null>(null);
  const micCtxRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const workletRef = useRef<AudioWorkletNode | null>(null);

  const outCtxRef = useRef<AudioContext | null>(null);
  const outInputRef = useRef<GainNode | null>(null);
  const fxWetRef = useRef<GainNode | null>(null);
  const outAnalyserRef = useRef<AnalyserNode | null>(null);
  const nextTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const dropAudioRef = useRef(false);

  const userTextRef = useRef('');
  const agentTextRef = useRef('');
  const lastUserVoiceRef = useRef(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onTurnRef = useRef(onTurn);
  onTurnRef.current = onTurn;
  const historyRef = useRef(history);
  historyRef.current = history;

  const go = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  /* ───── reprodução da voz ───── */
  const flushPlayback = useCallback(() => {
    sourcesRef.current.forEach((s) => {
      try {
        s.stop();
      } catch {
        /* noop */
      }
    });
    sourcesRef.current.clear();
    nextTimeRef.current = 0;
  }, []);

  const enqueueAudio = useCallback(
    (b64: string) => {
      const ctx = outCtxRef.current;
      const input = outInputRef.current;
      if (!ctx || !input || dropAudioRef.current) return;
      const pcm = b64ToFloat32(b64);
      if (!pcm.length) return;
      const buffer = ctx.createBuffer(1, pcm.length, 24000);
      buffer.copyToChannel(pcm, 0);
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.connect(input);
      const start = Math.max(ctx.currentTime + 0.03, nextTimeRef.current);
      src.start(start);
      nextTimeRef.current = start + buffer.duration;
      sourcesRef.current.add(src);
      src.onended = () => {
        sourcesRef.current.delete(src);
        if (sourcesRef.current.size === 0 && phaseRef.current === 'speaking') go('listening');
      };
      if (phaseRef.current !== 'paused') go('speaking');
    },
    [go],
  );

  const commitTurn = useCallback(() => {
    const u = userTextRef.current.trim();
    const a = agentTextRef.current.trim();
    if (u || a) onTurnRef.current(u || '(mensagem de voz)', a || '…');
    userTextRef.current = '';
    agentTextRef.current = '';
  }, []);

  /* ───── encerrar sessão ───── */
  const teardown = useCallback(() => {
    sessionRef.current++;
    const ws = wsRef.current;
    wsRef.current = null;
    if (ws) {
      ws.onmessage = null;
      ws.onclose = null;
      ws.onerror = null;
      try {
        ws.close();
      } catch {
        /* noop */
      }
    }
    flushPlayback();
    workletRef.current?.disconnect();
    workletRef.current = null;
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;
    micAnalyserRef.current = null;
    micCtxRef.current?.close().catch(() => {});
    micCtxRef.current = null;
    outCtxRef.current?.close().catch(() => {});
    outCtxRef.current = null;
    outInputRef.current = null;
    outAnalyserRef.current = null;
    fxWetRef.current = null;
  }, [flushPlayback]);

  /* ───── conectar à Live API ───── */
  const connect = useCallback(async () => {
    const mySession = ++sessionRef.current;
    setErrorMsg('');
    setUserCaption('');
    setAgentCaption('');
    userTextRef.current = '';
    agentTextRef.current = '';
    go('connecting');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AC: typeof AudioContext = window.AudioContext || (window as any).webkitAudioContext;

    // 1) saída de áudio + cadeia de assinatura sonora "IA"
    try {
      const out = new AC({ sampleRate: 24000 });
      outCtxRef.current = out;
      const input = out.createGain();
      const analyser = out.createAnalyser();
      analyser.fftSize = 1024;

      // timbre: corta graves sujos, encorpa o peito, brilho de presença
      const hp = out.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 85;
      const warm = out.createBiquadFilter();
      warm.type = 'lowshelf';
      warm.frequency.value = 220;
      warm.gain.value = 3;
      const presence = out.createBiquadFilter();
      presence.type = 'peaking';
      presence.frequency.value = 3200;
      presence.Q.value = 0.9;
      presence.gain.value = 2.5;
      const comp = out.createDynamicsCompressor();
      comp.threshold.value = -20;
      comp.ratio.value = 3;

      input.connect(hp).connect(warm).connect(presence).connect(comp);
      comp.connect(analyser);

      // camada "IA": dobra sintética (atraso curto) + sala metálica curta
      const wet = out.createGain();
      wet.gain.value = aiFx ? 1 : 0;
      fxWetRef.current = wet;
      const dbl = out.createDelay(0.05);
      dbl.delayTime.value = 0.011;
      const dblGain = out.createGain();
      dblGain.gain.value = 0.22;
      const verb = out.createConvolver();
      verb.buffer = makeImpulse(out);
      const verbGain = out.createGain();
      verbGain.gain.value = 0.14;
      comp.connect(dbl).connect(dblGain).connect(wet);
      comp.connect(verb).connect(verbGain).connect(wet);
      wet.connect(analyser);

      analyser.connect(out.destination);
      outInputRef.current = input;
      outAnalyserRef.current = analyser;
      await out.resume().catch(() => {});
    } catch {
      setErrorMsg('Seu navegador não suporta áudio em tempo real. Use Google Chrome, Edge ou Safari atualizado.');
      go('error');
      return;
    }

    // 2) microfone
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
      });
      if (mySession !== sessionRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      micStreamRef.current = stream;
      const mic = new AC();
      micCtxRef.current = mic;
      const url = URL.createObjectURL(new Blob([CAPTURE_WORKLET], { type: 'application/javascript' }));
      await mic.audioWorklet.addModule(url);
      URL.revokeObjectURL(url);
      const srcNode = mic.createMediaStreamSource(stream);
      const analyser = mic.createAnalyser();
      analyser.fftSize = 1024;
      srcNode.connect(analyser);
      const node = new AudioWorkletNode(mic, 'orbiex-capture');
      srcNode.connect(node);
      // mantém o processador ativo sem tocar o microfone na caixa de som
      const mute = mic.createGain();
      mute.gain.value = 0;
      node.connect(mute).connect(mic.destination);
      micAnalyserRef.current = analyser;
      workletRef.current = node;
      await mic.resume().catch(() => {});

      node.port.onmessage = (ev: MessageEvent<ArrayBuffer>) => {
        const ws = wsRef.current;
        if (!ws || ws.readyState !== WebSocket.OPEN || mutedRef.current) return;
        ws.send(
          JSON.stringify({
            realtimeInput: { audio: { data: bytesToB64(ev.data), mimeType: 'audio/pcm;rate=16000' } },
          }),
        );
      };
    } catch {
      if (mySession !== sessionRef.current) return;
      setErrorMsg('Não consegui acessar seu microfone. Clique no cadeado da barra de endereço, permita o microfone e toque na esfera.');
      go('error');
      return;
    }

    // 3) sessão Live (tenta os modelos em ordem)
    let models = ['gemini-3.8-live', 'gemini-3.1-flash-live-preview', 'gemini-2.5-flash-native-audio-latest'];
    const system = buildSystemPrompt(userName, historyRef.current);

    for (let attempt = 0; attempt < models.length; attempt++) {
      if (mySession !== sessionRef.current) return;
      let token = '';
      try {
        const r = await fetch('/api/voice-token', { method: 'POST' });
        const d = await r.json();
        token = d.token || '';
        if (Array.isArray(d.models) && d.models.length && attempt === 0) models = d.models;
      } catch {
        /* tenta novamente */
      }
      if (!token) continue;

      const model = models[attempt];
      const ok = await new Promise<boolean>((resolve) => {
        const ws = new WebSocket(`${WS_BASE}?access_token=${encodeURIComponent(token)}`);
        let ready = false;
        const timer = window.setTimeout(() => {
          if (!ready) {
            try {
              ws.close();
            } catch {
              /* noop */
            }
            resolve(false);
          }
        }, 9000);

        ws.onopen = () => {
          ws.send(
            JSON.stringify({
              setup: {
                model: `models/${model}`,
                generationConfig: {
                  responseModalities: ['AUDIO'],
                  temperature: 0.8,
                  speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: ORBIEX_VOICE_NAME } } },
                },
                systemInstruction: { parts: [{ text: system }] },
                inputAudioTranscription: {},
                outputAudioTranscription: {},
              },
            }),
          );
        };

        ws.onmessage = async (ev) => {
          if (mySession !== sessionRef.current) return;
          let msg: any; // eslint-disable-line @typescript-eslint/no-explicit-any
          try {
            const raw = typeof ev.data === 'string' ? ev.data : await (ev.data as Blob).text();
            msg = JSON.parse(raw);
          } catch {
            return;
          }

          if (msg.setupComplete && !ready) {
            ready = true;
            window.clearTimeout(timer);
            wsRef.current = ws;
            resolve(true);
            go(mutedRef.current ? 'paused' : 'listening');
            return;
          }

          const sc = msg.serverContent;
          if (!sc) return;

          if (sc.interrupted) {
            // usuário falou por cima: corta a fala na hora
            flushPlayback();
            dropAudioRef.current = false;
            if (agentTextRef.current) commitTurn();
            go('listening');
          }

          if (sc.inputTranscription?.text) {
            if (agentTextRef.current && !userTextRef.current) commitTurn();
            userTextRef.current += sc.inputTranscription.text;
            setUserCaption(userTextRef.current.trim());
            setAgentCaption('');
            lastUserVoiceRef.current = performance.now();
          }

          const parts = sc.modelTurn?.parts || [];
          for (const p of parts) {
            if (p.inlineData?.data) enqueueAudio(p.inlineData.data);
          }

          if (sc.outputTranscription?.text) {
            agentTextRef.current += sc.outputTranscription.text;
            setAgentCaption(agentTextRef.current.replace(/\s+/g, ' ').trim());
          }

          if (sc.turnComplete) {
            dropAudioRef.current = false;
            commitTurn();
            if (sourcesRef.current.size === 0 && phaseRef.current !== 'paused') go('listening');
          }
        };

        ws.onerror = () => {
          if (!ready) {
            window.clearTimeout(timer);
            resolve(false);
          }
        };
        ws.onclose = () => {
          window.clearTimeout(timer);
          if (!ready) return resolve(false);
          if (mySession === sessionRef.current && openRef.current) {
            commitTurn();
            wsRef.current = null;
            setErrorMsg('A sessão de voz foi encerrada. Toque na esfera para reconectar.');
            go('error');
          }
        };
      });

      if (ok) return;
    }

    if (mySession === sessionRef.current) {
      setErrorMsg('Não foi possível conectar ao núcleo de voz agora. Toque na esfera para tentar novamente.');
      go('error');
    }
  }, [aiFx, commitTurn, enqueueAudio, flushPlayback, go, userName]);

  /* ───── abrir / fechar ───── */
  useEffect(() => {
    if (!open) return;
    openRef.current = true;
    mutedRef.current = false;
    connect();
    return () => {
      openRef.current = false;
      commitTurn();
      teardown();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  /* liga/desliga a assinatura sonora sem reconectar */
  useEffect(() => {
    try {
      localStorage.setItem('orbiex_voice_fx', aiFx ? 'on' : 'off');
    } catch {
      /* noop */
    }
    const wet = fxWetRef.current;
    const ctx = outCtxRef.current;
    if (wet && ctx) wet.gain.setTargetAtTime(aiFx ? 1 : 0, ctx.currentTime, 0.05);
  }, [aiFx]);

  /* ESC fecha */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  /* ───── animação da esfera + detecção de "processando" ───── */
  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    const g = canvas?.getContext('2d');
    if (!canvas || !g) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const SIZE = 340;
    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
    g.scale(dpr, dpr);

    const micBuf = new Uint8Array(new ArrayBuffer(1024));
    const outBuf = new Uint8Array(new ArrayBuffer(1024));
    let level = 0;
    let spin = 0;
    let raf = 0;
    const t0 = performance.now();

    const draw = () => {
      const now = performance.now();
      const t = (now - t0) / 1000;
      let p = phaseRef.current;

      const micLv = mutedRef.current ? 0 : rms(micAnalyserRef.current, micBuf);
      const outLv = rms(outAnalyserRef.current, outBuf);
      if (micLv > 0.12) lastUserVoiceRef.current = now;

      // usuário terminou de falar e ainda não há resposta → processando
      if (p === 'listening' && userTextRef.current && now - lastUserVoiceRef.current > 650 && sourcesRef.current.size === 0) {
        phaseRef.current = 'thinking';
        setPhase('thinking');
        p = 'thinking';
      }

      const target = p === 'speaking' ? outLv : p === 'listening' || p === 'thinking' ? micLv : 0;
      level += (target - level) * (target > level ? 0.35 : 0.08);

      const cx = SIZE / 2;
      const cy = SIZE / 2;
      const dim = p === 'paused' || p === 'error';
      g.clearRect(0, 0, SIZE, SIZE);

      const glow = g.createRadialGradient(cx, cy, 20, cx, cy, 150 + level * 30);
      glow.addColorStop(0, `rgba(212,175,55,${dim ? 0.1 : 0.26 + level * 0.35})`);
      glow.addColorStop(1, 'rgba(212,175,55,0)');
      g.fillStyle = glow;
      g.fillRect(0, 0, SIZE, SIZE);

      spin += p === 'thinking' || p === 'connecting' ? 0.045 : 0.006 + level * 0.025;
      const ring = (r: number, segs: number, gap: number, w: number, a: number, dir: number) => {
        g.save();
        g.translate(cx, cy);
        g.rotate(spin * dir);
        g.strokeStyle = `rgba(244,215,122,${a})`;
        g.lineWidth = w;
        const step = (Math.PI * 2) / segs;
        for (let i = 0; i < segs; i++) {
          g.beginPath();
          g.arc(0, 0, r, i * step, i * step + step * (1 - gap));
          g.stroke();
        }
        g.restore();
      };
      const hudA = dim ? 0.12 : 0.36;
      ring(152, 3, 0.18, 1.2, hudA * 0.9, 1);
      ring(141, 60, 0.55, 3, hudA * 0.5, -0.6);
      if (p === 'thinking' || p === 'connecting') ring(128, 6, 0.5, 2, 0.75, 2.4);
      if (p === 'speaking') ring(128 + level * 10, 90, 0.7, 1.5, 0.35 + level * 0.4, 0.3);

      const base = dim ? 78 : 88;
      const amp = p === 'thinking' ? 5 : 4 + level * 26;
      g.beginPath();
      for (let i = 0; i <= 140; i++) {
        const a = (i / 140) * Math.PI * 2;
        const n = Math.sin(a * 3 + t * 2.1) * 0.5 + Math.sin(a * 5 - t * 2.7) * 0.3 + Math.sin(a * 2 + t * 1.3) * 0.4;
        const r = base + Math.sin(t * 1.6) * 3 + level * 22 + n * amp;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        if (i === 0) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
      g.closePath();
      const hx = cx - 25 + Math.cos(t * 0.8) * 12;
      const hy = cy - 30 + Math.sin(t * 0.9) * 12;
      const fill = g.createRadialGradient(hx, hy, 8, cx, cy, base + 40);
      if (dim) {
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

  /* ───── ações ───── */
  const onOrbClick = () => {
    outCtxRef.current?.resume().catch(() => {});
    micCtxRef.current?.resume().catch(() => {});
    const p = phaseRef.current;
    if (p === 'error') {
      teardown();
      connect();
    } else if (p === 'speaking') {
      // interrompe a fala atual; descarta o resto desta resposta
      flushPlayback();
      dropAudioRef.current = true;
      commitTurn();
      go('listening');
    } else if (p === 'paused') {
      mutedRef.current = false;
      go('listening');
    }
  };

  const toggleMute = () => {
    if (phaseRef.current === 'error' || phaseRef.current === 'connecting') return;
    if (mutedRef.current) {
      mutedRef.current = false;
      go(sourcesRef.current.size ? 'speaking' : 'listening');
    } else {
      mutedRef.current = true;
      go('paused');
    }
  };

  if (!open) return null;

  const hint =
    phase === 'listening'
      ? 'Fale naturalmente. Você pode interromper a qualquer momento.'
      : phase === 'speaking'
      ? 'Fale por cima ou toque na esfera para interromper.'
      : phase === 'thinking'
      ? 'Analisando...'
      : phase === 'paused'
      ? 'Toque no microfone para continuar.'
      : phase === 'connecting'
      ? 'Conectando ao núcleo de voz Orbiex...'
      : '';

  return (
    <div className="mvz-fade-up fixed inset-0 z-[200] flex flex-col items-center justify-between bg-[#050505]/[0.97] px-6 py-8 backdrop-blur-xl">
      <div className="flex w-full max-w-xl items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className={`h-2 w-2 rounded-full ${phase === 'error' || phase === 'paused' ? 'bg-white/30' : 'animate-pulse bg-[var(--mvz-gold)]'}`} />
          <span className="text-[12px] font-bold uppercase tracking-[0.22em] text-[#f4d77a]">Orbiex Voice</span>
        </div>
        <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/45">{PHASE_LABEL[phase]}</span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center">
        <button
          type="button"
          onClick={onOrbClick}
          aria-label="Esfera de voz Orbiex"
          className="relative cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--mvz-gold)]"
        >
          <canvas ref={canvasRef} style={{ width: 340, height: 340 }} className="max-h-[86vw] max-w-[86vw]" />
        </button>

        <div className="mt-6 min-h-[110px] w-full max-w-xl text-center">
          {phase === 'error' ? (
            <p className="text-[14px] leading-relaxed text-rose-300/90">{errorMsg}</p>
          ) : agentCaption && (phase === 'speaking' || phase === 'listening') ? (
            <p className="mx-auto max-h-[150px] overflow-y-auto text-[16px] leading-relaxed text-white/90">{agentCaption}</p>
          ) : userCaption ? (
            <p className="text-[18px] font-medium leading-relaxed text-white">“{userCaption}”</p>
          ) : phase === 'listening' ? (
            <p className="text-[17px] text-white/70">{userName ? `Olá, ${userName}. ` : 'Olá. '}Pode falar, estou ouvindo.</p>
          ) : null}
          <p className="mt-3 text-[11.5px] text-white/35">{hint}</p>
        </div>
      </div>

      <div className="flex items-center gap-5">
        <button
          type="button"
          onClick={() => setAiFx((v) => !v)}
          aria-label="Assinatura sonora de IA"
          title={aiFx ? 'Efeito de voz IA: ligado' : 'Efeito de voz IA: desligado'}
          className={`flex h-12 w-12 items-center justify-center rounded-full border transition ${
            aiFx ? 'border-[var(--mvz-gold)]/50 bg-[rgba(212,175,55,0.15)] text-[#f4d77a]' : 'border-white/10 bg-white/[0.04] text-white/50'
          }`}
        >
          <Sparkles size={18} />
        </button>
        <button
          type="button"
          onClick={toggleMute}
          aria-label={phase === 'paused' ? 'Ativar microfone' : 'Pausar microfone'}
          className={`flex h-14 w-14 items-center justify-center rounded-full border transition ${
            phase === 'paused' ? 'border-white/20 bg-white text-black' : 'border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.12]'
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

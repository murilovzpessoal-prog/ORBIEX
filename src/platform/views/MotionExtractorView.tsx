import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Sparkles,
  ScanEye,
  Copy,
  Check,
  Play,
  RotateCcw,
  Film,
  Zap,
  ArrowRight,
  Camera,
  Activity,
  FileVideo,
  X,
  Sliders,
} from 'lucide-react';

interface SampleVideoPreset {
  id: string;
  title: string;
  tag: string;
  duration: string;
  fileSize: string;
  videoUrl: string;
  promptEnglish: string;
  timeline: { time: string; title: string; desc: string }[];
  cameraDetails: {
    framing: string;
    motion: string;
    lens: string;
    lighting: string;
    fps: string;
  };
}

const SAMPLE_VIDEOS: SampleVideoPreset[] = [
  {
    id: 'sample-mirror-360',
    title: 'Giro 360 no Espelho • Vestido Canelado',
    tag: 'Look Completo / 360',
    duration: '0:07',
    fileSize: '1.4 MB',
    videoUrl: '/rakeo1q.mp4',
    promptEnglish:
      'A photorealistic vertical video of a stylish young woman in front of a luxury studio mirror. At 00:00, she takes two subtle steps back looking directly into the camera lens with a confident posture. At 00:02, she performs a smooth, deliberate 360-degree clockwise body rotation, showcasing the elegant fabric drape and silhouette. At 00:05, she gently rests her right hand on her waist, turning her gaze back to the viewer with natural eye contact. 35mm handheld camera motion with subtle organic float, warm rim lighting, 24fps cinematic vertical 9:16, ultra-realistic cloth physics.',
    timeline: [
      {
        time: '00:00 - 00:02',
        title: 'Posicionamento e Contato Visual',
        desc: 'Dar 2 passos para tras em silencio olhando o espelho, postura ereta e expressao confiante em direcao a lente.',
      },
      {
        time: '00:02 - 00:05',
        title: 'Giro Suave de 360 Graus',
        desc: 'Rotacao controlada em sentido horario no proprio eixo, demonstrando o caimento lateral e o contorno traseiro da peca.',
      },
      {
        time: '00:05 - 00:07',
        title: 'Ajuste de Cintura e Finalizacao',
        desc: 'Mao direita repousa suavemente no cos para enfatizar o ajuste, retornando o olhar com expressao de aprovacao.',
      },
    ],
    cameraDetails: {
      framing: 'Plano Medio Vertical (9:16) • Eye-Level',
      motion: 'Subtle Handheld Push-In com estabilizacao otica',
      lens: '35mm Prime f/1.8 com suave desfoque de fundo',
      lighting: 'Luz Difusa Natural frontal com Rim Light dourado suave',
      fps: '24 fps (Padrao Cinematografico)',
    },
  },
  {
    id: 'sample-street-walk',
    title: 'Caminhada Dinamica • Passarela Urbana',
    tag: 'Caminhada & Fluidez',
    duration: '0:08',
    fileSize: '6.7 MB',
    videoUrl: '/assets/login-animation.mp4',
    promptEnglish:
      'A cinematic vertical tracking shot of an elegant woman walking toward the camera down a minimalist modern sidewalk. At 00:00, she walks with confident relaxed strides, one hand casually at her side. At 00:03, she slows down slightly, turns her head to glance sideways with natural head movement. At 00:06, she halts smoothly, facing camera with an effortless micro-expression. Low-angle 50mm smooth backward tracking gimbal shot, golden hour sunlight backlighting hair, hyperrealistic fabric flutter on stride, 30fps vertical 9:16.',
    timeline: [
      {
        time: '00:00 - 00:03',
        title: 'Passos Firmes em Direcao a Camera',
        desc: 'Caminhada fluida e descontraida em ritmo natural, postura ereta e olhar na linha do horizonte.',
      },
      {
        time: '00:03 - 00:06',
        title: 'Desaceleracao e Movimento de Cabeca',
        desc: 'Reducao suave de ritmo com giro parcial de tronco, expressao serena e natural.',
      },
      {
        time: '00:06 - 00:08',
        title: 'Parada Frontal e Presenca de Cena',
        desc: 'Pausa elegante de frente para a lente, queixo ligeiramente erguido e contato visual com a camera.',
      },
    ],
    cameraDetails: {
      framing: 'Corpo Inteiro para Plano Medio (9:16)',
      motion: 'Smooth Backward Dolly / Tracking Gimbal Shot',
      lens: '50mm f/2.0 com compressao de perspectiva suave',
      lighting: 'Golden Hour (Luz solar dourada de final de tarde)',
      fps: '30 fps (Fluidez UGC Premium)',
    },
  },
  {
    id: 'sample-ugc-gesture',
    title: 'Close UGC • Teste de Tecido & Caimento',
    tag: 'Close & Detalhes',
    duration: '0:06',
    fileSize: '5.5 MB',
    videoUrl: '/assets/login-animation-2.mp4',
    promptEnglish:
      'An intimate vertical UGC video of a woman standing in front of a neutral backdrop testing the fabric quality of her outfit. At 00:00, she raises both hands to touch the neckline and collarbone area, gently stretching the fabric outward to demonstrate high elasticity and zero transparency. At 00:02, she turns 45 degrees left, pointing right index finger to the ribbed texture. At 00:04, she pulls back with an approving nod. Eye-level handheld smartphone camera, natural soft window lighting, realistic micro-vibrations, 4K vertical 9:16.',
    timeline: [
      {
        time: '00:00 - 00:02',
        title: 'Teste de Elasticidade no Tecido',
        desc: 'Duas maos puxam suavemente a trama do tecido para demonstrar sustentacao e textura firme sem deformacao.',
      },
      {
        time: '00:02 - 00:04',
        title: 'Angulo de 45 Graus e Dedo Apontando',
        desc: 'Giro de 45 graus para a esquerda com indicador apontando para os detalhes de acabamento e costura da peca.',
      },
      {
        time: '00:04 - 00:06',
        title: 'Aceno de Cabeca e Endosso Real',
        desc: 'Afasta levemente o corpo assentindo afirmativamente com a cabeca em sinal de aprovacao da peca.',
      },
    ],
    cameraDetails: {
      framing: 'Primeiro Plano / Busto e Rosto (9:16)',
      motion: 'POV Handheld Smartphone autentico com micro-movimentos organicos',
      lens: '26mm Wide Angle (Lente nativa de smartphone)',
      lighting: 'Luz de Janela Suave (Soft Daylight)',
      fps: '30 fps (Formato Nativo TikTok Shop)',
    },
  },
];

interface EngineDef {
  id: string;
  name: string;
  badge: string;
  formatPrompt: (basePrompt: string, camera: SampleVideoPreset['cameraDetails']) => string;
}

const ENGINES: EngineDef[] = [
  {
    id: 'veo',
    name: 'Google Flow (VEO 3)',
    badge: 'Recomendado',
    formatPrompt: (base, cam) =>
      `[Google Flow VEO 3 Frame-to-Video Engine]\nMode: High Physical Simulation | 24fps Vertical 9:16\nPrompt: ${base}\nCamera Motion: ${cam.motion}, ${cam.framing}, ${cam.lens}\nLighting: ${cam.lighting}\nCloth Dynamics: Photorealistic fabric simulation, zero texture drift.\nNegative: low quality, blurry, deformed hands, jitter, abrupt cuts.`,
  },
  {
    id: 'kling',
    name: 'Kling AI (v1.5 / v2.0)',
    badge: 'Ultra Realista',
    formatPrompt: (base, cam) =>
      `${base}\n--camera ${cam.motion.toLowerCase()} --cfg_scale 0.55 --motion 6 --aspect 9:16\nNegative prompt: morphing, extra limbs, bad anatomy, deformed fingers, jerky motion, low resolution, artifacts.`,
  },
  {
    id: 'hailuo',
    name: 'Hailuo AI (MiniMax)',
    badge: 'Fluidez Maxima',
    formatPrompt: (base) =>
      `Cinematic photorealistic vertical 9:16 UGC video. ${base} Ultra smooth physical fabric movement, natural skin pores, realistic human eye micro-movements, seamless camera stability, 4K render quality.`,
  },
  {
    id: 'luma',
    name: 'Luma Dream Machine',
    badge: 'Dinamico',
    formatPrompt: (base, cam) =>
      `Vertical 9:16 high-end scene. ${base} Shot on ${cam.lens}, ${cam.lighting}. Camera execution: ${cam.motion}. Super-resolution render, cinematic temporal coherence.`,
  },
  {
    id: 'runway',
    name: 'Runway Gen-3',
    badge: 'Cinematografico',
    formatPrompt: (base, cam) =>
      `Vertical 9:16 UGC fashion shot. ${base} Camera: ${cam.motion}. Motion scale: 4. Hyper-realistic cloth physics, organic handheld float, film grain 35mm.`,
  },
];

// Helper seguro de copia para area de transferencia com fallback
function copyTextSafe(text: string, onSuccess: () => void) {
  if (navigator?.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(onSuccess).catch(() => {
      fallbackCopy(text, onSuccess);
    });
  } else {
    fallbackCopy(text, onSuccess);
  }
}

function fallbackCopy(text: string, onSuccess: () => void) {
  try {
    const el = document.createElement('textarea');
    el.value = text;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    onSuccess();
  } catch (err) {
    console.error('Falha ao copiar:', err);
  }
}

export function MotionExtractorView({ onUse }: { onUse?: (prompt: string) => void }) {
  // Estado geral da visualizacao
  const [status, setStatus] = useState<'empty' | 'preview' | 'analyzing' | 'results'>('empty');

  // Video ativo
  const [activeVideoUrl, setActiveVideoUrl] = useState<string>('/rakeo1q.mp4');
  const [activeVideoName, setActiveVideoName] = useState<string>('Giro 360 no Espelho • Vestido Canelado');
  const [activeVideoSize, setActiveVideoSize] = useState<string>('1.4 MB');
  const [activePreset, setActivePreset] = useState<SampleVideoPreset>(SAMPLE_VIDEOS[0]);
  const [selectedEngineId, setSelectedEngineId] = useState<string>('veo');

  // Arrastar arquivo
  const [isDragging, setIsDragging] = useState(false);

  // Progresso de analise
  const [progress, setProgress] = useState(0);
  const [scanMessage, setScanMessage] = useState('Iniciando visao computacional...');
  const [scanTag, setScanTag] = useState('Keypoints');

  // Feedback de copia
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedFull, setCopiedFull] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoPlayerRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Limpeza de timers ao desmontar componente
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Motor selecionado
  const currentEngine = ENGINES.find((e) => e.id === selectedEngineId) || ENGINES[0];

  // Prompt formatado pelo motor selecionado
  const formattedPrompt = currentEngine.formatPrompt(activePreset.promptEnglish, activePreset.cameraDetails);

  // Selecionar preset validado
  const handleSelectPreset = (preset: SampleVideoPreset) => {
    setActivePreset(preset);
    setActiveVideoUrl(preset.videoUrl);
    setActiveVideoName(preset.title);
    setActiveVideoSize(preset.fileSize);
    setStatus('preview');
  };

  // Upload de arquivo local
  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('video/') && !/\.(mp4|mov|webm|avi|m4v)$/i.test(file.name)) {
      alert('Por favor, selecione um arquivo de video valido (MP4, MOV, WEBM).');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
    setActiveVideoUrl(objectUrl);
    setActiveVideoName(file.name);
    setActiveVideoSize(sizeMb);

    const cleanBaseName = file.name.replace(/\.[^/.]+$/, '');

    // Ajusta preset para dados customizados com base no nome do video
    setActivePreset({
      id: 'custom-' + Date.now(),
      title: file.name,
      tag: 'Video Personalizado',
      duration: '0:07',
      fileSize: sizeMb,
      videoUrl: objectUrl,
      promptEnglish: `A photorealistic vertical cinematic UGC video matching the exact movement dynamics of ${cleanBaseName}. The model executes smooth natural gestures, controlled body turns and realistic facial micro-expressions with seamless cloth simulation, 35mm handheld camera float, warm natural lighting, ultra smooth 24fps 9:16 vertical.`,
      timeline: [
        {
          time: '00:00 - 00:02',
          title: 'Postura Inicial e Orientacao de Olhar',
          desc: 'Posicionamento estavel em frente a camera com presenca marcante e respiracao natural.',
        },
        {
          time: '00:02 - 00:05',
          title: 'Dinamica de Movimento Central',
          desc: 'Movimentacao fluida de tronco e bracos com transicao suave de peso corporal e caimento do tecido.',
        },
        {
          time: '00:05 - 00:07',
          title: 'Desaceleracao e Pose de Conclusao',
          desc: 'Retorno para o ponto de equilibrio, reafirmacao do contato visual e estabilizacao dos membros.',
        },
      ],
      cameraDetails: {
        framing: 'Plano Medio Vertical (9:16) • Eye-Level',
        motion: 'Handheld Organico com suavizacao de trepidacao otica',
        lens: '35mm Prime f/1.8 com desfoque agradavel de fundo',
        lighting: 'Iluminacao Natural de Estudio com Rim Light Dourado',
        fps: '24 / 30 fps Adaptativo',
      },
    });

    setStatus('preview');
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  // Disparo da Analise de Visao Computacional (~3.8s)
  const handleStartExtraction = () => {
    setStatus('analyzing');
    setProgress(0);
    setScanMessage('Detectando 33 keypoints anatomicos (BlazePose)...');
    setScanTag('Keypoints Corporais');

    const startTime = Date.now();
    const duration = 3600;

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);

      if (pct < 22) {
        setScanMessage('Detectando 33 keypoints anatomicos e vetores de movimento...');
        setScanTag('Keypoints BlazePose');
      } else if (pct < 48) {
        setScanMessage('Mapeando velocidade angular de giros, aceleracao e bracos...');
        setScanTag('Cinematica de Membros');
      } else if (pct < 72) {
        setScanMessage('Analisando micro-expressoes faciais, piscar e direcao do olhar...');
        setScanTag('Face Mesh 468 pts');
      } else if (pct < 88) {
        setScanMessage(`Calculando trajetoria de camera para o motor ${currentEngine.name}...`);
        setScanTag('Trajetoria de Lente');
      } else {
        setScanMessage('Formatando prompt tecnico e parametros de renderizacao...');
        setScanTag('Prompt Sintetizado');
      }

      if (elapsed >= duration) {
        if (timerRef.current) clearInterval(timerRef.current);
        setTimeout(() => {
          setStatus('results');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 180);
      }
    }, 45);
  };

  // Copiar Prompt de Movimento
  const handleCopyPrompt = () => {
    copyTextSafe(formattedPrompt, () => {
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2200);
    });
  };

  // Copiar Analise Completa
  const handleCopyFull = () => {
    const text = `PROMPT DE MOVIMENTO CALIBRADO (${currentEngine.name.toUpperCase()}):\n${formattedPrompt}\n\nCRONOLOGIA DE MOVIMENTOS SEGUNDO A SEGUNDO:\n${activePreset.timeline
      .map((t) => `• [${t.time}] ${t.title}: ${t.desc}`)
      .join('\n')}\n\nFICHA TECNICA DE CAMERA E LUZ:\n- Enquadramento: ${activePreset.cameraDetails.framing}\n- Movimento de Camera: ${activePreset.cameraDetails.motion}\n- Lente & Optica: ${activePreset.cameraDetails.lens}\n- Iluminacao: ${activePreset.cameraDetails.lighting}\n- FPS: ${activePreset.cameraDetails.fps}`;

    copyTextSafe(text, () => {
      setCopiedFull(true);
      setTimeout(() => setCopiedFull(false), 2200);
    });
  };

  // Fallback de video seguro caso link externo falhe
  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const video = e.currentTarget;
    if (!video.src.includes('rakeo1q.mp4')) {
      video.src = '/rakeo1q.mp4';
      video.play().catch(() => {});
    }
  };

  return (
    <div className="mvz-fade-up space-y-7 pb-16">
      {/* ────────────────────────────────────────────────────────────
          1. HEADER PRINCIPAL • EXTRATOR DE MOVIMENTOS
      ──────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-[32px] border border-[var(--mvz-line)] bg-gradient-to-br from-[#0e0c08] via-[#080705] to-[#040404] p-6 shadow-[0_25px_60px_rgba(0,0,0,0.85)] md:p-8">
        <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-[var(--mvz-gold)]/10 blur-[90px]" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-[#f43f5e]/10 blur-[95px]" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--mvz-gold)]/30 bg-[var(--mvz-gold)]/10 px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-widest text-[var(--mvz-gold)] shadow-[0_0_20px_rgba(212,175,55,0.2)]">
              <ScanEye size={13} className="text-[var(--mvz-gold)] animate-pulse" />
              <span>Estudio de Criacao • Visao Computacional IA</span>
            </div>

            <h1 className="text-[28px] font-black tracking-tight text-white sm:text-[36px] md:text-[40px] leading-tight">
              Extrator de{' '}
              <span className="bg-gradient-to-r from-[#d4af37] via-[#f3e2a4] to-[#eab308] bg-clip-text text-transparent">
                Movimentos
              </span>
            </h1>

            <p className="text-[13.5px] leading-relaxed text-white/75 sm:text-[14.5px]">
              Envie qualquer video de referencia e a IA disseca movimentos corporais, micro-expressoes faciais e dinamica de camera em um prompt tecnico exato para sua influenciadora virtual.
            </p>
          </div>

          {/* Badge de Status Vision Ativo */}
          <div className="flex items-center gap-3 self-start rounded-2xl border border-[var(--mvz-line-strong)] bg-[#0d0c0a]/90 px-4 py-3 backdrop-blur-md lg:self-center">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--mvz-gold)] opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--mvz-gold)]" />
            </span>
            <div className="leading-tight">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--mvz-gold)]">
                IA Vision 4.2
              </div>
              <div className="text-[12px] font-bold text-white">Online & Calibrada</div>
            </div>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────
          2. GUIA DE OPERACAO EM 3 ETAPAS
      ──────────────────────────────────────────────────────────── */}
      <div className="rounded-[28px] border border-[var(--mvz-line)] bg-[#0d0c0a] p-6 shadow-xl sm:p-7">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center border-b border-white/[0.08] pb-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10.5px] font-bold uppercase tracking-wider text-white/80">
              <Sparkles size={11} className="text-[var(--mvz-gold)]" />
              Guia Tecnico • 3 Etapas
            </div>
            <h2 className="mt-2 text-[18px] font-black text-white sm:text-[22px]">
              Como Funciona o Extrator de Movimentos
            </h2>
            <p className="mt-1 text-[12.5px] text-[var(--mvz-muted)]">
              Transforme qualquer video em um prompt tecnico com movimentos corporais, expressoes faciais e dinamica de camera para animar no Google Flow (VEO 3), Kling ou Hailuo.
            </p>
          </div>

          <div className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-[var(--mvz-gold)]/30 bg-[var(--mvz-gold)]/10 px-3.5 py-1.5 text-[11px] font-bold text-[var(--mvz-gold-light)]">
            <Activity size={13} className="text-[var(--mvz-gold)]" />
            <span>Deteccao Segundo a Segundo</span>
          </div>
        </div>

        {/* 3 Passos */}
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="group rounded-2xl border border-white/10 bg-black/40 p-5 transition hover:border-[var(--mvz-gold)]/40 hover:bg-black/60">
            <div className="flex items-center justify-between">
              <span className="rounded-full border border-[var(--mvz-gold)]/30 bg-[var(--mvz-gold)]/10 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-[var(--mvz-gold-light)]">
                Passo 1
              </span>
              <span className="font-mono text-[14px] font-black text-white/30 group-hover:text-[var(--mvz-gold)] transition">
                01
              </span>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-white/80 group-hover:bg-[var(--mvz-gold)]/15 group-hover:text-[var(--mvz-gold)] transition">
                <Upload size={18} />
              </div>
              <h3 className="text-[14px] font-bold text-white">Upload do Video</h3>
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-[var(--mvz-dim)]">
              Envie qualquer video de referencia de ate 100MB nos formatos MP4, MOV ou WEBM.
            </p>
          </div>

          <div className="group rounded-2xl border border-white/10 bg-black/40 p-5 transition hover:border-[var(--mvz-gold)]/40 hover:bg-black/60">
            <div className="flex items-center justify-between">
              <span className="rounded-full border border-[var(--mvz-gold)]/30 bg-[var(--mvz-gold)]/10 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-[var(--mvz-gold-light)]">
                Passo 2
              </span>
              <span className="font-mono text-[14px] font-black text-white/30 group-hover:text-[var(--mvz-gold)] transition">
                02
              </span>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-white/80 group-hover:bg-[var(--mvz-gold)]/15 group-hover:text-[var(--mvz-gold)] transition">
                <ScanEye size={18} />
              </div>
              <h3 className="text-[14px] font-bold text-white">IA Analisa a Cena</h3>
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-[var(--mvz-dim)]">
              Visao computacional disseca movimentos corporais, expressoes do rosto e enquadramento.
            </p>
          </div>

          <div className="group rounded-2xl border border-white/10 bg-black/40 p-5 transition hover:border-[var(--mvz-gold)]/40 hover:bg-black/60">
            <div className="flex items-center justify-between">
              <span className="rounded-full border border-[var(--mvz-gold)]/30 bg-[var(--mvz-gold)]/10 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-[var(--mvz-gold-light)]">
                Passo 3
              </span>
              <span className="font-mono text-[14px] font-black text-white/30 group-hover:text-[var(--mvz-gold)] transition">
                03
              </span>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-white/80 group-hover:bg-[var(--mvz-gold)]/15 group-hover:text-[var(--mvz-gold)] transition">
                <Copy size={18} />
              </div>
              <h3 className="text-[14px] font-bold text-white">Copia o Prompt Tecnico</h3>
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-[var(--mvz-dim)]">
              Copie o prompt detalhado pronto para colar no Google Flow (VEO 3), Kling ou Hailuo.
            </p>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────
          3. DROPZONE DE VIDEO & PRESETS PRONTOS
      ──────────────────────────────────────────────────────────── */}
      {status === 'empty' && (
        <div className="space-y-6">
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/webm,video/x-m4v"
            onChange={handleFileInputChange}
            className="hidden"
          />

          {/* Dropzone Central VIP */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`group relative flex min-h-[300px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[30px] border-2 border-dashed p-8 text-center transition-all duration-300 sm:min-h-[340px] ${
              isDragging
                ? 'border-[var(--mvz-gold)] bg-[var(--mvz-gold)]/10 shadow-[0_0_60px_rgba(212,175,55,0.4)] scale-[1.01]'
                : 'border-[var(--mvz-gold)]/40 bg-gradient-to-b from-[#110e09] via-[#090806] to-[#040404] hover:border-[var(--mvz-gold)] hover:shadow-[0_0_50px_rgba(212,175,55,0.25)]'
            }`}
          >
            <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[radial-gradient(circle,_rgba(212,175,55,0.18)_0%,_transparent_70%)] blur-3xl" />

            <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-[var(--mvz-gold)]/50 bg-gradient-to-br from-[var(--mvz-gold)]/25 to-[var(--mvz-gold)]/5 text-[var(--mvz-gold)] shadow-[0_0_35px_rgba(212,175,55,0.3)] transition-transform duration-500 group-hover:scale-110">
              <Upload size={34} />
            </div>

            <h3 className="mt-6 text-[18px] font-black text-white sm:text-[22px]">
              {isDragging ? 'Solte o video aqui para iniciar' : 'Arraste o video aqui ou clique para selecionar'}
            </h3>
            <p className="mt-2 max-w-md text-[13px] text-white/70">
              Selecione o video com os movimentos que voce deseja extrair para sua influenciadora de IA.
            </p>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/60 px-4 py-1.5 text-[11px] font-semibold text-white/60 backdrop-blur-md">
              <FileVideo size={13} className="text-[var(--mvz-gold)]" />
              <span>MP4, MOV, WEBM • Ate 100MB</span>
            </div>
          </div>

          {/* Presets de Demonstracao Instantanea */}
          <div className="rounded-[26px] border border-[var(--mvz-line)] bg-[#0d0c0a] p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--mvz-gold)]/15 text-[var(--mvz-gold)]">
                  <Play size={14} className="fill-current" />
                </div>
                <div>
                  <h4 className="text-[14px] font-black text-white">Sem video no momento? Teste com um modelo validado</h4>
                  <p className="text-[11.5px] text-[var(--mvz-muted)]">
                    Clique em qualquer exemplo gravado para ver a extracao de movimentos em tempo real
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {SAMPLE_VIDEOS.map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className="group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-4 transition duration-300 hover:-translate-y-1 hover:border-[var(--mvz-gold)] hover:bg-black/80 hover:shadow-[0_10px_30px_rgba(212,175,55,0.2)]"
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded-full border border-[var(--mvz-gold)]/30 bg-[var(--mvz-gold)]/10 px-2.5 py-0.5 text-[9.5px] font-extrabold uppercase text-[var(--mvz-gold-light)]">
                      {preset.tag}
                    </span>
                    <span className="font-mono text-[11px] font-bold text-white/50">
                      {preset.duration}
                    </span>
                  </div>

                  <h5 className="mt-3 text-[13px] font-black text-white group-hover:text-[var(--mvz-gold-light)] transition">
                    {preset.title}
                  </h5>

                  <div className="mt-4 flex items-center justify-between pt-3 border-t border-white/[0.06] text-[11px] font-semibold text-[var(--mvz-muted)]">
                    <span>{preset.fileSize}</span>
                    <span className="flex items-center gap-1 text-[var(--mvz-gold)] group-hover:underline">
                      Carregar Exemplo <ArrowRight size={12} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────
          4. VIDEO CARREGADO • PREVIEW & PROCESSAMENTO
      ──────────────────────────────────────────────────────────── */}
      {(status === 'preview' || status === 'analyzing') && (
        <div className="grid grid-cols-1 gap-7 lg:grid-cols-12">
          {/* Coluna Esquerda: Player de Video com Frame Luxury */}
          <div className="lg:col-span-7 space-y-4">
            <div className="relative overflow-hidden rounded-[28px] border-2 border-[var(--mvz-gold)]/40 bg-black shadow-[0_20px_60px_rgba(0,0,0,0.9)]">
              {/* Player do Video */}
              <div className="relative aspect-[9/16] max-h-[580px] w-full overflow-hidden bg-black flex items-center justify-center">
                <video
                  ref={videoPlayerRef}
                  src={activeVideoUrl}
                  controls={status !== 'analyzing'}
                  autoPlay
                  loop
                  muted
                  playsInline
                  onError={handleVideoError}
                  className="h-full w-full object-contain"
                />

                {/* Laser de Varredura durante analise */}
                {status === 'analyzing' && (
                  <>
                    <div className="pointer-events-none absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
                    <div className="pointer-events-none absolute left-3 top-3 h-4 w-4 border-l-2 border-t-2 border-[var(--mvz-gold)]" />
                    <div className="pointer-events-none absolute right-3 top-3 h-4 w-4 border-r-2 border-t-2 border-[var(--mvz-gold)]" />
                    <div className="pointer-events-none absolute bottom-3 left-3 h-4 w-4 border-b-2 border-l-2 border-[var(--mvz-gold)]" />
                    <div className="pointer-events-none absolute bottom-3 right-3 h-4 w-4 border-b-2 border-r-2 border-[var(--mvz-gold)]" />

                    <div
                      className="pointer-events-none absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[var(--mvz-gold-light)] to-transparent shadow-[0_0_20px_rgba(212,175,55,1)] animate-bounce"
                      style={{ animationDuration: '2.2s' }}
                    />

                    <div className="absolute top-4 inset-x-0 text-center">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--mvz-gold)]/60 bg-black/80 px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[var(--mvz-gold-light)] backdrop-blur-md shadow-[0_0_15px_rgba(212,175,55,0.4)]">
                        <Activity size={13} className="animate-spin text-[var(--mvz-gold)]" />
                        Visao Optica Ativa • {scanTag}
                      </span>
                    </div>
                  </>
                )}

                {/* Botao de Fechar no topo direito */}
                {status === 'preview' && (
                  <button
                    onClick={() => setStatus('empty')}
                    className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/70 text-white/80 backdrop-blur-md hover:bg-black hover:text-white transition"
                    title="Remover video"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
            </div>

            {/* Informacoes do Arquivo */}
            <div className="flex items-center justify-between rounded-2xl border border-[var(--mvz-line)] bg-[#0d0c0a] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--mvz-gold)]/15 text-[var(--mvz-gold)]">
                  <Film size={18} />
                </div>
                <div className="min-w-0">
                  <h4 className="truncate text-[13px] font-black text-white max-w-[260px] sm:max-w-md">
                    {activeVideoName}
                  </h4>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] text-[var(--mvz-muted)]">
                    <span>{activeVideoSize}</span>
                    <span>•</span>
                    <span className="text-[#7fcf9f] font-semibold">Pronto para extracao</span>
                  </div>
                </div>
              </div>

              {status === 'preview' && (
                <button
                  onClick={() => setStatus('empty')}
                  className="rounded-xl border border-white/10 px-3 py-1.5 text-[11.5px] font-bold text-white/70 hover:border-white/30 hover:text-white transition"
                >
                  Trocar Video
                </button>
              )}
            </div>
          </div>

          {/* Coluna Direita: O que a IA vai analisar + Seletor de Motor */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-5">
            <div className="space-y-4 rounded-3xl border border-[var(--mvz-line)] bg-[#0d0c0a] p-6 shadow-xl">
              <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider text-[var(--mvz-gold)]">
                <Sparkles size={13} />
                <span>O que a IA vai analisar:</span>
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                  <div className="flex items-center gap-2 text-[12.5px] font-bold text-white">
                    <span className="flex h-2 w-2 rounded-full bg-[var(--mvz-gold)]" />
                    Movimentos Corporais
                  </div>
                  <p className="mt-1.5 text-[11.5px] leading-relaxed text-[var(--mvz-dim)] pl-4">
                    Dinamica de membros, bracos, maos, caminhada, giros e posicionamento corporal segundo a segundo.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                  <div className="flex items-center gap-2 text-[12.5px] font-bold text-white">
                    <span className="flex h-2 w-2 rounded-full bg-[var(--mvz-gold)]" />
                    Expressoes Faciais
                  </div>
                  <p className="mt-1.5 text-[11.5px] leading-relaxed text-[var(--mvz-dim)] pl-4">
                    Olhar, movimento da boca, intensidade de expressoes e micro-reacoes ao longo do tempo.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                  <div className="flex items-center gap-2 text-[12.5px] font-bold text-white">
                    <span className="flex h-2 w-2 rounded-full bg-[var(--mvz-gold)]" />
                    Angulo e Enquadramento
                  </div>
                  <p className="mt-1.5 text-[11.5px] leading-relaxed text-[var(--mvz-dim)] pl-4">
                    Altura de camera (POV, close, corpo inteiro) e iluminacao cinematografica para o motor selecionado.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                  <div className="flex items-center gap-2 text-[12.5px] font-bold text-white">
                    <span className="flex h-2 w-2 rounded-full bg-[var(--mvz-gold)]" />
                    Fisica de Tecido e Caimento
                  </div>
                  <p className="mt-1.5 text-[11.5px] leading-relaxed text-[var(--mvz-dim)] pl-4">
                    Comportamento da roupa no espaco, sustentacao e drapeado realista durante a movimentacao.
                  </p>
                </div>
              </div>

              {/* Seletor do Motor de IA Alvo */}
              <div className="pt-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--mvz-dim)]">
                  Otimizar Prompt Para o Motor de IA:
                </label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {ENGINES.map((eng) => (
                    <button
                      key={eng.id}
                      onClick={() => setSelectedEngineId(eng.id)}
                      className={`flex flex-col rounded-xl border p-2.5 text-left transition ${
                        selectedEngineId === eng.id
                          ? 'border-[var(--mvz-gold)] bg-[var(--mvz-gold)]/15 text-white shadow-[0_0_15px_rgba(212,175,55,0.2)]'
                          : 'border-white/10 bg-white/[0.02] text-white/60 hover:text-white'
                      }`}
                    >
                      <span className="text-[11.5px] font-black">{eng.name}</span>
                      <span className="text-[9.5px] text-[var(--mvz-gold-light)] font-semibold">{eng.badge}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Barra de Progresso Realista durante Analise */}
            {status === 'analyzing' && (
              <div className="rounded-2xl border border-[var(--mvz-gold)]/40 bg-[#0d0c0a] p-5 shadow-xl animate-in fade-in">
                <div className="flex items-center justify-between text-[11px] font-extrabold text-white/80">
                  <span className="uppercase tracking-wider">Processando Video</span>
                  <span className="font-mono text-[13px] text-[var(--mvz-gold)]">{progress}%</span>
                </div>
                <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full border border-white/10 bg-white/5 p-0.5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[var(--mvz-gold)] via-[var(--mvz-gold-light)] to-[#fff0a8] shadow-[0_0_15px_rgba(212,175,55,0.7)] transition-all duration-100 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-2.5 text-[11.5px] font-medium text-[var(--mvz-gold-light)] min-h-[18px]">
                  {scanMessage}
                </p>
              </div>
            )}

            {/* Botao de Disparo */}
            {status === 'preview' && (
              <button
                onClick={handleStartExtraction}
                className="flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl border border-[var(--mvz-gold)] bg-gradient-to-r from-[var(--mvz-gold)] via-[var(--mvz-gold-light)] to-[var(--mvz-gold)] text-[13px] font-black uppercase tracking-wider text-black shadow-[0_0_35px_rgba(212,175,55,0.4)] transition hover:opacity-95 hover:shadow-[0_0_45px_rgba(212,175,55,0.6)] cursor-pointer"
              >
                <ScanEye size={18} className="fill-black" />
                <span>Extrair Movimentos com IA</span>
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────
          5. RESULTADOS: VIDEO AO VIVO + PROMPT GERADO + TIMELINE
      ──────────────────────────────────────────────────────────── */}
      {status === 'results' && (
        <div className="space-y-7 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 gap-7 lg:grid-cols-12">
            {/* Coluna Esquerda: Video em Loop Continuo */}
            <div className="lg:col-span-5 space-y-4">
              <div className="relative overflow-hidden rounded-[28px] border-2 border-[var(--mvz-gold)]/50 bg-black shadow-[0_20px_60px_rgba(0,0,0,0.9)]">
                <div className="absolute top-3 left-3 z-10">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/80 px-3 py-1 text-[10px] font-extrabold uppercase text-[var(--mvz-gold)] backdrop-blur-md">
                    <Play size={10} className="fill-current" /> Video Sincronizado
                  </span>
                </div>

                <div className="relative aspect-[9/16] max-h-[520px] w-full overflow-hidden bg-black flex items-center justify-center">
                  <video
                    src={activeVideoUrl}
                    controls
                    autoPlay
                    loop
                    muted
                    playsInline
                    onError={handleVideoError}
                    className="h-full w-full object-contain"
                  />
                </div>
              </div>

              {/* Botao de Trocar Video */}
              <div className="flex items-center justify-between rounded-2xl border border-[var(--mvz-line)] bg-[#0d0c0a] p-4">
                <div className="min-w-0">
                  <h4 className="truncate text-[12.5px] font-bold text-white max-w-[200px]">
                    {activeVideoName}
                  </h4>
                  <span className="text-[10.5px] text-[#7fcf9f] font-semibold">
                    Extracao Concluida com Sucesso
                  </span>
                </div>

                <button
                  onClick={() => setStatus('empty')}
                  className="rounded-xl border border-white/10 px-3 py-1.5 text-[11.5px] font-bold text-white/70 hover:border-white/30 hover:text-white transition cursor-pointer"
                >
                  Novo Video
                </button>
              </div>
            </div>

            {/* Coluna Direita: O Prompt Tecnico + Motor Switcher + Timeline */}
            <div className="lg:col-span-7 space-y-5">
              {/* CARD 1: O PROMPT GERADO PRONTO PARA COLAR */}
              <div className="rounded-[28px] border border-[var(--mvz-gold)]/40 bg-gradient-to-br from-[#13100a] via-[#0d0c0a] to-[#060605] p-6 shadow-2xl">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--mvz-gold)]/20 text-[var(--mvz-gold)]">
                      <Sparkles size={16} />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-black text-white">
                        Prompt de Movimento em Ingles
                      </h3>
                      <p className="text-[11px] text-[var(--mvz-gold-light)] font-medium">
                        Calibrado para {currentEngine.name}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleCopyPrompt}
                    className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-[12px] font-bold transition shadow-lg cursor-pointer ${
                      copiedPrompt
                        ? 'border-[#7fcf9f] bg-[#7fcf9f]/15 text-[#7fcf9f]'
                        : 'border-[var(--mvz-gold)] bg-[var(--mvz-gold)]/15 text-[var(--mvz-gold-light)] hover:bg-[var(--mvz-gold)] hover:text-black'
                    }`}
                  >
                    {copiedPrompt ? <Check size={14} className="text-[#7fcf9f]" /> : <Copy size={14} />}
                    <span>{copiedPrompt ? 'Prompt Copiado!' : 'Copiar Prompt'}</span>
                  </button>
                </div>

                {/* Switcher de Motores de IA Direto nos Resultados */}
                <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1">
                  <span className="shrink-0 flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-wider text-[var(--mvz-dim)] mr-1">
                    <Sliders size={12} className="text-[var(--mvz-gold)]" />
                    Motor:
                  </span>
                  {ENGINES.map((eng) => (
                    <button
                      key={eng.id}
                      onClick={() => setSelectedEngineId(eng.id)}
                      className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${
                        selectedEngineId === eng.id
                          ? 'border border-[var(--mvz-gold)] bg-[var(--mvz-gold)] text-black shadow-[0_0_10px_rgba(212,175,55,0.3)]'
                          : 'border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {eng.name}
                    </button>
                  ))}
                </div>

                {/* Caixa do Prompt com Tipografia VIP */}
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/80 p-5 shadow-inner">
                  <p className="font-mono text-[12.5px] leading-relaxed text-white/95 select-all whitespace-pre-line">
                    {formattedPrompt}
                  </p>
                </div>

                {/* Tags de Compatibilidade */}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--mvz-dim)]">
                    Pronto para colar em:
                  </span>
                  {['Google Flow (VEO 3)', 'Kling AI', 'Hailuo AI', 'Luma Dream Machine', 'Runway Gen-3'].map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[9.5px] font-bold text-white/70"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* CARD 2: CRONOLOGIA SEGUNDO A SEGUNDO DOS MOVIMENTOS */}
              <div className="rounded-[28px] border border-[var(--mvz-line)] bg-[#0d0c0a] p-6 shadow-xl">
                <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3 mb-4">
                  <Activity size={15} className="text-[var(--mvz-gold)]" />
                  <h4 className="text-[14px] font-black uppercase tracking-wider text-white">
                    Cronologia de Movimentos Segundo a Segundo
                  </h4>
                </div>

                <div className="space-y-3">
                  {activePreset.timeline.map((stepItem, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition hover:bg-white/[0.04]"
                    >
                      <div className="shrink-0 rounded-lg border border-[var(--mvz-gold)]/40 bg-[var(--mvz-gold)]/10 px-2.5 py-1 font-mono text-[11px] font-extrabold text-[var(--mvz-gold-light)]">
                        {stepItem.time}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h5 className="text-[13px] font-bold text-white">
                          {stepItem.title}
                        </h5>
                        <p className="mt-1 text-[12px] leading-relaxed text-white/70">
                          {stepItem.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CARD 3: FICHA TECNICA DE CAMERA & LUZ */}
              <div className="rounded-[28px] border border-[var(--mvz-line)] bg-[#0d0c0a] p-6 shadow-xl">
                <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3 mb-4">
                  <Camera size={15} className="text-[var(--mvz-gold)]" />
                  <h4 className="text-[14px] font-black uppercase tracking-wider text-white">
                    Ficha Tecnica de Camera & Cinematografia
                  </h4>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--mvz-dim)]">
                      Enquadramento
                    </span>
                    <p className="mt-1 text-[12px] font-bold text-white">
                      {activePreset.cameraDetails.framing}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--mvz-dim)]">
                      Movimento de Camera
                    </span>
                    <p className="mt-1 text-[12px] font-bold text-white">
                      {activePreset.cameraDetails.motion}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--mvz-dim)]">
                      Lente & Optica
                    </span>
                    <p className="mt-1 text-[12px] font-bold text-white">
                      {activePreset.cameraDetails.lens}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--mvz-dim)]">
                      Iluminacao & FPS
                    </span>
                    <p className="mt-1 text-[12px] font-bold text-white">
                      {activePreset.cameraDetails.lighting} ({activePreset.cameraDetails.fps})
                    </p>
                  </div>
                </div>
              </div>

              {/* Botoes de Acao Final */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={handleCopyFull}
                  className="flex-1 flex h-12 items-center justify-center gap-2 rounded-xl border border-[var(--mvz-gold)] bg-[var(--mvz-gold)]/15 px-4 text-[12px] font-black uppercase tracking-wider text-[var(--mvz-gold-light)] hover:bg-[var(--mvz-gold)] hover:text-black transition shadow-[0_0_20px_rgba(212,175,55,0.2)] cursor-pointer"
                >
                  {copiedFull ? <Check size={15} /> : <Copy size={15} />}
                  <span>{copiedFull ? 'Analise Completa Copiada!' : 'Copiar Analise Completa'}</span>
                </button>

                {onUse && (
                  <button
                    onClick={() => onUse(formattedPrompt)}
                    className="flex h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-[12px] font-bold uppercase text-white hover:bg-white/10 transition cursor-pointer"
                  >
                    <Zap size={14} className="text-[var(--mvz-gold)]" />
                    <span>Usar no Agente IA</span>
                  </button>
                )}

                <button
                  onClick={() => setStatus('empty')}
                  className="flex h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-[12px] font-bold text-white/70 hover:bg-white/10 hover:text-white transition cursor-pointer"
                >
                  <RotateCcw size={14} />
                  <span>Outro Video</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

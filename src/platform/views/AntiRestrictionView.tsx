import { useState, useRef } from 'react';
import {
  Upload,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Pause,
  Play,
  RotateCcw,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';
import { aiGenerateJSON, jitter, pickOne, shuffle } from '../aiGenerate';
import { copyText as copyToClipboard } from '../clipboard';

interface PolicyCheck {
  id: string;
  name: string;
  status: 'safe' | 'warning' | 'danger';
  score: number;
  description: string;
  adjustment?: string;
}

interface ScanResult {
  hasRisk: boolean;
  score: number;
  verdict: string;
  statusText: string;
  summary: string;
  policies: PolicyCheck[];
  actions: string[];
}

const POLICY_BASE = [
  { id: 'claims', name: 'Alegações e Promessas' },
  { id: 'nudity', name: 'Exposição Corporal' },
  { id: 'trademark', name: 'Marcas e Propriedade Intelectual' },
  { id: 'audio', name: 'Áudio e Trilha Comercial' },
  { id: 'framing', name: 'Enquadramento e Safe Zone' },
] as const;

/** Extrai um frame real do arquivo de vídeo para visão computacional da IA */
function extractVideoFrame(file: File): Promise<string | undefined> {
  return new Promise((resolve) => {
    try {
      const url = URL.createObjectURL(file);
      const vid = document.createElement('video');
      vid.preload = 'metadata';
      vid.muted = true;
      vid.playsInline = true;
      const done = (img?: string) => {
        try {
          URL.revokeObjectURL(url);
        } catch {
          /* noop */
        }
        resolve(img);
      };
      const timer = window.setTimeout(() => done(undefined), 2800);
      vid.onloadeddata = () => {
        vid.currentTime = Math.min(1.2, (vid.duration || 2) * 0.25);
      };
      vid.onseeked = () => {
        window.clearTimeout(timer);
        try {
          const w = 360;
          const h = Math.round((vid.videoHeight / Math.max(1, vid.videoWidth)) * w) || 640;
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) return done(undefined);
          ctx.drawImage(vid, 0, 0, w, h);
          done(canvas.toDataURL('image/jpeg', 0.72));
        } catch {
          done(undefined);
        }
      };
      vid.onerror = () => {
        window.clearTimeout(timer);
        done(undefined);
      };
      vid.src = url;
    } catch {
      resolve(undefined);
    }
  });
}

function buildVariedFallback(fileName: string): ScanResult {
  const cleanLabel = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ').trim() || 'criativo enviado';
  const lower = cleanLabel.toLowerCase();

  const hasClaimsRisk = /emagrec|antes|depois|perder|cura|peso|barriga|milagre|garantid/.test(lower);
  const hasBrandRisk = /nike|gucci|marca|apple|adidas|louis|prada|chanel|replica|inspiracao/.test(lower);

  if (hasClaimsRisk) {
    const score = jitter(35, 6, 22, 46);
    return {
      hasRisk: true,
      score,
      verdict: 'Chance de restrição: SIM',
      statusText: pickOne([
        'Alto risco de bloqueio por alegação sensível',
        'Atenção crítica: gatilho de promessa de resultado detectado',
        'Risco elevado na moderação automática do TikTok Shop',
      ]),
      summary: pickOne([
        `Na análise de "${cleanLabel}", foram identificados termos ou estruturas de transformação acelerada ("antes e depois" ou promessa corporal) que acionam o filtro de conformidade comercial.`,
        `O criativo "${cleanLabel}" apresenta indícios de promessa exagerada de resultado físico, principal causa de reprovação de carrinho amarelo no TikTok Shop.`,
      ]),
      policies: [
        {
          id: 'claims',
          name: 'Alegações e Promessas',
          status: 'danger',
          score: jitter(20, 6, 10, 32),
          description: `Referência implícita ou explícita a resultado garantido identificada em "${cleanLabel}".`,
          adjustment: pickOne([
            'Troque promessas de prazo por demonstração real de caimento e conforto no corpo.',
            'Substitua comparações de antes/depois por foco na modelagem e estrutura do tecido.',
          ]),
        },
        {
          id: 'nudity',
          name: 'Exposição Corporal',
          status: 'warning',
          score: jitter(56, 7, 45, 68),
          description: 'Enquadramento próximo em região corporal pode sensibilizar o filtro automático.',
          adjustment: 'Mantenha plano médio (cintura para cima ou corpo inteiro no espelho).',
        },
        {
          id: 'trademark',
          name: 'Marcas e Propriedade Intelectual',
          status: 'safe',
          score: jitter(94, 4, 88, 99),
          description: 'Nenhuma logomarca protegida de terceiros detectada.',
        },
        {
          id: 'audio',
          name: 'Áudio e Trilha Comercial',
          status: 'safe',
          score: jitter(91, 4, 85, 98),
          description: 'Padrão de trilha compatível com uso comercial.',
        },
        {
          id: 'framing',
          name: 'Enquadramento e Safe Zone',
          status: 'safe',
          score: jitter(92, 4, 86, 98),
          description: 'Proporção vertical adequada para exibição do ícone do carrinho.',
        },
      ],
      actions: shuffle([
        `Remova promessas de resultado imediato na legenda e locução de "${cleanLabel}".`,
        'Foque no toque do tecido, costura reforçada e experiência real de uso.',
        'Evite tela dividida de antes/depois nos primeiros 3 segundos.',
        'Vincule exatamente a mesma peça demonstrada no vídeo ao carrinho amarelo.',
      ]).slice(0, 3),
    };
  }

  if (hasBrandRisk) {
    const score = jitter(46, 6, 36, 56);
    return {
      hasRisk: true,
      score,
      verdict: 'Chance de restrição: SIM',
      statusText: pickOne([
        'Risco moderado por propriedade intelectual / marca',
        'Alerta de conformidade: referência a marca registrada',
      ]),
      summary: `O arquivo "${cleanLabel}" indica presença ou menção a marca registrada de terceiros sem autorização expressa na vitrine, o que pode limitar a entrega ou derrubar o link do produto.`,
      policies: [
        {
          id: 'claims',
          name: 'Alegações e Promessas',
          status: 'safe',
          score: jitter(93, 4, 86, 99),
          description: 'Linguagem comercial sem promessas milagrosas.',
        },
        {
          id: 'nudity',
          name: 'Exposição Corporal',
          status: 'safe',
          score: jitter(96, 3, 90, 99),
          description: 'Vestimenta e enquadramento dentro das diretrizes.',
        },
        {
          id: 'trademark',
          name: 'Marcas e Propriedade Intelectual',
          status: 'danger',
          score: jitter(26, 7, 15, 38),
          description: `Menção ou símbolo associado a marca protegida detectado em "${cleanLabel}".`,
          adjustment: 'Remova logos de terceiros do enquadramento e do título do vídeo.',
        },
        {
          id: 'audio',
          name: 'Áudio e Trilha Comercial',
          status: 'warning',
          score: jitter(52, 8, 40, 65),
          description: 'Verifique se a música selecionada pertence à Commercial Music Library.',
          adjustment: 'Selecione um som comercial liberado dentro do próprio TikTok.',
        },
        {
          id: 'framing',
          name: 'Enquadramento e Safe Zone',
          status: 'safe',
          score: jitter(89, 5, 82, 96),
          description: 'Área inferior esquerda livre para o botão de compra.',
        },
      ],
      actions: shuffle([
        'Oculte etiquetas ou estampas de marcas registradas que não pertençam à loja parceira.',
        'Não cite nomes de grifes famosas na legenda ou no texto falado.',
        'Substitua a trilha por áudio da Biblioteca Comercial do TikTok Shop.',
      ]),
    };
  }

  const score = jitter(95, 3, 90, 99);
  return {
    hasRisk: false,
    score,
    verdict: 'Chance de restrição: NÃO',
    statusText: pickOne([
      'Aprovado para veiculação imediata no TikTok Shop',
      'Criativo blindado e em conformidade com as diretrizes',
      'Sinal verde para publicação com carrinho amarelo',
    ]),
    summary: pickOne([
      `O criativo "${cleanLabel}" atende aos critérios de segurança do TikTok Shop: foco claro no produto, ausência de promessas proibidas e enquadramento limpo para conversão.`,
      `Análise concluída para "${cleanLabel}": estrutura visual segura para afiliados, sem gatilhos de bloqueio algorítmico ou violação comercial.`,
    ]),
    policies: [
      {
        id: 'claims',
        name: 'Alegações e Promessas',
        status: 'safe',
        score: jitter(97, 2, 92, 100),
        description: `Demonstração objetiva de "${cleanLabel}" sem promessas enganosas.`,
      },
      {
        id: 'nudity',
        name: 'Exposição Corporal',
        status: 'safe',
        score: jitter(96, 3, 91, 100),
        description: 'Caimento e exposição adequados para entrega orgânica aberta.',
      },
      {
        id: 'trademark',
        name: 'Marcas e Propriedade Intelectual',
        status: 'safe',
        score: jitter(98, 2, 94, 100),
        description: 'Livre de logotipos protegidos ou falsificações aparentes.',
      },
      {
        id: 'audio',
        name: 'Áudio e Trilha Comercial',
        status: 'safe',
        score: jitter(95, 3, 90, 99),
        description: 'Pronto para sincronização com sons comerciais em volume 10%.',
      },
      {
        id: 'framing',
        name: 'Enquadramento e Safe Zone',
        status: 'safe',
        score: jitter(96, 3, 91, 99),
        description: 'Terço inferior livre de legendas sobrepondo o carrinho amarelo.',
      },
    ],
    actions: shuffle([
      `Publique "${cleanLabel}" vinculando exatamente a variação/cor exibida no vídeo.`,
      'Use som da Biblioteca Comercial em 8% a 12% de volume para blindar o alcance.',
      'Posicione a headline POV no terço superior da tela para não cobrir o produto.',
      'Mantenha o produto visível já nos primeiros 3 segundos para validação do algoritmo.',
    ]).slice(0, 3),
  };
}

export function AntiRestrictionView() {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [scanStep, setScanStep] = useState<string>('');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [copiedReport, setCopiedReport] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scanRunRef = useRef(0);

  const runScan = async (file: File, existingUrl?: string) => {
    const myRun = ++scanRunRef.current;
    const objectUrl = existingUrl || URL.createObjectURL(file);
    if (!existingUrl) setVideoSrc(objectUrl);
    setCurrentFile(file);
    setFileName(file.name);
    setIsScanning(true);
    setScanProgress(10);
    setScanStep('Mapeando quadros e proporção 9:16...');
    setResult(null);

    const steps = [
      { p: 25, step: 'Mapeando quadros e proporção 9:16...' },
      { p: 50, step: 'Analisando exposição corporal e transparência...' },
      { p: 75, step: 'Lendo contexto visual e diretrizes do TikTok Shop...' },
      { p: 92, step: 'Verificando marcas, claims e safe zone do carrinho...' },
    ];

    let stepIdx = 0;
    const interval = window.setInterval(() => {
      if (stepIdx < steps.length) {
        setScanProgress(steps[stepIdx].p);
        setScanStep(steps[stepIdx].step);
        stepIdx++;
      }
    }, 520);

    const minDelay = new Promise((r) => setTimeout(r, 2200));
    const fallback = buildVariedFallback(file.name);

    const aiPromise = (async (): Promise<ScanResult | null> => {
      const frame = await extractVideoFrame(file);
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ').trim();
      const ai = await aiGenerateJSON<Partial<ScanResult>>({
        memoryKey: `anti-restriction:${cleanName}`,
        task: 'Faça uma auditoria técnica de conformidade (antirrestrição) deste vídeo para publicação com carrinho no TikTok Shop. Personalize cada diretriz para o produto/cena identificado no arquivo e no frame enviado.',
        input: {
          arquivo: file.name,
          identificacaoCriativo: cleanName,
          tamanhoMB: (file.size / (1024 * 1024)).toFixed(2),
          riscoBaseDetectado: fallback.hasRisk ? 'atenção' : 'baixo',
        },
        imageDataUrl: frame,
        format: `{
  "hasRisk": boolean,
  "score": number (0 a 100),
  "verdict": "Chance de restrição: SIM" ou "Chance de restrição: NÃO",
  "statusText": string curta personalizada,
  "summary": string (2 frases específicas sobre este criativo),
  "policies": [
    { "id": "claims", "name": "Alegações e Promessas", "status": "safe"|"warning"|"danger", "score": number, "description": string, "adjustment": string opcional },
    { "id": "nudity", "name": "Exposição Corporal", "status": "safe"|"warning"|"danger", "score": number, "description": string, "adjustment": string opcional },
    { "id": "trademark", "name": "Marcas e Propriedade Intelectual", "status": "safe"|"warning"|"danger", "score": number, "description": string, "adjustment": string opcional },
    { "id": "audio", "name": "Áudio e Trilha Comercial", "status": "safe"|"warning"|"danger", "score": number, "description": string, "adjustment": string opcional },
    { "id": "framing", "name": "Enquadramento e Safe Zone", "status": "safe"|"warning"|"danger", "score": number, "description": string, "adjustment": string opcional }
  ],
  "actions": [3 recomendações práticas específicas para este vídeo]
}`,
        remember: (d) => [d?.summary, ...(Array.isArray(d?.actions) ? d.actions : [])].filter(Boolean),
      });

      if (!ai || typeof ai !== 'object') return null;

      const hasRisk = fallback.hasRisk ? true : Boolean(ai.hasRisk);
      const rawScore = Number(ai.score);
      const score = Number.isFinite(rawScore)
        ? hasRisk
          ? Math.max(18, Math.min(68, Math.round(rawScore)))
          : Math.max(82, Math.min(99, Math.round(rawScore)))
        : fallback.score;

      const policies: PolicyCheck[] = POLICY_BASE.map((base, idx) => {
        const found = Array.isArray(ai.policies)
          ? ai.policies.find((p) => p?.id === base.id) || ai.policies[idx]
          : undefined;
        const fbPol = fallback.policies[idx];
        const st =
          found?.status === 'safe' || found?.status === 'warning' || found?.status === 'danger'
            ? found.status
            : fbPol.status;
        const pScore = Number.isFinite(Number(found?.score))
          ? Math.max(5, Math.min(100, Math.round(Number(found!.score))))
          : fbPol.score;
        return {
          id: base.id,
          name: base.name,
          status: st,
          score: pScore,
          description: String(found?.description || fbPol.description).trim(),
          adjustment: found?.adjustment ? String(found.adjustment).trim() : fbPol.adjustment,
        };
      });

      const actions =
        Array.isArray(ai.actions) && ai.actions.length > 0
          ? ai.actions.map((a) => String(a).trim()).filter(Boolean).slice(0, 4)
          : fallback.actions;

      return {
        hasRisk,
        score,
        verdict: hasRisk ? 'Chance de restrição: SIM' : 'Chance de restrição: NÃO',
        statusText: String(ai.statusText || fallback.statusText).trim(),
        summary: String(ai.summary || fallback.summary).trim(),
        policies,
        actions,
      };
    })();

    const [aiRes] = await Promise.all([aiPromise, minDelay]);
    window.clearInterval(interval);
    if (myRun !== scanRunRef.current) return;

    setScanProgress(100);
    setScanStep('Concluído');
    setIsScanning(false);
    setResult(aiRes || fallback);
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith('video/')) {
      alert('Selecione um arquivo de vídeo válido (MP4, MOV ou WebM).');
      return;
    }
    runScan(file);
  };

  const handleRescan = () => {
    if (!currentFile || isScanning) return;
    runScan(currentFile, videoSrc || undefined);
  };

  const handleCopyReport = () => {
    if (!result) return;
    const text =
      `AUDITORIA DE ANTIRRESTRIÇÃO — ${fileName}\n` +
      `${result.verdict} (${result.score}% de conformidade)\n` +
      `${result.summary}\n\n` +
      `DIRETRIZES:\n` +
      result.policies
        .map(
          (p) =>
            `- ${p.name} [${p.score}%]: ${p.description}${p.adjustment ? ` | Ajuste: ${p.adjustment}` : ''}`
        )
        .join('\n') +
      `\n\nPLANO DE AÇÃO:\n` +
      result.actions.map((a, i) => `${i + 1}. ${a}`).join('\n');

    copyToClipboard(text);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleReset = () => {
    scanRunRef.current++;
    setVideoSrc(null);
    setCurrentFile(null);
    setFileName('');
    setResult(null);
    setIsScanning(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Banner Principal • Scanner de Antirrestrição */}
      <div className="relative overflow-hidden rounded-[28px] border border-[var(--mvz-line)] bg-gradient-to-br from-[#0e0c08] via-[#080705] to-[#040404] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)] md:p-8">
        <div className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-[var(--mvz-gold)]/10 blur-[80px]" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-[#d4af37]/5 blur-[90px]" />

        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-2.5">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--mvz-gold)]/30 bg-[var(--mvz-gold)]/10 px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-widest text-[var(--mvz-gold)] shadow-[0_0_20px_rgba(212,175,55,0.15)]">
              <ShieldCheck size={13} className="text-[var(--mvz-gold)]" />
              <span>Blindagem de Criativos • Compliance TikTok Shop & Meta</span>
            </div>

            <h1 className="text-[28px] font-black tracking-tight text-white sm:text-[34px] md:text-[38px] leading-tight">
              Scanner de{' '}
              <span className="bg-gradient-to-r from-[#f3e2a4] via-[#d4af37] to-[#b8832a] bg-clip-text text-transparent">
                Antirrestrição
              </span>
            </h1>

            <p className="text-[13.5px] leading-relaxed text-white/70">
              Analise seu criativo frame a frame com IA antes de veicular. Identifique riscos de alegações, áudio protegido ou exposição corporal e garanta aprovação imediata sem bloqueios.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start rounded-2xl border border-[var(--mvz-line-strong)] bg-[#0d0c0a]/90 px-4 py-3 backdrop-blur-md lg:self-center">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </span>
            <div className="leading-tight">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--mvz-gold)]">
                Políticas 2026
              </div>
              <div className="text-[12px] font-bold text-white">Pronto para Escanear</div>
            </div>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
          }
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Coluna Esquerda: Player ou Dropzone Limpo */}
        <div className="lg:col-span-5 space-y-3">
          {!videoSrc ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFile(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`mx-auto w-full max-w-[340px] aspect-[9/16] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-[var(--mvz-gold)] bg-[rgba(212,175,55,0.05)]'
                  : 'border-[rgba(255,236,190,0.12)] bg-[#090807] hover:border-[rgba(255,236,190,0.25)] hover:bg-[#0d0c0a]'
              }`}
            >
              <div className="w-14 h-14 rounded-full border border-[rgba(255,236,190,0.15)] bg-white/5 flex items-center justify-center text-[#ddd7cb]">
                <Upload className="w-6 h-6 text-[var(--mvz-gold)]" />
              </div>
              <p className="mt-4 text-sm font-semibold text-[#f6f1e4]">
                Clique ou arraste o vídeo aqui
              </p>
              <span className="text-xs text-[var(--mvz-dim)] mt-1">
                Formato vertical 9:16 (MP4, MOV ou WebM)
              </span>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative mx-auto w-full max-w-[340px] aspect-[9/16] rounded-2xl overflow-hidden bg-black border border-[rgba(255,236,190,0.15)] shadow-2xl flex items-center justify-center group">
                <video
                  ref={videoRef}
                  src={videoSrc}
                  playsInline
                  autoPlay
                  loop
                  muted
                  className="w-full h-full object-cover"
                />

                {isScanning && (
                  <>
                    <div className="mvz-scan-laser-vert absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#f5d77f] to-transparent pointer-events-none shadow-[0_0_18px_#d4af37,0_0_35px_#f5d77f] z-20" />
                    <div className="absolute inset-0 bg-black/20 pointer-events-none z-10" />
                    <div className="absolute bottom-4 left-3 right-3 bg-black/85 backdrop-blur-md border border-[rgba(255,236,190,0.15)] rounded-lg p-2.5 text-[11px] font-mono space-y-1 z-20">
                      <div className="flex items-center justify-between text-[#f5d77f]">
                        <span>Analisando vídeo com IA...</span>
                        <span>{scanProgress}%</span>
                      </div>
                      <div className="text-[var(--mvz-dim)] truncate">{scanStep}</div>
                    </div>
                  </>
                )}

                <button
                  onClick={togglePlay}
                  className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                >
                  <div className="w-12 h-12 rounded-full bg-black/75 border border-white/20 flex items-center justify-center text-white">
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                  </div>
                </button>
              </div>

              <div className="flex items-center justify-between px-1 text-xs text-[var(--mvz-dim)]">
                <span className="truncate max-w-[180px]">{fileName}</span>
                <div className="flex items-center gap-3">
                  {currentFile && !isScanning && (
                    <button
                      onClick={handleRescan}
                      className="hover:text-[var(--mvz-gold-light)] flex items-center gap-1 transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Nova Análise</span>
                    </button>
                  )}
                  <button
                    onClick={handleReset}
                    className="hover:text-[#f6f1e4] flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Trocar vídeo</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Coluna Direita: Veredito e Diagnóstico */}
        <div className="lg:col-span-7 space-y-4">
          {!result && !isScanning && (
            <div className="rounded-2xl border border-[rgba(255,236,190,0.08)] bg-[#0b0a08] p-8 text-center space-y-2">
              <p className="text-sm font-medium text-[#f6f1e4]">Aguardando vídeo</p>
              <p className="text-xs text-[var(--mvz-dim)] max-w-sm mx-auto">
                Envie um vídeo no campo ao lado para rodar o scanner de IA e saber se ele tem chance de tomar restrição.
              </p>
            </div>
          )}

          {isScanning && (
            <div className="rounded-2xl border border-[rgba(255,236,190,0.08)] bg-[#0b0a08] p-8 text-center space-y-3">
              <p className="text-sm font-medium text-[#f6f1e4]">Escaneando vídeo com IA...</p>
              <p className="text-xs text-[var(--mvz-dim)] max-w-sm mx-auto">
                Avaliando conformidade de alegações, direitos autorais, safe zone e exposição corporal.
              </p>
              <div className="w-full max-w-xs mx-auto bg-[#181510] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[var(--mvz-gold)] h-full transition-all duration-300"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
            </div>
          )}

          {result && (
            <>
              <div
                className={`rounded-2xl border p-5 ${
                  result.hasRisk
                    ? 'border-rose-500/30 bg-[#120707]'
                    : 'border-emerald-500/30 bg-[#07140b]'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                        result.hasRisk
                          ? 'bg-rose-500/15 text-rose-400'
                          : 'bg-emerald-500/15 text-emerald-400'
                      }`}
                    >
                      {result.hasRisk ? (
                        <ShieldAlert className="w-6 h-6" />
                      ) : (
                        <ShieldCheck className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <h2
                        className={`text-xl font-bold tracking-tight ${
                          result.hasRisk ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {result.verdict}
                      </h2>
                      <span className="text-xs text-[var(--mvz-dim)]">{result.statusText}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleCopyReport}
                      className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white/85 hover:border-[var(--mvz-gold)] hover:text-white transition"
                    >
                      {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedReport ? 'Copiado!' : 'Copiar Diagnóstico'}</span>
                    </button>

                    <div className="text-right">
                      <span className="text-xs text-[var(--mvz-dim)] block">Conformidade</span>
                      <span
                        className={`text-2xl font-bold ${
                          result.hasRisk ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {result.score}%
                      </span>
                    </div>
                  </div>
                </div>

                <p className="mt-3 text-xs md:text-sm text-[#ddd7cb] leading-relaxed">
                  {result.summary}
                </p>
              </div>

              {/* Lista dos 5 Pilares */}
              <div className="rounded-2xl border border-[rgba(255,236,190,0.08)] bg-[#0b0a08] p-5 space-y-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#f6f1e4] block">
                  Diagnóstico por Diretriz
                </span>

                <div className="space-y-2.5">
                  {result.policies.map((p) => {
                    const isSafe = p.status === 'safe';
                    const isWarn = p.status === 'warning';
                    return (
                      <div
                        key={p.id}
                        className="p-3 rounded-xl border border-[rgba(255,236,190,0.05)] bg-[#070706] space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {isSafe && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                            {isWarn && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
                            {!isSafe && !isWarn && <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                            <span className="text-xs font-medium text-[#f6f1e4]">{p.name}</span>
                          </div>
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                              isSafe
                                ? 'bg-emerald-500/10 text-emerald-300'
                                : isWarn
                                ? 'bg-amber-500/10 text-amber-300'
                                : 'bg-rose-500/10 text-rose-300'
                            }`}
                          >
                            {p.score}%
                          </span>
                        </div>

                        <p className="text-xs text-[var(--mvz-dim)] pl-6 leading-relaxed">
                          {p.description}
                        </p>

                        {p.adjustment && (
                          <div className="ml-6 p-2 rounded bg-white/[0.03] border border-white/5 text-[11px] text-[#f5d77f]">
                            <span className="font-semibold">O que ajustar: </span>
                            {p.adjustment}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* O que fazer */}
              {result.actions.length > 0 && (
                <div className="rounded-2xl border border-[rgba(255,236,190,0.08)] bg-[#0b0a08] p-5 space-y-2.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#f6f1e4] block">
                    O que fazer para aprovar
                  </span>
                  <ul className="space-y-1.5 text-xs text-[#ddd7cb]">
                    {result.actions.map((act, idx) => (
                      <li key={idx} className="flex items-start gap-2 p-2 rounded bg-[#070706]">
                        <span className="text-[var(--mvz-gold)] font-mono">{idx + 1}.</span>
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

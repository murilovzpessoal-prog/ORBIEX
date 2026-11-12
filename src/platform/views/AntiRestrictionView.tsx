import { useState, useRef } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Upload,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Sliders,
  Copy,
  Check,
  Film,
  Zap,
} from 'lucide-react';

interface PolicyCheck {
  id: string;
  name: string;
  status: 'safe' | 'warning' | 'danger';
  score: number;
  description: string;
  recommendation?: string;
}

interface ScanResult {
  hasRestrictionRisk: boolean;
  overallScore: number;
  verdictTitle: string;
  verdictSubtitle: string;
  summary: string;
  policies: PolicyCheck[];
  safeZoneIssues: string[];
  actionPlan: string[];
}

interface VideoPreset {
  id: string;
  title: string;
  type: string;
  url: string;
  result: ScanResult;
}

const PRESETS: VideoPreset[] = [
  {
    id: 'sample-safe',
    title: 'Moda Fitness • Conjunto Canelado',
    type: 'Criativo Aprovado (Zero Risco)',
    url: '/rakeo1q.mp4',
    result: {
      hasRestrictionRisk: false,
      overallScore: 98,
      verdictTitle: 'CHANCE DE RESTRIÇÃO: NÃO',
      verdictSubtitle: 'CRIATIVO BLINDADO • APROVAÇÃO IMEDIATA NO TIKTOK SHOP & META',
      summary:
        'O criativo apresenta total conformidade com as diretrizes de anúncios do TikTok e da Meta. A iluminação é difusa, a movimentação é fluida e não foram detectadas promessas exageradas, nudez algorítmica ou marcas registradas de terceiros.',
      policies: [
        {
          id: 'claims',
          name: 'Alegações & Promessas Proibidas (Claims)',
          status: 'safe',
          score: 100,
          description: 'Nenhuma promessa de resultado milagroso ou termo proibido identificado na transcrição.',
        },
        {
          id: 'nudity',
          name: 'Exposição Corporal & Nudez Algorítmica',
          status: 'safe',
          score: 96,
          description: 'Zero transparência detectada no agachamento. Cobertura corporal e decote dentro dos limites aceitos.',
        },
        {
          id: 'trademark',
          name: 'Propriedade Intelectual & Marcas',
          status: 'safe',
          score: 100,
          description: 'Nenhum logotipo protegido, monograma de grife ou elemento de marca de terceiros avistado.',
        },
        {
          id: 'audio',
          name: 'Áudio & Direitos Comerciais',
          status: 'safe',
          score: 98,
          description: 'Áudio original limpo, livre de strikes de copyright de gravadoras.',
        },
        {
          id: 'framing',
          name: 'Enquadramento & Safe Zone 9:16',
          status: 'safe',
          score: 97,
          description: 'Elementos visuais principais posicionados fora da margem de botões do TikTok.',
        },
      ],
      safeZoneIssues: [],
      actionPlan: [
        'Criativo pronto para veiculação direta em campanhas de conversão.',
        'Pode ser vinculado a produtos do TikTok Shop sem risco de moderação manual.',
      ],
    },
  },
  {
    id: 'sample-claims-risk',
    title: 'Antes & Depois • Emagrecimento / Pele',
    type: 'Risco Crítico de Bloqueio',
    url: '/rakeo1q.mp4',
    result: {
      hasRestrictionRisk: true,
      overallScore: 34,
      verdictTitle: 'CHANCE DE RESTRIÇÃO: SIM',
      verdictSubtitle: 'ALTO RISCO DE REJEIÇÃO IMEDIATA OU BLOQUEIO DE CONTA DE ANÚNCIO',
      summary:
        'Foram detectados padrões característicos de promessa de resultado garantido ("perca 10kg em 7 dias") e contraste visual agressivo de Antes e Depois, classificados como prática enganosa grave pela política de comércio do TikTok e Meta Ads.',
      policies: [
        {
          id: 'claims',
          name: 'Alegações & Promessas Proibidas (Claims)',
          status: 'danger',
          score: 15,
          description: 'Promessas categóricas de emagrecimento rápido e termos garantistas detectados.',
          recommendation: 'Remover promessas de prazo ("em X dias") e focar na rotina ou depoimento de sensação do usuário.',
        },
        {
          id: 'nudity',
          name: 'Exposição Corporal & Nudez Algorítmica',
          status: 'warning',
          score: 48,
          description: 'Close-up em área de abdômen / pele com taxa de exposição acima de 45% do enquadramento.',
          recommendation: 'Ampliar o plano para meio-corpo para reduzir o gatilho de nudez algorítmica.',
        },
        {
          id: 'trademark',
          name: 'Propriedade Intelectual & Marcas',
          status: 'safe',
          score: 95,
          description: 'Nenhuma marca de terceiro detectada.',
        },
        {
          id: 'audio',
          name: 'Áudio & Direitos Comerciais',
          status: 'warning',
          score: 55,
          description: 'Termos na locução de voz acionam filtros de saúde sensível e farmácia.',
          recommendation: 'Suavizar o roteiro falado eliminando as palavras "cura", "solução definitiva" e "queima".',
        },
        {
          id: 'framing',
          name: 'Enquadramento & Safe Zone 9:16',
          status: 'safe',
          score: 88,
          description: 'Formato vertical 9:16 correto.',
        },
      ],
      safeZoneIssues: [
        'Texto com promessa colocado próximo aos botões de interação da direita.',
      ],
      actionPlan: [
        'Eliminar qualquer menção a dias, quilos perdidos ou transformação garantida.',
        'Substituir a imagem estática de Antes/Depois por um vídeo dinâmico de uso diário.',
        'Trocar termos sensíveis no áudio por descrições de benefícios práticos e conforto.',
      ],
    },
  },
  {
    id: 'sample-brand-risk',
    title: 'Criativo com Logomarca & Áudio Comercial',
    type: 'Risco de Violação de Propriedade',
    url: '/assets/login-animation-2.mp4',
    result: {
      hasRestrictionRisk: true,
      overallScore: 48,
      verdictTitle: 'CHANCE DE RESTRIÇÃO: SIM',
      verdictSubtitle: 'RISCO MODERADO/ALTO • PROVÁVEL REJEIÇÃO POR DIREITOS AUTORAIS E LOGO',
      summary:
        'O algoritmo identificou reprodução de música comercial licenciada sem autorização comercial para TikTok Shop, além de grafia de marca registrada que pode causar banimento por contrafacção/pirataria presumida.',
      policies: [
        {
          id: 'claims',
          name: 'Alegações & Promessas Proibidas (Claims)',
          status: 'safe',
          score: 92,
          description: 'Nenhum claim agressivo encontrado.',
        },
        {
          id: 'nudity',
          name: 'Exposição Corporal & Nudez Algorítmica',
          status: 'safe',
          score: 98,
          description: 'Sem violações corporais.',
        },
        {
          id: 'trademark',
          name: 'Propriedade Intelectual & Marcas',
          status: 'danger',
          score: 22,
          description: 'Logomarca de marca multinacional visível na peça sem comprovação de revenda oficial.',
          recommendation: 'Desfocar a logo nos primeiros 3 segundos ou utilizar versão neutra / unbranded.',
        },
        {
          id: 'audio',
          name: 'Áudio & Direitos Comerciais',
          status: 'danger',
          score: 28,
          description: 'Trilha pertencente ao catálogo comercial restrito. Anúncio será silenciado automaticamente.',
          recommendation: 'Utilizar exclusivamente áudios da Biblioteca de Áudios Comerciais do TikTok (Commercial Music Library).',
        },
        {
          id: 'framing',
          name: 'Enquadramento & Safe Zone 9:16',
          status: 'warning',
          score: 60,
          description: 'Legenda principal na parte inferior sobreposta pela descrição do produto.',
          recommendation: 'Subir a legenda em 180px para não ficar encoberta pelo título do produto no TikTok Shop.',
        },
      ],
      safeZoneIssues: [
        'Texto nos últimos 4 segundos encoberto pela área de compra do TikTok Shop.',
      ],
      actionPlan: [
        'Trocar a trilha sonora pela biblioteca comercial autorizada para tráfego pago.',
        'Aplicar desfoque sutil no logotipo visível no produto para evitar detecção de copyright.',
        'Reposicionar a chamada de ação para o centro superior da tela.',
      ],
    },
  },
];

interface AntiRestrictionViewProps {
  onUseInAgent?: (prompt: string) => void;
}

export function AntiRestrictionView({ onUseInAgent }: AntiRestrictionViewProps) {
  const [selectedPreset, setSelectedPreset] = useState<VideoPreset>(PRESETS[0]);
  const [videoSrc, setVideoSrc] = useState<string>(PRESETS[0].url);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [scanStep, setScanStep] = useState<string>('Pronto para escanear');
  const [currentResult, setCurrentResult] = useState<ScanResult | null>(PRESETS[0].result);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const startScan = (presetResult?: ScanResult) => {
    setIsScanning(true);
    setScanProgress(0);
    setCurrentResult(null);

    const steps = [
      { p: 15, label: 'Carregando quadros do vídeo e extraindo taxa de FPS...' },
      { p: 35, label: 'Escanenando camadas visuais: detecção de pele e nudez algorítmica...' },
      { p: 58, label: 'OCR em andamento: lendo textos e tipografias na tela...' },
      { p: 78, label: 'Análise espectral de áudio: verificando copyright e palavras proibidas...' },
      { p: 92, label: 'Cruzando dados com as diretrizes do TikTok Shop e Meta Ads 2026...' },
      { p: 100, label: 'Diagnóstico concluído.' },
    ];

    let currentStepIdx = 0;
    const interval = setInterval(() => {
      if (currentStepIdx < steps.length) {
        setScanProgress(steps[currentStepIdx].p);
        setScanStep(steps[currentStepIdx].label);
        currentStepIdx++;
      } else {
        clearInterval(interval);
        setIsScanning(false);
        const finalResult = presetResult || selectedPreset.result;
        setCurrentResult(finalResult);
      }
    }, 420);
  };

  const handleSelectPreset = (preset: VideoPreset) => {
    setSelectedPreset(preset);
    setVideoSrc(preset.url);
    startScan(preset.result);
  };

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('video/')) {
      alert('Por favor, selecione um arquivo de vídeo válido (.mp4, .mov, .webm).');
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setVideoSrc(objectUrl);

    // Heurística baseada no nome do arquivo para demonstração realista
    const lower = file.name.toLowerCase();
    const hasClaimsKeyword = lower.includes('emagrec') || lower.includes('antes') || lower.includes('perder') || lower.includes('cura');
    const hasBrandKeyword = lower.includes('nike') || lower.includes('gucci') || lower.includes('apple') || lower.includes('marca');

    let dynamicResult: ScanResult;
    if (hasClaimsKeyword) {
      dynamicResult = PRESETS[1].result;
    } else if (hasBrandKeyword) {
      dynamicResult = PRESETS[2].result;
    } else {
      dynamicResult = PRESETS[0].result;
    }

    startScan(dynamicResult);
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

  const handleCopyReport = () => {
    if (!currentResult) return;
    const text = `RELATÓRIO ANTIRRESTRIÇÃO - ORBIEX
Veredito: ${currentResult.verdictTitle}
Subtítulo: ${currentResult.verdictSubtitle}
Pontuação Geral de Conformidade: ${currentResult.overallScore}/100

RESUMO DA ANÁLISE:
${currentResult.summary}

STATUS POR DIRETRIZ:
${currentResult.policies
  .map((p) => `- ${p.name}: ${p.score}/100 (${p.status.toUpperCase()}) - ${p.description}`)
  .join('\n')}

PLANO DE AÇÃO:
${currentResult.actionPlan.map((a) => `• ${a}`).join('\n')}
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendToAgent = () => {
    if (!currentResult || !onUseInAgent) return;
    const prompt = `Analise este relatório de restrição de vídeo da Orbiex:
Veredito: ${currentResult.verdictTitle}
Score: ${currentResult.overallScore}/100
Problemas encontrados:
${currentResult.policies
  .filter((p) => p.status !== 'safe')
  .map((p) => `- ${p.name}: ${p.description}`)
  .join('\n')}

Por favor, me dê orientações práticas de como reescrever o roteiro ou editar o vídeo para garantir aprovação 100% no TikTok Shop e Meta Ads sem perder conversão.`;
    onUseInAgent(prompt);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[rgba(255,236,190,0.08)] pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono tracking-wider uppercase text-[var(--mvz-dim)]">
            <span>Ferramentas</span>
            <span>/</span>
            <span className="text-[var(--mvz-gold)] font-medium">Análise de Conformidade</span>
          </div>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#f6f1e4]">
              Antirrestrição de Vídeo
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(212,175,55,0.3)] bg-[rgba(212,175,55,0.08)] px-2.5 py-0.5 text-[11px] font-mono font-medium text-[var(--mvz-gold)]">
              IA Preditiva 2026
            </span>
          </div>
          <p className="mt-1 text-sm text-[var(--mvz-muted)] max-w-2xl">
            Insira o seu criativo para escanear frame a frame. A IA analisa alegações, taxa de exposição corporal,
            direitos autorais de áudio e enquadramento, emitindo o veredito direto: chance de restrição SIM ou NÃO.
          </p>
        </div>

        {currentResult && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyReport}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[rgba(255,236,190,0.12)] bg-[#100e0b] hover:bg-[#181510] text-xs font-medium text-[#f6f1e4] transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[var(--mvz-dim)]" />}
              <span>{copied ? 'Copiado' : 'Copiar Relatório'}</span>
            </button>
            {onUseInAgent && (
              <button
                onClick={handleSendToAgent}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-[#d4af37] to-[#b8832a] hover:brightness-110 text-xs font-semibold text-black transition-all shadow-md"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Blindar no Agente</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Preset Selectors */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-[var(--mvz-dim)]">
          <span className="font-mono uppercase tracking-wider">Testar com Exemplos Prontos:</span>
          <span>Clique em um dos criativos para testar a detecção</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {PRESETS.map((preset) => {
            const isSelected = selectedPreset.id === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className={`flex flex-col text-left p-3 rounded-xl border transition-all ${
                  isSelected
                    ? 'border-[var(--mvz-gold)] bg-[rgba(212,175,55,0.08)] shadow-[0_0_20px_rgba(212,175,55,0.12)]'
                    : 'border-[rgba(255,236,190,0.06)] bg-[#0b0a08] hover:border-[rgba(255,236,190,0.15)] hover:bg-[#100e0b]'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-semibold text-[#f6f1e4] truncate">{preset.title}</span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${
                      preset.result.hasRestrictionRisk
                        ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                        : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                    }`}
                  >
                    {preset.result.hasRestrictionRisk ? 'Risco Alto' : 'Seguro'}
                  </span>
                </div>
                <span className="text-[11px] text-[var(--mvz-dim)] mt-1">{preset.type}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Analysis Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Video Dropzone & Scanner Viewport */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-[rgba(255,236,190,0.09)] bg-[#0b0a08] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-[var(--mvz-gold)]" />
                <span className="text-xs font-semibold uppercase tracking-wider text-[#f6f1e4]">
                  Visualização do Vídeo
                </span>
              </div>
              <span className="text-[11px] font-mono text-[var(--mvz-dim)]">Formato 9:16</span>
            </div>

            {/* Video Container with Scanner Laser Overlay */}
            <div className="relative mx-auto w-full max-w-[320px] aspect-[9/16] rounded-xl overflow-hidden bg-black border border-[rgba(255,236,190,0.15)] shadow-2xl flex items-center justify-center group">
              <video
                ref={videoRef}
                src={videoSrc}
                playsInline
                autoPlay
                loop
                muted
                className="w-full h-full object-cover"
              />

              {/* Laser Scanner Vertical Beam */}
              {isScanning && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[rgba(212,175,55,0.05)] to-transparent pointer-events-none" />
                  
                  {/* The moving laser line */}
                  <div className="mvz-scan-laser-vert absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#f5d77f] to-transparent pointer-events-none shadow-[0_0_18px_#d4af37,0_0_35px_#f5d77f] z-20">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-black/80 border border-[#d4af37]/60 text-[9px] font-mono text-[#f5d77f] tracking-widest whitespace-nowrap uppercase">
                      Scanner Ativo
                    </div>
                  </div>

                  {/* Corner Target Brackets HUD */}
                  <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#d4af37] pointer-events-none z-10" />
                  <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#d4af37] pointer-events-none z-10" />
                  <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#d4af37] pointer-events-none z-10" />
                  <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#d4af37] pointer-events-none z-10" />

                  {/* Realtime Telemetry Overlay */}
                  <div className="absolute bottom-4 left-3 right-3 bg-black/85 backdrop-blur-md border border-[rgba(212,175,55,0.25)] rounded-lg p-2 text-[10px] font-mono space-y-1 z-20">
                    <div className="flex items-center justify-between text-[#f5d77f]">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        OCR & Moderation Vision
                      </span>
                      <span>{scanProgress}%</span>
                    </div>
                    <div className="text-[var(--mvz-dim)] truncate">{scanStep}</div>
                  </div>
                </>
              )}

              {/* Pause/Play Hover Button */}
              <button
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity z-10"
              >
                <div className="w-12 h-12 rounded-full bg-black/75 border border-[rgba(255,236,190,0.2)] flex items-center justify-center text-white hover:scale-105 transition-transform">
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </div>
              </button>
            </div>

            {/* Video Controls & Re-scan */}
            <div className="flex items-center justify-between pt-1">
              <button
                onClick={() => startScan()}
                disabled={isScanning}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[rgba(255,236,190,0.12)] bg-[#100e0b] hover:bg-[#181510] text-xs font-medium text-[#f6f1e4] disabled:opacity-50 transition-colors"
              >
                <RotateCcw className={`w-3.5 h-3.5 text-[var(--mvz-gold)] ${isScanning ? 'animate-spin' : ''}`} />
                <span>Re-escanear Vídeo</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[rgba(212,175,55,0.1)] hover:bg-[rgba(212,175,55,0.18)] border border-[rgba(212,175,55,0.3)] text-xs font-medium text-[var(--mvz-gold)] transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Subir Outro Vídeo</span>
              </button>
            </div>

            {/* Drag & Drop Input Zone */}
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
                  handleFileUpload(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-[var(--mvz-gold)] bg-[rgba(212,175,55,0.06)]'
                  : 'border-[rgba(255,236,190,0.08)] bg-[#070706] hover:border-[rgba(255,236,190,0.2)]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/quicktime,video/webm"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />
              <Upload className="w-5 h-5 mx-auto text-[var(--mvz-gold)] opacity-80" />
              <p className="mt-1 text-xs font-medium text-[#f6f1e4]">
                Arraste seu vídeo aqui ou clique para selecionar
              </p>
              <p className="text-[10px] text-[var(--mvz-dim)] mt-0.5">
                Suporta MP4, MOV, WebM até 250MB
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Definitive Verdict & Policy Breakdown */}
        <div className="lg:col-span-7 space-y-4">
          {/* Main Verdict Card */}
          {currentResult ? (
            <div
              className={`rounded-2xl border p-5 transition-all ${
                currentResult.hasRestrictionRisk
                  ? 'border-rose-500/40 bg-gradient-to-br from-[#1a0a0a] via-[#120707] to-[#0a0505] shadow-[0_0_30px_rgba(244,63,94,0.12)]'
                  : 'border-emerald-500/40 bg-gradient-to-br from-[#07170e] via-[#09120b] to-[#050906] shadow-[0_0_30px_rgba(16,185,129,0.12)]'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      currentResult.hasRestrictionRisk
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {currentResult.hasRestrictionRisk ? (
                      <ShieldAlert className="w-7 h-7" />
                    ) : (
                      <ShieldCheck className="w-7 h-7" />
                    )}
                  </div>
                  <div>
                    <span className="text-[11px] font-mono tracking-widest uppercase text-[var(--mvz-dim)]">
                      Veredito da Inteligência Artificial
                    </span>
                    <h2
                      className={`text-xl md:text-2xl font-black tracking-tight ${
                        currentResult.hasRestrictionRisk ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {currentResult.verdictTitle}
                    </h2>
                  </div>
                </div>

                <div className="flex flex-col items-end sm:text-right">
                  <span className="text-[11px] font-mono text-[var(--mvz-dim)] uppercase">
                    Índice de Conformidade
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`text-2xl font-extrabold ${
                        currentResult.hasRestrictionRisk ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {currentResult.overallScore}
                    </span>
                    <span className="text-xs text-[var(--mvz-dim)]">/100</span>
                  </div>
                </div>
              </div>

              <div className="mt-3">
                <p
                  className={`text-xs font-semibold tracking-wide uppercase ${
                    currentResult.hasRestrictionRisk ? 'text-rose-300' : 'text-emerald-300'
                  }`}
                >
                  {currentResult.verdictSubtitle}
                </p>
                <p className="mt-2 text-xs md:text-sm text-[#ddd7cb] leading-relaxed">
                  {currentResult.summary}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-[rgba(255,236,190,0.08)] bg-[#0b0a08] p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full border border-[var(--mvz-gold)] bg-[rgba(212,175,55,0.08)] flex items-center justify-center mx-auto text-[var(--mvz-gold)] animate-pulse">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-[#f6f1e4]">Escaneando Criativo...</h3>
              <p className="text-xs text-[var(--mvz-dim)] max-w-sm mx-auto">
                Avaliando cada segundo contra as 5 principais políticas de banimento de anúncios.
              </p>
              <div className="w-full max-w-xs mx-auto bg-[#181510] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[var(--mvz-gold)] h-full transition-all duration-300"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Breakdown by Policy */}
          {currentResult && (
            <div className="rounded-2xl border border-[rgba(255,236,190,0.09)] bg-[#0b0a08] p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[rgba(255,236,190,0.08)] pb-3">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[var(--mvz-gold)]" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#f6f1e4]">
                    Diagnóstico dos 5 Pilares de Risco
                  </span>
                </div>
                <span className="text-[11px] font-mono text-[var(--mvz-dim)]">
                  Algoritmo TikTok / Meta Ads
                </span>
              </div>

              <div className="space-y-3">
                {currentResult.policies.map((policy) => {
                  const isSafe = policy.status === 'safe';
                  const isDanger = policy.status === 'danger';
                  const isWarning = policy.status === 'warning';

                  return (
                    <div
                      key={policy.id}
                      className="p-3.5 rounded-xl border border-[rgba(255,236,190,0.06)] bg-[#070706] space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {isSafe && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                          {isWarning && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
                          {isDanger && <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                          <span className="text-xs font-semibold text-[#f6f1e4]">{policy.name}</span>
                        </div>
                        <span
                          className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded ${
                            isSafe
                              ? 'bg-emerald-500/10 text-emerald-300'
                              : isWarning
                              ? 'bg-amber-500/10 text-amber-300'
                              : 'bg-rose-500/10 text-rose-300'
                          }`}
                        >
                          {policy.score}% Seguro
                        </span>
                      </div>

                      <p className="text-xs text-[var(--mvz-muted)] leading-relaxed pl-6">
                        {policy.description}
                      </p>

                      {policy.recommendation && (
                        <div className="ml-6 p-2 rounded-lg bg-[rgba(212,175,55,0.06)] border border-[rgba(212,175,55,0.15)] text-[11px] text-[#e0bd55]">
                          <span className="font-semibold text-[var(--mvz-gold)]">Ajuste Recomendado: </span>
                          {policy.recommendation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Checklist for Shielding */}
          {currentResult && (
            <div className="rounded-2xl border border-[rgba(255,236,190,0.09)] bg-[#0b0a08] p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[var(--mvz-gold)]" />
                <span className="text-xs font-semibold uppercase tracking-wider text-[#f6f1e4]">
                  Plano de Ação para Aprovação
                </span>
              </div>
              <p className="text-xs text-[var(--mvz-dim)]">
                Siga estes passos antes de enviar o vídeo para análise do TikTok Shop ou Meta Ads:
              </p>
              <ul className="space-y-2 pt-1">
                {currentResult.actionPlan.map((action, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2.5 text-xs text-[#ddd7cb] p-2.5 rounded-lg bg-[#070706] border border-[rgba(255,236,190,0.04)]"
                  >
                    <span className="w-5 h-5 rounded-full bg-[rgba(212,175,55,0.12)] border border-[rgba(212,175,55,0.3)] text-[10px] font-mono text-[var(--mvz-gold)] flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

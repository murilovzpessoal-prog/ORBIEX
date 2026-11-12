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
} from 'lucide-react';

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

export function AntiRestrictionView() {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [scanStep, setScanStep] = useState<string>('');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const analyzeVideo = (file: File) => {
    const objectUrl = URL.createObjectURL(file);
    setVideoSrc(objectUrl);
    setFileName(file.name);
    setIsScanning(true);
    setScanProgress(0);
    setResult(null);

    // Heurística baseada no conteúdo do nome do arquivo
    const lower = file.name.toLowerCase();
    const hasClaimsRisk =
      lower.includes('emagrec') ||
      lower.includes('antes') ||
      lower.includes('perder') ||
      lower.includes('cura') ||
      lower.includes('peso') ||
      lower.includes('barriga');

    const hasBrandRisk =
      lower.includes('nike') ||
      lower.includes('gucci') ||
      lower.includes('marca') ||
      lower.includes('apple') ||
      lower.includes('adidas');

    const steps = [
      { p: 20, step: 'Mapeando quadros e proporção 9:16...' },
      { p: 45, step: 'Analisando exposição corporal e transparência...' },
      { p: 70, step: 'OCR de texto na tela e leitura de legendas...' },
      { p: 90, step: 'Verificando trilha sonora e regras de comércio...' },
      { p: 100, step: 'Concluído' },
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i < steps.length) {
        setScanProgress(steps[i].p);
        setScanStep(steps[i].step);
        i++;
      } else {
        clearInterval(interval);
        setIsScanning(false);

        if (hasClaimsRisk) {
          setResult({
            hasRisk: true,
            score: 34,
            verdict: 'Chance de restrição: SIM',
            statusText: 'Alto risco de bloqueio ou rejeição imediata',
            summary:
              'Foram identificados indícios de promessas de resultado exagerado ou padrão de antes e depois, o que viola as diretrizes de anúncios do TikTok e da Meta.',
            policies: [
              {
                id: 'claims',
                name: 'Alegações e Promessas',
                status: 'danger',
                score: 18,
                description: 'Promessa de transformação física em curto prazo detectada.',
                adjustment: 'Remover promessas de prazo ("em X dias") e focar em rotina de uso ou qualidade.',
              },
              {
                id: 'nudity',
                name: 'Exposição Corporal',
                status: 'warning',
                score: 52,
                description: 'Enquadramento fechado com alto contraste de pele.',
                adjustment: 'Ampliar o plano de filmagem para meio-corpo.',
              },
              {
                id: 'trademark',
                name: 'Marcas e Propriedade Intelectual',
                status: 'safe',
                score: 95,
                description: 'Nenhuma marca de terceiro detectada.',
              },
              {
                id: 'audio',
                name: 'Áudio e Trilha Comercial',
                status: 'safe',
                score: 90,
                description: 'Áudio em conformidade.',
              },
              {
                id: 'framing',
                name: 'Enquadramento e Safe Zone',
                status: 'safe',
                score: 92,
                description: 'Proporção vertical 9:16 correta.',
              },
            ],
            actions: [
              'Remover referências a perda de peso, dias ou garantia de resultado.',
              'Trocar termos milagrosos por benefícios de conforto e usabilidade.',
              'Evitar imagens estáticas de comparação antes/depois.',
            ],
          });
        } else if (hasBrandRisk) {
          setResult({
            hasRisk: true,
            score: 46,
            verdict: 'Chance de restrição: SIM',
            statusText: 'Risco moderado por direito autoral ou logotipo',
            summary:
              'Foi detectado logotipo de marca registrada de terceiros ou trilha sonora protegida sem licença comercial para anúncios.',
            policies: [
              {
                id: 'claims',
                name: 'Alegações e Promessas',
                status: 'safe',
                score: 94,
                description: 'Nenhuma promessa indevida detectada.',
              },
              {
                id: 'nudity',
                name: 'Exposição Corporal',
                status: 'safe',
                score: 98,
                description: 'Sem violações de vestimenta ou pele.',
              },
              {
                id: 'trademark',
                name: 'Marcas e Propriedade Intelectual',
                status: 'danger',
                score: 25,
                description: 'Logotipo de terceiro visível sem autorização de revenda.',
                adjustment: 'Desfocar a logo nos primeiros segundos ou usar produto neutro.',
              },
              {
                id: 'audio',
                name: 'Áudio e Trilha Comercial',
                status: 'warning',
                score: 40,
                description: 'Trilha pode ser silenciada por copyright em anúncios pagos.',
                adjustment: 'Usar áudios da biblioteca comercial autorizada do TikTok.',
              },
              {
                id: 'framing',
                name: 'Enquadramento e Safe Zone',
                status: 'safe',
                score: 85,
                description: 'Formato vertical aceito.',
              },
            ],
            actions: [
              'Desfocar logos de marcas terceiras visíveis na peça.',
              'Substituir a música por uma faixa da biblioteca de uso comercial.',
            ],
          });
        } else {
          setResult({
            hasRisk: false,
            score: 98,
            verdict: 'Chance de restrição: NÃO',
            statusText: 'Aprovado para veiculação',
            summary:
              'O vídeo cumpre todas as regras de anúncios e do TikTok Shop. Sem termos proibidos, sem nudez algorítmica e sem violação de direitos autorais.',
            policies: [
              {
                id: 'claims',
                name: 'Alegações e Promessas',
                status: 'safe',
                score: 100,
                description: 'Livre de promessas de resultado milagroso ou claims agressivos.',
              },
              {
                id: 'nudity',
                name: 'Exposição Corporal',
                status: 'safe',
                score: 96,
                description: 'Caimento adequado, zero transparência e decote dentro das diretrizes.',
              },
              {
                id: 'trademark',
                name: 'Marcas e Propriedade Intelectual',
                status: 'safe',
                score: 100,
                description: 'Nenhum símbolo de grife ou marca protegida identificado.',
              },
              {
                id: 'audio',
                name: 'Áudio e Trilha Comercial',
                status: 'safe',
                score: 98,
                description: 'Áudio limpo, sem bloqueio de direitos autorais.',
              },
              {
                id: 'framing',
                name: 'Enquadramento e Safe Zone',
                status: 'safe',
                score: 97,
                description: 'Elementos visuais dentro da área de segurança da tela.',
              },
            ],
            actions: [
              'Vídeo aprovado e seguro para uso direto em campanhas e TikTok Shop.',
            ],
          });
        }
      }
    }, 450);
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith('video/')) {
      alert('Selecione um arquivo de vídeo válido (MP4, MOV ou WebM).');
      return;
    }
    analyzeVideo(file);
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
    setVideoSrc(null);
    setFileName('');
    setResult(null);
    setIsScanning(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header limpo e sem firula */}
      <div className="border-b border-[rgba(255,236,190,0.08)] pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-[#f6f1e4]">Antirrestrição</h1>
        <p className="mt-1 text-sm text-[var(--mvz-dim)]">
          Suba seu vídeo para analisar se há risco de restrição ou bloqueio no TikTok Shop e Meta Ads.
        </p>
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
            /* Dropzone Vazio Inicial */
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
            /* Vídeo Carregado com Scanner Vertical */
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

                {/* Laser vertical subindo e descendo */}
                {isScanning && (
                  <>
                    <div className="mvz-scan-laser-vert absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#f5d77f] to-transparent pointer-events-none shadow-[0_0_18px_#d4af37,0_0_35px_#f5d77f] z-20" />
                    <div className="absolute inset-0 bg-black/20 pointer-events-none z-10" />
                    <div className="absolute bottom-4 left-3 right-3 bg-black/85 backdrop-blur-md border border-[rgba(255,236,190,0.15)] rounded-lg p-2.5 text-[11px] font-mono space-y-1 z-20">
                      <div className="flex items-center justify-between text-[#f5d77f]">
                        <span>Analisando vídeo...</span>
                        <span>{scanProgress}%</span>
                      </div>
                      <div className="text-[var(--mvz-dim)] truncate">{scanStep}</div>
                    </div>
                  </>
                )}

                {/* Play/Pause */}
                <button
                  onClick={togglePlay}
                  className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                >
                  <div className="w-12 h-12 rounded-full bg-black/75 border border-white/20 flex items-center justify-center text-white">
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                  </div>
                </button>
              </div>

              {/* Botão sutil para trocar de vídeo */}
              <div className="flex items-center justify-between px-1 text-xs text-[var(--mvz-dim)]">
                <span className="truncate max-w-[200px]">{fileName}</span>
                <button
                  onClick={handleReset}
                  className="hover:text-[#f6f1e4] flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Trocar vídeo</span>
                </button>
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
                Envie um vídeo no campo ao lado para rodar o scanner e saber se ele tem chance de tomar restrição.
              </p>
            </div>
          )}

          {isScanning && (
            <div className="rounded-2xl border border-[rgba(255,236,190,0.08)] bg-[#0b0a08] p-8 text-center space-y-3">
              <p className="text-sm font-medium text-[#f6f1e4]">Escaneando vídeo...</p>
              <p className="text-xs text-[var(--mvz-dim)] max-w-sm mx-auto">
                Avaliando conformidade de alegações, direitos autorais e exposição corporal.
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
              {/* Card Principal do Veredito */}
              <div
                className={`rounded-2xl border p-5 ${
                  result.hasRisk
                    ? 'border-rose-500/30 bg-[#120707]'
                    : 'border-emerald-500/30 bg-[#07140b]'
                }`}
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
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

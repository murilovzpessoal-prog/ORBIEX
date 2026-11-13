import { Gauge, Loader2, Radar, RotateCcw, ScanSearch, Sparkles, Store, type LucideIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Tone, ViewId } from '../data';
import { analyze } from '../mock';
import { Eyebrow, IconBox, PageHeader, Pill, Ring, TONE } from '../ui';

interface Config {
  eyebrow: string;
  title: string;
  accent: string;
  subtitle: string;
  icon: LucideIcon;
  tone: Tone;
  label: string;
  placeholder: string;
  cta: string;
  metrics: string[];
  insights: string[];
  extra?: { label: string; placeholder: string };
}

const CONFIGS: Partial<Record<ViewId, Config>> = {
  product: {
    eyebrow: 'Analisador de Produto',
    title: 'Descubra se o produto',
    accent: 'vale a pena vender.',
    subtitle: 'Cole o nome ou o link do produto e receba um score completo em segundos.',
    icon: Gauge,
    tone: 'pink',
    label: 'Produto ou link',
    placeholder: 'Ex.: Mini Processador Portátil ou https://…',
    cta: 'Analisar produto',
    metrics: ['Demanda', 'Concorrência', 'Margem', 'Potencial viral', 'Facilidade de envio'],
    insights: [
      'Produto resolve uma dor clara e demonstrável em vídeo.',
      'Poucos criativos com boa retenção — espaço para entrar.',
      'Margem permite investir em tráfego sem comprometer o lucro.',
    ],
  },
  store: {
    eyebrow: 'Analisador de Loja',
    title: 'Diagnóstico completo da',
    accent: 'sua loja.',
    subtitle: 'Informe o nome ou link da loja e descubra os gargalos que travam suas vendas.',
    icon: Store,
    tone: 'violet',
    label: 'Loja ou link',
    placeholder: 'Ex.: Minha Loja Oficial ou https://…',
    cta: 'Analisar loja',
    metrics: ['Reputação', 'Catálogo', 'Preço', 'Conversão', 'Conteúdo'],
    insights: [
      'Catálogo disperso: concentre em 1 produto âncora por categoria.',
      'Taxa de conversão acima da média nos produtos de ticket baixo.',
      'Falta de prova social nos 3 produtos mais visitados.',
    ],
  },
  scanner: {
    eyebrow: 'Scanner de Concorrentes',
    title: 'Veja o que seus concorrentes',
    accent: 'não querem que você veja.',
    subtitle: 'Escaneie um perfil, loja ou produto e encontre brechas de mercado.',
    icon: ScanSearch,
    tone: 'green',
    label: 'Concorrente ou nicho',
    placeholder: 'Ex.: @concorrente ou "organizadores de cozinha"',
    cta: 'Escanear mercado',
    metrics: ['Saturação', 'Qualidade dos criativos', 'Frequência de posts', 'Preço médio', 'Brechas'],
    insights: [
      'Concorrentes repetem os mesmos 2 ângulos — teste um ângulo novo.',
      'Horário de maior engajamento: 19h–22h.',
      'Poucos usam prova social em vídeo; é uma oportunidade clara.',
    ],
  },
};

function verdict(score: number): { text: string; tone: Tone } {
  if (score >= 85) return { text: 'Excelente', tone: 'green' };
  if (score >= 72) return { text: 'Promissor', tone: 'cyan' };
  if (score >= 60) return { text: 'Moderado', tone: 'amber' };
  return { text: 'Arriscado', tone: 'pink' };
}

export function AnalyzerView({ kind }: { kind: 'product' | 'store' | 'scanner' }) {
  const cfg = CONFIGS[kind]!;
  const Icon = cfg.icon;
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ q: string; values: number[]; score: number } | null>(null);
  const timer = useRef<number>(0);

  useEffect(() => {
    setQ('');
    setResult(null);
    setLoading(false);
    return () => clearTimeout(timer.current);
  }, [kind]);

  const run = () => {
    if (!q.trim() || loading) return;
    setLoading(true);
    setResult(null);
    timer.current = window.setTimeout(() => {
      setResult({ q: q.trim(), ...analyze(q, cfg.metrics) });
      setLoading(false);
    }, 1600);
  };

  const v = result ? verdict(result.score) : null;
  const t = TONE[cfg.tone];

  return (
    <div className="mvz-fade-up">
      <PageHeader
        eyebrow={cfg.eyebrow}
        title={
          <>
            {cfg.title} <span className="mvz-grad-text">{cfg.accent}</span>
          </>
        }
        subtitle={cfg.subtitle}
      />

      <div className="mvz-card relative overflow-hidden p-5 sm:p-6">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full blur-3xl" style={{ background: t.soft }} />
        <label className="relative text-[11px] font-bold uppercase tracking-wider text-[var(--mvz-dim)]">{cfg.label}</label>
        <form
          className="relative mt-2 flex flex-col gap-3 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            run();
          }}
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={cfg.placeholder}
            className="mvz-input h-12 flex-1 px-4 text-[14px]"
          />
          <button type="submit" disabled={!q.trim() || loading} className="mvz-btn-grad flex h-12 items-center justify-center gap-2 px-6 text-[13px]">
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
            {loading ? 'Analisando…' : cfg.cta}
          </button>
        </form>
      </div>

      {loading && (
        <div className="mvz-card mt-5 grid gap-5 p-6 md:grid-cols-[200px_1fr]">
          <div className="mvz-shimmer mx-auto h-[140px] w-[140px] rounded-full" />
          <div className="space-y-4">
            {cfg.metrics.map((m) => (
              <div key={m} className="mvz-shimmer h-5 rounded-md" />
            ))}
          </div>
        </div>
      )}

      {result && v && (
        <div className="mvz-fade-up mt-5 grid gap-5 lg:grid-cols-[320px_1fr]">
          <div className="mvz-card flex flex-col items-center p-6 text-center">
            <Eyebrow tone={cfg.tone}>Score final</Eyebrow>
            <div className="my-5">
              <Ring
                value={result.score}
                size={156}
                stroke={9}
                color={TONE[v.tone].hex}
                label={
                  <div>
                    <div className="text-4xl font-extrabold">{result.score}</div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--mvz-dim)]">de 100</div>
                  </div>
                }
              />
            </div>
            <Pill tone={v.tone}>{v.text}</Pill>
            <p className="mt-3 line-clamp-2 max-w-full text-[12.5px] text-[var(--mvz-muted)]">“{result.q}”</p>
            <button
              onClick={() => {
                setResult(null);
                setQ('');
              }}
              className="mt-5 flex items-center gap-1.5 text-[12px] font-semibold text-[var(--mvz-muted)] hover:text-white"
            >
              <RotateCcw size={12} /> Nova análise
            </button>
          </div>

          <div className="space-y-5">
            <div className="mvz-card p-6">
              <div className="mb-5 flex items-center gap-3">
                <IconBox tone={cfg.tone} size={34}>
                  <Icon size={15} />
                </IconBox>
                <h3 className="text-[15px] font-bold">Detalhamento</h3>
              </div>
              <div className="space-y-4">
                {cfg.metrics.map((m, i) => (
                  <div key={m}>
                    <div className="mb-1.5 flex justify-between text-[12px]">
                      <span className="font-medium text-white/80">{m}</span>
                      <span className="font-bold">{result.values[i]}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                      <div
                        className="h-full rounded-full mvz-grad-bg"
                        style={{ width: `${result.values[i]}%`, transition: 'width 0.9s ease' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mvz-card p-6">
              <div className="mb-4 flex items-center gap-2 text-[15px] font-bold">
                <Radar size={15} className="text-[var(--mvz-cyan)]" /> Insights do agente
              </div>
              <ul className="space-y-3">
                {cfg.insights.map((i) => (
                  <li key={i} className="flex gap-3 text-[13px] leading-relaxed text-white/75">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: t.hex }} />
                    {i}
                  </li>
                ))}
              </ul>
              <p className="mt-4 border-t border-[var(--mvz-line)] pt-3 text-[11px] text-[var(--mvz-dim)]">
                Resultado ilustrativo — conecte seus dados reais para análises verdadeiras.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

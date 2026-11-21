import { Gauge, Loader2, Radar, RotateCcw, ScanSearch, Sparkles, Store, type LucideIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Tone, ViewId } from '../data';
import { aiGenerateJSON, jitter, pickOne, shuffle } from '../aiGenerate';
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

type Kind = 'product' | 'store' | 'scanner';

interface AnalysisResult {
  q: string;
  values: number[];
  score: number;
  insights: string[];
  source: 'ai' | 'local';
}

/** Pools de insights para o fallback local — sempre citam o alvo e são embaralhados a cada clique. */
const INSIGHT_POOLS: Record<Kind, ((x: string) => string)[]> = {
  product: [
    (x) => `“${x}” tem uma dor clara que dá para demonstrar nos 3 primeiros segundos — abra o vídeo com o problema, não com o produto.`,
    (x) => `Poucos criativos de “${x}” passam de 50% de retenção: um gancho de antes/depois tende a se destacar rápido.`,
    (x) => `Teste “${x}” com unboxing em POV + close nos detalhes; esse formato costuma converter melhor que review falado.`,
    (x) => `A margem de “${x}” comporta cupom de primeira compra sem matar a comissão — use como gatilho de urgência.`,
    (x) => `Comentários de dúvida sobre “${x}” (tamanho, durabilidade, entrega) são roteiro pronto: responda em vídeo.`,
    (x) => `Grave 3 variações de gancho para “${x}” no mesmo dia e mantenha só a de maior retenção após 48h.`,
    (x) => `“${x}” funciona melhor em vídeos de 15–25s com demonstração contínua, sem cortes longos de fala.`,
    (x) => `Compare “${x}” com uma alternativa cara do mercado — o ângulo de custo-benefício ainda está pouco explorado.`,
    (x) => `Mostrar “${x}” sendo usado no dia a dia real (casa, rua, trabalho) aumenta a percepção de utilidade.`,
    (x) => `Use prova social nos primeiros segundos: print de avaliação de “${x}” na tela gera confiança imediata.`,
    (x) => `Horário sugerido para postar “${x}”: entre 19h e 22h, quando o público de compra por impulso está mais ativo.`,
    (x) => `Evite prometer resultado exagerado com “${x}”; demonstração honesta reduz devolução e mantém a conta saudável.`,
  ],
  store: [
    (x) => `A loja “${x}” ganha força concentrando o tráfego em 1 produto âncora por categoria.`,
    (x) => `Os produtos de ticket baixo de “${x}” são a porta de entrada — use-os para alimentar o remarketing.`,
    (x) => `Faltam avaliações com foto nos itens mais visitados de “${x}”; peça UGC aos primeiros compradores.`,
    (x) => `Padronize as capas dos produtos de “${x}” (fundo, luz, ângulo) para elevar a percepção de marca.`,
    (x) => `Crie um combo em “${x}” com os 2 itens mais comprados juntos para aumentar o ticket médio.`,
    (x) => `Títulos de “${x}” podem incluir palavras de busca reais (benefício + uso) para melhorar a descoberta.`,
    (x) => `Lives curtas de 30 min mostrando o catálogo de “${x}” tendem a destravar conversão em produtos parados.`,
    (x) => `Revise o preço dos itens de “${x}” que estão acima da média da categoria sem diferencial visível.`,
    (x) => `Afiliados ainda não exploram bem “${x}”: amostras grátis para 5 criadores do nicho podem multiplicar alcance.`,
    (x) => `Responder dúvidas nos comentários em até 2h aumenta a confiança na loja “${x}”.`,
    (x) => `Os produtos sem vídeo na página de “${x}” convertem menos — priorize um vídeo curto para cada um.`,
  ],
  scanner: [
    (x) => `Os concorrentes de “${x}” repetem os mesmos 2 ângulos — teste um ângulo de humor ou bastidor.`,
    (x) => `Em “${x}”, o pico de engajamento costuma ficar entre 19h e 22h; poste fora do horário saturado para testar.`,
    (x) => `Pouca gente em “${x}” usa prova social em vídeo (prints, reações); é uma brecha clara.`,
    (x) => `Os vídeos mais fortes de “${x}” mostram o resultado no primeiro segundo — copie a estrutura, não o texto.`,
    (x) => `Há espaço em “${x}” para conteúdo sem rosto em POV com legenda grande; quase ninguém faz bem.`,
    (x) => `Concorrentes de “${x}” quase não respondem comentários em vídeo — use isso para criar série de conteúdo.`,
    (x) => `O preço médio em “${x}” deixa margem para um bundle ou brinde que diferencie sua oferta.`,
    (x) => `Criativos de “${x}” estão longos demais; versões de 12–18s tendem a reter melhor.`,
    (x) => `Explore comparações diretas em “${x}” (esse vs aquele) — formato pouco usado e com alto compartilhamento.`,
    (x) => `Os perfis de “${x}” postam em rajadas e somem; constância diária pode tomar o espaço deles.`,
  ],
};

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, Math.round(n)));

function localAnalysis(kind: Kind, q: string, metrics: string[], prev?: number[]): Omit<AnalysisResult, 'q'> {
  const center = jitter(72, 12, 52, 88);
  const values = metrics.map((_, i) => {
    let v = jitter(center, 16, 35, 97);
    // evita repetir exatamente o valor anterior da mesma métrica
    if (prev && prev[i] === v) v = clamp(v + pickOne([-3, -2, 2, 3]), 35, 97);
    return v;
  });
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const score = jitter(avg, 2, 30, 98);
  const insights = shuffle(INSIGHT_POOLS[kind])
    .slice(0, 3)
    .map((f) => f(q));
  return { values, score, insights, source: 'local' };
}

function verdict(score: number): { text: string; tone: Tone } {
  if (score >= 85) return { text: 'Excelente', tone: 'green' };
  if (score >= 72) return { text: 'Promissor', tone: 'cyan' };
  if (score >= 60) return { text: 'Moderado', tone: 'amber' };
  return { text: 'Arriscado', tone: 'pink' };
}

export function AnalyzerView({ kind }: { kind: Kind }) {
  const cfg = CONFIGS[kind]!;
  const Icon = cfg.icon;
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const reqId = useRef(0);
  const lastValues = useRef<number[] | undefined>(undefined);

  useEffect(() => {
    setQ('');
    setResult(null);
    setLoading(false);
    reqId.current++;
    return () => {
      reqId.current++;
    };
  }, [kind]);

  const run = async (target?: string) => {
    const query = (target ?? q).trim();
    if (!query || loading) return;
    const id = ++reqId.current;
    setLoading(true);
    setResult(null);

    const metrics = cfg.metrics;
    const local = localAnalysis(kind, query, metrics, lastValues.current);
    const tipo =
      kind === 'product'
        ? 'análise de viabilidade de um produto para vender como afiliado no TikTok Shop Brasil'
        : kind === 'store'
          ? 'diagnóstico de uma loja do TikTok Shop Brasil'
          : 'scanner de concorrentes/nicho no TikTok Shop Brasil';

    const ai = await aiGenerateJSON<{ values?: unknown; score?: unknown; insights?: unknown }>({
      memoryKey: `analyzer-${kind}:${query}`,
      task:
        `Faça uma ${tipo} para "${query}". Dê uma nota de 0 a 100 para CADA métrica, na ordem exata ` +
        `(${metrics.join(', ')}), coerente com o tipo de produto/loja/nicho informado, e uma nota final (score) coerente com essas notas. ` +
        'Escreva 3 insights acionáveis e ESPECÍFICOS para esse alvo (cite o nome, o público, a dor, o formato de vídeo ou a faixa de preço quando fizer sentido), ' +
        'em português do Brasil, cada um com no máximo 2 frases. Nada genérico. Use ângulos diferentes das análises anteriores.',
      input: { tipo: kind, alvo: query, metricas: metrics },
      format:
        `{"values": [${metrics.map(() => 'number').join(', ')}], "score": number, "insights": ["string", "string", "string"]}` +
        ` — "values" deve ter exatamente ${metrics.length} números inteiros de 0 a 100, na ordem: ${metrics.join(', ')}.`,
      remember: (d) => (Array.isArray(d?.insights) ? d.insights.map(String) : []),
    });
    if (id !== reqId.current) return;

    let next: AnalysisResult;
    if (ai) {
      const rawValues: unknown[] = Array.isArray(ai.values) ? ai.values : [];
      const values = metrics.map((_, i) => {
        const n = Number(rawValues[i]);
        return Number.isFinite(n) ? clamp(n, 5, 99) : local.values[i];
      });
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const sc = Number(ai.score);
      const score = Number.isFinite(sc) ? clamp(sc, 5, 99) : Math.round(avg);
      const aiInsights = Array.isArray(ai.insights)
        ? ai.insights.map((x) => String(x ?? '').trim()).filter(Boolean)
        : [];
      const insights = [...aiInsights, ...local.insights].slice(0, Math.max(3, Math.min(aiInsights.length, 5)));
      next = { q: query, values, score, insights, source: 'ai' };
    } else {
      next = { q: query, ...local };
    }
    lastValues.current = next.values;
    setResult(next);
    setLoading(false);
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
              onClick={() => run(result.q)}
              className="mt-5 flex items-center gap-1.5 text-[12px] font-semibold text-[var(--mvz-muted)] hover:text-white"
            >
              <Sparkles size={12} /> Reanalisar com novos insights
            </button>
            <button
              onClick={() => {
                setResult(null);
                setQ('');
              }}
              className="mt-2 flex items-center gap-1.5 text-[12px] font-semibold text-[var(--mvz-muted)] hover:text-white"
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
                {result.insights.map((i, idx) => (
                  <li key={idx} className="flex gap-3 text-[13px] leading-relaxed text-white/75">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: t.hex }} />
                    {i}
                  </li>
                ))}
              </ul>
              <p className="mt-4 border-t border-[var(--mvz-line)] pt-3 text-[11px] text-[var(--mvz-dim)]">
                {result.source === 'ai'
                  ? 'Análise gerada pela IA Orbiex a partir do que você informou — estimativas, não dados oficiais do TikTok.'
                  : 'Resultado ilustrativo — conecte seus dados reais para análises verdadeiras.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

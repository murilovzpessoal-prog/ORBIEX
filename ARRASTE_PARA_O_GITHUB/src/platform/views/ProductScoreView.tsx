import { useState, useRef } from 'react';
import {
  RotateCcw,
  Sparkles,
  Link2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Zap,
  ShieldCheck,
  Copy,
  Check,
  Bot,
  CircleHelp,
  TrendingUp,
  AlertTriangle,
  XCircle,
  Flame,
  Film,
  Tag,
  ArrowRight,
} from 'lucide-react';
import { Ring, Pill } from '../ui';
import { auditProduct, type ProductAuditResult } from '../productAuditor';

export function ProductScoreView({
  onUseInAgent,
}: {
  onUseInAgent: (prompt: string) => void;
}) {
  const [productLink, setProductLink] = useState('');
  const [productName, setProductName] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [commission, setCommission] = useState('20%');
  const [category, setCategory] = useState('Moda Feminina');
  const [loading, setLoading] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [result, setResult] = useState<ProductAuditResult | null>(null);

  const [copiedScript, setCopiedScript] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const handleClear = () => {
    setProductLink('');
    setProductName('');
    setResult(null);
    setLoading(false);
    setStepIndex(0);
  };

  const handleAnalyze = () => {
    setLoading(true);
    setResult(null);
    setStepIndex(0);

    // Realistic progressive analysis audit pipeline
    setTimeout(() => setStepIndex(1), 600);
    setTimeout(() => setStepIndex(2), 1300);
    setTimeout(() => setStepIndex(3), 2000);

    setTimeout(() => {
      const audit = auditProduct({
        productName,
        productLink,
        category,
        commission,
      });

      setLoading(false);
      setResult(audit);

      setTimeout(() => {
        reportRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }, 2500);
  };

  const copySampleScript = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.freeSampleScript);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  return (
    <div className="mvz-fade-up pb-16">
      {/* ── Top Bar Header ── */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(212,175,55,0.3)] bg-[rgba(212,175,55,0.06)] px-3 py-1">
            <Sparkles size={12} className="text-[var(--mvz-gold)]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--mvz-gold-light)]">
              Orbiex Product Intelligence
            </span>
          </div>

          <h1 className="mt-2.5 text-[26px] font-extrabold tracking-tight sm:text-[34px]">
            Analisador de Produto & <span className="mvz-grad-text">Score TikTok Shop</span>
          </h1>

          <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-[var(--mvz-muted)]">
            Descubra se o produto é seguro para vender, se corre risco de banimento e qual o potencial de escala antes de produzir qualquer vídeo.
          </p>
        </div>

        {/* Limpar Campos Button */}
        <button
          onClick={handleClear}
          className="flex h-9 items-center gap-2 rounded-xl border border-[var(--mvz-line)] bg-white/[0.03] px-3.5 text-[11.5px] font-semibold text-[var(--mvz-muted)] transition hover:border-[var(--mvz-line-strong)] hover:text-white"
        >
          <RotateCcw size={12} />
          Limpar Campos
        </button>
      </div>

      {/* ── Como Fazer a Análise (Card de 3 passos) ── */}
      <div className="mb-6 rounded-2xl border border-[var(--mvz-line)] bg-[#0c0a07] p-5">
        <div className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[var(--mvz-gold)]">
          <CircleHelp size={14} />
          Como fazer a análise do seu produto:
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Step 1 */}
          <div className="flex gap-3 rounded-xl border border-[var(--mvz-line)] bg-white/[0.015] p-3.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[rgba(212,175,55,0.15)] text-[12px] font-black text-[var(--mvz-gold)]">
              1
            </div>
            <div>
              <div className="text-[13px] font-bold text-white">Cole o Link ou Nome</div>
              <div className="mt-1 text-[11.5px] leading-relaxed text-[var(--mvz-dim)]">
                Copie o link do produto no TikTok Shop ou digite o nome do produto no campo abaixo.
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-3 rounded-xl border border-[var(--mvz-line)] bg-white/[0.015] p-3.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[rgba(212,175,55,0.15)] text-[12px] font-black text-[var(--mvz-gold)]">
              2
            </div>
            <div>
              <div className="text-[13px] font-bold text-white">Clique em Analisar Produto</div>
              <div className="mt-1 text-[11.5px] leading-relaxed text-[var(--mvz-dim)]">
                O sistema cruza as informações com o banco de diretrizes de moderação do TikTok.
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-3 rounded-xl border border-[var(--mvz-line)] bg-white/[0.015] p-3.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[rgba(212,175,55,0.15)] text-[12px] font-black text-[var(--mvz-gold)]">
              3
            </div>
            <div>
              <div className="text-[13px] font-bold text-white">Receba o Relatório Oficial</div>
              <div className="mt-1 text-[11.5px] leading-relaxed text-[var(--mvz-dim)]">
                Veja o Score (0-100), riscos de ban, políticas validadas e script de amostra grátis.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Formulário Principal ── */}
      <div className="relative overflow-hidden rounded-3xl border border-[var(--mvz-line-strong)] bg-gradient-to-b from-[#100e0a] to-[#0a0907] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)] sm:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[rgba(212,175,55,0.08)] blur-3xl" />

        <div className="flex items-center justify-between border-b border-[var(--mvz-line)] pb-4">
          <div className="flex items-center gap-2 text-[14px] font-extrabold text-white">
            <Sparkles size={16} className="text-[var(--mvz-gold)]" />
            Insira os Dados do Produto
          </div>
          <span className="text-[9.5px] font-bold uppercase tracking-[0.2em] text-[var(--mvz-dim)]">
            Varredura de Diretrizes Orbiex
          </span>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Campo 1: Link */}
          <div>
            <label className="flex items-center gap-1.5 text-[11.5px] font-bold text-white/90">
              <Link2 size={13} className="text-[var(--mvz-gold)]" />
              Link do Produto no TikTok Shop / Fornecedor:
            </label>
            <input
              type="text"
              value={productLink}
              onChange={(e) => setProductLink(e.target.value)}
              placeholder="Ex: https://www.tiktok.com/@loja/video/... ou link da loja"
              className="mvz-input mt-2 h-12 w-full px-4 text-[13px]"
            />
          </div>

          {/* Campo 2: Nome do Produto */}
          <div>
            <label className="flex items-center gap-1.5 text-[11.5px] font-bold text-white/90">
              <CheckCircle2 size={13} className="text-[var(--mvz-gold)]" />
              Nome do Produto (Opcional se inseriu o link):
            </label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="Ex: Mini Projetor Smart, Mop Giratório, Sérum Facial..."
              className="mvz-input mt-2 h-12 w-full px-4 text-[13px]"
            />
          </div>
        </div>

        {/* Accordion Ajustar Comissão e Categoria */}
        <div className="mt-5 border-t border-[var(--mvz-line)] pt-4">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1.5 text-[12px] font-semibold text-[var(--mvz-muted)] transition hover:text-white"
          >
            {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            Ajustar Comissão e Categoria (Opcional)
          </button>

          {showAdvanced && (
            <div className="mvz-msg-in mt-4 grid grid-cols-1 gap-4 rounded-2xl border border-[var(--mvz-line)] bg-white/[0.02] p-4 sm:grid-cols-2">
              <div>
                <label className="text-[11px] font-bold text-[var(--mvz-dim)]">Comissão Estimada:</label>
                <input
                  type="text"
                  value={commission}
                  onChange={(e) => setCommission(e.target.value)}
                  placeholder="Ex: 20%"
                  className="mvz-input mt-1.5 h-10 w-full px-3 text-[13px]"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[var(--mvz-dim)]">Categoria:</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mvz-input mt-1.5 h-10 w-full bg-[#0d0c0a] px-3 text-[13px]"
                >
                  <option>Moda Feminina</option>
                  <option>Fitness</option>
                  <option>Beleza & Cuidados</option>
                  <option>Casa & Cozinha</option>
                  <option>Eletrônicos & Gadgets</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Card Footer */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-[var(--mvz-line)] pt-5 sm:flex-row">
          <div className="flex items-center gap-2 text-[12px] text-white/80">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[rgba(212,175,55,0.15)] text-[var(--mvz-gold)]">
              <Check size={12} strokeWidth={3} />
            </span>
            <span>Auditoria cruzada com as diretrizes de conformidade TikTok Shop 2026</span>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="mvz-btn-grad flex h-12 w-full items-center justify-center gap-2.5 px-7 text-[12.5px] font-extrabold uppercase tracking-wider sm:w-auto"
          >
            <Zap size={15} fill="currentColor" />
            {loading ? 'Auditando Diretrizes...' : 'ANALISAR PRODUTO AGORA →'}
          </button>
        </div>
      </div>

      {/* ── Loading Animation com Passos Reais ── */}
      {loading && (
        <div className="mvz-msg-in mt-6 rounded-2xl border border-[var(--mvz-line-strong)] bg-[#0d0c0a] p-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(212,175,55,0.1)] text-[var(--mvz-gold)]">
            <Sparkles size={24} className="animate-spin" />
          </div>
          <h3 className="mt-3 text-[16px] font-bold">Auditando políticas e viabilidade TikTok Shop...</h3>
          <p className="mt-1 font-mono text-[12px] text-[var(--mvz-gold-light)]">
            {stepIndex === 0 && '1/4 Extraindo parâmetros de produto e categoria...'}
            {stepIndex === 1 && '2/4 Verificando diretrizes de moderação, direitos autorais e alegações sensíveis...'}
            {stepIndex === 2 && '3/4 Calculando score de demanda viral, margem líquida e taxa de devolução...'}
            {stepIndex === 3 && '4/4 Consolidando parecer executivo e gerando roteiros de amostra...'}
          </p>
          <div className="mx-auto mt-4 h-1.5 w-64 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full bg-[var(--mvz-gold)] transition-all duration-500"
              style={{ width: `${((stepIndex + 1) / 4) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Official Analysis Report ── */}
      {result && (
        <div ref={reportRef} className="mvz-fade-up mt-8 space-y-6">
          <div className="rounded-3xl border border-[var(--mvz-line-strong)] bg-gradient-to-b from-[#12100b] to-[#0a0907] p-6 shadow-2xl sm:p-8">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--mvz-line)] pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <Pill tone={result.score >= 80 ? 'green' : result.score >= 60 ? 'amber' : 'pink'}>
                    {result.score >= 80 ? 'Produto Aprovado' : result.score >= 60 ? 'Atenção Operacional' : 'Alto Risco de Ban'}
                  </Pill>
                  <span className="text-[11px] text-[var(--mvz-dim)]">Auditoria Concluída</span>
                </div>
                <h2 className="mt-2 text-2xl font-black">{result.name}</h2>
                <div className="mt-1 flex items-center gap-2 text-[12px] text-[var(--mvz-muted)]">
                  <Tag size={13} className="text-[var(--mvz-gold)]" />
                  <span>Categoria: <strong className="text-white">{result.categoryDetected}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    onUseInAgent(
                      `O produto "${result.name}" (${result.categoryDetected}) foi auditado com score ${result.score}/100 no Analisador de Produto. Veredito: ${result.status}. Crie uma estratégia completa de criativos, ganchos de alta retenção e roteiros de conversão direta para TikTok Shop.`
                    )
                  }
                  className="mvz-btn-grad flex h-10 items-center gap-2 px-4 text-[12px]"
                >
                  <Bot size={14} />
                  Criar Estratégia no Agente Orbiex
                </button>
              </div>
            </div>

            {/* Score & Risk Summary Cards */}
            <div className="my-6 grid grid-cols-1 gap-5 md:grid-cols-4">
              {/* Ring Score */}
              <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--mvz-line)] bg-white/[0.02] p-5 text-center">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--mvz-dim)]">
                  Score de Validação
                </div>
                <div className="my-2">
                  <Ring
                    value={result.score}
                    size={110}
                    stroke={7}
                    color={result.score >= 80 ? '#7fcf9f' : result.score >= 60 ? '#f2c94c' : '#ef4444'}
                    label={
                      <div className="text-center">
                        <div className="text-3xl font-black">{result.score}</div>
                        <div className="text-[9px] font-bold text-[var(--mvz-dim)]">de 100</div>
                      </div>
                    }
                  />
                </div>
                <div
                  className="text-[11.5px] font-bold"
                  style={{
                    color: result.score >= 80 ? '#7fcf9f' : result.score >= 60 ? '#f2c94c' : '#ef4444',
                  }}
                >
                  {result.score >= 80 ? 'Excelente Potencial' : result.score >= 60 ? 'Ressalvas Identificadas' : 'Reprovado / Crítico'}
                </div>
              </div>

              {/* Ban Risk */}
              <div className="flex flex-col justify-center rounded-2xl border border-[var(--mvz-line)] bg-white/[0.02] p-5">
                <div className="flex items-center gap-2 text-[11.5px] font-bold uppercase tracking-wider text-[var(--mvz-gold)]">
                  <ShieldCheck size={16} /> Risco de Banimento
                </div>
                <div
                  className="mt-2 text-2xl font-black"
                  style={{
                    color: result.banRisk === 'Baixo' ? '#7fcf9f' : result.banRisk === 'Médio' ? '#f2c94c' : '#ef4444',
                  }}
                >
                  {result.banRisk} Risco
                </div>
                <p className="mt-1.5 text-[11.5px] leading-relaxed text-[var(--mvz-muted)]">
                  {result.banRisk === 'Baixo'
                    ? 'Nenhuma violação às diretrizes de comércio identificada. Produto liberado para vitrine e anúncios.'
                    : result.banRisk === 'Médio'
                    ? 'Atenção aos primeiros frames do vídeo e alegações no áudio para evitar advertências.'
                    : 'Gatilho de suspensão de vitrine e saldo. Não recomendado para afiliação direta.'}
                </p>
              </div>

              {/* Demanda Viral */}
              <div className="flex flex-col justify-center rounded-2xl border border-[var(--mvz-line)] bg-white/[0.02] p-5">
                <div className="flex items-center gap-2 text-[11.5px] font-bold uppercase tracking-wider text-[var(--mvz-gold)]">
                  <Flame size={16} /> Demanda Viral
                </div>
                <div className="mt-2 text-2xl font-black text-[var(--mvz-gold-light)]">
                  {result.demandIndex}%
                </div>
                <p className="mt-1.5 text-[11.5px] leading-relaxed text-[var(--mvz-muted)]">
                  Facilidade de demonstração avaliada em {result.demonstrationEase}%. Forte apelo de retenção nos primeiros 3 segundos.
                </p>
              </div>

              {/* Margens e Devolução */}
              <div className="flex flex-col justify-center rounded-2xl border border-[var(--mvz-line)] bg-white/[0.02] p-5">
                <div className="flex items-center gap-2 text-[11.5px] font-bold uppercase tracking-wider text-[var(--mvz-gold)]">
                  <TrendingUp size={16} /> Margem & Devolução
                </div>
                <div className="mt-2 text-lg font-black text-white">{result.estimatedMargin}</div>
                <p className="mt-1.5 text-[11.5px] leading-relaxed text-[var(--mvz-muted)]">
                  Risco de devolução estimado em <strong className="text-white">{result.returnRateRisk}</strong> com entrega pontual.
                </p>
              </div>
            </div>

            {/* Veredito Geral */}
            <div className="rounded-2xl border border-[var(--mvz-line)] bg-[#070605] p-4 text-[12.5px] leading-relaxed text-white/90">
              <span className="font-bold text-[var(--mvz-gold)]">Parecer Executivo Orbiex: </span>
              {result.verdictSummary}
            </div>

            {/* Guidelines Checklist */}
            <div className="mt-6 rounded-2xl border border-[var(--mvz-line)] bg-white/[0.02] p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-[13.5px] font-bold">Varredura das Diretrizes Oficiais TikTok Shop 2026</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--mvz-dim)]">5 Políticas Auditadas</span>
              </div>
              <div className="space-y-3">
                {result.guidelines.map((g, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 rounded-xl border border-[var(--mvz-line)] bg-white/[0.015] p-3.5"
                  >
                    <div
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                      style={{
                        background:
                          g.severity === 'ok'
                            ? 'rgba(127,207,159,0.15)'
                            : g.severity === 'alerta'
                            ? 'rgba(242,201,76,0.15)'
                            : 'rgba(239,68,68,0.15)',
                        color:
                          g.severity === 'ok'
                            ? '#7fcf9f'
                            : g.severity === 'alerta'
                            ? '#f2c94c'
                            : '#ef4444',
                      }}
                    >
                      {g.severity === 'ok' && <Check size={13} strokeWidth={3} />}
                      {g.severity === 'alerta' && <AlertTriangle size={13} />}
                      {g.severity === 'bloqueio' && <XCircle size={13} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[12.5px] font-bold text-white">{g.label}</span>
                        <span className="font-mono text-[9.5px] text-[var(--mvz-dim)]">({g.policyRef})</span>
                      </div>
                      <div className="mt-1 text-[11.5px] text-[var(--mvz-dim)]">{g.note}</div>
                    </div>
                    <Pill tone={g.severity === 'ok' ? 'green' : g.severity === 'alerta' ? 'amber' : 'pink'}>
                      {g.severity === 'ok' ? 'Conforme' : g.severity === 'alerta' ? 'Atenção' : 'Bloqueio'}
                    </Pill>
                  </div>
                ))}
              </div>
            </div>

            {/* Ângulos de Conteúdo & Roteiros Práticos */}
            {result.contentAngles.length > 0 && (
              <div className="mt-6 rounded-2xl border border-[var(--mvz-line)] bg-white/[0.02] p-5">
                <div className="mb-4 flex items-center gap-2 text-[13.5px] font-bold text-white">
                  <Film size={16} className="text-[var(--mvz-gold)]" />
                  Ângulos de Conteúdo Recomendados para Alta Retenção (Vídeo Vertical 9:16)
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {result.contentAngles.map((angle, idx) => (
                    <div key={idx} className="rounded-xl border border-[var(--mvz-line)] bg-[#070605] p-3.5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--mvz-gold)]">
                        {angle.type}
                      </div>
                      <div className="mt-1 text-[13px] font-bold text-white">{angle.title}</div>
                      <p className="mt-1.5 text-[11.5px] leading-relaxed text-[var(--mvz-muted)]">
                        {angle.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pontos Fortes e Riscos */}
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {result.strengths.length > 0 && (
                <div className="rounded-2xl border border-[rgba(127,207,159,0.2)] bg-[rgba(127,207,159,0.02)] p-4">
                  <div className="flex items-center gap-2 text-[12px] font-bold text-[#7fcf9f]">
                    <CheckCircle2 size={15} /> Pontos Fortes do Produto
                  </div>
                  <ul className="mt-2 space-y-1.5 text-[11.5px] text-white/80">
                    {result.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-[#7fcf9f]">•</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.riskFactors.length > 0 && (
                <div className="rounded-2xl border border-[rgba(242,201,76,0.2)] bg-[rgba(242,201,76,0.02)] p-4">
                  <div className="flex items-center gap-2 text-[12px] font-bold text-[var(--mvz-gold)]">
                    <AlertTriangle size={15} /> Pontos de Atenção na Gravação
                  </div>
                  <ul className="mt-2 space-y-1.5 text-[11.5px] text-white/80">
                    {result.riskFactors.map((r, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-[var(--mvz-gold)]">•</span> {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Script de Amostra Grátis */}
            <div className="mt-6 rounded-2xl border border-[rgba(212,175,55,0.3)] bg-[rgba(212,175,55,0.04)] p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[13px] font-bold text-[var(--mvz-gold-light)]">
                  <Sparkles size={15} className="text-[var(--mvz-gold)]" />
                  Script Oficial para Solicitar Amostra Grátis ao Fornecedor
                </div>
                <button
                  onClick={copySampleScript}
                  className="flex items-center gap-1.5 rounded-lg border border-[var(--mvz-line-strong)] bg-white/5 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-white/10"
                >
                  {copiedScript ? <Check size={12} className="text-[#7fcf9f]" /> : <Copy size={12} />}
                  {copiedScript ? 'Copiado!' : 'Copiar Script'}
                </button>
              </div>
              <p className="mt-3 rounded-xl border border-[var(--mvz-line)] bg-[#070605] p-3.5 font-mono text-[12px] leading-relaxed text-white/90">
                {result.freeSampleScript}
              </p>
            </div>

            {/* Diretriz Final */}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--mvz-line)] bg-white/[0.02] p-4 text-[12px]">
              <div>
                <span className="font-bold text-[var(--mvz-gold)]">Diretriz Prática Orbiex: </span>
                <span className="text-[var(--mvz-muted)]">{result.actionableAdvice}</span>
              </div>
              <button
                onClick={() =>
                  onUseInAgent(
                    `Quero gravar 3 vídeos do produto "${result.name}". Crie 3 roteiros completos com Hook de 3 segundos, Demonstração prática e CTA para a sacola do TikTok Shop.`
                  )
                }
                className="flex items-center gap-1 text-[11.5px] font-bold text-[var(--mvz-gold)] transition hover:text-white"
              >
                Gerar Roteiros Detalhados <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

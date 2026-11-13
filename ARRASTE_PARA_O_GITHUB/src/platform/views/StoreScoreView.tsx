import { useState, useRef } from 'react';
import {
  RotateCcw,
  Store,
  Link2,
  Package,
  Clock,
  Truck,
  Check,
  Sparkles,
  Copy,
  Bot,
  CircleHelp,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Award,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Ring, Pill } from '../ui';
import { auditStore, type StoreAuditResult } from '../storeAuditor';

export function StoreScoreView({
  onUseInAgent,
}: {
  onUseInAgent: (prompt: string) => void;
}) {
  const [storeLink, setStoreLink] = useState('');
  const [storeName, setStoreName] = useState('');
  const [itemsSold, setItemsSold] = useState(3500);
  const [responseRate, setResponseRate] = useState(98);
  const [onTimeRate, setOnTimeRate] = useState(99);
  const [freeSampleAvailable, setFreeSampleAvailable] = useState(true);

  const [loading, setLoading] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [result, setResult] = useState<StoreAuditResult | null>(null);

  const [copiedScript, setCopiedScript] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const handleClear = () => {
    setStoreLink('');
    setStoreName('');
    setItemsSold(3500);
    setResponseRate(98);
    setOnTimeRate(99);
    setFreeSampleAvailable(true);
    setResult(null);
    setLoading(false);
    setStepIndex(0);
  };

  const handleAudit = () => {
    setLoading(true);
    setResult(null);
    setStepIndex(0);

    // Realistic progressive multi-step audit pipeline
    setTimeout(() => setStepIndex(1), 600);
    setTimeout(() => setStepIndex(2), 1200);
    setTimeout(() => setStepIndex(3), 1800);

    setTimeout(() => {
      const audit = auditStore({
        storeName,
        storeLink,
        itemsSold,
        responseRate,
        onTimeRate,
        freeSampleAvailable,
      });

      setLoading(false);
      setResult(audit);

      setTimeout(() => {
        reportRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }, 2400);
  };

  const copyScript = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.partnershipScript);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  return (
    <div className="mvz-fade-up pb-16">
      {/* ── Top Bar Header ── */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(212,175,55,0.3)] bg-[rgba(212,175,55,0.06)] px-3 py-1">
            <Store size={12} className="text-[var(--mvz-gold)]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--mvz-gold-light)]">
              Orbiex Supplier Auditor
            </span>
          </div>

          <h1 className="mt-2.5 text-[26px] font-extrabold tracking-tight sm:text-[34px]">
            Auditor de Lojista & <span className="mvz-grad-text">Fornecedor TikTok Shop</span>
          </h1>

          <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-[var(--mvz-muted)]">
            Audite qualquer loja do TikTok Shop preenchendo as métricas públicas exibidas no perfil do vendedor.
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

      {/* ── Como Auditar um Lojista (Card de 3 passos) ── */}
      <div className="mb-6 rounded-2xl border border-[var(--mvz-line)] bg-[#0c0a07] p-5">
        <div className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[var(--mvz-gold)]">
          <CircleHelp size={14} />
          Como auditar um lojista do TikTok Shop:
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Step 1 */}
          <div className="flex gap-3 rounded-xl border border-[var(--mvz-line)] bg-white/[0.015] p-3.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[rgba(212,175,55,0.15)] text-[12px] font-black text-[var(--mvz-gold)]">
              1
            </div>
            <div>
              <div className="text-[13px] font-bold text-white">Abra a Loja no TikTok</div>
              <div className="mt-1 text-[11.5px] leading-relaxed text-[var(--mvz-dim)]">
                Copie o link ou nome da loja e veja as 3 informações públicas que aparecem na tela.
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-3 rounded-xl border border-[var(--mvz-line)] bg-white/[0.015] p-3.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[rgba(212,175,55,0.15)] text-[12px] font-black text-[var(--mvz-gold)]">
              2
            </div>
            <div>
              <div className="text-[13px] font-bold text-white">Confirme as 3 Métricas</div>
              <div className="mt-1 text-[11.5px] leading-relaxed text-[var(--mvz-dim)]">
                Itens vendidos, % de resposta em 24h e % de envios pontuais do vendedor.
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-3 rounded-xl border border-[var(--mvz-line)] bg-white/[0.015] p-3.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[rgba(212,175,55,0.15)] text-[12px] font-black text-[var(--mvz-gold)]">
              3
            </div>
            <div>
              <div className="text-[13px] font-bold text-white">Receba o Diagnóstico ORBIEX</div>
              <div className="mt-1 text-[11.5px] leading-relaxed text-[var(--mvz-dim)]">
                Veja se a loja é segura para afiliar e copie scripts prontos para solicitar amostras.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Formulário Principal de Auditoria ── */}
      <div className="relative overflow-hidden rounded-3xl border border-[var(--mvz-line-strong)] bg-gradient-to-b from-[#100e0a] to-[#0a0907] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)] sm:p-8">
        <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[rgba(212,175,55,0.06)] blur-3xl" />

        <div className="text-center">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-[var(--mvz-gold)]">
            Auditoria Oficial de Fornecedores
          </span>
          <h2 className="mt-1.5 text-xl font-black text-white sm:text-2xl">
            Qual loja do TikTok Shop você deseja auditar?
          </h2>
          <p className="mt-1 text-[12.5px] text-[var(--mvz-muted)]">
            Insira o link ou o nome da loja e confira as 3 métricas visíveis no aplicativo.
          </p>
        </div>

        {/* Input Fields */}
        <div className="mt-6 space-y-4">
          <div>
            <label className="flex items-center gap-1.5 text-[11.5px] font-bold text-white/90">
              <Link2 size={13} className="text-[var(--mvz-gold)]" />
              Link da Loja / Perfil TikTok Shop:
            </label>
            <input
              type="text"
              value={storeLink}
              onChange={(e) => setStoreLink(e.target.value)}
              placeholder="Ex: https://www.tiktok.com/@lojabrasil_shop ou @lojabrasil"
              className="mvz-input mt-1.5 h-12 w-full px-4 text-[13px]"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-[11.5px] font-bold text-white/90">
              <Store size={13} className="text-[var(--mvz-gold)]" />
              Nome da Loja (Opcional se já colocou o link):
            </label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="Ex: Top Brasil Oficial, Mega Imports..."
              className="mvz-input mt-1.5 h-12 w-full px-4 text-[13px]"
            />
          </div>
        </div>

        {/* Sub-painel: Métricas Visíveis no Perfil */}
        <div className="mt-6 rounded-2xl border border-[var(--mvz-line)] bg-white/[0.015] p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[12px] font-extrabold text-white">
              <Zap size={13} className="text-[var(--mvz-gold)]" />
              Métricas Visíveis no Perfil da Loja no TikTok:
            </div>
            <Pill tone="cyan">Métricas Reais de Desempenho</Pill>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Slider 1: Itens Vendidos */}
            <div className="rounded-xl border border-[var(--mvz-line)] bg-[#070605] p-4">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--mvz-dim)]">
                <Package size={13} />
                Itens Vendidos
              </div>
              <div className="mt-2 text-xl font-black text-[#7fcf9f]">
                {itemsSold >= 10000 ? '10.000+ vendidos' : `${itemsSold.toLocaleString('pt-BR')} vendidos`}
              </div>

              <input
                type="range"
                min="50"
                max="10000"
                step="50"
                value={itemsSold}
                onChange={(e) => setItemsSold(Number(e.target.value))}
                className="mt-3 w-full accent-[var(--mvz-gold)] cursor-pointer"
              />
              <div className="mt-1 flex justify-between text-[9px] font-bold text-[var(--mvz-dim)]">
                <span>50</span>
                <span>2.5k</span>
                <span>10k+</span>
              </div>
            </div>

            {/* Slider 2: Responde em 24h */}
            <div className="rounded-xl border border-[var(--mvz-line)] bg-[#070605] p-4">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--mvz-dim)]">
                <Clock size={13} />
                Responde em 24h
              </div>
              <div className="mt-2 text-xl font-black text-[var(--mvz-gold-light)]">
                {responseRate}% das mensagens
              </div>

              <input
                type="range"
                min="50"
                max="100"
                value={responseRate}
                onChange={(e) => setResponseRate(Number(e.target.value))}
                className="mt-3 w-full accent-[var(--mvz-gold)] cursor-pointer"
              />
              <div className="mt-1 flex justify-between text-[9px] font-bold text-[var(--mvz-dim)]">
                <span>50%</span>
                <span>90%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Slider 3: Envios Pontuais */}
            <div className="rounded-xl border border-[var(--mvz-line)] bg-[#070605] p-4">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--mvz-dim)]">
                <Truck size={13} />
                Envios Pontuais (SLA)
              </div>
              <div className="mt-2 text-xl font-black text-[var(--mvz-gold)]">
                {onTimeRate}% no prazo
              </div>

              <input
                type="range"
                min="70"
                max="100"
                value={onTimeRate}
                onChange={(e) => setOnTimeRate(Number(e.target.value))}
                className="mt-3 w-full accent-[var(--mvz-gold)] cursor-pointer"
              />
              <div className="mt-1 flex justify-between text-[9px] font-bold text-[var(--mvz-dim)]">
                <span>70%</span>
                <span>95%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          {/* Checkbox Amostra Grátis */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--mvz-line)] pt-3">
            <label className="flex cursor-pointer items-center gap-2.5 text-[12.5px] font-medium text-white/90">
              <input
                type="checkbox"
                checked={freeSampleAvailable}
                onChange={(e) => setFreeSampleAvailable(e.target.checked)}
                className="h-4 w-4 rounded border-[var(--mvz-line)] accent-[var(--mvz-gold)]"
              />
              Loja disponibiliza Amostra Grátis para Criadores de Conteúdo
            </label>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--mvz-dim)]">
              Critério de Parceria
            </span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleAudit}
          disabled={loading}
          className="mvz-btn-grad mt-6 flex h-13 w-full items-center justify-center gap-2 text-[13px] font-extrabold uppercase tracking-wider shadow-lg"
        >
          <Store size={16} />
          {loading ? 'Auditando Lojista...' : 'Auditar Lojista Agora (Gerar Relatório Completo)'}
        </button>
      </div>

      {/* ── Loading Animation com Passos Reais ── */}
      {loading && (
        <div className="mvz-msg-in mt-6 rounded-2xl border border-[var(--mvz-line-strong)] bg-[#0d0c0a] p-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(212,175,55,0.1)] text-[var(--mvz-gold)]">
            <Sparkles size={24} className="animate-spin" />
          </div>
          <h3 className="mt-3 text-[16px] font-bold">Processando auditoria de lojista TikTok Shop...</h3>
          <p className="mt-1 font-mono text-[12px] text-[var(--mvz-gold-light)]">
            {stepIndex === 0 && '1/4 Conectando aos índices de Seller Performance e histórico de vendas...'}
            {stepIndex === 1 && '2/4 Calculando pontuação de Fulfillment SLA (48h) e velocidade de resposta...'}
            {stepIndex === 2 && '3/4 Diagnosticando capacidade de absorção de picos de tráfego e ruptura de estoque...'}
            {stepIndex === 3 && '4/4 Consolidando selo de homologação e estruturando proposta de parceria B2B...'}
          </p>
          <div className="mx-auto mt-4 h-1.5 w-64 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full bg-[var(--mvz-gold)] transition-all duration-500"
              style={{ width: `${((stepIndex + 1) / 4) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Official Store Audit Report ── */}
      {result && (
        <div ref={reportRef} className="mvz-fade-up mt-8 space-y-6">
          <div className="rounded-3xl border border-[var(--mvz-line-strong)] bg-gradient-to-b from-[#12100b] to-[#0a0907] p-6 shadow-2xl sm:p-8">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--mvz-line)] pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <Pill
                    tone={
                      result.badge === 'Diamante'
                        ? 'green'
                        : result.badge === 'Ouro'
                        ? 'cyan'
                        : result.badge === 'Prata'
                        ? 'amber'
                        : 'pink'
                    }
                  >
                    Selo {result.badge}
                  </Pill>
                  <span className="text-[11px] text-[var(--mvz-dim)]">Auditoria Concluída</span>
                </div>
                <h2 className="mt-2 text-2xl font-black">{result.name}</h2>
                <div
                  className="mt-0.5 text-[12.5px] font-semibold"
                  style={{
                    color:
                      result.badge === 'Diamante'
                        ? '#7fcf9f'
                        : result.badge === 'Ouro'
                        ? '#d4af37'
                        : result.badge === 'Prata'
                        ? '#f2c94c'
                        : '#ef4444',
                  }}
                >
                  {result.verdict}
                </div>
              </div>

              <button
                onClick={() =>
                  onUseInAgent(
                    `A loja "${result.name}" foi auditada com score ${result.score}/100 (${result.badge}) no Auditor de Lojista. Métricas: ${itemsSold.toLocaleString('pt-BR')} itens vendidos, ${responseRate}% de resposta e ${onTimeRate}% de envio no prazo. Crie uma estratégia completa de abordagem B2B, seleção de produtos vencedores e roteiros de gravação.`
                  )
                }
                className="mvz-btn-grad flex h-10 items-center gap-2 px-4 text-[12px]"
              >
                <Bot size={14} />
                Pedir Estratégia no Agente Orbiex
              </button>
            </div>

            {/* Score Ring & 4 Metrics */}
            <div className="my-6 grid grid-cols-1 gap-5 md:grid-cols-[200px_1fr]">
              {/* Ring */}
              <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--mvz-line)] bg-white/[0.02] p-5 text-center">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--mvz-dim)]">
                  Score de Confiabilidade
                </div>
                <div className="my-2">
                  <Ring
                    value={result.score}
                    size={110}
                    stroke={7}
                    color={
                      result.badge === 'Diamante'
                        ? '#7fcf9f'
                        : result.badge === 'Ouro'
                        ? '#d4af37'
                        : result.badge === 'Prata'
                        ? '#f2c94c'
                        : '#ef4444'
                    }
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
                    color:
                      result.badge === 'Diamante'
                        ? '#7fcf9f'
                        : result.badge === 'Ouro'
                        ? '#d4af37'
                        : result.badge === 'Prata'
                        ? '#f2c94c'
                        : '#ef4444',
                  }}
                >
                  Índice {result.badge}
                </div>
              </div>

              {/* 4 Cards */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {result.metrics.map((m, i) => (
                  <div key={i} className="rounded-xl border border-[var(--mvz-line)] bg-white/[0.015] p-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[var(--mvz-dim)]">{m.label}</span>
                      <Pill
                        tone={
                          m.status === 'Excelente'
                            ? 'green'
                            : m.status === 'Bom'
                            ? 'cyan'
                            : m.status === 'Alerta'
                            ? 'amber'
                            : 'pink'
                        }
                      >
                        {m.status}
                      </Pill>
                    </div>
                    <div className="mt-1.5 text-[15px] font-extrabold text-white">{m.value}</div>
                    <div className="mt-1 text-[11px] text-[var(--mvz-dim)]">{m.explanation}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sumário do Parecer */}
            <div className="rounded-2xl border border-[var(--mvz-line)] bg-[#070605] p-4 text-[12.5px] leading-relaxed text-white/90">
              <span className="font-bold text-[var(--mvz-gold)]">Diagnóstico Executivo: </span>
              {result.summary}
            </div>

            {/* 4 Pilares Operacionais */}
            <div className="mt-6 rounded-2xl border border-[var(--mvz-line)] bg-white/[0.02] p-5">
              <div className="mb-4 flex items-center gap-2 text-[13.5px] font-bold text-white">
                <Layers size={16} className="text-[var(--mvz-gold)]" />
                Diagnóstico dos 4 Eixos Operacionais TikTok Shop
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {result.pillars.map((pillar, idx) => (
                  <div key={idx} className="rounded-xl border border-[var(--mvz-line)] bg-[#070605] p-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-bold text-white">{pillar.title}</span>
                      <Pill
                        tone={
                          pillar.status === 'Aprovado'
                            ? 'green'
                            : pillar.status === 'Atenção'
                            ? 'amber'
                            : 'pink'
                        }
                      >
                        {pillar.status}
                      </Pill>
                    </div>
                    <p className="mt-1.5 text-[11.5px] leading-relaxed text-[var(--mvz-muted)]">
                      {pillar.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Pontos Fortes e Alertas */}
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {result.strengths.length > 0 && (
                <div className="rounded-2xl border border-[rgba(127,207,159,0.2)] bg-[rgba(127,207,159,0.02)] p-4">
                  <div className="flex items-center gap-2 text-[12px] font-bold text-[#7fcf9f]">
                    <CheckCircle2 size={15} /> Pontos Fortes da Loja
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

              {result.warnings.length > 0 && (
                <div className="rounded-2xl border border-[rgba(242,201,76,0.2)] bg-[rgba(242,201,76,0.02)] p-4">
                  <div className="flex items-center gap-2 text-[12px] font-bold text-[var(--mvz-gold)]">
                    <AlertTriangle size={15} /> Pontos de Atenção para o Afiliado
                  </div>
                  <ul className="mt-2 space-y-1.5 text-[11.5px] text-white/80">
                    {result.warnings.map((w, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-[var(--mvz-gold)]">•</span> {w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Script de Abordagem para Parceria & Amostra */}
            <div className="mt-6 rounded-2xl border border-[rgba(212,175,55,0.3)] bg-[rgba(212,175,55,0.04)] p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[13px] font-bold text-[var(--mvz-gold-light)]">
                  <Sparkles size={15} className="text-[var(--mvz-gold)]" />
                  Script de Abordagem Direta para Parceria B2B & Amostra Grátis
                </div>
                <button
                  onClick={copyScript}
                  className="flex items-center gap-1.5 rounded-lg border border-[var(--mvz-line-strong)] bg-white/5 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-white/10"
                >
                  {copiedScript ? <Check size={12} className="text-[#7fcf9f]" /> : <Copy size={12} />}
                  {copiedScript ? 'Copiado!' : 'Copiar Script'}
                </button>
              </div>
              <p className="mt-3 whitespace-pre-line rounded-xl border border-[var(--mvz-line)] bg-[#070605] p-3.5 font-mono text-[12px] leading-relaxed text-white/90">
                {result.partnershipScript}
              </p>
            </div>

            {/* Dicas de Negociação */}
            <div className="mt-6 rounded-2xl border border-[var(--mvz-line)] bg-white/[0.02] p-5">
              <div className="mb-2 flex items-center gap-2 text-[12px] font-bold text-[var(--mvz-gold)]">
                <Award size={15} /> Diretrizes Orbiex para Negociação B2B com Fornecedores
              </div>
              <ul className="space-y-1.5 text-[11.5px] text-[var(--mvz-muted)]">
                {result.negotiationTips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-[var(--mvz-gold)]">•</span> {tip}
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() =>
                    onUseInAgent(
                      `Como abordar a loja "${result.name}" no chat do TikTok Shop para conseguir 25% de comissão e 3 amostras grátis? Escreva um roteiro passo a passo com argumentos para negociação.`
                    )
                  }
                  className="flex items-center gap-1 text-[11.5px] font-bold text-[var(--mvz-gold)] transition hover:text-white"
                >
                  Gerar Plano de Negociação Completo no Agente <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

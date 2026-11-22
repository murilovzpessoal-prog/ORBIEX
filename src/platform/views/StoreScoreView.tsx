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
  Globe,
  Tag,
  Percent,
  Gift,
  SlidersHorizontal,
} from 'lucide-react';
import { Ring, Pill } from '../ui';
import { auditStore, auditStoreAI, type StoreAuditResult } from '../storeAuditor';
import { copyText as copyToClipboard } from '../clipboard';

const QUICK_STORE_TESTS = [
  { name: 'Confecção Brás Fitness Atacado', link: '@brasfitness_fabrica', niche: 'Moda Fitness Feminina' },
  { name: 'Drop Importados Express 24h', link: '@drop_importados_99', niche: 'Gadgets e Achadinhos Importados' },
  { name: 'Glow Lab Dermocosméticos Oficial', link: '@glowlab_oficial', niche: 'Skincare & Beleza' },
  { name: 'Outlet Sneakers 1ª Linha', link: '@sneakers_primeiralinha', niche: 'Tênis de Marca / Réplicas' },
];

export function StoreScoreView({
  onUseInAgent,
}: {
  onUseInAgent: (prompt: string) => void;
}) {
  const [storeLink, setStoreLink] = useState('');
  const [storeName, setStoreName] = useState('');
  const [storeNiche, setStoreNiche] = useState('');
  const [metricsMode, setMetricsMode] = useState<'auto' | 'manual'>('auto');
  const [itemsSold, setItemsSold] = useState(1800);
  const [responseRate, setResponseRate] = useState(92);
  const [onTimeRate, setOnTimeRate] = useState(95);
  const [freeSampleAvailable, setFreeSampleAvailable] = useState(true);
  const [validationMsg, setValidationMsg] = useState('');

  const [loading, setLoading] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [result, setResult] = useState<StoreAuditResult | null>(null);

  const [copiedScript, setCopiedScript] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const runIdRef = useRef(0);

  const handleClear = () => {
    runIdRef.current++;
    setStoreLink('');
    setStoreName('');
    setStoreNiche('');
    setMetricsMode('auto');
    setItemsSold(1800);
    setResponseRate(92);
    setOnTimeRate(95);
    setFreeSampleAvailable(true);
    setValidationMsg('');
    setResult(null);
    setLoading(false);
    setStepIndex(0);
  };

  const handleAudit = async () => {
    if (loading) return;
    if (!storeName.trim() && !storeLink.trim()) {
      setValidationMsg('Informe o link/@perfil da loja ou digite o nome do fornecedor para auditar.');
      nameInputRef.current?.focus();
      return;
    }

    setValidationMsg('');
    const runId = ++runIdRef.current;
    setLoading(true);
    setResult(null);
    setStepIndex(0);

    const timers = [550, 1150, 1750, 2350].map((ms, i) =>
      window.setTimeout(() => {
        if (runIdRef.current === runId) setStepIndex(i + 1);
      }, ms)
    );

    const req = {
      storeName,
      storeLink,
      storeNiche,
      metricsMode,
      itemsSold,
      responseRate,
      onTimeRate,
      freeSampleAvailable,
    };
    const minDelay = new Promise((r) => window.setTimeout(r, 2600));
    let audit: StoreAuditResult;
    try {
      [audit] = await Promise.all([auditStoreAI(req), minDelay]);
    } catch {
      audit = auditStore(req);
    }
    timers.forEach((t) => window.clearTimeout(t));
    if (runIdRef.current !== runId) return;

    setLoading(false);
    setResult(audit);

    setTimeout(() => {
      reportRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const copyScript = () => {
    if (!result) return;
    copyToClipboard(result.partnershipScript);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const scanTargetLabel = storeName.trim() || storeLink.trim().slice(0, 42) || 'lojista';
  const scanSteps = [
    storeLink.trim()
      ? `Inspecionando perfil/link "${storeLink.trim().slice(0, 45)}" e extraindo sinais públicos...`
      : `Mapeando estrutura comercial e modelo operacional de "${scanTargetLabel}"...`,
    `Identificando nicho de catálogo, origem de estoque (fábrica, revenda ou dropshipping) e risco IPR...`,
    metricsMode === 'manual'
      ? `Auditando métricas informadas (${itemsSold.toLocaleString('pt-BR')} vendas · ${responseRate}% chat · ${onTimeRate}% SLA)...`
      : `Estimando maturidade logística, risco de atraso no SLA de 48h e retenção de comissões...`,
    `Calculando comissão-alvo ideal B2B e selecionando os melhores SKUs para pedir amostra...`,
    `Consolidando Selo Orbiex e redigindo proposta personalizada de parceria para "${scanTargetLabel}"...`,
  ];

  return (
    <div className="mvz-fade-up pb-16">
      {/* ── Top Bar Header ── */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(212,175,55,0.3)] bg-[rgba(212,175,55,0.06)] px-3 py-1">
            <Store size={12} className="text-[var(--mvz-gold)]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--mvz-gold-light)]">
              Orbiex Forensic Supplier Auditor
            </span>
          </div>

          <h1 className="mt-2.5 text-[26px] font-extrabold tracking-tight sm:text-[34px]">
            Auditor de Lojista & <span className="mvz-grad-text">Fornecedor TikTok Shop</span>
          </h1>

          <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-[var(--mvz-muted)]">
            Descubra se o fornecedor tem estoque próprio, se é dropshipping disfarçado ou risco de queda, qual comissão negociar e quais produtos pedir de amostra grátis.
          </p>
        </div>

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
          Como auditar qualquer fornecedor:
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="flex gap-3 rounded-xl border border-[var(--mvz-line)] bg-white/[0.015] p-3.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[rgba(212,175,55,0.15)] text-[12px] font-black text-[var(--mvz-gold)]">
              1
            </div>
            <div>
              <div className="text-[13px] font-bold text-white">Cole o Link/@Perfil ou Nome</div>
              <div className="mt-1 text-[11.5px] leading-relaxed text-[var(--mvz-dim)]">
                Basta colar o `@perfil` ou link da loja no TikTok Shop / Shopee, ou digitar o nome e nicho da loja.
              </div>
            </div>
          </div>

          <div className="flex gap-3 rounded-xl border border-[var(--mvz-line)] bg-white/[0.015] p-3.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[rgba(212,175,55,0.15)] text-[12px] font-black text-[var(--mvz-gold)]">
              2
            </div>
            <div>
              <div className="text-[13px] font-bold text-white">Automático ou Métricas do App</div>
              <div className="mt-1 text-[11.5px] leading-relaxed text-[var(--mvz-dim)]">
                Deixe no modo Inteligente (por link/perfil) ou ative o modo Manual se estiver vendo os números exatos no celular.
              </div>
            </div>
          </div>

          <div className="flex gap-3 rounded-xl border border-[var(--mvz-line)] bg-white/[0.015] p-3.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[rgba(212,175,55,0.15)] text-[12px] font-black text-[var(--mvz-gold)]">
              3
            </div>
            <div>
              <div className="text-[13px] font-bold text-white">Raio-X B2B Personalizado</div>
              <div className="mt-1 text-[11.5px] leading-relaxed text-[var(--mvz-dim)]">
                Veja o modelo da loja, comissão ideal do nicho, SKUs recomendados para amostra e script B2B sob medida.
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
            Auditoria Forense de Fornecedores
          </span>
          <h2 className="mt-1.5 text-xl font-black text-white sm:text-2xl">
            Qual loja ou fornecedor você deseja investigar?
          </h2>
          <p className="mt-1 text-[12.5px] text-[var(--mvz-muted)]">
            Cada loja recebe diagnóstico exclusivo conforme seu link, estrutura comercial, nicho e reputação.
          </p>
        </div>

        {/* Input Fields */}
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="flex items-center gap-1.5 text-[11.5px] font-bold text-white/90">
              <Link2 size={13} className="text-[var(--mvz-gold)]" />
              Link ou @Perfil da Loja:
            </label>
            <input
              type="text"
              value={storeLink}
              onChange={(e) => {
                setStoreLink(e.target.value);
                if (validationMsg) setValidationMsg('');
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleAudit()}
              placeholder="Ex: @modafitness_sp ou https://tiktok.com/@..."
              className="mvz-input mt-1.5 h-12 w-full px-4 text-[13px]"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-[11.5px] font-bold text-white/90">
              <Store size={13} className="text-[var(--mvz-gold)]" />
              Nome da Loja:
            </label>
            <input
              ref={nameInputRef}
              type="text"
              value={storeName}
              onChange={(e) => {
                setStoreName(e.target.value);
                if (validationMsg) setValidationMsg('');
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleAudit()}
              placeholder="Ex: Confecção Brás Fitness, Tech Imports..."
              className="mvz-input mt-1.5 h-12 w-full px-4 text-[13px]"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-[11.5px] font-bold text-white/90">
              <Tag size={13} className="text-[var(--mvz-gold)]" />
              O que a Loja Vende? (Opcional):
            </label>
            <input
              type="text"
              value={storeNiche}
              onChange={(e) => setStoreNiche(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAudit()}
              placeholder="Ex: Moda fitness, fones bluetooth, skincare..."
              className="mvz-input mt-1.5 h-12 w-full px-4 text-[13px]"
            />
          </div>
        </div>

        {/* Chips de Teste Rápido de Fornecedores */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold text-[var(--mvz-dim)]">Testar perfis diferentes:</span>
          {QUICK_STORE_TESTS.map((st) => (
            <button
              key={st.link}
              type="button"
              disabled={loading}
              onClick={() => {
                setStoreName(st.name);
                setStoreLink(st.link);
                setStoreNiche(st.niche);
                setMetricsMode('auto');
                setValidationMsg('');
              }}
              className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-medium text-white/75 transition hover:border-[var(--mvz-gold)]/45 hover:bg-[var(--mvz-gold)]/10 hover:text-[#f4d77a]"
            >
              {st.name}
            </button>
          ))}
        </div>

        {validationMsg && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-2.5 text-[12px] font-semibold text-amber-200">
            <AlertTriangle size={14} className="shrink-0 text-amber-300" />
            <span>{validationMsg}</span>
          </div>
        )}

        {/* Seletor de Modo de Métricas */}
        <div className="mt-6 rounded-2xl border border-[var(--mvz-line)] bg-white/[0.015] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[12px] font-extrabold text-white">
              <SlidersHorizontal size={14} className="text-[var(--mvz-gold)]" />
              Modo de Leitura das Métricas da Loja:
            </div>

            <div className="inline-flex rounded-xl border border-white/10 bg-[#070605] p-1">
              <button
                type="button"
                onClick={() => setMetricsMode('auto')}
                className={`rounded-lg px-3 py-1.5 text-[11px] font-bold transition ${
                  metricsMode === 'auto'
                    ? 'bg-[var(--mvz-gold)] text-black shadow'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Diagnóstico Inteligente (Link / Nome)
              </button>
              <button
                type="button"
                onClick={() => setMetricsMode('manual')}
                className={`rounded-lg px-3 py-1.5 text-[11px] font-bold transition ${
                  metricsMode === 'manual'
                    ? 'bg-[var(--mvz-gold)] text-black shadow'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Tenho as Métricas do App (Manual)
              </button>
            </div>
          </div>

          {metricsMode === 'auto' ? (
            <p className="mt-3 text-[12px] leading-relaxed text-[var(--mvz-muted)]">
              <strong className="text-[#f4d77a]">Modo Automático Ativo:</strong> O motor inspeciona o link/@perfil, nome e nicho da loja para diagnosticar se é fabricante, marca oficial, revenda iniciante ou dropshipping de risco — sem usar números fixos genéricos. Se você estiver com a página da loja aberta no celular e quiser informar os números exatos, clique em <strong className="text-white">“Tenho as Métricas do App”</strong>.
            </p>
          ) : (
            <div className="mvz-msg-in mt-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {/* Slider 1: Itens Vendidos */}
                <div className="rounded-xl border border-[var(--mvz-line)] bg-[#070605] p-4">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--mvz-dim)]">
                    <Package size={13} />
                    Itens Vendidos na Loja
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
                    className="mt-3 w-full cursor-pointer accent-[var(--mvz-gold)]"
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
                    className="mt-3 w-full cursor-pointer accent-[var(--mvz-gold)]"
                  />
                  <div className="mt-1 flex justify-between text-[9px] font-bold text-[var(--mvz-dim)]">
                    <span>50%</span>
                    <span>85%</span>
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
                    min="65"
                    max="100"
                    value={onTimeRate}
                    onChange={(e) => setOnTimeRate(Number(e.target.value))}
                    className="mt-3 w-full cursor-pointer accent-[var(--mvz-gold)]"
                  />
                  <div className="mt-1 flex justify-between text-[9px] font-bold text-[var(--mvz-dim)]">
                    <span>65%</span>
                    <span>92%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--mvz-line)] pt-3">
                <label className="flex cursor-pointer items-center gap-2.5 text-[12.5px] font-medium text-white/90">
                  <input
                    type="checkbox"
                    checked={freeSampleAvailable}
                    onChange={(e) => setFreeSampleAvailable(e.target.checked)}
                    className="h-4 w-4 rounded border-[var(--mvz-line)] accent-[var(--mvz-gold)]"
                  />
                  Loja disponibiliza botão de Amostra Grátis ativa no aplicativo
                </label>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--mvz-dim)]">
                  Métricas Confirmadas Manualmente
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={handleAudit}
          disabled={loading}
          className="mvz-btn-grad mt-6 flex h-13 w-full items-center justify-center gap-2 text-[13px] font-extrabold uppercase tracking-wider shadow-lg"
        >
          <Zap size={16} fill="currentColor" />
          {loading ? 'Executando Auditoria Forense da Loja...' : 'AUDITAR LOJISTA AGORA (RELATÓRIO PERSONALIZADO)'}
        </button>
      </div>

      {/* ── Scanner Forense em Tempo Real ── */}
      {loading && (
        <div className="mvz-msg-in mt-6 rounded-2xl border border-[var(--mvz-line-strong)] bg-[#0b0a08] p-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
            <div className="flex items-center gap-2.5">
              <Sparkles size={18} className="animate-spin text-[var(--mvz-gold)]" />
              <span className="text-[14px] font-extrabold text-white">
                Investigando Fornecedor: <span className="text-[#f4d77a]">{scanTargetLabel}</span>
              </span>
            </div>
            <span className="font-mono text-[11px] font-bold text-[var(--mvz-gold-light)]">
              Etapa {stepIndex + 1}/5
            </span>
          </div>

          <div className="mt-4 space-y-2.5">
            {scanSteps.map((st, idx) => {
              const done = idx < stepIndex;
              const current = idx === stepIndex;
              return (
                <div
                  key={idx}
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2 font-mono text-[11.5px] transition ${
                    current
                      ? 'border border-[var(--mvz-gold)]/35 bg-[var(--mvz-gold)]/10 text-white'
                      : done
                      ? 'text-emerald-300/90'
                      : 'text-white/30'
                  }`}
                >
                  {done ? (
                    <Check size={13} className="shrink-0 text-emerald-400" strokeWidth={3} />
                  ) : current ? (
                    <span className="h-2 w-2 shrink-0 animate-ping rounded-full bg-[var(--mvz-gold)]" />
                  ) : (
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white/20" />
                  )}
                  <span className="truncate">{st}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full bg-[var(--mvz-gold)] transition-all duration-500"
              style={{ width: `${((stepIndex + 1) / 5) * 100}%` }}
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
                <div className="flex flex-wrap items-center gap-2">
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
                  {result.sourceSummary && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[10.5px] font-semibold text-[var(--mvz-gold-light)]">
                      <Globe size={11} />
                      {result.sourceSummary}
                    </span>
                  )}
                </div>
                <h2 className="mt-2.5 text-2xl font-black text-white">{result.name}</h2>

                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-[var(--mvz-muted)]">
                  <span className="inline-flex items-center gap-1.5">
                    <Tag size={13} className="text-[var(--mvz-gold)]" />
                    Nicho: <strong className="text-white">{result.detectedNiche}</strong>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Store size={13} className="text-[#f4d77a]" />
                    Estrutura: <strong className="text-white">{result.storeProfileType}</strong>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Percent size={13} className="text-[#7fcf9f]" />
                    Comissão-Alvo B2B: <strong className="text-[#7fcf9f]">{result.recommendedCommissionTarget}</strong>
                  </span>
                </div>

                <div
                  className="mt-1.5 text-[12.5px] font-semibold"
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
                    `A loja "${result.name}" (${result.detectedNiche}, perfil: ${result.storeProfileType}) recebeu score ${result.score}/100 (Selo ${result.badge}) no Auditor Forense da Orbiex. Diagnóstico: ${result.summary} Crie um plano completo de negociação B2B, escolha dos produtos campeões dessa loja e estratégia de vídeos.`
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
                    <div className="flex items-center justify-between gap-2">
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
                    <div className="mt-1 text-[11px] leading-relaxed text-[var(--mvz-dim)]">{m.explanation}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sumário do Parecer */}
            <div className="rounded-2xl border border-[var(--mvz-line)] bg-[#070605] p-4 text-[12.5px] leading-relaxed text-white/90">
              <span className="font-bold text-[var(--mvz-gold)]">Diagnóstico Forense da Loja: </span>
              {result.summary}
            </div>

            {/* Melhores Produtos Desta Loja para Pedir Amostra Primeiro */}
            {result.bestProductsToRequestSample.length > 0 && result.score >= 45 && (
              <div className="mt-6 rounded-2xl border border-[var(--mvz-gold)]/25 bg-[var(--mvz-gold)]/[0.04] p-5">
                <div className="flex items-center gap-2 text-[12.5px] font-bold text-[#f4d77a]">
                  <Gift size={15} className="text-[var(--mvz-gold)]" />
                  Quais Produtos Pedir de Amostra Primeiro em “{result.name}”:
                </div>
                <div className="mt-3 flex flex-wrap gap-2.5">
                  {result.bestProductsToRequestSample.map((prod, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-2 rounded-xl border border-[var(--mvz-gold)]/30 bg-[#070605] px-3.5 py-2 text-[12px] font-semibold text-white"
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--mvz-gold)]/20 text-[10px] font-black text-[var(--mvz-gold)]">
                        {idx + 1}
                      </span>
                      {prod}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 4 Pilares Operacionais */}
            <div className="mt-6 rounded-2xl border border-[var(--mvz-line)] bg-white/[0.02] p-5">
              <div className="mb-4 flex items-center gap-2 text-[13.5px] font-bold text-white">
                <Layers size={16} className="text-[var(--mvz-gold)]" />
                Auditoria dos 4 Eixos Operacionais de “{result.name}”
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {result.pillars.map((pillar, idx) => (
                  <div key={idx} className="rounded-xl border border-[var(--mvz-line)] bg-[#070605] p-3.5">
                    <div className="flex items-center justify-between gap-2">
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
                    <CheckCircle2 size={15} /> Pontos Fortes de “{result.name}”
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
                    <AlertTriangle size={15} /> Riscos Operacionais a Verificar
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
                  Script B2B Personalizado para Abordar “{result.name}”
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
                <Award size={15} /> Estratégia de Negociação Recomendada para Este Perfil de Loja
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
                      `Como abordar a loja "${result.name}" (${result.detectedNiche}) no chat do TikTok Shop para conseguir comissão Target Plan (${result.recommendedCommissionTarget}) e amostras grátis? Escreva mensagens de abordagem e resposta a objeções do lojista.`
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

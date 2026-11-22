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
  Users,
  MessageSquareWarning,
  Globe,
  DollarSign,
} from 'lucide-react';
import { Ring, Pill } from '../ui';
import { auditProduct, auditProductAI, type ProductAuditResult } from '../productAuditor';
import { copyText as copyToClipboard } from '../clipboard';

const QUICK_PRODUCT_TESTS = [
  { label: 'Mini Processador Elétrico USB', price: 'R$ 54,90', comm: '20%' },
  { label: 'Sérum Clareador de Melasma', price: 'R$ 69,90', comm: '22%' },
  { label: 'Calça Jeans Wide Leg Cintura Alta', price: 'R$ 119,90', comm: '18%' },
  { label: 'Cabo USB-C Simples 1 Metro', price: 'R$ 14,90', comm: '12%' },
  { label: 'Tênis Nike Air Force 1 Linha', price: 'R$ 189,90', comm: '20%' },
];

export function ProductScoreView({
  onUseInAgent,
}: {
  onUseInAgent: (prompt: string) => void;
}) {
  const [productLink, setProductLink] = useState('');
  const [productName, setProductName] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [estimatedPrice, setEstimatedPrice] = useState('');
  const [commission, setCommission] = useState('20%');
  const [category, setCategory] = useState('Detectar Automaticamente');
  const [validationMsg, setValidationMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [result, setResult] = useState<ProductAuditResult | null>(null);

  const [copiedScript, setCopiedScript] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const requestIdRef = useRef(0);

  const handleClear = () => {
    requestIdRef.current++;
    setProductLink('');
    setProductName('');
    setEstimatedPrice('');
    setCommission('20%');
    setCategory('Detectar Automaticamente');
    setValidationMsg('');
    setResult(null);
    setLoading(false);
    setStepIndex(0);
  };

  const runAnalysisWith = async (override?: {
    name?: string;
    link?: string;
    price?: string;
    comm?: string;
  }) => {
    const pName = (override?.name ?? productName).trim();
    const pLink = (override?.link ?? productLink).trim();
    const pPrice = (override?.price ?? estimatedPrice).trim();
    const pComm = (override?.comm ?? commission).trim() || '20%';

    if (!pName && !pLink) {
      setValidationMsg('Digite o nome do produto ou cole o link do anúncio para realizar a auditoria personalizada.');
      nameInputRef.current?.focus();
      return;
    }

    setValidationMsg('');
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setResult(null);
    setStepIndex(0);

    const timers = [
      window.setTimeout(() => setStepIndex(1), 550),
      window.setTimeout(() => setStepIndex(2), 1150),
      window.setTimeout(() => setStepIndex(3), 1800),
      window.setTimeout(() => setStepIndex(4), 2450),
    ];
    const minDelay = new Promise((r) => window.setTimeout(r, 2700));

    let audit: ProductAuditResult;
    try {
      const [ai] = await Promise.all([
        auditProductAI({
          productName: pName,
          productLink: pLink,
          category,
          commission: pComm,
          estimatedPrice: pPrice,
        }),
        minDelay,
      ]);
      audit = ai;
    } catch {
      audit = auditProduct({
        productName: pName,
        productLink: pLink,
        category,
        commission: pComm,
        estimatedPrice: pPrice,
      });
    }
    if (requestId !== requestIdRef.current) return;
    timers.forEach((t) => window.clearTimeout(t));

    setLoading(false);
    setResult(audit);

    setTimeout(() => {
      reportRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const copySampleScript = () => {
    if (!result) return;
    copyToClipboard(result.freeSampleScript);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const scanTargetLabel =
    productName.trim() ||
    (() => {
      try {
        const raw = productLink.trim();
        if (!raw) return 'produto';
        if (raw.startsWith('@')) return raw;
        const u = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
        return `${u.hostname.replace(/^www\./, '')}${u.pathname.slice(0, 32)}`;
      } catch {
        return productLink.trim().slice(0, 40);
      }
    })();

  const scanSteps = [
    productLink.trim()
      ? `Inspecionando URL e extraindo metadados de "${scanTargetLabel}"...`
      : `Mapeando taxonomia comercial, subnicho e curva de demanda de "${scanTargetLabel}"...`,
    `Cruzando "${scanTargetLabel}" com filtros de IPR (marcas), Anvisa e moderação visual TikTok Shop...`,
    `Calculando ticket médio real, comissão líquida (${commission || '20%'}) e quantas vendas batem R$ 1.000...`,
    `Diagnosticando taxa real de devolução (tamanho/avaria/expectativa) e objeções dos comentários...`,
    `Gerando parecer forense exclusivo, cenas de gravação 9:16 e script de amostra grátis...`,
  ];

  return (
    <div className="mvz-fade-up pb-16">
      {/* ── Top Bar Header ── */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(212,175,55,0.3)] bg-[rgba(212,175,55,0.06)] px-3 py-1">
            <Sparkles size={12} className="text-[var(--mvz-gold)]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--mvz-gold-light)]">
              Orbiex Forensic Product Intelligence
            </span>
          </div>

          <h1 className="mt-2.5 text-[26px] font-extrabold tracking-tight sm:text-[34px]">
            Analisador de Produto & <span className="mvz-grad-text">Score TikTok Shop</span>
          </h1>

          <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-[var(--mvz-muted)]">
            Auditoria forense personalizada por link ou nome: avalia risco real de banimento, ticket, comissão por venda, devoluções, objeções dos comentários e roteiros práticos para aquele produto exato.
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

      {/* ── Como Fazer a Análise (Card de 3 passos) ── */}
      <div className="mb-6 rounded-2xl border border-[var(--mvz-line)] bg-[#0c0a07] p-5">
        <div className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[var(--mvz-gold)]">
          <CircleHelp size={14} />
          Como funciona a auditoria inteligente:
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="flex gap-3 rounded-xl border border-[var(--mvz-line)] bg-white/[0.015] p-3.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[rgba(212,175,55,0.15)] text-[12px] font-black text-[var(--mvz-gold)]">
              1
            </div>
            <div>
              <div className="text-[13px] font-bold text-white">Cole o Link Real ou Nome</div>
              <div className="mt-1 text-[11.5px] leading-relaxed text-[var(--mvz-dim)]">
                Aceita links do TikTok Shop (`vt.tiktok.com`, `@loja/video/...`), Shopee, Mercado Livre ou o nome específico do item.
              </div>
            </div>
          </div>

          <div className="flex gap-3 rounded-xl border border-[var(--mvz-line)] bg-white/[0.015] p-3.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[rgba(212,175,55,0.15)] text-[12px] font-black text-[var(--mvz-gold)]">
              2
            </div>
            <div>
              <div className="text-[13px] font-bold text-white">Inspeção Forense sem Filtro</div>
              <div className="mt-1 text-[11.5px] leading-relaxed text-[var(--mvz-dim)]">
                O motor extrai os dados do link, calcula margem em R$, detecta saturação, fragilidade, réplicas ou travas de moderação.
              </div>
            </div>
          </div>

          <div className="flex gap-3 rounded-xl border border-[var(--mvz-line)] bg-white/[0.015] p-3.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[rgba(212,175,55,0.15)] text-[12px] font-black text-[var(--mvz-gold)]">
              3
            </div>
            <div>
              <div className="text-[13px] font-bold text-white">Plano de Ação Sob Medida</div>
              <div className="mt-1 text-[11.5px] leading-relaxed text-[var(--mvz-dim)]">
                Receba o Score honesto (0–100), como matar as objeções daquele item na câmera e script personalizado de amostra.
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
            Insira os Dados do Produto para Auditoria
          </div>
          <span className="text-[9.5px] font-bold uppercase tracking-[0.2em] text-[var(--mvz-dim)]">
            Leitura Real de Link + IA Forense
          </span>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Campo 1: Link */}
          <div>
            <label className="flex items-center gap-1.5 text-[11.5px] font-bold text-white/90">
              <Link2 size={13} className="text-[var(--mvz-gold)]" />
              Link do Produto (TikTok Shop, Shopee, Mercado Livre...):
            </label>
            <input
              type="text"
              value={productLink}
              onChange={(e) => {
                setProductLink(e.target.value);
                if (validationMsg) setValidationMsg('');
              }}
              onKeyDown={(e) => e.key === 'Enter' && runAnalysisWith()}
              placeholder="Ex: https://vt.tiktok.com/... ou https://shopee.com.br/..."
              className="mvz-input mt-2 h-12 w-full px-4 text-[13px]"
            />
          </div>

          {/* Campo 2: Nome do Produto */}
          <div>
            <label className="flex items-center gap-1.5 text-[11.5px] font-bold text-white/90">
              <CheckCircle2 size={13} className="text-[var(--mvz-gold)]" />
              Nome / Modelo Específico do Produto:
            </label>
            <input
              ref={nameInputRef}
              type="text"
              value={productName}
              onChange={(e) => {
                setProductName(e.target.value);
                if (validationMsg) setValidationMsg('');
              }}
              onKeyDown={(e) => e.key === 'Enter' && runAnalysisWith()}
              placeholder="Ex: Mini Projetor HY300 4K, Calça Flare Alfaiataria, Cabo USB..."
              className="mvz-input mt-2 h-12 w-full px-4 text-[13px]"
            />
          </div>
        </div>

        {/* Chips de Teste Rápido Contrastantes */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold text-[var(--mvz-dim)]">Exemplos para comparar notas:</span>
          {QUICK_PRODUCT_TESTS.map((item) => (
            <button
              key={item.label}
              type="button"
              disabled={loading}
              onClick={() => {
                setProductName(item.label);
                setEstimatedPrice(item.price);
                setCommission(item.comm);
                setValidationMsg('');
              }}
              className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-medium text-white/75 transition hover:border-[var(--mvz-gold)]/45 hover:bg-[var(--mvz-gold)]/10 hover:text-[#f4d77a]"
            >
              {item.label}
            </button>
          ))}
        </div>

        {validationMsg && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-2.5 text-[12px] font-semibold text-amber-200">
            <AlertTriangle size={14} className="shrink-0 text-amber-300" />
            <span>{validationMsg}</span>
          </div>
        )}

        {/* Accordion Ajustar Preço, Comissão e Categoria */}
        <div className="mt-5 border-t border-[var(--mvz-line)] pt-4">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1.5 text-[12px] font-semibold text-[var(--mvz-muted)] transition hover:text-white"
          >
            {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            Informar Preço de Venda, Comissão e Categoria (Opcional)
          </button>

          {showAdvanced && (
            <div className="mvz-msg-in mt-4 grid grid-cols-1 gap-4 rounded-2xl border border-[var(--mvz-line)] bg-white/[0.02] p-4 sm:grid-cols-3">
              <div>
                <label className="text-[11px] font-bold text-[var(--mvz-dim)]">Preço de Venda (Opcional):</label>
                <input
                  type="text"
                  value={estimatedPrice}
                  onChange={(e) => setEstimatedPrice(e.target.value)}
                  placeholder="Ex: R$ 79,90 (vazio = IA estima)"
                  className="mvz-input mt-1.5 h-10 w-full px-3 text-[13px]"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[var(--mvz-dim)]">Comissão de Afiliado:</label>
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
                  <option>Detectar Automaticamente</option>
                  <option>Moda Feminina</option>
                  <option>Moda Masculina</option>
                  <option>Fitness & Esporte</option>
                  <option>Beleza & Skincare</option>
                  <option>Cabelo & Maquiagem</option>
                  <option>Casa & Cozinha</option>
                  <option>Eletrônicos & Gadgets</option>
                  <option>Calçados & Bolsas</option>
                  <option>Pet Shop</option>
                  <option>Bebês & Maternidade</option>
                  <option>Automotivo & Ferramentas</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Card Footer */}
        <div className="mt-7 flex flex-col items-center justify-between gap-4 border-t border-[var(--mvz-line)] pt-5 sm:flex-row">
          <div className="flex items-center gap-2 text-[12px] text-white/80">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[rgba(212,175,55,0.15)] text-[var(--mvz-gold)]">
              <Check size={12} strokeWidth={3} />
            </span>
            <span>Avaliação crítica real (0–100) sem inflar notas de produtos fracos ou saturados</span>
          </div>

          <button
            onClick={() => runAnalysisWith()}
            disabled={loading}
            className="mvz-btn-grad flex h-12 w-full items-center justify-center gap-2.5 px-7 text-[12.5px] font-extrabold uppercase tracking-wider sm:w-auto"
          >
            <Zap size={15} fill="currentColor" />
            {loading ? 'Executando Varredura Forense...' : 'ANALISAR PRODUTO AGORA →'}
          </button>
        </div>
      </div>

      {/* ── Scanner Forense em Tempo Real (Mostrando o Alvo Exato) ── */}
      {loading && (
        <div className="mvz-msg-in mt-6 rounded-2xl border border-[var(--mvz-line-strong)] bg-[#0b0a08] p-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
            <div className="flex items-center gap-2.5">
              <Sparkles size={18} className="animate-spin text-[var(--mvz-gold)]" />
              <span className="text-[14px] font-extrabold text-white">
                Auditando: <span className="text-[#f4d77a]">{scanTargetLabel}</span>
              </span>
            </div>
            <span className="font-mono text-[11px] font-bold text-[var(--mvz-gold-light)]">
              Etapa {stepIndex + 1}/5
            </span>
          </div>

          <div className="mt-4 space-y-2.5">
            {scanSteps.map((stepText, i) => {
              const done = i < stepIndex;
              const current = i === stepIndex;
              return (
                <div
                  key={i}
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
                  <span className="truncate">{stepText}</span>
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

      {/* ── Official Analysis Report ── */}
      {result && (
        <div ref={reportRef} className="mvz-fade-up mt-8 space-y-6">
          <div className="rounded-3xl border border-[var(--mvz-line-strong)] bg-gradient-to-b from-[#12100b] to-[#0a0907] p-6 shadow-2xl sm:p-8">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--mvz-line)] pb-5">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Pill tone={result.score >= 80 ? 'green' : result.score >= 58 ? 'amber' : 'pink'}>
                    {result.score >= 85
                      ? 'Campeão de Escala'
                      : result.score >= 78
                      ? 'Produto Aprovado'
                      : result.score >= 58
                      ? 'Viável com Ressalvas'
                      : 'Alto Risco / Baixa Viabilidade'}
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
                    Categoria: <strong className="text-white">{result.categoryDetected}</strong>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <DollarSign size={13} className="text-[#7fcf9f]" />
                    Ticket Estimado: <strong className="text-white">{result.estimatedTicket}</strong>
                  </span>
                </div>
                <div className="mt-1 text-[12px] font-semibold text-[var(--mvz-gold-light)]">{result.status}</div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    onUseInAgent(
                      `O produto "${result.name}" (${result.categoryDetected}, ticket ${result.estimatedTicket}) recebeu score ${result.score}/100 no Analisador Forense da Orbiex. Diagnóstico: ${result.verdictSummary} Crie uma estratégia sob medida com 5 ganchos de 3s, estrutura de vídeo quebrando as objeções desse produto e plano de postagem para o TikTok Shop.`
                    )
                  }
                  className="mvz-btn-grad flex h-10 items-center gap-2 px-4 text-[12px]"
                >
                  <Bot size={14} />
                  Criar Estratégia no Agente Orbiex
                </button>
              </div>
            </div>

            {/* Score & Risk Summary Cards — 100% Dinâmicos por Produto! */}
            <div className="my-6 grid grid-cols-1 gap-5 md:grid-cols-4">
              {/* Ring Score */}
              <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--mvz-line)] bg-white/[0.02] p-5 text-center">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--mvz-dim)]">
                  Score Forense Orbiex
                </div>
                <div className="my-2">
                  <Ring
                    value={result.score}
                    size={110}
                    stroke={7}
                    color={result.score >= 78 ? '#7fcf9f' : result.score >= 58 ? '#f2c94c' : '#ef4444'}
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
                    color: result.score >= 78 ? '#7fcf9f' : result.score >= 58 ? '#f2c94c' : '#ef4444',
                  }}
                >
                  {result.score >= 86
                    ? 'Potencial de Escala Forte'
                    : result.score >= 78
                    ? 'Aprovado p/ Conversão'
                    : result.score >= 58
                    ? 'Exige Ajuste de Oferta/Vídeo'
                    : 'Reprovado / Alto Atrito'}
                </div>
              </div>

              {/* Ban Risk (Texto específico do produto!) */}
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
                  {result.banRiskDetail}
                </p>
              </div>

              {/* Demanda Viral & Retenção Visual (Específico do produto!) */}
              <div className="flex flex-col justify-center rounded-2xl border border-[var(--mvz-line)] bg-white/[0.02] p-5">
                <div className="flex items-center gap-2 text-[11.5px] font-bold uppercase tracking-wider text-[var(--mvz-gold)]">
                  <Flame size={16} /> Apelo Viral & Demonstração
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-[var(--mvz-gold-light)]">{result.demandIndex}%</span>
                  <span className="text-[11px] font-semibold text-white/60">
                    (Demo: {result.demonstrationEase}%)
                  </span>
                </div>
                <p className="mt-1.5 text-[11.5px] leading-relaxed text-[var(--mvz-muted)]">
                  {result.viralHookDetail}
                </p>
              </div>

              {/* Comissão em R$ & Risco Real de Devolução */}
              <div className="flex flex-col justify-center rounded-2xl border border-[var(--mvz-line)] bg-white/[0.02] p-5">
                <div className="flex items-center gap-2 text-[11.5px] font-bold uppercase tracking-wider text-[var(--mvz-gold)]">
                  <TrendingUp size={16} /> Ganho Líquido & Devolução
                </div>
                <div className="mt-2 text-[15px] font-black leading-snug text-white">
                  {result.estimatedMargin}
                </div>
                <p className="mt-1.5 text-[11.5px] leading-relaxed text-[var(--mvz-muted)]">
                  Devolução: <strong className="text-white">{result.returnRateRisk}</strong> — {result.returnRateReason}
                </p>
              </div>
            </div>

            {/* Veredito Geral */}
            <div className="rounded-2xl border border-[var(--mvz-line)] bg-[#070605] p-4 text-[12.5px] leading-relaxed text-white/90">
              <span className="font-bold text-[var(--mvz-gold)]">Parecer Forense Orbiex: </span>
              {result.verdictSummary}
            </div>

            {/* Público Comprador + Objeções Reais dos Comentários */}
            <div className="mt-6 rounded-2xl border border-[var(--mvz-line)] bg-white/[0.02] p-5">
              <div className="flex items-start gap-3 border-b border-white/10 pb-4">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--mvz-gold)]/15 text-[var(--mvz-gold)]">
                  <Users size={16} />
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--mvz-gold)]">
                    Perfil Exato de Quem Compra Este Produto no TikTok
                  </div>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-white/85">{result.targetPersona}</p>
                </div>
              </div>

              {result.buyerObjections.length > 0 && (
                <div className="mt-4">
                  <div className="mb-3 flex items-center gap-2 text-[12px] font-bold text-white">
                    <MessageSquareWarning size={15} className="text-amber-400" />
                    Maiores Objeções nos Comentários & Como Matar na Gravação:
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {result.buyerObjections.map((obj, i) => (
                      <div key={i} className="rounded-xl border border-white/10 bg-[#070605] p-3.5">
                        <div className="text-[11.5px] font-bold text-amber-200">{obj.objection}</div>
                        <p className="mt-1.5 text-[11.5px] leading-relaxed text-white/75">
                          <strong className="text-emerald-300">Prova na câmera:</strong> {obj.howToKillInVideo}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Guidelines Checklist */}
            <div className="mt-6 rounded-2xl border border-[var(--mvz-line)] bg-white/[0.02] p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-[13.5px] font-bold">Auditoria das 5 Diretrizes Aplicadas a “{result.name}”</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--mvz-dim)]">TikTok Shop 2026</span>
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
                  Cenas e Ângulos de Vídeo Específicos para “{result.name}” (9:16)
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
                    <CheckCircle2 size={15} /> Pontos Fortes Específicos
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
                    <AlertTriangle size={15} /> Riscos Reais & Cuidados na Gravação
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
                  Script Personalizado para Solicitar Amostra de “{result.name}”
                </div>
                <button
                  onClick={copySampleScript}
                  className="flex items-center gap-1.5 rounded-lg border border-[var(--mvz-line-strong)] bg-white/5 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-white/10"
                >
                  {copiedScript ? <Check size={12} className="text-[#7fcf9f]" /> : <Copy size={12} />}
                  {copiedScript ? 'Copiado!' : 'Copiar Script'}
                </button>
              </div>
              <p className="mt-3 whitespace-pre-line rounded-xl border border-[var(--mvz-line)] bg-[#070605] p-3.5 font-mono text-[12px] leading-relaxed text-white/90">
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
                    `Quero gravar 3 vídeos do produto "${result.name}" (${result.categoryDetected}). Crie 3 roteiros completos com Hook visual de 3 segundos, quebra de objeções reais desse produto e CTA para a sacola do TikTok Shop.`
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

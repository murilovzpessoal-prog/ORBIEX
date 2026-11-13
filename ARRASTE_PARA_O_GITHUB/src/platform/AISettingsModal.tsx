import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Sparkles,
  Key,
  Check,
  AlertCircle,
  ExternalLink,
  Cpu,
  Zap,
  Globe,
  Sliders,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';
import {
  getAIConfig,
  saveAIConfig,
  testAIConnection,
  DEFAULT_MODELS,
  type AIConfig,
  type AIProvider,
} from './aiService';

export function AISettingsModal({
  open,
  onClose,
  onConfigSaved,
}: {
  open: boolean;
  onClose: () => void;
  onConfigSaved?: (config: AIConfig) => void;
}) {
  const [config, setConfig] = useState<AIConfig>(getAIConfig);
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (open) {
      setConfig(getAIConfig());
      setTestResult(null);
      setSavedSuccess(false);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      const orig = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = orig;
      };
    }
  }, [open]);

  if (!open || typeof document === 'undefined') return null;

  const handleProviderChange = (p: AIProvider) => {
    const models = DEFAULT_MODELS[p];
    const defaultModel = models?.[0]?.id || '';
    setConfig((prev) => ({
      ...prev,
      provider: p,
      model: defaultModel,
    }));
    setTestResult(null);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testAIConnection(config);
      setTestResult(res);
    } catch (e: any) {
      setTestResult({ success: false, message: e.message || 'Erro ao conectar.' });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    saveAIConfig(config);
    setSavedSuccess(true);
    onConfigSaved?.(config);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
  };

  const providers: { id: AIProvider; label: string; badge: string; icon: any }[] = [
    { id: 'native', label: 'Orbiex Neural (Nativo)', badge: 'Grátis & Sem Chave', icon: Cpu },
    { id: 'gemini', label: 'Google Gemini', badge: 'Recomendado (Grátis)', icon: Sparkles },
    { id: 'openai', label: 'OpenAI (ChatGPT)', badge: 'GPT-4o', icon: Zap },
    { id: 'groq', label: 'Groq Cloud', badge: 'Ultrarrápido', icon: Zap },
    { id: 'deepseek', label: 'DeepSeek', badge: 'V3 / R1', icon: Cpu },
    { id: 'openrouter', label: 'OpenRouter', badge: 'Universal', icon: Globe },
  ];

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-md transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-[var(--mvz-line-strong)] bg-[#0d0d0f] shadow-[0_20px_70px_rgba(0,0,0,0.85)] animate-in fade-in zoom-in-95">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-[var(--mvz-line)] px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--mvz-gold)] to-[#8c6d1f] text-black shadow-[0_0_20px_rgba(212,175,55,0.35)]">
              <Cpu size={20} />
            </div>
            <div>
              <h3 className="text-[17px] font-black tracking-tight text-white">
                Inteligência do Agente Orbiex
              </h3>
              <p className="text-[12px] text-[var(--mvz-muted)]">
                Escolha o motor de processamento do agente de IA
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-8 w-8 items-center justify-center rounded-xl text-white/50 transition hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="max-h-[75vh] overflow-y-auto p-6 space-y-6 mvz-scroll">
          {/* 1. Escolha do Provedor */}
          <div>
            <label className="mb-2.5 block text-[11px] font-extrabold uppercase tracking-wider text-[var(--mvz-dim)]">
              Motor de IA Selecionado
            </label>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {providers.map((p) => {
                const Icon = p.icon;
                const isSelected = config.provider === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleProviderChange(p.id)}
                    className={`flex items-start gap-3 rounded-xl border p-3 text-left transition ${
                      isSelected
                        ? 'border-[var(--mvz-gold)] bg-[rgba(212,175,55,0.08)] shadow-[0_0_15px_rgba(212,175,55,0.15)]'
                        : 'border-[var(--mvz-line)] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        isSelected ? 'bg-[var(--mvz-gold)] text-black' : 'bg-white/5 text-white/70'
                      }`}
                    >
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[13px] font-bold text-white truncate">{p.label}</span>
                        {isSelected && <Check size={14} className="text-[var(--mvz-gold)] shrink-0" />}
                      </div>
                      <span className="mt-0.5 inline-block text-[10.5px] font-medium text-[var(--mvz-dim)]">
                        {p.badge}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Campo de Chave de API (se não for nativo) */}
          {config.provider !== 'native' && (
            <div className="rounded-xl border border-[var(--mvz-line)] bg-white/[0.015] p-4 space-y-3.5">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-[11.5px] font-bold text-white">
                  <Key size={13} className="text-[var(--mvz-gold)]" />
                  Chave de API ({config.provider.toUpperCase()})
                </label>
                {config.provider === 'gemini' && (
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[11px] font-semibold text-[var(--mvz-gold)] hover:underline"
                  >
                    Obter Chave Grátis no Google AI Studio
                    <ExternalLink size={11} />
                  </a>
                )}
                {config.provider === 'groq' && (
                  <a
                    href="https://console.groq.com/keys"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[11px] font-semibold text-[var(--mvz-gold)] hover:underline"
                  >
                    Obter Chave no Groq Cloud
                    <ExternalLink size={11} />
                  </a>
                )}
                {config.provider === 'openai' && (
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[11px] font-semibold text-[var(--mvz-gold)] hover:underline"
                  >
                    Abrir OpenAI Keys
                    <ExternalLink size={11} />
                  </a>
                )}
              </div>

              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={config.apiKey}
                  onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                  placeholder={
                    config.provider === 'gemini'
                      ? 'Ex: AIzaSy...'
                      : config.provider === 'openai'
                      ? 'Ex: sk-proj-...'
                      : 'Cole sua chave de API aqui'
                  }
                  className="w-full rounded-xl border border-[var(--mvz-line-strong)] bg-black/60 px-3.5 py-2.5 pr-10 text-[13px] text-white outline-none focus:border-[var(--mvz-gold)] placeholder:text-white/30"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                >
                  {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              <p className="text-[11px] leading-relaxed text-[var(--mvz-dim)]">
                Sua chave fica gravada com segurança apenas no seu navegador local (<code className="text-white/60">localStorage</code>) e nunca é compartilhada.
              </p>
            </div>
          )}

          {/* 3. Seleção do Modelo */}
          <div>
            <label className="mb-2 block text-[11px] font-extrabold uppercase tracking-wider text-[var(--mvz-dim)]">
              Modelo de Linguagem
            </label>
            <div className="space-y-2">
              {DEFAULT_MODELS[config.provider]?.map((m) => (
                <label
                  key={m.id}
                  className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition ${
                    config.model === m.id
                      ? 'border-[var(--mvz-gold)]/60 bg-[rgba(212,175,55,0.06)]'
                      : 'border-[var(--mvz-line)] bg-white/[0.015] hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="aiModel"
                      checked={config.model === m.id}
                      onChange={() => setConfig({ ...config, model: m.id })}
                      className="accent-[var(--mvz-gold)]"
                    />
                    <div>
                      <div className="text-[13px] font-bold text-white">{m.name}</div>
                      <div className="text-[11px] text-[var(--mvz-dim)]">{m.desc}</div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* 4. Criatividade (Temperature) */}
          <div className="rounded-xl border border-[var(--mvz-line)] bg-white/[0.015] p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-1.5 text-[11.5px] font-bold text-white">
                <Sliders size={13} className="text-[var(--mvz-gold)]" />
                Criatividade & Raciocínio (Temperature)
              </label>
              <span className="text-[11px] font-mono font-bold text-[var(--mvz-gold-light)]">
                {config.temperature}
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={config.temperature}
              onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
              className="w-full accent-[var(--mvz-gold)]"
            />
            <div className="flex justify-between text-[10px] text-[var(--mvz-dim)] mt-1">
              <span>Mais Preciso & Analítico (0.1)</span>
              <span>Mais Criativo & Roteirista (1.0)</span>
            </div>
          </div>

          {/* Resultado do Teste de Conexão */}
          {testResult && (
            <div
              className={`flex items-start gap-2.5 rounded-xl border p-3 text-[12px] animate-in fade-in ${
                testResult.success
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                  : 'border-red-500/30 bg-red-500/10 text-red-300'
              }`}
            >
              {testResult.success ? (
                <Check size={16} className="shrink-0 text-emerald-400 mt-0.5" />
              ) : (
                <AlertCircle size={16} className="shrink-0 text-red-400 mt-0.5" />
              )}
              <span className="leading-snug">{testResult.message}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-[var(--mvz-line)] bg-black/40 px-6 py-4">
          <button
            type="button"
            onClick={handleTest}
            disabled={testing}
            className="flex items-center gap-2 rounded-xl border border-[var(--mvz-line-strong)] px-4 py-2.5 text-[12px] font-bold text-white/80 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            {testing ? (
              <>
                <Loader2 size={13} className="animate-spin text-[var(--mvz-gold)]" />
                Testando...
              </>
            ) : (
              <>
                <Cpu size={13} className="text-[var(--mvz-gold)]" />
                Testar Conexão
              </>
            )}
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-[12px] font-semibold text-white/60 transition hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="mvz-btn-grad flex items-center gap-2 px-5 py-2.5 text-[12px] font-black"
            >
              {savedSuccess ? (
                <>
                  <Check size={14} /> Salvo com Sucesso!
                </>
              ) : (
                <>Salvar Configuração</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

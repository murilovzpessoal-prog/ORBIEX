import { useState, useEffect } from 'react';
import {
  Mic,
  ExternalLink,
  ShieldCheck,
  Check,
  Sparkles,
  Download,
  Puzzle,
  Copy,
  X,
  MousePointerClick,
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useCopilotInfo } from './copilotBridge';
import { copyText } from './clipboard';
import { downloadCopilotExtensionZip } from './extensionBundle';

const OPEN_COPILOT_EVENT = 'orbiex:open_copilot_modal';
const CHROME_STORE_URL = (import.meta.env.VITE_CHROME_WEBSTORE_URL as string | undefined) || '';

export function openCopilotInstallModal() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(OPEN_COPILOT_EVENT));
  }
}

function getUserEmail(): string {
  try {
    return (
      localStorage.getItem('orbiex_user_email') ||
      localStorage.getItem('orbix_user_email') ||
      localStorage.getItem('orbiex_last_account') ||
      'guest'
    )
      .trim()
      .toLowerCase();
  } catch {
    return 'guest';
  }
}

export function getPermissionsKey(email?: string): string {
  return `orbiex_voice_terms_v1_${(email || getUserEmail()).trim().toLowerCase()}`;
}

export function hasAcceptedVoiceTerms(): boolean {
  try {
    return localStorage.getItem(getPermissionsKey()) === 'accepted';
  } catch {
    return false;
  }
}

export function PermissionsOnboardingModal() {
  const copilotInfo = useCopilotInfo();
  const copilotConnected = copilotInfo.installed;
  const needsV2Upgrade = copilotInfo.installed && !copilotInfo.isLatest;

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'terms' | 'extension'>('terms');
  const [agreed, setAgreed] = useState(true);
  const [activating, setActivating] = useState(false);
  const [downloadedZip, setDownloadedZip] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  useEffect(() => {
    const onManualOpen = () => {
      setStep('extension');
      setOpen(true);
    };
    window.addEventListener(OPEN_COPILOT_EVENT, onManualOpen);
    return () => window.removeEventListener(OPEN_COPILOT_EVENT, onManualOpen);
  }, []);

  useEffect(() => {
    const email = getUserEmail();
    if (hasAcceptedVoiceTerms()) return;

    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (data?.user?.user_metadata?.orbiex_voice_terms_v1 === true) {
          localStorage.setItem(getPermissionsKey(email), 'accepted');
          return;
        }
      } catch {
        /* ignore */
      }
      if (!cancelled && !hasAcceptedVoiceTerms()) {
        setStep('terms');
        setOpen(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const saveTermsAccepted = () => {
    const email = getUserEmail();
    try {
      localStorage.setItem(getPermissionsKey(email), 'accepted');
    } catch {
      /* ignore */
    }
    try {
      supabase.auth.updateUser({ data: { orbiex_voice_terms_v1: true } }).catch(() => {});
    } catch {
      /* ignore */
    }
  };

  const handleAcceptTerms = async () => {
    if (!agreed || activating) return;
    setActivating(true);

    // 1. Dispara verificação de abertura de nova aba no mesmo clique do usuário
    try {
      const testWin = window.open('about:blank', '_blank');
      if (testWin) testWin.close();
    } catch {
      /* ignore */
    }

    // 2. Libera permissão de microfone no navegador
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
      }
    } catch {
      /* ignore */
    }

    saveTermsAccepted();
    setActivating(false);

    // Se já estiver com a extensão instalada (ou estiver no celular), finaliza direto; senão mostra o botão da extensão!
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');
    if (copilotConnected || isMobile) {
      setOpen(false);
    } else {
      setStep('extension');
    }
  };

  const handleDownloadExtension = () => {
    if (CHROME_STORE_URL) {
      window.open(CHROME_STORE_URL, '_blank', 'noopener,noreferrer');
      return;
    }
    downloadCopilotExtensionZip();
    setDownloadedZip(true);
  };

  const handleCopyExtensionsUrl = async () => {
    await copyText('chrome://extensions');
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/85 p-4 backdrop-blur-xl mvz-fade-up">
      <div className="relative w-full max-w-lg overflow-hidden rounded-[28px] border border-[var(--mvz-gold)]/35 bg-gradient-to-b from-[#12100b] via-[#0b0a08] to-[#060605] p-6 sm:p-8 shadow-[0_30px_90px_rgba(0,0,0,0.95)]">
        <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[var(--mvz-gold)]/15 blur-[80px]" />

        {step === 'extension' && (
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Fechar"
            className="absolute right-5 top-5 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition hover:bg-white/15 hover:text-white"
          >
            <X size={15} />
          </button>
        )}

        {step === 'terms' ? (
          <>
            {/* PASSO 1: TERMOS DE INTERATIVIDADE */}
            <div className="relative z-10 flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--mvz-gold)]/40 bg-[var(--mvz-gold)]/15 text-[var(--mvz-gold)] shadow-[0_0_20px_rgba(212,175,55,0.25)]">
                <Sparkles size={20} />
              </div>
              <div>
                <span className="text-[10.5px] font-extrabold uppercase tracking-[0.22em] text-[var(--mvz-gold)]">
                  Passo 1 de 2 • Configuração Inicial
                </span>
                <h2 className="text-[20px] sm:text-[22px] font-black tracking-tight text-white leading-tight">
                  Permissões do Agente Orbiex
                </h2>
              </div>
            </div>

            <p className="relative z-10 mt-4 text-[13px] leading-relaxed text-white/75">
              Para conversar por voz em tempo real com o <strong className="text-white">Agente Orbiex</strong> e permitir que ele abra e interaja com ferramentas no seu navegador (<strong className="text-[var(--mvz-gold-light)]">Google Flow, TikTok, Kling AI, Seller Center</strong>), aceite os termos abaixo:
            </p>

            <div className="relative z-10 mt-5 space-y-3">
              <div className="flex items-start gap-3.5 rounded-2xl border border-white/10 bg-black/50 p-3.5">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--mvz-gold)]/15 text-[var(--mvz-gold)]">
                  <Mic size={16} />
                </div>
                <div>
                  <h4 className="text-[13px] font-bold text-white">1. Diálogo por Voz em Tempo Real</h4>
                  <p className="mt-0.5 text-[11.5px] leading-relaxed text-white/60">
                    Libera seu microfone para falar naturalmente com o Agente Orbiex sem precisar digitar.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 rounded-2xl border border-white/10 bg-black/50 p-3.5">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--mvz-gold)]/15 text-[var(--mvz-gold)]">
                  <MousePointerClick size={16} />
                </div>
                <div>
                  <h4 className="text-[13px] font-bold text-white">2. Abertura & Controle de Interface</h4>
                  <p className="mt-0.5 text-[11.5px] leading-relaxed text-white/60">
                    Autoriza abrir sites automaticamente e clicar em botões internos (como “Novo Projeto” no Flow) através da Extensão Orbiex Copilot.
                  </p>
                </div>
              </div>
            </div>

            <label className="relative z-10 mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3.5 transition hover:border-[var(--mvz-gold)]/40">
              <button
                type="button"
                onClick={() => setAgreed((v) => !v)}
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                  agreed
                    ? 'border-[var(--mvz-gold)] bg-[var(--mvz-gold)] text-black'
                    : 'border-white/25 bg-black/60 text-transparent'
                }`}
              >
                <Check size={13} strokeWidth={3} />
              </button>
              <span className="text-[12px] leading-relaxed text-white/80 select-none">
                Li e concordo com os Termos de Interatividade da Orbiex e autorizo os comandos de voz e controle de navegação.
              </span>
            </label>

            <div className="relative z-10 mt-6">
              <button
                type="button"
                disabled={!agreed || activating}
                onClick={handleAcceptTerms}
                className="mvz-btn-grad flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[13px] font-black uppercase tracking-wider disabled:opacity-40"
              >
                <ShieldCheck size={17} />
                <span>{activating ? 'Ativando Permissões...' : 'Concordar e Continuar'}</span>
              </button>
            </div>
          </>
        ) : (
          <>
            {/* PASSO 2: ATIVAÇÃO DA EXTENSÃO ORBIEX COPILOT (100% GRÁTIS) */}
            <div className="relative z-10 flex items-center gap-3 pr-8">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--mvz-gold)]/40 bg-[var(--mvz-gold)]/15 text-[var(--mvz-gold)] shadow-[0_0_20px_rgba(212,175,55,0.25)]">
                <Puzzle size={20} />
              </div>
              <div>
                <span className="text-[10.5px] font-extrabold uppercase tracking-[0.22em] text-[var(--mvz-gold)]">
                  100% Gratuito • Controle de Tela
                </span>
                <h2 className="text-[20px] sm:text-[22px] font-black tracking-tight text-white leading-tight">
                  Extensão Orbiex Copilot
                </h2>
              </div>
            </div>

            {copilotInfo.isLatest ? (
              <div className="relative z-10 mt-6 space-y-5">
                <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/12 p-5 text-center space-y-2">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                    <Check size={24} strokeWidth={2.8} />
                  </div>
                  <h3 className="text-[16px] font-black text-emerald-300">
                    Copilot v2.0 (Visão IA) Conectado!
                  </h3>
                  <p className="text-[12.5px] leading-relaxed text-white/75">
                    Tudo pronto! Agora o Agente enxerga cantos, ícones e chats na tela. Peça por voz: <strong className="text-white">“Abre o Google Flow”</strong>, <strong className="text-white">“Clica em Criar novo projeto”</strong> ou <strong className="text-white">“No canto inferior direito, onde tem o chat, escreve oi”</strong>.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="mvz-btn-grad flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[13px] font-black uppercase tracking-wider"
                >
                  <Check size={17} />
                  <span>Começar a Usar Agora</span>
                </button>
              </div>
            ) : (
              <div className="relative z-10 mt-4 space-y-4">
                <p className="text-[12.5px] leading-relaxed text-white/75">
                  {needsV2Upgrade ? (
                    <>
                      <strong className="text-amber-300">Nova atualização gratuita disponível (v2.0 — Visão IA)!</strong>{' '}
                      Agora o Agente tira leitura espacial em tempo real da tela para identificar exatamente <strong className="text-white">cantos, ícones e caixas de chat</strong> (como no canto inferior direito do Flow):
                    </>
                  ) : (
                    <>
                      Ative a extensão oficial gratuita <strong className="text-white">v2.0 (com Visão IA)</strong> no seu navegador para o Agente Orbiex conseguir <strong className="text-white">abrir abas sem bloqueio, enxergar posições da tela e clicar/digitar sozinho</strong> no Google Flow, Kling AI e TikTok:
                    </>
                  )}
                </p>

                {/* Botão Principal de Download / Loja */}
                <button
                  type="button"
                  onClick={handleDownloadExtension}
                  className="mvz-btn-grad flex h-12 w-full items-center justify-center gap-2.5 rounded-xl text-[13px] font-black uppercase tracking-wider shadow-[0_0_25px_rgba(212,175,55,0.3)]"
                >
                  {CHROME_STORE_URL ? <ExternalLink size={17} /> : <Download size={17} />}
                  <span>
                    {CHROME_STORE_URL
                      ? 'Adicionar Extensão no Chrome (Grátis)'
                      : downloadedZip
                      ? 'Pacote v2.0 Baixado! (Baixar Novamente)'
                      : needsV2Upgrade
                      ? '1. Baixar Atualização Copilot v2.0 (Visão IA)'
                      : '1. Baixar Extensão Orbiex Copilot v2.0 (Grátis)'}
                  </span>
                </button>

                {!CHROME_STORE_URL && (
                  <div className="rounded-2xl border border-white/10 bg-black/55 p-4 space-y-2.5 text-[12px] text-white/80">
                    <div className="text-[10.5px] font-extrabold uppercase tracking-wider text-[var(--mvz-gold-light)]">
                      {needsV2Upgrade
                        ? 'Como atualizar da v1.0 para a v2.0 em 10 segundos:'
                        : 'Ativação rápida em 15 segundos (Sem precisar descompactar!):'}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span>
                        <strong className="text-white">1.</strong> Abra o painel de extensões do Chrome:
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyExtensionsUrl}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--mvz-gold)]/40 bg-[var(--mvz-gold)]/10 px-2.5 py-1 font-mono text-[11px] font-bold text-[#f4d77a] hover:bg-[var(--mvz-gold)]/20 transition"
                      >
                        {copiedUrl ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        <span>{copiedUrl ? 'Copiado! Cole na barra do Chrome' : 'Copiar chrome://extensions'}</span>
                      </button>
                    </div>
                    {needsV2Upgrade ? (
                      <>
                        <p>
                          <strong className="text-white">2.</strong> Clique em <strong className="text-rose-300">“Remover”</strong> no card antigo <code className="text-white">1.0.0</code>.
                        </p>
                        <p>
                          <strong className="text-white">3.</strong> Arraste o novo arquivo <strong className="text-[#f4d77a]"><code className="rounded bg-white/10 px-1 py-0.5 text-[11px]">Orbiex-Copilot.zip</code></strong> que acabou de baixar para o meio da página <code className="text-white">chrome://extensions</code> (vai aparecer <strong className="text-emerald-300">2.0.0</strong>) e atualize esta aba da Orbiex!
                        </p>
                      </>
                    ) : (
                      <>
                        <p>
                          <strong className="text-white">2.</strong> Ative a chave <strong className="text-white">“Modo do desenvolvedor”</strong> lá no canto superior direito.
                        </p>
                        <p>
                          <strong className="text-white">3.</strong> Simplesmente <strong className="text-[#f4d77a]">arraste o arquivo <code className="rounded bg-white/10 px-1 py-0.5 text-[11px]">Orbiex-Copilot.zip</code></strong> que baixou e solte no meio da página <code className="text-white">chrome://extensions</code>!
                        </p>
                      </>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <span className="inline-flex items-center gap-2 text-[11px] text-white/45">
                    <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                    {needsV2Upgrade ? 'Aguardando atualização v2.0...' : 'Aguardando ativação automática...'}
                  </span>

                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="text-[11.5px] font-semibold text-white/50 hover:text-white transition"
                  >
                    {needsV2Upgrade ? 'Fechar' : 'Ativar depois'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

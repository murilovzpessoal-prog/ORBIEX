import { useState, useEffect } from 'react';
import { Mic, ExternalLink, ShieldCheck, Check, Sparkles, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

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
  const [open, setOpen] = useState(false);
  const [agreed, setAgreed] = useState(true);
  const [activating, setActivating] = useState(false);
  const [micStatus, setMicStatus] = useState<'idle' | 'granted' | 'denied'>('idle');
  const [popupBlockedNotice, setPopupBlockedNotice] = useState(false);

  useEffect(() => {
    const email = getUserEmail();
    if (hasAcceptedVoiceTerms()) return;

    // Verifica se já aceitou anteriormente em outro dispositivo via Supabase Auth metadata
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
        setOpen(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const finishAcceptance = () => {
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
    setOpen(false);
  };

  const handleActivate = async () => {
    if (!agreed || activating) return;
    setActivating(true);

    // 1. Testa abertura automática de aba no mesmo gesto de clique do usuário
    let popupAllowed = true;
    try {
      const testWin = window.open('about:blank', '_blank');
      if (testWin) {
        testWin.close();
      } else {
        popupAllowed = false;
      }
    } catch {
      popupAllowed = false;
    }

    // 2. Solicita permissão real do microfone no navegador
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
        setMicStatus('granted');
      }
    } catch {
      setMicStatus('denied');
    }

    setActivating(false);

    if (!popupAllowed) {
      // Mostra aviso rápido de 1 clique ensinando a marcar "Sempre permitir" caso o navegador tenha bloqueado pop-up
      setPopupBlockedNotice(true);
      return;
    }

    finishAcceptance();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/85 p-4 backdrop-blur-xl mvz-fade-up">
      <div className="relative w-full max-w-lg overflow-hidden rounded-[28px] border border-[var(--mvz-gold)]/35 bg-gradient-to-b from-[#12100b] via-[#0b0a08] to-[#060605] p-6 sm:p-8 shadow-[0_30px_90px_rgba(0,0,0,0.95)]">
        <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[var(--mvz-gold)]/15 blur-[80px]" />

        {/* Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--mvz-gold)]/40 bg-[var(--mvz-gold)]/15 text-[var(--mvz-gold)] shadow-[0_0_20px_rgba(212,175,55,0.25)]">
            <Sparkles size={20} />
          </div>
          <div>
            <span className="text-[10.5px] font-extrabold uppercase tracking-[0.22em] text-[var(--mvz-gold)]">
              Configuração Inicial • Orbiex AI
            </span>
            <h2 className="text-[20px] sm:text-[22px] font-black tracking-tight text-white leading-tight">
              Permissões do Agente Interativo
            </h2>
          </div>
        </div>

        {!popupBlockedNotice ? (
          <>
            <p className="relative z-10 mt-4 text-[13px] leading-relaxed text-white/75">
              Para conversar por voz com o <strong className="text-white">Agente Orbiex</strong> e pedir para ele abrir ferramentas automaticamente no seu computador (como <strong className="text-[var(--mvz-gold-light)]">Google Flow, TikTok, Kling AI, Seller Center</strong> e abas da plataforma), confirme as permissões abaixo:
            </p>

            {/* Itens de Permissão */}
            <div className="relative z-10 mt-5 space-y-3">
              <div className="flex items-start gap-3.5 rounded-2xl border border-white/10 bg-black/50 p-3.5">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--mvz-gold)]/15 text-[var(--mvz-gold)]">
                  <Mic size={16} />
                </div>
                <div>
                  <h4 className="text-[13px] font-bold text-white">1. Acesso ao Microfone (Voz em Tempo Real)</h4>
                  <p className="mt-0.5 text-[11.5px] leading-relaxed text-white/60">
                    Permite conversar em voz alta com o Agente Orbiex e interrompê-lo naturalmente a qualquer momento.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 rounded-2xl border border-white/10 bg-black/50 p-3.5">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--mvz-gold)]/15 text-[var(--mvz-gold)]">
                  <ExternalLink size={16} />
                </div>
                <div>
                  <h4 className="text-[13px] font-bold text-white">2. Abertura Automática de Sites & Ferramentas</h4>
                  <p className="mt-0.5 text-[11.5px] leading-relaxed text-white/60">
                    Autoriza o Agente a abrir novas abas e redirecionar você imediatamente quando pedir por voz (ex: “Agente, abre o Flow para mim” ou “Abre o TikTok”).
                  </p>
                </div>
              </div>
            </div>

            {/* Termo de Concordância */}
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
                Li e concordo com os Termos de Interatividade da Orbiex e autorizo a execução de comandos por voz e abertura automática de ferramentas no meu navegador.
              </span>
            </label>

            {/* Botões */}
            <div className="relative z-10 mt-6 flex flex-col gap-2.5 sm:flex-row">
              <button
                type="button"
                disabled={!agreed || activating}
                onClick={handleActivate}
                className="mvz-btn-grad flex h-12 flex-1 items-center justify-center gap-2 rounded-xl text-[13px] font-black uppercase tracking-wider disabled:opacity-40"
              >
                <ShieldCheck size={17} />
                <span>{activating ? 'Liberando Permissões...' : 'Concordar e Ativar Comandos'}</span>
              </button>
            </div>
          </>
        ) : (
          /* Passo extra caso o navegador tenha bloqueado pop-ups no primeiro clique */
          <div className="relative z-10 mt-5 space-y-4">
            <div className="rounded-2xl border border-amber-500/35 bg-amber-500/10 p-4 space-y-2">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-[13px]">
                <AlertCircle size={16} />
                <span>Último detalhe no navegador (Pop-ups)</span>
              </div>
              <p className="text-[12px] leading-relaxed text-white/80">
                {micStatus === 'granted' && 'Microfone liberado com sucesso! '}
                Para que o Agente abra o <strong>Flow</strong>, o <strong>TikTok</strong> e outras ferramentas sozinho sem bloquear a nova aba, clique no ícone de <strong>janela bloqueada no canto direito da barra de endereço lá em cima</strong> e marque <strong>“Sempre permitir pop-ups e redirecionamentos de orbiex.io”</strong>.
              </p>
            </div>

            <button
              type="button"
              onClick={finishAcceptance}
              className="mvz-btn-grad flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[13px] font-black uppercase tracking-wider"
            >
              <Check size={17} />
              <span>Tudo Certo, Entrar na Orbiex</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

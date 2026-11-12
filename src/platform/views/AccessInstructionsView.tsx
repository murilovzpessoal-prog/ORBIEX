import { useState } from 'react';
import { ArrowRight, CheckCircle2, ShieldCheck, Key, Mail, Sparkles, Copy, Check, ExternalLink } from 'lucide-react';

interface AccessInstructionsViewProps {
  onGoToLogin: () => void;
}

export function AccessInstructionsView({ onGoToLogin }: AccessInstructionsViewProps) {
  const [copied, setCopied] = useState(false);
  const masterPassword = 'orbiex2026k';

  const handleCopyPassword = () => {
    try {
      navigator.clipboard.writeText(masterPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  };

  return (
    <div className="relative min-h-screen w-full bg-[#050505] text-white selection:bg-[#d4af37]/30 selection:text-white">
      {/* Background glow effects */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[600px] rounded-full bg-gradient-to-b from-[#d4af37]/15 via-[#8c6d1f]/10 to-transparent blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-[#d4af37]/5 blur-[140px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-2xl flex-col justify-between px-5 py-8 sm:px-8 sm:py-12">
        {/* Header / Brand */}
        <header className="flex items-center justify-between border-b border-white/10 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#d4af37] to-[#8c6d1f] shadow-[0_0_25px_rgba(212,175,55,0.4)]">
              <span className="text-[16px] font-black text-black">O</span>
            </div>
            <div>
              <div className="text-[16px] font-black uppercase tracking-wider text-white">Orbiex</div>
              <div className="text-[10px] font-medium tracking-widest uppercase text-[#8c6d1f]">AI Platform</div>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-400">
            <CheckCircle2 size={13} />
            <span>Compra Aprovada</span>
          </div>
        </header>

        {/* Main Content Card */}
        <main className="my-8 rounded-3xl border border-white/10 bg-[#0c0c0e]/90 p-6 sm:p-10 shadow-[0_12px_40px_rgba(0,0,0,0.8)] backdrop-blur-xl">
          {/* Welcome Tag */}
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--mvz-gold,#d4af37)]/40 bg-[var(--mvz-gold,#d4af37)]/10 px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-widest text-[#f5df93]">
            <Sparkles size={12} className="text-[#d4af37]" />
            <span>Acesso Liberado Oficial</span>
          </div>

          <h1 className="text-[26px] font-black leading-tight tracking-tight text-white sm:text-[34px]">
            Seja bem-vindo à <span className="bg-gradient-to-r from-[#fffdf0] via-[#d4af37] to-[#a37418] bg-clip-text text-transparent">Orbiex AI</span>
          </h1>
          <p className="mt-2.5 text-[14px] leading-relaxed text-[#9a9aa3]">
            O seu pagamento foi confirmado na Cakto com sucesso. Siga as orientações abaixo para acessar o seu painel agora mesmo:
          </p>

          {/* Steps */}
          <div className="mt-8 space-y-4">
            {/* Step 1 */}
            <div className="flex items-start gap-4 rounded-2xl border border-white/5 bg-[#141418] p-4 transition-colors hover:border-white/10">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[13px] font-black text-white">
                1
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-[14px] font-bold text-white">
                  <Mail size={15} className="text-[#d4af37]" />
                  <span>Informe seu E-mail de Compra</span>
                </div>
                <p className="mt-1 text-[12.5px] leading-relaxed text-[#8a8a93]">
                  Ao abrir o painel, digite o mesmo e-mail que você utilizou no checkout da Cakto.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-4 rounded-2xl border border-white/5 bg-[#141418] p-4 transition-colors hover:border-white/10">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[13px] font-black text-white">
                2
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-[14px] font-bold text-white">
                  <Key size={15} className="text-[#d4af37]" />
                  <span>Crie sua Senha Pessoal</span>
                </div>
                <p className="mt-1 text-[12.5px] leading-relaxed text-[#8a8a93]">
                  No campo de senha, você pode definir qualquer senha da sua preferência para seus próximos acessos.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-4 rounded-2xl border border-white/5 bg-[#141418] p-4 transition-colors hover:border-white/10">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[13px] font-black text-white">
                3
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-[14px] font-bold text-white">
                  <ExternalLink size={15} className="text-[#d4af37]" />
                  <span>Entrar na Plataforma</span>
                </div>
                <p className="mt-1 text-[12.5px] leading-relaxed text-[#8a8a93]">
                  Clique em "Entrar na Plataforma" para liberar imediatamente todas as ferramentas de IA e produtos validados.
                </p>
              </div>
            </div>
          </div>

          {/* Contingency / Master Password Notice Box */}
          <div className="mt-6 rounded-2xl border border-[#d4af37]/30 bg-gradient-to-r from-[#d4af37]/10 via-[#d4af37]/5 to-transparent p-5">
            <div className="flex items-center gap-2 text-[12.5px] font-black uppercase tracking-wider text-[#f5df93]">
              <ShieldCheck size={16} className="text-[#d4af37]" />
              <span>Instrução de Segurança / Contingência</span>
            </div>
            <p className="mt-2 text-[12.5px] leading-relaxed text-[#d0d0d8]">
              Se por qualquer motivo você não conseguir criar sua senha de imediato ou tiver qualquer instabilidade, entre digitando o seu e-mail de compra e a nossa <strong>senha padrão oficial</strong>:
            </p>

            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-white/15 bg-black/60 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <Key size={15} className="text-[#d4af37]" />
                <span className="font-mono text-[14px] font-bold tracking-wider text-white">
                  {masterPassword}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyPassword}
                className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-white/20 active:scale-95"
              >
                {copied ? (
                  <>
                    <Check size={13} className="text-emerald-400" />
                    <span className="text-emerald-400">Copiada</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    <span>Copiar Senha</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Big Action Button */}
          <div className="mt-8">
            <button
              type="button"
              onClick={onGoToLogin}
              className="group flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#fffdf0] via-[#d4af37] to-[#a37418] text-[13.5px] font-black uppercase tracking-widest text-black shadow-[0_6px_30px_rgba(212,175,55,0.35)] transition-all hover:brightness-110 active:scale-[0.99]"
            >
              <span>Acessar a Plataforma Agora</span>
              <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </main>

        {/* Footer */}
        <footer className="text-center text-[12px] text-[#60606a]">
          <p>Orbiex AI • Todos os direitos reservados.</p>
        </footer>
      </div>
    </div>
  );
}

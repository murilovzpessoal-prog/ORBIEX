import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, ShieldCheck, Eye, EyeOff, Loader2, Sparkles } from 'lucide-react';

interface LoginViewProps {
  onLogin: (email: string) => void;
  topLeftImage?: string | null;
}

export function LoginView({ onLogin, topLeftImage }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Por favor, informe seu e-mail de compra.');
      return;
    }
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Informe um formato de e-mail válido.');
      return;
    }
    if (password.length < 4) {
      setError('A senha deve conter no mínimo 6 dígitos.');
      return;
    }

    setLoading(true);

    // Efeito suave de autenticação
    setTimeout(() => {
      setLoading(false);
      try {
        localStorage.setItem('orbiex_auth', 'true');
        localStorage.setItem('orbix_auth', 'true');
        localStorage.setItem('orbiex_user_email', cleanEmail);
        localStorage.setItem('orbix_user_email', cleanEmail);
      } catch {}
      onLogin(cleanEmail);
    }, 700);
  };

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-[#000000] text-white select-none">
      {/* ────────────────────────────────────────────────────────────
          BACKGROUND PARA DISPOSITIVOS MÓVEIS (< MD)
      ──────────────────────────────────────────────────────────── */}
      <div className="md:hidden absolute inset-0 -z-10 overflow-hidden bg-black pointer-events-none">
        <img
          src="/assets/login-orbix-man.jpg"
          alt="Orbiex Office"
          className="h-full w-full object-cover object-center opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/85 to-black/60" />
      </div>

      {/* ────────────────────────────────────────────────────────────
          COLUNA ESQUERDA: FOTO EXCLUSIVA DO ESCRITÓRIO ORBIEX + FUSÃO SUAVE
      ──────────────────────────────────────────────────────────── */}
      <div className="relative hidden h-full w-full md:block md:w-1/2 lg:w-[55%] overflow-hidden bg-black">
        {/* Slot da Imagem / Logo no Canto Superior Esquerdo */}
        <div className="absolute left-8 top-8 z-30 flex items-center gap-3">
          {topLeftImage ? (
            <img
              src={topLeftImage}
              alt="Logo"
              className="h-10 w-auto max-w-[180px] object-contain drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]"
            />
          ) : (
            <div className="flex items-center gap-2.5 rounded-2xl bg-black/60 px-3.5 py-2 border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.6)] backdrop-blur-md">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--mvz-gold)] to-[#8c6d1f] shadow-[0_0_15px_rgba(212,175,55,0.4)]">
                <span className="text-[12px] font-black text-black">O</span>
              </div>
              <span className="text-[13px] font-black uppercase tracking-wider text-white">Orbiex</span>
            </div>
          )}
        </div>

        {/* Foto do Ambiente Orbiex (Visão da Cidade, Camisa e Escritório Orbiex) */}
        <img
          src="/assets/login-orbix-man.jpg"
          alt="Orbiex Executive Office"
          className="h-full w-full object-cover object-[center_35%] select-none pointer-events-none"
        />

        {/* Gradientes de Fusão Limpa e Invisível com o Fundo Preto */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-72 bg-gradient-to-r from-transparent via-black/60 to-black" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black via-black/50 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/60 to-transparent" />
      </div>

      {/* ────────────────────────────────────────────────────────────
          COLUNA DIREITA: FORMULÁRIO DE LOGIN (PRETO PURO PROFISSIONAL)
      ──────────────────────────────────────────────────────────── */}
      <div className="relative flex h-full w-full items-center justify-center bg-black px-6 sm:px-12 md:w-1/2 lg:w-[45%] lg:px-16">
        <div className="relative z-10 w-full max-w-[390px]">
          {/* Cabeçalho */}
          <div className="mb-8">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--mvz-gold)]/40 bg-[var(--mvz-gold)]/10 px-3.5 py-1 text-[10.5px] font-extrabold uppercase tracking-[0.2em] text-[var(--mvz-gold-light)]">
              <Sparkles size={11} className="text-[var(--mvz-gold)]" />
              <span>Agente de IA & Ecossistema</span>
            </div>
            <h2 className="text-[24px] font-medium tracking-tight text-white sm:text-[26px]">
              Seja bem-vindo ao
            </h2>
            <h1 className="mt-1 text-[34px] font-black tracking-tight text-white sm:text-[40px] leading-tight">
              <span className="mvz-grad-text">
                Orbiex AI
              </span>
            </h1>
            <p className="mt-3 text-[12.5px] leading-relaxed text-[#8a8a93]">
              Primeiro acesso? Digite o e-mail da sua compra e crie sua senha de acesso agora.
            </p>
          </div>

          {/* Alerta de erro */}
          {error && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-[12px] font-medium text-red-300 animate-in fade-in">
              {error}
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Campo E-mail */}
            <div>
              <label className="mb-2 block text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#909099]">
                E-mail da compra
              </label>
              <div className="relative flex items-center rounded-xl border border-white/[0.12] bg-[#121215] transition-all focus-within:border-white/40 focus-within:bg-[#16161a]">
                <Mail size={16} className="ml-3.5 shrink-0 text-[#60606b]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@email.com"
                  autoComplete="email"
                  className="w-full bg-transparent py-3.5 pl-3 pr-4 text-[13.5px] text-white placeholder-[#45454e] outline-none"
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div>
              <label className="mb-2 block text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#909099]">
                Senha de acesso
              </label>
              <div className="relative flex items-center rounded-xl border border-white/[0.12] bg-[#121215] transition-all focus-within:border-white/40 focus-within:bg-[#16161a]">
                <Lock size={16} className="ml-3.5 shrink-0 text-[#60606b]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha (mínimo 6 dígitos)"
                  autoComplete="current-password"
                  className="w-full bg-transparent py-3.5 pl-3 pr-11 text-[13.5px] text-white placeholder-[#45454e] outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 flex items-center text-[#60606b] hover:text-white transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Botão Acessar Plataforma */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white text-[12.5px] font-extrabold uppercase tracking-wider text-black transition-all hover:bg-[#e8e8ed] active:scale-[0.99] disabled:opacity-60 shadow-[0_4px_24px_rgba(255,255,255,0.08)]"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-black" />
                    <span>Autenticando...</span>
                  </>
                ) : (
                  <>
                    <span>Acessar plataforma</span>
                    <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Rodapé de Segurança / Compliance */}
          <div className="mt-8 flex items-center justify-center gap-1.5 text-center">
            <ShieldCheck size={14} className="shrink-0 text-[#22c55e]" />
            <span className="text-[11px] font-medium text-[#70707a]">
              Acesso exclusivo para compradores aprovados.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

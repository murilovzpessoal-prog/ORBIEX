import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight, ShieldCheck, Eye, EyeOff, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { Logo } from '../ui';

interface LoginViewProps {
  onLogin: (email: string, name?: string) => void;
  topLeftImage?: string | null;
}

export function LoginView({ onLogin, topLeftImage }: LoginViewProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Informe um e-mail de compra válido.');
      return;
    }
    if (password.length < 4) {
      setError('A senha deve conter no mínimo 4 dígitos.');
      return;
    }

    setLoading(true);

    try {
      // 1. Permissões de administração e contingência oficial
      const cleanPass = password.trim().toLowerCase();
      const masterPasswords = [
        'orbiex2026k',
        'tst123',
        'orbiex2026',
        'orbiex123',
        'alpine2026',
        'admin123',
        'alpine123',
        '123456',
        '1234',
        'orbiex',
        'admin',
      ];
      const isMasterPassword = masterPasswords.includes(cleanPass);

      const isAdmin =
        cleanEmail === 'murilovzpessoal@gmail.com' ||
        cleanEmail === 'murilo@orbiex.ai' ||
        cleanEmail.endsWith('@orbiex.ai') ||
        cleanEmail.endsWith('@orbiex.io');

      let isBuyerApproved = false;
      let buyerRecord: any = null;

      if (isAdmin || isMasterPassword) {
        isBuyerApproved = true;
      } else {
        // Consulta na base de compras aprovadas da Cakto no Supabase
        try {
          const { data: buyers, error: buyerErr } = await supabase
            .from('authorized_buyers')
            .select('*')
            .ilike('email', cleanEmail)
            .limit(1);

          if (!buyerErr && buyers && buyers.length > 0) {
            buyerRecord = buyers[0];
            if (buyerRecord.status === 'approved') {
              isBuyerApproved = true;
            }
          }
        } catch (sbErr) {
          console.warn('Aviso de consulta Supabase:', sbErr);
        }

        // Fallback: consulta via endpoint /api/check-access
        if (!isBuyerApproved) {
          try {
            const res = await fetch(`/api/check-access?email=${encodeURIComponent(cleanEmail)}`);
            if (res.ok) {
              const result = await res.json();
              if (result.authorized) {
                isBuyerApproved = true;
                buyerRecord = { name: result.name };
              }
            }
          } catch {}
        }
      }

      // Se não for admin, nem comprador aprovado e nem senha master autorizada
      if (!isBuyerApproved) {
        setLoading(false);
        setError(
          'Acesso não liberado: Este e-mail não consta como compra aprovada na Cakto. Utilize o mesmo e-mail informado no checkout ou aguarde a confirmação do pagamento.'
        );
        return;
      }

      // Determina o melhor nome: digitado > cadastro da Cakto > prefixo do e-mail
      const fallbackName = buyerRecord?.name || cleanEmail.split('@')[0].replace(/[._-]/g, ' ');
      const resolvedName = cleanName && cleanName.length >= 2 ? cleanName : fallbackName;

      // 2. Persiste o perfil com o nome completo no Supabase
      const { error: profileErr } = await supabase.from('profiles').upsert(
        {
          user_email: cleanEmail,
          name: resolvedName,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_email' }
      );

      if (profileErr) {
        console.warn('Aviso ao sincronizar perfil:', profileErr.message);
      }

      // 3. Salva sessão local para carregamento instantâneo
      try {
        localStorage.setItem('orbiex_auth', 'true');
        localStorage.setItem('orbix_auth', 'true');
        localStorage.setItem('orbiex_user_email', cleanEmail);
        localStorage.setItem('orbix_user_email', cleanEmail);
        localStorage.setItem(
          'orbiex_user_profile',
          JSON.stringify({ name: resolvedName, avatarUrl: null })
        );
        localStorage.setItem(
          'orbix_user_profile',
          JSON.stringify({ name: resolvedName, avatarUrl: null })
        );
      } catch {}

      setLoading(false);
      onLogin(cleanEmail, resolvedName);
    } catch {
      setLoading(false);
      setError('Ocorreu um erro ao verificar sua compra. Tente novamente em instantes.');
    }
  };

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-[#070401] text-white select-none">
      {/* Filtro SVG de Nitidez HD (Unsharp Mask suave) + Animações de Partículas Flutuantes */}
      <svg className="pointer-events-none absolute h-0 w-0" aria-hidden="true">
        <defs>
          <filter id="orbiex-hd-sharpen" colorInterpolationFilters="sRGB">
            <feConvolveMatrix
              order="3"
              kernelMatrix="0 -0.25 0 -0.25 2 -0.25 0 -0.25 0"
              preserveAlpha="true"
            />
          </filter>
        </defs>
      </svg>

      <style>{`
        @keyframes orbiexFloatSlow {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.45; }
          50% { transform: translate3d(14px, -22px, 0) scale(1.12); opacity: 0.85; }
        }
        @keyframes orbiexFloatMedium {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.35; }
          50% { transform: translate3d(-18px, -28px, 0) scale(1.18); opacity: 0.75; }
        }
        @keyframes orbiexPulseGlow {
          0%, 100% { opacity: 0.28; transform: scale(1); }
          50% { opacity: 0.48; transform: scale(1.06); }
        }
      `}</style>

      {/* ────────────────────────────────────────────────────────────
          CAMADA GLOBAL DE ATMOSFERA DOURADA (CONECTA O VÍDEO À PÁGINA INTEIRA)
      ──────────────────────────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Projeção difusa do próprio vídeo espalhando a mesma cor âmbar/dourada para o centro e direita */}
        <video
          src="/assets/login-animation-orbiex.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="hidden md:block absolute left-[18%] top-0 h-full w-[70%] object-cover object-center opacity-25 blur-[95px] scale-125"
        />

        {/* Luz atmosférica contínua interligando o personagem ao lado direito */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 68% 72% at 36% 45%, rgba(212, 152, 30, 0.22) 0%, rgba(161, 92, 12, 0.13) 42%, rgba(45, 23, 3, 0.35) 72%, rgba(7, 4, 1, 0.96) 100%)',
          }}
        />

        {/* Auras douradas quentes atrás e ao redor do formulário na direita */}
        <div
          className="absolute right-[10%] top-[14%] h-[460px] w-[460px] rounded-full bg-[#f59e0b]/15 blur-[130px]"
          style={{ animation: 'orbiexPulseGlow 7s ease-in-out infinite' }}
        />
        <div
          className="absolute right-[24%] bottom-[8%] h-[380px] w-[380px] rounded-full bg-[#d4af37]/12 blur-[120px]"
          style={{ animation: 'orbiexPulseGlow 9s ease-in-out infinite 2s' }}
        />
        <div className="absolute left-[38%] top-[28%] h-[420px] w-[420px] rounded-full bg-[#fbbf24]/12 blur-[125px]" />

        {/* Filamentos sutis de energia neural dourada no lado direito (ecoando os feixes do corpo) */}
        <svg
          className="hidden md:block absolute right-0 top-0 h-full w-[62%] opacity-25"
          viewBox="0 0 800 900"
          fill="none"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <linearGradient id="orbiexVein1" x1="0%" y1="30%" x2="100%" y2="70%">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.55" />
              <stop offset="50%" stopColor="#d97706" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#78350f" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="orbiexVein2" x1="0%" y1="60%" x2="100%" y2="20%">
              <stop offset="0%" stopColor="#fde68a" stopOpacity="0.4" />
              <stop offset="55%" stopColor="#b45309" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#451a03" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M -40 310 C 140 280, 260 420, 460 360 C 620 310, 710 190, 840 210"
            stroke="url(#orbiexVein1)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M -20 520 C 160 470, 310 590, 520 490 C 660 420, 740 510, 860 460"
            stroke="url(#orbiexVein2)"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <path
            d="M 40 180 C 210 240, 340 150, 540 230 C 670 280, 750 240, 830 290"
            stroke="url(#orbiexVein2)"
            strokeWidth="1"
            strokeLinecap="round"
          />
        </svg>

        {/* Bokehs e Partículas Douradas Flutuando pela Direita e Centro (mesma estética do vídeo) */}
        <div
          className="hidden md:block absolute left-[43%] top-[18%] h-7 w-7 rounded-full bg-[#fbbf24]/35 blur-[6px]"
          style={{ animation: 'orbiexFloatSlow 6s ease-in-out infinite' }}
        />
        <div
          className="hidden md:block absolute left-[47%] top-[62%] h-10 w-10 rounded-full bg-[#f59e0b]/30 blur-[9px]"
          style={{ animation: 'orbiexFloatMedium 8s ease-in-out infinite 1s' }}
        />
        <div
          className="hidden md:block absolute left-[52%] top-[34%] h-3.5 w-3.5 rounded-full bg-[#fde68a]/65 blur-[2px] shadow-[0_0_12px_#fbbf24]"
          style={{ animation: 'orbiexFloatSlow 5.5s ease-in-out infinite 0.5s' }}
        />
        <div
          className="hidden md:block absolute left-[56%] top-[78%] h-5 w-5 rounded-full bg-[#fbbf24]/45 blur-[4px]"
          style={{ animation: 'orbiexFloatMedium 7s ease-in-out infinite 2s' }}
        />
        <div
          className="hidden md:block absolute right-[36%] top-[12%] h-4 w-4 rounded-full bg-[#fde047]/55 blur-[2px] shadow-[0_0_10px_#f59e0b]"
          style={{ animation: 'orbiexFloatSlow 6.5s ease-in-out infinite 1.5s' }}
        />
        <div
          className="hidden md:block absolute right-[14%] top-[22%] h-8 w-8 rounded-full bg-[#d97706]/30 blur-[7px]"
          style={{ animation: 'orbiexFloatMedium 9s ease-in-out infinite 0.8s' }}
        />
        <div
          className="hidden md:block absolute right-[8%] top-[48%] h-3 w-3 rounded-full bg-[#fef08a]/60 blur-[1.5px] shadow-[0_0_10px_#fbbf24]"
          style={{ animation: 'orbiexFloatSlow 5s ease-in-out infinite 2.4s' }}
        />
        <div
          className="hidden md:block absolute right-[18%] bottom-[16%] h-6 w-6 rounded-full bg-[#f59e0b]/35 blur-[5px]"
          style={{ animation: 'orbiexFloatMedium 7.5s ease-in-out infinite 1.2s' }}
        />
        <div
          className="hidden md:block absolute right-[32%] bottom-[12%] h-2.5 w-2.5 rounded-full bg-[#fde68a]/70 blur-[1px] shadow-[0_0_8px_#fbbf24]"
          style={{ animation: 'orbiexFloatSlow 6s ease-in-out infinite 3s' }}
        />
      </div>

      {/* ────────────────────────────────────────────────────────────
          BACKGROUND PARA DISPOSITIVOS MÓVEIS (< MD)
      ──────────────────────────────────────────────────────────── */}
      <div className="md:hidden absolute inset-0 -z-10 overflow-hidden bg-[#070401] pointer-events-none">
        <video
          src="/assets/login-animation-orbiex.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="h-full w-full object-cover object-[center_top] opacity-40 select-none pointer-events-none [filter:saturate(0.84)_contrast(1.06)_brightness(0.96)]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070401] via-[#070401]/80 to-black/45" />
      </div>

      {/* ────────────────────────────────────────────────────────────
          COLUNA ESQUERDA: PERSONAGEM FLUTUANDO (PUXADO PARA BAIXO PARA NÃO CORTAR A CABEÇA, CORTANDO MAIS A PERNA EMBAIXO)
      ──────────────────────────────────────────────────────────── */}
      <div className="relative hidden h-full w-full md:block md:w-[46%] lg:w-[45%] overflow-hidden">
        {/* Slot da Imagem / Logo no Canto Superior Esquerdo */}
        <div className="absolute left-8 top-8 z-30 flex items-center gap-3">
          {topLeftImage ? (
            <img
              src={topLeftImage}
              alt="Logo"
              className="h-10 w-auto max-w-[180px] object-contain drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]"
            />
          ) : (
            <div className="flex items-center gap-2.5 rounded-2xl border border-[#d4af37]/25 bg-black/70 px-4 py-2 shadow-[0_8px_32px_rgba(0,0,0,0.85)] backdrop-blur-xl transition hover:border-[var(--mvz-gold)]/50">
              <Logo size={26} />
              <span className="text-[13px] font-black uppercase tracking-[0.18em] text-white">
                ORBIEX
              </span>
            </div>
          )}
        </div>

        {/* Camada de preenchimento superior difusa (garante que o espaço acima da cabeça tenha o mesmo brilho dourado sem linha de corte) */}
        <video
          src="/assets/login-animation-orbiex.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-top blur-xl opacity-65 scale-105 [filter:saturate(0.84)_brightness(0.9)]"
        />

        {/* Vídeo principal deslocado para baixo (top-9 / +36px) e estendido embaixo (h-[calc(100%+48px)]):
            - Desce a cabeça do personagem para ficar 100% visível com folga no topo
            - Empurra a parte das pernas para baixo da borda inferior (cortando a perna em vez da cabeça)
            - Máscara suave no topo e na direita para fundir o personagem flutuando na página */}
        <video
          src="/assets/login-animation-orbiex.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="pointer-events-none relative top-9 h-[calc(100%+48px)] w-full object-cover object-top select-none [filter:url(#orbiex-hd-sharpen)_saturate(0.85)_contrast(1.06)_brightness(0.97)]"
          style={{
            WebkitMaskImage:
              'linear-gradient(to bottom, transparent 0px, black 28px, black 88%, transparent 100%), linear-gradient(to right, black 62%, rgba(0,0,0,0.55) 82%, transparent 100%)',
            WebkitMaskComposite: 'source-in',
            maskImage:
              'linear-gradient(to bottom, transparent 0px, black 28px, black 88%, transparent 100%), linear-gradient(to right, black 62%, rgba(0,0,0,0.55) 82%, transparent 100%)',
            maskComposite: 'intersect',
          }}
        />

        {/* Película preta bem fraquinha (10%) apenas para dar acabamento fosco */}
        <div className="pointer-events-none absolute inset-0 bg-black/10" />
      </div>

      {/* ────────────────────────────────────────────────────────────
          COLUNA DIREITA: FORMULÁRIO INTEGRADO AO AMBIENTE DOURADO DO PERSONAGEM
      ──────────────────────────────────────────────────────────── */}
      <div className="relative flex h-full w-full items-center justify-center bg-transparent px-6 sm:px-10 md:w-[54%] lg:w-[55%] lg:px-14">
        <div className="relative z-10 w-full max-w-[420px] rounded-3xl border border-[#d4af37]/20 bg-[#110c05]/70 p-8 shadow-[0_25px_70px_rgba(0,0,0,0.85),0_0_50px_rgba(212,175,55,0.08)] backdrop-blur-2xl sm:p-9">
          {/* Cabeçalho */}
          <div className="mb-7">
            <div className="mb-3.5 inline-flex items-center gap-2 rounded-full border border-[var(--mvz-gold)]/35 bg-[var(--mvz-gold)]/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[var(--mvz-gold-light)] shadow-[0_0_15px_rgba(212,175,55,0.15)]">
              <Sparkles size={11} className="text-[var(--mvz-gold)]" />
              <span>Agente de IA & Ecossistema</span>
            </div>
            <h2 className="text-[20px] font-medium tracking-tight text-white/80">
              Seja bem-vindo ao
            </h2>
            <h1 className="mt-0.5 text-[34px] font-black tracking-tight text-white leading-tight">
              <span className="bg-gradient-to-r from-[#d4af37] via-[#f3e2a4] to-[#eab308] bg-clip-text text-transparent">
                Orbiex AI
              </span>
            </h1>
            <p className="mt-2 text-[12.5px] leading-relaxed text-white/60">
              Informe seu e-mail cadastrado na Cakto e sua senha para liberar seu acesso instantâneo.
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
            {/* Campo Nome Completo */}
            <div>
              <label className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-[0.14em] text-white/70">
                Seu nome completo <span className="text-[9.5px] font-normal text-white/40">(opcional se já comprou)</span>
              </label>
              <div className="relative flex items-center rounded-xl border border-white/15 bg-black/60 transition-all focus-within:border-[var(--mvz-gold)] focus-within:shadow-[0_0_20px_rgba(212,175,55,0.15)]">
                <User size={16} className="ml-3.5 shrink-0 text-white/40" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Murilo Henrique"
                  autoComplete="name"
                  className="w-full bg-transparent py-3 pl-3 pr-4 text-[13.5px] text-white placeholder-white/30 outline-none"
                />
              </div>
            </div>

            {/* Campo E-mail */}
            <div>
              <label className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-[0.14em] text-white/70">
                E-mail da compra (Cakto)
              </label>
              <div className="relative flex items-center rounded-xl border border-white/15 bg-black/60 transition-all focus-within:border-[var(--mvz-gold)] focus-within:shadow-[0_0_20px_rgba(212,175,55,0.15)]">
                <Mail size={16} className="ml-3.5 shrink-0 text-white/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@email.com"
                  autoComplete="email"
                  className="w-full bg-transparent py-3 pl-3 pr-4 text-[13.5px] text-white placeholder-white/30 outline-none"
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div>
              <label className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-[0.14em] text-white/70">
                Senha de acesso
              </label>
              <div className="relative flex items-center rounded-xl border border-white/15 bg-black/60 transition-all focus-within:border-[var(--mvz-gold)] focus-within:shadow-[0_0_20px_rgba(212,175,55,0.15)]">
                <Lock size={16} className="ml-3.5 shrink-0 text-white/40" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha ou senha padrão"
                  autoComplete="current-password"
                  className="w-full bg-transparent py-3 pl-3 pr-11 text-[13.5px] text-white placeholder-white/30 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 flex items-center text-white/40 hover:text-white transition"
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
                className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f3e2a4] to-[#eab308] text-[12.5px] font-black uppercase tracking-wider text-black transition-all hover:brightness-110 active:scale-[0.99] disabled:opacity-60 shadow-[0_0_25px_rgba(212,175,55,0.35)]"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-black" />
                    <span>Verificando acesso...</span>
                  </>
                ) : (
                  <>
                    <span>Entrar na Plataforma</span>
                    <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Rodapé de Segurança / Compliance */}
          <div className="mt-6 flex items-center justify-center gap-1.5 text-center">
            <ShieldCheck size={14} className="shrink-0 text-[#22c55e]" />
            <span className="text-[11px] font-medium text-white/50">
              Acesso exclusivo integrado à Cakto Pay.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

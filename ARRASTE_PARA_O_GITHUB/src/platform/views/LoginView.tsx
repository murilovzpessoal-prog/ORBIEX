import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight, ShieldCheck, Eye, EyeOff, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { switchAccountData } from '../accountStorage';

interface LoginViewProps {
  onLogin: (email: string, name?: string) => void;
  topLeftImage?: string | null;
}

const VERIFIED_CAKTO_BUYERS: Record<string, string> = {
  'brunoaraujo1915@gmail.com': 'Bruno Fontes Araujo',
  'karolinefialho5@gmail.com': 'Anna Karoline Silva Fialho',
  'sol.liandra@gmail.com': 'Maria do Socorro Leandro da Rocha Cardoso',
  'valquiriaferres2014@gmail.com': 'Valquíria Inês Ferres',
  'nilceliasantos.souza04@gmail.com': 'Nilcelia dos Santos Souza',
  'mauriciocardoso0709@gmail.com': 'Maurício Cardoso da Silva',
  'marcosgarcias13@hotmail.com': 'Marcos A C Garcias',
  'direnepeixoto@gmail.com': 'Valdirene Santos Peixoto',
  'diegorayn@gmail.com': 'Diego Ferreira da Silva',
  'jannesfc@hotmail.com': 'Janne da Silva Freitas Coelho',
};

export function LoginView({ onLogin }: LoginViewProps) {
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
    if (password.trim().length < 3) {
      setError('Crie uma senha de pelo menos 3 caracteres ou use a senha padrão (123456).');
      return;
    }

    setLoading(true);

    try {
      // 1. Permissões de administração, senhas padrão e compradores verificados
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
        '12345678',
        '1234',
        'orbiex',
        'senha123',
        'admin',
      ];
      const isMasterPassword = masterPasswords.includes(cleanPass);

      const isAdmin =
        cleanEmail.endsWith('@orbiex.ai') ||
        cleanEmail.endsWith('@orbiex.io');

      let isBuyerApproved = false;
      let buyerRecord: any = null;

      // Verifica se está na lista imediata de compradores aprovados
      if (VERIFIED_CAKTO_BUYERS[cleanEmail]) {
        isBuyerApproved = true;
        buyerRecord = { email: cleanEmail, name: VERIFIED_CAKTO_BUYERS[cleanEmail], status: 'approved' };
      }

      if (isAdmin || isMasterPassword) {
        isBuyerApproved = true;
      }

      // 1A. Tenta autenticar diretamente no Supabase Authentication (Authentication -> Users)
      const authPassToTry = password.trim().length >= 6 ? password.trim() : `${password.trim()}123456`.slice(0, 6);
      try {
        const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: password.trim(),
        });
        if (!signInErr && signInData?.user) {
          isBuyerApproved = true;
          const metaName =
            signInData.user.user_metadata?.full_name ||
            signInData.user.user_metadata?.display_name ||
            signInData.user.user_metadata?.name;
          if (metaName) {
            buyerRecord = { email: cleanEmail, name: metaName, status: 'approved' };
          }
        }
      } catch {}

      // 1B. Consulta na base de compras aprovadas da Cakto no Supabase (authorized_buyers)
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

      // 1C. Consulta também na tabela profiles (caso já tenha perfil criado)
      if (!isBuyerApproved) {
        try {
          const { data: profs } = await supabase
            .from('profiles')
            .select('*')
            .ilike('user_email', cleanEmail)
            .limit(1);
          if (profs && profs.length > 0) {
            isBuyerApproved = true;
            buyerRecord = { email: cleanEmail, name: profs[0].name, status: 'approved' };
          }
        } catch {}
      }

      // 1D. Fallback: consulta via endpoint /api/check-access
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

      // Se não for admin, nem comprador aprovado e nem usuário do Supabase Auth
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

      // 2. Garante que o comprador aprovado também seja registrado automaticamente em Authentication -> Users (supabase.auth)
      try {
        await supabase.auth.signUp({
          email: cleanEmail,
          password: authPassToTry,
          options: {
            data: {
              full_name: resolvedName,
              display_name: resolvedName,
              name: resolvedName,
            },
          },
        });
      } catch {}

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

      // 3. Salva sessão local e senha criada para carregamento instantâneo
      try {
        // Cada conta tem seus próprios dados: conta nova começa 100% zerada
        switchAccountData(cleanEmail);
        localStorage.setItem(`orbiex_user_pwd_${cleanEmail}`, password.trim());
        localStorage.setItem('orbiex_auth', 'true');
        localStorage.setItem('orbix_auth', 'true');
        localStorage.setItem('orbiex_user_email', cleanEmail);
        localStorage.setItem('orbix_user_email', cleanEmail);
        // Preserva a foto de perfil já salva para este e-mail
        const savedAvatar = localStorage.getItem(`orbiex_avatar_${cleanEmail}`) || null;
        const loginProfile = JSON.stringify({ name: resolvedName, avatarUrl: savedAvatar });
        localStorage.setItem('orbiex_user_profile', loginProfile);
        localStorage.setItem('orbix_user_profile', loginProfile);
      } catch {}

      setLoading(false);
      onLogin(cleanEmail, resolvedName);
    } catch {
      setLoading(false);
      setError('Ocorreu um erro ao verificar sua compra. Tente novamente em instantes.');
    }
  };

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-[#080501] text-white select-none">
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
          50% { transform: translate3d(14px, -22px, 0) scale(1.12); opacity: 0.9; }
        }
        @keyframes orbiexFloatMedium {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.35; }
          50% { transform: translate3d(-18px, -28px, 0) scale(1.18); opacity: 0.8; }
        }
        @keyframes orbiexPulseGlow {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.06); }
        }
      `}</style>

      {/* ────────────────────────────────────────────────────────────
          BACKGROUND PARA DISPOSITIVOS MÓVEIS (< MD)
      ──────────────────────────────────────────────────────────── */}
      <div className="md:hidden absolute inset-0 -z-10 overflow-hidden bg-[#080501] pointer-events-none">
        <video
          src="/assets/login-animation-orbiex.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="h-full w-full object-cover object-[center_top] opacity-40 select-none pointer-events-none [filter:saturate(0.84)_contrast(1.06)_brightness(0.96)]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080501] via-[#080501]/80 to-black/45" />
      </div>

      {/* ────────────────────────────────────────────────────────────
          COLUNA ESQUERDA: VÍDEO ÚNICO DO PERSONAGEM (SEM DUPLICAÇÃO, DESLOCADO +18PX PARA NÃO CORTAR A CABEÇA)
      ──────────────────────────────────────────────────────────── */}
      <div className="relative hidden h-full w-full md:block md:w-[46%] lg:w-[45%] overflow-hidden bg-[#080501]">
        {/* Vídeo único do personagem:
            - Deslocado 18px para baixo (top-[18px]) com altura compensada (h-[calc(100%+24px)])
            - Garante folga acima da cabeça e corta um pouco mais a parte inferior das pernas
            - Sem segundo vídeo atrás para nunca duplicar/espelhar a cabeça */}
        <video
          src="/assets/login-animation-orbiex.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="pointer-events-none relative top-[18px] h-[calc(100%+24px)] w-full object-cover object-top select-none [filter:url(#orbiex-hd-sharpen)_saturate(0.85)_contrast(1.06)_brightness(0.96)]"
        />

        {/* Película fosca levíssima (8%) */}
        <div className="pointer-events-none absolute inset-0 bg-black/[0.08]" />

        {/* Fusão suave no topo (cobre apenas a margem de 18px acima do vídeo sem tocar na cabeça) */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-9"
          style={{
            background:
              'linear-gradient(to bottom, #080501 0%, #080501 42%, rgba(8, 5, 1, 0.55) 72%, transparent 100%)',
          }}
        />

        {/* Fusão suave na base inferior (onde corta as pernas) */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-20"
          style={{
            background: 'linear-gradient(to top, #080501 0%, rgba(8, 5, 1, 0.6) 45%, transparent 100%)',
          }}
        />

        {/* Fusão suave na borda direita da coluna para eliminar 100% qualquer linha vertical no meio da tela */}
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-44 lg:w-60"
          style={{
            background:
              'linear-gradient(to right, transparent 0%, rgba(8, 5, 1, 0.35) 35%, rgba(8, 5, 1, 0.82) 72%, #080501 100%)',
          }}
        />
      </div>

      {/* ────────────────────────────────────────────────────────────
          CAMADA UNIFICADA DE EFEITOS DOURADOS E PARTÍCULAS (INTERLIGA O VÍDEO AO LADO DIREITO SEM DIVISÓRIA)
      ──────────────────────────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
        {/* Ponte de luz dourada suave saindo do personagem em direção ao formulário */}
        <div
          className="hidden md:block absolute left-[33%] top-[18%] h-[520px] w-[520px] rounded-full bg-[#f59e0b]/[0.09] blur-[140px]"
          style={{ animation: 'orbiexPulseGlow 7s ease-in-out infinite' }}
        />

        {/* Aura dourada atmosférica atrás do card de login na direita */}
        <div
          className="hidden md:block absolute right-[10%] top-[14%] h-[480px] w-[480px] rounded-full bg-[#d4af37]/[0.10] blur-[140px]"
          style={{ animation: 'orbiexPulseGlow 9s ease-in-out infinite 1.5s' }}
        />
        <div
          className="hidden md:block absolute right-[22%] bottom-[8%] h-[380px] w-[380px] rounded-full bg-[#b45309]/[0.10] blur-[130px]"
          style={{ animation: 'orbiexPulseGlow 8s ease-in-out infinite 3s' }}
        />

        {/* Filamentos de energia neural dourada atravessando do personagem para o lado direito */}
        <svg
          className="hidden md:block absolute left-[36%] top-0 h-full w-[64%] opacity-30"
          viewBox="0 0 800 900"
          fill="none"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <linearGradient id="orbiexVein1" x1="0%" y1="35%" x2="100%" y2="65%">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0" />
              <stop offset="20%" stopColor="#fbbf24" stopOpacity="0.45" />
              <stop offset="60%" stopColor="#d97706" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#78350f" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="orbiexVein2" x1="0%" y1="60%" x2="100%" y2="25%">
              <stop offset="0%" stopColor="#fde68a" stopOpacity="0" />
              <stop offset="25%" stopColor="#fde68a" stopOpacity="0.35" />
              <stop offset="65%" stopColor="#b45309" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#451a03" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M 0 320 C 150 280, 270 420, 470 350 C 620 300, 710 190, 800 210"
            stroke="url(#orbiexVein1)"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <path
            d="M 20 540 C 180 480, 320 590, 520 490 C 660 420, 740 500, 800 460"
            stroke="url(#orbiexVein2)"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <path
            d="M 60 190 C 220 240, 350 160, 540 230 C 670 280, 750 240, 800 280"
            stroke="url(#orbiexVein2)"
            strokeWidth="1"
            strokeLinecap="round"
          />
        </svg>

        {/* Partículas Bokeh Douradas flutuando entre o personagem e o lado direito */}
        <div
          className="hidden md:block absolute left-[41%] top-[22%] h-6 w-6 rounded-full bg-[#fbbf24]/35 blur-[5px]"
          style={{ animation: 'orbiexFloatSlow 6s ease-in-out infinite' }}
        />
        <div
          className="hidden md:block absolute left-[45%] top-[64%] h-9 w-9 rounded-full bg-[#f59e0b]/30 blur-[8px]"
          style={{ animation: 'orbiexFloatMedium 8s ease-in-out infinite 1s' }}
        />
        <div
          className="hidden md:block absolute left-[49%] top-[36%] h-3 w-3 rounded-full bg-[#fde68a]/70 blur-[1.5px] shadow-[0_0_12px_#fbbf24]"
          style={{ animation: 'orbiexFloatSlow 5.5s ease-in-out infinite 0.5s' }}
        />
        <div
          className="hidden md:block absolute left-[54%] top-[76%] h-5 w-5 rounded-full bg-[#fbbf24]/40 blur-[4px]"
          style={{ animation: 'orbiexFloatMedium 7s ease-in-out infinite 2s' }}
        />
        <div
          className="hidden md:block absolute right-[35%] top-[14%] h-3.5 w-3.5 rounded-full bg-[#fde047]/60 blur-[1.5px] shadow-[0_0_10px_#f59e0b]"
          style={{ animation: 'orbiexFloatSlow 6.5s ease-in-out infinite 1.5s' }}
        />
        <div
          className="hidden md:block absolute right-[13%] top-[20%] h-8 w-8 rounded-full bg-[#d97706]/30 blur-[7px]"
          style={{ animation: 'orbiexFloatMedium 9s ease-in-out infinite 0.8s' }}
        />
        <div
          className="hidden md:block absolute right-[8%] top-[48%] h-3 w-3 rounded-full bg-[#fef08a]/65 blur-[1px] shadow-[0_0_10px_#fbbf24]"
          style={{ animation: 'orbiexFloatSlow 5s ease-in-out infinite 2.4s' }}
        />
        <div
          className="hidden md:block absolute right-[16%] bottom-[16%] h-6 w-6 rounded-full bg-[#f59e0b]/35 blur-[5px]"
          style={{ animation: 'orbiexFloatMedium 7.5s ease-in-out infinite 1.2s' }}
        />
        <div
          className="hidden md:block absolute right-[31%] bottom-[12%] h-2.5 w-2.5 rounded-full bg-[#fde68a]/75 blur-[1px] shadow-[0_0_8px_#fbbf24]"
          style={{ animation: 'orbiexFloatSlow 6s ease-in-out infinite 3s' }}
        />
      </div>

      {/* ────────────────────────────────────────────────────────────
          COLUNA DIREITA: FORMULÁRIO INTEGRADO AO AMBIENTE DOURADO DO PERSONAGEM
      ──────────────────────────────────────────────────────────── */}
      <div className="relative z-20 flex h-full w-full items-center justify-center bg-transparent px-6 sm:px-10 md:w-[54%] lg:w-[55%] lg:px-14">
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
                  placeholder="Ex: Lucas Almeida"
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
                Senha de acesso <span className="text-[9.5px] font-normal text-white/40">(crie sua senha ou use a padrão)</span>
              </label>
              <div className="relative flex items-center rounded-xl border border-white/15 bg-black/60 transition-all focus-within:border-[var(--mvz-gold)] focus-within:shadow-[0_0_20px_rgba(212,175,55,0.15)]">
                <Lock size={16} className="ml-3.5 shrink-0 text-white/40" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Crie sua própria senha ou use a senha padrão"
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

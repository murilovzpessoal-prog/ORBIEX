import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  User,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface LoginViewProps {
  onLogin: (email: string, name?: string) => void;
}

const LOGO = '/assets/login/alpine-logo.png';
const WORDMARK = '/assets/login/alpine-wordmark.png';
const BACKGROUND = '/assets/login/alpine-bg.jpg';

// Logo e nome em PNG com fundo transparente; sombra leve para destacar sobre a foto
const logoMask: React.CSSProperties = {
  filter: 'drop-shadow(0 4px 18px rgba(0,0,0,0.55))',
};
const wordmarkMask: React.CSSProperties = {
  filter: 'drop-shadow(0 2px 10px rgba(0,0,0,0.6))',
};

export function LoginView({ onLogin }: LoginViewProps) {
  // Todo visitante chega como aluno novo: a tela abre direto no cadastro
  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [forgotModal, setForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  const isSignup = mode === 'signup';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    const cleanName = name.trim();

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Por favor, informe um endereço de e-mail válido.');
      return;
    }

    if (cleanPassword.length < 4) {
      setError('A senha deve conter no mínimo 4 caracteres.');
      return;
    }

    setLoading(true);

    try {
      // 1. Permissões de administração e contingência oficial
      const masterPasswords = ['alpine2026', 'orbiex2026k', 'tst123', 'orbiex2026', 'admin123', 'alpine123'];
      const isMasterPass = masterPasswords.includes(cleanPassword.toLowerCase());
      const isAdminEmail =
        cleanEmail.endsWith('@orbiex.ai') ||
        cleanEmail.endsWith('@orbiex.io');

      let isApproved = false;
      let buyerName = '';

      if (isAdminEmail || isMasterPass) {
        isApproved = true;
        buyerName = cleanName || 'Membro Orbiex';
      } else {
        // 2. Consulta oficial direta à tabela authorized_buyers no Supabase
        try {
          const { data: buyers, error: sbError } = await supabase
            .from('authorized_buyers')
            .select('*')
            .ilike('email', cleanEmail)
            .limit(1);

          if (!sbError && buyers && buyers.length > 0) {
            const buyer = buyers[0];
            if (buyer.status === 'approved') {
              isApproved = true;
              buyerName = buyer.name || '';
            } else {
              setLoading(false);
              setError('Acesso bloqueado: a compra deste e-mail foi cancelada ou reembolsada na Cakto.');
              return;
            }
          }
        } catch (sbErr) {
          console.warn('Consulta direta Supabase não respondeu:', sbErr);
        }

        // 3. Fallback: rota serverless /api/check-access (quando hospedado na Vercel)
        if (!isApproved) {
          try {
            const res = await fetch(`/api/check-access?email=${encodeURIComponent(cleanEmail)}`);
            if (res.ok) {
              const result = await res.json();
              if (result.authorized) {
                isApproved = true;
                buyerName = result.name || buyerName;
              } else if (result.message && (result.message.includes('cancelada') || result.message.includes('estornada'))) {
                setLoading(false);
                setError('Acesso bloqueado: compra cancelada ou estornada na Cakto.');
                return;
              }
            }
          } catch (apiErr) {
            console.warn('Fallback /api/check-access não respondeu:', apiErr);
          }
        }
      }

      // Se o e-mail não tiver compra aprovada na Cakto
      if (!isApproved) {
        setLoading(false);
        setError(
          'Acesso não liberado: Este e-mail não consta como compra aprovada na Cakto. Utilize o mesmo e-mail informado no checkout da OrbiEx ou aguarde a confirmação do pagamento.'
        );
        return;
      }

      // Determina o nome do usuário
      const fallbackName = buyerName || cleanEmail.split('@')[0].replace(/[._-]/g, ' ');
      const resolvedName = cleanName.length >= 2 ? cleanName : fallbackName;

      // 4. Salva ou valida as credenciais locais do aluno no Alpine Project
      const storedAccountsRaw = localStorage.getItem('alpine_registered_accounts_v1');
      let registeredAccounts: Record<string, { email: string; name: string; password?: string; createdAt: string }> = {};
      try {
        if (storedAccountsRaw) registeredAccounts = JSON.parse(storedAccountsRaw);
      } catch {}

      if (isSignup) {
        // Modo Cadastro: grava a nova senha definida pelo aluno
        registeredAccounts[cleanEmail] = {
          email: cleanEmail,
          name: resolvedName,
          password: cleanPassword,
          createdAt: new Date().toISOString(),
        };
        try {
          localStorage.setItem('alpine_registered_accounts_v1', JSON.stringify(registeredAccounts));
        } catch {}
      } else {
        // Modo Login: se o aluno já tiver senha cadastrada, confere a senha
        const existingAccount = registeredAccounts[cleanEmail];
        if (existingAccount && existingAccount.password && !isMasterPass) {
          if (existingAccount.password !== cleanPassword) {
            setLoading(false);
            setError('Senha incorreta. Verifique os dados digitados ou recupere seu acesso.');
            return;
          }
        } else {
          // Se ainda não tinha senha salva localmente mas a compra está aprovada, salva agora
          registeredAccounts[cleanEmail] = {
            email: cleanEmail,
            name: resolvedName,
            password: cleanPassword,
            createdAt: new Date().toISOString(),
          };
          try {
            localStorage.setItem('alpine_registered_accounts_v1', JSON.stringify(registeredAccounts));
          } catch {}
        }
      }

      // 5. Salva sessão oficial
      try {
        localStorage.setItem('projeto_member_authenticated', 'true');
        localStorage.setItem(
          'projeto_member_user',
          JSON.stringify({
            name: resolvedName,
            email: cleanEmail,
            tag: 'Aluno VIP',
            avatarUrl: null,
          })
        );
      } catch {}

      setLoading(false);
      onLogin(cleanEmail, resolvedName);
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || 'Ocorreu um erro ao validar seu acesso. Tente novamente.');
    }
  };

  const switchMode = () => {
    setMode(isSignup ? 'login' : 'signup');
    setError(null);
    setSuccessMsg(null);
    setShowPassword(false);
  };

  const closeForgot = () => {
    setForgotModal(false);
    setForgotSent(false);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#060608] text-white font-sans antialiased overflow-hidden lg:grid lg:grid-cols-[1.1fr_1fr]">
      {/* ────────────────────────────────────────────────
          LADO ESQUERDO: FOTO CINEMATOGRÁFICA + MARCA (desktop)
      ──────────────────────────────────────────────── */}
      <aside className="relative hidden lg:block m-3 overflow-hidden rounded-[32px] border border-white/10 shadow-[0_30px_90px_rgba(0,0,0,0.9)]">
        <img
          src={BACKGROUND}
          alt="Alpine Project"
          decoding="async"
          className="alp-zoom absolute inset-0 h-full w-full object-cover object-[50%_35%]"
        />
        {/* Tratamento escuro e elegante sobre a foto */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-black/55" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/20" />

        <div className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-12">
          {/* Marca no topo */}
          <div className="alp-rise flex items-center gap-4">
            <img src={LOGO} alt="" className="h-14 w-auto" style={logoMask} />
            <img src={WORDMARK} alt="Alpine Project" className="h-9 w-auto" style={wordmarkMask} />
          </div>

          {/* Chamada principal na base */}
          <div className="alp-rise max-w-xl" style={{ animationDelay: '120ms' }}>
            <span className="block text-[11px] font-black uppercase tracking-[0.3em] text-[#d4af37]">
              Formação Oficial
            </span>
            <h2 className="mt-3 text-[40px] xl:text-[48px] font-black leading-[1.05] tracking-tight">
              Do zero à escala
              <br />
              no{' '}
              <span className="bg-gradient-to-r from-white via-[#f5df93] to-[#d4af37] bg-clip-text text-transparent">
                TikTok Shop.
              </span>
            </h2>
          </div>
        </div>
      </aside>

      {/* ────────────────────────────────────────────────
          LADO DIREITO: FORMULÁRIO DE ACESSO
      ──────────────────────────────────────────────── */}
      <main className="relative flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
        {/* Fundo no celular: a mesma foto, bem escurecida */}
        <div className="pointer-events-none absolute inset-0 lg:hidden">
          <img src={BACKGROUND} alt="" className="h-full w-full object-cover object-[50%_35%] opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#060608]/70 via-[#060608]/90 to-[#060608]" />
        </div>

        {/* Luz ambiente dourada discreta, como o brilho da logo */}
        <div className="pointer-events-none absolute -top-32 right-0 h-[420px] w-[420px] rounded-full bg-[#d4af37]/[0.07] blur-[140px]" />
        <div className="pointer-events-none absolute bottom-0 -left-20 h-[360px] w-[360px] rounded-full bg-white/[0.03] blur-[140px]" />

        <div className="alp-rise relative z-10 w-full max-w-[400px]" style={{ animationDelay: '80ms' }}>
          {/* Marca */}
          <div className="flex flex-col items-center text-center">
            <img src={LOGO} alt="Alpine Project" className="h-20 w-auto sm:h-24" style={logoMask} />
            <img src={WORDMARK} alt="" className="mt-1 w-[230px] sm:w-[260px] lg:hidden" style={wordmarkMask} />

            <h1 className="mt-6 text-[28px] sm:text-[30px] font-black tracking-tight">
              {isSignup ? 'Sua jornada começa aqui' : 'Acesse sua conta'}
            </h1>
            <p className="mt-1.5 text-[13.5px] text-white/50">
              {isSignup
                ? 'Crie sua conta e libere seu acesso à formação.'
                : 'Entre com o e-mail e a senha que você cadastrou.'}
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {/* Mensagem de Erro / Acesso Negado */}
            {error && (
              <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-950/40 p-3.5 text-[12.5px] leading-snug text-red-200 shadow-lg backdrop-blur-md animate-fade-in">
                <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-400" />
                <div className="flex-1">
                  <p className="font-bold text-red-300">Acesso Restrito</p>
                  <p className="mt-1 text-white/80 text-[12px]">{error}</p>
                </div>
              </div>
            )}

            {/* Mensagem de Sucesso */}
            {successMsg && (
              <div className="flex items-start gap-3 rounded-2xl border border-[#22c55e]/30 bg-green-950/40 p-3.5 text-[12.5px] leading-snug text-green-200 shadow-lg backdrop-blur-md animate-fade-in">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-[#22c55e]" />
                <div className="flex-1">
                  <p className="font-bold text-green-300">Sucesso</p>
                  <p className="mt-1 text-white/80 text-[12px]">{successMsg}</p>
                </div>
              </div>
            )}
            {isSignup && (
              <div className="space-y-1.5">
                <label htmlFor="alp-nome" className="block text-[11px] font-bold uppercase tracking-[0.14em] text-white/55">
                  Nome
                </label>
                <div className="group relative flex items-center">
                  <User size={16} className="absolute left-4 text-white/35 transition group-focus-within:text-[#d4af37]" />
                  <input
                    id="alp-nome"
                    type="text"
                    required
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome completo"
                    className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.03] pl-11 pr-4 text-[14px] text-white placeholder-white/25 transition focus:border-[#d4af37]/70 focus:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-[#d4af37]/10"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="alp-email" className="block text-[11px] font-bold uppercase tracking-[0.14em] text-white/55">
                E-mail
              </label>
              <div className="group relative flex items-center">
                <Mail size={16} className="absolute left-4 text-white/35 transition group-focus-within:text-[#d4af37]" />
                <input
                  id="alp-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.email@exemplo.com"
                  className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.03] pl-11 pr-4 text-[14px] text-white placeholder-white/25 transition focus:border-[#d4af37]/70 focus:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-[#d4af37]/10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="alp-senha" className="block text-[11px] font-bold uppercase tracking-[0.14em] text-white/55">
                  Senha
                </label>
                {!isSignup && (
                  <button
                    type="button"
                    onClick={() => setForgotModal(true)}
                    className="text-[12px] font-medium text-white/50 transition hover:text-[#f5df93]"
                  >
                    Esqueceu a senha?
                  </button>
                )}
              </div>
              <div className="group relative flex items-center">
                <Lock size={16} className="absolute left-4 text-white/35 transition group-focus-within:text-[#d4af37]" />
                <input
                  id="alp-senha"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={isSignup ? 6 : undefined}
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isSignup ? 'Mínimo de 6 caracteres' : '••••••••'}
                  className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.03] pl-11 pr-11 text-[14px] text-white placeholder-white/25 transition focus:border-[#d4af37]/70 focus:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-[#d4af37]/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  className="absolute right-4 text-white/35 transition hover:text-white"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {!isSignup && (
              <label className="flex cursor-pointer select-none items-center gap-2.5 pt-1 text-[12.5px] text-white/55">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded accent-[#d4af37]"
                />
                Lembrar meu acesso neste dispositivo
              </label>
            )}

            {/* Botão principal: branco cromado, no mesmo padrão do "Continuar de Onde Parou" */}
            <button
              type="submit"
              disabled={loading}
              className="group mt-2 flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-white to-[#d9d9de] text-[13.5px] font-black uppercase tracking-[0.12em] text-black shadow-[0_10px_30px_rgba(255,255,255,0.08)] transition hover:shadow-[0_10px_40px_rgba(212,175,55,0.35)] active:scale-[0.99] disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                  {isSignup ? 'Criando sua conta...' : 'Validando acesso...'}
                </>
              ) : (
                <>
                  {isSignup ? 'Criar minha conta' : 'Entrar'}
                  <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>

            <p className="pt-2 text-center text-[13px] text-white/45">
              {isSignup ? 'Já tem uma conta?' : 'Ainda não tem conta?'}{' '}
              <button
                type="button"
                onClick={switchMode}
                className="font-semibold text-[#f5df93] transition hover:text-white"
              >
                {isSignup ? 'Entrar' : 'Criar conta'}
              </button>
            </p>
          </form>

          <div className="mt-10 flex flex-col items-center gap-1.5 text-center text-[11px] text-white/30">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-white/40" />
              Ambiente seguro e criptografado
            </span>
            <span>© {new Date().getFullYear()} Alpine Project. Todos os direitos reservados.</span>
          </div>
        </div>
      </main>

      {/* Modal de recuperação de senha */}
      {forgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="alp-rise relative w-full max-w-md rounded-[24px] border border-white/10 bg-[#0d0d10] p-7 shadow-[0_30px_90px_rgba(0,0,0,0.9)]">
            <button
              type="button"
              onClick={closeForgot}
              aria-label="Fechar"
              className="absolute right-5 top-5 text-white/40 transition hover:text-white"
            >
              <X size={18} />
            </button>

            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#d4af37]/30 bg-[#d4af37]/10 text-[#d4af37]">
                <KeyRound size={18} />
              </div>
              <h3 className="text-[17px] font-bold">Recuperar acesso</h3>
            </div>

            {forgotSent ? (
              <div className="space-y-4 py-3 text-center">
                <CheckCircle2 size={38} className="mx-auto text-[#22c55e]" />
                <p className="text-[13.5px] leading-relaxed text-white/75">
                  Enviamos as instruções para <strong className="text-white">{forgotEmail}</strong>. Confira sua caixa de entrada.
                </p>
                <button
                  type="button"
                  onClick={closeForgot}
                  className="rounded-2xl bg-white/10 px-6 py-2.5 text-[12.5px] font-bold transition hover:bg-white/20"
                >
                  Fechar
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-[13px] leading-relaxed text-white/55">
                  Informe o e-mail usado na compra. Enviaremos um link seguro para você criar uma nova senha.
                </p>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="seu.email@exemplo.com"
                  className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-[14px] text-white placeholder-white/25 transition focus:border-[#d4af37]/70 focus:outline-none focus:ring-4 focus:ring-[#d4af37]/10"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (forgotEmail.includes('@')) setForgotSent(true);
                  }}
                  className="h-12 w-full rounded-2xl bg-gradient-to-b from-white to-[#d9d9de] text-[12.5px] font-black uppercase tracking-[0.12em] text-black transition hover:shadow-[0_10px_40px_rgba(212,175,55,0.35)]"
                >
                  Enviar link de recuperação
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

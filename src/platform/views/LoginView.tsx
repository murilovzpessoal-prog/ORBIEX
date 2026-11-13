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
    <div className="relative flex h-screen w-screen overflow-hidden bg-[#000000] text-white select-none">
      {/* ────────────────────────────────────────────────────────────
          BACKGROUND PARA DISPOSITIVOS MÓVEIS (< MD)
      ──────────────────────────────────────────────────────────── */}
      <div className="md:hidden absolute inset-0 -z-10 overflow-hidden bg-black pointer-events-none">
        <video
          src="/assets/login-animation-orbiex.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="h-full w-full object-cover object-[center_top] opacity-30 select-none pointer-events-none scale-105 [filter:saturate(0.7)_contrast(1.12)_brightness(0.8)]"
        />
        <div className="absolute inset-0 bg-black/35 backdrop-blur-[1.5px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/85 to-black/60" />
      </div>

      {/* ────────────────────────────────────────────────────────────
          COLUNA ESQUERDA: VÍDEO ANIMADO DO PERSONAGEM DOURADO (TELA CHEIA LATERAL + ENQUADRAMENTO NO ROSTO/TOPO)
      ──────────────────────────────────────────────────────────── */}
      <div className="relative hidden h-full w-full md:block md:w-1/2 lg:w-[50%] overflow-hidden bg-black">
        {/* Slot da Imagem / Logo no Canto Superior Esquerdo */}
        <div className="absolute left-8 top-8 z-30 flex items-center gap-3">
          {topLeftImage ? (
            <img
              src={topLeftImage}
              alt="Logo"
              className="h-10 w-auto max-w-[180px] object-contain drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]"
            />
          ) : (
            <div className="flex items-center gap-2.5 rounded-2xl border border-white/15 bg-black/75 px-4 py-2 shadow-[0_8px_32px_rgba(0,0,0,0.85)] backdrop-blur-xl transition hover:border-[var(--mvz-gold)]/40">
              <Logo size={26} />
              <span className="text-[13px] font-black uppercase tracking-[0.18em] text-white">
                ORBIEX
              </span>
            </div>
          )}
        </div>

        {/* Vídeo com tratamento de cor cinematográfico (saturação reduzida para ouro champagne + contraste profundo que elimina blocos de compressão nos tons escuros) */}
        <video
          src="/assets/login-animation-orbiex.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="h-full w-full object-cover object-top select-none pointer-events-none [filter:saturate(0.7)_contrast(1.14)_brightness(0.8)]"
        />

        {/* Camada 1: Película Fosca Escura Suave (suaviza os pixels do vídeo e aplica acabamento fosco escuro de cinema) */}
        <div className="pointer-events-none absolute inset-0 bg-black/30 backdrop-blur-[1.2px]" />

        {/* Camada 2: Vinheta Óptica Suave (foca a luz no rosto e peitoral e escurece bordas com baixa resolução) */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_45%_32%,transparent_25%,rgba(0,0,0,0.65)_100%)]" />

        {/* Camada 3: Micro-Textura de Película 4K (engana o olho substituindo o serrilhado por granulação fina nativa da tela) */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.14] mix-blend-overlay"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.18) 1px, transparent 0)',
            backgroundSize: '3px 3px',
          }}
        />

        {/* Gradientes de Fusão Invisível com o Fundo Preto */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-72 bg-gradient-to-r from-transparent via-black/60 to-black" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black via-black/50 to-transparent" />
      </div>

      {/* ────────────────────────────────────────────────────────────
          COLUNA DIREITA: FORMULÁRIO DE LOGIN / CADASTRO
      ──────────────────────────────────────────────────────────── */}
      <div className="relative flex h-full w-full items-center justify-center bg-black px-6 sm:px-10 md:w-1/2 lg:w-[50%] lg:px-14">
        {/* Glow de fundo sutil */}
        <div className="pointer-events-none absolute h-96 w-96 rounded-full bg-[var(--mvz-gold)]/5 blur-[120px]" />

        <div className="relative z-10 w-full max-w-[420px] rounded-3xl border border-white/10 bg-[#0d0c0e]/85 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.85)] backdrop-blur-xl sm:p-9">
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

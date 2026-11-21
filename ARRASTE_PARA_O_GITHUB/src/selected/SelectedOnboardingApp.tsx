import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Sliders, RotateCcw, Unlock, Link2, Check, X, ArrowUpRight } from 'lucide-react';
import { SELECTED_PAGE_CONFIG } from './config';
import { VslCinemaPlayer } from './VslCinemaPlayer';
import { ManagerRoulette, type StoredAllocation } from './ManagerRoulette';
import { executiveAudio } from './soundEngine';
import { copyText as copyToClipboard } from '../platform/clipboard';

const STORAGE_KEYS = {
  PROTOCOL: 'alpine_selected_protocol_v5',
  UNLOCKED: 'alpine_selected_vsl_unlocked_v5',
  ALLOCATION: 'alpine_selected_allocation_v5',
};

function parseCombinedQueryParams(): URLSearchParams {
  if (typeof window === 'undefined') return new URLSearchParams();
  const merged = new URLSearchParams(window.location.search);
  const hash = window.location.hash;
  const qIndex = hash.indexOf('?');
  if (qIndex !== -1) {
    const hashParams = new URLSearchParams(hash.slice(qIndex + 1));
    hashParams.forEach((val, key) => {
      if (!merged.has(key)) merged.set(key, val);
    });
  }
  return merged;
}

function getOrCreateProtocolCode(): string {
  try {
    const existing = localStorage.getItem(STORAGE_KEYS.PROTOCOL);
    if (existing) return existing;
    const digits = Math.floor(1000 + Math.random() * 9000);
    const suffix = String.fromCharCode(65 + Math.floor(Math.random() * 26));
    const created = `ALP-${digits}${suffix}`;
    localStorage.setItem(STORAGE_KEYS.PROTOCOL, created);
    return created;
  } catch {
    return 'ALP-8940X';
  }
}

export default function SelectedOnboardingApp() {
  const config = SELECTED_PAGE_CONFIG;
  const rouletteAnchorRef = useRef<HTMLDivElement | null>(null);

  const queryParams = useMemo(() => parseCombinedQueryParams(), []);

  const candidateName = useMemo(() => {
    const raw = queryParams.get('nome') || queryParams.get('name') || '';
    return raw.trim();
  }, [queryParams]);

  const urlManagerOverride = useMemo(() => {
    return (queryParams.get('g') || queryParams.get('gerente') || '').trim();
  }, [queryParams]);

  const isAdminPreview = useMemo(() => {
    return queryParams.get('admin') === '1' || queryParams.get('preview') === '1';
  }, [queryParams]);

  const [protocolCode] = useState<string>(getOrCreateProtocolCode);

  const [isRouletteVisible, setIsRouletteVisible] = useState<boolean>(() => {
    try {
      return (
        localStorage.getItem(STORAGE_KEYS.UNLOCKED) === 'true' ||
        Boolean(localStorage.getItem(STORAGE_KEYS.ALLOCATION))
      );
    } catch {
      return false;
    }
  });

  const [storedAllocation, setStoredAllocation] = useState<StoredAllocation | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ALLOCATION);
      return raw ? (JSON.parse(raw) as StoredAllocation) : null;
    } catch {
      return null;
    }
  });

  const [adminOpen, setAdminOpen] = useState(true);
  const [linkLeadName, setLinkLeadName] = useState('');
  const [linkManagerId, setLinkManagerId] = useState(config.roulette.targetManagerId);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    const prevTitle = document.title;
    document.title = 'Alpine Project';

    const existingLinks = Array.from(
      document.querySelectorAll<HTMLLinkElement>('link[rel*="icon"]')
    );
    const savedAttrs = existingLinks.map((el) => ({
      rel: el.getAttribute('rel') || 'icon',
      type: el.getAttribute('type'),
      href: el.getAttribute('href') || '',
    }));

    existingLinks.forEach((el) => el.remove());

    const freshIcon = document.createElement('link');
    freshIcon.rel = 'icon';
    freshIcon.type = 'image/png';
    freshIcon.href = `/assets/selected/alpine-icon-transparent.png?v=${Date.now()}`;
    document.head.appendChild(freshIcon);

    return () => {
      document.title = prevTitle;
      freshIcon.remove();
      savedAttrs.forEach(({ rel, type, href }) => {
        const restored = document.createElement('link');
        restored.rel = rel;
        if (type) restored.type = type;
        restored.href = href;
        document.head.appendChild(restored);
      });
    };
  }, []);

  const handleReachRevealPoint = useCallback(() => {
    setIsRouletteVisible((prev) => {
      if (!prev) {
        executiveAudio.playUnlockChime();
        try {
          localStorage.setItem(STORAGE_KEYS.UNLOCKED, 'true');
        } catch {}
      }
      return true;
    });
  }, []);

  const handleAllocationComplete = useCallback((allocation: StoredAllocation) => {
    try {
      localStorage.setItem(STORAGE_KEYS.ALLOCATION, JSON.stringify(allocation));
    } catch {}
    setStoredAllocation(allocation);
  }, []);

  const scrollToRoulette = useCallback(() => {
    window.setTimeout(() => {
      rouletteAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, []);

  const handleAdminUnlockNow = () => {
    setIsRouletteVisible(true);
    try {
      localStorage.setItem(STORAGE_KEYS.UNLOCKED, 'true');
    } catch {}
    executiveAudio.playUnlockChime();
    scrollToRoulette();
  };

  const handleAdminResetSpin = () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.ALLOCATION);
      localStorage.removeItem(STORAGE_KEYS.UNLOCKED);
    } catch {}
    setStoredAllocation(null);
    setIsRouletteVisible(false);
  };

  const handleCopyCandidateLink = () => {
    if (typeof window === 'undefined') return;
    const base = `${window.location.origin}/selecionado`;
    const p = new URLSearchParams();
    if (linkLeadName.trim()) p.set('nome', linkLeadName.trim());
    if (linkManagerId && linkManagerId !== config.roulette.targetManagerId) {
      p.set('g', linkManagerId);
    }
    const finalUrl = p.toString() ? `${base}?${p.toString()}` : base;
    try {
      copyToClipboard(finalUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {}
  };

  const effectiveTargetManagerId = useMemo(() => {
    if (urlManagerOverride && config.managers.some((m) => m.id === urlManagerOverride)) {
      return urlManagerOverride;
    }
    return config.roulette.targetManagerId;
  }, [urlManagerOverride, config.managers, config.roulette.targetManagerId]);

  const effectiveMode = urlManagerOverride ? 'fixed' : config.roulette.mode;

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEYS.ALLOCATION) && storedAllocation) {
        setStoredAllocation(null);
        return;
      }
      if (!localStorage.getItem(STORAGE_KEYS.UNLOCKED) && !localStorage.getItem(STORAGE_KEYS.ALLOCATION) && isRouletteVisible) {
        setIsRouletteVisible(false);
      }
    } catch {}
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#060608] text-white font-sans antialiased flex flex-col justify-between selection:bg-white/20 selection:text-white">
      {/* Luz ambiente neutra e silenciosa */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-56 left-1/2 -translate-x-1/2 h-[520px] w-[900px] rounded-full bg-white/[0.03] blur-[150px]" />
      </div>

      {/* Header Minimalista */}
      <header className="relative z-20 border-b border-white/[0.06] bg-[#060608]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <img
              src={config.brand.logoUrl}
              alt="Alpine Project"
              className="h-8 sm:h-9 w-auto opacity-95"
            />
            <img
              src={config.brand.wordmarkUrl}
              alt="Alpine Project"
              className="h-4 sm:h-5 w-auto opacity-90"
            />
          </div>

          <div className="flex items-center">
            <a
              href={config.brand.membersAreaUrl}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.04] px-3.5 py-2 text-[12px] font-medium text-white hover:bg-white/[0.09] hover:border-white/25 transition"
            >
              <span>Área de Membros</span>
              <ArrowUpRight size={14} className="text-zinc-400" />
            </a>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="relative z-10 mx-auto w-full max-w-5xl flex-1 px-5 pt-12 pb-24 sm:px-8 sm:pt-16">
        {/* Hero Editorial e Direto */}
        <div className="alp-rise mx-auto max-w-2xl text-center">
          <span className="text-[11px] font-semibold uppercase tracking-[0.26em] text-zinc-500">
            Alpine Project
          </span>

          <h1 className="mt-3 text-[30px] sm:text-[42px] lg:text-[46px] font-bold leading-[1.12] tracking-tight text-white [text-wrap:balance]">
            Parabéns{candidateName ? `, ${candidateName}` : ''}, você foi selecionado para o projeto.
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-[14.5px] sm:text-[15.5px] leading-relaxed text-zinc-400 [text-wrap:balance]">
            Assista ao vídeo abaixo com atenção até o final para liberar os seus próximos passos dentro do projeto.
          </p>
        </div>

        {/* 1. Vídeo de Orientação (VSL) */}
        <div className="alp-rise mt-10" style={{ animationDelay: '80ms' }}>
          <VslCinemaPlayer
            videoUrl={config.vsl.videoUrl}
            embedHtml={config.vsl.embedHtml}
            posterUrl={config.vsl.posterUrl}
            revealWhenRemainingSeconds={config.vsl.revealWhenRemainingSeconds}
            lockScrubber={config.vsl.lockScrubber}
            isUnlocked={isRouletteVisible}
            onReachRevealPoint={handleReachRevealPoint}
          />
        </div>

        {/* 2. Seção da Roleta — APARECE SOMENTE QUANDO FALTAR 1 MINUTO PARA A VSL ACABAR */}
        {isRouletteVisible && (
          <div ref={rouletteAnchorRef} className="alp-rise scroll-mt-20">
            <div className="my-16 sm:my-20 flex justify-center">
              <div className="h-12 w-[1px] bg-gradient-to-b from-white/20 to-transparent" />
            </div>

            <ManagerRoulette
              managers={config.managers}
              mode={effectiveMode}
              targetManagerId={effectiveTargetManagerId}
              allowedManagerIds={config.roulette.allowedManagerIds}
              spinDurationMs={config.roulette.spinDurationMs}
              isUnlocked={true}
              remainingSeconds={0}
              protocolCode={protocolCode}
              candidateName={candidateName || undefined}
              whatsappMessageTemplate={config.whatsappMessageTemplate}
              membersAreaUrl={config.brand.membersAreaUrl}
              storedAllocation={storedAllocation}
              onAllocationComplete={handleAllocationComplete}
            />
          </div>
        )}
      </main>

      {/* Rodapé Discreto */}
      <footer className="relative z-10 border-t border-white/[0.05] py-8 text-center">
        <p className="text-[11.5px] text-zinc-600">
          © {new Date().getFullYear()} Alpine Project • Ambiente restrito a membros aprovados.
        </p>
      </footer>

      {/* Painel de Teste do Diretor (Visível SOMENTE em ?admin=1) */}
      {isAdminPreview && (
        <div className="fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] max-w-xs">
          {!adminOpen ? (
            <button
              type="button"
              onClick={() => setAdminOpen(true)}
              className="ml-auto flex items-center gap-2 rounded-full border border-white/15 bg-[#111115]/95 px-4 py-2 text-[12px] font-medium text-white shadow-2xl backdrop-blur-xl"
            >
              <Sliders size={13} />
              <span>Modo Diretor</span>
            </button>
          ) : (
            <div className="rounded-2xl border border-white/15 bg-[#0e0e12]/95 p-4 shadow-[0_25px_70px_rgba(0,0,0,0.95)] backdrop-blur-2xl">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5">
                <span className="text-[11.5px] font-semibold text-white">
                  Modo Diretor (apenas você vê)
                </span>
                <button
                  type="button"
                  onClick={() => setAdminOpen(false)}
                  className="text-zinc-500 hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleAdminUnlockNow}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.06] px-2.5 py-2 text-[11px] font-medium text-white hover:bg-white/10 transition"
                >
                  <Unlock size={12} />
                  <span>Mostrar Roleta</span>
                </button>

                <button
                  type="button"
                  onClick={handleAdminResetSpin}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.06] px-2.5 py-2 text-[11px] font-medium text-white hover:bg-white/10 transition"
                >
                  <RotateCcw size={12} />
                  <span>Ocultar / Resetar</span>
                </button>
              </div>

              <div className="mt-3.5 space-y-2 border-t border-white/[0.08] pt-3">
                <input
                  type="text"
                  value={linkLeadName}
                  onChange={(e) => setLinkLeadName(e.target.value)}
                  placeholder="Nome do aprovado (opcional)"
                  className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-[12px] text-white placeholder:text-zinc-500 focus:border-white/30 focus:outline-none"
                />

                <select
                  value={linkManagerId}
                  onChange={(e) => setLinkManagerId(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-[12px] text-white focus:border-white/30 focus:outline-none"
                >
                  {config.managers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleCopyCandidateLink}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-white px-3 py-2 text-[11.5px] font-semibold text-black hover:bg-zinc-200 transition"
                >
                  {copiedLink ? <Check size={13} /> : <Link2 size={13} />}
                  <span>{copiedLink ? 'Link copiado' : 'Copiar link personalizado'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

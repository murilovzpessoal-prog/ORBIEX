import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Lock, ArrowUpRight } from 'lucide-react';
import type { ExecutiveManager } from './config';
import { executiveAudio } from './soundEngine';

export interface StoredAllocation {
  managerId: string;
  protocolCode: string;
  allocatedAtIso: string;
}

interface ManagerRouletteProps {
  managers: ExecutiveManager[];
  mode: 'fixed' | 'controlled_list';
  targetManagerId: string;
  allowedManagerIds: string[];
  spinDurationMs: number;
  isUnlocked: boolean;
  remainingSeconds: number;
  protocolCode: string;
  candidateName?: string;
  whatsappMessageTemplate: string;
  membersAreaUrl: string;
  storedAllocation: StoredAllocation | null;
  onAllocationComplete: (allocation: StoredAllocation) => void;
}

const CARD_WIDTH = 212;
const CARD_GAP = 16;
const STEP = CARD_WIDTH + CARD_GAP;
const REEL_TOTAL_CARDS = 58;
const WINNING_SLOT_INDEX = 47;

function buildWhatsAppUrl(
  manager: ExecutiveManager,
  template: string,
  protocolCode: string,
  candidateName?: string
): string {
  const rawTarget = manager.whatsapp.trim();
  if (/^https?:\/\//i.test(rawTarget)) {
    return rawTarget;
  }

  const cleanPhone = rawTarget.replace(/\D/g, '');
  const nomeBloco = candidateName ? `\nCandidato(a): *${candidateName}*` : '';
  const message = template
    .replace(/\{gerente\}/g, manager.name)
    .replace(/\{protocolo\}/g, protocolCode)
    .replace(/\{nome\}/g, candidateName || 'Selecionado(a)')
    .replace(/\{nome_bloco\}/g, nomeBloco);

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export const ManagerRoulette: React.FC<ManagerRouletteProps> = ({
  managers,
  mode,
  targetManagerId,
  allowedManagerIds,
  spinDurationMs,
  isUnlocked,
  remainingSeconds,
  protocolCode,
  candidateName,
  whatsappMessageTemplate,
  membersAreaUrl,
  storedAllocation,
  onAllocationComplete,
}) => {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const pointerRef = useRef<HTMLDivElement | null>(null);
  const dossierRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const [isSpinning, setIsSpinning] = useState(false);
  const [activeSlotIndex, setActiveSlotIndex] = useState<number>(2);

  const chosenWinner = useMemo<ExecutiveManager>(() => {
    if (storedAllocation) {
      const found = managers.find((m) => m.id === storedAllocation.managerId);
      if (found) return found;
    }

    if (mode === 'controlled_list' && allowedManagerIds.length > 0) {
      const pool = managers.filter((m) => allowedManagerIds.includes(m.id));
      if (pool.length > 0) {
        const seed = protocolCode
          .split('')
          .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
        return pool[seed % pool.length];
      }
    }

    return managers.find((m) => m.id === targetManagerId) || managers[0];
  }, [storedAllocation, managers, mode, allowedManagerIds, targetManagerId, protocolCode]);

  const reelCards = useMemo<ExecutiveManager[]>(() => {
    if (managers.length === 0) return [];

    const list: ExecutiveManager[] = [];
    for (let i = 0; i < REEL_TOTAL_CARDS; i++) {
      if (i === WINNING_SLOT_INDEX) {
        list.push(chosenWinner);
        continue;
      }

      const prevId = i > 0 ? list[i - 1].id : null;
      const avoidWinnerToo =
        i === 2 || i === WINNING_SLOT_INDEX - 1 || i === WINNING_SLOT_INDEX + 1;

      let pick = managers[(i * 2 + 2) % managers.length];
      for (let step = 0; step < managers.length; step++) {
        const candidate = managers[(i * 2 + 2 + step) % managers.length];
        if (candidate.id !== prevId && (!avoidWinnerToo || candidate.id !== chosenWinner.id)) {
          pick = candidate;
          break;
        }
      }
      list.push(pick);
    }
    return list;
  }, [managers, chosenWinner]);

  const getTranslateForIndex = useCallback((slotIndex: number) => {
    const vw = viewportRef.current?.clientWidth || 860;
    const cardCenter = slotIndex * STEP + CARD_WIDTH / 2;
    return vw / 2 - cardCenter;
  }, []);

  useEffect(() => {
    if (isSpinning) return;
    const targetIdx = storedAllocation ? WINNING_SLOT_INDEX : 2;
    setActiveSlotIndex(targetIdx);

    const applyPosition = () => {
      if (!trackRef.current || isSpinning) return;
      const x = getTranslateForIndex(targetIdx);
      trackRef.current.style.transform = `translate3d(${x}px, 0, 0)`;
    };

    applyPosition();
    window.addEventListener('resize', applyPosition);
    return () => window.removeEventListener('resize', applyPosition);
  }, [storedAllocation, isSpinning, getTranslateForIndex]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const handleStartSpin = () => {
    if (!isUnlocked || isSpinning || storedAllocation) return;

    executiveAudio.warmup();
    setIsSpinning(true);

    const startX = getTranslateForIndex(2);
    const finalCenterX = getTranslateForIndex(WINNING_SLOT_INDEX);
    const startTime = performance.now();
    const duration = Math.max(4500, spinDurationMs);
    let lastTickSlot = 2;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);

      const easeOut = 1 - Math.pow(1 - t, 5);
      const currentX = startX + (finalCenterX - startX) * easeOut;

      if (trackRef.current) {
        trackRef.current.style.transform = `translate3d(${currentX}px, 0, 0)`;
      }

      const vw = viewportRef.current?.clientWidth || 860;
      const currentSlot = Math.round((vw / 2 - currentX - CARD_WIDTH / 2) / STEP);

      if (currentSlot !== lastTickSlot && currentSlot >= 0 && currentSlot < REEL_TOTAL_CARDS) {
        lastTickSlot = currentSlot;
        setActiveSlotIndex(currentSlot);
        executiveAudio.playReelTick(t);

        if (pointerRef.current) {
          pointerRef.current.animate(
            [
              { transform: 'translateX(-50%) rotate(-10deg)' },
              { transform: 'translateX(-50%) rotate(0deg)' },
            ],
            { duration: Math.min(160, 65 + t * 120), easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
          );
        }
      }

      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        if (trackRef.current) {
          trackRef.current.style.transform = `translate3d(${finalCenterX}px, 0, 0)`;
        }
        setActiveSlotIndex(WINNING_SLOT_INDEX);
        setIsSpinning(false);
        executiveAudio.playRevealChord();

        const allocation: StoredAllocation = {
          managerId: chosenWinner.id,
          protocolCode,
          allocatedAtIso: new Date().toISOString(),
        };
        onAllocationComplete(allocation);

        window.setTimeout(() => {
          dossierRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 400);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
  };

  const isAllocated = Boolean(storedAllocation);
  const activeProtocol = storedAllocation?.protocolCode || protocolCode;
  const managerFirstName = chosenWinner.name.split(' ')[0];
  const whatsappHref = buildWhatsAppUrl(
    chosenWinner,
    whatsappMessageTemplate,
    activeProtocol,
    candidateName
  );

  return (
    <section aria-label="Designação de Gerente" className="mx-auto w-full max-w-4xl">
      {/* Título Limpo e Direto */}
      <div className="mb-7 text-center">
        <span className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
          Acompanhamento Individual
        </span>
        <h2 className="mt-2 text-[26px] sm:text-[32px] font-bold tracking-tight text-white">
          Quem vai te acompanhar de perto
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-[14px] text-zinc-400 leading-relaxed">
          Gire abaixo para descobrir qual gerente do nosso time vai conduzir os seus primeiros passos dentro do projeto.
        </p>
      </div>

      {/* Câmara Minimalista de Alocação */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.09] bg-[#0a0a0d] p-4 sm:p-6 shadow-[0_24px_80px_rgba(0,0,0,0.8)]">
        {/* Viewport da Fita */}
        <div
          ref={viewportRef}
          className="relative h-[248px] w-full overflow-hidden rounded-xl border border-white/[0.06] bg-[#060608]"
        >
          {/* Vignettes Laterais Escuras */}
          <div
            className="pointer-events-none absolute inset-y-0 left-0 z-20 w-20 sm:w-40"
            style={{
              background: 'linear-gradient(to right, #060608 0%, rgba(6,6,8,0.85) 45%, transparent 100%)',
            }}
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 z-20 w-20 sm:w-40"
            style={{
              background: 'linear-gradient(to left, #060608 0%, rgba(6,6,8,0.85) 45%, transparent 100%)',
            }}
          />

          {/* Indicador Central Arquitetônico (Branco/Prata Minimalista) */}
          {(isUnlocked || isAllocated) && (
            <>
              <div className="pointer-events-none absolute inset-y-0 left-1/2 z-20 w-[1px] -translate-x-1/2 bg-gradient-to-b from-white/70 via-white/15 to-white/70" />

              <div
                className={`pointer-events-none absolute top-1/2 left-1/2 z-20 h-[222px] w-[220px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border transition-all duration-500 ${
                  isAllocated
                    ? 'border-white/55 shadow-[0_0_40px_rgba(255,255,255,0.08)]'
                    : 'border-white/30'
                }`}
              />

              {/* Marcador Superior */}
              <div
                ref={pointerRef}
                className="pointer-events-none absolute top-0 left-1/2 z-30 -translate-x-1/2 origin-top"
              >
                <div
                  className="h-0 w-0"
                  style={{
                    borderLeft: '7px solid transparent',
                    borderRight: '7px solid transparent',
                    borderTop: '9px solid #ffffff',
                  }}
                />
              </div>

              {/* Marcador Inferior */}
              <div className="pointer-events-none absolute bottom-0 left-1/2 z-30 -translate-x-1/2">
                <div
                  className="h-0 w-0"
                  style={{
                    borderLeft: '7px solid transparent',
                    borderRight: '7px solid transparent',
                    borderBottom: '9px solid #ffffff',
                  }}
                />
              </div>
            </>
          )}

          {/* Trilho dos Cards */}
          <div
            ref={trackRef}
            className={`flex h-full items-center will-change-transform transition-all duration-700 ${
              !isUnlocked && !isAllocated ? 'blur-[5px] opacity-30' : 'opacity-100'
            }`}
            style={{ gap: `${CARD_GAP}px` }}
          >
            {reelCards.map((mgr, idx) => {
              const isCenter = idx === activeSlotIndex;
              const isWinnerLocked = isAllocated && idx === WINNING_SLOT_INDEX;

              return (
                <div
                  key={`${mgr.id}-${idx}`}
                  style={{ width: `${CARD_WIDTH}px` }}
                  className={`shrink-0 h-[214px] rounded-xl p-4 flex flex-col items-center justify-center text-center border transition-all duration-200 select-none ${
                    isWinnerLocked || (isCenter && (isUnlocked || isSpinning))
                      ? 'bg-[#121217] border-white/25 opacity-100'
                      : 'bg-[#0b0b0f] border-white/[0.05] opacity-45'
                  }`}
                >
                  <div className="h-20 w-20 overflow-hidden rounded-full border border-white/15 bg-black">
                    <img
                      src={mgr.avatar}
                      alt={mgr.name}
                      draggable={false}
                      style={{
                        objectPosition: mgr.avatarPosition || '50% 25%',
                        transform: mgr.avatarScale ? `scale(${mgr.avatarScale})` : undefined,
                      }}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="mt-3.5 w-full">
                    <div className="truncate text-[14px] font-semibold text-white">
                      {mgr.name}
                    </div>
                    <div className="mt-0.5 truncate text-[11.5px] text-zinc-400">
                      {mgr.role}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bloqueio Sóbrio Antes da VSL */}
          {!isUnlocked && !isAllocated && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/60 px-4 text-center backdrop-blur-[2px]">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-[#111115] text-white/80">
                <Lock size={17} />
              </div>
              <p className="mt-3 text-[13px] font-medium text-white/90">
                Disponível após assistir à orientação acima
              </p>
              {remainingSeconds > 0 && (
                <span className="mt-1 text-[11.5px] text-zinc-500">
                  Tempo restante estimado: {remainingSeconds}s
                </span>
              )}
            </div>
          )}
        </div>

        {/* ÚNICO BOTÃO DE AÇÃO (Desaparece assim que o gerente é revelado) */}
        {!isAllocated && (
          <div className="mt-6 flex flex-col items-center">
            <button
              type="button"
              disabled={!isUnlocked || isSpinning}
              onClick={handleStartSpin}
              className={`inline-flex items-center justify-center rounded-xl px-8 py-3.5 text-[13.5px] font-semibold tracking-wide transition-all duration-200 ${
                !isUnlocked
                  ? 'cursor-not-allowed border border-white/[0.06] bg-white/[0.03] text-zinc-500'
                  : isSpinning
                  ? 'cursor-wait border border-white/15 bg-white/10 text-white/80'
                  : 'cursor-pointer bg-white text-black hover:bg-zinc-200 active:scale-[0.99] shadow-[0_8px_30px_rgba(255,255,255,0.12)]'
              }`}
            >
              {!isUnlocked
                ? 'Aguardando conclusão do vídeo'
                : isSpinning
                ? 'Sorteando seu gerente...'
                : 'Descobrir meu gerente'}
            </button>
          </div>
        )}
      </div>

      {/* CARD EXECUTIVO LIMPO DO GERENTE DESIGNADO (Apenas 1 botão direto) */}
      {isAllocated && (
        <div
          ref={dossierRef}
          className="alp-rise mt-6 rounded-2xl border border-white/[0.12] bg-[#0c0c10] p-6 sm:p-8 shadow-[0_28px_90px_rgba(0,0,0,0.85)]"
        >
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
            {/* Retrato Sóbrio */}
            <div className="shrink-0 self-center sm:self-auto">
              <div className="h-28 w-28 sm:h-32 sm:w-32 overflow-hidden rounded-2xl border border-white/15 bg-black">
                <img
                  src={chosenWinner.avatar}
                  alt={chosenWinner.name}
                  style={{
                    objectPosition: chosenWinner.avatarPosition || '50% 25%',
                    transform: chosenWinner.avatarScale ? `scale(${chosenWinner.avatarScale})` : undefined,
                  }}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            {/* Dados & CTA */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 text-[11px] font-semibold uppercase tracking-[0.18em]">
                <span className="inline-flex items-center gap-1.5 text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Sua Gerente no Projeto • Online agora
                </span>
              </div>

              <h3 className="mt-2 text-[26px] sm:text-[30px] font-bold tracking-tight text-white">
                {chosenWinner.name}
              </h3>
              <p className="text-[13.5px] font-medium text-zinc-400">
                {chosenWinner.role} • Alpine Project
              </p>

              <div className="mt-4 space-y-2 text-[14px] leading-relaxed max-w-2xl">
                <p className="font-medium text-white/95">
                  Parabéns pela aprovação{candidateName ? `, ${candidateName}` : ''}! A partir de agora, sou eu quem vai caminhar junto com você aqui dentro do Alpine Project.
                </p>
                <p className="text-zinc-400">
                  Já separei o seu direcionamento inicial para você dar os primeiros passos do jeito certo, sem travar e sem perder tempo. Me chama agora no WhatsApp clicando no botão abaixo pra gente começar hoje mesmo.
                </p>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-white px-7 py-3.5 text-[13.5px] font-semibold text-black hover:bg-zinc-200 active:scale-[0.99] transition-all shadow-[0_8px_30px_rgba(255,255,255,0.12)]"
                >
                  <span>Falar com {managerFirstName} no WhatsApp</span>
                  <ArrowUpRight size={16} />
                </a>

                <a
                  href={membersAreaUrl}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-6 py-3.5 text-[13.5px] font-medium text-white hover:bg-white/[0.09] hover:border-white/25 active:scale-[0.99] transition-all"
                >
                  <span>Acessar Área de Membros Alpine</span>
                  <ArrowUpRight size={15} className="text-zinc-400" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

import type { ReactNode } from 'react';
import type { Tone } from './data';

export const TONE: Record<Tone, { hex: string; soft: string; border: string }> = {
  cyan: { hex: '#d4af37', soft: 'rgba(212,175,55,0.10)', border: 'rgba(212,175,55,0.28)' },
  pink: { hex: '#c9803a', soft: 'rgba(201,128,58,0.10)', border: 'rgba(201,128,58,0.28)' },
  violet: { hex: '#ebd28a', soft: 'rgba(235,210,138,0.10)', border: 'rgba(235,210,138,0.28)' },
  green: { hex: '#7fcf9f', soft: 'rgba(127,207,159,0.10)', border: 'rgba(127,207,159,0.28)' },
  amber: { hex: '#f2c94c', soft: 'rgba(242,201,76,0.10)', border: 'rgba(242,201,76,0.28)' },
};

/** Logo oficial Orbiex — Orbe celestial com anel orbital em acabamento de ouro metálico lapidado */
export function Logo({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <div
      className={`relative shrink-0 transition-transform duration-300 group-hover:scale-105 ${className}`}
      style={{ width: size, height: size }}
      aria-label="Orbiex Logo"
    >
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full filter drop-shadow-[0_0_10px_rgba(212,175,55,0.45)]"
      >
        <defs>
          {/* Gradiente 3D esférico do Orbe principal */}
          <radialGradient
            id="orbiexSphereGrad"
            cx="34%"
            cy="32%"
            r="66%"
            fx="28%"
            fy="26%"
          >
            <stop offset="0%" stopColor="#fffdf0" />
            <stop offset="18%" stopColor="#fbe390" />
            <stop offset="42%" stopColor="#d4af37" />
            <stop offset="72%" stopColor="#a37418" />
            <stop offset="92%" stopColor="#634007" />
            <stop offset="100%" stopColor="#3d2603" />
          </radialGradient>

          {/* Gradiente metálico lapidado do anel orbital (crescente) */}
          <linearGradient
            id="orbiexOrbitGrad"
            x1="15%"
            y1="5%"
            x2="85%"
            y2="95%"
          >
            <stop offset="0%" stopColor="#fff8e1" />
            <stop offset="25%" stopColor="#f7dc88" />
            <stop offset="55%" stopColor="#d4af37" />
            <stop offset="85%" stopColor="#aa7b1e" />
            <stop offset="100%" stopColor="#5a3b06" />
          </linearGradient>

          {/* Especular sutil no orbe */}
          <linearGradient
            id="orbiexSpecularGrad"
            x1="20%"
            y1="10%"
            x2="60%"
            y2="60%"
          >
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.65" />
            <stop offset="40%" stopColor="#fff1b8" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          {/* Brilho de profundidade ambiente */}
          <filter id="orbiexGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor="#d4af37" floodOpacity="0.5" />
          </filter>
        </defs>

        {/* ── 1. Orbe Central (Esfera em Ouro 3D) ── */}
        <g>
          {/* Sombra de oclusão sutil */}
          <circle cx="21" cy="24" r="12" fill="#050505" opacity="0.3" />

          {/* Corpo esférico com volume */}
          <circle
            cx="21"
            cy="24"
            r="12"
            fill="url(#orbiexSphereGrad)"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="0.4"
          />

          {/* Brilho especular curvo de lente/reflexo na borda superior esquerda */}
          <ellipse
            cx="17.5"
            cy="19"
            rx="5.5"
            ry="3.5"
            transform="rotate(-28 17.5 19)"
            fill="url(#orbiexSpecularGrad)"
          />
        </g>

        {/* ── 2. Anel Orbital / Lua Crescente (Fiel ao design original da marca) ── */}
        <path
          d="M 23.8 6.8 C 33.6 7.8, 41.5 15.2, 41.5 24 C 41.5 32.8, 33.6 40.2, 23.8 41.2 C 32.2 38.6, 37.8 32, 37.8 24 C 37.8 16, 32.2 9.4, 23.8 6.8 Z"
          fill="url(#orbiexOrbitGrad)"
          stroke="rgba(255,255,255,0.25)"
          strokeWidth="0.3"
          filter="url(#orbiexGlowFilter)"
        />
      </svg>
    </div>
  );
}

export function Pill({ tone = 'cyan', children, className = '' }: { tone?: Tone; children: ReactNode; className?: string }) {
  const t = TONE[tone];
  return (
    <span
      className={`inline-flex items-center rounded-md px-1.5 py-[2px] text-[8.5px] font-bold uppercase tracking-wider ${className}`}
      style={{ color: t.hex, background: t.soft, border: `1px solid ${t.border}` }}
    >
      {children}
    </span>
  );
}

export function IconBox({
  tone,
  children,
  size = 40,
}: {
  tone: Tone;
  children: ReactNode;
  size?: number;
}) {
  const t = TONE[tone];
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-xl"
      style={{
        width: size,
        height: size,
        color: t.hex,
        background: t.soft,
        border: `1px solid ${t.border}`,
        boxShadow: `0 0 24px ${t.soft}`,
      }}
    >
      {children}
    </div>
  );
}

export function Eyebrow({ children, tone = 'cyan' }: { children: ReactNode; tone?: Tone }) {
  return (
    <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: TONE[tone].hex }}>
      {children}
    </span>
  );
}

/** Circular progress / score ring — matches "Progresso geral" in the reference. */
export function Ring({
  value,
  size = 112,
  stroke = 6,
  label,
  color = '#d4af37',
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: ReactNode;
  color?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (Math.min(100, Math.max(0, value)) / 100) * c;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90 overflow-visible">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          style={{ transition: 'stroke-dashoffset 1s ease', filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {label ?? (
          <span className="text-2xl font-bold">
            {Math.round(value)}
            <span className="text-xs text-white/60">%</span>
          </span>
        )}
      </div>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow: string;
  title: ReactNode;
  subtitle: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="mt-2 text-[28px] font-extrabold leading-tight tracking-tight">{title}</h1>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-[var(--mvz-muted)]">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

export function SectionTitle({ icon, children, right }: { icon?: ReactNode; children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2.5 text-[15px] font-bold">
        {icon}
        {children}
      </div>
      {right}
    </div>
  );
}

export function ScoreBadge({ score }: { score: number }) {
  const tone: Tone = score >= 85 ? 'green' : score >= 70 ? 'cyan' : score >= 50 ? 'amber' : 'pink';
  const t = TONE[tone];
  return (
    <span
      className="inline-flex h-7 min-w-[34px] items-center justify-center rounded-lg px-2 text-[12px] font-extrabold"
      style={{ color: t.hex, background: t.soft, border: `1px solid ${t.border}` }}
    >
      {score}
    </span>
  );
}

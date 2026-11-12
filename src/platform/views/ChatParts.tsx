import { Check, Copy } from 'lucide-react';
import { Fragment, useState, type ReactNode } from 'react';
import type { Card } from '../agentBrain';
import { Pill, Ring, ScoreBadge, TONE } from '../ui';

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/* ───────── inline markdown: **bold** and `code` ───────── */
function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**') && p.length > 4)
      return (
        <strong key={i} className="font-semibold text-[#fff7df]">
          {p.slice(2, -2)}
        </strong>
      );
    if (p.startsWith('`') && p.endsWith('`') && p.length > 2)
      return (
        <code key={i} className="rounded-md border border-[var(--mvz-line)] bg-white/[0.05] px-1.5 py-0.5 font-mono text-[12px] text-[var(--mvz-gold-light)]">
          {p.slice(1, -1)}
        </code>
      );
    return <Fragment key={i}>{p}</Fragment>;
  });
}

function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="my-3 overflow-hidden rounded-xl border border-[var(--mvz-line-strong)] bg-[#080705]">
      <div className="flex items-center justify-between border-b border-[var(--mvz-line)] bg-white/[0.025] px-3.5 py-2">
        <span className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-[var(--mvz-gold)]">{lang || 'texto'}</span>
        <button
          onClick={async () => {
            if (await copyText(code)) {
              setDone(true);
              setTimeout(() => setDone(false), 1500);
            }
          }}
          className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--mvz-muted)] hover:text-white"
        >
          {done ? <Check size={12} className="text-[var(--mvz-green)]" /> : <Copy size={12} />}
          {done ? 'Copiado' : 'Copiar'}
        </button>
      </div>
      <pre className="mvz-scroll overflow-x-auto p-4 font-mono text-[12.5px] leading-relaxed text-[#eadfc2]">{code}</pre>
    </div>
  );
}

/** Tiny markdown renderer: headings, bullet/numbered lists, fenced code, bold, inline code. */
export function Rich({ text, streaming }: { text: string; streaming?: boolean }) {
  const lines = text.split('\n');
  const out: ReactNode[] = [];
  let i = 0;
  let k = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) buf.push(lines[i++]);
      i++; // closing fence (or end while streaming)
      out.push(<CodeBlock key={k++} lang={lang} code={buf.join('\n')} />);
      continue;
    }

    if (/^#{1,3}\s/.test(line)) {
      out.push(
        <h4 key={k++} className="mb-1.5 mt-4 text-[14px] font-bold text-[var(--mvz-gold-light)]">
          {inline(line.replace(/^#{1,3}\s/, ''))}
        </h4>,
      );
      i++;
      continue;
    }

    if (/^[-•]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-•]\s/.test(lines[i])) items.push(lines[i++].replace(/^[-•]\s/, ''));
      out.push(
        <ul key={k++} className="my-2 space-y-1.5">
          {items.map((t, j) => (
            <li key={j} className="flex gap-3">
              <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-[var(--mvz-gold)]" />
              <span>{inline(t)}</span>
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) items.push(lines[i++].replace(/^\d+\.\s/, ''));
      out.push(
        <ol key={k++} className="my-2 space-y-2">
          {items.map((t, j) => (
            <li key={j} className="flex gap-3">
              <span className="mt-[2px] flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[rgba(212,175,55,0.12)] text-[11px] font-bold text-[var(--mvz-gold)]">
                {j + 1}
              </span>
              <span>{inline(t)}</span>
            </li>
          ))}
        </ol>,
      );
      continue;
    }

    if (line.trim() === '') {
      i++;
      continue;
    }

    out.push(
      <p key={k++} className="my-2">
        {inline(line)}
      </p>,
    );
    i++;
  }

  return (
    <div className="text-[14px] leading-[1.7] text-[#e6dfcd]">
      {out}
      {streaming && <span className="mvz-cursor ml-0.5 inline-block h-4 w-[7px] translate-y-[3px] rounded-[2px] bg-[var(--mvz-gold)]" />}
    </div>
  );
}

/* ───────── rich result cards shown inside the conversation ───────── */

export function ResultCard({ card, onAsk }: { card: Card; onAsk: (text: string) => void }) {
  if (card.kind === 'list') {
    return (
      <div className="mvz-msg-in my-3 overflow-hidden rounded-2xl border border-[var(--mvz-line-strong)] bg-gradient-to-b from-white/[0.035] to-transparent">
        <div className="flex items-center justify-between border-b border-[var(--mvz-line)] px-4 py-3">
          <span className="text-[12.5px] font-bold">{card.title}</span>
          <Pill tone="green">Atualizado hoje</Pill>
        </div>
        {card.items.map((it, i) => (
          <button
            key={it.name}
            onClick={() => onAsk(`Analise o produto "${it.name}"`)}
            className="flex w-full items-center gap-3 border-b border-[var(--mvz-line)] px-4 py-3 text-left transition last:border-0 hover:bg-white/[0.03]"
          >
            <span className="w-4 text-[11px] font-bold text-[var(--mvz-dim)]">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-semibold">{it.name}</div>
              <div className="text-[11px] text-[var(--mvz-dim)]">{it.meta}</div>
            </div>
            <ScoreBadge score={it.score} />
          </button>
        ))}
        <div className="px-4 py-2.5 text-[11px] text-[var(--mvz-dim)]">Clique em um produto para analisar.</div>
      </div>
    );
  }

  const tone = card.score >= 85 ? TONE.green.hex : card.score >= 60 ? '#d4af37' : '#c9803a';
  return (
    <div className="mvz-msg-in my-3 overflow-hidden rounded-2xl border border-[var(--mvz-line-strong)] bg-gradient-to-br from-[rgba(212,175,55,0.07)] via-transparent to-transparent">
      <div className="flex items-center justify-between border-b border-[var(--mvz-line)] px-4 py-3">
        <span className="text-[12.5px] font-bold">{card.title}</span>
        <Pill tone="cyan">{card.verdict}</Pill>
      </div>
      <div className="grid gap-5 p-4 sm:grid-cols-[130px_1fr]">
        <div className="flex flex-col items-center justify-center">
          <Ring
            value={card.score}
            size={112}
            stroke={7}
            color={tone}
            label={
              <div className="text-center">
                <div className="text-[28px] font-extrabold leading-none">{card.score}</div>
                <div className="mt-1 text-[8.5px] font-bold uppercase tracking-wider text-[var(--mvz-dim)]">de 100</div>
              </div>
            }
          />
          <div className="mt-2 max-w-[130px] truncate text-center text-[11px] text-[var(--mvz-muted)]">{card.subtitle}</div>
        </div>
        <div className="space-y-3 self-center">
          {card.metrics.map((m) => (
            <div key={m.label}>
              <div className="mb-1 flex justify-between text-[11.5px]">
                <span className="text-white/75">{m.label}</span>
                <span className="font-bold">{m.value}</span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-white/[0.07]">
                <div className="h-full rounded-full mvz-grad-bg" style={{ width: `${m.value}%`, transition: 'width 0.9s ease' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 border-t border-[var(--mvz-line)] px-4 py-3">
        <button
          onClick={() => onAsk(`Crie 5 hooks virais para ${card.subtitle}`)}
          className="rounded-lg border border-[var(--mvz-line-strong)] px-3 py-1.5 text-[11.5px] font-semibold text-[var(--mvz-gold-light)] transition hover:bg-[rgba(212,175,55,0.1)]"
        >
          Gerar hooks
        </button>
        <button
          onClick={() => onAsk(`Crie um roteiro de 30s sem aparecer para ${card.subtitle}`)}
          className="rounded-lg border border-[var(--mvz-line-strong)] px-3 py-1.5 text-[11.5px] font-semibold text-[var(--mvz-gold-light)] transition hover:bg-[rgba(212,175,55,0.1)]"
        >
          Criar roteiro
        </button>
        <button
          onClick={() => onAsk(`Monte um plano de 30 dias para escalar ${card.subtitle}`)}
          className="rounded-lg border border-[var(--mvz-line-strong)] px-3 py-1.5 text-[11.5px] font-semibold text-[var(--mvz-gold-light)] transition hover:bg-[rgba(212,175,55,0.1)]"
        >
          Plano de 30 dias
        </button>
      </div>
    </div>
  );
}

import { CornerDownLeft, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ALL_NAV, PROMPTS, type ViewId } from './data';

interface Cmd {
  key: string;
  label: string;
  hint: string;
  icon: (typeof ALL_NAV)[number]['icon'];
  run: () => void;
}

export function CommandPalette({
  open,
  onClose,
  onNavigate,
  onPrompt,
}: {
  open: boolean;
  onClose: () => void;
  onNavigate: (v: ViewId) => void;
  onPrompt: (text: string) => void;
}) {
  const [q, setQ] = useState('');
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ('');
      setIdx(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  const cmds = useMemo<Cmd[]>(() => {
    const pages: Cmd[] = ALL_NAV.map((n) => ({
      key: `nav-${n.id}`,
      label: n.label,
      hint: 'Ir para',
      icon: n.icon,
      run: () => onNavigate(n.id),
    }));
    const prompts: Cmd[] = PROMPTS.map((p) => ({
      key: `p-${p.id}`,
      label: p.title,
      hint: 'Prompt',
      icon: ALL_NAV.find((n) => n.id === 'prompts')!.icon,
      run: () => onPrompt(p.text),
    }));
    return [...pages, ...prompts];
  }, [onNavigate, onPrompt]);

  const results = useMemo(() => {
    const s = q.toLowerCase().trim();
    return (s ? cmds.filter((c) => c.label.toLowerCase().includes(s)) : cmds.filter((c) => c.hint === 'Ir para')).slice(0, 8);
  }, [q, cmds]);

  useEffect(() => setIdx(0), [q]);

  if (!open) return null;

  const exec = (c?: Cmd) => {
    if (!c) return;
    c.run();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/70 px-4 pt-[14vh] backdrop-blur-sm"
      onMouseDown={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Busca rápida"
    >
      <div
        className="mvz-pop w-full max-w-xl overflow-hidden rounded-2xl border border-[var(--mvz-line-strong)] bg-[#0b0a08] shadow-[0_30px_100px_rgba(0,0,0,0.8)]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-[var(--mvz-line)] px-4">
          <Search size={16} className="text-[var(--mvz-dim)]" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
              else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setIdx((i) => Math.min(i + 1, results.length - 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setIdx((i) => Math.max(i - 1, 0));
              } else if (e.key === 'Enter') exec(results[idx]);
            }}
            placeholder="Buscar páginas e prompts…"
            className="h-14 flex-1 bg-transparent text-[14px] outline-none placeholder:text-[var(--mvz-dim)]"
          />
          <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-white/50">ESC</kbd>
        </div>
        <ul className="mvz-scroll max-h-[340px] overflow-y-auto p-2">
          {results.length === 0 && <li className="px-4 py-8 text-center text-[13px] text-[var(--mvz-muted)]">Nada encontrado.</li>}
          {results.map((c, i) => {
            const Icon = c.icon;
            return (
              <li key={c.key}>
                <button
                  onMouseEnter={() => setIdx(i)}
                  onClick={() => exec(c)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] ${i === idx ? 'bg-white/[0.07]' : ''}`}
                >
                  <Icon size={15} className="text-[var(--mvz-muted)]" />
                  <span className="flex-1 truncate font-medium">{c.label}</span>
                  <span className="text-[10.5px] text-[var(--mvz-dim)]">{c.hint}</span>
                  {i === idx && <CornerDownLeft size={12} className="text-white/50" />}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

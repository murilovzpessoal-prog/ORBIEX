import { Search, Bell, Command, Menu, Plus } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { VIEW_TITLES, type ViewId } from './data';
import type { UserProfile } from './ProfileSettingsModal';
import { getInitials } from './ProfileSettingsModal';

export function Topbar({
  view,
  onMenu,
  onSearch,
  onNewChat,
  profile,
  onOpenSettings,
}: {
  view: ViewId;
  onMenu: () => void;
  onSearch: () => void;
  onNewChat: () => void;
  profile?: UserProfile;
  onOpenSettings?: () => void;
}) {
  const btn = useRef<HTMLButtonElement>(null);

  // ⌘K / Ctrl+K opens the command palette
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onSearch();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onSearch]);

  return (
    <header className="sticky top-0 z-30 flex h-[60px] shrink-0 items-center gap-3 border-b border-[var(--mvz-line)] bg-[rgba(5,5,5,0.82)] px-4 backdrop-blur-xl md:px-6">
      <button
        onClick={onMenu}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-white/70 hover:bg-white/5 lg:hidden"
        aria-label="Abrir menu"
      >
        <Menu size={18} />
      </button>

      <button
        ref={btn}
        onClick={onSearch}
        className="mvz-input flex h-10 w-full max-w-[520px] items-center gap-2.5 px-3.5 text-left text-[13px] text-[var(--mvz-dim)]"
      >
        <Search size={15} />
        <span className="flex-1 truncate">Buscar prompts, produtos…</span>
        <kbd className="hidden items-center gap-0.5 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-semibold text-white/50 sm:flex">
          <Command size={9} />K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-3">
        <span className="hidden text-[13px] font-bold tracking-tight text-white/85 sm:block mr-2.5">
          {VIEW_TITLES[view]}
        </span>
        {view === 'agent' && (
          <button
            onClick={onNewChat}
            className="mvz-btn-grad hidden h-9 items-center gap-1.5 px-4 text-[13px] font-bold sm:flex shadow-md"
          >
            <Plus size={15} strokeWidth={2.4} /> Nova conversa
          </button>
        )}
        <button className="relative flex h-9 w-9 items-center justify-center rounded-full text-white/70 hover:bg-white/5" aria-label="Notificações">
          <Bell size={17} />
          <span className="absolute right-[9px] top-[8px] h-1.5 w-1.5 rounded-full bg-[var(--mvz-pink)] shadow-[0_0_8px_var(--mvz-pink)]" />
        </button>
        <button
          onClick={onOpenSettings}
          className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-gradient-to-br from-[#d4af37]/30 to-[#c9803a]/30 text-[12px] font-bold text-white transition-all hover:scale-105 hover:border-[var(--mvz-gold)] shadow-[0_0_12px_rgba(212,175,55,0.2)]"
          title="Configurações de Perfil"
          aria-label="Configurações de Perfil"
        >
          {profile?.avatarUrl ? (
            <img src={profile.avatarUrl} alt={profile.name} className="h-full w-full object-cover" />
          ) : (
            <span>{getInitials(profile?.name || 'murilo vaz')}</span>
          )}
        </button>
      </div>
    </header>
  );
}

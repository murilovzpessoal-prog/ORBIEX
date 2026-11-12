import { LogOut, Settings, X } from 'lucide-react';
import { Fragment } from 'react';
import { NAV_FOOTER, NAV_GROUPS, type NavItem, type ViewId } from './data';
import { Logo, Pill } from './ui';
import type { UserProfile } from './ProfileSettingsModal';
import { getInitials } from './ProfileSettingsModal';

function Item({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`group relative flex h-10 w-full items-center gap-3 rounded-xl px-3.5 text-[13px] font-medium transition-all duration-200 ${
        active
          ? 'bg-gradient-to-r from-[rgba(212,175,55,0.14)] to-transparent text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
          : 'text-[var(--mvz-muted)] hover:bg-white/[0.035] hover:text-white'
      }`}
    >
      {/* Active Gold Indicator Bar */}
      {active && (
        <span
          className="absolute -left-2.5 top-2 bottom-2 w-[3.5px] rounded-full mvz-grad-bg shadow-[0_0_12px_var(--mvz-gold)]"
        />
      )}

      {/* Item Icon */}
      <Icon
        size={16}
        className={`shrink-0 transition-colors ${
          active ? 'text-[var(--mvz-gold)]' : 'text-[var(--mvz-dim)] group-hover:text-white/80'
        }`}
      />

      {/* Label */}
      <span className="flex-1 truncate text-left tracking-wide">{item.label}</span>

      {/* Badge (NOVO, HOT, AO VIVO, etc.) */}
      {item.badge && <Pill tone={item.badge.tone}>{item.badge.text}</Pill>}
    </button>
  );
}

export function Sidebar({
  view,
  onNavigate,
  open,
  onClose,
  profile,
  onOpenSettings,
  onLogout,
}: {
  view: ViewId;
  onNavigate: (v: ViewId) => void;
  open: boolean;
  onClose: () => void;
  profile?: UserProfile;
  onOpenSettings?: () => void;
  onLogout?: () => void;
}) {
  const go = (v: ViewId) => {
    onNavigate(v);
    onClose();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[252px] shrink-0 flex-col border-r border-[var(--mvz-line)] bg-[var(--mvz-side)] transition-transform duration-300 lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* ── Top Brand Header: com respiro generoso e proporção profissional ── */}
        <div className="flex items-center justify-between px-6 pt-7 pb-6 border-b border-[var(--mvz-line)]/50">
          <button
            onClick={() => go('home')}
            className="group flex items-center gap-3 transition-opacity hover:opacity-95"
            aria-label="Ir para o início"
          >
            <Logo size={38} />
            <div className="leading-tight text-left">
              <div className="text-[17px] font-black tracking-tight text-white group-hover:text-[var(--mvz-gold-light)] transition-colors">
                Orbiex
              </div>
              <div className="mt-0.5 text-[9px] font-extrabold uppercase tracking-[0.24em] mvz-grad-text">
                AI Agent
              </div>
            </div>
          </button>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/50 hover:bg-white/5 hover:text-white lg:hidden"
            aria-label="Fechar menu"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Nav Links Container: espaçamento e centralização balanceados ── */}
        <nav className="mvz-scroll flex-1 overflow-y-auto px-3.5 py-5 flex flex-col justify-between">
          <div className="space-y-4">
            {NAV_GROUPS.map((group, i) => (
              <Fragment key={i}>
                {i > 0 && <div className="mx-2.5 my-3 h-px bg-[var(--mvz-line)]" />}
                <div className="space-y-1">
                  {group.map((item) => (
                    <Item
                      key={item.id}
                      item={item}
                      active={view === item.id}
                      onClick={() => go(item.id)}
                    />
                  ))}
                </div>
              </Fragment>
            ))}
          </div>

          {/* Grupo inferior (Comunidade, Suporte, Ajuda) com divisão clara */}
          <div className="pt-4 mt-2">
            <div className="mx-2.5 mb-3 h-px bg-[var(--mvz-line)]" />
            <div className="space-y-1">
              {NAV_FOOTER.map((item) => (
                <Item
                  key={item.id}
                  item={item}
                  active={view === item.id}
                  onClick={() => go(item.id)}
                />
              ))}
            </div>
          </div>
        </nav>

        {/* ── Bottom User Profile Footer: limpo, com foto ou iniciais e abre o modal de configurações ── */}
        <div className="border-t border-[var(--mvz-line)] p-3.5 mt-auto bg-[#070605] flex items-center gap-2">
          <button
            onClick={onOpenSettings}
            className="group/user flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-[var(--mvz-line)] bg-white/[0.02] p-2.5 text-left transition-all duration-200 hover:border-[var(--mvz-gold)]/60 hover:bg-white/[0.05]"
            title="Abrir Configurações de Perfil"
          >
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#d4af37]/25 to-[#c9803a]/25 text-[11.5px] font-extrabold text-[var(--mvz-gold-light)] border border-[rgba(212,175,55,0.3)] shadow-[0_0_12px_rgba(212,175,55,0.15)] group-hover/user:border-[var(--mvz-gold)]">
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>{getInitials(profile?.name || 'murilo vaz')}</span>
              )}
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-[12.5px] font-extrabold text-white group-hover/user:text-[var(--mvz-gold-light)] transition-colors">
                {profile?.name || 'murilo vaz'}
              </div>
              <div className="mt-0.5 flex items-center gap-1 text-[10px] font-medium text-[var(--mvz-dim)]">
                <Settings size={10} className="text-[var(--mvz-gold)] transition-transform group-hover/user:rotate-45" /> Configurações
              </div>
            </div>
          </button>
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex h-11 w-10 shrink-0 items-center justify-center rounded-2xl border border-[var(--mvz-line)] bg-white/[0.02] text-[var(--mvz-dim)] hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 transition"
              title="Sair da Plataforma"
            >
              <LogOut size={14} />
            </button>
          )}
        </div>
      </aside>
    </>
  );
}

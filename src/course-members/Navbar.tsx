import React, { useMemo, useRef, useState } from 'react';
import {
  Search,
  Bell,
  Award,
  LogOut,
  ChevronDown,
  Camera,
  Trash2,
  X,
  Check,
  Play,
} from 'lucide-react';
import type { Lesson, UserAccount } from './types';

// Recorta a foto em quadrado (centro) e reduz para 256x256, leve para salvar no navegador
function toSquareAvatar(file: File, size = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Falha ao ler a imagem'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Formato de imagem não suportado'));
      img.onload = () => {
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas indisponível'));
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
        resolve(canvas.toDataURL('image/jpeg', 0.88));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

interface NavbarProps {
  user: UserAccount;
  progressPercentage: number;
  completedLessonsCount: number;
  totalLessonsCount: number;
  currentView: 'dashboard' | 'classroom';
  onNavigateHome: () => void;
  onOpenCertificate: () => void;
  onLogout: () => void;
  onChangeAvatar?: (dataUrl: string | null) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  lessons: Lesson[];
  completedLessons: string[];
  onSelectLesson: (lesson: Lesson) => void;
}

const normalize = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

export function Navbar({
  user,
  progressPercentage,
  completedLessonsCount,
  totalLessonsCount,
  currentView,
  onNavigateHome,
  onOpenCertificate,
  onLogout,
  onChangeAvatar,
  searchQuery,
  onSearchChange,
  lessons,
  completedLessons,
  onSelectLesson,
}: NavbarProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  // Busca ignorando maiúsculas e acentos ("modelo" encontra "Módulo")
  const searchResults = useMemo(() => {
    const q = normalize(searchQuery);
    if (!q) return [];
    const terms = q.split(/\s+/);
    return lessons
      .filter((l) => {
        const hay = normalize(`${l.title} ${l.moduleName} ${l.description}`);
        return terms.every((t) => hay.includes(t));
      })
      .sort((a, b) => Number(normalize(b.title).includes(q)) - Number(normalize(a.title).includes(q)))
      .slice(0, 8);
  }, [lessons, searchQuery]);

  const pickLesson = (l: Lesson) => {
    onSearchChange('');
    setSearchOpen(false);
    onSelectLesson(l);
  };

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setProfileOpen(false);
    setAvatarBusy(true);
    try {
      onChangeAvatar?.(await toSquareAvatar(file));
    } catch {
      alert('Não foi possível usar essa imagem. Tente uma foto em JPG ou PNG.');
    } finally {
      setAvatarBusy(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-white/[0.08] bg-[#070709]/95 px-4 sm:px-8 backdrop-blur-xl transition-all">
      {/* Left Links / Navigation */}
      <div className="flex items-center gap-6 sm:gap-7 h-full">
        {/* ── ABAS DE NAVEGAÇÃO INTEGRADAS E PROFISSIONAIS ── */}
        <nav className="flex items-center gap-6 h-full">
          {/* Aba: Módulos do Curso */}
          <button
            type="button"
            onClick={onNavigateHome}
            className={`relative h-16 flex items-center text-[13.5px] tracking-wide transition-all ${
              currentView === 'dashboard'
                ? 'text-white font-black after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-white after:shadow-[0_0_12px_rgba(255,255,255,0.9)]'
                : 'text-white/60 font-semibold hover:text-white hover:bg-white/[0.02] px-2 rounded-lg'
            }`}
          >
            <span>Módulos do Curso</span>
          </button>

          {/* Aba: Certificado Oficial */}
          <button
            type="button"
            onClick={onOpenCertificate}
            className="relative h-16 flex items-center gap-2 text-[13.5px] font-semibold text-white/60 hover:text-white transition-colors group px-2 rounded-lg hover:bg-white/[0.02]"
          >
            <span>Certificado</span>
            <span className="inline-flex items-center rounded-full border border-[var(--mvz-gold)]/40 bg-[var(--mvz-gold)]/10 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-[var(--mvz-gold-light)] group-hover:bg-[var(--mvz-gold)]/20 transition">
              Oficial
            </span>
          </button>
        </nav>
      </div>

      {/* Busca de aulas com resultados instantâneos */}
      <div className="hidden lg:flex items-center w-80 relative">
        <Search size={14} className="absolute left-3.5 text-white/40" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            onSearchChange(e.target.value);
            setSearchOpen(true);
          }}
          onFocus={() => setSearchOpen(true)}
          onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && searchResults[0]) pickLesson(searchResults[0]);
            if (e.key === 'Escape') {
              onSearchChange('');
              setSearchOpen(false);
            }
          }}
          placeholder="Buscar aula ou conteúdo..."
          className="h-9 w-full rounded-xl border border-white/10 bg-black/60 pl-9 pr-8 text-[12px] text-white placeholder-white/30 focus:border-white/40 focus:outline-none transition"
        />
        {searchQuery && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onSearchChange('')}
            aria-label="Limpar busca"
            className="absolute right-2.5 text-white/40 hover:text-white transition"
          >
            <X size={13} />
          </button>
        )}

        {searchOpen && searchQuery.trim() && (
          <div className="absolute left-0 right-0 top-full mt-2 max-h-[420px] overflow-y-auto rounded-2xl border border-white/15 bg-[#0f0e12] p-1.5 shadow-2xl z-50">
            {searchResults.length === 0 ? (
              <div className="px-3 py-4 text-center text-[12px] text-white/45">
                Nenhuma aula encontrada para "{searchQuery.trim()}"
              </div>
            ) : (
              searchResults.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pickLesson(l)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-white/10 transition"
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-[10px] font-black ${
                      completedLessons.includes(l.id)
                        ? 'border-[#22c55e]/40 bg-[#22c55e]/15 text-[#22c55e]'
                        : 'border-white/15 bg-white/[0.04] text-white/70'
                    }`}
                  >
                    {completedLessons.includes(l.id) ? <Check size={12} strokeWidth={3} /> : <Play size={11} fill="currentColor" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[12.5px] font-semibold text-white">{l.title}</span>
                    <span className="block truncate text-[10.5px] text-white/40">
                      {l.moduleName} • Aula {l.number}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Right User Bar */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Progress Pill */}
        <div className="hidden sm:flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-1.5 text-[11.5px]">
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-white transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <span className="font-extrabold text-[var(--mvz-gold-light)]">
            {progressPercentage}%
          </span>
          <span className="text-white/40">
            ({completedLessonsCount}/{totalLessonsCount})
          </span>
        </div>

        {/* Notifications Icon */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] text-white/60 hover:text-white hover:bg-white/10 transition"
            title="Avisos do Curso"
          >
            <Bell size={15} />
            <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
          </button>

          {/* Notifications Dropdown */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-white/15 bg-[#0f0e12] p-4 shadow-2xl backdrop-blur-2xl animate-fade-in z-50">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5 mb-2.5">
                <span className="text-[12px] font-black uppercase tracking-wider text-white">
                  Avisos Recentes
                </span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white/90">
                  2 novos
                </span>
              </div>
              <div className="space-y-2.5 text-[12px]">
                <div className="rounded-xl border border-white/5 bg-black/40 p-2.5">
                  <div className="font-bold text-white mb-0.5">
                    🤖 Utilize a Orbiex (Agente de IA)
                  </div>
                  <p className="text-white/60 text-[11px] leading-snug">
                    Todo membro do Projeto já tem a Orbiex liberada. Utilize a Biblioteca de Prompts e o Material da Orbiex em todas as aulas.
                  </p>
                </div>
                <div className="rounded-xl border border-white/5 bg-black/40 p-2.5">
                  <div className="font-bold text-white mb-0.5">
                    ⚡ 10 Módulos Práticos Liberados
                  </div>
                  <p className="text-white/60 text-[11px] leading-snug">
                    Estilo POV, Bumerangue, Cabide, Plus Size, Mirror No Face, No Face, 1K em 30 Dias, Escala e Oniprompt disponíveis.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar Dropdown */}
        <div className="relative">
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarFile}
          />
          <button
            type="button"
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-1.5 sm:px-3 sm:py-1.5 hover:border-white/30 transition"
          >
            <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-lg bg-white/15 border border-white/20 text-white text-[11px] font-black">
              {avatarBusy ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                getInitials(user.name)
              )}
            </div>
            <div className="hidden sm:block text-left text-[12px] leading-tight">
              <span className="block font-bold text-white truncate max-w-[110px]">
                {user.name}
              </span>
              <span className="block text-[9.5px] font-medium text-[var(--mvz-gold)]">
                Aluno VIP
              </span>
            </div>
            <ChevronDown size={13} className="text-white/40 hidden sm:block" />
          </button>

          {/* Profile Menu */}
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-white/15 bg-[#0f0e12] p-2 shadow-2xl backdrop-blur-2xl animate-fade-in z-50">
              <div className="flex items-center gap-3 px-3 py-2.5 border-b border-white/[0.08] mb-1">
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  title="Trocar foto de perfil"
                  className="group relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/15 border border-white/20 text-white text-[13px] font-black"
                >
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
                  ) : (
                    getInitials(user.name)
                  )}
                  <span className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition group-hover:opacity-100">
                    <Camera size={15} />
                  </span>
                </button>
                <div className="min-w-0">
                  <div className="text-[13px] font-bold text-white truncate">{user.name}</div>
                  <div className="text-[11px] text-white/40 truncate">{user.email}</div>
                  <div className="mt-1 text-[10px] font-extrabold uppercase text-[var(--mvz-gold)] truncate">
                    {user.tier}
                  </div>
                </div>
              </div>

              <div className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-[12px] font-semibold text-white/80 hover:bg-white/10 hover:text-white transition"
                >
                  <Camera size={14} className="text-white/60" />
                  <span>{user.avatarUrl ? 'Trocar foto de perfil' : 'Adicionar foto de perfil'}</span>
                </button>

                {user.avatarUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      onChangeAvatar?.(null);
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-[12px] font-semibold text-white/80 hover:bg-white/10 hover:text-white transition"
                  >
                    <Trash2 size={14} className="text-white/60" />
                    <span>Remover foto</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    onOpenCertificate();
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-[12px] font-semibold text-white/80 hover:bg-white/10 hover:text-white transition"
                >
                  <Award size={14} className="text-white/60" />
                  <span>Meu Certificado</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    onLogout();
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-[12px] font-semibold text-[#ef4444] hover:bg-[#ef4444]/10 transition"
                >
                  <LogOut size={14} />
                  <span>Sair da Conta</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

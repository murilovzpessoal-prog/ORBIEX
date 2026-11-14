import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, Camera, User, Trash2, Check, Sparkles, LogOut } from 'lucide-react';

export interface UserProfile {
  name: string;
  avatarUrl: string | null;
}

export function getInitials(name: string): string {
  if (!name) return 'MV';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return 'MV';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ProfileSettingsModal({
  open,
  onClose,
  profile,
  onSave,
  onLogout,
}: {
  open: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSave: (updated: UserProfile) => void;
  onLogout?: () => void;
}) {
  const [name, setName] = useState(profile.name);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatarUrl);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sincroniza o estado apenas quando o modal abre (não sobrescreve a foto escolhida)
  useEffect(() => {
    if (open) {
      setName(profile.name || 'Membro Orbiex');
      setAvatarUrl(profile.avatarUrl || null);
      setSavedSuccess(false);
      setErrorMsg(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (open) {
      const orig = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = orig;
      };
    }
  }, [open]);

  if (!open || typeof document === 'undefined') return null;

  // Upload + compressão da imagem (robusto: trata erros e formatos não suportados)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Permite escolher o mesmo arquivo novamente
    e.target.value = '';
    if (!file) return;

    const isImage = file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|heic|heif|bmp)$/i.test(file.name);
    if (!isImage) {
      setErrorMsg('Por favor, selecione um arquivo de imagem válido (JPG, PNG, WebP).');
      return;
    }

    setErrorMsg(null);
    setProcessing(true);

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      try {
        const maxDim = 320;
        const minSide = Math.min(img.naturalWidth, img.naturalHeight);
        const startX = (img.naturalWidth - minSide) / 2;
        const startY = (img.naturalHeight - minSide) / 2;

        const canvas = document.createElement('canvas');
        canvas.width = Math.min(minSide, maxDim);
        canvas.height = Math.min(minSide, maxDim);
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('canvas');
        ctx.drawImage(img, startX, startY, minSide, minSide, 0, 0, canvas.width, canvas.height);
        setAvatarUrl(canvas.toDataURL('image/jpeg', 0.85));
      } catch {
        setErrorMsg('Não foi possível processar essa imagem. Tente outra foto em JPG ou PNG.');
      } finally {
        URL.revokeObjectURL(objectUrl);
        setProcessing(false);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setProcessing(false);
      setErrorMsg('Formato de imagem não suportado pelo navegador (ex: HEIC). Envie a foto em JPG ou PNG.');
    };

    img.src = objectUrl;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (processing) return;
    const cleanName = name.trim() || 'Membro Orbiex';
    onSave({
      name: cleanName,
      avatarUrl,
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
  };

  const initials = getInitials(name);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-[var(--mvz-line-strong)] bg-[#0d0c0a] p-6 sm:p-8 shadow-[0_25px_80px_rgba(0,0,0,0.95)] animate-scale-up"
      >
        {/* Glow dourado de fundo */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[var(--mvz-gold)]/10 blur-3xl" />

        {/* Topo: Título + Botão Fechar */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--mvz-gold)]/15 text-[var(--mvz-gold)] border border-[var(--mvz-gold)]/30">
              <User size={16} />
            </div>
            <div>
              <h2 className="text-[16px] font-black text-white tracking-tight">
                Configurações de Perfil
              </h2>
              <p className="text-[11px] text-white/50">
                Personalize sua foto e nome de usuário
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 hover:bg-white/10 hover:text-white transition"
            aria-label="Fechar"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-6 space-y-6">
          {/* ── 1. Seção: Foto de Perfil ── */}
          <div className="flex flex-col items-center justify-center text-center">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              {/* Avatar Box com Borda Metálica */}
              <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border-2 border-[var(--mvz-gold)]/40 bg-gradient-to-br from-[#2a2417] to-[#120f0a] shadow-[0_0_20px_rgba(212,175,55,0.25)] transition-all duration-300 group-hover:border-[var(--mvz-gold)] group-hover:shadow-[0_0_28px_rgba(212,175,55,0.45)]">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-[28px] font-black tracking-wider text-[var(--mvz-gold-light)] select-none">
                    {initials}
                  </span>
                )}

                {/* Overlay ao passar o mouse */}
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 opacity-0 backdrop-blur-[2px] transition-opacity duration-200 group-hover:opacity-100">
                  <Camera size={22} className="text-[var(--mvz-gold-light)] drop-shadow" />
                  <span className="mt-1 text-[9px] font-extrabold uppercase tracking-wider text-white">
                    Trocar
                  </span>
                </div>
              </div>

              {/* Badge indicativo da câmera no canto */}
              <button
                type="button"
                className="absolute -bottom-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-xl bg-[var(--mvz-gold)] text-black shadow-md hover:scale-110 transition-transform"
                title="Subir foto de perfil"
              >
                <Camera size={13} strokeWidth={2.5} />
              </button>
            </div>

            {/* Input escondido para upload de arquivo */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            {/* Botões rápidos de controle da imagem */}
            <div className="mt-3.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.04] px-3 py-1.5 text-[11px] font-bold text-white hover:border-[var(--mvz-gold)]/60 hover:bg-white/[0.08] transition"
              >
                <Upload size={12} className="text-[var(--mvz-gold)]" />
                <span>Subir Foto</span>
              </button>

              {avatarUrl && (
                <button
                  type="button"
                  onClick={() => setAvatarUrl(null)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-[11px] font-bold text-red-400 hover:bg-red-500/20 transition"
                  title="Remover foto personalizada"
                >
                  <Trash2 size={12} />
                  <span>Remover</span>
                </button>
              )}
            </div>

            {errorMsg && (
              <p className="mt-2 text-[11px] font-medium text-red-400">
                {errorMsg}
              </p>
            )}
          </div>

          {/* ── 2. Seção: Nome de Usuário ── */}
          <div className="space-y-2">
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-white/70">
              Nome de Usuário
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Lucas Almeida"
                maxLength={30}
                required
                className="h-11 w-full rounded-xl border border-white/15 bg-black/60 px-4 text-[14px] font-bold text-white placeholder-white/30 transition-all focus:border-[var(--mvz-gold)] focus:bg-black focus:outline-none focus:ring-1 focus:ring-[var(--mvz-gold)]"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-white/30 font-semibold">
                {name.length}/30
              </span>
            </div>
            <p className="text-[10.5px] text-white/40">
              Este nome será exibido na barra superior e no rodapé do sistema.
            </p>
          </div>

          {/* ── 3. Botões de Ação ── */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-11 flex-1 rounded-xl border border-white/10 bg-white/[0.03] text-[12px] font-bold text-white/70 hover:bg-white/[0.07] hover:text-white transition"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={savedSuccess || processing}
              className="mvz-btn-grad flex h-11 flex-1 items-center justify-center gap-2 text-[12px] font-extrabold shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              {savedSuccess ? (
                <>
                  <Check size={15} strokeWidth={3} />
                  <span>Salvo!</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>Salvar Alterações</span>
                </>
              )}
            </button>
          </div>

          {/* ── 4. Botão Desconectar / Sair ── */}
          {onLogout && (
            <div className="border-t border-white/[0.08] pt-3.5 mt-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/[0.06] text-[12px] font-bold text-red-400 hover:border-red-500/40 hover:bg-red-500/15 hover:text-red-300 transition"
              >
                <LogOut size={13} />
                <span>Desconectar e Voltar para o Login</span>
              </button>
            </div>
          )}
        </form>
      </div>
    </div>,
    document.body
  );
}

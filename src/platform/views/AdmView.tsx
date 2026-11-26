import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Check,
  Copy,
  Crown,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Film,
  ImagePlus,
  Link2,
  Loader2,
  Mail,
  Package,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  User,
  UserPlus,
  Users,
  Video,
  Lock,
} from 'lucide-react';
import type { ViewId } from '../data';
import {
  ADMIN_EMAIL,
  buildAdminHeaders,
  isCurrentUserAdmin,
} from '../adminConfig';
import {
  normalizeProductLink,
  useProducts,
} from '../productsStore';
import {
  isImgurPageUrl,
  normalizePromptMediaUrl,
  PROMPT_CATEGORIES,
  resolveRemoteVideoUrl,
  usePrompts,
} from '../promptsStore';
import { PromptVideo } from '../PromptVideo';
import { supabase } from '../../lib/supabaseClient';
import { copyText } from '../clipboard';

interface AdminUserItem {
  email: string;
  name: string;
  status: string;
  platform: string;
  updated_at: string;
}

const PRODUCT_CATEGORIES = [
  'Fitness',
  'Croppeds',
  'Vestidos',
  'Modeladores',
  'Alfaiataria',
  'Moda Praia',
  'Plus Size',
  'Externo',
] as const;

async function compressImageFileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Não foi possível ler a imagem selecionada.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Arquivo inválido ou formato de imagem não suportado.'));
      img.onload = () => {
        const maxSide = 820;
        let { width, height } = img;
        if (width > maxSide || height > maxSide) {
          if (width >= height) {
            height = Math.round((height * maxSide) / width);
            width = maxSide;
          } else {
            width = Math.round((width * maxSide) / height);
            height = maxSide;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result || ''));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.84));
      };
      img.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  });
}

export function AdmView({ onNavigate }: { onNavigate: (v: ViewId) => void }) {
  const isAdmin = isCurrentUserAdmin();
  const {
    products,
    globalProducts,
    hiddenBaseIds,
    loadingGlobal,
    refreshGlobal,
    publishGlobalProduct,
    removeGlobalProduct,
    restoreHiddenBaseProducts,
  } = useProducts();

  const {
    prompts,
    globalPrompts,
    hiddenBaseIds: hiddenBasePromptIds,
    loadingGlobal: loadingGlobalPrompts,
    refreshGlobal: refreshGlobalPrompts,
    publishGlobalPrompt,
    removeGlobalPrompt,
    restoreHiddenBasePrompts,
  } = usePrompts();

  // ── Aba Produto Global ─────────────────────────────────────────────
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodLink, setProdLink] = useState('');
  const [prodImage, setProdImage] = useState('');
  const [prodCategory, setProdCategory] = useState<string>('Fitness');
  const [prodCommission, setProdCommission] = useState('20%');
  const [imageMode, setImageMode] = useState<'upload' | 'url'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [prodBusy, setProdBusy] = useState(false);
  const [prodNotice, setProdNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [deletingProdId, setDeletingProdId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Aba Prompt Global (com Vídeo) ──────────────────────────────────
  const [promptVideoUrl, setPromptVideoUrl] = useState('');
  const [resolvedPreviewUrl, setResolvedPreviewUrl] = useState('');
  const [promptVideoStatus, setPromptVideoStatus] = useState<'idle' | 'resolving' | 'ready' | 'error'>('idle');
  const [promptTitle, setPromptTitle] = useState('');
  const [promptText, setPromptText] = useState('');
  const [promptCategory, setPromptCategory] = useState<string>('Animações');
  const [promptDescription, setPromptDescription] = useState('');
  const [promptBusy, setPromptBusy] = useState(false);
  const [promptNotice, setPromptNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [deletingPromptId, setDeletingPromptId] = useState<string | null>(null);

  // ── Aba Usuário Manual ─────────────────────────────────────────────
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [showUserPwd, setShowUserPwd] = useState(false);
  const [userBusy, setUserBusy] = useState(false);
  const [userNotice, setUserNotice] = useState<{
    ok: boolean;
    text: string;
    creds?: { email: string; password: string };
  } | null>(null);
  const [copiedCreds, setCopiedCreds] = useState(false);

  const [usersList, setUsersList] = useState<AdminUserItem[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [revokingEmail, setRevokingEmail] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    if (!isAdmin) return;
    setUsersLoading(true);
    try {
      try {
        const headers = await buildAdminHeaders();
        const res = await fetch('/api/admin?action=list_users&t=' + Date.now(), {
          headers,
          cache: 'no-store',
        });
        const json = await res.json().catch(() => null);
        if (res.ok && json?.success && Array.isArray(json.users)) {
          setUsersList(json.users);
          return;
        }
      } catch {
        /* fallback Supabase direto */
      }

      const merged = new Map<string, AdminUserItem>();
      const { data: manualRows } = await supabase
        .from('profiles')
        .select('user_email, name, avatar_url, updated_at')
        .like('user_email', 'orbiex_manual_user::%')
        .order('updated_at', { ascending: false })
        .limit(100);

      for (const r of manualRows || []) {
        if (!r?.avatar_url) continue;
        try {
          const parsed = JSON.parse(r.avatar_url);
          if (parsed?.email) {
            const em = String(parsed.email).toLowerCase();
            merged.set(em, {
              email: em,
              name: parsed.name || r.name || em.split('@')[0],
              status: parsed.status || 'approved',
              platform: parsed.platform || 'admin_manual',
              updated_at: r.updated_at || new Date().toISOString(),
            });
          }
        } catch {
          /* ignore */
        }
      }

      const { data: buyers } = await supabase
        .from('authorized_buyers')
        .select('email, name, status, platform, updated_at')
        .order('updated_at', { ascending: false })
        .limit(100);

      for (const b of buyers || []) {
        const em = String(b.email || '').trim().toLowerCase();
        if (!em) continue;
        merged.set(em, {
          email: em,
          name: b.name || merged.get(em)?.name || em.split('@')[0],
          status: b.status || 'approved',
          platform: b.platform || 'cakto',
          updated_at: b.updated_at || new Date().toISOString(),
        });
      }

      setUsersList(Array.from(merged.values()));
    } finally {
      setUsersLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    void loadUsers();
    void refreshGlobal(true);
    void refreshGlobalPrompts(true);
  }, [loadUsers, refreshGlobal, refreshGlobalPrompts]);

  const handleImageFile = async (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setProdNotice({ ok: false, text: 'Selecione apenas arquivos de imagem (JPG, PNG ou WebP).' });
      return;
    }
    try {
      const dataUrl = await compressImageFileToDataUrl(file);
      setProdImage(dataUrl);
      setProdNotice(null);
    } catch (err) {
      setProdNotice({
        ok: false,
        text: err instanceof Error ? err.message : 'Erro ao processar a imagem.',
      });
    }
  };

  const handlePublishProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setProdNotice(null);
    if (!prodImage.trim()) {
      setProdNotice({ ok: false, text: 'Adicione ou cole a imagem do produto antes de publicar.' });
      return;
    }
    if (!prodName.trim() || !prodPrice.trim() || !prodLink.trim()) {
      setProdNotice({ ok: false, text: 'Preencha nome, valor e link do produto.' });
      return;
    }

    setProdBusy(true);
    try {
      const result = await publishGlobalProduct({
        name: prodName,
        image: prodImage,
        price: prodPrice,
        link: prodLink,
        category: prodCategory,
        commissionRate: prodCommission,
      });

      if (!result.ok) {
        setProdNotice({ ok: false, text: result.error || 'Não foi possível publicar o produto.' });
        return;
      }

      setProdNotice({
        ok: true,
        text: `Produto "${result.product?.name}" publicado! Ele já aparece para todos os usuários na aba Produtos.`,
      });
      setProdName('');
      setProdPrice('');
      setProdLink('');
      setProdImage('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } finally {
      setProdBusy(false);
    }
  };

  const handleDeleteGlobalProduct = async (id: string) => {
    setDeletingProdId(id);
    try {
      const res = await removeGlobalProduct(id);
      if (!res.ok) {
        setProdNotice({ ok: false, text: res.error || 'Falha ao remover produto.' });
      }
    } finally {
      setDeletingProdId(null);
    }
  };

  useEffect(() => {
    const raw = promptVideoUrl.trim();
    if (!raw) {
      setResolvedPreviewUrl('');
      setPromptVideoStatus('idle');
      return;
    }

    let cancelled = false;
    const quick = normalizePromptMediaUrl(raw);
    if (!isImgurPageUrl(raw) && !isImgurPageUrl(quick) && !/\.gifv(\?|$)/i.test(raw)) {
      setResolvedPreviewUrl(quick);
      setPromptVideoStatus('idle');
      return;
    }

    setPromptVideoStatus('resolving');
    const timer = setTimeout(() => {
      void resolveRemoteVideoUrl(raw).then((res) => {
        if (cancelled) return;
        if (res.ok && res.mediaUrl && !isImgurPageUrl(res.mediaUrl)) {
          setResolvedPreviewUrl(res.mediaUrl);
          setPromptVideoStatus('idle');
        } else {
          setResolvedPreviewUrl('');
          setPromptVideoStatus('error');
        }
      });
    }, 280);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [promptVideoUrl]);

  const handlePublishPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    setPromptNotice(null);
    if (!promptVideoUrl.trim()) {
      setPromptNotice({ ok: false, text: 'Cole a URL do vídeo hospedado para o card.' });
      return;
    }
    if (!promptTitle.trim() || !promptText.trim()) {
      setPromptNotice({ ok: false, text: 'Preencha o nome do prompt e cole o texto do prompt.' });
      return;
    }

    setPromptBusy(true);
    try {
      const res = await publishGlobalPrompt({
        title: promptTitle,
        mediaUrl: resolvedPreviewUrl || promptVideoUrl,
        prompt: promptText,
        filterCategory: promptCategory,
        description: promptDescription,
        mediaType: 'video',
      });
      if (!res.ok) {
        setPromptNotice({ ok: false, text: res.error || 'Não foi possível publicar o prompt.' });
        return;
      }
      setPromptNotice({
        ok: true,
        text: `Prompt "${res.promptCard?.title}" publicado! O card com vídeo já aparece para todos na Biblioteca de Prompts.`,
      });
      setPromptVideoUrl('');
      setResolvedPreviewUrl('');
      setPromptTitle('');
      setPromptText('');
      setPromptDescription('');
      setPromptVideoStatus('idle');
    } finally {
      setPromptBusy(false);
    }
  };

  const handleDeleteGlobalPrompt = async (id: string) => {
    setDeletingPromptId(id);
    try {
      const res = await removeGlobalPrompt(id);
      if (!res.ok) {
        setPromptNotice({ ok: false, text: res.error || 'Falha ao remover prompt.' });
      }
    } finally {
      setDeletingPromptId(null);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserNotice(null);
    setCopiedCreds(false);

    const cleanEmail = userEmail.trim().toLowerCase();
    const cleanPass = userPassword.trim();
    const cleanName = userName.trim();

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setUserNotice({ ok: false, text: 'Digite um e-mail válido para cadastrar.' });
      return;
    }
    if (cleanPass.length < 3) {
      setUserNotice({ ok: false, text: 'A senha deve ter pelo menos 3 caracteres.' });
      return;
    }

    setUserBusy(true);
    try {
      const headers = await buildAdminHeaders();
      let created = false;
      let createdUser: AdminUserItem | null = null;
      let serverErr = '';

      try {
        const res = await fetch('/api/admin', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            action: 'create_user',
            email: cleanEmail,
            password: cleanPass,
            name: cleanName,
            adminEmail: headers['x-orbiex-admin-email'],
            adminSecret: headers['x-orbiex-admin-secret'],
          }),
        });
        const json = await res.json().catch(() => null);
        if (res.ok && json?.success && json.user) {
          created = true;
          createdUser = json.user;
        } else if (json?.error) {
          serverErr = json.error;
        }
      } catch {
        /* fallback Supabase direto */
      }

      if (!created) {
        const displayName =
          cleanName.length >= 2
            ? cleanName
            : cleanEmail.split('@')[0].replace(/[._-]/g, ' ').trim();
        const nowIso = new Date().toISOString();

        await supabase.from('authorized_buyers').upsert(
          {
            email: cleanEmail,
            name: displayName,
            status: 'approved',
            platform: 'admin_manual',
            updated_at: nowIso,
          },
          { onConflict: 'email' }
        );

        await supabase.from('profiles').upsert(
          {
            user_email: `orbiex_claimed::${cleanEmail}`,
            name: 'claimed',
            avatar_url: JSON.stringify({ claimed: true, at: Date.now() }),
            updated_at: nowIso,
          },
          { onConflict: 'user_email' }
        );

        const { data: rpcData, error: rpcErr } = await supabase.rpc('orbiex_sync_user_account', {
          p_email: cleanEmail,
          p_password: cleanPass,
          p_name: displayName,
        });

        if (rpcErr && serverErr) {
          setUserNotice({ ok: false, text: serverErr || rpcErr.message });
          return;
        }

        if (rpcData?.refunded) {
          setUserNotice({ ok: false, text: 'Este e-mail possui estorno bloqueado no sistema.' });
          return;
        }

        await supabase.from('profiles').upsert(
          {
            user_email: `orbiex_manual_user::${cleanEmail}`,
            name: displayName,
            avatar_url: JSON.stringify({
              email: cleanEmail,
              name: displayName,
              status: 'approved',
              platform: 'admin_manual',
              createdAt: Date.now(),
            }),
            updated_at: nowIso,
          },
          { onConflict: 'user_email' }
        );

        createdUser = {
          email: cleanEmail,
          name: displayName,
          status: 'approved',
          platform: 'admin_manual',
          updated_at: nowIso,
        };
      }

      if (createdUser) {
        setUsersList((prev) => [
          createdUser!,
          ...prev.filter((u) => u.email.toLowerCase() !== createdUser!.email.toLowerCase()),
        ]);
      }

      setUserNotice({
        ok: true,
        text: `Cadastro criado para ${cleanEmail}! O usuário já pode entrar na Orbiex com esse e-mail e senha.`,
        creds: { email: cleanEmail, password: cleanPass },
      });
      setUserName('');
      setUserEmail('');
      setUserPassword('');
    } catch (err) {
      setUserNotice({
        ok: false,
        text: err instanceof Error ? err.message : 'Erro inesperado ao criar usuário.',
      });
    } finally {
      setUserBusy(false);
    }
  };

  const handleRevokeUser = async (targetEmail: string) => {
    const clean = targetEmail.trim().toLowerCase();
    if (!clean || clean === ADMIN_EMAIL) return;
    setRevokingEmail(clean);
    try {
      const headers = await buildAdminHeaders();
      let done = false;
      try {
        const res = await fetch(`/api/admin?email=${encodeURIComponent(clean)}`, {
          method: 'DELETE',
          headers,
        });
        if (res.ok) done = true;
      } catch {
        /* fallback Supabase direto */
      }
      if (!done) {
        const { error: delErr } = await supabase.from('authorized_buyers').delete().ilike('email', clean);
        if (delErr) {
          await supabase
            .from('authorized_buyers')
            .update({ status: 'revoked', updated_at: new Date().toISOString() })
            .ilike('email', clean);
        }
        await supabase.from('profiles').delete().eq('user_email', `orbiex_manual_user::${clean}`);
        await supabase.from('profiles').delete().eq('user_email', `orbiex_claimed::${clean}`);
      }
      setUsersList((prev) => prev.filter((u) => u.email.toLowerCase() !== clean));
      setUserNotice({ ok: true, text: `Acesso de ${clean} revogado/removido.` });
    } finally {
      setRevokingEmail(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="mvz-fade-up mx-auto max-w-lg rounded-3xl border border-red-500/25 bg-[#0e0c0a] p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/15 text-red-400">
          <ShieldCheck size={22} />
        </div>
        <h2 className="mt-4 text-lg font-extrabold text-white">Acesso Exclusivo do Administrador</h2>
        <p className="mt-2 text-sm text-[var(--mvz-muted)]">
          Esta área é liberada apenas para a conta administrativa ({ADMIN_EMAIL}).
        </p>
        <button
          onClick={() => onNavigate('home')}
          className="mvz-btn-grad mt-6 inline-flex h-10 items-center gap-2 px-5 text-xs font-bold"
        >
          Voltar ao Início
        </button>
      </div>
    );
  }

  const filteredUsers = usersList.filter((u) => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return true;
    return u.email.toLowerCase().includes(q) || (u.name || '').toLowerCase().includes(q);
  });

  return (
    <div className="mvz-fade-up pb-12 space-y-7">
      {/* Header do Painel ADM */}
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-[var(--mvz-gold)]/25 bg-gradient-to-br from-[#161108] via-[#0d0c0a] to-[#090807] p-6 sm:flex-row sm:items-center shadow-[0_18px_50px_rgba(0,0,0,0.6)]">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--mvz-gold)]/45 bg-[var(--mvz-gold)]/15 px-3 py-1">
            <Crown size={12} className="text-[var(--mvz-gold)]" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--mvz-gold-light)]">
              Painel ADM • {ADMIN_EMAIL}
            </span>
          </div>
          <h1 className="mt-3 text-[26px] font-extrabold tracking-tight text-white sm:text-[32px]">
            Central do <span className="mvz-grad-text">Administrador</span>
          </h1>
          <p className="mt-1 max-w-2xl text-[13px] text-[var(--mvz-muted)]">
            Publique produtos e prompts em vídeo para todos os membros e cadastre usuários manualmente com liberação imediata.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-2.5 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--mvz-dim)]">Usuários</div>
            <div className="text-lg font-black text-white">{usersList.length}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-2.5 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--mvz-dim)]">Produtos ADM</div>
            <div className="text-lg font-black text-[var(--mvz-gold)]">{globalProducts.length}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-2.5 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--mvz-dim)]">Prompts ADM</div>
            <div className="text-lg font-black text-[var(--mvz-gold)]">{globalPrompts.length}</div>
          </div>
          <button
            onClick={() => onNavigate('products')}
            className="flex h-11 items-center gap-2 rounded-xl border border-[var(--mvz-gold)]/45 bg-[var(--mvz-gold)]/10 px-4 text-xs font-bold text-[var(--mvz-gold-light)] transition hover:bg-[var(--mvz-gold)]/20"
          >
            <Package size={14} />
            <span>Ver Produtos ({products.length})</span>
          </button>
          <button
            onClick={() => onNavigate('prompts')}
            className="flex h-11 items-center gap-2 rounded-xl border border-[var(--mvz-gold)]/45 bg-[var(--mvz-gold)]/10 px-4 text-xs font-bold text-[var(--mvz-gold-light)] transition hover:bg-[var(--mvz-gold)]/20"
          >
            <Film size={14} />
            <span>Ver Prompts ({prompts.length})</span>
          </button>
        </div>
      </div>

      {/* Linha 1: Adicionar Produto Global + Adicionar Prompt Global */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ── 1. ADICIONAR PRODUTO GLOBAL ───────────────────────────── */}
        <section className="flex flex-col rounded-3xl border border-[var(--mvz-line-strong)] bg-[#0d0c0a] p-6 shadow-[0_14px_40px_rgba(0,0,0,0.55)]">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--mvz-gold)]/15 text-[var(--mvz-gold)]">
                <Package size={19} />
              </div>
              <div>
                <h2 className="text-[16px] font-extrabold text-white">Adicionar Produto (Para Todos)</h2>
                <p className="text-[11.5px] text-[var(--mvz-muted)]">
                  Ao publicar, aparece imediatamente na aba Produtos de todos os usuários
                </p>
              </div>
            </div>
          </div>

          {prodNotice && (
            <div
              className={`mt-4 flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-xs font-medium ${
                prodNotice.ok
                  ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-300'
                  : 'border-red-500/35 bg-red-500/10 text-red-300'
              }`}
            >
              <span>{prodNotice.text}</span>
              {prodNotice.ok && (
                <button
                  type="button"
                  onClick={() => onNavigate('products')}
                  className="shrink-0 rounded-lg bg-emerald-500/20 px-2.5 py-1 text-[11px] font-bold text-emerald-200 hover:bg-emerald-500/30"
                >
                  Abrir Produtos
                </button>
              )}
            </div>
          )}

          <form onSubmit={handlePublishProduct} className="mt-5 space-y-4">
            {/* Upload / Dropzone ou Link da Imagem */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-white/75">
                  Imagem do Produto *
                </label>
                <div className="flex rounded-lg border border-white/10 bg-black/50 p-0.5 text-[10.5px] font-semibold">
                  <button
                    type="button"
                    onClick={() => setImageMode('upload')}
                    className={`rounded-md px-2.5 py-1 transition ${
                      imageMode === 'upload' ? 'bg-[var(--mvz-gold)] text-black font-bold' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Subir Imagem
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageMode('url')}
                    className={`rounded-md px-2.5 py-1 transition ${
                      imageMode === 'url' ? 'bg-[var(--mvz-gold)] text-black font-bold' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Colar Link URL
                  </button>
                </div>
              </div>

              {imageMode === 'upload' ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const f = e.dataTransfer.files?.[0];
                    if (f) void handleImageFile(f);
                  }}
                  onPaste={(e) => {
                    const item = Array.from(e.clipboardData.items).find((it) => it.type.startsWith('image/'));
                    const file = item?.getAsFile();
                    if (file) void handleImageFile(file);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed p-4 transition ${
                    isDragging
                      ? 'border-[var(--mvz-gold)] bg-[var(--mvz-gold)]/10'
                      : 'border-white/15 bg-black/45 hover:border-[var(--mvz-gold)]/60 hover:bg-black/60'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void handleImageFile(f);
                    }}
                  />
                  {prodImage ? (
                    <img
                      src={prodImage}
                      alt="Prévia do produto"
                      referrerPolicy="no-referrer"
                      className="h-20 w-16 shrink-0 rounded-xl border border-white/15 object-cover"
                    />
                  ) : (
                    <div className="flex h-20 w-16 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-[var(--mvz-gold)]">
                      <ImagePlus size={22} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-[13px] font-bold text-white">
                      <Upload size={14} className="text-[var(--mvz-gold)]" />
                      <span>{prodImage ? 'Trocar imagem selecionada' : 'Clique ou arraste a foto aqui'}</span>
                    </div>
                    <p className="mt-1 text-[11.5px] text-[var(--mvz-muted)]">
                      JPG, PNG ou WebP direto do computador (também aceita Ctrl+V / Cmd+V).
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <input
                    type="url"
                    value={prodImage}
                    onChange={(e) => setProdImage(e.target.value)}
                    placeholder="https://exemplo.com/foto-produto.jpg"
                    className="mvz-input h-11 flex-1 px-3.5 text-sm text-white"
                  />
                  {prodImage && (
                    <img
                      src={prodImage}
                      alt="Prévia"
                      referrerPolicy="no-referrer"
                      className="h-11 w-11 shrink-0 rounded-xl border border-white/15 object-cover"
                    />
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-white/75">
                Nome do Produto *
              </label>
              <input
                type="text"
                required
                value={prodName}
                onChange={(e) => setProdName(e.target.value)}
                placeholder="Ex: Conjuntinho Canelado Modelador"
                className="mvz-input h-11 w-full px-3.5 text-sm text-white"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-white/75">
                  Valor *
                </label>
                <input
                  type="text"
                  required
                  value={prodPrice}
                  onChange={(e) => setProdPrice(e.target.value)}
                  placeholder="R$ 89,90"
                  className="mvz-input h-11 w-full px-3.5 text-sm text-white"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-white/75">
                  Categoria
                </label>
                <select
                  value={prodCategory}
                  onChange={(e) => setProdCategory(e.target.value)}
                  className="mvz-input h-11 w-full px-3 text-sm text-white"
                >
                  {PRODUCT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-white/75">
                  Comissão
                </label>
                <input
                  type="text"
                  value={prodCommission}
                  onChange={(e) => setProdCommission(e.target.value)}
                  placeholder="20%"
                  className="mvz-input h-11 w-full px-3.5 text-sm text-white"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-white/75">
                Link de Redirecionamento do Produto *
              </label>
              <div className="relative flex items-center">
                <Link2 size={15} className="pointer-events-none absolute left-3.5 text-white/40" />
                <input
                  type="text"
                  required
                  value={prodLink}
                  onChange={(e) => setProdLink(e.target.value)}
                  placeholder="https://vt.tiktok.com/... ou link do produto"
                  className="mvz-input h-11 w-full pl-10 pr-3.5 text-sm text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={prodBusy}
              className="mvz-btn-grad flex h-12 w-full items-center justify-center gap-2 text-xs font-black uppercase tracking-wider shadow-[0_0_25px_rgba(212,175,55,0.28)] disabled:opacity-60"
            >
              {prodBusy ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Publicando no Catálogo Global...</span>
                </>
              ) : (
                <>
                  <Plus size={16} />
                  <span>Publicar Produto para Todos</span>
                </>
              )}
            </button>
          </form>

          {/* Lista de Produtos Globais Publicados */}
          <div className="mt-6 border-t border-white/10 pt-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--mvz-gold-light)]">
                Produtos Publicados pelo ADM ({globalProducts.length})
              </span>
              <div className="flex items-center gap-3">
                {hiddenBaseIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => void restoreHiddenBaseProducts()}
                    className="text-[11px] font-semibold text-amber-300/80 hover:text-amber-200 underline"
                  >
                    Restaurar {hiddenBaseIds.length} padrão excluído(s)
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void refreshGlobal(true)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-white/55 hover:text-white"
                >
                  <RefreshCw size={12} className={loadingGlobal ? 'animate-spin' : ''} />
                  <span>Atualizar</span>
                </button>
              </div>
            </div>

            {globalProducts.length === 0 ? (
              <div className="rounded-2xl border border-white/5 bg-black/30 px-4 py-5 text-center text-xs text-[var(--mvz-dim)]">
                Nenhum produto global adicionado ainda. O próximo que você publicar aparecerá aqui e na aba Produtos de todos.
              </div>
            ) : (
              <div className="mvz-scroll max-h-[260px] space-y-2.5 overflow-y-auto pr-1">
                {globalProducts.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/45 p-2.5"
                  >
                    <img
                      src={p.image}
                      alt={p.name}
                      referrerPolicy="no-referrer"
                      className="h-12 w-10 shrink-0 rounded-xl border border-white/10 object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-bold text-white">{p.name}</div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-[var(--mvz-muted)]">
                        <span className="font-bold text-[var(--mvz-gold-light)]">{p.suggestedPrice}</span>
                        <span>•</span>
                        <span>{p.category}</span>
                        <span>•</span>
                        <a
                          href={normalizeProductLink(p.link)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-white/70 hover:text-[var(--mvz-gold)]"
                        >
                          Link <ExternalLink size={10} />
                        </a>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={deletingProdId === p.id}
                      onClick={() => void handleDeleteGlobalProduct(p.id)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 transition hover:bg-red-500/25 hover:text-white disabled:opacity-50"
                      title="Remover produto global"
                    >
                      {deletingProdId === p.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Trash2 size={13} />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── 2. ADICIONAR PROMPT GLOBAL (COM VÍDEO) ────────────────── */}
        <section className="flex flex-col rounded-3xl border border-[var(--mvz-line-strong)] bg-[#0d0c0a] p-6 shadow-[0_14px_40px_rgba(0,0,0,0.55)]">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--mvz-gold)]/15 text-[var(--mvz-gold)]">
                <Film size={19} />
              </div>
              <div>
                <h2 className="text-[16px] font-extrabold text-white">Adicionar Prompt (Para Todos)</h2>
                <p className="text-[11.5px] text-[var(--mvz-muted)]">
                  Cria um card com vídeo rodando em loop + prompt para todos copiarem
                </p>
              </div>
            </div>
          </div>

          {promptNotice && (
            <div
              className={`mt-4 flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-xs font-medium ${
                promptNotice.ok
                  ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-300'
                  : 'border-red-500/35 bg-red-500/10 text-red-300'
              }`}
            >
              <span>{promptNotice.text}</span>
              {promptNotice.ok && (
                <button
                  type="button"
                  onClick={() => onNavigate('prompts')}
                  className="shrink-0 rounded-lg bg-emerald-500/20 px-2.5 py-1 text-[11px] font-bold text-emerald-200 hover:bg-emerald-500/30"
                >
                  Abrir Prompts
                </button>
              )}
            </div>
          )}

          <form onSubmit={handlePublishPrompt} className="mt-5 space-y-4">
            {/* URL do Vídeo Hospedado + Prévia ao vivo */}
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-white/75">
                URL do Vídeo Hospedado *
              </label>
              <div className="relative flex items-center">
                <Video size={15} className="pointer-events-none absolute left-3.5 text-white/40" />
                <input
                  type="text"
                  required
                  value={promptVideoUrl}
                  onChange={(e) => {
                    setPromptVideoUrl(e.target.value);
                  }}
                  placeholder="https://imgur.com/... ou https://i.imgur.com/seuvideo.mp4"
                  className="mvz-input h-11 w-full pl-10 pr-3.5 text-sm text-white"
                />
              </div>
              <p className="mt-1 text-[11px] text-[var(--mvz-dim)]">
                Pode colar link direto (.mp4/.webm) ou link de vídeo do Imgur, Dropbox ou Google Drive — convertemos para .mp4 automaticamente.
              </p>

              {promptVideoUrl.trim() && (
                <div className="mt-2.5 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/50 p-3">
                  <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-xl border border-white/15 bg-black">
                    {promptVideoStatus === 'resolving' ? (
                      <div className="flex h-full w-full items-center justify-center text-[var(--mvz-gold)]">
                        <Loader2 size={18} className="animate-spin" />
                      </div>
                    ) : promptVideoStatus === 'error' ? (
                      <div className="flex h-full w-full items-center justify-center p-1 text-center text-[10px] text-amber-300/80">
                        Sem prévia
                      </div>
                    ) : (
                      <PromptVideo
                        src={resolvedPreviewUrl || promptVideoUrl}
                        onReady={(finalSrc) => {
                          setPromptVideoStatus('ready');
                          if (finalSrc && finalSrc !== resolvedPreviewUrl) {
                            setResolvedPreviewUrl(finalSrc);
                          }
                        }}
                        onFail={() => setPromptVideoStatus('error')}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 text-[11.5px]">
                    <div
                      className={`font-bold ${
                        promptVideoStatus === 'ready'
                          ? 'text-emerald-300'
                          : promptVideoStatus === 'error'
                          ? 'text-amber-300'
                          : 'text-white'
                      }`}
                    >
                      {promptVideoStatus === 'resolving'
                        ? 'Convertendo link do Imgur para .mp4 direto...'
                        : promptVideoStatus === 'ready'
                        ? 'Vídeo carregado e rodando em loop!'
                        : promptVideoStatus === 'error'
                        ? 'Não foi possível reproduzir este link'
                        : 'Carregando prévia do vídeo...'}
                    </div>
                    <div className="mt-0.5 text-[var(--mvz-muted)]">
                      {promptVideoStatus === 'error'
                        ? 'No Imgur, passe o mouse no vídeo > botão direito > "Copiar endereço do vídeo" (precisa ser o arquivo .mp4, ou álbum público).'
                        : resolvedPreviewUrl && resolvedPreviewUrl !== promptVideoUrl.trim()
                        ? `Link direto detectado: ${resolvedPreviewUrl}`
                        : 'É exatamente assim que o vídeo ficará rodando dentro do card para todos os usuários.'}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-white/75">
                  Nome do Prompt *
                </label>
                <input
                  type="text"
                  required
                  value={promptTitle}
                  onChange={(e) => setPromptTitle(e.target.value)}
                  placeholder="Ex: Transição Mão na Câmera Look Viral"
                  className="mvz-input h-11 w-full px-3.5 text-sm text-white"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-white/75">
                  Categoria
                </label>
                <select
                  value={promptCategory}
                  onChange={(e) => setPromptCategory(e.target.value)}
                  className="mvz-input h-11 w-full px-3 text-sm text-white"
                >
                  {PROMPT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-white/75">
                Prompt (para o usuário copiar) *
              </label>
              <div className="relative">
                <FileText size={15} className="pointer-events-none absolute left-3.5 top-3.5 text-white/40" />
                <textarea
                  rows={4}
                  required
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  placeholder="Cole aqui o prompt completo que ficará no card..."
                  className="mvz-input mvz-scroll w-full resize-y py-3 pl-10 pr-3.5 font-mono text-xs leading-relaxed text-white"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-white/75">
                Descrição curta <span className="font-normal text-white/40">(opcional)</span>
              </label>
              <input
                type="text"
                value={promptDescription}
                onChange={(e) => setPromptDescription(e.target.value)}
                placeholder="Se deixar em branco, o card mostra o início do próprio prompt"
                className="mvz-input h-10 w-full px-3.5 text-xs text-white"
              />
            </div>

            <button
              type="submit"
              disabled={promptBusy}
              className="mvz-btn-grad flex h-12 w-full items-center justify-center gap-2 text-xs font-black uppercase tracking-wider shadow-[0_0_25px_rgba(212,175,55,0.28)] disabled:opacity-60"
            >
              {promptBusy ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Publicando Prompt para Todos...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Publicar Prompt para Todos</span>
                </>
              )}
            </button>
          </form>

          {/* Lista de Prompts Globais Publicados */}
          <div className="mt-6 border-t border-white/10 pt-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--mvz-gold-light)]">
                Prompts Publicados pelo ADM ({globalPrompts.length})
              </span>
              <div className="flex items-center gap-3">
                {hiddenBasePromptIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => void restoreHiddenBasePrompts()}
                    className="text-[11px] font-semibold text-amber-300/80 underline hover:text-amber-200"
                  >
                    Restaurar {hiddenBasePromptIds.length} padrão excluído(s)
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void refreshGlobalPrompts(true)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-white/55 hover:text-white"
                >
                  <RefreshCw size={12} className={loadingGlobalPrompts ? 'animate-spin' : ''} />
                  <span>Atualizar</span>
                </button>
              </div>
            </div>

            {globalPrompts.length === 0 ? (
              <div className="rounded-2xl border border-white/5 bg-black/30 px-4 py-5 text-center text-xs text-[var(--mvz-dim)]">
                Nenhum prompt adicionado ainda. O próximo que você publicar aparecerá aqui e na Biblioteca de Prompts de todos.
              </div>
            ) : (
              <div className="mvz-scroll max-h-[240px] space-y-2.5 overflow-y-auto pr-1">
                {globalPrompts.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/45 p-2.5"
                  >
                    <div className="h-14 w-11 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black">
                      <PromptVideo
                        src={item.mediaUrl}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-bold text-white">{item.title}</div>
                      <div className="mt-0.5 flex items-center gap-2 text-[10.5px] text-[var(--mvz-gold-light)]">
                        <span>{item.filterCategory}</span>
                        <span>•</span>
                        <span className="truncate text-[var(--mvz-muted)]">{item.prompt}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={deletingPromptId === item.id}
                      onClick={() => void handleDeleteGlobalPrompt(item.id)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 transition hover:bg-red-500/25 hover:text-white disabled:opacity-50"
                      title="Remover prompt global"
                    >
                      {deletingPromptId === item.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Trash2 size={13} />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* ── LINHA 2: CADASTRAR USUÁRIO MANUALMENTE + LISTA DE USUÁRIOS ─ */}
      <section className="rounded-3xl border border-[var(--mvz-line-strong)] bg-[#0d0c0a] p-6 shadow-[0_14px_40px_rgba(0,0,0,0.55)]">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--mvz-gold)]/15 text-[var(--mvz-gold)]">
              <UserPlus size={19} />
            </div>
            <div>
              <h2 className="text-[16px] font-extrabold text-white">Cadastrar Usuário Manualmente</h2>
              <p className="text-[11.5px] text-[var(--mvz-muted)]">
                Cria o cadastro completo e libera o login imediato com e-mail e senha
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>

          {userNotice && (
            <div
              className={`mt-4 rounded-xl border px-3.5 py-3 text-xs font-medium ${
                userNotice.ok
                  ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-300'
                  : 'border-red-500/35 bg-red-500/10 text-red-300'
              }`}
            >
              <div>{userNotice.text}</div>
              {userNotice.ok && userNotice.creds && (
                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-500/25 bg-black/45 px-3 py-2 text-[11px] text-white/85">
                  <span className="truncate font-mono">
                    {userNotice.creds.email} | {userNotice.creds.password}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      copyText(
                        `Acesso liberado na Orbiex!\nLink: https://www.orbiex.io/\nE-mail: ${userNotice.creds!.email}\nSenha: ${userNotice.creds!.password}`
                      );
                      setCopiedCreds(true);
                      setTimeout(() => setCopiedCreds(false), 2000);
                    }}
                    className="inline-flex items-center gap-1 rounded-md bg-emerald-500/20 px-2.5 py-1 font-bold text-emerald-200 hover:bg-emerald-500/30"
                  >
                    {copiedCreds ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedCreds ? 'Copiado!' : 'Copiar Acesso'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleCreateUser} className="mt-5 space-y-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-white/75">
                E-mail do Usuário *
              </label>
              <div className="relative flex items-center">
                <Mail size={15} className="pointer-events-none absolute left-3.5 text-white/40" />
                <input
                  type="email"
                  required
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="cliente@gmail.com"
                  className="mvz-input h-11 w-full pl-10 pr-3.5 text-sm text-white"
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-white/75">
                  Senha de Acesso *
                </label>
                <button
                  type="button"
                  onClick={() => setUserPassword('orbiex2026k')}
                  className="text-[10.5px] font-semibold text-[var(--mvz-gold-light)] hover:underline"
                >
                  Usar padrão (orbiex2026k)
                </button>
              </div>
              <div className="relative flex items-center">
                <Lock size={15} className="pointer-events-none absolute left-3.5 text-white/40" />
                <input
                  type={showUserPwd ? 'text' : 'password'}
                  required
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  placeholder="Digite a senha do usuário"
                  className="mvz-input h-11 w-full pl-10 pr-10 text-sm text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowUserPwd((s) => !s)}
                  className="absolute right-3 text-white/45 hover:text-white"
                  tabIndex={-1}
                >
                  {showUserPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-white/75">
                Nome Completo <span className="font-normal text-white/40">(opcional)</span>
              </label>
              <div className="relative flex items-center">
                <User size={15} className="pointer-events-none absolute left-3.5 text-white/40" />
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Ex: Maria Silva"
                  className="mvz-input h-11 w-full pl-10 pr-3.5 text-sm text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={userBusy}
              className="mvz-btn-grad flex h-12 w-full items-center justify-center gap-2 text-xs font-black uppercase tracking-wider shadow-[0_0_25px_rgba(212,175,55,0.28)] disabled:opacity-60"
            >
              {userBusy ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Criando Cadastro...</span>
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  <span>Criar Cadastro do Usuário</span>
                </>
              )}
            </button>
          </form>

          </div>

          {/* Lista de Usuários */}
          <div className="flex flex-col border-t border-white/10 pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[var(--mvz-gold-light)]">
                <Users size={13} />
                <span>Usuários Cadastrados ({filteredUsers.length})</span>
              </span>
              <button
                type="button"
                onClick={() => void loadUsers()}
                className="flex items-center gap-1 text-[11px] font-semibold text-white/55 hover:text-white"
              >
                <RefreshCw size={12} className={usersLoading ? 'animate-spin' : ''} />
                <span>Atualizar</span>
              </button>
            </div>

            <div className="relative mb-3 flex items-center">
              <Search size={13} className="pointer-events-none absolute left-3 text-white/40" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Buscar usuário por nome ou e-mail..."
                className="mvz-input h-9 w-full pl-9 pr-3 text-xs text-white"
              />
            </div>

            {filteredUsers.length === 0 ? (
              <div className="rounded-2xl border border-white/5 bg-black/30 px-4 py-5 text-center text-xs text-[var(--mvz-dim)]">
                {usersLoading ? 'Carregando usuários...' : 'Nenhum usuário encontrado.'}
              </div>
            ) : (
              <div className="mvz-scroll max-h-[245px] space-y-2 overflow-y-auto pr-1">
                {filteredUsers.map((u) => (
                  <div
                    key={u.email}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/45 px-3.5 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-bold text-white">{u.name || u.email}</div>
                      <div className="truncate text-[11px] text-[var(--mvz-muted)]">{u.email}</div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[9.5px] font-bold uppercase ${
                          u.platform === 'admin_manual'
                            ? 'border-[var(--mvz-gold)]/40 bg-[var(--mvz-gold)]/15 text-[var(--mvz-gold-light)]'
                            : 'border-white/10 bg-white/5 text-white/60'
                        }`}
                      >
                        {u.platform === 'admin_manual' ? 'ADM' : u.platform || 'Cakto'}
                      </span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[9.5px] font-bold uppercase ${
                          u.status === 'approved'
                            ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
                            : 'border-red-500/30 bg-red-500/15 text-red-300'
                        }`}
                      >
                        {u.status === 'approved' ? 'Ativo' : u.status}
                      </span>
                      {u.email.toLowerCase() !== ADMIN_EMAIL && (
                        <button
                          type="button"
                          disabled={revokingEmail === u.email.toLowerCase()}
                          onClick={() => void handleRevokeUser(u.email)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 transition hover:bg-red-500/25 hover:text-white disabled:opacity-50"
                          title="Remover / bloquear acesso deste e-mail"
                        >
                          {revokingEmail === u.email.toLowerCase() ? (
                            <Loader2 size={11} className="animate-spin" />
                          ) : (
                            <Trash2 size={11} />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

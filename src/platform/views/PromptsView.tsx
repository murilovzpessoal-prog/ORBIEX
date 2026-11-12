import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Sparkles,
  Copy,
  Check,
  Heart,
  Search,
  X,
  Zap,
  SlidersHorizontal,
  Camera,
  ShieldCheck,
  Film,
  Image as ImageIcon,
  ExternalLink,
  ChevronDown,
  Download,
} from 'lucide-react';
import { Pill } from '../ui';
import { PROMPT_CARDS, type PromptCard } from '../promptCards';

export type PromptCategoryFilter =
  | 'Todos'
  | 'Animações'
  | 'Imagens'
  | 'Ambientes'
  | 'Trocas'
  | 'Influenciadoras'
  | 'YouTube Create'
  | 'POV'
  | 'Cabide'
  | 'Boomerang'
  | 'Plus Size'
  | 'One Prompt'
  | 'Mirror No Face'
  | 'No Face'
  | 'Favoritos';

const ROW_1_FILTERS = [
  'Todos',
  'Animações',
  'Imagens',
  'Ambientes',
  'Trocas',
  'Influenciadoras',
  'YouTube Create',
  'POV',
  'Cabide',
  'Boomerang',
] as const;

const ROW_2_FILTERS = [
  'Plus Size',
  'One Prompt',
  'Mirror No Face',
  'No Face',
  'Favoritos',
] as const;

/** Helper que identifica se o card é uma imagem de referência para download */
function isDownloadableReference(item: PromptCard): boolean {
  if (item.mediaType === 'video') return false;
  const title = (item.title || '').toLowerCase();

  // Exceções explícitas que continuam com botão de "Copiar Prompt"
  if (title.includes('recriar') || title.includes('recriando')) return false;
  if (title.includes('troca de') || title.includes('troca')) return false;
  if (title.includes('cenário') || title.includes('cenario')) return false;

  // Itens marcados como referência ou cujo título indica referência
  if (item.isReference) return true;
  if (title.includes('referência') || title.includes('referencia')) return true;

  // Categorias de biblioteca dedicadas a referências de imagem
  if (item.filterCategory === 'Mirror No Face' && !title.includes('recriar') && !title.includes('troca')) return true;
  if (item.filterCategory === 'No Face' && !title.includes('recriar') && !title.includes('troca')) return true;
  if (item.filterCategory === 'Influenciadoras') return true;
  if (item.filterCategory === 'Ambientes') return true;

  return false;
}

export function PromptsView({ onUse }: { onUse: (text: string) => void }) {
  const [activeFilter, setActiveFilter] = useState<PromptCategoryFilter>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(24);
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('orbiex_favorite_prompts') || localStorage.getItem('orbix_favorite_prompts');
      return saved ? JSON.parse(saved) : ['prompt-1', 'prompt-2', 'prompt-55'];
    } catch {
      return ['prompt-1', 'prompt-2', 'prompt-55'];
    }
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadedId, setDownloadedId] = useState<string | null>(null);
  const [activeModalPrompt, setActiveModalPrompt] = useState<PromptCard | null>(null);
  const [modalCopied, setModalCopied] = useState(false);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (activeModalPrompt) {
      const orig = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = orig;
      };
    }
  }, [activeModalPrompt]);

  // Reset pagination when filter or search changes
  useEffect(() => {
    setVisibleCount(24);
  }, [activeFilter, searchQuery]);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        localStorage.setItem('orbix_favorite_prompts', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const copyPrompt = (id: string, promptText: string, mediaUrl: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const textToCopy = promptText && promptText.length > 5 ? promptText : mediaUrl;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(id);
    setTimeout(() => setCopiedId((curr) => (curr === id ? null : curr)), 2000);
  };

  const downloadInfluencer = (
    id: string,
    url: string,
    filename?: string,
    e?: React.MouseEvent
  ) => {
    if (e) e.stopPropagation();
    const name = filename || `${id}.jpg`;
    setDownloadedId(id);
    setTimeout(() => setDownloadedId((curr) => (curr === id ? null : curr)), 2500);

    fetch(url)
      .then((res) => res.blob())
      .then((blob) => {
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(blobUrl);
      })
      .catch(() => {
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.download = name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      });
  };

  const resolveMediaUrl = (url: string) => {
    if (!url) return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('./')) return '/' + url.slice(2);
    if (!url.startsWith('/')) return '/' + url;
    return url;
  };

  const filteredPrompts = useMemo(() => {
    return PROMPT_CARDS.filter((item) => {
      // Category match: estritamente pela seção da biblioteca
      let matchesCategory = true;
      if (activeFilter === 'Todos') {
        matchesCategory = true;
      } else if (activeFilter === 'Favoritos') {
        matchesCategory = favorites.includes(item.id);
      } else {
        matchesCategory = item.filterCategory === activeFilter;
      }

      // Search match
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.prompt.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [activeFilter, searchQuery, favorites]);

  const displayedPrompts = useMemo(() => {
    return filteredPrompts.slice(0, visibleCount);
  }, [filteredPrompts, visibleCount]);

  // Compute category card counts de forma exata por seção
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { Todos: PROMPT_CARDS.length };
    [...ROW_1_FILTERS, ...ROW_2_FILTERS].forEach((cat) => {
      if (cat === 'Todos') return;
      if (cat === 'Favoritos') {
        counts[cat] = favorites.length;
      } else {
        counts[cat] = PROMPT_CARDS.filter((c) => c.filterCategory === cat).length;
      }
    });
    return counts;
  }, [favorites]);

  return (
    <div className="mvz-fade-up pb-16">
      {/* ────────────────────────────────────────────────────────────
          1. ELEMENTO VISUAL HERO BANNER (Luxo Tech Black & Dourado)
      ──────────────────────────────────────────────────────────── */}
      <div className="relative mb-10 overflow-hidden rounded-[30px] border border-[rgba(212,175,55,0.25)] bg-gradient-to-br from-[#17140e] via-[#0d0c0a] to-[#050505] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.85)] sm:p-9 lg:p-11">
        {/* Ambient glow effects */}
        <div className="pointer-events-none absolute -right-20 -top-24 h-96 w-96 rounded-full bg-[radial-gradient(circle,_rgba(212,175,55,0.18)_0%,_transparent_70%)] blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/4 h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(243,226,164,0.08)_0%,_transparent_70%)] blur-2xl" />

        {/* Subtle grid mesh background */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)',
            backgroundSize: '36px 36px',
          }}
        />

        <div className="relative z-10 grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
          {/* Left Column: Headline, Description & Features */}
          <div className="lg:col-span-7 xl:col-span-8">
            {/* Eyebrow badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(212,175,55,0.35)] bg-black/50 px-3.5 py-1.5 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--mvz-gold)] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--mvz-gold)]" />
              </span>
              <span className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-[var(--mvz-gold-light)]">
                Orbiex Neural Prompt Lab • v6.1
              </span>
            </div>

            {/* Title */}
            <h1 className="mt-4 text-[28px] font-black tracking-tight text-white sm:text-[38px] lg:text-[42px] leading-[1.12]">
              Engenharia Visual de{' '}
              <span className="mvz-grad-text">Prompts Virais</span>
            </h1>

            {/* Subtitle */}
            <p className="mt-3.5 max-w-2xl text-[14px] leading-relaxed text-[var(--mvz-muted)] sm:text-[15px]">
              Comandos mestres e vídeos de demonstração contínua validados para Midjourney, Kling AI,
              Luma e Runway. Crie criativos ultrarrealistas, trocas dinâmicas de looks e modelos sem
              rosto que retêm atenção e escalam produtos vencedores no TikTok Shop.
            </p>

            {/* Feature pills */}
            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--mvz-line)] bg-white/[0.03] px-3 py-1.5 text-[11.5px] font-medium text-white/90">
                <Zap size={13} className="text-[var(--mvz-gold)]" />
                Vídeos em Loop Contínuo
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--mvz-line)] bg-white/[0.03] px-3 py-1.5 text-[11.5px] font-medium text-white/90">
                <Camera size={13} className="text-[var(--mvz-gold)]" />
                Proporção 9:16 Vertical Nativa
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--mvz-line)] bg-white/[0.03] px-3 py-1.5 text-[11.5px] font-medium text-white/90">
                <ShieldCheck size={13} className="text-[#7fcf9f]" />
                Estética UGC Anti-Bloqueio
              </span>
            </div>

            {/* Call to action buttons */}
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <button
                onClick={() =>
                  onUse(
                    'Crie um prompt visual cinematográfico em 9:16 para gerar no Midjourney e animar no Kling AI uma modelo brasileira com transição tapando a câmera.'
                  )
                }
                className="mvz-btn-grad flex h-11 items-center gap-2 px-6 text-[12.5px] font-bold"
              >
                <Sparkles size={14} />
                Gerar Novo Prompt com Agente
              </button>

              <button
                onClick={() => {
                  const el = document.getElementById('prompts-filters-section');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex h-11 items-center gap-2 rounded-xl border border-[var(--mvz-line-strong)] bg-white/[0.03] px-5 text-[12.5px] font-semibold text-white/80 transition hover:border-[var(--mvz-gold)] hover:bg-[rgba(212,175,55,0.08)] hover:text-white"
              >
                <SlidersHorizontal size={13} className="text-[var(--mvz-gold)]" />
                Explorar Categorias ({PROMPT_CARDS.length})
              </button>
            </div>
          </div>

          {/* Right Column: Holographic Terminal Mockup */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="relative rounded-2xl border border-[rgba(212,175,55,0.3)] bg-black/60 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl">
              {/* Header with dots */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
                  <div className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
                  <div className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
                  <span className="ml-2 font-mono text-[10.5px] text-white/50">prompt_engine.sh</span>
                </div>
                <span className="flex items-center gap-1 font-mono text-[10px] text-[var(--mvz-gold)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--mvz-gold)] animate-pulse" />
                  ONLINE
                </span>
              </div>

              {/* Code display */}
              <div className="mt-3.5 space-y-2 font-mono text-[11px] leading-relaxed">
                <p className="text-[var(--mvz-dim)]"># Modelo Validado de Retenção</p>
                <p className="text-[var(--mvz-gold-light)]">
                  <span className="text-[#a78bfa]">/imagine</span> prompt: 9:16 POV fashion transition, young female creator covering lens with hand...
                </p>
                <div className="rounded-lg bg-white/[0.04] p-2.5 text-[10.5px] text-white/80 border border-white/5">
                  <span className="text-[#7fcf9f]">--ar 9:16</span>{' '}
                  <span className="text-[var(--mvz-gold)]">--v 6.1</span>{' '}
                  <span className="text-[#60a5fa]">--style raw</span>{' '}
                  <span className="text-white/50">--chaos 10</span>
                </div>
              </div>

              {/* Mini stats */}
              <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/10 pt-3">
                <div className="text-center">
                  <div className="text-[17px] font-black text-white">99.4%</div>
                  <div className="text-[9.5px] font-semibold uppercase text-[var(--mvz-dim)]">
                    Fidelidade Visual
                  </div>
                </div>
                <div className="text-center border-l border-white/10">
                  <div className="text-[17px] font-black text-[var(--mvz-gold)]">
                    {PROMPT_CARDS.length}
                  </div>
                  <div className="text-[9.5px] font-semibold uppercase text-[var(--mvz-dim)]">
                    Cards Prontos
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────
          2. TÍTULO "Biblioteca de Prompts" & BARRA DE BUSCA
      ──────────────────────────────────────────────────────────── */}
      <div id="prompts-filters-section" className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-[28px] font-black tracking-tight sm:text-[34px]">
            Biblioteca de <span className="mvz-grad-text">Prompts</span>
          </h2>
          <p className="mt-1 text-[13.5px] text-[var(--mvz-muted)]">
            Cada card conta com vídeo/mídia em execução e o prompt pronto no botão para cópia instantânea.
          </p>
        </div>

        {/* Input de Busca */}
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--mvz-dim)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar prompt, estilo, câmera..."
            className="h-10 w-full rounded-full border border-[var(--mvz-line)] bg-white/[0.03] pl-10 pr-4 text-[12.5px] text-white placeholder-[var(--mvz-dim)] outline-none transition focus:border-[var(--mvz-gold)]"
          />
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────
          3. FILTROS EM DUAS LINHAS (Fiel ao print do usuário)
      ──────────────────────────────────────────────────────────── */}
      <div className="mb-8 space-y-3">
        {/* Linha 1 de Filtros */}
        <div className="mvz-scroll flex items-center gap-2 overflow-x-auto pb-1">
          {ROW_1_FILTERS.map((cat) => {
            const isActive = activeFilter === cat;
            const count = categoryCounts[cat] || 0;
            return (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={`shrink-0 flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-[12px] font-semibold transition ${
                  isActive
                    ? 'border-[var(--mvz-gold)] bg-[var(--mvz-gold)] text-[#120d02] shadow-[0_0_15px_rgba(212,175,55,0.35)]'
                    : 'border-[var(--mvz-line)] bg-white/[0.02] text-[var(--mvz-muted)] hover:border-[var(--mvz-line-strong)] hover:text-white'
                }`}
              >
                <span>{cat}</span>
                {cat === 'Todos' && count > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
                      isActive ? 'bg-black/20 text-[#120d02]' : 'bg-white/10 text-[var(--mvz-dim)]'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Linha 2 de Filtros */}
        <div className="mvz-scroll flex items-center gap-2 overflow-x-auto pb-1">
          {ROW_2_FILTERS.map((cat) => {
            const isActive = activeFilter === cat;
            const isFav = cat === 'Favoritos';
            const count = categoryCounts[cat] || 0;

            return (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={`shrink-0 flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-[12px] font-semibold transition ${
                  isActive
                    ? 'border-[var(--mvz-gold)] bg-[var(--mvz-gold)] text-[#120d02] shadow-[0_0_15px_rgba(212,175,55,0.35)]'
                    : 'border-[var(--mvz-line)] bg-white/[0.02] text-[var(--mvz-muted)] hover:border-[var(--mvz-line-strong)] hover:text-white'
                }`}
              >
                {isFav && (
                  <Heart
                    size={12}
                    className={
                      isActive
                        ? 'fill-[#120d02] text-[#120d02]'
                        : count > 0
                        ? 'fill-red-400 text-red-400'
                        : 'text-[var(--mvz-muted)]'
                    }
                  />
                )}
                <span>{cat}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────
          4. GRID DE CARDS COM VÍDEO / MÍDIA EM LOOPING
      ──────────────────────────────────────────────────────────── */}
      {displayedPrompts.length === 0 ? (
        <div className="rounded-3xl border border-[var(--mvz-line)] bg-white/[0.02] py-20 text-center">
          <p className="text-[15px] font-semibold text-white/80">
            Nenhum prompt encontrado para esse filtro.
          </p>
          <p className="mt-1 text-[13px] text-[var(--mvz-muted)]">
            Tente selecionar "Todos" ou limpar sua busca.
          </p>
          <button
            onClick={() => {
              setActiveFilter('Todos');
              setSearchQuery('');
            }}
            className="mt-4 rounded-xl border border-[var(--mvz-gold)] px-4 py-2 text-[12px] font-bold text-[var(--mvz-gold)] hover:bg-[var(--mvz-gold)] hover:text-black transition"
          >
            Ver Todos os Prompts
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {displayedPrompts.map((item) => {
            const isFav = favorites.includes(item.id);
            const isCopied = copiedId === item.id;
            const isVideo = item.mediaType === 'video';

            return (
              <div
                key={item.id}
                onClick={() => setActiveModalPrompt(item)}
                className="group relative flex aspect-[3/4] w-full cursor-pointer flex-col justify-between overflow-hidden rounded-[26px] border border-[var(--mvz-line)] bg-[#0d0c0a] shadow-[0_14px_35px_rgba(0,0,0,0.7)] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--mvz-line-strong)] hover:shadow-[0_20px_50px_rgba(212,175,55,0.14)]"
              >
                {/* Background media: Video or Image */}
                {isVideo ? (
                  <video
                    src={resolveMediaUrl(item.mediaUrl)}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 h-full w-full object-cover object-center"
                  />
                ) : (
                  <img
                    src={resolveMediaUrl(item.mediaUrl)}
                    alt={item.title}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80';
                    }}
                    className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                )}

                {/* Dark gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent opacity-95 transition-opacity duration-300 group-hover:opacity-100" />

                {/* Top card action bar */}
                <div className="relative z-10 flex items-center justify-end p-4">
                  {/* Top action button: Download direto para referências OU Coração Favorito */}
                  {isDownloadableReference(item) ? (
                    <button
                      onClick={(e) =>
                        downloadInfluencer(
                          item.id,
                          resolveMediaUrl(item.mediaUrl),
                          `${item.filterCategory.toLowerCase().replace(/\s+/g, '-')}-${item.cardNum || item.id}.jpg`,
                          e
                        )
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-black/70 text-white backdrop-blur-md transition-all duration-200 hover:scale-110 hover:border-[var(--mvz-gold)] hover:bg-black/90 shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
                      title="Baixar Imagem de Referência"
                      aria-label="Baixar Imagem"
                    >
                      {downloadedId === item.id ? (
                        <Check size={16} className="text-[#7fcf9f]" />
                      ) : (
                        <Download size={16} />
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={(e) => toggleFavorite(item.id, e)}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white/80 backdrop-blur-md transition-all duration-200 hover:scale-110 hover:border-white/30"
                      aria-label="Favoritar"
                    >
                      <Heart
                        size={15}
                        className={
                          isFav
                            ? 'fill-red-500 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]'
                            : 'text-white/80'
                        }
                      />
                    </button>
                  )}
                </div>

                {/* Bottom card content: Title, Description & Action Button */}
                <div className="relative z-10 p-5 pt-0">
                  <h3 className="line-clamp-2 text-[13px] font-black uppercase tracking-wide text-white drop-shadow-md">
                    {item.title}
                  </h3>

                  <p className="mt-1 line-clamp-2 text-[11.5px] leading-relaxed text-white/80">
                    {item.description}
                  </p>

                  {/* Botão Baixar Imagem (para referências) vs Copiar Prompt */}
                  {isDownloadableReference(item) ? (
                    <button
                      onClick={(e) =>
                        downloadInfluencer(
                          item.id,
                          resolveMediaUrl(item.mediaUrl),
                          `${item.filterCategory.toLowerCase().replace(/\s+/g, '-')}-${item.cardNum || item.id}.jpg`,
                          e
                        )
                      }
                      className={`mt-3.5 flex h-10 w-full items-center justify-center gap-2 rounded-xl border text-[11.5px] font-bold uppercase tracking-wider transition-all duration-200 ${
                        downloadedId === item.id
                          ? 'border-[#7fcf9f] bg-[#7fcf9f]/20 text-[#7fcf9f]'
                          : 'border-[var(--mvz-gold)]/60 bg-[rgba(212,175,55,0.12)] text-[var(--mvz-gold)] backdrop-blur-md hover:border-[var(--mvz-gold)] hover:bg-[var(--mvz-gold)] hover:text-black shadow-[0_0_12px_rgba(212,175,55,0.15)]'
                      }`}
                    >
                      {downloadedId === item.id ? <Check size={14} /> : <Download size={13} />}
                      <span>
                        {downloadedId === item.id
                          ? 'Imagem Baixada!'
                          : item.filterCategory === 'Influenciadoras'
                          ? 'Baixar Influencer'
                          : item.filterCategory === 'Ambientes'
                          ? 'Baixar Ambiente'
                          : 'Baixar Imagem'}
                      </span>
                    </button>
                  ) : (
                    <button
                      onClick={(e) => copyPrompt(item.id, item.prompt, item.mediaUrl, e)}
                      className={`mt-3.5 flex h-10 w-full items-center justify-center gap-2 rounded-xl border text-[11.5px] font-bold uppercase tracking-wider transition-all duration-200 ${
                        isCopied
                          ? 'border-[#7fcf9f] bg-[#7fcf9f]/15 text-[#7fcf9f]'
                          : 'border-[var(--mvz-line)] bg-white/[0.04] text-white/90 backdrop-blur-md hover:border-[var(--mvz-gold)] hover:bg-[rgba(212,175,55,0.12)] hover:text-white'
                      }`}
                    >
                      {isCopied ? <Check size={14} /> : <Copy size={13} />}
                      <span>
                        {isCopied
                          ? 'Prompt Copiado!'
                          : item.prompt && item.prompt.length > 5
                          ? 'Copiar Prompt'
                          : 'Copiar Link Mídia'}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────
          Botão "Carregar Mais Prompts" (quando houver mais itens)
      ──────────────────────────────────────────────────────────── */}
      {filteredPrompts.length > visibleCount && (
        <div className="mt-10 flex justify-center">
          <button
            onClick={() => setVisibleCount((prev) => prev + 24)}
            className="flex items-center gap-2 rounded-2xl border border-[var(--mvz-line-strong)] bg-white/[0.03] px-7 py-3 text-[13px] font-bold text-white transition-all duration-200 hover:border-[var(--mvz-gold)] hover:bg-[rgba(212,175,55,0.08)]"
          >
            <ChevronDown size={16} className="text-[var(--mvz-gold)]" />
            Carregar Mais Prompts ({filteredPrompts.length - visibleCount} restantes)
          </button>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────
          5. MODAL DE DETALHES DO PROMPT (Centro absoluto via Portal)
      ──────────────────────────────────────────────────────────── */}
      {activeModalPrompt &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
            onClick={() => setActiveModalPrompt(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="mvz-pop mvz-scroll relative my-auto max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[var(--mvz-line-strong)] bg-[#0d0c0a] p-6 shadow-[0_25px_80px_rgba(0,0,0,0.95)] sm:p-8"
            >
              {/* Close Button */}
              <button
                onClick={() => setActiveModalPrompt(null)}
                className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white"
                aria-label="Fechar"
              >
                <X size={16} />
              </button>

              {/* Modal Header with Video or Image preview */}
              <div className="flex items-start gap-4">
                <div className="relative h-32 w-24 shrink-0 overflow-hidden rounded-2xl border border-[var(--mvz-line)] bg-black">
                  {activeModalPrompt.mediaType === 'video' ? (
                    <video
                      src={resolveMediaUrl(activeModalPrompt.mediaUrl)}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <img
                      src={resolveMediaUrl(activeModalPrompt.mediaUrl)}
                      alt={activeModalPrompt.title}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80';
                      }}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Pill tone="amber">{activeModalPrompt.filterCategory}</Pill>
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-[var(--mvz-gold)]">
                      {activeModalPrompt.mediaType === 'video' ? <Film size={12} /> : <ImageIcon size={12} />}
                      {activeModalPrompt.mediaType === 'video' ? 'Vídeo (.mp4)' : 'Imagem'}
                    </span>
                  </div>
                  <h2 className="mt-2 text-[17px] font-extrabold leading-snug text-white">
                    {activeModalPrompt.title}
                  </h2>
                  <p className="mt-1 text-[12.5px] text-[var(--mvz-muted)]">
                    {activeModalPrompt.description}
                  </p>
                </div>
              </div>

              {/* Full Prompt Display Box */}
              <div className="mt-5 rounded-2xl border border-[var(--mvz-line)] bg-black/60 p-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-[var(--mvz-gold)]">
                    Prompt Pronto para Execução
                  </span>
                  <button
                    onClick={() => {
                      const text =
                        activeModalPrompt.prompt && activeModalPrompt.prompt.length > 5
                          ? activeModalPrompt.prompt
                          : activeModalPrompt.mediaUrl;
                      navigator.clipboard.writeText(text);
                      setModalCopied(true);
                      setTimeout(() => setModalCopied(false), 2000);
                    }}
                    className="flex items-center gap-1 text-[11px] font-semibold text-[var(--mvz-muted)] hover:text-white transition"
                  >
                    {modalCopied ? <Check size={12} className="text-[#7fcf9f]" /> : <Copy size={12} />}
                    {modalCopied ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
                <p className="mt-3 max-h-56 overflow-y-auto font-mono text-[12px] leading-relaxed text-white/90 selection:bg-[var(--mvz-gold)] selection:text-black">
                  {activeModalPrompt.prompt || activeModalPrompt.description}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
                {isDownloadableReference(activeModalPrompt) ? (
                  <div className="flex flex-1 flex-col gap-2 sm:flex-row">
                    <button
                      onClick={(e) =>
                        downloadInfluencer(
                          activeModalPrompt.id,
                          resolveMediaUrl(activeModalPrompt.mediaUrl),
                          `${activeModalPrompt.filterCategory.toLowerCase().replace(/\s+/g, '-')}-${activeModalPrompt.cardNum || activeModalPrompt.id}.jpg`,
                          e
                        )
                      }
                      className="mvz-btn-grad flex h-11 flex-1 items-center justify-center gap-2 text-[12.5px]"
                    >
                      {downloadedId === activeModalPrompt.id ? <Check size={15} /> : <Download size={15} />}
                      {downloadedId === activeModalPrompt.id
                        ? 'Imagem Baixada com Sucesso!'
                        : 'Baixar Imagem de Referência (Alta Resolução)'}
                    </button>
                    {activeModalPrompt.prompt && activeModalPrompt.prompt.length > 5 && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(activeModalPrompt.prompt);
                          setModalCopied(true);
                          setTimeout(() => setModalCopied(false), 2000);
                        }}
                        className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[var(--mvz-line-strong)] bg-white/[0.04] px-5 text-[12.5px] font-semibold text-white transition hover:border-[var(--mvz-gold)] hover:bg-[rgba(212,175,55,0.1)]"
                      >
                        {modalCopied ? <Check size={14} className="text-[#7fcf9f]" /> : <Copy size={13} />}
                        {modalCopied ? 'Prompt Copiado!' : 'Copiar Prompt'}
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      const text =
                        activeModalPrompt.prompt && activeModalPrompt.prompt.length > 5
                          ? activeModalPrompt.prompt
                          : activeModalPrompt.description;
                      onUse(
                        `Execute este prompt e gere variações de roteiro e criativos visuais para o Orbiex AI:\n\n"${text}"`
                      );
                      setActiveModalPrompt(null);
                    }}
                    className="mvz-btn-grad flex h-11 flex-1 items-center justify-center gap-2 text-[12.5px]"
                  >
                    <Sparkles size={14} />
                    Usar e Criar Variações no Agente Orbiex
                  </button>
                )}

                <a
                  href={resolveMediaUrl(activeModalPrompt.mediaUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[var(--mvz-line-strong)] px-5 text-[12.5px] font-semibold text-white/80 transition hover:border-[var(--mvz-gold)] hover:bg-[rgba(212,175,55,0.08)] hover:text-white"
                >
                  <ExternalLink size={13} className="text-[var(--mvz-gold)]" />
                  Abrir Mídia Original
                </a>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

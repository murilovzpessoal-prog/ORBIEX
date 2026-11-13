import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Package, ExternalLink, Sparkles, ArrowRight, X, Copy, Check, ShieldCheck, Plus, Trash2 } from 'lucide-react';
import { Pill } from '../ui';
import type { ViewId } from '../data';
import {
  BASE_WINNING_PRODUCTS,
  useProducts,
  computeAffiliateCommission,
  type WinningProduct,
  type ProductCategory,
} from '../productsStore';

export type { ProductCategory, WinningProduct };
export const WINNING_PRODUCTS: WinningProduct[] = BASE_WINNING_PRODUCTS;

const CATEGORIES = [
  'Todos',
  'Plus Size',
  'Fitness',
  'Vestidos',
  'Croppeds',
  'Alfaiataria',
  'Moda Praia',
  'Modeladores',
  'Externo',
] as const;

export function WinningProductsView({
  onUseInAgent,
  onNavigate,
}: {
  onUseInAgent: (prompt: string) => void;
  onNavigate: (view: ViewId) => void;
}) {
  const { products, addProduct, deleteProduct } = useProducts();
  const [selectedCat, setSelectedCat] = useState<(typeof CATEGORIES)[number]>('Todos');
  const [activeModal, setActiveModal] = useState<WinningProduct | null>(null);
  const [copiedHook, setCopiedHook] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdImage, setNewProdImage] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('R$ 49,90');
  const [newProdCost, setNewProdCost] = useState('20%');
  const [newProdCat, setNewProdCat] = useState<string>('Croppeds');

  useEffect(() => {
    if (activeModal || showAddModal) {
      const orig = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = orig;
      };
    }
  }, [activeModal, showAddModal]);

  const filtered = products.filter(
    (p) => selectedCat === 'Todos' || p.category === selectedCat
  );

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHook(true);
    setTimeout(() => setCopiedHook(false), 2000);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim() || !newProdImage.trim()) return;

    addProduct({
      name: newProdName,
      category: newProdCat,
      image: newProdImage,
      suggestedPrice: newProdPrice,
      commissionRate: newProdCost,
    });

    setNewProdName('');
    setNewProdImage('');
    setShowAddModal(false);
  };
  return (
    <div className="mvz-fade-up pb-12">
      {/* ── Top Eyebrow & Headline ── */}
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--mvz-line-strong)] bg-white/[0.03] px-3.5 py-1.5 backdrop-blur-md">
            <Package size={13} className="text-[var(--mvz-gold)]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--mvz-gold-light)]">
              Arsenal de Vendas
            </span>
          </div>

          <h1 className="mt-3.5 text-[32px] font-extrabold tracking-tight sm:text-[42px]">
            Produtos <span className="mvz-grad-text">Vencedores</span>
          </h1>

          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[var(--mvz-muted)]">
            Acesse os produtos validados que estão gerando mais lucro no mercado. Modele as ofertas ou
            adicione-os diretamente na sua esteira de vendas.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex h-11 items-center gap-2 rounded-xl border border-[var(--mvz-gold)]/50 bg-[var(--mvz-gold)]/10 px-4 py-2 text-[12.5px] font-bold text-[var(--mvz-gold-light)] backdrop-blur-md transition hover:bg-[var(--mvz-gold)]/20 hover:border-[var(--mvz-gold)]"
        >
          <Plus size={15} />
          <span>Cadastrar Produto Externo</span>
        </button>
      </div>

      {/* ── Filter Bar ── */}
      <div className="mvz-scroll mb-7 flex items-center gap-2 overflow-x-auto pb-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCat(cat)}
            className={`shrink-0 flex items-center rounded-full border px-4 py-1.5 text-[12px] font-semibold transition ${
              selectedCat === cat
                ? 'border-[var(--mvz-gold)] bg-[var(--mvz-gold)] text-[#120d02]'
                : 'border-[var(--mvz-line)] bg-white/[0.02] text-[var(--mvz-muted)] hover:border-[var(--mvz-line-strong)] hover:text-white'
            }`}
          >
            <span>{cat}</span>
          </button>
        ))}
      </div>

      {/* ── Product Cards Grid (fiel ao Print 1) ── */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {filtered.map((prod) => (
          <div
            key={prod.id}
            className="group flex flex-col transition duration-300"
          >
            {/* Image card with rounded corners, aspect ratio and bottom gradient */}
            <div
              onClick={() => setActiveModal(prod)}
              className="relative aspect-[3/4] w-full cursor-pointer overflow-hidden rounded-[26px] border border-[var(--mvz-line)] bg-[#0d0c0a] shadow-[0_12px_30px_rgba(0,0,0,0.6)] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--mvz-line-strong)] hover:shadow-[0_18px_40px_rgba(212,175,55,0.12)]"
            >
              {/* Product background image */}
              <img
                src={prod.image}
                alt={prod.name}
                loading="lazy"
                className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
              />

              {/* Dark subtle overlay on hover/base */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent opacity-90 transition-opacity duration-300 group-hover:opacity-95" />

              {/* Custom badge & delete */}
              {prod.isCustom && (
                <div className="absolute left-3.5 top-3.5 z-10 flex items-center gap-1.5">
                  <span className="rounded-full border border-[var(--mvz-gold)]/40 bg-[var(--mvz-gold)]/20 px-2 py-0.5 text-[9.5px] font-extrabold uppercase text-[var(--mvz-gold-light)] backdrop-blur-md">
                    Externo
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteProduct(prod.id);
                    }}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/40 hover:text-white transition cursor-pointer"
                    title="Excluir produto externo"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              )}

              {/* Bottom text inside card overlay */}
              <div className="absolute inset-x-0 bottom-0 p-5 text-center">
                <h3 className="line-clamp-2 text-[12px] font-black uppercase leading-tight tracking-wide text-white drop-shadow-md">
                  {prod.name}
                </h3>
              </div>
            </div>

            {/* Acessar Produto Button below card (fiel ao Print 1, redireciona diretamente para o link TikTok) */}
            <a
              href={prod.link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[var(--mvz-line)] bg-white/[0.03] text-[11.5px] font-bold uppercase tracking-wider text-white/80 transition-all duration-200 hover:border-[var(--mvz-gold)] hover:bg-[rgba(212,175,55,0.08)] hover:text-white"
            >
              <ExternalLink size={13} className="text-[var(--mvz-gold)]" />
              Acessar Produto
            </a>
          </div>
        ))}
      </div>

      {/* ── Product Detail Modal (Renderizado no centro absoluto da tela via Portal) ── */}
      {activeModal &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
            onClick={() => setActiveModal(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="mvz-pop mvz-scroll relative my-auto max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[var(--mvz-line-strong)] bg-[#0d0c0a] p-6 shadow-[0_25px_80px_rgba(0,0,0,0.95)] sm:p-8"
            >
              {/* Close button */}
              <button
                onClick={() => setActiveModal(null)}
                className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white"
                aria-label="Fechar"
              >
                <X size={16} />
              </button>

              {/* Modal header */}
              <div className="flex items-start gap-4">
                <img
                  src={activeModal.image}
                  alt={activeModal.name}
                  className="h-24 w-20 shrink-0 rounded-xl object-cover border border-[var(--mvz-line)]"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Pill tone="amber">{activeModal.category}</Pill>
                    <span className="flex items-center gap-1 text-[11px] font-bold text-[var(--mvz-gold)]">
                      <ShieldCheck size={13} /> Validado TikTok Shop
                    </span>
                  </div>
                  <h2 className="mt-1.5 text-[16px] font-extrabold leading-snug">
                    {activeModal.name}
                  </h2>
                  <div className="mt-1 text-[12px] text-[var(--mvz-dim)]">{activeModal.sales}</div>
                </div>
              </div>

              {/* Metrics Grid — Inteligência de Afiliado TikTok Shop */}
              {(() => {
                const comm = computeAffiliateCommission(
                  activeModal.suggestedPrice,
                  activeModal.commissionRate
                );
                const commRate = activeModal.commissionRate || comm.rate;
                const commAmount = activeModal.commissionAmount || comm.amount;

                return (
                  <div className="my-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-xl border border-[var(--mvz-line)] bg-white/[0.02] p-3 text-center">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--mvz-dim)]">
                        Score Orbiex
                      </div>
                      <div className="mt-1 text-2xl font-black text-[var(--mvz-gold)]">
                        {activeModal.score}
                      </div>
                    </div>
                    <div className="rounded-xl border border-[var(--mvz-line)] bg-white/[0.02] p-3 text-center">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--mvz-dim)]">
                        Preço no TikTok
                      </div>
                      <div className="mt-1 text-lg font-extrabold text-white">
                        {activeModal.suggestedPrice}
                      </div>
                    </div>
                    <div className="rounded-xl border border-[var(--mvz-line)] bg-white/[0.02] p-3 text-center">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--mvz-dim)]">
                        Comissão Afiliado
                      </div>
                      <div className="mt-1 text-2xl font-black text-[var(--mvz-gold)]">
                        {commRate}
                      </div>
                    </div>
                    <div className="rounded-xl border border-[var(--mvz-line)] bg-white/[0.02] p-3 text-center">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--mvz-dim)]">
                        Lucro por Venda
                      </div>
                      <div className="mt-1 text-2xl font-black text-[#7fcf9f]">
                        {commAmount}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Angle & Hook section */}
              <div className="space-y-4 rounded-2xl border border-[var(--mvz-line)] bg-white/[0.02] p-4">
                <div>
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-[var(--mvz-gold)]">
                    Ângulo de Venda Campeão
                  </span>
                  <p className="mt-1 text-[13px] leading-relaxed text-white/85">
                    {activeModal.angle}
                  </p>
                </div>

                <div className="border-t border-[var(--mvz-line)] pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] font-bold uppercase tracking-wider text-[var(--mvz-gold)]">
                      Hook Recomendado (3 Primeiros Segundos)
                    </span>
                    <button
                      onClick={() => handleCopy(activeModal.hook)}
                      className="flex items-center gap-1 text-[11px] font-semibold text-[var(--mvz-muted)] hover:text-white"
                    >
                      {copiedHook ? <Check size={12} className="text-[#7fcf9f]" /> : <Copy size={12} />}
                      {copiedHook ? 'Copiado' : 'Copiar'}
                    </button>
                  </div>
                  <p className="mt-1 font-medium italic text-[13px] text-white">
                    “{activeModal.hook}”
                  </p>
                </div>
              </div>

              {/* Action buttons connecting to the Agent & Analyzers */}
              <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
                <button
                  onClick={() => {
                    onUseInAgent(`Crie um roteiro completo de 30s sem aparecer para o produto vencedor: "${activeModal.name}". Use o gancho: "${activeModal.hook}"`);
                    setActiveModal(null);
                  }}
                  className="mvz-btn-grad flex h-11 flex-1 items-center justify-center gap-2 text-[12.5px]"
                >
                  <Sparkles size={14} />
                  Gerar Roteiro no Agente Orbiex
                </button>

                <a
                  href={activeModal.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[var(--mvz-line-strong)] px-5 text-[12.5px] font-semibold text-white/80 transition hover:border-[var(--mvz-gold)] hover:bg-[rgba(212,175,55,0.08)] hover:text-white"
                >
                  <ExternalLink size={13} className="text-[var(--mvz-gold)]" />
                  Abrir no TikTok
                </a>

                <button
                  onClick={() => {
                    onNavigate('product');
                    setActiveModal(null);
                  }}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[var(--mvz-line-strong)] px-5 text-[12.5px] font-semibold text-white/80 transition hover:bg-white/5 hover:text-white"
                >
                  Auditar
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Modal para Cadastrar Produto Externo */}
      {showAddModal &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
              onClick={() => setShowAddModal(false)}
            />
            <div className="relative z-10 w-full max-w-lg rounded-[26px] border border-[var(--mvz-gold)]/40 bg-[#0e0d0b] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.95)] sm:p-8 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--mvz-gold)]/15 text-[var(--mvz-gold)]">
                    <Plus size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Cadastrar Produto Externo</h3>
                    <p className="text-xs text-[var(--mvz-muted)]">
                      Adicione um produto de fora na sua esteira do TikTok Shop
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="mt-5 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-white/80">Nome da Peça / Produto *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Cropped Canelado Tomara que Caia"
                    value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[var(--mvz-line)] bg-black/60 px-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:border-[var(--mvz-gold)] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-white/80">URL da Imagem da Peça *</label>
                  <input
                    type="url"
                    required
                    placeholder="https://exemplo.com/foto-produto.jpg"
                    value={newProdImage}
                    onChange={(e) => setNewProdImage(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[var(--mvz-line)] bg-black/60 px-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:border-[var(--mvz-gold)] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-white/80">Categoria</label>
                    <select
                      value={newProdCat}
                      onChange={(e) => setNewProdCat(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-[var(--mvz-line)] bg-black/60 px-3 py-2.5 text-sm text-white focus:border-[var(--mvz-gold)] focus:outline-none"
                    >
                      <option value="Croppeds">Croppeds / Tops</option>
                      <option value="Vestidos">Vestidos / Looks</option>
                      <option value="Fitness">Fitness / Treino</option>
                      <option value="Alfaiataria">Alfaiataria / Calças</option>
                      <option value="Modeladores">Modeladores / Cintas</option>
                      <option value="Moda Praia">Moda Praia</option>
                      <option value="Plus Size">Plus Size</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-white/80">Preço no TikTok Shop</label>
                    <input
                      type="text"
                      value={newProdPrice}
                      onChange={(e) => setNewProdPrice(e.target.value)}
                      placeholder="Ex: R$ 89,90"
                      className="mt-1.5 w-full rounded-xl border border-[var(--mvz-line)] bg-black/60 px-3.5 py-2.5 text-sm text-white focus:border-[var(--mvz-gold)] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-white/80">Comissão de Afiliado (Opcional)</label>
                  <input
                    type="text"
                    value={newProdCost}
                    onChange={(e) => setNewProdCost(e.target.value)}
                    placeholder="Ex: 20%"
                    className="mt-1.5 w-full rounded-xl border border-[var(--mvz-line)] bg-black/60 px-3.5 py-2.5 text-sm text-white focus:border-[var(--mvz-gold)] focus:outline-none"
                  />
                </div>

                <div className="mt-6 flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="rounded-xl border border-white/10 px-4 py-2.5 text-xs font-bold text-white/70 hover:bg-white/5 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="mvz-btn-grad flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold shadow-[0_0_20px_rgba(212,175,55,0.25)]"
                  >
                    <Check size={14} />
                    <span>Salvar Produto</span>
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

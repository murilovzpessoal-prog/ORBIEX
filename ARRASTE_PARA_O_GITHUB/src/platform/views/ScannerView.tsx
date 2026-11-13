import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ScanSearch,
  ExternalLink,
  Users,
  Heart,
  Sparkles,
  Bot,
  X,
  TrendingUp,
  Copy,
  Check,
  Zap,
} from 'lucide-react';
import { Pill } from '../ui';

export interface CreatorProfile {
  id: string;
  name: string;
  followers: string;
  likes: string;
  link: string;
  image: string;
  category: string;
  highlighted?: boolean;
  topProducts?: string[];
  winningHooks?: string[];
  strategyNote?: string;
}

export const SCANNER_PROFILES: CreatorProfile[] = [
  {
    id: 'sp-1',
    name: '@duda_rodriiguees',
    followers: '8.906',
    likes: '110,1 mil',
    link: 'https://www.tiktok.com/@duda_rodriiguees?_r=1&_t=ZS-99epnzEGTCs',
    image: 'https://i.imgur.com/9VAuAev.jpeg',
    category: 'MODA FEMININA',
    topProducts: ['Vestido Canelado Justo', 'Cropped Amarração', 'Conjunto Verão'],
    winningHooks: [
      'Meninas, achei o vestido idêntico ao da gringa por 49 reais!',
      'Vocês me pediram muito o link dessa calça, tá na vitrine!',
      'Três looks completos do TikTok Shop que parecem de loja cara.',
    ],
    strategyNote: 'Vídeos curtos de 15s a 22s gravados no espelho com iluminação quente e música em alta.',
  },
  {
    id: 'sp-2',
    name: '@eunandalooks',
    followers: '24,8 mil',
    likes: '1,1 mi',
    link: 'https://www.tiktok.com/@eunandalooks?_r=1&_t=ZS-99epsENHOUy',
    image: 'https://i.imgur.com/itEVSUP.jpeg',
    category: 'MODA FEMININA',
    topProducts: ['Top Frente Única', 'Shorts Modelador', 'Saída de Praia Crochê'],
    winningHooks: [
      'Não compra cropped antes de ver a sustentação desse aqui.',
      'O look que usei no vídeo e bateu 1 milhão de views.',
      'Provando os achados mais vendidos da semana.',
    ],
    strategyNote: 'Foco total em provador rápido e demonstração do caimento no corpo.',
  },
  {
    id: 'sp-3',
    name: '@mayalluzz',
    followers: '9.491',
    likes: '113,9 mil',
    link: 'https://www.tiktok.com/@mayalluzz?_r=1&_t=ZS-99epu4fvwUK',
    image: 'https://i.imgur.com/tAY3Sm4.jpeg',
    category: 'MODA FEMININA',
    topProducts: ['Conjunto Moletom Street', 'Cropped Alça Fina', 'Biquíni Cintura Alta'],
    winningHooks: [
      'Testei se a qualidade das roupas do carrinho laranja vale a pena.',
      'Apenas 3 peças para montar 7 looks elegantes.',
      'Se você quer disfarçar a barriga, esse corte foi feito pra você.',
    ],
    strategyNote: 'Conteúdo estético clean com legendas grandes e claras no primeiro segundo.',
  },
  {
    id: 'sp-4',
    name: '@annamaria_767',
    followers: '35 mil',
    likes: '469,5 mil',
    link: 'https://www.tiktok.com/@annamaria_767?_r=1&_t=ZS-99epx9nwOx8',
    image: 'https://i.imgur.com/7Bjmzb9.jpeg',
    category: 'MODA FEMININA',
    topProducts: ['Shorts Modelador Power', 'Conjunto Academia Pro', 'Cropped Seamless'],
    winningHooks: [
      'Esse modelador tirou 5cm da minha cintura sem apertar nada.',
      'O motivo dessa peça estar esgotando em todas as lojas.',
      'Comparando a marca cara com a versão do TikTok Shop.',
    ],
    strategyNote: 'Comparativo antes vs depois e prova social forte com comentários fixados.',
  },
  {
    id: 'sp-5',
    name: '@eubiamunizz',
    followers: '24,3 mil',
    likes: '352,7 mil',
    link: 'https://www.tiktok.com/@eubiamunizz?_r=1&_t=ZS-99epyoigp6N',
    image: 'https://i.imgur.com/qzxIXRO.jpeg',
    category: 'MODA FEMININA',
    topProducts: ['Calça Alfaiataria Casual', 'Blazer Cropped', 'Top Básico'],
    winningHooks: [
      'Como parecer rica gastando menos de 60 reais no TikTok Shop.',
      'O conjunto que não amassa e não precisa passar para sair elegante.',
    ],
    strategyNote: 'Transições rápidas de look e ênfase no custo-benefício.',
  },
  {
    id: 'sp-6',
    name: '@dicasdabeca.m',
    followers: '13,3 mil',
    likes: '237,1 mil',
    link: 'https://www.tiktok.com/@dicasdabeca.m?_r=1&_t=ZS-99eq8Aau9Vi',
    image: 'https://i.imgur.com/5wMghDw.jpeg',
    category: 'MODA FEMININA',
    topProducts: ['Conjunto Moletom Confort', 'Vestido Midi Alcinha', 'Shorts Cintura Alta'],
    winningHooks: [
      'Se você tem vergonha de gravar mostrando o rosto, grave assim!',
      'O ângulo de câmera que aumentou minhas vendas em 3x.',
    ],
    strategyNote: 'Vídeos em primeira pessoa segurando a peça e mostrando os detalhes de costura.',
  },
  {
    id: 'sp-7',
    name: '@looksdalicia',
    followers: '6.105',
    likes: '197,8 mil',
    link: 'https://www.tiktok.com/@looksdalicia?_r=1&_t=ZS-99eqBbKPcWN',
    image: 'https://i.imgur.com/mUFuDVE.jpeg',
    category: 'MODA FEMININA',
    topProducts: ['Vestido Canelado Curto', 'Cropped Cruzado', 'Saia Drapeada'],
    winningHooks: [
      'Pare de usar roupa sem graça no dia a dia com esses 3 truques.',
      'O truque do nozinho que muda qualquer blusa básica.',
    ],
    strategyNote: 'Dicas práticas de styling que educam o público e geram desejo imediato.',
  },
  {
    id: 'sp-8',
    name: '@eurayjusto',
    followers: '16,4 mil',
    likes: '116,5 mil',
    link: 'https://www.tiktok.com/@eurayjusto?_r=1&_t=ZS-99eqKsnapOy',
    image: 'https://mvzclass.com.br/eurayjusto.jpg',
    category: 'MODA FEMININA',
    topProducts: ['Macaquinho Alfaiataria', 'Cropped Canelado Gola Alta', 'Top Básico Preto'],
    winningHooks: [
      'Achei o macaquinho perfeito para o final de semana sem gastar nada.',
      'O produto mais vendido da semana no TikTok Shop.',
    ],
    strategyNote: 'Vídeos com demonstração dinâmica de movimento para comprovar o caimento.',
  },
  {
    id: 'sp-9',
    name: '@dailyperlla',
    followers: '5.064',
    likes: '119,6 mil',
    link: 'https://www.tiktok.com/@dailyperlla?_r=1&_t=ZS-99eqQH1eP60',
    image: 'https://i.imgur.com/5t0w2dT.jpeg',
    category: 'MODA FEMININA',
    topProducts: ['Conjunto Duas Peças Casual', 'Top Renda Estruturado', 'Calça Wide Leg'],
    winningHooks: [
      'O que ninguém te conta sobre as roupas virais do TikTok Shop.',
      'Comprei com medo e foi a melhor compra do ano!',
    ],
    strategyNote: 'Review sincero e quebra de objeções nos primeiros 3 segundos.',
  },
];

export function ScannerView({
  onUseInAgent,
}: {
  onUseInAgent: (prompt: string) => void;
}) {
  const [selectedProfile, setSelectedProfile] = useState<CreatorProfile | null>(null);
  const [copiedHook, setCopiedHook] = useState<string | null>(null);

  useEffect(() => {
    if (selectedProfile) {
      const orig = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = orig;
      };
    }
  }, [selectedProfile]);

  const handleCopy = (hookText: string) => {
    navigator.clipboard.writeText(hookText);
    setCopiedHook(hookText);
    setTimeout(() => setCopiedHook(null), 2000);
  };

  const handleOpenTikTok = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="mvz-fade-up pb-16">
      {/* ── Top Eyebrow & Title (fiel ao Print do Scanner) ── */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(212,175,55,0.3)] bg-[rgba(212,175,55,0.06)] px-3.5 py-1.5 backdrop-blur-md">
          <ScanSearch size={13} className="text-[var(--mvz-gold)]" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--mvz-gold-light)]">
            Orbiex Scanner
          </span>
        </div>

        <h1 className="mt-3.5 text-[32px] font-extrabold tracking-tight sm:text-[42px]">
          Modelagem <span className="mvz-grad-text">Viral</span>
        </h1>

        <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[var(--mvz-muted)]">
          Aqui estão os perfis que mais estão vendendo no mercado atual. Analise os hooks, a estrutura dos
          vídeos e modele o sucesso para a sua operação.
        </p>
      </div>

      {/* ── Grid of 9 Profiles (fiel ao Print com imagens reais do TikTok) ── */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {SCANNER_PROFILES.map((creator) => (
          <div
            key={creator.id}
            onClick={() => setSelectedProfile(creator)}
            className="group relative flex cursor-pointer flex-col overflow-hidden rounded-[26px] border border-[var(--mvz-line)] bg-[#0d0c0a] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--mvz-gold)]/40 hover:shadow-[0_15px_35px_rgba(0,0,0,0.7)]"
          >
            {/* Profile Screenshot Image (fiel ao Print original) */}
            <div className="relative aspect-[9/13] w-full overflow-hidden bg-black/60">
              <img
                src={creator.image}
                alt={creator.name}
                loading="lazy"
                className="h-full w-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
              />

              {/* Dark Gradient Overlay for bottom text legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-95 transition-opacity group-hover:opacity-90" />

              {/* Text Over Image (Handle + Followers + Likes) */}
              <div className="absolute inset-x-0 bottom-0 p-4">
                <div className="text-center">
                  <span className="font-mono text-[14px] font-black tracking-tight text-white drop-shadow-md">
                    {creator.name}
                  </span>
                </div>

                {/* Followers and Likes metrics row */}
                <div className="mt-2.5 flex items-center justify-around rounded-xl border border-white/10 bg-black/60 py-2 px-3 backdrop-blur-md">
                  <div className="flex items-center gap-1.5 text-center">
                    <Users size={13} className="text-[var(--mvz-gold)]" />
                    <div className="text-left leading-tight">
                      <div className="text-[8.5px] font-extrabold uppercase text-[var(--mvz-dim)]">Seguidores</div>
                      <div className="text-[12px] font-black text-white">{creator.followers}</div>
                    </div>
                  </div>

                  <div className="h-4 w-px bg-white/10" />

                  <div className="flex items-center gap-1.5 text-center">
                    <Heart size={13} className="text-[#c9803a]" fill="currentColor" />
                    <div className="text-left leading-tight">
                      <div className="text-[8.5px] font-extrabold uppercase text-[var(--mvz-dim)]">Curtidas</div>
                      <div className="text-[12px] font-black text-white">{creator.likes}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Action Button (fiel ao Print do Scanner) */}
            <div className="p-3.5 pt-2">
              <button
                onClick={(e) => handleOpenTikTok(e, creator.link)}
                className="group/btn flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[var(--mvz-line)] bg-white/[0.04] text-[12px] font-black uppercase tracking-wider text-white/90 transition-all duration-200 hover:border-[var(--mvz-gold)] hover:bg-gradient-to-r hover:from-[var(--mvz-gold)] hover:via-[var(--mvz-gold-light)] hover:to-[var(--mvz-gold)] hover:text-black hover:shadow-[0_4px_18px_rgba(212,175,55,0.35)]"
              >
                <ExternalLink size={13} className="text-[var(--mvz-gold)] transition-colors duration-200 group-hover/btn:text-black" />
                <span>Analisar Perfil</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Deep Dive Modal on Profile Click (Renderizado via Portal no centro absoluto da tela) ── */}
      {selectedProfile &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
            onClick={() => setSelectedProfile(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="mvz-pop mvz-scroll relative my-auto max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[var(--mvz-line-strong)] bg-[#0d0c0a] p-6 shadow-[0_25px_80px_rgba(0,0,0,0.95)] sm:p-8"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedProfile(null)}
                className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white"
                aria-label="Fechar"
              >
                <X size={16} />
              </button>

              {/* Profile Header */}
              <div className="flex items-start gap-4 border-b border-[var(--mvz-line)] pb-5">
                <img
                  src={selectedProfile.image}
                  alt={selectedProfile.name}
                  className="h-20 w-16 shrink-0 rounded-xl object-cover object-top border border-[var(--mvz-gold)] shadow-lg"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Pill tone="amber">{selectedProfile.category}</Pill>
                    <span className="text-[11px] font-bold text-[var(--mvz-gold)]">Perfil Viral Validado</span>
                  </div>
                  <h2 className="mt-1 text-2xl font-black">{selectedProfile.name}</h2>
                  <div className="mt-1 flex items-center gap-4 text-[12px] text-[var(--mvz-muted)]">
                    <span><strong>{selectedProfile.followers}</strong> seguidores</span>
                    <span>•</span>
                    <span><strong>{selectedProfile.likes}</strong> curtidas</span>
                  </div>
                </div>
              </div>

              {/* Estratégia de Conteúdo */}
              {selectedProfile.strategyNote && (
                <div className="my-5 rounded-2xl border border-[var(--mvz-line)] bg-white/[0.02] p-4">
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[var(--mvz-gold)]">
                    <TrendingUp size={14} /> Estrutura & Padrão de Vídeos
                  </div>
                  <p className="mt-1 text-[13px] leading-relaxed text-white/90">
                    {selectedProfile.strategyNote}
                  </p>
                </div>
              )}

              {/* Top Products Sold */}
              {selectedProfile.topProducts && (
                <div className="mb-4 rounded-2xl border border-[var(--mvz-line)] bg-white/[0.02] p-4">
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[var(--mvz-gold)]">
                    <Zap size={14} /> Produtos Mais Vendidos na Vitrine
                  </div>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {selectedProfile.topProducts.map((prod, idx) => (
                      <span
                        key={idx}
                        className="flex items-center gap-1.5 rounded-lg border border-[var(--mvz-line-strong)] bg-white/[0.03] px-3 py-1.5 text-[12px] font-semibold text-white/90"
                      >
                        <Sparkles size={11} className="text-[var(--mvz-gold)]" />
                        {prod}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Winning Hooks */}
              {selectedProfile.winningHooks && (
                <div className="mb-6 rounded-2xl border border-[var(--mvz-line)] bg-white/[0.02] p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[var(--mvz-gold)]">
                      <Sparkles size={14} /> Hooks Virais Mais Usados por {selectedProfile.name}
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    {selectedProfile.winningHooks.map((hook, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-3 rounded-xl border border-[var(--mvz-line)] bg-[#070605] p-3"
                      >
                        <p className="text-[12.5px] italic text-white/85">“{hook}”</p>
                        <button
                          onClick={() => handleCopy(hook)}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 text-white/60 hover:bg-white/5 hover:text-white"
                          title="Copiar Hook"
                        >
                          {copiedHook === hook ? <Check size={12} className="text-[#7fcf9f]" /> : <Copy size={12} />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex flex-col gap-2.5 sm:flex-row">
                <button
                  onClick={() => {
                    onUseInAgent(
                      `Modele o estilo de vídeo e a estratégia do perfil viral "${selectedProfile.name}". Crie 3 conceitos de roteiros de 30s sem aparecer com base nos produtos mais vendidos desse criador.`
                    );
                    setSelectedProfile(null);
                  }}
                  className="mvz-btn-grad flex h-11 flex-1 items-center justify-center gap-2 text-[12.5px]"
                >
                  <Bot size={15} />
                  Modelar Perfil & Criar Roteiros no Agente Orbiex
                </button>

                <button
                  onClick={(e) => handleOpenTikTok(e, selectedProfile.link)}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[var(--mvz-line-strong)] px-5 text-[12.5px] font-semibold text-white/85 transition hover:bg-white/5 hover:text-white"
                >
                  <ExternalLink size={14} className="text-[var(--mvz-gold)]" />
                  Ver no TikTok
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

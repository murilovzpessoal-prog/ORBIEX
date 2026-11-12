import { ArrowRight, Play, TrendingUp, Zap, Sparkles } from 'lucide-react';
import { ACTIVITY, TOOLS, TRENDING, type ViewId } from '../data';
import { IconBox, Pill, Ring, ScoreBadge, SectionTitle, TONE } from '../ui';
import { useUserProfile } from '../useUserProfile';

export function HomeView({ go }: { go: (v: ViewId) => void }) {
  const { displayName } = useUserProfile();
  return (
    <div className="mvz-fade-up space-y-5">
      {/* ── Hero ─────────────────────────────── */}
      <section className="mvz-card relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_8%_0%,rgba(201,128,58,0.28),transparent_55%),radial-gradient(ellipse_at_100%_100%,rgba(212,175,55,0.20),transparent_50%)]" />
        <div className="mvz-stripes absolute -right-10 bottom-0 -z-10 h-full w-[55%] opacity-70" />

        {/* Orb = the "face" of the agent */}
        <div className="pointer-events-none absolute -right-6 top-1/2 hidden h-[330px] w-[330px] -translate-y-1/2 md:block lg:right-16">
          <div className="mvz-float relative h-full w-full">
            <div className="mvz-orb absolute inset-8 rounded-full" />
            <div className="mvz-ring-spin absolute inset-0 rounded-full" />
            <div className="mvz-ring-spin absolute inset-3 rounded-full opacity-50" style={{ animationDirection: 'reverse', animationDuration: '11s' }} />
          </div>
        </div>

        <div className="relative px-6 py-10 sm:px-10 sm:py-14 lg:py-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5">
            <Zap size={11} className="text-[var(--mvz-cyan)]" />
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/80">Ecossistema Orbiex</span>
          </div>

          <h1 className="mt-6 max-w-[680px] text-[34px] font-extrabold uppercase leading-[1.04] tracking-tight sm:text-[44px]">
            O Impossível
            <br />
            Agora é executável
            <br />
            <span className="mvz-grad-text">Bem-vindo, {displayName}</span>
          </h1>

          <p className="mt-5 max-w-[560px] text-[14px] leading-relaxed text-[var(--mvz-muted)]">
            Analise produtos, desenvolva estratégias, automatize processos e potencialize sua operação com uma inteligência artificial que transforma possibilidades em execução.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button onClick={() => go('agent')} className="mvz-btn-white flex h-11 items-center gap-2 px-6 text-[13px]">
              <Play size={13} fill="currentColor" /> Começar agora
            </button>
            <button
              onClick={() => go('products')}
              className="flex h-11 items-center gap-2 rounded-full border border-white/15 px-5 text-[13px] font-semibold text-white/85 transition hover:bg-white/5"
            >
              Explorar recursos <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* ── Continue + progress ───────────────── */}
      <section className="grid gap-5 lg:grid-cols-[1fr_300px]">
        {/* Card Dividido em 2: GIF Animado Infinito + Informações da Estratégia */}
        <div className="mvz-card relative overflow-hidden rounded-[26px] border border-[var(--mvz-line)] bg-[#0d0c0a] shadow-[0_15px_45px_rgba(0,0,0,0.8)]">
          <div className="grid grid-cols-1 md:grid-cols-2 h-full">
            {/* ── PARTE 1: ANIMAÇÃO EM LOOP INFINITO (PREENCHE TODA A DIVISÃO) ── */}
            <div className="relative min-h-[260px] md:min-h-full w-full overflow-hidden border-b md:border-b-0 md:border-r border-[var(--mvz-line)] bg-black">
              {/* Vídeo em Loop Infinito preenchendo 100% da metade do card */}
              <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 h-full w-full object-cover"
              >
                <source src="/rakeo1q.mp4" type="video/mp4" />
                <source src="https://i.imgur.com/rakeo1q.mp4" type="video/mp4" />
              </video>

              {/* Vinheta escura sutil nas bordas para acabamento refinado */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />

              {/* Badge VIP no topo */}
              <div className="absolute top-3.5 left-3.5 z-10">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--mvz-gold)]/40 bg-black/85 px-3 py-1 text-[10px] font-extrabold uppercase text-[var(--mvz-gold-light)] backdrop-blur-md shadow-lg">
                  <Sparkles size={11} className="text-[var(--mvz-gold)]" /> Agente em Execução
                </span>
              </div>
            </div>

            {/* ── PARTE 2: INFORMAÇÕES DA ESTRATÉGIA DE LANÇAMENTO ── */}
            <div className="flex flex-col justify-between p-6 sm:p-7 space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--mvz-gold-light)]">
                    <span className="mvz-dot h-2 w-2 rounded-full bg-[var(--mvz-gold)]" /> Continue de onde parou
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[9.5px] font-semibold text-white/60">
                    Etapa 3 de 5
                  </span>
                </div>

                <h3 className="mt-2.5 text-[20px] font-black tracking-tight text-white sm:text-[22px]">
                  Estratégia de lançamento — Mini Processador
                </h3>

                <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--mvz-dim)]">
                  Agente IA · 12 mensagens trocadas
                </p>

                {/* Resumo do Status da Estratégia */}
                <div className="mt-4 rounded-xl border border-white/[0.08] bg-black/40 p-3">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--mvz-dim)] mb-1">
                    Último marco alcançado:
                  </div>
                  <p className="text-[12px] leading-relaxed text-white/80">
                    Roteiro de 30s sem aparecer gerado e validado com 3 opções de ganchos virais.
                  </p>
                </div>
              </div>

              <div>
                {/* Barra de Progresso com porcentagem */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-[var(--mvz-dim)]">Progresso da Estratégia</span>
                    <span className="font-mono text-[var(--mvz-gold)]">62% Concluído</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10 p-0.5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[var(--mvz-gold)] to-[var(--mvz-gold-light)] shadow-[0_0_10px_rgba(212,175,55,0.5)]"
                      style={{ width: '62%' }}
                    />
                  </div>
                </div>

                {/* Botão de Retomar Conversa */}
                <button
                  onClick={() => go('agent')}
                  className="mt-4 flex w-fit items-center gap-2 rounded-xl border border-[var(--mvz-gold)]/50 bg-[var(--mvz-gold)]/15 px-4 py-2 text-[12px] font-black uppercase tracking-wider text-[var(--mvz-gold-light)] transition hover:bg-[var(--mvz-gold)] hover:text-black shadow-[0_0_15px_rgba(212,175,55,0.2)]"
                >
                  <span>Retomar conversa</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mvz-card flex flex-col items-center justify-between p-6">
          <span className="text-[9.5px] font-bold uppercase tracking-[0.2em] text-[var(--mvz-dim)]">Uso do ecossistema</span>
          <div className="flex flex-1 items-center justify-center my-auto py-3">
            <Ring value={74} size={104} />
          </div>
          <div className="grid w-full grid-cols-3 border-t border-[var(--mvz-line)] pt-4 text-center">
            {[
              ['8', 'Módulos'],
              ['142', 'Análises'],
              ['3', 'Automações'],
            ].map(([n, l]) => (
              <div key={l}>
                <div className="text-[17px] font-bold">{n}</div>
                <div className="mt-0.5 text-[8.5px] font-semibold uppercase tracking-wider text-[var(--mvz-dim)]">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tools ─────────────────────────────── */}
      <section className="pt-3">
        <SectionTitle
          icon={<Zap size={16} className="text-[var(--mvz-pink)]" fill="currentColor" />}
          right={
            <button onClick={() => go('turbo')} className="text-[12px] font-semibold text-[var(--mvz-muted)] hover:text-white">
              Ver todas →
            </button>
          }
        >
          Recursos & Ecossistema
        </SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {TOOLS.map((t) => {
            const Icon = t.icon;
            const tone = TONE[t.tone];
            return (
              <button
                key={t.id}
                onClick={() => go(t.view)}
                className="mvz-card mvz-card-hover group relative overflow-hidden p-5 text-left"
              >
                <div
                  className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-0 blur-3xl transition-opacity duration-300 group-hover:opacity-100"
                  style={{ background: tone.soft }}
                />
                <div className="flex items-start justify-between">
                  <IconBox tone={t.tone}>
                    <Icon size={18} />
                  </IconBox>
                  {t.badge && <Pill tone={t.tone}>{t.badge}</Pill>}
                </div>
                <h3 className="mt-4 text-[14.5px] font-bold">{t.title}</h3>
                <p className="mt-1.5 text-[12px] leading-relaxed text-[var(--mvz-muted)]">{t.desc}</p>
                <div className="mt-4 flex items-center gap-1 text-[11px] font-bold opacity-0 transition-opacity group-hover:opacity-100" style={{ color: tone.hex }}>
                  Abrir <ArrowRight size={12} />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Trending + activity ───────────────── */}
      <section className="grid gap-5 pb-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="mvz-card p-6">
          <SectionTitle
            icon={<TrendingUp size={16} className="text-[var(--mvz-cyan)]" />}
            right={<Pill tone="green">Atualizado hoje</Pill>}
          >
            Produtos em alta
          </SectionTitle>
          <div className="divide-y divide-[var(--mvz-line)]">
            {TRENDING.map((p, i) => (
              <button
                key={p.name}
                onClick={() => go('product')}
                className="flex w-full items-center gap-4 py-3 text-left transition hover:bg-white/[0.02]"
              >
                <span className="w-4 text-[11px] font-bold text-[var(--mvz-dim)]">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-semibold">{p.name}</div>
                  <div className="text-[11px] text-[var(--mvz-dim)]">{p.cat}</div>
                </div>
                <span className="text-[12px] font-bold text-[var(--mvz-green)]">{p.trend}</span>
                <ScoreBadge score={p.score} />
              </button>
            ))}
          </div>
        </div>

        <div className="mvz-card p-6">
          <SectionTitle>Atividade recente</SectionTitle>
          <div className="space-y-4">
            {ACTIVITY.map((a) => {
              const Icon = a.icon;
              return (
                <div key={a.text} className="flex items-center gap-3">
                  <IconBox tone={a.tone} size={34}>
                    <Icon size={14} />
                  </IconBox>
                  <div className="min-w-0 flex-1">
                    <div className="text-[12.5px] font-semibold">{a.text}</div>
                    <div className="truncate text-[11px] text-[var(--mvz-dim)]">{a.sub}</div>
                  </div>
                  <span className="text-[10.5px] font-medium text-[var(--mvz-dim)]">{a.time}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

import { Check, Crown, MessageCircle, Send, LifeBuoy, BookOpen, Mail, type LucideIcon } from 'lucide-react';
import type { Tone } from '../data';
import { IconBox, PageHeader, Pill, Ring, TONE } from '../ui';

/* ───────────── Tokens / plans ───────────── */

const PLANS = [
  { name: 'Starter', price: 'R$ 0', tokens: '1.000', perks: ['Agente IA básico', '3 módulos', 'Biblioteca de Prompts'], hot: false },
  { name: 'Pro', price: 'R$ 97', tokens: '10.000', perks: ['Agente IA completo', 'Todos os módulos', 'Automações ilimitadas', 'Turbo Seguidores 3D'], hot: true },
  { name: 'VIP', price: 'R$ 197', tokens: '40.000', perks: ['Tudo do Pro', 'Modelo avançado', 'Suporte prioritário', 'Acesso antecipado'], hot: false },
];

export function CreditsView() {
  return (
    <div className="mvz-fade-up">
      <PageHeader
        eyebrow="Tokens"
        title={
          <>
            Combustível do seu <span className="mvz-grad-text">agente.</span>
          </>
        }
        subtitle="Cada ação do agente consome tokens. Acompanhe o uso e escolha o plano ideal."
      />

      <div className="mvz-card mb-6 flex flex-col items-center gap-8 p-6 sm:flex-row">
        <Ring value={74} size={130} stroke={8} label={<div className="text-center"><div className="text-2xl font-extrabold">7.420</div><div className="text-[9px] font-semibold uppercase tracking-wider text-[var(--mvz-dim)]">de 10.000</div></div>} />
        <div className="grid flex-1 grid-cols-3 gap-4 text-center sm:text-left">
          {[
            ['Agente IA', '4.120'],
            ['Análises', '2.310'],
            ['Automações', '990'],
          ].map(([l, v]) => (
            <div key={l}>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--mvz-dim)]">{l}</div>
              <div className="mt-1 text-xl font-bold">{v}</div>
            </div>
          ))}
        </div>
        <button className="mvz-btn-white flex h-11 items-center gap-2 px-6 text-[13px]">
          <Crown size={14} /> Recarregar
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((p) => (
          <div
            key={p.name}
            className={`mvz-card relative p-6 ${p.hot ? '!border-[rgba(235,210,138,0.5)] shadow-[0_0_60px_rgba(235,210,138,0.12)]' : ''}`}
          >
            {p.hot && <Pill tone="violet" className="absolute right-5 top-5">Mais popular</Pill>}
            <h3 className="text-[15px] font-bold">{p.name}</h3>
            <div className="mt-3 flex items-end gap-1">
              <span className="text-4xl font-extrabold">{p.price}</span>
              <span className="mb-1 text-[12px] text-[var(--mvz-dim)]">/mês</span>
            </div>
            <div className="mt-1 text-[12px] font-semibold text-[var(--mvz-cyan)]">{p.tokens} tokens</div>
            <ul className="mt-5 space-y-2.5">
              {p.perks.map((k) => (
                <li key={k} className="flex items-center gap-2.5 text-[12.5px] text-white/80">
                  <Check size={13} className="text-[var(--mvz-green)]" /> {k}
                </li>
              ))}
            </ul>
            <button className={`mt-6 h-10 w-full text-[12.5px] ${p.hot ? 'mvz-btn-grad' : 'rounded-xl border border-[var(--mvz-line-strong)] font-semibold hover:bg-white/5'}`}>
              {p.hot ? 'Assinar Pro' : 'Selecionar'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────────── Community ───────────── */

const GROUPS: { name: string; desc: string; members: string; icon: LucideIcon; tone: Tone }[] = [
  { name: 'Grupo WhatsApp', desc: 'Avisos rápidos, dicas diárias e produtos em alta.', members: '2.4k membros', icon: MessageCircle, tone: 'green' },
  { name: 'Grupo Discord', desc: 'Salas por nicho, lives semanais e mentorias.', members: '1.8k membros', icon: MessageCircle, tone: 'violet' },
  { name: 'Grupo Telegram', desc: 'Canal de alertas e atualizações do agente.', members: '3.1k membros', icon: Send, tone: 'cyan' },
];

export function CommunityView() {
  return (
    <div className="mvz-fade-up">
      <PageHeader
        eyebrow="Comunidade"
        title={
          <>
            Quem executa <span className="mvz-grad-text">cresce junto.</span>
          </>
        }
        subtitle="Troque resultados, tire dúvidas e acompanhe as novidades do ecossistema."
      />
      <div className="grid gap-4 md:grid-cols-3">
        {GROUPS.map((g) => {
          const Icon = g.icon;
          return (
            <div key={g.name} className="mvz-card mvz-card-hover p-6">
              <IconBox tone={g.tone} size={46}>
                <Icon size={20} />
              </IconBox>
              <h3 className="mt-5 text-[16px] font-bold">{g.name}</h3>
              <p className="mt-2 text-[12.5px] leading-relaxed text-[var(--mvz-muted)]">{g.desc}</p>
              <div className="mt-5 flex items-center justify-between">
                <span className="text-[11.5px] font-semibold" style={{ color: TONE[g.tone].hex }}>{g.members}</span>
                <button className="mvz-btn-white h-9 px-4 text-[12px]">Entrar</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ───────────── Support & Help ───────────── */

const FAQ = [
  ['Como o agente opera?', 'Ele interpreta o seu pedido e aciona automaticamente o Analisador, o Scanner, os Hooks ou a Biblioteca de Prompts conforme necessário.'],
  ['O que consome tokens?', 'Mensagens ao agente, análises e execuções de automações. Prompts e Hooks copiados manualmente não consomem.'],
  ['Meus dados ficam seguros?', 'Tudo o que você conversa e gera é privado e só é usado nas suas conversas.'],
  ['Posso conectar minha própria loja?', 'Sim — em breve você poderá importar dados reais do TikTok Shop para análises mais precisas.'],
];

export function HelpView({ mode }: { mode: 'support' | 'help' }) {
  const support = mode === 'support';
  return (
    <div className="mvz-fade-up">
      <PageHeader
        eyebrow={support ? 'Suporte' : 'Ajuda'}
        title={
          support ? (
            <>
              Estamos aqui <span className="mvz-grad-text">para ajudar.</span>
            </>
          ) : (
            <>
              Perguntas <span className="mvz-grad-text">frequentes.</span>
            </>
          )
        }
        subtitle={support ? 'Fale com a equipe pelo canal que preferir.' : 'Respostas rápidas sobre o agente e o ecossistema.'}
      />

      {support ? (
        <div className="grid gap-4 md:grid-cols-3">
          {([
            ['WhatsApp', 'Resposta em até 2h', MessageCircle, 'green'],
            ['E-mail', 'suporte@orbiex.ai', Mail, 'cyan'],
            ['Central de ajuda', 'Guias e tutoriais', BookOpen, 'violet'],
          ] as [string, string, LucideIcon, Tone][]).map(([t, d, Icon, tone]) => (
            <button key={t} className="mvz-card mvz-card-hover p-6 text-left">
              <IconBox tone={tone} size={46}>
                <Icon size={20} />
              </IconBox>
              <h3 className="mt-5 text-[16px] font-bold">{t}</h3>
              <p className="mt-1.5 text-[12.5px] text-[var(--mvz-muted)]">{d}</p>
            </button>
          ))}
        </div>
      ) : (
        <div className="mvz-card divide-y divide-[var(--mvz-line)]">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[14px] font-semibold">
                {q}
                <LifeBuoy size={14} className="shrink-0 text-[var(--mvz-dim)] transition group-open:rotate-90 group-open:text-[var(--mvz-cyan)]" />
              </summary>
              <p className="mt-3 text-[13px] leading-relaxed text-[var(--mvz-muted)]">{a}</p>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}

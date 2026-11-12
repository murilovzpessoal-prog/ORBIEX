import { Clock, Plus } from 'lucide-react';
import { useState } from 'react';
import { PageHeader, Pill } from '../ui';

interface Auto {
  id: string;
  title: string;
  desc: string;
  when: string;
  runs: number;
  on: boolean;
}

const INITIAL: Auto[] = [
  { id: 'a1', title: 'Relatório diário de tendências', desc: 'Todo dia às 8h o agente varre os produtos em alta e envia um resumo.', when: 'Todo dia · 08:00', runs: 42, on: true },
  { id: 'a2', title: 'Monitor de concorrentes', desc: 'Avisa quando um concorrente lança um produto ou muda preços.', when: 'A cada 6 horas', runs: 168, on: true },
  { id: 'a3', title: 'Calendário de conteúdo semanal', desc: 'Gera 7 roteiros toda segunda com base no produto campeão.', when: 'Segundas · 09:00', runs: 12, on: true },
  { id: 'a4', title: 'Alerta de queda de score', desc: 'Notifica se o score de um produto salvo cair mais de 10 pontos.', when: 'Em tempo real', runs: 5, on: false },
];

export function AutomationsView() {
  const [items, setItems] = useState(INITIAL);
  const toggle = (id: string) => setItems((l) => l.map((a) => (a.id === id ? { ...a, on: !a.on } : a)));
  const active = items.filter((i) => i.on).length;

  return (
    <div className="mvz-fade-up">
      <PageHeader
        eyebrow="Automações"
        title={
          <>
            Seu agente trabalha <span className="mvz-grad-text">enquanto você dorme.</span>
          </>
        }
        subtitle={`${active} de ${items.length} automações ativas.`}
        action={
          <button className="mvz-btn-grad flex h-10 items-center gap-2 px-4 text-[12.5px]">
            <Plus size={14} /> Nova automação
          </button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {items.map((a) => (
          <div key={a.id} className={`mvz-card p-5 transition-opacity ${a.on ? '' : 'opacity-60'}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-[15px] font-bold">{a.title}</h3>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-[var(--mvz-muted)]">{a.desc}</p>
              </div>
              <button
                role="switch"
                aria-checked={a.on}
                aria-label={`Ativar ${a.title}`}
                onClick={() => toggle(a.id)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${a.on ? 'mvz-grad-bg' : 'bg-white/10'}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${a.on ? 'left-[22px]' : 'left-0.5'}`} />
              </button>
            </div>
            <div className="mt-4 flex items-center gap-3 border-t border-[var(--mvz-line)] pt-4 text-[11.5px] text-[var(--mvz-dim)]">
              <span className="flex items-center gap-1.5">
                <Clock size={12} /> {a.when}
              </span>
              <span className="ml-auto">{a.runs} execuções</span>
              <Pill tone={a.on ? 'green' : 'amber'}>{a.on ? 'Ativa' : 'Pausada'}</Pill>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

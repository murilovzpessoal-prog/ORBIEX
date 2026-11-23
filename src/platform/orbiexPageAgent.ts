/**
 * Orbiex Page Agent — o Agente de Voz enxerga e opera a PRÓPRIA Orbiex
 * (sem extensão): mapa espacial da tela, ícones, contexto de cards,
 * cliques, digitação e cópia com destaque dourado.
 */
import { CLIPBOARD_CAPTURED_EVENT, copyText, getAgentClipboard, setAgentClipboard } from './clipboard';

export interface OrbiexScreenElement {
  uid: number;
  kind: 'input' | 'button';
  label: string;
  context?: string;
  region: string;
  xPct: number;
  yPct: number;
  w: number;
  h: number;
}

export interface OrbiexActionInput {
  actionType: 'click' | 'type' | 'copy';
  target: string;
  spatialHint?: string;
  userInstruction?: string;
  textToType?: string;
  pressEnter?: boolean;
  currentViewLabel?: string;
}

export interface OrbiexActionResult {
  ok: boolean;
  message?: string;
  error?: string;
  clickedLabel?: string;
  copiedText?: string;
  availableButtons?: string[];
}

const uidMap = new Map<number, HTMLElement>();

/** Ícones lucide → significado em português (botões só com ícone) */
const ICON_MEANING: Record<string, string> = {
  copy: 'copiar',
  check: 'confirmar / copiado',
  x: 'fechar',
  plus: 'adicionar / novo',
  'arrow-up': 'enviar',
  send: 'enviar',
  'send-horizontal': 'enviar',
  'refresh-cw': 'gerar novamente / atualizar',
  'rotate-ccw': 'limpar / resetar',
  'trash-2': 'excluir',
  trash: 'excluir',
  mic: 'microfone',
  'mic-off': 'microfone desligado',
  paperclip: 'anexar arquivo',
  sparkles: 'gerar com IA',
  zap: 'gerar / executar',
  'external-link': 'abrir link externo',
  download: 'baixar',
  upload: 'enviar arquivo',
  search: 'pesquisar',
  menu: 'menu',
  history: 'histórico',
  'chevron-down': 'expandir',
  'chevron-up': 'recolher',
  'chevron-right': 'avançar',
  'chevron-left': 'voltar',
  'arrow-right': 'avançar / ir',
  'arrow-left': 'voltar',
  bot: 'agente orbiex',
  'thumbs-up': 'gostei',
  'thumbs-down': 'não gostei',
  settings: 'configurações',
  'log-out': 'sair',
  play: 'reproduzir',
  pause: 'pausar',
  'message-circle': 'chat',
  'message-square': 'chat',
  puzzle: 'extensão copilot',
  square: 'parar',
};

function norm(s: string): string {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isInsideVoiceUI(el: Element): boolean {
  return Boolean(el.closest('[data-orbiex-voice-ui]'));
}

function isVisibleBox(el: HTMLElement): boolean {
  const r = el.getBoundingClientRect();
  if (r.width < 6 || r.height < 6) return false;
  const st = window.getComputedStyle(el);
  if (st.display === 'none' || st.visibility === 'hidden' || parseFloat(st.opacity || '1') < 0.05) return false;
  return true;
}

function isEditable(el: HTMLElement): boolean {
  const tag = el.tagName.toLowerCase();
  if (tag === 'textarea') return !(el as HTMLTextAreaElement).disabled && !(el as HTMLTextAreaElement).readOnly;
  if (tag === 'input') {
    const tp = (el.getAttribute('type') || 'text').toLowerCase();
    return ['text', 'search', 'url', 'email', 'tel', 'number', ''].includes(tp) && !(el as HTMLInputElement).disabled;
  }
  return el.isContentEditable;
}

function isClickable(el: HTMLElement): boolean {
  const tag = el.tagName.toLowerCase();
  if (tag === 'button' || tag === 'a' || tag === 'select' || tag === 'summary') return true;
  if (tag === 'input') {
    const tp = (el.getAttribute('type') || '').toLowerCase();
    return ['button', 'submit', 'checkbox', 'radio', 'range'].includes(tp);
  }
  const role = (el.getAttribute('role') || '').toLowerCase();
  if (['button', 'link', 'tab', 'menuitem', 'option', 'switch'].includes(role)) return true;
  if (tag === 'label' && el.querySelector('input[type="checkbox"],input[type="radio"]')) return true;
  const st = window.getComputedStyle(el);
  return st.cursor === 'pointer' && el.children.length <= 6 && (el.innerText || '').length < 160;
}

function iconHint(el: HTMLElement): string {
  const svgs = Array.from(el.querySelectorAll('svg')).slice(0, 2);
  const names: string[] = [];
  for (const svg of svgs) {
    const cls = svg.getAttribute('class') || '';
    const m = cls.match(/lucide-([a-z0-9-]+)/);
    if (m && m[1] !== 'icon') {
      const meaning = ICON_MEANING[m[1]];
      names.push(meaning ? `ícone ${m[1]} (${meaning})` : `ícone ${m[1]}`);
    }
  }
  return names.join(' ');
}

/** Contexto do card/seção onde o elemento está (ex.: Card 1 · título do prompt, nome do produto) */
function cardContext(el: HTMLElement): string {
  const explicitCard = el.closest('[data-card-context]') as HTMLElement | null;
  if (explicitCard) {
    const attr = explicitCard.getAttribute('data-card-context') || '';
    if (attr) return attr.slice(0, 100);
  }
  let node: HTMLElement | null = el.parentElement;
  for (let depth = 0; node && depth < 7; depth++, node = node.parentElement) {
    if (node.id === 'mvz-main') break;
    const heading = node.querySelector('h1,h2,h3,h4,strong,[class*="font-bold"],[class*="font-black"]') as HTMLElement | null;
    const text = (heading?.innerText || '').replace(/\s+/g, ' ').trim();
    const ownText = (el.innerText || '').replace(/\s+/g, ' ').trim();
    if (text && text !== ownText && text.length >= 3) return text.slice(0, 90);
  }
  return '';
}

function isInsideOpenModal(el: HTMLElement): boolean {
  const modalBackdrop = el.closest('.fixed.inset-0, [role="dialog"]') as HTMLElement | null;
  return Boolean(modalBackdrop && !isInsideVoiceUI(modalBackdrop));
}

function computeRegion(xPct: number, yPct: number, offscreen: 'acima' | 'abaixo' | null): string {
  if (offscreen) return `fora-da-tela-${offscreen}`;
  const v = yPct < 30 ? 'topo' : yPct > 66 ? 'inferior' : 'meio';
  const h = xPct < 33 ? 'esquerdo' : xPct > 67 ? 'direito' : 'centro';
  if (v === 'meio' && h === 'centro') return 'centro';
  return `${v}-${h}`;
}

function zoneName(el: HTMLElement): string {
  if (isInsideOpenModal(el)) return 'modal aberto em destaque';
  if (el.closest('aside, nav')) return 'menu lateral';
  if (el.closest('header')) return 'barra superior';
  return '';
}

/** Mapa espacial da Orbiex (tela visível + itens logo abaixo/acima da dobra) */
export function scanOrbiexScreen(): OrbiexScreenElement[] {
  uidMap.clear();
  const vw = Math.max(1, window.innerWidth);
  const vh = Math.max(1, window.innerHeight);
  const all = Array.from(
    document.querySelectorAll<HTMLElement>(
      'button, a, input, textarea, select, summary, label, [role], [contenteditable="true"], [tabindex], div, span'
    )
  );

  const picked: { el: HTMLElement; editable: boolean; rect: DOMRect }[] = [];
  const seen = new Set<HTMLElement>();

  for (const el of all) {
    if (seen.has(el) || isInsideVoiceUI(el)) continue;
    const editable = isEditable(el);
    if (!editable && !isClickable(el)) continue;
    if (!isVisibleBox(el)) continue;
    // evita registrar filho e pai clicáveis ao mesmo tempo
    const parentClickable = el.parentElement?.closest('button, a, [role="button"]') as HTMLElement | null;
    if (!editable && parentClickable && parentClickable !== el && !isInsideVoiceUI(parentClickable)) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width > vw * 0.95 && rect.height > vh * 0.8) continue;
    if (rect.bottom < -vh * 1.2 || rect.top > vh * 2.2) continue; // limite de alcance
    seen.add(el);
    picked.push({ el, editable, rect });
  }

  // ordem de leitura: visíveis primeiro (topo→base), depois fora da tela
  picked.sort((a, b) => {
    const aOn = a.rect.bottom > 0 && a.rect.top < vh ? 0 : 1;
    const bOn = b.rect.bottom > 0 && b.rect.top < vh ? 0 : 1;
    if (aOn !== bOn) return aOn - bOn;
    return a.rect.top - b.rect.top || a.rect.left - b.rect.left;
  });

  const out: OrbiexScreenElement[] = [];
  let uid = 1;
  for (const { el, editable, rect } of picked.slice(0, 160)) {
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const xPct = Math.round((cx / vw) * 100);
    const yPct = Math.round((cy / vh) * 100);
    const offscreen = rect.bottom < 0 ? 'acima' : rect.top > vh ? 'abaixo' : null;

    const own = (el.innerText || (el as HTMLInputElement).value || '').replace(/\s+/g, ' ').trim().slice(0, 80);
    const label = [
      el.getAttribute('aria-label') || '',
      el.getAttribute('title') || '',
      el.getAttribute('placeholder') || '',
      own,
      iconHint(el),
    ]
      .filter(Boolean)
      .join(' | ')
      .slice(0, 140);
    const zone = zoneName(el);
    const ctx = [zone, cardContext(el)].filter(Boolean).join(' · ');

    uidMap.set(uid, el);
    out.push({
      uid,
      kind: editable ? 'input' : 'button',
      label: label || el.tagName.toLowerCase(),
      context: ctx || undefined,
      region: computeRegion(xPct, yPct, offscreen),
      xPct,
      yPct,
      w: Math.round(rect.width),
      h: Math.round(rect.height),
    });
    uid++;
  }
  return out;
}

function spatialBonus(hint: string, xPct: number, yPct: number, region: string): number {
  if (!hint) return 0;
  const s = norm(hint);
  let b = 0;
  if (/inferior|baixo|embaixo|rodape|bottom/.test(s)) b += yPct >= 60 ? 40 : yPct >= 45 ? 8 : -30;
  if (/superior|topo|cima|top|cabecalho/.test(s)) b += yPct <= 35 ? 40 : yPct <= 50 ? 8 : -30;
  if (/direit|right/.test(s)) b += xPct >= 60 ? 40 : xPct >= 48 ? 8 : -30;
  if (/esquerd|left|lateral|menu/.test(s)) b += xPct <= 40 ? 40 : xPct <= 52 ? 8 : -30;
  if (/centro|meio/.test(s) && !/direit|esquerd/.test(s)) b += xPct >= 30 && xPct <= 70 ? 25 : -10;
  if (region.startsWith('fora-da-tela')) b -= 12;
  return b;
}

const SYNONYMS: string[][] = [
  ['copiar', 'copy', 'copiado'],
  ['gerar', 'criar', 'zap', 'sparkles', 'gerar com ia', 'analisar', 'auditar'],
  ['enviar', 'send', 'arrow up', 'mandar'],
  ['fechar', 'x', 'cancelar'],
  ['limpar', 'rotate ccw', 'resetar'],
  ['novo', 'plus', 'adicionar', 'nova conversa'],
  ['gerar novamente', 'refresh cw', 'regenerar', 'atualizar'],
  ['chat', 'mensagem', 'conversa', 'pergunte', 'digite'],
];

function ordinalBonus(queryAndInstruction: string, ctx: string, uid: number): number {
  const s = norm(queryAndInstruction);
  const c = norm(ctx);
  if (/\b(primeir[oa]|card 1|numero 1|1o|1a)\b/.test(s) && c.includes('card 1')) return 45;
  if (/\b(segund[oa]|card 2|numero 2|2o|2a)\b/.test(s) && c.includes('card 2')) return 45;
  if (/\b(terceir[oa]|card 3|numero 3|3o|3a)\b/.test(s) && c.includes('card 3')) return 45;
  if (/\b(quart[oa]|card 4|numero 4|4o|4a)\b/.test(s) && c.includes('card 4')) return 45;
  // Desempate suave a favor do primeiro item visível quando há vários botões idênticos (ex: "Copiar Prompt")
  return Math.max(0, 6 - uid * 0.08);
}

function localScore(el: OrbiexScreenElement, input: OrbiexActionInput, anyModalOpen: boolean): number {
  const meta = norm(`${el.label} ${el.context || ''}`);
  const q = norm(`${input.target}`);
  if (!q) return 0;
  let score = 0;
  if (meta.includes(q)) score += 90;
  const qTokens = q.split(' ').filter((t) => t.length > 2);
  const hits = qTokens.filter((t) => meta.includes(t)).length;
  score += hits * 18;
  for (const group of SYNONYMS) {
    if (group.some((g) => q.includes(g)) && group.some((g) => meta.includes(g))) score += 30;
  }
  if (input.actionType === 'type') score += el.kind === 'input' ? 45 : -20;
  if (input.actionType !== 'type' && el.kind === 'input') score -= 25;
  if (anyModalOpen && (el.context || '').includes('modal aberto em destaque')) {
    score += 80;
  }
  score += ordinalBonus(`${input.target} ${input.userInstruction || ''}`, el.context || '', el.uid);
  score += spatialBonus(`${input.spatialHint || ''} ${input.userInstruction || ''}`, el.xPct, el.yPct, el.region);
  return score;
}

function highlight(el: HTMLElement, text: string) {
  try {
    const r = el.getBoundingClientRect();
    const ring = document.createElement('div');
    ring.setAttribute('data-orbiex-voice-ui', '1');
    ring.style.cssText = [
      `position:fixed;left:${Math.max(2, r.left - 6)}px;top:${Math.max(2, r.top - 6)}px;`,
      `width:${Math.max(20, r.width + 12)}px;height:${Math.max(20, r.height + 12)}px;border-radius:14px;`,
      'border:2.5px solid #f4d77a;box-shadow:0 0 26px rgba(212,175,55,0.85),inset 0 0 14px rgba(212,175,55,0.3);',
      'pointer-events:none;z-index:2147483000;transition:opacity .4s ease,transform .3s ease;',
    ].join('');
    const tag = document.createElement('div');
    tag.textContent = text;
    tag.style.cssText =
      'position:absolute;left:0;top:-26px;white-space:nowrap;background:#0b0a08;border:1px solid rgba(212,175,55,.6);color:#f4d77a;font:700 11px/1 system-ui;padding:5px 8px;border-radius:8px;';
    ring.appendChild(tag);
    document.body.appendChild(ring);
    window.setTimeout(() => {
      ring.style.opacity = '0';
      ring.style.transform = 'scale(1.05)';
      window.setTimeout(() => ring.remove(), 450);
    }, 1500);
  } catch {
    /* noop */
  }
}

function setNativeValue(el: HTMLElement, text: string) {
  el.focus();
  const tag = el.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea') {
    const proto = tag === 'textarea' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    if (setter) setter.call(el, text);
    else (el as HTMLInputElement).value = text;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return;
  }
  try {
    const sel = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(el);
    sel?.removeAllRanges();
    sel?.addRange(range);
    if (!document.execCommand('insertText', false, text)) el.textContent = text;
  } catch {
    el.textContent = text;
  }
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

function pressEnterOn(el: HTMLElement) {
  const opts = { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true };
  el.dispatchEvent(new KeyboardEvent('keydown', opts));
  el.dispatchEvent(new KeyboardEvent('keypress', opts));
  el.dispatchEvent(new KeyboardEvent('keyup', opts));
}

const wait = (ms: number) => new Promise((r) => window.setTimeout(r, ms));

function isCopyButton(el: HTMLElement): boolean {
  const meta = norm(`${el.getAttribute('aria-label') || ''} ${el.getAttribute('title') || ''} ${el.innerText || ''} ${iconHint(el)}`);
  return /copiar|copy/.test(meta);
}

/** Texto útil do card em volta do elemento (para copiar quando não há botão de copiar) */
function copyableTextAround(el: HTMLElement): string {
  let node: HTMLElement | null = el;
  for (let depth = 0; node && depth < 6; depth++, node = node.parentElement) {
    if (node.id === 'mvz-main') break;
    const t = (node.innerText || '').replace(/\n{3,}/g, '\n\n').trim();
    if (t.length >= 25) return t.slice(0, 4000);
  }
  return (el.innerText || '').trim();
}

async function clickAndCaptureClipboard(btn: HTMLElement): Promise<string> {
  let captured = btn.getAttribute('data-copy-text') || '';
  const onCaptured = (ev: Event) => {
    const t = (ev as CustomEvent<{ text?: string }>).detail?.text;
    if (t) captured = t;
  };
  window.addEventListener(CLIPBOARD_CAPTURED_EVENT, onCaptured);
  try {
    btn.click();
    await wait(60);
  } finally {
    window.removeEventListener(CLIPBOARD_CAPTURED_EVENT, onCaptured);
  }
  if (captured) {
    setAgentClipboard(captured);
    await copyText(captured);
  }
  return captured;
}

async function executeOn(el: HTMLElement, input: OrbiexActionInput): Promise<OrbiexActionResult> {
  const label = (el.getAttribute('aria-label') || el.innerText || el.getAttribute('placeholder') || '').replace(/\s+/g, ' ').trim().slice(0, 60);
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  await wait(240);

  if (input.actionType === 'type') {
    let field = el;
    if (!isEditable(field)) {
      field.click();
      await wait(220);
      const active = document.activeElement as HTMLElement | null;
      const inner = field.querySelector<HTMLElement>('input, textarea, [contenteditable="true"]');
      field = (active && isEditable(active) ? active : inner) || field;
    }
    if (!isEditable(field)) return { ok: false, error: `O elemento "${label}" não é um campo de texto.` };
    const resolvedText =
      input.textToType === '__ORBIEX_CLIPBOARD__' ? getAgentClipboard() : String(input.textToType || '');
    if (!resolvedText) {
      return { ok: false, error: 'Nenhum prompt ou texto foi copiado ainda para colar.' };
    }
    highlight(field, `Digitando: "${resolvedText.slice(0, 24)}"`);
    setNativeValue(field, resolvedText);
    if (input.pressEnter) {
      await wait(160);
      pressEnterOn(field);
    }
    return { ok: true, message: `Texto preenchido em "${label || 'campo'}"${input.pressEnter ? ' e enviado' : ''}.`, clickedLabel: label };
  }

  if (input.actionType === 'copy') {
    const copyBtn: HTMLElement | null = isCopyButton(el)
      ? el
      : Array.from(el.querySelectorAll<HTMLElement>('button')).find(isCopyButton) ||
        Array.from(el.parentElement?.querySelectorAll<HTMLElement>('button') || []).find(isCopyButton) ||
        null;
    if (copyBtn) {
      highlight(copyBtn, 'Copiando e guardando...');
      const captured = await clickAndCaptureClipboard(copyBtn);
      const fallback = captured || copyableTextAround(copyBtn);
      if (fallback && !captured) await copyText(fallback);
      const finalCopied = captured || fallback;
      return {
        ok: true,
        message: finalCopied
          ? `Prompt/conteúdo copiado e guardado na memória do Agente (${finalCopied.length} caracteres) — pronto para colar!`
          : `Conteúdo copiado pelo botão de "${label || 'item'}".`,
        clickedLabel: label,
        copiedText: finalCopied.slice(0, 300),
      };
    }
    const text = copyableTextAround(el);
    if (!text) return { ok: false, error: 'Não encontrei texto para copiar nesse local.' };
    await copyText(text);
    highlight(el, 'Copiado e guardado!');
    return {
      ok: true,
      message: `Conteúdo copiado e salvo na memória do Agente (${text.length} caracteres).`,
      copiedText: text.slice(0, 300),
    };
  }

  // Mesmo num clique normal (ex: "clica no botão Copiar Prompt"), captura e guarda o comando copiado!
  highlight(el, `Clicou: ${label.slice(0, 28) || 'elemento'}`);
  await wait(100);
  const capturedOnClick = await clickAndCaptureClipboard(el);
  if (capturedOnClick) {
    return {
      ok: true,
      clickedLabel: label,
      copiedText: capturedOnClick.slice(0, 300),
      message: `Cliquei em "${label || 'botão'}" e GUARDEI o prompt/conteúdo completo (${capturedOnClick.length} caracteres) na memória e na área de transferência — pronto para colar no Google Flow ou onde você pedir!`,
    };
  }
  return { ok: true, message: `Cliquei em "${label || 'elemento'}".`, clickedLabel: label };
}

/**
 * Orquestrador inteligente dentro da Orbiex:
 * 1) mapa espacial da tela  2) match local forte → executa na hora
 * 3) caso ambíguo (ex.: "o chat da direita embaixo"), IA escolhe o uid exato pelo mapa.
 */
export async function orbiexSmartAction(input: OrbiexActionInput): Promise<OrbiexActionResult> {
  const elements = scanOrbiexScreen();
  if (!elements.length) return { ok: false, error: 'Nenhum elemento interativo encontrado na tela da Orbiex.' };

  const anyModalOpen = elements.some((e) => (e.context || '').includes('modal aberto em destaque'));
  const ranked = elements
    .map((e) => ({ e, s: localScore(e, input, anyModalOpen) }))
    .sort((a, b) => b.s - a.s);
  const best = ranked[0];
  const second = ranked[1];
  const hasSpatial = Boolean((input.spatialHint || '').trim());
  const identicalRepeatedButton =
    best && second && norm(best.e.label) === norm(second.e.label) && !hasSpatial && best.s >= 105;
  const clearWinner =
    (best && best.s >= 105 && (!second || best.s - second.s >= 35) && !hasSpatial) || Boolean(identicalRepeatedButton);

  let chosenUid: number | null = clearWinner ? best.e.uid : null;

  if (!chosenUid) {
    try {
      const r = await fetch('/api/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'vision_grounding',
          actionType: input.actionType === 'type' ? 'type' : 'click',
          userInstruction:
            (input.userInstruction || `${input.spatialHint ? `[${input.spatialHint}] ` : ''}${input.target}`) +
            (input.actionType === 'copy' ? ' (objetivo: COPIAR esse conteúdo — prefira o botão de copiar desse card)' : ''),
          target: input.target,
          spatialHint: input.spatialHint || '',
          url: `${window.location.origin}/${window.location.hash}`,
          title: `Plataforma Orbiex — aba ${input.currentViewLabel || window.location.hash.replace('#/', '')}`,
          elements,
        }),
      });
      if (r.ok) {
        const json = await r.json();
        const uid = Number(json?.data?.uid);
        if (json?.success && Number.isFinite(uid) && uidMap.has(uid)) chosenUid = uid;
      }
    } catch {
      /* fallback local */
    }
  }

  if (!chosenUid && best && best.s >= 40) chosenUid = best.e.uid;

  const el = chosenUid ? uidMap.get(chosenUid) : null;
  if (!el) {
    return {
      ok: false,
      error: `Não encontrei "${input.target}" na tela atual da Orbiex.`,
      availableButtons: elements
        .filter((e) => !e.region.startsWith('fora'))
        .slice(0, 25)
        .map((e) => `[${e.region}] ${e.label}`),
    };
  }
  return executeOn(el, input);
}

/** Resumo do que está visível agora na Orbiex (para o agente se orientar) */
export function describeOrbiexScreen(): string[] {
  return scanOrbiexScreen()
    .filter((e) => !e.region.startsWith('fora'))
    .slice(0, 35)
    .map((e) => `[${e.region}] ${e.kind === 'input' ? '(campo) ' : ''}${e.label}${e.context ? ` — em: ${e.context}` : ''}`);
}

export function scrollOrbiex(direction: string): string {
  const main = document.getElementById('mvz-main');
  const target: HTMLElement | Window = main || window;
  const h = main ? main.clientHeight : window.innerHeight;
  const delta = Math.round(h * 0.75);
  const opts = (top: number): ScrollToOptions => ({ top, behavior: 'smooth' });
  if (direction === 'top') target.scrollTo(opts(0));
  else if (direction === 'bottom') target.scrollTo(opts(main ? main.scrollHeight : document.body.scrollHeight));
  else if (main) main.scrollBy(opts(direction === 'up' ? -delta : delta));
  else window.scrollBy(opts(direction === 'up' ? -delta : delta));
  return direction === 'up' || direction === 'top' ? 'Rolei a Orbiex para cima.' : 'Rolei a Orbiex para baixo.';
}

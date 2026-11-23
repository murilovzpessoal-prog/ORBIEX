/**
 * Orbiex Universal Clipboard + Memória Persistente do Agente de Voz.
 * Garante que QUALQUER botão de copiar clicado (pelo mouse ou pelo Agente de Voz,
 * mesmo sem user-gesture em WebSocket) guarde 100% do conteúdo para colar depois
 * no Google Flow, Kling AI, TikTok ou dentro da própria Orbiex.
 */

const AGENT_CLIPBOARD_KEY = 'orbiex_agent_clipboard_v1';
export const CLIPBOARD_CAPTURED_EVENT = 'orbiex:clipboard-captured';

let memoryClipboard = '';

export function setAgentClipboard(text: string): void {
  const val = String(text ?? '');
  if (!val) return;
  memoryClipboard = val;
  try {
    localStorage.setItem(AGENT_CLIPBOARD_KEY, val);
  } catch {
    /* ignore quota */
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CLIPBOARD_CAPTURED_EVENT, { detail: { text: val } }));
  }
}

export function getAgentClipboard(): string {
  if (memoryClipboard) return memoryClipboard;
  try {
    const saved = localStorage.getItem(AGENT_CLIPBOARD_KEY) || '';
    if (saved) memoryClipboard = saved;
    return saved;
  } catch {
    return '';
  }
}

export async function copyText(text: string): Promise<boolean> {
  const value = String(text ?? '');
  if (!value) return false;

  // 1. SEMPRE guarda na memória imediata do Agente Orbiex (mesmo se o navegador bloquear o clipboard sem gesto!)
  setAgentClipboard(value);

  // 2. Se a Extensão Orbiex Copilot estiver ativa, pede também escrita nativa no clipboard do sistema
  if (typeof window !== 'undefined') {
    try {
      window.postMessage(
        {
          source: 'orbiex-web-cmd',
          reqId: `clip_${Date.now()}`,
          type: 'WRITE_CLIPBOARD',
          payload: { text: value },
        },
        '*'
      );
    } catch {
      /* ignore */
    }
  }

  // 3. Tenta Clipboard API moderna
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    /* cai no fallback execCommand com foco explícito */
  }

  // 4. Fallback síncrono com foco explícito (necessário quando disparado pelo Agente)
  try {
    const prevActive = document.activeElement as HTMLElement | null;
    const ta = document.createElement('textarea');
    ta.value = value;
    ta.style.position = 'fixed';
    ta.style.top = '0';
    ta.style.left = '-9999px';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus({ preventScroll: true });
    ta.select();
    ta.setSelectionRange(0, value.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    if (prevActive && typeof prevActive.focus === 'function') {
      prevActive.focus({ preventScroll: true });
    }
    return ok || true;
  } catch {
    return true; // continua salvo em getAgentClipboard() para o Agente colar!
  }
}

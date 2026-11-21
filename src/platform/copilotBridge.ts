import { useEffect, useState } from 'react';

export interface CopilotInteractPayload {
  command: 'click' | 'type' | 'scroll' | 'scan';
  target?: string;
  text?: string;
  direction?: 'up' | 'down' | 'top' | 'bottom' | string;
  clickAfter?: string;
}

export interface CopilotResult {
  ok: boolean;
  clickedLabel?: string;
  message?: string;
  error?: string;
  availableButtons?: string[];
  title?: string;
  url?: string;
}

let reqSeq = 0;
const pendingMap = new Map<string, (res: CopilotResult) => void>();
let detectedInstalled = false;
const listeners = new Set<(installed: boolean) => void>();

function markInstalled() {
  if (detectedInstalled) return;
  detectedInstalled = true;
  listeners.forEach((fn) => fn(true));
}

if (typeof window !== 'undefined') {
  if (document.documentElement?.getAttribute('data-orbiex-copilot')) {
    detectedInstalled = true;
  }

  window.addEventListener('orbiex-copilot:ready', () => {
    markInstalled();
  });

  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    const data = event.data;
    if (!data) return;

    if (data.source === 'orbiex-ext-ready') {
      markInstalled();
      return;
    }

    if (data.source === 'orbiex-ext-res' && data.reqId) {
      markInstalled();
      const resolver = pendingMap.get(data.reqId);
      if (resolver) {
        pendingMap.delete(data.reqId);
        resolver(data.result || { ok: false });
      }
    }
  });
}

export function isCopilotInstalled(): boolean {
  if (detectedInstalled) return true;
  if (typeof document !== 'undefined' && document.documentElement?.getAttribute('data-orbiex-copilot')) {
    detectedInstalled = true;
    return true;
  }
  return false;
}

export function sendCopilotCommand(type: string, payload?: unknown, timeoutMs = 8000): Promise<CopilotResult> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve({ ok: false, error: 'Ambiente sem janela' });
      return;
    }

    const reqId = `orbiex_${Date.now()}_${++reqSeq}`;
    const timer = window.setTimeout(() => {
      if (pendingMap.has(reqId)) {
        pendingMap.delete(reqId);
        resolve({ ok: false, error: 'Extensão Orbiex Copilot não respondeu.' });
      }
    }, timeoutMs);

    pendingMap.set(reqId, (res) => {
      window.clearTimeout(timer);
      resolve(res);
    });

    window.postMessage({ source: 'orbiex-web-cmd', reqId, type, payload }, '*');
  });
}

export async function pingCopilot(): Promise<boolean> {
  if (isCopilotInstalled()) return true;
  const res = await sendCopilotCommand('PING', {}, 700);
  if (res.ok) markInstalled();
  return res.ok;
}

export function copilotOpenTab(url: string): Promise<CopilotResult> {
  return sendCopilotCommand('OPEN_TAB', { url }, 11000);
}

export function copilotFocusOrbiex(): Promise<CopilotResult> {
  return sendCopilotCommand('FOCUS_ORBIEX', {}, 3000);
}

export function copilotInteractPage(payload: CopilotInteractPayload): Promise<CopilotResult> {
  return sendCopilotCommand('INTERACT_PAGE', payload, 9500);
}

/** Hook React que detecta em tempo real assim que o aluno instala/ativa a extensão */
export function useCopilotStatus(): boolean {
  const [installed, setInstalled] = useState<boolean>(isCopilotInstalled);

  useEffect(() => {
    const sub = (val: boolean) => setInstalled(val);
    listeners.add(sub);
    pingCopilot();
    const poll = window.setInterval(() => {
      if (!isCopilotInstalled()) pingCopilot();
    }, 2500);

    return () => {
      listeners.delete(sub);
      window.clearInterval(poll);
    };
  }, []);

  return installed;
}

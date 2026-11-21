import { useEffect, useState } from 'react';

export const LATEST_COPILOT_VERSION = '2.0.0';

export interface CopilotInteractPayload {
  command: 'click' | 'type' | 'scroll' | 'scan';
  target?: string;
  spatialHint?: string;
  text?: string;
  pressEnter?: boolean;
  direction?: 'up' | 'down' | 'top' | 'bottom' | string;
  clickAfter?: string;
}

export interface CopilotScreenElement {
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

export interface CopilotResult {
  ok: boolean;
  version?: string;
  clickedLabel?: string;
  message?: string;
  error?: string;
  availableButtons?: string[];
  title?: string;
  url?: string;
  screenshot?: string | null;
  elements?: CopilotScreenElement[];
  viewport?: { width: number; height: number } | null;
  needsV2Update?: boolean;
}

export interface CopilotSmartActionInput {
  actionType: 'click' | 'type';
  target: string;
  spatialHint?: string;
  userInstruction?: string;
  textToType?: string;
  pressEnter?: boolean;
  clickAfter?: string;
}

let reqSeq = 0;
const pendingMap = new Map<string, (res: CopilotResult) => void>();
let detectedInstalled = false;
let detectedVersion = '';
const listeners = new Set<(info: { installed: boolean; version: string }) => void>();

function notifyListeners() {
  const snapshot = { installed: detectedInstalled, version: detectedVersion };
  listeners.forEach((fn) => fn(snapshot));
}

function markInstalled(ver?: string) {
  let changed = false;
  if (!detectedInstalled) {
    detectedInstalled = true;
    changed = true;
  }
  if (ver && ver !== detectedVersion) {
    detectedVersion = ver;
    changed = true;
  }
  if (changed) notifyListeners();
}

if (typeof window !== 'undefined') {
  const attr = document.documentElement?.getAttribute('data-orbiex-copilot');
  if (attr) {
    detectedInstalled = true;
    detectedVersion = attr;
  }

  window.addEventListener('orbiex-copilot:ready', (ev) => {
    const detailVer = (ev as CustomEvent<{ version?: string }>).detail?.version;
    const domVer = document.documentElement?.getAttribute('data-orbiex-copilot') || '';
    markInstalled(detailVer || domVer || detectedVersion || '1.0.0');
  });

  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    const data = event.data;
    if (!data) return;

    if (data.source === 'orbiex-ext-ready') {
      markInstalled(data.version || document.documentElement?.getAttribute('data-orbiex-copilot') || '1.0.0');
      return;
    }

    if (data.source === 'orbiex-ext-res' && data.reqId) {
      const res: CopilotResult = data.result || { ok: false };
      markInstalled(res.version || document.documentElement?.getAttribute('data-orbiex-copilot') || detectedVersion || '1.0.0');
      const resolver = pendingMap.get(data.reqId);
      if (resolver) {
        pendingMap.delete(data.reqId);
        resolver(res);
      }
    }
  });
}

export function isCopilotInstalled(): boolean {
  if (detectedInstalled) return true;
  if (typeof document !== 'undefined') {
    const attr = document.documentElement?.getAttribute('data-orbiex-copilot');
    if (attr) {
      detectedInstalled = true;
      detectedVersion = attr;
      return true;
    }
  }
  return false;
}

export function getCopilotVersion(): string {
  if (detectedVersion) return detectedVersion;
  if (typeof document !== 'undefined') {
    const attr = document.documentElement?.getAttribute('data-orbiex-copilot');
    if (attr) {
      detectedVersion = attr;
      return attr;
    }
  }
  return '';
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
  const res = await sendCopilotCommand('PING', {}, 750);
  if (res.ok) {
    markInstalled(res.version || '1.0.0');
    return true;
  }
  return isCopilotInstalled();
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

export function copilotCaptureScreenContext(): Promise<CopilotResult> {
  return sendCopilotCommand('CAPTURE_SCREEN_CONTEXT', {}, 9500);
}

export function copilotExecuteGrounded(payload: {
  actionType: 'click' | 'type';
  uid?: number | null;
  xPct?: number;
  yPct?: number;
  textToType?: string;
  pressEnter?: boolean;
  submitUid?: number | null;
}): Promise<CopilotResult> {
  return sendCopilotCommand('EXECUTE_GROUNDED', payload, 10000);
}

/**
 * Orquestrador Inteligente v2.0 (Visão Computacional Set-of-Marks + Mapa Espacial):
 * 1. Tira print em tempo real da aba externa com etiquetas numéricas + coordenadas (xPct, yPct, canto).
 * 2. Envia para o Gemini Vision identificar exatamente qual elemento/coordenada o usuário pediu
 *    (ex: "no canto inferior direito, onde tem o chat, escreve oi").
 * 3. Clica / abre chats retráteis e digita com precisão cirúrgica.
 * 4. Compatível com v1.0.0 (cai para busca DOM se o aluno ainda não atualizou para a v2.0).
 */
export async function copilotSmartAction(input: CopilotSmartActionInput): Promise<CopilotResult> {
  const {
    actionType,
    target,
    spatialHint = '',
    userInstruction = '',
    textToType = '',
    pressEnter = false,
    clickAfter = '',
  } = input;

  // 1. Captura o contexto visual + espacial da tela aberta
  const ctx = await copilotCaptureScreenContext();

  if (ctx.ok && (ctx.screenshot || (ctx.elements && ctx.elements.length > 0))) {
    try {
      const r = await fetch('/api/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'vision_grounding',
          actionType,
          userInstruction: userInstruction || `${spatialHint ? `[${spatialHint}] ` : ''}${target}`,
          target,
          spatialHint,
          clickAfter,
          url: ctx.url || '',
          title: ctx.title || '',
          elements: ctx.elements || [],
          imageDataUrl: ctx.screenshot || undefined,
        }),
      });

      if (r.ok) {
        const json = await r.json();
        const g = json?.data;
        if (json?.success && g && (g.uid !== null || typeof g.xPct === 'number')) {
          // Refina coordenadas com base no uid caso o modelo tenha escolhido um uid válido
          const matchedEl =
            g.uid != null ? (ctx.elements || []).find((e) => Number(e.uid) === Number(g.uid)) : undefined;
          const finalXPct = typeof g.xPct === 'number' ? g.xPct : matchedEl?.xPct ?? 50;
          const finalYPct = typeof g.yPct === 'number' ? g.yPct : matchedEl?.yPct ?? 50;

          const execRes = await copilotExecuteGrounded({
            actionType,
            uid: g.uid ?? null,
            xPct: finalXPct,
            yPct: finalYPct,
            textToType,
            pressEnter,
            submitUid: g.submitUid ?? null,
          });

          if (execRes.ok) {
            return {
              ...execRes,
              clickedLabel: execRes.clickedLabel || g.targetLabel || target,
            };
          }
        }
      }
    } catch {
      /* fallback para busca espacial local abaixo */
    }
  }

  const isOldV1 = !ctx.ok && /desconhecido/i.test(ctx.error || '');

  // Fallback espacial local (ou compatibilidade caso o usuário ainda esteja na extensão v1.0)
  const fallbackRes = await copilotInteractPage({
    command: actionType,
    target,
    spatialHint,
    text: textToType,
    pressEnter,
    clickAfter: clickAfter || undefined,
  });

  if (isOldV1) {
    return {
      ...fallbackRes,
      needsV2Update: true,
    };
  }

  return fallbackRes;
}

/** Hook React completo com versão instalada (ex: 1.0.0 vs 2.0.0) */
export function useCopilotInfo(): { installed: boolean; version: string; isLatest: boolean } {
  const [info, setInfo] = useState<{ installed: boolean; version: string }>(() => ({
    installed: isCopilotInstalled(),
    version: getCopilotVersion(),
  }));

  useEffect(() => {
    const sub = (next: { installed: boolean; version: string }) => setInfo(next);
    listeners.add(sub);
    pingCopilot();
    const poll = window.setInterval(() => {
      if (!isCopilotInstalled() || !getCopilotVersion()) pingCopilot();
    }, 2500);

    return () => {
      listeners.delete(sub);
      window.clearInterval(poll);
    };
  }, []);

  const isLatest = info.installed && info.version === LATEST_COPILOT_VERSION;
  return { ...info, isLatest };
}

/** Hook booleano simples (compatibilidade com componentes existentes) */
export function useCopilotStatus(): boolean {
  return useCopilotInfo().installed;
}

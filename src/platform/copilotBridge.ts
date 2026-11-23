import { useEffect, useState } from 'react';
import { setAgentClipboard } from './clipboard';

export const LATEST_COPILOT_VERSION = '2.4.0';

function isVersionAtLeast(current: string, minVer: string): boolean {
  if (!current) return false;
  const pa = current.split('.').map((n) => parseInt(n, 10) || 0);
  const pb = minVer.split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const a = pa[i] || 0;
    const b = pb[i] || 0;
    if (a > b) return true;
    if (a < b) return false;
  }
  return true;
}

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

export interface CopilotTabSummary {
  id: number;
  title: string;
  url: string;
  serviceKey?: string;
  lastAccessed?: number;
}

export interface CopilotResult {
  ok: boolean;
  version?: string;
  reused?: boolean;
  notFound?: boolean;
  openTabs?: string[];
  tabs?: CopilotTabSummary[];
  tabId?: number;
  clickedLabel?: string;
  copiedText?: string;
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
let detectedV23Bridge = false;
let detectedV24Bridge = false;
const listeners = new Set<(info: { installed: boolean; version: string }) => void>();

function hasV24DomAttr(): boolean {
  if (typeof document === 'undefined') return false;
  return Boolean(document.documentElement?.getAttribute('data-orbiex-copilot-v24'));
}

function hasV23DomAttr(): boolean {
  if (typeof document === 'undefined') return false;
  return Boolean(document.documentElement?.getAttribute('data-orbiex-copilot-v23'));
}

function getBestDomVersion(): string {
  if (typeof document === 'undefined') return '';
  return (
    document.documentElement?.getAttribute('data-orbiex-copilot-v24') ||
    document.documentElement?.getAttribute('data-orbiex-copilot-v23') ||
    document.documentElement?.getAttribute('data-orbiex-copilot') ||
    ''
  );
}

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
  const dom24 =
    typeof document !== 'undefined' ? document.documentElement?.getAttribute('data-orbiex-copilot-v24') || '' : '';
  const dom23 =
    typeof document !== 'undefined' ? document.documentElement?.getAttribute('data-orbiex-copilot-v23') || '' : '';
  if (dom24 || (ver && isVersionAtLeast(ver, '2.4.0'))) {
    detectedV24Bridge = true;
    detectedV23Bridge = true;
  } else if (dom23 || (ver && isVersionAtLeast(ver, '2.3.0'))) {
    detectedV23Bridge = true;
  }
  const candidate = dom24 || dom23 || ver || '';
  // Nunca faz downgrade de versão se uma extensão antiga (ex.: v2.0/v2.2/v2.3) responder junto com a v2.4 no Chrome
  if (candidate && candidate !== detectedVersion && (!detectedVersion || isVersionAtLeast(candidate, detectedVersion))) {
    detectedVersion = candidate;
    changed = true;
  }
  if (changed) notifyListeners();
}

if (typeof window !== 'undefined') {
  const attr24 = document.documentElement?.getAttribute('data-orbiex-copilot-v24');
  const attr23 = document.documentElement?.getAttribute('data-orbiex-copilot-v23');
  const attr = attr24 || attr23 || document.documentElement?.getAttribute('data-orbiex-copilot');
  if (attr24) detectedV24Bridge = true;
  if (attr23 || attr24) detectedV23Bridge = true;
  if (attr) {
    detectedInstalled = true;
    detectedVersion = attr;
  }

  window.addEventListener('orbiex-copilot:ready', (ev) => {
    const detailVer = (ev as CustomEvent<{ version?: string }>).detail?.version;
    const domVer = getBestDomVersion();
    markInstalled(detailVer || domVer || detectedVersion || '1.0.0');
  });

  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    const data = event.data;
    if (!data) return;

    if (data.source === 'orbiex-ext-ready') {
      markInstalled(data.version || getBestDomVersion() || '1.0.0');
      return;
    }

    if (
      (data.source === 'orbiex-ext-res-v24' ||
        data.source === 'orbiex-ext-res-v23' ||
        data.source === 'orbiex-ext-res') &&
      data.reqId
    ) {
      const res: CopilotResult = data.result || { ok: false };
      if (data.source === 'orbiex-ext-res-v24') {
        detectedV24Bridge = true;
        detectedV23Bridge = true;
      } else if (data.source === 'orbiex-ext-res-v23') {
        detectedV23Bridge = true;
      }
      markInstalled(res.version || getBestDomVersion() || detectedVersion || '1.0.0');
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
  const attr = getBestDomVersion();
  if (attr) {
    markInstalled(attr);
    return true;
  }
  return false;
}

export function getCopilotVersion(): string {
  const attr24 =
    typeof document !== 'undefined' ? document.documentElement?.getAttribute('data-orbiex-copilot-v24') || '' : '';
  const attr23 =
    typeof document !== 'undefined' ? document.documentElement?.getAttribute('data-orbiex-copilot-v23') || '' : '';
  if (attr24 || attr23) markInstalled(attr24 || attr23);
  if (detectedVersion) return detectedVersion;
  const attr = getBestDomVersion();
  if (attr) {
    markInstalled(attr);
    return attr;
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

    const useV24 =
      detectedV24Bridge ||
      hasV24DomAttr() ||
      (detectedVersion ? isVersionAtLeast(detectedVersion, '2.4.0') : false);
    const useV23 =
      !useV24 &&
      (detectedV23Bridge ||
        hasV23DomAttr() ||
        (detectedVersion ? isVersionAtLeast(detectedVersion, '2.3.0') : false));

    window.postMessage(
      {
        source: useV24 ? 'orbiex-web-cmd-v24' : useV23 ? 'orbiex-web-cmd-v23' : 'orbiex-web-cmd',
        reqId,
        type,
        payload,
      },
      '*'
    );
  });
}

export async function pingCopilot(): Promise<boolean> {
  if (typeof window !== 'undefined' && !detectedV24Bridge && !hasV24DomAttr()) {
    window.postMessage({ source: 'orbiex-web-cmd-v24', reqId: `probe24_${Date.now()}`, type: 'PING', payload: {} }, '*');
    if (!detectedV23Bridge && !hasV23DomAttr()) {
      window.postMessage({ source: 'orbiex-web-cmd-v23', reqId: `probe23_${Date.now()}`, type: 'PING', payload: {} }, '*');
    }
  }
  const res = await sendCopilotCommand('PING', {}, 750);
  if (res.ok) {
    markInstalled(res.version || '1.0.0');
    return true;
  }
  return isCopilotInstalled();
}

function getServiceKey(url: string, title = ''): string {
  if (!url) return '';
  try {
    const u = new URL(url);
    const ha = u.hostname.replace(/^www\./i, '').toLowerCase();
    const path = (u.pathname || '').toLowerCase();
    const ttl = String(title || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    if (
      ha === 'flow.google' ||
      ha.endsWith('.flow.google') ||
      ha === 'flow.google.com' ||
      ha.endsWith('.flow.google.com') ||
      ha === 'labs.google' ||
      ha.endsWith('.labs.google') ||
      ha === 'labs.google.com' ||
      ha.endsWith('.labs.google.com') ||
      ha.includes('aitestkitchen') ||
      ha.includes('videofx') ||
      (ha.includes('google') && (path.includes('/flow') || path.includes('/fx') || path.includes('videofx'))) ||
      /\bgoogle\s*flow\b/i.test(ttl) ||
      (/\bflow\b/i.test(ttl) && (ha.includes('google') || ttl.includes('veo') || ttl.includes('labs')))
    ) {
      if (path.includes('/whisk')) return 'google_whisk';
      if (path.includes('/musicfx')) return 'google_musicfx';
      if (path.includes('/imagefx')) return 'google_imagefx';
      return 'google_flow';
    }
    if (ha === 'tiktok.com' || ha.endsWith('.tiktok.com')) {
      if (ha.includes('seller')) return 'tiktok_seller';
      if (path.includes('/tiktokstudio/upload')) return 'tiktok_studio_upload';
      if (path.includes('/tiktokstudio')) return 'tiktok_studio';
      return 'tiktok';
    }
    if (ha.includes('klingai.com')) return 'kling';
    if (ha.includes('hailuo')) return 'hailuo';
    if (ha.includes('lumalabs.ai')) return 'luma';
    if (ha.includes('runwayml.com')) return 'runway';
    if (ha.includes('midjourney.com')) return 'midjourney';
    if (ha.includes('capcut.com')) return 'capcut';
    if (ha.includes('canva.com')) return 'canva';
    return ha.split('.').slice(-2).join('.');
  } catch {
    return '';
  }
}

const OPENED_SERVICES_KEY = 'orbiex_opened_services_v1';
const SESSION_OPENED_SERVICES = new Set<string>();

export function markExternalServiceOpened(url: string): void {
  const key = getServiceKey(url);
  if (!key) return;
  SESSION_OPENED_SERVICES.add(key);
  try {
    sessionStorage.setItem(OPENED_SERVICES_KEY, JSON.stringify(Array.from(SESSION_OPENED_SERVICES)));
    const prev = JSON.parse(localStorage.getItem(OPENED_SERVICES_KEY) || '{}') || {};
    prev[key] = Date.now();
    localStorage.setItem(OPENED_SERVICES_KEY, JSON.stringify(prev));
  } catch {
    /* ignore */
  }
}

export function wasExternalServiceOpened(url: string): boolean {
  const key = getServiceKey(url);
  if (!key) return false;
  if (SESSION_OPENED_SERVICES.has(key)) return true;
  try {
    const raw = sessionStorage.getItem(OPENED_SERVICES_KEY);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        list.forEach((k) => typeof k === 'string' && SESSION_OPENED_SERVICES.add(k));
        if (SESSION_OPENED_SERVICES.has(key)) return true;
      }
    }
    const localMap = JSON.parse(localStorage.getItem(OPENED_SERVICES_KEY) || '{}') || {};
    if (typeof localMap[key] === 'number' && Date.now() - localMap[key] < 12 * 60 * 60 * 1000) {
      SESSION_OPENED_SERVICES.add(key);
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

function isSameExternalService(openUrl: string, targetUrl: string): boolean {
  if (!openUrl || !targetUrl) return false;
  const ka = getServiceKey(openUrl);
  const kb = getServiceKey(targetUrl);
  return Boolean(ka && kb && ka === kb);
}

/**
 * Retorna para a última aba externa onde o usuário estava trabalhando (sem recarregar nem duplicar).
 */
export async function copilotFocusPreviousTab(): Promise<CopilotResult & { needsUpdateToReturn?: boolean }> {
  const existing = await sendCopilotCommand('FOCUS_EXISTING_TAB', {}, 6000);
  if (existing.ok) return existing;

  const res = await sendCopilotCommand('FOCUS_PREVIOUS_TAB', {}, 5000);
  if (res.ok) return res;

  const errText = res.error || existing.error || '';
  if (/desconhecido|invalidated|respondeu/i.test(errText)) {
    const installedVer = getCopilotVersion();
    const outdated = !installedVer || !isVersionAtLeast(installedVer, LATEST_COPILOT_VERSION);
    return {
      ok: false,
      needsUpdateToReturn: true,
      error: outdated
        ? `Sua extensão no Chrome (${installedVer || 'antiga'}) precisa ser atualizada para v2.4 (e remova versões antigas em chrome://extensions).`
        : 'A extensão Copilot foi atualizada ou desconectada. Recarregue esta aba da Orbiex (Cmd+R / F5) para reconectar.',
    };
  }
  return existing.notFound ? existing : res;
}

function isOrbiexTabUrl(url: string): boolean {
  return /https?:\/\/([a-z0-9-]+\.)?orbiex\.io/i.test(url) || /http:\/\/localhost:/i.test(url);
}

function findMatchingTabInList(tabs: CopilotTabSummary[], url: string, hint = ''): CopilotTabSummary | null {
  const cleanHint = String(hint || '')
    .replace(/\([^)]*\)/g, ' ')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const targetSvc = url ? getServiceKey(url, hint) : '';
  const wantFlow = targetSvc === 'google_flow' || /\bflow\b|\bveo\b|\blabs\b/i.test(cleanHint);
  const stopWords = new Set(['para', 'com', 'aba', 'aberta', 'google', 'veo', 'site', 'pagina']);
  const tokens = cleanHint.split(' ').filter((w) => w.length >= 3 && !stopWords.has(w));

  const candidates = tabs.filter((t) => {
    const u = String(t.url || '').trim();
    if (!u || !/^https?:\/\//i.test(u) || isOrbiexTabUrl(u)) return false;
    const ttl = String(t.title || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    const uLow = u.toLowerCase();
    const tabSvc = getServiceKey(u, t.title);

    if (targetSvc && tabSvc === targetSvc) return true;
    if (wantFlow) {
      if (
        uLow.includes('flow.google') ||
        uLow.includes('labs.google') ||
        uLow.includes('/tools/flow') ||
        uLow.includes('aitestkitchen') ||
        uLow.includes('videofx') ||
        /\bgoogle\s*flow\b/i.test(ttl) ||
        /\bflow\b/i.test(ttl)
      ) {
        return true;
      }
    }
    if (cleanHint.length >= 3 && `${uLow} ${ttl}`.includes(cleanHint)) return true;
    if (tokens.length > 0 && tokens.some((tk) => tk.length >= 4 && `${uLow} ${ttl}`.includes(tk))) return true;
    return false;
  });

  if (!candidates.length) return null;
  candidates.sort((a, b) => {
    const sa = (a.url.includes('/project/') || a.url.includes('/editor') ? 2000 : 0) + (a.lastAccessed || 0) / 1000000;
    const sb = (b.url.includes('/project/') || b.url.includes('/editor') ? 2000 : 0) + (b.lastAccessed || 0) / 1000000;
    return sb - sa;
  });
  return candidates[0];
}

async function tryFocusListedTab(
  match: CopilotTabSummary,
  allTabs: CopilotTabSummary[]
): Promise<CopilotResult | null> {
  // v2.4+ suporta foco exato por ID!
  const byId = await sendCopilotCommand('FOCUS_TAB_BY_ID', { tabId: match.id }, 6000);
  if (byId.ok) {
    markExternalServiceOpened(byId.url || match.url);
    return byId;
  }

  // Se usuário ainda está na v2.3.0 (que não tem FOCUS_TAB_BY_ID nem reconhecia flow.google.com):
  // tenta focar na própria v2.3 pelo URL exato caso não haja colisão óbvia de serviceKey
  if (/desconhecido/i.test(byId.error || '')) {
    const colliding = allTabs.filter(
      (t) =>
        t.id !== match.id &&
        !isOrbiexTabUrl(t.url || '') &&
        t.serviceKey &&
        match.serviceKey &&
        t.serviceKey === match.serviceKey
    );
    const hasLowerLastAccessed = colliding.some(
      (t) => (t.lastAccessed || 0) > (match.lastAccessed || 0) && !match.url.includes('/project/')
    );
    if (!hasLowerLastAccessed) {
      const via23 = await sendCopilotCommand('FOCUS_EXISTING_TAB', { url: match.url, hint: '' }, 6000);
      if (via23.ok) {
        markExternalServiceOpened(via23.url || match.url);
        return via23;
      }
    }
  }
  return null;
}

/**
 * Retorno ESTRITO para aba já aberta: NUNCA cria nova aba no navegador!
 * Usa FOCUS_EXISTING_TAB + LIST_OPEN_TABS/FOCUS_TAB_BY_ID (v2.4 / v2.3) ou FOCUS_OR_OPEN_TAB(returnOnly=true) em v2.2.
 */
export async function copilotReturnToTab(
  url: string,
  hint?: string
): Promise<CopilotResult & { needsUpdateToReturn?: boolean }> {
  const res = await sendCopilotCommand('FOCUS_EXISTING_TAB', { url, hint }, 8500);
  if (res.ok) {
    if (res.url || url) markExternalServiceOpened(res.url || url);
    return res;
  }

  // Plano B (inclusive se a extensão do Chrome ainda for v2.3 que não conhecia flow.google.com):
  // lista todas as abas abertas e encontra pelo nome/URL (ex.: "Flow" / flow.google.com)
  if (res.notFound) {
    const listRes = await sendCopilotCommand('LIST_OPEN_TABS', {}, 5000);
    if (listRes.ok && Array.isArray(listRes.tabs)) {
      const matched = findMatchingTabInList(listRes.tabs, url, hint);
      if (matched) {
        const focused = await tryFocusListedTab(matched, listRes.tabs);
        if (focused?.ok) return focused;
        return {
          ok: false,
          needsUpdateToReturn: true,
          error: `Localizei sua aba aberta (${matched.title || matched.url}), mas sua extensão no Chrome ainda está na v${getCopilotVersion() || '2.3'}. Atualize para v2.4 (e remova versões antigas em chrome://extensions) para voltar direto nela!`,
        };
      }
    }
    return res;
  }

  // Fallback para v2.1/v2.2 que ainda não tinha FOCUS_EXISTING_TAB
  if (/desconhecido/i.test(res.error || '')) {
    const legacyReturn = await sendCopilotCommand(
      'FOCUS_OR_OPEN_TAB',
      { url, hint, returnOnly: true, forceNewTab: false },
      9000
    );
    if (legacyReturn.ok) {
      if (legacyReturn.url || url) markExternalServiceOpened(legacyReturn.url || url);
      return legacyReturn;
    }
    const installedVer = getCopilotVersion();
    return {
      ok: false,
      needsUpdateToReturn: true,
      error: `Sua extensão ativa no Chrome (${installedVer || 'antiga'}) não suporta o retorno garantido da v2.4. Clique para baixar a v2.4 e remova todas as versões antigas do Copilot em chrome://extensions.`,
    };
  }

  if (/invalidated|não respondeu|nao respondeu/i.test(res.error || '')) {
    return {
      ok: false,
      needsUpdateToReturn: true,
      error:
        'A extensão Copilot perdeu conexão com esta aba (ou há duas versões da extensão instaladas). Recarregue a aba da Orbiex e deixe apenas a v2.4 ativa em chrome://extensions.',
    };
  }

  return res;
}

/**
 * Abre um site externo OU retorna exatamente para a aba onde o usuário já estava trabalhando
 * (ex: "volta pro Google Flow" foca a aba aberta do projeto no Flow sem recarregar nem criar outra!).
 */
export async function copilotOpenTab(
  url: string,
  opts?: { forceNewTab?: boolean; returnOnly?: boolean; hint?: string }
): Promise<CopilotResult & { needsUpdateToReturn?: boolean }> {
  const forceNew = Boolean(opts?.forceNewTab);
  const wantReturnOnly = Boolean(opts?.returnOnly);
  const alreadyOpenedBefore = wasExternalServiceOpened(url);

  if (wantReturnOnly) {
    return copilotReturnToTab(url, opts?.hint);
  }

  if (!forceNew) {
    // 0. Verifica antes via FOCUS_EXISTING_TAB + LIST_OPEN_TABS para nunca duplicar nem na v2.3!
    const existingPreCheck = await sendCopilotCommand('FOCUS_EXISTING_TAB', { url, hint: opts?.hint }, 6000);
    if (existingPreCheck.ok) {
      markExternalServiceOpened(existingPreCheck.url || url);
      return existingPreCheck;
    }
    if (existingPreCheck.notFound) {
      const listRes = await sendCopilotCommand('LIST_OPEN_TABS', {}, 5000);
      if (listRes.ok && Array.isArray(listRes.tabs)) {
        const matched = findMatchingTabInList(listRes.tabs, url, opts?.hint);
        if (matched) {
          const focused = await tryFocusListedTab(matched, listRes.tabs);
          if (focused?.ok) return focused;
        }
      }
    }

    // 1. Comando nativo FOCUS_OR_OPEN_TAB (v2.1 / v2.2 / v2.3 / v2.4) — procura e só cria se não existir
    const focusRes = await sendCopilotCommand(
      'FOCUS_OR_OPEN_TAB',
      { url, hint: opts?.hint, returnOnly: false, forceNewTab: false },
      10000
    );
    if (focusRes.ok) {
      markExternalServiceOpened(focusRes.url || url);
      return focusRes;
    }

    if (/invalidated|não respondeu|nao respondeu/i.test(focusRes.error || '')) {
      return {
        ok: false,
        needsUpdateToReturn: true,
        error:
          'A extensão Copilot foi recarregada ou não respondeu. Recarregue esta aba da Orbiex (Cmd+R / F5) para não abrir abas duplicadas.',
      };
    }

    // 2. Compatibilidade segura com extensão v2.0 antiga: NUNCA cria aba se já abriu ou se é < 2.1
    if (/desconhecido/i.test(focusRes.error || '')) {
      const ctx = await sendCopilotCommand('CAPTURE_SCREEN_CONTEXT', {}, 10500);
      if (ctx.ok && ctx.url && isSameExternalService(ctx.url, url)) {
        markExternalServiceOpened(ctx.url);
        return {
          ok: true,
          reused: true,
          url: ctx.url,
          title: ctx.title,
          message: `Retornou para a aba aberta (${ctx.title || ctx.url}).`,
        };
      }

      const installedVer = getCopilotVersion();
      if (alreadyOpenedBefore || (installedVer && !isVersionAtLeast(installedVer, '2.1.0'))) {
        return {
          ok: false,
          needsUpdateToReturn: true,
          error:
            'Sua extensão no Chrome ainda está na versão antiga (2.0), que não consegue localizar abas abertas em outras guias. Atualize para a v2.4 (e remova a antiga em chrome://extensions).',
        };
      }
    } else if (focusRes.notFound) {
      return focusRes;
    }
  }

  const openRes = await sendCopilotCommand('OPEN_TAB', { url, forceNewTab: forceNew, returnOnly: false }, 11000);
  if (openRes.ok) markExternalServiceOpened(openRes.url || url);
  return openRes;
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

  // Tenta até 2 vezes caso a página tenha acabado de trocar de tela (ex: acabou de clicar em "Novo projeto" no Flow)
  let lastCtx: CopilotResult = { ok: false };
  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => window.setTimeout(r, 1350));
    }
    const ctx = await copilotCaptureScreenContext();
    lastCtx = ctx;

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
              if (execRes.copiedText) setAgentClipboard(execRes.copiedText);
              return {
                ...execRes,
                clickedLabel: execRes.clickedLabel || g.targetLabel || target,
              };
            }
          }
        }
      } catch {
        /* fallback ou retry */
      }
    }

    // Se a extensão for v1.0, não adianta repetir o CAPTURE_SCREEN_CONTEXT
    if (!ctx.ok && /desconhecido/i.test(ctx.error || '')) break;
  }

  const isOldV1 = !lastCtx.ok && /desconhecido/i.test(lastCtx.error || '');

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

  const isLatest = info.installed && isVersionAtLeast(info.version, LATEST_COPILOT_VERSION);
  return { ...info, isLatest };
}

/** Hook booleano simples (compatibilidade com componentes existentes) */
export function useCopilotStatus(): boolean {
  return useCopilotInfo().installed;
}

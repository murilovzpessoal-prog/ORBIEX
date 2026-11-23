/**
 * Orbiex Copilot v2.2 — Background Service Worker
 * - Persiste orbiexTabId, lastControlledTabId e mapa por ferramenta em chrome.storage.local
 *   (imune ao sleep de 30s do Service Worker MV3)
 * - Escuta troca/abertura de abas (inclusive já abertas antes da instalação) para sempre voltar
 *   para a aba exata onde o usuário estava (ex: projeto no Google Flow) sem recarregar nem duplicar
 */

let orbiexTabId = null;
let lastControlledTabId = null;
let serviceTabMap = {};
let stateLoaded = false;
let loadPromise = null;

const STATE_KEY = 'orbiex_copilot_state_v2';

function isOrbiexUrl(url = '') {
  return /https?:\/\/([a-z0-9-]+\.)?orbiex\.io/i.test(url) || /http:\/\/localhost:/i.test(url);
}

function getServiceKey(url = '', title = '') {
  if (!url || !/^https?:\/\//i.test(url) || isOrbiexUrl(url)) return '';
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./i, '').toLowerCase();
    const path = (u.pathname || '').toLowerCase();
    const ttl = String(title || '').toLowerCase();

    if (
      host === 'labs.google' ||
      host.endsWith('.labs.google') ||
      host === 'flow.google' ||
      host.endsWith('.flow.google') ||
      host.includes('aitestkitchen') ||
      host.includes('videofx') ||
      (host.includes('google') && (path.includes('/flow') || path.includes('/fx')))
    ) {
      if (
        path.includes('/flow') ||
        path.includes('/fx') ||
        host.includes('flow') ||
        ttl.includes('flow')
      ) {
        return 'google_flow';
      }
      return 'labs_google';
    }
    if (host === 'tiktok.com' || host.endsWith('.tiktok.com')) {
      if (host.includes('seller')) return 'tiktok_seller';
      if (path.includes('/tiktokstudio/upload')) return 'tiktok_studio_upload';
      if (path.includes('/tiktokstudio')) return 'tiktok_studio';
      return 'tiktok';
    }
    if (host.includes('klingai.com')) return 'kling';
    if (host.includes('hailuo')) return 'hailuo';
    if (host.includes('lumalabs.ai')) return 'luma';
    if (host.includes('runwayml.com')) return 'runway';
    if (host.includes('midjourney.com')) return 'midjourney';
    if (host.includes('capcut.com')) return 'capcut';
    if (host.includes('canva.com')) return 'canva';
    if (host.includes('elevenlabs.io')) return 'elevenlabs';
    if (host.includes('chatgpt.com') || host.includes('openai.com')) return 'chatgpt';
    if (host.includes('youtube.com')) return 'youtube';
    if (host.includes('instagram.com')) return 'instagram';
    if (host.includes('whatsapp.com')) return 'whatsapp';
    if (host.includes('mail.google.com')) return 'gmail';
    if (host.includes('shopee.')) return 'shopee';
    if (host.includes('mercadolivre.') || host.includes('mercadolibre.')) return 'mercadolivre';
    if (host.includes('amazon.')) return 'amazon';
    if (host.includes('cakto.')) return 'cakto';

    const parts = host.split('.');
    return parts.slice(-2).join('.');
  } catch {
    return '';
  }
}

async function ensureLoaded() {
  if (stateLoaded) return;
  if (!loadPromise) {
    loadPromise = (async () => {
      try {
        const res = await chrome.storage.local.get(STATE_KEY);
        const st = res?.[STATE_KEY];
        if (st && typeof st === 'object') {
          if (typeof st.orbiexTabId === 'number') orbiexTabId = st.orbiexTabId;
          if (typeof st.lastControlledTabId === 'number') lastControlledTabId = st.lastControlledTabId;
          if (st.serviceTabMap && typeof st.serviceTabMap === 'object') {
            serviceTabMap = { ...st.serviceTabMap };
          }
        }
      } catch {
        /* ignore */
      }
      stateLoaded = true;
    })();
  }
  await loadPromise;
}

async function saveState() {
  await ensureLoaded();
  try {
    await chrome.storage.local.set({
      [STATE_KEY]: { orbiexTabId, lastControlledTabId, serviceTabMap },
    });
  } catch {
    /* ignore */
  }
}

async function recordTab(tab, markAsLastControlled = true) {
  if (!tab || !tab.id) return;
  const tabUrl = tab.url || tab.pendingUrl || '';
  if (!tabUrl) return;
  await ensureLoaded();

  if (isOrbiexUrl(tabUrl)) {
    orbiexTabId = tab.id;
    await saveState();
    return;
  }
  if (/^https?:\/\//i.test(tabUrl)) {
    if (markAsLastControlled) lastControlledTabId = tab.id;
    const svc = getServiceKey(tabUrl, tab.title || '');
    if (svc) serviceTabMap[svc] = tab.id;
    await saveState();
  }
}

async function seedOpenTabsAndInjectBridge() {
  await ensureLoaded();
  try {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      const tabUrl = tab.url || tab.pendingUrl || '';
      if (tab.id && isOrbiexUrl(tabUrl)) {
        orbiexTabId = tab.id;
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['orbiex-bridge.js'],
          });
        } catch {
          /* ignore */
        }
      } else if (tab.id && /^https?:\/\//i.test(tabUrl)) {
        const svc = getServiceKey(tabUrl, tab.title || '');
        if (svc && !serviceTabMap[svc]) {
          serviceTabMap[svc] = tab.id;
        }
      }
    }
    await saveState();
  } catch {
    /* ignore */
  }
}

chrome.runtime.onInstalled.addListener(() => {
  seedOpenTabsAndInjectBridge();
});
chrome.runtime.onStartup.addListener(() => {
  seedOpenTabsAndInjectBridge();
});

chrome.tabs.onActivated.addListener(({ tabId }) => {
  chrome.tabs.get(tabId, (tab) => {
    if (chrome.runtime.lastError || !tab) return;
    recordTab(tab, true);
  });
});

chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if ((changeInfo.url || changeInfo.status === 'complete') && tab) {
    recordTab(tab, Boolean(tab.active));
  }
});

function waitForTabComplete(tabId, timeoutMs = 10000) {
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      chrome.tabs.onUpdated.removeListener(listener);
      resolve();
    };
    const timer = setTimeout(finish, timeoutMs);
    const listener = (updatedId, info) => {
      if (updatedId === tabId && info.status === 'complete') {
        clearTimeout(timer);
        setTimeout(finish, 450);
      }
    };
    chrome.tabs.onUpdated.addListener(listener);
    chrome.tabs.get(tabId, (tab) => {
      if (chrome.runtime.lastError || !tab) return;
      if (tab.status === 'complete') {
        clearTimeout(timer);
        setTimeout(finish, 250);
      }
    });
  });
}

async function focusTabAndWindow(tab) {
  if (!tab || !tab.id) return false;
  await chrome.tabs.update(tab.id, { active: true });
  if (tab.windowId) {
    await chrome.windows.update(tab.windowId, { focused: true }).catch(() => {});
  }
  await new Promise((r) => setTimeout(r, 120));
  return true;
}

async function resolveTargetTab() {
  await ensureLoaded();

  const activeTabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (activeTabs[0] && activeTabs[0].id && !isOrbiexUrl(activeTabs[0].url || '')) {
    await recordTab(activeTabs[0], true);
    return activeTabs[0];
  }

  if (lastControlledTabId) {
    try {
      const tab = await chrome.tabs.get(lastControlledTabId);
      if (tab && tab.id && /^https?:\/\//i.test(tab.url || '') && !isOrbiexUrl(tab.url || '')) {
        await focusTabAndWindow(tab);
        return tab;
      }
    } catch {
      lastControlledTabId = null;
    }
  }

  const allTabs = await chrome.tabs.query({});
  const candidates = allTabs.filter(
    (t) => t.id && t.url && /^https?:\/\//i.test(t.url) && !isOrbiexUrl(t.url)
  );
  candidates.sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0));
  const candidate = candidates[0] || null;
  if (candidate) {
    await recordTab(candidate, true);
    await focusTabAndWindow(candidate);
    return candidate;
  }

  return null;
}

async function findExistingServiceTab(targetUrl) {
  await ensureLoaded();
  const targetSvc = getServiceKey(targetUrl);
  const tabs = await chrome.tabs.query({});

  const matchTab = (t) => {
    const openUrl = t.url || t.pendingUrl || '';
    if (!openUrl || isOrbiexUrl(openUrl)) return false;
    if (!targetUrl) return /^https?:\/\//i.test(openUrl);
    const openSvc = getServiceKey(openUrl, t.title || '');
    if (targetSvc && openSvc) return openSvc === targetSvc;

    // Fallback extra para Google Flow (ex: redirect de login / subcaminho diferente)
    if (targetSvc === 'google_flow') {
      const combined = `${openUrl} ${t.title || ''}`.toLowerCase();
      if (
        combined.includes('labs.google') ||
        combined.includes('flow.google') ||
        combined.includes('fx/pt/tools/flow') ||
        combined.includes('fx/tools/flow')
      ) {
        return true;
      }
    }

    try {
      const a = new URL(openUrl);
      const b = new URL(targetUrl);
      const ha = a.hostname.replace(/^www\./i, '').toLowerCase();
      const hb = b.hostname.replace(/^www\./i, '').toLowerCase();
      return ha === hb;
    } catch {
      return false;
    }
  };

  // 1. Prioriza a aba exata registrada no mapa deste serviço (onde o usuário estava!)
  const preferredIds = [];
  if (targetSvc && serviceTabMap[targetSvc]) preferredIds.push(serviceTabMap[targetSvc]);
  if (lastControlledTabId && !preferredIds.includes(lastControlledTabId)) {
    preferredIds.push(lastControlledTabId);
  }

  for (const pid of preferredIds) {
    const hit = tabs.find((t) => t.id === pid && matchTab(t));
    if (hit) return hit;
  }

  // 2. Varre todas as abas abertas do computador que combinam com o serviço
  const matching = tabs.filter((t) => t.id && matchTab(t));
  if (!matching.length) return null;

  const scoreTab = (t) => {
    const u = (t.url || t.pendingUrl || '').toLowerCase();
    let score = 0;
    if (u.includes('/project/') || u.includes('/editor') || u.includes('/create')) score += 1000;
    score += Math.min(300, u.length);
    score += Math.floor((t.lastAccessed || 0) / 1000000);
    return score;
  };
  matching.sort((a, b) => scoreTab(b) - scoreTab(a));
  return matching[0];
}

async function sendToTabWithAutoInject(tabId, message) {
  try {
    return await chrome.tabs.sendMessage(tabId, message);
  } catch {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['copilot-agent.js'],
    });
    await new Promise((r) => setTimeout(r, 200));
    return await chrome.tabs.sendMessage(tabId, message);
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    await ensureLoaded();

    if (sender?.tab?.id && isOrbiexUrl(sender.tab.url || '')) {
      orbiexTabId = sender.tab.id;
      await saveState();
    }

    const type = msg?.type;
    const payload = msg?.payload || {};

    if (type === 'PING') {
      return { ok: true, version: '2.2.0' };
    }

    if (type === 'FOCUS_PREVIOUS_TAB') {
      const targetTab = await resolveTargetTab();
      if (!targetTab) {
        return { ok: false, error: 'Nenhuma aba anterior encontrada para retornar.' };
      }
      await focusTabAndWindow(targetTab);
      return {
        ok: true,
        reused: true,
        tabId: targetTab.id,
        url: targetTab.url,
        title: targetTab.title,
      };
    }

    if (type === 'FOCUS_OR_OPEN_TAB' || type === 'OPEN_TAB') {
      const url = String(payload.url || '').trim();
      const forceNewTab = Boolean(payload.forceNewTab);
      const returnOnly = Boolean(payload.returnOnly);

      if (!forceNewTab) {
        const existing = await findExistingServiceTab(url);
        if (existing && existing.id) {
          await recordTab(existing, true);
          await focusTabAndWindow(existing);
          return {
            ok: true,
            reused: true,
            tabId: existing.id,
            url: existing.url,
            title: existing.title,
          };
        }

        if (returnOnly && !url) {
          return { ok: false, error: 'Nenhuma aba aberta encontrada para retornar.' };
        }
      }

      if (!url) return { ok: false, error: 'URL vazia' };

      const tab = await chrome.tabs.create({ url, active: true });
      if (tab?.id) {
        lastControlledTabId = tab.id;
        const svc = getServiceKey(url);
        if (svc) serviceTabMap[svc] = tab.id;
        await saveState();
        await waitForTabComplete(tab.id, 9000);
        try {
          const updated = await chrome.tabs.get(tab.id);
          if (updated) await recordTab(updated, true);
        } catch {
          /* ignore */
        }
      }
      return { ok: true, reused: false, tabId: tab?.id, url };
    }

    if (type === 'FOCUS_ORBIEX') {
      if (orbiexTabId) {
        try {
          const t = await chrome.tabs.get(orbiexTabId);
          if (t?.id && isOrbiexUrl(t.url || '')) {
            await focusTabAndWindow(t);
            return { ok: true };
          }
        } catch {
          orbiexTabId = null;
        }
      }
      const tabs = await chrome.tabs.query({});
      const found = tabs.find((t) => isOrbiexUrl(t.url || ''));
      if (found?.id) {
        orbiexTabId = found.id;
        await saveState();
        await focusTabAndWindow(found);
        return { ok: true };
      }
      await chrome.tabs.create({ url: 'https://www.orbiex.io/', active: true });
      return { ok: true };
    }

    if (type === 'CAPTURE_SCREEN_CONTEXT') {
      const tab = await resolveTargetTab();
      if (!tab || !tab.id) {
        return { ok: false, error: 'Nenhuma aba externa aberta.' };
      }
      if (!/^https?:\/\//i.test(tab.url || '')) {
        return { ok: false, error: 'Aba interna do navegador não permite inspeção.' };
      }
      if (tab.status !== 'complete') {
        await waitForTabComplete(tab.id, 5000);
      }

      let scanRes = null;
      try {
        scanRes = await sendToTabWithAutoInject(tab.id, {
          type: 'ORBIEX_SCAN_SOM',
          payload: { showBadges: true },
        });
      } catch {
        scanRes = null;
      }

      let screenshot = null;
      try {
        await new Promise((r) => setTimeout(r, 70));
        screenshot = await chrome.tabs.captureVisibleTab(tab.windowId, {
          format: 'jpeg',
          quality: 62,
        });
      } catch {
        screenshot = null;
      }

      sendToTabWithAutoInject(tab.id, { type: 'ORBIEX_CLEAR_SOM' }).catch(() => {});

      return {
        ok: true,
        url: tab.url,
        title: tab.title,
        screenshot,
        elements: scanRes?.elements || [],
        viewport: scanRes?.viewport || null,
      };
    }

    if (type === 'EXECUTE_GROUNDED') {
      const tab = await resolveTargetTab();
      if (!tab || !tab.id) {
        return { ok: false, error: 'Nenhuma aba externa aberta.' };
      }
      const res = await sendToTabWithAutoInject(tab.id, {
        type: 'ORBIEX_EXECUTE_GROUNDED',
        payload,
      });
      return res || { ok: false, error: 'Sem resposta ao executar ação.' };
    }

    if (type === 'INTERACT_PAGE') {
      const tab = await resolveTargetTab();
      if (!tab || !tab.id) {
        return {
          ok: false,
          error: 'Nenhuma aba externa aberta para interagir. Peça primeiro para abrir o site desejado.',
        };
      }
      if (!/^https?:\/\//i.test(tab.url || '')) {
        return { ok: false, error: 'Esta página interna do navegador não permite automação.' };
      }
      if (tab.status !== 'complete') {
        await waitForTabComplete(tab.id, 6000);
      }

      const result = await sendToTabWithAutoInject(tab.id, {
        type: 'ORBIEX_DOM_ACTION',
        payload,
      });
      return result || { ok: false, error: 'Sem resposta da página' };
    }

    return { ok: false, error: 'Comando desconhecido' };
  })()
    .then((res) => sendResponse(res))
    .catch((err) => sendResponse({ ok: false, error: err?.message || String(err) }));

  return true;
});

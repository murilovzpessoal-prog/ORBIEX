/**
 * Orbiex Copilot v2.4 — Background Service Worker
 * - Busca GLOBAL em todas as janelas e abas por URL, domínio canonical (incluindo flow.google.com!), título da aba e tabId
 * - FOCUS_EXISTING_TAB, FOCUS_TAB_BY_ID e returnOnly NUNCA criam aba nova (zero duplicação de Google Flow / Kling / TikTok)
 * - Persiste orbiexTabId, lastControlledTabId e mapa por ferramenta em chrome.storage.local
 */

let orbiexTabId = null;
let lastControlledTabId = null;
let serviceTabMap = {};
let stateLoaded = false;
let loadPromise = null;

const STATE_KEY = 'orbiex_copilot_state_v2';
const EXT_VERSION = '2.4.0';

function isOrbiexUrl(url = '') {
  return /https?:\/\/([a-z0-9-]+\.)?orbiex\.io/i.test(url) || /http:\/\/localhost:/i.test(url);
}

function getKnownServiceKey(url = '', title = '') {
  if (!url || !/^https?:\/\//i.test(url) || isOrbiexUrl(url)) return '';
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./i, '').toLowerCase();
    const path = (u.pathname || '').toLowerCase();
    const ttl = String(title || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    if (
      host === 'flow.google' ||
      host.endsWith('.flow.google') ||
      host === 'flow.google.com' ||
      host.endsWith('.flow.google.com') ||
      host === 'labs.google' ||
      host.endsWith('.labs.google') ||
      host === 'labs.google.com' ||
      host.endsWith('.labs.google.com') ||
      host.includes('aitestkitchen') ||
      host.includes('videofx') ||
      (host.includes('google') && (path.includes('/flow') || path.includes('/fx') || path.includes('videofx'))) ||
      /\bgoogle\s*flow\b/i.test(ttl) ||
      (/\bflow\b/i.test(ttl) && (host.includes('google') || ttl.includes('veo') || ttl.includes('labs')))
    ) {
      if (path.includes('/whisk')) return 'google_whisk';
      if (path.includes('/musicfx')) return 'google_musicfx';
      if (path.includes('/imagefx')) return 'google_imagefx';
      return 'google_flow';
    }
    if (
      host === 'accounts.google.com' &&
      (url.toLowerCase().includes('labs.google') || url.toLowerCase().includes('flow.google'))
    ) {
      return 'google_flow';
    }
    if (host === 'tiktok.com' || host.endsWith('.tiktok.com')) {
      if (host.includes('seller')) return 'tiktok_seller';
      if (path.includes('/tiktokstudio/upload')) return 'tiktok_studio_upload';
      if (path.includes('/tiktokstudio')) return 'tiktok_studio';
      return 'tiktok';
    }
    if (host.includes('klingai.com') || /\bkling\b/i.test(ttl)) return 'kling';
    if (host.includes('hailuo') || /\bhailuo\b/i.test(ttl)) return 'hailuo';
    if (host.includes('lumalabs.ai') || /\bluma\b/i.test(ttl)) return 'luma';
    if (host.includes('runwayml.com') || /\brunway\b/i.test(ttl)) return 'runway';
    if (host.includes('midjourney.com') || /\bmidjourney\b/i.test(ttl)) return 'midjourney';
    if (host.includes('capcut.com') || /\bcapcut\b/i.test(ttl)) return 'capcut';
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
    return '';
  } catch {
    return '';
  }
}

function getServiceKey(url = '', title = '') {
  const known = getKnownServiceKey(url, title);
  if (known) return known;
  if (!url || !/^https?:\/\//i.test(url) || isOrbiexUrl(url)) return '';
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./i, '').toLowerCase();
    return host.split('.').slice(-2).join('.');
  } catch {
    return '';
  }
}

function getServiceKeyFromHint(hint = '') {
  const h = String(hint || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  if (!h) return '';
  if (h.includes('flow') || h.includes('veo') || h.includes('labs')) return 'google_flow';
  if (h.includes('kling')) return 'kling';
  if (h.includes('hailuo') || h.includes('minimax')) return 'hailuo';
  if (h.includes('luma')) return 'luma';
  if (h.includes('runway')) return 'runway';
  if (h.includes('midjourney')) return 'midjourney';
  if (h.includes('capcut')) return 'capcut';
  if (h.includes('canva')) return 'canva';
  if (h.includes('seller')) return 'tiktok_seller';
  if (h.includes('studio')) return 'tiktok_studio';
  if (h.includes('tiktok')) return 'tiktok';
  if (h.includes('chatgpt')) return 'chatgpt';
  if (h.includes('youtube')) return 'youtube';
  if (h.includes('whatsapp') || h.includes('zap')) return 'whatsapp';
  return '';
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
  try {
    if (tab.windowId) {
      try {
        const win = await chrome.windows.get(tab.windowId);
        const upd = { focused: true };
        if (win?.state === 'minimized') upd.state = 'normal';
        await chrome.windows.update(tab.windowId, upd);
      } catch {
        await chrome.windows.update(tab.windowId, { focused: true }).catch(() => {});
      }
    }
    await chrome.tabs.update(tab.id, { active: true });
    await new Promise((r) => setTimeout(r, 120));
    return true;
  } catch {
    return false;
  }
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

async function findExistingServiceTab(targetUrl, hintText = '') {
  await ensureLoaded();
  const targetSvc = getKnownServiceKey(targetUrl, hintText) || getServiceKeyFromHint(hintText);
  const hintClean = String(hintText || '')
    .replace(/\([^)]*\)/g, ' ')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const stopWords = new Set([
    'para',
    'com',
    'aba',
    'aberta',
    'abrir',
    'voltar',
    'retornar',
    'site',
    'pagina',
    'novo',
    'projeto',
    'veo',
    'google',
  ]);
  const hintTokens = hintClean.split(' ').filter((w) => w.length >= 3 && !stopWords.has(w));
  const tabs = await chrome.tabs.query({});
  const preferredId = targetSvc ? serviceTabMap[targetSvc] : lastControlledTabId;

  const matchTab = (t) => {
    const openUrl = t.url || t.pendingUrl || '';
    if (!openUrl || !/^https?:\/\//i.test(openUrl) || isOrbiexUrl(openUrl)) return false;
    if (!targetUrl && !targetSvc && !hintClean) return true;

    const titleNorm = String(t.title || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    const urlLower = openUrl.toLowerCase();
    const combined = `${urlLower} ${titleNorm}`;

    const openSvc = getKnownServiceKey(openUrl, t.title || '');
    if (targetSvc && openSvc) {
      return openSvc === targetSvc;
    }

    // Lembrar diretamente do tab.id salvo se ainda pertence ao serviço ou ainda não mudou para outro serviço conhecido
    if (preferredId && t.id === preferredId && (!openSvc || !targetSvc || openSvc === targetSvc)) {
      return true;
    }

    if (targetSvc === 'google_flow') {
      if (
        urlLower.includes('flow.google') ||
        urlLower.includes('labs.google') ||
        urlLower.includes('/tools/flow') ||
        urlLower.includes('aitestkitchen') ||
        urlLower.includes('videofx') ||
        /\bgoogle\s*flow\b/i.test(combined) ||
        (/\bflow\b/i.test(titleNorm) && (urlLower.includes('google') || !openSvc))
      ) {
        return true;
      }
    }

    if (hintClean && hintClean.length >= 3 && combined.includes(hintClean)) return true;
    if (hintTokens.length > 0 && hintTokens.every((tk) => combined.includes(tk))) return true;
    if (hintTokens.length > 0 && hintTokens.some((tk) => tk.length >= 4 && titleNorm.includes(tk))) return true;

    if (targetUrl && !targetSvc) {
      try {
        const a = new URL(openUrl);
        const b = new URL(targetUrl);
        const ha = a.hostname.replace(/^www\./i, '').toLowerCase();
        const hb = b.hostname.replace(/^www\./i, '').toLowerCase();
        return ha === hb;
      } catch {
        return false;
      }
    }
    return false;
  };

  const matching = tabs.filter((t) => t.id && matchTab(t));
  if (!matching.length) return null;

  const scoreTab = (t) => {
    const u = (t.url || t.pendingUrl || '').toLowerCase();
    let score = 0;
    if (u.includes('/project/') || u.includes('/editor') || u.includes('/create')) score += 2000;
    if (preferredId && t.id === preferredId) score += 1200;
    if (lastControlledTabId && t.id === lastControlledTabId) score += 800;
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
      return { ok: true, version: EXT_VERSION };
    }

    if (type === 'LIST_OPEN_TABS') {
      const tabs = await chrome.tabs.query({});
      return {
        ok: true,
        version: EXT_VERSION,
        tabs: tabs
          .filter((t) => t.id && t.url && /^https?:\/\//i.test(t.url))
          .map((t) => ({
            id: t.id,
            title: t.title || '',
            url: t.url || '',
            serviceKey: getServiceKey(t.url || '', t.title || ''),
            lastAccessed: t.lastAccessed || 0,
          })),
      };
    }

    // Retorno direto por ID exato da aba (NUNCA cria aba nova!)
    if (type === 'FOCUS_TAB_BY_ID') {
      const tabId = Number(payload.tabId);
      if (!tabId) return { ok: false, version: EXT_VERSION, error: 'tabId inválido.' };
      try {
        const target = await chrome.tabs.get(tabId);
        if (!target || !target.id) {
          return { ok: false, version: EXT_VERSION, notFound: true, error: 'Aba não encontrada.' };
        }
        await recordTab(target, true);
        const focused = await focusTabAndWindow(target);
        if (!focused) {
          return { ok: false, version: EXT_VERSION, notFound: true, error: 'Não foi possível focar essa aba.' };
        }
        return {
          ok: true,
          version: EXT_VERSION,
          reused: true,
          tabId: target.id,
          url: target.url,
          title: target.title,
        };
      } catch {
        return { ok: false, version: EXT_VERSION, notFound: true, error: 'Aba fechada ou inacessível.' };
      }
    }

    // Retorno ESTRITO: NUNCA cria aba nova! Só procura e foca onde o usuário estava.
    if (type === 'FOCUS_EXISTING_TAB') {
      const url = String(payload.url || '').trim();
      const hint = String(payload.hint || '').trim();
      let target = null;

      if (url || hint) {
        target = await findExistingServiceTab(url, hint);
      }
      if (!target && !url && !hint) {
        target = await resolveTargetTab();
      }

      if (target && target.id) {
        await recordTab(target, true);
        await focusTabAndWindow(target);
        return {
          ok: true,
          version: EXT_VERSION,
          reused: true,
          tabId: target.id,
          url: target.url,
          title: target.title,
        };
      }

      const tabs = await chrome.tabs.query({});
      const externalTitles = tabs
        .filter((t) => t.url && /^https?:\/\//i.test(t.url) && !isOrbiexUrl(t.url))
        .map((t) => t.title || t.url)
        .slice(0, 6);

      return {
        ok: false,
        version: EXT_VERSION,
        notFound: true,
        openTabs: externalTitles,
        error: externalTitles.length
          ? `Não achei nenhuma aba de ${hint || 'Google Flow'} aberta agora. Abas abertas visíveis: ${externalTitles.join(', ')}.`
          : 'Não há nenhuma aba externa aberta além da Orbiex no momento.',
      };
    }

    if (type === 'FOCUS_PREVIOUS_TAB') {
      const targetTab = await resolveTargetTab();
      if (!targetTab) {
        return { ok: false, version: EXT_VERSION, error: 'Nenhuma aba anterior encontrada para retornar.' };
      }
      await focusTabAndWindow(targetTab);
      return {
        ok: true,
        version: EXT_VERSION,
        reused: true,
        tabId: targetTab.id,
        url: targetTab.url,
        title: targetTab.title,
      };
    }

    if (type === 'FOCUS_OR_OPEN_TAB' || type === 'OPEN_TAB') {
      const url = String(payload.url || '').trim();
      const hint = String(payload.hint || '').trim();
      const forceNewTab = Boolean(payload.forceNewTab);
      const returnOnly = Boolean(payload.returnOnly);

      if (!forceNewTab) {
        const existing = await findExistingServiceTab(url, hint);
        if (existing && existing.id) {
          await recordTab(existing, true);
          await focusTabAndWindow(existing);
          return {
            ok: true,
            version: EXT_VERSION,
            reused: true,
            tabId: existing.id,
            url: existing.url,
            title: existing.title,
          };
        }

        if (returnOnly) {
          return {
            ok: false,
            version: EXT_VERSION,
            notFound: true,
            error: `Nenhuma aba aberta de ${hint || 'Google Flow'} foi encontrada para retornar (não abri uma nova para proteger seu progresso).`,
          };
        }
      }

      if (!url) return { ok: false, version: EXT_VERSION, error: 'URL vazia' };

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
      return { ok: true, version: EXT_VERSION, reused: false, tabId: tab?.id, url };
    }

    if (type === 'FOCUS_ORBIEX') {
      if (orbiexTabId) {
        try {
          const t = await chrome.tabs.get(orbiexTabId);
          if (t?.id && isOrbiexUrl(t.url || '')) {
            await focusTabAndWindow(t);
            return { ok: true, version: EXT_VERSION };
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
        return { ok: true, version: EXT_VERSION };
      }
      await chrome.tabs.create({ url: 'https://www.orbiex.io/', active: true });
      return { ok: true, version: EXT_VERSION };
    }

    if (type === 'CAPTURE_SCREEN_CONTEXT') {
      const tab = await resolveTargetTab();
      if (!tab || !tab.id) {
        return { ok: false, version: EXT_VERSION, error: 'Nenhuma aba externa aberta.' };
      }
      if (!/^https?:\/\//i.test(tab.url || '')) {
        return { ok: false, version: EXT_VERSION, error: 'Aba interna do navegador não permite inspeção.' };
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
        version: EXT_VERSION,
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
        return { ok: false, version: EXT_VERSION, error: 'Nenhuma aba externa aberta.' };
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
          version: EXT_VERSION,
          error: 'Nenhuma aba externa aberta para interagir. Peça primeiro para abrir o site desejado.',
        };
      }
      if (!/^https?:\/\//i.test(tab.url || '')) {
        return { ok: false, version: EXT_VERSION, error: 'Esta página interna do navegador não permite automação.' };
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

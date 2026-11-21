/**
 * Orbiex Copilot v2.0 — Background Service Worker (Visão Computacional + Mapa Espacial DOM)
 * Captura print em tempo real da aba ativa + mapa de coordenadas para precisão cirúrgica.
 */

let orbiexTabId = null;
let lastControlledTabId = null;

function isOrbiexUrl(url = '') {
  return /https?:\/\/([a-z0-9-]+\.)?orbiex\.io/i.test(url) || /http:\/\/localhost:/i.test(url);
}

async function injectBridgeIntoOpenOrbiexTabs() {
  try {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.id && isOrbiexUrl(tab.url || '')) {
        orbiexTabId = tab.id;
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['orbiex-bridge.js'],
          });
        } catch {
          /* ignore */
        }
      }
    }
  } catch {
    /* ignore */
  }
}

chrome.runtime.onInstalled.addListener(() => {
  injectBridgeIntoOpenOrbiexTabs();
});
chrome.runtime.onStartup.addListener(() => {
  injectBridgeIntoOpenOrbiexTabs();
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

async function resolveTargetTab() {
  const activeTabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (activeTabs[0] && activeTabs[0].id && !isOrbiexUrl(activeTabs[0].url || '')) {
    lastControlledTabId = activeTabs[0].id;
    return activeTabs[0];
  }

  if (lastControlledTabId) {
    try {
      const tab = await chrome.tabs.get(lastControlledTabId);
      if (tab && tab.id && !isOrbiexUrl(tab.url || '')) {
        await chrome.tabs.update(tab.id, { active: true });
        await new Promise((r) => setTimeout(r, 120));
        return tab;
      }
    } catch {
      lastControlledTabId = null;
    }
  }

  const allTabs = await chrome.tabs.query({ lastFocusedWindow: true });
  const candidate = allTabs
    .reverse()
    .find((t) => t.id && t.url && /^https?:\/\//i.test(t.url) && !isOrbiexUrl(t.url));
  if (candidate) {
    lastControlledTabId = candidate.id;
    await chrome.tabs.update(candidate.id, { active: true });
    await new Promise((r) => setTimeout(r, 120));
    return candidate;
  }

  return null;
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
  if (sender?.tab?.id && isOrbiexUrl(sender.tab.url || '')) {
    orbiexTabId = sender.tab.id;
  }

  (async () => {
    const type = msg?.type;
    const payload = msg?.payload || {};

    if (type === 'PING') {
      return { ok: true, version: '2.0.0' };
    }

    if (type === 'OPEN_TAB') {
      const url = String(payload.url || '').trim();
      if (!url) return { ok: false, error: 'URL vazia' };

      const tab = await chrome.tabs.create({ url, active: true });
      if (tab?.id) {
        lastControlledTabId = tab.id;
        await waitForTabComplete(tab.id, 9000);
      }
      return { ok: true, tabId: tab?.id, url };
    }

    if (type === 'FOCUS_ORBIEX') {
      if (orbiexTabId) {
        try {
          const t = await chrome.tabs.update(orbiexTabId, { active: true });
          if (t?.windowId) await chrome.windows.update(t.windowId, { focused: true });
          return { ok: true };
        } catch {
          orbiexTabId = null;
        }
      }
      const tabs = await chrome.tabs.query({});
      const found = tabs.find((t) => isOrbiexUrl(t.url || ''));
      if (found?.id) {
        orbiexTabId = found.id;
        await chrome.tabs.update(found.id, { active: true });
        return { ok: true };
      }
      await chrome.tabs.create({ url: 'https://www.orbiex.io/', active: true });
      return { ok: true };
    }

    // NOVO EM V2.0: Captura Visão Real (Screenshot JPEG) + Mapa Espacial de Elementos com Coordenadas!
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

      // 1. Escaneia todos os elementos interativos (com coordenadas xPct, yPct e região da tela)
      //    e desenha etiquetas numéricas discretas (#1, #2...) por 150ms durante o print (Set-of-Marks!)
      const scanRes = await sendToTabWithAutoInject(tab.id, {
        type: 'ORBIEX_SCAN_SOM',
        payload: { showBadges: true },
      });

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

      // Remove as etiquetas Set-of-Marks imediatamente após tirar o print
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

    // NOVO EM V2.0: Executa ação cirúrgica no UID / Coordenada exata escolhida pela Visão IA!
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

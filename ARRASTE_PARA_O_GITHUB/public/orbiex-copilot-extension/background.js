/**
 * Orbiex Copilot — Background Service Worker (Manifest V3)
 * Orquestra abertura de abas sem bloqueio de pop-up e envia comandos de clique/digitação/rolagem
 * para a aba ativa (Google Flow, Kling AI, TikTok, Seller Center, CapCut, etc.).
 */

let orbiexTabId = null;
let lastControlledTabId = null;

function isOrbiexUrl(url = '') {
  return /https?:\/\/([a-z0-9-]+\.)?orbiex\.io/i.test(url) || /http:\/\/localhost:/i.test(url);
}

// Injeta imediatamente a ponte em qualquer aba da Orbiex que já estivesse aberta antes de instalar a extensão!
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
  // 1. Verifica a aba ativa da janela atual (se não for a própria Orbiex)
  const activeTabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (activeTabs[0] && activeTabs[0].id && !isOrbiexUrl(activeTabs[0].url || '')) {
    lastControlledTabId = activeTabs[0].id;
    return activeTabs[0];
  }

  // 2. Se o usuário estiver na aba da Orbiex, usa a última aba externa controlada (ex: Google Flow recém-aberto)
  if (lastControlledTabId) {
    try {
      const tab = await chrome.tabs.get(lastControlledTabId);
      if (tab && tab.id && !isOrbiexUrl(tab.url || '')) {
        await chrome.tabs.update(tab.id, { active: true });
        return tab;
      }
    } catch {
      lastControlledTabId = null;
    }
  }

  // 3. Procura qualquer outra aba aberta que não seja a Orbiex nem chrome://
  const allTabs = await chrome.tabs.query({ lastFocusedWindow: true });
  const candidate = allTabs
    .reverse()
    .find((t) => t.id && t.url && /^https?:\/\//i.test(t.url) && !isOrbiexUrl(t.url));
  if (candidate) {
    lastControlledTabId = candidate.id;
    await chrome.tabs.update(candidate.id, { active: true });
    return candidate;
  }

  return null;
}

async function sendToTabWithAutoInject(tabId, message) {
  try {
    return await chrome.tabs.sendMessage(tabId, message);
  } catch {
    // Caso a aba já estivesse aberta antes de instalar a extensão, injeta o agente sob demanda!
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['copilot-agent.js'],
    });
    await new Promise((r) => setTimeout(r, 180));
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
      return { ok: true, version: '1.0.0' };
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

    if (type === 'INTERACT_PAGE') {
      const tab = await resolveTargetTab();
      if (!tab || !tab.id) {
        return {
          ok: false,
          error: 'Nenhuma aba externa aberta para interagir. Peça primeiro para abrir o site desejado (ex: Google Flow ou TikTok).',
        };
      }

      if (!/^https?:\/\//i.test(tab.url || '')) {
        return { ok: false, error: 'Esta página interna do navegador não permite automação.' };
      }

      // Se a página ainda estiver carregando, aguarda finalizar
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

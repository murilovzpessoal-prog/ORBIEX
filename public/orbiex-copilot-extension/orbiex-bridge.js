/**
 * Orbiex Bridge v2.0 — Conecta a plataforma web (orbiex.io) à Extensão Orbiex Copilot
 */
(function () {
  if (window.__ORBIEX_BRIDGE_V2__) return;
  window.__ORBIEX_BRIDGE_V2__ = true;

  const EXT_VERSION = '2.0.0';

  function announceReady() {
    try {
      if (document.documentElement) {
        document.documentElement.setAttribute('data-orbiex-copilot', EXT_VERSION);
      }
      window.dispatchEvent(
        new CustomEvent('orbiex-copilot:ready', { detail: { version: EXT_VERSION } })
      );
      window.postMessage({ source: 'orbiex-ext-ready', version: EXT_VERSION }, '*');
    } catch {
      /* noop */
    }
  }

  announceReady();
  document.addEventListener('DOMContentLoaded', announceReady);
  window.addEventListener('load', announceReady);

  window.addEventListener('message', (event) => {
    const data = event.data;
    if (!data || data.source !== 'orbiex-web-cmd') return;

    const { reqId, type, payload } = data;

    if (type === 'PING') {
      announceReady();
      window.postMessage(
        { source: 'orbiex-ext-res', reqId, result: { ok: true, version: EXT_VERSION } },
        '*'
      );
      return;
    }

    try {
      chrome.runtime.sendMessage({ type, payload }, (response) => {
        const err = chrome.runtime.lastError;
        if (err) {
          window.postMessage(
            { source: 'orbiex-ext-res', reqId, result: { ok: false, error: err.message } },
            '*'
          );
          return;
        }
        window.postMessage(
          { source: 'orbiex-ext-res', reqId, result: response || { ok: true } },
          '*'
        );
      });
    } catch (e) {
      window.postMessage(
        { source: 'orbiex-ext-res', reqId, result: { ok: false, error: String(e) } },
        '*'
      );
    }
  });
})();

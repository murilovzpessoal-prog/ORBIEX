/**
 * Orbiex Bridge — Conecta a plataforma web (orbiex.io) à Extensão Orbiex Copilot
 */
(function () {
  if (window.__ORBIEX_BRIDGE_ACTIVE__) return;
  window.__ORBIEX_BRIDGE_ACTIVE__ = true;

  function announceReady() {
    try {
      if (document.documentElement) {
        document.documentElement.setAttribute('data-orbiex-copilot', '1.0.0');
      }
      window.dispatchEvent(
        new CustomEvent('orbiex-copilot:ready', { detail: { version: '1.0.0' } })
      );
      window.postMessage({ source: 'orbiex-ext-ready', version: '1.0.0' }, '*');
    } catch {
      /* noop */
    }
  }

  announceReady();
  document.addEventListener('DOMContentLoaded', announceReady);
  window.addEventListener('load', announceReady);

  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    const data = event.data;
    if (!data || data.source !== 'orbiex-web-cmd') return;

    const { reqId, type, payload } = data;

    if (type === 'PING') {
      announceReady();
      window.postMessage(
        { source: 'orbiex-ext-res', reqId, result: { ok: true, version: '1.0.0' } },
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

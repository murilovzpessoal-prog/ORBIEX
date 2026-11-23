/**
 * Orbiex Bridge v2.0 — Conecta a plataforma web (orbiex.io) à Extensão Orbiex Copilot
 */
(function () {
  if (window.__ORBIEX_BRIDGE_V2__) return;
  window.__ORBIEX_BRIDGE_V2__ = true;

  const EXT_VERSION = '2.1.0';

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

    if (type === 'WRITE_CLIPBOARD') {
      const txt = String(payload?.text || '');
      try {
        const ta = document.createElement('textarea');
        ta.value = txt;
        ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0;';
        document.body.appendChild(ta);
        ta.focus({ preventScroll: true });
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      } catch {
        /* ignore */
      }
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(txt).catch(() => {});
      }
      window.postMessage({ source: 'orbiex-ext-res', reqId, result: { ok: true } }, '*');
      return;
    }

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

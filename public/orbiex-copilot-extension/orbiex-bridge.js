/**
 * Orbiex Bridge v2.3 — Conecta a plataforma web (orbiex.io) à Extensão Orbiex Copilot
 * Canal dedicado v23 garante isolamento total mesmo que uma versão 2.0/2.2 antiga exista no Chrome.
 */
(function () {
  const EXT_VERSION = '2.3.0';
  if (window.__ORBIEX_BRIDGE_V23__ === EXT_VERSION) return;
  window.__ORBIEX_BRIDGE_V23__ = EXT_VERSION;
  window.__ORBIEX_BRIDGE_V2__ = true;

  function isRuntimeAlive() {
    try {
      return Boolean(typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id);
    } catch {
      return false;
    }
  }

  function announceReady() {
    if (!isRuntimeAlive()) return;
    try {
      if (document.documentElement) {
        document.documentElement.setAttribute('data-orbiex-copilot', EXT_VERSION);
        document.documentElement.setAttribute('data-orbiex-copilot-v23', EXT_VERSION);
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

  function replyResult(reqId, sourceOut, result) {
    window.postMessage({ source: sourceOut, reqId, result }, '*');
    if (sourceOut !== 'orbiex-ext-res') {
      window.postMessage({ source: 'orbiex-ext-res', reqId, result }, '*');
    }
  }

  function onWebMessage(event) {
    if (!isRuntimeAlive()) {
      window.removeEventListener('message', onWebMessage);
      return;
    }
    const data = event.data;
    if (!data) return;

    const isV23 = data.source === 'orbiex-web-cmd-v23';
    const isLegacy = data.source === 'orbiex-web-cmd';
    if (!isV23 && !isLegacy) return;

    // Se a página estiver usando o canal exclusivo v23, ignoramos duplicatas legadas apenas se vierem para o mesmo listener
    const sourceOut = isV23 ? 'orbiex-ext-res-v23' : 'orbiex-ext-res';
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
      replyResult(reqId, sourceOut, { ok: true, version: EXT_VERSION });
      return;
    }

    if (type === 'PING') {
      announceReady();
      replyResult(reqId, sourceOut, { ok: true, version: EXT_VERSION });
      return;
    }

    try {
      chrome.runtime.sendMessage({ type, payload }, (response) => {
        const err = chrome.runtime.lastError;
        if (err) {
          replyResult(reqId, sourceOut, { ok: false, version: EXT_VERSION, error: err.message });
          return;
        }
        replyResult(
          reqId,
          sourceOut,
          response ? { ...response, version: response.version || EXT_VERSION } : { ok: true, version: EXT_VERSION }
        );
      });
    } catch (e) {
      replyResult(reqId, sourceOut, { ok: false, version: EXT_VERSION, error: String(e) });
    }
  }

  window.addEventListener('message', onWebMessage);
})();

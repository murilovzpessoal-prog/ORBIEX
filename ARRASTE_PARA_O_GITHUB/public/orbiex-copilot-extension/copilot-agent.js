/**
 * Orbiex Copilot Agent — Content Script Universal (DOM + Shadow DOM)
 * Localiza botões, links, abas e campos de prompt (em Português ou Inglês),
 * destaca visualmente em dourado e executa cliques/digitação reais.
 */
(function () {
  if (window.__ORBIEX_COPILOT_AGENT__) return;
  window.__ORBIEX_COPILOT_AGENT__ = true;

  /* ───── Dicionário Bilíngue PT ⇄ EN para Interfaces (Google Flow, Kling, TikTok, etc.) ───── */
  const SYNONYM_GROUPS = [
    [
      'novo projeto',
      'criar novo projeto',
      'criar projeto',
      'new project',
      'create project',
      'create new',
      '+ novo projeto',
      '+ new project',
      '+ novo',
      '+ new',
      'start project',
      'criar com o flow',
      'create with flow',
      'novo',
      'new',
    ],
    ['gerar', 'criar', 'criar video', 'gerar video', 'generate', 'create', 'run', 'submit', 'enviar', 'make'],
    ['comecar', 'iniciar', 'entrar no flow', 'abrir flow', 'get started', 'start', 'launch', 'try now', 'open', 'explore'],
    ['baixar', 'download', 'exportar', 'export', 'salvar', 'save'],
    ['subir', 'enviar arquivo', 'upload', 'importar', 'import', 'postar', 'publicar', 'post', 'publish', 'selecionar video'],
    ['entrar', 'login', 'fazer login', 'sign in', 'log in', 'continuar', 'continue'],
    ['fechar', 'cancelar', 'close', 'cancel', 'dispensar', 'dismiss', 'got it', 'entendi', 'aceitar', 'accept'],
    ['configuracoes', 'ajustes', 'settings', 'preferences', 'options', 'opcoes'],
    ['imagem para video', 'image to video', 'frames to video', 'texto para video', 'text to video', 'ingredients', 'ingredientes'],
  ];

  function norm(s) {
    return String(s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\p{L}\p{N}\s+]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function expandSynonyms(rawQuery) {
    const q = norm(rawQuery);
    const terms = new Set([q]);
    // Remove verbos de comando caso venham juntos ("clica em novo projeto" -> "novo projeto")
    const stripped = q
      .replace(/^(clica|clique|aperte|aperta|pressione|seleciona|selecione|vai|va|abrir|abra)\s+(em|no|na|nos|nas|o|a|botao|botão|link|aba)?\s*/i, '')
      .replace(/^(botao|aba|opcao|menu)\s+(de\s+)?/i, '')
      .trim();
    if (stripped) terms.add(stripped);

    for (const group of SYNONYM_GROUPS) {
      const normalizedGroup = group.map(norm);
      if (normalizedGroup.some((g) => q.includes(g) || (stripped && stripped.includes(g)) || g === stripped)) {
        normalizedGroup.forEach((g) => terms.add(g));
      }
    }
    return Array.from(terms).filter((t) => t.length >= 2);
  }

  /* ───── Coletor Profundo (atravessa DOM + Shadow DOMs do Google Flow / Web Components) ───── */
  function collectElements(root, out = []) {
    if (!root) return out;
    const children = root.querySelectorAll ? root.querySelectorAll('*') : [];
    for (let i = 0; i < children.length; i++) {
      const el = children[i];
      if (el.id === 'orbiex-copilot-hud-host') continue;
      out.push(el);
      if (el.shadowRoot) {
        collectElements(el.shadowRoot, out);
      }
    }
    return out;
  }

  function isVisible(el) {
    if (!el || typeof el.getBoundingClientRect !== 'function') return false;
    const rect = el.getBoundingClientRect();
    if (rect.width < 6 || rect.height < 6) return false;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity || '1') < 0.05) {
      return false;
    }
    return true;
  }

  function isClickable(el) {
    const tag = (el.tagName || '').toLowerCase();
    if (tag === 'button' || tag === 'a' || tag === 'summary') return true;
    if (tag === 'input') {
      const tp = (el.getAttribute('type') || '').toLowerCase();
      if (tp === 'button' || tp === 'submit' || tp === 'reset') return true;
    }
    const role = (el.getAttribute('role') || '').toLowerCase();
    if (['button', 'link', 'tab', 'menuitem', 'option', 'switch', 'checkbox', 'radio'].includes(role)) {
      return true;
    }
    if (el.hasAttribute('onclick') || el.hasAttribute('jsaction')) return true;
    const style = window.getComputedStyle(el);
    if (style.cursor === 'pointer' && (el.children.length <= 4 || tag === 'span' || tag === 'div' || tag === 'li')) {
      return true;
    }
    return false;
  }

  function getElementLabel(el) {
    const aria = el.getAttribute('aria-label') || '';
    const title = el.getAttribute('title') || el.getAttribute('data-tooltip') || '';
    const placeholder = el.getAttribute('placeholder') || '';
    const val = el.tagName === 'INPUT' ? el.value || '' : '';
    const text = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
    const shortText = text.length <= 120 ? text : text.slice(0, 120);
    return [shortText, aria, title, placeholder, val].filter(Boolean).join(' | ').trim();
  }

  function findBestClickable(query) {
    const candidates = expandSynonyms(query);
    const all = collectElements(document);
    let best = null;
    let bestScore = 0;

    for (const el of all) {
      if (!isClickable(el) || !isVisible(el)) continue;
      if (el.disabled || el.getAttribute('aria-disabled') === 'true') continue;

      const rawText = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
      if (rawText.length > 140) continue; // ignora containers gigantes da página inteira

      const labelParts = [
        rawText,
        el.getAttribute('aria-label') || '',
        el.getAttribute('title') || '',
        el.getAttribute('data-tooltip') || '',
        el.getAttribute('data-testid') || '',
        el.value || '',
      ]
        .map(norm)
        .filter(Boolean);

      if (!labelParts.length) continue;

      let localScore = 0;
      for (let cIdx = 0; cIdx < candidates.length; cIdx++) {
        const cand = candidates[cIdx];
        const priorityBonus = cIdx < 2 ? 18 : 0; // prioriza exatamente o termo falado antes dos sinônimos

        for (const part of labelParts) {
          if (part === cand) {
            localScore = Math.max(localScore, 100 + priorityBonus);
          } else if (part.startsWith(cand + ' ') || part.endsWith(' ' + cand) || part.includes(' ' + cand + ' ')) {
            localScore = Math.max(localScore, 86 + priorityBonus);
          } else if (part.includes(cand)) {
            localScore = Math.max(localScore, 72 + priorityBonus - Math.min(20, (part.length - cand.length) * 0.4));
          } else {
            const words = cand.split(' ').filter((w) => w.length >= 3);
            if (words.length > 0) {
              const matched = words.filter((w) => part.includes(w)).length;
              if (matched > 0) {
                localScore = Math.max(localScore, Math.round((matched / words.length) * 62) + (priorityBonus > 0 ? 6 : 0));
              }
            }
          }
        }
      }

      // Bônus leve para <button> e [role="button"] reais em vez de <div> externo
      const tag = (el.tagName || '').toLowerCase();
      if (localScore > 0 && (tag === 'button' || el.getAttribute('role') === 'button' || tag === 'a')) {
        localScore += 6;
      }

      if (localScore > bestScore) {
        bestScore = localScore;
        best = { el, label: rawText || el.getAttribute('aria-label') || query, score: localScore };
      }
    }

    return bestScore >= 42 ? best : null;
  }

  function findBestInput(targetHint) {
    const all = collectElements(document);
    const hint = norm(targetHint || '');
    const inputs = all.filter((el) => {
      if (!isVisible(el)) return false;
      const tag = (el.tagName || '').toLowerCase();
      if (tag === 'textarea') return true;
      if (tag === 'input') {
        const tp = (el.getAttribute('type') || 'text').toLowerCase();
        return ['text', 'search', 'url', 'email', ''].includes(tp);
      }
      if (el.isContentEditable || el.getAttribute('contenteditable') === 'true' || el.getAttribute('role') === 'textbox') {
        return true;
      }
      return false;
    });

    if (!inputs.length) return null;
    if (!hint) {
      // Prefere textarea / textbox grande (campo de prompt do Flow / Kling / TikTok)
      return (
        inputs.sort((a, b) => {
          const ra = a.getBoundingClientRect();
          const rb = b.getBoundingClientRect();
          return rb.width * rb.height - ra.width * ra.height;
        })[0] || inputs[0]
      );
    }

    let best = inputs[0];
    let bestScore = -1;
    for (const el of inputs) {
      const meta = norm(
        [el.getAttribute('placeholder'), el.getAttribute('aria-label'), el.getAttribute('name'), el.innerText].join(' ')
      );
      let sc = meta.includes(hint) ? 50 : 0;
      const r = el.getBoundingClientRect();
      sc += Math.min(20, (r.width * r.height) / 5000);
      if (sc > bestScore) {
        bestScore = sc;
        best = el;
      }
    }
    return best;
  }

  /* ───── Feedback Visual Dourado na Tela + HUD Flutuante ───── */
  let hudBadgeTextEl = null;

  function ensureHud() {
    if (document.getElementById('orbiex-copilot-hud-host')) return;
    if (!document.body) return;

    const host = document.createElement('div');
    host.id = 'orbiex-copilot-hud-host';
    host.style.cssText = 'position:fixed;right:18px;bottom:18px;z-index:2147483646;pointer-events:auto;';
    const shadow = host.attachShadow({ mode: 'open' });

    const wrap = document.createElement('button');
    wrap.type = 'button';
    wrap.title = 'Voltar para o Agente de Voz Orbiex';
    wrap.style.cssText = [
      'display:flex;align-items:center;gap:8px;padding:8px 14px;border-radius:999px;',
      'background:rgba(10,9,7,0.92);border:1px solid rgba(212,175,55,0.55);',
      'box-shadow:0 8px 28px rgba(0,0,0,0.65),0 0 18px rgba(212,175,55,0.22);',
      'color:#f4d77a;font:700 11.5px/1.2 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;',
      'cursor:pointer;backdrop-filter:blur(10px);transition:transform 0.2s ease,border-color 0.2s ease;',
    ].join('');

    const dot = document.createElement('span');
    dot.style.cssText =
      'width:8px;height:8px;border-radius:50%;background:radial-gradient(circle,#fff3c4 0%,#d4af37 70%);box-shadow:0 0 10px #d4af37;flex-shrink:0;';

    const label = document.createElement('span');
    label.textContent = 'Orbiex Copilot Ativo';
    hudBadgeTextEl = label;

    wrap.appendChild(dot);
    wrap.appendChild(label);
    wrap.addEventListener('mouseenter', () => {
      wrap.style.transform = 'scale(1.04)';
      wrap.style.borderColor = '#f4d77a';
    });
    wrap.addEventListener('mouseleave', () => {
      wrap.style.transform = 'scale(1)';
      wrap.style.borderColor = 'rgba(212,175,55,0.55)';
    });
    wrap.addEventListener('click', () => {
      try {
        chrome.runtime.sendMessage({ type: 'FOCUS_ORBIEX' });
      } catch {
        window.open('https://www.orbiex.io/', '_blank');
      }
    });

    shadow.appendChild(wrap);
    document.body.appendChild(host);
  }

  function flashHudStatus(text) {
    ensureHud();
    if (!hudBadgeTextEl) return;
    hudBadgeTextEl.textContent = text;
    setTimeout(() => {
      if (hudBadgeTextEl) hudBadgeTextEl.textContent = 'Orbiex Copilot Ativo';
    }, 3500);
  }

  function highlightElement(el, actionText) {
    try {
      const rect = el.getBoundingClientRect();
      const ring = document.createElement('div');
      ring.style.cssText = [
        `position:fixed;left:${Math.max(2, rect.left - 6)}px;top:${Math.max(2, rect.top - 6)}px;`,
        `width:${rect.width + 12}px;height:${rect.height + 12}px;border-radius:14px;`,
        'border:2.5px solid #f4d77a;box-shadow:0 0 24px rgba(212,175,55,0.85),inset 0 0 14px rgba(212,175,55,0.35);',
        'pointer-events:none;z-index:2147483647;transition:opacity 0.4s ease,transform 0.3s ease;',
      ].join('');
      document.body.appendChild(ring);
      flashHudStatus(actionText);
      setTimeout(() => {
        ring.style.opacity = '0';
        ring.style.transform = 'scale(1.06)';
        setTimeout(() => ring.remove(), 420);
      }, 1300);
    } catch {
      /* noop */
    }
  }

  function simulateRealClick(el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const opts = { bubbles: true, cancelable: true, composed: true, view: window, clientX: cx, clientY: cy };

    el.dispatchEvent(new PointerEvent('pointerover', opts));
    el.dispatchEvent(new MouseEvent('mouseover', opts));
    el.dispatchEvent(new PointerEvent('pointerdown', opts));
    el.dispatchEvent(new MouseEvent('mousedown', opts));
    if (typeof el.focus === 'function') el.focus({ preventScroll: true });
    el.dispatchEvent(new PointerEvent('pointerup', opts));
    el.dispatchEvent(new MouseEvent('mouseup', opts));
    el.dispatchEvent(new MouseEvent('click', opts));
    if (typeof el.click === 'function') {
      try {
        el.click();
      } catch {
        /* noop */
      }
    }
  }

  function setInputValueReal(el, text) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (typeof el.focus === 'function') el.focus();

    const tag = (el.tagName || '').toLowerCase();
    if (tag === 'textarea' || tag === 'input') {
      const proto = tag === 'textarea' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
      if (setter) setter.call(el, text);
      else el.value = text;
      el.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      el.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
      return;
    }

    // Contenteditable / Rich Textbox (comum no Google Flow e editores modernos)
    try {
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(el);
      sel.removeAllRanges();
      sel.addRange(range);
      document.execCommand('insertText', false, text);
    } catch {
      el.textContent = text;
    }
    el.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, data: text, inputType: 'insertText' }));
  }

  function listVisibleButtonsSummary() {
    const all = collectElements(document);
    const labels = [];
    const seen = new Set();
    for (const el of all) {
      if (!isClickable(el) || !isVisible(el)) continue;
      const lbl = getElementLabel(el).split('|')[0].trim();
      if (lbl && lbl.length >= 2 && lbl.length <= 50 && !seen.has(lbl.toLowerCase())) {
        seen.add(lbl.toLowerCase());
        labels.push(lbl);
        if (labels.length >= 20) break;
      }
    }
    return labels;
  }

  /* ───── Executor de Ações Recebidas do Agente de Voz ───── */
  async function executeDomAction(payload) {
    const cmd = String(payload?.command || 'click').toLowerCase();

    if (cmd === 'scan') {
      return {
        ok: true,
        title: document.title,
        url: location.href,
        buttons: listVisibleButtonsSummary(),
      };
    }

    if (cmd === 'scroll') {
      const dir = String(payload?.direction || 'down').toLowerCase();
      const delta = Math.round(window.innerHeight * 0.72);
      if (dir === 'top') window.scrollTo({ top: 0, behavior: 'smooth' });
      else if (dir === 'bottom') window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      else window.scrollBy({ top: dir === 'up' ? -delta : delta, behavior: 'smooth' });
      flashHudStatus(`Rolando página (${dir === 'up' ? 'acima' : 'abaixo'})`);
      return { ok: true, message: `Página rolada para ${dir === 'up' ? 'cima' : 'baixo'}.` };
    }

    if (cmd === 'type') {
      const text = String(payload?.text || '').trim();
      if (!text) return { ok: false, error: 'Texto vazio para digitação.' };

      let inputEl = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        inputEl = findBestInput(payload?.target || '');
        if (inputEl) break;
        await new Promise((r) => setTimeout(r, 500));
      }

      if (!inputEl) {
        return {
          ok: false,
          error: 'Não encontrei um campo de texto aberto nesta tela. Peça para abrir um novo projeto primeiro.',
          availableButtons: listVisibleButtonsSummary(),
        };
      }

      highlightElement(inputEl, 'Digitando prompt na tela...');
      await new Promise((r) => setTimeout(r, 150));
      setInputValueReal(inputEl, text);

      if (payload?.clickAfter) {
        await new Promise((r) => setTimeout(r, 450));
        const submitMatch = findBestClickable(payload.clickAfter);
        if (submitMatch) {
          highlightElement(submitMatch.el, `Clicando: ${submitMatch.label}`);
          simulateRealClick(submitMatch.el);
          return { ok: true, message: `Texto preenchido e botão "${submitMatch.label}" clicado com sucesso.` };
        }
      }

      return { ok: true, message: 'Texto preenchido no campo com sucesso.' };
    }

    // Default: CLICK
    const targetQuery = String(payload?.target || '').trim();
    if (!targetQuery) return { ok: false, error: 'Nome do botão não informado.' };

    // Tenta até 4 vezes em 1.8s (caso a tela do Google Flow esteja terminando de montar os botões)
    let match = null;
    for (let attempt = 0; attempt < 4; attempt++) {
      match = findBestClickable(targetQuery);
      if (match) break;
      await new Promise((r) => setTimeout(r, 480));
    }

    if (!match) {
      return {
        ok: false,
        error: `Não localizei o botão "${targetQuery}" visível agora.`,
        availableButtons: listVisibleButtonsSummary(),
      };
    }

    highlightElement(match.el, `Clicou: ${match.label.slice(0, 28)}`);
    await new Promise((r) => setTimeout(r, 120));
    simulateRealClick(match.el);

    return {
      ok: true,
      clickedLabel: match.label,
      message: `Botão "${match.label}" localizado e clicado com sucesso.`,
    };
  }

  ensureHud();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureHud);
  }

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type === 'ORBIEX_DOM_ACTION') {
      executeDomAction(msg.payload)
        .then((res) => sendResponse(res))
        .catch((err) => sendResponse({ ok: false, error: err?.message || String(err) }));
      return true;
    }
    return false;
  });
})();

/**
 * Orbiex Copilot Agent v2.0 — Set-of-Marks Vision + Inteligência Espacial (DOM & Shadow DOM)
 * Enxerga posições na tela (canto inferior direito, topo, lateral, centro), caça chats retráteis,
 * caixas de prompt e botões com ícone, destaca em dourado e executa cliques e digitação reais.
 */
(function () {
  if (window.__ORBIEX_COPILOT_AGENT_V2__) return;
  window.__ORBIEX_COPILOT_AGENT_V2__ = true;

  const uidMap = new Map();

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
    [
      'chat',
      'chat_bubble',
      'forum',
      'sms',
      'comment',
      'smart_toy',
      'assistant',
      'spark',
      'auto_awesome',
      'conversa',
      'assistente',
      'mensagem',
      'perguntar',
      'ask',
      'message',
      'help',
      'ajuda',
      'prompt',
    ],
    ['gerar', 'criar', 'criar video', 'gerar video', 'generate', 'create', 'run', 'submit', 'enviar', 'send', 'arrow_upward', 'arrow_forward'],
    ['comecar', 'iniciar', 'entrar no flow', 'abrir flow', 'get started', 'start', 'launch', 'try now', 'open', 'explore'],
    ['baixar', 'download', 'exportar', 'export', 'salvar', 'save'],
    ['subir', 'enviar arquivo', 'upload', 'importar', 'import', 'postar', 'publicar', 'post', 'publish', 'selecionar video'],
    ['entrar', 'login', 'fazer login', 'sign in', 'log in', 'continuar', 'continue'],
    ['fechar', 'cancelar', 'close', 'cancel', 'dispensar', 'dismiss', 'got it', 'entendi', 'aceitar', 'accept'],
    ['configuracoes', 'ajustes', 'settings', 'preferences', 'options', 'opcoes', 'tune'],
    ['imagem para video', 'image to video', 'frames to video', 'texto para video', 'text to video', 'ingredients', 'ingredientes'],
  ];

  function norm(s) {
    return String(s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\p{L}\p{N}\s+_]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function expandSynonyms(rawQuery) {
    const q = norm(rawQuery);
    const terms = new Set([q]);
    const stripped = q
      .replace(/^(clica|clique|aperte|aperta|pressione|seleciona|selecione|vai|va|abrir|abra|escreve|escreva|digita|digite)\s+(em|no|na|nos|nas|o|a|botao|link|aba|campo)?\s*/i, '')
      .replace(/\b(canto|parte|lado)\s+(inferior|superior|topo|baixo|esquerdo|direito|esquerda|direita|meio|centro)(\s+(esquerdo|direito|esquerda|direita))?\b/gi, '')
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

  /* ───── Coleta Profunda (DOM + Shadow DOMs do Google Flow / Lit / Material Web) ───── */
  function collectElements(root, out = []) {
    if (!root) return out;
    const children = root.querySelectorAll ? root.querySelectorAll('*') : [];
    for (let i = 0; i < children.length; i++) {
      const el = children[i];
      if (el.id === 'orbiex-copilot-hud-host' || el.id === 'orbiex-som-overlay') continue;
      out.push(el);
      if (el.shadowRoot) {
        collectElements(el.shadowRoot, out);
      }
    }
    return out;
  }

  function deepActiveElement() {
    let a = document.activeElement;
    while (a && a.shadowRoot && a.shadowRoot.activeElement) {
      a = a.shadowRoot.activeElement;
    }
    return a;
  }

  function deepElementFromPoint(x, y) {
    let el = document.elementFromPoint(x, y);
    while (el && el.shadowRoot && typeof el.shadowRoot.elementFromPoint === 'function') {
      const inner = el.shadowRoot.elementFromPoint(x, y);
      if (!inner || inner === el) break;
      el = inner;
    }
    return el;
  }

  function isVisible(el) {
    if (!el || typeof el.getBoundingClientRect !== 'function') return false;
    const rect = el.getBoundingClientRect();
    if (rect.width < 8 || rect.height < 8) return false;
    if (rect.bottom < 0 || rect.right < 0 || rect.top > window.innerHeight || rect.left > window.innerWidth) {
      return false;
    }
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity || '1') < 0.05) {
      return false;
    }
    return true;
  }

  function isEditableElement(el) {
    if (!el) return false;
    const tag = (el.tagName || '').toLowerCase();
    if (tag === 'textarea') return !el.disabled && !el.readOnly;
    if (tag === 'input') {
      const tp = (el.getAttribute('type') || 'text').toLowerCase();
      return ['text', 'search', 'url', 'email', 'tel', ''].includes(tp) && !el.disabled && !el.readOnly;
    }
    if (el.isContentEditable || el.getAttribute('contenteditable') === 'true' || el.getAttribute('contenteditable') === 'plaintext-only') {
      return true;
    }
    if ((el.getAttribute('role') || '').toLowerCase() === 'textbox') return true;
    return false;
  }

  function isClickable(el) {
    const tag = (el.tagName || '').toLowerCase();
    if (tag === 'button' || tag === 'a' || tag === 'summary' || tag === 'select') return true;
    if (tag === 'input') {
      const tp = (el.getAttribute('type') || '').toLowerCase();
      if (['button', 'submit', 'reset', 'checkbox', 'radio'].includes(tp)) return true;
    }
    const role = (el.getAttribute('role') || '').toLowerCase();
    if (['button', 'link', 'tab', 'menuitem', 'option', 'switch', 'combobox'].includes(role)) {
      return true;
    }
    if (el.hasAttribute('onclick') || el.hasAttribute('jsaction')) return true;
    const style = window.getComputedStyle(el);
    if (style.cursor === 'pointer' && el.children.length <= 5) {
      return true;
    }
    return false;
  }

  function computeRegion(xPct, yPct) {
    const v = yPct < 30 ? 'topo' : yPct > 66 ? 'inferior' : 'meio';
    const h = xPct < 33 ? 'esquerdo' : xPct > 67 ? 'direito' : 'centro';
    if (v === 'meio' && h === 'centro') return 'centro';
    return `${v}-${h}`;
  }

  /** Extrai texto limpo separando ícones Material Symbols (comuns no Google Flow) */
  function extractRichLabel(el) {
    const aria = el.getAttribute('aria-label') || '';
    const placeholder = el.getAttribute('placeholder') || el.getAttribute('data-placeholder') || '';
    const title = el.getAttribute('title') || el.getAttribute('data-tooltip') || '';

    // Verifica texto de placeholder ou label no elemento pai imediato (ex: caixa de chat/prompt customizada)
    let parentHint = '';
    const parent = el.parentElement;
    if (parent) {
      const pAria = parent.getAttribute('aria-label') || parent.getAttribute('placeholder') || '';
      const pText = (parent.innerText || '').replace(/\s+/g, ' ').trim();
      if (pAria) parentHint = pAria;
      else if (pText && pText.length <= 80) parentHint = pText;
    }

    const ownText = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 90);
    const primary = [aria, placeholder, title, ownText].filter(Boolean).join(' | ').slice(0, 110);
    return {
      label: primary || parentHint || (el.tagName || '').toLowerCase(),
      context: parentHint && parentHint !== ownText ? parentHint.slice(0, 80) : '',
    };
  }

  /* ───── Set-of-Marks (SoM): Indexa todos os elementos visíveis + etiquetas numéricas p/ Visão IA ───── */
  function scanScreenForVision(showBadges) {
    clearSomOverlay();
    uidMap.clear();

    const all = collectElements(document);
    const vw = Math.max(1, window.innerWidth);
    const vh = Math.max(1, window.innerHeight);
    const items = [];
    const seenRects = [];

    for (const el of all) {
      const editable = isEditableElement(el);
      const clickable = !editable && isClickable(el);
      if (!editable && !clickable) continue;
      if (!isVisible(el)) continue;

      const rect = el.getBoundingClientRect();
      if (rect.width > vw * 0.92 && rect.height > vh * 0.85) continue;

      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      // Evita duplicar pai e filho exatamente na mesma coordenada (mantém o mais específico ou editável)
      const dupIdx = seenRects.findIndex(
        (r) => Math.abs(r.cx - cx) < 12 && Math.abs(r.cy - cy) < 12 && r.editable === editable
      );
      if (dupIdx !== -1) {
        if (rect.width * rect.height < seenRects[dupIdx].area) {
          // Filho mais específico substitui o container externo
          seenRects[dupIdx] = { cx, cy, area: rect.width * rect.height, editable, el, rect };
        }
        continue;
      }

      seenRects.push({ cx, cy, area: rect.width * rect.height, editable, el, rect });
    }

    let overlay = null;
    if (showBadges && document.body) {
      overlay = document.createElement('div');
      overlay.id = 'orbiex-som-overlay';
      overlay.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483645;';
      document.body.appendChild(overlay);
    }

    // Garante que todos os campos editáveis venham primeiro e preserva elementos do rodapé/canto inferior direito
    seenRects.sort((a, b) => (a.editable === b.editable ? 0 : a.editable ? -1 : 1));

    let nextUid = 1;
    for (const item of seenRects.slice(0, 130)) {
      const uid = nextUid++;
      uidMap.set(uid, item.el);

      const xPct = Math.round((item.cx / vw) * 100);
      const yPct = Math.round((item.cy / vh) * 100);
      const region = computeRegion(xPct, yPct);
      const { label, context } = extractRichLabel(item.el);

      items.push({
        uid,
        kind: item.editable ? 'input' : 'button',
        label,
        context: context || undefined,
        region,
        xPct,
        yPct,
        w: Math.round(item.rect.width),
        h: Math.round(item.rect.height),
      });

      if (overlay) {
        const tag = document.createElement('div');
        const bx = Math.max(0, Math.min(vw - 26, Math.round(item.rect.left)));
        const by = Math.max(0, Math.min(vh - 18, Math.round(item.rect.top - 8)));
        tag.textContent = String(uid);
        tag.style.cssText = [
          `position:fixed;left:${bx}px;top:${by}px;`,
          `background:${item.editable ? '#0ea5e9' : '#d4af37'};color:#000;`,
          'font:900 10px/1.1 monospace;padding:2px 4px;border-radius:4px;',
          'border:1px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.8);',
        ].join('');
        overlay.appendChild(tag);
      }
    }

    return {
      elements: items,
      viewport: { width: vw, height: vh },
    };
  }

  function clearSomOverlay() {
    const old = document.getElementById('orbiex-som-overlay');
    if (old) old.remove();
  }

  /* ───── Bônus Espacial para Referências de Posição ("canto inferior direito", "topo", etc.) ───── */
  function scoreSpatialHint(spatialText, xPct, yPct) {
    if (!spatialText) return 0;
    const s = norm(spatialText);
    let bonus = 0;

    if (s.includes('inferior') || s.includes('baixo') || s.includes('embaixo') || s.includes('rodape') || s.includes('bottom')) {
      bonus += yPct >= 62 ? 35 : yPct >= 48 ? 10 : -25;
    }
    if (s.includes('superior') || s.includes('topo') || s.includes('cima') || s.includes('cabecalho') || s.includes('top')) {
      bonus += yPct <= 32 ? 35 : yPct <= 48 ? 10 : -25;
    }
    if (s.includes('direit') || s.includes('right')) {
      bonus += xPct >= 62 ? 35 : xPct >= 48 ? 10 : -25;
    }
    if (s.includes('esquerd') || s.includes('left')) {
      bonus += xPct <= 38 ? 35 : xPct <= 52 ? 10 : -25;
    }
    if ((s.includes('centro') || s.includes('meio')) && !s.includes('direit') && !s.includes('esquerd')) {
      bonus += xPct >= 30 && xPct <= 70 ? 22 : -10;
    }
    return bonus;
  }

  /* ───── HUD & Destaque Dourado ───── */
  let hudBadgeTextEl = null;

  function ensureHud() {
    if (document.getElementById('orbiex-copilot-hud-host')) return;
    if (!document.body) return;

    const host = document.createElement('div');
    host.id = 'orbiex-copilot-hud-host';
    host.style.cssText = 'position:fixed;left:18px;bottom:18px;z-index:2147483646;pointer-events:auto;';
    const shadow = host.attachShadow({ mode: 'open' });

    const wrap = document.createElement('button');
    wrap.type = 'button';
    wrap.title = 'Voltar para o Agente de Voz Orbiex';
    wrap.style.cssText = [
      'display:flex;align-items:center;gap:8px;padding:7px 13px;border-radius:999px;',
      'background:rgba(10,9,7,0.92);border:1px solid rgba(212,175,55,0.55);',
      'box-shadow:0 8px 28px rgba(0,0,0,0.65),0 0 18px rgba(212,175,55,0.22);',
      'color:#f4d77a;font:700 11px/1.2 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;',
      'cursor:pointer;backdrop-filter:blur(10px);transition:transform 0.2s ease;',
    ].join('');

    const dot = document.createElement('span');
    dot.style.cssText =
      'width:7px;height:7px;border-radius:50%;background:radial-gradient(circle,#fff3c4 0%,#d4af37 70%);box-shadow:0 0 10px #d4af37;flex-shrink:0;';

    const label = document.createElement('span');
    label.textContent = 'Orbiex Copilot v2';
    hudBadgeTextEl = label;

    wrap.appendChild(dot);
    wrap.appendChild(label);
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
      if (hudBadgeTextEl) hudBadgeTextEl.textContent = 'Orbiex Copilot v2';
    }, 3500);
  }

  function highlightElement(el, actionText) {
    try {
      const rect = el.getBoundingClientRect();
      const ring = document.createElement('div');
      ring.style.cssText = [
        `position:fixed;left:${Math.max(2, rect.left - 6)}px;top:${Math.max(2, rect.top - 6)}px;`,
        `width:${Math.max(20, rect.width + 12)}px;height:${Math.max(20, rect.height + 12)}px;border-radius:14px;`,
        'border:2.5px solid #f4d77a;box-shadow:0 0 24px rgba(212,175,55,0.85),inset 0 0 14px rgba(212,175,55,0.35);',
        'pointer-events:none;z-index:2147483647;transition:opacity 0.4s ease,transform 0.3s ease;',
      ].join('');
      document.body.appendChild(ring);
      flashHudStatus(actionText);
      setTimeout(() => {
        ring.style.opacity = '0';
        ring.style.transform = 'scale(1.06)';
        setTimeout(() => ring.remove(), 420);
      }, 1400);
    } catch {
      /* noop */
    }
  }

  function simulateRealClick(el, customX, customY) {
    if (!el) return;
    el.scrollIntoView({ behavior: 'instant', block: 'nearest', inline: 'nearest' });
    const rect = el.getBoundingClientRect();
    const cx = typeof customX === 'number' ? customX : rect.left + rect.width / 2;
    const cy = typeof customY === 'number' ? customY : rect.top + rect.height / 2;
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
    if (!el) return;
    if (typeof el.focus === 'function') el.focus({ preventScroll: true });

    const tag = (el.tagName || '').toLowerCase();
    if (tag === 'textarea' || tag === 'input') {
      const proto = tag === 'textarea' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
      if (setter) setter.call(el, text);
      else el.value = text;
      el.dispatchEvent(new InputEvent('beforeinput', { bubbles: true, cancelable: true, composed: true, data: text, inputType: 'insertText' }));
      el.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, data: text, inputType: 'insertText' }));
      el.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
      return;
    }

    // Contenteditable / Rich Chat Editors (Lexical, ProseMirror, Lit, Wiz no Google Flow)
    try {
      el.focus();
      const sel = window.getSelection();
      if (sel) {
        const range = document.createRange();
        range.selectNodeContents(el);
        sel.removeAllRanges();
        sel.addRange(range);
      }
      const ok = document.execCommand('insertText', false, text);
      if (!ok) {
        el.textContent = text;
      }
    } catch {
      el.textContent = text;
    }
    el.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, data: text, inputType: 'insertText' }));
    el.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  }

  function simulateEnterKey(el) {
    if (!el) return;
    const keyOpts = {
      key: 'Enter',
      code: 'Enter',
      keyCode: 13,
      which: 13,
      bubbles: true,
      cancelable: true,
      composed: true,
    };
    el.dispatchEvent(new KeyboardEvent('keydown', keyOpts));
    el.dispatchEvent(new KeyboardEvent('keypress', keyOpts));
    el.dispatchEvent(new KeyboardEvent('keyup', keyOpts));
  }

  function findNearestEditable(targetX, targetY) {
    const all = collectElements(document);
    let best = null;
    let bestDist = Infinity;
    for (const el of all) {
      if (!isEditableElement(el) || !isVisible(el)) continue;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dist = Math.hypot(cx - targetX, cy - targetY);
      if (dist < bestDist) {
        bestDist = dist;
        best = el;
      }
    }
    return bestDist <= Math.max(window.innerWidth, window.innerHeight) * 0.42 ? best : null;
  }

  /* ───── Execução Cirúrgica Guiada pela Visão IA (Set-of-Marks UID + Coordenadas) ───── */
  async function executeGroundedAction(payload) {
    const {
      actionType = 'click',
      uid,
      xPct,
      yPct,
      textToType = '',
      pressEnter = false,
      submitUid,
    } = payload || {};

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const px = typeof xPct === 'number' ? Math.round((xPct / 100) * vw) : Math.round(vw / 2);
    const py = typeof yPct === 'number' ? Math.round((yPct / 100) * vh) : Math.round(vh / 2);

    let targetEl = uid ? uidMap.get(Number(uid)) : null;
    if (!targetEl || !isVisible(targetEl)) {
      targetEl = deepElementFromPoint(px, py);
    }

    if (!targetEl) {
      return { ok: false, error: 'Elemento não encontrado nessa coordenada da tela.' };
    }

    if (actionType === 'click') {
      const { label } = extractRichLabel(targetEl);
      highlightElement(targetEl, `Clicou: ${label.slice(0, 26)}`);
      await new Promise((r) => setTimeout(r, 90));
      simulateRealClick(targetEl, px, py);
      return { ok: true, clickedLabel: label, message: `Clicado em "${label}" com sucesso.` };
    }

    if (actionType === 'type') {
      // Snapshot dos campos editáveis que já estavam abertos antes do clique
      const beforeEditables = new Set(
        collectElements(document).filter((el) => isEditableElement(el) && isVisible(el))
      );

      // Se o alvo for um iframe de mesmo domínio (ex: widget de chat), resolve dentro dele
      if (targetEl.tagName === 'IFRAME') {
        try {
          if (targetEl.contentDocument) {
            const ir = targetEl.getBoundingClientRect();
            const innerHit = targetEl.contentDocument.elementFromPoint(px - ir.left, py - ir.top);
            if (innerHit) targetEl = innerHit;
          }
        } catch {
          /* cross-origin iframe */
        }
      }

      // 1. Clica no alvo primeiro (se for um botão/container de chat retrátil no canto inferior direito, ele abre!)
      simulateRealClick(targetEl, px, py);
      await new Promise((r) => setTimeout(r, 260));

      const resolveNewlyOpenedOrFocused = () => {
        if (isEditableElement(targetEl) && isVisible(targetEl)) return targetEl;
        const currentEditables = collectElements(document).filter(
          (el) => isEditableElement(el) && isVisible(el)
        );
        const newlyOpened = currentEditables.find((el) => !beforeEditables.has(el));
        if (newlyOpened) return newlyOpened;
        return null;
      };

      let editableEl = resolveNewlyOpenedOrFocused();
      if (!editableEl) {
        // Aguarda mais 260ms caso o painel/gaveta do chat tenha animação de abertura
        await new Promise((r) => setTimeout(r, 260));
        editableEl = resolveNewlyOpenedOrFocused();
      }

      if (!editableEl) {
        const active = deepActiveElement();
        if (active && isEditableElement(active) && isVisible(active)) {
          editableEl = active;
        } else {
          const inner = collectElements(targetEl).find((c) => isEditableElement(c) && isVisible(c));
          if (inner) editableEl = inner;
          else editableEl = findNearestEditable(px, py);
        }
      }

      if (!editableEl) {
        return { ok: false, error: 'Cliquei no local indicado, mas nenhum campo de digitação abriu ali.' };
      }

      highlightElement(editableEl, `Digitando: "${String(textToType).slice(0, 22)}"`);
      await new Promise((r) => setTimeout(r, 100));
      setInputValueReal(editableEl, String(textToType));

      if (submitUid && uidMap.get(Number(submitUid)) && isVisible(uidMap.get(Number(submitUid)))) {
        await new Promise((r) => setTimeout(r, 260));
        const subEl = uidMap.get(Number(submitUid));
        highlightElement(subEl, 'Enviando...');
        simulateRealClick(subEl);
        return { ok: true, message: `Texto "${textToType}" digitado e enviado com sucesso.` };
      }

      if (pressEnter) {
        await new Promise((r) => setTimeout(r, 180));
        simulateEnterKey(editableEl);
        return { ok: true, message: `Texto "${textToType}" digitado e Enter pressionado.` };
      }

      return { ok: true, message: `Texto "${textToType}" digitado exatamente no campo solicitado.` };
    }

    return { ok: false, error: 'Tipo de ação desconhecido.' };
  }

  /* ───── Busca Local com Inteligência Espacial (Fallback rápido) ───── */
  function findBestClickableLocal(query, spatialHint) {
    const candidates = expandSynonyms(query);
    const all = collectElements(document);
    const vw = Math.max(1, window.innerWidth);
    const vh = Math.max(1, window.innerHeight);
    let best = null;
    let bestScore = 0;

    for (const el of all) {
      if (!isClickable(el) || !isVisible(el)) continue;
      if (el.disabled || el.getAttribute('aria-disabled') === 'true') continue;

      const rawText = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
      if (rawText.length > 140) continue;

      const labelParts = [
        rawText,
        el.getAttribute('aria-label') || '',
        el.getAttribute('title') || '',
        el.getAttribute('data-tooltip') || '',
        el.getAttribute('placeholder') || '',
      ]
        .map(norm)
        .filter(Boolean);

      if (!labelParts.length) continue;

      let localScore = 0;
      for (let cIdx = 0; cIdx < candidates.length; cIdx++) {
        const cand = candidates[cIdx];
        const priorityBonus = cIdx < 2 ? 18 : 0;
        for (const part of labelParts) {
          if (part === cand) localScore = Math.max(localScore, 100 + priorityBonus);
          else if (part.includes(cand)) localScore = Math.max(localScore, 74 + priorityBonus);
        }
      }

      if (localScore > 0) {
        const r = el.getBoundingClientRect();
        const xPct = ((r.left + r.width / 2) / vw) * 100;
        const yPct = ((r.top + r.height / 2) / vh) * 100;
        localScore += scoreSpatialHint(spatialHint || query, xPct, yPct);
      }

      if (localScore > bestScore) {
        bestScore = localScore;
        best = { el, label: rawText || el.getAttribute('aria-label') || query, score: localScore };
      }
    }

    return bestScore >= 42 ? best : null;
  }

  function findBestInputLocal(targetHint, spatialHint) {
    const all = collectElements(document);
    const vw = Math.max(1, window.innerWidth);
    const vh = Math.max(1, window.innerHeight);
    const hints = expandSynonyms(targetHint || 'prompt');

    const inputs = all.filter((el) => isEditableElement(el) && isVisible(el));
    if (!inputs.length) return null;

    let best = inputs[0];
    let bestScore = -999;

    for (const el of inputs) {
      const { label, context } = extractRichLabel(el);
      const meta = norm(`${label} ${context}`);
      const r = el.getBoundingClientRect();
      const xPct = ((r.left + r.width / 2) / vw) * 100;
      const yPct = ((r.top + r.height / 2) / vh) * 100;

      let sc = scoreSpatialHint(`${spatialHint || ''} ${targetHint || ''}`, xPct, yPct);
      for (const h of hints) {
        if (meta.includes(h)) sc += 32;
      }
      sc += Math.min(14, (r.width * r.height) / 6000);

      if (sc > bestScore) {
        bestScore = sc;
        best = el;
      }
    }
    return best;
  }

  async function executeLegacyDomAction(payload) {
    const cmd = String(payload?.command || 'click').toLowerCase();

    if (cmd === 'scan') {
      const scan = scanScreenForVision(false);
      const availableButtons = (scan.elements || [])
        .slice(0, 30)
        .map((e) => `[${e.region}] ${e.kind === 'input' ? '(Campo) ' : ''}${e.label}`);
      return {
        ok: true,
        availableButtons,
        message: availableButtons.length
          ? `Elementos visíveis na tela: ${availableButtons.join('; ')}`
          : 'Nenhum elemento interativo visível no momento.',
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
      const target = payload?.target || '';
      const spatial = payload?.spatialHint || '';

      // Se o usuário pediu um canto específico onde há um botão de chat fechado, abre primeiro
      if (spatial) {
        const before = new Set(collectElements(document).filter((el) => isEditableElement(el) && isVisible(el)));
        const existingInRegion = Array.from(before).find((el) => {
          const r = el.getBoundingClientRect();
          const xPct = ((r.left + r.width / 2) / Math.max(1, window.innerWidth)) * 100;
          const yPct = ((r.top + r.height / 2) / Math.max(1, window.innerHeight)) * 100;
          return scoreSpatialHint(spatial, xPct, yPct) >= 45;
        });
        if (!existingInRegion) {
          const triggerBtn = findBestClickableLocal(target || 'chat', spatial);
          if (triggerBtn) {
            simulateRealClick(triggerBtn.el);
            await new Promise((r) => setTimeout(r, 380));
          }
        }
      }

      const inputEl = findBestInputLocal(target, spatial);
      if (!inputEl) return { ok: false, error: 'Campo de texto não encontrado.' };
      highlightElement(inputEl, 'Digitando...');
      simulateRealClick(inputEl);
      await new Promise((r) => setTimeout(r, 120));
      setInputValueReal(inputEl, text);
      if (payload?.clickAfter) {
        await new Promise((r) => setTimeout(r, 220));
        const afterBtn = findBestClickableLocal(payload.clickAfter, spatial);
        if (afterBtn) simulateRealClick(afterBtn.el);
      } else if (payload?.pressEnter) {
        await new Promise((r) => setTimeout(r, 150));
        simulateEnterKey(inputEl);
      }
      return { ok: true, message: 'Texto digitado com sucesso.' };
    }

    const match = findBestClickableLocal(payload?.target || '', payload?.spatialHint || '');
    if (!match) return { ok: false, error: `Botão "${payload?.target}" não localizado.` };
    highlightElement(match.el, `Clicou: ${match.label.slice(0, 24)}`);
    simulateRealClick(match.el);
    return { ok: true, clickedLabel: match.label, message: `Botão "${match.label}" clicado.` };
  }

  ensureHud();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureHud);
  }

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type === 'ORBIEX_SCAN_SOM') {
      try {
        sendResponse(scanScreenForVision(Boolean(msg.payload?.showBadges)));
      } catch (err) {
        sendResponse({ elements: [], error: String(err) });
      }
      return false;
    }

    if (msg?.type === 'ORBIEX_CLEAR_SOM') {
      clearSomOverlay();
      sendResponse({ ok: true });
      return false;
    }

    if (msg?.type === 'ORBIEX_EXECUTE_GROUNDED') {
      executeGroundedAction(msg.payload)
        .then((res) => sendResponse(res))
        .catch((err) => sendResponse({ ok: false, error: err?.message || String(err) }));
      return true;
    }

    if (msg?.type === 'ORBIEX_DOM_ACTION') {
      executeLegacyDomAction(msg.payload)
        .then((res) => sendResponse(res))
        .catch((err) => sendResponse({ ok: false, error: err?.message || String(err) }));
      return true;
    }

    return false;
  });
})();

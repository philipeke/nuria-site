/* ============================================================
   NuriaOne Chat — island for /ask
   Talks ONLY to the same-origin BFF (Cloudflare Worker). The
   partner API key never touches the browser. Off by default;
   enable via NURIA_SITE_CONFIG.chat.enabled or ?chat=1.
   ============================================================ */
'use strict';

(function () {
  const cfg = (window.NURIA_SITE_CONFIG && window.NURIA_SITE_CONFIG.chat) || {};
  const params = new URLSearchParams(window.location.search || '');
  const previewParam = cfg.previewParam || 'chat';
  const forcedOn = params.get(previewParam) === '1';
  const active = cfg.enabled === true || forcedOn;

  const mount = document.querySelector('[data-nuria-chat]');
  if (!mount || !active) return; // flag off → static marketing mockup stays

  const ENDPOINT = cfg.endpoint || '/api/chat';
  const USE_MOCK = cfg.mock === true || params.get('chatmock') === '1';
  const CONSENT_KEY = 'nuria_chat_consent_v1';
  const HISTORY_KEY = 'nuria_chat_history_v1';
  const MADHHAB_KEY = 'nuria_chat_madhhab_v1';
  const MAX_STORED = 40;
  const MADHHABS = ['unspecified', 'hanafi', 'maliki', 'shafii', 'hanbali', 'jafari'];

  /* ---- i18n helper (falls back to English if a key is missing) ---- */
  function t(key, fallback) {
    if (window.NuriaI18n && typeof window.NuriaI18n.t === 'function') {
      const v = window.NuriaI18n.t(key);
      if (v) return v;
    }
    return fallback;
  }
  function lang() {
    if (window.NuriaI18n && typeof window.NuriaI18n.getLang === 'function') return window.NuriaI18n.getLang();
    return (document.documentElement.lang || 'en').slice(0, 2).toLowerCase();
  }
  function track(name, props) {
    try {
      if (window.NuriaSite && typeof window.NuriaSite.trackEvent === 'function') {
        window.NuriaSite.trackEvent(name, props || {});
      }
    } catch (e) { /* analytics must never break the chat */ }
  }

  /* ---- safe Markdown (escape first, then a tiny allowed subset) ---- */
  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function renderMarkdown(src) {
    let h = escapeHtml(src);
    h = h.replace(/`([^`]+)`/g, '<code>$1</code>');
    h = h.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
    h = h.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
    // links: only http(s); text + url already HTML-escaped above
    h = h.replace(/\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g, function (_m, txt, url) {
      return '<a href="' + url + '" target="_blank" rel="noopener noreferrer">' + txt + '</a>';
    });
    return h.split(/\n{2,}/).map(function (block) {
      const lines = block.split(/\n/);
      if (lines.length && lines.every(function (l) { return /^\s*[-*]\s+/.test(l); })) {
        return '<ul>' + lines.map(function (l) { return '<li>' + l.replace(/^\s*[-*]\s+/, '') + '</li>'; }).join('') + '</ul>';
      }
      return '<p>' + lines.join('<br>') + '</p>';
    }).join('');
  }

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  /* ---- state ---- */
  let messages = [];      // { role:'user'|'assistant'|'error', content, meta? }
  let madhhab = 'unspecified';
  let busy = false;

  try {
    const stored = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    if (Array.isArray(stored)) messages = stored.slice(-MAX_STORED);
  } catch (e) { messages = []; }
  try {
    const m = localStorage.getItem(MADHHAB_KEY);
    if (m && MADHHABS.indexOf(m) !== -1) madhhab = m;
  } catch (e) { /* ignore */ }

  function persist() {
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(messages.slice(-MAX_STORED))); } catch (e) { /* ignore */ }
  }
  function consented() {
    try { return localStorage.getItem(CONSENT_KEY) === '1'; } catch (e) { return false; }
  }

  /* ---- build the shell ---- */
  mount.innerHTML = '';
  const card = el('div', 'ask-chat ask-chat--live');

  const head = el('div', 'ask-chat__head');
  head.appendChild(el('span', 'ask-chat__avatar'));
  const id = el('div', 'ask-chat__id');
  id.appendChild(el('span', 'ask-chat__title', 'NuriaOne'));
  const statusEl = el('span', 'ask-chat__status', t('chat.status', 'In scholarly review · Source-grounded'));
  id.appendChild(statusEl);
  head.appendChild(id);
  head.appendChild(el('span', 'ask-chat__dot'));
  card.appendChild(head);

  const banner = el('div', 'nuria-chat__banner');
  banner.setAttribute('role', 'note');
  banner.textContent = t('chat.preview_banner', 'Preview. Answers are still in scholarly review.');
  card.appendChild(banner);

  const log = el('div', 'nuria-chat__log');
  log.setAttribute('role', 'log');
  log.setAttribute('aria-live', 'polite');
  log.setAttribute('aria-label', t('chat.aria_log', 'Conversation with NuriaOne'));
  card.appendChild(log);

  // composer
  const composer = el('form', 'nuria-chat__composer');
  composer.setAttribute('aria-label', t('chat.aria_composer', 'Ask NuriaOne'));

  const madhhabWrap = el('label', 'nuria-chat__madhhab');
  const madhhabLabel = el('span', 'nuria-chat__madhhab-label', t('chat.madhhab', 'Madhhab'));
  madhhabWrap.appendChild(madhhabLabel);
  const select = el('select', 'nuria-chat__select');
  select.setAttribute('aria-label', t('chat.madhhab', 'Madhhab'));
  MADHHABS.forEach(function (m) {
    const o = el('option', null, t('chat.madhhab_' + m, m === 'unspecified' ? 'Unspecified' : m.charAt(0).toUpperCase() + m.slice(1)));
    o.value = m;
    if (m === madhhab) o.selected = true;
    select.appendChild(o);
  });
  select.addEventListener('change', function () {
    madhhab = select.value;
    try { localStorage.setItem(MADHHAB_KEY, madhhab); } catch (e) { /* ignore */ }
  });
  madhhabWrap.appendChild(select);

  const inputRow = el('div', 'nuria-chat__inputrow');
  const ta = el('textarea', 'nuria-chat__input');
  ta.rows = 1;
  ta.setAttribute('placeholder', t('chat.placeholder', 'Ask NuriaOne anything about your deen…'));
  ta.setAttribute('aria-label', t('chat.placeholder', 'Ask NuriaOne anything about your deen…'));
  ta.setAttribute('maxlength', '4000');
  const send = el('button', 'nuria-chat__send');
  send.type = 'submit';
  send.setAttribute('aria-label', t('chat.send', 'Send'));
  send.innerHTML = '<span aria-hidden="true">➤</span>';
  inputRow.appendChild(ta);
  inputRow.appendChild(send);

  composer.appendChild(madhhabWrap);
  composer.appendChild(inputRow);
  card.appendChild(composer);

  const tools = el('div', 'nuria-chat__tools');
  const clearBtn = el('button', 'nuria-chat__clear', t('chat.clear', 'Clear chat'));
  clearBtn.type = 'button';
  clearBtn.addEventListener('click', function () {
    messages = [];
    persist();
    render();
  });
  tools.appendChild(clearBtn);
  card.appendChild(tools);

  mount.appendChild(card);

  /* ---- autogrow + key handling ---- */
  function autogrow() {
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 140) + 'px';
  }
  ta.addEventListener('input', autogrow);
  ta.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      composer.requestSubmit ? composer.requestSubmit() : submit();
    }
  });
  composer.addEventListener('submit', function (e) { e.preventDefault(); submit(); });

  /* ---- rendering ---- */
  function suggestions() {
    return [
      t('chat.s1', 'Is it permissible to combine prayers while travelling?'),
      t('chat.s2', 'How do I make up missed fasts from Ramadan?'),
      t('chat.s3', 'What does the Qur’an say about patience in hardship?'),
      t('chat.s4', 'How do I perform wudu correctly, step by step?'),
    ];
  }

  function badgeFor(meta) {
    if (!meta) return null;
    if (meta.referral_required) return { cls: 'is-referral', text: t('chat.badge_referral', 'Referred to a scholar') };
    if (meta.board_reviewed === true) return { cls: 'is-board', text: t('chat.badge_board', 'Board-reviewed') };
    return { cls: 'is-preview', text: t('chat.badge_preview', 'Preview') };
  }

  function renderSources(meta) {
    if (!meta || !Array.isArray(meta.sources) || !meta.sources.length) return null;
    const wrap = el('div', 'nuria-chat__sources');
    wrap.appendChild(el('div', 'nuria-chat__sources-title', t('chat.sources', 'Sources')));
    const list = el('ul', 'nuria-chat__sources-list');
    meta.sources.forEach(function (s) {
      const li = el('li', 'nuria-chat__source');
      const icon = s.type === 'quran' ? '📖' : s.type === 'hadith' ? '📜' : s.type === 'tafsir' ? '🕮' : '⚖';
      const ref = [icon, (s.type || ''), s.reference].filter(Boolean).join(' ');
      li.appendChild(el('span', 'nuria-chat__source-ref', ref.trim()));
      if (s.text) li.appendChild(el('span', 'nuria-chat__source-text', s.text));
      if (s.scholar) li.appendChild(el('span', 'nuria-chat__source-scholar', s.scholar));
      list.appendChild(li);
    });
    wrap.appendChild(list);
    return wrap;
  }

  function userBubble(msg) {
    const b = el('div', 'nuria-chat__msg nuria-chat__msg--user');
    const bub = el('div', 'nuria-chat__bubble');
    bub.setAttribute('dir', 'auto');
    bub.textContent = msg.content;
    b.appendChild(bub);
    return b;
  }

  function botBubble(msg) {
    const b = el('div', 'nuria-chat__msg nuria-chat__msg--bot');
    const bub = el('div', 'nuria-chat__bubble');
    const body = el('div', 'nuria-chat__answer');
    body.setAttribute('dir', 'auto');
    body.innerHTML = renderMarkdown(msg.content);
    bub.appendChild(body);

    const sources = renderSources(msg.meta);
    if (sources) bub.appendChild(sources);

    const foot = el('div', 'nuria-chat__msgfoot');
    const badge = badgeFor(msg.meta);
    if (badge) {
      const bd = el('span', 'nuria-chat__badge ' + badge.cls, badge.text);
      foot.appendChild(bd);
    }
    const copy = el('button', 'nuria-chat__copy', t('chat.copy', 'Copy'));
    copy.type = 'button';
    copy.addEventListener('click', function () {
      const doCopy = (window.NuriaSite && window.NuriaSite.copyText) || function (x) { return navigator.clipboard.writeText(x); };
      Promise.resolve(doCopy(msg.content)).then(function () {
        copy.textContent = t('chat.copied', 'Copied');
        setTimeout(function () { copy.textContent = t('chat.copy', 'Copy'); }, 1500);
      }).catch(function () { /* ignore */ });
    });
    foot.appendChild(copy);
    bub.appendChild(foot);

    b.appendChild(bub);
    return b;
  }

  function errorBubble(msg) {
    const b = el('div', 'nuria-chat__msg nuria-chat__msg--bot');
    const bub = el('div', 'nuria-chat__bubble nuria-chat__bubble--error');
    bub.appendChild(el('div', 'nuria-chat__answer', msg.content));
    if (msg.retry) {
      const retry = el('button', 'nuria-chat__retry', t('chat.retry', 'Try again'));
      retry.type = 'button';
      retry.addEventListener('click', function () { submit(msg.retry); });
      bub.appendChild(retry);
    }
    b.appendChild(bub);
    return b;
  }

  function typingBubble() {
    const b = el('div', 'nuria-chat__msg nuria-chat__msg--bot');
    b.dataset.typing = '1';
    const bub = el('div', 'nuria-chat__bubble nuria-chat__bubble--typing');
    bub.setAttribute('aria-label', t('chat.reflecting', 'Nuria is reflecting…'));
    bub.innerHTML = '<span class="nuria-chat__dots"><i></i><i></i><i></i></span>' +
      '<span class="nuria-chat__reflecting"></span>';
    bub.querySelector('.nuria-chat__reflecting').textContent = t('chat.reflecting', 'Nuria is reflecting…');
    b.appendChild(bub);
    return b;
  }

  function consentCard() {
    const wrap = el('div', 'nuria-chat__consent');
    wrap.appendChild(el('div', 'nuria-chat__consent-icon', '🤲'));
    wrap.appendChild(el('h3', 'nuria-chat__consent-title', t('chat.consent_title', 'Before you begin')));
    const p = el('p', 'nuria-chat__consent-text');
    p.textContent = t('chat.consent_text',
      'Questions about your faith can reveal your religious beliefs — a special category of personal data. NuriaOne uses your messages only to answer them and does not tie them to your identity. Please avoid sharing sensitive personal details.');
    wrap.appendChild(p);
    const row = el('div', 'nuria-chat__consent-row');
    const privacy = el('a', 'nuria-chat__consent-link', t('chat.consent_privacy', 'Privacy Policy'));
    privacy.href = '/privacy';
    privacy.target = '_blank';
    privacy.rel = 'noopener';
    row.appendChild(privacy);
    const ok = el('button', 'btn btn--gold nuria-chat__consent-btn', t('chat.consent_btn', 'I understand — start'));
    ok.type = 'button';
    ok.addEventListener('click', function () {
      try { localStorage.setItem(CONSENT_KEY, '1'); } catch (e) { /* ignore */ }
      track('chat_consent_accepted');
      render();
      ta.focus();
    });
    row.appendChild(ok);
    wrap.appendChild(row);
    return wrap;
  }

  function emptyState() {
    const wrap = el('div', 'nuria-chat__empty');
    wrap.appendChild(el('p', 'nuria-chat__empty-title', t('chat.empty_title', 'Ask NuriaOne anything about your deen.')));
    const chips = el('div', 'nuria-chat__suggestions');
    suggestions().forEach(function (s) {
      const c = el('button', 'nuria-chat__suggestion', s);
      c.type = 'button';
      c.addEventListener('click', function () { submit(s); });
      chips.appendChild(c);
    });
    wrap.appendChild(chips);
    return wrap;
  }

  function setBusy(state) {
    busy = state;
    ta.disabled = state;
    send.disabled = state;
    select.disabled = state;
  }

  function render() {
    log.innerHTML = '';
    if (!consented()) {
      composer.style.display = 'none';
      tools.style.display = 'none';
      log.appendChild(consentCard());
      return;
    }
    composer.style.display = '';
    tools.style.display = messages.length ? '' : 'none';

    if (!messages.length) {
      log.appendChild(emptyState());
      return;
    }
    messages.forEach(function (m) {
      if (m.role === 'user') log.appendChild(userBubble(m));
      else if (m.role === 'error') log.appendChild(errorBubble(m));
      else log.appendChild(botBubble(m));
    });
    // refresh preview banner from the latest answer
    const last = messages.slice().reverse().find(function (m) { return m.role === 'assistant' && m.meta; });
    if (last && last.meta && last.meta.board_reviewed === true) {
      banner.style.display = 'none';
    } else {
      banner.style.display = '';
    }
    log.scrollTop = log.scrollHeight;
  }

  /* ---- networking ---- */
  function buildHistory() {
    // Only completed user→assistant turns (skip errors and unanswered
    // questions), matching the Nuria Intelligence reference behaviour — so a
    // failed send never leaks an orphan user turn into the next request.
    const out = [];
    let pendingUser = null;
    for (let i = 0; i < messages.length; i++) {
      const m = messages[i];
      if (m.role === 'user') {
        pendingUser = m.content;
      } else if (m.role === 'assistant') {
        if (pendingUser != null) {
          out.push({ role: 'user', content: pendingUser });
          out.push({ role: 'assistant', content: m.content });
        }
        pendingUser = null;
      } else {
        pendingUser = null; // an error breaks the pair
      }
    }
    return out.slice(-10);
  }

  function mockReply(question) {
    return Promise.resolve({
      answer: '**Preview (local mock).** You asked: “' + question + '”.\n\n' +
        'This placeholder uses the live response format so you can see the full chat experience before the Nuria Intelligence API is connected.',
      sources: [{ type: 'quran', level: 1, reference: '2:153', text: 'Seek help through patience and prayer.' }],
      confidence: 'medium', sensitivity: 'routine', referral_required: false, board_reviewed: false,
      madhhab_declared: madhhab, hierarchy_version: 'mock', audit_id: 'mock_client',
    });
  }

  function friendlyError(status, payload) {
    const msg = payload && payload.message;
    if (status === 429) return t('chat.err_429', 'You’re sending messages quickly — please wait a moment.');
    if (status === 401 || status === 403) return t('chat.err_auth', 'The chat isn’t available right now.');
    if (status === 503) return t('chat.err_503', 'NuriaOne isn’t switched on yet. Please check back soon.');
    if (status === 400) return t('chat.err_400', 'Please rephrase your question and try again.');
    return msg || t('chat.err_generic', 'Something went wrong. Please try again.');
  }

  function submit(forced) {
    if (busy) return;
    const question = (forced != null ? forced : ta.value).trim();
    if (!question) return;
    if (!consented()) { render(); return; }

    messages.push({ role: 'user', content: question });
    ta.value = '';
    autogrow();
    setBusy(true);
    render();
    track('chat_message_sent', { count: messages.filter(function (m) { return m.role === 'user'; }).length });

    // typing indicator
    const typing = typingBubble();
    log.appendChild(typing);
    log.scrollTop = log.scrollHeight;

    // The current (just-pushed) question has no assistant reply yet, so
    // buildHistory() already excludes it — we send only completed prior turns.
    const history = buildHistory();

    const controller = new AbortController();
    const timer = setTimeout(function () { controller.abort(); }, 60000);

    const work = USE_MOCK
      ? new Promise(function (res) { setTimeout(function () { res(null); }, 600); })
          .then(function () { return mockReply(question); })
          .then(function (data) { return { status: 200, data: data }; })
      : fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            question: question.slice(0, 4000),
            madhhab: madhhab !== 'unspecified' ? madhhab : undefined,
            language: lang(),
            history: history.length ? history : undefined,
          }),
          signal: controller.signal,
        }).then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (data) {
            return { status: res.status, data: data };
          });
        });

    work.then(function (out) {
      clearTimeout(timer);
      if (typing.parentNode) typing.parentNode.removeChild(typing);
      const data = out.data || {};
      if (out.status >= 200 && out.status < 300 && typeof data.answer === 'string') {
        messages.push({
          role: 'assistant',
          content: data.answer,
          meta: {
            sources: data.sources,
            confidence: data.confidence,
            sensitivity: data.sensitivity,
            referral_required: !!data.referral_required,
            board_reviewed: data.board_reviewed === true,
            madhhab_declared: data.madhhab_declared,
          },
        });
      } else {
        track('chat_error', { status: out.status || 0 });
        messages.push({ role: 'error', content: friendlyError(out.status, data), retry: question });
      }
      setBusy(false);
      persist();
      render();
    }).catch(function (err) {
      clearTimeout(timer);
      if (typing.parentNode) typing.parentNode.removeChild(typing);
      const aborted = err && (err.name === 'AbortError');
      track('chat_error', { status: aborted ? 'timeout' : 'network' });
      messages.push({
        role: 'error',
        content: aborted
          ? t('chat.err_timeout', 'That took too long. Please try again.')
          : t('chat.err_network', 'Network problem — please check your connection and try again.'),
        retry: question,
      });
      setBusy(false);
      persist();
      render();
    });
  }

  /* ---- re-localise static chrome (runs at init and whenever the active
         language's translations are applied / the user switches language) ---- */
  function localizeChrome() {
    statusEl.textContent = t('chat.status', 'In scholarly review · Source-grounded');
    banner.textContent = t('chat.preview_banner', 'Preview. Answers are still in scholarly review.');
    log.setAttribute('aria-label', t('chat.aria_log', 'Conversation with NuriaOne'));
    composer.setAttribute('aria-label', t('chat.aria_composer', 'Ask NuriaOne'));
    madhhabLabel.textContent = t('chat.madhhab', 'Madhhab');
    select.setAttribute('aria-label', t('chat.madhhab', 'Madhhab'));
    Array.prototype.forEach.call(select.options, function (o) {
      o.textContent = t('chat.madhhab_' + o.value, o.value === 'unspecified' ? 'Unspecified' : o.value.charAt(0).toUpperCase() + o.value.slice(1));
    });
    const ph = t('chat.placeholder', 'Ask NuriaOne anything about your deen…');
    ta.setAttribute('placeholder', ph);
    ta.setAttribute('aria-label', ph);
    send.setAttribute('aria-label', t('chat.send', 'Send'));
    clearBtn.textContent = t('chat.clear', 'Clear chat');
  }
  window.addEventListener('nuria:i18n', function () { localizeChrome(); render(); });

  if (forcedOn) { try { document.body.classList.add('nuria-chat-preview'); } catch (e) { /* ignore */ } }
  track('chat_opened', { mode: USE_MOCK ? 'mock' : 'live' });
  localizeChrome();
  render();
}());

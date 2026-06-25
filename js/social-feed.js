'use strict';

/*
 * Front-page social feed (TikTok + LinkedIn).
 *
 * TikTok:   curated video cards. A plain left-click plays the clip *in place*
 *           inside a lightbox (TikTok's official player iframe) — no leaving
 *           the site. Modifier / middle clicks still open TikTok in a new tab.
 *
 * LinkedIn: the newest post is shown expanded inline via LinkedIn's official
 *           embed (full text + media). Older posts are compact headlines that
 *           open the same lightbox with their embedded post on click.
 *
 * Data comes from the getSocialFeedHttp Cloud Function. Each item carries
 * { id, url, title, thumbnailUrl, embedHtml, authorName, publishedAt }.
 * Graceful fallback to a "follow us" prompt on empty / error.
 */
(function () {
  const cfg = window.NURIA_SITE_CONFIG || {};
  const endpoint = cfg.socialFeedUrl;
  const social = cfg.social || {};

  const root = document.getElementById('socialFeed');
  if (!root || !endpoint) return;

  const columns = {
    tiktok: {
      el: document.getElementById('feedTiktok'),
      profile: social.tiktok || 'https://www.tiktok.com/@nuria_app',
    },
    linkedin: {
      el: document.getElementById('feedLinkedin'),
      profile: social.linkedin || 'https://www.linkedin.com/company/nuria-app/',
    },
  };

  const PLAY_SVG =
    '<span class="social-card__play" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span>';
  const CHEVRON_SVG =
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function t(key, fallback) {
    try {
      if (window.NuriaI18n && typeof window.NuriaI18n.t === 'function') {
        const v = window.NuriaI18n.t(key);
        if (v) return v;
      }
    } catch (_e) {}
    return fallback;
  }

  function formatDate(iso) {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return '';
      const lang = (document.documentElement.lang || 'en').slice(0, 2);
      return d.toLocaleDateString(lang, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (_e) {
      return '';
    }
  }

  // ── Embed id / urn extraction ──────────────────────────────────────────
  function tiktokVideoId(item) {
    const m = String(item.url || '').match(/\/video\/(\d+)/);
    if (m) return m[1];
    const e = String(item.embedHtml || '').match(/data-video-id=["'](\d+)["']/);
    return e ? e[1] : '';
  }

  function linkedinUrn(item) {
    // e.g. https://www.linkedin.com/feed/update/urn:li:activity:7475456760628191232/
    const m = String(item.url || '').match(/urn:li:[a-zA-Z]+:[0-9]+/);
    return m ? m[0] : '';
  }

  function tiktokEmbedSrc(id) {
    // Official TikTok player. Browsers gate autoplay-with-sound, so the player
    // starts muted and the visitor taps to unmute — captions stay on, related
    // videos off so the clip keeps the focus.
    return (
      'https://www.tiktok.com/player/v1/' +
      encodeURIComponent(id) +
      '?autoplay=1&loop=1&rel=0&music_info=0&description=0&native_context_menu=1&closed_caption=1'
    );
  }

  function linkedinEmbedSrc(urn) {
    return 'https://www.linkedin.com/embed/feed/update/' + urn;
  }

  // ── Shared lightbox ────────────────────────────────────────────────────
  let modal = null;
  let lastFocus = null;
  let hideTimer = 0;

  function ensureModal() {
    if (modal) return modal;
    modal = document.createElement('div');
    modal.className = 'social-modal';
    modal.setAttribute('hidden', '');
    modal.innerHTML =
      '<div class="social-modal__overlay" data-close></div>' +
      '<div class="social-modal__dialog" role="dialog" aria-modal="true" tabindex="-1">' +
      '<button type="button" class="social-modal__close" data-close>' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' +
      '</button>' +
      '<div class="social-modal__stage"></div>' +
      '<div class="social-modal__caption"></div>' +
      '</div>';
    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
      if (e.target.closest('[data-close]')) closeModal();
    });
    return modal;
  }

  function onKeydown(e) {
    if (e.key === 'Escape') {
      closeModal();
      return;
    }
    if (e.key === 'Tab' && modal) {
      // Minimal focus trap: only the close button and the outbound link are
      // focusable inside the dialog, so wrap between them.
      const focusables = modal.querySelectorAll(
        '.social-modal__dialog button, .social-modal__dialog a[href]'
      );
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  function openModal(platform, item) {
    const isTiktok = platform === 'tiktok';
    const id = isTiktok ? tiktokVideoId(item) : linkedinUrn(item);
    if (!id) {
      window.open(item.url, '_blank', 'noopener');
      return;
    }

    const m = ensureModal();
    window.clearTimeout(hideTimer);
    const dialog = m.querySelector('.social-modal__dialog');
    const stage = m.querySelector('.social-modal__stage');
    const caption = m.querySelector('.social-modal__caption');
    const closeBtn = m.querySelector('.social-modal__close');

    stage.className = 'social-modal__stage social-modal__stage--' + platform;
    dialog.classList.remove('social-modal__dialog--tiktok', 'social-modal__dialog--linkedin');
    dialog.classList.add('social-modal__dialog--' + platform);

    const fallbackLabel = isTiktok
      ? t('feed.tiktok_video', 'TikTok video')
      : t('feed.linkedin_post', 'LinkedIn post');

    const iframe = document.createElement('iframe');
    iframe.src = isTiktok ? tiktokEmbedSrc(id) : linkedinEmbedSrc(id);
    iframe.title = item.title || fallbackLabel;
    iframe.loading = 'eager';
    iframe.setAttribute(
      'allow',
      'autoplay; fullscreen; encrypted-media; picture-in-picture; clipboard-write'
    );
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('frameborder', '0');
    stage.innerHTML = '';
    stage.appendChild(iframe);

    // Caption: title + date + outbound link.
    caption.innerHTML = '';
    if (item.title) {
      const h = document.createElement('p');
      h.className = 'social-modal__title';
      h.textContent = item.title;
      caption.appendChild(h);
    }
    const metaRow = document.createElement('div');
    metaRow.className = 'social-modal__meta';
    const date = formatDate(item.publishedAt);
    if (date) {
      const d = document.createElement('span');
      d.textContent = date;
      metaRow.appendChild(d);
    }
    const ext = document.createElement('a');
    ext.href = item.url;
    ext.target = '_blank';
    ext.rel = 'noopener noreferrer';
    ext.className = 'social-modal__ext';
    ext.textContent = isTiktok
      ? t('feed.watch_on_tiktok', 'Watch on TikTok ↗')
      : t('feed.view_on_linkedin', 'View on LinkedIn ↗');
    metaRow.appendChild(ext);
    caption.appendChild(metaRow);

    dialog.setAttribute('aria-label', item.title || fallbackLabel);
    closeBtn.setAttribute('aria-label', t('feed.close', 'Close'));

    lastFocus = document.activeElement;
    m.removeAttribute('hidden');
    // Force reflow so the open transition runs from the hidden state.
    void m.offsetWidth;
    m.classList.add('is-open');
    document.documentElement.classList.add('social-modal-open');
    document.addEventListener('keydown', onKeydown);
    closeBtn.focus();
  }

  function closeModal() {
    if (!modal || modal.hasAttribute('hidden')) return;
    const stage = modal.querySelector('.social-modal__stage');
    if (stage) stage.innerHTML = ''; // stop playback / audio immediately
    modal.classList.remove('is-open');
    document.documentElement.classList.remove('social-modal-open');
    document.removeEventListener('keydown', onKeydown);
    window.clearTimeout(hideTimer);
    hideTimer = window.setTimeout(() => modal.setAttribute('hidden', ''), 260);
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
    lastFocus = null;
  }

  // A plain left-click opens the lightbox; modifier / middle clicks fall
  // through to the real anchor so the post still opens natively.
  function bindOpen(anchor, platform, item) {
    anchor.addEventListener('click', (e) => {
      if (e.defaultPrevented) return;
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const id = platform === 'tiktok' ? tiktokVideoId(item) : linkedinUrn(item);
      if (!id) return; // no embeddable id — let it navigate out
      e.preventDefault();
      openModal(platform, item);
    });
  }

  // ── Card builders ──────────────────────────────────────────────────────
  function buildVideoCard(item) {
    const a = document.createElement('a');
    a.className = 'social-card social-card--video';
    a.href = item.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.setAttribute('role', 'listitem');

    if (item.thumbnailUrl) {
      const thumb = document.createElement('div');
      thumb.className = 'social-card__thumb';
      const img = document.createElement('img');
      img.src = item.thumbnailUrl;
      img.alt = '';
      img.loading = 'lazy';
      thumb.appendChild(img);
      thumb.insertAdjacentHTML('beforeend', PLAY_SVG);
      a.appendChild(thumb);
    }

    const body = document.createElement('div');
    body.className = 'social-card__body';
    const title = document.createElement('p');
    title.className = 'social-card__title';
    title.textContent = item.title || t('feed.watch', 'Watch on TikTok');
    body.appendChild(title);
    const meta = document.createElement('span');
    meta.className = 'social-card__meta';
    const bits = [];
    if (item.authorName) bits.push(item.authorName);
    const date = formatDate(item.publishedAt);
    if (date) bits.push(date);
    meta.textContent = bits.join(' · ');
    if (meta.textContent) body.appendChild(meta);
    a.appendChild(body);

    // Tell assistive tech the card plays the clip in place (a plain click does
    // not leave the site), not just "opens a link".
    const watch = t('feed.watch', 'Watch on TikTok');
    a.setAttribute('aria-label', item.title ? item.title + ' — ' + watch : watch);

    bindOpen(a, 'tiktok', item);
    return a;
  }

  function buildPostCard(item) {
    const a = document.createElement('a');
    a.className = 'social-card social-card--post';
    a.href = item.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.setAttribute('role', 'listitem');

    const body = document.createElement('div');
    body.className = 'social-card__body';
    const title = document.createElement('p');
    title.className = 'social-card__title';
    title.textContent = item.title || t('feed.read', 'Read on LinkedIn');
    body.appendChild(title);
    const meta = document.createElement('span');
    meta.className = 'social-card__meta';
    const date = formatDate(item.publishedAt);
    if (date) {
      meta.textContent = date;
      body.appendChild(meta);
    }
    a.appendChild(body);

    const chev = document.createElement('span');
    chev.className = 'social-card__expand';
    chev.innerHTML = CHEVRON_SVG;
    a.appendChild(chev);

    const read = t('feed.read', 'Read on LinkedIn');
    a.setAttribute('aria-label', item.title ? item.title + ' — ' + read : read);

    bindOpen(a, 'linkedin', item);
    return a;
  }

  // Newest LinkedIn post, expanded inline via the official embed.
  function buildFeatured(item) {
    const urn = linkedinUrn(item);
    if (!urn) return null;

    const wrap = document.createElement('div');
    wrap.className = 'social-feed__featured';
    wrap.setAttribute('role', 'listitem');

    const head = document.createElement('div');
    head.className = 'social-feed__featured-head';
    const badge = document.createElement('span');
    badge.className = 'social-feed__featured-badge';
    badge.textContent = t('feed.latest', 'Latest');
    head.appendChild(badge);
    const date = formatDate(item.publishedAt);
    if (date) {
      const d = document.createElement('span');
      d.className = 'social-feed__featured-date';
      d.textContent = date;
      head.appendChild(d);
    }
    wrap.appendChild(head);

    const frame = document.createElement('div');
    frame.className = 'social-embed social-embed--linkedin';
    const iframe = document.createElement('iframe');
    iframe.src = linkedinEmbedSrc(urn);
    iframe.title = item.title || t('feed.linkedin_post', 'LinkedIn post');
    iframe.loading = 'lazy';
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('frameborder', '0');
    frame.appendChild(iframe);
    wrap.appendChild(frame);
    return wrap;
  }

  // ── Empty / render ─────────────────────────────────────────────────────
  function renderEmpty(col, platform) {
    if (!col || !col.el) return;
    const label =
      platform === 'tiktok'
        ? t('feed.follow_tiktok', 'Follow us on TikTok')
        : t('feed.follow_linkedin', 'Follow us on LinkedIn');
    col.el.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'social-feed__empty';
    wrap.setAttribute('role', 'listitem'); // the column is role="list"
    const p = document.createElement('p');
    p.textContent = t('feed.empty', 'New posts are on the way.');
    const link = document.createElement('a');
    link.href = col.profile;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = label;
    wrap.appendChild(p);
    wrap.appendChild(document.createElement('br'));
    wrap.appendChild(link);
    col.el.appendChild(wrap);
  }

  function renderTiktok(items) {
    const col = columns.tiktok;
    if (!col || !col.el) return;
    if (!items || !items.length) {
      renderEmpty(col, 'tiktok');
      return;
    }
    col.el.innerHTML = '';
    const frag = document.createDocumentFragment();
    items.forEach((item) => {
      if (item && item.url) frag.appendChild(buildVideoCard(item));
    });
    col.el.appendChild(frag);
  }

  function renderLinkedin(items) {
    const col = columns.linkedin;
    if (!col || !col.el) return;
    if (!items || !items.length) {
      renderEmpty(col, 'linkedin');
      return;
    }
    col.el.innerHTML = '';
    const frag = document.createDocumentFragment();
    let featuredDone = false;
    items.forEach((item) => {
      if (!item || !item.url) return;
      if (!featuredDone) {
        const featured = buildFeatured(item);
        if (featured) {
          frag.appendChild(featured);
          featuredDone = true;
          return;
        }
      }
      frag.appendChild(buildPostCard(item));
    });
    col.el.appendChild(frag);
  }

  function load() {
    // Abort a hung request so the skeletons fall back to the follow prompt
    // instead of spinning forever.
    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = ctrl ? window.setTimeout(() => ctrl.abort(), 12000) : 0;
    fetch(endpoint, { method: 'GET', mode: 'cors', signal: ctrl ? ctrl.signal : undefined })
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data) => {
        renderTiktok((data && data.tiktok) || []);
        renderLinkedin((data && data.linkedin) || []);
      })
      .catch(() => {
        renderEmpty(columns.tiktok, 'tiktok');
        renderEmpty(columns.linkedin, 'linkedin');
      })
      .finally(() => {
        if (timer) window.clearTimeout(timer);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
})();

'use strict';

/*
 * Front-page social feed (TikTok + LinkedIn).
 * Fetches the curated, server-enriched feed from the getSocialFeedHttp
 * Cloud Function and renders scrollable post cards into each column.
 * Falls back gracefully to a "follow" prompt on empty/error.
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
    '<span class="social-card__play"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg></span>';

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

  function buildCard(item, platform) {
    const a = document.createElement('a');
    a.className = 'social-card';
    a.href = item.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.setAttribute('role', 'listitem');

    // Thumbnail (TikTok has one; LinkedIn may not).
    if (item.thumbnailUrl) {
      const thumb = document.createElement('div');
      thumb.className = 'social-card__thumb';
      const img = document.createElement('img');
      img.src = item.thumbnailUrl;
      img.alt = '';
      img.loading = 'lazy';
      thumb.appendChild(img);
      if (platform === 'tiktok') {
        thumb.insertAdjacentHTML('beforeend', PLAY_SVG);
      }
      a.appendChild(thumb);
    }

    const body = document.createElement('div');
    body.className = 'social-card__body';

    const title = document.createElement('p');
    title.className = 'social-card__title';
    title.textContent =
      item.title || (platform === 'tiktok' ? 'Watch on TikTok' : 'Read on LinkedIn');
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
    return a;
  }

  function renderEmpty(col, platform) {
    if (!col.el) return;
    const label =
      platform === 'tiktok'
        ? t('feed.follow_tiktok', 'Follow us on TikTok')
        : t('feed.follow_linkedin', 'Follow us on LinkedIn');
    col.el.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'social-feed__empty';
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

  function renderColumn(platform, items) {
    const col = columns[platform];
    if (!col || !col.el) return;
    if (!items || !items.length) {
      renderEmpty(col, platform);
      return;
    }
    col.el.innerHTML = '';
    const frag = document.createDocumentFragment();
    items.forEach((item) => {
      if (item && item.url) frag.appendChild(buildCard(item, platform));
    });
    col.el.appendChild(frag);
  }

  function load() {
    fetch(endpoint, { method: 'GET', mode: 'cors' })
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data) => {
        renderColumn('tiktok', (data && data.tiktok) || []);
        renderColumn('linkedin', (data && data.linkedin) || []);
      })
      .catch(() => {
        renderEmpty(columns.tiktok, 'tiktok');
        renderEmpty(columns.linkedin, 'linkedin');
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
})();

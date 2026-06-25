'use strict';

/*
 * Blog page — multilingual. Renders Nuria Journal posts served by
 * getBlogFeedHttp (list) + getBlogPostHttp (single article). Each post carries
 * a `translations` map keyed by site locale (en/ar/ur/id/fr/tr); we show the
 * visitor's current language and fall back to English. RTL is handled globally
 * by i18n (it sets <html dir>). The view re-renders in place when the language
 * switches.
 */
(function () {
  const cfg = window.NURIA_SITE_CONFIG || {};
  const listUrl = cfg.blogFeedUrl;
  const postUrl = cfg.blogPostUrl;
  const grid = document.getElementById('blogGrid');
  const article = document.getElementById('blogPost');
  if (!grid) return;

  const params = new URLSearchParams(window.location.search);
  const wantSlug = params.get('post');

  let state = { mode: 'list', posts: [], post: null };

  function getLang() {
    try {
      if (window.NuriaI18n && typeof window.NuriaI18n.getLang === 'function') {
        return window.NuriaI18n.getLang();
      }
    } catch (_e) {}
    return document.documentElement.lang || 'en';
  }

  function pick(translations) {
    if (!translations) return {};
    const lang = getLang();
    return translations[lang] || translations.en || Object.values(translations)[0] || {};
  }

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
      return d.toLocaleDateString(getLang(), { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (_e) {
      return '';
    }
  }

  function metaParts(post) {
    const bits = [];
    const date = formatDate(post.publishedAt);
    if (date) bits.push(date);
    if (post.readMinutes) bits.push(post.readMinutes + ' ' + t('blog.min_read', 'min read'));
    return bits;
  }

  function showState(msgKey, fallback) {
    grid.hidden = false;
    if (article) article.hidden = true;
    grid.innerHTML = '';
    const div = document.createElement('div');
    div.className = 'blog-state';
    div.style.gridColumn = '1 / -1';
    div.textContent = t(msgKey, fallback);
    grid.appendChild(div);
  }

  function buildCard(post) {
    const tr = pick(post.translations);
    const a = document.createElement('a');
    a.className = 'blog-card';
    a.href = '?post=' + encodeURIComponent(post.slug);

    if (post.coverImage) {
      const cover = document.createElement('div');
      cover.className = 'blog-card__cover';
      const img = document.createElement('img');
      img.src = post.coverImage;
      img.alt = '';
      img.loading = 'lazy';
      cover.appendChild(img);
      a.appendChild(cover);
    }

    const body = document.createElement('div');
    body.className = 'blog-card__body';

    const title = document.createElement('h3');
    title.className = 'blog-card__title';
    title.textContent = tr.title || '';
    body.appendChild(title);

    if (tr.excerpt) {
      const brief = document.createElement('p');
      brief.className = 'blog-card__brief';
      brief.textContent = tr.excerpt;
      body.appendChild(brief);
    }

    const meta = document.createElement('div');
    meta.className = 'blog-card__meta';
    metaParts(post).forEach((b) => {
      const s = document.createElement('span');
      s.textContent = b;
      meta.appendChild(s);
    });
    if (meta.childNodes.length) body.appendChild(meta);

    a.appendChild(body);
    return a;
  }

  function renderList() {
    if (article) article.hidden = true;
    grid.hidden = false;
    if (!state.posts.length) {
      showState('blog.empty', 'Articles are coming soon, in shā Allah. Follow along.');
      return;
    }
    grid.innerHTML = '';
    const frag = document.createDocumentFragment();
    state.posts.forEach((p) => {
      if (p && p.slug) frag.appendChild(buildCard(p));
    });
    grid.appendChild(frag);
  }

  function renderArticle() {
    if (!article || !state.post) return;
    const post = state.post;
    const tr = pick(post.translations);
    grid.hidden = true;
    article.hidden = false;
    article.innerHTML = '';

    const back = document.createElement('a');
    back.className = 'blog-article__back';
    back.href = '/blog';
    back.textContent = '← ' + t('blog.all', 'All articles');
    article.appendChild(back);

    const h1 = document.createElement('h1');
    h1.className = 'blog-article__title';
    h1.textContent = tr.title || '';
    article.appendChild(h1);

    const meta = document.createElement('div');
    meta.className = 'blog-article__meta';
    const parts = [];
    if (post.author) parts.push(post.author);
    metaParts(post).forEach((b) => parts.push(b));
    meta.textContent = parts.join('  ·  ');
    if (meta.textContent) article.appendChild(meta);

    if (post.coverImage) {
      const cover = document.createElement('div');
      cover.className = 'blog-article__cover';
      const img = document.createElement('img');
      img.src = post.coverImage;
      img.alt = '';
      cover.appendChild(img);
      article.appendChild(cover);
    }

    const bodyEl = document.createElement('div');
    bodyEl.className = 'blog-article__body';
    bodyEl.innerHTML = tr.contentHtml || ''; // sanitised server-side on ingest
    article.appendChild(bodyEl);

    try {
      if (tr.title) document.title = tr.title + ' — Nuria Journal';
    } catch (_e) {}
  }

  function render() {
    if (state.mode === 'article') renderArticle();
    else renderList();
  }

  function loadList() {
    state.mode = 'list';
    if (!listUrl) {
      showState('blog.empty', 'Articles are coming soon, in shā Allah. Follow along.');
      return;
    }
    showState('blog.loading', 'Loading the latest articles…');
    fetch(listUrl, { method: 'GET', mode: 'cors' })
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data) => { state.posts = (data && data.posts) || []; render(); })
      .catch(() => showState('blog.empty', 'Articles are coming soon. Follow along.'));
  }

  function loadArticle(slug) {
    if (!postUrl) { loadList(); return; }
    showState('blog.loading', 'Loading the latest articles…');
    fetch(postUrl + '?slug=' + encodeURIComponent(slug), { method: 'GET', mode: 'cors' })
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data) => {
        if (data && data.ok && data.post) {
          state.mode = 'article';
          state.post = data.post;
          render();
        } else {
          loadList(); // unknown slug -> show the list
        }
      })
      .catch(() => loadList());
  }

  function start() {
    if (wantSlug) loadArticle(wantSlug);
    else loadList();
    // Re-render in place when the site language changes (i18n sets <html lang>).
    try {
      const obs = new MutationObserver(() => render());
      obs.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    } catch (_e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();

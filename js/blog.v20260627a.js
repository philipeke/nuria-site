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

  // Consolidated posts (Task 6) redirect to a pillar and are hidden from the
  // grid so duplicates don't compete for the reader or for ranking.
  function isMerged(slug) {
    try {
      return !!(window.NuriaBlogRedirects && window.NuriaBlogRedirects.resolve(slug));
    } catch (_e) { return false; }
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
    grid.style.display = '';
    if (article) { article.hidden = true; article.style.display = 'none'; }
    grid.innerHTML = '';
    const div = document.createElement('div');
    div.className = 'blog-state';
    div.style.gridColumn = '1 / -1';
    div.textContent = t(msgKey, fallback);
    grid.appendChild(div);
  }

  function showArticleError() {
    grid.hidden = false;
    grid.style.display = '';
    if (article) { article.hidden = true; article.style.display = 'none'; }
    grid.innerHTML = '';
    const div = document.createElement('div');
    div.className = 'blog-state';
    div.style.gridColumn = '1 / -1';
    const p = document.createElement('p');
    p.textContent = t('blog.article_error', 'This article couldn’t be loaded. Please try again.');
    div.appendChild(p);
    const a = document.createElement('a');
    a.href = '/blog';
    a.textContent = '← ' + t('blog.all', 'All articles');
    a.style.marginTop = '0.75rem';
    a.style.display = 'inline-block';
    div.appendChild(a);
    grid.appendChild(div);
  }

  function buildCard(post) {
    const tr = pick(post.translations);
    const a = document.createElement('a');
    a.className = 'blog-card';
    // Canonical indexable path (statically generated). Legacy ?post= links still
    // work — /blog/index.html redirects them here.
    a.href = '/blog/' + encodeURIComponent(post.slug) + '/';

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
    document.documentElement.classList.remove('blog-reading');
    if (article) { article.hidden = true; article.style.display = 'none'; }
    grid.hidden = false;
    grid.style.display = '';
    if (!state.posts.length) {
      showState('blog.empty', 'Articles are coming soon, in shā Allah. Follow along.');
      return;
    }
    grid.innerHTML = '';
    const frag = document.createDocumentFragment();
    state.posts.forEach((p) => {
      if (p && p.slug && !isMerged(p.slug)) frag.appendChild(buildCard(p));
    });
    grid.appendChild(frag);
  }

  var DIVIDER_SVG = '<svg class="nuria-divider__line" viewBox="0 0 400 8" fill="none" aria-hidden="true" style="width:100%;height:auto;display:block">' +
    '<defs><linearGradient id="ndGold2" x1="0" x2="1" y1="0" y2="0">' +
    '<stop offset="0" stop-color="#c9a84c" stop-opacity="0"/><stop offset="0.2" stop-color="#c9a84c"/>' +
    '<stop offset="0.5" stop-color="#f4d98c"/><stop offset="0.8" stop-color="#c9a84c"/>' +
    '<stop offset="1" stop-color="#c9a84c" stop-opacity="0"/></linearGradient></defs>' +
    '<path d="M5 4 C60 3 90 3 130 3 L270 3 C310 3 340 3 395 4 C340 5 310 5 270 5 L130 5 C90 5 60 5 5 4 Z" fill="url(#ndGold2)"/></svg>';
  function makeDivider() {
    const d = document.createElement('div');
    d.className = 'nuria-divider nuria-divider--tight';
    d.setAttribute('aria-hidden', 'true');
    d.innerHTML = DIVIDER_SVG;
    return d;
  }

  function renderArticle() {
    if (!article || !state.post) return;
    const post = state.post;
    const tr = pick(post.translations);
    document.documentElement.classList.add('blog-reading');
    grid.hidden = true;
    grid.style.display = 'none';
    article.hidden = false;
    article.style.display = '';
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

    article.appendChild(makeDivider());

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

  function cacheGet(key) { try { return JSON.parse(localStorage.getItem(key)); } catch (_e) { return null; } }
  function cacheSet(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (_e) {} }

  function loadList() {
    state.mode = 'list';
    // Stale-while-revalidate: paint cached articles instantly, refresh behind.
    const cached = cacheGet('nuria_blog_list');
    if (cached && Array.isArray(cached.posts) && cached.posts.length) {
      state.posts = cached.posts;
      render();
    } else {
      showState('blog.loading', 'Loading the latest articles…');
    }
    if (!listUrl) {
      if (!state.posts.length) showState('blog.empty', 'Articles are coming soon, in shā Allah. Follow along.');
      return;
    }
    fetch(listUrl, { method: 'GET', mode: 'cors' })
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data) => {
        const posts = (data && data.posts) || [];
        cacheSet('nuria_blog_list', { ts: Date.now(), posts });
        if (state.mode === 'list') { state.posts = posts; render(); }
      })
      .catch(() => { if (!state.posts.length) showState('blog.empty', 'Articles are coming soon. Follow along.'); });
  }

  function loadArticle(slug) {
    if (!postUrl) { loadList(); return; }
    state.mode = 'article';
    const key = 'nuria_blog_post_' + slug;
    const cached = cacheGet(key);
    if (cached && cached.post) {
      state.post = cached.post;
      render(); // instant from cache — revalidate below
    } else {
      showState('blog.loading_article', 'Loading article…');
    }
    fetch(postUrl + '?slug=' + encodeURIComponent(slug), { method: 'GET', mode: 'cors' })
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data) => {
        if (data && data.ok && data.post) {
          cacheSet(key, { ts: Date.now(), post: data.post });
          state.mode = 'article';
          state.post = data.post;
          render();
        } else if (!state.post) {
          showArticleError(); // API responded but no post found
        }
      })
      .catch(() => { if (!state.post) showArticleError(); }); // network/server error
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

'use strict';

/*
 * Blog page — renders Nuria Journal posts served by getBlogFeedHttp
 * (our own marketing DB, written by Sintra via the ingest endpoint).
 * One fetch powers both the card list and the in-page article view (?post=slug).
 */
(function () {
  const cfg = window.NURIA_SITE_CONFIG || {};
  const endpoint = cfg.blogFeedUrl;
  const grid = document.getElementById('blogGrid');
  const article = document.getElementById('blogPost');
  if (!grid) return;

  const params = new URLSearchParams(window.location.search);
  const wantSlug = params.get('post');

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
      return d.toLocaleDateString(lang, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (_e) {
      return '';
    }
  }

  function metaText(post) {
    const bits = [];
    const date = formatDate(post.publishedAt);
    if (date) bits.push(date);
    if (post.readMinutes) bits.push(post.readMinutes + ' ' + t('blog.min_read', 'min read'));
    return bits;
  }

  function showState(msgKey, fallback) {
    grid.innerHTML = '';
    const div = document.createElement('div');
    div.className = 'blog-state';
    div.style.gridColumn = '1 / -1';
    div.textContent = t(msgKey, fallback);
    grid.appendChild(div);
  }

  function buildCard(post) {
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
    title.textContent = post.title || '';
    body.appendChild(title);

    if (post.excerpt) {
      const brief = document.createElement('p');
      brief.className = 'blog-card__brief';
      brief.textContent = post.excerpt;
      body.appendChild(brief);
    }

    const meta = document.createElement('div');
    meta.className = 'blog-card__meta';
    metaText(post).forEach((b) => {
      const s = document.createElement('span');
      s.textContent = b;
      meta.appendChild(s);
    });
    if (meta.childNodes.length) body.appendChild(meta);

    a.appendChild(body);
    return a;
  }

  function renderList(posts) {
    if (article) article.hidden = true;
    grid.hidden = false;
    if (!posts || !posts.length) {
      showState('blog.empty', 'Articles are coming soon, in shā Allah. Follow along.');
      return;
    }
    grid.innerHTML = '';
    const frag = document.createDocumentFragment();
    posts.forEach((p) => {
      if (p && p.slug) frag.appendChild(buildCard(p));
    });
    grid.appendChild(frag);
  }

  function renderArticle(post) {
    if (!article) {
      // No article container on this page — fall back to opening nothing.
      renderList([]);
      return;
    }
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
    h1.textContent = post.title || '';
    article.appendChild(h1);

    const meta = document.createElement('div');
    meta.className = 'blog-article__meta';
    const parts = [];
    if (post.author) parts.push(post.author);
    metaText(post).forEach((b) => parts.push(b));
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
    bodyEl.innerHTML = post.contentHtml || ''; // sanitised server-side on ingest
    article.appendChild(bodyEl);

    try {
      document.title = post.title + ' — Nuria Journal';
    } catch (_e) {}
  }

  function handle(posts) {
    if (wantSlug) {
      const post = (posts || []).find((p) => p.slug === wantSlug);
      if (post) {
        renderArticle(post);
        return;
      }
      // Unknown slug → show the list instead.
    }
    renderList(posts);
  }

  function load() {
    if (!endpoint) {
      showState('blog.empty', 'Articles are coming soon, in shā Allah. Follow along.');
      return;
    }
    showState('blog.loading', 'Loading the latest articles…');
    fetch(endpoint, { method: 'GET', mode: 'cors' })
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data) => handle((data && data.posts) || []))
      .catch(() => showState('blog.empty', 'Articles are coming soon. Follow along.'));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
})();

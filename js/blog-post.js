'use strict';

/*
 * Per-post hydration for the statically generated /blog/<slug>/ pages.
 *
 * The page ships with the English article already server-rendered into
 * #blogPost (for SEO + instant first paint). This script progressively
 * enhances it:
 *   - localises the article when the visitor's language ≠ English, and
 *     re-renders in place when they switch language (i18n sets <html lang>), and
 *   - refreshes content from the live API so edits appear before the next build.
 *
 * It reuses window.NuriaBlogArticle (js/blog-article-template.js) — the SAME
 * renderer the generator uses — so the hydrated DOM matches the static HTML.
 * If the network fails, the server-rendered English article simply remains.
 */
(function () {
  const cfg = window.NURIA_SITE_CONFIG || {};
  const postUrl = cfg.blogPostUrl;
  const article = document.getElementById('blogPost');
  const tpl = window.NuriaBlogArticle;
  if (!article || !tpl) return;

  function slugFromPath() {
    const m = window.location.pathname.match(/\/blog\/([^/]+)\/?$/);
    return (m && decodeURIComponent(m[1])) || article.getAttribute('data-slug') || '';
  }
  const slug = slugFromPath();
  if (!slug) return;

  let state = { post: null, renderedLang: 'en' };

  function getLang() {
    try {
      if (window.NuriaI18n && typeof window.NuriaI18n.getLang === 'function') {
        return window.NuriaI18n.getLang();
      }
    } catch (_e) {}
    return document.documentElement.lang || 'en';
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

  function strings() {
    return { allArticles: t('blog.all', 'All articles'), minRead: t('blog.min_read', 'min read') };
  }

  function render(lang) {
    if (!state.post) return;
    article.innerHTML = tpl.articleInnerHTML(state.post, lang, strings());
    state.renderedLang = lang;
    try {
      const tr = tpl.pick(state.post.translations, lang);
      if (tr && tr.title) document.title = tr.title + ' | Nuria';
    } catch (_e) {}
  }

  function cacheGet(key) { try { return JSON.parse(localStorage.getItem(key)); } catch (_e) { return null; } }
  function cacheSet(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (_e) {} }

  function ensureData() {
    const key = 'nuria_blog_post_' + slug;
    const cached = cacheGet(key);
    if (cached && cached.post) {
      state.post = cached.post;
      // Only repaint from cache if the visitor isn't reading English (the
      // server render is already English and authoritative).
      if (getLang() !== 'en') render(getLang());
    }
    if (!postUrl) return;
    fetch(postUrl + '?slug=' + encodeURIComponent(slug), { method: 'GET', mode: 'cors' })
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data) => {
        if (data && data.ok && data.post) {
          cacheSet(key, { ts: Date.now(), post: data.post });
          state.post = data.post;
          // Re-render only when we can improve on the static English HTML:
          // a non-English reader, or a language we haven't painted yet.
          if (getLang() !== 'en' || state.renderedLang !== getLang()) render(getLang());
        }
      })
      .catch(() => { /* keep the server-rendered English article */ });
  }

  function start() {
    ensureData();
    // Re-render in place when the site language changes.
    try {
      const obs = new MutationObserver(() => {
        const lang = getLang();
        if (lang !== state.renderedLang) render(lang);
      });
      obs.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    } catch (_e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();

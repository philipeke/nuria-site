'use strict';

/*
 * Shared Nuria Journal article renderer.
 *
 * ONE source of truth for the inner HTML of `#blogPost`, used by BOTH:
 *   - the static generator (scripts/build-blog.js, via require) which writes
 *     server-rendered article HTML into blog/<slug>/index.html for SEO, and
 *   - the browser hydration script (js/blog-post.js) which re-renders the same
 *     markup to localise on language switch + refresh from the live API.
 *
 * Because both consumers call the exact same function, the crawler's HTML and
 * the client's DOM are byte-identical — no visual drift. The markup mirrors the
 * DOM produced by js/blog.v20260627a.js renderArticle() so the design is
 * unchanged.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.NuriaBlogArticle = factory();
}(typeof self !== 'undefined' ? self : this, function () {

  var DIVIDER_SVG = '<svg class="nuria-divider__line" viewBox="0 0 400 8" fill="none" aria-hidden="true" style="width:100%;height:auto;display:block">' +
    '<defs><linearGradient id="ndGold2" x1="0" x2="1" y1="0" y2="0">' +
    '<stop offset="0" stop-color="#c9a84c" stop-opacity="0"/><stop offset="0.2" stop-color="#c9a84c"/>' +
    '<stop offset="0.5" stop-color="#f4d98c"/><stop offset="0.8" stop-color="#c9a84c"/>' +
    '<stop offset="1" stop-color="#c9a84c" stop-opacity="0"/></linearGradient></defs>' +
    '<path d="M5 4 C60 3 90 3 130 3 L270 3 C310 3 340 3 395 4 C340 5 310 5 270 5 L130 5 C90 5 60 5 5 4 Z" fill="url(#ndGold2)"/></svg>';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function pick(translations, lang) {
    if (!translations) return {};
    return translations[lang] || translations.en || translations[Object.keys(translations)[0]] || {};
  }

  function formatDate(iso, lang) {
    if (!iso) return '';
    try {
      var d = new Date(iso);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleDateString(lang || 'en', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (_e) { return ''; }
  }

  // Lazy-load in-body images (the cover/hero is handled separately with
  // eager/high priority). Only touches <img> tags that don't already declare a
  // loading attribute, so authored content is respected.
  function lazyImages(html) {
    return String(html || '').replace(/<img\b(?![^>]*\bloading=)/gi, '<img loading="lazy" decoding="async" ');
  }

  // Returns the inner HTML for <article class="blog-article" id="blogPost">.
  // strings: { allArticles, minRead } — localised UI labels (caller supplies
  // i18n values in the browser, English defaults at build time).
  function articleInnerHTML(post, lang, strings) {
    strings = strings || {};
    var allArticles = strings.allArticles || 'All articles';
    var minRead = strings.minRead || 'min read';
    var tr = pick(post.translations, lang);

    var html = '';
    html += '<a class="blog-article__back" href="/blog">← ' + esc(allArticles) + '</a>';
    html += '<h1 class="blog-article__title">' + esc(tr.title || '') + '</h1>';

    var parts = [];
    if (post.author) parts.push(esc(post.author));
    var date = formatDate(post.publishedAt, lang);
    if (date) parts.push(esc(date));
    if (post.readMinutes) parts.push(esc(post.readMinutes + ' ' + minRead));
    if (parts.length) html += '<div class="blog-article__meta">' + parts.join('  ·  ') + '</div>';

    if (post.coverImage) {
      html += '<div class="blog-article__cover">' +
        '<img src="' + esc(post.coverImage) + '" alt="" loading="eager" fetchpriority="high" decoding="async">' +
        '</div>';
    }

    html += '<div class="nuria-divider nuria-divider--tight" aria-hidden="true">' + DIVIDER_SVG + '</div>';
    html += '<div class="blog-article__body">' + lazyImages(tr.contentHtml || '') + '</div>';
    return html;
  }

  return {
    articleInnerHTML: articleInnerHTML,
    pick: pick,
    formatDate: formatDate,
    esc: esc
  };
}));

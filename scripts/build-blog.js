'use strict';

/*
 * Static Nuria Journal generator.
 *
 * WHY: nuria.one is a static GitHub Pages site; blog posts live in an external
 * marketing DB and were previously rendered ENTIRELY client-side from
 * getBlogFeedHttp / getBlogPostHttp at /blog/?post=<slug>. Googlebot therefore
 * saw an empty shell and could index nothing. This script fetches every post at
 * build time and emits real, crawlable pages at /blog/<slug>/index.html with
 * full per-post SEO metadata + server-rendered article HTML, plus sitemap.xml
 * and feed.xml. Run on a daily schedule (see .github/workflows/build-blog.yml)
 * because the CMS publishes ~daily.
 *
 * Usage:  node scripts/build-blog.js
 * Design/copy are NOT altered — the article markup is produced by the shared
 * js/blog-article-template.js, identical to the live client renderer.
 */

const fs = require('fs');
const path = require('path');
const { articleInnerHTML, esc, pick } = require('../js/blog-article-template.js');
const { resolve: resolveRedirect } = require('../js/blog-redirects.js');

const ORIGIN = 'https://nuria.one';
const LOGO = ORIGIN + '/assets/Nuria%20Logo.png';
const FEED_URL = 'https://us-central1-nuria-mobile-app.cloudfunctions.net/getBlogFeedHttp';
const POST_URL = 'https://us-central1-nuria-mobile-app.cloudfunctions.net/getBlogPostHttp';
const ROOT = path.resolve(__dirname, '..');

// Cache-busting versions must match the current static pages.
const V = {
  css: '20260629l',
  siteUtils: '20260616-stone-default',
  components: '20260629b',
  main: '20260629j',
};

// Extra public pages to list in the sitemap (curated allowlist — no internal,
// dashboard, invite, or partner-admin routes).
const STATIC_URLS = [
  { loc: '/', priority: '1.0', changefreq: 'weekly' },
  { loc: '/about/', priority: '0.8', changefreq: 'monthly' },
  { loc: '/ask/', priority: '0.8', changefreq: 'monthly' },
  { loc: '/quran/', priority: '0.8', changefreq: 'monthly' },
  { loc: '/sources/', priority: '0.5', changefreq: 'monthly' },
  { loc: '/support/', priority: '0.5', changefreq: 'monthly' },
  { loc: '/blog/', priority: '0.6', changefreq: 'weekly' },
];

async function fetchJson(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 30000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error('HTTP ' + res.status + ' for ' + url);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

function trimLen(str, max) {
  str = String(str || '').trim();
  if (str.length <= max) return str;
  const cut = str.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim() + '…';
}

// JSON-LD: escape "<" so a stray "</script>" in data can't break out.
function jsonLd(obj) {
  return JSON.stringify(obj, null, 2).replace(/</g, '\\u003c');
}

function isoDate(iso) {
  return new Date(iso).toISOString();
}
function ymd(iso) {
  return new Date(iso).toISOString().slice(0, 10);
}

function buildHead(post) {
  const en = post.translations.en || pick(post.translations, 'en');
  const title = en.title || '';
  const excerpt = en.excerpt || '';
  const slug = post.slug;
  const url = ORIGIN + '/blog/' + slug + '/';
  const pageTitle = title + ' | Nuria';
  const cover = post.coverImage || LOGO;
  const published = isoDate(post.publishedAt);

  const blogPosting = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: trimLen(title, 110),
    description: excerpt,
    image: cover,
    datePublished: published,
    dateModified: published,
    url: url,
    inLanguage: 'en',
    author: { '@type': 'Organization', name: 'Nuria', url: ORIGIN },
    publisher: {
      '@type': 'Organization',
      name: 'Nuria',
      logo: { '@type': 'ImageObject', url: LOGO },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  };
  if (Array.isArray(post.tags) && post.tags.length) blogPosting.keywords = post.tags.join(', ');

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: ORIGIN + '/' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: ORIGIN + '/blog/' },
      { '@type': 'ListItem', position: 3, name: title, item: url },
    ],
  };

  return `  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(pageTitle)}</title>
  <meta name="description" content="${esc(excerpt)}" />
  <meta name="theme-color" content="#050c08" />
  <link rel="canonical" href="${esc(url)}" />
  <link rel="alternate" hreflang="en" href="${esc(url)}" />
  <link rel="alternate" hreflang="x-default" href="${esc(url)}" />
  <link rel="alternate" type="application/rss+xml" title="Nuria Journal" href="${ORIGIN}/feed.xml" />
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(excerpt)}" />
  <meta property="og:url" content="${esc(url)}" />
  <meta property="og:image" content="${esc(cover)}" />
  <meta property="og:image:secure_url" content="${esc(cover)}" />
  <meta property="og:image:alt" content="${esc(title)}" />
  <meta property="og:site_name" content="Nuria" />
  <meta property="og:locale" content="en_US" />
  <meta property="article:published_time" content="${esc(published)}" />
  <meta property="article:modified_time" content="${esc(published)}" />
  <meta property="article:author" content="Nuria" />
  <meta property="article:section" content="Islamic Guidance" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@nuria_app" />
  <meta name="twitter:title" content="${esc(title)}" />
  <meta name="twitter:description" content="${esc(excerpt)}" />
  <meta name="twitter:image" content="${esc(cover)}" />
  <meta name="twitter:image:alt" content="${esc(title)}" />
  <link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32.png?v=2" />
  <link rel="icon" type="image/png" sizes="48x48" href="/assets/favicon-48.png?v=2" />
  <link rel="icon" type="image/png" href="/assets/favicon-tab.png?v=2" />
  <link rel="apple-touch-icon" sizes="180x180" href="/assets/apple-touch-icon.png?v=2" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Lato:wght@300;400;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/css/styles.css?v=${V.css}" />
  <script type="application/ld+json">
${jsonLd(blogPosting)}
  </script>
  <script type="application/ld+json">
${jsonLd(breadcrumb)}
  </script>`;
}

function buildPostPage(post) {
  const inner = articleInnerHTML(post, 'en', { allArticles: 'All articles', minRead: 'min read' });
  return `<!DOCTYPE html>
<html lang="en" class="blog-reading">
<head>
${buildHead(post)}
</head>
<body>
  <div id="site-nav"></div>
  <div class="hero__geo-bg" aria-hidden="true"></div>

  <section class="section">
    <div class="container">
      <article class="blog-article" id="blogPost" data-slug="${esc(post.slug)}">
${inner}
      </article>
    </div>
  </section>

  <div id="site-footer"></div>

  <script src="/js/site-config.js"></script>
  <script src="/js/site-utils.js?v=${V.siteUtils}"></script>
  <script src="/js/components.js?v=${V.components}"></script>
  <script src="/js/i18n.js"></script>
  <script src="/js/main.js?v=${V.main}"></script>
  <script src="/js/blog-article-template.js"></script>
  <script src="/js/blog-post.js"></script>
</body>
</html>
`;
}

// Consolidated (merged) posts render as a tiny noindex stub that canonicalises
// + redirects to the pillar, so ranking signals flow to the pillar.
function buildRedirectStub(pillarSlug) {
  const rel = '/blog/' + pillarSlug + '/';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Redirecting… | Nuria</title>
  <meta name="robots" content="noindex, follow" />
  <link rel="canonical" href="${ORIGIN}${rel}" />
  <meta http-equiv="refresh" content="0; url=${rel}" />
  <script>location.replace(${JSON.stringify(rel)});</script>
</head>
<body>
  <p>This article has moved. <a href="${rel}">Continue to the current version →</a></p>
</body>
</html>
`;
}

function buildSitemap(posts) {
  const urls = [];
  for (const s of STATIC_URLS) {
    urls.push(
      `  <url>\n    <loc>${ORIGIN}${s.loc}</loc>\n    <changefreq>${s.changefreq}</changefreq>\n    <priority>${s.priority}</priority>\n  </url>`
    );
  }
  for (const p of posts) {
    urls.push(
      `  <url>\n    <loc>${ORIGIN}/blog/${p.slug}/</loc>\n    <lastmod>${ymd(p.publishedAt)}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>`
    );
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}

function buildFeed(posts) {
  // Deterministic: base lastBuildDate on the newest post, not the clock, so a
  // no-new-posts rebuild produces an identical file (no daily noise commits).
  const newestIso = posts.reduce((m, p) => (new Date(p.publishedAt) > new Date(m) ? p.publishedAt : m),
    posts.length ? posts[0].publishedAt : 0);
  const now = new Date(newestIso).toUTCString();
  const items = posts.map((p) => {
    const en = p.translations.en || pick(p.translations, 'en');
    const url = ORIGIN + '/blog/' + p.slug + '/';
    return `    <item>
      <title>${esc(en.title || '')}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${esc(en.excerpt || '')}</description>
      <pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate>
    </item>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Nuria Journal</title>
    <link>${ORIGIN}/blog/</link>
    <atom:link href="${ORIGIN}/feed.xml" rel="self" type="application/rss+xml" />
    <description>Reflections on Islam, product, and the craft behind Nuria.</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
${items}
  </channel>
</rss>
`;
}

async function main() {
  console.log('→ Fetching blog feed…');
  const feed = await fetchJson(FEED_URL);
  const list = (feed && feed.posts) || [];
  if (!list.length) throw new Error('Feed returned no posts — aborting (will not overwrite existing pages).');
  console.log(`  ${list.length} posts in feed.`);

  const full = [];
  for (const item of list) {
    try {
      const data = await fetchJson(POST_URL + '?slug=' + encodeURIComponent(item.slug));
      if (data && data.ok && data.post) {
        // Feed carries some fields the single-post endpoint may omit; merge.
        full.push(Object.assign({}, item, data.post));
      } else {
        console.warn(`  ! No post body for ${item.slug} — skipping.`);
      }
    } catch (e) {
      console.warn(`  ! Failed ${item.slug}: ${e.message} — skipping.`);
    }
  }
  if (!full.length) throw new Error('No post bodies fetched — aborting.');

  // Newest first for feed/sitemap ordering.
  full.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

  const liveSlugs = new Set(full.map((p) => p.slug));
  // Canonical posts get full pages + sitemap/feed entries; merged (consolidated)
  // posts get a noindex redirect stub to their pillar.
  const canonical = [];
  let full_pages = 0;
  let stubs = 0;
  for (const post of full) {
    const dir = path.join(ROOT, 'blog', post.slug);
    fs.mkdirSync(dir, { recursive: true });
    const pillar = resolveRedirect(post.slug);
    if (pillar) {
      if (!liveSlugs.has(pillar)) {
        console.warn(`  ! Pillar "${pillar}" for ${post.slug} not in feed — writing full page instead.`);
        fs.writeFileSync(path.join(dir, 'index.html'), normalizeDashes(buildPostPage(post)), 'utf8');
        canonical.push(post);
        full_pages++;
        continue;
      }
      fs.writeFileSync(path.join(dir, 'index.html'), buildRedirectStub(pillar), 'utf8');
      stubs++;
      console.log(`  ↪ blog/${post.slug}/ → /blog/${pillar}/ (noindex stub)`);
    } else {
      fs.writeFileSync(path.join(dir, 'index.html'), normalizeDashes(buildPostPage(post)), 'utf8');
      canonical.push(post);
      full_pages++;
      console.log(`  ✓ blog/${post.slug}/index.html`);
    }
  }

  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), buildSitemap(canonical), 'utf8');
  console.log('  ✓ sitemap.xml');
  fs.writeFileSync(path.join(ROOT, 'feed.xml'), buildFeed(canonical), 'utf8');
  console.log('  ✓ feed.xml');

  console.log(`\nDone. ${full_pages} article pages + ${stubs} consolidation redirects (${canonical.length} indexable).`);
}

main().catch((e) => {
  console.error('\nBuild failed:', e.message);
  process.exit(1);
});


// House style (enforced by tests/site-localization-static.test.js): public copy
// never uses spaced dash punctuation. Editorial content arrives from the blog
// feed, so normalize "word - word" (em/en dash) to the unspaced form at build.
function normalizeDashes(html) {
  return html.replace(/(\S)[ 	]+([—–])[ 	]+(?=\S)/g, '$1$2');
}

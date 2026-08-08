'use strict';

/*
 * Refresh the homepage's static TikTok + LinkedIn link feed.
 *
 * This intentionally does not use either platform's authenticated API. TikTok
 * publishes the latest creator videos in its official creator-profile embed,
 * and LinkedIn publishes company posts as JSON-LD on the public company page.
 * The resulting direct links are committed to assets/data/social-feed.json so
 * the homepage stays fast and does not depend on a social API at runtime.
 *
 * Usage: node scripts/update-social-feed.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT = path.join(ROOT, 'assets', 'data', 'social-feed.json');
const TIKTOK_PROFILE = 'https://www.tiktok.com/@nuria_app';
const TIKTOK_EMBED = 'https://www.tiktok.com/embed/@nuria_app?lang=en-US';
const LINKEDIN_PROFILE = 'https://www.linkedin.com/company/nuria-app/';
const AUTHOR = 'Nuria - Muslim Companion';
const LIMIT = 10;
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
  'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36';

async function fetchText(url, extraHeaders) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 30000);
    try {
      const response = await fetch(url, {
        signal: ctrl.signal,
        headers: Object.assign(
          {
            'User-Agent': USER_AGENT,
            'Accept-Language': 'en-US,en;q=0.9',
          },
          extraHeaders || {}
        ),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
      return await response.text();
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError;
}

function scriptBodies(html) {
  return Array.from(html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi), (match) => ({
    attrs: match[1],
    body: match[2],
  }));
}

function scriptById(html, id) {
  const wanted = new RegExp(`\\bid=["']${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`, 'i');
  const script = scriptBodies(html).find((entry) => wanted.test(entry.attrs));
  if (!script) throw new Error(`Missing <script id="${id}"> in public page`);
  return script.body;
}

function tiktokPublishedAt(id) {
  // TikTok video IDs are snowflakes; their high 32 bits are Unix seconds.
  const seconds = BigInt(id) >> 32n;
  return new Date(Number(seconds) * 1000).toISOString();
}

function parseTiktok(html) {
  const state = JSON.parse(scriptById(html, '__FRONTITY_CONNECT_STATE__'));
  const pages = (state && state.source && state.source.data) || {};
  const page = Object.values(pages).find((entry) => entry && Array.isArray(entry.videoList));
  if (!page) throw new Error('TikTok creator embed did not contain a videoList');

  // TikTok may put pinned older videos first. Sort by the timestamp encoded in
  // each video ID so the homepage receives the actual latest ten.
  const byId = new Map();
  for (const video of page.videoList) {
    const id = String((video && video.id) || '');
    if (!/^\d{18,22}$/.test(id) || video.privateItem) continue;
    byId.set(id, {
      id,
      url: `${TIKTOK_PROFILE}/video/${id}`,
      title: String(video.desc || '').trim(),
      authorName: AUTHOR,
      publishedAt: tiktokPublishedAt(id),
    });
  }

  return Array.from(byId.values())
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .slice(0, LIMIT);
}

function parseJsonLd(html) {
  const values = [];
  for (const script of scriptBodies(html)) {
    if (!/\btype=["']application\/ld\+json["']/i.test(script.attrs)) continue;
    try {
      values.push(JSON.parse(script.body));
    } catch (_error) {
      // Ignore unrelated malformed metadata; validation below still prevents a
      // partial social feed from replacing the last known-good file.
    }
  }
  return values;
}

function linkedinTitle(text) {
  const paragraphs = String(text || '')
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (!paragraphs.length) return '';
  if (paragraphs[0].length < 30 && paragraphs[1]) return `${paragraphs[0]} ${paragraphs[1]}`;
  return paragraphs[0];
}

function parseLinkedin(html) {
  const nodes = [];
  for (const value of parseJsonLd(html)) {
    if (Array.isArray(value)) nodes.push(...value);
    else if (value && Array.isArray(value['@graph'])) nodes.push(...value['@graph']);
    else if (value) nodes.push(value);
  }

  const byActivity = new Map();
  for (const node of nodes) {
    if (!node || node['@type'] !== 'DiscussionForumPosting') continue;
    const sourceUrl = String(node.url || node.mainEntityOfPage || '');
    const activity = sourceUrl.match(/(?:activity-|urn:li:activity:)(\d{15,22})/i);
    if (!activity || !node.datePublished) continue;
    const id = activity[1];
    byActivity.set(id, {
      id,
      // Feed/update URLs work both as outbound links and in LinkedIn's official
      // embedded-post iframe used by the homepage lightbox.
      url: `https://www.linkedin.com/feed/update/urn:li:activity:${id}/`,
      title: linkedinTitle(node.text),
      authorName: (node.author && node.author.name) || AUTHOR,
      publishedAt: new Date(node.datePublished).toISOString(),
    });
  }

  return Array.from(byActivity.values())
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .slice(0, LIMIT);
}

function assertFeed(name, items) {
  if (items.length < LIMIT) {
    throw new Error(`${name} returned ${items.length} posts; refusing to replace the last known-good feed`);
  }
  const urls = new Set(items.map((item) => item.url));
  if (urls.size !== items.length) throw new Error(`${name} returned duplicate post links`);
  if (items.some((item) => !item.title || Number.isNaN(new Date(item.publishedAt).getTime()))) {
    throw new Error(`${name} returned an incomplete post`);
  }
}

function readPrevious() {
  try {
    return JSON.parse(fs.readFileSync(OUTPUT, 'utf8'));
  } catch (_error) {
    return null;
  }
}

async function main() {
  console.log('→ Reading TikTok creator embed and LinkedIn company page…');
  const [tiktokHtml, linkedinHtml] = await Promise.all([
    fetchText(TIKTOK_EMBED, { Referer: 'https://nuria.one/' }),
    fetchText(LINKEDIN_PROFILE),
  ]);

  const tiktok = parseTiktok(tiktokHtml);
  const linkedin = parseLinkedin(linkedinHtml);
  assertFeed('TikTok', tiktok);
  assertFeed('LinkedIn', linkedin);

  const previous = readPrevious();
  const content = { tiktok, linkedin };
  const unchanged =
    previous &&
    JSON.stringify({ tiktok: previous.tiktok, linkedin: previous.linkedin }) === JSON.stringify(content);
  const output = {
    ok: true,
    generatedAt: unchanged && previous.generatedAt ? previous.generatedAt : new Date().toISOString(),
    tiktok,
    linkedin,
  };

  fs.writeFileSync(OUTPUT, JSON.stringify(output, null, 2) + '\n', 'utf8');
  console.log(`✓ ${tiktok.length} TikTok links; latest ${tiktok[0].publishedAt}`);
  console.log(`✓ ${linkedin.length} LinkedIn links; latest ${linkedin[0].publishedAt}`);
  console.log(unchanged ? '✓ Feed already current' : '✓ Updated assets/data/social-feed.json');
}

main().catch((error) => {
  console.error(`\nSocial feed refresh failed: ${error.message}`);
  process.exit(1);
});

'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

function run(name, fn) {
  try {
    fn();
    process.stdout.write(`PASS ${name}\n`);
  } catch (error) {
    process.stderr.write(`FAIL ${name}\n${error.stack}\n`);
    process.exitCode = 1;
  }
}

const repoRoot = path.resolve(__dirname, '..');
const indexHtml = fs.readFileSync(path.join(repoRoot, 'index.html'), 'utf8');
const siteUtilsScript = fs.readFileSync(path.join(repoRoot, 'js', 'site-utils.js'), 'utf8');

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findMeta(attr, value) {
  const pattern = new RegExp(`<meta\\b(?=[^>]*\\b${attr}="${escapeRegex(value)}")[^>]*>`, 'i');
  const match = indexHtml.match(pattern);
  assert(match, `Missing meta tag for ${attr}="${value}"`);
  return match[0];
}

function contentFrom(tag) {
  const match = tag.match(/\bcontent="([^"]*)"/i);
  assert(match, `Missing content attribute in ${tag}`);
  return match[1];
}

function assertHumanContent(label, value) {
  assert(value.trim(), `${label} must not be empty`);
  assert(!/^[a-z0-9_]+\.[a-z0-9_.-]+$/i.test(value), `${label} must not be an i18n key`);
  assert(!value.includes('site.index_'), `${label} leaked a homepage i18n key`);
}

run('homepage social metadata is static crawler-readable text', () => {
  const tags = [
    ['name', 'description'],
    ['property', 'og:title'],
    ['property', 'og:description'],
    ['name', 'twitter:title'],
    ['name', 'twitter:description'],
  ];

  tags.forEach(([attr, value]) => {
    const tag = findMeta(attr, value);
    assert(!tag.includes('data-i18n-content'), `${value} should not depend on client i18n`);
    assertHumanContent(value, contentFrom(tag));
  });
});

run('homepage title is static crawler-readable text', () => {
  const titleMatch = indexHtml.match(/<title(?:\s[^>]*)?>([\s\S]*?)<\/title>/i);
  assert(titleMatch, 'Missing title tag');
  assert(!titleMatch[0].includes('data-i18n-title'), 'Homepage title should not depend on client i18n');
  assertHumanContent('title', titleMatch[1]);
});

run('homepage exposes exactly one human-readable h1', () => {
  const h1Tags = indexHtml.match(/<h1\b[^>]*>[\s\S]*?<\/h1>/gi) || [];
  assert.strictEqual(h1Tags.length, 1, 'Homepage should have exactly one h1');

  const h1Text = h1Tags[0].replace(/<[^>]+>/g, '').trim();
  assertHumanContent('h1', h1Text);
  assert(h1Text.includes('Nuria'), 'Homepage h1 should name Nuria');
});

run('homepage upgrades direct http visits to https', () => {
  assert(indexHtml.includes("window.location.protocol === 'http:'"));
  assert(indexHtml.includes("window.location.hostname === 'nuria.one'"));
  assert(indexHtml.includes("window.location.replace('https://'"));
});

run('homepage declares canonical https urls for crawlers', () => {
  assert(indexHtml.includes('<link rel="canonical" href="https://nuria.one/" />'));
  assert(indexHtml.includes('<meta property="og:url"'));
  assert(indexHtml.includes('content="https://nuria.one/"'));
});

run('shared site utilities upgrade http visits across public pages', () => {
  assert(siteUtilsScript.includes("new Set(['nuria.one', 'www.nuria.one'])"));
  assert(siteUtilsScript.includes("window.location.protocol !== 'http:'"));
  assert(siteUtilsScript.includes('window.location.replace('));
});

if (process.exitCode && process.exitCode !== 0) {
  process.exit(process.exitCode);
}

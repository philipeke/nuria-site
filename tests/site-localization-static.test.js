'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const locales = ['en', 'ar', 'ur', 'id', 'fr', 'tr', 'ru'];
const excluded = new Set(['.git', 'assets', 'dashboard', 'internal', 'invite', 'join', 'node_modules', 'nuria-partner', 'subscribe', 'tmp', 'workers', 'ambassador']);

function walk(dir, result = []) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
    if (entry.isDirectory() && excluded.has(entry.name)) return;
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(absolute, result);
    else if (entry.name.endsWith('.html')) result.push(absolute);
  });
  return result;
}

function run(name, fn) {
  try { fn(); process.stdout.write(`PASS ${name}\n`); }
  catch (error) { process.stderr.write(`FAIL ${name}\n${error.stack}\n`); process.exitCode = 1; }
}

run('Russian is available in language metadata and the shared switcher', () => {
  const i18n = fs.readFileSync(path.join(root, 'js', 'i18n.js'), 'utf8');
  const components = fs.readFileSync(path.join(root, 'js', 'components.js'), 'utf8');
  assert(i18n.includes("ru: { flag: '🇷🇺'"));
  assert(components.includes('data-lang="ru"'));
  assert(components.includes('Русский'));
});

run('every public translation key has an English source and locale coverage', () => {
  const used = new Set();
  walk(root).forEach((file) => {
    const html = fs.readFileSync(file, 'utf8');
    for (const match of html.matchAll(/data-i18n(?:-html|-placeholder|-aria-label|-alt|-title|-content)?=["']([^"']+)["']/g)) used.add(match[1]);
  });
  const noop = () => {};
  const sandbox = { window: { dispatchEvent: noop }, document: { readyState: 'loading', addEventListener: noop, querySelectorAll: () => [], querySelector: () => null, documentElement: {} }, localStorage: { getItem: () => null, setItem: noop }, navigator: { language: 'en' }, fetch: undefined, CustomEvent: function () {} };
  vm.createContext(sandbox);
  vm.runInContext(`${fs.readFileSync(path.join(root, 'js', 'i18n.js'), 'utf8')}\n;globalThis.__T=T;`, sandbox);
  const flatten = (value, prefix = '', out = {}) => { Object.entries(value || {}).forEach(([key, item]) => { const next = prefix ? `${prefix}.${key}` : key; if (item && typeof item === 'object') flatten(item, next, out); else out[next] = item; }); return out; };
  const catalogues = Object.fromEntries(locales.map((locale) => [locale, { ...flatten(sandbox.__T[locale]), ...JSON.parse(fs.readFileSync(path.join(root, 'l10n', `site_${locale}.arb`), 'utf8')) }]));
  used.forEach((key) => locales.forEach((locale) => {
    if (locale === 'en' && key === 'pages.legal_notice') return;
    assert(catalogues[locale][key], `${locale} missing ${key}`);
  }));
});

// House style for the English source copy, which prefers a full stop to a
// spaced dash. It is deliberately not applied to the translated locales: in
// Russian the spaced em-dash is the copula ("X — это Y"), and Turkish and Urdu
// use paired dashes for parentheticals. Enforcing it there is what produced
// mangled fragments like "Слова. Это мышечная память".
run('public copy does not use spaced dash punctuation', () => {
  const files = [...walk(root), path.join(root, 'l10n', 'site_en.arb')];
  files.forEach((file) => {
    const raw = fs.readFileSync(file, 'utf8');
    const cleaned = file.endsWith('.html') ? raw
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<(?:style|script)\b[^>]*>[\s\S]*?<\/(?:style|script)>/gi, '') : raw;
    const copySegments = file.endsWith('.html') ? cleaned.split(/<[^>]+>/g) : [cleaned];
    copySegments.forEach((source) => assert(!/\S\s+(?:[\u2014\u2013]|&(?:m|n)dash;|-)\s+\S/.test(source), `${path.relative(root, file)} contains spaced dash punctuation`));
  });
});

// Visible copy with no data-i18n never translates, however good the locale
// files are. Legal pages are English-only for now by product decision.
const legalPages = new Set(['privacy/index.html', 'terms/index.html', 'cookies/index.html']);
// Deliberately untranslated: a brand name, app-screen chrome inside a device
// mockup whose neighbours are Arabic, and the title of an English-only article.
const untranslatedByDesign = new Set([
  'Nuria Serene',
  'Nuria Noor',
  'Nuria \u00b7 light for the ummah',
  "Making the Qur'an your daily companion",
]);
const voidTags = new Set(['br', 'img', 'input', 'meta', 'link', 'hr', 'source', 'path', 'circle', 'use', 'stop', 'rect', 'polyline', 'area', 'col', 'embed', 'track', 'wbr']);
const opaqueTags = new Set(['script', 'style', 'title', 'noscript']);

run('public page copy is reachable by the translation layer', () => {
  const offenders = [];
  walk(root).forEach((file) => {
    const rel = path.relative(root, file).split(path.sep).join('/');
    // /blog/** is generated English article content (scripts/build-blog.js).
    if (legalPages.has(rel) || rel.startsWith('blog/')) return;
    const html = fs.readFileSync(file, 'utf8')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<![^>]*>/g, '');
    const stack = [];
    // Only data-i18n / data-i18n-html replace text content. The -aria-label,
    // -placeholder, -alt, -title and -content variants set an attribute and
    // leave children untranslated, so they must not mark a subtree as covered.
    const token = /<\/?([a-zA-Z][\w-]*)((?:"[^"]*"|'[^']*'|[^>])*?)\/?>/g;
    let last = 0;
    let match = token.exec(html);
    while (match !== null) {
      const text = html.slice(last, match.index);
      if (text.trim()
        && !stack.some((frame) => opaqueTags.has(frame.tag))
        && !stack.some((frame) => frame.covered)) {
        const flat = text.replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim();
        if (/[A-Za-z]{3,}(\s+[A-Za-z'\u2019&]{2,}){1,}/.test(flat) && !untranslatedByDesign.has(flat)) {
          offenders.push(`${rel}: "${flat.slice(0, 70)}"`);
        }
      }
      const tag = match[1].toLowerCase();
      if (match[0].startsWith('</')) {
        for (let i = stack.length - 1; i >= 0; i -= 1) {
          if (stack[i].tag === tag) { stack.length = i; break; }
        }
      } else if (!voidTags.has(tag) && !match[0].endsWith('/>')) {
        const attrs = match[2] || '';
        stack.push({ tag, covered: /\bdata-i18n(?:-html)?\s*=/.test(attrs) });
      }
      last = token.lastIndex;
      match = token.exec(html);
    }
  });
  assert.deepStrictEqual(offenders, [], `untranslated visible copy:\n  ${offenders.join('\n  ')}`);
});

'use strict';

// Builds complete ARB overlays for every public Nuria locale. Existing human
// translations always win; only missing strings are sent for translation.
// Referral, partner, ambassador, dashboard, and admin pages are intentionally
// outside this catalogue.

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const TARGETS = { ar: 'ar', ur: 'ur', id: 'id', fr: 'fr', tr: 'tr', ru: 'ru' };
const EXCLUDED_DIRS = new Set([
  '.git', 'assets', 'dashboard', 'internal', 'invite', 'join', 'node_modules',
  'nuria-partner', 'subscribe', 'tmp', 'workers', 'ambassador',
]);

function flatten(value, prefix = '', out = {}) {
  Object.entries(value || {}).forEach(([key, item]) => {
    const next = prefix ? `${prefix}.${key}` : key;
    if (item && typeof item === 'object' && !Array.isArray(item)) flatten(item, next, out);
    else if (typeof item === 'string') out[next] = item;
  });
  return out;
}

function loadRuntimeCatalogues() {
  const noop = () => {};
  const sandbox = {
    window: { dispatchEvent: noop },
    document: {
      readyState: 'loading', addEventListener: noop, querySelectorAll: () => [],
      querySelector: () => null, documentElement: {},
    },
    localStorage: { getItem: () => null, setItem: noop },
    navigator: { language: 'en' }, fetch: undefined, CustomEvent: function () {},
  };
  vm.createContext(sandbox);
  let code = fs.readFileSync(path.join(ROOT, 'js', 'i18n.js'), 'utf8');
  code += '\n;globalThis.__catalogues = T;';
  vm.runInContext(code, sandbox);
  return sandbox.__catalogues;
}

function publicHtmlFiles(dir = ROOT, result = []) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
    if (entry.isDirectory() && EXCLUDED_DIRS.has(entry.name)) return;
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) publicHtmlFiles(absolute, result);
    else if (entry.name.endsWith('.html')) result.push(absolute);
  });
  return result;
}

function decodeHtml(value) {
  return value
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&mdash;|&#8212;/gi, '—')
    .replace(/&ndash;|&#8211;/gi, '–')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function collectPublicKeys(english) {
  const keys = new Set(Object.keys(english));
  publicHtmlFiles().forEach((file) => {
    const html = fs.readFileSync(file, 'utf8');
    const elementPattern = /<([a-z][\w-]*)\b[^>]*\bdata-i18n(?:-html)?=["']([^"']+)["'][^>]*>([\s\S]*?)<\/\1>/gi;
    for (const match of html.matchAll(elementPattern)) {
      keys.add(match[2]);
      if (!english[match[2]]) english[match[2]] = decodeHtml(match[3]);
    }
    const attrPattern = /\bdata-i18n-(?:placeholder|aria-label|alt|title|content)=["']([^"']+)["']/gi;
    for (const match of html.matchAll(attrPattern)) keys.add(match[1]);
  });
  return keys;
}

function readArb(locale) {
  const file = path.join(ROOT, 'l10n', `site_${locale}.arb`);
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : { '@@locale': locale };
}

function polishDashes(text) {
  return text
    .replace(/\s+[—–]\s+/g, '. ')
    .replace(/\s{2,}/g, ' ')
    .replace(/\.\s+([a-zа-яё])/g, (_, letter) => `. ${letter.toUpperCase()}`);
}

function polishLocale(locale, text) {
  const polished = polishDashes(text);
  return locale === 'ru' ? polished.replace(/Нури(?:я|и|ю|ей|е)/g, 'Nuria') : polished;
}

async function translate(text, locale, attempt = 0) {
  const body = new URLSearchParams({ client: 'gtx', sl: 'en', tl: locale, dt: 't', q: text });
  const response = await fetch('https://translate.google.com/translate_a/single', {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded;charset=UTF-8' }, body,
  });
  if (response.status === 429) {
    const mobile = await fetch(`https://translate.google.com/m?sl=en&tl=${encodeURIComponent(locale)}&q=${encodeURIComponent(text)}`);
    if (!mobile.ok) throw new Error(`Translation web fallback failed (${mobile.status})`);
    const html = await mobile.text();
    const match = html.match(/<div class="result-container">([\s\S]*?)<\/div>/);
    if (!match) throw new Error('Translation web fallback returned no result');
    return match[1].replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&amp;/g, '&');
  }
  if (response.status >= 500 && attempt < 8) {
    await new Promise((resolve) => setTimeout(resolve, Math.min(30000, 1500 * (2 ** attempt))));
    return translate(text, locale, attempt + 1);
  }
  if (!response.ok) throw new Error(`Translation request failed (${response.status})`);
  const data = await response.json();
  return data[0].map((part) => part[0]).join('');
}

async function mapLimited(items, limit, worker) {
  let cursor = 0;
  async function run() {
    while (cursor < items.length) {
      const index = cursor++;
      await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
}

function makeBatches(keys, english, maxChars = 1700) {
  const batches = [];
  let batch = [];
  let length = 0;
  keys.forEach((key) => {
    const size = english[key].length + 40;
    if (batch.length && (batch.length >= 15 || length + size > maxChars)) {
      batches.push(batch); batch = []; length = 0;
    }
    batch.push(key); length += size;
  });
  if (batch.length) batches.push(batch);
  return batches;
}

async function main() {
  const runtime = loadRuntimeCatalogues();
  const englishArb = readArb('en');
  const english = { ...flatten(runtime.en), ...englishArb };
  delete english['@@locale'];
  const publicKeys = collectPublicKeys(english);
  const completeEnglishArb = { '@@locale': 'en' };
  [...publicKeys].filter((key) => english[key]).sort().forEach((key) => { completeEnglishArb[key] = polishDashes(english[key]); });
  fs.writeFileSync(path.join(ROOT, 'l10n', 'site_en.arb'), `${JSON.stringify(completeEnglishArb, null, 2)}\n`);

  for (const [locale, target] of Object.entries(TARGETS)) {
    const arb = readArb(locale);
    const builtIn = flatten(runtime[locale] || {});
    const wanted = locale === 'ru' ? Object.keys(english) : [...publicKeys];
    const missing = wanted.filter((key) => english[key] && !arb[key] && !builtIn[key]);
    process.stdout.write(`${locale}: translating ${missing.length} missing strings\n`);
    const targetFile = path.join(ROOT, 'l10n', `site_${locale}.arb`);
    const saveProgress = () => fs.writeFileSync(targetFile, `${JSON.stringify(arb, null, 2)}\n`);
    const delimiter = '\n<<<NURIA_TRANSLATION_SPLIT>>>\n';
    const batches = makeBatches(missing, english);
    let completed = 0;
    await mapLimited(batches, 1, async (batch) => {
      const source = batch.map((key) => polishDashes(english[key])).join(delimiter);
      const translated = await translate(source, target);
      const parts = translated.split(/\s*<<<NURIA_TRANSLATION_SPLIT>>>\s*/);
      if (parts.length !== batch.length) throw new Error(`Could not split ${locale} translation batch (${parts.length}/${batch.length})`);
      batch.forEach((key, index) => { arb[key] = polishLocale(locale, parts[index].trim()); });
      completed += batch.length;
      saveProgress();
      process.stdout.write(`${locale}: ${completed}/${missing.length}\n`);
    });
    Object.keys(arb).forEach((key) => {
      if (!key.startsWith('@') && typeof arb[key] === 'string') arb[key] = polishLocale(locale, arb[key]);
    });
    const ordered = { '@@locale': locale };
    Object.keys(arb).filter((key) => key !== '@@locale').sort().forEach((key) => { ordered[key] = arb[key]; });
    fs.writeFileSync(targetFile, `${JSON.stringify(ordered, null, 2)}\n`);
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });

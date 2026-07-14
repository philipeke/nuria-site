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

run('public copy does not use spaced dash punctuation', () => {
  const files = [...walk(root),
    ...locales.map((locale) => path.join(root, 'l10n', `site_${locale}.arb`))];
  files.forEach((file) => {
    const raw = fs.readFileSync(file, 'utf8');
    const cleaned = file.endsWith('.html') ? raw
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<(?:style|script)\b[^>]*>[\s\S]*?<\/(?:style|script)>/gi, '') : raw;
    const copySegments = file.endsWith('.html') ? cleaned.split(/<[^>]+>/g) : [cleaned];
    copySegments.forEach((source) => assert(!/\S\s+(?:[\u2014\u2013]|&(?:m|n)dash;|-)\s+\S/.test(source), `${path.relative(root, file)} contains spaced dash punctuation`));
  });
});

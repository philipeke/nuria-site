'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const EXCLUDED = new Set(['.git', 'assets', 'dashboard', 'internal', 'invite', 'join', 'node_modules', 'nuria-partner', 'subscribe', 'tmp', 'workers', 'ambassador']);

function rewriteCopy(value) {
  return value
    .replace(/\s+(?:—|–|&mdash;|&#8212;|&ndash;|&#8211;)\s+/gi, '. ')
    .replace(/\s+-\s+/g, ': ')
    .replace(/\.\s+([a-zа-яё])/g, (_, letter) => `. ${letter.toUpperCase()}`);
}

function rewriteJsStrings(source) {
  let out = '';
  for (let i = 0; i < source.length;) {
    const quote = source[i];
    if (quote !== "'" && quote !== '"' && quote !== '`') { out += source[i++]; continue; }
    let value = quote;
    i += 1;
    while (i < source.length) {
      const char = source[i];
      value += char;
      i += 1;
      if (char === '\\' && i < source.length) { value += source[i++]; continue; }
      if (char === quote) break;
    }
    out += quote + rewriteCopy(value.slice(1, -1)) + quote;
  }
  return out;
}

function rewriteHtml(source) {
  return source.split(/(<[^>]+>)/g).map((part) => {
    if (!part.startsWith('<')) return rewriteCopy(part);
    return part.replace(/\b(content|placeholder|aria-label|alt|title)=(['"])([\s\S]*?)\2/gi,
      (_, attr, quote, value) => `${attr}=${quote}${rewriteCopy(value)}${quote}`);
  }).join('');
}

function walk(dir, result = []) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
    if (entry.isDirectory() && EXCLUDED.has(entry.name)) return;
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(absolute, result);
    else if (entry.name.endsWith('.html')) result.push(absolute);
  });
  return result;
}

const files = [
  ...walk(ROOT),
  path.join(ROOT, 'js', 'i18n.js'),
  path.join(ROOT, 'js', 'sources-translations.js'),
  ...fs.readdirSync(path.join(ROOT, 'l10n')).filter((name) => name.endsWith('.arb')).map((name) => path.join(ROOT, 'l10n', name)),
];

files.forEach((file) => {
  const before = fs.readFileSync(file, 'utf8');
  const after = file.endsWith('.html') ? rewriteHtml(before)
    : file.endsWith('.js') ? rewriteJsStrings(before)
      : `${JSON.stringify(JSON.parse(before), null, 2)}\n`.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, (match) => rewriteCopy(match));
  if (after !== before) fs.writeFileSync(file, after);
});

console.log(`Polished ${files.length} public copy files.`);

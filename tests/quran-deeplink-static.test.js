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
const quranHtml = fs.readFileSync(path.join(repoRoot, 'quran', 'index.html'), 'utf8');
const quranPageScript = fs.readFileSync(path.join(repoRoot, 'js', 'quran-page.js'), 'utf8');
const notFoundHtml = fs.readFileSync(path.join(repoRoot, '404.html'), 'utf8');
const appleAppSiteAssociation = JSON.parse(
  fs.readFileSync(path.join(repoRoot, '.well-known', 'apple-app-site-association'), 'utf8'),
);
const quranLink = require(path.join(repoRoot, 'js', 'quran-link.js'));

run('quran landing page exposes the deep link, store buttons and scripts', () => {
  assert(quranHtml.includes('nuria://quran'));
  assert(quranHtml.includes('id="quranOpenButton"'));
  assert(quranHtml.includes('id="quranVerseReference"'));
  assert(quranHtml.includes('data-store-link="app-store"'));
  assert(quranHtml.includes('data-store-link="google-play"'));
  assert(quranHtml.includes('../js/quran-link.js'));
  assert(quranHtml.includes('../js/quran-page.js'));
  assert(quranHtml.includes('data-i18n="quran.hero_title"'));
});

run('quran page script auto-opens on mobile and tracks the deep link', () => {
  assert(quranPageScript.includes('quran_deep_link_opened'));
  assert(quranPageScript.includes("openVerse('auto_mobile')"));
  assert(quranPageScript.includes('parseVerseFromLocation'));
});

run('404 page routes /quran/<s>/<a> to the landing page', () => {
  assert(notFoundHtml.includes('/js/quran-link.js'));
  assert(notFoundHtml.includes('buildQuranRedirectUrl'));
});

run('apple app site association includes the quran verse path', () => {
  const paths = appleAppSiteAssociation.applinks.details[0].paths;
  assert(paths.includes('/quran/*'));
});

run('parseVerseFromLocation accepts paths and query params', () => {
  assert.deepStrictEqual(
    quranLink.parseVerseFromLocation({ pathname: '/quran/2/255', search: '' }),
    { surah: 2, ayah: 255, name: 'Al-Baqarah' },
  );
  assert.deepStrictEqual(
    quranLink.parseVerseFromLocation({ pathname: '/quran/', search: '?s=36&a=9' }),
    { surah: 36, ayah: 9, name: 'Ya-Sin' },
  );
});

run('parseVerseFromLocation rejects out-of-range verses', () => {
  assert.strictEqual(quranLink.parseVerseFromLocation({ pathname: '/quran/0/1', search: '' }), null);
  assert.strictEqual(quranLink.parseVerseFromLocation({ pathname: '/quran/115/1', search: '' }), null);
  // Al-Fatihah has 7 ayat — 8 must be rejected.
  assert.strictEqual(quranLink.parseVerseFromLocation({ pathname: '/quran/1/8', search: '' }), null);
  assert.strictEqual(quranLink.parseVerseFromLocation({ pathname: '/join/ABC', search: '' }), null);
});

run('buildQuranRedirectUrl canonicalizes verse paths and ignores others', () => {
  assert.strictEqual(
    quranLink.buildQuranRedirectUrl({ pathname: '/quran/2/255', search: '' }),
    '/quran/?s=2&a=255',
  );
  // Invalid verse under /quran still lands on the generic page.
  assert.strictEqual(
    quranLink.buildQuranRedirectUrl({ pathname: '/quran/999/1', search: '' }),
    '/quran/',
  );
  assert.strictEqual(quranLink.buildQuranRedirectUrl({ pathname: '/r/ABC123', search: '' }), null);
});

run('buildSchemeUrl produces the app deep link', () => {
  assert.strictEqual(quranLink.buildSchemeUrl({ surah: 2, ayah: 255 }, 'nuria'), 'nuria://quran/2/255');
  assert.strictEqual(quranLink.buildSchemeUrl(null, 'nuria'), 'nuria://quran');
});

run('all seven site locales carry the quran landing keys', () => {
  ['en', 'ar', 'fr', 'id', 'tr', 'ur', 'ru'].forEach((lang) => {
    const arb = JSON.parse(
      fs.readFileSync(path.join(repoRoot, 'l10n', `site_${lang}.arb`), 'utf8'),
    );
    ['quran.hero_title', 'quran.open_cta', 'quran.status_fallback', 'quran.fact_3_text']
      .forEach((key) => assert(arb[key], `${lang} missing ${key}`));
  });
});

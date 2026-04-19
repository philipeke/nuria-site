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
const siteUtilsScript = fs.readFileSync(
  path.join(repoRoot, 'js', 'site-utils.js'),
  'utf8'
);
const privacyHtml = fs.readFileSync(
  path.join(repoRoot, 'privacy', 'index.html'),
  'utf8'
);

const pagesRequiringAnalyticsBootstrap = [
  ['index.html', ['js/site-config.js', 'js/site-utils.js', 'js/main.js']],
  ['404.html', ['/js/site-config.js', '/js/site-utils.js', '/js/main.js']],
  ['cookies/index.html', ['../js/site-config.js', '../js/site-utils.js', '../js/main.js']],
  ['delete-account/index.html', ['../js/site-config.js', '../js/site-utils.js', '../js/main.js']],
  ['privacy/index.html', ['../js/site-config.js', '../js/site-utils.js', '../js/main.js']],
  ['support/index.html', ['../js/site-config.js', '../js/site-utils.js', '../js/main.js']],
  ['terms/index.html', ['../js/site-config.js', '../js/site-utils.js', '../js/main.js']],
  ['join/index.html', ['../js/site-config.js', '../js/site-utils.js', '../js/main.js']],
  ['nuria-partner/index.html', ['../js/site-config.js', '../js/site-utils.js']],
  ['internal/affiliate-admin/index.html', ['../../js/site-config.js', '../../js/site-utils.js', '../../js/main.js']],
];

run('site utils bootstraps Google Analytics behind consent', () => {
  assert(siteUtilsScript.includes('googletagmanager.com/gtag/js?id='));
  assert(siteUtilsScript.includes("client_storage: 'none'"));
  assert(siteUtilsScript.includes("window.addEventListener('nuria:cookie-consent-changed'"));
  assert(siteUtilsScript.includes("window.gtag('config', measurementId"));
});

run('site utils tracks store-link clicks for analytics', () => {
  assert(siteUtilsScript.includes('[data-store-link]'));
  assert(siteUtilsScript.includes("trackEvent('site_store_clicked'"));
});

run('every main website page loads analytics config before main.js', () => {
  pagesRequiringAnalyticsBootstrap.forEach(([relativePath, expectedScripts]) => {
    const html = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
    expectedScripts.forEach((scriptPath) => {
      assert(html.includes(scriptPath), `${relativePath} is missing ${scriptPath}`);
    });
  });
});

run('privacy page reflects optional Google Analytics usage', () => {
  assert(privacyHtml.includes('Optional visitor analytics are activated only if you explicitly accept them through the cookie banner.'));
  assert(privacyHtml.includes('Google Analytics 4'));
  assert(!privacyHtml.includes('We do not use Google Analytics or any other visitor analytics tool on this website.'));
});

if (process.exitCode && process.exitCode !== 0) {
  process.exit(process.exitCode);
}

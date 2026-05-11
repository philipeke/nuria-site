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
const subscribeHtml = fs.readFileSync(path.join(repoRoot, 'subscribe', 'index.html'), 'utf8');
const subscribeScript = fs.readFileSync(path.join(repoRoot, 'js', 'subscribe.js'), 'utf8');
const siteUtilsScript = fs.readFileSync(path.join(repoRoot, 'js', 'site-utils.js'), 'utf8');
const appleAppSiteAssociation = JSON.parse(
  fs.readFileSync(path.join(repoRoot, '.well-known', 'apple-app-site-association'), 'utf8'),
);

run('subscribe campaign page exposes the app deep link and web fallback', () => {
  assert(subscribeHtml.includes('https://nuria.one/subscribe'));
  assert(subscribeHtml.includes('nuria://subscribe'));
  assert(subscribeHtml.includes('id="subscribeOpenButton"'));
  assert(subscribeHtml.includes('data-store-link="app-store"'));
  assert(subscribeHtml.includes('data-store-link="google-play"'));
  assert(subscribeHtml.includes('../js/subscribe.js'));
});

run('subscribe script opens the app subscribe route without referral codes', () => {
  assert(subscribeScript.includes('://subscribe'));
  assert(!subscribeScript.includes('?ref='));
  assert(subscribeScript.includes("subscribe_deep_link_opened"));
  assert(subscribeScript.includes("openSubscribe('auto_mobile')"));
});

run('site utils exposes subscribe link helpers', () => {
  assert(siteUtilsScript.includes('function getSubscribeUrl()'));
  assert(siteUtilsScript.includes('function getSubscribeSchemeUrl()'));
  assert(siteUtilsScript.includes('getSubscribeUrl,'));
  assert(siteUtilsScript.includes('getSubscribeSchemeUrl,'));
});

run('apple app site association includes subscribe campaign paths', () => {
  const paths = appleAppSiteAssociation.applinks.details[0].paths;
  assert(paths.includes('/subscribe'));
  assert(paths.includes('/subscribe/*'));
});

if (process.exitCode && process.exitCode !== 0) {
  process.exit(process.exitCode);
}

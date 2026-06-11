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
const inviteHtml = fs.readFileSync(path.join(repoRoot, 'invite', 'index.html'), 'utf8');
const invitePageScript = fs.readFileSync(path.join(repoRoot, 'js', 'invite-page.js'), 'utf8');
const notFoundHtml = fs.readFileSync(path.join(repoRoot, '404.html'), 'utf8');
const appleAppSiteAssociation = JSON.parse(
  fs.readFileSync(path.join(repoRoot, '.well-known', 'apple-app-site-association'), 'utf8'),
);
const inviteLink = require(path.join(repoRoot, 'js', 'invite-link.js'));

run('invite landing page exposes the deep link, store buttons and scripts', () => {
  assert(inviteHtml.includes('nuria://invite'));
  assert(inviteHtml.includes('id="inviteOpenButton"'));
  assert(inviteHtml.includes('id="inviteCodeChip"'));
  assert(inviteHtml.includes('data-store-link="app-store"'));
  assert(inviteHtml.includes('data-store-link="google-play"'));
  assert(inviteHtml.includes('../js/invite-link.js'));
  assert(inviteHtml.includes('../js/invite-page.js'));
  assert(inviteHtml.includes('data-i18n="invite.hero_title"'));
});

run('invite page script auto-opens on mobile and tracks the deep link', () => {
  assert(invitePageScript.includes('invite_deep_link_opened'));
  assert(invitePageScript.includes("openInvite('auto_mobile')"));
  assert(invitePageScript.includes('parseInviteCode'));
});

run('404 page routes /invite/<code> to the landing page', () => {
  assert(notFoundHtml.includes('/js/invite-link.js'));
  assert(notFoundHtml.includes('buildInviteRedirectUrl'));
});

run('apple app site association includes the invite paths', () => {
  const paths = appleAppSiteAssociation.applinks.details[0].paths;
  assert(paths.includes('/invite'));
  assert(paths.includes('/invite/*'));
});

run('parseInviteCode accepts query and path forms, normalized', () => {
  assert.strictEqual(
    inviteLink.parseInviteCode({pathname: '/invite/', search: '?ref=ab cd23'}),
    'ABCD23',
  );
  assert.strictEqual(
    inviteLink.parseInviteCode({pathname: '/invite/xyz789', search: ''}),
    'XYZ789',
  );
  assert.strictEqual(
    inviteLink.parseInviteCode({pathname: '/invite/', search: ''}),
    '',
  );
});

run('buildInviteRedirectUrl canonicalizes invite paths and ignores others', () => {
  assert.strictEqual(
    inviteLink.buildInviteRedirectUrl({pathname: '/invite/ABCD23', search: ''}),
    '/invite/?ref=ABCD23',
  );
  assert.strictEqual(
    inviteLink.buildInviteRedirectUrl({pathname: '/invite/!!', search: ''}),
    '/invite/',
  );
  assert.strictEqual(
    inviteLink.buildInviteRedirectUrl({pathname: '/r/ABC123', search: ''}),
    null,
  );
});

run('buildSchemeUrl produces the app deep link', () => {
  assert.strictEqual(
    inviteLink.buildSchemeUrl('ABCD23', 'nuria'),
    'nuria://invite?ref=ABCD23',
  );
  assert.strictEqual(inviteLink.buildSchemeUrl('', 'nuria'), 'nuria://invite');
});

run('all six site locales carry the invite landing keys', () => {
  ['en', 'ar', 'fr', 'id', 'tr', 'ur'].forEach((lang) => {
    const arb = JSON.parse(
      fs.readFileSync(path.join(repoRoot, 'l10n', `site_${lang}.arb`), 'utf8'),
    );
    ['invite.hero_title', 'invite.open_cta', 'invite.status_fallback', 'invite.fact_2_text']
      .forEach((key) => assert(arb[key], `${lang} missing ${key}`));
  });
});

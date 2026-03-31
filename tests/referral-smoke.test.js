'use strict';

const assert = require('assert');
const routing = require('../js/referral-routing.js');
const flow = require('../js/referral-flow-utils.js');

function run(name, fn) {
  try {
    fn();
    process.stdout.write(`PASS ${name}\n`);
  } catch (error) {
    process.stderr.write(`FAIL ${name}\n${error.stack}\n`);
    process.exitCode = 1;
  }
}

run('normalizes referral codes', () => {
  assert.strictEqual(routing.normalizeReferralCode(' masjid sthlm '), 'MASJIDSTHLM');
  assert.strictEqual(routing.normalizeReferralCode('abc_123'), 'ABC_123');
});

run('extracts code from query ref first', () => {
  const code = routing.getReferralCodeFromLocation({
    pathname: '/join/should-not-win',
    search: '?ref=maSjId-01',
  });
  assert.strictEqual(code, 'MASJID-01');
});

run('extracts code from /r/:code path', () => {
  const code = routing.getReferralCodeFromLocation({
    pathname: '/r/masjid%20sthlm',
    search: '',
  });
  assert.strictEqual(code, 'MASJIDSTHLM');
});

run('builds redirect preserving safe query params', () => {
  const url = routing.buildJoinRedirectUrl({
    pathname: '/r/MASJIDSTHLM',
    search: '?utm_source=ig',
  });
  assert.strictEqual(url, '/join?utm_source=ig&ref=MASJIDSTHLM&route=r');
});

run('drops invalid route code from redirect', () => {
  const url = routing.buildJoinRedirectUrl({
    pathname: '/join/%20',
    search: '?utm_source=ig&ref=OLD',
  });
  assert.strictEqual(url, '/join?utm_source=ig');
});

run('prevents invalid loading->loading transition', () => {
  assert.strictEqual(flow.canTransitionReferralState('loading', 'loading'), false);
  assert.strictEqual(flow.canTransitionReferralState('invalid', 'loading'), true);
});

run('blocks lookup while loading', () => {
  assert.strictEqual(flow.shouldStartLookup('loading', 'MASJIDSTHLM'), false);
  assert.strictEqual(flow.shouldStartLookup('missing', ''), false);
  assert.strictEqual(flow.shouldStartLookup('missing', 'MASJIDSTHLM'), true);
});

if (process.exitCode && process.exitCode !== 0) {
  process.exit(process.exitCode);
}

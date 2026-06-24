'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { test } = require('node:test');

const root = path.resolve(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

test('chat island is wired into /ask behind a mount + script', () => {
  const html = read('ask/index.html');
  assert.ok(html.includes('data-nuria-chat'), 'mount element present');
  assert.ok(html.includes('js/nuria-chat.js'), 'island script included');
  // script order: config before the island
  assert.ok(
    html.indexOf('js/site-config.js') < html.indexOf('js/nuria-chat.js'),
    'site-config loads before nuria-chat',
  );
});

test('the partner API key never ships to the browser', () => {
  for (const rel of ['js/nuria-chat.js', 'js/site-config.js']) {
    const src = read(rel).toLowerCase();
    assert.ok(!src.includes('x-nuria-api-key'), `${rel} must not send the partner key header`);
    assert.ok(!src.includes('nuria_api_key'), `${rel} must not reference the secret env name`);
  }
  // The key header belongs ONLY in the server-side Worker.
  assert.ok(
    read('workers/nuria-chat/src/index.js').toLowerCase().includes('x-nuria-api-key'),
    'worker BFF carries the key header',
  );
});

test('chat config exposes a same-origin BFF endpoint, disabled by default', () => {
  const cfg = read('js/site-config.js');
  assert.ok(/chat:\s*{/.test(cfg), 'chat config block present');
  assert.ok(cfg.includes("endpoint: '/api/chat'"), 'same-origin BFF endpoint');
  assert.ok(/enabled:\s*false/.test(cfg), 'chat off by default (launch-gated)');
});

test('island talks to the BFF endpoint, not the upstream API directly', () => {
  const src = read('js/nuria-chat.js');
  assert.ok(!src.includes('api.nuria.one'), 'island must not call the upstream API directly');
  assert.ok(src.includes('ENDPOINT') && src.includes('/api/chat'), 'island posts to the BFF endpoint');
});

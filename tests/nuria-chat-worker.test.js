'use strict';

const assert = require('assert');
const path = require('path');
const { pathToFileURL } = require('url');
const { test } = require('node:test');

const workerUrl = pathToFileURL(
  path.resolve(__dirname, '..', 'workers', 'nuria-chat', 'src', 'index.js'),
).href;

function req(body, headers, method) {
  return new Request('https://nuria.one/api/chat', {
    method: method || 'POST',
    headers: Object.assign({ 'content-type': 'application/json', origin: 'https://nuria.one' }, headers || {}),
    body: body === undefined ? undefined : (typeof body === 'string' ? body : JSON.stringify(body)),
  });
}

test('validateBody enforces the contract', async () => {
  const { validateBody } = await import(workerUrl);

  assert.equal(validateBody(null).ok, false, 'null body rejected');
  assert.equal(validateBody({}).ok, false, 'missing question rejected');
  assert.equal(validateBody({ question: '   ' }).ok, false, 'blank question rejected');
  assert.equal(validateBody([]).ok, false, 'array body rejected');

  const long = 'x'.repeat(5000);
  const v = validateBody({
    question: '  hello  ',
    madhhab: 'hanafi',
    language: 'EN',
    context: '  ctx  ',
    history: Array.from({ length: 25 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: 'm' + i })),
    extra: 'ignored',
  });
  assert.ok(v.ok);
  assert.equal(v.value.question, 'hello', 'trimmed');
  assert.equal(v.value.madhhab, 'hanafi', 'valid madhhab kept');
  assert.equal(v.value.language, 'en', 'language lowercased');
  assert.equal(v.value.history.length, 10, 'history capped to 10');
  assert.equal(v.value.extra, undefined, 'unknown fields dropped');

  assert.equal(validateBody({ question: long }).value.question.length, 4000, 'question capped at 4000');
  assert.equal(validateBody({ question: 'q', madhhab: 'jedi' }).value.madhhab, undefined, 'invalid madhhab dropped');
  assert.equal(validateBody({ question: 'q', language: 'english' }).value.language, undefined, 'bad language dropped');
});

test('isAllowedOrigin guards the BFF', async () => {
  const { isAllowedOrigin } = await import(workerUrl);
  assert.equal(isAllowedOrigin(req({}, { origin: 'https://nuria.one' })), true);
  assert.equal(isAllowedOrigin(req({}, { origin: 'https://www.nuria.one' })), true);
  assert.equal(isAllowedOrigin(req({}, { origin: 'https://evil.example' })), false);
  assert.equal(isAllowedOrigin(req({}, { origin: 'http://localhost:8099' })), false, 'localhost off by default');
  assert.equal(isAllowedOrigin(req({}, { origin: 'http://localhost:8099' }), { allowLocalhost: true }), true);
});

test('fetch handler: method + origin + validation', async () => {
  const worker = (await import(workerUrl)).default;

  const get = await worker.fetch(req(undefined, {}, 'GET'), {});
  assert.equal(get.status, 405, 'GET rejected');

  const bad = await worker.fetch(req({ question: 'hi' }, { origin: 'https://evil.example' }), {});
  assert.equal(bad.status, 403, 'foreign origin rejected');

  const noQ = await worker.fetch(req({ nope: 1 }), {});
  assert.equal(noQ.status, 400, 'missing question rejected');

  const noKey = await worker.fetch(req({ question: 'hi' }), {});
  assert.equal(noKey.status, 503, 'no key + no mock => not_configured');
  const noKeyBody = await noKey.json();
  assert.equal(noKeyBody.error, 'not_configured');
});

test('mock mode returns the documented shape and never leaks a key', async () => {
  const worker = (await import(workerUrl)).default;
  const res = await worker.fetch(req({ question: 'When is Fajr?' }), { NURIA_MOCK: '1', NURIA_API_KEY: 'super-secret-key' });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(typeof data.answer, 'string');
  assert.equal(data.board_reviewed, false);
  assert.ok(Array.isArray(data.sources));
  assert.ok(!JSON.stringify(data).includes('super-secret-key'), 'API key never appears in the response');
});

test('upstream success: key goes up, never comes back; status passes through', async () => {
  const worker = (await import(workerUrl)).default;
  const origFetch = globalThis.fetch;
  const origTimeout = AbortSignal.timeout;
  AbortSignal.timeout = () => new AbortController().signal; // avoid leaving a 60s timer

  let sentHeaders = null;
  let sentBody = null;
  globalThis.fetch = async (url, opts) => {
    sentHeaders = opts.headers;
    sentBody = JSON.parse(opts.body);
    return new Response(
      JSON.stringify({ answer: 'Patience.', sources: [{ type: 'quran', reference: '2:153' }], board_reviewed: false }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
  };
  try {
    const res = await worker.fetch(
      req({ question: 'q', history: Array.from({ length: 30 }, (_, i) => ({ role: 'user', content: 'h' + i })) }),
      { NURIA_API_KEY: 'super-secret-key', NURIA_API_BASE: 'https://api.nuria.one' },
    );
    assert.equal(res.status, 200);
    assert.equal(sentHeaders['x-nuria-api-key'], 'super-secret-key', 'key sent upstream');
    assert.ok(sentBody.history.length <= 10, 'history capped before upstream');
    const data = await res.json();
    assert.equal(data.answer, 'Patience.');
    assert.ok(!JSON.stringify(data).includes('super-secret-key'), 'key never returned to client');
  } finally {
    globalThis.fetch = origFetch;
    AbortSignal.timeout = origTimeout;
  }
});

test('upstream failure maps to 502', async () => {
  const worker = (await import(workerUrl)).default;
  const origFetch = globalThis.fetch;
  const origTimeout = AbortSignal.timeout;
  AbortSignal.timeout = () => new AbortController().signal;
  globalThis.fetch = async () => { throw new Error('boom'); };
  try {
    const res = await worker.fetch(req({ question: 'q' }), { NURIA_API_KEY: 'k' });
    assert.equal(res.status, 502);
    const data = await res.json();
    assert.equal(data.error, 'upstream_unavailable');
  } finally {
    globalThis.fetch = origFetch;
    AbortSignal.timeout = origTimeout;
  }
});

test('per-IP rate limit returns 429 after the cap', async () => {
  const worker = (await import(workerUrl)).default;
  const store = new Map();
  const kv = {
    get: async (k) => (store.has(k) ? store.get(k) : null),
    put: async (k, val) => { store.set(k, val); },
  };
  const env = { NURIA_MOCK: '1', NURIA_RATE_LIMIT_PER_MIN: '3', RATE_LIMIT: kv };
  const headers = { 'cf-connecting-ip': '9.9.9.9' };

  for (let i = 0; i < 3; i++) {
    const ok = await worker.fetch(req({ question: 'q' }, headers), env);
    assert.equal(ok.status, 200, 'within limit #' + i);
  }
  const limited = await worker.fetch(req({ question: 'q' }, headers), env);
  assert.equal(limited.status, 429, 'over limit => 429');
  assert.ok(limited.headers.get('retry-after'), 'retry-after present');
});

test('whole-site daily cap: the trial-period cost backstop', async () => {
  const worker = (await import(workerUrl)).default;
  const origFetch = globalThis.fetch;
  const origTimeout = AbortSignal.timeout;
  AbortSignal.timeout = () => new AbortController().signal;
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ answer: 'a', sources: [], board_reviewed: false }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });

  try {
    const store = new Map();
    const kv = {
      get: async (k) => (store.has(k) ? store.get(k) : null),
      put: async (k, val) => { store.set(k, val); },
    };
    // Distinct IPs so the per-IP limiter never interferes with this test.
    const env = { NURIA_API_KEY: 'k', NURIA_DAILY_REQUEST_CAP: '2', RATE_LIMIT: kv };

    const first = await worker.fetch(req({ question: 'q' }, { 'cf-connecting-ip': '1.1.1.1' }), env);
    assert.equal(first.status, 200, 'request 1 within daily cap');
    const second = await worker.fetch(req({ question: 'q' }, { 'cf-connecting-ip': '2.2.2.2' }), env);
    assert.equal(second.status, 200, 'request 2 within daily cap');

    const third = await worker.fetch(req({ question: 'q' }, { 'cf-connecting-ip': '3.3.3.3' }), env);
    assert.equal(third.status, 429, 'request 3 exceeds the daily cap even from a fresh IP');
    const body = await third.json();
    assert.equal(body.error, 'daily_cap_reached');
    assert.ok(third.headers.get('retry-after'), 'retry-after present');
  } finally {
    globalThis.fetch = origFetch;
    AbortSignal.timeout = origTimeout;
  }
});

test('mock mode never counts against the daily cap', async () => {
  const worker = (await import(workerUrl)).default;
  const store = new Map();
  const kv = {
    get: async (k) => (store.has(k) ? store.get(k) : null),
    put: async (k, val) => { store.set(k, val); },
  };
  const env = { NURIA_MOCK: '1', NURIA_DAILY_REQUEST_CAP: '1', RATE_LIMIT: kv };

  // Five mock requests from distinct IPs, cap set to 1 — all must succeed,
  // since demo/preview traffic must never be blocked by the real-cost cap.
  for (let i = 0; i < 5; i++) {
    const res = await worker.fetch(req({ question: 'q' }, { 'cf-connecting-ip': `4.4.4.${i}` }), env);
    assert.equal(res.status, 200, `mock request ${i} unaffected by daily cap`);
  }
});

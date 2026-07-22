/**
 * Nuria Chat — secure Backend-for-Frontend (BFF)
 * ------------------------------------------------------------------
 * Cloudflare Worker that proxies the site's chat island to the
 * Nuria Intelligence API. The partner API key lives ONLY in a Worker
 * Secret (NURIA_API_KEY) and is never exposed to the browser.
 *
 * Route (production):  nuria.one/api/chat  ->  this Worker
 * Upstream:            POST {NURIA_API_BASE}/v1/ask
 *
 * Secrets / vars:
 *   NURIA_API_KEY              (secret)  partner/demo key — never in code/git
 *   NURIA_API_BASE             (var)     default https://api.nuria.one
 *   NURIA_RATE_LIMIT_PER_MIN   (var)     default 8  (per-IP; conservative for trial)
 *   NURIA_DAILY_REQUEST_CAP    (var)     default 500 (whole-site; the cost backstop)
 *   NURIA_MOCK                 (var)     "1" => return mock answers (pre-launch/dev)
 *   NURIA_ALLOW_LOCALHOST      (var)     "1" => allow localhost origins (dev)
 *   RATE_LIMIT                 (KV)      per-IP limiting + the daily cap counter
 */

const DEFAULT_API_BASE = 'https://api.nuria.one';
const MAX_QUESTION = 4000;
const MAX_CONTEXT = 1000;
const MAX_HISTORY = 10;
const MAX_BODY_BYTES = 24 * 1024; // hard cap on request body
const MADHHABS = new Set(['hanafi', 'maliki', 'shafii', 'hanbali', 'unspecified']);

const ALLOWED_ORIGINS = new Set([
  'https://nuria.one',
  'https://www.nuria.one',
]);

const LOCALHOST_RE = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

function json(data, status = 200, extraHeaders) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'no-referrer',
      ...(extraHeaders || {}),
    },
  });
}

/** Same-origin guard. Returns true if the request originates from an allowed site. */
export function isAllowedOrigin(request, { allowLocalhost = false } = {}) {
  const origin = request.headers.get('origin');
  if (origin) {
    if (ALLOWED_ORIGINS.has(origin)) return true;
    if (allowLocalhost && LOCALHOST_RE.test(origin)) return true;
    return false;
  }
  // No Origin header (e.g. curl, some same-origin requests). Fall back to Referer.
  const referer = request.headers.get('referer') || '';
  if (!referer) return true; // payload + method validation still apply
  try {
    const u = new URL(referer);
    const ref = `${u.protocol}//${u.host}`;
    if (ALLOWED_ORIGINS.has(ref)) return true;
    if (allowLocalhost && LOCALHOST_RE.test(ref)) return true;
  } catch {
    /* ignore malformed referer */
  }
  return false;
}

/** Validate + normalise the request body. Returns {ok, value} or {ok:false, status, error, message}. */
export function validateBody(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, status: 400, error: 'invalid_request', message: 'Body must be a JSON object.' };
  }
  const question = typeof raw.question === 'string' ? raw.question.trim() : '';
  if (!question) {
    return { ok: false, status: 400, error: 'invalid_request', message: 'A question is required.' };
  }
  const value = { question: question.slice(0, MAX_QUESTION) };

  if (typeof raw.madhhab === 'string' && MADHHABS.has(raw.madhhab)) {
    value.madhhab = raw.madhhab;
  }
  if (typeof raw.language === 'string' && /^[a-z]{2}$/i.test(raw.language)) {
    value.language = raw.language.toLowerCase();
  }
  if (typeof raw.context === 'string' && raw.context.trim()) {
    value.context = raw.context.trim().slice(0, MAX_CONTEXT);
  }
  if (Array.isArray(raw.history)) {
    const history = raw.history
      .filter((t) => t && (t.role === 'user' || t.role === 'assistant') && typeof t.content === 'string')
      .slice(-MAX_HISTORY)
      .map((t) => ({ role: t.role, content: t.content.slice(0, MAX_QUESTION) }));
    if (history.length) value.history = history;
  }
  return { ok: true, value };
}

/** Mock response in the documented Nuria Intelligence shape (pre-launch / dev). */
export function mockAnswer(value) {
  return {
    answer:
      `**Preview answer (mock).** You asked: "${value.question}".\n\n` +
      'This is a placeholder in the Nuria Intelligence response format so the chat can be ' +
      'demonstrated before the live, scholar-governed API is connected. At launch this is ' +
      'replaced by a verified, source-grounded answer.',
    sources: [
      { type: 'quran', level: 1, reference: '2:153', text: 'O you who believe, seek help through patience and prayer.', scholar: '' },
    ],
    madhhab_declared: value.madhhab || 'unspecified',
    confidence: 'medium',
    sensitivity: 'routine',
    referral_required: false,
    board_reviewed: false,
    hierarchy_version: 'mock',
    audit_id: 'mock_preview',
  };
}

/**
 * Per-IP fixed-window rate limit backed by a KV namespace.
 * KV is eventually consistent, so this is best-effort abuse mitigation (a small
 * burst may slip through). For strict limits, swap in a Durable Object — see README.
 */
async function rateLimit(env, ip, limitPerMin) {
  const kv = env.RATE_LIMIT;
  if (!kv || !ip) return { ok: true }; // no KV bound (dev) => skip
  const now = Date.now();
  const minute = Math.floor(now / 60000);
  const key = `rl:${ip}:${minute}`;
  let count = 0;
  try {
    const cur = await kv.get(key);
    count = cur ? parseInt(cur, 10) || 0 : 0;
  } catch {
    return { ok: true }; // never let a KV hiccup block legitimate traffic
  }
  if (count >= limitPerMin) {
    return { ok: false, retryAfter: 60 - Math.floor((now % 60000) / 1000) };
  }
  try {
    await kv.put(key, String(count + 1), { expirationTtl: 70 });
  } catch {
    /* best effort */
  }
  return { ok: true };
}

/**
 * Whole-site daily request cap — the cost backstop for the "try it" trial
 * period. Independent of the per-IP limit: a burst spread across many IPs
 * (or a viral moment) would sail past per-IP limiting but not this. Counts
 * only requests that actually reach the upstream LLM (i.e. checked after
 * validation + per-IP limiting), so it tracks real cost exposure, not noise.
 */
async function dailyCapCheck(env, cap) {
  const kv = env.RATE_LIMIT;
  if (!kv) return { ok: true }; // no KV bound (dev) => skip
  const day = new Date().toISOString().slice(0, 10); // YYYY-MM-DD, UTC
  const key = `daily:${day}`;
  let count = 0;
  try {
    const cur = await kv.get(key);
    count = cur ? parseInt(cur, 10) || 0 : 0;
  } catch {
    return { ok: true }; // never let a KV hiccup take the whole site down
  }
  if (count >= cap) {
    return { ok: false };
  }
  try {
    // A day past midnight UTC; a few hours of slack for clock/KV skew.
    await kv.put(key, String(count + 1), { expirationTtl: 26 * 60 * 60 });
  } catch {
    /* best effort */
  }
  return { ok: true };
}

export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return json({ error: 'method_not_allowed', message: 'Use POST.' }, 405, { allow: 'POST' });
    }

    const allowLocalhost = env.NURIA_ALLOW_LOCALHOST === '1' || env.NURIA_MOCK === '1';
    if (!isAllowedOrigin(request, { allowLocalhost })) {
      return json({ error: 'forbidden', message: 'Origin not allowed.' }, 403);
    }

    const rawText = await request.text();
    if (rawText.length > MAX_BODY_BYTES) {
      return json({ error: 'invalid_request', message: 'Request too large.' }, 413);
    }

    let parsed = null;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = null;
    }
    const v = validateBody(parsed);
    if (!v.ok) return json({ error: v.error, message: v.message }, v.status);

    const ip = request.headers.get('cf-connecting-ip') || '';
    const limit = Number(env.NURIA_RATE_LIMIT_PER_MIN) > 0 ? Number(env.NURIA_RATE_LIMIT_PER_MIN) : 8;
    const rl = await rateLimit(env, ip, limit);
    if (!rl.ok) {
      return json(
        { error: 'rate_limited', message: 'Too many messages. Please wait a moment.' },
        429,
        { 'retry-after': String(rl.retryAfter || 30) },
      );
    }

    // Mock mode — pre-launch / local dev. Lets the island be demoed end-to-end
    // without spending any LLM budget or touching the daily cap.
    if (env.NURIA_MOCK === '1') {
      return json(mockAnswer(v.value), 200);
    }

    // Cost backstop for the trial period — checked only for real (non-mock)
    // calls, right before the upstream spend actually happens.
    const dailyCap = Number(env.NURIA_DAILY_REQUEST_CAP) > 0 ? Number(env.NURIA_DAILY_REQUEST_CAP) : 500;
    const daily = await dailyCapCheck(env, dailyCap);
    if (!daily.ok) {
      return json(
        {
          error: 'daily_cap_reached',
          message: "NuriaOne has reached today's preview limit — please try again tomorrow.",
        },
        429,
        { 'retry-after': '3600' },
      );
    }

    const apiKey = env.NURIA_API_KEY;
    if (!apiKey) {
      return json({ error: 'not_configured', message: 'Chat is not configured yet.' }, 503);
    }
    const apiBase = env.NURIA_API_BASE || DEFAULT_API_BASE;

    let upstream;
    try {
      upstream = await fetch(`${apiBase}/v1/ask`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-nuria-api-key': apiKey,
        },
        body: JSON.stringify(v.value),
        signal: AbortSignal.timeout(60000),
      });
    } catch (err) {
      const timedOut = err && (err.name === 'TimeoutError' || err.name === 'AbortError');
      return json(
        {
          error: 'upstream_unavailable',
          message: timedOut
            ? 'The assistant took too long to respond. Please try again.'
            : 'The assistant is unavailable right now. Please try again shortly.',
        },
        502,
      );
    }

    // Re-serialise the documented JSON only — never pass upstream headers or our key through.
    const data = await upstream
      .json()
      .catch(() => ({ error: 'bad_upstream', message: 'Unexpected response from the assistant.' }));
    return json(data, upstream.status);
  },
};

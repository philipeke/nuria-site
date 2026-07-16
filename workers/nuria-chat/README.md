# Nuria Chat — BFF (Cloudflare Worker)

Secure backend-for-frontend for **Nuria Chat**. The browser talks to this Worker at
`nuria.one/api/chat`; the Worker adds the API key and calls the Nuria Intelligence
API (`POST https://api.nuria.one/v1/ask`). **The key never reaches the browser.**

Why a Worker (not a Next.js route): the site is static on GitHub Pages, which cannot run
server-side code. The apex domain is already on Cloudflare, so a Worker is the native,
zero-migration way to hold the secret and proxy the chat.

## What it does

- Accepts `POST /api/chat` only; same-origin guard (Origin/Referer allowlist).
- Validates + caps input: `question` ≤ 4000 chars, `history` ≤ 10 turns, `madhhab` enum,
  `language` ISO-639-1, body ≤ 24 KB.
- Per-IP rate limiting (default 8/min — trial-conservative) via a KV namespace → friendly `429`.
- **Whole-site daily request cap** (default 500/day, UTC) — the real cost backstop: a
  burst spread across many IPs sails past per-IP limiting but not this. Only counts real
  (non-mock) calls, so demo/preview traffic is never blocked by it.
- Injects `X-Nuria-Api-Key` from a Worker Secret; 60 s upstream timeout.
- Maps errors to `{ error, message }` with `400 / 401 / 429 / 502 / 503`.
- Re-serialises only the documented JSON back to the client (no upstream headers, no key).
- Never logs question text.
- `NURIA_MOCK=1` returns answers in the documented shape so the UI can be demoed before
  the live API is connected, and is exempt from the daily cap.

## Local development

```bash
cd workers/nuria-chat
npm install
cp .dev.vars.example .dev.vars      # then edit (or set NURIA_MOCK=1 to skip the real API)
npm run dev                          # wrangler dev → http://localhost:8787
```

Point the site at the local Worker by setting in `js/site-config.js`:
`chat.endpoint = 'http://localhost:8787'` (or run the site behind the same dev proxy).

## Deploy — trial / "try it" launch

No Cloudflare paid plan is needed for this: the Workers **free tier** covers 100,000
requests/day, far above the `NURIA_DAILY_REQUEST_CAP` default. LLM cost is pay-per-use
(no subscription) and is directly bounded by that same cap. Use the **demo API key**
(`nuria_demo_gpt_…`, already issued and separately revocable from partner keys) for
`NURIA_API_KEY` below — never a partner key, for a public trial.

```bash
cd workers/nuria-chat
wrangler login                       # opens a browser — your Cloudflare account

# 1) Rate-limit + daily-cap store
wrangler kv namespace create RATE_LIMIT
#    → paste the printed id into wrangler.toml under [[kv_namespaces]]
#      (uncomment the [[kv_namespaces]] block first)

# 2) API key (server-side only) — use the demo key for this trial period.
#    Retrieve it (never commit the value): the second entry in
#    NURIA_API_KEYS in Secret Manager, project nuria-intelligence:
#      gcloud secrets versions access latest --secret=NURIA_API_KEYS \
#        --project nuria-intelligence
wrangler secret put NURIA_API_KEY
#    paste the demo key value at the prompt

# 3) Ship — the route (nuria.one/api/chat) is already uncommented in wrangler.toml
wrangler deploy
```

Then flip the site flag (already done in this repo — see below) and it's live.

## Enable the chat on the site

Set in `js/site-config.js`:

```js
chat: { enabled: true, endpoint: '/api/chat' }
```

While the GIFS scholar board has not signed (`board_reviewed=false`), the UI shows a
**"Preview — not yet scholar-certified"** banner automatically, and every answer that
comes from the interim product-reviewed template cache or from live generation carries
the same honest, per-entry `board_reviewed` flag from the API — never a blanket claim.

## Environment

| Name | Type | Default | Notes |
|---|---|---|---|
| `NURIA_API_KEY` | secret | — | API key. `wrangler secret put`. Use the demo key for trial; never in code/git. |
| `NURIA_API_BASE` | var | `https://api.nuria.one` | Upstream base. |
| `NURIA_RATE_LIMIT_PER_MIN` | var | `8` | Per-IP limit. Raise once real usage is known. |
| `NURIA_DAILY_REQUEST_CAP` | var | `500` | Whole-site cap per UTC day — the cost backstop. |
| `NURIA_MOCK` | var | — | `1` ⇒ mock answers (pre-launch / dev); exempt from the daily cap. |
| `NURIA_ALLOW_LOCALHOST` | var | — | `1` ⇒ allow localhost origins (dev). |
| `RATE_LIMIT` | KV | — | KV namespace backing both the per-IP limit and the daily cap. Omit ⇒ both skipped (fail-open). |

## Cost visibility while the cap is active

If the daily cap is being hit regularly, that's a real "raise it" signal, not a bug —
check `wrangler tail` or the Workers dashboard for `daily_cap_reached` responses, then
raise `NURIA_DAILY_REQUEST_CAP` in `wrangler.toml` and redeploy.

## Notes

- KV rate limiting is best-effort (eventually consistent). For strict guarantees use a
  Durable Object keyed by IP; `rateLimit()` / `dailyCapCheck()` are the swap points.
- Streaming-ready: the API returns a single JSON today. When an SSE endpoint exists, the
  Worker can stream chunks through and the island's render path already appends.

# Nuria Chat — BFF (Cloudflare Worker)

Secure backend-for-frontend for **Nuria Chat**. The browser talks to this Worker at
`nuria.one/api/chat`; the Worker adds the partner key and calls the Nuria Intelligence
API (`POST https://api.nuria.one/v1/ask`). **The partner key never reaches the browser.**

Why a Worker (not a Next.js route): the site is static on GitHub Pages, which cannot run
server-side code. The apex domain is already on Cloudflare, so a Worker is the native,
zero-migration way to hold the secret and proxy the chat.

## What it does

- Accepts `POST /api/chat` only; same-origin guard (Origin/Referer allowlist).
- Validates + caps input: `question` ≤ 4000 chars, `history` ≤ 10 turns, `madhhab` enum,
  `language` ISO-639-1, body ≤ 24 KB.
- Per-IP rate limiting (default 20/min) via a KV namespace → friendly `429`.
- Injects `X-Nuria-Api-Key` from a Worker Secret; 60 s upstream timeout.
- Maps errors to `{ error, message }` with `400 / 401 / 429 / 502 / 503`.
- Re-serialises only the documented JSON back to the client (no upstream headers, no key).
- Never logs question text.
- `NURIA_MOCK=1` returns answers in the documented shape so the UI can be demoed before
  the live API is connected.

## Local development

```bash
cd workers/nuria-chat
npm install
cp .dev.vars.example .dev.vars      # then edit (or set NURIA_MOCK=1 to skip the real API)
npm run dev                          # wrangler dev → http://localhost:8787
```

Point the site at the local Worker by setting in `js/site-config.js`:
`chat.endpoint = 'http://localhost:8787'` (or run the site behind the same dev proxy).

## Deploy (at launch)

```bash
cd workers/nuria-chat
wrangler login

# 1) Rate-limit store
wrangler kv namespace create RATE_LIMIT
#    → paste the printed id into wrangler.toml under [[kv_namespaces]]

# 2) Partner key (server-side only)
wrangler secret put NURIA_API_KEY

# 3) Route: uncomment the [routes] block in wrangler.toml (nuria.one/api/chat)

# 4) Ship
wrangler deploy
```

## Enable the chat on the site

The chat island on `/ask` is **off by default**. To turn it on, set in
`js/site-config.js`:

```js
chat: { enabled: true, endpoint: '/api/chat' }
```

While the GIFS scholar board has not signed (`board_reviewed=false`), the UI shows a
**"Preview — not yet scholar-certified"** banner automatically.

## Environment

| Name | Type | Default | Notes |
|---|---|---|---|
| `NURIA_API_KEY` | secret | — | Partner key. `wrangler secret put`. Never in code/git. |
| `NURIA_API_BASE` | var | `https://api.nuria.one` | Upstream base. |
| `NURIA_RATE_LIMIT_PER_MIN` | var | `20` | Per-IP limit. |
| `NURIA_MOCK` | var | — | `1` ⇒ mock answers (pre-launch / dev). |
| `NURIA_ALLOW_LOCALHOST` | var | — | `1` ⇒ allow localhost origins (dev). |
| `RATE_LIMIT` | KV | — | KV namespace for rate limiting. Omit ⇒ limiting skipped. |

## Notes

- KV rate limiting is best-effort (eventually consistent). For strict guarantees use a
  Durable Object keyed by IP; the `rateLimit()` function is the only swap point.
- Streaming-ready: the API returns a single JSON today. When an SSE endpoint exists, the
  Worker can stream chunks through and the island's render path already appends.

# Affiliate partner web portal access (`portalWebAccessEnabled`)

The public site partner dashboard (`/nuria-partner/`) calls `getAffiliatePartnerPortalWeb` (or `getAffiliatePartnerPortal`) after Firebase Auth sign-in. This document defines the **partner document field** and **server rules** the Nuria backend should implement so admins can approve web login from Affiliate Admin.

## Partner document field

On the same document you already upsert via `upsertAffiliatePartnerAdmin`, persist a boolean:

| Field | Type | Meaning |
|-------|------|---------|
| `portalWebAccessEnabled` | `boolean` | When `true`, the linked Nuria account (`portalUid` / `portalEmail`) may load the web partner portal. When `false` or missing, deny with a clear error. |

### Recommended defaults

- On **create** or when partner email is first set: default `portalWebAccessEnabled` to `false` unless the admin payload sets it.
- When **partner email is cleared** (`portalEmail` / `portalUid` removed): set `portalWebAccessEnabled` to `false`.

The static admin UI (`js/affiliate-admin.js`) sends `portalWebAccessEnabled` on every `upsertAffiliatePartnerAdmin` call (derived in `affiliate-partner-registry.js`).

## `upsertAffiliatePartnerAdmin`

- Accept `portalWebAccessEnabled` in the request body.
- Store it on the partner record alongside `portalEmail`, `portalUid`, `affiliateId`, etc.
- Do not trust the client for admin role checks; only affiliate admins may call this.

## `getAffiliatePartnerPortalWeb` / `getAffiliatePartnerPortal`

After authenticating the caller:

1. Resolve partner rows linked to `context.auth.uid` and/or verified email (existing logic).
2. For each candidate partner, require **`portalWebAccessEnabled === true`**.
3. If the user is authenticated and matches a partner row by UID/email but the flag is false or missing, return **`permission-denied`** with message containing:

   `portal_web_access_disabled`

   (The web client surfaces this to the partner.)

4. If no partner matches or flag off, you may use the same error or a generic `permission-denied` with `not_linked`; the site already handles `not_linked`-style cases.

## Optional audit

Log when `portalWebAccessEnabled` changes (admin email, partner id, timestamp) for support and compliance.

## Deploy checklist

1. Extend partner schema / upsert callable to read/write `portalWebAccessEnabled`.
2. Enforce the flag in the partner portal **get** callable before returning stats.
3. Deploy functions.
4. In Affiliate Admin → edit code → set partner email → **Enable web portal login**.
5. Sign in as that partner on `/nuria-partner/` and confirm data loads.

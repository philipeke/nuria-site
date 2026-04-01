# Affiliate Admin Partner Verification Callable Spec

This document defines the exact callable contract for partner account verification in Affiliate Admin.

The frontend currently calls:

- `lookupNuriaPartnerByEmailAdmin` (preferred)
- `findNuriaPartnerByEmailAdmin` (legacy alias)

If your backend implements `lookupNuriaPartnerByEmailAdmin` with this contract, verification will use your exact user collection and will not rely on broad client-side fallback probing.

## Goal

- Verify that a partner email belongs to a real Nuria account.
- Return canonical user identity fields (`uid`, `email`, `displayName`) in a stable format.
- Enforce affiliate-admin authorization on every lookup.

## Callable Name

- Primary: `lookupNuriaPartnerByEmailAdmin`
- Optional alias (temporary): `findNuriaPartnerByEmailAdmin`

## Request Contract

```json
{
  "email": "partner@example.com"
}
```

### Validation Rules

- `email` is required
- normalize using `trim().toLowerCase()`
- validate as RFC-like email format before querying
- reject empty/invalid inputs with `invalid-argument`

## Response Contract

Always return HTTP 200 at callable level for successful execution, and encode lookup result in the payload:

```json
{
  "found": true,
  "uid": "firebase-uid",
  "email": "partner@example.com",
  "displayName": "Partner Name",
  "source": "users_exact"
}
```

When no user is found:

```json
{
  "found": false,
  "email": "partner@example.com",
  "source": "users_exact"
}
```

### Response Fields

- `found`: boolean (required)
- `uid`: string (required when `found=true`)
- `email`: string (required; normalized canonical email if available)
- `displayName`: string (optional, return `""` if unknown)
- `source`: string (required; recommended fixed value: `users_exact`)

## Error Contract

Use Firebase callable `HttpsError` codes:

- `unauthenticated`: user not signed in
- `permission-denied`: signed in but not affiliate admin
- `invalid-argument`: missing/invalid email
- `internal`: unexpected backend error

Recommended `message` values (stable machine-friendly):

- `admin_access_required`
- `admin_role_required`
- `invalid_email`
- `partner_lookup_failed`

## Authorization Requirements

Before any lookup:

1. Require `context.auth.uid`
2. Verify admin access using trusted backend source (for example `admin_users/{uid}` and role contains `affiliate_admin`)
3. Deny by default when checks fail

Do not trust any admin/role fields from client payload.

## Data Source Requirements (Exact Collection)

Use your canonical Nuria user collection only (example: `users/{uid}`).

Recommended lookup order:

1. exact match on normalized email field (for example `email_lc`)
2. exact match on `email` (if normalized mirror not available)

Avoid partial matches and avoid client-controlled fallback collections in backend.

## Recommended User Document Shape

Example user document fields used by this callable:

```json
{
  "uid": "firebase-uid",
  "email": "partner@example.com",
  "email_lc": "partner@example.com",
  "displayName": "Partner Name",
  "disabled": false
}
```

If `disabled=true`, you may either:

- return `found=false` (strict active-only behavior), or
- return `found=true` with `source: "users_exact_disabled"` and let frontend mark as unverified

Pick one behavior and keep it consistent.

## Node.js Callable Skeleton (Admin SDK)

```js
exports.lookupNuriaPartnerByEmailAdmin = functions.https.onCall(async (data, context) => {
  if (!context.auth?.uid) {
    throw new functions.https.HttpsError('unauthenticated', 'admin_access_required');
  }

  const isAffiliateAdmin = await checkAffiliateAdminRole(context.auth.uid); // backend trusted check
  if (!isAffiliateAdmin) {
    throw new functions.https.HttpsError('permission-denied', 'admin_role_required');
  }

  const normalizedEmail = String(data?.email || '').trim().toLowerCase();
  if (!isValidEmail(normalizedEmail)) {
    throw new functions.https.HttpsError('invalid-argument', 'invalid_email');
  }

  try {
    const userSnap = await admin.firestore()
      .collection('users')
      .where('email_lc', '==', normalizedEmail)
      .limit(1)
      .get();

    if (userSnap.empty) {
      return {
        found: false,
        email: normalizedEmail,
        source: 'users_exact',
      };
    }

    const doc = userSnap.docs[0];
    const row = doc.data() || {};
    return {
      found: true,
      uid: row.uid || doc.id,
      email: String(row.email || normalizedEmail).trim().toLowerCase(),
      displayName: String(row.displayName || row.name || '').trim(),
      source: 'users_exact',
    };
  } catch (error) {
    throw new functions.https.HttpsError('internal', 'partner_lookup_failed');
  }
});
```

## Compatibility Notes With Current Frontend

Frontend code in `js/firebase-client.js` expects this shape and currently calls:

- `lookupNuriaPartnerByEmailAdmin`
- fallback alias `findNuriaPartnerByEmailAdmin`

If this callable is present and compliance mode is `callable_only`, no direct client-side Firestore probing is used for verification.

## Test Cases (Backend)

1. Admin user + existing email -> `found=true`, valid `uid`
2. Admin user + unknown email -> `found=false`
3. Signed out user -> `unauthenticated`
4. Non-admin user -> `permission-denied`
5. Invalid email input -> `invalid-argument`
6. Firestore failure -> `internal`

## Optional Next Step (Bulk Re-verify)

If needed for faster admin settings sync, add:

- `reverifyNuriaPartnersByCodeAdmin`

Request:

```json
{
  "byCode": {
    "DANIA": "partner@example.com"
  }
}
```

Response:

```json
{
  "results": {
    "DANIA": {
      "found": true,
      "uid": "firebase-uid",
      "email": "partner@example.com",
      "displayName": "Partner Name",
      "source": "users_exact"
    }
  }
}
```

This is optional; current frontend works with single-email lookup callable.

## Drop-In Reference Implementation

This repo includes a ready Firebase Functions v2 TypeScript example:

- `docs/backend/lookupNuriaPartnerByEmailAdmin.functions-v2.ts`
- `docs/backend/partner-lookup-implementation-notes.md`


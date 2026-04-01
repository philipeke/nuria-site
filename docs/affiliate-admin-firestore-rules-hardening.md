# Affiliate Admin Firestore Rules Hardening

This document defines the Firestore security posture for affiliate admin production compliance.

## Compliance Objective

- Frontend should not write sensitive admin audit/settings directly in production.
- Sensitive writes must go through backend callables with role checks.
- Firestore rules should enforce read-only or deny-all for those collections from client SDK.

## Frontend Mode

`js/site-config.js` now sets:

- `affiliateAdminComplianceMode: "callable_only"`

In this mode, the frontend expects backend callables for:

- `writeAffiliateAdminAuditLog` (or legacy `addAffiliateAdminAuditLog`)
- `listAffiliateAdminAuditLogs`
- `getAffiliateAdminSettings`
- `setAffiliateAdminSettings` (or legacy `setAffiliateReportRecipientsAdmin`)
- `lookupNuriaPartnerByEmailAdmin` (or legacy `findNuriaPartnerByEmailAdmin`)

If missing, UI shows actionable compliance warnings.

Partner lookup callable contract is defined in:

- `docs/affiliate-admin-partner-verification-callable-spec.md`

## Firestore Paths Impacted

- `internal_admin_affiliate_audit_logs/*`
- `internal_admin/affiliate_admin_settings`
- `internal_admin_affiliate_scheduler_runs/*` (backend scheduler state)

## Recommended Firestore Rules (Production)

```rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() {
      return request.auth != null;
    }

    // Optional helper if you mirror role in custom claims.
    function hasAffiliateAdminClaim() {
      return isSignedIn() && request.auth.token.affiliate_admin == true;
    }

    // Default deny for sensitive internal collections from client SDK.
    match /internal_admin_affiliate_audit_logs/{docId} {
      allow read, write: if false;
    }

    match /internal_admin_affiliate_scheduler_runs/{docId} {
      allow read, write: if false;
    }

    match /internal_admin/{docId} {
      // Keep settings inaccessible from client SDK in strict mode.
      allow read, write: if false;
    }

    // Add your existing app rules below...
  }
}
```

## Why deny from client?

- Prevent privilege escalation from tampered browser clients.
- Ensure every sensitive write passes backend authorization + validation.
- Preserve immutable audit trail quality.

## Backend Responsibility

Backend callable must:

- verify Firebase Auth user
- verify `affiliate_admin` role via trusted source (admin doc/claims)
- sanitize inputs
- add server timestamps (`serverTimestamp()`)
- write to Firestore using Admin SDK

## Rollout Plan

1. Deploy callables listed above.
2. Validate admin UI end-to-end in staging.
3. Enable strict rules for the affected collections.
4. Monitor logs for `permission-denied` and callable errors.
5. Keep emergency rollback file for rules.

## Quick Verification

- Add recipient in UI -> success via callable.
- Refresh backend audit log -> returns server entries.
- Attempt direct Firestore write from browser console -> denied.
- Scheduler run writes to `internal_admin_affiliate_scheduler_runs` via Admin SDK.

# Affiliate Admin Backend Scheduler Spec

This document defines an implementation-ready backend contract for scheduled monthly affiliate reports and server-side audit logging used by `/internal/affiliate-admin/`.

## Goals

- Send monthly payout report emails automatically to configured recipients.
- Keep admin actions auditable across all operators (not browser-local only).
- Make scheduled jobs idempotent and safe to rerun.
- Keep compatibility with current frontend UI and existing Nuria callables.

## Existing Frontend Dependencies

The current admin UI reads/writes:

- Firestore settings doc: `internal_admin/affiliate_admin_settings`
  - field: `monthlyReportRecipients: string[]`
- Firestore audit collection: `internal_admin_affiliate_audit_logs`

The UI also calls these existing callables:

- `generateAffiliateMonthlyPayoutReportManual`
- `listAffiliatePayoutReportsAdmin`
- `getAffiliatePayoutReportAdmin`
- `markAffiliatePayoutReportPaidAdmin`

## Recommended Backend Architecture

- Firebase Functions v2 (`onCall`, `onSchedule`)
- Firestore as source of truth for settings and audit
- Email provider adapter (Postmark/SendGrid/Resend)
- Cloud Scheduler + Pub/Sub for monthly automation

## New Backend APIs to Add

### 1) Callable: `setAffiliateReportRecipientsAdmin`

Purpose: securely update scheduled recipients using backend authorization checks.

Input:

```json
{
  "emails": ["finance@company.com", "ops@company.com"]
}
```

Output:

```json
{
  "ok": true,
  "count": 2
}
```

Validation:

- requester must be admin with `affiliate_admin` role
- max recipients: 30
- each email must be valid, normalized lowercase
- dedupe before save

Write target:

- `internal_admin/affiliate_admin_settings.monthlyReportRecipients`
- `internal_admin/affiliate_admin_settings.updatedAt`
- `internal_admin/affiliate_admin_settings.updatedBy`

---

### 2) Callable: `listAffiliateAdminAuditLogs`

Purpose: return server-side audit feed with proper auth checks.

Input:

```json
{ "limit": 100 }
```

Output:

```json
{
  "items": [
    {
      "id": "abc123",
      "message": "Generated payout report 2026-03",
      "kind": "success",
      "actor": "admin@oakdev.app",
      "actorUid": "uid123",
      "periodMonth": "2026-03",
      "reportId": "report_2026_03",
      "createdAtIso": "2026-03-31T20:12:00.000Z"
    }
  ]
}
```

Validation:

- requester must be admin
- enforce `limit <= 200`

---

### 3) Scheduled job: `scheduleAffiliateMonthlyPayoutReports`

Purpose: monthly automated generation + email dispatch.

Recommended schedule:

- `0 6 1 * *` in UTC (first day of month, 06:00 UTC)

Flow:

1. Resolve target month (previous month).
2. Read recipients from `internal_admin/affiliate_admin_settings.monthlyReportRecipients`.
3. If no recipients, write warning audit log and exit gracefully.
4. Generate payout report by invoking existing internal service used by `generateAffiliateMonthlyPayoutReportManual`.
5. Fetch report summary + optional CSV attachment payload.
6. Send email to recipients.
7. Write success/failure audit entry.
8. Write idempotency marker to prevent duplicate sends for same month.

## Firestore Schema Additions

### Settings doc (existing, extend)

Document: `internal_admin/affiliate_admin_settings`

```json
{
  "monthlyReportRecipients": ["finance@company.com"],
  "schedulerEnabled": true,
  "schedulerTimezone": "UTC",
  "updatedAt": "<serverTimestamp>",
  "updatedBy": "admin@oakdev.app"
}
```

### Scheduler runs (new)

Collection: `internal_admin_affiliate_scheduler_runs`

Document ID: `<periodMonth>` (example: `2026-03`)

```json
{
  "periodMonth": "2026-03",
  "status": "sent",
  "reportId": "report_2026_03",
  "recipientCount": 2,
  "error": null,
  "startedAt": "<serverTimestamp>",
  "finishedAt": "<serverTimestamp>"
}
```

Use this doc as idempotency lock:

- if status is `sent`, skip duplicate job execution
- if status is `running` older than timeout, recover safely

### Audit logs (existing)

Collection: `internal_admin_affiliate_audit_logs`

Required fields:

- `message`, `kind`, `actor`, `actorUid`, `periodMonth`, `reportId`, `createdAt`

## Security and Authorization

- Never trust client role claims alone.
- Reuse same server auth helper as other affiliate admin callables.
- Permit direct Firestore writes only if strictly required; prefer callable writes for settings and audit.
- Reject non-admin calls with `permission-denied`.

## Observability

- Structured logs for each run: month, reportId, recipients, duration, result.
- Emit counters:
  - `affiliate_scheduler_runs_total`
  - `affiliate_scheduler_runs_failed`
  - `affiliate_scheduler_email_sent_total`

## Failure Strategy

- Email provider failure:
  - mark run as `failed`
  - include provider error code/message
  - keep report generated (no data loss)
- Partial recipient failure:
  - retry failed subset once
  - include failed addresses in audit log

## Suggested TypeScript Skeleton (Functions v2)

```ts
export const scheduleAffiliateMonthlyPayoutReports = onSchedule(
  { schedule: "0 6 1 * *", timeZone: "UTC", region: "us-central1" },
  async () => {
    const periodMonth = getPreviousUtcMonth();
    const runRef = db.collection("internal_admin_affiliate_scheduler_runs").doc(periodMonth);

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(runRef);
      const data = snap.data();
      if (data?.status === "sent") throw new Error("already_sent");
      tx.set(runRef, { periodMonth, status: "running", startedAt: FieldValue.serverTimestamp() }, { merge: true });
    });

    const settings = (await db.doc("internal_admin/affiliate_admin_settings").get()).data() ?? {};
    const recipients: string[] = normalizeRecipients(settings.monthlyReportRecipients ?? []);
    if (!recipients.length) {
      await writeAudit("No recipients configured for scheduled monthly report", "warning", periodMonth);
      await runRef.set({ status: "skipped_no_recipients", finishedAt: FieldValue.serverTimestamp() }, { merge: true });
      return;
    }

    const report = await generateMonthlyAffiliateReport(periodMonth); // reuse existing internal service
    await sendMonthlyAffiliateReportEmail({ recipients, report, periodMonth });
    await writeAudit(`Scheduled monthly report sent for ${periodMonth}`, "success", periodMonth, report.reportId);
    await runRef.set({ status: "sent", reportId: report.reportId, recipientCount: recipients.length, finishedAt: FieldValue.serverTimestamp() }, { merge: true });
  }
);
```

## Manual QA Checklist (Backend)

- Add recipient in admin UI -> verify doc updates.
- Trigger scheduler manually for test month.
- Confirm report generated once.
- Confirm email received by all recipients.
- Confirm audit log has success entry.
- Re-run same month -> confirm idempotent skip.

## Migration Note

Current frontend can write settings/audit directly to Firestore. For stronger compliance, move writes behind the new callable APIs and restrict direct writes in Firestore rules after backend rollout.

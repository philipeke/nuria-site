# Partner Lookup Implementation Notes

Use this together with:

- `docs/affiliate-admin-partner-verification-callable-spec.md`
- `docs/backend/lookupNuriaPartnerByEmailAdmin.functions-v2.ts`

## Integration Steps (Backend Repo)

1. Copy `lookupNuriaPartnerByEmailAdmin.functions-v2.ts` into your Firebase Functions source folder.
2. Update constants at top of file:
   - `USER_COLLECTION`
   - `USER_EMAIL_LOWER_FIELD`
   - `USER_EMAIL_RAW_FIELD`
3. Export function from your backend entrypoint (`src/index.ts`), for example:

```ts
export {
  lookupNuriaPartnerByEmailAdmin,
  findNuriaPartnerByEmailAdmin,
} from './lookupNuriaPartnerByEmailAdmin.functions-v2';
```

### Copy/paste variants for `src/index.ts`

If your index file already has many exports, add only this block near your other callable exports:

```ts
export {
  lookupNuriaPartnerByEmailAdmin,
  findNuriaPartnerByEmailAdmin,
} from './lookupNuriaPartnerByEmailAdmin.functions-v2';
```

If your project uses a grouped namespace object pattern, use:

```ts
import {
  lookupNuriaPartnerByEmailAdmin,
  findNuriaPartnerByEmailAdmin,
} from './lookupNuriaPartnerByEmailAdmin.functions-v2';

export const affiliateAdmin = {
  lookupNuriaPartnerByEmailAdmin,
  findNuriaPartnerByEmailAdmin,
};
```

4. Deploy functions.
5. Verify from admin UI by creating/editing a code and entering `Partner Nuria email`.
6. Run "Re-verify linked partners" in Admin settings.

## Deploy Commands

From your backend repo:

```bash
npm run build
firebase deploy --only functions:lookupNuriaPartnerByEmailAdmin,functions:findNuriaPartnerByEmailAdmin
```

If you deploy all functions as normal:

```bash
firebase deploy --only functions
```

## Smoke Test (Post-deploy)

1. Open `/internal/affiliate-admin/`.
2. Go to `Affiliate codes`.
3. Create/edit code and set `Partner Nuria email`.
4. Save -> verify status in partner registry becomes `verified` for known email.
5. Click `Re-verify linked partners` in `Settings`.
6. Confirm no permission errors and `uid/displayName` are populated.

## Expected Frontend Behavior After Deploy

- UI will call `lookupNuriaPartnerByEmailAdmin` first.
- On success, partner status becomes `verified` with returned `uid` and `displayName`.
- Legacy alias `findNuriaPartnerByEmailAdmin` remains supported.

## Security Checklist

- callable rejects non-authenticated users
- callable rejects non-`affiliate_admin` users
- role check is performed server-side against trusted source
- only exact email matches are returned
- no client payload can bypass role checks


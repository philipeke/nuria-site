'use strict';

const assert = require('assert');
const registry = require('../js/affiliate-partner-registry.js');

function run(name, fn) {
  try {
    fn();
    process.stdout.write(`PASS ${name}\n`);
  } catch (error) {
    process.stderr.write(`FAIL ${name}\n${error.stack}\n`);
    process.exitCode = 1;
  }
}

run('normalizes partner docs from callable payloads', () => {
  const item = registry.normalizePartnerDoc({
    affiliateId: ' masjid_stockholm ',
    displayName: ' Masjid Stockholm ',
    status: 'INACTIVE',
    primaryReferralCode: ' masjid sthlm ',
    contactEmail: 'Partner@Example.com',
    portalEmail: 'Portal@Example.com',
    portalUid: ' uid_123 ',
    note: ' Important ',
  });

  assert.deepStrictEqual(item, {
    affiliateId: 'masjid_stockholm',
    displayName: 'Masjid Stockholm',
    status: 'inactive',
    primaryReferralCode: 'MASJIDSTHLM',
    contactName: null,
    contactEmail: 'partner@example.com',
    portalUid: 'uid_123',
    portalEmail: 'portal@example.com',
    note: 'Important',
    updatedAt: null,
    updatedByEmail: null,
  });
});

run('matches partner by affiliate id before referral code', () => {
  const partner = registry.findPartnerForCode(
    { affiliateId: 'masjid_stockholm', code: 'masjid-main' },
    [
      { affiliateId: 'masjid_stockholm', primaryReferralCode: 'OTHER_CODE' },
      { affiliateId: 'other_partner', primaryReferralCode: 'MASJID-MAIN' },
    ]
  );

  assert.strictEqual(partner.affiliateId, 'masjid_stockholm');
  assert.strictEqual(partner.primaryReferralCode, 'OTHER_CODE');
});

run('falls back to matching partner by primary referral code', () => {
  const partner = registry.findPartnerForCode(
    { code: ' masjid-main ' },
    [
      { affiliateId: 'other_partner', primaryReferralCode: 'MASJID-MAIN' },
    ]
  );

  assert.strictEqual(partner.affiliateId, 'other_partner');
});

run('builds partner upsert payload with verified portal uid when lookup succeeds', () => {
  const payload = registry.buildPartnerUpsertPayload({
    codeItem: {
      code: ' masjid sthlm ',
      affiliateId: 'masjid_stockholm',
      displayName: 'Masjid Stockholm',
      status: 'active',
    },
    existingPartner: {
      affiliateId: 'masjid_stockholm',
      status: 'inactive',
      contactName: 'Partner Lead',
      note: 'VIP partner',
    },
    partnerEmail: 'PARTNER@EXAMPLE.COM',
    lookupResult: {
      found: true,
      uid: 'uid_123',
      email: 'partner@example.com',
    },
  });

  assert.deepStrictEqual(payload, {
    affiliateId: 'masjid_stockholm',
    displayName: 'Masjid Stockholm',
    status: 'inactive',
    primaryReferralCode: 'MASJIDSTHLM',
    contactName: 'Partner Lead',
    contactEmail: 'partner@example.com',
    portalUid: 'uid_123',
    portalEmail: 'partner@example.com',
    note: 'VIP partner',
  });
});

run('clears portal fields when partner email is removed but preserves contact info', () => {
  const payload = registry.buildPartnerUpsertPayload({
    codeItem: {
      code: 'MASJIDSTHLM',
      affiliateId: 'masjid_stockholm',
      displayName: 'Masjid Stockholm',
    },
    existingPartner: {
      affiliateId: 'masjid_stockholm',
      displayName: 'Masjid Stockholm',
      contactEmail: 'contact@example.com',
      portalEmail: 'partner@example.com',
      portalUid: 'uid_123',
      note: 'Keep this note',
    },
    partnerEmail: '',
  });

  assert.strictEqual(payload.contactEmail, 'contact@example.com');
  assert.strictEqual(payload.portalEmail, null);
  assert.strictEqual(payload.portalUid, null);
  assert.strictEqual(payload.note, 'Keep this note');
});

run('preserves existing uid on transient lookup failure for the same email', () => {
  const payload = registry.buildPartnerUpsertPayload({
    codeItem: {
      code: 'MASJIDSTHLM',
      affiliateId: 'masjid_stockholm',
    },
    existingPartner: {
      affiliateId: 'masjid_stockholm',
      portalEmail: 'partner@example.com',
      portalUid: 'uid_123',
    },
    partnerEmail: 'partner@example.com',
    lookupFailed: true,
  });

  assert.strictEqual(payload.portalUid, 'uid_123');
  assert.strictEqual(payload.portalEmail, 'partner@example.com');
});

run('builds merged registry rows from partner docs and legacy billing profile data', () => {
  const items = registry.buildPartnerRegistryItems({
    codes: [
      {
        code: 'MASJIDSTHLM',
        affiliateId: 'masjid_stockholm',
        displayName: 'Masjid Stockholm',
      },
    ],
    partners: [
      {
        affiliateId: 'masjid_stockholm',
        displayName: 'Masjid Stockholm',
        status: 'active',
        primaryReferralCode: 'MASJIDSTHLM',
        portalEmail: 'partner@example.com',
        portalUid: 'uid_123',
        updatedByEmail: 'admin@oakdev.app',
        updatedAt: { iso: '2026-04-06T10:00:00.000Z', ms: 1775469600000 },
      },
    ],
    legacyPartnerProfilesByCode: {
      MASJIDSTHLM: {
        partnerType: 'company',
        country: 'SE',
        vat: 'SE123456789001',
      },
    },
  });

  assert.strictEqual(items.length, 1);
  assert.strictEqual(items[0].status, 'verified');
  assert.strictEqual(items[0].email, 'partner@example.com');
  assert.strictEqual(items[0].partnerType, 'company');
  assert.strictEqual(items[0].country, 'SE');
  assert.strictEqual(items[0].updatedByEmail, 'admin@oakdev.app');
});

run('includes standalone partner docs even before a code row is present', () => {
  const items = registry.buildPartnerRegistryItems({
    partners: [
      {
        affiliateId: 'solo_partner',
        displayName: 'Solo Partner',
        primaryReferralCode: 'SOLO1',
        portalEmail: 'solo@example.com',
      },
    ],
  });

  assert.strictEqual(items.length, 1);
  assert.strictEqual(items[0].affiliateId, 'solo_partner');
  assert.strictEqual(items[0].code, 'SOLO1');
});

run('falls back to legacy email mappings when partner doc is still missing', () => {
  const items = registry.buildPartnerRegistryItems({
    codes: [
      {
        code: 'LEGACY1',
        affiliateId: 'legacy_partner',
        displayName: 'Legacy Partner',
      },
    ],
    legacyEmailsByCode: {
      LEGACY1: 'legacy@example.com',
    },
    legacyPartnerRegistryByCode: {
      LEGACY1: {
        status: 'lookup_error',
        statusReason: 'network_timeout',
      },
    },
  });

  assert.strictEqual(items.length, 1);
  assert.strictEqual(items[0].email, 'legacy@example.com');
  assert.strictEqual(items[0].status, 'lookup_error');
  assert.strictEqual(items[0].statusReason, 'network_timeout');
});

if (process.exitCode && process.exitCode !== 0) {
  process.exit(process.exitCode);
}

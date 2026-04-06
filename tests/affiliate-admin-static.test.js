'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

function run(name, fn) {
  try {
    fn();
    process.stdout.write(`PASS ${name}\n`);
  } catch (error) {
    process.stderr.write(`FAIL ${name}\n${error.stack}\n`);
    process.exitCode = 1;
  }
}

const repoRoot = path.resolve(__dirname, '..');
const affiliateAdminScript = fs.readFileSync(
  path.join(repoRoot, 'js', 'affiliate-admin.js'),
  'utf8'
);
const affiliateAdminHtml = fs.readFileSync(
  path.join(repoRoot, 'internal', 'affiliate-admin', 'index.html'),
  'utf8'
);

run('loads partner registry helper script before the admin module', () => {
  assert(affiliateAdminHtml.includes('../../js/affiliate-partner-registry.js'));
  assert(affiliateAdminHtml.includes('../../js/affiliate-admin.js'));
});

run('site admin fetches partners from the secure affiliate registry callable', () => {
  assert(affiliateAdminScript.includes("callFirebaseFunction('listAffiliatePartnersAdmin'"));
  assert(affiliateAdminScript.includes('state.partners = normalizePartnerListValue'));
});

run('site admin persists partner linkage through the partner upsert callable', () => {
  assert(affiliateAdminScript.includes("callFirebaseFunction('upsertAffiliatePartnerAdmin'"));
  assert(affiliateAdminScript.includes('buildPartnerUpsertPayloadForCode'));
});

run('settings copy explains that partner registry is backend-driven', () => {
  assert(affiliateAdminHtml.includes('secure affiliate partner registry'));
});

if (process.exitCode && process.exitCode !== 0) {
  process.exit(process.exitCode);
}

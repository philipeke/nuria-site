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
const firebaseClientScript = fs.readFileSync(
  path.join(repoRoot, 'js', 'firebase-client.js'),
  'utf8'
);
const partnerPortalScript = fs.readFileSync(
  path.join(repoRoot, 'js', 'partner-portal.js'),
  'utf8'
);
const affiliateAdminHtml = fs.readFileSync(
  path.join(repoRoot, 'internal', 'affiliate-admin', 'index.html'),
  'utf8'
);
const partnerRouteRedirectHtml = fs.readFileSync(
  path.join(repoRoot, 'internal', 'affiliate-admin', 'partners', 'index.html'),
  'utf8'
);
const subscriberRouteRedirectHtml = fs.readFileSync(
  path.join(repoRoot, 'internal', 'affiliate-admin', 'subscribers', 'index.html'),
  'utf8'
);

run('loads partner registry helper script before the admin module', () => {
  assert(affiliateAdminHtml.includes('../../js/affiliate-partner-registry.js'));
  assert(affiliateAdminHtml.includes('../../js/affiliate-admin.js?v=20260416-auth-bootstrap'));
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

run('affiliate code form exposes partner web portal access toggles', () => {
  assert(affiliateAdminHtml.includes('adminPartnerPortalEnableButton'));
  assert(affiliateAdminHtml.includes('adminPartnerPortalDisableButton'));
  assert(affiliateAdminScript.includes('handlePartnerPortalAccessChange'));
  assert(affiliateAdminScript.includes('portalWebAccessEnabled'));
});

run('partner portal prefers the dedicated web callable before the app callable', () => {
  assert(partnerPortalScript.includes('getAffiliatePartnerPortalWeb'));
  assert(partnerPortalScript.includes('getAffiliatePartnerPortal'));
});

run('subscriber dashboard is wired to affiliate funnel metrics', () => {
  assert(affiliateAdminScript.includes('normalizeSubscriberInsightRow'));
  assert(affiliateAdminScript.includes('renderSubscriberFunnelInsights'));
  assert(firebaseClientScript.includes("includeInactive: true"));
  assert(affiliateAdminHtml.includes('adminSubscriberSnapshotMeta'));
  assert(affiliateAdminHtml.includes('With pending referrals'));
  assert(affiliateAdminHtml.includes('First purchases'));
});

run('partner analytics tab is exposed in admin center', () => {
  assert(affiliateAdminHtml.includes('data-admin-page-link="partners"'));
  assert(affiliateAdminHtml.includes('adminSectionPartners'));
  assert(affiliateAdminHtml.includes('adminPartnerList'));
  assert(affiliateAdminHtml.includes('Partner performance command center'));
});

run('partner analytics aggregates and renders partner intelligence on the site', () => {
  assert(affiliateAdminScript.includes('buildPartnerAnalyticsRows'));
  assert(affiliateAdminScript.includes('renderPartnerAnalyticsPage'));
  assert(affiliateAdminScript.includes('adminPartnerSearchInput'));
  assert(affiliateAdminScript.includes('data-open-partner-code'));
});

run('partner analytics copy uses attributed-user language instead of ambiguous entries', () => {
  assert(!affiliateAdminScript.includes('>Entries <strong>'));
  assert(affiliateAdminScript.includes('Code entered <strong>'));
  assert(affiliateAdminScript.includes('of code-entered users live now'));
});

run('admin topbar scroll collapse is frame-throttled', () => {
  assert(affiliateAdminScript.includes('window.requestAnimationFrame(update);'));
  assert(affiliateAdminScript.includes('if (shouldCollapse === lastCollapsedState)'));
});

run('partner web portal surfaces code-entered funnel metrics', () => {
  assert(partnerPortalScript.includes('partnerCodeEnteredUsers'));
  assert(partnerPortalScript.includes('partnerJourneyEntered'));
  assert(partnerPortalScript.includes('codeEntryEvents'));
});

run('admin navigation stays visible once the user is signed in', () => {
  assert(affiliateAdminScript.includes('elements.sectionNav.hidden = showLoginOnly;'));
});

run('firebase auth bootstrap no longer waits forever on persistence setup', () => {
  assert(firebaseClientScript.includes('const AUTH_PERSISTENCE_TIMEOUT_MS = 2500;'));
  assert(firebaseClientScript.includes('function withTimeout('));
  assert(firebaseClientScript.includes('Promise.race(['));
  assert(firebaseClientScript.includes('[firebase-client] Auth persistence setup timed out after'));
});

run('admin auth listener starts immediately with a currentUser fallback', () => {
  const subscribeIndex = affiliateAdminScript.indexOf('subscribeToAuthState(handleInitialAuthState);');
  const persistenceIndex = affiliateAdminScript.indexOf('waitForAuthPersistenceReady().catch(() => {});');
  assert(subscribeIndex >= 0);
  assert(persistenceIndex >= 0);
  assert(subscribeIndex < persistenceIndex);
  assert(affiliateAdminScript.includes('handleInitialAuthState(getCurrentUser());'));
  assert(affiliateAdminScript.includes("./firebase-client.js?v=20260416-auth-bootstrap"));
});

run('partner portal auth listener starts immediately with a currentUser fallback', () => {
  const subscribeIndex = partnerPortalScript.indexOf('subscribeToAuthState(handleInitialAuthState);');
  const persistenceIndex = partnerPortalScript.indexOf('waitForAuthPersistenceReady().catch(() => {});');
  assert(subscribeIndex >= 0);
  assert(persistenceIndex >= 0);
  assert(subscribeIndex < persistenceIndex);
  assert(partnerPortalScript.includes('handleInitialAuthState(getCurrentUser());'));
  assert(partnerPortalScript.includes("./firebase-client.js?v=20260416-auth-bootstrap"));
});

run('direct admin subroutes redirect into the shared admin shell', () => {
  assert(partnerRouteRedirectHtml.includes('?page=partners'));
  assert(subscriberRouteRedirectHtml.includes('?page=subscribers'));
});

if (process.exitCode && process.exitCode !== 0) {
  process.exit(process.exitCode);
}

import {
  addAffiliateAdminAuditLog,
  callFirebaseFunction,
  getAffiliateAdminSettings,
  getCurrentUser,
  listAffiliateAdminAuditLogs,
  lookupNuriaPartnerByEmail,
  saveAffiliateAdminSettings,
  sendPasswordReset,
  signInWithEmailPassword,
  signOutUser,
  subscribeToAuthState,
  waitForAuthPersistenceReady,
} from './firebase-client.js';

const site = window.NuriaSite || {};
const page = document.querySelector('[data-affiliate-admin-page]');
const ACTIVITY_LOG_KEY = 'nuria_affiliate_admin_activity_log_v1';
const CHECKLIST_STATE_KEY = 'nuria_affiliate_admin_monthly_checklist_v1';
const MONTH_LOCK_STATE_KEY = 'nuria_affiliate_admin_month_lock_v1';
const COMPACT_MODE_KEY = 'nuria_affiliate_admin_compact_mode_v1';
const ONBOARDING_DISMISSED_KEY = 'nuria_affiliate_admin_onboarding_dismissed_v1';
const ONBOARDING_SESSION_CLOSED_KEY = 'nuria_affiliate_admin_onboarding_closed_session_v1';
const LOGIN_SUCCESS_SOUND_URL = '/assets/nuria%20site.wav';
const SPIRIT_BUTTON_DEFAULT_LABEL = 'Summon spirit ✨';
const CHECKLIST_STEPS = ['generated', 'verified', 'exported', 'paid', 'receipt'];
const ADMIN_PAGE_PATHS = {
  landing: '/internal/affiliate-admin/',
  overview: '/internal/affiliate-admin/overview/',
  operations: '/internal/affiliate-admin/operations/',
  checklist: '/internal/affiliate-admin/checklist/',
  'alerts-health': '/internal/affiliate-admin/alerts-health/',
  codes: '/internal/affiliate-admin/codes/',
  reports: '/internal/affiliate-admin/reports/',
  'report-detail': '/internal/affiliate-admin/report-detail/',
  settings: '/internal/affiliate-admin/settings/',
};

if (!page) {
  throw new Error('affiliate_admin_page_missing');
}

const elements = {
  shell: page,
  topbar: document.querySelector('.admin-topbar'),
  mobileNavToggle: document.getElementById('adminMobileNavToggle'),
  mobileNavPanel: document.getElementById('adminMobileNavPanel'),
  mobileNavBackdrop: document.getElementById('adminMobileNavBackdrop'),
  mobileNavClose: document.getElementById('adminMobileNavClose'),
  views: Array.from(document.querySelectorAll('[data-admin-view]')),
  authOnlyBlocks: Array.from(document.querySelectorAll('[data-admin-auth-only]')),
  hero: document.querySelector('.admin-hero'),
  sectionNav: document.querySelector('.admin-section-nav'),
  pageSections: Array.from(document.querySelectorAll('[data-admin-page]')),
  pageLinks: Array.from(document.querySelectorAll('[data-admin-page-link]')),
  checklistNavToggle: document.getElementById('adminChecklistNavToggle'),
  checklistNavPopover: document.getElementById('adminChecklistNavPopover'),
  globalNotice: document.getElementById('adminGlobalNotice'),
  authSummary: document.getElementById('adminAuthSummary'),
  playSpiritSound: document.getElementById('adminPlaySpiritSound'),
  spiritToast: document.getElementById('adminSpiritToast'),
  signOutTop: document.getElementById('adminSignOutTop'),
  emailSignInForm: document.getElementById('adminEmailSignInForm'),
  authError: document.getElementById('adminAuthError'),
  sendPasswordResetButton: document.getElementById('adminSendPasswordResetButton'),
  signOutUnauthorized: document.getElementById('adminSignOutUnauthorized'),
  unauthorizedCopy: document.getElementById('adminUnauthorizedCopy'),
  retryLoad: document.getElementById('adminRetryLoad'),
  errorCopy: document.getElementById('adminErrorCopy'),
  refreshOverview: document.getElementById('adminRefreshOverview'),
  currentEmail: document.getElementById('adminCurrentEmail'),
  currentRoles: document.getElementById('adminCurrentRoles'),
  currentSource: document.getElementById('adminCurrentSource'),
  activeCodesCount: document.getElementById('adminActiveCodesCount'),
  trackedAffiliatesCount: document.getElementById('adminTrackedAffiliatesCount'),
  latestReportRows: document.getElementById('adminLatestReportRows'),
  unpaidReportsCount: document.getElementById('adminUnpaidReportsCount'),
  draftReportsCount: document.getElementById('adminDraftReportsCount'),
  lastExportAt: document.getElementById('adminLastExportAt'),
  overviewReports: document.getElementById('adminOverviewReports'),
  overviewCodes: document.getElementById('adminOverviewCodes'),
  opsLogList: document.getElementById('adminOpsLogList'),
  landingActivityList: document.getElementById('adminLandingActivityList'),
  clearOpsLog: document.getElementById('adminClearOpsLog'),
  copyReportDeepLink: document.getElementById('adminCopyReportDeepLink'),
  openPartnerJoin: document.getElementById('adminOpenPartnerJoin'),
  openOnboarding: document.getElementById('adminOpenOnboarding'),
  toggleCompactMode: document.getElementById('adminToggleCompactMode'),
  exportOpsSnapshotJson: document.getElementById('adminExportOpsSnapshotJson'),
  exportOpsSnapshotCsv: document.getElementById('adminExportOpsSnapshotCsv'),
  refreshBackendAudit: document.getElementById('adminRefreshBackendAudit'),
  backendAuditList: document.getElementById('adminBackendAuditList'),
  nextStepCopy: document.getElementById('adminNextStepCopy'),
  runNextStep: document.getElementById('adminRunNextStep'),
  checklistMonthLabel: document.getElementById('adminChecklistMonthLabel'),
  checklistProgress: document.getElementById('adminChecklistProgress'),
  checklistContainer: document.getElementById('adminMonthlyChecklist'),
  checklistMarkAll: document.getElementById('adminChecklistMarkAll'),
  checklistReset: document.getElementById('adminChecklistReset'),
  checklistLockBanner: document.getElementById('adminChecklistLockBanner'),
  toggleMonthLock: document.getElementById('adminToggleMonthLock'),
  onboardingModal: document.getElementById('adminOnboardingModal'),
  onboardingClose: document.getElementById('adminOnboardingClose'),
  onboardingDontShow: document.getElementById('adminOnboardingDontShow'),
  onboardingStart: document.getElementById('adminOnboardingStart'),
  onboardingPrev: document.getElementById('adminOnboardingPrev'),
  onboardingNext: document.getElementById('adminOnboardingNext'),
  onboardingProgress: document.getElementById('adminOnboardingProgress'),
  onboardingDots: document.getElementById('adminOnboardingDots'),
  onboardingSteps: Array.from(document.querySelectorAll('[data-onboarding-step]')),
  checklistNavMonth: document.getElementById('adminChecklistNavMonth'),
  checklistNavItems: Array.from(document.querySelectorAll('[data-checklist-nav-item]')),
  checklistNavMonthStatus: document.getElementById('adminChecklistNavMonthStatus'),
  checklistNavMarkAll: document.getElementById('adminChecklistNavMarkAll'),
  checklistNavReset: document.getElementById('adminChecklistNavReset'),
  checklistNavLockToggle: document.getElementById('adminChecklistNavLockToggle'),
  includeInactiveCodes: document.getElementById('adminIncludeInactiveCodes'),
  codeSearchInput: document.getElementById('adminCodeSearchInput'),
  codeStatusFilter: document.getElementById('adminCodeStatusFilter'),
  refreshCodes: document.getElementById('adminRefreshCodes'),
  newCode: document.getElementById('adminNewCode'),
  codeTableBody: document.getElementById('adminCodesTableBody'),
  codesEmpty: document.getElementById('adminCodesEmpty'),
  codeForm: document.getElementById('adminCodeForm'),
  codeFormTitle: document.getElementById('adminCodeFormTitle'),
  codeFormHelper: document.getElementById('adminCodeFormHelper'),
  editingExistingCode: document.getElementById('adminEditingExistingCode'),
  codeValue: document.getElementById('adminCodeValue'),
  codeReferralLink: document.getElementById('adminCodeReferralLink'),
  copyReferralLinkButton: document.getElementById('adminCopyReferralLinkButton'),
  affiliateId: document.getElementById('adminAffiliateId'),
  displayName: document.getElementById('adminDisplayName'),
  partnerNuriaEmail: document.getElementById('adminPartnerNuriaEmail'),
  partnerLinkStatus: document.getElementById('adminPartnerLinkStatus'),
  partnerProfileDetails: document.getElementById('adminPartnerProfileDetails'),
  partnerType: document.getElementById('adminPartnerType'),
  partnerMobile: document.getElementById('adminPartnerMobile'),
  partnerAddress1: document.getElementById('adminPartnerAddress1'),
  partnerAddress2: document.getElementById('adminPartnerAddress2'),
  partnerPostalCode: document.getElementById('adminPartnerPostalCode'),
  partnerCity: document.getElementById('adminPartnerCity'),
  partnerCountry: document.getElementById('adminPartnerCountry'),
  partnerVat: document.getElementById('adminPartnerVat'),
  partnerAccountHolder: document.getElementById('adminPartnerAccountHolder'),
  partnerBankName: document.getElementById('adminPartnerBankName'),
  partnerAccountNumber: document.getElementById('adminPartnerAccountNumber'),
  partnerIban: document.getElementById('adminPartnerIban'),
  codeStatus: document.getElementById('adminCodeStatus'),
  revenueShareBps: document.getElementById('adminRevenueShareBps'),
  fixedPayoutMinor: document.getElementById('adminFixedPayoutMinor'),
  currency: document.getElementById('adminCurrency'),
  saveCodeButton: document.getElementById('adminSaveCodeButton'),
  resetCodeForm: document.getElementById('adminResetCodeForm'),
  codeFormError: document.getElementById('adminCodeFormError'),
  refreshReports: document.getElementById('adminRefreshReports'),
  reportSearchInput: document.getElementById('adminReportSearchInput'),
  reportStatusFilter: document.getElementById('adminReportStatusFilter'),
  reportsTableBody: document.getElementById('adminReportsTableBody'),
  reportsEmpty: document.getElementById('adminReportsEmpty'),
  reportMonth: document.getElementById('adminReportMonth'),
  sendEmail: document.getElementById('adminSendEmail'),
  generateReportForm: document.getElementById('adminGenerateReportForm'),
  generateReportButton: document.getElementById('adminGenerateReportButton'),
  reportDetailTitle: document.getElementById('adminReportDetailTitle'),
  includeRowsToggle: document.getElementById('adminIncludeRowsToggle'),
  loadReportRows: document.getElementById('adminLoadReportRows'),
  exportCsvButton: document.getElementById('adminExportCsvButton'),
  exportPdfButton: document.getElementById('adminExportPdfButton'),
  exportTestButton: document.getElementById('adminExportTestButton'),
  reportDetailEmpty: document.getElementById('adminReportDetailEmpty'),
  reportDetailContent: document.getElementById('adminReportDetailContent'),
  reportStats: document.getElementById('adminReportStats'),
  reportMeta: document.getElementById('adminReportMeta'),
  reportAffiliatesBody: document.getElementById('adminReportAffiliatesBody'),
  reportAffiliatesEmpty: document.getElementById('adminReportAffiliatesEmpty'),
  reportRowsSection: document.getElementById('adminReportRowsSection'),
  reportRowsBody: document.getElementById('adminReportRowsBody'),
  reportRowsEmpty: document.getElementById('adminReportRowsEmpty'),
  discrepancyList: document.getElementById('adminDiscrepancyList'),
  approvalStatusBanner: document.getElementById('adminApprovalStatusBanner'),
  approveMarkPaidButton: document.getElementById('adminApproveMarkPaidButton'),
  approvalLogList: document.getElementById('adminApprovalLogList'),
  markPaidForm: document.getElementById('adminMarkPaidForm'),
  paymentReference: document.getElementById('adminPaymentReference'),
  paymentNote: document.getElementById('adminPaymentNote'),
  markPaidButton: document.getElementById('adminMarkPaidButton'),
  finalizePayoutButton: document.getElementById('adminFinalizePayoutButton'),
  closePackageButton: document.getElementById('adminClosePackageButton'),
  recipientForm: document.getElementById('adminRecipientForm'),
  recipientEmail: document.getElementById('adminRecipientEmail'),
  addRecipientButton: document.getElementById('adminAddRecipientButton'),
  recipientList: document.getElementById('adminRecipientList'),
  refreshHealth: document.getElementById('adminRefreshHealth'),
  alertsOpenCount: document.getElementById('adminAlertsOpenCount'),
  discrepancyAlertCount: document.getElementById('adminDiscrepancyAlertCount'),
  missingAffiliateCount: document.getElementById('adminMissingAffiliateCount'),
  recipientBounceCount: document.getElementById('adminRecipientBounceCount'),
  healthStatus: document.getElementById('adminHealthStatus'),
  backendErrorRate: document.getElementById('adminBackendErrorRate'),
  alertList: document.getElementById('adminAlertList'),
  healthChecksList: document.getElementById('adminHealthChecksList'),
  settingsForm: document.getElementById('adminSettingsForm'),
  settingsDefaultFlow: document.getElementById('adminSettingsDefaultFlow'),
  settingsExportFormat: document.getElementById('adminSettingsExportFormat'),
  settingsRequireApproval: document.getElementById('adminSettingsRequireApproval'),
  settingsNotifyOnErrors: document.getElementById('adminSettingsNotifyOnErrors'),
  settingsRecipients: document.getElementById('adminSettingsRecipients'),
  settingsBouncedRecipients: document.getElementById('adminSettingsBouncedRecipients'),
  reverifyPartnerRegistry: document.getElementById('adminReverifyPartnerRegistry'),
  partnerRegistryList: document.getElementById('adminPartnerRegistryList'),
  saveSettingsButton: document.getElementById('adminSaveSettingsButton'),
  settingsError: document.getElementById('adminSettingsError'),
};

const state = {
  initializedViewEvent: false,
  user: null,
  admin: null,
  recentReports: [],
  recentCodes: [],
  codes: [],
  reports: [],
  backendAuditLogs: [],
  reportRecipients: [],
  partnerEmailsByCode: {},
  partnerRegistryByCode: {},
  partnerUidsByCode: {},
  partnerProfilesByCode: {},
  selectedReportId: getReportIdFromUrl(),
  selectedReport: null,
  activityLog: [],
  checklistByMonth: {},
  monthLocks: {},
  nextStepAction: 'none',
  compactMode: false,
  onboardingDismissed: false,
  onboardingStep: 0,
  pendingOnboardingAfterLogin: false,
  checklistMonthOverride: '',
  currentPage: 'landing',
  healthChecks: {},
  adminSettings: {
    defaultFlow: 'balanced',
    exportFormat: 'csv_pdf',
    requireApproval: true,
    notifyOnErrors: true,
    bouncedRecipients: [],
  },
  approvalRequests: {},
  filters: {
    codeQuery: '',
    codeStatus: '',
    reportQuery: '',
    reportStatus: '',
  },
  backendAuditUnavailableReason: '',
  recipientSettingsUnavailableReason: '',
  saveCodeInFlight: false,
  generateReportInFlight: false,
  markPaidInFlight: false,
  exportInFlight: false,
  finalizeInFlight: false,
  closePackageInFlight: false,
  saveSettingsInFlight: false,
};
let loginSuccessSound = null;
let spiritToastTimeoutId = null;
let checklistRemoteSyncTimeoutId = null;
let previousAuthUid = null;

function setChecklistPopoverOpen(open) {
  if (!elements.checklistNavPopover || !elements.checklistNavToggle) return;
  const isOpen = Boolean(open);
  elements.checklistNavPopover.hidden = !isOpen;
  elements.checklistNavToggle.setAttribute('aria-expanded', String(isOpen));
}

function setMobileNavOpen(open) {
  if (!elements.topbar || !elements.mobileNavToggle) return;
  const isMobileViewport = window.matchMedia('(max-width: 768px)').matches;
  if (!isMobileViewport) {
    elements.topbar.classList.remove('admin-topbar--mobile-open');
    elements.mobileNavToggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('admin-mobile-nav-open');
    if (elements.mobileNavPanel) {
      elements.mobileNavPanel.setAttribute('aria-hidden', 'false');
      if ('inert' in elements.mobileNavPanel) elements.mobileNavPanel.inert = false;
    }
    return;
  }
  const shouldOpen = Boolean(open);
  elements.topbar.classList.toggle('admin-topbar--mobile-open', shouldOpen);
  elements.mobileNavToggle.setAttribute('aria-expanded', String(shouldOpen));
  document.body.classList.toggle('admin-mobile-nav-open', shouldOpen);
  if (elements.mobileNavPanel) {
    elements.mobileNavPanel.setAttribute('aria-hidden', String(!shouldOpen));
    if ('inert' in elements.mobileNavPanel) {
      elements.mobileNavPanel.inert = !shouldOpen;
    }
  }
  if (!shouldOpen) {
    setChecklistPopoverOpen(false);
  }
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function track(name, params) {
  if (typeof site.trackEvent === 'function') {
    site.trackEvent(name, params || {});
  }
}

function setView(name) {
  elements.views.forEach((view) => {
    view.hidden = view.dataset.adminView !== name;
  });
  const showLoginOnly = name === 'signed-out' || name === 'loading-auth';
  elements.shell?.classList.toggle('admin-shell--login', showLoginOnly);
  document.body.classList.toggle('admin-is-logged-out', showLoginOnly);
  elements.authOnlyBlocks.forEach((block) => {
    block.hidden = showLoginOnly;
  });
  if (elements.sectionNav) {
    elements.sectionNav.hidden = showLoginOnly || name !== 'ready';
  }
  if (showLoginOnly) {
    setMobileNavOpen(false);
  }
  if (elements.checklistNavPopover && elements.checklistNavToggle && elements.sectionNav?.hidden) {
    setChecklistPopoverOpen(false);
  }

  if (!state.initializedViewEvent) {
    track('affiliate_admin_page_viewed', {
      initial_view: name,
    });
    state.initializedViewEvent = true;
  }
}

function getAdminPageFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const queryPage = normalizeAdminPageKey(String(params.get('page') || '').trim().toLowerCase());
  if (queryPage) return queryPage;
  const path = String(window.location.pathname || '').toLowerCase();
  const normalizedBase = '/internal/affiliate-admin/';
  if (!path.startsWith(normalizedBase)) return '';
  const tail = path.slice(normalizedBase.length).replace(/^\/+|\/+$/g, '');
  return normalizeAdminPageKey(tail || 'landing');
}

function normalizeAdminPageKey(pageKey) {
  const raw = String(pageKey || '').trim().toLowerCase();
  if (!raw) return '';
  if (raw === 'overview') return 'landing';
  return raw;
}

function updateAdminPageUrl(pageKey) {
  const params = new URLSearchParams(window.location.search);
  params.delete('page');
  const normalizedKey = normalizeAdminPageKey(pageKey) || 'landing';
  const path = ADMIN_PAGE_PATHS[normalizedKey] || ADMIN_PAGE_PATHS.landing;
  const nextUrl = params.toString()
    ? `${path}?${params.toString()}`
    : path;
  window.history.replaceState({}, '', nextUrl);
}

function setAdminPage(pageKey, options) {
  const settings = Object.assign({ updateUrl: true }, options || {});
  const available = new Set(elements.pageSections.map((section) => section.dataset.adminPage));
  const normalized = normalizeAdminPageKey(pageKey);
  const next = available.has(normalized) ? normalized : 'landing';
  state.currentPage = next;
  setChecklistPopoverOpen(false);
  setMobileNavOpen(false);

  elements.pageSections.forEach((section) => {
    const active = section.dataset.adminPage === next;
    section.hidden = !active;
    section.style.display = active ? '' : 'none';
  });

  if (elements.hero) {
    const showHero = next === 'landing';
    elements.hero.hidden = !showHero;
    elements.hero.style.display = showHero ? '' : 'none';
  }

  elements.pageLinks.forEach((link) => {
    const active = link.dataset.adminPageLink === next;
    link.classList.toggle('is-active', active);
    if (active) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });

  if (settings.updateUrl) {
    updateAdminPageUrl(next);
  }
}

function showBanner(message, tone) {
  if (!elements.globalNotice) return;

  elements.globalNotice.hidden = !message;
  elements.globalNotice.textContent = message || '';
  elements.globalNotice.className = 'admin-banner';

  if (tone) {
    elements.globalNotice.classList.add(`admin-banner--${tone}`);
  }
}

function clearBanner() {
  showBanner('', '');
}

function getErrorParts(error) {
  const code = String(error?.code || '')
    .split('/')
    .pop()
    .trim()
    .toLowerCase();
  const message = String(error?.message || '').trim();

  return {
    code: code || 'unknown',
    message: message || 'Unexpected error',
  };
}

function getActionableErrorMessage(error, fallbackMessage) {
  const parts = getErrorParts(error);
  const code = parts.code;
  const message = parts.message.toLowerCase();

  if (code === 'unauthenticated') {
    return 'Session expired. Sign in again to continue.';
  }

  if (code === 'permission-denied') {
    if (message.includes('admin_access_required') || message.includes('admin_role_required')) {
      return 'Signed in, but this account is not allowlisted for affiliate admin access.';
    }
    if (message.includes('admin_access_disabled')) {
      return 'This admin account exists but is disabled in backend allowlist.';
    }
    if (message.includes('admin_email_mismatch')) {
      return 'Signed-in email does not match the allowlisted admin email.';
    }
    const callableHint = error?.adminCallable
      ? ` (callable: ${error.adminCallable})`
      : '';
    return `Permission denied for this action${callableHint}. If this account should have full access, verify backend callable roles and allowlist.`;
  }

  if (code === 'wrong-password') {
    return 'Wrong password. Try again or send a password reset link.';
  }

  if (code === 'user-not-found') {
    return 'No Firebase Auth account exists for this email yet.';
  }

  if (code === 'invalid-email') {
    return 'Email format is invalid.';
  }

  if (code === 'too-many-requests') {
    return 'Too many attempts. Wait a moment and try again.';
  }

  if (message.includes('code_already_exists')) {
    return 'This referral code already exists. Open it from the table and update the existing record instead.';
  }

  if (message.includes('invalid_code_format')) {
    return 'Code format is invalid. Use 3-64 characters: A-Z, 0-9, underscore, or dash.';
  }

  if (message.includes('invalid_affiliate_id')) {
    return 'Affiliate ID is invalid. Use a stable ID like masjid_stockholm.';
  }

  if (message.includes('invalid_revenue_share_bps')) {
    return 'Revenue share BPS must be between 0 and 10000.';
  }

  if (message.includes('invalid_fixed_payout_minor')) {
    return 'Fixed payout must be a whole number >= 0.';
  }

  if (message.includes('report_not_found')) {
    return 'The selected payout report could not be found. Refresh reports and try again.';
  }

  if (code === 'failed-precondition' && message.includes('callable-only compliance')) {
    return 'Backend callable is required in callable-only compliance mode. Deploy affiliate admin compliance callables first.';
  }

  return fallbackMessage || parts.message;
}

function humanizeAccessSource(source) {
  if (source === 'email_domain') return 'Legacy domain match';
  if (source === 'allowlist_doc') return 'Firestore allowlist';
  return source || '-';
}

function formatTimestamp(timestamp) {
  if (!timestamp?.iso) return '-';

  try {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(timestamp.iso));
  } catch (error) {
    return timestamp.iso;
  }
}

function formatRelativeTime(isoValue) {
  const iso = String(isoValue || '').trim();
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const diffMs = Date.now() - date.getTime();
  const absMs = Math.abs(diffMs);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (absMs < minute) return 'just now';
  if (absMs < hour) return `${Math.round(absMs / minute)} min ago`;
  if (absMs < day) return `${Math.round(absMs / hour)} h ago`;
  return `${Math.round(absMs / day)} d ago`;
}

function formatMoneyFromMinor(amountMinor, currency) {
  if (amountMinor == null) return '-';

  const value = amountMinor / 100;
  const normalizedCurrency = String(currency || '').trim().toUpperCase();

  if (normalizedCurrency.length === 3) {
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: normalizedCurrency,
      }).format(value);
    } catch (error) {
      return `${value.toFixed(2)} ${normalizedCurrency}`;
    }
  }

  return value.toFixed(2);
}

function formatBps(bps) {
  const value = Number(bps);
  if (!Number.isFinite(value)) return '-';
  return `${(value / 100).toFixed(2)}%`;
}

function formatList(values) {
  if (!Array.isArray(values) || !values.length) return '-';
  return values.join(', ');
}

function normalizeSearchValue(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeEmailList(rawValue) {
  if (Array.isArray(rawValue)) {
    return Array.from(new Set(rawValue.map((item) => normalizeEmail(item)).filter(isValidEmail)));
  }
  return Array.from(
    new Set(
      String(rawValue || '')
        .split(/\r?\n|,|;/)
        .map((item) => normalizeEmail(item))
        .filter(isValidEmail)
    )
  );
}

function normalizePartnerEmailMap(rawValue) {
  if (!rawValue || typeof rawValue !== 'object') return {};
  const result = {};
  Object.keys(rawValue).forEach((codeKey) => {
    const normalizedCode = typeof site.normalizeReferralCode === 'function'
      ? site.normalizeReferralCode(codeKey)
      : String(codeKey || '').trim().toUpperCase().replace(/\s+/g, '');
    const normalizedEmail = normalizeEmail(rawValue[codeKey]);
    if (normalizedCode && isValidEmail(normalizedEmail)) {
      result[normalizedCode] = normalizedEmail;
    }
  });
  return result;
}

function normalizePartnerProfilesMap(rawValue) {
  if (!rawValue || typeof rawValue !== 'object') return {};
  const result = {};
  Object.keys(rawValue).forEach((codeKey) => {
    const normalizedCode = typeof site.normalizeReferralCode === 'function'
      ? site.normalizeReferralCode(codeKey)
      : String(codeKey || '').trim().toUpperCase().replace(/\s+/g, '');
    if (!normalizedCode) return;
    const normalized = normalizePartnerProfile(rawValue[codeKey] || {});
    if (normalized) {
      result[normalizedCode] = normalized;
    }
  });
  return result;
}

function normalizePartnerProfile(rawProfile) {
  if (!rawProfile || typeof rawProfile !== 'object') return null;
  const partnerType = rawProfile.partnerType === 'company' ? 'company' : 'private';
  const profile = {
    partnerType,
    mobile: String(rawProfile.mobile || '').trim(),
    address1: String(rawProfile.address1 || '').trim(),
    address2: String(rawProfile.address2 || '').trim(),
    postalCode: String(rawProfile.postalCode || '').trim(),
    city: String(rawProfile.city || '').trim(),
    country: String(rawProfile.country || '').trim().toUpperCase(),
    vat: String(rawProfile.vat || '').trim().toUpperCase(),
    accountHolder: String(rawProfile.accountHolder || '').trim(),
    bankName: String(rawProfile.bankName || '').trim(),
    accountNumber: String(rawProfile.accountNumber || '').trim(),
    iban: String(rawProfile.iban || '').trim().toUpperCase(),
  };
  const hasAnyValue = Object.entries(profile).some(([key, value]) => key === 'partnerType' ? false : Boolean(value));
  return hasAnyValue ? profile : null;
}

function hasPartnerProfileData(profile) {
  if (!profile || typeof profile !== 'object') return false;
  return Object.keys(profile).some((key) => key !== 'partnerType' && Boolean(profile[key]));
}

function getPartnerProfileForCode(item) {
  const code = String(item?.code || '').trim().toUpperCase();
  if (!code) return null;
  return state.partnerProfilesByCode?.[code] || null;
}

function renderPartnerLinkStatus(item) {
  if (!elements.partnerLinkStatus) return;
  const registry = getPartnerRegistryEntryForCode(item || {});
  if (!registry) {
    elements.partnerLinkStatus.textContent =
      'No linked Nuria account yet. Add partner email and save to verify account mapping.';
    return;
  }

  if (registry.status === 'verified') {
    const display = registry.partnerDisplayName || registry.displayName || registry.email || 'Partner';
    const uid = registry.partnerUid || state.partnerUidsByCode?.[String(item?.code || '').toUpperCase()] || '-';
    elements.partnerLinkStatus.textContent =
      `Linked to ${display} (${registry.email || '-'}) · UID ${uid}`;
    return;
  }

  if (registry.status === 'lookup_error') {
    elements.partnerLinkStatus.textContent =
      `Lookup error: ${registry.statusReason || 'Could not verify right now.'}`;
    return;
  }

  elements.partnerLinkStatus.textContent =
    `Email saved but not verified yet (${registry.statusReason || 'not_found'}).`;
}

function getPartnerEmailForCode(item) {
  const code = String(item?.code || '').trim().toUpperCase();
  if (!code) return '';
  const fromItem = normalizeEmail(item?.partnerNuriaEmail || item?.partnerEmail || '');
  if (isValidEmail(fromItem)) return fromItem;
  const fromMap = normalizeEmail(state.partnerEmailsByCode?.[code] || '');
  return isValidEmail(fromMap) ? fromMap : '';
}

function getPartnerRegistryEntryForCode(item) {
  const code = String(item?.code || '').trim().toUpperCase();
  if (!code) return null;
  return state.partnerRegistryByCode?.[code] || null;
}

function formatPercent(value) {
  const safe = Number(value);
  if (!Number.isFinite(safe) || safe < 0) return '0%';
  return `${(safe * 100).toFixed(1)}%`;
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

function readActivityLog() {
  try {
    const raw = window.localStorage.getItem(ACTIVITY_LOG_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
  }
}

function readCompactMode() {
  try {
    return window.localStorage.getItem(COMPACT_MODE_KEY) === '1';
  } catch (_error) {
    return false;
  }
}

function persistCompactMode() {
  try {
    window.localStorage.setItem(COMPACT_MODE_KEY, state.compactMode ? '1' : '0');
  } catch (_error) {
    // ignore storage errors
  }
}

function applyCompactMode() {
  page.classList.toggle('admin-shell--compact', state.compactMode);
  if (elements.toggleCompactMode) {
    elements.toggleCompactMode.textContent = state.compactMode ? 'Standard mode' : 'Compact mode';
  }
}

function readOnboardingDismissed() {
  try {
    return window.localStorage.getItem(ONBOARDING_DISMISSED_KEY) === '1';
  } catch (_error) {
    return false;
  }
}

function readOnboardingClosedThisSession() {
  try {
    return window.sessionStorage.getItem(ONBOARDING_SESSION_CLOSED_KEY) === '1';
  } catch (_error) {
    return false;
  }
}

function markOnboardingClosedThisSession() {
  try {
    window.sessionStorage.setItem(ONBOARDING_SESSION_CLOSED_KEY, '1');
  } catch (_error) {
    // ignore storage errors
  }
}

function persistOnboardingDismissed(value) {
  try {
    window.localStorage.setItem(ONBOARDING_DISMISSED_KEY, value ? '1' : '0');
  } catch (_error) {
    // ignore storage errors
  }
}

function setOnboardingOpen(open) {
  if (!elements.onboardingModal) {
    return;
  }

  if (open) {
    setOnboardingStep(0);
  }

  elements.onboardingModal.hidden = !open;
  document.body.style.overflow = open ? 'hidden' : '';
}

function getLoginSuccessSound() {
  if (!loginSuccessSound) {
    loginSuccessSound = new Audio(LOGIN_SUCCESS_SOUND_URL);
    loginSuccessSound.preload = 'auto';
    loginSuccessSound.volume = 0.8;
  }

  return loginSuccessSound;
}

async function playLoginSuccessSound() {
  try {
    const sound = getLoginSuccessSound();
    sound.currentTime = 0;
    await sound.play();
  } catch (_error) {
    // Browser autoplay policies can block audio; ignore silently.
  }
}

function showSpiritToast() {
  if (!elements.spiritToast) return;
  elements.spiritToast.hidden = false;
  if (spiritToastTimeoutId) {
    window.clearTimeout(spiritToastTimeoutId);
  }
  spiritToastTimeoutId = window.setTimeout(() => {
    if (elements.spiritToast) {
      elements.spiritToast.hidden = true;
    }
  }, 2600);
}

function setSpiritButtonFunLabel() {
  if (!elements.playSpiritSound) return;
  const labels = [
    'Spirit launched 🚀',
    'Barakah mode on ✨',
    'Nuria vibes unlocked 😄',
    'Soul boost activated 🌙',
  ];
  const next = labels[Math.floor(Math.random() * labels.length)];
  elements.playSpiritSound.textContent = next;
  window.setTimeout(() => {
    if (elements.playSpiritSound) {
      elements.playSpiritSound.textContent = SPIRIT_BUTTON_DEFAULT_LABEL;
    }
  }, 1800);
}

function setOnboardingStep(nextIndex) {
  const max = elements.onboardingSteps.length - 1;
  const clamped = Math.max(0, Math.min(Number(nextIndex) || 0, max));
  state.onboardingStep = clamped;

  elements.onboardingSteps.forEach((step, idx) => {
    step.hidden = idx !== clamped;
  });

  if (elements.onboardingProgress) {
    elements.onboardingProgress.textContent = `Step ${clamped + 1} of ${max + 1}`;
  }

  if (elements.onboardingDots) {
    Array.from(elements.onboardingDots.querySelectorAll('[data-onboarding-dot]')).forEach((dot) => {
      const dotIdx = Number(dot.dataset.onboardingDot);
      dot.classList.toggle('is-active', dotIdx === clamped);
    });
  }

  if (elements.onboardingPrev) {
    elements.onboardingPrev.disabled = clamped === 0;
  }

  if (elements.onboardingNext) {
    elements.onboardingNext.disabled = clamped === max;
  }

  if (elements.onboardingStart) {
    elements.onboardingStart.textContent = clamped === max ? 'Got it, start' : 'Skip tour';
  }
}

function persistActivityLog() {
  try {
    window.localStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify(state.activityLog.slice(0, 50)));
  } catch (_error) {
    // ignore persistence failures (private mode / storage disabled)
  }
}

function getActivityActor() {
  return state.admin?.email || state.user?.email || 'admin';
}

async function persistBackendAuditLog(item) {
  if (!state.user) return;

  try {
    await addAffiliateAdminAuditLog({
      message: item.message,
      kind: item.kind,
      actor: item.actor,
      actorUid: state.user.uid || null,
      reportId: state.selectedReport?.report?.reportId || null,
      periodMonth: state.selectedReport?.report?.periodMonth || getChecklistMonthKey(),
    });
    state.backendAuditUnavailableReason = '';
  } catch (error) {
    state.backendAuditUnavailableReason = getActionableErrorMessage(
      error,
      'Backend audit log write is currently unavailable.'
    );
    renderBackendAuditLog();
  }
}

function addActivityLog(message, kind) {
  const item = {
    message: String(message || '').trim() || 'Action completed',
    kind: kind || 'info',
    actor: getActivityActor(),
    at: new Date().toISOString(),
  };

  state.activityLog = [item].concat(state.activityLog || []).slice(0, 50);
  state.backendAuditLogs = [
    {
      message: item.message,
      kind: item.kind,
      actor: item.actor,
      createdAtIso: item.at,
    },
  ].concat(state.backendAuditLogs || []).slice(0, 60);
  persistActivityLog();
  renderActivityLog();
  renderBackendAuditLog();
  persistBackendAuditLog(item);
}

function renderActivityLog() {
  const items = Array.isArray(state.activityLog) ? state.activityLog : [];
  const renderInto = (container, emptyCopy, limitCount) => {
    if (!container) return;
    if (!items.length) {
      container.innerHTML = `<p class="admin-empty admin-empty--inline">${emptyCopy}</p>`;
      return;
    }
    container.innerHTML = items
      .slice(0, limitCount)
      .map((item) => {
        const when = formatTimestamp({ iso: item.at });
        const relative = formatRelativeTime(item.at);
        const kind = String(item.kind || 'info').toLowerCase();
        return `
          <div class="admin-ops-log__item">
            <span class="admin-tag admin-tag--${escapeHtml(kind)}">${escapeHtml(kind)}</span>
            ${escapeHtml(item.message)}
            <span class="admin-ops-log__meta">${escapeHtml(item.actor || 'admin')} &middot; ${escapeHtml(relative || when)} &middot; ${escapeHtml(when)}</span>
          </div>
        `;
      })
      .join('');
  };

  renderInto(elements.opsLogList, 'No activity yet in this browser session.', 12);
  renderInto(elements.landingActivityList, 'No recent activity yet.', 8);
}

function clearActivityLog() {
  state.activityLog = [];
  persistActivityLog();
  renderActivityLog();
}

function renderBackendAuditLog() {
  if (!elements.backendAuditList) return;

  if (state.backendAuditUnavailableReason) {
    elements.backendAuditList.innerHTML = `<p class="admin-empty admin-empty--inline">${escapeHtml(state.backendAuditUnavailableReason)}</p>`;
    return;
  }

  const items = Array.isArray(state.backendAuditLogs) ? state.backendAuditLogs : [];
  if (!items.length) {
    elements.backendAuditList.innerHTML = '<p class="admin-empty admin-empty--inline">No backend audit entries available yet.</p>';
    return;
  }

  elements.backendAuditList.innerHTML = items
    .slice(0, 16)
    .map((item) => {
      const when = formatTimestamp({ iso: item.createdAtIso || item.at || '' });
      return `
        <div class="admin-ops-log__item">
          ${escapeHtml(item.message || 'Action completed')}
          <span class="admin-ops-log__meta">${escapeHtml(item.actor || 'admin')} &middot; ${escapeHtml(item.kind || 'info')} &middot; ${escapeHtml(when)}</span>
        </div>
      `;
    })
    .join('');
}

function getOpsSnapshot() {
  const monthKey = getChecklistMonthKey();
  return {
    generatedAt: new Date().toISOString(),
    actor: getActivityActor(),
    selectedReportId: state.selectedReportId || '',
    selectedMonth: monthKey,
    selectedMonthChecklist: getChecklistForMonth(monthKey),
    selectedMonthLock: state.monthLocks?.[monthKey] || {
      locked: false,
      reason: '',
      updatedAt: '',
      updatedBy: '',
    },
    recentActivity: (state.activityLog || []).slice(0, 50),
    backendAuditLogs: (state.backendAuditLogs || []).slice(0, 50),
    scheduledRecipients: (state.reportRecipients || []).slice(),
    reportSummaries: (state.reports || []).map((item) => ({
      reportId: item.reportId || '',
      periodMonth: item.periodMonth || '',
      status: item.status || '',
      source: item.source || '',
      ledgerRowCount: Number(item.ledgerRowCount ?? 0),
      affiliateCount: Number(item.affiliateCount ?? 0),
      updatedAt: toIsoDate(item.updatedAt),
    })),
    codeSummaries: (state.codes || []).map((item) => ({
      code: item.code || '',
      affiliateId: item.affiliateId || '',
      displayName: item.displayName || '',
      status: item.status || '',
      revenueShareBps: Number(item.revenueShareBps ?? 0),
      fixedPayoutMinor: item.fixedPayoutMinor ?? null,
      currency: item.currency || '',
    })),
    checklistByMonth: state.checklistByMonth || {},
    monthLocks: state.monthLocks || {},
  };
}

function buildOpsSnapshotCsv(snapshot) {
  const lines = [];
  lines.push('Nuria Affiliate Admin Ops Snapshot');
  lines.push([csvCell('Generated At'), csvCell(snapshot.generatedAt), csvCell('Actor'), csvCell(snapshot.actor)].join(','));
  lines.push([csvCell('Selected Month'), csvCell(snapshot.selectedMonth), csvCell('Selected Report'), csvCell(snapshot.selectedReportId)].join(','));
  lines.push('');

  lines.push('Selected Month Checklist');
  lines.push([csvCell('Step'), csvCell('Done')].join(','));
  CHECKLIST_STEPS.forEach((step) => {
    lines.push([csvCell(step), csvCell(Boolean(snapshot.selectedMonthChecklist?.[step]))].join(','));
  });
  lines.push('');

  lines.push('Month Lock');
  lines.push([csvCell('Locked'), csvCell(Boolean(snapshot.selectedMonthLock?.locked)), csvCell('Reason'), csvCell(snapshot.selectedMonthLock?.reason || '')].join(','));
  lines.push('');

  lines.push('Scheduled Recipients');
  lines.push([csvCell('Email')].join(','));
  (snapshot.scheduledRecipients || []).forEach((email) => {
    lines.push([csvCell(email)].join(','));
  });
  lines.push('');

  lines.push('Report Summaries');
  lines.push([csvCell('Report ID'), csvCell('Month'), csvCell('Status'), csvCell('Source'), csvCell('Rows'), csvCell('Affiliates'), csvCell('Updated At')].join(','));
  (snapshot.reportSummaries || []).forEach((row) => {
    lines.push([
      csvCell(row.reportId),
      csvCell(row.periodMonth),
      csvCell(row.status),
      csvCell(row.source),
      csvCell(row.ledgerRowCount),
      csvCell(row.affiliateCount),
      csvCell(row.updatedAt),
    ].join(','));
  });
  lines.push('');

  lines.push('Recent Activity');
  lines.push([csvCell('When'), csvCell('Actor'), csvCell('Kind'), csvCell('Message')].join(','));
  (snapshot.recentActivity || []).forEach((row) => {
    lines.push([
      csvCell(row.at || ''),
      csvCell(row.actor || ''),
      csvCell(row.kind || ''),
      csvCell(row.message || ''),
    ].join(','));
  });

  return lines.join('\n');
}

function readChecklistState() {
  try {
    const raw = window.localStorage.getItem(CHECKLIST_STATE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (_error) {
    return {};
  }
}

function normalizeChecklistStateMap(rawValue) {
  if (!rawValue || typeof rawValue !== 'object') return {};
  const normalized = {};
  Object.keys(rawValue).forEach((key) => {
    const monthKey = String(key || '').trim();
    if (!monthKey) return;
    const row = rawValue[key] && typeof rawValue[key] === 'object' ? rawValue[key] : {};
    const next = {};
    CHECKLIST_STEPS.forEach((step) => {
      next[step] = Boolean(row[step]);
    });
    normalized[monthKey] = next;
  });
  return normalized;
}

function persistChecklistState() {
  try {
    window.localStorage.setItem(CHECKLIST_STATE_KEY, JSON.stringify(state.checklistByMonth || {}));
  } catch (_error) {
    // ignore storage errors
  }
}

function getChecklistMonthKey() {
  return state.checklistMonthOverride
    || state.selectedReport?.report?.periodMonth
    || elements.reportMonth?.value
    || getPreviousUtcMonth();
}

function getChecklistForMonth(monthKey) {
  const current = state.checklistByMonth?.[monthKey];
  if (current && typeof current === 'object') {
    return Object.assign({}, current);
  }

  return {
    generated: false,
    verified: false,
    exported: false,
    paid: false,
    receipt: false,
  };
}

function setChecklistStep(step, value, monthKey) {
  if (CHECKLIST_STEPS.indexOf(step) < 0) {
    return;
  }

  const key = monthKey || getChecklistMonthKey();
  const next = getChecklistForMonth(key);
  next[step] = Boolean(value);
  state.checklistByMonth[key] = next;
  persistChecklistState();
  scheduleChecklistRemoteSync();
  renderChecklist();
}

function markChecklistSteps(steps, value, monthKey) {
  const key = monthKey || getChecklistMonthKey();
  const next = getChecklistForMonth(key);
  steps.forEach((step) => {
    if (CHECKLIST_STEPS.indexOf(step) >= 0) {
      next[step] = Boolean(value);
    }
  });
  state.checklistByMonth[key] = next;
  persistChecklistState();
  scheduleChecklistRemoteSync();
  renderChecklist();
}

function renderChecklist() {
  if (!elements.checklistContainer) return;

  const monthKey = getChecklistMonthKey();
  const status = getChecklistForMonth(monthKey);
  const locked = isMonthLocked(monthKey);
  const lockReason = getMonthLockReason(monthKey);
  const checkboxes = Array.from(elements.checklistContainer.querySelectorAll('[data-checklist-item]'));

  checkboxes.forEach((input) => {
    const step = input.dataset.checklistItem;
    input.checked = Boolean(status[step]);
    input.disabled = locked;
  });

  const completed = CHECKLIST_STEPS.filter((step) => status[step]).length;
  if (elements.checklistProgress) {
    elements.checklistProgress.textContent = `${completed} / ${CHECKLIST_STEPS.length} complete`;
  }

  if (elements.checklistMonthLabel) {
    elements.checklistMonthLabel.textContent = `Tracking checklist for month ${monthKey}.`;
  }

  if (elements.checklistContainer) {
    elements.checklistContainer.classList.toggle('admin-checklist--locked', locked);
  }

  if (elements.checklistLockBanner) {
    elements.checklistLockBanner.hidden = !locked;
    elements.checklistLockBanner.textContent = locked
      ? `Month ${monthKey} is locked. Checklist and payout mutation actions are read-only.${lockReason ? ` Reason: ${lockReason}` : ''}`
      : '';
  }

  if (elements.toggleMonthLock) {
    elements.toggleMonthLock.textContent = locked ? 'Unlock month' : 'Lock month';
  }

  if (elements.checklistMarkAll) {
    elements.checklistMarkAll.disabled = locked;
  }

  if (elements.checklistReset) {
    elements.checklistReset.disabled = locked;
  }

  if (typeof renderNextStep === 'function') {
    renderNextStep();
  }
  renderChecklistNavControls(monthKey, status, locked);
}

function getChecklistMonthOptions(selectedMonth) {
  const months = new Set();
  months.add(String(selectedMonth || '').trim());
  months.add(String(elements.reportMonth?.value || '').trim());
  Object.keys(state.checklistByMonth || {}).forEach((monthKey) => {
    const month = String(monthKey || '').trim();
    if (month) months.add(month);
  });
  Object.keys(state.monthLocks || {}).forEach((monthKey) => {
    const month = String(monthKey || '').trim();
    if (month) months.add(month);
  });
  (state.reports || []).forEach((item) => {
    const month = String(item.periodMonth || '').trim();
    if (month) months.add(month);
  });
  const values = Array.from(months).filter(Boolean).sort((a, b) => b.localeCompare(a));
  return values.length ? values : [getPreviousUtcMonth()];
}

function getChecklistCompletedCount(monthKey) {
  const status = getChecklistForMonth(monthKey);
  return CHECKLIST_STEPS.filter((step) => Boolean(status[step])).length;
}

function getChecklistIndicatorTone(completedCount) {
  if (completedCount >= CHECKLIST_STEPS.length) return 'done';
  if (completedCount >= 2) return 'mid';
  return 'low';
}

function renderChecklistNavControls(monthKey, status, locked) {
  if (elements.checklistNavMonth) {
    const options = getChecklistMonthOptions(monthKey);
    elements.checklistNavMonth.innerHTML = options
      .map((month) => {
        const completed = getChecklistCompletedCount(month);
        const tone = getChecklistIndicatorTone(completed);
        const marker = tone === 'done' ? '🟢' : tone === 'mid' ? '🟡' : '🔴';
        return `<option value="${escapeHtml(month)}">${marker} ${escapeHtml(month)} (${completed}/${CHECKLIST_STEPS.length})</option>`;
      })
      .join('');
    elements.checklistNavMonth.value = options.includes(monthKey) ? monthKey : options[0];
  }

  elements.checklistNavItems.forEach((input) => {
    const step = input.dataset.checklistNavItem;
    input.checked = Boolean(status?.[step]);
    input.disabled = locked;
  });

  const completed = CHECKLIST_STEPS.filter((step) => Boolean(status?.[step])).length;
  const tone = getChecklistIndicatorTone(completed);
  if (elements.checklistNavMonthStatus) {
    elements.checklistNavMonthStatus.textContent = `${completed} / ${CHECKLIST_STEPS.length} complete`;
    elements.checklistNavMonthStatus.className = `admin-section-nav__month-pill admin-section-nav__month-pill--${tone}`;
  }
  if (elements.checklistNavMarkAll) {
    elements.checklistNavMarkAll.disabled = locked;
  }
  if (elements.checklistNavReset) {
    elements.checklistNavReset.disabled = locked;
  }
  if (elements.checklistNavLockToggle) {
    elements.checklistNavLockToggle.textContent = locked ? 'Unlock month' : 'Lock month';
  }
  if (elements.checklistNavToggle) {
    elements.checklistNavToggle.textContent = `Checklist ${monthKey} (${completed}/${CHECKLIST_STEPS.length})`;
  }
}

function readMonthLocks() {
  try {
    const raw = window.localStorage.getItem(MONTH_LOCK_STATE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};

    return normalizeMonthLocksMap(parsed);
  } catch (_error) {
    return {};
  }
}

function normalizeMonthLocksMap(rawValue) {
  if (!rawValue || typeof rawValue !== 'object') return {};
  const normalized = {};
  Object.keys(rawValue).forEach((key) => {
    const monthKey = String(key || '').trim();
    if (!monthKey) return;
    const value = rawValue[key];
    if (typeof value === 'boolean') {
      normalized[monthKey] = {
        locked: value,
        reason: '',
        updatedAt: '',
        updatedBy: '',
      };
      return;
    }

    normalized[monthKey] = {
      locked: Boolean(value?.locked),
      reason: String(value?.reason || '').trim(),
      updatedAt: String(value?.updatedAt || ''),
      updatedBy: String(value?.updatedBy || ''),
    };
  });
  return normalized;
}

function persistMonthLocks() {
  try {
    window.localStorage.setItem(MONTH_LOCK_STATE_KEY, JSON.stringify(state.monthLocks || {}));
  } catch (_error) {
    // ignore storage issues
  }
}

function scheduleChecklistRemoteSync() {
  if (checklistRemoteSyncTimeoutId) {
    window.clearTimeout(checklistRemoteSyncTimeoutId);
  }
  checklistRemoteSyncTimeoutId = window.setTimeout(async () => {
    try {
      await saveAffiliateAdminSettings({
        affiliateChecklistByMonth: state.checklistByMonth || {},
        affiliateMonthLocks: state.monthLocks || {},
      });
    } catch (_error) {
      // Keep local persistence even if remote sync fails.
    }
  }, 550);
}

function isMonthLocked(monthKey) {
  const key = monthKey || getChecklistMonthKey();
  return Boolean(state.monthLocks?.[key]?.locked === true);
}

function getMonthLockReason(monthKey) {
  const key = monthKey || getChecklistMonthKey();
  return String(state.monthLocks?.[key]?.reason || '').trim();
}

function setMonthLocked(monthKey, locked, reason) {
  const key = monthKey || getChecklistMonthKey();
  state.monthLocks[key] = {
    locked: Boolean(locked),
    reason: Boolean(locked) ? String(reason || '').trim() : '',
    updatedAt: new Date().toISOString(),
    updatedBy: getActivityActor(),
  };
  persistMonthLocks();
  scheduleChecklistRemoteSync();
  renderChecklist();
}

function guardMonthUnlocked(actionLabel, monthKey) {
  const key = monthKey || getChecklistMonthKey();
  if (!isMonthLocked(key)) {
    return true;
  }

  const reason = getMonthLockReason(key);
  showBanner(
    `Month ${key} is locked. Unlock it first to ${actionLabel}.${reason ? ` Reason: ${reason}` : ''}`,
    'info'
  );
  return false;
}

function csvCell(value) {
  const raw = String(value ?? '');
  const escaped = raw.replace(/"/g, '""');
  return `"${escaped}"`;
}

function toIsoDate(value) {
  if (!value?.iso) return '';
  return value.iso;
}

function buildExportFilename(report, extension) {
  const month = String(report?.periodMonth || 'unknown-month').replace(/[^0-9-]/g, '');
  return `nuria-affiliate-report-${month}.${extension}`;
}

function createAndDownloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

async function loadReportDetailForExport(reportId) {
  const data = await callFirebaseFunction('getAffiliatePayoutReportAdmin', {
    reportId,
    includeRows: true,
    rowsLimit: 5000,
    affiliatesLimit: 2000,
  });

  if (!data?.report) {
    throw new Error('report_not_found');
  }

  return {
    report: data.report,
    affiliates: Array.isArray(data.affiliates) ? data.affiliates : [],
    rows: Array.isArray(data.rows) ? data.rows : [],
    rowsIncluded: data.rowsIncluded === true,
  };
}

function buildCsvExport(detail) {
  const report = detail.report || {};
  const affiliates = detail.affiliates || [];
  const rows = detail.rows || [];
  const lines = [];

  lines.push('Nuria Affiliate Payout Report');
  lines.push(
    [
      csvCell('Report ID'),
      csvCell(report.reportId || ''),
      csvCell('Period Month'),
      csvCell(report.periodMonth || ''),
      csvCell('Status'),
      csvCell(report.status || ''),
    ].join(',')
  );
  lines.push(
    [
      csvCell('Source'),
      csvCell(report.source || ''),
      csvCell('Created At'),
      csvCell(toIsoDate(report.createdAt)),
      csvCell('Updated At'),
      csvCell(toIsoDate(report.updatedAt)),
    ].join(',')
  );
  lines.push('');

  lines.push('Affiliate Summaries');
  lines.push([
    csvCell('Affiliate ID'),
    csvCell('Affiliate Name'),
    csvCell('Referral Codes'),
    csvCell('Known Commission Total Minor'),
    csvCell('Currencies'),
    csvCell('Payout-ready Rows'),
    csvCell('Reconciliation Rows'),
  ].join(','));

  affiliates.forEach((item) => {
    lines.push([
      csvCell(item.affiliateId || ''),
      csvCell(item.affiliateDisplayName || ''),
      csvCell(Array.isArray(item.referralCodes) ? item.referralCodes.join(' | ') : ''),
      csvCell(item.knownCommissionTotalMinor ?? ''),
      csvCell(Array.isArray(item.currencies) ? item.currencies.join(' | ') : ''),
      csvCell(item.payoutReadyRowCount ?? 0),
      csvCell(item.reconciliationRowCount ?? 0),
    ].join(','));
  });

  lines.push('');
  lines.push('Ledger Rows');
  lines.push([
    csvCell('Ledger ID'),
    csvCell('Event Type'),
    csvCell('Payout Status'),
    csvCell('Commission Amount Minor'),
    csvCell('Currency'),
    csvCell('Affiliate ID'),
    csvCell('Affiliate Name'),
    csvCell('Referral Code'),
    csvCell('Earned At'),
  ].join(','));

  rows.forEach((item) => {
    lines.push([
      csvCell(item.ledgerId || ''),
      csvCell(item.eventType || ''),
      csvCell(item.payoutStatus || ''),
      csvCell(item.commissionAmountMinor ?? ''),
      csvCell(item.currency || ''),
      csvCell(item.affiliateId || ''),
      csvCell(item.affiliateDisplayName || ''),
      csvCell(item.referralCode || ''),
      csvCell(toIsoDate(item.earnedAt)),
    ].join(','));
  });

  return lines.join('\n');
}

function renderPdfTableRows(rows, mapper) {
  return rows
    .map((item) => `<tr>${mapper(item)}</tr>`)
    .join('');
}

function buildPrintableHtml(detail, options) {
  const report = detail.report || {};
  const affiliates = detail.affiliates || [];
  const rows = detail.rows || [];
  const generatedAt = new Date().toISOString();
  const settings = Object.assign({
    title: 'Nuria Affiliate Payout Report',
    subtitle: 'Generated by OakDev & AI AB internal admin',
    footerNote: '',
    includeRows: true,
  }, options || {});

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Nuria Affiliate Report ${escapeHtml(report.periodMonth || '')}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #10231b; margin: 24px; }
    .top { display: flex; align-items: center; gap: 14px; margin-bottom: 18px; }
    .top img.nuria { width: 52px; height: 52px; border-radius: 12px; }
    .top img.oakdev { height: 28px; width: auto; }
    .meta { margin: 10px 0 18px; font-size: 12px; }
    h1 { margin: 0; font-size: 22px; }
    h2 { margin: 22px 0 8px; font-size: 16px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 11px; }
    th, td { border: 1px solid #d4dfd8; padding: 6px; vertical-align: top; text-align: left; }
    th { background: #f4f8f5; }
    .muted { color: #4a6357; }
  </style>
</head>
<body>
  <div class="top">
    <img class="nuria" src="${window.location.origin}/assets/nuria-admin.png" alt="Nuria Admin" />
    <img class="oakdev" src="${window.location.origin}/assets/oakdev-logo.png" alt="OakDev & AI AB" />
    <div>
      <h1>${escapeHtml(settings.title)}</h1>
      <div class="muted">${escapeHtml(settings.subtitle)}</div>
    </div>
  </div>

  <div class="meta">
    <strong>Report ID:</strong> ${escapeHtml(report.reportId || '-')}<br />
    <strong>Period:</strong> ${escapeHtml(report.periodMonth || '-')}<br />
    <strong>Status:</strong> ${escapeHtml(report.status || '-')}<br />
    <strong>Generated At (UTC):</strong> ${escapeHtml(generatedAt)}
  </div>

  <h2>Affiliate Summaries</h2>
  <table>
    <thead>
      <tr>
        <th>Affiliate</th>
        <th>Codes</th>
        <th>Known Total</th>
        <th>Payout-ready</th>
        <th>Reconciliation</th>
      </tr>
    </thead>
    <tbody>
      ${renderPdfTableRows(affiliates, (item) => `
        <td>${escapeHtml(item.affiliateDisplayName || item.affiliateId || '-')}</td>
        <td>${escapeHtml(formatList(item.referralCodes))}</td>
        <td>${escapeHtml(String(item.knownCommissionTotalMinor ?? 0))}</td>
        <td>${escapeHtml(String(item.payoutReadyRowCount ?? 0))}</td>
        <td>${escapeHtml(String(item.reconciliationRowCount ?? 0))}</td>
      `)}
    </tbody>
  </table>

  ${settings.includeRows ? '<h2>Ledger Rows</h2>' : ''}
  ${settings.includeRows ? `
  <table>
    <thead>
      <tr>
        <th>Ledger ID</th>
        <th>Event</th>
        <th>Payout status</th>
        <th>Commission minor</th>
        <th>Currency</th>
        <th>Affiliate</th>
        <th>Earned at</th>
      </tr>
    </thead>
    <tbody>
      ${renderPdfTableRows(rows, (item) => `
        <td>${escapeHtml(item.ledgerId || '-')}</td>
        <td>${escapeHtml(item.eventType || '-')}</td>
        <td>${escapeHtml(item.payoutStatus || '-')}</td>
        <td>${escapeHtml(String(item.commissionAmountMinor ?? 0))}</td>
        <td>${escapeHtml(item.currency || '-')}</td>
        <td>${escapeHtml(item.affiliateDisplayName || item.affiliateId || '-')}</td>
        <td>${escapeHtml(toIsoDate(item.earnedAt) || '-')}</td>
      `)}
    </tbody>
  </table>
  ` : ''}
  ${settings.footerNote ? `<p class="muted">${escapeHtml(settings.footerNote)}</p>` : ''}
</body>
</html>`;
}

function openPrintableExport(html) {
  const exportWindow = window.open('', '_blank', 'noopener,noreferrer');
  if (!exportWindow) {
    return false;
  }

  exportWindow.document.open();
  exportWindow.document.write(html);
  exportWindow.document.close();
  exportWindow.focus();
  exportWindow.print();
  return true;
}

function createSampleExportDetail() {
  return {
    report: {
      reportId: 'sample-report-2026-03',
      periodMonth: '2026-03',
      status: 'draft',
      source: 'sample_data',
      createdAt: { iso: '2026-03-01T00:00:00.000Z' },
      updatedAt: { iso: '2026-03-31T00:00:00.000Z' },
      paymentReference: null,
      note: null,
    },
    affiliates: [
      {
        affiliateId: 'masjid_stockholm',
        affiliateDisplayName: 'Masjid Stockholm',
        referralCodes: ['MASJIDSTHLM'],
        knownCommissionTotalMinor: 24900,
        currencies: ['SEK'],
        payoutReadyRowCount: 18,
        reconciliationRowCount: 2,
      },
      {
        affiliateId: 'example_partner',
        affiliateDisplayName: 'Example Partner',
        referralCodes: ['EXAMPLE01'],
        knownCommissionTotalMinor: 12900,
        currencies: ['SEK'],
        payoutReadyRowCount: 9,
        reconciliationRowCount: 1,
      },
    ],
    rows: [
      {
        ledgerId: 'ledger_1001',
        eventType: 'subscription_purchase',
        payoutStatus: 'ready',
        commissionAmountMinor: 4900,
        currency: 'SEK',
        affiliateId: 'masjid_stockholm',
        affiliateDisplayName: 'Masjid Stockholm',
        referralCode: 'MASJIDSTHLM',
        earnedAt: { iso: '2026-03-12T10:30:00.000Z' },
      },
      {
        ledgerId: 'ledger_1002',
        eventType: 'subscription_purchase',
        payoutStatus: 'ready',
        commissionAmountMinor: 3900,
        currency: 'SEK',
        affiliateId: 'example_partner',
        affiliateDisplayName: 'Example Partner',
        referralCode: 'EXAMPLE01',
        earnedAt: { iso: '2026-03-13T11:15:00.000Z' },
      },
    ],
    rowsIncluded: true,
  };
}

function buildPayoutReceiptHtml(detail, paymentReference, note) {
  const report = detail.report || {};
  const receiptFooter = `Payment reference: ${paymentReference || report.paymentReference || 'not provided'} | Note: ${note || report.note || 'none'}`;
  return buildPrintableHtml(detail, {
    title: `Nuria Partner Payout Receipt ${report.periodMonth || ''}`.trim(),
    subtitle: 'Finalized payout receipt (internal finance record)',
    footerNote: receiptFooter,
    includeRows: false,
  });
}

function isValidAffiliateCodeFormat(value) {
  return /^[A-Z0-9_-]{3,64}$/.test(String(value || ''));
}

function validateCodePayload(payload) {
  if (!payload.code) {
    return 'Code is required.';
  }

  if (!isValidAffiliateCodeFormat(payload.code)) {
    return 'Code must use 3-64 characters: A-Z, 0-9, underscore, or dash.';
  }

  if (!payload.affiliateId) {
    return 'Affiliate ID is required.';
  }

  if (!/^[a-z0-9][a-z0-9_-]{1,63}$/i.test(payload.affiliateId)) {
    return 'Affiliate ID format is invalid. Use letters, numbers, underscore, and dash.';
  }

  if (!Number.isInteger(payload.revenueShareBps) || payload.revenueShareBps < 0 || payload.revenueShareBps > 10000) {
    return 'Revenue share BPS must be an integer between 0 and 10000.';
  }

  if (payload.fixedPayoutMinor != null && (!Number.isInteger(payload.fixedPayoutMinor) || payload.fixedPayoutMinor < 0)) {
    return 'Fixed payout minor must be a whole number >= 0.';
  }

  if (payload.currency && !/^[A-Z]{3}$/.test(payload.currency)) {
    return 'Currency must be a 3-letter code, e.g. SEK or USD.';
  }

  return '';
}

function setButtonBusy(button, busy, busyLabel) {
  if (!button) return;

  if (busy) {
    if (!button.dataset.originalLabel) {
      button.dataset.originalLabel = button.textContent;
    }
    button.disabled = true;
    if (busyLabel) {
      button.textContent = busyLabel;
    }
    return;
  }

  button.disabled = false;
  if (button.dataset.originalLabel) {
    button.textContent = button.dataset.originalLabel;
    delete button.dataset.originalLabel;
  }
}

function setCodeFormError(message) {
  if (!elements.codeFormError) {
    return;
  }

  elements.codeFormError.hidden = !message;
  elements.codeFormError.textContent = message || '';
}

function getReportIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return String(params.get('report') || '').trim() || '';
}

function updateReportUrl(reportId) {
  const params = new URLSearchParams(window.location.search);

  if (reportId) {
    params.set('report', reportId);
  } else {
    params.delete('report');
  }

  const nextUrl = params.toString()
    ? `${window.location.pathname}?${params.toString()}`
    : window.location.pathname;

  window.history.replaceState({}, '', nextUrl);
}

function getPreviousUtcMonth() {
  const now = new Date();
  const previous = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const month = `${previous.getUTCMonth() + 1}`.padStart(2, '0');
  return `${previous.getUTCFullYear()}-${month}`;
}

function updateIdentity() {
  const user = state.user;

  if (!elements.authSummary || !elements.signOutTop) {
    return;
  }

  if (!user) {
    elements.authSummary.hidden = true;
    elements.authSummary.textContent = '';
    elements.signOutTop.hidden = true;
    return;
  }

  const displayName = String(
    state.admin?.displayName
      || state.admin?.name
      || user.displayName
      || ''
  ).trim();
  const email = String(user.email || state.admin?.email || '').trim();
  const summary = [];
  if (displayName) summary.push(displayName);
  if (email) summary.push(email);
  if (!summary.length) summary.push('Signed in');

  elements.authSummary.hidden = false;
  elements.authSummary.textContent = summary.join(' | ');
  elements.signOutTop.hidden = false;
}

function setCodeFormMode(mode) {
  const editing = mode === 'edit';

  elements.editingExistingCode.value = editing ? 'true' : 'false';
  elements.codeValue.readOnly = editing;
  elements.codeValue.classList.toggle('admin-form-input--locked', editing);
  elements.codeFormTitle.textContent = editing ? 'Edit code' : 'Create code';
  elements.codeFormHelper.textContent = editing
    ? 'Code values are locked on existing entries. Update the affiliate metadata below.'
    : 'Create a new affiliate code and assign its payout settings.';
}

function getGeneratedReferralLink(code) {
  const normalizedCode = typeof site.normalizeReferralCode === 'function'
    ? site.normalizeReferralCode(code)
    : String(code || '').trim().toUpperCase().replace(/\s+/g, '');

  if (!normalizedCode) {
    return '';
  }

  const origin = site?.config?.siteOrigin || window.location.origin;
  return `${origin}/join/${encodeURIComponent(normalizedCode)}`;
}

function updateCodeReferralLink(rawCode) {
  if (!elements.codeReferralLink || !elements.copyReferralLinkButton) {
    return;
  }

  const link = getGeneratedReferralLink(rawCode);
  elements.codeReferralLink.dataset.value = link;

  if (!link) {
    elements.codeReferralLink.textContent = 'Enter a code to generate a shareable link';
    elements.codeReferralLink.href = '#';
    elements.codeReferralLink.setAttribute('aria-disabled', 'true');
    elements.copyReferralLinkButton.disabled = true;
    return;
  }

  elements.codeReferralLink.textContent = link;
  elements.codeReferralLink.href = link;
  elements.codeReferralLink.setAttribute('aria-disabled', 'false');
  elements.copyReferralLinkButton.disabled = false;
}

function readPartnerProfileFromForm() {
  return {
    partnerType: elements.partnerType?.value === 'company' ? 'company' : 'private',
    mobile: String(elements.partnerMobile?.value || '').trim(),
    address1: String(elements.partnerAddress1?.value || '').trim(),
    address2: String(elements.partnerAddress2?.value || '').trim(),
    postalCode: String(elements.partnerPostalCode?.value || '').trim(),
    city: String(elements.partnerCity?.value || '').trim(),
    country: String(elements.partnerCountry?.value || '').trim().toUpperCase(),
    vat: String(elements.partnerVat?.value || '').trim().toUpperCase(),
    accountHolder: String(elements.partnerAccountHolder?.value || '').trim(),
    bankName: String(elements.partnerBankName?.value || '').trim(),
    accountNumber: String(elements.partnerAccountNumber?.value || '').trim(),
    iban: String(elements.partnerIban?.value || '').trim().toUpperCase(),
  };
}

function syncPartnerTypeFields() {
  if (!elements.partnerVat) return;
  const isCompany = elements.partnerType?.value === 'company';
  elements.partnerVat.disabled = !isCompany;
  if (!isCompany) {
    elements.partnerVat.value = '';
  }
}

function resetCodeForm(item) {
  const value = item || null;

  setCodeFormError('');
  setCodeFormMode(value ? 'edit' : 'create');
  elements.codeForm.reset();
  elements.codeStatus.value = 'active';
  elements.revenueShareBps.value = '5000';

  if (!value) {
    elements.codeValue.value = '';
    elements.affiliateId.value = '';
    elements.displayName.value = '';
    if (elements.partnerNuriaEmail) {
      elements.partnerNuriaEmail.value = '';
    }
    if (elements.partnerType) elements.partnerType.value = 'private';
    if (elements.partnerMobile) elements.partnerMobile.value = '';
    if (elements.partnerAddress1) elements.partnerAddress1.value = '';
    if (elements.partnerAddress2) elements.partnerAddress2.value = '';
    if (elements.partnerPostalCode) elements.partnerPostalCode.value = '';
    if (elements.partnerCity) elements.partnerCity.value = '';
    if (elements.partnerCountry) elements.partnerCountry.value = '';
    if (elements.partnerVat) elements.partnerVat.value = '';
    if (elements.partnerAccountHolder) elements.partnerAccountHolder.value = '';
    if (elements.partnerBankName) elements.partnerBankName.value = '';
    if (elements.partnerAccountNumber) elements.partnerAccountNumber.value = '';
    if (elements.partnerIban) elements.partnerIban.value = '';
    elements.fixedPayoutMinor.value = '';
    elements.currency.value = '';
    updateCodeReferralLink('');
    renderPartnerLinkStatus(null);
    if (elements.partnerProfileDetails) {
      elements.partnerProfileDetails.open = false;
    }
    syncPartnerTypeFields();
    return;
  }

  elements.codeValue.value = value.code || '';
  elements.affiliateId.value = value.affiliateId || '';
  elements.displayName.value = value.displayName || '';
  if (elements.partnerNuriaEmail) {
    elements.partnerNuriaEmail.value = getPartnerEmailForCode(value) || '';
  }
  const profile = getPartnerProfileForCode(value) || null;
  if (elements.partnerType) elements.partnerType.value = profile?.partnerType === 'company' ? 'company' : 'private';
  if (elements.partnerMobile) elements.partnerMobile.value = profile?.mobile || '';
  if (elements.partnerAddress1) elements.partnerAddress1.value = profile?.address1 || '';
  if (elements.partnerAddress2) elements.partnerAddress2.value = profile?.address2 || '';
  if (elements.partnerPostalCode) elements.partnerPostalCode.value = profile?.postalCode || '';
  if (elements.partnerCity) elements.partnerCity.value = profile?.city || '';
  if (elements.partnerCountry) elements.partnerCountry.value = profile?.country || '';
  if (elements.partnerVat) elements.partnerVat.value = profile?.vat || '';
  if (elements.partnerAccountHolder) elements.partnerAccountHolder.value = profile?.accountHolder || '';
  if (elements.partnerBankName) elements.partnerBankName.value = profile?.bankName || '';
  if (elements.partnerAccountNumber) elements.partnerAccountNumber.value = profile?.accountNumber || '';
  if (elements.partnerIban) elements.partnerIban.value = profile?.iban || '';
  elements.codeStatus.value = value.status || 'active';
  elements.revenueShareBps.value = String(value.revenueShareBps ?? 5000);
  elements.fixedPayoutMinor.value =
    value.fixedPayoutMinor == null ? '' : String(value.fixedPayoutMinor);
  elements.currency.value = value.currency || '';
  updateCodeReferralLink(value.code || '');
  renderPartnerLinkStatus(value);
  if (elements.partnerProfileDetails) {
    elements.partnerProfileDetails.open = hasPartnerProfileData(profile);
  }
  syncPartnerTypeFields();
}

function syncReportActionFields(report) {
  elements.paymentReference.value = report?.paymentReference || '';
  elements.paymentNote.value = report?.note || '';
}

function renderMiniList(container, items, type) {
  if (!container) return;

  if (!items.length) {
    const emptyCopy = type === 'report'
      ? 'No recent payout reports yet.'
      : 'No recent referral codes yet.';
    container.innerHTML = `<p class="admin-empty admin-empty--inline">${emptyCopy}</p>`;
    return;
  }

  container.innerHTML = items
    .map((item) => {
      if (type === 'report') {
        return `
          <button type="button" class="admin-mini-item admin-mini-item--button" data-report-id="${escapeHtml(item.reportId)}">
            <span class="admin-mini-item__title">${escapeHtml(item.periodMonth)}</span>
            <span class="admin-mini-item__meta">${escapeHtml(item.status)} &middot; ${escapeHtml(formatTimestamp(item.updatedAt))}</span>
          </button>
        `;
      }

      return `
        <button type="button" class="admin-mini-item admin-mini-item--button" data-code-id="${escapeHtml(item.code)}">
          <span class="admin-mini-item__title">${escapeHtml(item.code)}</span>
          <span class="admin-mini-item__meta">${escapeHtml(item.displayName || item.affiliateId || '-')}</span>
        </button>
      `;
    })
    .join('');
}

function renderOverview() {
  elements.currentEmail.textContent = state.admin?.email || state.user?.email || '-';
  elements.currentRoles.textContent = state.admin?.roles?.join(', ') || '-';
  elements.currentSource.textContent = humanizeAccessSource(state.admin?.source || '');
  const codes = Array.isArray(state.codes) ? state.codes : [];
  const reports = Array.isArray(state.reports) ? state.reports : [];
  const activeCodes = codes.filter((item) => item.status === 'active').length;
  const trackedAffiliates = new Set(
    codes
      .map((item) => String(item.affiliateId || '').trim())
      .filter(Boolean)
  ).size;
  const latestReportRows = reports.length ? Number(reports[0].ledgerRowCount ?? 0) : 0;
  const unpaidReports = reports.filter((item) => item.status !== 'paid').length;
  const draftReports = reports.filter((item) => item.status === 'draft').length;
  const latestExport = (state.activityLog || []).find((item) =>
    String(item.message || '').toLowerCase().includes('export')
  );

  if (elements.activeCodesCount) {
    elements.activeCodesCount.textContent = String(activeCodes);
  }

  if (elements.trackedAffiliatesCount) {
    elements.trackedAffiliatesCount.textContent = String(trackedAffiliates);
  }

  if (elements.latestReportRows) {
    elements.latestReportRows.textContent = String(latestReportRows);
  }

  if (elements.unpaidReportsCount) {
    elements.unpaidReportsCount.textContent = String(unpaidReports);
  }

  if (elements.draftReportsCount) {
    elements.draftReportsCount.textContent = String(draftReports);
  }

  if (elements.lastExportAt) {
    elements.lastExportAt.textContent = latestExport ? formatTimestamp({ iso: latestExport.at }) : 'Never';
  }

  renderMiniList(elements.overviewReports, state.recentReports, 'report');
  renderMiniList(elements.overviewCodes, state.recentCodes, 'code');
  renderActivityLog();
  renderBackendAuditLog();
  renderRecipientList();
  renderAlertCenter();
  renderHealthDashboard();
  renderSettingsForm();
  renderPartnerRegistry();
  renderApprovalFlow(state.selectedReport?.report || null);
  renderNextStep();
}

function renderNextStep() {
  const monthKey = getChecklistMonthKey();
  const locked = isMonthLocked(monthKey);
  const status = getChecklistForMonth(monthKey);
  const hasSelectedReport = Boolean(state.selectedReportId);

  let action = 'none';
  let copy = 'All monthly close steps are complete.';

  if (!hasSelectedReport) {
    action = 'select_latest_report';
    copy = 'Start by opening the latest payout report.';
  } else if (locked) {
    action = 'unlock_month';
    copy = `Month ${monthKey} is locked. Unlock it to continue payout actions.`;
  } else if (!status.verified) {
    action = 'load_rows';
    copy = 'Next: load rows and verify affiliates and totals.';
  } else if (!status.paid) {
    action = 'finalize_payout';
    copy = 'Next: finalize payout to mark this month as paid.';
  } else if (!status.exported || !status.receipt) {
    action = 'close_package';
    copy = 'Next: generate the month-end package (CSV + ops snapshot + receipt PDF).';
  }

  state.nextStepAction = action;
  if (elements.nextStepCopy) {
    elements.nextStepCopy.textContent = copy;
  }

  if (elements.runNextStep) {
    elements.runNextStep.disabled = action === 'none';
    const labels = {
      select_latest_report: 'Open latest report',
      unlock_month: 'Unlock month',
      load_rows: 'Load rows for review',
      export_csv: 'Export CSV',
      finalize_payout: 'Finalize payout now',
      close_package: 'Generate month-end package',
      export_pdf: 'Open receipt PDF',
      none: 'All done',
    };
    elements.runNextStep.textContent = labels[action] || 'Run next step';
  }
}

function renderCodesTable() {
  const query = normalizeSearchValue(state.filters.codeQuery);
  const statusFilter = normalizeSearchValue(state.filters.codeStatus);
  const allItems = state.codes || [];
  const items = allItems.filter((item) => {
    const status = normalizeSearchValue(item.status);
    if (statusFilter && status !== statusFilter) {
      return false;
    }

    if (!query) return true;
    const haystack = [
      item.code,
      item.affiliateId,
      item.displayName,
      getPartnerEmailForCode(item),
      item.status,
    ].map((value) => normalizeSearchValue(value)).join(' ');
    return haystack.includes(query);
  });

  elements.codeTableBody.innerHTML = items
    .map((item) => {
      return `
        <tr>
          <td>
            <button type="button" class="admin-link-button" data-code-id="${escapeHtml(item.code)}">
              ${escapeHtml(item.code)}
            </button>
          </td>
          <td>${escapeHtml(item.displayName || item.affiliateId || '-')}</td>
          <td>${escapeHtml(getPartnerEmailForCode(item) || '-')}</td>
          <td><span class="admin-status admin-status--${escapeHtml(item.status)}">${escapeHtml(item.status)}</span></td>
          <td>${escapeHtml(formatBps(item.revenueShareBps))}</td>
          <td>${escapeHtml(
            item.fixedPayoutMinor == null
              ? '-'
              : formatMoneyFromMinor(item.fixedPayoutMinor, item.currency)
          )}</td>
        </tr>
      `;
    })
    .join('');

  if (elements.codesEmpty) {
    if (!items.length && allItems.length) {
      elements.codesEmpty.textContent = 'No codes match your current filters.';
    } else if (!allItems.length) {
      elements.codesEmpty.textContent = 'No referral codes yet. Create your first partner code to start tracking signups and monthly payouts.';
    }
    elements.codesEmpty.hidden = items.length > 0;
  }
}

function renderReportsTable() {
  const query = normalizeSearchValue(state.filters.reportQuery);
  const statusFilter = normalizeSearchValue(state.filters.reportStatus);
  const allItems = state.reports || [];
  const items = allItems.filter((item) => {
    const status = normalizeSearchValue(item.status);
    if (statusFilter && status !== statusFilter) {
      return false;
    }

    if (!query) return true;
    const haystack = [
      item.periodMonth,
      item.reportId,
      item.status,
      item.source,
    ].map((value) => normalizeSearchValue(value)).join(' ');
    return haystack.includes(query);
  });

  elements.reportsTableBody.innerHTML = items
    .map((item) => {
      return `
        <tr>
          <td>
            <button type="button" class="admin-link-button" data-report-id="${escapeHtml(item.reportId)}">
              ${escapeHtml(item.periodMonth)}
            </button>
          </td>
          <td><span class="admin-status admin-status--${escapeHtml(item.status)}">${escapeHtml(item.status)}</span></td>
          <td>${escapeHtml(item.source || '-')}</td>
          <td>${escapeHtml(String(item.ledgerRowCount ?? 0))}</td>
          <td>${escapeHtml(String(item.affiliateCount ?? 0))}</td>
          <td>${escapeHtml(formatTimestamp(item.updatedAt))}</td>
        </tr>
      `;
    })
    .join('');

  if (elements.reportsEmpty) {
    if (!items.length && allItems.length) {
      elements.reportsEmpty.textContent = 'No payout reports match your current filters.';
    } else if (!allItems.length) {
      elements.reportsEmpty.textContent = 'No payout reports yet. Generate a monthly report to prepare partner payout reconciliation.';
    }
    elements.reportsEmpty.hidden = items.length > 0;
  }
}

function collectDiscrepancyFindings(detail) {
  if (!detail || detail.rowsIncluded !== true) {
    return [];
  }
  const rows = Array.isArray(detail.rows) ? detail.rows : [];
  const affiliates = Array.isArray(detail.affiliates) ? detail.affiliates : [];
  const affiliateCurrencies = new Map();
  affiliates.forEach((item) => {
    affiliateCurrencies.set(String(item.affiliateId || ''), Array.isArray(item.currencies) ? item.currencies : []);
  });

  const findings = [];
  rows.forEach((row) => {
    const rowId = row.ledgerId || 'unknown-ledger';
    const amount = Number(row.commissionAmountMinor);
    const currency = String(row.currency || '').trim().toUpperCase();
    const affiliateId = String(row.affiliateId || '').trim();

    if (Number.isFinite(amount) && amount < 0) {
      findings.push(`Negative commission detected on ${rowId}.`);
    }

    if (!affiliateId && !String(row.affiliateDisplayName || '').trim()) {
      findings.push(`Missing affiliate mapping on ${rowId}.`);
    }

    if (!currency) {
      findings.push(`Missing currency on ${rowId}.`);
    } else if (affiliateId) {
      const expected = affiliateCurrencies.get(affiliateId) || [];
      if (expected.length && !expected.includes(currency)) {
        findings.push(`Currency mismatch on ${rowId} (${currency} not in ${expected.join('/')}).`);
      }
    }
  });
  return findings;
}

function renderDiscrepancies(detail) {
  if (!elements.discrepancyList) return;
  const findings = collectDiscrepancyFindings(detail);
  if (!detail || detail.rowsIncluded !== true) {
    elements.discrepancyList.innerHTML = '<p class="admin-empty admin-empty--inline">Load rows to run discrepancy checks.</p>';
    return;
  }

  if (!findings.length) {
    elements.discrepancyList.innerHTML = '<p class="admin-empty admin-empty--inline">No payout discrepancies detected.</p>';
    return;
  }

  elements.discrepancyList.innerHTML = findings
    .slice(0, 30)
    .map((message) => {
      return `<div class="admin-mini-item admin-mini-item--warn"><span class="admin-mini-item__title">${escapeHtml(message)}</span></div>`;
    })
    .join('');
}

function getApprovalEntry(reportId) {
  return state.approvalRequests?.[reportId] || null;
}

function renderApprovalFlow(report) {
  const reportId = report?.reportId || state.selectedReportId || '';
  const approval = reportId ? getApprovalEntry(reportId) : null;
  const requireApproval = state.adminSettings?.requireApproval !== false;

  if (elements.approvalStatusBanner) {
    if (!reportId) {
      elements.approvalStatusBanner.textContent = 'Select a report to prepare payout approval.';
    } else if (!requireApproval) {
      elements.approvalStatusBanner.textContent = 'Two-step approval is disabled in admin settings.';
    } else if (!approval) {
      elements.approvalStatusBanner.textContent = 'No approval request yet. Submit "Mark as paid" to create one.';
    } else if (approval.approvedAt) {
      elements.approvalStatusBanner.textContent =
        `Approved by ${approval.approvedBy || 'admin'} at ${formatTimestamp({ iso: approval.approvedAt })}.`;
    } else {
      elements.approvalStatusBanner.textContent =
        `Pending approval requested by ${approval.requestedBy || 'admin'} at ${formatTimestamp({ iso: approval.requestedAt })}.`;
    }
  }

  if (elements.approveMarkPaidButton) {
    const actor = normalizeEmail(getActivityActor());
    const requestedBy = normalizeEmail(approval?.requestedBy || '');
    elements.approveMarkPaidButton.disabled =
      !reportId
      || !requireApproval
      || !approval
      || Boolean(approval.approvedAt)
      || (requestedBy && actor && requestedBy === actor);
  }

  if (elements.approvalLogList) {
    if (!approval) {
      elements.approvalLogList.innerHTML = '<p class="admin-empty admin-empty--inline">No approval activity for this report.</p>';
    } else {
      const lines = [
        `Request created by ${approval.requestedBy || 'admin'} &middot; ${formatTimestamp({ iso: approval.requestedAt })}`,
      ];
      if (approval.approvedAt) {
        lines.push(`Approved by ${approval.approvedBy || 'admin'} &middot; ${formatTimestamp({ iso: approval.approvedAt })}`);
      }
      elements.approvalLogList.innerHTML = lines
        .map((line) => `<div class="admin-mini-item"><span class="admin-mini-item__title">${line}</span></div>`)
        .join('');
    }
  }
}

function getAlertSummary() {
  const detail = state.selectedReport;
  const discrepancyFindings = collectDiscrepancyFindings(detail);
  const rows = Array.isArray(detail?.rows) ? detail.rows : [];
  const missingAffiliateRows = rows.filter((row) => {
    return !String(row.affiliateId || '').trim() && !String(row.affiliateDisplayName || '').trim();
  }).length;
  const bouncedRecipients = normalizeEmailList(state.adminSettings?.bouncedRecipients || []);
  const alerts = [];

  if (discrepancyFindings.length) {
    alerts.push({
      tone: 'warn',
      title: `${discrepancyFindings.length} payout discrepancy alert(s)`,
      meta: 'Open report rows to validate payout consistency.',
    });
  }
  if (missingAffiliateRows > 0) {
    alerts.push({
      tone: 'warn',
      title: `${missingAffiliateRows} rows missing affiliate mapping`,
      meta: 'Update ledger mappings before payout finalization.',
    });
  }
  if (bouncedRecipients.length > 0) {
    alerts.push({
      tone: 'warn',
      title: `${bouncedRecipients.length} bounced recipient(s) configured`,
      meta: bouncedRecipients.slice(0, 3).join(', '),
    });
  }

  return {
    alerts,
    discrepancyCount: discrepancyFindings.length,
    missingAffiliateCount: missingAffiliateRows,
    bouncedRecipientCount: bouncedRecipients.length,
  };
}

function renderAlertCenter() {
  const summary = getAlertSummary();
  if (elements.alertsOpenCount) elements.alertsOpenCount.textContent = String(summary.alerts.length);
  if (elements.discrepancyAlertCount) elements.discrepancyAlertCount.textContent = String(summary.discrepancyCount);
  if (elements.missingAffiliateCount) elements.missingAffiliateCount.textContent = String(summary.missingAffiliateCount);
  if (elements.recipientBounceCount) elements.recipientBounceCount.textContent = String(summary.bouncedRecipientCount);

  if (!elements.alertList) return;
  if (!summary.alerts.length) {
    elements.alertList.innerHTML = '<p class="admin-empty admin-empty--inline">No active alerts right now.</p>';
    return;
  }
  elements.alertList.innerHTML = summary.alerts
    .map((item) => {
      const cls = item.tone === 'warn' ? 'admin-mini-item admin-mini-item--warn' : 'admin-mini-item';
      return `<div class="${cls}"><span class="admin-mini-item__title">${escapeHtml(item.title)}</span><span class="admin-mini-item__meta">${escapeHtml(item.meta || '')}</span></div>`;
    })
    .join('');
}

function renderHealthDashboard() {
  const health = state.healthChecks || {};
  const checks = Object.entries(health);
  const failing = checks.filter(([, value]) => value?.ok === false).length;
  const status = checks.length ? (failing ? 'Degraded' : 'Healthy') : 'Unknown';
  if (elements.healthStatus) elements.healthStatus.textContent = status;

  const backendItems = Array.isArray(state.backendAuditLogs) ? state.backendAuditLogs.slice(0, 50) : [];
  const errorCount = backendItems.filter((item) => normalizeSearchValue(item.kind).includes('error')).length;
  const errorRatio = backendItems.length ? (errorCount / backendItems.length) : 0;
  if (elements.backendErrorRate) elements.backendErrorRate.textContent = formatPercent(errorRatio);

  if (!elements.healthChecksList) return;
  if (!checks.length) {
    elements.healthChecksList.innerHTML = '<p class="admin-empty admin-empty--inline">No health checks run yet.</p>';
    return;
  }
  elements.healthChecksList.innerHTML = checks
    .map(([name, value]) => {
      const title = `${name}: ${value.ok ? 'ok' : 'failed'}`;
      const meta = value.ok
        ? `Last success ${formatTimestamp({ iso: value.lastSuccessAt || '' })} (${value.durationMs || 0} ms)`
        : `${value.errorMessage || 'Unknown error'} (${value.durationMs || 0} ms)`;
      return `<div class="${value.ok ? 'admin-mini-item' : 'admin-mini-item admin-mini-item--warn'}"><span class="admin-mini-item__title">${escapeHtml(title)}</span><span class="admin-mini-item__meta">${escapeHtml(meta)}</span></div>`;
    })
    .join('');
}

function renderSettingsForm() {
  if (!elements.settingsForm) return;
  const settings = state.adminSettings || {};
  if (elements.settingsDefaultFlow) elements.settingsDefaultFlow.value = settings.defaultFlow || 'balanced';
  if (elements.settingsExportFormat) elements.settingsExportFormat.value = settings.exportFormat || 'csv_pdf';
  if (elements.settingsRequireApproval) elements.settingsRequireApproval.checked = settings.requireApproval !== false;
  if (elements.settingsNotifyOnErrors) elements.settingsNotifyOnErrors.checked = settings.notifyOnErrors !== false;
  if (elements.settingsRecipients) elements.settingsRecipients.value = (state.reportRecipients || []).join('\n');
  if (elements.settingsBouncedRecipients) {
    elements.settingsBouncedRecipients.value = normalizeEmailList(settings.bouncedRecipients || []).join('\n');
  }
}

function renderPartnerRegistry() {
  if (!elements.partnerRegistryList) return;
  const codes = Array.isArray(state.codes) ? state.codes : [];
  const items = codes
    .map((item) => {
      const email = getPartnerEmailForCode(item);
      if (!email) return null;
      const code = String(item.code || '').trim().toUpperCase();
      const registry = getPartnerRegistryEntryForCode(item);
      const profile = getPartnerProfileForCode(item);
      return {
        code,
        affiliateId: item.affiliateId || '-',
        displayName: item.displayName || '-',
        email,
        partnerUid: registry?.partnerUid || '',
        partnerDisplayName: registry?.partnerDisplayName || '',
        linkedAt: registry?.linkedAt || '',
        linkedBy: registry?.linkedBy || '',
        status: registry?.status || 'mapped_unverified',
        statusReason: registry?.statusReason || '',
        partnerType: profile?.partnerType || 'private',
        mobile: profile?.mobile || '',
        country: profile?.country || '',
        vat: profile?.vat || '',
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.code.localeCompare(b.code));

  if (!items.length) {
    elements.partnerRegistryList.innerHTML = '<p class="admin-empty admin-empty--inline">No partner emails linked yet.</p>';
    return;
  }

  elements.partnerRegistryList.innerHTML = items
    .map((item) => {
      const linkedAt = item.linkedAt ? formatTimestamp({ iso: item.linkedAt }) : 'Not recorded';
      const metaDisplayName = item.partnerDisplayName || item.displayName;
      const statusLabel = item.status === 'verified'
        ? 'verified'
        : item.status === 'lookup_error'
          ? 'lookup_error'
          : 'mapped_unverified';
      return `
        <div class="admin-mini-item">
          <span class="admin-mini-item__title">${escapeHtml(metaDisplayName)} (${escapeHtml(item.code)})</span>
          <span class="admin-mini-item__meta">${escapeHtml(item.email)} &middot; ${escapeHtml(item.affiliateId)} &middot; ${escapeHtml(statusLabel)}</span>
          <span class="admin-mini-item__meta">${escapeHtml(item.partnerType)}${item.mobile ? ` &middot; ${escapeHtml(item.mobile)}` : ''}${item.country ? ` &middot; ${escapeHtml(item.country)}` : ''}${item.vat ? ` &middot; VAT ${escapeHtml(item.vat)}` : ''}</span>
          <span class="admin-mini-item__meta">${escapeHtml(item.partnerUid || '-')} &middot; ${escapeHtml(item.statusReason || '-')}</span>
          <span class="admin-mini-item__meta">${escapeHtml(item.linkedBy || 'admin')} &middot; ${escapeHtml(linkedAt)}</span>
        </div>
      `;
    })
    .join('');
}

function renderReportStats(report) {
  const stats = [
    ['Status', report.status || '-'],
    ['Source', report.source || '-'],
    ['Ledger rows', String(report.ledgerRowCount ?? 0)],
    ['Affiliates', String(report.affiliateCount ?? 0)],
    ['Known total', formatMoneyFromMinor(report.knownCommissionTotalMinor, null)],
    ['Reconciliation rows', String(report.reconciliationRowCount ?? 0)],
  ];

  elements.reportStats.innerHTML = stats
    .map(([label, value]) => {
      return `
        <div class="admin-stat-card">
          <span class="admin-stat-card__label">${escapeHtml(label)}</span>
          <strong class="admin-stat-card__value">${escapeHtml(value)}</strong>
        </div>
      `;
    })
    .join('');
}

function renderReportMeta(report) {
  const items = [
    ['Created', formatTimestamp(report.createdAt)],
    ['Updated', formatTimestamp(report.updatedAt)],
    ['Email sent', formatTimestamp(report.emailSentAt)],
    ['Paid at', formatTimestamp(report.paidAt)],
    ['Paid by', report.paidByEmail || '-'],
    ['Payment reference', report.paymentReference || '-'],
    ['Note', report.note || '-'],
  ];

  elements.reportMeta.innerHTML = items
    .map(([label, value]) => {
      return `
        <div class="admin-detail-meta__item">
          <span class="admin-detail-meta__label">${escapeHtml(label)}</span>
          <strong class="admin-detail-meta__value">${escapeHtml(value)}</strong>
        </div>
      `;
    })
    .join('');
}

function renderReportAffiliates(affiliates) {
  const items = affiliates || [];

  elements.reportAffiliatesBody.innerHTML = items
    .map((item) => {
      return `
        <tr>
          <td>${escapeHtml(item.affiliateDisplayName || item.affiliateId || '-')}</td>
          <td>${escapeHtml(formatList(item.referralCodes))}</td>
          <td>${escapeHtml(
            formatMoneyFromMinor(item.knownCommissionTotalMinor, item.currencies?.[0] || null)
          )}</td>
          <td>${escapeHtml(String(item.payoutReadyRowCount ?? 0))}</td>
          <td>${escapeHtml(String(item.reconciliationRowCount ?? 0))}</td>
        </tr>
      `;
    })
    .join('');

  elements.reportAffiliatesEmpty.hidden = items.length > 0;
}

function renderReportRows(rows, visible) {
  const items = visible ? rows || [] : [];

  elements.reportRowsSection.hidden = !visible;
  elements.reportRowsBody.innerHTML = items
    .map((item) => {
      return `
        <tr>
          <td>${escapeHtml(item.ledgerId || '-')}</td>
          <td>${escapeHtml(item.eventType || '-')}</td>
          <td>${escapeHtml(item.payoutStatus || '-')}</td>
          <td>${escapeHtml(formatMoneyFromMinor(item.commissionAmountMinor, item.currency))}</td>
          <td>${escapeHtml(item.currency || '-')}</td>
          <td>${escapeHtml(item.affiliateDisplayName || item.affiliateId || '-')}</td>
          <td>${escapeHtml(formatTimestamp(item.earnedAt))}</td>
        </tr>
      `;
    })
    .join('');

  elements.reportRowsEmpty.hidden = items.length > 0;
}

function clearSelectedReport() {
  state.selectedReportId = '';
  state.selectedReport = null;
  state.checklistMonthOverride = String(elements.reportMonth?.value || getPreviousUtcMonth());
  updateReportUrl('');
  elements.reportDetailTitle.textContent = 'Select a payout report';
  elements.reportDetailEmpty.hidden = false;
  elements.reportDetailContent.hidden = true;
  elements.markPaidButton.disabled = true;
  elements.markPaidButton.textContent = 'Mark as paid';
  if (elements.exportCsvButton) elements.exportCsvButton.disabled = true;
  if (elements.exportPdfButton) elements.exportPdfButton.disabled = true;
  if (elements.finalizePayoutButton) {
    elements.finalizePayoutButton.disabled = true;
    elements.finalizePayoutButton.textContent = 'Finalize payout now';
  }
  if (elements.closePackageButton) {
    elements.closePackageButton.disabled = true;
    elements.closePackageButton.textContent = 'Generate month-end package';
  }
  if (elements.copyReportDeepLink) elements.copyReportDeepLink.disabled = true;
  syncReportActionFields(null);
  renderDiscrepancies(null);
  renderApprovalFlow(null);
  renderAlertCenter();
  renderNextStep();
}

function renderSelectedReport() {
  const detail = state.selectedReport;

  elements.loadReportRows.disabled = !state.selectedReportId;
  if (elements.exportCsvButton) elements.exportCsvButton.disabled = !state.selectedReportId;
  if (elements.exportPdfButton) elements.exportPdfButton.disabled = !state.selectedReportId;
  if (elements.finalizePayoutButton) elements.finalizePayoutButton.disabled = !state.selectedReportId;
  if (elements.closePackageButton) elements.closePackageButton.disabled = !state.selectedReportId;
  if (elements.copyReportDeepLink) elements.copyReportDeepLink.disabled = !state.selectedReportId;

  if (!detail || !detail.report) {
    clearSelectedReport();
    return;
  }

  const report = detail.report;
  const monthLocked = isMonthLocked(report.periodMonth || elements.reportMonth.value);
  elements.reportDetailTitle.textContent = `Report ${report.periodMonth}`;
  elements.reportDetailEmpty.hidden = true;
  elements.reportDetailContent.hidden = false;

  renderReportStats(report);
  renderReportMeta(report);
  renderReportAffiliates(detail.affiliates || []);
  renderReportRows(detail.rows || [], detail.rowsIncluded === true);
  renderDiscrepancies(detail);
  renderApprovalFlow(report);
  renderAlertCenter();
  syncReportActionFields(report);

  if (report.status === 'paid') {
    elements.markPaidButton.disabled = true;
    elements.markPaidButton.textContent = 'Already paid';
    if (elements.finalizePayoutButton) {
      elements.finalizePayoutButton.disabled = true;
      elements.finalizePayoutButton.textContent = 'Already paid';
    }
    if (elements.closePackageButton) {
      elements.closePackageButton.disabled = false;
      elements.closePackageButton.textContent = 'Generate month-end package';
    }
  } else {
    elements.markPaidButton.disabled = monthLocked;
    elements.markPaidButton.textContent = monthLocked ? 'Month locked' : 'Mark as paid';
    if (elements.finalizePayoutButton) {
      elements.finalizePayoutButton.disabled = monthLocked;
      elements.finalizePayoutButton.textContent = monthLocked ? 'Month locked' : 'Finalize payout now';
    }
    if (elements.closePackageButton) {
      elements.closePackageButton.disabled = monthLocked;
      elements.closePackageButton.textContent = monthLocked ? 'Month locked' : 'Generate month-end package';
    }
  }

  renderChecklist();
  renderNextStep();
}

async function loadBootstrap() {
  const data = await callFirebaseFunction('getAffiliateAdminBootstrap');
  state.admin = data.admin || null;
  state.recentReports = Array.isArray(data.recentReports) ? data.recentReports : [];
  state.recentCodes = Array.isArray(data.recentCodes) ? data.recentCodes : [];
}

async function runHealthCheck(name, runner) {
  const startedAt = Date.now();
  try {
    await runner();
    state.healthChecks[name] = {
      ok: true,
      durationMs: Date.now() - startedAt,
      lastSuccessAt: new Date().toISOString(),
      errorMessage: '',
    };
  } catch (error) {
    state.healthChecks[name] = {
      ok: false,
      durationMs: Date.now() - startedAt,
      lastSuccessAt: state.healthChecks[name]?.lastSuccessAt || '',
      errorMessage: getActionableErrorMessage(error, getErrorParts(error).message),
    };
    throw error;
  }
}

async function loadCodes() {
  const data = await callFirebaseFunction('listAffiliateCodesAdmin', {
    limit: 200,
    includeInactive: elements.includeInactiveCodes.checked,
  });

  state.codes = Array.isArray(data.items) ? data.items : [];
}

async function loadReports() {
  const data = await callFirebaseFunction('listAffiliatePayoutReportsAdmin', {
    limit: 24,
  });

  state.reports = Array.isArray(data.items) ? data.items : [];
}

async function loadBackendAuditLogs() {
  try {
    state.backendAuditLogs = await listAffiliateAdminAuditLogs(60);
    state.backendAuditUnavailableReason = '';
  } catch (error) {
    state.backendAuditLogs = [];
    state.backendAuditUnavailableReason = getActionableErrorMessage(
      error,
      'Could not load backend audit log.'
    );
  }
}

function renderRecipientList() {
  if (!elements.recipientList) return;

  const recipientDisabled = Boolean(state.recipientSettingsUnavailableReason);
  if (elements.recipientEmail) {
    elements.recipientEmail.disabled = recipientDisabled;
  }
  if (elements.addRecipientButton) {
    elements.addRecipientButton.disabled = recipientDisabled;
  }

  if (state.recipientSettingsUnavailableReason) {
    elements.recipientList.innerHTML = `<p class="admin-empty admin-empty--inline">${escapeHtml(state.recipientSettingsUnavailableReason)}</p>`;
    return;
  }

  const recipients = Array.isArray(state.reportRecipients) ? state.reportRecipients : [];
  if (!recipients.length) {
    elements.recipientList.innerHTML = '<p class="admin-empty admin-empty--inline">No scheduled recipients added yet.</p>';
    return;
  }

  elements.recipientList.innerHTML = recipients
    .map((email) => {
      return `
        <div class="admin-mini-item">
          <span class="admin-mini-item__title">${escapeHtml(email)}</span>
          <button type="button" class="btn btn--outline" data-remove-recipient="${escapeHtml(email)}">Remove</button>
        </div>
      `;
    })
    .join('');
}

async function loadAdminSettings() {
  try {
    const data = await getAffiliateAdminSettings();
    const recipients = Array.isArray(data.monthlyReportRecipients)
      ? data.monthlyReportRecipients.map((email) => normalizeEmail(email)).filter(Boolean)
      : [];
    state.reportRecipients = Array.from(new Set(recipients));
    state.partnerEmailsByCode = normalizePartnerEmailMap(data.affiliatePartnerEmails || {});
    state.partnerRegistryByCode = data.nuriaPartnersByCode && typeof data.nuriaPartnersByCode === 'object'
      ? data.nuriaPartnersByCode
      : {};
    state.partnerUidsByCode = data.partnerUidsByCode && typeof data.partnerUidsByCode === 'object'
      ? data.partnerUidsByCode
      : {};
    state.partnerProfilesByCode = normalizePartnerProfilesMap(data.partnerProfilesByCode || {});
    state.checklistByMonth = Object.assign(
      {},
      state.checklistByMonth || {},
      normalizeChecklistStateMap(data.affiliateChecklistByMonth || {})
    );
    state.monthLocks = Object.assign(
      {},
      state.monthLocks || {},
      normalizeMonthLocksMap(data.affiliateMonthLocks || {})
    );
    state.adminSettings = {
      defaultFlow: ['strict', 'balanced', 'fast'].includes(data.defaultFlow) ? data.defaultFlow : 'balanced',
      exportFormat: ['csv_pdf', 'csv_only', 'csv_json_pdf'].includes(data.exportFormat)
        ? data.exportFormat
        : 'csv_pdf',
      requireApproval: data.requireApproval !== false,
      notifyOnErrors: data.notifyOnErrors !== false,
      bouncedRecipients: normalizeEmailList(data.bouncedRecipients || []),
    };
    state.recipientSettingsUnavailableReason = '';
  } catch (error) {
    state.reportRecipients = [];
    state.partnerEmailsByCode = {};
    state.partnerRegistryByCode = {};
    state.partnerUidsByCode = {};
    state.partnerProfilesByCode = {};
    state.adminSettings = {
      defaultFlow: 'balanced',
      exportFormat: 'csv_pdf',
      requireApproval: true,
      notifyOnErrors: true,
      bouncedRecipients: [],
    };
    state.recipientSettingsUnavailableReason = getActionableErrorMessage(
      error,
      'Could not load scheduled recipient settings.'
    );
  }
}

async function savePartnerEmailMapping(code, partnerEmail, metadata, profileInput) {
  const normalizedCode = typeof site.normalizeReferralCode === 'function'
    ? site.normalizeReferralCode(code)
    : String(code || '').trim().toUpperCase().replace(/\s+/g, '');
  if (!normalizedCode) return;

  const nextMap = Object.assign({}, state.partnerEmailsByCode || {});
  const nextRegistry = Object.assign({}, state.partnerRegistryByCode || {});
  const nextUids = Object.assign({}, state.partnerUidsByCode || {});
  const nextProfiles = Object.assign({}, state.partnerProfilesByCode || {});
  const normalizedEmail = normalizeEmail(partnerEmail || '');
  const normalizedProfile = normalizePartnerProfile(profileInput || {});
  if (normalizedEmail && isValidEmail(normalizedEmail)) {
    let lookup = null;
    let status = 'mapped_unverified';
    let statusReason = 'not_found';
    try {
      lookup = await lookupNuriaPartnerByEmail(normalizedEmail);
      if (lookup?.found === true) {
        status = 'verified';
        statusReason = lookup.source || 'lookup';
      } else {
        status = 'mapped_unverified';
        statusReason = lookup?.source || 'not_found';
      }
    } catch (lookupError) {
      status = 'lookup_error';
      statusReason = getActionableErrorMessage(lookupError, getErrorParts(lookupError).message);
    }

    nextMap[normalizedCode] = normalizedEmail;
    nextRegistry[normalizedCode] = {
      email: lookup?.email || normalizedEmail,
      affiliateId: String(metadata?.affiliateId || '').trim(),
      displayName: String(metadata?.displayName || '').trim(),
      partnerUid: lookup?.uid || '',
      partnerDisplayName: lookup?.displayName || '',
      linkedAt: new Date().toISOString(),
      linkedBy: getActivityActor(),
      status,
      statusReason,
    };
    if (lookup?.uid) {
      nextUids[normalizedCode] = lookup.uid;
    } else {
      delete nextUids[normalizedCode];
    }
    if (normalizedProfile) {
      nextProfiles[normalizedCode] = normalizedProfile;
    } else {
      delete nextProfiles[normalizedCode];
    }
  } else {
    delete nextMap[normalizedCode];
    delete nextRegistry[normalizedCode];
    delete nextUids[normalizedCode];
    delete nextProfiles[normalizedCode];
  }

  await saveAffiliateAdminSettings({
    affiliatePartnerEmails: nextMap,
    nuriaPartnersByCode: nextRegistry,
    partnerUidsByCode: nextUids,
    partnerProfilesByCode: nextProfiles,
  });
  state.partnerEmailsByCode = nextMap;
  state.partnerRegistryByCode = nextRegistry;
  state.partnerUidsByCode = nextUids;
  state.partnerProfilesByCode = nextProfiles;
}

async function saveAdminSettingsPatch(patch) {
  await saveAffiliateAdminSettings(patch || {});
}

async function saveRecipients() {
  try {
    await saveAffiliateAdminSettings({
      monthlyReportRecipients: state.reportRecipients,
    });
    state.recipientSettingsUnavailableReason = '';
  } catch (error) {
    state.recipientSettingsUnavailableReason = getActionableErrorMessage(
      error,
      'Could not save scheduled recipient settings.'
    );
    renderRecipientList();
    throw error;
  }
}

function setUnauthorizedMessage(error) {
  const message = getErrorParts(error).message.toLowerCase();

  if (message.includes('admin_access_required')) {
    elements.unauthorizedCopy.textContent =
      'Your account is signed in, but it is not allowlisted for affiliate admin access.';
    return;
  }

  if (message.includes('admin_access_disabled')) {
    elements.unauthorizedCopy.textContent =
      'Your admin access exists but is currently disabled in Firestore.';
    return;
  }

  if (message.includes('admin_role_required')) {
    elements.unauthorizedCopy.textContent =
      'Your account is signed in, but it is not allowlisted for affiliate admin access.';
    return;
  }

  if (message.includes('admin_email_mismatch')) {
    elements.unauthorizedCopy.textContent =
      'The signed-in email does not match the email stored in the admin allowlist.';
    return;
  }

  elements.unauthorizedCopy.textContent =
    'The backend returned permission denied for this account.';
}

function handleLoadError(error) {
  const parts = getErrorParts(error);

  if (parts.code === 'unauthenticated') {
    clearSelectedReport();
    setView('signed-out');
    return;
  }

  if (parts.code === 'permission-denied') {
    clearSelectedReport();
    setUnauthorizedMessage(error);
    setView('not-authorized');
    clearBanner();
    return;
  }

  elements.errorCopy.textContent = parts.message;
  setView('error');
  showBanner(parts.message, 'error');
}

async function loadDashboard(options) {
  const settings = Object.assign(
    {
      preserveSelectedReport: true,
      showLoadingState: true,
    },
    options || {}
  );

  if (settings.showLoadingState) {
    setView('loading-dashboard');
  }

  clearBanner();

  try {
    await Promise.all([
      runHealthCheck('bootstrap', loadBootstrap),
      runHealthCheck('codes', loadCodes),
      runHealthCheck('reports', loadReports),
      runHealthCheck('audit_log', loadBackendAuditLogs),
      runHealthCheck('admin_settings', loadAdminSettings),
    ]);
    renderOverview();
    renderCodesTable();
    renderReportsTable();
    updateIdentity();
    setView('ready');
    setAdminPage(getAdminPageFromUrl(), { updateUrl: true });
    if (state.pendingOnboardingAfterLogin && !state.onboardingDismissed) {
      state.pendingOnboardingAfterLogin = false;
      setOnboardingStep(0);
      setOnboardingOpen(true);
    }

    if (!settings.preserveSelectedReport) {
      clearSelectedReport();
      return;
    }

    if (state.selectedReportId) {
      await loadReportDetail(state.selectedReportId, elements.includeRowsToggle.checked);
      return;
    }

    clearSelectedReport();
  } catch (error) {
    handleLoadError(error);
  }
}

async function loadReportDetail(reportId, includeRows) {
  if (!reportId) {
    clearSelectedReport();
    return;
  }

  state.selectedReportId = reportId;
  state.selectedReport = null;
  updateReportUrl(reportId);
  elements.reportDetailTitle.textContent = `Loading ${reportId}`;
  elements.reportDetailEmpty.hidden = false;
  elements.reportDetailContent.hidden = true;
  elements.loadReportRows.disabled = false;

  try {
    const data = await callFirebaseFunction('getAffiliatePayoutReportAdmin', {
      reportId,
      includeRows: includeRows === true,
      rowsLimit: includeRows === true ? 500 : 250,
      affiliatesLimit: 200,
    });

    if (!data.report) {
      throw new Error('report_not_found');
    }

    state.selectedReport = {
      report: data.report,
      affiliates: Array.isArray(data.affiliates) ? data.affiliates : [],
      rows: Array.isArray(data.rows) ? data.rows : [],
      rowsIncluded: data.rowsIncluded === true,
    };
    state.checklistMonthOverride = String(data.report?.periodMonth || elements.reportMonth?.value || '');
    if (elements.reportMonth && data.report?.periodMonth) {
      elements.reportMonth.value = data.report.periodMonth;
    }
    if (data.rowsIncluded === true) {
      setChecklistStep('verified', true, data.report?.periodMonth || elements.reportMonth.value);
    }
    renderSelectedReport();
  } catch (error) {
    clearSelectedReport();
    showBanner(getActionableErrorMessage(error, getErrorParts(error).message), 'error');
  }
}

async function handleEmailSignIn(event) {
  event.preventDefault();
  clearBanner();
  elements.authError.hidden = true;
  elements.authError.textContent = '';

  const formData = new FormData(elements.emailSignInForm);
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '');
  const submitButton = elements.emailSignInForm.querySelector('button[type="submit"]');

  setButtonBusy(submitButton, true, 'Signing in');

  try {
    await waitForAuthPersistenceReady();
    await signInWithEmailPassword(email, password);
    state.pendingOnboardingAfterLogin = true;
    await playLoginSuccessSound();
  } catch (error) {
    const parts = getErrorParts(error);
    elements.authError.hidden = false;
    elements.authError.textContent = parts.message;
  } finally {
    setButtonBusy(submitButton, false);
  }
}

async function handleSendPasswordReset() {
  const email = String(elements.emailSignInForm?.querySelector('[name="email"]')?.value || '').trim();
  if (!email) {
    elements.authError.hidden = false;
    elements.authError.textContent = 'Enter your admin email first, then click password reset.';
    return;
  }

  elements.authError.hidden = true;
  elements.authError.textContent = '';
  setButtonBusy(elements.sendPasswordResetButton, true, 'Sending');

  try {
    await sendPasswordReset(email);
    showBanner('Password reset email sent. Check your inbox and spam folder.', 'success');
  } catch (error) {
    const message = getActionableErrorMessage(error, getErrorParts(error).message);
    elements.authError.hidden = false;
    elements.authError.textContent = message;
  } finally {
    setButtonBusy(elements.sendPasswordResetButton, false);
  }
}

async function handlePlaySpiritSound() {
  setButtonBusy(elements.playSpiritSound, true, 'Playing');
  await playLoginSuccessSound();
  showSpiritToast();
  setButtonBusy(elements.playSpiritSound, false);
  setSpiritButtonFunLabel();
}

async function handleCopyReferralLink() {
  const link = String(elements.codeReferralLink?.dataset?.value || '').trim();
  if (!link) {
    showBanner('Enter a referral code first to generate a link.', 'info');
    return;
  }

  try {
    await copyPlainText(link);
    showBanner('Referral link copied.', 'success');
  } catch (_error) {
    showBanner('Could not copy link on this browser.', 'error');
  }
}

function handleExportOpsSnapshotJson() {
  const snapshot = getOpsSnapshot();
  createAndDownloadFile(
    `nuria-affiliate-ops-snapshot-${snapshot.selectedMonth || 'unknown'}.json`,
    JSON.stringify(snapshot, null, 2),
    'application/json;charset=utf-8'
  );
  addActivityLog(`Exported ops snapshot JSON for ${snapshot.selectedMonth || 'current month'}.`, 'success');
  showBanner('Ops snapshot JSON exported.', 'success');
}

function handleExportOpsSnapshotCsv() {
  const snapshot = getOpsSnapshot();
  createAndDownloadFile(
    `nuria-affiliate-ops-snapshot-${snapshot.selectedMonth || 'unknown'}.csv`,
    buildOpsSnapshotCsv(snapshot),
    'text/csv;charset=utf-8'
  );
  addActivityLog(`Exported ops snapshot CSV for ${snapshot.selectedMonth || 'current month'}.`, 'success');
  showBanner('Ops snapshot CSV exported.', 'success');
}

async function handleRefreshBackendAudit() {
  await loadBackendAuditLogs();
  renderBackendAuditLog();
  renderHealthDashboard();
  if (state.backendAuditUnavailableReason) {
    showBanner(state.backendAuditUnavailableReason, 'error');
    return;
  }
  try {
    showBanner('Backend audit log refreshed.', 'success');
  } catch (error) {
    showBanner(getActionableErrorMessage(error, 'Could not refresh backend audit log.'), 'error');
  }
}

async function handleRefreshHealth() {
  clearBanner();
  try {
    await Promise.all([
      runHealthCheck('bootstrap', loadBootstrap),
      runHealthCheck('reports', loadReports),
      runHealthCheck('audit_log', loadBackendAuditLogs),
      runHealthCheck('admin_settings', loadAdminSettings),
    ]);
    renderOverview();
    renderReportsTable();
    showBanner('Health checks refreshed.', 'success');
  } catch (error) {
    renderHealthDashboard();
    showBanner(getActionableErrorMessage(error, 'One or more health checks failed.'), 'error');
  }
}

async function handleReverifyPartnerRegistry() {
  const map = Object.assign({}, state.partnerEmailsByCode || {});
  const codes = Object.keys(map);
  if (!codes.length) {
    showBanner('No linked partner emails found to verify yet.', 'info');
    return;
  }

  setButtonBusy(elements.reverifyPartnerRegistry, true, 'Verifying');
  clearBanner();
  try {
    for (const code of codes) {
      const codeItem = (state.codes || []).find((item) => String(item.code || '').toUpperCase() === code);
      await savePartnerEmailMapping(code, map[code], {
        affiliateId: codeItem?.affiliateId || '',
        displayName: codeItem?.displayName || '',
      }, state.partnerProfilesByCode?.[code] || null);
    }
    renderPartnerRegistry();
    showBanner('Partner registry re-verification completed.', 'success');
    addActivityLog('Re-verified Nuria partners registry.', 'success');
  } catch (error) {
    showBanner(getActionableErrorMessage(error, 'Could not re-verify some partner mappings.'), 'error');
  } finally {
    setButtonBusy(elements.reverifyPartnerRegistry, false);
  }
}

async function handleRecipientAdd(event) {
  event.preventDefault();
  const email = normalizeEmail(elements.recipientEmail?.value || '');

  if (!isValidEmail(email)) {
    showBanner('Enter a valid email address before adding recipient.', 'info');
    return;
  }

  if (state.reportRecipients.includes(email)) {
    showBanner('This recipient is already in the schedule list.', 'info');
    return;
  }

  const next = state.reportRecipients.concat(email).sort();
  try {
    state.reportRecipients = next;
    await saveRecipients();
    renderRecipientList();
    renderSettingsForm();
    renderAlertCenter();
    if (elements.recipientEmail) elements.recipientEmail.value = '';
    showBanner(`Added scheduled recipient ${email}.`, 'success');
    addActivityLog(`Added scheduled report recipient ${email}.`, 'success');
  } catch (error) {
    showBanner(getActionableErrorMessage(error, 'Could not save recipient list to backend.'), 'error');
  }
}

async function handleSaveSettings(event) {
  event.preventDefault();
  if (state.saveSettingsInFlight) return;
  if (!elements.settingsForm) return;
  clearBanner();
  if (elements.settingsError) {
    elements.settingsError.hidden = true;
    elements.settingsError.textContent = '';
  }

  const nextRecipients = normalizeEmailList(elements.settingsRecipients?.value || '');
  const bouncedRecipients = normalizeEmailList(elements.settingsBouncedRecipients?.value || '');
  const payload = {
    defaultFlow: elements.settingsDefaultFlow?.value || 'balanced',
    exportFormat: elements.settingsExportFormat?.value || 'csv_pdf',
    requireApproval: elements.settingsRequireApproval?.checked !== false,
    notifyOnErrors: elements.settingsNotifyOnErrors?.checked !== false,
    monthlyReportRecipients: nextRecipients,
    bouncedRecipients,
  };

  state.saveSettingsInFlight = true;
  setButtonBusy(elements.saveSettingsButton, true, 'Saving');
  try {
    await saveAdminSettingsPatch(payload);
    state.reportRecipients = nextRecipients;
    state.adminSettings = {
      defaultFlow: payload.defaultFlow,
      exportFormat: payload.exportFormat,
      requireApproval: payload.requireApproval,
      notifyOnErrors: payload.notifyOnErrors,
      bouncedRecipients: payload.bouncedRecipients,
    };
    renderOverview();
    renderApprovalFlow(state.selectedReport?.report || null);
    showBanner('Admin settings saved.', 'success');
    addActivityLog('Saved admin settings profile.', 'success');
  } catch (error) {
    const message = getActionableErrorMessage(error, 'Could not save admin settings.');
    if (elements.settingsError) {
      elements.settingsError.hidden = false;
      elements.settingsError.textContent = message;
    }
    showBanner(message, 'error');
  } finally {
    state.saveSettingsInFlight = false;
    setButtonBusy(elements.saveSettingsButton, false);
  }
}

async function handleRecipientRemove(email) {
  const targetEmail = normalizeEmail(email);
  const next = state.reportRecipients.filter((item) => item !== targetEmail);
  try {
    state.reportRecipients = next;
    await saveRecipients();
    renderRecipientList();
    renderSettingsForm();
    renderAlertCenter();
    showBanner(`Removed scheduled recipient ${targetEmail}.`, 'success');
    addActivityLog(`Removed scheduled report recipient ${targetEmail}.`, 'info');
  } catch (error) {
    showBanner(getActionableErrorMessage(error, 'Could not update recipient list on backend.'), 'error');
  }
}

async function handleRunNextStep() {
  switch (state.nextStepAction) {
    case 'select_latest_report': {
      const latest = (state.reports || [])[0];
      if (!latest?.reportId) {
        showBanner('No report available yet. Generate a report first.', 'info');
        return;
      }
      elements.includeRowsToggle.checked = false;
      await loadReportDetail(latest.reportId, false);
      addActivityLog(`Action center selected latest report ${latest.reportId}.`, 'info');
      return;
    }
    case 'unlock_month':
      handleToggleMonthLock();
      return;
    case 'load_rows':
      elements.includeRowsToggle.checked = true;
      await loadReportDetail(state.selectedReportId, true);
      return;
    case 'export_csv':
      await handleExportCsv();
      return;
    case 'finalize_payout':
      await handleFinalizePayout();
      return;
    case 'close_package':
      await handleClosePackage();
      return;
    case 'export_pdf':
      await handleExportPdf();
      return;
    default:
      showBanner('Nothing pending in action center.', 'info');
  }
}

async function copyPlainText(text) {
  if (typeof site.copyText === 'function') {
    await site.copyText(text);
    return;
  }

  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  throw new Error('copy_failed');
}

async function handleCopyReportDeepLink() {
  if (!state.selectedReportId) {
    showBanner('Select a report before copying a deep link.', 'info');
    return;
  }

  const deepLink = `${window.location.origin}${window.location.pathname}?report=${encodeURIComponent(state.selectedReportId)}`;

  try {
    await copyPlainText(deepLink);
    addActivityLog(`Copied report deep link for ${state.selectedReportId}.`, 'success');
    showBanner('Report deep link copied.', 'success');
  } catch (_error) {
    showBanner('Could not copy report deep link on this browser.', 'error');
  }
}

function handleOpenPartnerJoin() {
  const firstCode = (state.codes || []).find((item) => item.status === 'active')?.code
    || (state.recentCodes || []).find((item) => item.code)?.code
    || '';

  if (!firstCode) {
    showBanner('No active referral code found yet. Create one first.', 'info');
    return;
  }

  const joinUrl = `${window.location.origin}/join/${encodeURIComponent(firstCode)}`;
  window.open(joinUrl, '_blank', 'noopener,noreferrer');
  addActivityLog(`Opened partner join page for ${firstCode}.`, 'info');
  showBanner(`Opened join page for ${firstCode}.`, 'success');
}

function handleToggleCompactMode() {
  state.compactMode = !state.compactMode;
  persistCompactMode();
  applyCompactMode();
  addActivityLog(
    state.compactMode ? 'Enabled compact mode.' : 'Switched to standard mode.',
    'info'
  );
}

function handleOpenOnboarding() {
  setOnboardingOpen(true);
}

function handleCloseOnboarding() {
  setOnboardingOpen(false);
  markOnboardingClosedThisSession();
}

function handleDismissOnboarding() {
  state.onboardingDismissed = true;
  persistOnboardingDismissed(true);
  setOnboardingOpen(false);
  addActivityLog('Disabled quick tour auto-open for this browser.', 'info');
}

function handleToggleMonthLock() {
  const monthKey = getChecklistMonthKey();
  const nextLocked = !isMonthLocked(monthKey);
  let reason = '';

  if (nextLocked) {
    const inputReason = window.prompt(
      `Lock month ${monthKey}. Add a short reason (optional but recommended):`,
      'Finance reconciliation completed'
    );

    if (inputReason == null) {
      return;
    }

    reason = String(inputReason || '').trim();
  }

  setMonthLocked(monthKey, nextLocked, reason);

  addActivityLog(
    nextLocked
      ? `Locked payout month ${monthKey}${reason ? ` (${reason})` : ''}.`
      : `Unlocked payout month ${monthKey}.`,
    nextLocked ? 'info' : 'success'
  );
  showBanner(
    nextLocked
      ? `Month ${monthKey} is now locked.${reason ? ` Reason: ${reason}` : ''}`
      : `Month ${monthKey} is now unlocked.`,
    'info'
  );

  if (state.selectedReport?.report) {
    renderSelectedReport();
  }
  renderNextStep();
}

async function handleSignOut() {
  clearBanner();

  try {
    await signOutUser();
    state.pendingOnboardingAfterLogin = false;
    state.admin = null;
    resetCodeForm(null);
    clearSelectedReport();
    updateIdentity();
    showBanner('Signed out.', 'success');
    setView('signed-out');
  } catch (error) {
    showBanner(getErrorParts(error).message, 'error');
  }
}

async function handleCodeSave(event) {
  event.preventDefault();

  if (state.saveCodeInFlight) {
    return;
  }

  clearBanner();
  setCodeFormError('');

  const editing = elements.editingExistingCode.value === 'true';
  const payload = {
    code: typeof site.normalizeReferralCode === 'function'
      ? site.normalizeReferralCode(elements.codeValue.value)
      : String(elements.codeValue.value || '').trim().toUpperCase().replace(/\s+/g, ''),
    affiliateId: elements.affiliateId.value.trim(),
    displayName: elements.displayName.value.trim() || null,
    status: elements.codeStatus.value,
    revenueShareBps: Number(elements.revenueShareBps.value),
    fixedPayoutMinor: elements.fixedPayoutMinor.value.trim()
      ? Number(elements.fixedPayoutMinor.value)
      : null,
    currency: elements.currency.value.trim().toUpperCase() || null,
  };
  const partnerNuriaEmail = normalizeEmail(elements.partnerNuriaEmail?.value || '');
  const partnerProfile = readPartnerProfileFromForm();
  if (partnerNuriaEmail && !isValidEmail(partnerNuriaEmail)) {
    setCodeFormError('Partner Nuria email is invalid.');
    showBanner('Fix the partner email format before saving.', 'info');
    return;
  }
  if (partnerProfile.partnerType === 'company' && partnerProfile.vat && partnerProfile.vat.length < 4) {
    setCodeFormError('VAT looks too short. Enter a valid VAT value or leave it empty.');
    showBanner('Fix the company VAT value before saving.', 'info');
    return;
  }
  const validationError = validateCodePayload(payload);

  if (validationError) {
    setCodeFormError(validationError);
    showBanner('Fix the highlighted code form issue and submit again.', 'info');
    return;
  }

  state.saveCodeInFlight = true;
  setButtonBusy(elements.saveCodeButton, true, 'Saving');

  try {
    const data = await callFirebaseFunction('upsertAffiliateCodeAdmin', payload);
    const saved = data.item || payload;

    track('affiliate_admin_code_saved', {
      mode: editing ? 'update' : 'create',
      code: saved.code || payload.code,
      affiliate_id: saved.affiliateId || payload.affiliateId,
    });

    await Promise.all([loadBootstrap(), loadCodes()]);
    try {
      await savePartnerEmailMapping(saved.code || payload.code, partnerNuriaEmail, {
        affiliateId: saved.affiliateId || payload.affiliateId,
        displayName: saved.displayName || payload.displayName || '',
      }, partnerProfile);
    } catch (emailError) {
      showBanner(
        getActionableErrorMessage(
          emailError,
          'Code saved, but partner email mapping could not be saved. Try again.'
        ),
        'error'
      );
    }
    renderOverview();
    renderCodesTable();
    resetCodeForm(saved);
    showBanner(
      editing
        ? `Updated code ${saved.code || payload.code}.`
        : `Created code ${saved.code || payload.code}.`,
      'success'
    );
    addActivityLog(
      editing
        ? `Updated referral code ${saved.code || payload.code}.`
        : `Created referral code ${saved.code || payload.code}.`,
      'success'
    );
  } catch (error) {
    const actionable = getActionableErrorMessage(error, getErrorParts(error).message);
    setCodeFormError(actionable);
    showBanner(actionable, 'error');
  } finally {
    state.saveCodeInFlight = false;
    setButtonBusy(elements.saveCodeButton, false);
  }
}

async function handleGenerateReport(event) {
  event.preventDefault();

  if (state.generateReportInFlight) {
    return;
  }

  if (!guardMonthUnlocked('generate a report', elements.reportMonth.value)) {
    return;
  }

  clearBanner();
  state.generateReportInFlight = true;
  setButtonBusy(elements.generateReportButton, true, 'Generating');

  try {
    const data = await callFirebaseFunction('generateAffiliateMonthlyPayoutReportManual', {
      month: elements.reportMonth.value,
      sendEmail: elements.sendEmail.checked,
    });

    track('affiliate_admin_report_generated', {
      month: data.month || elements.reportMonth.value,
      report_id: data.reportId || null,
      send_email: elements.sendEmail.checked,
    });

    await Promise.all([loadBootstrap(), loadReports()]);
    renderOverview();
    renderReportsTable();
    showBanner(
      `Generated payout report ${data.reportId || elements.reportMonth.value}.`,
      'success'
    );
    addActivityLog(`Generated payout report ${data.reportId || elements.reportMonth.value}.`, 'success');
    setChecklistStep('generated', true, data.month || elements.reportMonth.value);

    if (data.reportId) {
      await loadReportDetail(data.reportId, elements.includeRowsToggle.checked);
    }
  } catch (error) {
    showBanner(getActionableErrorMessage(error, getErrorParts(error).message), 'error');
  } finally {
    state.generateReportInFlight = false;
    setButtonBusy(elements.generateReportButton, false);
  }
}

function ensurePayoutApproval(reportId, actionLabel) {
  if (state.adminSettings?.requireApproval === false) {
    return true;
  }

  const actor = normalizeEmail(getActivityActor());
  const currentRef = String(elements.paymentReference?.value || '').trim();
  const currentNote = String(elements.paymentNote?.value || '').trim();
  const existing = getApprovalEntry(reportId);
  if (!existing) {
    state.approvalRequests[reportId] = {
      requestedBy: actor || 'admin',
      requestedAt: new Date().toISOString(),
      paymentReference: currentRef || null,
      note: currentNote || null,
      approvedBy: '',
      approvedAt: '',
    };
    renderApprovalFlow(state.selectedReport?.report || null);
    showBanner(`Approval request created for ${actionLabel}. A second admin must approve before continuing.`, 'info');
    addActivityLog(`Created payout approval request for report ${reportId}.`, 'info');
    return false;
  }

  if (!existing.approvedAt) {
    showBanner(`Approval is pending for report ${reportId}. Use "Approve pending payout request".`, 'info');
    renderApprovalFlow(state.selectedReport?.report || null);
    return false;
  }
  return true;
}

function clearPayoutApproval(reportId) {
  if (!reportId) return;
  delete state.approvalRequests[reportId];
}

function handleApproveMarkPaid() {
  const reportId = state.selectedReport?.report?.reportId || state.selectedReportId;
  if (!reportId) {
    showBanner('Select a report before approving payout.', 'info');
    return;
  }
  const approval = getApprovalEntry(reportId);
  if (!approval) {
    showBanner('No pending approval request for this report yet.', 'info');
    return;
  }
  const actor = normalizeEmail(getActivityActor());
  if (normalizeEmail(approval.requestedBy || '') === actor) {
    showBanner('Approval requires a second admin account. Sign in with another allowlisted account.', 'error');
    return;
  }
  approval.approvedBy = actor || 'admin';
  approval.approvedAt = new Date().toISOString();
  renderApprovalFlow(state.selectedReport?.report || null);
  showBanner(`Approval recorded for report ${reportId}. You can now complete payout actions.`, 'success');
  addActivityLog(`Approved payout request for report ${reportId}.`, 'success');
}

async function handleMarkPaid(event) {
  event.preventDefault();

  if (state.markPaidInFlight) {
    return;
  }

  const reportId = state.selectedReport?.report?.reportId || '';
  const reportMonth = state.selectedReport?.report?.periodMonth || elements.reportMonth.value;
  if (!reportId) {
    showBanner('Load a payout report before marking it as paid.', 'info');
    return;
  }

  if (!guardMonthUnlocked('mark this report as paid', reportMonth)) {
    return;
  }

  if (!ensurePayoutApproval(reportId, 'marking report as paid')) {
    return;
  }

  if (!window.confirm(`Mark report ${reportId} as paid?`)) {
    return;
  }

  clearBanner();
  state.markPaidInFlight = true;
  setButtonBusy(elements.markPaidButton, true, 'Marking paid');

  try {
    const data = await markReportPaid(reportId);

    track('affiliate_admin_report_marked_paid', {
      report_id: reportId,
      already_paid: data.alreadyPaid === true,
      marked_rows: data.markedLedgerRows || 0,
    });

    await Promise.all([loadBootstrap(), loadReports()]);
    renderOverview();
    renderReportsTable();
    showBanner(
      data.alreadyPaid === true
        ? `Report ${reportId} was already marked paid.`
        : `Marked report ${reportId} as paid.`,
      'success'
    );
    addActivityLog(
      data.alreadyPaid === true
        ? `Report ${reportId} was already paid.`
        : `Marked report ${reportId} as paid.`,
      'success'
    );
    setChecklistStep('paid', true, state.selectedReport?.report?.periodMonth || elements.reportMonth.value);
    clearPayoutApproval(reportId);
    await loadReportDetail(reportId, elements.includeRowsToggle.checked);
  } catch (error) {
    showBanner(getActionableErrorMessage(error, getErrorParts(error).message), 'error');
  } finally {
    state.markPaidInFlight = false;
    setButtonBusy(elements.markPaidButton, false);
  }
}

async function markReportPaid(reportId) {
  return callFirebaseFunction('markAffiliatePayoutReportPaidAdmin', {
    reportId,
    paymentReference: elements.paymentReference.value.trim() || null,
    note: elements.paymentNote.value.trim() || null,
  });
}

async function withExportLock(callback) {
  if (state.exportInFlight) {
    return;
  }

  state.exportInFlight = true;
  setButtonBusy(elements.exportCsvButton, true, 'Exporting');
  setButtonBusy(elements.exportPdfButton, true, 'Exporting');
  setButtonBusy(elements.exportTestButton, true, 'Exporting');
  setButtonBusy(elements.closePackageButton, true, 'Exporting');
  clearBanner();

  try {
    await callback();
  } finally {
    state.exportInFlight = false;
    setButtonBusy(elements.exportCsvButton, false);
    setButtonBusy(elements.exportPdfButton, false);
    setButtonBusy(elements.exportTestButton, false);
    setButtonBusy(elements.closePackageButton, false);
  }
}

async function handleExportCsv() {
  const reportId = state.selectedReport?.report?.reportId || state.selectedReportId;
  if (!reportId) {
    showBanner('Select a payout report before exporting.', 'info');
    return;
  }

  await withExportLock(async () => {
    try {
      const detail = await loadReportDetailForExport(reportId);
      const csv = buildCsvExport(detail);
      createAndDownloadFile(
        buildExportFilename(detail.report, 'csv'),
        csv,
        'text/csv;charset=utf-8'
      );
      showBanner('CSV export downloaded.', 'success');
      addActivityLog(`Exported CSV for ${detail.report?.periodMonth || reportId}.`, 'success');
      setChecklistStep('exported', true, detail.report?.periodMonth || elements.reportMonth.value);
    } catch (error) {
      showBanner(getActionableErrorMessage(error, getErrorParts(error).message), 'error');
    }
  });
}

async function handleExportPdf() {
  const reportId = state.selectedReport?.report?.reportId || state.selectedReportId;
  if (!reportId) {
    showBanner('Select a payout report before exporting.', 'info');
    return;
  }

  await withExportLock(async () => {
    try {
      const detail = await loadReportDetailForExport(reportId);
      const html = buildPrintableHtml(detail);
      const opened = openPrintableExport(html);
      if (!opened) {
        showBanner('Popup blocked. Allow popups to open the PDF export view.', 'error');
        return;
      }
      showBanner('PDF export view opened. Use "Save as PDF" in the print dialog.', 'success');
      addActivityLog(`Opened PDF export for ${detail.report?.periodMonth || reportId}.`, 'success');
      setChecklistStep('exported', true, detail.report?.periodMonth || elements.reportMonth.value);
    } catch (error) {
      showBanner(getActionableErrorMessage(error, getErrorParts(error).message), 'error');
    }
  });
}

async function handleExportTestSample() {
  if (state.exportInFlight || state.finalizeInFlight) {
    return;
  }

  await withExportLock(async () => {
    const sampleDetail = createSampleExportDetail();
    const csv = buildCsvExport(sampleDetail);
    createAndDownloadFile(
      'nuria-affiliate-report-sample.csv',
      csv,
      'text/csv;charset=utf-8'
    );
    const reportPdfTemplateHtml = buildPrintableHtml(sampleDetail, {
      title: 'Nuria Affiliate Report Sample Export',
      subtitle: 'Sample data preview for formatting and branding checks',
      footerNote: 'This document uses example data only.',
      includeRows: true,
    });
    const receiptPdfTemplateHtml = buildPayoutReceiptHtml(
      sampleDetail,
      'SAMPLE-PAYMENT-REF-2026',
      'Sample payout receipt preview for structure validation.'
    );

    createAndDownloadFile(
      'nuria-affiliate-report-sample-pdf-template.html',
      reportPdfTemplateHtml,
      'text/html;charset=utf-8'
    );
    createAndDownloadFile(
      'nuria-affiliate-receipt-sample-pdf-template.html',
      receiptPdfTemplateHtml,
      'text/html;charset=utf-8'
    );

    const reportOpened = openPrintableExport(reportPdfTemplateHtml);
    const receiptOpened = openPrintableExport(receiptPdfTemplateHtml);
    if (!reportOpened || !receiptOpened) {
      showBanner(
        'Sample CSV + PDF template files downloaded. Allow popups to open both sample PDF preview windows.',
        'info'
      );
      addActivityLog('Exported sample CSV + PDF templates (preview popup blocked).', 'info');
      return;
    }

    showBanner('Sample export created (CSV + PDF template files + two PDF preview windows).', 'success');
    addActivityLog('Exported sample CSV + PDF template files and opened sample PDF previews.', 'success');
  });
}

async function handleFinalizePayout() {
  if (state.finalizeInFlight || state.exportInFlight || state.markPaidInFlight) {
    return;
  }

  const reportId = state.selectedReport?.report?.reportId || state.selectedReportId;
  const reportMonth = state.selectedReport?.report?.periodMonth || elements.reportMonth.value;
  if (!reportId) {
    showBanner('Select a payout report before finalizing payout.', 'info');
    return;
  }

  if (!guardMonthUnlocked('finalize payout', reportMonth)) {
    return;
  }

  if (!ensurePayoutApproval(reportId, 'finalizing payout')) {
    return;
  }

  if (!window.confirm(`Finalize payout for report ${reportId}? This exports data and marks the report as paid.`)) {
    return;
  }

  clearBanner();
  state.finalizeInFlight = true;
  state.exportInFlight = true;
  state.markPaidInFlight = true;
  setButtonBusy(elements.finalizePayoutButton, true, 'Finalizing');
  setButtonBusy(elements.exportCsvButton, true, 'Finalizing');
  setButtonBusy(elements.exportPdfButton, true, 'Finalizing');
  setButtonBusy(elements.exportTestButton, true, 'Finalizing');
  setButtonBusy(elements.closePackageButton, true, 'Finalizing');
  setButtonBusy(elements.markPaidButton, true, 'Finalizing');

  try {
    const detailForExport = await loadReportDetailForExport(reportId);
    const csv = buildCsvExport(detailForExport);
    createAndDownloadFile(
      buildExportFilename(detailForExport.report, 'csv'),
      csv,
      'text/csv;charset=utf-8'
    );

    const paidResult = await markReportPaid(reportId);
    await Promise.all([loadBootstrap(), loadReports()]);
    renderOverview();
    renderReportsTable();
    await loadReportDetail(reportId, true);
    const updatedDetail = await loadReportDetailForExport(reportId);
    const receiptHtml = buildPayoutReceiptHtml(
      updatedDetail,
      elements.paymentReference.value.trim(),
      elements.paymentNote.value.trim()
    );
    const opened = openPrintableExport(receiptHtml);

    track('affiliate_admin_payout_finalized', {
      report_id: reportId,
      already_paid: paidResult.alreadyPaid === true,
      marked_rows: paidResult.markedLedgerRows || 0,
    });

    if (!opened) {
      showBanner('Payout finalized and CSV exported. Allow popups to open the receipt PDF view.', 'success');
      addActivityLog(`Finalized payout for ${reportId} and exported CSV.`, 'success');
      markChecklistSteps(['exported', 'paid'], true, updatedDetail.report?.periodMonth || elements.reportMonth.value);
      return;
    }

    showBanner('Payout finalized, CSV exported, and receipt PDF view opened.', 'success');
    addActivityLog(`Finalized payout for ${reportId} with receipt PDF export.`, 'success');
    clearPayoutApproval(reportId);
    markChecklistSteps(
      ['exported', 'paid', 'receipt', 'verified'],
      true,
      updatedDetail.report?.periodMonth || elements.reportMonth.value
    );
  } catch (error) {
    showBanner(getActionableErrorMessage(error, getErrorParts(error).message), 'error');
  } finally {
    state.finalizeInFlight = false;
    state.exportInFlight = false;
    state.markPaidInFlight = false;
    setButtonBusy(elements.finalizePayoutButton, false);
    setButtonBusy(elements.exportCsvButton, false);
    setButtonBusy(elements.exportPdfButton, false);
    setButtonBusy(elements.exportTestButton, false);
    setButtonBusy(elements.closePackageButton, false);
    setButtonBusy(elements.markPaidButton, false);
  }
}

async function handleClosePackage() {
  if (state.closePackageInFlight || state.exportInFlight || state.finalizeInFlight || state.markPaidInFlight) {
    return;
  }

  const reportId = state.selectedReport?.report?.reportId || state.selectedReportId;
  const reportMonth = state.selectedReport?.report?.periodMonth || elements.reportMonth.value;
  if (!reportId) {
    showBanner('Select a payout report before generating a month-end package.', 'info');
    return;
  }

  if (!guardMonthUnlocked('generate close package', reportMonth)) {
    return;
  }

  clearBanner();
  state.closePackageInFlight = true;
  setButtonBusy(elements.closePackageButton, true, 'Packaging');
  setButtonBusy(elements.exportCsvButton, true, 'Packaging');
  setButtonBusy(elements.exportPdfButton, true, 'Packaging');
  setButtonBusy(elements.exportOpsSnapshotJson, true, 'Packaging');
  setButtonBusy(elements.exportOpsSnapshotCsv, true, 'Packaging');

  try {
    const detail = await loadReportDetailForExport(reportId);
    const snapshot = getOpsSnapshot();
    const payoutCsv = buildCsvExport(detail);
    const snapshotJson = JSON.stringify(snapshot, null, 2);
    createAndDownloadFile(
      buildExportFilename(detail.report, 'csv'),
      payoutCsv,
      'text/csv;charset=utf-8'
    );
    createAndDownloadFile(
      `nuria-affiliate-ops-snapshot-${detail.report?.periodMonth || reportMonth || 'unknown'}.json`,
      snapshotJson,
      'application/json;charset=utf-8'
    );

    const receiptHtml = buildPayoutReceiptHtml(
      detail,
      elements.paymentReference.value.trim(),
      elements.paymentNote.value.trim()
    );
    const opened = openPrintableExport(receiptHtml);

    track('affiliate_admin_close_package_exported', {
      report_id: reportId,
      month: detail.report?.periodMonth || reportMonth,
      opened_pdf: opened === true,
    });

    markChecklistSteps(
      opened ? ['exported', 'receipt'] : ['exported'],
      true,
      detail.report?.periodMonth || reportMonth
    );

    addActivityLog(
      opened
        ? `Generated month-end package for ${detail.report?.periodMonth || reportMonth} (CSV + ops JSON + receipt PDF).`
        : `Generated month-end package for ${detail.report?.periodMonth || reportMonth} (CSV + ops JSON, PDF blocked).`,
      'success'
    );

    showBanner(
      opened
        ? 'Close package generated: payout CSV + ops JSON + receipt PDF view.'
        : 'Close package generated: payout CSV + ops JSON. Allow popups to open receipt PDF view.',
      'success'
    );
  } catch (error) {
    showBanner(getActionableErrorMessage(error, getErrorParts(error).message), 'error');
  } finally {
    state.closePackageInFlight = false;
    setButtonBusy(elements.closePackageButton, false);
    setButtonBusy(elements.exportCsvButton, false);
    setButtonBusy(elements.exportPdfButton, false);
    setButtonBusy(elements.exportOpsSnapshotJson, false);
    setButtonBusy(elements.exportOpsSnapshotCsv, false);
  }
}

function bindMiniListActions() {
  [elements.overviewReports, elements.reportsTableBody].forEach((container) => {
    container?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-report-id]');
      if (!button) return;

      elements.includeRowsToggle.checked = false;
      loadReportDetail(button.dataset.reportId, false);
    });
  });

  [elements.overviewCodes, elements.codeTableBody].forEach((container) => {
    container?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-code-id]');
      if (!button) return;

      const item = state.codes.find((code) => code.code === button.dataset.codeId)
        || state.recentCodes.find((code) => code.code === button.dataset.codeId);

      if (item) {
        resetCodeForm(item);
        clearBanner();
      }
    });
  });
}

function bindEvents() {
  elements.pageLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      const pageKey = link.dataset.adminPageLink;
      if (!pageKey) return;
      event.preventDefault();
      setAdminPage(pageKey, { updateUrl: true });
      setMobileNavOpen(false);
    });
  });
  elements.mobileNavToggle?.addEventListener('click', () => {
    const isOpen = elements.topbar?.classList.contains('admin-topbar--mobile-open');
    setMobileNavOpen(!isOpen);
  });
  elements.mobileNavBackdrop?.addEventListener('click', () => setMobileNavOpen(false));
  elements.mobileNavClose?.addEventListener('click', () => setMobileNavOpen(false));
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (!elements.topbar?.classList.contains('admin-topbar--mobile-open')) return;
    setMobileNavOpen(false);
  });
  elements.checklistNavToggle?.addEventListener('click', () => {
    if (!elements.checklistNavPopover) return;
    const isOpen = elements.checklistNavPopover.hidden === false;
    setChecklistPopoverOpen(!isOpen);
  });
  document.addEventListener('click', (event) => {
    if (!elements.checklistNavPopover || !elements.checklistNavToggle) return;
    if (elements.checklistNavPopover.hidden) return;
    const withinPopover = event.target.closest('#adminChecklistNavPopover');
    const withinToggle = event.target.closest('#adminChecklistNavToggle');
    if (withinPopover || withinToggle) return;
    setChecklistPopoverOpen(false);
  });
  window.addEventListener('resize', () => {
    setMobileNavOpen(false);
  });
  elements.emailSignInForm?.addEventListener('submit', handleEmailSignIn);
  elements.sendPasswordResetButton?.addEventListener('click', handleSendPasswordReset);
  elements.playSpiritSound?.addEventListener('click', handlePlaySpiritSound);
  elements.signOutTop?.addEventListener('click', handleSignOut);
  elements.signOutUnauthorized?.addEventListener('click', handleSignOut);
  elements.retryLoad?.addEventListener('click', () => loadDashboard());
  elements.refreshOverview?.addEventListener('click', () => loadDashboard());
  elements.copyReportDeepLink?.addEventListener('click', handleCopyReportDeepLink);
  elements.openPartnerJoin?.addEventListener('click', handleOpenPartnerJoin);
  elements.openOnboarding?.addEventListener('click', handleOpenOnboarding);
  elements.toggleCompactMode?.addEventListener('click', handleToggleCompactMode);
  elements.exportOpsSnapshotJson?.addEventListener('click', handleExportOpsSnapshotJson);
  elements.exportOpsSnapshotCsv?.addEventListener('click', handleExportOpsSnapshotCsv);
  elements.refreshBackendAudit?.addEventListener('click', handleRefreshBackendAudit);
  elements.refreshHealth?.addEventListener('click', handleRefreshHealth);
  elements.reverifyPartnerRegistry?.addEventListener('click', handleReverifyPartnerRegistry);
  elements.runNextStep?.addEventListener('click', handleRunNextStep);
  elements.clearOpsLog?.addEventListener('click', () => {
    clearActivityLog();
    showBanner('Activity log cleared for this browser.', 'info');
  });
  elements.onboardingClose?.addEventListener('click', handleCloseOnboarding);
  elements.onboardingStart?.addEventListener('click', handleCloseOnboarding);
  elements.onboardingPrev?.addEventListener('click', () => {
    setOnboardingStep(state.onboardingStep - 1);
  });
  elements.onboardingNext?.addEventListener('click', () => {
    setOnboardingStep(state.onboardingStep + 1);
  });
  elements.onboardingDots?.addEventListener('click', (event) => {
    const dot = event.target.closest('[data-onboarding-dot]');
    if (!dot) return;
    setOnboardingStep(Number(dot.dataset.onboardingDot));
  });
  elements.onboardingDontShow?.addEventListener('click', handleDismissOnboarding);
  elements.onboardingModal?.addEventListener('click', (event) => {
    if (event.target.matches('[data-modal-close]')) {
      handleCloseOnboarding();
    }
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && elements.onboardingModal && elements.onboardingModal.hidden === false) {
      handleCloseOnboarding();
    }
  });
  elements.toggleMonthLock?.addEventListener('click', handleToggleMonthLock);
  elements.checklistContainer?.addEventListener('change', (event) => {
    const input = event.target.closest('[data-checklist-item]');
    if (!input) return;
    if (!guardMonthUnlocked('edit checklist items')) {
      input.checked = !input.checked;
      return;
    }
    setChecklistStep(input.dataset.checklistItem, input.checked);
  });
  elements.checklistNavMonth?.addEventListener('change', () => {
    const nextMonth = String(elements.checklistNavMonth.value || '').trim();
    if (!nextMonth) return;
    state.checklistMonthOverride = nextMonth;
    if (elements.reportMonth) {
      elements.reportMonth.value = nextMonth;
    }
    renderChecklist();
  });
  elements.checklistNavItems.forEach((input) => {
    input.addEventListener('change', () => {
      const monthKey = String(elements.checklistNavMonth?.value || getChecklistMonthKey()).trim();
      if (!guardMonthUnlocked('edit checklist items', monthKey)) {
        input.checked = !input.checked;
        return;
      }
      setChecklistStep(input.dataset.checklistNavItem, input.checked, monthKey);
    });
  });
  elements.checklistNavMarkAll?.addEventListener('click', () => {
    const monthKey = String(elements.checklistNavMonth?.value || getChecklistMonthKey()).trim();
    if (!guardMonthUnlocked('mark all checklist steps', monthKey)) return;
    state.checklistMonthOverride = monthKey;
    if (elements.reportMonth) {
      elements.reportMonth.value = monthKey;
    }
    markChecklistSteps(CHECKLIST_STEPS, true, monthKey);
    addActivityLog(`Marked monthly checklist complete for ${monthKey}.`, 'success');
    showBanner(`Checklist marked complete for ${monthKey}.`, 'success');
  });
  elements.checklistNavReset?.addEventListener('click', () => {
    const monthKey = String(elements.checklistNavMonth?.value || getChecklistMonthKey()).trim();
    if (!guardMonthUnlocked('reset checklist', monthKey)) return;
    state.checklistMonthOverride = monthKey;
    if (elements.reportMonth) {
      elements.reportMonth.value = monthKey;
    }
    markChecklistSteps(CHECKLIST_STEPS, false, monthKey);
    addActivityLog(`Reset monthly checklist for ${monthKey}.`, 'info');
    showBanner(`Checklist reset for ${monthKey}.`, 'info');
  });
  elements.checklistNavLockToggle?.addEventListener('click', () => {
    const monthKey = String(elements.checklistNavMonth?.value || getChecklistMonthKey()).trim();
    const nextLocked = !isMonthLocked(monthKey);
    let reason = '';
    if (nextLocked) {
      const inputReason = window.prompt(
        `Lock month ${monthKey}. Add a short reason (optional but recommended):`,
        'Finance reconciliation completed'
      );
      if (inputReason == null) return;
      reason = String(inputReason || '').trim();
    }
    setMonthLocked(monthKey, nextLocked, reason);
    state.checklistMonthOverride = monthKey;
    if (elements.reportMonth) {
      elements.reportMonth.value = monthKey;
    }
    addActivityLog(
      nextLocked
        ? `Locked payout month ${monthKey}${reason ? ` (${reason})` : ''}.`
        : `Unlocked payout month ${monthKey}.`,
      nextLocked ? 'info' : 'success'
    );
    showBanner(
      nextLocked
        ? `Month ${monthKey} is now locked.${reason ? ` Reason: ${reason}` : ''}`
        : `Month ${monthKey} is now unlocked.`,
      'info'
    );
  });
  elements.checklistMarkAll?.addEventListener('click', () => {
    markChecklistSteps(CHECKLIST_STEPS, true);
    addActivityLog(`Marked monthly checklist complete for ${getChecklistMonthKey()}.`, 'success');
    showBanner('Checklist marked complete.', 'success');
  });
  elements.checklistReset?.addEventListener('click', () => {
    markChecklistSteps(CHECKLIST_STEPS, false);
    addActivityLog(`Reset monthly checklist for ${getChecklistMonthKey()}.`, 'info');
    showBanner('Checklist reset for this month.', 'info');
  });
  elements.refreshCodes?.addEventListener('click', async () => {
    clearBanner();
    try {
      await loadCodes();
      renderCodesTable();
    } catch (error) {
      showBanner(getErrorParts(error).message, 'error');
    }
  });
  elements.codeSearchInput?.addEventListener('input', () => {
    state.filters.codeQuery = elements.codeSearchInput.value;
    renderCodesTable();
  });
  elements.codeStatusFilter?.addEventListener('change', () => {
    state.filters.codeStatus = elements.codeStatusFilter.value;
    renderCodesTable();
  });
  elements.includeInactiveCodes?.addEventListener('change', async () => {
    clearBanner();
    try {
      await loadCodes();
      renderCodesTable();
    } catch (error) {
      showBanner(getErrorParts(error).message, 'error');
    }
  });
  elements.newCode?.addEventListener('click', () => resetCodeForm(null));
  elements.resetCodeForm?.addEventListener('click', () => resetCodeForm(null));
  elements.codeForm?.addEventListener('submit', handleCodeSave);
  elements.codeValue?.addEventListener('input', () => {
    updateCodeReferralLink(elements.codeValue.value);
  });
  elements.copyReferralLinkButton?.addEventListener('click', handleCopyReferralLink);
  elements.refreshReports?.addEventListener('click', async () => {
    clearBanner();
    try {
      await loadReports();
      renderReportsTable();
    } catch (error) {
      showBanner(getErrorParts(error).message, 'error');
    }
  });
  elements.reportSearchInput?.addEventListener('input', () => {
    state.filters.reportQuery = elements.reportSearchInput.value;
    renderReportsTable();
  });
  elements.reportStatusFilter?.addEventListener('change', () => {
    state.filters.reportStatus = elements.reportStatusFilter.value;
    renderReportsTable();
  });
  elements.generateReportForm?.addEventListener('submit', handleGenerateReport);
  elements.reportMonth?.addEventListener('change', () => {
    state.checklistMonthOverride = String(elements.reportMonth.value || '').trim();
    renderChecklist();
  });
  elements.loadReportRows?.addEventListener('click', () => {
    loadReportDetail(state.selectedReportId, elements.includeRowsToggle.checked);
  });
  elements.exportCsvButton?.addEventListener('click', handleExportCsv);
  elements.exportPdfButton?.addEventListener('click', handleExportPdf);
  elements.exportTestButton?.addEventListener('click', handleExportTestSample);
  elements.finalizePayoutButton?.addEventListener('click', handleFinalizePayout);
  elements.closePackageButton?.addEventListener('click', handleClosePackage);
  elements.approveMarkPaidButton?.addEventListener('click', handleApproveMarkPaid);
  elements.markPaidForm?.addEventListener('submit', handleMarkPaid);
  elements.recipientForm?.addEventListener('submit', handleRecipientAdd);
  elements.settingsForm?.addEventListener('submit', handleSaveSettings);
  elements.partnerType?.addEventListener('change', syncPartnerTypeFields);
  elements.recipientList?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-remove-recipient]');
    if (!button) return;
    handleRecipientRemove(button.dataset.removeRecipient);
  });
  bindMiniListActions();
}

function initializeFormDefaults() {
  if (elements.checklistNavPopover) {
    setChecklistPopoverOpen(false);
  }
  setMobileNavOpen(false);
  setAdminPage(getAdminPageFromUrl(), { updateUrl: true });
  elements.reportMonth.value = getPreviousUtcMonth();
  state.checklistMonthOverride = elements.reportMonth.value;
  elements.includeRowsToggle.checked = false;
  state.filters.codeQuery = elements.codeSearchInput?.value || '';
  state.filters.codeStatus = elements.codeStatusFilter?.value || '';
  state.filters.reportQuery = elements.reportSearchInput?.value || '';
  state.filters.reportStatus = elements.reportStatusFilter?.value || '';
  state.activityLog = readActivityLog();
  state.checklistByMonth = readChecklistState();
  state.monthLocks = readMonthLocks();
  state.compactMode = readCompactMode();
  state.onboardingDismissed = readOnboardingDismissed();
  applyCompactMode();
  setOnboardingStep(0);
  setOnboardingOpen(false);
  renderActivityLog();
  renderChecklist();
  renderNextStep();
  resetCodeForm(null);
  syncPartnerTypeFields();
  clearSelectedReport();
}

function handleAuthState(user) {
  const wasLoggedOut = !previousAuthUid;
  previousAuthUid = user?.uid || null;
  state.user = user;
  state.admin = null;
  elements.authError.hidden = true;
  elements.authError.textContent = '';
  updateIdentity();

  if (!user) {
    clearSelectedReport();
    setView('signed-out');
    return;
  }

  if (wasLoggedOut) {
    state.pendingOnboardingAfterLogin = true;
  }
  loadDashboard();
}

bindEvents();
setMobileNavOpen(false);
initializeFormDefaults();
setView('loading-auth');
waitForAuthPersistenceReady()
  .catch(() => {})
  .finally(() => {
    previousAuthUid = getCurrentUser()?.uid || null;
    subscribeToAuthState(handleAuthState);
  });

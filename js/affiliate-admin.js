import {
  addAffiliateAdminAuditLog,
  callFirebaseFunction,
  createAffiliatePartnerPortalInvite,
  getAffiliateAdminSettings,
  getCurrentUser,
  getSubscriberStatsByCode,
  listAffiliateAdminAuditLogs,
  lookupNuriaPartnerByEmail,
  saveAffiliateAdminSettings,
  sendPasswordReset,
  signInWithEmailPassword,
  signOutUser,
  subscribeToAuthState,
  waitForAuthPersistenceReady,
} from './firebase-client.js?v=20260428-partner-claim';

const site = window.NuriaSite || {};
const partnerRegistry = globalThis.NuriaAffiliatePartnerRegistry || {};
const page = document.querySelector('[data-affiliate-admin-page]');
const ACTIVITY_LOG_KEY = 'nuria_affiliate_admin_activity_log_v1';
const CHECKLIST_STATE_KEY = 'nuria_affiliate_admin_monthly_checklist_v1';
const MONTH_LOCK_STATE_KEY = 'nuria_affiliate_admin_month_lock_v1';
const COMPACT_MODE_KEY = 'nuria_affiliate_admin_compact_mode_v1';
const ONBOARDING_DISMISSED_KEY = 'nuria_affiliate_admin_onboarding_dismissed_v1';
const ONBOARDING_SESSION_CLOSED_KEY = 'nuria_affiliate_admin_onboarding_closed_session_v1';
const LOGIN_SUCCESS_SOUND_URL = '/assets/nuria%20site.wav';
const SPIRIT_PLAY_LABEL = 'Play music';
const SPIRIT_RESUME_LABEL = 'Resume music';
const SPIRIT_BUTTON_DEFAULT_LABEL = 'Summon spirit ✨';
const CHECKLIST_STEPS = ['generated', 'verified', 'exported', 'paid', 'receipt'];
const ADMIN_PAGE_PATHS = {
  landing: '/internal/affiliate-admin/',
  overview: '/internal/affiliate-admin/overview/',
  operations: '/internal/affiliate-admin/operations/',
  checklist: '/internal/affiliate-admin/checklist/',
  'alerts-health': '/internal/affiliate-admin/alerts-health/',
  codes: '/internal/affiliate-admin/codes/',
  partners: '/internal/affiliate-admin/partners/',
  subscribers: '/internal/affiliate-admin/subscribers/',
  reports: '/internal/affiliate-admin/reports/',
  'report-detail': '/internal/affiliate-admin/report-detail/',
  'dashboard-copy': '/internal/affiliate-admin/dashboard-copy/',
  settings: '/internal/affiliate-admin/settings/',
};
const DASHBOARD_COPY_CALL_TIMEOUT_MS = 15000;
const AUTH_BOOTSTRAP_TIMEOUT_MS = 2500;
const AUTH_STUCK_TIMEOUT_MS = 6000;
const ADMIN_CALL_TIMEOUT_MS = 15000;
const DASHBOARD_LOAD_TIMEOUT_MS = 25000;

/** Legal publisher block (matches site privacy/terms). Used in PDF & Excel exports. */
const EXPORT_PUBLISHER = {
  legalName: 'OakDev & AI AB',
  orgNumber: '559431-6787',
  vatId: 'SE559431678701',
  addressLine1: 'Kristevik 633',
  postalCity: '451 96 Uddevalla, Sweden',
  email: 'hello@oakdev.app',
  phone: '+46 70 810 57 66',
};

if (!page) {
  throw new Error('affiliate_admin_page_missing');
}

const elements = {
  shell: page,
  topbar: document.querySelector('.admin-topbar-card'),
  mobileNavDrawer: document.getElementById('adminMobileNavDrawer'),
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
  pauseSpiritSound: document.getElementById('adminPauseSpiritSound'),
  stopSpiritSound: document.getElementById('adminStopSpiritSound'),
  spiritSoundState: document.getElementById('adminSpiritSoundState'),
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
  partnerPortalAccessRow: document.getElementById('adminPartnerPortalAccessRow'),
  partnerPortalAccessStatus: document.getElementById('adminPartnerPortalAccessStatus'),
  partnerPortalEnableButton: document.getElementById('adminPartnerPortalEnableButton'),
  partnerPortalDisableButton: document.getElementById('adminPartnerPortalDisableButton'),
  partnerPortalInviteButton: document.getElementById('adminPartnerPortalInviteButton'),
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
  refreshDashboardCopy: document.getElementById('adminRefreshDashboardCopy'),
  dashboardCopyLoadingState: document.getElementById('adminDashboardCopyLoadingState'),
  dashboardCopyErrorState: document.getElementById('adminDashboardCopyErrorState'),
  dashboardCopyErrorCopy: document.getElementById('adminDashboardCopyErrorCopy'),
  dashboardCopyRetry: document.getElementById('adminDashboardCopyRetry'),
  dashboardCopyReady: document.getElementById('adminDashboardCopyReady'),
  dashboardCopyForm: document.getElementById('adminDashboardCopyForm'),
  dashboardCopyEnabled: document.getElementById('adminDashboardCopyEnabled'),
  dashboardCopyTitleEn: document.getElementById('adminDashboardCopyTitleEn'),
  dashboardCopyTitleMeta: document.getElementById('adminDashboardCopyTitleMeta'),
  dashboardCopyBodyEn: document.getElementById('adminDashboardCopyBodyEn'),
  dashboardCopyBodyMeta: document.getElementById('adminDashboardCopyBodyMeta'),
  dashboardCopyAutoTranslate: document.getElementById('adminDashboardCopyAutoTranslate'),
  dashboardCopyForceTranslate: document.getElementById('adminDashboardCopyForceTranslate'),
  saveDashboardCopyButton: document.getElementById('adminSaveDashboardCopyButton'),
  dashboardCopyFormError: document.getElementById('adminDashboardCopyFormError'),
  dashboardCopyLocaleSearch: document.getElementById('adminDashboardCopyLocaleSearch'),
  dashboardCopyLocaleCount: document.getElementById('adminDashboardCopyLocaleCount'),
  dashboardCopyTranslationCount: document.getElementById('adminDashboardCopyTranslationCount'),
  dashboardCopyTranslationsList: document.getElementById('adminDashboardCopyTranslationsList'),
  dashboardCopyReadinessSummary: document.getElementById('adminDashboardCopyReadinessSummary'),
  dashboardCopyReadinessBadge: document.getElementById('adminDashboardCopyReadinessBadge'),
  dashboardCopyChecklist: document.getElementById('adminDashboardCopyChecklist'),
  dashboardCopyGuidance: document.getElementById('adminDashboardCopyGuidance'),
  dashboardCopyPublishedSummary: document.getElementById('adminDashboardCopyPublishedSummary'),
  dashboardCopyPublishedCompare: document.getElementById('adminDashboardCopyPublishedCompare'),
  dashboardCopyChangeList: document.getElementById('adminDashboardCopyChangeList'),
  dashboardCopyPreviewLocaleHint: document.getElementById('adminDashboardCopyPreviewLocaleHint'),
  dashboardCopyPreviewLocale: document.getElementById('adminDashboardCopyPreviewLocale'),
  dashboardCopyPreviewCard: document.getElementById('adminDashboardCopyPreviewCard'),
  dashboardCopyPreviewTitle: document.getElementById('adminDashboardCopyPreviewTitle'),
  dashboardCopyPreviewBody: document.getElementById('adminDashboardCopyPreviewBody'),
  dashboardCopyPreviewEmpty: document.getElementById('adminDashboardCopyPreviewEmpty'),
  dashboardCopyMetadata: document.getElementById('adminDashboardCopyMetadata'),
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
  refreshPartners: document.getElementById('adminRefreshPartners'),
  partnerSearchInput: document.getElementById('adminPartnerSearchInput'),
  partnerStatusFilter: document.getElementById('adminPartnerStatusFilter'),
  partnerSortSelect: document.getElementById('adminPartnerSortSelect'),
  partnerList: document.getElementById('adminPartnerList'),
  partnerEmpty: document.getElementById('adminPartnerEmpty'),
  partnerDetail: document.getElementById('adminPartnerDetail'),
  partnerTotalCount: document.getElementById('adminPartnerTotalCount'),
  partnerPortalLiveCount: document.getElementById('adminPartnerPortalLiveCount'),
  partnerEntriesTotal: document.getElementById('adminPartnerEntriesTotal'),
  partnerPurchasesTotal: document.getElementById('adminPartnerPurchasesTotal'),
  partnerActiveTotal: document.getElementById('adminPartnerActiveTotal'),
  partnerAtRiskTotal: document.getElementById('adminPartnerAtRiskTotal'),
  partnerLastRefresh: document.getElementById('adminPartnerLastRefresh'),
  partnerSnapshotMeta: document.getElementById('adminPartnerSnapshotMeta'),
  partnerTopActivator: document.getElementById('adminPartnerTopActivator'),
  partnerTopConverter: document.getElementById('adminPartnerTopConverter'),
  partnerWatchlist: document.getElementById('adminPartnerWatchlist'),
  refreshSubscribers: document.getElementById('adminRefreshSubscribers'),
  subscriberSearchInput: document.getElementById('adminSubscriberSearchInput'),
  subscriberMetricFilter: document.getElementById('adminSubscriberMetricFilter'),
  subscriberSortSelect: document.getElementById('adminSubscriberSortSelect'),
  subscriberTableBody: document.getElementById('adminSubscriberTableBody'),
  subscriberEmpty: document.getElementById('adminSubscriberEmpty'),
  subscriberTotalCodes: document.getElementById('adminSubscriberTotalCodes'),
  subscriberTotalActive: document.getElementById('adminSubscriberTotalActive'),
  subscriberTotalHistorical: document.getElementById('adminSubscriberTotalHistorical'),
  subscriberTotalChurned: document.getElementById('adminSubscriberTotalChurned'),
  subscriberLastRefresh: document.getElementById('adminSubscriberLastRefresh'),
  subscriberSnapshotMeta: document.getElementById('adminSubscriberSnapshotMeta'),
};

const state = {
  initializedViewEvent: false,
  currentView: 'loading-auth',
  user: null,
  admin: null,
  recentReports: [],
  recentCodes: [],
  codes: [],
  partners: [],
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
  selectedPartnerKey: '',
  healthChecks: {},
  adminSettings: {
    defaultFlow: 'balanced',
    exportFormat: 'csv_pdf',
    requireApproval: true,
    notifyOnErrors: true,
    bouncedRecipients: [],
  },
  approvalRequests: {},
  subscriberStats: [],
  subscriberLastRefreshAt: '',
  subscriberUnavailableReason: '',
  filters: {
    codeQuery: '',
    codeStatus: '',
    partnerQuery: '',
    partnerStatus: '',
    partnerSort: 'active-desc',
    reportQuery: '',
    reportStatus: '',
    subscriberQuery: '',
    subscriberMetric: '',
    subscriberSort: 'active-desc',
  },
  backendAuditUnavailableReason: '',
  recipientSettingsUnavailableReason: '',
  saveCodeInFlight: false,
  savePortalAccessInFlight: false,
  generateReportInFlight: false,
  markPaidInFlight: false,
  exportInFlight: false,
  finalizeInFlight: false,
  closePackageInFlight: false,
  saveSettingsInFlight: false,
  dashboardCopyAdmin: null,
  dashboardCopyItem: null,
  dashboardCopyDraft: null,
  dashboardCopyLoaded: false,
  dashboardCopyLoading: false,
  dashboardCopyLoadPromise: null,
  dashboardCopyError: '',
  dashboardCopySaveInFlight: false,
  dashboardCopyLocaleSearch: '',
  dashboardCopyPreviewLocale: '',
  dashboardCopyPreviewTouched: false,
};
let loginSuccessSound = null;
let checklistRemoteSyncTimeoutId = null;
let previousAuthUid = null;
let initialAuthStateHandled = false;
let dashboardLoadToken = 0;
const dashboardCopyLocaleLabelCache = new Map();

function setChecklistPopoverOpen(open) {
  if (!elements.checklistNavPopover || !elements.checklistNavToggle) return;
  const isOpen = Boolean(open);
  elements.checklistNavPopover.hidden = !isOpen;
  elements.checklistNavToggle.setAttribute('aria-expanded', String(isOpen));
  if (isOpen && window.matchMedia('(max-width: 768px)').matches) {
    requestAnimationFrame(() => {
      elements.checklistNavPopover.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  }
}

function placeMobileDrawer() {
  const drawer = elements.mobileNavDrawer;
  const card = elements.topbar;
  if (!drawer || !card) return;
  const mq = window.matchMedia('(max-width: 768px)');
  const cardHidden = card.hasAttribute('hidden');
  if (mq.matches && !cardHidden) {
    if (drawer.parentElement !== document.body) {
      document.body.appendChild(drawer);
    }
  } else if (drawer.parentElement !== card) {
    card.appendChild(drawer);
  }
}

function setMobileNavOpen(open) {
  if (!elements.topbar || !elements.mobileNavToggle) return;
  const isMobileViewport = window.matchMedia('(max-width: 768px)').matches;
  if (!isMobileViewport) {
    elements.topbar.classList.remove('admin-topbar-card--mobile-open');
    elements.mobileNavDrawer?.classList.remove('admin-mobile-drawer--open');
    elements.mobileNavToggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('admin-mobile-nav-open');
    if (elements.mobileNavPanel) {
      elements.mobileNavPanel.setAttribute('aria-hidden', 'false');
      if ('inert' in elements.mobileNavPanel) elements.mobileNavPanel.inert = false;
    }
    return;
  }
  placeMobileDrawer();
  const shouldOpen = Boolean(open);
  elements.topbar.classList.toggle('admin-topbar-card--mobile-open', shouldOpen);
  elements.mobileNavDrawer?.classList.toggle('admin-mobile-drawer--open', shouldOpen);
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
  state.currentView = name;
  elements.views.forEach((view) => {
    view.hidden = view.dataset.adminView !== name;
  });
  const showLoginOnly = name === 'signed-out' || name === 'loading-auth';
  elements.shell?.classList.toggle('admin-shell--login', showLoginOnly);
  document.body.classList.toggle('admin-is-logged-out', showLoginOnly);
  elements.authOnlyBlocks.forEach((block) => {
    block.hidden = showLoginOnly;
  });
  placeMobileDrawer();
  if (elements.globalNotice) {
    if (showLoginOnly) {
      elements.globalNotice.hidden = true;
    } else {
      const hasMessage = Boolean(String(elements.globalNotice.textContent || '').trim());
      elements.globalNotice.hidden = !hasMessage;
    }
  }
  if (elements.sectionNav) {
    // Keep navigation available for signed-in admins even if a panel load fails.
    elements.sectionNav.hidden = showLoginOnly;
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
  const previousPage = state.currentPage;
  state.currentPage = next;
  setChecklistPopoverOpen(false);
  setMobileNavOpen(false);

  if (
    next !== 'dashboard-copy'
    && elements.globalNotice
    && !elements.globalNotice.hidden
    && state.dashboardCopyError
    && String(elements.globalNotice.textContent || '').trim() === state.dashboardCopyError
  ) {
    clearBanner();
  }

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

  if (next === 'dashboard-copy' && state.user) {
    ensureDashboardCopyLoaded({ silent: true }).catch(() => {});
    if (previousPage !== next || !state.dashboardCopyLoaded) {
      track('dashboard_copy_admin_viewed', {
        route: ADMIN_PAGE_PATHS[next],
      });
    }
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

function createTimeoutError(label, timeoutMs) {
  const error = new Error(`${label} timed out after ${Math.round(timeoutMs / 1000)} seconds.`);
  error.code = 'deadline-exceeded';
  return error;
}

function withAdminTimeout(label, work, timeoutMs) {
  let timeoutId = null;
  const workPromise = Promise.resolve().then(() =>
    typeof work === 'function' ? work() : work
  );
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => {
      reject(createTimeoutError(label, timeoutMs));
    }, timeoutMs);
  });

  return Promise.race([workPromise, timeoutPromise]).finally(() => {
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
    }
  });
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

  if (code === 'deadline-exceeded' || message.includes('timed out') || message.includes('timeout')) {
    if (error?.adminCallable === 'getDashboardTopPlaceholderAdmin') {
      return 'Dashboard copy load timed out. Try again. If it keeps hanging, verify the backend callable is deployed and that Firebase App Check or reCAPTCHA is not blocking this site.';
    }
    if (error?.adminCallable === 'upsertDashboardTopPlaceholderAdmin') {
      return 'Dashboard copy save timed out. The backend may be slow or blocked by App Check. Wait a moment and try again.';
    }
    return 'This request timed out before the backend responded. Try again.';
  }

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

  if (code === 'not-found') {
    if (message.includes('affiliate_partner_not_found')) {
      return 'Partner profile is not saved yet. Save the affiliate code/partner first, then create a claim link.';
    }
    if (message.includes('invite_not_found')) {
      return 'This partner claim link does not exist anymore. Create a new claim link and send that one.';
    }
    return 'The requested record was not found.';
  }

  if (code === 'already-exists') {
    if (message.includes('affiliate_partner_already_linked')) {
      return 'This partner is already linked to another Nuria account. Disable/unlink the old portal account before sending a new claim link.';
    }
    if (message.includes('invite_already_redeemed')) {
      return 'This partner claim link has already been used. Create a fresh link if the partner needs to connect again.';
    }
  }

  if (message.includes('invite_expired')) {
    return 'This partner claim link has expired. Create and send a fresh link.';
  }

  if (
    code === 'portal-login-requires-verified-nuria-account'
    || message.includes('portal_login_requires_verified_nuria_account')
  ) {
    return 'Portal login can only be enabled after the account is verified. For Apple Hide My Email users, use Copy claim link so their UID connects automatically.';
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

  if (message.includes('copy_required')) {
    return 'English title or body is required when the dashboard placeholder is enabled.';
  }

  if (message.includes('app check') || message.includes('recaptcha')) {
    const callableHint = error?.adminCallable
      ? ` (${error.adminCallable})`
      : '';
    return `Firebase App Check blocked this request${callableHint}. Verify the site App Check key and allowed web domains, then try again.`;
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
    const normalizedCode = normalizeReferralCodeValue(codeKey);
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
    const normalizedCode = normalizeReferralCodeValue(codeKey);
    if (!normalizedCode) return;
    const normalized = normalizePartnerProfile(rawValue[codeKey] || {});
    if (normalized) {
      result[normalizedCode] = normalized;
    }
  });
  return result;
}

function normalizeReferralCodeValue(value) {
  if (typeof site.normalizeReferralCode === 'function') {
    return site.normalizeReferralCode(value);
  }
  if (typeof partnerRegistry.normalizeReferralCode === 'function') {
    return partnerRegistry.normalizeReferralCode(value);
  }
  return String(value || '').trim().toUpperCase().replace(/\s+/g, '');
}

function normalizePartnerStatusValue(value) {
  if (typeof partnerRegistry.normalizePartnerStatus === 'function') {
    return partnerRegistry.normalizePartnerStatus(value);
  }
  const status = String(value || '').trim().toLowerCase();
  if (status === 'inactive' || status === 'archived') {
    return status;
  }
  return 'active';
}

function normalizePartnerDocValue(rawValue) {
  if (typeof partnerRegistry.normalizePartnerDoc === 'function') {
    return partnerRegistry.normalizePartnerDoc(rawValue);
  }
  if (!rawValue || typeof rawValue !== 'object') return null;
  const affiliateId = String(rawValue.affiliateId || '').trim();
  const primaryReferralCode = normalizeReferralCodeValue(rawValue.primaryReferralCode || '');
  if (!affiliateId && !primaryReferralCode) return null;
  return {
    affiliateId,
    displayName: String(rawValue.displayName || '').trim() || null,
    status: normalizePartnerStatusValue(rawValue.status),
    primaryReferralCode: primaryReferralCode || null,
    contactName: String(rawValue.contactName || '').trim() || null,
    contactEmail: normalizeEmail(rawValue.contactEmail),
    portalUid: String(rawValue.portalUid || '').trim() || null,
    portalEmail: normalizeEmail(rawValue.portalEmail),
    portalWebAccessEnabled: Boolean(rawValue.portalWebAccessEnabled),
    note: String(rawValue.note || '').trim() || null,
    updatedAt: rawValue.updatedAt || null,
    updatedByEmail: String(rawValue.updatedByEmail || '').trim() || null,
  };
}

function normalizePartnerListValue(rawValue) {
  if (typeof partnerRegistry.normalizePartnerList === 'function') {
    return partnerRegistry.normalizePartnerList(rawValue);
  }
  if (!Array.isArray(rawValue)) return [];
  return rawValue.map((item) => normalizePartnerDocValue(item)).filter(Boolean);
}

function findLinkedPartnerForCode(item) {
  if (typeof partnerRegistry.findPartnerForCode === 'function') {
    return partnerRegistry.findPartnerForCode(item || {}, state.partners || []);
  }

  let affiliateId = String(item?.affiliateId || '').trim();
  const normalizedCode = normalizeReferralCodeValue(item?.code || item?.primaryReferralCode || '');
  const partners = normalizePartnerListValue(state.partners);

  // If the form draft does not carry affiliateId (e.g. typed code), resolve it from loaded codes.
  if (!affiliateId && normalizedCode) {
    const codeMatch = (state.codes || []).find(
      (entry) => normalizeReferralCodeValue(entry?.code || '') === normalizedCode
    );
    affiliateId = String(codeMatch?.affiliateId || '').trim();
  }

  if (affiliateId) {
    const partner = partners.find((entry) => entry.affiliateId === affiliateId);
    if (partner) return partner;
  }

  if (normalizedCode) {
    return partners.find((entry) => entry.primaryReferralCode === normalizedCode) || null;
  }

  return null;
}

function buildPartnerUpsertPayloadForCode(options) {
  const settings = Object.assign({}, options || {});
  if (typeof partnerRegistry.buildPartnerUpsertPayload === 'function') {
    return partnerRegistry.buildPartnerUpsertPayload(settings);
  }

  const existingPartner = normalizePartnerDocValue(settings.existingPartner);
  const codeItem = settings.codeItem || {};
  const affiliateId = String(codeItem.affiliateId || existingPartner?.affiliateId || '').trim();
  if (!affiliateId) {
    throw new Error('affiliate_id_required');
  }

  const normalizedEmail = normalizeEmail(settings.partnerEmail);
  const lookup = settings.lookupResult && typeof settings.lookupResult === 'object'
    ? settings.lookupResult
    : null;
  const lookupFound = lookup?.found === true;
  const lookupEmail = normalizeEmail(lookup?.email) || normalizedEmail;
  const lookupUid = String(lookup?.uid || '').trim() || null;
  const existingPortalEmail = normalizeEmail(existingPartner?.portalEmail);
  const preserveExistingUid = settings.lookupFailed === true
    && normalizedEmail
    && existingPortalEmail === normalizedEmail
    && Boolean(existingPartner?.portalUid);

  const hasExplicitPortalWebAccess = Object.prototype.hasOwnProperty.call(settings, 'portalWebAccessEnabled');
  let portalWebAccessEnabled = false;
  if (normalizedEmail) {
    portalWebAccessEnabled = hasExplicitPortalWebAccess
      ? Boolean(settings.portalWebAccessEnabled)
      : Boolean(existingPartner?.portalWebAccessEnabled);
  }

  return {
    affiliateId,
    displayName: String(codeItem.displayName || existingPartner?.displayName || '').trim() || null,
    status: normalizePartnerStatusValue(existingPartner?.status || codeItem.status || 'active'),
    primaryReferralCode:
      normalizeReferralCodeValue(codeItem.code || codeItem.primaryReferralCode || existingPartner?.primaryReferralCode || '')
      || null,
    contactName: String(existingPartner?.contactName || '').trim() || null,
    contactEmail: lookupEmail || normalizeEmail(existingPartner?.contactEmail),
    portalUid: normalizedEmail
      ? (lookupFound ? lookupUid : preserveExistingUid ? existingPartner?.portalUid || null : null)
      : null,
    portalEmail: normalizedEmail ? lookupEmail : null,
    portalWebAccessEnabled,
    note: String(existingPartner?.note || '').trim() || null,
  };
}

function buildPartnerRegistryEntries() {
  if (typeof partnerRegistry.buildPartnerRegistryItems === 'function') {
    return partnerRegistry.buildPartnerRegistryItems({
      codes: state.codes || [],
      partners: state.partners || [],
      legacyEmailsByCode: state.partnerEmailsByCode || {},
      legacyPartnerRegistryByCode: state.partnerRegistryByCode || {},
      legacyPartnerProfilesByCode: state.partnerProfilesByCode || {},
    });
  }

  return [];
}

function resetDashboardCopyState(options) {
  const settings = Object.assign({ preservePreviewLocale: true }, options || {});
  const previewLocale = settings.preservePreviewLocale ? state.dashboardCopyPreviewLocale : '';
  state.dashboardCopyAdmin = null;
  state.dashboardCopyItem = null;
  state.dashboardCopyDraft = null;
  state.dashboardCopyLoaded = false;
  state.dashboardCopyLoading = false;
  state.dashboardCopyLoadPromise = null;
  state.dashboardCopyError = '';
  state.dashboardCopySaveInFlight = false;
  state.dashboardCopyLocaleSearch = '';
  state.dashboardCopyPreviewLocale = previewLocale || '';
  state.dashboardCopyPreviewTouched = false;
}

function cloneDashboardCopyTranslations(translations) {
  const result = {};
  Object.entries(translations || {}).forEach(([locale, bundle]) => {
    const title = String(bundle?.title || '').trim();
    const body = String(bundle?.body || '').trim();
    if (!title && !body) return;
    result[locale] = {
      title,
      body,
    };
  });
  return result;
}

function normalizeDashboardCopyTranslations(rawValue) {
  const result = {};
  if (!rawValue || typeof rawValue !== 'object' || Array.isArray(rawValue)) {
    return result;
  }

  Object.entries(rawValue).forEach(([localeKey, bundle]) => {
    if (!bundle || typeof bundle !== 'object' || Array.isArray(bundle)) {
      return;
    }

    const locale = String(localeKey || '').trim();
    const title = String(bundle.title || '').trim();
    const body = String(bundle.body || '').trim();

    if (!locale || (!title && !body)) {
      return;
    }

    result[locale] = {
      title,
      body,
    };
  });

  return result;
}

function normalizeDashboardCopyItem(rawItem) {
  const supportedLocales = Array.from(
    new Set(
      (Array.isArray(rawItem?.supportedLocales) ? rawItem.supportedLocales : [])
        .map((locale) => String(locale || '').trim())
        .filter((locale) => locale && locale.toLowerCase() !== 'en')
    )
  ).sort((left, right) => left.localeCompare(right));

  return {
    copyId: String(rawItem?.copyId || 'dashboard_top_placeholder').trim() || 'dashboard_top_placeholder',
    enabled: rawItem?.enabled !== false,
    titleEn: String(rawItem?.titleEn || '').trim(),
    bodyEn: String(rawItem?.bodyEn || '').trim(),
    translations: normalizeDashboardCopyTranslations(rawItem?.translations),
    supportedLocales,
    createdAt: rawItem?.createdAt || { ms: null, iso: null },
    updatedAt: rawItem?.updatedAt || { ms: null, iso: null },
    updatedByUid: String(rawItem?.updatedByUid || '').trim() || null,
    updatedByEmail: String(rawItem?.updatedByEmail || '').trim() || null,
  };
}

function createDashboardCopyDraft(item) {
  return {
    enabled: item?.enabled !== false,
    titleEn: String(item?.titleEn || '').trim(),
    bodyEn: String(item?.bodyEn || '').trim(),
    autoTranslate: true,
    forceTranslate: false,
    translations: cloneDashboardCopyTranslations(item?.translations),
  };
}

function getDashboardCopyLocaleCandidates(locale) {
  const raw = String(locale || '').trim();
  if (!raw) return [];

  const values = [];
  const pushCandidate = (value) => {
    const next = String(value || '').trim();
    if (!next || values.includes(next)) return;
    values.push(next);
  };

  pushCandidate(raw);
  pushCandidate(raw.toLowerCase());

  const dashed = raw.replace(/_/g, '-');
  pushCandidate(dashed);
  pushCandidate(dashed.toLowerCase());

  const base = dashed.toLowerCase().split('-')[0];
  if (base && base !== dashed.toLowerCase()) {
    pushCandidate(base);
  }

  if (!values.includes('en')) {
    values.push('en');
  }

  return values;
}

function getDashboardCopyTranslationValue(translations, locale, field) {
  const bundles = translations || {};
  for (const candidate of getDashboardCopyLocaleCandidates(locale)) {
    const value = String(bundles?.[candidate]?.[field] || '').trim();
    if (value) {
      return {
        value,
        source: candidate,
      };
    }
  }

  return {
    value: '',
    source: '',
  };
}

function getDashboardCopyPreviewSnapshot(draft, locale) {
  const safeDraft = draft || createDashboardCopyDraft({});
  const titleMatch = getDashboardCopyTranslationValue(safeDraft.translations, locale, 'title');
  const bodyMatch = getDashboardCopyTranslationValue(safeDraft.translations, locale, 'body');
  const title = titleMatch.value || String(safeDraft.titleEn || '').trim();
  const body = bodyMatch.value || String(safeDraft.bodyEn || '').trim();

  return {
    enabled: safeDraft.enabled !== false,
    title,
    body,
    titleSource: titleMatch.value ? titleMatch.source : 'en',
    bodySource: bodyMatch.value ? bodyMatch.source : 'en',
    chain: getDashboardCopyLocaleCandidates(locale),
    hasVisibleCopy: safeDraft.enabled !== false && Boolean(title || body),
  };
}

function getPreferredDashboardCopyPreviewLocale(supportedLocales) {
  const locales = Array.isArray(supportedLocales) ? supportedLocales : [];
  const browserLocale = String(window.navigator?.language || '').trim();
  const browserBase = browserLocale.toLowerCase().split(/[-_]/)[0];
  return (
    locales.find((locale) => locale === browserLocale)
    || locales.find((locale) => locale.toLowerCase() === browserLocale.toLowerCase())
    || locales.find((locale) => locale.toLowerCase() === browserBase)
    || 'en'
  );
}

function getDashboardCopyLocaleLabel(locale) {
  const safeLocale = String(locale || '').trim();
  if (!safeLocale) return 'Unknown locale';
  if (dashboardCopyLocaleLabelCache.has(safeLocale)) {
    return dashboardCopyLocaleLabelCache.get(safeLocale);
  }

  const normalized = safeLocale.replace(/_/g, '-');
  const parts = normalized.split('-');
  const languageCode = String(parts[0] || '').toLowerCase();
  const regionCode = String(parts[1] || '').toUpperCase();

  let languageLabel = languageCode || safeLocale;
  let regionLabel = regionCode;

  try {
    if (typeof Intl.DisplayNames === 'function' && languageCode) {
      const names = new Intl.DisplayNames([window.navigator?.language || 'en'], { type: 'language' });
      languageLabel = names.of(languageCode) || languageLabel;
      if (regionCode) {
        const regionNames = new Intl.DisplayNames([window.navigator?.language || 'en'], { type: 'region' });
        regionLabel = regionNames.of(regionCode) || regionLabel;
      }
    }
  } catch (_error) {
    // Ignore Intl label failures and fall back to raw locale codes.
  }

  const label = regionLabel
    ? `${languageLabel} (${regionLabel})`
    : languageLabel;
  dashboardCopyLocaleLabelCache.set(safeLocale, label);
  return label;
}

function getDashboardCopyLocaleSummary(bundle) {
  const hasTitle = Boolean(String(bundle?.title || '').trim());
  const hasBody = Boolean(String(bundle?.body || '').trim());
  if (hasTitle && hasBody) return 'Title + body stored';
  if (hasTitle) return 'Title stored';
  if (hasBody) return 'Body stored';
  return 'No locale text stored';
}

function getDashboardCopyStoredLocaleCount(translations) {
  return Object.values(translations || {}).filter((bundle) => {
    return Boolean(String(bundle?.title || '').trim() || String(bundle?.body || '').trim());
  }).length;
}

function getDashboardCopyComparableShape(source) {
  return {
    enabled: source?.enabled !== false,
    titleEn: String(source?.titleEn || '').trim(),
    bodyEn: String(source?.bodyEn || '').trim(),
    translations: cloneDashboardCopyTranslations(source?.translations),
  };
}

function truncateDashboardCopyValue(value, maxLength) {
  const text = String(value || '').trim();
  if (!text) return 'Empty';
  const limit = Number(maxLength) > 0 ? Number(maxLength) : 120;
  return text.length > limit
    ? `${text.slice(0, limit - 1).trimEnd()}…`
    : text;
}

function hasDashboardCopyUnsavedChanges() {
  if (!state.dashboardCopyDraft || !state.dashboardCopyItem) {
    return false;
  }

  if (state.dashboardCopyDraft.autoTranslate !== true || state.dashboardCopyDraft.forceTranslate === true) {
    return true;
  }

  const draftShape = getDashboardCopyComparableShape(state.dashboardCopyDraft);
  const itemShape = getDashboardCopyComparableShape(state.dashboardCopyItem);
  return JSON.stringify(draftShape) !== JSON.stringify(itemShape);
}

function getDashboardCopyReadinessModel() {
  const draft = state.dashboardCopyDraft || createDashboardCopyDraft({});
  const item = state.dashboardCopyItem || normalizeDashboardCopyItem({});
  const englishTitle = String(draft.titleEn || '').trim();
  const englishBody = String(draft.bodyEn || '').trim();
  const englishReady = Boolean(englishTitle || englishBody);
  const enabled = draft.enabled !== false;
  const unsaved = hasDashboardCopyUnsavedChanges();
  const translatedCount = getDashboardCopyStoredLocaleCount(draft.translations);
  const supportedCount = Array.isArray(item.supportedLocales) ? item.supportedLocales.length : 0;
  const previewedLocale = state.dashboardCopyPreviewTouched && state.dashboardCopyPreviewLocale !== 'en'
    ? state.dashboardCopyPreviewLocale
    : '';
  const translationPlanReady = supportedCount === 0 || translatedCount > 0 || draft.autoTranslate !== false;

  let badgeTone = 'info';
  let badgeLabel = 'Draft';
  let summary = 'Review the basics here before you publish changes to the app.';

  if (enabled && !englishReady) {
    badgeTone = 'error';
    badgeLabel = 'Needs copy';
    summary = 'Add an English title or body before you turn this placeholder on in the app.';
  } else if (enabled && unsaved) {
    badgeTone = 'warn';
    badgeLabel = 'Save needed';
    summary = 'This draft looks ready to review, but it is not live in the app until you save it.';
  } else if (enabled && englishReady) {
    badgeTone = 'success';
    badgeLabel = 'Ready';
    summary = 'The saved version is ready to appear in the app. You can still preview another locale before publishing.';
  } else if (!enabled && unsaved) {
    badgeTone = 'info';
    badgeLabel = 'Hidden draft';
    summary = 'The placeholder is still hidden. Save when you want this hidden draft to become the current backend version.';
  } else if (!enabled && englishReady) {
    badgeTone = 'info';
    badgeLabel = 'Hidden';
    summary = 'The placeholder is safely hidden in the app while you keep refining the copy.';
  } else {
    badgeTone = 'info';
    badgeLabel = 'Hidden';
    summary = 'This placeholder is currently hidden and has no visible English source yet.';
  }

  const checklist = [
    {
      complete: englishReady,
      title: 'English fallback is written',
      detail: englishReady
        ? 'The app can safely fall back to English when a locale-specific text is missing.'
        : 'Write at least a title or a body in English first.',
    },
    {
      complete: !unsaved,
      title: 'All changes are saved',
      detail: unsaved
        ? 'This browser still has unsaved edits. Save to push them to the backend.'
        : 'The editor matches the latest saved backend version.',
    },
    {
      complete: enabled,
      title: 'Placeholder is enabled',
      detail: enabled
        ? 'The card is allowed to show in the app once the saved document is loaded.'
        : 'Keep this off while drafting privately or switch it on when ready.',
    },
    {
      complete: translationPlanReady,
      title: 'Translation plan is covered',
      detail: draft.autoTranslate !== false
        ? 'Missing locales will be generated server-side on the next save.'
        : translatedCount > 0
          ? `${translatedCount} locale${translatedCount === 1 ? '' : 's'} already have stored text.`
          : 'Other locales will fall back to English until you add manual overrides.',
    },
    {
      complete: Boolean(previewedLocale),
      title: 'A non-English locale has been previewed',
      detail: previewedLocale
        ? `Preview checked for ${previewedLocale}.`
        : 'Switch the preview to one target locale before publishing.',
    },
  ];

  const guidance = [
    {
      title: 'English source length',
      detail: `${englishTitle.length} title chars · ${englishBody.length} body chars`,
    },
    {
      title: 'Locale coverage',
      detail: `${translatedCount} stored locale${translatedCount === 1 ? '' : 's'} out of ${supportedCount} supported`,
    },
    {
      title: 'Current publish mode',
      detail: enabled ? 'Visible in app when saved' : 'Hidden in app until you enable it',
    },
  ];

  if (unsaved) {
    guidance.unshift({
      title: 'Unsaved draft',
      detail: 'Your latest edits are only local right now. Save to make them live in the backend.',
    });
  }

  if (!draft.autoTranslate && translatedCount === 0) {
    guidance.push({
      title: 'Translation note',
      detail: 'With auto-translate off, all unsupported locales will keep falling back to English.',
    });
  }

  return {
    badgeTone,
    badgeLabel,
    summary,
    checklist,
    guidance,
  };
}

function getDashboardCopyChangeSummary() {
  const draft = state.dashboardCopyDraft || createDashboardCopyDraft({});
  const item = state.dashboardCopyItem || normalizeDashboardCopyItem({});
  const changes = [];

  if ((draft.enabled !== false) !== (item.enabled !== false)) {
    changes.push(
      draft.enabled !== false
        ? 'Visibility will change from hidden to visible in the app.'
        : 'Visibility will change from visible to hidden in the app.'
    );
  }

  const liveTitle = String(item.titleEn || '').trim();
  const draftTitle = String(draft.titleEn || '').trim();
  if (liveTitle !== draftTitle) {
    changes.push(
      draftTitle
        ? `English title will update to: "${truncateDashboardCopyValue(draftTitle, 80)}"`
        : 'English title will be cleared.'
    );
  }

  const liveBody = String(item.bodyEn || '').trim();
  const draftBody = String(draft.bodyEn || '').trim();
  if (liveBody !== draftBody) {
    changes.push(
      draftBody
        ? `English body will update to: "${truncateDashboardCopyValue(draftBody, 110)}"`
        : 'English body will be cleared.'
    );
  }

  const liveTranslations = item.translations || {};
  const draftTranslations = draft.translations || {};
  const localeKeys = Array.from(new Set(Object.keys(liveTranslations).concat(Object.keys(draftTranslations))));
  const changedLocales = localeKeys.filter((locale) => {
    const liveBundle = {
      title: String(liveTranslations?.[locale]?.title || '').trim(),
      body: String(liveTranslations?.[locale]?.body || '').trim(),
    };
    const draftBundle = {
      title: String(draftTranslations?.[locale]?.title || '').trim(),
      body: String(draftTranslations?.[locale]?.body || '').trim(),
    };
    return JSON.stringify(liveBundle) !== JSON.stringify(draftBundle);
  });

  if (changedLocales.length) {
    const sample = changedLocales.slice(0, 4).join(', ');
    changes.push(
      changedLocales.length > 4
        ? `Manual locale overrides changed in ${changedLocales.length} locales (${sample}, +${changedLocales.length - 4} more).`
        : `Manual locale overrides changed in ${changedLocales.length} locale${changedLocales.length === 1 ? '' : 's'} (${sample}).`
    );
  }

  if (draft.autoTranslate !== true) {
    changes.push('Auto-translate is turned off for the next save, so missing locales will keep falling back to English.');
  }

  if (draft.forceTranslate === true && draft.autoTranslate !== false) {
    changes.push('Force re-translate is turned on, so the next save will refresh generated locales from the English source.');
  }

  return changes;
}

function buildDashboardCopySaveTranslations(item, draft) {
  const previousTranslations = item?.translations || {};
  const nextTranslations = draft?.translations || {};
  const payload = {};

  Object.keys(nextTranslations).forEach((locale) => {
    const nextTitle = String(nextTranslations?.[locale]?.title || '').trim();
    const nextBody = String(nextTranslations?.[locale]?.body || '').trim();
    const prevTitle = String(previousTranslations?.[locale]?.title || '').trim();
    const prevBody = String(previousTranslations?.[locale]?.body || '').trim();
    const bundle = {};

    if (nextTitle && nextTitle !== prevTitle) {
      bundle.title = nextTitle;
    }
    if (nextBody && nextBody !== prevBody) {
      bundle.body = nextBody;
    }

    if (Object.keys(bundle).length) {
      payload[locale] = bundle;
    }
  });

  return payload;
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
  const code = normalizeReferralCodeValue(item?.code || '');
  if (!code) return null;
  return state.partnerProfilesByCode?.[code] || null;
}

function renderPartnerLinkStatus(item) {
  if (!elements.partnerLinkStatus) return;
  const partner = findLinkedPartnerForCode(item || {});
  const registry = getPartnerRegistryEntryForCode(item || {});
  if (registry?.status === 'lookup_error' && !partner?.portalUid) {
    elements.partnerLinkStatus.textContent =
      `Lookup error: ${registry.statusReason || 'Could not verify right now.'}`;
    return;
  }

  if (partner?.portalUid) {
    const display = partner.displayName || partner.affiliateId || registry?.partnerDisplayName || registry?.displayName || partner.portalEmail || 'Partner';
    elements.partnerLinkStatus.textContent =
      `Linked to ${display} (${partner.portalEmail || partner.contactEmail || '-'}) · UID ${partner.portalUid}`;
    return;
  }

  if (partner?.portalEmail) {
    elements.partnerLinkStatus.textContent =
      `Partner email is saved (${partner.portalEmail}), but no UID is linked yet. Use Copy claim link so the partner can sign in and connect the real UID.`;
    return;
  }

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

  elements.partnerLinkStatus.textContent =
    `Email saved but not verified yet (${registry.statusReason || 'not_found'}).`;
}

function renderPartnerPortalAccessRow(item) {
  if (!elements.partnerPortalAccessRow) return;
  const code = normalizeReferralCodeValue(
    (item && item.code) || elements.codeValue?.value || ''
  );
  if (!code) {
    elements.partnerPortalAccessStatus.textContent =
      'Select a saved code from the table, or type a code and save it first. Then Copy claim link to connect the partner account.';
    // Keep buttons clickable so the handler can show banners (disabled buttons swallow clicks).
    if (elements.partnerPortalEnableButton) elements.partnerPortalEnableButton.disabled = false;
    if (elements.partnerPortalDisableButton) elements.partnerPortalDisableButton.disabled = true;
    if (elements.partnerPortalInviteButton) elements.partnerPortalInviteButton.disabled = false;
    return;
  }

  if (state.savePortalAccessInFlight) {
    if (elements.partnerPortalEnableButton) elements.partnerPortalEnableButton.disabled = true;
    if (elements.partnerPortalDisableButton) elements.partnerPortalDisableButton.disabled = true;
    if (elements.partnerPortalInviteButton) elements.partnerPortalInviteButton.disabled = true;
    return;
  }

  const affiliateId = String((item && item.affiliateId) || elements.affiliateId?.value || '').trim();
  const savedItem = { code, affiliateId };
  const partner = findLinkedPartnerForCode(savedItem) || null;
  const registry = getPartnerRegistryEntryForCode(savedItem) || null;
  const draftEmail = normalizeEmail(elements.partnerNuriaEmail?.value || '');
  const savedEmail = normalizeEmail(partner?.portalEmail || getPartnerEmailForCode(savedItem));
  const savedPortalUid = String(partner?.portalUid || registry?.partnerUid || '').trim();
  const accessActive = Boolean(
    (partner?.portalWebAccessEnabled || registry?.portalWebAccessEnabled === true)
    && (savedPortalUid || savedEmail)
  );
  const portalIdentityLabel = savedEmail || (savedPortalUid ? 'the linked Nuria account' : '');
  if (elements.partnerPortalInviteButton) {
    elements.partnerPortalInviteButton.disabled = false;
  }

  const emailForAction = draftEmail || savedEmail;
  if (accessActive && savedPortalUid && !savedEmail) {
    elements.partnerPortalAccessStatus.textContent =
      'Web portal login is ON for the linked Nuria account. Add the partner email here as well if you want the code form to show the exact address.';
    if (elements.partnerPortalEnableButton) elements.partnerPortalEnableButton.disabled = true;
    if (elements.partnerPortalDisableButton) elements.partnerPortalDisableButton.disabled = false;
    return;
  }

  if (!emailForAction || !isValidEmail(emailForAction)) {
    elements.partnerPortalAccessStatus.textContent =
      'Affiliate portal (/nuria-partner): add the partner contact email, save the partner, then Copy claim link so Apple/Google/password login can link the real UID.';
    if (elements.partnerPortalEnableButton) elements.partnerPortalEnableButton.disabled = false;
    if (elements.partnerPortalDisableButton) elements.partnerPortalDisableButton.disabled = true;
    return;
  }

  const emailDirty = Boolean(draftEmail && savedEmail && draftEmail !== savedEmail);

  if (emailDirty) {
    elements.partnerPortalAccessStatus.textContent =
      'Email field changed since last save. Save the code, or use Enable / Disable to apply portal access to the address in the field.';
    if (elements.partnerPortalEnableButton) elements.partnerPortalEnableButton.disabled = false;
    if (elements.partnerPortalDisableButton) elements.partnerPortalDisableButton.disabled = !accessActive;
  } else if (accessActive) {
    elements.partnerPortalAccessStatus.textContent =
      `Web portal login is ON for ${portalIdentityLabel}. Partner signs in at /nuria-partner with that Nuria account.`;
    if (elements.partnerPortalEnableButton) elements.partnerPortalEnableButton.disabled = true;
    if (elements.partnerPortalDisableButton) elements.partnerPortalDisableButton.disabled = false;
  } else {
    elements.partnerPortalAccessStatus.textContent =
      `Web portal login is OFF. For Apple Hide My Email users, send Copy claim link to ${emailForAction}; their UID will connect after they sign in.`;
    if (elements.partnerPortalEnableButton) elements.partnerPortalEnableButton.disabled = false;
    if (elements.partnerPortalDisableButton) elements.partnerPortalDisableButton.disabled = true;
  }
}

function getCodeFormDraftItem() {
  const code = normalizeReferralCodeValue(elements.codeValue?.value || '');
  if (!code) return null;
  return {
    code,
    affiliateId: elements.affiliateId?.value?.trim(),
    displayName: elements.displayName?.value?.trim(),
    status: elements.codeStatus?.value,
    partnerNuriaEmail: elements.partnerNuriaEmail?.value,
  };
}

async function handlePartnerPortalAccessChange(enable) {
  if (state.savePortalAccessInFlight) return;
  const code = normalizeReferralCodeValue(elements.codeValue?.value || '');
  if (!code) {
    showBanner('Enter or select a referral code first.', 'info');
    if (elements.partnerPortalAccessStatus) {
      elements.partnerPortalAccessStatus.textContent =
        'Pick a code from the table or type one above, then try again.';
    }
    return;
  }
  const partnerEmail = normalizeEmail(elements.partnerNuriaEmail?.value || '');
  if (!partnerEmail || !isValidEmail(partnerEmail)) {
    showBanner('Enter a valid Partner Nuria email first.', 'info');
    if (elements.partnerPortalAccessStatus) {
      elements.partnerPortalAccessStatus.textContent =
        'Add a valid Partner Nuria email in the field above (same account they use to sign in).';
    }
    return;
  }
  const metadata = {
    affiliateId: String(elements.affiliateId?.value || '').trim(),
    displayName: String(elements.displayName?.value || '').trim(),
    status: String(elements.codeStatus?.value || '').trim() || 'active',
  };

  clearBanner();
  state.savePortalAccessInFlight = true;
  if (elements.partnerPortalEnableButton) elements.partnerPortalEnableButton.disabled = true;
  if (elements.partnerPortalDisableButton) elements.partnerPortalDisableButton.disabled = true;
  if (elements.partnerPortalAccessStatus) {
    elements.partnerPortalAccessStatus.textContent = enable ? 'Enabling portal login…' : 'Disabling portal login…';
  }
  try {
    await savePartnerEmailMapping(
      code,
      partnerEmail,
      metadata,
      readPartnerProfileFromForm(),
      { portalWebAccessEnabled: enable }
    );
    await loadPartners();
    renderPartnerAnalyticsPage();
    renderPartnerRegistry();
    const match = (state.codes || []).find((row) => normalizeReferralCodeValue(row.code) === code);
    showBanner(
      enable
        ? `Web portal login enabled for ${partnerEmail}.`
        : `Web portal login disabled for ${partnerEmail}.`,
      'success'
    );
    addActivityLog(
      enable
        ? `Enabled affiliate web portal for ${code} (${partnerEmail}).`
        : `Disabled affiliate web portal for ${code} (${partnerEmail}).`,
      enable ? 'success' : 'info'
    );
    resetCodeForm(
      match || {
        code,
        affiliateId: metadata.affiliateId,
        displayName: metadata.displayName,
        status: metadata.status || 'active',
      }
    );
  } catch (error) {
    showBanner(getActionableErrorMessage(error, getErrorParts(error).message), 'error');
  } finally {
    state.savePortalAccessInFlight = false;
    renderPartnerPortalAccessRow(getCodeFormDraftItem());
  }
}

async function handlePartnerPortalInviteCreate() {
  if (state.savePortalAccessInFlight) return;

  const draftItem = getCodeFormDraftItem();
  const code = normalizeReferralCodeValue(draftItem?.code || '');
  if (!code) {
    showBanner('Enter or select a referral code first.', 'info');
    return;
  }

  const partner = findLinkedPartnerForCode(draftItem) || null;
  const savedPortalUid = String(partner?.portalUid || '').trim();
  if (savedPortalUid) {
    showBanner('This partner already has a linked Nuria UID. No claim link is needed unless you unlink the old account first.', 'info');
    return;
  }

  const affiliateId = String(partner?.affiliateId || draftItem?.affiliateId || '').trim();
  if (!affiliateId) {
    showBanner('Save the referral code with an affiliate id before creating a claim link.', 'info');
    return;
  }

  const contactEmail = normalizeEmail(
    elements.partnerNuriaEmail?.value
    || partner?.contactEmail
    || partner?.portalEmail
    || ''
  );

  clearBanner();
  state.savePortalAccessInFlight = true;
  setButtonBusy(elements.partnerPortalInviteButton, true, 'Creating link...');
  if (elements.partnerPortalAccessStatus) {
    elements.partnerPortalAccessStatus.textContent = 'Creating a one-time partner claim link...';
  }

  try {
    const result = await createAffiliatePartnerPortalInvite(affiliateId, contactEmail);
    const inviteUrl = String(result?.inviteUrl || '').trim();
    if (!inviteUrl) {
      throw new Error('invite_url_missing');
    }

    await copyPlainText(inviteUrl);
    const recipient = result?.contactEmail || contactEmail || 'the partner';
    showBanner(`Partner claim link copied. Send it to ${recipient}; after they sign in, their Apple/Firebase UID will be linked automatically.`, 'success');
    addActivityLog(`Created partner portal claim link for ${code}.`, 'success');
  } catch (error) {
    showBanner(getActionableErrorMessage(error, getErrorParts(error).message), 'error');
  } finally {
    state.savePortalAccessInFlight = false;
    setButtonBusy(elements.partnerPortalInviteButton, false);
    renderPartnerPortalAccessRow(getCodeFormDraftItem());
  }
}

function getPartnerEmailForCode(item) {
  const partner = findLinkedPartnerForCode(item || {});
  if (partner?.portalEmail) return partner.portalEmail;
  if (partner?.contactEmail) return partner.contactEmail;
  const code = normalizeReferralCodeValue(item?.code || '');
  if (!code) return '';
  const fromItem = normalizeEmail(item?.partnerNuriaEmail || item?.partnerEmail || '');
  if (isValidEmail(fromItem)) return fromItem;
  const fromMap = normalizeEmail(state.partnerEmailsByCode?.[code] || '');
  return isValidEmail(fromMap) ? fromMap : '';
}

function getPartnerRegistryEntryForCode(item) {
  const code = normalizeReferralCodeValue(item?.code || '');
  if (!code) return null;
  return state.partnerRegistryByCode?.[code] || null;
}

function formatPercent(value) {
  const safe = Number(value);
  if (!Number.isFinite(safe) || safe < 0) return '0%';
  return `${(safe * 100).toFixed(1)}%`;
}

function normalizeCountValue(value) {
  const safe = Number(value);
  if (!Number.isFinite(safe)) return 0;
  return Math.max(0, Math.round(safe));
}

function formatWholeNumber(value) {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 0,
  }).format(normalizeCountValue(value));
}

function getSubscriberInsightAffiliateMeta(rawValue) {
  const code = normalizeReferralCodeValue(rawValue?.code || '');
  if (!code) {
    return {
      affiliateId: '',
      displayName: '',
    };
  }

  const rawAffiliateId = String(rawValue?.affiliateId || '').trim();
  const codeDoc = (state.codes || []).find(
    (item) => normalizeReferralCodeValue(item?.code || '') === code
  ) || null;
  const partnerHint = {
    code,
    affiliateId: rawAffiliateId || codeDoc?.affiliateId || '',
  };
  const linkedPartner = findLinkedPartnerForCode(partnerHint) || null;
  const registryEntry = getPartnerRegistryEntryForCode(partnerHint) || null;
  const partnerProfile = getPartnerProfileForCode(partnerHint) || null;
  const affiliateId = String(
    rawAffiliateId
    || codeDoc?.affiliateId
    || linkedPartner?.affiliateId
    || ''
  ).trim();

  const displayName = [
    rawValue?.displayName,
    codeDoc?.displayName,
    linkedPartner?.displayName,
    registryEntry?.partnerDisplayName,
    registryEntry?.displayName,
    partnerProfile?.businessName,
    partnerProfile?.companyName,
    partnerProfile?.legalName,
    partnerProfile?.accountHolder,
    linkedPartner?.contactName,
    affiliateId,
  ].map((value) => String(value || '').trim()).find(Boolean) || '';

  return {
    affiliateId,
    displayName,
  };
}

function normalizeSubscriberInsightRow(rawValue) {
  if (!rawValue || typeof rawValue !== 'object') return null;

  const code = normalizeReferralCodeValue(rawValue.code || '');
  if (!code) return null;

  const { affiliateId, displayName } = getSubscriberInsightAffiliateMeta(rawValue);
  const pendingReferrals = normalizeCountValue(
    rawValue.pendingReferrals ?? rawValue.trialActive
  );
  const lockedReferrals = normalizeCountValue(
    rawValue.lockedReferrals ?? rawValue.totalCurrent
  );
  const codeEnteredUsers = normalizeCountValue(
    rawValue.codeEnteredUsers
    ?? rawValue.totalHistorical
    ?? rawValue.attributedUsers
    ?? (pendingReferrals + lockedReferrals)
  );
  const codeEntryEvents = normalizeCountValue(rawValue.codeEntryEvents);
  const last30DayCodeEnteredUsers = normalizeCountValue(rawValue.last30DayCodeEnteredUsers);
  const last30DayCodeEntryEvents = normalizeCountValue(rawValue.last30DayCodeEntryEvents);
  const attributedUsers = normalizeCountValue(
    rawValue.attributedUsers
    ?? (pendingReferrals + lockedReferrals)
  );
  const activeSubscribers = normalizeCountValue(
    rawValue.activeSubscribers ?? rawValue.activeNow
  );
  const atRiskSubscribers = normalizeCountValue(rawValue.atRiskSubscribers);
  const inactiveSubscribers = normalizeCountValue(
    rawValue.inactiveSubscribers ?? rawValue.churned
  );
  const uncategorizedSubscribers = normalizeCountValue(rawValue.uncategorizedSubscribers);
  const totalSubscribers = normalizeCountValue(
    rawValue.totalSubscribers
    ?? (activeSubscribers + atRiskSubscribers + inactiveSubscribers + uncategorizedSubscribers)
  );
  const allTimeInitialPurchases = normalizeCountValue(rawValue.allTimeInitialPurchases);
  const allTimeRenewals = normalizeCountValue(rawValue.allTimeRenewals);
  const allTimeRefunds = normalizeCountValue(rawValue.allTimeRefunds);
  const allTimeRevocations = normalizeCountValue(rawValue.allTimeRevocations);
  const last30DayInitialPurchases = normalizeCountValue(rawValue.last30DayInitialPurchases);
  const last30DayRenewals = normalizeCountValue(rawValue.last30DayRenewals);
  const last30DayRefunds = normalizeCountValue(rawValue.last30DayRefunds);
  const last30DayRevocations = normalizeCountValue(rawValue.last30DayRevocations);
  const conversionRateValue = Number(rawValue.conversionRate);
  const conversionRate = Number.isFinite(conversionRateValue) && conversionRateValue >= 0
    ? conversionRateValue
    : ((codeEnteredUsers > 0 ? codeEnteredUsers : attributedUsers) > 0
      ? allTimeInitialPurchases / (codeEnteredUsers > 0 ? codeEnteredUsers : attributedUsers)
      : 0);
  const portfolioHealthRate = totalSubscribers > 0
    ? activeSubscribers / totalSubscribers
    : 0;
  const lastUpdatedIso = String(rawValue.lastUpdatedIso || '').trim() || null;

  return {
    code,
    affiliateId,
    displayName,
    status: normalizePartnerStatusValue(rawValue.status),
    codeEnteredUsers,
    codeEntryEvents,
    last30DayCodeEnteredUsers,
    last30DayCodeEntryEvents,
    pendingReferrals,
    lockedReferrals,
    attributedUsers,
    activeSubscribers,
    atRiskSubscribers,
    inactiveSubscribers,
    uncategorizedSubscribers,
    totalSubscribers,
    allTimeInitialPurchases,
    allTimeRenewals,
    allTimeRefunds,
    allTimeRevocations,
    last30DayInitialPurchases,
    last30DayRenewals,
    last30DayRefunds,
    last30DayRevocations,
    lastUpdatedIso,
    conversionRate,
    portfolioHealthRate,
    activeNow: activeSubscribers,
    totalCurrent: lockedReferrals,
    totalHistorical: codeEnteredUsers,
    churned: inactiveSubscribers,
    trialActive: pendingReferrals,
  };
}

function syncSubscriberInsightControls() {
  if (elements.subscriberMetricFilter) {
    const metricOptions = [
      { value: '', label: 'All codes' },
      { value: 'active-only', label: 'With active subscribers' },
      { value: 'pending-only', label: 'With pending referrals' },
      { value: 'converted-only', label: 'With first purchases' },
      { value: 'risk-only', label: 'With at-risk subscribers' },
    ];
    const currentMetric = String(
      state.filters.subscriberMetric
      || elements.subscriberMetricFilter.value
      || ''
    ).trim();
    elements.subscriberMetricFilter.innerHTML = metricOptions
      .map((option) => `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`)
      .join('');
    elements.subscriberMetricFilter.value = metricOptions.some((option) => option.value === currentMetric)
      ? currentMetric
      : '';
    state.filters.subscriberMetric = elements.subscriberMetricFilter.value;
  }

  if (elements.subscriberSortSelect) {
    const sortOptions = [
      { value: 'active-desc', label: 'Active now (high to low)' },
      { value: 'entered-desc', label: 'Code entered (high to low)' },
      { value: 'purchases-desc', label: 'First purchases (high to low)' },
      { value: 'pending-desc', label: 'Pending referrals (high to low)' },
      { value: 'code-asc', label: 'Code (A to Z)' },
      { value: 'code-desc', label: 'Code (Z to A)' },
    ];
    const currentSort = String(
      state.filters.subscriberSort
      || elements.subscriberSortSelect.value
      || 'active-desc'
    ).trim();
    elements.subscriberSortSelect.innerHTML = sortOptions
      .map((option) => `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`)
      .join('');
    elements.subscriberSortSelect.value = sortOptions.some((option) => option.value === currentSort)
      ? currentSort
      : 'active-desc';
    state.filters.subscriberSort = elements.subscriberSortSelect.value;
  }
}

function clampPercentValue(value) {
  const safe = Number(value);
  if (!Number.isFinite(safe)) return 0;
  return Math.max(0, Math.min(100, safe));
}

function scorePartnerProfile(profile) {
  if (!profile || typeof profile !== 'object') return 0;
  const fields = [
    profile.partnerType,
    profile.mobile,
    profile.address1,
    profile.postalCode,
    profile.city,
    profile.country,
    profile.accountHolder,
    profile.bankName,
    profile.iban || profile.accountNumber,
  ];
  if (profile.partnerType === 'company' && profile.vat) {
    fields.push(profile.vat);
  }
  return fields.filter((value) => String(value || '').trim()).length;
}

function getPartnerStatusTone(status) {
  const normalized = normalizePartnerStatusValue(status);
  if (normalized === 'inactive' || normalized === 'archived') return 'warn';
  return 'success';
}

function buildPartnerAnalyticsRows() {
  const codes = Array.isArray(state.codes) ? state.codes : [];
  const partners = normalizePartnerListValue(state.partners);
  const statsByCode = new Map();

  (state.subscriberStats || []).forEach((rawValue) => {
    const item = normalizeSubscriberInsightRow(rawValue);
    if (item?.code) {
      statsByCode.set(item.code, item);
    }
  });

  const partnerMap = new Map();

  function ensurePartner(seed) {
    const key = String(seed.key || '').trim();
    if (!key) return null;
    if (partnerMap.has(key)) return partnerMap.get(key);

    const item = {
      key,
      affiliateId: String(seed.affiliateId || '').trim(),
      displayName: String(seed.displayName || '').trim() || 'Partner',
      partnerStatus: normalizePartnerStatusValue(seed.partnerStatus),
      primaryReferralCode: normalizeReferralCodeValue(seed.primaryReferralCode || ''),
      portalEmail: normalizeEmail(seed.portalEmail),
      portalUid: String(seed.portalUid || '').trim(),
      portalWebAccessEnabled: Boolean(seed.portalWebAccessEnabled),
      contactEmail: normalizeEmail(seed.contactEmail),
      contactName: String(seed.contactName || '').trim(),
      updatedAtIso: String(seed.updatedAtIso || '').trim(),
      updatedByEmail: String(seed.updatedByEmail || '').trim(),
      profile: seed.profile || null,
      profileScore: scorePartnerProfile(seed.profile),
      codeCount: 0,
      activeCodeCount: 0,
      codeEnteredUsers: 0,
      codeEntryEvents: 0,
      last30DayCodeEnteredUsers: 0,
      last30DayCodeEntryEvents: 0,
      attributedUsers: 0,
      pendingReferrals: 0,
      lockedReferrals: 0,
      activeSubscribers: 0,
      atRiskSubscribers: 0,
      inactiveSubscribers: 0,
      uncategorizedSubscribers: 0,
      totalSubscribers: 0,
      allTimeInitialPurchases: 0,
      allTimeRenewals: 0,
      allTimeRefunds: 0,
      allTimeRevocations: 0,
      last30DayInitialPurchases: 0,
      last30DayRenewals: 0,
      last30DayRefunds: 0,
      last30DayRevocations: 0,
      codes: [],
    };
    partnerMap.set(key, item);
    return item;
  }

  codes.forEach((codeItem) => {
    const code = normalizeReferralCodeValue(codeItem?.code || '');
    if (!code) return;

    const linkedPartner = findLinkedPartnerForCode(codeItem) || null;
    const registry = getPartnerRegistryEntryForCode(codeItem) || null;
    const profile = getPartnerProfileForCode(codeItem) || null;
    const stat = statsByCode.get(code) || normalizeSubscriberInsightRow({
      code,
      affiliateId: codeItem?.affiliateId,
      displayName: codeItem?.displayName,
      status: codeItem?.status,
    });

    const affiliateId = String(
      linkedPartner?.affiliateId
      || codeItem?.affiliateId
      || registry?.affiliateId
      || ''
    ).trim();
    const row = ensurePartner({
      key: affiliateId || `code:${code}`,
      affiliateId,
      displayName:
        linkedPartner?.displayName
        || codeItem?.displayName
        || registry?.partnerDisplayName
        || registry?.displayName
        || affiliateId
        || code,
      partnerStatus: linkedPartner?.status || codeItem?.status || 'active',
      primaryReferralCode: linkedPartner?.primaryReferralCode || code,
      portalEmail: linkedPartner?.portalEmail || registry?.email,
      portalUid: linkedPartner?.portalUid || registry?.partnerUid,
      portalWebAccessEnabled:
        linkedPartner?.portalWebAccessEnabled
        || registry?.portalWebAccessEnabled === true,
      contactEmail: linkedPartner?.contactEmail || registry?.email,
      contactName: linkedPartner?.contactName,
      updatedAtIso:
        linkedPartner?.updatedAt?.iso
        || stat?.lastUpdatedIso
        || '',
      updatedByEmail: linkedPartner?.updatedByEmail || registry?.linkedBy || '',
      profile,
    });
    if (!row) return;

    const nextProfileScore = scorePartnerProfile(profile);
    if (nextProfileScore > row.profileScore) {
      row.profile = profile;
      row.profileScore = nextProfileScore;
    }
    if (!row.portalEmail) {
      row.portalEmail = normalizeEmail(linkedPartner?.portalEmail || registry?.email);
    }
    if (!row.contactEmail) {
      row.contactEmail = normalizeEmail(linkedPartner?.contactEmail || registry?.email);
    }
    if (!row.portalUid && registry?.partnerUid) {
      row.portalUid = String(registry.partnerUid || '').trim();
    }
    if (!row.contactName && linkedPartner?.contactName) {
      row.contactName = String(linkedPartner.contactName || '').trim();
    }
    if (!row.updatedAtIso && stat?.lastUpdatedIso) {
      row.updatedAtIso = stat.lastUpdatedIso;
    }
    if (!row.updatedByEmail && linkedPartner?.updatedByEmail) {
      row.updatedByEmail = String(linkedPartner.updatedByEmail || '').trim();
    }
    if (!row.primaryReferralCode) {
      row.primaryReferralCode = code;
    }
    row.portalWebAccessEnabled = row.portalWebAccessEnabled || linkedPartner?.portalWebAccessEnabled === true;

    const codeMetrics = {
      code,
      status: normalizePartnerStatusValue(codeItem?.status),
      revenueShareBps: Number(codeItem?.revenueShareBps ?? 0),
      fixedPayoutMinor: codeItem?.fixedPayoutMinor ?? null,
      currency: String(codeItem?.currency || '').trim().toUpperCase(),
      codeEnteredUsers: stat?.codeEnteredUsers || 0,
      codeEntryEvents: stat?.codeEntryEvents || 0,
      attributedUsers: stat?.attributedUsers || 0,
      pendingReferrals: stat?.pendingReferrals || 0,
      lockedReferrals: stat?.lockedReferrals || 0,
      activeSubscribers: stat?.activeSubscribers || 0,
      atRiskSubscribers: stat?.atRiskSubscribers || 0,
      inactiveSubscribers: stat?.inactiveSubscribers || 0,
      allTimeInitialPurchases: stat?.allTimeInitialPurchases || 0,
      last30DayInitialPurchases: stat?.last30DayInitialPurchases || 0,
      lastUpdatedIso: stat?.lastUpdatedIso || '',
    };

    row.codes.push(codeMetrics);
    row.codeCount += 1;
    if (codeMetrics.status === 'active') {
      row.activeCodeCount += 1;
    }
    row.codeEnteredUsers += stat?.codeEnteredUsers || 0;
    row.codeEntryEvents += stat?.codeEntryEvents || 0;
    row.last30DayCodeEnteredUsers += stat?.last30DayCodeEnteredUsers || 0;
    row.last30DayCodeEntryEvents += stat?.last30DayCodeEntryEvents || 0;
    row.attributedUsers += stat?.attributedUsers || 0;
    row.pendingReferrals += stat?.pendingReferrals || 0;
    row.lockedReferrals += stat?.lockedReferrals || 0;
    row.activeSubscribers += stat?.activeSubscribers || 0;
    row.atRiskSubscribers += stat?.atRiskSubscribers || 0;
    row.inactiveSubscribers += stat?.inactiveSubscribers || 0;
    row.uncategorizedSubscribers += stat?.uncategorizedSubscribers || 0;
    row.totalSubscribers += stat?.totalSubscribers || 0;
    row.allTimeInitialPurchases += stat?.allTimeInitialPurchases || 0;
    row.allTimeRenewals += stat?.allTimeRenewals || 0;
    row.allTimeRefunds += stat?.allTimeRefunds || 0;
    row.allTimeRevocations += stat?.allTimeRevocations || 0;
    row.last30DayInitialPurchases += stat?.last30DayInitialPurchases || 0;
    row.last30DayRenewals += stat?.last30DayRenewals || 0;
    row.last30DayRefunds += stat?.last30DayRefunds || 0;
    row.last30DayRevocations += stat?.last30DayRevocations || 0;
  });

  partners.forEach((partner) => {
    const primaryCode = normalizeReferralCodeValue(partner.primaryReferralCode || '');
    const stat = primaryCode ? statsByCode.get(primaryCode) : null;
    const row = ensurePartner({
      key: String(partner.affiliateId || '').trim() || `code:${primaryCode}`,
      affiliateId: partner.affiliateId,
      displayName: partner.displayName || partner.affiliateId || primaryCode,
      partnerStatus: partner.status,
      primaryReferralCode: primaryCode,
      portalEmail: partner.portalEmail,
      portalUid: partner.portalUid,
      portalWebAccessEnabled: partner.portalWebAccessEnabled,
      contactEmail: partner.contactEmail,
      contactName: partner.contactName,
      updatedAtIso: partner.updatedAt?.iso || stat?.lastUpdatedIso || '',
      updatedByEmail: partner.updatedByEmail,
      profile: primaryCode ? getPartnerProfileForCode({ code: primaryCode }) : null,
    });
    if (!row) return;
    row.portalWebAccessEnabled = row.portalWebAccessEnabled || partner.portalWebAccessEnabled === true;
    if (!row.portalEmail) row.portalEmail = normalizeEmail(partner.portalEmail);
    if (!row.contactEmail) row.contactEmail = normalizeEmail(partner.contactEmail);
    if (!row.contactName) row.contactName = String(partner.contactName || '').trim();
    if (!row.updatedAtIso) row.updatedAtIso = String(partner.updatedAt?.iso || '').trim();
    if (!row.updatedByEmail) row.updatedByEmail = String(partner.updatedByEmail || '').trim();
  });

  return Array.from(partnerMap.values())
    .map((item) => {
      item.codes.sort((left, right) => {
        return (right.activeSubscribers - left.activeSubscribers)
          || (right.allTimeInitialPurchases - left.allTimeInitialPurchases)
          || String(left.code || '').localeCompare(String(right.code || ''));
      });
      item.conversionRate = (item.codeEnteredUsers > 0 ? item.codeEnteredUsers : item.attributedUsers) > 0
        ? item.allTimeInitialPurchases / (item.codeEnteredUsers > 0 ? item.codeEnteredUsers : item.attributedUsers)
        : 0;
      item.portfolioHealthRate = item.totalSubscribers > 0
        ? item.activeSubscribers / item.totalSubscribers
        : 0;
      item.pendingShare = (item.codeEnteredUsers > 0 ? item.codeEnteredUsers : item.attributedUsers) > 0
        ? item.pendingReferrals / (item.codeEnteredUsers > 0 ? item.codeEnteredUsers : item.attributedUsers)
        : 0;
      item.payoutReady = Boolean(
        item.contactEmail
        && item.profile?.accountHolder
        && (item.profile?.iban || item.profile?.accountNumber)
        && item.profile?.country
      );
      item.profileCompletion = item.profileScore;
      item.attentionScore = (
        item.atRiskSubscribers * 2
        + item.inactiveSubscribers
        + (item.portalWebAccessEnabled ? 0 : 1)
        + (item.payoutReady ? 0 : 1)
      );
      item.needsAttention = (
        item.partnerStatus !== 'active'
        || item.atRiskSubscribers > 0
        || item.inactiveSubscribers > 0
        || !item.portalWebAccessEnabled
        || !item.payoutReady
      );
      return item;
    })
    .sort((left, right) => {
      return String(left.displayName || left.affiliateId || '').localeCompare(
        String(right.displayName || right.affiliateId || '')
      );
    });
}

function buildPartnerSpotlightMarkup(config) {
  const settings = config || {};
  const item = settings.item || null;
  if (!item) {
    return `
      <p class="admin-partner-spotlight__eyebrow">${escapeHtml(settings.title || 'Spotlight')}</p>
      <h3 class="admin-partner-spotlight__title">Waiting for data</h3>
      <p class="admin-partner-spotlight__copy">${escapeHtml(settings.emptyCopy || 'This card will light up once partner data is available.')}</p>
    `;
  }

  return `
    <p class="admin-partner-spotlight__eyebrow">${escapeHtml(settings.title || 'Spotlight')}</p>
    <h3 class="admin-partner-spotlight__title">${escapeHtml(item.displayName || item.affiliateId || 'Partner')}</h3>
    <p class="admin-partner-spotlight__metric">${escapeHtml(settings.metricLabel || 'Metric')}: <strong>${escapeHtml(settings.metricValue || '0')}</strong></p>
    <p class="admin-partner-spotlight__copy">${escapeHtml(settings.copy || '')}</p>
  `;
}

function renderPartnerDetail(item) {
  if (!elements.partnerDetail) return;
  if (!item) {
    elements.partnerDetail.innerHTML = '<p class="admin-empty admin-empty--inline">Select a partner to open the detailed analytics view.</p>';
    return;
  }

  const funnelMax = Math.max(
    item.codeEnteredUsers,
    item.pendingReferrals,
    item.allTimeInitialPurchases,
    item.activeSubscribers,
    1
  );
  const funnelSteps = [
    ['Code entered', item.codeEnteredUsers, 'Unique users who entered one of this partner\'s referral codes.'],
    ['Pending now', item.pendingReferrals, 'Code entered but not yet converted into a first purchase.'],
    ['First purchases', item.allTimeInitialPurchases, 'All-time first subscription purchases'],
    ['Active now', item.activeSubscribers, 'Subscribers currently active on this portfolio'],
  ];
  const healthRails = [
    ['Conversion rate', formatPercent(item.conversionRate), clampPercentValue(item.conversionRate * 100)],
    ['Portfolio health', formatPercent(item.portfolioHealthRate), clampPercentValue(item.portfolioHealthRate * 100)],
    ['Pending share', formatPercent(item.pendingShare), clampPercentValue(item.pendingShare * 100)],
  ];
  const codesMarkup = item.codes.length
    ? item.codes.map((codeItem) => {
      return `
        <button type="button" class="admin-partner-code-card" data-open-partner-code="${escapeHtml(codeItem.code)}">
          <div class="admin-partner-code-card__head">
            <strong>${escapeHtml(codeItem.code)}</strong>
            <span class="admin-tag ${codeItem.status === 'active' ? 'admin-tag--success' : 'admin-tag--warn'}">${escapeHtml(codeItem.status)}</span>
          </div>
          <div class="admin-partner-code-card__stats">
            <span>Code entered <strong>${escapeHtml(formatWholeNumber(codeItem.codeEnteredUsers))}</strong></span>
            <span>Purchases <strong>${escapeHtml(formatWholeNumber(codeItem.allTimeInitialPurchases))}</strong></span>
            <span>Active <strong>${escapeHtml(formatWholeNumber(codeItem.activeSubscribers))}</strong></span>
          </div>
        </button>
      `;
    }).join('')
    : '<p class="admin-empty admin-empty--inline">No referral codes are linked to this partner yet.</p>';

  const metadata = [
    ['Affiliate ID', item.affiliateId || '-'],
    ['Primary code', item.primaryReferralCode || '-'],
    ['Portal email', item.portalEmail || '-'],
    ['Contact email', item.contactEmail || '-'],
    ['Contact name', item.contactName || '-'],
    ['Updated', item.updatedAtIso ? formatTimestamp({ iso: item.updatedAtIso }) : '-'],
    ['Updated by', item.updatedByEmail || '-'],
    ['Billing profile', item.payoutReady ? 'ready' : 'incomplete'],
  ];

  elements.partnerDetail.innerHTML = `
    <div class="admin-partner-detail">
      <div class="admin-partner-detail__hero">
        <div>
          <p class="admin-panel__eyebrow">Selected partner</p>
          <h3 class="admin-partner-detail__title">${escapeHtml(item.displayName || item.affiliateId || 'Partner')}</h3>
          <p class="admin-panel__helper">
            ${escapeHtml(item.affiliateId || item.primaryReferralCode || 'partner')}
            &middot; ${escapeHtml(item.codeCount === 1 ? '1 referral code' : `${formatWholeNumber(item.codeCount)} referral codes`)}
            &middot; ${escapeHtml(item.portalWebAccessEnabled ? 'web portal live' : 'web portal off')}
          </p>
        </div>
        <div class="admin-partner-detail__badges">
          <span class="admin-tag ${getPartnerStatusTone(item.partnerStatus) === 'success' ? 'admin-tag--success' : 'admin-tag--warn'}">${escapeHtml(item.partnerStatus)}</span>
          <span class="admin-tag ${item.portalWebAccessEnabled ? 'admin-tag--success' : 'admin-tag--warn'}">${escapeHtml(item.portalWebAccessEnabled ? 'portal live' : 'portal off')}</span>
          <span class="admin-tag ${item.payoutReady ? 'admin-tag--success' : 'admin-tag--warn'}">${escapeHtml(item.payoutReady ? 'payout ready' : 'billing missing')}</span>
        </div>
      </div>

      <div class="admin-form__actions admin-partner-detail__actions">
        <button type="button" class="btn btn--outline" data-open-partner-code="${escapeHtml(item.primaryReferralCode || '')}">
          Open primary code
        </button>
        <button type="button" class="btn btn--outline" data-open-partner-join="${escapeHtml(item.primaryReferralCode || '')}">
          Open join page
        </button>
        <button type="button" class="btn btn--outline" data-open-partner-portal="${escapeHtml(item.portalEmail || '')}" ${item.portalEmail ? '' : 'disabled'}>
          Open portal login
        </button>
      </div>

      <div class="admin-stat-grid admin-stat-grid--4col admin-partner-detail__stats">
        <div class="admin-stat-card">
          <span class="admin-stat-card__label">Code entered</span>
          <span class="admin-stat-card__value">${escapeHtml(formatWholeNumber(item.codeEnteredUsers))}</span>
        </div>
        <div class="admin-stat-card">
          <span class="admin-stat-card__label">Pending now</span>
          <span class="admin-stat-card__value">${escapeHtml(formatWholeNumber(item.pendingReferrals))}</span>
        </div>
        <div class="admin-stat-card">
          <span class="admin-stat-card__label">First purchases</span>
          <span class="admin-stat-card__value">${escapeHtml(formatWholeNumber(item.allTimeInitialPurchases))}</span>
        </div>
        <div class="admin-stat-card admin-stat-card--active">
          <span class="admin-stat-card__label">Active now</span>
          <span class="admin-stat-card__value">${escapeHtml(formatWholeNumber(item.activeSubscribers))}</span>
        </div>
        <div class="admin-stat-card admin-stat-card--warn">
          <span class="admin-stat-card__label">At risk</span>
          <span class="admin-stat-card__value">${escapeHtml(formatWholeNumber(item.atRiskSubscribers))}</span>
        </div>
        <div class="admin-stat-card">
          <span class="admin-stat-card__label">Inactive</span>
          <span class="admin-stat-card__value">${escapeHtml(formatWholeNumber(item.inactiveSubscribers))}</span>
        </div>
      </div>

      <div class="admin-partner-detail__split">
        <section class="admin-detail-section">
          <h3 class="admin-section-title">Partner funnel</h3>
          <div class="admin-partner-funnel">
            ${funnelSteps.map(([label, value, copy]) => `
              <div class="admin-partner-funnel__step">
                <div class="admin-partner-funnel__head">
                  <span>${escapeHtml(label)}</span>
                  <strong>${escapeHtml(formatWholeNumber(value))}</strong>
                </div>
                <div class="admin-partner-funnel__track">
                  <span class="admin-partner-funnel__fill" style="width:${Math.max(12, Math.round((Number(value) / funnelMax) * 100))}%"></span>
                </div>
                <p class="admin-partner-funnel__copy">${escapeHtml(copy)}</p>
              </div>
            `).join('')}
          </div>
        </section>

        <section class="admin-detail-section">
          <h3 class="admin-section-title">Health and velocity</h3>
          <div class="admin-partner-rails">
            ${healthRails.map(([label, value, pct]) => `
              <div class="admin-partner-rail">
                <div class="admin-partner-rail__head">
                  <span>${escapeHtml(label)}</span>
                  <strong>${escapeHtml(value)}</strong>
                </div>
                <div class="admin-partner-rail__track">
                  <span class="admin-partner-rail__fill" style="width:${clampPercentValue(pct)}%"></span>
                </div>
              </div>
            `).join('')}
          </div>
          <div class="admin-stat-grid admin-stat-grid--4col admin-partner-detail__stats admin-partner-detail__stats--compact">
            <div class="admin-stat-card">
              <span class="admin-stat-card__label">Apply events</span>
              <span class="admin-stat-card__value">${escapeHtml(formatWholeNumber(item.codeEntryEvents))}</span>
            </div>
            <div class="admin-stat-card">
              <span class="admin-stat-card__label">30d first purchases</span>
              <span class="admin-stat-card__value">${escapeHtml(formatWholeNumber(item.last30DayInitialPurchases))}</span>
            </div>
            <div class="admin-stat-card">
              <span class="admin-stat-card__label">30d renewals</span>
              <span class="admin-stat-card__value">${escapeHtml(formatWholeNumber(item.last30DayRenewals))}</span>
            </div>
            <div class="admin-stat-card admin-stat-card--warn">
              <span class="admin-stat-card__label">30d refunds</span>
              <span class="admin-stat-card__value">${escapeHtml(formatWholeNumber(item.last30DayRefunds))}</span>
            </div>
            <div class="admin-stat-card admin-stat-card--warn">
              <span class="admin-stat-card__label">30d revocations</span>
              <span class="admin-stat-card__value">${escapeHtml(formatWholeNumber(item.last30DayRevocations))}</span>
            </div>
          </div>
        </section>
      </div>

      <div class="admin-partner-detail__split">
        <section class="admin-detail-section">
          <h3 class="admin-section-title">Code breakdown</h3>
          <div class="admin-partner-code-grid">
            ${codesMarkup}
          </div>
        </section>

        <section class="admin-detail-section">
          <h3 class="admin-section-title">Partner operations metadata</h3>
          <div class="admin-detail-meta">
            ${metadata.map(([label, value]) => `
              <div class="admin-detail-meta__item">
                <span class="admin-detail-meta__label">${escapeHtml(label)}</span>
                <strong class="admin-detail-meta__value">${escapeHtml(value)}</strong>
              </div>
            `).join('')}
          </div>
        </section>
      </div>
    </div>
  `;
}

function renderPartnerAnalyticsPage() {
  const allItems = buildPartnerAnalyticsRows();
  const query = normalizeSearchValue(state.filters.partnerQuery);
  const statusFilter = String(state.filters.partnerStatus || '').trim();
  const sortKey = String(state.filters.partnerSort || 'active-desc').trim();

  const totals = allItems.reduce((acc, item) => {
    acc.partners += 1;
    acc.portalLive += item.portalWebAccessEnabled ? 1 : 0;
    acc.enteredUsers += item.codeEnteredUsers || 0;
    acc.entryEvents += item.codeEntryEvents || 0;
    acc.purchases += item.allTimeInitialPurchases || 0;
    acc.active += item.activeSubscribers || 0;
    acc.atRisk += item.atRiskSubscribers || 0;
    return acc;
  }, {
    partners: 0,
    portalLive: 0,
    enteredUsers: 0,
    entryEvents: 0,
    purchases: 0,
    active: 0,
    atRisk: 0,
  });

  const topActivator = allItems
    .slice()
    .sort((left, right) => (right.activeSubscribers - left.activeSubscribers) || (right.allTimeInitialPurchases - left.allTimeInitialPurchases))[0] || null;
  const topConverter = allItems
    .filter((item) => item.codeEnteredUsers > 0 || item.attributedUsers > 0)
    .slice()
    .sort((left, right) => (right.conversionRate - left.conversionRate) || (right.codeEnteredUsers - left.codeEnteredUsers))[0] || null;
  const watchlist = allItems
    .slice()
    .sort((left, right) => (right.attentionScore - left.attentionScore) || (right.atRiskSubscribers - left.atRiskSubscribers))[0] || null;

  if (elements.partnerTotalCount) elements.partnerTotalCount.textContent = formatWholeNumber(totals.partners);
  if (elements.partnerPortalLiveCount) elements.partnerPortalLiveCount.textContent = formatWholeNumber(totals.portalLive);
  if (elements.partnerEntriesTotal) elements.partnerEntriesTotal.textContent = formatWholeNumber(totals.enteredUsers);
  if (elements.partnerPurchasesTotal) elements.partnerPurchasesTotal.textContent = formatWholeNumber(totals.purchases);
  if (elements.partnerActiveTotal) elements.partnerActiveTotal.textContent = formatWholeNumber(totals.active);
  if (elements.partnerAtRiskTotal) elements.partnerAtRiskTotal.textContent = formatWholeNumber(totals.atRisk);
  if (elements.partnerLastRefresh) {
    elements.partnerLastRefresh.textContent = state.subscriberLastRefreshAt
      ? formatTimestamp({ iso: state.subscriberLastRefreshAt })
      : 'Never';
  }
  if (elements.partnerSnapshotMeta) {
    elements.partnerSnapshotMeta.textContent = allItems.length
      ? `Network pulse: ${formatWholeNumber(totals.enteredUsers)} users entered a code across ${formatWholeNumber(totals.entryEvents)} tracked apply events, ${formatWholeNumber(totals.purchases)} first purchases, and ${formatWholeNumber(totals.active)} active subscribers across ${formatWholeNumber(totals.partners)} partners.`
      : 'Partner network snapshot will appear here once data has loaded.';
  }
  if (elements.partnerTopActivator) {
    elements.partnerTopActivator.innerHTML = buildPartnerSpotlightMarkup({
      title: 'Top activator',
      item: topActivator,
      metricLabel: 'Active subscribers',
      metricValue: formatWholeNumber(topActivator?.activeSubscribers || 0),
      copy: topActivator
        ? `${formatWholeNumber(topActivator.allTimeInitialPurchases)} first purchases so far and ${formatWholeNumber(topActivator.codeCount)} linked codes in the portfolio.`
        : 'This card lights up when active subscribers start flowing through the affiliate network.',
    });
  }
  if (elements.partnerTopConverter) {
    elements.partnerTopConverter.innerHTML = buildPartnerSpotlightMarkup({
      title: 'Sharpest conversion',
      item: topConverter,
      metricLabel: 'Conversion rate',
      metricValue: formatPercent(topConverter?.conversionRate || 0),
      copy: topConverter
        ? `${formatWholeNumber(topConverter.codeEnteredUsers)} users entered a code and ${formatWholeNumber(topConverter.allTimeInitialPurchases)} turned into first purchases.`
        : 'Waiting for enough code-entry volume to measure conversion properly.',
    });
  }
  if (elements.partnerWatchlist) {
    elements.partnerWatchlist.innerHTML = buildPartnerSpotlightMarkup({
      title: 'Needs attention',
      item: watchlist,
      metricLabel: 'Attention score',
      metricValue: formatWholeNumber(watchlist?.attentionScore || 0),
      copy: watchlist
        ? `${formatWholeNumber(watchlist.atRiskSubscribers)} at risk and ${formatWholeNumber(watchlist.inactiveSubscribers)} inactive subscribers. Portal ${watchlist.portalWebAccessEnabled ? 'is live' : 'still needs enabling'}.`
        : 'No partner needs extra attention right now.',
    });
  }

  let items = allItems.filter((item) => {
    if (statusFilter === 'portal-live' && !item.portalWebAccessEnabled) return false;
    if (statusFilter === 'needs-attention' && !item.needsAttention) return false;
    if (statusFilter === 'payout-ready' && !item.payoutReady) return false;
    if (statusFilter === 'inactive' && item.partnerStatus === 'active') return false;
    if (!query) return true;
    const haystack = [
      item.displayName,
      item.affiliateId,
      item.portalEmail,
      item.contactEmail,
      item.primaryReferralCode,
      item.codes.map((codeItem) => codeItem.code).join(' '),
    ].map((value) => normalizeSearchValue(value)).join(' ');
    return haystack.includes(query);
  });

  const [sortField, sortDirection] = sortKey.split('-');
  const dir = sortDirection === 'asc' ? 1 : -1;
  const fieldMap = {
    active: 'activeSubscribers',
    purchases: 'allTimeInitialPurchases',
    conversion: 'conversionRate',
    entries: 'codeEnteredUsers',
    name: 'displayName',
  };
  const normalizedSortField = fieldMap[sortField] || 'activeSubscribers';
  items = items.slice().sort((left, right) => {
    const leftValue = normalizedSortField === 'displayName'
      ? String(left.displayName || left.affiliateId || '')
      : Number(left[normalizedSortField] ?? 0);
    const rightValue = normalizedSortField === 'displayName'
      ? String(right.displayName || right.affiliateId || '')
      : Number(right[normalizedSortField] ?? 0);
    if (leftValue < rightValue) return -1 * dir;
    if (leftValue > rightValue) return 1 * dir;
    return String(left.displayName || '').localeCompare(String(right.displayName || ''));
  });

  const selected = items.find((item) => item.key === state.selectedPartnerKey)
    || (!query && !statusFilter ? allItems.find((item) => item.key === state.selectedPartnerKey) : null)
    || items[0]
    || null;
  state.selectedPartnerKey = selected?.key || '';

  if (elements.partnerList) {
    elements.partnerList.innerHTML = items
      .map((item) => {
        const active = item.key === state.selectedPartnerKey;
        const rateWidth = clampPercentValue(item.conversionRate * 100);
        return `
        <button
          type="button"
          class="admin-partner-card${active ? ' is-active' : ''}"
          data-partner-key="${escapeHtml(item.key)}"
          style="content-visibility:auto;contain:layout paint style;contain-intrinsic-size:220px;"
        >
            <div class="admin-partner-card__head">
              <div>
                <span class="admin-partner-card__eyebrow">${escapeHtml(item.affiliateId || item.primaryReferralCode || 'partner')}</span>
                <strong class="admin-partner-card__title">${escapeHtml(item.displayName || item.affiliateId || 'Partner')}</strong>
              </div>
              <span class="admin-tag ${item.portalWebAccessEnabled ? 'admin-tag--success' : 'admin-tag--warn'}">${escapeHtml(item.portalWebAccessEnabled ? 'portal live' : 'portal off')}</span>
            </div>
            <div class="admin-partner-card__stats">
              <span>Code entered <strong>${escapeHtml(formatWholeNumber(item.codeEnteredUsers))}</strong></span>
              <span>Purchases <strong>${escapeHtml(formatWholeNumber(item.allTimeInitialPurchases))}</strong></span>
              <span>Active <strong>${escapeHtml(formatWholeNumber(item.activeSubscribers))}</strong></span>
            </div>
            <div class="admin-partner-card__track">
              <span class="admin-partner-card__fill" style="width:${Math.max(12, rateWidth)}%"></span>
            </div>
            <p class="admin-partner-card__meta">
              ${escapeHtml(item.primaryReferralCode || '-')} &middot; ${escapeHtml(item.codeCount === 1 ? '1 code' : `${formatWholeNumber(item.codeCount)} codes`)} &middot; ${escapeHtml(item.payoutReady ? 'payout ready' : 'billing incomplete')}
            </p>
          </button>
        `;
      })
      .join('');
  }

  if (elements.partnerEmpty) {
    elements.partnerEmpty.hidden = items.length > 0;
    if (!items.length && allItems.length) {
      elements.partnerEmpty.textContent = 'No partners match the current filters.';
    } else if (!allItems.length) {
      elements.partnerEmpty.textContent = 'No partners are linked yet. Create a code and connect a partner to light up this dashboard.';
    }
  }

  renderPartnerDetail(items.length ? selected : null);
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
    loginSuccessSound.addEventListener('play', updateSpiritSoundControls);
    loginSuccessSound.addEventListener('pause', updateSpiritSoundControls);
    loginSuccessSound.addEventListener('ended', () => {
      loginSuccessSound.currentTime = 0;
      updateSpiritSoundControls();
    });
  }

  return loginSuccessSound;
}

async function playLoginSuccessSound(options) {
  const settings = Object.assign({ restart: false }, options || {});
  try {
    const sound = getLoginSuccessSound();
    if (settings.restart || sound.ended) {
      sound.currentTime = 0;
    }
    await sound.play();
  } catch (_error) {
    // Browser autoplay policies can block audio; ignore silently.
  } finally {
    updateSpiritSoundControls();
  }
}

function updateSpiritSoundControls() {
  const sound = loginSuccessSound;
  const isPlaying = Boolean(sound && !sound.paused && !sound.ended);
  const canResume = Boolean(sound && sound.paused && sound.currentTime > 0);
  const canStop = Boolean(sound && (isPlaying || sound.currentTime > 0));

  if (elements.playSpiritSound) {
    elements.playSpiritSound.disabled = isPlaying;
    elements.playSpiritSound.textContent = canResume
      ? SPIRIT_RESUME_LABEL
      : SPIRIT_PLAY_LABEL;
  }

  if (elements.pauseSpiritSound) {
    elements.pauseSpiritSound.disabled = !isPlaying;
  }

  if (elements.stopSpiritSound) {
    elements.stopSpiritSound.disabled = !canStop;
  }

  if (elements.spiritSoundState) {
    let label = 'Music stopped';
    let stateName = 'stopped';

    if (isPlaying) {
      label = 'Music playing';
      stateName = 'playing';
    } else if (canResume) {
      label = 'Music paused';
      stateName = 'paused';
    }

    elements.spiritSoundState.textContent = label;
    elements.spiritSoundState.dataset.state = stateName;
  }
}

function pauseLoginSuccessSound() {
  if (!loginSuccessSound || loginSuccessSound.paused) {
    updateSpiritSoundControls();
    return;
  }

  loginSuccessSound.pause();
  updateSpiritSoundControls();
}

function stopLoginSuccessSound() {
  if (!loginSuccessSound) {
    updateSpiritSoundControls();
    return;
  }

  loginSuccessSound.pause();
  loginSuccessSound.currentTime = 0;
  updateSpiritSoundControls();
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
    _format: 'nuria-affiliate-ops-snapshot',
    _version: '2.0',
    publisher: {
      name: EXPORT_PUBLISHER.legalName,
      orgNumber: EXPORT_PUBLISHER.orgNumber,
      vatId: EXPORT_PUBLISHER.vatId,
    },
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
    subscriberStats: (state.subscriberStats || []).slice(0, 100),
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
  const pub = EXPORT_PUBLISHER;
  const lines = [];
  lines.push('# Nuria Affiliate Admin — Ops Snapshot');
  lines.push(`# Generated: ${snapshot.generatedAt}`);
  lines.push(`# Publisher: ${pub.legalName} (${pub.orgNumber})`);
  lines.push('');

  lines.push([csvCell('Actor'), csvCell('Month'), csvCell('Report ID')].join(','));
  lines.push([csvCell(snapshot.actor), csvCell(snapshot.selectedMonth), csvCell(snapshot.selectedReportId)].join(','));
  lines.push('');

  lines.push('# Checklist Status');
  lines.push([csvCell('Step'), csvCell('Complete')].join(','));
  CHECKLIST_STEPS.forEach((step) => {
    lines.push([csvCell(step), csvCell(Boolean(snapshot.selectedMonthChecklist?.[step]) ? 'yes' : 'no')].join(','));
  });
  lines.push('');

  lines.push('# Month Lock');
  lines.push([csvCell('Locked'), csvCell('Reason')].join(','));
  lines.push([csvCell(Boolean(snapshot.selectedMonthLock?.locked) ? 'yes' : 'no'), csvCell(snapshot.selectedMonthLock?.reason || '')].join(','));
  lines.push('');

  lines.push('# Scheduled Recipients');
  lines.push([csvCell('Email')].join(','));
  (snapshot.scheduledRecipients || []).forEach((email) => {
    lines.push([csvCell(email)].join(','));
  });
  lines.push('');

  if (snapshot.subscriberStats?.length) {
    lines.push('# Subscriber Stats by Code');
    lines.push([
      csvCell('Code'),
      csvCell('Affiliate'),
      csvCell('Code Entered'),
      csvCell('Pending Referrals'),
      csvCell('Locked Referrals'),
      csvCell('First Purchases'),
      csvCell('Active Now'),
      csvCell('At Risk'),
      csvCell('Inactive'),
      csvCell('Last Updated'),
    ].join(','));
    snapshot.subscriberStats.forEach((s) => {
      const row = normalizeSubscriberInsightRow(s);
      if (!row) return;
      lines.push([
        csvCell(row.code),
        csvCell(row.displayName || row.affiliateId || ''),
        csvCell(row.codeEnteredUsers),
        csvCell(row.pendingReferrals),
        csvCell(row.lockedReferrals),
        csvCell(row.allTimeInitialPurchases),
        csvCell(row.activeSubscribers),
        csvCell(row.atRiskSubscribers),
        csvCell(row.inactiveSubscribers),
        csvCell(row.lastUpdatedIso || ''),
      ].join(','));
    });
    lines.push('');
  }

  lines.push('# Report Summaries');
  lines.push([csvCell('Report ID'), csvCell('Month'), csvCell('Status'), csvCell('Source'), csvCell('Rows'), csvCell('Affiliates'), csvCell('Updated')].join(','));
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

  lines.push('# Recent Activity');
  lines.push([csvCell('Timestamp'), csvCell('Actor'), csvCell('Kind'), csvCell('Message')].join(','));
  (snapshot.recentActivity || []).forEach((row) => {
    lines.push([
      csvCell(row.at || ''),
      csvCell(row.actor || ''),
      csvCell(row.kind || ''),
      csvCell(row.message || ''),
    ].join(','));
  });
  lines.push('');

  const totalCodes = snapshot.codeSummaries?.length || 0;
  const totalReports = snapshot.reportSummaries?.length || 0;
  lines.push(`# End of snapshot. ${totalCodes} codes, ${totalReports} reports.`);

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
  const pub = EXPORT_PUBLISHER;
  const generatedAt = new Date().toISOString();
  const lines = [];

  lines.push('# Nuria Affiliate Payout Report');
  lines.push('#');
  lines.push(`# Generated: ${generatedAt}`);
  lines.push(`# Publisher: ${pub.legalName} (${pub.orgNumber})`);
  lines.push('');

  lines.push([
    csvCell('Report ID'),
    csvCell('Period'),
    csvCell('Status'),
    csvCell('Source'),
    csvCell('Created'),
    csvCell('Updated'),
  ].join(','));
  lines.push([
    csvCell(report.reportId || ''),
    csvCell(report.periodMonth || ''),
    csvCell(report.status || ''),
    csvCell(report.source || ''),
    csvCell(toIsoDate(report.createdAt)),
    csvCell(toIsoDate(report.updatedAt)),
  ].join(','));
  lines.push('');

  lines.push('# Affiliate Summaries');
  lines.push([
    csvCell('Affiliate ID'),
    csvCell('Display Name'),
    csvCell('Referral Codes'),
    csvCell('Commission Total (minor)'),
    csvCell('Currencies'),
    csvCell('Payout-ready'),
    csvCell('Reconciliation'),
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
  lines.push('# Ledger Rows');
  lines.push([
    csvCell('Ledger ID'),
    csvCell('Event'),
    csvCell('Status'),
    csvCell('Amount (minor)'),
    csvCell('Currency'),
    csvCell('Affiliate ID'),
    csvCell('Affiliate'),
    csvCell('Code'),
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

  lines.push('');
  lines.push(`# End of report. ${affiliates.length} affiliates, ${rows.length} ledger rows.`);

  return lines.join('\n');
}

function renderPdfTableRows(rows, mapper) {
  return rows
    .map((item) => `<tr>${mapper(item)}</tr>`)
    .join('');
}

function fetchAssetAsDataUrl(url) {
  return fetch(url, { credentials: 'same-origin' })
    .then((res) => {
      if (!res.ok) throw new Error('asset_fetch_failed');
      return res.blob();
    })
    .then(
      (blob) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(new Error('asset_read_failed'));
          reader.readAsDataURL(blob);
        })
    );
}

async function loadExportBrandingDataUrls() {
  const base = window.location.origin;
  const [nuriaDataUrl, oakdevDataUrl] = await Promise.all([
    fetchAssetAsDataUrl(`${base}/assets/nuria-admin.png`),
    fetchAssetAsDataUrl(`${base}/assets/oakdev-logo.png`),
  ]);
  return { nuriaDataUrl, oakdevDataUrl };
}

async function downloadStyledExcelForDetail(detail) {
  let branding = null;
  try {
    branding = await loadExportBrandingDataUrls();
  } catch (_error) {
    branding = null;
  }
  const html = buildStyledExcelHtml(detail, { branding });
  createAndDownloadFile(
    buildExportFilename(detail.report, 'xls'),
    html,
    'application/vnd.ms-excel;charset=utf-8'
  );
}

function buildStyledExcelHtml(detail, options) {
  const report = detail.report || {};
  const affiliates = detail.affiliates || [];
  const rows = detail.rows || [];
  const branding = options?.branding || null;
  const generatedAt = new Date().toISOString();
  const pub = EXPORT_PUBLISHER;
  const headerBg = '#0a3d23';
  const headerFg = '#ffffff';
  const stripe = '#f0f9f3';
  const border = '#d4e5da';
  const titleColor = '#0c2818';
  const accentGold = '#b8923d';
  const metaBg = '#f7faf8';
  const summaryBg = '#edf5f0';
  const fontStack = 'Segoe UI, Calibri, Arial, sans-serif';

  const nuriaHeader = branding?.nuriaDataUrl
    ? `<img src="${branding.nuriaDataUrl}" alt="Nuria" style="height:56px;width:auto;vertical-align:middle;" />`
    : `<span style="font-size:18pt;font-weight:700;color:${titleColor};font-family:${fontStack};letter-spacing:-0.02em;">Nuria</span>`;

  const oakFooter = branding?.oakdevDataUrl
    ? `<img src="${branding.oakdevDataUrl}" alt="OakDev" style="height:28px;width:auto;" />`
    : `<span style="font-size:10pt;font-weight:600;color:${titleColor};">OakDev &amp; AI AB</span>`;

  const totalCommission = affiliates.reduce((sum, item) => sum + (item.knownCommissionTotalMinor || 0), 0);
  const totalPayout = affiliates.reduce((sum, item) => sum + (item.payoutReadyRowCount || 0), 0);
  const totalRecon = affiliates.reduce((sum, item) => sum + (item.reconciliationRowCount || 0), 0);

  const affiliateRows = affiliates
    .map(
      (item, idx) => `
    <tr style="background:${idx % 2 === 0 ? '#ffffff' : stripe};">
      <td style="border:1px solid ${border};padding:9px 12px;font-family:${fontStack};font-size:10pt;font-weight:600;">${escapeHtml(item.affiliateDisplayName || item.affiliateId || '-')}</td>
      <td style="border:1px solid ${border};padding:9px 12px;font-family:${fontStack};font-size:10pt;">${escapeHtml(formatList(item.referralCodes))}</td>
      <td style="border:1px solid ${border};padding:9px 12px;font-family:${fontStack};font-size:10pt;text-align:right;mso-number-format:'\\@';">${escapeHtml(String(item.knownCommissionTotalMinor ?? 0))}</td>
      <td style="border:1px solid ${border};padding:9px 12px;font-family:${fontStack};font-size:10pt;text-align:center;">${escapeHtml(String(item.payoutReadyRowCount ?? 0))}</td>
      <td style="border:1px solid ${border};padding:9px 12px;font-family:${fontStack};font-size:10pt;text-align:center;">${escapeHtml(String(item.reconciliationRowCount ?? 0))}</td>
    </tr>`
    )
    .join('');

  const ledgerRows = rows
    .map(
      (item, idx) => `
    <tr style="background:${idx % 2 === 0 ? '#ffffff' : stripe};">
      <td style="border:1px solid ${border};padding:7px 10px;font-family:${fontStack};font-size:9pt;mso-number-format:'\\@';color:#4a6355;">${escapeHtml(item.ledgerId || '-')}</td>
      <td style="border:1px solid ${border};padding:7px 10px;font-family:${fontStack};font-size:9pt;">${escapeHtml(item.eventType || '-')}</td>
      <td style="border:1px solid ${border};padding:7px 10px;font-family:${fontStack};font-size:9pt;"><span style="background:${item.payoutStatus === 'ready' ? '#dcfce7' : '#fef3c7'};color:${item.payoutStatus === 'ready' ? '#166534' : '#92400e'};padding:2px 8px;border-radius:4px;font-size:8pt;font-weight:600;">${escapeHtml(item.payoutStatus || '-')}</span></td>
      <td style="border:1px solid ${border};padding:7px 10px;font-family:${fontStack};font-size:9pt;text-align:right;font-weight:600;mso-number-format:'\\@';">${escapeHtml(String(item.commissionAmountMinor ?? 0))}</td>
      <td style="border:1px solid ${border};padding:7px 10px;font-family:${fontStack};font-size:9pt;text-align:center;">${escapeHtml(item.currency || '-')}</td>
      <td style="border:1px solid ${border};padding:7px 10px;font-family:${fontStack};font-size:9pt;">${escapeHtml(item.affiliateDisplayName || item.affiliateId || '-')}</td>
      <td style="border:1px solid ${border};padding:7px 10px;font-family:${fontStack};font-size:9pt;color:#4a6355;">${escapeHtml(item.referralCode || '-')}</td>
      <td style="border:1px solid ${border};padding:7px 10px;font-family:${fontStack};font-size:9pt;color:#6b7c72;">${escapeHtml(toIsoDate(item.earnedAt) || '-')}</td>
    </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8" />
  <meta name="ExcelCreatedBy" content="Nuria Affiliate Admin" />
  <!--[if gte mso 9]><xml>
    <x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
      <x:Name>Payout report</x:Name>
      <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
    </x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook>
  </xml><![endif]-->
  <style>table { mso-displayed-decimal-separator: "."; mso-displayed-thousand-separator: " "; }</style>
</head>
<body style="margin:0;padding:0;">
<table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;font-family:${fontStack};">
  <tr>
    <td style="padding:20px 0 18px 0;border-bottom:3px solid ${accentGold};">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td valign="middle" style="padding:4px 0;">${nuriaHeader}</td>
        <td valign="middle" align="right">
          <span style="font-size:13pt;font-weight:700;color:${titleColor};display:block;">Affiliate Payout Report</span>
          <span style="font-size:9pt;color:#6b7c72;margin-top:3px;display:block;">Internal finance document · confidential</span>
        </td>
      </tr></table>
    </td>
  </tr>
  <tr><td style="height:14px"></td></tr>
  <tr>
    <td>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:${metaBg};border:1px solid ${border};border-radius:6px;">
        <tr>
          <td style="padding:12px 16px;font-size:9pt;color:${titleColor};width:25%;">
            <span style="font-size:7pt;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#6b7c72;display:block;margin-bottom:3px;">Report ID</span>
            <span style="font-weight:600;">${escapeHtml(report.reportId || '—')}</span>
          </td>
          <td style="padding:12px 16px;font-size:9pt;color:${titleColor};width:25%;">
            <span style="font-size:7pt;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#6b7c72;display:block;margin-bottom:3px;">Period</span>
            <span style="font-weight:700;font-size:11pt;">${escapeHtml(report.periodMonth || '—')}</span>
          </td>
          <td style="padding:12px 16px;font-size:9pt;color:${titleColor};width:25%;">
            <span style="font-size:7pt;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#6b7c72;display:block;margin-bottom:3px;">Status</span>
            <span style="font-weight:600;color:${report.status === 'paid' ? '#166534' : '#92400e'};">${escapeHtml(report.status || '—')}</span>
          </td>
          <td style="padding:12px 16px;font-size:9pt;color:${titleColor};width:25%;">
            <span style="font-size:7pt;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#6b7c72;display:block;margin-bottom:3px;">Generated</span>
            <span style="color:#6b7c72;">${escapeHtml(generatedAt)}</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr><td style="height:18px"></td></tr>
  <tr>
    <td>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        <tr>
          <td colspan="5" style="font-size:11pt;font-weight:700;color:${titleColor};padding:12px 0 8px 0;border-bottom:2px solid ${border};">Affiliate Summaries</td>
        </tr>
        <tr>
          <th style="background:${headerBg};color:${headerFg};border:1px solid ${border};padding:10px 12px;text-align:left;font-size:9pt;font-weight:700;letter-spacing:0.04em;">Affiliate</th>
          <th style="background:${headerBg};color:${headerFg};border:1px solid ${border};padding:10px 12px;text-align:left;font-size:9pt;font-weight:700;letter-spacing:0.04em;">Codes</th>
          <th style="background:${headerBg};color:${headerFg};border:1px solid ${border};padding:10px 12px;text-align:right;font-size:9pt;font-weight:700;letter-spacing:0.04em;">Total (minor)</th>
          <th style="background:${headerBg};color:${headerFg};border:1px solid ${border};padding:10px 12px;text-align:center;font-size:9pt;font-weight:700;letter-spacing:0.04em;">Payout-ready</th>
          <th style="background:${headerBg};color:${headerFg};border:1px solid ${border};padding:10px 12px;text-align:center;font-size:9pt;font-weight:700;letter-spacing:0.04em;">Reconciliation</th>
        </tr>
        ${affiliateRows || `<tr><td colspan="5" style="border:1px solid ${border};padding:14px;text-align:center;color:#6b7c72;font-style:italic;">No affiliate data</td></tr>`}
        <tr style="background:${summaryBg};font-weight:700;">
          <td colspan="2" style="border:1px solid ${border};padding:10px 12px;font-family:${fontStack};font-size:10pt;color:${titleColor};">Totals</td>
          <td style="border:1px solid ${border};padding:10px 12px;font-family:${fontStack};font-size:10pt;text-align:right;color:${titleColor};">${escapeHtml(String(totalCommission))}</td>
          <td style="border:1px solid ${border};padding:10px 12px;font-family:${fontStack};font-size:10pt;text-align:center;color:${titleColor};">${escapeHtml(String(totalPayout))}</td>
          <td style="border:1px solid ${border};padding:10px 12px;font-family:${fontStack};font-size:10pt;text-align:center;color:${titleColor};">${escapeHtml(String(totalRecon))}</td>
        </tr>
      </table>
    </td>
  </tr>
  <tr><td style="height:20px"></td></tr>
  <tr>
    <td>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        <tr>
          <td colspan="8" style="font-size:11pt;font-weight:700;color:${titleColor};padding:12px 0 8px 0;border-bottom:2px solid ${border};">Ledger Rows</td>
        </tr>
        <tr>
          <th style="background:${headerBg};color:${headerFg};border:1px solid ${border};padding:9px 10px;text-align:left;font-size:8pt;font-weight:700;letter-spacing:0.04em;">Ledger ID</th>
          <th style="background:${headerBg};color:${headerFg};border:1px solid ${border};padding:9px 10px;text-align:left;font-size:8pt;font-weight:700;letter-spacing:0.04em;">Event</th>
          <th style="background:${headerBg};color:${headerFg};border:1px solid ${border};padding:9px 10px;text-align:left;font-size:8pt;font-weight:700;letter-spacing:0.04em;">Status</th>
          <th style="background:${headerBg};color:${headerFg};border:1px solid ${border};padding:9px 10px;text-align:right;font-size:8pt;font-weight:700;letter-spacing:0.04em;">Amount</th>
          <th style="background:${headerBg};color:${headerFg};border:1px solid ${border};padding:9px 10px;text-align:center;font-size:8pt;font-weight:700;letter-spacing:0.04em;">CCY</th>
          <th style="background:${headerBg};color:${headerFg};border:1px solid ${border};padding:9px 10px;text-align:left;font-size:8pt;font-weight:700;letter-spacing:0.04em;">Affiliate</th>
          <th style="background:${headerBg};color:${headerFg};border:1px solid ${border};padding:9px 10px;text-align:left;font-size:8pt;font-weight:700;letter-spacing:0.04em;">Code</th>
          <th style="background:${headerBg};color:${headerFg};border:1px solid ${border};padding:9px 10px;text-align:left;font-size:8pt;font-weight:700;letter-spacing:0.04em;">Earned</th>
        </tr>
        ${ledgerRows || `<tr><td colspan="8" style="border:1px solid ${border};padding:14px;text-align:center;color:#6b7c72;font-style:italic;">No ledger rows</td></tr>`}
      </table>
    </td>
  </tr>
  <tr><td style="height:22px"></td></tr>
  <tr>
    <td style="border-top:3px solid ${accentGold};padding-top:16px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td valign="top" style="width:150px;padding-right:12px;">${oakFooter}</td>
          <td valign="top" style="font-size:8pt;color:#4a6355;line-height:1.6;">
            <strong style="font-size:9pt;color:${titleColor};">${escapeHtml(pub.legalName)}</strong><br />
            Org.nr. ${escapeHtml(pub.orgNumber)} &middot; VAT ${escapeHtml(pub.vatId)}<br />
            ${escapeHtml(pub.addressLine1)}, ${escapeHtml(pub.postalCity)}<br />
            ${escapeHtml(pub.email)} &middot; ${escapeHtml(pub.phone)}
          </td>
          <td valign="top" align="right" style="font-size:8pt;color:#9ca3af;">
            ${escapeHtml(affiliates.length)} affiliates &middot; ${escapeHtml(String(rows.length))} rows<br />
            Source: ${escapeHtml(report.source || '—')}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

function buildPrintableHtml(detail, options) {
  const report = detail.report || {};
  const affiliates = detail.affiliates || [];
  const rows = detail.rows || [];
  const generatedAt = new Date().toISOString();
  const pub = EXPORT_PUBLISHER;
  const origin = window.location.origin;
  const settings = Object.assign(
    {
      title: 'Nuria Affiliate Payout Report',
      subtitle: 'Internal finance export · confidential',
      footerNote: '',
      includeRows: true,
    },
    options || {}
  );

  const totalCommission = affiliates.reduce((sum, item) => sum + (item.knownCommissionTotalMinor || 0), 0);
  const totalPayout = affiliates.reduce((sum, item) => sum + (item.payoutReadyRowCount || 0), 0);
  const totalRecon = affiliates.reduce((sum, item) => sum + (item.reconciliationRowCount || 0), 0);

  const footerNoteBlock = settings.footerNote
    ? `<div class="doc-note">${escapeHtml(settings.footerNote)}</div>`
    : '';

  const statusBadgeColor = report.status === 'paid' ? '#166534' : report.status === 'draft' ? '#92400e' : '#374151';
  const statusBadgeBg = report.status === 'paid' ? '#dcfce7' : report.status === 'draft' ? '#fef3c7' : '#f3f4f6';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Nuria Affiliate Report ${escapeHtml(report.periodMonth || '')}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet" />
  <style>
    :root {
      --ink: #0c1f14;
      --muted: #4a6355;
      --subtle: #6b7c72;
      --line: #d4e5da;
      --surface: #f0f9f3;
      --surface-warm: #fefdf8;
      --header: #0a3d23;
      --accent: #b8923d;
      --accent-light: rgba(184, 146, 61, 0.12);
      --stripe: #f7faf8;
      --success: #166534;
      --success-bg: #dcfce7;
      --warning-bg: #fef3c7;
      --font-sans: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
      --font-display: 'Playfair Display', Georgia, serif;
      --radius: 10px;
    }
    * { box-sizing: border-box; margin: 0; }
    body {
      padding: 0 0 120px;
      font-family: var(--font-sans);
      color: var(--ink);
      background: #fff;
      font-size: 15px;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }
    .doc {
      max-width: 900px;
      margin: 0 auto;
      padding: 40px 40px 0;
    }
    .doc-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
      flex-wrap: wrap;
      padding-bottom: 28px;
      margin-bottom: 28px;
      border-bottom: 3px solid var(--accent);
    }
    .doc-header__logo {
      width: 68px;
      height: 68px;
      border-radius: 14px;
      object-fit: contain;
      box-shadow: 0 4px 16px rgba(12, 40, 24, 0.12);
    }
    .doc-header__titles {
      flex: 1;
      min-width: 200px;
      text-align: right;
    }
    .doc-header__titles h1 {
      font-family: var(--font-display);
      font-size: 1.85rem;
      font-weight: 700;
      letter-spacing: -0.025em;
      line-height: 1.15;
      color: var(--header);
    }
    .doc-header__titles .sub {
      margin-top: 8px;
      font-size: 0.9rem;
      color: var(--muted);
      font-weight: 500;
    }

    .doc-summary {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0;
      margin-bottom: 28px;
      border-radius: var(--radius);
      overflow: hidden;
      border: 1px solid var(--line);
    }
    .doc-summary__item {
      padding: 16px 20px;
      background: var(--surface);
      border-right: 1px solid var(--line);
    }
    .doc-summary__item:last-child { border-right: 0; }
    .doc-summary__label {
      display: block;
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--subtle);
      margin-bottom: 6px;
    }
    .doc-summary__value {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--ink);
    }
    .doc-summary__value--period {
      font-size: 1.15rem;
      font-weight: 700;
    }

    .doc-kpi {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-bottom: 28px;
    }
    .doc-kpi__card {
      padding: 16px 18px;
      border-radius: var(--radius);
      border: 1px solid var(--line);
      background: var(--surface-warm);
      text-align: center;
    }
    .doc-kpi__card--accent {
      border-color: rgba(184, 146, 61, 0.3);
      background: var(--accent-light);
    }
    .doc-kpi__number {
      display: block;
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--header);
      line-height: 1.2;
    }
    .doc-kpi__label {
      display: block;
      margin-top: 4px;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--subtle);
    }

    .status-badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .doc-note {
      margin: 0 0 24px;
      padding: 14px 20px;
      background: #fffbeb;
      border: 1px solid rgba(184, 146, 61, 0.35);
      border-left: 4px solid var(--accent);
      border-radius: var(--radius);
      font-size: 0.9rem;
      line-height: 1.55;
      color: #5c4a1e;
    }

    h2.section-title {
      margin: 32px 0 14px;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      color: var(--header);
    }

    table.data {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8px;
      font-size: 0.875rem;
      border-radius: var(--radius);
      overflow: hidden;
      border: 1px solid var(--line);
    }
    table.data th,
    table.data td {
      border: 1px solid var(--line);
      padding: 11px 14px;
      vertical-align: top;
      text-align: left;
    }
    table.data thead th {
      background: var(--header);
      color: #fff;
      font-weight: 700;
      font-size: 0.68rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      padding: 10px 14px;
    }
    table.data tbody td { line-height: 1.5; }
    table.data tbody tr:nth-child(even) { background: var(--stripe); }
    table.data tfoot td {
      background: var(--surface);
      font-weight: 700;
      border-top: 2px solid var(--line);
    }

    table.data--ledger { font-size: 0.8rem; }
    table.data--ledger thead th {
      font-size: 0.62rem;
      padding: 9px 10px;
    }
    table.data--ledger tbody td { padding: 9px 10px; }

    .payout-status {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 5px;
      font-size: 0.7rem;
      font-weight: 700;
    }
    .payout-status--ready { background: var(--success-bg); color: var(--success); }
    .payout-status--reconciliation { background: var(--warning-bg); color: #92400e; }

    .print-footer {
      position: fixed;
      left: 0; right: 0; bottom: 0;
      padding: 12px 40px 16px;
      border-top: 2px solid var(--accent);
      background: linear-gradient(180deg, rgba(255,255,255,0.95) 0%, #fff 40%);
    }
    .print-footer__inner {
      max-width: 900px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      flex-wrap: wrap;
    }
    .print-footer__oakdev {
      height: 26px;
      width: auto;
      object-fit: contain;
    }
    .print-footer__legal {
      font-size: 0.75rem;
      line-height: 1.6;
      color: var(--subtle);
      max-width: 420px;
    }
    .print-footer__legal strong {
      color: var(--ink);
      font-weight: 700;
    }
    .print-footer__stats {
      font-size: 0.7rem;
      color: var(--subtle);
      text-align: right;
    }

    @page { size: A4; margin: 14mm 14mm 20mm 14mm; }
    @media print {
      body { padding-bottom: 100px; }
      .doc { padding: 0; }
      table.data thead th,
      table.data tbody tr:nth-child(even),
      table.data tfoot td,
      .status-badge, .payout-status,
      .doc-summary__item, .doc-kpi__card {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <div class="doc">
    <header class="doc-header">
      <img class="doc-header__logo" src="${origin}/assets/nuria-admin.png" alt="Nuria" />
      <div class="doc-header__titles">
        <h1>${escapeHtml(settings.title)}</h1>
        <div class="sub">${escapeHtml(settings.subtitle)}</div>
      </div>
    </header>

    <div class="doc-summary">
      <div class="doc-summary__item">
        <span class="doc-summary__label">Report ID</span>
        <span class="doc-summary__value">${escapeHtml(report.reportId || '—')}</span>
      </div>
      <div class="doc-summary__item">
        <span class="doc-summary__label">Period</span>
        <span class="doc-summary__value doc-summary__value--period">${escapeHtml(report.periodMonth || '—')}</span>
      </div>
      <div class="doc-summary__item">
        <span class="doc-summary__label">Status</span>
        <span class="status-badge" style="background:${statusBadgeBg};color:${statusBadgeColor};">${escapeHtml(report.status || '—')}</span>
      </div>
      <div class="doc-summary__item">
        <span class="doc-summary__label">Generated</span>
        <span class="doc-summary__value" style="font-size:0.82rem;color:var(--subtle);">${escapeHtml(generatedAt)}</span>
      </div>
    </div>

    <div class="doc-kpi">
      <div class="doc-kpi__card doc-kpi__card--accent">
        <span class="doc-kpi__number">${escapeHtml(String(totalCommission))}</span>
        <span class="doc-kpi__label">Total commission (minor)</span>
      </div>
      <div class="doc-kpi__card">
        <span class="doc-kpi__number">${escapeHtml(String(totalPayout))}</span>
        <span class="doc-kpi__label">Payout-ready rows</span>
      </div>
      <div class="doc-kpi__card">
        <span class="doc-kpi__number">${escapeHtml(String(affiliates.length))}</span>
        <span class="doc-kpi__label">Affiliates</span>
      </div>
    </div>

    ${footerNoteBlock}

    <h2 class="section-title">Affiliate summaries</h2>
    <table class="data data--affiliate">
      <thead>
        <tr>
          <th>Affiliate</th>
          <th>Codes</th>
          <th style="text-align:right;">Commission (minor)</th>
          <th style="text-align:center;">Payout-ready</th>
          <th style="text-align:center;">Reconciliation</th>
        </tr>
      </thead>
      <tbody>
        ${renderPdfTableRows(affiliates, (item) => `
          <td style="font-weight:600;">${escapeHtml(item.affiliateDisplayName || item.affiliateId || '-')}</td>
          <td>${escapeHtml(formatList(item.referralCodes))}</td>
          <td style="text-align:right;font-weight:600;">${escapeHtml(String(item.knownCommissionTotalMinor ?? 0))}</td>
          <td style="text-align:center;">${escapeHtml(String(item.payoutReadyRowCount ?? 0))}</td>
          <td style="text-align:center;">${escapeHtml(String(item.reconciliationRowCount ?? 0))}</td>
        `)}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="2">Totals</td>
          <td style="text-align:right;">${escapeHtml(String(totalCommission))}</td>
          <td style="text-align:center;">${escapeHtml(String(totalPayout))}</td>
          <td style="text-align:center;">${escapeHtml(String(totalRecon))}</td>
        </tr>
      </tfoot>
    </table>

    ${settings.includeRows ? '<h2 class="section-title">Ledger rows</h2>' : ''}
    ${settings.includeRows
      ? `
    <table class="data data--ledger">
      <thead>
        <tr>
          <th>Ledger ID</th>
          <th>Event</th>
          <th>Status</th>
          <th style="text-align:right;">Amount</th>
          <th>CCY</th>
          <th>Affiliate</th>
          <th>Code</th>
          <th>Earned</th>
        </tr>
      </thead>
      <tbody>
        ${renderPdfTableRows(rows, (item) => {
          const statusClass = item.payoutStatus === 'ready' ? 'ready' : item.payoutStatus === 'reconciliation' ? 'reconciliation' : '';
          return `
          <td style="color:var(--subtle);">${escapeHtml(item.ledgerId || '-')}</td>
          <td>${escapeHtml(item.eventType || '-')}</td>
          <td><span class="payout-status${statusClass ? ` payout-status--${statusClass}` : ''}">${escapeHtml(item.payoutStatus || '-')}</span></td>
          <td style="text-align:right;font-weight:600;">${escapeHtml(String(item.commissionAmountMinor ?? 0))}</td>
          <td>${escapeHtml(item.currency || '-')}</td>
          <td>${escapeHtml(item.affiliateDisplayName || item.affiliateId || '-')}</td>
          <td style="font-weight:600;color:var(--header);">${escapeHtml(item.referralCode || '-')}</td>
          <td style="color:var(--subtle);">${escapeHtml(toIsoDate(item.earnedAt) || '-')}</td>
        `;
        })}
      </tbody>
    </table>`
      : ''}
  </div>

  <footer class="print-footer">
    <div class="print-footer__inner">
      <img class="print-footer__oakdev" src="${origin}/assets/oakdev-logo.png" alt="${escapeHtml(pub.legalName)}" />
      <div class="print-footer__legal">
        <strong>${escapeHtml(pub.legalName)}</strong> · Org.nr. ${escapeHtml(pub.orgNumber)} · VAT ${escapeHtml(pub.vatId)}<br />
        ${escapeHtml(pub.addressLine1)}, ${escapeHtml(pub.postalCity)} · ${escapeHtml(pub.email)}
      </div>
      <div class="print-footer__stats">
        ${escapeHtml(String(affiliates.length))} affiliates · ${escapeHtml(String(rows.length))} rows<br />
        Source: ${escapeHtml(report.source || '—')}
      </div>
    </div>
  </footer>
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
      createdAt: { iso: '2026-03-01T08:00:00.000Z' },
      updatedAt: { iso: '2026-03-31T16:45:00.000Z' },
      paymentReference: null,
      note: null,
    },
    affiliates: [
      {
        affiliateId: 'masjid_stockholm',
        affiliateDisplayName: 'Masjid Stockholm',
        referralCodes: ['MASJIDSTHLM', 'SARAH'],
        knownCommissionTotalMinor: 34700,
        currencies: ['SEK'],
        payoutReadyRowCount: 24,
        reconciliationRowCount: 3,
      },
      {
        affiliateId: 'example_partner',
        affiliateDisplayName: 'Nordic Dawah Foundation',
        referralCodes: ['NORDICDAWAH'],
        knownCommissionTotalMinor: 18600,
        currencies: ['SEK'],
        payoutReadyRowCount: 14,
        reconciliationRowCount: 1,
      },
      {
        affiliateId: 'quran_academy',
        affiliateDisplayName: 'Quran Academy Online',
        referralCodes: ['QURANACAD'],
        knownCommissionTotalMinor: 9800,
        currencies: ['SEK'],
        payoutReadyRowCount: 7,
        reconciliationRowCount: 0,
      },
    ],
    rows: [
      {
        ledgerId: 'ledger_2001',
        eventType: 'subscription_purchase',
        payoutStatus: 'ready',
        commissionAmountMinor: 4900,
        currency: 'SEK',
        affiliateId: 'masjid_stockholm',
        affiliateDisplayName: 'Masjid Stockholm',
        referralCode: 'MASJIDSTHLM',
        earnedAt: { iso: '2026-03-03T09:12:00.000Z' },
      },
      {
        ledgerId: 'ledger_2002',
        eventType: 'subscription_purchase',
        payoutStatus: 'ready',
        commissionAmountMinor: 4900,
        currency: 'SEK',
        affiliateId: 'masjid_stockholm',
        affiliateDisplayName: 'Masjid Stockholm',
        referralCode: 'SARAH',
        earnedAt: { iso: '2026-03-05T14:30:00.000Z' },
      },
      {
        ledgerId: 'ledger_2003',
        eventType: 'subscription_renewal',
        payoutStatus: 'ready',
        commissionAmountMinor: 4900,
        currency: 'SEK',
        affiliateId: 'masjid_stockholm',
        affiliateDisplayName: 'Masjid Stockholm',
        referralCode: 'SARAH',
        earnedAt: { iso: '2026-03-12T11:45:00.000Z' },
      },
      {
        ledgerId: 'ledger_2004',
        eventType: 'subscription_purchase',
        payoutStatus: 'ready',
        commissionAmountMinor: 3900,
        currency: 'SEK',
        affiliateId: 'example_partner',
        affiliateDisplayName: 'Nordic Dawah Foundation',
        referralCode: 'NORDICDAWAH',
        earnedAt: { iso: '2026-03-08T16:20:00.000Z' },
      },
      {
        ledgerId: 'ledger_2005',
        eventType: 'subscription_purchase',
        payoutStatus: 'ready',
        commissionAmountMinor: 4900,
        currency: 'SEK',
        affiliateId: 'quran_academy',
        affiliateDisplayName: 'Quran Academy Online',
        referralCode: 'QURANACAD',
        earnedAt: { iso: '2026-03-15T08:55:00.000Z' },
      },
      {
        ledgerId: 'ledger_2006',
        eventType: 'subscription_renewal',
        payoutStatus: 'reconciliation',
        commissionAmountMinor: 4900,
        currency: 'SEK',
        affiliateId: 'masjid_stockholm',
        affiliateDisplayName: 'Masjid Stockholm',
        referralCode: 'MASJIDSTHLM',
        earnedAt: { iso: '2026-03-22T10:10:00.000Z' },
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

function withActionTimeout(promise, timeoutMs, meta) {
  const safeTimeoutMs = Number(timeoutMs) > 0 ? Number(timeoutMs) : 15000;
  const details = meta && typeof meta === 'object' ? meta : {};
  let timerId = null;

  const timeoutPromise = new Promise((_, reject) => {
    timerId = window.setTimeout(() => {
      const error = new Error(details.message || 'request_timed_out');
      error.code = details.code || 'deadline-exceeded';
      if (details.adminCallable) {
        error.adminCallable = details.adminCallable;
      }
      reject(error);
    }, safeTimeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timerId != null) {
      window.clearTimeout(timerId);
    }
  });
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

function syncDashboardCopyToggleState() {
  if (!elements.dashboardCopyAutoTranslate || !elements.dashboardCopyForceTranslate) {
    return;
  }

  const autoTranslate = elements.dashboardCopyAutoTranslate.checked;
  elements.dashboardCopyForceTranslate.disabled = !autoTranslate;
  if (!autoTranslate) {
    elements.dashboardCopyForceTranslate.checked = false;
    if (state.dashboardCopyDraft) {
      state.dashboardCopyDraft.forceTranslate = false;
    }
  }
}

function setDashboardCopyFormError(message) {
  if (!elements.dashboardCopyFormError) {
    return;
  }

  elements.dashboardCopyFormError.hidden = !message;
  elements.dashboardCopyFormError.textContent = message || '';
}

function renderDashboardCopyTranslations() {
  if (!elements.dashboardCopyTranslationsList || !state.dashboardCopyDraft) {
    return;
  }

  const supportedLocales = Array.isArray(state.dashboardCopyItem?.supportedLocales)
    ? state.dashboardCopyItem.supportedLocales.slice()
    : [];
  const query = normalizeSearchValue(state.dashboardCopyLocaleSearch);

  if (elements.dashboardCopyLocaleSearch && elements.dashboardCopyLocaleSearch.value !== state.dashboardCopyLocaleSearch) {
    elements.dashboardCopyLocaleSearch.value = state.dashboardCopyLocaleSearch;
  }

  if (elements.dashboardCopyLocaleCount) {
    const suffix = supportedLocales.length === 1 ? '' : 's';
    elements.dashboardCopyLocaleCount.textContent = `${supportedLocales.length} supported locale${suffix}`;
  }

  if (elements.dashboardCopyTranslationCount) {
    const storedCount = getDashboardCopyStoredLocaleCount(state.dashboardCopyDraft.translations);
    const suffix = storedCount === 1 ? '' : 's';
    elements.dashboardCopyTranslationCount.textContent = `${storedCount} locale${suffix} filled`;
  }

  if (!supportedLocales.length) {
    elements.dashboardCopyTranslationsList.innerHTML =
      '<p class="admin-empty admin-empty--inline">No supported locales were returned by the backend.</p>';
    return;
  }

  const localeEntries = supportedLocales
    .map((locale) => ({
      locale,
      label: getDashboardCopyLocaleLabel(locale),
    }))
    .sort((left, right) => left.label.localeCompare(right.label));

  const filteredLocales = localeEntries.filter(({ locale, label }) => {
    if (!query) return true;
    return normalizeSearchValue(locale).includes(query) || normalizeSearchValue(label).includes(query);
  });

  if (!filteredLocales.length) {
    elements.dashboardCopyTranslationsList.innerHTML =
      '<p class="admin-empty admin-empty--inline">No locales matched that search.</p>';
    return;
  }

  elements.dashboardCopyTranslationsList.innerHTML = filteredLocales
    .map(({ locale, label }, index) => {
      const bundle = state.dashboardCopyDraft.translations?.[locale] || {};
      const open = query || locale === state.dashboardCopyPreviewLocale || index === 0;
      const meta = getDashboardCopyLocaleSummary(bundle);
      return `
        <details class="admin-collapsible admin-dashboard-copy__locale-item"${open ? ' open' : ''}>
          <summary class="admin-collapsible__summary">
            <span class="admin-dashboard-copy__locale-heading">
              <strong class="admin-dashboard-copy__locale-code">${escapeHtml(locale)}</strong>
              <span class="admin-dashboard-copy__locale-name">${escapeHtml(label)}</span>
            </span>
            <span class="admin-collapsible__meta">${escapeHtml(meta)}</span>
          </summary>
          <div class="admin-collapsible__content">
            <div class="form-group">
              <label class="form-label" for="adminDashboardCopyLocaleTitle-${escapeHtml(locale)}">Title override</label>
              <input
                class="form-input"
                id="adminDashboardCopyLocaleTitle-${escapeHtml(locale)}"
                type="text"
                value="${escapeHtml(bundle.title || '')}"
                data-dashboard-copy-locale="${escapeHtml(locale)}"
                data-dashboard-copy-field="title"
                placeholder="Leave blank to keep the current stored title"
              />
            </div>
            <div class="form-group">
              <label class="form-label" for="adminDashboardCopyLocaleBody-${escapeHtml(locale)}">Body override</label>
              <textarea
                class="form-input form-textarea"
                id="adminDashboardCopyLocaleBody-${escapeHtml(locale)}"
                rows="4"
                data-dashboard-copy-locale="${escapeHtml(locale)}"
                data-dashboard-copy-field="body"
                placeholder="Leave blank to keep the current stored body"
              >${escapeHtml(bundle.body || '')}</textarea>
            </div>
            <p class="admin-panel__helper admin-dashboard-copy__locale-helper">
              Filled fields overwrite the stored locale on save. Blank fields keep the current stored translation until you regenerate from English.
            </p>
          </div>
        </details>
      `;
    })
    .join('');
}

function renderDashboardCopyPreview() {
  if (!state.dashboardCopyDraft) {
    return;
  }

  const previewLocales = ['en'].concat(Array.isArray(state.dashboardCopyItem?.supportedLocales) ? state.dashboardCopyItem.supportedLocales : []);
  const uniquePreviewLocales = Array.from(new Set(previewLocales));
  if (!uniquePreviewLocales.includes(state.dashboardCopyPreviewLocale)) {
    state.dashboardCopyPreviewLocale = getPreferredDashboardCopyPreviewLocale(state.dashboardCopyItem?.supportedLocales);
  }
  if (!state.dashboardCopyPreviewLocale) {
    state.dashboardCopyPreviewLocale = 'en';
  }

  if (elements.dashboardCopyPreviewLocale) {
    elements.dashboardCopyPreviewLocale.innerHTML = uniquePreviewLocales
      .map((locale) => {
        const selected = locale === state.dashboardCopyPreviewLocale ? ' selected' : '';
        const label = locale === 'en' ? 'English' : getDashboardCopyLocaleLabel(locale);
        return `<option value="${escapeHtml(locale)}"${selected}>${escapeHtml(label)} (${escapeHtml(locale)})</option>`;
      })
      .join('');
  }

  const preview = getDashboardCopyPreviewSnapshot(state.dashboardCopyDraft, state.dashboardCopyPreviewLocale);
  const sourceCopy = preview.titleSource === preview.bodySource
    ? `Currently resolving from ${preview.titleSource}.`
    : `Title resolves from ${preview.titleSource}; body resolves from ${preview.bodySource}.`;

  if (elements.dashboardCopyPreviewLocaleHint) {
    elements.dashboardCopyPreviewLocaleHint.textContent =
      `Resolution chain: ${preview.chain.join(' -> ')}. ${sourceCopy}`;
  }

  if (elements.dashboardCopyPreviewCard) {
    elements.dashboardCopyPreviewCard.classList.toggle('is-disabled', !preview.enabled);
  }

  if (elements.dashboardCopyPreviewTitle) {
    elements.dashboardCopyPreviewTitle.hidden = !preview.title;
    elements.dashboardCopyPreviewTitle.textContent = preview.title || '';
  }

  if (elements.dashboardCopyPreviewBody) {
    elements.dashboardCopyPreviewBody.hidden = !preview.body;
    elements.dashboardCopyPreviewBody.textContent = preview.body || '';
  }

  if (elements.dashboardCopyPreviewEmpty) {
    elements.dashboardCopyPreviewEmpty.hidden = preview.hasVisibleCopy;
    elements.dashboardCopyPreviewEmpty.textContent = preview.enabled
      ? 'This placeholder does not have visible text for the selected locale.'
      : 'This placeholder is currently disabled in the app.';
  }
}

function renderDashboardCopyMetadata() {
  if (!elements.dashboardCopyMetadata || !state.dashboardCopyItem || !state.dashboardCopyDraft) {
    return;
  }

  const item = state.dashboardCopyItem;
  const draft = state.dashboardCopyDraft;
  const storedCount = getDashboardCopyStoredLocaleCount(draft.translations);
  const metadata = [
    {
      title: 'Document',
      meta: item.copyId || 'dashboard_top_placeholder',
    },
    {
      title: 'Status',
      meta: draft.enabled ? 'Enabled in app' : 'Hidden in app',
    },
    {
      title: 'Updated',
      meta: item.updatedAt?.iso
        ? `${formatTimestamp(item.updatedAt)}${item.updatedByEmail ? ` by ${item.updatedByEmail}` : ''}`
        : 'Never saved yet',
    },
    {
      title: 'Created',
      meta: item.createdAt?.iso ? formatTimestamp(item.createdAt) : 'Not created yet',
    },
    {
      title: 'Locale coverage',
      meta: `${storedCount} stored / ${Array.isArray(item.supportedLocales) ? item.supportedLocales.length : 0} supported`,
    },
    {
      title: 'Save mode',
      meta: draft.autoTranslate
        ? `Auto-translate on${draft.forceTranslate ? ' · force refresh on next save' : ''}`
        : 'Auto-translate off',
    },
  ];

  elements.dashboardCopyMetadata.innerHTML = metadata
    .map((entry) => {
      return `
        <div class="admin-mini-item">
          <span class="admin-mini-item__title">${escapeHtml(entry.title)}</span>
          <span class="admin-mini-item__meta">${escapeHtml(entry.meta)}</span>
        </div>
      `;
    })
    .join('');
}

function renderDashboardCopyFieldMeta() {
  if (!state.dashboardCopyDraft) {
    return;
  }

  const titleLength = String(state.dashboardCopyDraft.titleEn || '').trim().length;
  const bodyLength = String(state.dashboardCopyDraft.bodyEn || '').trim().length;

  if (elements.dashboardCopyTitleMeta) {
    const tone = titleLength > 120 ? ' Keep it tighter if possible for smaller screens.' : ' Short, calm headlines work best here.';
    elements.dashboardCopyTitleMeta.textContent = `${titleLength} / 180 characters.${tone}`;
  }

  if (elements.dashboardCopyBodyMeta) {
    let message = `${bodyLength} characters. Keep it concise so it still reads well on smaller phones.`;
    if (bodyLength > 220) {
      message = `${bodyLength} characters. This is getting long for a compact dashboard card.`;
    } else if (bodyLength > 0 && bodyLength < 50) {
      message = `${bodyLength} characters. You still have room if the message needs a little more context.`;
    }
    elements.dashboardCopyBodyMeta.textContent = message;
  }
}

function renderDashboardCopyChecklist() {
  const readiness = getDashboardCopyReadinessModel();

  if (elements.dashboardCopyReadinessBadge) {
    elements.dashboardCopyReadinessBadge.textContent = readiness.badgeLabel;
    elements.dashboardCopyReadinessBadge.className = 'admin-tag';
    elements.dashboardCopyReadinessBadge.classList.add(`admin-tag--${readiness.badgeTone}`);
  }

  if (elements.dashboardCopyReadinessSummary) {
    elements.dashboardCopyReadinessSummary.textContent = readiness.summary;
  }

  if (elements.dashboardCopyChecklist) {
    elements.dashboardCopyChecklist.innerHTML = readiness.checklist
      .map((item) => {
        return `
          <div class="admin-dashboard-copy-checklist__item${item.complete ? ' is-complete' : ''}">
            <span class="admin-dashboard-copy-checklist__mark" aria-hidden="true">${item.complete ? 'OK' : 'TODO'}</span>
            <div class="admin-dashboard-copy-checklist__copy">
              <strong>${escapeHtml(item.title)}</strong>
              <span>${escapeHtml(item.detail)}</span>
            </div>
          </div>
        `;
      })
      .join('');
  }

  if (elements.dashboardCopyGuidance) {
    elements.dashboardCopyGuidance.innerHTML = readiness.guidance
      .map((item) => {
        return `
          <div class="admin-mini-item">
            <span class="admin-mini-item__title">${escapeHtml(item.title)}</span>
            <span class="admin-mini-item__meta">${escapeHtml(item.detail)}</span>
          </div>
        `;
      })
      .join('');
  }
}

function renderDashboardCopyPublishedSnapshot() {
  if (!elements.dashboardCopyPublishedCompare || !elements.dashboardCopyChangeList) {
    return;
  }

  const draft = state.dashboardCopyDraft || createDashboardCopyDraft({});
  const item = state.dashboardCopyItem || normalizeDashboardCopyItem({});
  const unsaved = hasDashboardCopyUnsavedChanges();
  const liveSaved = Boolean(item.updatedAt?.iso || item.createdAt?.iso || item.titleEn || item.bodyEn || getDashboardCopyStoredLocaleCount(item.translations));
  const liveUpdatedLabel = item.updatedAt?.iso
    ? `${formatTimestamp(item.updatedAt)}${item.updatedByEmail ? ` by ${item.updatedByEmail}` : ''}`
    : 'Nothing published yet';
  const draftStatus = draft.enabled !== false ? 'Will be visible when saved' : 'Will stay hidden when saved';
  const liveStatus = item.enabled !== false ? 'Visible in app' : 'Hidden in app';

  if (elements.dashboardCopyPublishedSummary) {
    elements.dashboardCopyPublishedSummary.textContent = unsaved
      ? 'You have local draft changes. Compare them with the saved backend version before publishing.'
      : 'The draft currently matches the last saved backend version.';
  }

  elements.dashboardCopyPublishedCompare.innerHTML = `
    <div class="admin-dashboard-copy-compare__card">
      <div class="admin-dashboard-copy-compare__head">
        <strong>Live in app</strong>
        <span class="admin-tag admin-tag--${item.enabled !== false ? 'success' : 'info'}">${escapeHtml(item.enabled !== false ? 'Live' : 'Hidden')}</span>
      </div>
      <p class="admin-dashboard-copy-compare__meta">${escapeHtml(liveSaved ? liveUpdatedLabel : 'No saved version exists yet.')}</p>
      <div class="admin-dashboard-copy-compare__row">
        <span>Status</span>
        <strong>${escapeHtml(liveStatus)}</strong>
      </div>
      <div class="admin-dashboard-copy-compare__row">
        <span>English title</span>
        <strong>${escapeHtml(truncateDashboardCopyValue(item.titleEn, 68))}</strong>
      </div>
      <div class="admin-dashboard-copy-compare__row">
        <span>English body</span>
        <strong>${escapeHtml(truncateDashboardCopyValue(item.bodyEn, 88))}</strong>
      </div>
      <div class="admin-dashboard-copy-compare__row">
        <span>Stored locales</span>
        <strong>${escapeHtml(String(getDashboardCopyStoredLocaleCount(item.translations)))}</strong>
      </div>
    </div>
    <div class="admin-dashboard-copy-compare__card${unsaved ? ' is-draft' : ''}">
      <div class="admin-dashboard-copy-compare__head">
        <strong>Current draft</strong>
        <span class="admin-tag admin-tag--${unsaved ? 'warn' : 'success'}">${escapeHtml(unsaved ? 'Unsaved' : 'Saved')}</span>
      </div>
      <p class="admin-dashboard-copy-compare__meta">${escapeHtml(unsaved ? 'Local browser draft waiting to be saved.' : 'Matches the latest backend version.')}</p>
      <div class="admin-dashboard-copy-compare__row">
        <span>Status</span>
        <strong>${escapeHtml(draftStatus)}</strong>
      </div>
      <div class="admin-dashboard-copy-compare__row">
        <span>English title</span>
        <strong>${escapeHtml(truncateDashboardCopyValue(draft.titleEn, 68))}</strong>
      </div>
      <div class="admin-dashboard-copy-compare__row">
        <span>English body</span>
        <strong>${escapeHtml(truncateDashboardCopyValue(draft.bodyEn, 88))}</strong>
      </div>
      <div class="admin-dashboard-copy-compare__row">
        <span>Stored locales</span>
        <strong>${escapeHtml(String(getDashboardCopyStoredLocaleCount(draft.translations)))}</strong>
      </div>
    </div>
  `;

  const changes = getDashboardCopyChangeSummary();
  if (!changes.length) {
    elements.dashboardCopyChangeList.innerHTML = `
      <div class="admin-mini-item">
        <span class="admin-mini-item__title">No pending changes</span>
        <span class="admin-mini-item__meta">Saving now would keep the published snapshot exactly as it is.</span>
      </div>
    `;
    return;
  }

  elements.dashboardCopyChangeList.innerHTML = changes
    .map((change, index) => {
      return `
        <div class="admin-mini-item">
          <span class="admin-mini-item__title">Change ${index + 1}</span>
          <span class="admin-mini-item__meta">${escapeHtml(change)}</span>
        </div>
      `;
    })
    .join('');
}

function renderDashboardCopy() {
  const hasDraft = Boolean(state.dashboardCopyDraft);

  setButtonBusy(elements.refreshDashboardCopy, state.dashboardCopyLoading, 'Refreshing');
  setButtonBusy(elements.saveDashboardCopyButton, state.dashboardCopySaveInFlight, 'Saving');

  if (elements.dashboardCopyLoadingState) {
    elements.dashboardCopyLoadingState.hidden = !(state.dashboardCopyLoading && !hasDraft);
  }

  if (elements.dashboardCopyErrorState) {
    elements.dashboardCopyErrorState.hidden = !(state.dashboardCopyError && !hasDraft);
  }

  if (elements.dashboardCopyErrorCopy) {
    elements.dashboardCopyErrorCopy.textContent = state.dashboardCopyError || 'Dashboard copy could not be loaded.';
  }

  if (elements.dashboardCopyReady) {
    elements.dashboardCopyReady.hidden = !hasDraft;
  }

  if (!hasDraft) {
    return;
  }

  if (elements.dashboardCopyEnabled) {
    elements.dashboardCopyEnabled.checked = state.dashboardCopyDraft.enabled !== false;
  }
  if (elements.dashboardCopyTitleEn) {
    elements.dashboardCopyTitleEn.value = state.dashboardCopyDraft.titleEn || '';
  }
  if (elements.dashboardCopyBodyEn) {
    elements.dashboardCopyBodyEn.value = state.dashboardCopyDraft.bodyEn || '';
  }
  if (elements.dashboardCopyAutoTranslate) {
    elements.dashboardCopyAutoTranslate.checked = state.dashboardCopyDraft.autoTranslate !== false;
  }
  if (elements.dashboardCopyForceTranslate) {
    elements.dashboardCopyForceTranslate.checked = state.dashboardCopyDraft.forceTranslate === true;
  }

  syncDashboardCopyToggleState();
  renderDashboardCopyFieldMeta();
  renderDashboardCopyChecklist();
  renderDashboardCopyPublishedSnapshot();
  renderDashboardCopyTranslations();
  renderDashboardCopyPreview();
  renderDashboardCopyMetadata();
}

async function ensureDashboardCopyLoaded(options) {
  const settings = Object.assign({ force: false, silent: false }, options || {});

  if (state.dashboardCopyLoadPromise && !settings.force) {
    return state.dashboardCopyLoadPromise;
  }

  if (state.dashboardCopyLoaded && !settings.force) {
    renderDashboardCopy();
    return state.dashboardCopyItem;
  }

  const task = (async () => {
    state.dashboardCopyLoading = true;
    if (!state.dashboardCopyDraft) {
      state.dashboardCopyError = '';
    }
    setDashboardCopyFormError('');
    renderDashboardCopy();

    try {
      const data = await withActionTimeout(
        callFirebaseFunction('getDashboardTopPlaceholderAdmin'),
        DASHBOARD_COPY_CALL_TIMEOUT_MS,
        {
          adminCallable: 'getDashboardTopPlaceholderAdmin',
          message: 'dashboard_copy_load_timeout',
        }
      );
      const item = normalizeDashboardCopyItem(data?.item);
      state.dashboardCopyAdmin = data?.admin || null;
      state.dashboardCopyItem = item;
      state.dashboardCopyDraft = createDashboardCopyDraft(item);
      state.dashboardCopyLoaded = true;
      state.dashboardCopyError = '';
      if (!state.dashboardCopyPreviewLocale || !['en'].concat(item.supportedLocales).includes(state.dashboardCopyPreviewLocale)) {
        state.dashboardCopyPreviewLocale = getPreferredDashboardCopyPreviewLocale(item.supportedLocales);
      }
      return item;
    } catch (error) {
      const message = getActionableErrorMessage(error, 'Dashboard copy could not be loaded.');
      state.dashboardCopyError = message;
      if (!settings.silent) {
        showBanner(message, 'error');
      }
      throw error;
    } finally {
      state.dashboardCopyLoading = false;
      state.dashboardCopyLoadPromise = null;
      renderDashboardCopy();
    }
  })();

  state.dashboardCopyLoadPromise = task;
  return task;
}

function handleDashboardCopyBaseFieldsInput() {
  if (!state.dashboardCopyDraft) {
    return;
  }

  state.dashboardCopyDraft.enabled = elements.dashboardCopyEnabled?.checked !== false;
  state.dashboardCopyDraft.titleEn = String(elements.dashboardCopyTitleEn?.value || '');
  state.dashboardCopyDraft.bodyEn = String(elements.dashboardCopyBodyEn?.value || '');
  state.dashboardCopyDraft.autoTranslate = elements.dashboardCopyAutoTranslate?.checked !== false;
  state.dashboardCopyDraft.forceTranslate = elements.dashboardCopyForceTranslate?.checked === true;

  syncDashboardCopyToggleState();
  setDashboardCopyFormError('');
  renderDashboardCopyFieldMeta();
  renderDashboardCopyChecklist();
  renderDashboardCopyPublishedSnapshot();
  renderDashboardCopyPreview();
  renderDashboardCopyMetadata();
}

function handleDashboardCopyLocaleSearchInput() {
  state.dashboardCopyLocaleSearch = String(elements.dashboardCopyLocaleSearch?.value || '');
  renderDashboardCopyTranslations();
}

function handleDashboardCopyTranslationInput(event) {
  const field = event.target?.dataset?.dashboardCopyField;
  const locale = event.target?.dataset?.dashboardCopyLocale;
  if (!field || !locale || !state.dashboardCopyDraft) {
    return;
  }

  const nextBundle = Object.assign({}, state.dashboardCopyDraft.translations?.[locale] || {});
  nextBundle[field] = String(event.target.value || '');

  if (!String(nextBundle.title || '').trim() && !String(nextBundle.body || '').trim()) {
    delete state.dashboardCopyDraft.translations[locale];
  } else {
    state.dashboardCopyDraft.translations[locale] = nextBundle;
  }

  setDashboardCopyFormError('');
  renderDashboardCopyChecklist();
  renderDashboardCopyPublishedSnapshot();
  renderDashboardCopyPreview();
  renderDashboardCopyMetadata();

  if (elements.dashboardCopyTranslationCount) {
    const storedCount = getDashboardCopyStoredLocaleCount(state.dashboardCopyDraft.translations);
    const suffix = storedCount === 1 ? '' : 's';
    elements.dashboardCopyTranslationCount.textContent = `${storedCount} locale${suffix} filled`;
  }
}

function handleDashboardCopyPreviewLocaleChange() {
  state.dashboardCopyPreviewLocale = String(elements.dashboardCopyPreviewLocale?.value || 'en');
  state.dashboardCopyPreviewTouched = state.dashboardCopyPreviewLocale !== 'en';
  renderDashboardCopyChecklist();
  renderDashboardCopyTranslations();
  renderDashboardCopyPreview();
  track('dashboard_copy_preview_locale_changed', {
    locale: state.dashboardCopyPreviewLocale,
  });
}

async function handleDashboardCopySave(event) {
  event.preventDefault();
  if (!state.dashboardCopyDraft || state.dashboardCopySaveInFlight) {
    return;
  }

  clearBanner();
  setDashboardCopyFormError('');

  const payload = {
    enabled: state.dashboardCopyDraft.enabled !== false,
    titleEn: String(state.dashboardCopyDraft.titleEn || '').trim(),
    bodyEn: String(state.dashboardCopyDraft.bodyEn || '').trim(),
    autoTranslate: state.dashboardCopyDraft.autoTranslate !== false,
    forceTranslate: state.dashboardCopyDraft.autoTranslate !== false && state.dashboardCopyDraft.forceTranslate === true,
    translations: buildDashboardCopySaveTranslations(state.dashboardCopyItem, state.dashboardCopyDraft),
  };

  if (payload.enabled && !payload.titleEn && !payload.bodyEn) {
    setDashboardCopyFormError('English title or body is required when the placeholder is enabled.');
    return;
  }

  state.dashboardCopySaveInFlight = true;
  renderDashboardCopy();

  try {
    const data = await withActionTimeout(
      callFirebaseFunction('upsertDashboardTopPlaceholderAdmin', payload),
      DASHBOARD_COPY_CALL_TIMEOUT_MS,
      {
        adminCallable: 'upsertDashboardTopPlaceholderAdmin',
        message: 'dashboard_copy_save_timeout',
      }
    );
    const item = normalizeDashboardCopyItem(data?.item);
    state.dashboardCopyItem = item;
    state.dashboardCopyDraft = createDashboardCopyDraft(item);
    state.dashboardCopyLoaded = true;
    state.dashboardCopyError = '';
    setDashboardCopyFormError('');
    renderDashboardCopy();
    showBanner('Dashboard copy saved.', 'success');
    addActivityLog('Updated dashboard top placeholder copy.', 'success');
    track('dashboard_copy_saved', {
      enabled: item.enabled,
      translated_locales: getDashboardCopyStoredLocaleCount(item.translations),
    });
  } catch (error) {
    const message = getActionableErrorMessage(error, 'Dashboard copy could not be saved.');
    setDashboardCopyFormError(message);
    showBanner(message, 'error');
  } finally {
    state.dashboardCopySaveInFlight = false;
    renderDashboardCopy();
  }
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
    renderPartnerPortalAccessRow(null);
    syncPartnerTypeFields();
    return;
  }

  const linkedPartner = findLinkedPartnerForCode(value) || null;
  elements.codeValue.value = value.code || '';
  elements.affiliateId.value = value.affiliateId || '';
  elements.displayName.value = value.displayName || linkedPartner?.displayName || '';
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
  renderPartnerPortalAccessRow(value);
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
  const partners = normalizePartnerListValue(state.partners);
  const reports = Array.isArray(state.reports) ? state.reports : [];
  const activeCodes = codes.filter((item) => item.status === 'active').length;
  const trackedAffiliates = partners.length
    ? new Set(
      partners
        .map((item) => String(item.affiliateId || '').trim())
        .filter(Boolean)
    ).size
    : new Set(
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
    copy = 'Next: generate the month-end package (CSV + Excel + ops snapshot + receipt PDF).';
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
      export_csv: 'Export CSV & Excel',
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
  const includeInactive = Boolean(elements.includeInactiveCodes?.checked);
  const allItems = state.codes || [];
  const items = allItems.filter((item) => {
    const status = normalizeSearchValue(item.status);
    if (!includeInactive && (status === 'inactive' || status === 'archived')) {
      return false;
    }
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

async function loadSubscriberStats() {
  try {
    const stats = await getSubscriberStatsByCode();
    state.subscriberStats = Array.isArray(stats)
      ? stats.map((item) => normalizeSubscriberInsightRow(item)).filter(Boolean)
      : [];
    state.subscriberLastRefreshAt = new Date().toISOString();
    state.subscriberUnavailableReason = '';
  } catch (error) {
    state.subscriberStats = [];
    state.subscriberUnavailableReason = getActionableErrorMessage(
      error,
      'Could not load subscriber stats.'
    );
  }
}

function renderSubscriberInsights() {
  const search = normalizeSearchValue(state.filters.subscriberQuery);
  const metric = state.filters.subscriberMetric;
  const sortKey = state.filters.subscriberSort || 'active-desc';
  const allItems = state.subscriberStats || [];

  let items = allItems.filter((item) => {
    if (metric === 'active-only' && (item.activeNow || 0) === 0) return false;
    if (metric === 'churned-only' && (item.churned || 0) === 0) return false;
    if (metric === 'trial-only' && (item.trialActive || 0) === 0) return false;
    if (!search) return true;
    return normalizeSearchValue(item.code).includes(search);
  });

  const sortParts = sortKey.split('-');
  const field = sortParts[0];
  const dir = sortParts[1] === 'asc' ? 1 : -1;
  const fieldMap = {
    active: 'activeNow',
    total: 'totalCurrent',
    historical: 'totalHistorical',
    churned: 'churned',
    code: 'code',
  };
  const sortField = fieldMap[field] || 'activeNow';
  items = items.slice().sort((a, b) => {
    const aVal = sortField === 'code' ? String(a.code || '') : Number(a[sortField] ?? 0);
    const bVal = sortField === 'code' ? String(b.code || '') : Number(b[sortField] ?? 0);
    if (aVal < bVal) return -1 * dir;
    if (aVal > bVal) return 1 * dir;
    return 0;
  });

  const totals = allItems.reduce(
    (acc, item) => {
      acc.active += item.activeNow || 0;
      acc.historical += item.totalHistorical || 0;
      acc.churned += item.churned || 0;
      return acc;
    },
    { active: 0, historical: 0, churned: 0 }
  );

  if (elements.subscriberTotalCodes) {
    elements.subscriberTotalCodes.textContent = String(allItems.length);
  }
  if (elements.subscriberTotalActive) {
    elements.subscriberTotalActive.textContent = String(totals.active);
  }
  if (elements.subscriberTotalHistorical) {
    elements.subscriberTotalHistorical.textContent = String(totals.historical);
  }
  if (elements.subscriberTotalChurned) {
    elements.subscriberTotalChurned.textContent = String(totals.churned);
  }
  if (elements.subscriberLastRefresh) {
    elements.subscriberLastRefresh.textContent = state.subscriberLastRefreshAt
      ? formatTimestamp({ iso: state.subscriberLastRefreshAt })
      : 'Never';
  }

  if (elements.subscriberTableBody) {
    elements.subscriberTableBody.innerHTML = items
      .map((item) => {
        const activeBar = Math.min(100, Math.round(((item.activeNow || 0) / Math.max(item.totalHistorical || 1, 1)) * 100));
        return `
        <tr>
          <td>
            <span class="admin-subscriber-code">${escapeHtml(item.code)}</span>
          </td>
          <td class="admin-subscriber-metric admin-subscriber-metric--active">
            <span class="admin-subscriber-metric__value">${escapeHtml(String(item.activeNow ?? 0))}</span>
            <span class="admin-subscriber-bar" style="--bar-pct:${activeBar}%"></span>
          </td>
          <td>${escapeHtml(String(item.totalCurrent ?? 0))}</td>
          <td>${escapeHtml(String(item.totalHistorical ?? 0))}</td>
          <td>${escapeHtml(String(item.churned ?? 0))}</td>
          <td>${escapeHtml(String(item.trialActive ?? 0))}</td>
          <td class="admin-subscriber-updated">${escapeHtml(item.lastUpdatedIso ? formatTimestamp({ iso: item.lastUpdatedIso }) : '—')}</td>
        </tr>`;
      })
      .join('');
  }

  if (elements.subscriberEmpty) {
    if (!items.length && allItems.length) {
      elements.subscriberEmpty.textContent = 'No codes match your current filters.';
    } else if (!allItems.length) {
      elements.subscriberEmpty.textContent = 'No subscriber data available yet. Stats populate once referral codes have active subscribers.';
    }
    elements.subscriberEmpty.hidden = items.length > 0;
  }
}

function renderSubscriberFunnelInsights() {
  const search = normalizeSearchValue(state.filters.subscriberQuery);
  const metric = state.filters.subscriberMetric;
  const sortKey = state.filters.subscriberSort || 'active-desc';
  const allItems = (state.subscriberStats || [])
    .map((item) => normalizeSubscriberInsightRow(item))
    .filter(Boolean);

  let items = allItems.filter((item) => {
    if (metric === 'active-only' && item.activeSubscribers === 0) return false;
    if (metric === 'pending-only' && item.pendingReferrals === 0) return false;
    if (metric === 'converted-only' && item.allTimeInitialPurchases === 0) return false;
    if (metric === 'risk-only' && item.atRiskSubscribers === 0) return false;
    if (!search) return true;

    const haystack = [
      item.code,
      item.displayName,
      item.affiliateId,
    ].map((value) => normalizeSearchValue(value)).join(' ');
    return haystack.includes(search);
  });

  const sortParts = sortKey.split('-');
  const field = sortParts[0];
  const dir = sortParts[1] === 'asc' ? 1 : -1;
  const fieldMap = {
    active: 'activeSubscribers',
    entered: 'codeEnteredUsers',
    purchases: 'allTimeInitialPurchases',
    pending: 'pendingReferrals',
    code: 'code',
  };
  const sortField = fieldMap[field] || 'activeSubscribers';
  items = items.slice().sort((a, b) => {
    const aVal = sortField === 'code' ? String(a.code || '') : Number(a[sortField] ?? 0);
    const bVal = sortField === 'code' ? String(b.code || '') : Number(b[sortField] ?? 0);
    if (aVal < bVal) return -1 * dir;
    if (aVal > bVal) return 1 * dir;
    return 0;
  });

  const totals = allItems.reduce(
    (acc, item) => {
      acc.active += item.activeSubscribers || 0;
      acc.entered += item.codeEnteredUsers || 0;
      acc.pending += item.pendingReferrals || 0;
      acc.purchases += item.allTimeInitialPurchases || 0;
      acc.atRisk += item.atRiskSubscribers || 0;
      acc.inactive += item.inactiveSubscribers || 0;
      return acc;
    },
    { active: 0, entered: 0, pending: 0, purchases: 0, atRisk: 0, inactive: 0 }
  );

  if (elements.subscriberTotalCodes) {
    elements.subscriberTotalCodes.textContent = formatWholeNumber(allItems.length);
  }
  if (elements.subscriberTotalActive) {
    elements.subscriberTotalActive.textContent = formatWholeNumber(totals.active);
  }
  if (elements.subscriberTotalHistorical) {
    elements.subscriberTotalHistorical.textContent = formatWholeNumber(totals.entered);
  }
  if (elements.subscriberTotalChurned) {
    elements.subscriberTotalChurned.textContent = formatWholeNumber(totals.pending);
  }
  if (elements.subscriberLastRefresh) {
    elements.subscriberLastRefresh.textContent = state.subscriberLastRefreshAt
      ? formatTimestamp({ iso: state.subscriberLastRefreshAt })
      : 'Never';
  }
  if (elements.subscriberSnapshotMeta) {
    elements.subscriberSnapshotMeta.textContent = allItems.length
      ? `Snapshot: ${formatWholeNumber(totals.entered)} users entered a code, ${formatWholeNumber(totals.pending)} are still pending, ${formatWholeNumber(totals.purchases)} reached a first purchase, and ${formatWholeNumber(totals.active)} are active now.`
      : 'Snapshot will appear here once referral code events are tracked.';
  }

  if (elements.subscriberTableBody) {
    elements.subscriberTableBody.innerHTML = items
      .map((item) => {
        const activeBar = Math.min(
          100,
          Math.round(((item.activeSubscribers || 0) / Math.max(item.codeEnteredUsers || item.attributedUsers || 1, 1)) * 100)
        );
        const activeRatio = item.codeEnteredUsers > 0
          ? item.activeSubscribers / item.codeEnteredUsers
          : (item.attributedUsers > 0 ? item.activeSubscribers / item.attributedUsers : 0);
        const affiliateLabel = item.displayName || item.affiliateId || 'Unassigned partner';
        return `
        <tr>
          <td>
            <div class="admin-subscriber-code-cell">
              <span class="admin-subscriber-code">${escapeHtml(item.code)}</span>
              <span class="admin-subscriber-code-meta">${escapeHtml(affiliateLabel)}</span>
            </div>
          </td>
          <td>${escapeHtml(formatWholeNumber(item.codeEnteredUsers))}</td>
          <td>${escapeHtml(formatWholeNumber(item.pendingReferrals))}</td>
          <td>${escapeHtml(formatWholeNumber(item.allTimeInitialPurchases))}</td>
          <td class="admin-subscriber-metric admin-subscriber-metric--active">
            <span class="admin-subscriber-metric__value">${escapeHtml(formatWholeNumber(item.activeSubscribers))}</span>
            <span class="admin-subscriber-bar" style="--bar-pct:${activeBar}%"></span>
            <span class="admin-subscriber-metric__meta">${escapeHtml(`${formatPercent(activeRatio)} of code-entered users live now`)}</span>
          </td>
          <td>${escapeHtml(formatWholeNumber(item.atRiskSubscribers))}</td>
          <td>${escapeHtml(formatWholeNumber(item.inactiveSubscribers))}</td>
          <td class="admin-subscriber-updated">${escapeHtml(item.lastUpdatedIso ? formatTimestamp({ iso: item.lastUpdatedIso }) : '-')}</td>
        </tr>`;
      })
      .join('');
  }

  if (elements.subscriberEmpty) {
    if (!items.length && allItems.length) {
      elements.subscriberEmpty.textContent = 'No codes match your current filters.';
    } else if (!allItems.length) {
      elements.subscriberEmpty.textContent = 'No affiliate funnel data available yet. Stats populate once people enter referral codes or purchase subscriptions.';
    }
    elements.subscriberEmpty.hidden = items.length > 0;
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
  const items = buildPartnerRegistryEntries();

  if (!items.length) {
    elements.partnerRegistryList.innerHTML = '<p class="admin-empty admin-empty--inline">No affiliate partners synced yet.</p>';
    return;
  }

  elements.partnerRegistryList.innerHTML = items
    .map((item) => {
      const linkedAt = item.linkedAt ? formatTimestamp({ iso: item.linkedAt }) : 'Not recorded';
      const updatedAt = item.updatedAt ? formatTimestamp(item.updatedAt) : 'Not synced yet';
      const metaDisplayName = item.partnerDisplayName || item.displayName;
      const statusLabel = item.status === 'verified'
        ? 'verified'
        : item.status === 'lookup_error'
          ? 'lookup_error'
          : item.status === 'unlinked'
            ? 'unlinked'
            : 'mapped_unverified';
      return `
        <div class="admin-mini-item">
          <span class="admin-mini-item__title">${escapeHtml(metaDisplayName)} (${escapeHtml(item.code)})</span>
          <span class="admin-mini-item__meta">${escapeHtml(item.email)} &middot; ${escapeHtml(item.affiliateId)} &middot; ${escapeHtml(statusLabel)} &middot; partner ${escapeHtml(item.partnerStatus || 'active')}</span>
          <span class="admin-mini-item__meta">${escapeHtml(item.partnerType)}${item.mobile ? ` &middot; ${escapeHtml(item.mobile)}` : ''}${item.country ? ` &middot; ${escapeHtml(item.country)}` : ''}${item.vat ? ` &middot; VAT ${escapeHtml(item.vat)}` : ''}</span>
          <span class="admin-mini-item__meta">${escapeHtml(item.partnerUid || '-')} &middot; ${escapeHtml(item.statusReason || '-')}</span>
          <span class="admin-mini-item__meta">${escapeHtml(item.linkedBy || item.updatedByEmail || 'admin')} &middot; linked ${escapeHtml(linkedAt)} &middot; synced ${escapeHtml(updatedAt)}</span>
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
    await withAdminTimeout(name, runner, ADMIN_CALL_TIMEOUT_MS);
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
    includeInactive: true,
  });

  state.codes = Array.isArray(data.items) ? data.items : [];
}

async function loadPartners() {
  const data = await callFirebaseFunction('listAffiliatePartnersAdmin', {
    includeInactive: true,
  });

  state.partners = normalizePartnerListValue(Array.isArray(data.items) ? data.items : []);
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

async function savePartnerEmailMapping(code, partnerEmail, metadata, profileInput, portalAccessPatch) {
  const normalizedCode = normalizeReferralCodeValue(code);
  if (!normalizedCode) return;

  const nextMap = Object.assign({}, state.partnerEmailsByCode || {});
  const nextRegistry = Object.assign({}, state.partnerRegistryByCode || {});
  const nextUids = Object.assign({}, state.partnerUidsByCode || {});
  const nextProfiles = Object.assign({}, state.partnerProfilesByCode || {});
  const normalizedEmail = normalizeEmail(partnerEmail || '');
  const normalizedProfile = normalizePartnerProfile(profileInput || {});
  const accessPatch = portalAccessPatch || {};
  const codeItem = {
    code: normalizedCode,
    affiliateId: String(metadata?.affiliateId || '').trim(),
    displayName: String(metadata?.displayName || '').trim(),
    status: String(metadata?.status || '').trim() || 'active',
  };
  const existingPartner = findLinkedPartnerForCode(codeItem);
  let lookup = null;
  let lookupFailed = false;
  let status = 'unlinked';
  let statusReason = 'email_removed';

  if (normalizedEmail && isValidEmail(normalizedEmail)) {
    try {
      lookup = await lookupNuriaPartnerByEmail(normalizedEmail);
      status = lookup?.found === true ? 'verified' : 'mapped_unverified';
      statusReason = lookup?.source || 'not_found';
    } catch (lookupError) {
      lookupFailed = true;
      statusReason = getActionableErrorMessage(lookupError, getErrorParts(lookupError).message);
    }
  }

  const existingPortalEmail = normalizeEmail(existingPartner?.portalEmail);
  const existingPortalUid = String(existingPartner?.portalUid || '').trim();
  const canReuseExistingUid = Boolean(
    existingPortalUid
    && normalizedEmail
    && existingPortalEmail === normalizedEmail
  );
  if (
    accessPatch.portalWebAccessEnabled === true
    && !(lookup?.found === true || canReuseExistingUid)
  ) {
    const error = new Error('portal_login_requires_verified_nuria_account');
    error.code = 'portal-login-requires-verified-nuria-account';
    throw error;
  }

  const upsertSettings = {
    codeItem,
    existingPartner,
    partnerEmail: normalizedEmail,
    lookupResult: lookup,
    lookupFailed,
  };
  if (Object.prototype.hasOwnProperty.call(accessPatch, 'portalWebAccessEnabled')) {
    upsertSettings.portalWebAccessEnabled = accessPatch.portalWebAccessEnabled;
  }
  const partnerPayload = buildPartnerUpsertPayloadForCode(upsertSettings);
  await callFirebaseFunction('upsertAffiliatePartnerAdmin', partnerPayload);

  if (normalizedEmail && isValidEmail(normalizedEmail)) {
    const resolvedStatus = partnerPayload.portalUid
      ? 'verified'
      : lookupFailed
        ? 'lookup_error'
        : status;
    nextMap[normalizedCode] = normalizedEmail;
    nextRegistry[normalizedCode] = {
      email: partnerPayload.portalEmail || lookup?.email || normalizedEmail,
      affiliateId: partnerPayload.affiliateId,
      displayName: partnerPayload.displayName || codeItem.displayName,
      partnerUid: partnerPayload.portalUid || '',
      portalWebAccessEnabled: Boolean(partnerPayload.portalWebAccessEnabled),
      partnerDisplayName: lookup?.displayName || partnerPayload.displayName || '',
      linkedAt: new Date().toISOString(),
      linkedBy: getActivityActor(),
      status: resolvedStatus,
      statusReason,
    };
    if (partnerPayload.portalUid) {
      nextUids[normalizedCode] = partnerPayload.portalUid;
    } else {
      delete nextUids[normalizedCode];
    }
  } else {
    delete nextMap[normalizedCode];
    delete nextRegistry[normalizedCode];
    delete nextUids[normalizedCode];
  }

  if (normalizedProfile) {
    nextProfiles[normalizedCode] = normalizedProfile;
  } else {
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
  const loadToken = dashboardLoadToken + 1;
  dashboardLoadToken = loadToken;
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
    await withAdminTimeout(
      'admin dashboard load',
      () =>
        Promise.all([
          runHealthCheck('bootstrap', loadBootstrap),
          runHealthCheck('codes', loadCodes),
          runHealthCheck('partners', loadPartners),
          runHealthCheck('reports', loadReports),
          runHealthCheck('audit_log', loadBackendAuditLogs),
          runHealthCheck('admin_settings', loadAdminSettings),
          runHealthCheck('subscriber_stats', loadSubscriberStats),
        ]),
      DASHBOARD_LOAD_TIMEOUT_MS
    );
    if (loadToken !== dashboardLoadToken) {
      return;
    }
    renderOverview();
    renderCodesTable();
    renderPartnerAnalyticsPage();
    renderSubscriberFunnelInsights();
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
    if (loadToken !== dashboardLoadToken) {
      return;
    }
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
    await playLoginSuccessSound({ restart: true });
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
  await playLoginSuccessSound();
}

function handlePauseSpiritSound() {
  pauseLoginSuccessSound();
}

function handleStopSpiritSound() {
  stopLoginSuccessSound();
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
      runHealthCheck('codes', loadCodes),
      runHealthCheck('partners', loadPartners),
      runHealthCheck('reports', loadReports),
      runHealthCheck('audit_log', loadBackendAuditLogs),
      runHealthCheck('admin_settings', loadAdminSettings),
      runHealthCheck('subscriber_stats', loadSubscriberStats),
    ]);
    renderOverview();
    renderCodesTable();
    renderPartnerAnalyticsPage();
    renderReportsTable();
    renderSubscriberFunnelInsights();
    showBanner('Health checks refreshed.', 'success');
  } catch (error) {
    renderHealthDashboard();
    showBanner(getActionableErrorMessage(error, 'One or more health checks failed.'), 'error');
  }
}

async function handleReverifyPartnerRegistry() {
  const map = Object.assign({}, state.partnerEmailsByCode || {});
  buildPartnerRegistryEntries().forEach((item) => {
    const normalizedCode = normalizeReferralCodeValue(item.code || item.primaryReferralCode || '');
    const normalizedEmail = normalizeEmail(item.email || '');
    if (normalizedCode && isValidEmail(normalizedEmail)) {
      map[normalizedCode] = normalizedEmail;
    }
  });
  const codes = Object.keys(map);
  if (!codes.length) {
    showBanner('No linked partner emails found to verify yet.', 'info');
    return;
  }

  setButtonBusy(elements.reverifyPartnerRegistry, true, 'Verifying');
  clearBanner();
  try {
    for (const code of codes) {
      const codeItem = (state.codes || []).find((item) => normalizeReferralCodeValue(item.code || '') === code);
      await savePartnerEmailMapping(code, map[code], {
        affiliateId: codeItem?.affiliateId || '',
        displayName: codeItem?.displayName || '',
        status: codeItem?.status || 'active',
      }, state.partnerProfilesByCode?.[code] || null);
    }
    await loadPartners();
    renderPartnerAnalyticsPage();
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
    stopLoginSuccessSound();
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
    code: normalizeReferralCodeValue(elements.codeValue.value),
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
        status: saved.status || payload.status || 'active',
      }, partnerProfile);
      await loadPartners();
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
    renderPartnerAnalyticsPage();
    renderPartnerRegistry();
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
        `\uFEFF${csv}`,
        'text/csv;charset=utf-8'
      );
      await downloadStyledExcelForDetail(detail);
      showBanner('CSV and Excel workbook exported.', 'success');
      addActivityLog(`Exported CSV and Excel for ${detail.report?.periodMonth || reportId}.`, 'success');
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
      `\uFEFF${csv}`,
      'text/csv;charset=utf-8'
    );
    await downloadStyledExcelForDetail(sampleDetail);
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
        'Sample CSV, Excel, and HTML templates downloaded. Allow popups to open both PDF preview windows.',
        'info'
      );
      addActivityLog('Exported sample files (preview popup blocked).', 'info');
      return;
    }

    showBanner('Sample export: CSV, Excel, HTML templates, and two PDF preview windows.', 'success');
    addActivityLog('Exported sample CSV, Excel, templates, and opened PDF previews.', 'success');
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
      `\uFEFF${csv}`,
      'text/csv;charset=utf-8'
    );
    await downloadStyledExcelForDetail(detailForExport);

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
      showBanner('Payout finalized; CSV and Excel exported. Allow popups to open the receipt PDF view.', 'success');
      addActivityLog(`Finalized payout for ${reportId}; exported CSV and Excel.`, 'success');
      markChecklistSteps(['exported', 'paid'], true, updatedDetail.report?.periodMonth || elements.reportMonth.value);
      return;
    }

    showBanner('Payout finalized; CSV and Excel exported; receipt PDF view opened.', 'success');
    addActivityLog(`Finalized payout for ${reportId} with CSV, Excel, and receipt PDF.`, 'success');
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
      `\uFEFF${payoutCsv}`,
      'text/csv;charset=utf-8'
    );
    await downloadStyledExcelForDetail(detail);
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
        ? `Generated month-end package for ${detail.report?.periodMonth || reportMonth} (CSV + Excel + ops JSON + receipt PDF).`
        : `Generated month-end package for ${detail.report?.periodMonth || reportMonth} (CSV + Excel + ops JSON, PDF blocked).`,
      'success'
    );

    showBanner(
      opened
        ? 'Close package: payout CSV + Excel + ops JSON + receipt PDF view.'
        : 'Close package: payout CSV + Excel + ops JSON. Allow popups to open receipt PDF view.',
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

function bindAdminTopbarScrollCollapse() {
  const card = elements.topbar;
  if (!card) return;
  const mq = window.matchMedia('(min-width: 769px)');
  let framePending = false;
  let lastCollapsedState = null;
  const update = () => {
    framePending = false;
    const shouldCollapse = mq.matches && window.scrollY > 72;
    if (shouldCollapse === lastCollapsedState) {
      return;
    }
    lastCollapsedState = shouldCollapse;
    card.classList.toggle('admin-topbar-card--scrolled', shouldCollapse);
  };
  const requestUpdate = () => {
    if (framePending) {
      return;
    }
    framePending = true;
    window.requestAnimationFrame(update);
  };
  window.addEventListener('scroll', requestUpdate, { passive: true });
  mq.addEventListener('change', () => {
    lastCollapsedState = null;
    requestUpdate();
  });
  requestUpdate();
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
    const isOpen = elements.topbar?.classList.contains('admin-topbar-card--mobile-open');
    setMobileNavOpen(!isOpen);
  });
  elements.mobileNavBackdrop?.addEventListener('click', () => setMobileNavOpen(false));
  elements.mobileNavClose?.addEventListener('click', () => setMobileNavOpen(false));
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (!elements.topbar?.classList.contains('admin-topbar-card--mobile-open')) return;
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
    placeMobileDrawer();
    setMobileNavOpen(false);
  });
  elements.emailSignInForm?.addEventListener('submit', handleEmailSignIn);
  elements.sendPasswordResetButton?.addEventListener('click', handleSendPasswordReset);
  elements.playSpiritSound?.addEventListener('click', handlePlaySpiritSound);
  elements.pauseSpiritSound?.addEventListener('click', handlePauseSpiritSound);
  elements.stopSpiritSound?.addEventListener('click', handleStopSpiritSound);
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
      await Promise.all([loadCodes(), loadPartners()]);
      renderCodesTable();
      renderPartnerAnalyticsPage();
      renderPartnerRegistry();
    } catch (error) {
      showBanner(getErrorParts(error).message, 'error');
    }
  });
  elements.refreshPartners?.addEventListener('click', async () => {
    clearBanner();
    try {
      await Promise.all([loadCodes(), loadPartners(), loadAdminSettings(), loadSubscriberStats()]);
      renderOverview();
      renderCodesTable();
      renderPartnerAnalyticsPage();
      renderPartnerRegistry();
      renderSubscriberFunnelInsights();
      showBanner('Partner intelligence refreshed.', 'success');
    } catch (error) {
      showBanner(getErrorParts(error).message, 'error');
    }
  });
  elements.partnerSearchInput?.addEventListener('input', () => {
    state.filters.partnerQuery = elements.partnerSearchInput.value;
    renderPartnerAnalyticsPage();
  });
  elements.partnerStatusFilter?.addEventListener('change', () => {
    state.filters.partnerStatus = elements.partnerStatusFilter.value;
    renderPartnerAnalyticsPage();
  });
  elements.partnerSortSelect?.addEventListener('change', () => {
    state.filters.partnerSort = elements.partnerSortSelect.value;
    renderPartnerAnalyticsPage();
  });
  elements.partnerList?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-partner-key]');
    if (!button) return;
    state.selectedPartnerKey = String(button.dataset.partnerKey || '').trim();
    renderPartnerAnalyticsPage();
  });
  elements.partnerDetail?.addEventListener('click', (event) => {
    const codeButton = event.target.closest('[data-open-partner-code]');
    if (codeButton) {
      const code = normalizeReferralCodeValue(codeButton.dataset.openPartnerCode || '');
      if (!code) return;
      const item = (state.codes || []).find((entry) => normalizeReferralCodeValue(entry?.code || '') === code) || null;
      setAdminPage('codes', { updateUrl: true });
      resetCodeForm(item || { code });
      return;
    }

    const joinButton = event.target.closest('[data-open-partner-join]');
    if (joinButton) {
      const code = normalizeReferralCodeValue(joinButton.dataset.openPartnerJoin || '');
      if (!code) return;
      const joinUrl = `${window.location.origin}/join/${encodeURIComponent(code)}`;
      window.open(joinUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    const portalButton = event.target.closest('[data-open-partner-portal]');
    if (portalButton) {
      const email = normalizeEmail(portalButton.dataset.openPartnerPortal || '');
      const portalUrl = email
        ? `${window.location.origin}/nuria-partner/?view=login&email=${encodeURIComponent(email)}`
        : `${window.location.origin}/nuria-partner/`;
      window.open(portalUrl, '_blank', 'noopener,noreferrer');
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
      await Promise.all([loadCodes(), loadPartners()]);
      renderCodesTable();
      renderPartnerAnalyticsPage();
      renderPartnerRegistry();
    } catch (error) {
      showBanner(getErrorParts(error).message, 'error');
    }
  });
  elements.newCode?.addEventListener('click', () => resetCodeForm(null));
  elements.resetCodeForm?.addEventListener('click', () => resetCodeForm(null));
  elements.codeForm?.addEventListener('submit', handleCodeSave);
  elements.partnerPortalEnableButton?.addEventListener('click', () => {
    handlePartnerPortalAccessChange(true);
  });
  elements.partnerPortalDisableButton?.addEventListener('click', () => {
    handlePartnerPortalAccessChange(false);
  });
  elements.partnerPortalInviteButton?.addEventListener('click', handlePartnerPortalInviteCreate);
  elements.partnerNuriaEmail?.addEventListener('input', () => {
    renderPartnerPortalAccessRow(getCodeFormDraftItem());
  });
  elements.codeValue?.addEventListener('input', () => {
    renderPartnerPortalAccessRow(getCodeFormDraftItem());
  });
  elements.refreshSubscribers?.addEventListener('click', async () => {
    clearBanner();
    try {
      await loadSubscriberStats();
      renderPartnerAnalyticsPage();
      renderSubscriberFunnelInsights();
      showBanner('Subscriber data refreshed.', 'success');
    } catch (error) {
      showBanner(getErrorParts(error).message, 'error');
    }
  });
  elements.subscriberSearchInput?.addEventListener('input', () => {
    state.filters.subscriberQuery = elements.subscriberSearchInput.value;
    renderSubscriberFunnelInsights();
  });
  elements.subscriberMetricFilter?.addEventListener('change', () => {
    state.filters.subscriberMetric = elements.subscriberMetricFilter.value;
    renderSubscriberFunnelInsights();
  });
  elements.subscriberSortSelect?.addEventListener('change', () => {
    state.filters.subscriberSort = elements.subscriberSortSelect.value;
    renderSubscriberFunnelInsights();
  });
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
  elements.refreshDashboardCopy?.addEventListener('click', () => {
    clearBanner();
    ensureDashboardCopyLoaded({ force: true }).catch(() => {});
  });
  elements.dashboardCopyRetry?.addEventListener('click', () => {
    clearBanner();
    ensureDashboardCopyLoaded({ force: true }).catch(() => {});
  });
  elements.dashboardCopyForm?.addEventListener('submit', handleDashboardCopySave);
  elements.dashboardCopyEnabled?.addEventListener('change', handleDashboardCopyBaseFieldsInput);
  elements.dashboardCopyTitleEn?.addEventListener('input', handleDashboardCopyBaseFieldsInput);
  elements.dashboardCopyBodyEn?.addEventListener('input', handleDashboardCopyBaseFieldsInput);
  elements.dashboardCopyAutoTranslate?.addEventListener('change', handleDashboardCopyBaseFieldsInput);
  elements.dashboardCopyForceTranslate?.addEventListener('change', handleDashboardCopyBaseFieldsInput);
  elements.dashboardCopyLocaleSearch?.addEventListener('input', handleDashboardCopyLocaleSearchInput);
  elements.dashboardCopyTranslationsList?.addEventListener('input', handleDashboardCopyTranslationInput);
  elements.dashboardCopyPreviewLocale?.addEventListener('change', handleDashboardCopyPreviewLocaleChange);
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
  syncSubscriberInsightControls();
  state.filters.codeQuery = elements.codeSearchInput?.value || '';
  state.filters.codeStatus = elements.codeStatusFilter?.value || '';
  state.filters.partnerQuery = elements.partnerSearchInput?.value || '';
  state.filters.partnerStatus = elements.partnerStatusFilter?.value || '';
  state.filters.partnerSort = elements.partnerSortSelect?.value || 'active-desc';
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
  resetDashboardCopyState({ preservePreviewLocale: false });
  renderDashboardCopy();
  syncPartnerTypeFields();
  clearSelectedReport();
}

function applyAuthState(user) {
  const previousUid = previousAuthUid;
  const nextUid = user?.uid || null;
  const wasLoggedOut = !previousUid;
  previousAuthUid = nextUid;
  state.user = user;
  state.admin = null;
  elements.authError.hidden = true;
  elements.authError.textContent = '';
  updateIdentity();

  if (!user) {
    resetDashboardCopyState({ preservePreviewLocale: false });
    renderDashboardCopy();
    stopLoginSuccessSound();
    clearSelectedReport();
    setView('signed-out');
    return;
  }

  if (!previousUid || previousUid !== nextUid) {
    resetDashboardCopyState({ preservePreviewLocale: true });
    renderDashboardCopy();
  }

  if (wasLoggedOut) {
    state.pendingOnboardingAfterLogin = true;
  }
  loadDashboard();
}

function handleAuthState(user) {
  try {
    applyAuthState(user);
  } catch (error) {
    handleAuthStateError(error);
  }
}

function handleAuthStateError(error) {
  initialAuthStateHandled = true;
  console.error('[affiliate-admin] Auth state check failed', error);
  handleLoadError(error);
}

bindEvents();
updateSpiritSoundControls();
placeMobileDrawer();
setMobileNavOpen(false);
bindAdminTopbarScrollCollapse();
initializeFormDefaults();
setView('loading-auth');

function handleInitialAuthState(user) {
  if (!initialAuthStateHandled) {
    previousAuthUid = user?.uid || null;
    initialAuthStateHandled = true;
  }
  handleAuthState(user);
}

subscribeToAuthState(handleInitialAuthState, handleAuthStateError);

window.setTimeout(() => {
  if (initialAuthStateHandled) {
    return;
  }
  console.warn(
    `[affiliate-admin] Initial auth state did not arrive within ${AUTH_BOOTSTRAP_TIMEOUT_MS}ms; falling back to currentUser.`
  );
  try {
    handleInitialAuthState(getCurrentUser());
  } catch (error) {
    handleAuthStateError(error);
  }
}, AUTH_BOOTSTRAP_TIMEOUT_MS);

window.setTimeout(() => {
  if (state.currentView !== 'loading-auth') {
    return;
  }
  console.warn('[affiliate-admin] Access check stayed on the loading screen; showing sign-in fallback.');
  setView('signed-out');
  if (elements.authError) {
    elements.authError.textContent = 'Access check timed out. Sign in again or refresh the page.';
    elements.authError.hidden = false;
  }
}, AUTH_STUCK_TIMEOUT_MS);

waitForAuthPersistenceReady().catch(() => {});

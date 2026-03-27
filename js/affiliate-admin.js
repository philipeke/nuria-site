import {
  callFirebaseFunction,
  getCurrentUser,
  signInWithEmailPassword,
  signInWithGoogle,
  signOutUser,
  subscribeToAuthState,
} from './firebase-client.js';

const site = window.NuriaSite || {};
const page = document.querySelector('[data-affiliate-admin-page]');

if (!page) {
  throw new Error('affiliate_admin_page_missing');
}

const elements = {
  views: Array.from(document.querySelectorAll('[data-admin-view]')),
  globalNotice: document.getElementById('adminGlobalNotice'),
  authSummary: document.getElementById('adminAuthSummary'),
  signOutTop: document.getElementById('adminSignOutTop'),
  googleSignIn: document.getElementById('adminGoogleSignIn'),
  emailSignInForm: document.getElementById('adminEmailSignInForm'),
  authError: document.getElementById('adminAuthError'),
  signOutUnauthorized: document.getElementById('adminSignOutUnauthorized'),
  unauthorizedCopy: document.getElementById('adminUnauthorizedCopy'),
  retryLoad: document.getElementById('adminRetryLoad'),
  errorCopy: document.getElementById('adminErrorCopy'),
  refreshOverview: document.getElementById('adminRefreshOverview'),
  currentEmail: document.getElementById('adminCurrentEmail'),
  currentRoles: document.getElementById('adminCurrentRoles'),
  currentSource: document.getElementById('adminCurrentSource'),
  overviewReports: document.getElementById('adminOverviewReports'),
  overviewCodes: document.getElementById('adminOverviewCodes'),
  includeInactiveCodes: document.getElementById('adminIncludeInactiveCodes'),
  refreshCodes: document.getElementById('adminRefreshCodes'),
  newCode: document.getElementById('adminNewCode'),
  codeTableBody: document.getElementById('adminCodesTableBody'),
  codesEmpty: document.getElementById('adminCodesEmpty'),
  codeForm: document.getElementById('adminCodeForm'),
  codeFormTitle: document.getElementById('adminCodeFormTitle'),
  codeFormHelper: document.getElementById('adminCodeFormHelper'),
  editingExistingCode: document.getElementById('adminEditingExistingCode'),
  codeValue: document.getElementById('adminCodeValue'),
  affiliateId: document.getElementById('adminAffiliateId'),
  displayName: document.getElementById('adminDisplayName'),
  codeStatus: document.getElementById('adminCodeStatus'),
  revenueShareBps: document.getElementById('adminRevenueShareBps'),
  fixedPayoutMinor: document.getElementById('adminFixedPayoutMinor'),
  currency: document.getElementById('adminCurrency'),
  saveCodeButton: document.getElementById('adminSaveCodeButton'),
  resetCodeForm: document.getElementById('adminResetCodeForm'),
  refreshReports: document.getElementById('adminRefreshReports'),
  reportsTableBody: document.getElementById('adminReportsTableBody'),
  reportsEmpty: document.getElementById('adminReportsEmpty'),
  reportMonth: document.getElementById('adminReportMonth'),
  sendEmail: document.getElementById('adminSendEmail'),
  generateReportForm: document.getElementById('adminGenerateReportForm'),
  generateReportButton: document.getElementById('adminGenerateReportButton'),
  reportDetailTitle: document.getElementById('adminReportDetailTitle'),
  includeRowsToggle: document.getElementById('adminIncludeRowsToggle'),
  loadReportRows: document.getElementById('adminLoadReportRows'),
  reportDetailEmpty: document.getElementById('adminReportDetailEmpty'),
  reportDetailContent: document.getElementById('adminReportDetailContent'),
  reportStats: document.getElementById('adminReportStats'),
  reportMeta: document.getElementById('adminReportMeta'),
  reportAffiliatesBody: document.getElementById('adminReportAffiliatesBody'),
  reportAffiliatesEmpty: document.getElementById('adminReportAffiliatesEmpty'),
  reportRowsSection: document.getElementById('adminReportRowsSection'),
  reportRowsBody: document.getElementById('adminReportRowsBody'),
  reportRowsEmpty: document.getElementById('adminReportRowsEmpty'),
  markPaidForm: document.getElementById('adminMarkPaidForm'),
  paymentReference: document.getElementById('adminPaymentReference'),
  paymentNote: document.getElementById('adminPaymentNote'),
  markPaidButton: document.getElementById('adminMarkPaidButton'),
};

const state = {
  initializedViewEvent: false,
  user: null,
  admin: null,
  recentReports: [],
  recentCodes: [],
  codes: [],
  reports: [],
  selectedReportId: getReportIdFromUrl(),
  selectedReport: null,
};

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

  if (!state.initializedViewEvent) {
    track('affiliate_admin_page_viewed', {
      initial_view: name,
    });
    state.initializedViewEvent = true;
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

function humanizeAccessSource(source) {
  if (source === 'email_domain') return 'Verified @oakdev.app';
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

  const summary = [user.email || 'Signed in'];

  if (state.admin?.roles?.length) {
    summary.push(state.admin.roles.join(', '));
  }

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

function resetCodeForm(item) {
  const value = item || null;

  setCodeFormMode(value ? 'edit' : 'create');
  elements.codeForm.reset();
  elements.codeStatus.value = 'active';
  elements.revenueShareBps.value = '5000';

  if (!value) {
    elements.codeValue.value = '';
    elements.affiliateId.value = '';
    elements.displayName.value = '';
    elements.fixedPayoutMinor.value = '';
    elements.currency.value = '';
    return;
  }

  elements.codeValue.value = value.code || '';
  elements.affiliateId.value = value.affiliateId || '';
  elements.displayName.value = value.displayName || '';
  elements.codeStatus.value = value.status || 'active';
  elements.revenueShareBps.value = String(value.revenueShareBps ?? 5000);
  elements.fixedPayoutMinor.value =
    value.fixedPayoutMinor == null ? '' : String(value.fixedPayoutMinor);
  elements.currency.value = value.currency || '';
}

function syncReportActionFields(report) {
  elements.paymentReference.value = report?.paymentReference || '';
  elements.paymentNote.value = report?.note || '';
}

function renderMiniList(container, items, type) {
  if (!container) return;

  if (!items.length) {
    container.innerHTML = '<p class="admin-empty admin-empty--inline">Nothing to show yet.</p>';
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

  renderMiniList(elements.overviewReports, state.recentReports, 'report');
  renderMiniList(elements.overviewCodes, state.recentCodes, 'code');
}

function renderCodesTable() {
  const items = state.codes || [];

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

  elements.codesEmpty.hidden = items.length > 0;
}

function renderReportsTable() {
  const items = state.reports || [];

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

  elements.reportsEmpty.hidden = items.length > 0;
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
  updateReportUrl('');
  elements.reportDetailTitle.textContent = 'Select a payout report';
  elements.reportDetailEmpty.hidden = false;
  elements.reportDetailContent.hidden = true;
  elements.markPaidButton.disabled = true;
  elements.markPaidButton.textContent = 'Mark report as paid';
  syncReportActionFields(null);
}

function renderSelectedReport() {
  const detail = state.selectedReport;

  elements.loadReportRows.disabled = !state.selectedReportId;

  if (!detail || !detail.report) {
    clearSelectedReport();
    return;
  }

  const report = detail.report;
  elements.reportDetailTitle.textContent = `Report ${report.periodMonth}`;
  elements.reportDetailEmpty.hidden = true;
  elements.reportDetailContent.hidden = false;

  renderReportStats(report);
  renderReportMeta(report);
  renderReportAffiliates(detail.affiliates || []);
  renderReportRows(detail.rows || [], detail.rowsIncluded === true);
  syncReportActionFields(report);

  if (report.status === 'paid') {
    elements.markPaidButton.disabled = true;
    elements.markPaidButton.textContent = 'Already paid';
  } else {
    elements.markPaidButton.disabled = false;
    elements.markPaidButton.textContent = 'Mark report as paid';
  }
}

async function loadBootstrap() {
  const data = await callFirebaseFunction('getAffiliateAdminBootstrap');
  state.admin = data.admin || null;
  state.recentReports = Array.isArray(data.recentReports) ? data.recentReports : [];
  state.recentCodes = Array.isArray(data.recentCodes) ? data.recentCodes : [];
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
      'Your account is signed in, but it does not include the affiliate_admin role.';
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
    showBanner('Sign in to access the affiliate admin dashboard.', 'info');
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
    await Promise.all([loadBootstrap(), loadCodes(), loadReports()]);
    renderOverview();
    renderCodesTable();
    renderReportsTable();
    updateIdentity();
    setView('ready');

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
    renderSelectedReport();
  } catch (error) {
    clearSelectedReport();
    showBanner(getErrorParts(error).message, 'error');
  }
}

async function handleGoogleSignIn() {
  clearBanner();
  elements.authError.hidden = true;
  elements.authError.textContent = '';
  setButtonBusy(elements.googleSignIn, true, 'Signing in');

  try {
    await signInWithGoogle();
  } catch (error) {
    const parts = getErrorParts(error);
    elements.authError.hidden = false;
    elements.authError.textContent = parts.message;
  } finally {
    setButtonBusy(elements.googleSignIn, false);
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
    await signInWithEmailPassword(email, password);
  } catch (error) {
    const parts = getErrorParts(error);
    elements.authError.hidden = false;
    elements.authError.textContent = parts.message;
  } finally {
    setButtonBusy(submitButton, false);
  }
}

async function handleSignOut() {
  clearBanner();

  try {
    await signOutUser();
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
  clearBanner();

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
    renderOverview();
    renderCodesTable();
    resetCodeForm(saved);
    showBanner(
      editing
        ? `Updated code ${saved.code || payload.code}.`
        : `Created code ${saved.code || payload.code}.`,
      'success'
    );
  } catch (error) {
    showBanner(getErrorParts(error).message, 'error');
  } finally {
    setButtonBusy(elements.saveCodeButton, false);
  }
}

async function handleGenerateReport(event) {
  event.preventDefault();
  clearBanner();
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

    if (data.reportId) {
      await loadReportDetail(data.reportId, elements.includeRowsToggle.checked);
    }
  } catch (error) {
    showBanner(getErrorParts(error).message, 'error');
  } finally {
    setButtonBusy(elements.generateReportButton, false);
  }
}

async function handleMarkPaid(event) {
  event.preventDefault();

  const reportId = state.selectedReport?.report?.reportId || '';
  if (!reportId) {
    showBanner('Load a payout report before marking it as paid.', 'info');
    return;
  }

  if (!window.confirm(`Mark report ${reportId} as paid?`)) {
    return;
  }

  clearBanner();
  setButtonBusy(elements.markPaidButton, true, 'Marking paid');

  try {
    const data = await callFirebaseFunction('markAffiliatePayoutReportPaidAdmin', {
      reportId,
      paymentReference: elements.paymentReference.value.trim() || null,
      note: elements.paymentNote.value.trim() || null,
    });

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
    await loadReportDetail(reportId, elements.includeRowsToggle.checked);
  } catch (error) {
    showBanner(getErrorParts(error).message, 'error');
  } finally {
    setButtonBusy(elements.markPaidButton, false);
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
  elements.googleSignIn?.addEventListener('click', handleGoogleSignIn);
  elements.emailSignInForm?.addEventListener('submit', handleEmailSignIn);
  elements.signOutTop?.addEventListener('click', handleSignOut);
  elements.signOutUnauthorized?.addEventListener('click', handleSignOut);
  elements.retryLoad?.addEventListener('click', () => loadDashboard());
  elements.refreshOverview?.addEventListener('click', () => loadDashboard());
  elements.refreshCodes?.addEventListener('click', async () => {
    clearBanner();
    try {
      await loadCodes();
      renderCodesTable();
    } catch (error) {
      showBanner(getErrorParts(error).message, 'error');
    }
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
  elements.refreshReports?.addEventListener('click', async () => {
    clearBanner();
    try {
      await loadReports();
      renderReportsTable();
    } catch (error) {
      showBanner(getErrorParts(error).message, 'error');
    }
  });
  elements.generateReportForm?.addEventListener('submit', handleGenerateReport);
  elements.loadReportRows?.addEventListener('click', () => {
    loadReportDetail(state.selectedReportId, elements.includeRowsToggle.checked);
  });
  elements.markPaidForm?.addEventListener('submit', handleMarkPaid);
  bindMiniListActions();
}

function initializeFormDefaults() {
  elements.reportMonth.value = getPreviousUtcMonth();
  elements.includeRowsToggle.checked = false;
  resetCodeForm(null);
  clearSelectedReport();
}

function handleAuthState(user) {
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

  loadDashboard();
}

bindEvents();
initializeFormDefaults();

if (getCurrentUser()) {
  setView('loading-dashboard');
}

subscribeToAuthState(handleAuthState);

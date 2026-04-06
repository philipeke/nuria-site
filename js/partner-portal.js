import {
  callFirebaseFunction,
  getCurrentUser,
  isAppCheckConfigured,
  sendPasswordReset,
  signInWithEmailPassword,
  signInWithGoogle,
  signOutUser,
  subscribeToAuthState,
  waitForAuthPersistenceReady,
} from './firebase-client.js';

const site = window.NuriaSite || {};
const page = document.querySelector('[data-partner-portal-page]');

if (!page) {
  throw new Error('partner_portal_page_missing');
}

const elements = {
  views: Array.from(document.querySelectorAll('[data-partner-view]')),
  globalNotice: document.getElementById('partnerGlobalNotice'),
  authSummary: document.getElementById('partnerAuthSummary'),
  refreshButton: document.getElementById('partnerRefreshButton'),
  signOutButton: document.getElementById('partnerSignOutButton'),
  emailSignInForm: document.getElementById('partnerEmailSignInForm'),
  googleSignInButton: document.getElementById('partnerGoogleSignInButton'),
  sendPasswordResetButton: document.getElementById('partnerSendPasswordResetButton'),
  emailInput: document.getElementById('partnerEmailInput'),
  authError: document.getElementById('partnerAuthError'),
  signOutUnlinked: document.getElementById('partnerSignOutUnlinked'),
  unlinkedCopy: document.getElementById('partnerUnlinkedCopy'),
  retryLoad: document.getElementById('partnerRetryLoad'),
  errorCopy: document.getElementById('partnerErrorCopy'),
  accountSelector: document.getElementById('partnerAccountSelector'),
  heroName: document.getElementById('partnerHeroName'),
  heroCopy: document.getElementById('partnerHeroCopy'),
  heroStatus: document.getElementById('partnerHeroStatus'),
  heroCode: document.getElementById('partnerHeroCode'),
  heroEmail: document.getElementById('partnerHeroEmail'),
  heroUpdatedAt: document.getElementById('partnerHeroUpdatedAt'),
  generatedAt: document.getElementById('partnerGeneratedAt'),
  activeSubscribers: document.getElementById('partnerActiveSubscribers'),
  pendingReferrals: document.getElementById('partnerPendingReferrals'),
  atRiskSubscribers: document.getElementById('partnerAtRiskSubscribers'),
  totalActivations: document.getElementById('partnerTotalActivations'),
  last30Initial: document.getElementById('partnerLast30Initial'),
  last30Renewals: document.getElementById('partnerLast30Renewals'),
  last30Refunds: document.getElementById('partnerLast30Refunds'),
  last30Revocations: document.getElementById('partnerLast30Revocations'),
  commissionCard: document.getElementById('partnerCommissionCard'),
  trackedCommission: document.getElementById('partnerTrackedCommission'),
  activationRate: document.getElementById('partnerActivationRate'),
  activationRateFill: document.getElementById('partnerActivationRateFill'),
  portfolioHealthRate: document.getElementById('partnerPortfolioHealthRate'),
  portfolioHealthFill: document.getElementById('partnerPortfolioHealthFill'),
  attributedUsers: document.getElementById('partnerAttributedUsers'),
  journeyPending: document.getElementById('partnerJourneyPending'),
  journeyActive: document.getElementById('partnerJourneyActive'),
  journeyRisk: document.getElementById('partnerJourneyRisk'),
  journeyInactive: document.getElementById('partnerJourneyInactive'),
  codesList: document.getElementById('partnerCodesList'),
  statusList: document.getElementById('partnerStatusList'),
  recentActivity: document.getElementById('partnerRecentActivity'),
};

const state = {
  initializedViewEvent: false,
  user: null,
  snapshot: null,
  selectedIndex: 0,
  loadPromise: null,
};

function track(name, params) {
  if (typeof site.trackEvent === 'function') {
    site.trackEvent(name, params || {});
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

function setView(name) {
  elements.views.forEach((view) => {
    view.hidden = view.dataset.partnerView !== name;
  });

  const signedIn = Boolean(state.user);
  if (elements.authSummary) {
    elements.authSummary.hidden = !signedIn;
  }
  if (elements.refreshButton) {
    elements.refreshButton.hidden = !signedIn || name !== 'ready';
  }
  if (elements.signOutButton) {
    elements.signOutButton.hidden = !signedIn;
  }

  if (!state.initializedViewEvent) {
    track('partner_web_portal_viewed', {
      initial_view: name,
    });
    state.initializedViewEvent = true;
  }
}

function showBanner(message, tone) {
  if (!elements.globalNotice) return;
  const text = String(message || '').trim();
  elements.globalNotice.hidden = !text;
  elements.globalNotice.textContent = text;
  elements.globalNotice.className = 'partner-banner';
  if (tone) {
    elements.globalNotice.classList.add(`partner-banner--${tone}`);
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

function isMissingCallableError(error) {
  const parts = getErrorParts(error);
  return (
    parts.code.includes('unimplemented')
    || parts.message.toLowerCase().includes('unimplemented')
    || parts.message.toLowerCase().includes('not found')
    || parts.message.toLowerCase().includes('no function')
  );
}

function formatTimestamp(ms) {
  const safeMs = Number(ms);
  if (!Number.isFinite(safeMs) || safeMs <= 0) return '-';
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(safeMs));
  } catch (_error) {
    return new Date(safeMs).toISOString();
  }
}

function formatRelativeTime(ms) {
  const safeMs = Number(ms);
  if (!Number.isFinite(safeMs) || safeMs <= 0) return '';
  const diffMs = Date.now() - safeMs;
  const absMs = Math.abs(diffMs);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (absMs < minute) return 'just now';
  if (absMs < hour) return `${Math.round(absMs / minute)} min ago`;
  if (absMs < day) return `${Math.round(absMs / hour)} h ago`;
  return `${Math.round(absMs / day)} d ago`;
}

function formatCount(value) {
  const safe = Number(value);
  return Number.isFinite(safe)
    ? new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(safe)
    : '0';
}

function formatPercent(value) {
  const safe = Number(value);
  if (!Number.isFinite(safe) || safe <= 0) return '0%';
  return `${(safe * 100).toFixed(1)}%`;
}

function formatMoneyMinor(amountMinor, currency) {
  const amount = Number(amountMinor);
  if (!Number.isFinite(amount)) return '-';
  const normalizedCurrency = String(currency || '').trim().toUpperCase();
  const major = amount / 100;
  if (/^[A-Z]{3}$/.test(normalizedCurrency)) {
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: normalizedCurrency,
      }).format(major);
    } catch (_error) {
      return `${major.toFixed(2)} ${normalizedCurrency}`;
    }
  }
  return major.toFixed(2);
}

function humanizeStatus(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return 'Unknown';
  return raw
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function toneForPartnerStatus(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'active') return 'success';
  if (raw === 'inactive' || raw === 'archived') return 'error';
  return 'info';
}

function toneForCodeStatus(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'active') return 'success';
  if (raw === 'inactive' || raw === 'archived') return 'error';
  return 'info';
}

function toneForActivity(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'initial_purchase' || raw === 'renewal') return 'success';
  if (raw === 'refund' || raw === 'revocation') return 'error';
  return 'info';
}

function normalizeInt(value) {
  const safe = Number(value);
  return Number.isFinite(safe) ? Math.round(safe) : 0;
}

function normalizePartnerSnapshot(raw) {
  const rawPartners = Array.isArray(raw?.partners) ? raw.partners : [];
  const partners = rawPartners
    .filter((item) => item && typeof item === 'object')
    .map((item) => {
      const summary = item.summary && typeof item.summary === 'object'
        ? item.summary
        : {};
      return {
        affiliateId: String(item.affiliateId || '').trim(),
        displayName: String(item.displayName || item.affiliateId || 'Partner').trim() || 'Partner',
        status: String(item.status || '').trim().toLowerCase() || 'active',
        primaryReferralCode: String(item.primaryReferralCode || '').trim(),
        contactName: String(item.contactName || '').trim(),
        contactEmail: String(item.contactEmail || '').trim(),
        portalEmail: String(item.portalEmail || '').trim(),
        updatedAtMs: normalizeInt(item.updatedAtMs),
        summary: {
          pendingReferrals: normalizeInt(summary.pendingReferrals),
          attributedUsers: normalizeInt(summary.attributedUsers),
          totalSubscribers: normalizeInt(summary.totalSubscribers),
          activeSubscribers: normalizeInt(summary.activeSubscribers),
          atRiskSubscribers: normalizeInt(summary.atRiskSubscribers),
          inactiveSubscribers: normalizeInt(summary.inactiveSubscribers),
          uncategorizedSubscribers: normalizeInt(summary.uncategorizedSubscribers),
          last30DayInitialPurchases: normalizeInt(summary.last30DayInitialPurchases),
          last30DayRenewals: normalizeInt(summary.last30DayRenewals),
          last30DayRefunds: normalizeInt(summary.last30DayRefunds),
          last30DayRevocations: normalizeInt(summary.last30DayRevocations),
          last30DayKnownCommissionTotalMinor: normalizeInt(summary.last30DayKnownCommissionTotalMinor),
          commissionCurrency: String(summary.commissionCurrency || '').trim(),
          allTimeInitialPurchases: normalizeInt(summary.allTimeInitialPurchases),
          allTimeRenewals: normalizeInt(summary.allTimeRenewals),
          allTimeRefunds: normalizeInt(summary.allTimeRefunds),
          allTimeRevocations: normalizeInt(summary.allTimeRevocations),
          activationRate: Number(summary.attributedUsers) > 0
            ? normalizeInt(summary.activeSubscribers) / normalizeInt(summary.attributedUsers)
            : 0,
          portfolioHealthRate: Number(summary.totalSubscribers) > 0
            ? normalizeInt(summary.activeSubscribers) / normalizeInt(summary.totalSubscribers)
            : 0,
        },
        codes: (Array.isArray(item.codes) ? item.codes : [])
          .filter((codeItem) => codeItem && typeof codeItem === 'object')
          .map((codeItem) => ({
            code: String(codeItem.code || '').trim(),
            displayName: String(codeItem.displayName || '').trim(),
            status: String(codeItem.status || '').trim().toLowerCase() || 'active',
          })),
        statusBreakdown: (Array.isArray(item.statusBreakdown) ? item.statusBreakdown : [])
          .filter((row) => row && typeof row === 'object')
          .map((row) => ({
            status: String(row.status || '').trim().toLowerCase(),
            count: normalizeInt(row.count),
          })),
        recentActivity: (Array.isArray(item.recentActivity) ? item.recentActivity : [])
          .filter((row) => row && typeof row === 'object')
          .map((row) => ({
            eventType: String(row.eventType || '').trim().toLowerCase() || 'unknown',
            referralCode: String(row.referralCode || '').trim(),
            occurredAtMs: normalizeInt(row.occurredAtMs),
            verificationState: String(row.verificationState || '').trim(),
            source: String(row.source || '').trim(),
            payoutStatus: String(row.payoutStatus || '').trim(),
            commissionAmountMinor: row.commissionAmountMinor == null ? null : normalizeInt(row.commissionAmountMinor),
            currency: String(row.currency || '').trim(),
          })),
      };
    })
    .filter((item) => item.affiliateId);

  return {
    accessible: raw?.accessible === true || partners.length > 0,
    generatedAtMs: normalizeInt(raw?.generatedAtMs),
    partners,
  };
}

function getSelectedPartner() {
  const partners = state.snapshot?.partners || [];
  if (!partners.length) return null;
  if (state.selectedIndex >= partners.length) {
    state.selectedIndex = 0;
  }
  return partners[state.selectedIndex] || partners[0];
}

function updateIdentity() {
  if (!elements.authSummary) return;
  const user = state.user;
  if (!user) {
    elements.authSummary.hidden = true;
    elements.authSummary.textContent = '';
    return;
  }

  const parts = [];
  if (user.displayName) parts.push(user.displayName);
  if (user.email) parts.push(user.email);
  if (!parts.length) parts.push('Signed in');
  elements.authSummary.hidden = false;
  elements.authSummary.textContent = parts.join(' | ');
}

function setAuthError(message) {
  if (!elements.authError) return;
  const text = String(message || '').trim();
  elements.authError.hidden = !text;
  elements.authError.textContent = text;
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

function renderPartnerSelector() {
  if (!elements.accountSelector) return;
  const partners = state.snapshot?.partners || [];
  if (partners.length <= 1) {
    elements.accountSelector.hidden = true;
    elements.accountSelector.innerHTML = '';
    return;
  }

  elements.accountSelector.hidden = false;
  elements.accountSelector.innerHTML = partners
    .map((partner, index) => {
      const active = index === state.selectedIndex;
      return `
        <button
          type="button"
          class="partner-selector__button${active ? ' is-active' : ''}"
          data-partner-index="${index}"
          aria-pressed="${active ? 'true' : 'false'}"
        >
          <span>${escapeHtml(partner.displayName)}</span>
          <small>${escapeHtml(partner.primaryReferralCode || partner.affiliateId)}</small>
        </button>
      `;
    })
    .join('');
}

function renderHero(partner) {
  if (!partner) return;
  if (elements.heroName) {
    elements.heroName.textContent = partner.displayName;
  }
  if (elements.heroCopy) {
    const primaryCode = partner.primaryReferralCode || partner.affiliateId;
    elements.heroCopy.textContent =
      `Aggregate partner performance for ${primaryCode}. This mirrors the Nuria app portal using the same linked account access.`;
  }
  if (elements.heroStatus) {
    elements.heroStatus.textContent = humanizeStatus(partner.status);
    elements.heroStatus.className = `partner-chip partner-chip--${toneForPartnerStatus(partner.status)}`;
  }
  if (elements.heroCode) {
    elements.heroCode.textContent = partner.primaryReferralCode || partner.affiliateId;
  }
  if (elements.heroEmail) {
    elements.heroEmail.textContent = partner.portalEmail || partner.contactEmail || state.user?.email || '-';
  }
  if (elements.heroUpdatedAt) {
    elements.heroUpdatedAt.textContent = formatTimestamp(partner.updatedAtMs);
  }
  if (elements.generatedAt) {
    elements.generatedAt.textContent = formatTimestamp(state.snapshot?.generatedAtMs);
  }
}

function renderMetrics(partner) {
  const summary = partner.summary;
  elements.activeSubscribers.textContent = formatCount(summary.activeSubscribers);
  elements.pendingReferrals.textContent = formatCount(summary.pendingReferrals);
  elements.atRiskSubscribers.textContent = formatCount(summary.atRiskSubscribers);
  elements.totalActivations.textContent = formatCount(summary.allTimeInitialPurchases);
  elements.last30Initial.textContent = formatCount(summary.last30DayInitialPurchases);
  elements.last30Renewals.textContent = formatCount(summary.last30DayRenewals);
  elements.last30Refunds.textContent = formatCount(summary.last30DayRefunds);
  elements.last30Revocations.textContent = formatCount(summary.last30DayRevocations);
  elements.attributedUsers.textContent = formatCount(summary.attributedUsers);
  elements.activationRate.textContent = formatPercent(summary.activationRate);
  elements.portfolioHealthRate.textContent = formatPercent(summary.portfolioHealthRate);
  elements.activationRateFill.style.width = `${Math.max(0, Math.min(100, summary.activationRate * 100))}%`;
  elements.portfolioHealthFill.style.width = `${Math.max(0, Math.min(100, summary.portfolioHealthRate * 100))}%`;

  const hasCommission = Boolean(
    summary.commissionCurrency || summary.last30DayKnownCommissionTotalMinor !== 0
  );
  elements.commissionCard.hidden = !hasCommission;
  if (hasCommission) {
    elements.trackedCommission.textContent = formatMoneyMinor(
      summary.last30DayKnownCommissionTotalMinor,
      summary.commissionCurrency
    );
  }
}

function renderJourney(partner) {
  const summary = partner.summary;
  if (elements.journeyPending) {
    elements.journeyPending.textContent = formatCount(summary.pendingReferrals);
  }
  if (elements.journeyActive) {
    elements.journeyActive.textContent = formatCount(summary.activeSubscribers);
  }
  if (elements.journeyRisk) {
    elements.journeyRisk.textContent = formatCount(summary.atRiskSubscribers);
  }
  if (elements.journeyInactive) {
    elements.journeyInactive.textContent = formatCount(summary.inactiveSubscribers);
  }
}

function renderCodes(partner) {
  if (!elements.codesList) return;
  if (!partner.codes.length) {
    elements.codesList.innerHTML = '<p class="partner-empty">No referral codes are linked to this partner yet.</p>';
    return;
  }

  elements.codesList.innerHTML = partner.codes
    .map((code) => {
      return `
        <div class="partner-code-card">
          <div>
            <strong>${escapeHtml(code.code)}</strong>
            <p>${escapeHtml(code.displayName || partner.displayName)}</p>
          </div>
          <span class="partner-chip partner-chip--${toneForCodeStatus(code.status)}">${escapeHtml(humanizeStatus(code.status))}</span>
        </div>
      `;
    })
    .join('');
}

function renderStatusBreakdown(partner) {
  if (!elements.statusList) return;
  if (!partner.statusBreakdown.length) {
    elements.statusList.innerHTML = '<p class="partner-empty">No subscriber status data is available yet.</p>';
    return;
  }

  const max = Math.max(...partner.statusBreakdown.map((item) => item.count), 1);
  elements.statusList.innerHTML = partner.statusBreakdown
    .map((item) => {
      const width = Math.max(10, Math.round((item.count / max) * 100));
      return `
        <div class="partner-status-row">
          <div class="partner-status-row__head">
            <span>${escapeHtml(humanizeStatus(item.status))}</span>
            <strong>${escapeHtml(formatCount(item.count))}</strong>
          </div>
          <div class="partner-status-row__track">
            <span class="partner-status-row__fill" style="width:${width}%"></span>
          </div>
        </div>
      `;
    })
    .join('');
}

function renderRecentActivity(partner) {
  if (!elements.recentActivity) return;
  if (!partner.recentActivity.length) {
    elements.recentActivity.innerHTML = '<p class="partner-empty">No recent activity has been recorded yet.</p>';
    return;
  }

  elements.recentActivity.innerHTML = partner.recentActivity
    .map((item) => {
      const metaParts = [];
      if (item.referralCode) metaParts.push(item.referralCode);
      if (item.source) metaParts.push(humanizeStatus(item.source));
      if (item.verificationState) metaParts.push(humanizeStatus(item.verificationState));
      if (item.payoutStatus) metaParts.push(humanizeStatus(item.payoutStatus));
      const when = item.occurredAtMs
        ? `${formatRelativeTime(item.occurredAtMs)} · ${formatTimestamp(item.occurredAtMs)}`
        : 'Timestamp unavailable';
      return `
        <div class="partner-activity-item">
          <div class="partner-activity-item__top">
            <span class="partner-chip partner-chip--${toneForActivity(item.eventType)}">${escapeHtml(humanizeStatus(item.eventType))}</span>
            <span class="partner-activity-item__time">${escapeHtml(when)}</span>
          </div>
          <p class="partner-activity-item__meta">${escapeHtml(metaParts.join(' · ') || 'Aggregate activity row')}</p>
          <strong class="partner-activity-item__value">${
            item.commissionAmountMinor == null
              ? 'Commission not tracked'
              : escapeHtml(formatMoneyMinor(item.commissionAmountMinor, item.currency))
          }</strong>
        </div>
      `;
    })
    .join('');
}

function renderPortal() {
  const partner = getSelectedPartner();
  if (!partner) return;
  renderPartnerSelector();
  renderHero(partner);
  renderMetrics(partner);
  renderJourney(partner);
  renderCodes(partner);
  renderStatusBreakdown(partner);
  renderRecentActivity(partner);
}

function getActionablePortalErrorMessage(error) {
  const parts = getErrorParts(error);
  const code = parts.code;
  const message = parts.message.toLowerCase();

  if (code === 'unauthenticated') {
    return 'Your session expired. Sign in again to continue.';
  }

  if (message.includes('app check') || code === 'failed-precondition') {
    return isAppCheckConfigured()
      ? 'Partner portal security check failed. Refresh the page and try again.'
      : 'Partner web access is not fully configured yet. Web App Check must be enabled for this site before partner stats can load.';
  }

  if (code === 'popup-closed-by-user') {
    return 'Google sign-in was closed before completing.';
  }

  if (code === 'popup-blocked') {
    return 'Browser popup blocking prevented Google sign-in. Allow popups and try again.';
  }

  if (code === 'wrong-password') {
    return 'Wrong password. Use password reset if you have not set one yet.';
  }

  if (code === 'invalid-credential' || code === 'invalid-login-credentials') {
    return 'Those sign-in details did not match a valid Nuria account. Try again or use password reset.';
  }

  if (code === 'user-not-found') {
    return 'No Nuria account exists for that email yet.';
  }

  if (code === 'invalid-email') {
    return 'Email format is invalid.';
  }

  if (code === 'network-request-failed') {
    return 'Network connection failed. Check your connection and try again.';
  }

  if (code === 'too-many-requests') {
    return 'Too many attempts. Wait a moment and try again.';
  }

  return parts.message;
}

async function callPartnerPortalCallable() {
  const callableNames = ['getAffiliatePartnerPortalWeb', 'getAffiliatePartnerPortal'];
  let lastError = null;
  for (const name of callableNames) {
    try {
      return await callFirebaseFunction(name, {});
    } catch (error) {
      lastError = error;
      if (!isMissingCallableError(error)) {
        throw error;
      }
    }
  }
  throw lastError || new Error('partner_portal_callable_missing');
}

async function loadPartnerPortal(options) {
  const settings = Object.assign({ force: false }, options || {});
  if (state.loadPromise && !settings.force) {
    return state.loadPromise;
  }

  const task = (async () => {
    clearBanner();
    setView('loading-portal');

    try {
      const data = await callPartnerPortalCallable();
      state.snapshot = normalizePartnerSnapshot(data);
      if (!state.snapshot.partners.length || state.snapshot.accessible !== true) {
        const user = state.user;
        const verificationNote = user && user.emailVerified === false
          ? ' This account email is not verified yet, so email-based fallback access will stay blocked until verification is complete.'
          : '';
        elements.unlinkedCopy.textContent =
          `Signed in as ${user?.email || 'this account'}, but no active partner profile is linked to it yet.${verificationNote} Ask the Nuria team to link your Nuria account email or UID in the partner admin.`;
        setView('unlinked');
        return;
      }

      if (state.selectedIndex >= state.snapshot.partners.length) {
        state.selectedIndex = 0;
      }
      renderPortal();
      setView('ready');
      track('partner_web_portal_loaded', {
        partner_count: state.snapshot.partners.length,
      });
    } catch (error) {
      const parts = getErrorParts(error);
      if (parts.code === 'permission-denied') {
        const user = state.user;
        elements.unlinkedCopy.textContent =
          `Signed in as ${user?.email || 'this account'}, but it is not linked to any active partner profile yet. Ask the Nuria team to connect your portal UID or verified email in the partner admin.`;
        showBanner(elements.unlinkedCopy.textContent, 'info');
        setView('unlinked');
        track('partner_web_portal_access_blocked', {
          reason: 'not_linked',
        });
        return;
      }

      if (parts.code === 'unauthenticated') {
        await signOutUser().catch(() => {});
        state.user = null;
        updateIdentity();
        showBanner('Your session expired. Sign in again to continue.', 'info');
        setView('signed-out');
        return;
      }

      const message = getActionablePortalErrorMessage(error);
      elements.errorCopy.textContent = message;
      showBanner(message, 'error');
      setView('error');
    } finally {
      state.loadPromise = null;
    }
  })();

  state.loadPromise = task;
  return task;
}

async function handleEmailSignIn(event) {
  event.preventDefault();
  clearBanner();
  setAuthError('');
  const email = String(elements.emailInput?.value || '').trim();
  const password = String(elements.emailSignInForm?.querySelector('[name="password"]')?.value || '');
  const submitButton = elements.emailSignInForm?.querySelector('button[type="submit"]');

  setButtonBusy(submitButton, true, 'Signing in');
  try {
    await waitForAuthPersistenceReady();
    await signInWithEmailPassword(email, password);
    track('partner_web_portal_login', {
      method: 'password',
    });
  } catch (error) {
    setAuthError(getActionablePortalErrorMessage(error));
  } finally {
    setButtonBusy(submitButton, false);
  }
}

async function handleGoogleSignIn() {
  clearBanner();
  setAuthError('');
  setButtonBusy(elements.googleSignInButton, true, 'Opening');
  try {
    await waitForAuthPersistenceReady();
    await signInWithGoogle();
    track('partner_web_portal_login', {
      method: 'google',
    });
  } catch (error) {
    setAuthError(getActionablePortalErrorMessage(error));
  } finally {
    setButtonBusy(elements.googleSignInButton, false);
  }
}

async function handlePasswordReset() {
  const email = String(elements.emailInput?.value || '').trim();
  if (!email) {
    setAuthError('Enter your linked Nuria email first, then use password reset.');
    return;
  }

  clearBanner();
  setAuthError('');
  setButtonBusy(elements.sendPasswordResetButton, true, 'Sending');
  try {
    await sendPasswordReset(email);
    showBanner('Password reset email sent. Use it to set or refresh your web password.', 'success');
    track('partner_web_portal_password_reset', {
      method: 'email',
    });
  } catch (error) {
    setAuthError(getActionablePortalErrorMessage(error));
  } finally {
    setButtonBusy(elements.sendPasswordResetButton, false);
  }
}

async function handleSignOut() {
  clearBanner();
  await signOutUser();
}

function applyLocationHints() {
  const params = new URLSearchParams(window.location.search || '');
  const email = String(params.get('email') || '').trim();
  if (email && elements.emailInput && !elements.emailInput.value) {
    elements.emailInput.value = email;
  }

  const loginHint = String(params.get('view') || '').trim().toLowerCase();
  if (loginHint === 'login') {
    window.requestAnimationFrame(() => {
      elements.emailInput?.focus();
    });
  }
}

function bindEvents() {
  elements.emailSignInForm?.addEventListener('submit', handleEmailSignIn);
  elements.googleSignInButton?.addEventListener('click', handleGoogleSignIn);
  elements.sendPasswordResetButton?.addEventListener('click', handlePasswordReset);
  elements.signOutButton?.addEventListener('click', handleSignOut);
  elements.signOutUnlinked?.addEventListener('click', handleSignOut);
  elements.retryLoad?.addEventListener('click', () => loadPartnerPortal({ force: true }));
  elements.refreshButton?.addEventListener('click', () => loadPartnerPortal({ force: true }));
  elements.accountSelector?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-partner-index]');
    if (!button) return;
    state.selectedIndex = Number(button.dataset.partnerIndex || 0);
    renderPortal();
  });
}

function handleAuthState(user) {
  state.user = user;
  state.snapshot = null;
  state.selectedIndex = 0;
  setAuthError('');
  updateIdentity();

  if (!user) {
    clearBanner();
    setView('signed-out');
    return;
  }

  loadPartnerPortal({ force: true });
}

applyLocationHints();
bindEvents();
setView('loading-auth');
waitForAuthPersistenceReady()
  .catch(() => {})
  .finally(() => {
    const user = getCurrentUser();
    if (user) {
      handleAuthState(user);
    }
    subscribeToAuthState(handleAuthState);
  });

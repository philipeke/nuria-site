'use strict';

// Web fallback for the https://nuria.one/dashboard universal link. On iOS/Android
// with the app installed the universal link opens Nuria directly (AASA / App Links
// + DeepLinkNavigationService route it to the dashboard tab). This page is what
// everyone else lands on — desktop browsers and mobile without the app installed —
// so the link never dead-ends on a 404. Mirrors js/subscribe.js.
(function () {
  const site = window.NuriaSite || {};
  const config = site.config || window.NURIA_SITE_CONFIG || {};
  const openButton = document.getElementById('dashboardOpenButton');
  const retryButton = document.getElementById('dashboardRetryButton');
  const status = document.getElementById('dashboardOpenStatus');

  const dashboardSchemeUrl = `${config.appScheme || 'nuria'}://dashboard`;

  function setStatus(message) {
    if (status) {
      status.textContent = message;
    }
  }

  function track(trigger) {
    if (typeof site.trackEvent === 'function') {
      site.trackEvent('dashboard_deep_link_opened', { trigger });
    }
  }

  function openDashboard(trigger) {
    track(trigger);
    setStatus('Opening Nuria...');
    window.location.href = dashboardSchemeUrl;

    window.setTimeout(() => {
      if (document.visibilityState === 'visible') {
        setStatus('If Nuria did not open, use the store buttons below or open Nuria manually.');
      }
    }, 1800);
  }

  function wireButton(button, trigger) {
    if (!button) return;
    button.href = dashboardSchemeUrl;
    button.addEventListener('click', (event) => {
      event.preventDefault();
      openDashboard(trigger);
    });
  }

  function isMobileDevice() {
    return /Android|iPhone|iPad|iPod/i.test(window.navigator.userAgent || '');
  }

  wireButton(openButton, 'primary_button');
  wireButton(retryButton, 'retry_button');

  // Only auto-launch the app scheme on mobile; on desktop it would just error.
  if (isMobileDevice()) {
    window.setTimeout(() => openDashboard('auto_mobile'), 450);
  }
}());

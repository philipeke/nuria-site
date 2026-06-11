'use strict';

(function () {
  const site = window.NuriaSite || {};
  const config = site.config || window.NURIA_SITE_CONFIG || {};
  const link = window.NuriaInviteLink || {};

  const code = typeof link.parseInviteCode === 'function'
    ? link.parseInviteCode(window.location)
    : '';
  const schemeUrl = typeof link.buildSchemeUrl === 'function'
    ? link.buildSchemeUrl(code, config.appScheme)
    : 'nuria://invite';

  const openButton = document.getElementById('inviteOpenButton');
  const retryButton = document.getElementById('inviteRetryButton');
  const status = document.getElementById('inviteOpenStatus');
  const codeTarget = document.getElementById('inviteCodeChip');

  if (code && codeTarget) {
    codeTarget.textContent = code;
    codeTarget.hidden = false;
  }

  function setStatus(message) {
    if (status) {
      status.textContent = message;
    }
  }

  function track(trigger) {
    if (typeof site.trackEvent === 'function') {
      site.trackEvent('invite_deep_link_opened', {trigger, has_code: !!code});
    }
  }

  function statusText(key, fallback) {
    const i18n = window.NuriaI18n || {};
    if (typeof i18n.t === 'function') {
      const value = i18n.t(key);
      if (value) return value;
    }
    return fallback;
  }

  function openInvite(trigger) {
    track(trigger);
    setStatus(statusText('invite.status_opening', 'Opening Nuria...'));
    window.location.href = schemeUrl;

    window.setTimeout(() => {
      if (document.visibilityState === 'visible') {
        setStatus(statusText(
          'invite.status_fallback',
          'If Nuria did not open, install it from the store buttons below — your invite is applied automatically on first launch.',
        ));
      }
    }, 1800);
  }

  function wireButton(button, trigger) {
    if (!button) return;
    button.href = schemeUrl;
    button.addEventListener('click', (event) => {
      event.preventDefault();
      openInvite(trigger);
    });
  }

  function isMobileDevice() {
    return /Android|iPhone|iPad|iPod/i.test(window.navigator.userAgent || '');
  }

  wireButton(openButton, 'primary_button');
  wireButton(retryButton, 'retry_button');

  if (code && isMobileDevice()) {
    window.setTimeout(() => openInvite('auto_mobile'), 450);
  }
}());

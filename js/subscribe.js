'use strict';

(function () {
  const site = window.NuriaSite || {};
  const config = site.config || window.NURIA_SITE_CONFIG || {};
  const openButton = document.getElementById('subscribeOpenButton');
  const retryButton = document.getElementById('subscribeRetryButton');
  const status = document.getElementById('subscribeOpenStatus');
  const campaignUrlTarget = document.getElementById('subscribeCampaignUrl');
  const schemeUrlTarget = document.getElementById('subscribeSchemeUrl');

  const subscribeUrl = typeof site.getSubscribeUrl === 'function'
    ? site.getSubscribeUrl()
    : `${config.siteOrigin || window.location.origin}/subscribe`;
  const subscribeSchemeUrl = typeof site.getSubscribeSchemeUrl === 'function'
    ? site.getSubscribeSchemeUrl()
    : `${config.appScheme || 'nuria'}://subscribe`;

  function setStatus(message) {
    if (status) {
      status.textContent = message;
    }
  }

  function track(trigger) {
    if (typeof site.trackEvent === 'function') {
      site.trackEvent('subscribe_deep_link_opened', { trigger });
    }
  }

  function openSubscribe(trigger) {
    track(trigger);
    setStatus('Opening Nuria...');
    window.location.href = subscribeSchemeUrl;

    window.setTimeout(() => {
      if (document.visibilityState === 'visible') {
        setStatus('If Nuria did not open, use the store buttons below or open Nuria manually.');
      }
    }, 1800);
  }

  function wireButton(button, trigger) {
    if (!button) return;
    button.href = subscribeSchemeUrl;
    button.addEventListener('click', (event) => {
      event.preventDefault();
      openSubscribe(trigger);
    });
  }

  function isMobileDevice() {
    return /Android|iPhone|iPad|iPod/i.test(window.navigator.userAgent || '');
  }

  if (campaignUrlTarget) {
    campaignUrlTarget.textContent = subscribeUrl;
  }

  if (schemeUrlTarget) {
    schemeUrlTarget.textContent = subscribeSchemeUrl;
  }

  wireButton(openButton, 'primary_button');
  wireButton(retryButton, 'retry_button');

  if (isMobileDevice()) {
    window.setTimeout(() => openSubscribe('auto_mobile'), 450);
  }
}());

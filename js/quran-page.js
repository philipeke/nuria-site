'use strict';

(function () {
  const site = window.NuriaSite || {};
  const config = site.config || window.NURIA_SITE_CONFIG || {};
  const link = window.NuriaQuranLink || {};

  const verse = typeof link.parseVerseFromLocation === 'function'
    ? link.parseVerseFromLocation(window.location)
    : null;
  const schemeUrl = typeof link.buildSchemeUrl === 'function'
    ? link.buildSchemeUrl(verse, config.appScheme)
    : 'nuria://quran';

  const openButton = document.getElementById('quranOpenButton');
  const retryButton = document.getElementById('quranRetryButton');
  const status = document.getElementById('quranOpenStatus');
  const referenceTarget = document.getElementById('quranVerseReference');

  if (verse && referenceTarget) {
    referenceTarget.textContent = `${verse.name} · ${verse.surah}:${verse.ayah}`;
    referenceTarget.hidden = false;
  }

  function setStatus(message) {
    if (status) {
      status.textContent = message;
    }
  }

  function track(trigger) {
    if (typeof site.trackEvent === 'function') {
      site.trackEvent('quran_deep_link_opened', {
        trigger,
        surah: verse ? verse.surah : 0,
        ayah: verse ? verse.ayah : 0,
      });
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

  function openVerse(trigger) {
    track(trigger);
    setStatus(statusText('quran.status_opening', 'Opening Nuria...'));
    window.location.href = schemeUrl;

    window.setTimeout(() => {
      if (document.visibilityState === 'visible') {
        setStatus(statusText(
          'quran.status_fallback',
          'If Nuria did not open, install it from the store buttons below and tap the link again.',
        ));
      }
    }, 1800);
  }

  function wireButton(button, trigger) {
    if (!button) return;
    button.href = schemeUrl;
    button.addEventListener('click', (event) => {
      event.preventDefault();
      openVerse(trigger);
    });
  }

  function isMobileDevice() {
    return /Android|iPhone|iPad|iPod/i.test(window.navigator.userAgent || '');
  }

  wireButton(openButton, 'primary_button');
  wireButton(retryButton, 'retry_button');

  if (verse && isMobileDevice()) {
    window.setTimeout(() => openVerse('auto_mobile'), 450);
  }
}());

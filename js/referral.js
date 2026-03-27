'use strict';

(function () {
  const site = window.NuriaSite;
  const page = document.querySelector('[data-referral-page]');

  if (!site || !page) {
    return;
  }

  const form = document.getElementById('referralLookupForm');
  const input = document.getElementById('referralCodeInput');
  const copyButton = document.getElementById('referralCopyButton');
  const copyStatus = document.getElementById('referralCopyStatus');
  const openInAppButton = document.getElementById('referralOpenInAppButton');
  const openInAppFallbackButton = document.getElementById('referralOpenInAppFallback');
  const invalidTitle = document.getElementById('referralInvalidTitle');
  const invalidBody = document.getElementById('referralInvalidBody');
  const loadingCode = document.getElementById('referralLoadingCode');
  const referralViews = Array.from(document.querySelectorAll('[data-referral-view]'));
  const affiliateNameTargets = Array.from(document.querySelectorAll('[data-affiliate-name]'));
  const referralCodeTargets = Array.from(document.querySelectorAll('[data-referral-code]'));
  const storeLinks = Array.from(document.querySelectorAll('[data-referral-store]'));

  let referralContext = {
    code: '',
    affiliateId: '',
    displayName: '',
    sourceRoute: getSourceRoute(),
  };

  function getSourceRoute() {
    const params = new URLSearchParams(window.location.search);

    if (params.get('route') === 'r') {
      return '/r/:code';
    }

    if ((window.location.pathname || '').toLowerCase().startsWith('/r/')) {
      return '/r/:code';
    }

    return '/join';
  }

  function setView(viewName) {
    referralViews.forEach(view => {
      view.hidden = view.dataset.referralView !== viewName;
    });

    page.dataset.referralState = viewName;
    page.setAttribute('aria-busy', viewName === 'loading' ? 'true' : 'false');
  }

  function syncReferralCode(code) {
    referralContext.code = code;

    if (input) {
      input.value = code;
    }

    if (openInAppButton) {
      openInAppButton.href = code ? site.getReferralJoinUrl(code) : `${site.config.siteOrigin}/join`;
    }

    if (openInAppFallbackButton) {
      openInAppFallbackButton.href = code ? site.getReferralSchemeUrl(code) : `${site.config.appScheme}://join`;
    }

    referralCodeTargets.forEach(target => {
      target.textContent = code || 'No code';
    });

    if (copyButton) {
      copyButton.dataset.code = code;
      copyButton.disabled = !code;
      copyButton.textContent = 'Copy code';
    }

    if (copyStatus) {
      copyStatus.textContent = '';
    }
  }

  function syncAffiliateName(name) {
    referralContext.displayName = name || '';

    affiliateNameTargets.forEach(target => {
      target.textContent = name || 'your community';
    });
  }

  function setDocumentTitle(title) {
    document.title = title;
  }

  function cleanJoinUrl(code) {
    const params = new URLSearchParams(window.location.search);

    if (code) {
      params.set('ref', code);
    } else {
      params.delete('ref');
    }

    params.delete('route');

    const nextSearch = params.toString();
    const nextUrl = nextSearch ? `/join?${nextSearch}` : '/join';

    if (`${window.location.pathname}${window.location.search}` !== nextUrl) {
      window.history.replaceState({}, '', nextUrl);
    }
  }

  function getEventPayload(extra) {
    return Object.assign({
      source_route: referralContext.sourceRoute,
      referral_code: referralContext.code || undefined,
      affiliate_id: referralContext.affiliateId || undefined,
      affiliate_name: referralContext.displayName || undefined,
    }, extra || {});
  }

  function setMissingState() {
    syncAffiliateName('');
    syncReferralCode('');
    setDocumentTitle('Referral Code | Nuria');
    setView('missing');
  }

  function setLoadingState(code) {
    syncReferralCode(code);
    setDocumentTitle('Checking Referral Code | Nuria');

    if (loadingCode) {
      loadingCode.textContent = code;
    }

    setView('loading');
  }

  function setValidState(payload) {
    const normalizedCode = site.normalizeReferralCode(payload.code || referralContext.code);
    const displayName = payload.displayName || 'your community';

    referralContext = Object.assign({}, referralContext, {
      code: normalizedCode,
      affiliateId: payload.affiliateId || '',
      displayName,
    });

    syncAffiliateName(displayName);
    syncReferralCode(normalizedCode);
    setDocumentTitle(`${displayName} Referral | Nuria`);
    setView('valid');
  }

  function getInvalidCopy(reason, code) {
    if (reason === 'lookup_failed') {
      return {
        title: 'We could not verify this code right now',
        body: 'The referral lookup is temporarily unavailable. Please try again in a moment, or continue from the main Nuria site.',
      };
    }

    if (reason === 'missing_code') {
      return {
        title: 'Enter a referral code to continue',
        body: 'Paste the code you received and we will verify it before you open the Nuria app.',
      };
    }

    return {
      title: 'This referral code is invalid or inactive',
      body: `We could not verify ${code}. Check the spelling, then try again or ask the organisation for an updated code.`,
    };
  }

  function setInvalidState(code, reason) {
    const copy = getInvalidCopy(reason, code);

    referralContext = Object.assign({}, referralContext, {
      code,
      affiliateId: '',
      displayName: '',
    });

    syncAffiliateName('');
    syncReferralCode(code);
    setDocumentTitle('Referral Code | Nuria');

    if (invalidTitle) {
      invalidTitle.textContent = copy.title;
    }

    if (invalidBody) {
      invalidBody.textContent = copy.body;
    }

    setView('invalid');
  }

  async function validateCode(rawCode) {
    const normalizedCode = site.normalizeReferralCode(rawCode);

    cleanJoinUrl(normalizedCode);

    if (!normalizedCode) {
      setMissingState();
      return;
    }

    setLoadingState(normalizedCode);

    try {
      const payload = await site.lookupAffiliateCode(normalizedCode);

      site.trackEvent('referral_code_validated', getEventPayload({
        valid: Boolean(payload && payload.valid),
        error: payload && payload.valid ? undefined : (payload && payload.error) || 'invalid',
      }));

      if (payload && payload.ok && payload.valid) {
        setValidState(payload);
        return;
      }

      setInvalidState(normalizedCode, (payload && payload.error) || 'invalid');
    } catch (error) {
      site.trackEvent('referral_code_validated', getEventPayload({
        valid: false,
        error: 'lookup_failed',
      }));

      setInvalidState(normalizedCode, 'lookup_failed');
    }
  }

  if (form && input) {
    form.addEventListener('submit', event => {
      event.preventDefault();
      validateCode(input.value);
    });
  }

  if (copyButton) {
    copyButton.addEventListener('click', async () => {
      const code = copyButton.dataset.code || referralContext.code;

      if (!code) {
        return;
      }

      try {
        await site.copyText(code);
        copyButton.textContent = 'Copied';

        if (copyStatus) {
          copyStatus.textContent = 'Referral code copied. Paste it inside Nuria before your first subscription purchase.';
        }

        site.trackEvent('referral_copy_code_clicked', getEventPayload());
      } catch (error) {
        if (copyStatus) {
          copyStatus.textContent = 'Copy failed on this device. Please select the code manually.';
        }
      }
    });
  }

  storeLinks.forEach(link => {
    link.addEventListener('click', () => {
      const isAppStore = link.dataset.referralStore === 'app-store';
      site.trackEvent(
        isAppStore ? 'referral_app_store_clicked' : 'referral_play_store_clicked',
        getEventPayload()
      );
    });
  });

  [openInAppButton, openInAppFallbackButton].filter(Boolean).forEach(link => {
    link.addEventListener('click', () => {
      site.trackEvent('referral_open_in_app_clicked', getEventPayload({
        open_target: link.dataset.referralOpen || 'unknown',
      }));
    });
  });

  const initialCode = site.getReferralCodeFromLocation(window.location);

  if (initialCode) {
    referralContext.code = initialCode;
  }

  site.trackEvent('referral_page_viewed', getEventPayload({
    has_referral_code: Boolean(initialCode),
  }));

  if (initialCode) {
    validateCode(initialCode);
  } else {
    setMissingState();
  }
}());

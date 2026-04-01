'use strict';

(function () {
  const site = window.NuriaSite;
  const referralFlow = window.NuriaReferralFlow || {};
  const page = document.querySelector('[data-referral-page]');

  if (!site || !page) {
    return;
  }

  const form = document.getElementById('referralLookupForm');
  const input = document.getElementById('referralCodeInput');
  const copyButtons = Array.from(document.querySelectorAll('[data-referral-copy]'));
  const copyStatus = document.getElementById('referralCopyStatus');
  const openInAppLinks = Array.from(document.querySelectorAll('[data-referral-open-link], #referralOpenInAppButton, #referralOpenInAppFallback')).filter(Boolean);
  const invalidTitle = document.getElementById('referralInvalidTitle');
  const invalidBody = document.getElementById('referralInvalidBody');
  const loadingCode = document.getElementById('referralLoadingCode');
  const retryLookupButton = document.getElementById('referralRetryLookupButton');
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
  let lastLookupCode = '';
  let lookupRequestId = 0;

  function getSourceRoute() {
    if (typeof site.getSourceRouteFromLocation === 'function') {
      return site.getSourceRouteFromLocation(window.location);
    }

    return '/join';
  }

  function setView(viewName) {
    if (typeof referralFlow.canTransitionReferralState === 'function') {
      const currentState = page.dataset.referralState || 'missing';
      if (!referralFlow.canTransitionReferralState(currentState, viewName)) {
        return;
      }
    }

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

    openInAppLinks.forEach(link => {
      const target = String(link.dataset.referralOpen || '');
      const isScheme = target.includes('scheme');
      link.href = code
        ? (isScheme ? site.getReferralSchemeUrl(code) : site.getReferralJoinUrl(code))
        : (isScheme ? `${site.config.appScheme}://join` : `${site.config.siteOrigin}/join`);
    });

    referralCodeTargets.forEach(target => {
      target.textContent = code || 'No code';
    });

    copyButtons.forEach(button => {
      button.dataset.code = code;
      button.disabled = !code;
      button.textContent = 'Copy code';
    });

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
    const currentPath = String(window.location.pathname || '');
    const prettyPathMatch = currentPath.match(/^\/(join|r)\/([^/?#]+)\/?$/i);
    if (prettyPathMatch) {
      const routeType = prettyPathMatch[1].toLowerCase();
      const pathCode = site.normalizeReferralCode(prettyPathMatch[2] || '');
      const normalizedCode = site.normalizeReferralCode(code || '');

      // Keep pretty URLs as the visible URL when they already carry the same code.
      if (normalizedCode && pathCode === normalizedCode) {
        if (routeType === 'r') {
          const params = new URLSearchParams(window.location.search || '');
          if (params.get('route') === 'r') {
            params.delete('route');
            const search = params.toString();
            const nextUrl = search ? `${currentPath}?${search}` : currentPath;
            window.history.replaceState({}, '', nextUrl);
          }
        }
        return;
      }
    }

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

  function isRetryableLookupReason(reason) {
    return reason === 'network_error' || reason === 'lookup_timeout' || reason === 'lookup_failed';
  }

  function getInvalidCopy(reason, code) {
    if (reason === 'lookup_timeout') {
      return {
        title: 'Referral check timed out',
        body: 'The verification request took too long. Please try again. Your copy and app links are still available below.',
      };
    }

    if (reason === 'network_error' || reason === 'lookup_failed') {
      return {
        title: 'We could not verify this code right now',
        body: 'The referral lookup service is temporarily unavailable. Check your connection, then retry in a few seconds.',
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

    if (retryLookupButton) {
      retryLookupButton.hidden = !isRetryableLookupReason(reason);
    }

    setView('invalid');
  }

  async function validateCode(rawCode) {
    const normalizedCode = site.normalizeReferralCode(rawCode);
    if (typeof referralFlow.shouldStartLookup === 'function'
      && !referralFlow.shouldStartLookup(page.dataset.referralState || 'missing', normalizedCode)) {
      if (!normalizedCode) {
        cleanJoinUrl('');
        setMissingState();
      }
      return;
    }

    const requestId = ++lookupRequestId;
    lastLookupCode = normalizedCode;

    cleanJoinUrl(normalizedCode);

    if (!normalizedCode) {
      setMissingState();
      return;
    }

    setLoadingState(normalizedCode);

    try {
      const payload = await site.lookupAffiliateCode(normalizedCode);
      if (requestId !== lookupRequestId) {
        return;
      }

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
      if (requestId !== lookupRequestId) {
        return;
      }

      site.trackEvent('referral_code_validated', getEventPayload({
        valid: false,
        error: 'network_error',
      }));

      setInvalidState(normalizedCode, 'network_error');
    }
  }

  if (form && input) {
    form.addEventListener('submit', event => {
      event.preventDefault();
      validateCode(input.value);
    });
  }

  copyButtons.forEach(copyButton => {
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
  });

  if (retryLookupButton) {
    retryLookupButton.addEventListener('click', () => {
      const retryCode = lastLookupCode || referralContext.code || (input ? input.value : '');
      if (!retryCode) {
        setMissingState();
        return;
      }
      validateCode(retryCode);
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

  openInAppLinks.forEach(link => {
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

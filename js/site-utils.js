'use strict';

(function () {
  const config = window.NURIA_SITE_CONFIG || {};

  function safeDecodeURIComponent(value) {
    try {
      return decodeURIComponent(value);
    } catch (error) {
      return value;
    }
  }

  function normalizeReferralCode(value) {
    return String(value || '')
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '');
  }

  function getReferralCodeFromLocation(locationLike) {
    const locationRef = locationLike || window.location;
    const params = new URLSearchParams(locationRef.search || '');
    const queryCode = normalizeReferralCode(params.get('ref') || '');

    if (queryCode) {
      return queryCode;
    }

    const path = locationRef.pathname || '';
    const match = path.match(/^\/r\/([^/?#]+)/i);

    return match ? normalizeReferralCode(safeDecodeURIComponent(match[1])) : '';
  }

  function updateStoreLinks(root) {
    const scope = root || document;

    scope.querySelectorAll('[data-store-link="app-store"]').forEach(link => {
      link.href = config.appStoreUrl;
    });

    scope.querySelectorAll('[data-store-link="google-play"]').forEach(link => {
      link.href = config.googlePlayUrl;
    });
  }

  function getReferralJoinUrl(code) {
    const normalizedCode = normalizeReferralCode(code);
    return `${config.siteOrigin}/join?ref=${encodeURIComponent(normalizedCode)}`;
  }

  function getReferralSchemeUrl(code) {
    const normalizedCode = normalizeReferralCode(code);
    return `${config.appScheme}://join?ref=${encodeURIComponent(normalizedCode)}`;
  }

  function trackEvent(name, params) {
    const detail = {
      name,
      params: params || {},
    };

    if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push(Object.assign({ event: name }, detail.params));
    }

    if (typeof window.gtag === 'function') {
      window.gtag('event', name, detail.params);
    }

    if (typeof window.plausible === 'function') {
      window.plausible(name, { props: detail.params });
    }

    window.dispatchEvent(new CustomEvent('nuria:analytics', { detail }));
  }

  async function copyText(text) {
    const value = String(text || '');

    if (!value) {
      return false;
    }

    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
      return true;
    }

    const helper = document.createElement('textarea');
    helper.value = value;
    helper.setAttribute('readonly', '');
    helper.style.position = 'fixed';
    helper.style.opacity = '0';
    helper.style.pointerEvents = 'none';

    document.body.appendChild(helper);
    helper.select();
    helper.setSelectionRange(0, helper.value.length);
    const copied = document.execCommand('copy');
    document.body.removeChild(helper);

    if (!copied) {
      throw new Error('copy_failed');
    }

    return true;
  }

  async function lookupAffiliateCode(code) {
    const normalizedCode = normalizeReferralCode(code);
    const url = new URL(config.affiliateLookupUrl);
    url.searchParams.set('code', normalizedCode);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    let payload = {};

    try {
      payload = await response.json();
    } catch (error) {
      payload = {};
    }

    if (!response.ok && !payload.error) {
      payload.error = 'lookup_failed';
    }

    return payload;
  }

  window.NuriaSite = Object.assign({}, window.NuriaSite, {
    config,
    normalizeReferralCode,
    getReferralCodeFromLocation,
    updateStoreLinks,
    getReferralJoinUrl,
    getReferralSchemeUrl,
    trackEvent,
    copyText,
    lookupAffiliateCode,
  });

  function initStoreLinks() {
    updateStoreLinks(document);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStoreLinks, { once: true });
  } else {
    initStoreLinks();
  }
}());

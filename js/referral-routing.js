(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
    return;
  }

  root.NuriaReferralRouting = factory();
}(typeof globalThis !== 'undefined' ? globalThis : window, function () {
  'use strict';

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

  function isLikelyValidReferralCode(value) {
    return /^[A-Z0-9_-]{3,64}$/.test(String(value || ''));
  }

  function extractPathCode(pathname) {
    const path = String(pathname || '');
    const match = path.match(/^\/(?:r|join)\/([^/?#]+)/i);
    if (!match) {
      return '';
    }

    return normalizeReferralCode(safeDecodeURIComponent(match[1]));
  }

  function getReferralCodeFromLocation(locationLike) {
    const locationRef = locationLike || {};
    const params = new URLSearchParams(locationRef.search || '');
    const queryCode = normalizeReferralCode(params.get('ref') || '');

    if (queryCode) {
      return queryCode;
    }

    return extractPathCode(locationRef.pathname || '');
  }

  function getSourceRouteFromLocation(locationLike) {
    const locationRef = locationLike || {};
    const params = new URLSearchParams(locationRef.search || '');

    if (params.get('route') === 'r') {
      return '/r/:code';
    }

    return String(locationRef.pathname || '').toLowerCase().startsWith('/r/')
      ? '/r/:code'
      : '/join';
  }

  function buildJoinRedirectUrl(locationLike) {
    const locationRef = locationLike || {};
    const path = String(locationRef.pathname || '');
    const routeMatch = path.match(/^\/(r|join)\/([^/?#]+)/i);

    if (!routeMatch) {
      return null;
    }

    const isRRoute = routeMatch[1].toLowerCase() === 'r';
    const normalizedCode = normalizeReferralCode(safeDecodeURIComponent(routeMatch[2]));
    const hasValidCode = isLikelyValidReferralCode(normalizedCode);
    const params = new URLSearchParams(locationRef.search || '');

    if (hasValidCode) {
      params.set('ref', normalizedCode);
    } else {
      params.delete('ref');
    }

    if (isRRoute && hasValidCode) {
      params.set('route', 'r');
    } else {
      params.delete('route');
    }

    const search = params.toString();
    return search ? '/join?' + search : '/join';
  }

  return {
    safeDecodeURIComponent: safeDecodeURIComponent,
    normalizeReferralCode: normalizeReferralCode,
    isLikelyValidReferralCode: isLikelyValidReferralCode,
    getReferralCodeFromLocation: getReferralCodeFromLocation,
    getSourceRouteFromLocation: getSourceRouteFromLocation,
    buildJoinRedirectUrl: buildJoinRedirectUrl,
  };
}));

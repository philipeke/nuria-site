(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
    return;
  }

  root.NuriaInviteLink = factory();
}(typeof globalThis !== 'undefined' ? globalThis : window, function () {
  'use strict';

  function safeDecodeURIComponent(value) {
    try {
      return decodeURIComponent(value);
    } catch (error) {
      return value;
    }
  }

  function normalizeInviteCode(value) {
    return String(value || '')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 64);
  }

  /// Accepts `?ref=CODE` / `?code=CODE` query params and `/invite/CODE`
  /// paths. Returns the normalized code or ''.
  function parseInviteCode(locationLike) {
    const locationRef = locationLike || {};
    const params = new URLSearchParams(locationRef.search || '');
    const queryCode = normalizeInviteCode(
      params.get('ref') || params.get('code') || '',
    );
    if (queryCode) return queryCode;

    const path = String(locationRef.pathname || '');
    const match = path.match(/^\/invite\/([^/?#]+)/i);
    if (!match) return '';
    return normalizeInviteCode(safeDecodeURIComponent(match[1]));
  }

  /// 404 helper: turns `/invite/CODE` into `/invite/?ref=CODE`. Returns null
  /// for non-invite paths so other 404 routing keeps working.
  function buildInviteRedirectUrl(locationLike) {
    const locationRef = locationLike || {};
    const path = String(locationRef.pathname || '');
    if (!/^\/invite\//i.test(path)) return null;

    const code = parseInviteCode(locationRef);
    if (!code) return '/invite/';
    return `/invite/?ref=${code}`;
  }

  function buildSchemeUrl(code, scheme) {
    const appScheme = scheme || 'nuria';
    const normalized = normalizeInviteCode(code);
    if (!normalized) return `${appScheme}://invite`;
    return `${appScheme}://invite?ref=${normalized}`;
  }

  return {
    normalizeInviteCode,
    parseInviteCode,
    buildInviteRedirectUrl,
    buildSchemeUrl,
  };
}));

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
    return;
  }

  root.NuriaReferralFlow = factory();
}(typeof globalThis !== 'undefined' ? globalThis : window, function () {
  'use strict';

  var KNOWN_STATES = ['missing', 'loading', 'valid', 'invalid'];

  function normalizeState(value) {
    var next = String(value || '').trim().toLowerCase();
    return KNOWN_STATES.indexOf(next) >= 0 ? next : 'missing';
  }

  function canTransitionReferralState(fromState, toState) {
    var from = normalizeState(fromState);
    var to = normalizeState(toState);

    if (from === 'loading' && to === 'loading') {
      return false;
    }

    return true;
  }

  function shouldStartLookup(currentState, normalizedCode) {
    if (normalizeState(currentState) === 'loading') {
      return false;
    }

    return Boolean(String(normalizedCode || '').trim());
  }

  return {
    normalizeState: normalizeState,
    canTransitionReferralState: canTransitionReferralState,
    shouldStartLookup: shouldStartLookup,
  };
}));

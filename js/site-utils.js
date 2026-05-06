'use strict';

(function () {
  const config = window.NURIA_SITE_CONFIG || {};
  const routing = window.NuriaReferralRouting || {};
  const normalizeWithFallback = routing.normalizeReferralCode || function (value) {
    return String(value || '')
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '');
  };
  const getCodeFromLocationWithFallback = routing.getReferralCodeFromLocation || function (locationLike) {
    const locationRef = locationLike || window.location;
    const params = new URLSearchParams(locationRef.search || '');
    const queryCode = normalizeWithFallback(params.get('ref') || '');

    if (queryCode) {
      return queryCode;
    }

    const path = locationRef.pathname || '';
    const match = path.match(/^\/r\/([^/?#]+)/i) || path.match(/^\/join\/([^/?#]+)/i);
    return match ? normalizeWithFallback(safeDecodeURIComponent(match[1])) : '';
  };
  const getSourceRouteWithFallback = routing.getSourceRouteFromLocation || function (locationLike) {
    const locationRef = locationLike || window.location;
    const params = new URLSearchParams(locationRef.search || '');

    if (params.get('route') === 'r') {
      return '/r/:code';
    }

    const path = String(locationRef.pathname || '').toLowerCase();
    return path.startsWith('/r/') ? '/r/:code' : '/join';
  };

  function safeDecodeURIComponent(value) {
    try {
      return decodeURIComponent(value);
    } catch (error) {
      return value;
    }
  }

  function normalizeReferralCode(value) {
    return normalizeWithFallback(value);
  }

  function getReferralCodeFromLocation(locationLike) {
    return getCodeFromLocationWithFallback(locationLike || window.location);
  }

  function getSourceRouteFromLocation(locationLike) {
    return getSourceRouteWithFallback(locationLike || window.location);
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
    return `${config.siteOrigin}/join/${encodeURIComponent(normalizedCode)}`;
  }

  function getReferralSchemeUrl(code) {
    const normalizedCode = normalizeReferralCode(code);
    return `${config.appScheme}://join?ref=${encodeURIComponent(normalizedCode)}`;
  }

  const COOKIE_CONSENT_KEY = 'nuria_cookie_consent_v1';

  function getCookieConsentStatus() {
    if (window.NuriaConsent && typeof window.NuriaConsent.getStatus === 'function') {
      return window.NuriaConsent.getStatus();
    }
    try {
      return window.localStorage.getItem(COOKIE_CONSENT_KEY) || '';
    } catch (error) {
      return '';
    }
  }

  function isAnalyticsAllowed() {
    return getCookieConsentStatus() === 'accepted';
  }

  const GA_SCRIPT_ID = 'nuria-google-analytics';
  let gaBootstrapPromise = null;

  function getMeasurementId() {
    return String((config.firebase && config.firebase.measurementId) || '').trim();
  }

  function ensureAnalyticsQueue() {
    window.dataLayer = window.dataLayer || [];
    if (typeof window.gtag !== 'function') {
      window.gtag = function gtag() {
        window.dataLayer.push(arguments);
      };
    }
  }

  function updateGoogleAnalyticsConsent(isAllowed) {
    const measurementId = getMeasurementId();
    if (!measurementId) {
      return;
    }

    window[`ga-disable-${measurementId}`] = !isAllowed;

    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        analytics_storage: isAllowed ? 'granted' : 'denied',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
      });
    }
  }

  function bootstrapGoogleAnalytics() {
    const measurementId = getMeasurementId();
    if (!measurementId) {
      return Promise.resolve(false);
    }

    if (gaBootstrapPromise) {
      return gaBootstrapPromise;
    }

    ensureAnalyticsQueue();
    updateGoogleAnalyticsConsent(isAnalyticsAllowed());

    window.gtag('consent', 'default', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      send_page_view: true,
      anonymize_ip: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      client_storage: 'none',
      page_title: document.title,
      page_path: `${window.location.pathname}${window.location.search}`,
      page_location: window.location.href,
    });

    const existingScript = document.getElementById(GA_SCRIPT_ID);
    if (existingScript) {
      gaBootstrapPromise = Promise.resolve(true);
      return gaBootstrapPromise;
    }

    gaBootstrapPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.id = GA_SCRIPT_ID;
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
      script.addEventListener('load', () => resolve(true), { once: true });
      script.addEventListener('error', () => reject(new Error('ga_load_failed')), { once: true });
      document.head.appendChild(script);
    }).catch((error) => {
      gaBootstrapPromise = null;
      throw error;
    });

    return gaBootstrapPromise;
  }

  function initAnalytics() {
    updateGoogleAnalyticsConsent(isAnalyticsAllowed());

    if (!isAnalyticsAllowed()) {
      return;
    }

    bootstrapGoogleAnalytics().catch(() => {
      // Ignore analytics bootstrap errors so page UX keeps working.
    });
  }

  window.addEventListener('nuria:cookie-consent-changed', function (event) {
    const status = String(event?.detail?.status || getCookieConsentStatus() || '').trim();
    const isAllowed = status === 'accepted';
    updateGoogleAnalyticsConsent(isAllowed);

    if (!isAllowed) {
      return;
    }

    bootstrapGoogleAnalytics().catch(() => {
      // Ignore analytics bootstrap errors so page UX keeps working.
    });
  });

  const SITE_THEME_STORAGE_KEY = 'nuria-site-theme';
  const SITE_THEME_CLASS = 'theme-luxury-stone';
  const SITE_THEMES = {
    classic: {
      id: 'classic',
      label: 'Classic',
      meta: '#050c08',
    },
    stone: {
      id: 'stone',
      label: 'Luxury Stone',
      meta: '#efe3c9',
    },
  };
  let themeBooted = false;

  function getStoredSiteTheme() {
    try {
      return window.localStorage.getItem(SITE_THEME_STORAGE_KEY) === SITE_THEMES.stone.id
        ? SITE_THEMES.stone.id
        : SITE_THEMES.classic.id;
    } catch (error) {
      return SITE_THEMES.classic.id;
    }
  }

  function setStoredSiteTheme(theme) {
    try {
      window.localStorage.setItem(SITE_THEME_STORAGE_KEY, theme);
    } catch (error) {
      // Storage can fail in private contexts; visual theme still applies.
    }
  }

  function getRequestedSiteTheme() {
    try {
      const theme = new URLSearchParams(window.location.search || '').get('theme');
      if (theme === SITE_THEMES.stone.id || theme === 'barakah' || theme === 'luxury-stone') {
        return SITE_THEMES.stone.id;
      }
      if (theme === SITE_THEMES.classic.id) {
        return SITE_THEMES.classic.id;
      }
    } catch (error) {
      return '';
    }
    return '';
  }

  function getPageClassName() {
    const path = window.location.pathname
      .replace(/\/index\.html$/i, '/')
      .split('/')
      .filter(Boolean);
    const firstSegment = path[0] || 'home';
    const normalized = firstSegment === '404.html'
      ? 'notfound'
      : firstSegment.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
    return `page-${normalized}`;
  }

  function applySitePageClass() {
    if (document.body) {
      document.body.classList.add(getPageClassName());
    }
  }

  function applySiteTheme(theme) {
    const isStone = theme === SITE_THEMES.stone.id;
    const activeTheme = isStone ? SITE_THEMES.stone : SITE_THEMES.classic;
    document.documentElement.dataset.theme = activeTheme.id;

    if (document.body) {
      document.body.classList.toggle(SITE_THEME_CLASS, isStone);
    }

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', activeTheme.meta);
    }

    document.querySelectorAll('[data-site-theme-option]').forEach(button => {
      const active = button.dataset.siteThemeOption === activeTheme.id;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    document.querySelectorAll('.nav__theme-current').forEach(label => {
      label.textContent = activeTheme.label;
    });

    document.querySelectorAll('.nav__theme-btn').forEach(button => {
      button.setAttribute('aria-label', `Theme: ${activeTheme.label}`);
    });
  }

  function closeAllThemeMenus() {
    document.querySelectorAll('.nav__theme.open').forEach(wrapper => {
      wrapper.classList.remove('open');
      const button = wrapper.querySelector('.nav__theme-btn');
      if (button) {
        button.setAttribute('aria-expanded', 'false');
      }
    });
  }

  function buildThemeSwitcher(container) {
    if (!container || container.querySelector('.nav__theme')) {
      return;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'nav__theme';
    wrapper.innerHTML = [
      '<button type="button" class="nav__theme-btn" aria-haspopup="true" aria-expanded="false">',
      '  <span class="nav__theme-swatch" aria-hidden="true"></span>',
      '  <span class="nav__theme-current">Classic</span>',
      '  <span class="nav__theme-chevron" aria-hidden="true">▼</span>',
      '</button>',
      '<div class="nav__theme-dropdown" role="group" aria-label="Theme selection">',
      '  <button type="button" class="nav__theme-option" data-site-theme-option="classic" aria-pressed="false">',
      '    <span class="nav__theme-dot nav__theme-dot--classic" aria-hidden="true"></span>',
      '    <span><strong>Classic</strong><small>Deep green and gold</small></span>',
      '  </button>',
      '  <button type="button" class="nav__theme-option" data-site-theme-option="stone" aria-pressed="false">',
      '    <span class="nav__theme-dot nav__theme-dot--stone" aria-hidden="true"></span>',
      '    <span><strong>Barakah Luxury Stone</strong><small>Warm stone, emerald and gold</small></span>',
      '  </button>',
      '</div>',
    ].join('');

    const navTarget = container.querySelector('.nav__lang') || container.querySelector('.nav__hamburger');
    if (navTarget) {
      container.insertBefore(wrapper, navTarget);
    } else {
      container.appendChild(wrapper);
    }

    const button = wrapper.querySelector('.nav__theme-btn');
    button.addEventListener('click', function (event) {
      event.stopPropagation();
      const open = wrapper.classList.toggle('open');
      button.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    wrapper.querySelectorAll('[data-site-theme-option]').forEach(option => {
      option.addEventListener('click', function (event) {
        event.stopPropagation();
        const theme = option.dataset.siteThemeOption === SITE_THEMES.stone.id
          ? SITE_THEMES.stone.id
          : SITE_THEMES.classic.id;
        setStoredSiteTheme(theme);
        applySiteTheme(theme);
        closeAllThemeMenus();
      });
    });

    wrapper.addEventListener('click', event => event.stopPropagation());
  }

  function initSiteTheme() {
    applySitePageClass();
    document
      .querySelectorAll('.nav__container, .partner-topbar__actions, .admin-topbar__actions')
      .forEach(buildThemeSwitcher);
    const requestedTheme = getRequestedSiteTheme();
    const activeTheme = requestedTheme || getStoredSiteTheme();
    if (requestedTheme) {
      setStoredSiteTheme(requestedTheme);
    }
    applySiteTheme(activeTheme);

    if (!themeBooted) {
      document.addEventListener('click', closeAllThemeMenus);
      themeBooted = true;
    }
  }

  function trackEvent(name, params) {
    if (!isAnalyticsAllowed()) {
      return;
    }

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
    if (!normalizedCode) {
      return {
        ok: false,
        valid: false,
        error: 'missing_code',
      };
    }

    const url = new URL(config.affiliateLookupUrl);
    url.searchParams.set('code', normalizedCode);
    const timeoutMs = Number(config.affiliateLookupTimeoutMs) > 0
      ? Number(config.affiliateLookupTimeoutMs)
      : 8000;
    const canAbort = typeof AbortController !== 'undefined';
    const controller = canAbort ? new AbortController() : null;
    let timeoutId = null;

    if (controller) {
      timeoutId = window.setTimeout(() => {
        controller.abort();
      }, timeoutMs);
    }

    let response;
    try {
      response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        cache: 'no-store',
        signal: controller ? controller.signal : undefined,
      });
    } catch (error) {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }

      if (error?.name === 'AbortError') {
        return {
          ok: false,
          valid: false,
          error: 'lookup_timeout',
        };
      }

      return {
        ok: false,
        valid: false,
        error: 'network_error',
      };
    }

    if (timeoutId) {
      window.clearTimeout(timeoutId);
    }

    let payload = {};

    try {
      payload = await response.json();
    } catch (error) {
      payload = {};
    }

    if (!response.ok && !payload.error) {
      payload.error = 'lookup_failed';
    }

    if (!response.ok) {
      return Object.assign(
        {
          ok: false,
          valid: false,
        },
        payload
      );
    }

    return Object.assign(
      {
        ok: true,
        valid: payload.valid === true,
      },
      payload
    );
  }

  window.NuriaSite = Object.assign({}, window.NuriaSite, {
    config,
    normalizeReferralCode,
    getReferralCodeFromLocation,
    getSourceRouteFromLocation,
    updateStoreLinks,
    getReferralJoinUrl,
    getReferralSchemeUrl,
    trackEvent,
    copyText,
    lookupAffiliateCode,
    applySiteTheme,
    initSiteTheme,
  });

  function handleStoreLinkClick(event) {
    const link = event.target.closest('[data-store-link]');
    if (!link) {
      return;
    }

    const store = String(link.getAttribute('data-store-link') || '').trim();
    if (!store) {
      return;
    }

    trackEvent('site_store_clicked', {
      store,
      href: link.href || '',
      page_path: window.location.pathname || '/',
    });
  }

  function initStoreLinks() {
    updateStoreLinks(document);
    document.addEventListener('click', handleStoreLinkClick);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initStoreLinks();
      initSiteTheme();
    }, { once: true });
  } else {
    initStoreLinks();
    initSiteTheme();
  }

  initAnalytics();
}());

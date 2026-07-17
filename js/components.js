(function () {
  'use strict';

  var IG_SVG = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zm0 1.62c-3.14 0-3.51.01-4.75.07-1.15.05-1.77.24-2.18.4-.55.21-.94.47-1.35.88-.41.41-.67.8-.88 1.35-.16.41-.35 1.03-.4 2.18-.06 1.24-.07 1.61-.07 4.75s.01 3.51.07 4.75c.05 1.15.24 1.77.4 2.18.21.55.47.94.88 1.35.41.41.8.67 1.35.88.41.16 1.03.35 2.18.4 1.24.06 1.61.07 4.75.07s3.51-.01 4.75-.07c1.15-.05 1.77-.24 2.18-.4.55-.21.94-.47 1.35-.88.41-.41.67-.8.88-1.35.16-.41.35-1.03.4-2.18.06-1.24.07-1.61.07-4.75s-.01-3.51-.07-4.75c-.05-1.15-.24-1.77-.4-2.18a3.64 3.64 0 0 0-.88-1.35 3.64 3.64 0 0 0-1.35-.88c-.41-.16-1.03-.35-2.18-.4-1.24-.06-1.61-.07-4.75-.07zm0 2.76a5.3 5.3 0 1 1 0 10.6 5.3 5.3 0 0 1 0-10.6zm0 1.62a3.68 3.68 0 1 0 0 7.36 3.68 3.68 0 0 0 0-7.36zm5.5-1.5a1.24 1.24 0 1 1-2.48 0 1.24 1.24 0 0 1 2.48 0z"/></svg>';
  var TT_SVG  = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.6 5.82a4.28 4.28 0 0 1-1.05-2.82h-3.2v12.93a2.59 2.59 0 0 1-2.59 2.5 2.59 2.59 0 1 1 .78-5.05V8.1a5.86 5.86 0 0 0-.78-.05A5.78 5.78 0 1 0 15.34 13.8V8.79a7.5 7.5 0 0 0 4.36 1.4V7a4.28 4.28 0 0 1-3.1-1.18z"/></svg>';
  var LI_SVG  = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14zM8.34 18.34V9.99H5.67v8.35h2.67zM7 8.8a1.55 1.55 0 1 0 0-3.1 1.55 1.55 0 0 0 0 3.1zm11.34 9.54v-4.58c0-2.45-1.31-3.59-3.06-3.59a2.64 2.64 0 0 0-2.39 1.31v-1.13h-2.67v8.35h2.67v-4.41c0-1.16.22-2.29 1.66-2.29 1.42 0 1.44 1.33 1.44 2.36v4.34h2.68z"/></svg>';

  var SOCIAL_NAV =
    '<div class="social-links social-links--nav" data-i18n-aria-label="a11y.social" aria-label="Nuria on social media">' +
      '<a class="social-links__item" href="https://www.instagram.com/nuria_app/" target="_blank" rel="noopener noreferrer" aria-label="Nuria on Instagram">' + IG_SVG + '</a>' +
      '<a class="social-links__item" href="https://www.tiktok.com/@nuria_app" target="_blank" rel="noopener noreferrer" aria-label="Nuria on TikTok">' + TT_SVG + '</a>' +
      '<a class="social-links__item" href="https://www.linkedin.com/company/nuria-app/" target="_blank" rel="noopener noreferrer" aria-label="Nuria on LinkedIn">' + LI_SVG + '</a>' +
    '</div>';

  var LANG_SWITCHER =
    '<div class="nav__lang" id="langSwitcher">' +
      '<button class="nav__lang-btn" id="langBtn" aria-haspopup="true" aria-expanded="false">' +
        '<span class="lang-flag" id="langFlag">🇬🇧</span>' +
        '<span class="lang-code" id="langCode">EN</span>' +
        '<span class="lang-chevron">▼</span>' +
      '</button>' +
      '<div class="nav__lang-dropdown" id="langDropdown" role="listbox">' +
        '<button class="nav__lang-option" data-lang="en" role="option"><span class="opt-flag">🇬🇧</span><span class="opt-name">English</span></button>' +
        '<button class="nav__lang-option" data-lang="ar" role="option"><span class="opt-flag">🇸🇦</span><span class="opt-name">العربية</span></button>' +
        '<button class="nav__lang-option" data-lang="ur" role="option"><span class="opt-flag">🇵🇰</span><span class="opt-name">اردو</span></button>' +
        '<button class="nav__lang-option" data-lang="id" role="option"><span class="opt-flag">🇮🇩</span><span class="opt-name">Indonesia</span></button>' +
        '<button class="nav__lang-option" data-lang="fr" role="option"><span class="opt-flag">🇫🇷</span><span class="opt-name">Français</span></button>' +
        '<button class="nav__lang-option" data-lang="tr" role="option"><span class="opt-flag">🇹🇷</span><span class="opt-name">Türkçe</span></button>' +
        '<button class="nav__lang-option" data-lang="ru" role="option"><span class="opt-flag">🇷🇺</span><span class="opt-name">Русский</span></button>' +
      '</div>' +
    '</div>';

  // Global NuriaOne launcher — the same markup lives inline in the homepage nav
  // (index.html); here it rides the injected nav used on every other page.
  var NURIA_LAUNCH =
    '<button class="nuria-launch" data-nuria-launch type="button" aria-haspopup="dialog" aria-controls="nuriaOneModal" data-i18n-aria-label="nuriaone.launch_aria" aria-label="Open NuriaOne, our Islamic AI assistant">' +
      '<span class="nuria-launch__orb" aria-hidden="true">' +
        '<span class="nuria-launch__orb-core"></span>' +
        '<span class="nuria-launch__orb-ring"></span>' +
        '<span class="nuria-launch__spark"></span>' +
      '</span>' +
      '<span class="nuria-launch__label">' +
        '<span class="nuria-launch__name" data-i18n="nuriaone.launch_name">NuriaOne</span>' +
        '<span class="nuria-launch__tag" data-i18n="nuriaone.launch_tag">Ask the AI</span>' +
      '</span>' +
    '</button>';

  var NAV_HTML =
    '<nav class="nav scrolled" id="nav" role="navigation" data-i18n-aria-label="a11y.nav_main" aria-label="Main navigation">' +
      '<div class="nav__container">' +
        '<a href="/" class="nav__logo" data-i18n-aria-label="a11y.nav_home" aria-label="Nuria — Home">' +
          '<span class="nav__logo-img" aria-hidden="true"></span>' +
        '</a>' +
        '<div class="nav__links" id="navLinks">' +
          '<div class="nav__app" id="navApp">' +
            '<button class="nav__app-btn" id="appMenuBtn" aria-haspopup="true" aria-expanded="false">' +
              '<span data-i18n="nav.app">App</span><span class="nav__app-chevron" aria-hidden="true">▾</span>' +
            '</button>' +
            '<div class="nav__app-dropdown" id="appMenuDropdown" role="menu">' +
              '<a href="/#about"      class="nav__app-item" role="menuitem" data-i18n="nav.about">About</a>' +
              '<a href="/#daily"      class="nav__app-item" role="menuitem" data-i18n="nav.daily">Daily</a>' +
              '<a href="/#release"    class="nav__app-item" role="menuitem" data-i18n="nav.release">What\'s New</a>' +
              '<a href="/#categories" class="nav__app-item" role="menuitem" data-i18n="nav.categories">Reflections</a>' +
              '<a href="/#pricing"    class="nav__app-item" role="menuitem" data-i18n="nav.plans">Plans</a>' +
            '</div>' +
          '</div>' +
          '<span class="nav__sep" aria-hidden="true"></span>' +
          '<a href="/about"   class="nav__link" data-i18n="nav.company">Company</a>' +
          '<a href="/blog"    class="nav__link" data-i18n="nav.blog">Blog</a>' +
          '<a href="/support" class="nav__link" data-i18n="nav.support">Support</a>' +
        '</div>' +
        NURIA_LAUNCH +
        '<div class="nav__cta">' +
          '<a href="/#download" class="btn btn--gold" data-i18n="nav.download">Download</a>' +
        '</div>' +
        LANG_SWITCHER +
        SOCIAL_NAV +
        '<button class="nav__hamburger" id="hamburger" data-i18n-aria-label="a11y.open_menu" aria-label="Open menu" aria-expanded="false">' +
          '<span></span><span></span><span></span>' +
        '</button>' +
      '</div>' +
    '</nav>';

  var SOCIAL_FOOTER =
    '<div class="social-links footer__social" data-i18n-aria-label="a11y.social" aria-label="Nuria on social media">' +
      '<a class="social-links__item" href="https://www.instagram.com/nuria_app/" target="_blank" rel="noopener noreferrer" aria-label="Nuria on Instagram">' + IG_SVG + '</a>' +
      '<a class="social-links__item" href="https://www.tiktok.com/@nuria_app" target="_blank" rel="noopener noreferrer" aria-label="Nuria on TikTok">' + TT_SVG + '</a>' +
      '<a class="social-links__item" href="https://www.linkedin.com/company/nuria-app/" target="_blank" rel="noopener noreferrer" aria-label="Nuria on LinkedIn">' + LI_SVG + '</a>' +
    '</div>';

  var FOOTER_HTML =
    '<footer class="footer" role="contentinfo">' +
      '<div class="container">' +
        '<div class="footer__top">' +
          '<div class="footer__brand">' +
            '<span class="footer__logo-wrap"><span class="footer__logo" role="img" aria-label="Nuria"></span></span>' +
            '<p class="footer__tagline" data-i18n="footer.tagline">Light for the Muslim soul — every single day.</p>' +
            '<p class="footer__bismillah" lang="ar">الله أكبر</p>' +
            SOCIAL_FOOTER +
          '</div>' +
          '<nav class="footer__links" data-i18n-aria-label="a11y.footer_nav" aria-label="Footer navigation">' +
            '<div class="footer__col">' +
              '<span class="footer__col-title" data-i18n="footer.col1">App</span>' +
              '<a href="/#about"      data-i18n="footer.about">About Nuria</a>' +
              '<a href="/blog"        data-i18n="footer.blog">Blog</a>' +
              '<a href="/#categories" data-i18n="nav.categories">Reflections</a>' +
              '<a href="/#pricing"    data-i18n="footer.plans">Plans</a>' +
              '<a href="/#download"   data-i18n="footer.dl">Download</a>' +
            '</div>' +
            '<div class="footer__col">' +
              '<span class="footer__col-title" data-i18n="footer.col_site">Site</span>' +
              '<a href="/about"       data-i18n="footer.company">Company</a>' +
              '<a href="/ask">NuriaOne</a>' +
              '<a href="/join"        data-i18n="footer.partner">Nuria Partner</a>' +
            '</div>' +
            '<div class="footer__col">' +
              '<span class="footer__col-title" data-i18n="footer.col2">Legal</span>' +
              '<a href="/sources"        data-i18n="footer.sources">Sources</a>' +
              '<a href="/privacy"        data-i18n="footer.privacy">Privacy Policy</a>' +
              '<a href="/terms"          data-i18n="footer.terms">Terms of Service</a>' +
              '<a href="/cookies"        data-i18n="footer.cookies">Cookie Policy</a>' +
              '<a href="/delete-account" data-i18n="footer.delete">Delete Account</a>' +
            '</div>' +
            '<div class="footer__col">' +
              '<span class="footer__col-title" data-i18n="footer.col3">Help</span>' +
              '<a href="/support"         data-i18n="footer.support_center">Support Center</a>' +
              '<a href="/support#contact" data-i18n="footer.contact">Contact Us</a>' +
            '</div>' +
          '</nav>' +
        '</div>' +
        '<div class="footer__bottom">' +
          '<p data-i18n="footer.copy">&copy; Nuria Technologies</p>' +
          '<div class="footer__bottom-links">' +
            '<a href="/privacy"        data-i18n="footer.nav_privacy">Privacy</a>' +
            '<a href="/terms"          data-i18n="footer.nav_terms">Terms</a>' +
            '<a href="/cookies"        data-i18n="footer.cookies">Cookie Policy</a>' +
            '<a href="/support"        data-i18n="footer.nav_support">Support</a>' +
            '<a href="/delete-account" data-i18n="footer.nav_delete">Delete Account</a>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</footer>';

  function setActiveNavLink(nav) {
    var path = window.location.pathname.replace(/\/$/, '') || '/';
    var links = nav.querySelectorAll('a.nav__link');
    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute('href');
      if (!href || href.charAt(0) === '#' || href.charAt(1) === '#') continue;
      if (href === path || (href.length > 1 && path.indexOf(href) === 0)) {
        links[i].classList.add('active');
      }
    }
  }

  var navEl = document.getElementById('site-nav');
  if (navEl) {
    navEl.outerHTML = NAV_HTML;
    var injectedNav = document.getElementById('nav');
    if (injectedNav) setActiveNavLink(injectedNav);
  }

  var footerEl = document.getElementById('site-footer');
  if (footerEl) {
    footerEl.outerHTML = FOOTER_HTML;
  }

  /* =========================================================================
     NuriaOne launcher → cinematic command-center overlay
     A tap on the navbar launcher opens the live NuriaOne chat in a portal
     overlay, on every page. The chat island (js/nuria-chat.js) mounts into the
     overlay's [data-nuria-chat] slot and is lazy-loaded on first open, so pages
     stay fast until someone actually asks. On /ask the page IS the chat (it has
     its own inline [data-nuria-chat]); there we skip the overlay and let the
     launcher, if present, jump to the on-page chat instead.
     ========================================================================= */
  (function () {
    var launchers = document.querySelectorAll('[data-nuria-launch]');
    if (!launchers.length) return;

    var inlineChat = document.querySelector('[data-nuria-chat]'); // the /ask page
    var EMBERS = '<span style="--x:8%;--d:15s;--delay:0s;--s:.7"></span>' +
      '<span style="--x:20%;--d:19s;--delay:5s;--s:1"></span>' +
      '<span style="--x:33%;--d:16s;--delay:9s;--s:.6"></span>' +
      '<span style="--x:47%;--d:21s;--delay:2s;--s:.9"></span>' +
      '<span style="--x:61%;--d:17s;--delay:11s;--s:.7"></span>' +
      '<span style="--x:74%;--d:20s;--delay:4s;--s:1.1"></span>' +
      '<span style="--x:88%;--d:15s;--delay:8s;--s:.65"></span>' +
      '<span style="--x:95%;--d:23s;--delay:13s;--s:.8"></span>';

    // On /ask: no overlay — the launcher (if any) scrolls to the inline chat.
    if (inlineChat) {
      Array.prototype.forEach.call(launchers, function (btn) {
        btn.addEventListener('click', function () {
          inlineChat.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      });
      return;
    }

    var MODAL_HTML =
      '<div class="nuria-modal" id="nuriaOneModal" role="dialog" aria-modal="true" aria-labelledby="nuriaModalTitle" hidden>' +
        '<div class="nuria-modal__backdrop" data-nuria-close></div>' +
        '<div class="nuria-modal__embers" aria-hidden="true">' + EMBERS + '</div>' +
        '<div class="nuria-modal__panel" role="document">' +
          '<span class="nuria-modal__glow" aria-hidden="true"></span>' +
          '<header class="nuria-modal__head">' +
            '<span class="nuria-modal__avatar" aria-hidden="true"></span>' +
            '<span class="nuria-modal__titles">' +
              '<span class="nuria-modal__title" id="nuriaModalTitle">NuriaOne</span>' +
              '<span class="nuria-modal__sub" data-i18n="nuriaone.modal_sub">Free preview · in scholarly review</span>' +
            '</span>' +
            '<a class="nuria-modal__full" href="/ask" data-i18n="nuriaone.modal_full">Open full page</a>' +
            '<button class="nuria-modal__close" type="button" data-nuria-close data-i18n-aria-label="nuriaone.modal_close" aria-label="Close">' +
              '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' +
            '</button>' +
          '</header>' +
          '<div class="nuria-modal__body"><div data-nuria-chat></div></div>' +
          '<p class="nuria-modal__foot" data-i18n="nuriaone.modal_foot">Every answer shows its sources. Sensitive questions go to a human.</p>' +
        '</div>' +
      '</div>';

    var host = document.createElement('div');
    host.innerHTML = MODAL_HTML;
    var modal = host.firstChild;
    document.body.appendChild(modal);

    var panel = modal.querySelector('.nuria-modal__panel');
    var closeBtn = modal.querySelector('.nuria-modal__close');
    var chatLoaded = false;
    var lastFocus = null;
    var isOpen = false;        // authoritative state — do NOT read modal.hidden for gating
    var closeTimer = null;     // pending close-teardown fallback
    var inerted = [];          // body children we made inert while open

    function ensureChat() {
      if (chatLoaded) return;
      chatLoaded = true;
      var s = document.createElement('script');
      s.src = '/js/nuria-chat.js?v=20260717a';
      s.async = false;
      // only mark loaded once it actually loads; on failure allow a later retry
      s.onload = function () {
        // the input exists now → move focus onto it if the modal is still open
        if (isOpen) {
          var input = modal.querySelector('.nuria-chat__input');
          if (input) { try { input.focus(); } catch (e) { /* ignore */ } }
        }
      };
      s.onerror = function () { chatLoaded = false; if (s.parentNode) s.parentNode.removeChild(s); };
      document.body.appendChild(s);
    }

    // Only VISIBLE focusables count — the chat's consent gate hides the composer/tools
    // (display:none), and a hidden trailing control would break the wrap-around trap.
    function focusables() {
      var all = modal.querySelectorAll(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      );
      return Array.prototype.filter.call(all, function (el) {
        return el.offsetParent !== null || el.getClientRects().length > 0;
      });
    }

    function onKeydown(e) {
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key !== 'Tab') return;
      var f = focusables();
      if (!f.length) { e.preventDefault(); return; }
      var first = f[0], last = f[f.length - 1];
      var active = document.activeElement;
      // if focus somehow sits outside the dialog, pull it back in
      if (!modal.contains(active)) { e.preventDefault(); first.focus(); return; }
      if (e.shiftKey && active === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
    }

    function setBackgroundInert(on) {
      if (on) {
        inerted = [];
        Array.prototype.forEach.call(document.body.children, function (c) {
          if (c === modal || c.tagName === 'SCRIPT') return;
          if (c.hasAttribute('inert')) return;
          c.setAttribute('inert', '');
          inerted.push(c);
        });
      } else {
        inerted.forEach(function (c) { c.removeAttribute('inert'); });
        inerted = [];
      }
    }

    function open() {
      if (isOpen) return;
      // cancel any close still animating so a quick re-open isn't dropped
      if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
      panel.removeEventListener('transitionend', finishClose);
      panel.removeEventListener('transitioncancel', finishClose);
      isOpen = true;
      lastFocus = document.activeElement;
      modal.hidden = false;
      document.body.classList.add('nuria-modal-open');
      setBackgroundInert(true);
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { if (isOpen) modal.classList.add('is-open'); });
      });
      ensureChat();
      document.addEventListener('keydown', onKeydown);
      // Move focus into the dialog synchronously so a Tab pressed immediately after
      // opening can never land on the page behind it. The chat input takes over once
      // the lazy island mounts (see ensureChat onload).
      var input = modal.querySelector('.nuria-chat__input');
      (input || closeBtn || panel).focus();
      try {
        if (window.NuriaSite && window.NuriaSite.trackEvent) window.NuriaSite.trackEvent('nuriaone_launch_open', {});
      } catch (e) { /* ignore */ }
    }

    // one idempotent teardown for transitionend OR transitioncancel OR the fallback
    function finishClose() {
      panel.removeEventListener('transitionend', finishClose);
      panel.removeEventListener('transitioncancel', finishClose);
      if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
      if (!isOpen) modal.hidden = true;   // guard: a re-open may have happened
    }

    function close() {
      if (!isOpen) return;
      isOpen = false;
      modal.classList.remove('is-open');
      document.removeEventListener('keydown', onKeydown);
      document.body.classList.remove('nuria-modal-open');
      setBackgroundInert(false);
      panel.addEventListener('transitionend', finishClose);
      panel.addEventListener('transitioncancel', finishClose);
      // fallback strictly LONGER than the 420ms panel transition, so it only fires
      // when no transition event does (never races the real one)
      closeTimer = setTimeout(finishClose, 520);
      if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) { /* ignore */ } }
    }

    Array.prototype.forEach.call(launchers, function (btn) {
      btn.addEventListener('click', open);
    });
    Array.prototype.forEach.call(modal.querySelectorAll('[data-nuria-close]'), function (el) {
      el.addEventListener('click', close);
    });

    // Expose a tiny hook so page CTAs (e.g. the homepage spotlight button) can open it too.
    window.NuriaOne = { open: open, close: close };
  }());
}());

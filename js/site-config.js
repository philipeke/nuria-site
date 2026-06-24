'use strict';

(function () {
  const defaults = {
    appName: 'Nuria',
    siteOrigin: 'https://nuria.one',
    appScheme: 'nuria',
    iosBundleId: 'com.oakdev.nuria',
    androidPackage: 'com.oakdev.nuria',
    affiliateLookupUrl: 'https://us-central1-nuria-mobile-app.cloudfunctions.net/lookupAffiliateCodeHttp',
    socialFeedUrl: 'https://us-central1-nuria-mobile-app.cloudfunctions.net/getSocialFeedHttp',
    blogFeedUrl: 'https://us-central1-nuria-mobile-app.cloudfunctions.net/getBlogFeedHttp',
    appStoreUrl: 'https://apps.apple.com/se/app/nuria-islamisk-v%C3%A4gledning/id6760123913',
    googlePlayUrl: 'https://play.google.com/store/apps/details?id=com.oakdev.nuria&hl=sv',
    firebaseFunctionsRegion: 'us-central1',
    // Nuria Technologies — official social profiles (used by nav/footer + feed).
    social: {
      instagram: 'https://www.instagram.com/nuria_app/',
      tiktok: 'https://www.tiktok.com/@nuria_app',
      linkedin: 'https://www.linkedin.com/company/nuria-app/',
    },
    // /blog renders posts from our own marketing DB (written via the
    // ingestBlogPostHttp endpoint, e.g. by Sintra daily) and read back by
    // getBlogFeedHttp -> blogFeedUrl above. No Hashnode dependency.
    firebaseAppCheckSiteKey: '',
    affiliateAdminComplianceMode: 'hybrid',
    // NuriaOne chat (the verified Islamic AI on /ask). The chat island stays
    // OFF until the Nuria Intelligence API + GIFS scholar board are ready. The
    // browser only ever talks to the BFF endpoint below — never the partner key.
    chat: {
      enabled: false,          // master switch; flip to true at launch
      endpoint: '/api/chat',   // Cloudflare Worker BFF route (same-origin)
      previewParam: 'chat',    // ?chat=1 force-enables for unlisted testing
      mock: false,             // client-side mock answers (no Worker) for local UX preview
    },
    firebase: {
      apiKey: 'AIzaSyBu_VDD7NNOFvL2f9stqajF4LjCHpAvavk',
      appId: '1:1040440859345:web:e4ec4093edac453ca703f0',
      authDomain: 'nuria-mobile-app.firebaseapp.com',
      messagingSenderId: '1040440859345',
      projectId: 'nuria-mobile-app',
      storageBucket: 'nuria-mobile-app.firebasestorage.app',
      measurementId: 'G-M6WDHFMZS8',
    },
  };

  const overrides = window.NURIA_SITE_CONFIG || {};

  window.NURIA_SITE_CONFIG = Object.assign({}, defaults, overrides);
}());

'use strict';

(function () {
  const defaults = {
    appName: 'Nuria',
    siteOrigin: 'https://nuria.oakdev.app',
    appScheme: 'nuria',
    iosBundleId: 'com.oakdev.nuria',
    androidPackage: 'com.oakdev.nuria',
    affiliateLookupUrl: 'https://us-central1-nuria-mobile-app.cloudfunctions.net/lookupAffiliateCodeHttp',
    appStoreUrl: 'https://apps.apple.com/se/app/nuria-islamisk-v%C3%A4gledning/id6760123913',
    googlePlayUrl: 'https://play.google.com/store/apps/details?id=com.oakdev.nuria&hl=sv',
    firebaseFunctionsRegion: 'us-central1',
    firebase: {
      apiKey: 'AIzaSyBu_VDD7NNOFvL2f9stqajF4LjCHpAvavk',
      appId: '1:1040440859345:web:e4ec4093edac453ca703f0',
      authDomain: 'nuria-mobile-app.firebaseapp.com',
      messagingSenderId: '1040440859345',
      projectId: 'nuria-mobile-app',
      storageBucket: 'nuria-mobile-app.firebasestorage.app',
      measurementId: 'G-5XXBSS2E58',
    },
  };

  const overrides = window.NURIA_SITE_CONFIG || {};

  window.NURIA_SITE_CONFIG = Object.assign({}, defaults, overrides);
}());

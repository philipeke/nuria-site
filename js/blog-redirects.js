'use strict';

/*
 * Blog consolidation map — merged slug → canonical "pillar" slug.
 *
 * Approved July 2026 (Task 6 groups 1–3). Several near-duplicate posts split
 * ranking signals for the same query; each merged slug now redirects to its
 * pillar and is marked noindex, so the pillar accrues all the equity.
 *
 * ONE source of truth, consumed by:
 *   - scripts/build-blog.js  — emits a noindex redirect stub for each merged
 *     slug and omits it from sitemap.xml / feed.xml.
 *   - js/blog.v20260627a.js  — hides merged posts from the /blog list grid.
 *   - blog/index.html + 404.html — resolve merged → pillar so legacy links land
 *     directly on the canonical article.
 *
 * To consolidate more posts later, add "merged-slug": "pillar-slug" here and
 * re-run the generator. Removing an entry restores the post as standalone.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.NuriaBlogRedirects = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  var MAP = {
    // Group 1 — Morning adhkar / morning dhikr → pillar
    'morning-dhikr-starting-your-day-with-allahs-remembrance': 'morning-adhkar-starting-your-day-with-remembrance',
    'how-to-make-morning-adhkar-a-lasting-daily-habit': 'morning-adhkar-starting-your-day-with-remembrance',
    'how-to-start-your-day-with-morning-adhkar': 'morning-adhkar-starting-your-day-with-remembrance',
    'daily-dhikr-practice-that-sticks': 'morning-adhkar-starting-your-day-with-remembrance',
    'morning-adhkar-grounding-your-day-in-remembrance': 'morning-adhkar-starting-your-day-with-remembrance',
    'morning-dhikr-start-your-day-with-allah-s-remembrance': 'morning-adhkar-starting-your-day-with-remembrance',
    // Group 2 — Fajr morning routine → pillar
    'building-a-morning-routine-around-fajr': 'making-every-morning-count-blessing-of-fajr',
    // Group 3 — Halqa → pillar
    'halqa-circles-staying-consistent-in-your-deen': 'what-is-halqa-and-how-it-can-strengthen-your-deen',
    'how-halqa-helps-you-grow-in-your-deen-together': 'what-is-halqa-and-how-it-can-strengthen-your-deen'
  };

  function resolve(slug) {
    return Object.prototype.hasOwnProperty.call(MAP, slug) ? MAP[slug] : null;
  }

  return { map: MAP, resolve: resolve };
}));

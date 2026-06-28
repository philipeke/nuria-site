/* ============================================================
   NURIA — Living video stage
   Drives every .video-stage on the page: a muted, slow-motion
   background video that plays only while on-screen, pauses
   off-screen and when the tab is hidden, and never downloads
   until it is needed. Degrades to a static gradient for
   reduced-motion, data-saver, or no-IntersectionObserver.
   Pair with the .video-stage styles in css/styles.css.
   ============================================================ */
'use strict';

(function () {
  var stages = document.querySelectorAll('.video-stage');
  if (!stages.length) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var conn = navigator.connection || navigator.webkitConnection || navigator.mozConnection;
  var dataLimited = !!(conn && (conn.saveData || /(^|\b)(slow-)?2g$/.test(conn.effectiveType || '')));
  var noIO = !('IntersectionObserver' in window);

  Array.prototype.forEach.call(stages, function (stage) {
    var video = stage.querySelector('.video-stage__media');
    if (!video) return;

    // Respect reduced motion / data saver / old browsers: keep the
    // elegant static gradient and never fetch the video.
    if (reduceMotion.matches || dataLimited || noIO) {
      stage.classList.add('is-static');
      return;
    }

    var speed = parseFloat(video.getAttribute('data-speed')) || 0.6;
    var loaded = false;
    var wantPlay = false;
    var tries = 0;

    function applyRate() { try { video.playbackRate = speed; } catch (e) {} }
    video.addEventListener('loadedmetadata', applyRate);
    video.addEventListener('play', applyRate);
    video.addEventListener('playing', function () {
      applyRate();
      tries = 0;
      stage.classList.remove('is-static'); // recovered after a temporary block
      video.classList.add('is-playing');
    });

    function attempt() {
      if (!wantPlay || !video.paused) return; // already playing or no longer wanted
      video.muted = true;                     // required for unattended autoplay
      if (!loaded) { loaded = true; try { video.load(); } catch (e) {} }
      var p = video.play();
      if (p && typeof p.catch === 'function') {
        p.catch(function () {
          // A rejection here is often temporary (page still loading,
          // gesture pending, tab not yet focused). Retry a few times
          // with backoff before settling on the static gradient.
          if (!wantPlay) return;
          if (tries++ < 3) {
            setTimeout(function () { attempt(); }, 400 * tries);
          } else {
            stage.classList.add('is-static');
          }
        });
      }
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        wantPlay = entry.isIntersecting;
        if (wantPlay) { tries = 0; attempt(); }
        else { try { video.pause(); } catch (e) {} }
      });
    }, { threshold: 0.12, rootMargin: '200px 0px' });

    io.observe(stage);

    // Pause when the tab is hidden; resume if it is still in view.
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { try { video.pause(); } catch (e) {} }
      else { attempt(); }
    });
  });
}());

/* ============================================================
   NURIA — Main JavaScript
   OakDev & AI AB © 2026
   ============================================================ */

'use strict';

/* ===== STARFIELD CANVAS ===== */
(function () {
  const canvas = document.getElementById('starCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let stars = [];
  let raf;

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function createStars(n) {
    stars = [];
    for (let i = 0; i < n; i++) {
      stars.push({
        x:     Math.random() * canvas.width,
        y:     Math.random() * canvas.height,
        r:     Math.random() * 1.3 + 0.15,
        alpha: Math.random(),
        speed: Math.random() * 0.018 + 0.004,
        dir:   Math.random() > 0.5 ? 1 : -1,
        gold:  Math.random() > 0.82,
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const s of stars) {
      s.alpha += s.speed * s.dir;
      if (s.alpha >= 1)    { s.alpha = 1;    s.dir = -1; }
      if (s.alpha <= 0.03) { s.alpha = 0.03; s.dir =  1; }

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = s.gold
        ? `rgba(201,168,76,${s.alpha * 0.9})`
        : `rgba(210,240,225,${s.alpha * 0.65})`;
      ctx.fill();
    }

    raf = requestAnimationFrame(draw);
  }

  function init() {
    resize();
    createStars(200);
    draw();
  }

  window.addEventListener('resize', () => {
    cancelAnimationFrame(raf);
    resize();
    createStars(200);
    draw();
  });

  init();
}());

/* ===== NAVIGATION ===== */
(function () {
  const nav       = document.getElementById('nav');
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');
  if (!nav) return;

  // Scroll: add .scrolled class
  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 50);
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  // Hamburger toggle
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      const open = hamburger.classList.toggle('active');
      navLinks.classList.toggle('open', open);
    });

    navLinks.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navLinks.classList.remove('open');
      });
    });
  }
}());

/* ===== SMOOTH SCROLL ===== */
(function () {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const id = this.getAttribute('href');
      if (id === '#') return;
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - 88;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });
}());

/* ===== SCROLL-REVEAL ANIMATIONS ===== */
(function () {
  const els = document.querySelectorAll('.animate-on-scroll');
  if (!els.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const delay = parseInt(entry.target.dataset.delay || '0', 10);
        setTimeout(() => {
          entry.target.classList.add('is-visible');
        }, delay);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  els.forEach(el => observer.observe(el));
}());

/* ===== HERO PARALLAX ===== */
(function () {
  const heroContent = document.querySelector('.hero__content');
  if (!heroContent) return;

  const limit = window.innerHeight;

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y > limit) return;
    const pct = y / limit;
    heroContent.style.transform = `translateY(${y * 0.28}px)`;
    heroContent.style.opacity   = String(Math.max(0, 1 - pct * 1.4));
  }, { passive: true });
}());

/* ===== ACTIVE NAV LINK ON SCROLL ===== */
(function () {
  const sections  = document.querySelectorAll('section[id]');
  const navAnchors = document.querySelectorAll('.nav__link[href^="#"]');
  if (!sections.length) return;

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(sec => {
      if (window.scrollY >= sec.offsetTop - 110) current = sec.id;
    });
    navAnchors.forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === `#${current}`);
    });
  }, { passive: true });
}());

/* ===== ROTATING STAR DECORATION ===== */
(function () {
  const target = document.querySelector('.section--daily');
  if (!target) return;

  const ns  = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 200 200');
  svg.setAttribute('aria-hidden', 'true');
  Object.assign(svg.style, {
    position:      'absolute',
    right:         '-100px',
    top:           '50%',
    transform:     'translateY(-50%)',
    width:         '420px',
    height:        '420px',
    opacity:       '0.03',
    pointerEvents: 'none',
    animation:     'rotateSlow 80s linear infinite',
  });

  const star = document.createElementNS(ns, 'path');
  star.setAttribute('d',
    'M100,5 L115,50 L162,20 L134,65 L185,65 ' +
    'L145,92 L170,135 L120,110 L100,160 ' +
    'L80,110 L30,135 L55,92 L15,65 ' +
    'L66,65 L38,20 L85,50 Z'
  );
  star.setAttribute('fill', '#c9a84c');
  svg.appendChild(star);
  target.style.position = 'relative';
  target.style.overflow = 'hidden';
  target.appendChild(svg);
}());

/* ===== FAQ ACCORDION ===== */
(function () {
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item   = btn.closest('.faq-item');
      const isOpen = item.classList.contains('open');

      // Close all
      document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));

      // Open clicked if it was closed
      if (!isOpen) item.classList.add('open');
    });
  });
}());

/* ===== COUNTER ANIMATION ===== */
(function () {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el    = entry.target;
      const end   = parseFloat(el.dataset.count);
      const dur   = 1800;
      const start = performance.now();

      function step(now) {
        const pct = Math.min((now - start) / dur, 1);
        // Ease out cubic
        const ease = 1 - Math.pow(1 - pct, 3);
        el.textContent = Number.isInteger(end)
          ? Math.round(end * ease)
          : (end * ease).toFixed(1);
        if (pct < 1) requestAnimationFrame(step);
      }

      requestAnimationFrame(step);
      observer.unobserve(el);
    });
  }, { threshold: 0.6 });

  counters.forEach(el => observer.observe(el));
}());

/* ===== DELETE ACCOUNT FORM ===== */
(function () {
  const form = document.getElementById('deleteAccountForm');
  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const email  = form.querySelector('#deleteEmail')?.value  || '';
    const reason = form.querySelector('#deleteReason')?.value || '';
    const msg    = `Hello,\n\nI would like to request the deletion of my Nuria account.\n\nEmail: ${email}\nReason: ${reason}\n\nThank you.`;
    const mailto = `mailto:support@oakdev.ai?subject=Account%20Deletion%20Request&body=${encodeURIComponent(msg)}`;
    window.location.href = mailto;
  });
}());

/* ===== CONTACT FORM ===== */
(function () {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const name    = form.querySelector('#contactName')?.value  || '';
    const email   = form.querySelector('#contactEmail')?.value || '';
    const subject = form.querySelector('#contactSubject')?.value || 'Support Request';
    const message = form.querySelector('#contactMessage')?.value || '';
    const body    = `Name: ${name}\nEmail: ${email}\n\n${message}`;
    const mailto  = `mailto:support@oakdev.ai?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  });
}());

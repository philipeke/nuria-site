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
  const hero = document.getElementById('hero');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let stars = [];
  let raf = 0;
  let lastFrame = 0;
  let heroVisible = true;

  function isLowPowerDevice() {
    return window.innerWidth < 1024 ||
      (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ||
      (navigator.connection && navigator.connection.saveData);
  }

  function getStarCount() {
    if (reduceMotion.matches) return 0;
    if (isLowPowerDevice()) return window.innerWidth < 768 ? 18 : 30;
    return window.innerWidth < 768 ? 32 : 56;
  }

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    createStars(getStarCount());
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

  function shouldAnimate() {
    return !reduceMotion.matches && !document.hidden && heroVisible && stars.length > 0;
  }

  function stop() {
    if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  }

  function draw(now = 0) {
    if (!shouldAnimate()) {
      raf = 0;
      return;
    }

    const frameBudget = isLowPowerDevice() ? 50 : 33;
    if (now - lastFrame < frameBudget) {
      raf = requestAnimationFrame(draw);
      return;
    }
    lastFrame = now;

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

  function start() {
    if (!shouldAnimate() || raf) return;
    lastFrame = 0;
    raf = requestAnimationFrame(draw);
  }

  function handleAnimationState() {
    if (shouldAnimate()) {
      start();
    } else {
      stop();
    }
  }

  window.addEventListener('resize', () => {
    resize();
    if (!stars.length) ctx.clearRect(0, 0, canvas.width, canvas.height);
    handleAnimationState();
  }, { passive: true });

  document.addEventListener('visibilitychange', handleAnimationState);

  if (hero && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      heroVisible = entries[0] ? entries[0].isIntersecting : true;
      handleAnimationState();
    }, { threshold: 0.08 });

    observer.observe(hero);
  }

  if (typeof reduceMotion.addEventListener === 'function') {
    reduceMotion.addEventListener('change', () => {
      resize();
      handleAnimationState();
    });
  } else if (typeof reduceMotion.addListener === 'function') {
    reduceMotion.addListener(() => {
      resize();
      handleAnimationState();
    });
  }

  resize();
  handleAnimationState();
}());

/* ===== DOWNLOAD DROPDOWN ===== */
(function () {
  const wrapper = document.getElementById('navDownload');
  const btn     = document.getElementById('downloadBtn');
  if (!wrapper || !btn) return;

  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    const open = wrapper.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);
  });

  document.addEventListener('click', () => {
    wrapper.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  });

  wrapper.addEventListener('click', e => e.stopPropagation());
}());

/* ===== NAVIGATION HAMBURGER ===== */
(function () {
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');
  if (!hamburger || !navLinks) return;

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
        const top = target.getBoundingClientRect().top + window.scrollY - 100;
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

/* ===== SCROLL HANDLERS — single rAF-throttled listener ===== */
(function () {
  const nav        = document.getElementById('nav');
  const sections   = document.querySelectorAll('section[id]');
  const navAnchors = document.querySelectorAll('.nav__link[href^="#"]');
  const sectionPositions = [];
  let ticking = false;

  function updateSectionPositions() {
    sectionPositions.length = 0;
    sections.forEach(sec => {
      sectionPositions.push({
        id: sec.id,
        top: sec.getBoundingClientRect().top + window.scrollY - 110,
      });
    });
  }

  function update() {
    const y = window.scrollY;

    // Nav backdrop
    if (nav) nav.classList.toggle('scrolled', y > 24);

    // Active nav highlight
    if (sectionPositions.length && navAnchors.length) {
      let current = sectionPositions[0].id;
      for (const sec of sectionPositions) {
        if (y >= sec.top) current = sec.id;
        else break;
      }
      navAnchors.forEach(a => {
        a.classList.toggle('active', a.getAttribute('href') === `#${current}`);
      });
    }

    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });

  window.addEventListener('resize', () => {
    updateSectionPositions();
    update();
  }, { passive: true });

  window.addEventListener('load', () => {
    updateSectionPositions();
    update();
  });

  updateSectionPositions();
  update(); // run once on load
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
    const email  = form.querySelector('#deleteEmail')?.value.trim()  || '';
    const reason = form.querySelector('#deleteReason')?.value        || '';
    const note   = form.querySelector('#deleteNote')?.value.trim()   || '';
    let msg = `Hello,\n\nI would like to request the deletion of my Nuria account.\n\nEmail: ${email}`;
    if (reason) msg += `\nReason: ${reason}`;
    if (note)   msg += `\nAdditional notes: ${note}`;
    msg += '\n\nThank you.';
    const mailto = `mailto:hello@oakdev.app?subject=Account%20Deletion%20Request&body=${encodeURIComponent(msg)}`;
    window.location.href = mailto;
  });
}());

/* ===== CONTACT FORM ===== */
(function () {
  const form = document.getElementById('contactForm');
  if (!form) return;
  const attachmentsInput = form.querySelector('#contactAttachments');
  const attachmentList = form.querySelector('#contactAttachmentList');
  const statusEl = form.querySelector('#contactFormStatus');
  const maxFiles = 3;
  const maxFileSize = 10 * 1024 * 1024;
  let previewUrls = [];

  function currentLang() {
    return document.documentElement.lang || 'en';
  }

  function t(key, fallback) {
    if (typeof getVal === 'function') {
      const value = getVal(currentLang(), key);
      if (value) return value;
      const english = getVal('en', key);
      if (english) return english;
    }
    return fallback;
  }

  function setStatus(message, tone) {
    if (!statusEl) return;
    statusEl.textContent = message || '';
    statusEl.classList.remove('is-error', 'is-success');
    if (tone === 'error') statusEl.classList.add('is-error');
    if (tone === 'success') statusEl.classList.add('is-success');
  }

  function setStatusFromKey(key, tone, fallback) {
    setStatus(t(key, fallback), tone);
  }

  function formatSize(bytes) {
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function clearPreviewUrls() {
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    previewUrls = [];
  }

  function renderAttachments(files) {
    if (!attachmentList) return;
    clearPreviewUrls();
    attachmentList.innerHTML = '';

    if (!files.length) {
      const empty = document.createElement('p');
      empty.className = 'contact-upload__empty';
      empty.textContent = t('supp.form_attachments_empty', 'No images selected yet.');
      attachmentList.appendChild(empty);
      return;
    }

    files.forEach(file => {
      const item = document.createElement('div');
      item.className = 'contact-upload__item';

      const thumb = document.createElement('img');
      thumb.className = 'contact-upload__thumb';
      thumb.alt = '';
      const thumbUrl = URL.createObjectURL(file);
      previewUrls.push(thumbUrl);
      thumb.src = thumbUrl;

      const meta = document.createElement('div');
      meta.className = 'contact-upload__meta';

      const name = document.createElement('span');
      name.className = 'contact-upload__name';
      name.textContent = file.name;

      const details = document.createElement('span');
      details.className = 'contact-upload__details';
      details.textContent = `${file.type || 'image'} • ${formatSize(file.size)}`;

      meta.appendChild(name);
      meta.appendChild(details);
      item.appendChild(thumb);
      item.appendChild(meta);
      attachmentList.appendChild(item);
    });
  }

  function syncInputFiles(validFiles) {
    if (!attachmentsInput || typeof DataTransfer === 'undefined') return;
    const dataTransfer = new DataTransfer();
    validFiles.forEach(file => dataTransfer.items.add(file));
    attachmentsInput.files = dataTransfer.files;
  }

  function sanitizeAttachments() {
    if (!attachmentsInput) return [];

    const validFiles = [];
    let errorKey = '';
    const selectedFiles = Array.from(attachmentsInput.files || []);

    selectedFiles.forEach(file => {
      if (!file.type.startsWith('image/')) {
        errorKey = errorKey || 'supp.form_error_type';
        return;
      }
      if (file.size > maxFileSize) {
        errorKey = errorKey || 'supp.form_error_size';
        return;
      }
      if (validFiles.length >= maxFiles) {
        errorKey = errorKey || 'supp.form_error_limit';
        return;
      }
      validFiles.push(file);
    });

    syncInputFiles(validFiles);
    renderAttachments(validFiles);

    if (errorKey) {
      setStatusFromKey(errorKey, 'error', 'Please review your selected images and try again.');
    } else if (statusEl && !statusEl.classList.contains('is-success')) {
      setStatus('');
    }

    return validFiles;
  }

  if (attachmentsInput) {
    renderAttachments([]);
    attachmentsInput.addEventListener('change', sanitizeAttachments);
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!form.reportValidity()) return;

    const name = form.querySelector('#contactName')?.value.trim() || '';
    const email = form.querySelector('#contactEmail')?.value.trim() || '';
    const subject = form.querySelector('#contactSubject')?.value || 'Support Request';
    const message = form.querySelector('#contactMessage')?.value.trim() || '';
    const files = sanitizeAttachments();
    const mailSubject = `[Nuria Support] ${subject}`;
    const body = `Name: ${name}\nEmail: ${email}\n\n${message}`;
    const mailto = `mailto:hello@oakdev.app?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(body)}`;

    if (files.length && navigator.share && navigator.canShare && navigator.canShare({ files })) {
      try {
        await navigator.share({
          title: mailSubject,
          text: body,
          files,
        });
        setStatusFromKey(
          'supp.form_share_success',
          'success',
          'Your share sheet opened. Please choose your email app to send the message with attachments.'
        );
        form.reset();
        renderAttachments([]);
        return;
      } catch (error) {
        if (error && error.name === 'AbortError') {
          setStatusFromKey(
            'supp.form_share_cancelled',
            'error',
            'Sharing was cancelled. Your message and selected images are still here.'
          );
          return;
        }
      }
    }

    if (files.length) {
      setStatusFromKey(
        'supp.form_attachment_fallback',
        'error',
        'Your browser cannot attach files directly here. We opened an email draft with your message. Please add the selected images manually before sending.'
      );
    }

    window.location.href = mailto;
  });
}());

/* ============================================================
   main.js — Simulation & Modelling Society
   Effects:
   1. Canvas particle constellation (hero only)
   2. Scroll-triggered fade-in for sections
   3. Active nav link highlighting
   4. Mobile nav hamburger toggle
   ============================================================ */

/* ── 1. ACTIVE NAV LINK ─────────────────────────────────── */
(function () {
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === page || (page === '' && href === 'index.html')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
})();

/* ── 2. MOBILE HAMBURGER ────────────────────────────────── */
(function () {
  const nav = document.querySelector('nav');
  const links = document.querySelector('.nav-links');
  if (!nav || !links) return;

  const btn = document.createElement('button');
  btn.className = 'nav-hamburger';
  btn.setAttribute('aria-label', 'Toggle navigation');
  btn.innerHTML = '<span></span><span></span><span></span>';
  nav.appendChild(btn);

  btn.addEventListener('click', () => {
    const open = links.classList.toggle('nav-open');
    btn.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', open);
  });

  // Close on outside click
  document.addEventListener('click', e => {
    if (!nav.contains(e.target)) {
      links.classList.remove('nav-open');
      btn.classList.remove('is-open');
    }
  });
})();

/* ── 3. SCROLL REVEAL ───────────────────────────────────── */
(function () {
  const targets = document.querySelectorAll(
    '.card, .why-card, .status-card, .cta-section, .video-wrap, .page-title'
  );

  if (!('IntersectionObserver' in window)) {
    targets.forEach(el => el.classList.add('revealed'));
    return;
  }

  targets.forEach(el => el.classList.add('reveal-pending'));

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  targets.forEach(el => observer.observe(el));
})();

/* ── 4. CANVAS PARTICLE CONSTELLATION ──────────────────── */
(function () {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  // Only run if user hasn't asked for reduced motion
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  const canvas = document.createElement('canvas');
  canvas.className = 'hero-canvas';
  hero.prepend(canvas);

  const ctx = canvas.getContext('2d');
  const ACCENT = '99, 179, 255';
  const PARTICLE_COUNT_BASE = 60; // scales with width
  let W, H, particles, animId;

  function resize() {
    W = canvas.width = hero.offsetWidth;
    H = canvas.height = hero.offsetHeight;
    init();
  }

  function rand(min, max) { return Math.random() * (max - min) + min; }

  class Particle {
    constructor() { this.reset(true); }

    reset(fresh) {
      this.x = rand(0, W);
      this.y = fresh ? rand(0, H) : rand(0, H * 0.2);
      this.vx = rand(-0.18, 0.18);
      this.vy = rand(0.05, 0.22);
      this.size = rand(1, 2.5);
      this.alpha = rand(0.2, 0.7);
      this.life = 0;
      this.maxLife = rand(280, 600);
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.life++;
      // Fade in / fade out
      const t = this.life / this.maxLife;
      this.currentAlpha = this.alpha * Math.sin(t * Math.PI);
      if (this.life >= this.maxLife || this.y > H + 10) this.reset(false);
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${ACCENT}, ${this.currentAlpha})`;
      ctx.fill();
    }
  }

  function init() {
    const count = Math.round(PARTICLE_COUNT_BASE * Math.min(W / 900, 1));
    particles = Array.from({ length: count }, () => new Particle());
  }

  function drawConnections() {
    const MAX_DIST = 110;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MAX_DIST) {
          const opacity = (1 - dist / MAX_DIST) * 0.18 *
            Math.min(a.currentAlpha, b.currentAlpha);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(${ACCENT}, ${opacity})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }
  }

  function loop() {
    ctx.clearRect(0, 0, W, H);
    drawConnections();
    particles.forEach(p => { p.update(); p.draw(); });
    animId = requestAnimationFrame(loop);
  }

  resize();
  loop();

  // Pause when off-screen (performance)
  const visObs = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      if (!animId) loop();
    } else {
      cancelAnimationFrame(animId);
      animId = null;
    }
  });
  visObs.observe(hero);

  // Debounced resize
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 150);
  });
})();

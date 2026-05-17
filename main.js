/* ============================================================
   main.js — Simulation & Modelling Society
   1.  Active nav link
   2.  Mobile hamburger
   3.  Scroll reveal
   4.  Canvas particle constellation + mouse repulsion
   5.  Hero mouse parallax
   6.  Typewriter cycling subtitle
   7.  Card cursor-glow + scan-line hover
   8.  Nav shrink / hide on scroll
   9.  Hero h1 glitch burst on load
   10. data-count number counter
   ============================================================ */

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── 1. ACTIVE NAV LINK ─────────────────────────────────── */
(function () {
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    const href = link.getAttribute('href');
    link.classList.toggle('active', href === page || (page === '' && href === 'index.html'));
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
  btn.setAttribute('aria-expanded', 'false');
  btn.innerHTML = '<span></span><span></span><span></span>';
  nav.appendChild(btn);
  btn.addEventListener('click', () => {
    const open = links.classList.toggle('nav-open');
    btn.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', e => {
    if (!nav.contains(e.target)) {
      links.classList.remove('nav-open');
      btn.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
    }
  });
})();

/* ── 3. SCROLL REVEAL ───────────────────────────────────── */
(function () {
  const targets = document.querySelectorAll(
    '.card, .why-card, .status-card, .cta-section, .video-wrap, .page-title, .section-header'
  );
  if (!('IntersectionObserver' in window)) {
    targets.forEach(el => el.classList.add('revealed'));
    return;
  }
  targets.forEach(el => el.classList.add('reveal-pending'));
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
  targets.forEach(el => observer.observe(el));
})();

/* ── 4. CANVAS PARTICLE CONSTELLATION ──────────────────── */
(function () {
  const hero = document.querySelector('.hero');
  if (!hero || REDUCED) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'hero-canvas';
  hero.prepend(canvas);
  const ctx = canvas.getContext('2d');
  const ACCENT = '99, 179, 255';
  const COUNT_BASE = 75;
  let W, H, particles, animId;
  const mouse = { x: -999, y: -999 };

  function rand(a, b) { return Math.random() * (b - a) + a; }

  class Particle {
    constructor() { this.reset(true); }
    reset(fresh) {
      this.x = rand(0, W);
      this.y = fresh ? rand(0, H) : rand(-10, H * 0.3);
      this.vx = rand(-0.22, 0.22);
      this.vy = rand(0.06, 0.28);
      this.size = rand(1, 2.8);
      this.alpha = rand(0.2, 0.8);
      this.life = 0;
      this.maxLife = rand(300, 680);
      this.a = 0;
    }
    update() {
      const dx = this.x - mouse.x, dy = this.y - mouse.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < 90) { this.x += (dx / d) * 0.5; this.y += (dy / d) * 0.5; }
      this.x += this.vx;
      this.y += this.vy;
      this.life++;
      const t = this.life / this.maxLife;
      this.a = this.alpha * Math.sin(t * Math.PI);
      if (this.life >= this.maxLife || this.y > H + 10) this.reset(false);
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${ACCENT}, ${this.a})`;
      ctx.fill();
    }
  }

  function init() {
    const n = Math.round(COUNT_BASE * Math.min(W / 900, 1.3));
    particles = Array.from({ length: n }, () => new Particle());
  }

  function drawConnections() {
    const MAX = 130;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < MAX) {
          const op = (1 - d / MAX) * 0.22 * Math.min(a.a, b.a);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(${ACCENT}, ${op})`;
          ctx.lineWidth = 0.7;
          ctx.stroke();
        }
      }
    }
  }

  function resize() {
    W = canvas.width = hero.offsetWidth;
    H = canvas.height = hero.offsetHeight;
    init();
  }

  function loop() {
    ctx.clearRect(0, 0, W, H);
    drawConnections();
    particles.forEach(p => { p.update(); p.draw(); });
    animId = requestAnimationFrame(loop);
  }

  resize();
  loop();

  hero.addEventListener('mousemove', e => {
    const r = hero.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
  });
  hero.addEventListener('mouseleave', () => { mouse.x = -999; mouse.y = -999; });

  new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) { if (!animId) loop(); }
    else { cancelAnimationFrame(animId); animId = null; }
  }).observe(hero);

  let rt;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 150); });
})();

/* ── 5. HERO MOUSE PARALLAX ─────────────────────────────── */
(function () {
  const hero = document.querySelector('.hero');
  if (!hero || REDUCED) return;
  const layers = [
    { el: hero.querySelector('h1'),          depth: 0.018 },
    { el: hero.querySelector('p'),           depth: 0.011 },
    { el: hero.querySelector('.hero-label'), depth: 0.007 },
    { el: hero.querySelector('.btn'),        depth: 0.006 },
    { el: hero.querySelector('.hero-deco'),  depth: 0.032 },
  ].filter(l => l.el);

  let cx = 0, cy = 0, tx = 0, ty = 0, raf = null, running = false;

  function tick() {
    cx += (tx - cx) * 0.08;
    cy += (ty - cy) * 0.08;
    layers.forEach(({ el, depth }) => {
      el.style.transform = `translate(${(cx * depth).toFixed(2)}px, ${(cy * depth).toFixed(2)}px)`;
    });
    raf = requestAnimationFrame(tick);
  }

  hero.addEventListener('mouseenter', () => { if (!running) { running = true; raf = requestAnimationFrame(tick); } });
  hero.addEventListener('mousemove', e => {
    const r = hero.getBoundingClientRect();
    tx = e.clientX - r.left - r.width / 2;
    ty = e.clientY - r.top - r.height / 2;
  });
  hero.addEventListener('mouseleave', () => {
    running = false;
    cancelAnimationFrame(raf);
    tx = 0; ty = 0;
    layers.forEach(({ el }) => { el.style.transform = ''; });
  });
})();

/* ── 6. TYPEWRITER CYCLING SUBTITLE ─────────────────────── */
(function () {
  const hero = document.querySelector('.hero');
  if (!hero || REDUCED) return;
  const label = hero.querySelector('.hero-label');
  if (!label || !label.textContent.includes('SMS')) return;
  const p = hero.querySelector('p');
  if (!p) return;

  const phrases = [
    'Physics Simulations',
    'Computational Fluid Dynamics',
    'Epidemic Spreading Models',
    'Space-Time Visualisation',
    'Particle Collision Systems',
    'Climate & CO₂ Modelling',
    'Mathematical Chaos Theory',
  ];

  const wrap = document.createElement('div');
  wrap.className = 'typewriter-wrap';
  wrap.innerHTML = '<span class="typewriter-prefix">Currently exploring: </span>' +
    '<span class="typewriter-text"></span>' +
    '<span class="typewriter-cursor">|</span>';
  p.insertAdjacentElement('afterend', wrap);

  const el = wrap.querySelector('.typewriter-text');
  let pi = 0, ci = 0, deleting = false;

  function type() {
    const phrase = phrases[pi];
    if (!deleting) {
      ci++;
      el.textContent = phrase.slice(0, ci);
      if (ci === phrase.length) { deleting = true; setTimeout(type, 1900); return; }
      setTimeout(type, 52);
    } else {
      ci--;
      el.textContent = phrase.slice(0, ci);
      if (ci === 0) { deleting = false; pi = (pi + 1) % phrases.length; setTimeout(type, 320); return; }
      setTimeout(type, 26);
    }
  }
  setTimeout(type, 1400);
})();

/* ── 7. CARD CURSOR-GLOW ────────────────────────────────── */
(function () {
  if (REDUCED) return;
  document.querySelectorAll('.card, .why-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
      card.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
      card.classList.add('card-lit');
    });
    card.addEventListener('mouseleave', () => card.classList.remove('card-lit'));
  });
})();

/* ── 8. NAV SHRINK + HIDE ON SCROLL ─────────────────────── */
(function () {
  const nav = document.querySelector('nav');
  if (!nav) return;
  let lastY = 0;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    nav.classList.toggle('nav-scrolled', y > 60);
    nav.classList.toggle('nav-hidden', y > lastY + 4 && y > 220);
    nav.classList.toggle('nav-visible', y < lastY);
    lastY = y;
  }, { passive: true });
})();

/* ── 9. HERO H1 GLITCH BURST ON LOAD ────────────────────── */
(function () {
  const h1 = document.querySelector('.hero h1');
  if (!h1 || REDUCED) return;
  h1.setAttribute('data-text', h1.innerText);
  h1.classList.add('glitch-text');
  setTimeout(() => {
    h1.classList.add('glitch-burst');
    setTimeout(() => h1.classList.remove('glitch-burst'), 800);
  }, 450);
})();

/* ── 10. data-count COUNTER ANIMATION ───────────────────── */
(function () {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length || REDUCED) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.count, 10);
      const start = performance.now();
      obs.unobserve(el);
      function step(now) {
        const t = Math.min((now - start) / 1200, 1);
        el.textContent = Math.round((1 - Math.pow(1 - t, 3)) * target);
        if (t < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }, { threshold: 0.5 });
  counters.forEach(el => obs.observe(el));
})();
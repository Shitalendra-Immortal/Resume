// script.js  —  Video Background · Code Rain · Dark Theme

/* ────────────────────────────────────────────────────
   1.  VIDEO  BACKGROUND
   Full-screen looping background video. Falls back to
   the plain dark background if the video can't load.
──────────────────────────────────────────────────── */
(function initVideoBackground() {
  const video = document.getElementById('bgVideo');
  if (!video) return;
  // Small screens use the static poster instead — skip video entirely
  if (window.matchMedia && window.matchMedia('(max-width: 768px)').matches) return;
  const hide = () => { video.style.display = 'none'; };
  video.addEventListener('error', hide, true);
  const src = video.querySelector('source');
  if (src) src.addEventListener('error', hide);
  // some browsers need an explicit play() even with autoplay+muted
  const tryPlay = () => video.play().catch(() => {});
  if (video.readyState >= 2) tryPlay();
  else video.addEventListener('canplay', tryPlay, { once: true });
  // respect reduced-motion preference
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    video.pause();
  }
})();



/* ────────────────────────────────────────────────────
   2.  CODE  RAIN  CANVAS  (hero decoration)
   Falling code characters on the right side of hero,
   Matrix-style but using real code symbols.
──────────────────────────────────────────────────── */
(function initCodeRain() {
  const canvas = document.getElementById('codeRainCanvas');
  if (!canvas) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const ctx = canvas.getContext('2d');

  const chars = '{}[]()<>/=;:+-*&|!?#01αβλπ∑∫≈≠∞const let var fn =>'.split('');
  const fontSize = 14;
  let columns = 0;
  let drops = [];
  function resize() {
    const hero = canvas.parentElement;
    canvas.width  = canvas.offsetWidth;
    canvas.height = hero.offsetHeight;
    columns = Math.floor(canvas.width / fontSize);
    drops = new Array(columns).fill(0).map(() => Math.random() * -80);
  }
  resize();
  window.addEventListener('resize', resize);

  function draw() {
    if (document.hidden) { requestAnimationFrame(draw); return; }
    ctx.fillStyle = 'rgba(12,10,8,0.12)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = fontSize + 'px "Fira Code", monospace';

    for (let i = 0; i < columns; i++) {
      const char = chars[Math.floor(Math.random() * chars.length)];
      const x = i * fontSize;
      const y = drops[i] * fontSize;

      // Brightest at the tip, fading trail
      const alpha = 0.6 + Math.random() * 0.4;
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fillText(char, x, y);

      // Reset when off-screen, randomize restart
      if (y > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i] += 0.4 + Math.random() * 0.3;
    }
    requestAnimationFrame(draw);
  }
  draw();
})();




/* ────────────────────────────────────────────────────
   3.  NAVBAR — scroll effects + active link
──────────────────────────────────────────────────── */
const navbar   = document.getElementById('navbar');
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a');

function updateNav() {
  const scrollY = window.scrollY;
  navbar.classList.toggle('scrolled', scrollY > 50);
  document.getElementById('backTop').classList.toggle('visible', scrollY > 400);

  sections.forEach(section => {
    const top    = section.offsetTop - 100;
    const bottom = top + section.offsetHeight;
    const id     = section.getAttribute('id');
    if (scrollY >= top && scrollY < bottom) {
      navLinks.forEach(a => {
        a.classList.toggle('active', a.getAttribute('href') === `#${id}`);
      });
    }
  });
}
window.addEventListener('scroll', updateNav, { passive: true });
updateNav();


/* ── Mobile nav ── */
const navToggle = document.getElementById('navToggle');
const navMenu   = document.getElementById('navLinks');
navToggle.addEventListener('click', () => {
  navMenu.classList.toggle('open');
  navToggle.classList.toggle('open');
});
navMenu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navMenu.classList.remove('open');
    navToggle.classList.remove('open');
  });
});


/* ────────────────────────────────────────────────────
   4.  BACK TO TOP
──────────────────────────────────────────────────── */
document.getElementById('backTop').addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});


/* ────────────────────────────────────────────────────
   5.  SCROLL  FADE-IN  (IntersectionObserver)
──────────────────────────────────────────────────── */
const fadeEls = document.querySelectorAll(
  '.project-card, .achieve-card, .skill-category, .timeline-card, .about-grid, .proficiency'
);
fadeEls.forEach(el => el.classList.add('fade-in'));
const fadeObs = new IntersectionObserver(
  entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); fadeObs.unobserve(e.target); }
  }),
  { threshold: 0.1 }
);
fadeEls.forEach(el => fadeObs.observe(el));


/* ────────────────────────────────────────────────────
   6.  SKILL  BARS
──────────────────────────────────────────────────── */
const bars   = document.querySelectorAll('.bar-fill');
const barObs = new IntersectionObserver(
  entries => entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.style.width = e.target.dataset.width + '%';
      barObs.unobserve(e.target);
    }
  }),
  { threshold: 0.3 }
);
bars.forEach(b => barObs.observe(b));


/* ────────────────────────────────────────────────────
   7.  CONTACT  FORM  (Backend API integration)
──────────────────────────────────────────────────── */
async function handleSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const note = document.getElementById('formNote');
  const btn  = form.querySelector('[type="submit"]');

  const formData = {
    name: document.getElementById('cname').value.trim(),
    email: document.getElementById('cemail').value.trim(),
    message: document.getElementById('cmessage').value.trim()
  };

  btn.disabled = true;
  btn.textContent = '⏳ Sending…';

  try {
    // Change this URL to your deployed backend URL in production
    const API_URL = (['localhost', '127.0.0.1'].includes(window.location.hostname) || window.location.protocol === 'file:')
      ? 'http://localhost:5000'
      : 'https://resume-xqnt.onrender.com';

    const response = await fetch(`${API_URL}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const result = await response.json();

    if (result.success) {
      note.style.color = 'var(--text-primary)';
      note.textContent = result.message;
      form.reset();
      // Track successful submission
      if (window.trackEvent) trackEvent('contact_form_submit', { success: true });
    } else {
      throw new Error(result.message || 'Submission failed');
    }
  } catch (error) {
    note.style.color = 'var(--text-primary)';
    note.textContent = '❌ Oops! Something went wrong. Please email me directly.';
    console.error('Contact form error:', error);
    if (window.trackEvent) trackEvent('contact_form_submit', { success: false, error: error.message });
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa fa-paper-plane"></i> Send Message';
  }
}


/* ────────────────────────────────────────────────────
   8.  SMOOTH  SCROLL  (offset for fixed nav)
──────────────────────────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const href = this.getAttribute('href');
    if (!href || href === '#') return;
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    const top = target.offsetTop - 68;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});


/* ────────────────────────────────────────────────────
   9.  TYPING  EFFECT  on hero name
──────────────────────────────────────────────────── */
const heroName = document.querySelector('.hero-name');
const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (heroName && !prefersReducedMotion) {
  const text = heroName.textContent;
  heroName.textContent = '';
  let i = 0;
  const type = () => {
    if (i < text.length) { heroName.textContent += text.charAt(i++); setTimeout(type, 58); }
  };
  setTimeout(type, 500);
}


// 10.  CINEMATIC  INTRO  /  LOADING  SCREEN
(function initIntro() {
  const intro   = document.getElementById('introScreen');
  const typed   = document.getElementById('introTyped');
  const bar     = document.getElementById('introBar');
  if (!intro) return;

  const NAME    = 'Shitalendra Kumar Yadav';
  let   charIdx = 0;

  function typeName(cb) {
    if (charIdx < NAME.length) {
      typed.textContent += NAME.charAt(charIdx++);
      setTimeout(() => typeName(cb), 65);
    } else {
      cb();
    }
  }

  function fillBar(cb) {
    let pct = 0;
    const id = setInterval(() => {
      pct += 1.6;
      bar.style.width = Math.min(pct, 100) + '%';
      if (pct >= 100) { clearInterval(id); cb(); }
    }, 18);
  }

  function reveal() {
    intro.classList.add('hidden');
    document.body.classList.remove('preload');
  }

  // Reduced motion: skip the sequence entirely
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    reveal();
    return;
  }

  // Failsafe: never trap the visitor behind the intro for more than 5s
  setTimeout(reveal, 5000);

  // Sequence: type name → fill bar → reveal
  typeName(() => fillBar(() => setTimeout(reveal, 380)));
})();


// 11.  CURSOR  TRAIL  (glowing particles)
(function initCursorTrail() {
  const cvs  = document.getElementById('trailCanvas');
  if (!cvs) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const ctx  = cvs.getContext('2d');
  let   W, H;
  const dots = [];
  let   mx = -200, my = -200;

  function resize() {
    W = cvs.width  = window.innerWidth;
    H = cvs.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; }, { passive: true });

  function spawnDot() {
    dots.push({
      x: mx, y: my,
      r: Math.random() * 5 + 2,
      life: 1,
      decay: Math.random() * 0.035 + 0.025,
      dx: (Math.random() - 0.5) * 1.4,
      dy: (Math.random() - 0.5) * 1.4,
    });
  }

  let frame = 0;
  let accent = '#ffffff';
  function loop() {
    requestAnimationFrame(loop);
    if (document.hidden) return;
    ctx.clearRect(0, 0, W, H);
    // Small screens: no trail at all (width-gated, so touchscreen laptops are unaffected)
    if (window.innerWidth <= 768) { dots.length = 0; return; }
    frame++;
    if (frame % 3 === 0) spawnDot();   // spawn every third frame

    // Re-read the accent cheaply (every 30 frames) so picker changes still apply
    if (frame % 30 === 0) {
      accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#ffffff';
    }

    for (let i = dots.length - 1; i >= 0; i--) {
      const d = dots[i];
      d.life -= d.decay;
      d.x    += d.dx;
      d.y    += d.dy;
      if (d.life <= 0) { dots.splice(i, 1); continue; }
      ctx.save();
      ctx.globalAlpha = d.life * 0.7;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r * d.life, 0, Math.PI * 2);
      ctx.fillStyle = accent;
      ctx.shadowColor = accent;
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.restore();
    }
  }
  loop();
})();


// 12.  3D  CARD  TILT  (project cards)
document.querySelectorAll('.project-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const cx   = rect.left + rect.width  / 2;
    const cy   = rect.top  + rect.height / 2;
    const dx   = (e.clientX - cx) / (rect.width  / 2);
    const dy   = (e.clientY - cy) / (rect.height / 2);
    const rotX = -dy * 10;   // max 10 deg
    const rotY =  dx * 10;
    card.style.transform       = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.04,1.04,1.04)`;
    card.style.boxShadow       = `0 20px 60px rgba(0,0,0,.5), 0 0 28px var(--accent-glow)`;
    card.style.transition      = 'box-shadow .1s';
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform  = '';
    card.style.boxShadow  = '';
    card.style.transition = 'transform .5s ease, box-shadow .5s ease';
  });
});


// 13.  PARALLAX  SCROLL
const parallaxEls = document.querySelectorAll('[data-parallax]');
function applyParallax() {
  if (window.innerWidth <= 768) return;
  const scrollY = window.scrollY;
  parallaxEls.forEach(el => {
    const speed  = parseFloat(el.dataset.parallax) || 0.05;
    const offset = scrollY * speed;
    el.style.transform = `translateY(${offset}px)`;
  });
}
if (parallaxEls.length && !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) {
  window.addEventListener('scroll', applyParallax, { passive: true });
}


// 14.  ANIMATED  COUNTERS
const counterEls = document.querySelectorAll('.counter-num[data-target]');
const counterObs = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el     = entry.target;
    const target = parseInt(el.dataset.target, 10);
    const suffix = el.dataset.suffix || '';
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.textContent = target + suffix;
      counterObs.unobserve(el);
      return;
    }
    let   start  = 0;
    const dur    = 1800;
    const step   = 16;
    const inc    = target / (dur / step);
    const id = setInterval(() => {
      start += inc;
      if (start >= target) {
        el.textContent = target + suffix;
        clearInterval(id);
      } else {
        el.textContent = Math.floor(start) + suffix;
      }
    }, step);
    counterObs.unobserve(el);
  });
}, { threshold: 0.5 });
counterEls.forEach(el => counterObs.observe(el));


// 15.  ACCENT  COLOUR  PICKER
(function initColourPicker() {
  const btn      = document.getElementById('colourPickerBtn');
  const swatches = document.getElementById('colourSwatches');
  if (!btn || !swatches) return;

  btn.addEventListener('click', () => swatches.classList.toggle('open'));
  document.addEventListener('click', e => {
    if (!btn.contains(e.target) && !swatches.contains(e.target)) {
      swatches.classList.remove('open');
    }
  });

  function applyAccent(hex) {
    document.documentElement.style.setProperty('--accent', hex);
    // Derived values
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    document.documentElement.style.setProperty('--accent-dim',  `rgba(${r},${g},${b},.10)`);
    document.documentElement.style.setProperty('--accent-glow', `rgba(${r},${g},${b},.28)`);
    document.documentElement.style.setProperty('--border',      `rgba(${r},${g},${b},.13)`);
    document.documentElement.style.setProperty('--border-hover',`rgba(${r},${g},${b},.42)`);
    localStorage.setItem('accentColour', hex);
    // mark active swatch
    swatches.querySelectorAll('.swatch').forEach(s => {
      s.classList.toggle('active', s.dataset.colour === hex);
    });
    document.getElementById('customColour').value = hex;
    // Track color change
    if (window.trackEvent) trackEvent('color_change', { color: hex });
  }

  // swatch clicks
  swatches.querySelectorAll('.swatch').forEach(s => {
    s.addEventListener('click', () => applyAccent(s.dataset.colour));
  });

  // custom colour input
  const custom = document.getElementById('customColour');
  if (custom) {
    custom.addEventListener('input', e => applyAccent(e.target.value));
  }

  // restore saved accent
  const saved = localStorage.getItem('accentColour');
  if (saved) applyAccent(saved);
})();


/* ────────────────────────────────────────────────────
   16.  WAR  DRUMS  AMBIENCE  (looped audio file)
──────────────────────────────────────────────────── */
(function initWarDrums() {
  const btn   = document.getElementById('soundBtn');
  const icon  = document.getElementById('soundIcon');
  const audio = document.getElementById('warDrums');
  if (!btn || !audio) return;

  let playing = false, fadeTimer = null;

  function fadeTo(target, done) {
    clearInterval(fadeTimer);
    fadeTimer = setInterval(() => {
      const step = target > audio.volume ? 0.05 : -0.05;
      const nv = audio.volume + step;
      if ((step > 0 && nv >= target) || (step < 0 && nv <= target)) {
        audio.volume = target;
        clearInterval(fadeTimer);
        if (done) done();
      } else {
        audio.volume = nv;
      }
    }, 60);
  }

  // hide the button if the audio file can't be loaded
  audio.addEventListener('error', () => { btn.style.display = 'none'; }, true);

  btn.addEventListener('click', () => {
    if (!playing) {
      audio.volume = 0;
      const p = audio.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
      fadeTo(0.6);
      playing = true;
      icon.className = 'fa fa-volume-high';
      btn.classList.add('active');
      btn.title = 'Mute war drums';
      if (window.trackEvent) trackEvent('sound_toggle', { state: 'on' });
    } else {
      fadeTo(0, () => audio.pause());
      playing = false;
      icon.className = 'fa fa-volume-xmark';
      btn.classList.remove('active');
      btn.title = 'Play war drums';
      if (window.trackEvent) trackEvent('sound_toggle', { state: 'off' });
    }
  });
})();


/* ────────────────────────────────────────────────────
   17.  PWA  SERVICE  WORKER  REGISTRATION
──────────────────────────────────────────────────── */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => { /* silent if offline */ });
  });
}

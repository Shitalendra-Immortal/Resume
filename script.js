// script.js  —  3-D Background · Code Rain · Dark/Light

/* ────────────────────────────────────────────────────
   1.  THREE.JS  3-D  PARTICLE  BACKGROUND
   Creates a deep-space particle field with slow drift,
   mouse-parallax and a coloured "behind-glass" depth.
──────────────────────────────────────────────────── */
(function initThreeBackground() {
  const canvas   = document.getElementById('bgCanvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.z = 50;

  /* ---------- Particle geometry ---------- */
  const COUNT = 900;
  const pos   = new Float32Array(COUNT * 3);
  const col   = new Float32Array(COUNT * 3);
  const sizes = new Float32Array(COUNT);
  const speed = new Float32Array(COUNT);

  // colour palette: cyan, purple, white, soft-blue
  const palette = [
    [0.0, 0.83, 1.0],   // #00d4ff  cyan
    [0.66, 0.33, 0.98],  // purple
    [0.85, 0.90, 1.0],   // near-white
    [0.4, 0.6, 1.0],     // soft blue
  ];

  for (let i = 0; i < COUNT; i++) {
    const i3 = i * 3;
    pos[i3]   = (Math.random() - 0.5) * 130;
    pos[i3+1] = (Math.random() - 0.5) * 100;
    pos[i3+2] = (Math.random() - 0.5) * 80;

    const c = palette[Math.floor(Math.random() * palette.length)];
    col[i3]   = c[0];
    col[i3+1] = c[1];
    col[i3+2] = c[2];

    sizes[i] = Math.random() * 2.2 + 0.4;
    speed[i] = Math.random() * 0.018 + 0.004;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos,   3));
  geo.setAttribute('color',    new THREE.BufferAttribute(col,   3));
  geo.setAttribute('aSize',    new THREE.BufferAttribute(sizes, 1));
  geo.setAttribute('aSpeed',   new THREE.BufferAttribute(speed, 1));

  /* Shader — round glowing sprites */
  const mat = new THREE.ShaderMaterial({
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uPixelRatio: { value: renderer.getPixelRatio() } },
    vertexShader: `
      attribute float aSize;
      attribute float aSpeed;
      uniform float uTime;
      uniform float uPixelRatio;
      varying vec3 vColor;
      void main(){
        vColor = color;
        vec3 p = position;
        p.y += sin(uTime * aSpeed + position.x * 0.05) * 1.8;
        p.x += cos(uTime * aSpeed * 0.7 + position.z * 0.04) * 1.2;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = aSize * uPixelRatio * (220.0 / -mv.z);
      }`,
    fragmentShader: `
      varying vec3 vColor;
      void main(){
        float d = length(gl_PointCoord - vec2(0.5));
        if(d > 0.5) discard;
        float alpha = smoothstep(0.5, 0.0, d);
        gl_FragColor = vec4(vColor, alpha * 0.82);
      }`
  });

  const particles = new THREE.Points(geo, mat);
  scene.add(particles);

  /* ---------- Connecting lines (nearest neighbours subset) ---------- */
  const LINE_COUNT = 160;
  const lpos  = new Float32Array(LINE_COUNT * 2 * 3);
  const lgeo  = new THREE.BufferGeometry();
  lgeo.setAttribute('position', new THREE.BufferAttribute(lpos, 3));
  const lmat  = new THREE.LineSegments(lgeo,
    new THREE.LineBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.07, blending: THREE.AdditiveBlending })
  );
  scene.add(lmat);

  // build a static set of random pairs for the lines
  const pairs = [];
  while (pairs.length < LINE_COUNT) {
    const a = Math.floor(Math.random() * COUNT);
    const b = Math.floor(Math.random() * COUNT);
    if (a !== b) pairs.push([a, b]);
  }

  /* ---------- Mouse parallax ---------- */
  let mx = 0, my = 0;
  window.addEventListener('mousemove', e => {
    mx = (e.clientX / window.innerWidth  - 0.5) * 2;
    my = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  /* ---------- Theme-dependent tint ---------- */
  function updateRendererBg() {
    const dark = document.documentElement.getAttribute('data-theme') !== 'light';
    renderer.setClearColor(dark ? 0x06060f : 0xeef2ff, dark ? 1 : 1);
    mat.uniforms && (mat.uniforms.uTime); // keep
    // tint line colour
    lmat.material.color.set(dark ? 0x00d4ff : 0x0066cc);
  }
  updateRendererBg();

  /* ---------- Resize ---------- */
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    mat.uniforms.uPixelRatio.value = renderer.getPixelRatio();
  });

  /* ---------- Animation loop ---------- */
  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    if (document.hidden) return;
    const t = clock.getElapsedTime();
    mat.uniforms.uTime.value = t;

    // gentle auto-rotation + mouse parallax
    particles.rotation.y = t * 0.012 + mx * 0.04;
    particles.rotation.x = my * 0.03;
    camera.position.x += (mx * 3 - camera.position.x) * 0.04;
    camera.position.y += (-my * 2 - camera.position.y) * 0.04;

    // update line positions from current particle positions
    const pPos = geo.attributes.position.array;
    for (let i = 0; i < LINE_COUNT; i++) {
      const [a, b] = pairs[i];
      const i6 = i * 6;
      // approximate animated positions (simplified)
      lpos[i6]   = pPos[a*3];
      lpos[i6+1] = pPos[a*3+1] + Math.sin(t * speed[a] + pPos[a*3] * 0.05) * 1.8;
      lpos[i6+2] = pPos[a*3+2];
      lpos[i6+3] = pPos[b*3];
      lpos[i6+4] = pPos[b*3+1] + Math.sin(t * speed[b] + pPos[b*3] * 0.05) * 1.8;
      lpos[i6+5] = pPos[b*3+2];
    }
    lgeo.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
  }
  animate();

  // expose for theme toggle
  window._threeUpdateBg = updateRendererBg;
})();


/* ────────────────────────────────────────────────────
   2.  CODE  RAIN  CANVAS  (hero decoration)
   Falling code characters on the right side of hero,
   Matrix-style but using real code symbols.
──────────────────────────────────────────────────── */
(function initCodeRain() {
  const canvas = document.getElementById('codeRainCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() {
    const hero = canvas.parentElement;
    canvas.width  = canvas.offsetWidth;
    canvas.height = hero.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const chars = '{}[]()<>/=;:+-*&|!?#01αβλπ∑∫≈≠∞const let var fn =>'.split('');
  const fontSize = 14;
  const columns  = Math.floor(canvas.width / fontSize);
  const drops    = new Array(columns).fill(0).map(() => Math.random() * -80);

  function draw() {
    if (document.hidden) { requestAnimationFrame(draw); return; }
    const dark = document.documentElement.getAttribute('data-theme') !== 'light';
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#00d4ff';

    ctx.fillStyle = dark ? 'rgba(6,6,15,0.12)' : 'rgba(240,244,255,0.15)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = fontSize + 'px "Fira Code", monospace';

    for (let i = 0; i < columns; i++) {
      const char = chars[Math.floor(Math.random() * chars.length)];
      const x = i * fontSize;
      const y = drops[i] * fontSize;

      // Brightest at the tip, fading trail
      const alpha = 0.6 + Math.random() * 0.4;
      ctx.fillStyle = dark
        ? `rgba(0,212,255,${alpha})`
        : `rgba(0,102,204,${alpha})`;
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
   3.  DARK / LIGHT  MODE  TOGGLE
──────────────────────────────────────────────────── */
const themeToggle = document.getElementById('themeToggle');
const themeIcon   = document.getElementById('themeIcon');

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  if (theme === 'light') {
    themeIcon.className = 'fa fa-moon';
    themeToggle.title   = 'Switch to Dark Mode';
  } else {
    themeIcon.className = 'fa fa-sun';
    themeToggle.title   = 'Switch to Light Mode';
  }
  if (window._threeUpdateBg) window._threeUpdateBg();
}

// load saved preference
setTheme(localStorage.getItem('theme') || 'dark');

themeToggle.addEventListener('click', () => {
  const curr = document.documentElement.getAttribute('data-theme');
  const newTheme = curr === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
  // Track theme toggle
  if (window.trackEvent) trackEvent('theme_toggle', { theme: newTheme });
});


/* ────────────────────────────────────────────────────
   4.  NAVBAR — scroll effects + active link
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
   5.  BACK TO TOP
──────────────────────────────────────────────────── */
document.getElementById('backTop').addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});


/* ────────────────────────────────────────────────────
   6.  SCROLL  FADE-IN  (IntersectionObserver)
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
   7.  SKILL  BARS
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
   8.  CONTACT  FORM  (Backend API integration)
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
      note.style.color = '#10b981';
      note.textContent = result.message;
      form.reset();
      // Track successful submission
      if (window.trackEvent) trackEvent('contact_form_submit', { success: true });
    } else {
      throw new Error(result.message || 'Submission failed');
    }
  } catch (error) {
    note.style.color = '#ef4444';
    note.textContent = '❌ Oops! Something went wrong. Please email me directly.';
    console.error('Contact form error:', error);
    if (window.trackEvent) trackEvent('contact_form_submit', { success: false, error: error.message });
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa fa-paper-plane"></i> Send Message';
  }
}


/* ────────────────────────────────────────────────────
   9.  SMOOTH  SCROLL  (offset for fixed nav)
──────────────────────────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const top = target.offsetTop - 68;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});


/* ────────────────────────────────────────────────────
   10.  TYPING  EFFECT  on hero name
──────────────────────────────────────────────────── */
const heroName = document.querySelector('.hero-name');
if (heroName) {
  const text = heroName.textContent;
  heroName.textContent = '';
  let i = 0;
  const type = () => {
    if (i < text.length) { heroName.textContent += text.charAt(i++); setTimeout(type, 58); }
  };
  setTimeout(type, 500);
}


// 11.  CINEMATIC  INTRO  /  LOADING  SCREEN
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

  // Sequence: type name → fill bar → reveal
  typeName(() => fillBar(() => setTimeout(reveal, 380)));
})();


// 12.  CURSOR  TRAIL  (glowing particles)
(function initCursorTrail() {
  const cvs  = document.getElementById('trailCanvas');
  if (!cvs) return;
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
  function loop() {
    requestAnimationFrame(loop);
    if (document.hidden) return;
    ctx.clearRect(0, 0, W, H);
    frame++;
    if (frame % 3 === 0) spawnDot();   // spawn every third frame

    // get current accent colour from CSS variable
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#00d4ff';

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


// 13.  3D  CARD  TILT  (project cards)
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


// 14.  PARALLAX  SCROLL
const parallaxEls = document.querySelectorAll('[data-parallax]');
function applyParallax() {
  const scrollY = window.scrollY;
  parallaxEls.forEach(el => {
    const speed  = parseFloat(el.dataset.parallax) || 0.05;
    const offset = scrollY * speed;
    el.style.transform = `translateY(${offset}px)`;
  });
}
if (parallaxEls.length) {
  window.addEventListener('scroll', applyParallax, { passive: true });
}


// 15.  ANIMATED  COUNTERS
const counterEls = document.querySelectorAll('.counter-num[data-target]');
const counterObs = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el     = entry.target;
    const target = parseInt(el.dataset.target, 10);
    const suffix = el.dataset.suffix || '';
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


// 16.  ACCENT  COLOUR  PICKER
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
    if (window._threeUpdateBg) window._threeUpdateBg();
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


// 17.  AMBIENT  MELODY  TOGGLE  (Web Audio API lo-fi piano arpeggio)
(function initAmbientSound() {
  const btn  = document.getElementById('soundBtn');
  const icon = document.getElementById('soundIcon');
  if (!btn) return;

  let ctx, masterGain, playing = false, melodyInterval = null;

  /* ── Note frequencies (C4-based pentatonic + octave) ── */
  const NOTES = {
    C4:261.63, D4:293.66, E4:329.63, G4:392.00, A4:440.00,
    C5:523.25, D5:587.33, E5:659.25, G5:783.99, A5:880.00,
    C3:130.81, E3:164.81, G3:196.00, A3:220.00
  };

  /* ── Arpeggio patterns (pentatonic — always pleasant) ── */
  const PATTERNS = [
    ['C4','E4','G4','A4','C5','A4','G4','E4'],
    ['A3','C4','E4','G4','E4','C4','A3','C4'],
    ['G3','D4','G4','A4','G4','D4','G3','D4'],
    ['E3','G4','A4','C5','A4','G4','E4','G4'],
    ['C4','G4','C5','E5','C5','G4','E4','G4'],
    ['A3','E4','A4','C5','D5','C5','A4','E4'],
  ];

  function createAudio() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();

    masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, ctx.currentTime);

    // Reverb via convolver (synthetic impulse response)
    const convolver = ctx.createConvolver();
    const rate = ctx.sampleRate;
    const length = rate * 2.5;
    const impulse = ctx.createBuffer(2, length, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.8);
      }
    }
    convolver.buffer = impulse;

    // Dry + wet mix
    const dryGain = ctx.createGain();
    dryGain.gain.value = 0.6;
    const wetGain = ctx.createGain();
    wetGain.gain.value = 0.4;

    masterGain.connect(dryGain);
    masterGain.connect(convolver);
    convolver.connect(wetGain);
    dryGain.connect(ctx.destination);
    wetGain.connect(ctx.destination);
  }

  /* ── Play a single soft piano-like note ── */
  function playNote(freq, time, duration) {
    if (!ctx) return;
    // Two detuned oscillators for warmth
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = 'sine';
    osc2.type = 'triangle';
    osc1.frequency.value = freq;
    osc2.frequency.value = freq * 1.002;  // slight detune

    const noteGain = ctx.createGain();
    noteGain.gain.setValueAtTime(0, time);
    // Piano-like envelope: quick attack, gentle decay
    noteGain.gain.linearRampToValueAtTime(0.22, time + 0.02);
    noteGain.gain.exponentialRampToValueAtTime(0.08, time + duration * 0.4);
    noteGain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    const osc2Gain = ctx.createGain();
    osc2Gain.gain.value = 0.25;

    osc1.connect(noteGain);
    osc2.connect(osc2Gain);
    osc2Gain.connect(noteGain);
    noteGain.connect(masterGain);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + duration + 0.05);
    osc2.stop(time + duration + 0.05);
  }

  /* ── Play a soft pad chord underneath ── */
  function playPad(freqs, time, duration) {
    if (!ctx) return;
    freqs.forEach(freq => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq * 0.5;  // one octave lower
      const padGain = ctx.createGain();
      padGain.gain.setValueAtTime(0, time);
      padGain.gain.linearRampToValueAtTime(0.04, time + 0.8);
      padGain.gain.linearRampToValueAtTime(0.04, time + duration - 1);
      padGain.gain.linearRampToValueAtTime(0, time + duration);
      osc.connect(padGain);
      padGain.connect(masterGain);
      osc.start(time);
      osc.stop(time + duration + 0.1);
    });
  }

  /* ── Schedule one arpeggio phrase ── */
  function schedulePhrase() {
    if (!ctx || !playing) return;
    const pattern = PATTERNS[Math.floor(Math.random() * PATTERNS.length)];
    const tempo = 0.28 + Math.random() * 0.08;  // slight tempo variation
    const now = ctx.currentTime + 0.05;
    const phraseDuration = pattern.length * tempo;

    // Pad chord: root + fifth of first note
    const rootFreq = NOTES[pattern[0]];
    playPad([rootFreq, rootFreq * 1.5], now, phraseDuration + 1.5);

    // Arpeggio notes
    pattern.forEach((note, i) => {
      playNote(NOTES[note], now + i * tempo, tempo * 2.5);
    });
  }

  function startMelody() {
    schedulePhrase();
    // Schedule new phrases with slight gaps for breathing room
    melodyInterval = setInterval(() => {
      if (playing) schedulePhrase();
    }, 3200 + Math.random() * 800);
  }

  function stopMelody() {
    if (melodyInterval) {
      clearInterval(melodyInterval);
      melodyInterval = null;
    }
  }

  btn.addEventListener('click', () => {
    if (!ctx) createAudio();
    if (ctx.state === 'suspended') ctx.resume();

    if (!playing) {
      masterGain.gain.cancelScheduledValues(ctx.currentTime);
      masterGain.gain.setValueAtTime(masterGain.gain.value, ctx.currentTime);
      masterGain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 1.0);
      playing = true;
      startMelody();
      icon.className  = 'fa fa-volume-high';
      btn.classList.add('active');
      btn.title       = 'Mute ambient melody';
      if (window.trackEvent) trackEvent('sound_toggle', { state: 'on' });
    } else {
      masterGain.gain.cancelScheduledValues(ctx.currentTime);
      masterGain.gain.setValueAtTime(masterGain.gain.value, ctx.currentTime);
      masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.0);
      playing = false;
      stopMelody();
      icon.className = 'fa fa-volume-xmark';
      btn.classList.remove('active');
      btn.title      = 'Play ambient melody';
      if (window.trackEvent) trackEvent('sound_toggle', { state: 'off' });
    }
  });
})();


// 18.  PWA  SERVICE  WORKER  REGISTRATION
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => { /* silent if offline */ });
  });
}

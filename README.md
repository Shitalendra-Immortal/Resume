# Student Developer – Resume Website

A fully responsive, single-page resume/portfolio website with **9 premium features**:
✨ Cinematic intro screen · 🖱️ Cursor trail effect · 🎴 3D card tilt · 📜 Parallax scroll  
🔢 Animated counters · 🎨 Accent colour picker · 🔊 Ambient sound toggle · 📱 PWA support · 📬 Real contact form

## 📁 Files
| File | Purpose |
|---|---|
| `index.html` | Full page structure & content |
| `style.css`  | Dark/light theme, all styling, animations |
| `script.js`  | 3D background, GoT art, all premium features |
| `manifest.json` | PWA manifest |
| `sw.js` | Service worker for offline support |
| `icons/` | PWA icon files (see below) |

## 🚀 How to open
Just double-click **`index.html`** — no server needed.

## ✏️ Personalise (replace placeholders)
| Where | What to change |
|---|---|
| `<h1 class="hero-name">Your Name</h1>` | Your real name |
| `script.js` line ~650: `const NAME = 'Your Name'` | Intro screen typed name |
| `<a href="resume.pdf" download …>` | Link to your actual PDF resume |
| `href="https://github.com/"` | Your GitHub profile URL |
| `href="https://linkedin.com/"` | Your LinkedIn URL |
| `mailto:you@email.com` | Your real email (appears 3 times) |
| About text | Your bio / interests |
| Counter numbers | data-target values in About section |
| Project cards | Real titles, descriptions, GitHub links |
| Education section | Real college, degree, year |
| Achievements | Your actual certs / badges |

## 🎨 Accent colour picker
The site includes a **live colour picker** (bottom-right floating button). Visitors can pick from 6 preset swatches or choose a custom colour — the entire site adapts in real-time! Your choice persists across sessions via localStorage.

To change the **default** accent colour:
- Edit `--accent: #00d4ff;` in `:root` of `style.css` (line ~9)

## 📬 Real contact form (Formspree)
The contact form currently runs in **demo mode**. To enable real email submissions:

1. Go to [Formspree.io](https://formspree.io/) and sign up (free plan: 50 submissions/month)
2. Create a new form and copy your form endpoint (e.g., `https://formspree.io/f/xyzabc123`)
3. Open `index.html` and find the `<form>` tag around line 339:
   ```html
   <form class="contact-form" id="contactForm" onsubmit="handleSubmit(event)">
   ```
4. Add the Formspree action attribute:
   ```html
   <form class="contact-form" id="contactForm" action="https://formspree.io/f/YOUR_FORM_ID" onsubmit="handleSubmit(event)">
   ```
5. Done! The form will now send real emails to your inbox.

**Alternative:** [EmailJS](https://www.emailjs.com/) — see their docs for client-side email setup.

## 📱 PWA Icons
To complete PWA support, generate icon files:

### Quick method (included tool):
1. Open `icons/icon-generator.html` in your browser
2. Enter your initials and pick colours
3. Click "Generate Icons"
4. Download both `icon-192.png` and `icon-512.png`
5. Place them in the `icons/` folder

### Professional method:
1. Use [favicon.io](https://favicon.io/favicon-generator/) or [RealFaviconGenerator](https://realfavicongenerator.net/)
2. Upload a square logo (your photo, initials design, or brand mark)
3. Download the generated icons
4. Save as `icon-192.png` (192×192) and `icon-512.png` (512×512) in `icons/` folder

**Without icons:** The PWA will still work but show a browser default placeholder.

## 🎯 Premium Features Included

### 1. Cinematic Intro / Loading Screen
Elegant typed logo animation with progress bar. Customise the name in `script.js` line ~650.

### 2. Cursor Trail Effect
Glowing particle trail follows your mouse cursor. Colour adapts to your accent choice.

### 3. 3D Card Tilt
Project cards tilt in 3D perspective on mouse hover with dynamic lighting.

### 4. Parallax Scroll
Sections move at different speeds for depth effect. Adjust `data-parallax` values in HTML for intensity.

### 5. Animated Counters
Stats count up when scrolled into view. Change `data-target` and `data-suffix` attributes on `.counter-num` elements.

### 6. Accent Colour Picker
Live theme customisation — visitors pick their preferred glow colour. Persists via localStorage.

### 7. Ambient Sound Toggle
Web Audio API synthesised wind/drone sound (no external files). Bottom-right button toggles on/off.

### 8. PWA Support
Install the site as a standalone app on mobile/desktop. Works offline after first visit.

### 9. Real Contact Form
Formspree integration for real email submissions (see setup above).

## 🌓 Dark / Light Mode
Toggle button in navbar. Preference saved to localStorage. Both the 3D background and Ghost of Tsushima art adapt to the theme.

## 📐 Tech Stack
- **Pure HTML/CSS/JavaScript** — no frameworks
- **Three.js r128** — WebGL 3D particle background
- **Canvas 2D API** — Procedural Ghost of Tsushima artwork
- **Web Audio API** — Ambient sound synthesis
- **IntersectionObserver** — Scroll animations
- **CSS Custom Properties** — Live theme switching
- **Service Worker** — Offline PWA support

## 🧪 Testing PWA
To test PWA install:
1. Serve via local server (required for service worker):
   ```bash
   python -m http.server 8000
   # or
   npx serve .
   ```
2. Open `http://localhost:8000` in Chrome/Edge
3. Look for install prompt in address bar or "Install" in browser menu

## 🎨 Customising Colours
All colours are CSS variables in `style.css` lines 4-46. Two themes defined:
- `[data-theme="dark"]` — default dark theme
- `[data-theme="light"]` — light mode

Change any `--accent`, `--bg-primary`, etc. to rebrand the entire site.

## 📝 License
Free to use for your personal portfolio. Attribution appreciated but not required. Built by a student developer for student developers.

---

**Pro tip:** Before sharing with recruiters, open the site in Chrome DevTools (F12) → Lighthouse tab → Run audit. Aim for 90+ scores in all categories!


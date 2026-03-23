/* floatingcard.js
 *
 * THE FLOW (matches nikolaradeski.com):
 *  1. Hero in view  → card sits in hero between the split name (front face, photo)
 *  2. Scroll begins → card travels RIGHT while TUMBLING in 3D (rotateY 0°→180°)
 *                     At midpoint it looks like a thin sliver on its edge.
 *  3. Docked        → back face visible with section-specific info on the right side
 *  4. Section changes → back content cross-fades (no extra flip needed)
 *  5. Scroll back   → card travels left while tumbling back (rotateY 180°→0°),
 *                     front face (photo) returns, card docks back in hero
 *
 * Technique:
 *  - #hero-card-anchor (visibility:hidden) keeps layout space in hero flex row
 *  - #floating-card is always position:fixed; JS drives left/top/width/height/rotateY
 *  - Spring-lerp gives organic deceleration on all axes simultaneously
 */

(function () {
  /* ── Guard ── */
  if (window.innerWidth <= 900) return;

  const card   = document.getElementById('floating-card');
  const inner  = document.getElementById('fcard-inner');
  const backEl = document.getElementById('fcard-back-content');
  const anchor = document.getElementById('hero-card-anchor');
  if (!card || !inner || !backEl || !anchor) return;

  /* ── Docked geometry ── */
  const DOCK_W     = 170;
  const DOCK_H     = 230;
  const DOCK_RIGHT = 44;   // px from right edge of viewport

  /* ── Spring factor ── */
  const K = 0.11;

  /* ── Animated state (cur) and target (tgt) ── */
  const cur = { x: 0, y: 0, w: DOCK_W, h: DOCK_H, rotZ: -3, rotY: 0 };
  const tgt = { ...cur };

  /* ── Scroll-based drift (subtle up/down once docked) ── */
  let driftY = 0;
  window.addEventListener('scroll', () => {
    const max = document.body.scrollHeight - window.innerHeight;
    const pct = max > 0 ? window.scrollY / max : 0;
    driftY = (pct - 0.5) * 70;  // ±35 px
  }, { passive: true });

  /* ── Easing ── */
  function smoothstep(t) {
    t = Math.max(0, Math.min(1, t));
    return t * t * (3 - 2 * t);
  }
  function lerp(a, b, t) { return a + (b - a) * t; }

  /* ── Scroll progress (0 = hero in view, 1 = docked) ── */
  function getScrollT() {
    const r   = anchor.getBoundingClientRect();
    const cY  = r.top + r.height / 2;   // anchor centre Y
    const vCY = window.innerHeight / 2; // viewport centre Y
    const rng = vCY + r.height / 2;     // total transition range
    return rng > 0 ? Math.max(0, Math.min(1, (vCY - cY) / rng)) : 1;
  }

  /* ── Update target values each frame ── */
  function updateTarget() {
    const t    = getScrollT();
    const ease = smoothstep(t);

    const rect    = anchor.getBoundingClientRect();
    const dockedX = window.innerWidth - DOCK_RIGHT - DOCK_W;
    const dockedY = window.innerHeight / 2 - DOCK_H / 2 + driftY * ease;

    /* Position & size: interpolate from "over anchor" → "docked right" */
    tgt.x = lerp(rect.left,   dockedX, ease);
    tgt.y = lerp(rect.top,    dockedY, ease);
    tgt.w = lerp(rect.width,  DOCK_W,  ease);
    tgt.h = lerp(rect.height, DOCK_H,  ease);

    /* Z-axis tilt: −3° in hero → 0° when docked */
    tgt.rotZ = -3 * (1 - ease);

    /* Y-axis tumble: 0° (front face) → 180° (back face) during travel.
     * Exception: riddles section shows the front face again (360° = full rotation back). */
    if (ease > 0.96 && currentKey === 'riddles') {
      tgt.rotY = 360;  // continue spinning past 180° back to front face
    } else {
      tgt.rotY = ease * 180;
    }

    /* CSS class for docked state */
    card.classList.toggle('fc-docked', ease > 0.96);
  }

  /* ── Render loop ── */
  function animate() {
    updateTarget();

    cur.x    += (tgt.x    - cur.x)    * K;
    cur.y    += (tgt.y    - cur.y)    * K;
    cur.w    += (tgt.w    - cur.w)    * K;
    cur.h    += (tgt.h    - cur.h)    * K;
    cur.rotZ += (tgt.rotZ - cur.rotZ) * K;
    cur.rotY += (tgt.rotY - cur.rotY) * K;

    /* Apply to DOM */
    card.style.left   = cur.x.toFixed(1) + 'px';
    card.style.top    = cur.y.toFixed(1) + 'px';
    card.style.width  = cur.w.toFixed(1) + 'px';
    card.style.height = cur.h.toFixed(1) + 'px';
    card.style.transform       = `rotate(${cur.rotZ.toFixed(2)}deg)`;
    inner.style.transform      = `rotateY(${cur.rotY.toFixed(2)}deg)`;

    requestAnimationFrame(animate);
  }

  /* ── Section data (shown on back face when docked) ── */
  const SECTIONS = {
    hero: {
      emoji: '👋', title: 'Hey there!',
      lines: ['Software Engineer', 'Piano Teacher', 'Gamer · Badminton', 'Vancouver 🍁'],
    },
    skills: {
      emoji: '⚡', title: 'My Stack',
      lines: ['React · Next.js · TS', 'Swift · SwiftUI · iOS', '.NET Core · C# · PG', 'AWS · Docker · CI/CD'],
    },
    experience: {
      emoji: '💼', title: 'Experience',
      lines: ['5+ years in industry', 'Full-stack & Mobile', 'Currently @ Vancouver', 'Open to roles'],
    },
    riddles: {
      emoji: '🧩', title: 'Solve me…',
      lines: ['Three riddles await', 'Each hides a prize', 'Are you clever enough?', 'Scroll down ↓'],
    },
    contact: {
      emoji: '✉️', title: "Let's Talk",
      lines: ['nadia.ahmadian96@yahoo.com', 'Open to collabs', 'Ping me any time', '☕ Coffee chat?'],
    },
  };

  function setBack(key) {
    const d = SECTIONS[key] || SECTIONS.skills;
    backEl.classList.add('fading');
    setTimeout(() => {
      backEl.innerHTML = `
        <div class="fcard-emoji">${d.emoji}</div>
        <div class="fcard-back-title">${d.title}</div>
        <ul class="fcard-back-lines">
          ${d.lines.map(l => `<li>${l}</li>`).join('')}
        </ul>`;
      backEl.classList.remove('fading');
    }, 260);
  }

  /* ── Section observer ── */
  let currentKey = 'hero';

  ['hero', 'skills', 'experience', 'riddles', 'contact'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting || id === currentKey) return;
        currentKey = id;
        /* Only update content when card is docked (back face visible) */
        const t = getScrollT();
        if (t > 0.9) setBack(id);
      });
    }, { threshold: 0.4 }).observe(el);
  });

  /* ── Seed position immediately (card hidden under loader anyway) ── */
  function seed() {
    const rect   = anchor.getBoundingClientRect();
    cur.x  = tgt.x  = rect.left;
    cur.y  = tgt.y  = rect.top;
    cur.w  = tgt.w  = rect.width;
    cur.h  = tgt.h  = rect.height;
    cur.rotZ = tgt.rotZ = -3;
    cur.rotY = tgt.rotY = 0;

    card.style.left      = rect.left   + 'px';
    card.style.top       = rect.top    + 'px';
    card.style.width     = rect.width  + 'px';
    card.style.height    = rect.height + 'px';
    card.style.transform = 'rotate(-3deg)';
    inner.style.transform = 'rotateY(0deg)';

    /* Pre-populate back face */
    setBack('skills');

    /* Reveal card (fade in over 0.5s via CSS transition on opacity) */
    card.classList.add('fc-ready');
  }

  /* ── Start ── */
  /* Seed once fonts/images have laid out so anchor rect is accurate */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', seed);
  } else {
    seed();
  }

  requestAnimationFrame(animate);

})();

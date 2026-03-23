/* floatingcard.js — scroll-aware floating card with 3D flip */

(function () {
  const card    = document.getElementById('floating-card');
  const inner   = document.getElementById('fcard-inner');
  const backEl  = document.getElementById('fcard-back-content');
  if (!card || !inner || !backEl) return;

  /* ─── Section data ─── */
  const sectionData = {
    hero: {
      emoji: '👋',
      title: 'Hey there!',
      lines: ['Software Engineer', 'Piano Teacher', 'Gamer · Badminton Player', 'Based in Vancouver 🍁'],
    },
    skills: {
      emoji: '⚡',
      title: 'My Stack',
      lines: ['React · Next.js · TypeScript', 'Swift · SwiftUI · iOS', '.NET Core · C# · Postgres', 'AWS · Docker · CI/CD'],
    },
    experience: {
      emoji: '💼',
      title: 'Experience',
      lines: ['5+ years in industry', 'Full-stack & Mobile', 'Currently @ Vancouver', 'Open to opportunities'],
    },
    riddles: {
      emoji: '🧩',
      title: 'Solve me…',
      lines: ['Three riddles await', 'Each hides a prize', 'Are you clever enough?', 'Scroll down to play →'],
    },
    contact: {
      emoji: '✉️',
      title: "Let's Talk",
      lines: ['afshinshah77@gmail.com', 'Open to collaborations', 'Ping me any time', '☕ Coffee chat?'],
    },
  };

  /* ─── Parallax offset ─── */
  let targetY = 0;
  let currentY = 0;
  let flipped = false;
  let currentSection = 'hero';
  let raf;

  function setBack(key) {
    const d = sectionData[key] || sectionData.hero;
    backEl.innerHTML = `
      <div class="fcard-emoji">${d.emoji}</div>
      <div class="fcard-back-title">${d.title}</div>
      <ul class="fcard-back-lines">
        ${d.lines.map(l => `<li>${l}</li>`).join('')}
      </ul>`;
  }

  function flipTo(key) {
    if (key === currentSection) return;
    currentSection = key;

    if (key === 'hero') {
      /* flip back to front (photo side) */
      inner.classList.remove('flipped');
      flipped = false;
    } else {
      /* update back content then flip */
      setBack(key);
      inner.classList.add('flipped');
      flipped = true;
    }
  }

  /* ─── IntersectionObserver ─── */
  const sectionIds = ['hero', 'skills', 'experience', 'riddles', 'contact'];
  const observers  = [];

  sectionIds.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) flipTo(id);
      });
    }, { threshold: 0.35 });
    obs.observe(el);
    observers.push(obs);
  });

  /* ─── Subtle scroll parallax ─── */
  window.addEventListener('scroll', () => {
    /* gentle float: card drifts ±40px around its CSS centre */
    const pct  = window.scrollY / (document.body.scrollHeight - window.innerHeight);
    targetY    = (pct - 0.5) * 80;   // -40 … +40 px
  }, { passive: true });

  function animate() {
    currentY += (targetY - currentY) * 0.06;
    card.style.transform = `translateY(calc(-50% + ${currentY.toFixed(2)}px))`;
    raf = requestAnimationFrame(animate);
  }

  /* ─── Init ─── */
  setBack('skills');         // pre-populate back face
  animate();
})();

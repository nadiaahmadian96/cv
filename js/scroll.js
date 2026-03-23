/* scroll.js — reveal animations + sticky panel + scroll-driven text */

/* ─── General scroll reveal (.reveal elements) ─── */
(function () {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });

  els.forEach(el => obs.observe(el));
})();

/* ─── Stacking-cards: bury cards as new ones slide over them ─── */
(function () {
  const cards = document.querySelectorAll('.stack-item .skill-card');
  if (!cards.length) return;

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      /* The PREVIOUS card gets .buried when the NEXT card becomes visible */
      const item     = e.target.closest('.stack-item');
      const prev     = item && item.previousElementSibling;
      const prevCard = prev && prev.querySelector('.skill-card');
      if (prevCard) {
        prevCard.classList.toggle('buried', e.isIntersecting);
      }
    });
  }, { threshold: 0.55 });

  cards.forEach(c => obs.observe(c));
})();

/* ─── Sticky skills panel (right column, hidden on mobile) ─── */
(function () {
  const panelData = {
    fullstack: {
      label: 'Full-Stack',
      tags:  ['React.js', 'Next.js', 'TypeScript', 'Node.js', 'Express', 'Material-UI'],
      desc:  'Web · Frontend + Backend'
    },
    ios: {
      label: 'iOS',
      tags:  ['Swift', 'SwiftUI', 'Firebase', 'Core Data', 'CloudKit', 'OpenAI API'],
      desc:  'Mobile · Apple Platforms'
    },
    backend: {
      label: 'Backend',
      tags:  ['.NET Core', 'C#', 'PostgreSQL', 'MongoDB', 'SQL Server', 'JWT / RBAC'],
      desc:  'Systems · APIs + Databases'
    },
    cloud: {
      label: 'Cloud',
      tags:  ['AWS EC2', 'AWS S3', 'Docker', 'CloudWatch', 'Nginx', 'CI/CD'],
      desc:  'Cloud · DevOps + Infra'
    }
  };

  const labelEl = document.getElementById('panel-label');
  const tagsEl  = document.getElementById('panel-tags');
  const descEl  = document.getElementById('panel-desc');
  const cards   = document.querySelectorAll('.skill-card[data-panel]');

  if (!labelEl || !cards.length) return;

  function updatePanel(key) {
    const d = panelData[key];
    if (!d) return;
    labelEl.textContent = d.label;
    descEl.textContent  = d.desc;
    tagsEl.innerHTML    = '';
    d.tags.forEach((t, i) => {
      const span = document.createElement('span');
      span.textContent = t;
      span.style.animationDelay = (i * 40) + 'ms';
      tagsEl.appendChild(span);
    });
    cards.forEach(c => c.classList.toggle('active-panel', c.dataset.panel === key));
  }

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) updatePanel(e.target.dataset.panel); });
  }, { threshold: 0.5 });

  cards.forEach(c => obs.observe(c));
})();

/* ─── Statement section: sticky scroll-driven word reveal ─── */
(function () {
  const container = document.querySelector('.statement-text');
  if (!container) return;

  /* Parent section (height: 300vh, sticky wrap inside) */
  const section = container.closest('.statement-section');
  if (!section) return;

  /* Wrap each word in a <span class="sw"> */
  const raw = container.textContent;
  container.innerHTML = raw
    .split(' ')
    .map(w => `<span class="sw">${w}</span>`)
    .join(' ');

  const words = Array.from(container.querySelectorAll('.sw'));

  function reveal() {
    const rect  = section.getBoundingClientRect();
    const viewH = window.innerHeight;

    /* Scroll progress through the sticky zone:
     * 0  → section just entered viewport (rect.top = 0)
     * 1  → section has scrolled all the way through (rect.bottom = viewH) */
    const scrollable = rect.height - viewH;
    const progress   = scrollable > 0
      ? Math.max(0, Math.min(1, -rect.top / scrollable))
      : (rect.top <= 0 ? 1 : 0);

    words.forEach((w, i) => {
      const threshold = (i / words.length) * 0.85;
      w.classList.toggle('sw--on', progress > threshold);
    });
  }

  window.addEventListener('scroll', reveal, { passive: true });
  reveal(); /* run once on load in case already in view */
})();

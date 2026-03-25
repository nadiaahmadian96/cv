/* skills-tilt.js — 3D tilt on hover + stagger tag reveal on scroll */

(function () {
  const cards = document.querySelectorAll('.sg-card');
  if (!cards.length) return;

  const isTouch = window.matchMedia('(hover: none)').matches;

  /* ─── Reveal tech tags when card scrolls into view ─── */
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('sg-visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.2 });

  cards.forEach(card => {
    obs.observe(card);
    if (isTouch) return;

    const inner = card.querySelector('.sg-card-inner');

    card.addEventListener('mouseenter', () => {
      inner.style.transition = 'transform 0.12s ease, border-color 0.35s ease, box-shadow 0.35s ease';
    });

    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const dx = ((e.clientX - rect.left)  / rect.width  - 0.5) * 2; // -1 → 1
      const dy = ((e.clientY - rect.top)   / rect.height - 0.5) * 2;
      inner.style.transform = `perspective(900px) rotateY(${dx * 8}deg) rotateX(${-dy * 8}deg) scale3d(1.02, 1.02, 1.02)`;
    });

    card.addEventListener('mouseleave', () => {
      inner.style.transition = 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1), border-color 0.35s ease, box-shadow 0.35s ease';
      inner.style.transform  = 'perspective(900px) rotateY(0deg) rotateX(0deg) scale3d(1,1,1)';
      setTimeout(() => { inner.style.transition = ''; }, 600);
    });
  });
})();

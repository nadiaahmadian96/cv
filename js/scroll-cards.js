/* scroll-cards.js — bury stacking skill cards as new ones slide over */

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

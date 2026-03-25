/* floatingcard.js — 3D tilt on photo card */

(function () {
  const card = document.getElementById('floating-card');
  if (!card) return;

  card.addEventListener('mousemove', e => {
    const r  = card.getBoundingClientRect();
    const dx = ((e.clientX - r.left) / r.width  - 0.5) * 2;
    const dy = ((e.clientY - r.top)  / r.height - 0.5) * 2;
    card.style.transition = 'box-shadow 0.4s ease';
    card.style.setProperty('--ry', (dx * 12) + 'deg');
    card.style.setProperty('--rx', (-dy * 12) + 'deg');
  });

  card.addEventListener('mouseleave', () => {
    card.style.transition = 'transform 0.65s cubic-bezier(0.23,1,0.32,1), box-shadow 0.4s ease';
    card.style.setProperty('--ry', '0deg');
    card.style.setProperty('--rx', '0deg');
  });
})();

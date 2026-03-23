/* cursor.js — custom cursor for desktop */

(function () {
  const dot  = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  if (!dot || !ring) return;

  let dotX = 0, dotY = 0, ringX = 0, ringY = 0;

  document.addEventListener('mousemove', e => {
    dotX = e.clientX;
    dotY = e.clientY;
    dot.style.left = dotX + 'px';
    dot.style.top  = dotY + 'px';
  });

  (function animateRing() {
    ringX += (dotX - ringX) * 0.11;
    ringY += (dotY - ringY) * 0.11;
    ring.style.left = ringX + 'px';
    ring.style.top  = ringY + 'px';
    requestAnimationFrame(animateRing);
  })();

  const hoverTargets = 'a, button, .skill-card, .riddle-card, .exp-item, .hero-photo-card, .key-white, .key-black';
  document.querySelectorAll(hoverTargets).forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
  });
})();

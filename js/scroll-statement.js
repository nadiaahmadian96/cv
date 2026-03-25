/* scroll-statement.js — sticky scroll-driven word-by-word reveal */

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

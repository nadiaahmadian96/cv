/* loader.js — loading screen */

(function () {
  const loader = document.getElementById('loader');
  if (!loader) return;

  window.addEventListener('load', () => {
    setTimeout(() => loader.classList.add('hidden'), 1400);
  });
})();

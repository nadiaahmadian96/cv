/* hero.js — live clock + footer year */

(function () {
  const clockEl = document.getElementById('live-clock');
  const yearEl  = document.getElementById('footer-year');

  if (yearEl) yearEl.textContent = new Date().getFullYear();

  if (!clockEl) return;

  function updateClock() {
    const now = new Date().toLocaleTimeString('en-CA', {
      timeZone: 'America/Vancouver',
      hour:   '2-digit',
      minute: '2-digit',
      hour12: false
    });
    clockEl.textContent = 'Vancouver, BC · ' + now;
  }

  updateClock();
  setInterval(updateClock, 1000);
})();

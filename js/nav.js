/* nav.js — bottom pill nav active state */

(function () {
  const nav   = document.getElementById('pill-nav');
  const links = nav ? nav.querySelectorAll('a[href^="#"]') : [];
  const sections = ['skills', 'experience', 'riddles', 'contact'];

  function setActive() {
    let current = '';
    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el && window.scrollY >= el.offsetTop - 160) current = id;
    });
    links.forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === '#' + current);
    });
  }

  window.addEventListener('scroll', setActive, { passive: true });
  setActive();
})();

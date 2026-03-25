/* loader.js — multi-language greeting loader */

(function () {
  const loader  = document.getElementById('loader');
  const wordEl  = document.getElementById('loader-word');
  const langEl  = document.getElementById('loader-lang');
  if (!loader) return;

  const greetings = [
    { word: 'Hello.',                        lang: 'English' },
    { word: 'Bonjour.',                      lang: 'Français' },
    { word: 'こんにちは',                     lang: '日本語' },
    { word: 'مرحباً',                        lang: 'العربية' },
    { word: 'Hola.',                         lang: 'Español' },
    { word: '> console.log("Hi")',           lang: 'JavaScript' },
    { word: 'print("Hello")',                lang: 'Python' },
    { word: 'print("Hello")',                lang: 'Swift' },
    { word: 'var body: some View {}',        lang: 'SwiftUI' },
    { word: 'useState(null)',                lang: 'React' },
    { word: 'const x = computed(() => {})', lang: 'TypeScript' },
    { word: 'Console.WriteLine("Hi");',     lang: 'C#' },
    { word: 'SELECT * FROM nadia;',         lang: 'PostgreSQL' },
    { word: 'docker run nadia',             lang: 'Docker' },
    { word: 'Hello.',                        lang: 'English' },
  ];

  let idx = 0;
  const INTERVAL = 160; // ms per greeting

  function cycle() {
    if (!wordEl || !langEl) return;

    if (idx < greetings.length - 1) {
      const g = greetings[idx];
      wordEl.textContent = g.word;
      langEl.textContent = '// ' + g.lang;
      idx++;
      setTimeout(cycle, INTERVAL);
    }
    /* Last greeting stays until loader hides */
  }

  /* Start cycling immediately */
  cycle();

  window.addEventListener('load', () => {
    setTimeout(() => loader.classList.add('hidden'), 1600);
  });
})();

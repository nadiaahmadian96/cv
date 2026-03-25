/* riddles.js — interactive riddle card logic
 * Depends on: riddle-prizes.js (window.awardPrize, window.prizeConfetti)
 */

(function () {
  const cards   = document.querySelectorAll('.riddle-card');
  const unlock  = document.getElementById('riddle-unlock');
  const solved  = new Set();

  const hints = {
    'recursion':        ['Think computer science algorithms…', 'A function that calls itself 🔄', 'Hint: starts with "r", ends with "n"'],
    'moonlight sonata': ['Beethoven wrote it in 1801…', 'A famous piano sonata 🌙', 'Hint: two words — moonlight...'],
    'ghost of tsushima':['A PlayStation open-world game set in feudal Japan…', 'A samurai becomes a ghost ⛩️', 'Hint: three words, starts with "Ghost"'],
    'spirited away':    ['Studio Ghibli… 🎋', 'A girl named Chihiro loses her name…', 'Hint: two words, starts with "Spirited"'],
  };
  const hintCount = {};

  cards.forEach(card => {
    const answer = card.dataset.answer.toLowerCase();
    const id     = card.dataset.id;
    const input  = card.querySelector('.riddle-input');
    const btn    = card.querySelector('.riddle-submit');
    const fb     = card.querySelector('.riddle-feedback');

    hintCount[answer] = 0;

    function check() {
      const val = input.value.trim().toLowerCase();
      if (!val) return;

      const accepted = {
        'recursion':         ['recursion', 'recursive', 'recursive function'],
        'moonlight sonata':  ['moonlight sonata', 'moonlight', 'beethoven moonlight', 'op 27', 'op. 27'],
        'ghost of tsushima': ['ghost of tsushima', 'ghost', 'tsushima', "ghost of tsushima director's cut"],
        'spirited away':     ['spirited away', 'sen to chihiro', 'chihiro', 'sen to chihiro no kamikakushi'],
      }[answer] || [answer];

      if (accepted.includes(val)) {
        fb.textContent = '✓ Correct!';
        fb.className   = 'riddle-feedback correct';
        card.classList.add('solved');
        input.disabled = true;
        btn.disabled   = true;
        solved.add(id);

        setTimeout(() => window.awardPrize(answer), 300);

        if (solved.size === cards.length) {
          setTimeout(showUnlock, 900);
        }

      } else {
        const hintList = hints[answer] || [];
        const idx = Math.min(hintCount[answer], hintList.length - 1);
        fb.textContent = '✗  ' + (hintList[idx] || 'Not quite…');
        fb.className   = 'riddle-feedback wrong';
        hintCount[answer]++;
        input.value = '';
        input.focus();
      }
    }

    btn.addEventListener('click', check);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') check(); });
  });

  /* ─── All solved ─── */
  function showUnlock() {
    if (!unlock) return;
    unlock.setAttribute('aria-hidden', 'false');
    unlock.style.display = 'block';
    unlock.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    window.prizeConfetti();   /* grand finale confetti */
  }
})();

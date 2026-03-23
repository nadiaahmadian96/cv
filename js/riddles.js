/* riddles.js — interactive riddle logic */

(function () {
  const cards   = document.querySelectorAll('.riddle-card');
  const unlock  = document.getElementById('riddle-unlock');
  const solved  = new Set();

  const hints = {
    git:   ['Think version control...', 'It lives in your terminal 💻', 'Hint: it starts with "g"'],
    piano: ['It has keys but not on a keyboard...', 'Think music 🎵', 'Hint: 88 keys'],
    game:  ['Think entertainment 🕹️', 'It has levels and lives...', 'Hint: two syllables'],
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

      // Accept variations
      const accepted = [answer, 'a ' + answer, 'video game', 'video games', 'games'];

      if (accepted.includes(val) || val === answer) {
        fb.textContent = '✓ Correct!';
        fb.className   = 'riddle-feedback correct';
        card.classList.add('solved');
        input.disabled = true;
        btn.disabled   = true;
        solved.add(id);
        if (solved.size === cards.length) showUnlock();
      } else {
        // Progressive hints
        const hintList = hints[answer];
        const idx = Math.min(hintCount[answer], hintList.length - 1);
        fb.textContent = '✗  ' + hintList[idx];
        fb.className   = 'riddle-feedback wrong';
        hintCount[answer]++;
        input.value = '';
        input.focus();
      }
    }

    btn.addEventListener('click', check);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') check(); });
  });

  function showUnlock() {
    if (!unlock) return;
    unlock.setAttribute('aria-hidden', 'false');
    unlock.style.display = 'block';
    unlock.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
})();

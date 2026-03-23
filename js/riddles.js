/* riddles.js — interactive riddle logic + prizes */

(function () {
  const cards   = document.querySelectorAll('.riddle-card');
  const unlock  = document.getElementById('riddle-unlock');
  const solved  = new Set();

  const hints = {
    git:   ['Think version control…', 'It lives in your terminal 💻', 'Hint: it starts with "g"'],
    piano: ['It has keys but not on a keyboard…', 'Think music 🎵', 'Hint: 88 keys'],
    game:  ['Think entertainment 🕹️', 'It has levels and lives…', 'Hint: two syllables'],
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

      const accepted = [answer, 'a ' + answer, 'video game', 'video games', 'games'];

      if (accepted.includes(val) || val === answer) {
        fb.textContent = '✓ Correct!';
        fb.className   = 'riddle-feedback correct';
        card.classList.add('solved');
        input.disabled = true;
        btn.disabled   = true;
        solved.add(id);

        /* ── Prize per riddle ── */
        setTimeout(() => awardPrize(answer), 300);

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

  /* ════════════════════════════════════
     PRIZE 1: git → confetti burst
  ════════════════════════════════════ */
  function prizeConfetti() {
    const overlay = document.createElement('canvas');
    overlay.style.cssText = [
      'position:fixed', 'inset:0', 'width:100%', 'height:100%',
      'pointer-events:none', 'z-index:9999',
    ].join(';');
    document.body.appendChild(overlay);
    const oc  = overlay.getContext('2d');
    overlay.width  = window.innerWidth;
    overlay.height = window.innerHeight;

    const COLORS = ['#00c896','#ff6b6b','#ffeaa7','#74b9ff','#fd79a8','#a29bfe'];
    const count  = 140;
    const pieces = Array.from({ length: count }, () => ({
      x:   Math.random() * overlay.width,
      y:   -Math.random() * overlay.height * 0.5,
      r:   Math.random() * 5 + 3,
      vy:  Math.random() * 3 + 1.5,
      vx:  (Math.random() - 0.5) * 2.5,
      rot: Math.random() * Math.PI * 2,
      rv:  (Math.random() - 0.5) * 0.15,
      col: COLORS[Math.floor(Math.random() * COLORS.length)],
      sq:  Math.random() > 0.5,
    }));

    let alive = true;
    function drop() {
      oc.clearRect(0, 0, overlay.width, overlay.height);
      pieces.forEach(p => {
        p.x   += p.vx;
        p.y   += p.vy;
        p.rot += p.rv;
        oc.save();
        oc.translate(p.x, p.y);
        oc.rotate(p.rot);
        oc.fillStyle = p.col;
        if (p.sq) {
          oc.fillRect(-p.r, -p.r, p.r*2, p.r*2);
        } else {
          oc.beginPath();
          oc.arc(0, 0, p.r, 0, Math.PI*2);
          oc.fill();
        }
        oc.restore();
      });
      if (alive) requestAnimationFrame(drop);
    }
    drop();
    setTimeout(() => {
      alive = false;
      overlay.remove();
    }, 3000);
  }

  /* ════════════════════════════════════
     PRIZE 2: piano → open piano + play C major arpeggio
  ════════════════════════════════════ */
  function prizePiano() {
    if (typeof window.openPiano === 'function') {
      window.openPiano();
    }
    if (typeof window.pianoPlayNote !== 'function') return;

    /* C major arpeggio: C4 E4 G4 C5 E5 G5 */
    const melody = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99];
    melody.forEach((freq, i) => {
      setTimeout(() => window.pianoPlayNote(freq), i * 220);
    });
  }

  /* ════════════════════════════════════
     PRIZE 3: game → open Breakout
  ════════════════════════════════════ */
  function prizeGame() {
    if (typeof window.openGame === 'function') {
      window.openGame();
    }
  }

  /* ─── Dispatcher ─── */
  function awardPrize(answer) {
    if (answer === 'git')   return prizeConfetti();
    if (answer === 'piano') return prizePiano();
    if (answer === 'game')  return prizeGame();
  }

  /* ─── All solved ─── */
  function showUnlock() {
    if (!unlock) return;
    unlock.setAttribute('aria-hidden', 'false');
    unlock.style.display = 'block';
    unlock.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    prizeConfetti();   // grand finale confetti
  }
})();

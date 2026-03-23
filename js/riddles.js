/* riddles.js — interactive riddle logic + prizes */

(function () {
  const cards   = document.querySelectorAll('.riddle-card');
  const unlock  = document.getElementById('riddle-unlock');
  const solved  = new Set();

  const hints = {
    git:   ['Think version control…', 'It lives in your terminal 💻', 'Hint: it starts with "g"'],
    piano: ['It has keys but not on a keyboard…', 'Think music 🎵', 'Hint: 88 keys'],
    game:  ['Think entertainment 🕹️', 'It has levels and lives…', 'Hint: two syllables'],
    anime: ['Think Japanese animation 🇯🇵', 'Sub or dub — a matter of honour…', 'Hint: it ends in "e"'],
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

      const accepted = [answer, 'a ' + answer, 'video game', 'video games', 'games',
                        'japanese animation', 'animation', 'japanese anime'];

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

  /* ════════════════════════════════════
     PRIZE 4: anime → floating sakura + quote
  ════════════════════════════════════ */
  function prizeAnime() {
    const EMOJIS  = ['🌸','⚔️','🔥','💫','🌊','🎌','🌙','⛩️','🐉','✨'];
    const QUOTE   = '"If you don\'t take risks, you can\'t create a future."';
    const ATTR    = '— Monkey D. Luffy';

    /* Floating emoji burst */
    for (let i = 0; i < 18; i++) {
      const el = document.createElement('span');
      el.textContent = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
      el.style.cssText = [
        'position:fixed',
        `left:${20 + Math.random() * 60}vw`,
        `top:${60 + Math.random() * 30}vh`,
        'font-size:' + (1.2 + Math.random() * 1.4) + 'rem',
        'pointer-events:none',
        'z-index:9998',
        'animation:sakuraFloat ' + (1.8 + Math.random() * 1.5) + 's ease-out forwards',
        'animation-delay:' + (Math.random() * 0.6) + 's',
      ].join(';');
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 4000);
    }

    /* Anime quote toast */
    const toast = document.createElement('div');
    toast.style.cssText = [
      'position:fixed', 'bottom:5rem', 'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(7,7,15,0.96)',
      'border:1.5px solid rgba(233,30,140,0.4)',
      'border-radius:12px',
      'padding:1rem 1.5rem',
      'text-align:center',
      'z-index:9997',
      'max-width:340px',
      'box-shadow:0 0 32px rgba(233,30,140,0.18)',
      'animation:toastIn 0.4s ease',
    ].join(';');
    toast.innerHTML = `
      <div style="font-size:1.4rem;margin-bottom:.4rem">🎌</div>
      <p style="font-style:italic;color:#ede8ff;font-size:.82rem;line-height:1.5">${QUOTE}</p>
      <p style="font-family:'Fira Code',monospace;font-size:.68rem;color:#e91e8c;margin-top:.4rem">${ATTR}</p>`;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'toastOut 0.4s ease forwards';
      setTimeout(() => toast.remove(), 400);
    }, 3500);

    /* Inject keyframes once */
    if (!document.getElementById('anime-prize-styles')) {
      const s = document.createElement('style');
      s.id = 'anime-prize-styles';
      s.textContent = `
        @keyframes sakuraFloat {
          0%   { opacity:1; transform: translateY(0) rotate(0deg); }
          100% { opacity:0; transform: translateY(-80px) rotate(360deg); }
        }
        @keyframes toastIn  { from { opacity:0; transform:translateX(-50%) translateY(16px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }
        @keyframes toastOut { from { opacity:1; } to { opacity:0; transform:translateX(-50%) translateY(8px); } }
      `;
      document.head.appendChild(s);
    }
  }

  /* ─── Dispatcher ─── */
  function awardPrize(answer) {
    if (answer === 'git')   return prizeConfetti();
    if (answer === 'piano') return prizePiano();
    if (answer === 'game')  return prizeGame();
    if (answer === 'anime') return prizeAnime();
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

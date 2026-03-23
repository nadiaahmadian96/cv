/* minigame.js — Breakout-style canvas game */

(function () {
  const modal      = document.getElementById('game-modal');
  const closeBtn   = document.getElementById('game-close');
  const restartBtn = document.getElementById('game-restart');
  const canvas     = document.getElementById('game-canvas');
  const scoreEl    = document.getElementById('game-score');
  const livesEl    = document.getElementById('game-lives');
  if (!modal || !canvas) return;

  const ctx = canvas.getContext('2d');

  /* Polyfill roundRect for Safari < 15.4 */
  if (!ctx.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
      this.beginPath();
      this.moveTo(x + r, y);
      this.lineTo(x + w - r, y);
      this.quadraticCurveTo(x + w, y, x + w, y + r);
      this.lineTo(x + w, y + h - r);
      this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      this.lineTo(x + r, y + h);
      this.quadraticCurveTo(x, y + h, x, y + h - r);
      this.lineTo(x, y + r);
      this.quadraticCurveTo(x, y, x + r, y);
      this.closePath();
    };
  }

  /* ─── Constants ─── */
  const W  = canvas.width;          // 420
  const H  = canvas.height;         // 280
  const PW = 72, PH = 9;            // paddle width, height
  const BW = 8,  BH = 8;            // ball radius
  const BRICK_COLS = 9;
  const BRICK_ROWS = 5;
  const BRICK_W    = Math.floor((W - 24) / BRICK_COLS);
  const BRICK_H    = 16;
  const BRICK_PAD  = 3;
  const BRICK_TOP  = 30;
  const MAX_LIVES  = 3;

  /* Brick colour rows */
  const BRICK_COLOURS = [
    '#ff6b6b', '#ff9f43', '#ffeaa7',
    '#00c896', '#74b9ff',
  ];

  /* ─── State ─── */
  let px, py, vx, vy;          // ball
  let paddleX;
  let bricks = [];
  let score  = 0;
  let lives  = MAX_LIVES;
  let phase  = 'ready';         // 'ready' | 'playing' | 'over' | 'won'
  let raf;

  /* ─── Init / Reset ─── */
  function reset() {
    score   = 0;
    lives   = MAX_LIVES;
    phase   = 'ready';
    paddleX = (W - PW) / 2;
    ballReset();
    buildBricks();
    updateHUD();
    if (restartBtn) { restartBtn.classList.remove('visible'); }
  }

  function ballReset() {
    px = W / 2;
    py = H - 50;
    vx = (Math.random() > 0.5 ? 1 : -1) * 2.8;
    vy = -3.2;
  }

  function buildBricks() {
    bricks = [];
    for (let r = 0; r < BRICK_ROWS; r++) {
      for (let c = 0; c < BRICK_COLS; c++) {
        bricks.push({
          x: 12 + c * BRICK_W,
          y: BRICK_TOP + r * (BRICK_H + BRICK_PAD),
          w: BRICK_W - BRICK_PAD,
          h: BRICK_H,
          alive: true,
          colour: BRICK_COLOURS[r % BRICK_COLOURS.length],
        });
      }
    }
  }

  /* ─── HUD ─── */
  function updateHUD() {
    if (scoreEl) scoreEl.textContent = score;
    if (!livesEl) return;
    livesEl.querySelectorAll('.game-heart').forEach((h, i) => {
      h.classList.toggle('lost', i >= lives);
    });
  }

  /* ─── Physics ─── */
  function step() {
    if (phase !== 'playing') return;

    px += vx;
    py += vy;

    /* Wall bounces */
    if (px - BW < 0)   { px = BW;    vx = Math.abs(vx); }
    if (px + BW > W)   { px = W-BW;  vx = -Math.abs(vx); }
    if (py - BW < 0)   { py = BW;    vy = Math.abs(vy); }

    /* Paddle */
    const padY = H - 20;
    if (
      py + BW >= padY &&
      py + BW <= padY + PH + 4 &&
      px >= paddleX &&
      px <= paddleX + PW
    ) {
      py = padY - BW - 1;
      vy = -Math.abs(vy);
      /* angle based on hit position */
      const hit = (px - paddleX) / PW;  // 0–1
      vx = (hit - 0.5) * 7;
      /* clamp speed */
      const spd = Math.sqrt(vx*vx + vy*vy);
      const maxSpd = 5.5;
      if (spd > maxSpd) { vx = vx/spd*maxSpd; vy = vy/spd*maxSpd; }
    }

    /* Brick collisions */
    for (const b of bricks) {
      if (!b.alive) continue;
      if (px+BW > b.x && px-BW < b.x+b.w && py+BW > b.y && py-BW < b.y+b.h) {
        b.alive = false;
        score++;
        updateHUD();

        /* Which side did ball hit? */
        const overlapL = (px + BW) - b.x;
        const overlapR = (b.x + b.w) - (px - BW);
        const overlapT = (py + BW) - b.y;
        const overlapB = (b.y + b.h) - (py - BW);
        const minX = Math.min(overlapL, overlapR);
        const minY = Math.min(overlapT, overlapB);
        if (minX < minY) vx = -vx; else vy = -vy;

        break;  // one brick per frame
      }
    }

    /* Win check */
    if (bricks.every(b => !b.alive)) {
      phase = 'won';
      if (restartBtn) restartBtn.classList.add('visible');
      return;
    }

    /* Ball lost */
    if (py - BW > H) {
      lives--;
      updateHUD();
      if (lives <= 0) {
        phase = 'over';
        if (restartBtn) restartBtn.classList.add('visible');
      } else {
        phase = 'ready';
        ballReset();
      }
    }
  }

  /* ─── Render ─── */
  function draw(ts) {
    ctx.clearRect(0, 0, W, H);

    /* Bricks */
    bricks.forEach(b => {
      if (!b.alive) return;
      ctx.fillStyle = b.colour;
      ctx.beginPath();
      ctx.roundRect(b.x, b.y, b.w, b.h, 3);
      ctx.fill();
    });

    /* Paddle */
    const padY = H - 20;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(paddleX, padY, PW, PH, 4);
    ctx.fill();

    /* Ball */
    ctx.beginPath();
    ctx.arc(px, py, BW, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();

    /* Overlays */
    if (phase === 'ready') {
      overlay('Click or move to launch!', '#aaa');
    } else if (phase === 'over') {
      overlay('GAME OVER', '#ff6b6b', `Score: ${score}`);
    } else if (phase === 'won') {
      overlay('YOU WON! 🎉', '#00c896', `Final score: ${score}`);
    }
  }

  function overlay(line1, color, line2) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, H/2 - 40, W, 80);

    ctx.fillStyle = color;
    ctx.font = 'bold 22px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(line1, W/2, H/2 - 6);

    if (line2) {
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '13px "Fira Code", monospace';
      ctx.fillText(line2, W/2, H/2 + 18);
    }
    ctx.textAlign = 'left';
  }

  /* ─── Loop ─── */
  function loop(ts) {
    step();
    draw(ts);
    raf = requestAnimationFrame(loop);
  }

  /* ─── Input — mouse ─── */
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = W / rect.width;
    const mx = (e.clientX - rect.left) * scaleX;
    paddleX = Math.max(0, Math.min(W - PW, mx - PW/2));
    if (phase === 'ready') { phase = 'playing'; }
  });

  /* ─── Input — touch ─── */
  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const scaleX = W / rect.width;
    const tx = (e.touches[0].clientX - rect.left) * scaleX;
    paddleX = Math.max(0, Math.min(W - PW, tx - PW/2));
    if (phase === 'ready') { phase = 'playing'; }
  }, { passive: false });

  canvas.addEventListener('click', () => {
    if (phase === 'ready') phase = 'playing';
  });

  /* ─── Open / Close ─── */
  window.openGame = function () {
    reset();
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (!raf) raf = requestAnimationFrame(loop);
  };

  function closeGame() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
    cancelAnimationFrame(raf);
    raf = null;
  }

  if (closeBtn)   closeBtn.addEventListener('click', closeGame);
  if (restartBtn) restartBtn.addEventListener('click', reset);

  modal.addEventListener('click', e => {
    if (e.target === modal) closeGame();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeGame();
  });
})();

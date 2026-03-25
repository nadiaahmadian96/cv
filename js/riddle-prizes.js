/* riddle-prizes.js — prize animations awarded when riddles are solved */

(function () {

  /* ════════════════════════════════════
     PRIZE 1: recursion → confetti burst
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
     PRIZE 2: moonlight sonata → open piano + play opening
  ════════════════════════════════════ */
  function prizePiano() {
    if (typeof window.openPiano === 'function') {
      window.openPiano();
    }
    if (typeof window.pianoPlayNote !== 'function') return;

    const melody = [329.63, 415.30, 493.88, 659.25, 493.88, 415.30, 329.63];
    melody.forEach((freq, i) => {
      setTimeout(() => window.pianoPlayNote(freq), i * 420);
    });
  }

  /* ════════════════════════════════════
     PRIZE 3: ghost of tsushima → open game
  ════════════════════════════════════ */
  function prizeGame() {
    if (typeof window.openGame === 'function') {
      window.openGame();
    }
  }

  /* ════════════════════════════════════
     PRIZE 4: spirited away → interactive Kodamas in the dark
  ════════════════════════════════════ */
  function prizeAnime() {
    const QUOTE = '"Once you\'ve met someone you never really forget them. It just takes a while for your memory to return."';
    const ATTR  = '— Zeniba, Spirited Away';

    /* ── Inject keyframes ── */
    if (!document.getElementById('anime-prize-styles')) {
      const s = document.createElement('style');
      s.id = 'anime-prize-styles';
      s.textContent = `
        @keyframes toastIn  { from{opacity:0;transform:translateX(-50%) translateY(16px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
        @keyframes toastOut { from{opacity:1} to{opacity:0;transform:translateX(-50%) translateY(8px)} }
      `;
      document.head.appendChild(s);
    }

    /* ── Dark overlay div (behind canvas) ── */
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(3,5,14,0);z-index:9997;transition:background 0.8s ease';
    document.body.appendChild(overlay);
    requestAnimationFrame(() => { overlay.style.background = 'rgba(3,5,14,0.93)'; });

    /* ── Canvas (on top of overlay) ── */
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:9998;cursor:none';
    document.body.appendChild(canvas);
    const W = canvas.width  = window.innerWidth;
    const H = canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');

    /* ── Close button ── */
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '× leave the forest';
    closeBtn.style.cssText = [
      'position:fixed', 'bottom:1.8rem', 'right:2rem',
      'z-index:9999',
      'background:transparent',
      'border:1px solid rgba(180,255,220,0.25)',
      'color:rgba(180,255,220,0.5)',
      'font-family:\'Fira Code\',monospace',
      'font-size:0.72rem',
      'padding:0.4rem 0.9rem',
      'border-radius:6px',
      'cursor:pointer',
      'transition:all 0.2s ease',
      'letter-spacing:0.06em',
    ].join(';');
    closeBtn.addEventListener('mouseenter', () => {
      closeBtn.style.color = 'rgba(180,255,220,0.9)';
      closeBtn.style.borderColor = 'rgba(180,255,220,0.5)';
    });
    closeBtn.addEventListener('mouseleave', () => {
      closeBtn.style.color = 'rgba(180,255,220,0.5)';
      closeBtn.style.borderColor = 'rgba(180,255,220,0.25)';
    });
    document.body.appendChild(closeBtn);

    /* ── Mouse tracking ── */
    let mouseX = -999, mouseY = -999;
    function onMouseMove(e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }
    document.addEventListener('mousemove', onMouseMove);

    /* ── Kodama factory ── */
    function makeKodama() {
      return {
        x:          W * (0.08 + Math.random() * 0.84),
        y:          H * (0.15 + Math.random() * 0.68),
        vx:         0,
        vy:         0,
        r:          24 + Math.random() * 16,
        phase:      Math.random() * Math.PI * 2,
        headAngle:  0,           /* rattle angle (degrees) */
        rattling:   false,
        rattleT:    0,
        nextRattle: 1.5 + Math.random() * 3.5,
        alpha:      0,           /* fade-in per kodama */
        tx:         0, ty: 0,   /* wander target */
        wanderT:    0,
        lookatX:    0, lookatY: 0,   /* subtle eye-look offset */
        clicked:    false,
        clickT:     0,
      };
    }

    const COUNT  = 12;
    const kodamas = Array.from({ length: COUNT }, makeKodama);

    function pickTarget(k) {
      k.tx = W * (0.06 + Math.random() * 0.88);
      k.ty = H * (0.12 + Math.random() * 0.74);
      k.wanderT = 2.5 + Math.random() * 3.5;
    }
    kodamas.forEach(pickTarget);

    /* ── Click: trigger rattle on hit kodama ── */
    function onClick(e) {
      kodamas.forEach(k => {
        const dx = e.clientX - k.x;
        const dy = e.clientY - k.y;
        if (Math.hypot(dx, dy) < k.r * 1.6) {
          k.rattling = true;
          k.rattleT  = 0;
          k.clicked  = true;
          k.clickT   = 0;
        }
      });
    }
    document.addEventListener('click', onClick);

    /* ── Cleanup ── */
    let cleanedUp = false;
    function cleanup() {
      if (cleanedUp) return;
      cleanedUp = true;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('click', onClick);
      overlay.style.background = 'rgba(3,5,14,0)';
      canvas.style.opacity = '0';
      canvas.style.transition = 'opacity 0.7s ease';
      closeBtn.style.opacity = '0';
      setTimeout(() => {
        overlay.remove();
        canvas.remove();
        closeBtn.remove();
        showQuote();
      }, 750);
    }
    closeBtn.addEventListener('click', cleanup);
    setTimeout(cleanup, 9000);   /* auto-close after 9s */

    /* ── Update kodama physics & state ── */
    function updateKodama(k, dt) {
      /* fade in */
      k.alpha = Math.min(1, k.alpha + dt * 1.4);

      /* wander */
      k.wanderT -= dt;
      if (k.wanderT <= 0) pickTarget(k);
      const tdx  = k.tx - k.x;
      const tdy  = k.ty - k.y;
      const td   = Math.hypot(tdx, tdy) || 1;
      k.vx += (tdx / td) * 40 * dt;
      k.vy += (tdy / td) * 40 * dt;

      /* mouse repulsion — scatter when cursor is close */
      const mdx  = k.x - mouseX;
      const mdy  = k.y - mouseY;
      const md   = Math.hypot(mdx, mdy);
      const FLEE = 140;
      if (md < FLEE && md > 0) {
        const push = ((FLEE - md) / FLEE) * 220;
        k.vx += (mdx / md) * push * dt;
        k.vy += (mdy / md) * push * dt;
        /* rattle when spooked */
        if (md < 70 && !k.rattling) {
          k.rattling = true;
          k.rattleT  = 0;
        }
      }

      /* eyes subtly track cursor */
      const edx = mouseX - k.x;
      const edy = mouseY - k.y;
      const ed  = Math.hypot(edx, edy) || 1;
      k.lookatX = (edx / ed) * Math.min(ed / 120, 1) * 2.5;
      k.lookatY = (edy / ed) * Math.min(ed / 120, 1) * 2.5;

      /* friction */
      k.vx *= 0.86;
      k.vy *= 0.86;
      const spd = Math.hypot(k.vx, k.vy);
      const MAX_SPD = 110;
      if (spd > MAX_SPD) { k.vx = k.vx/spd*MAX_SPD; k.vy = k.vy/spd*MAX_SPD; }

      k.x += k.vx * dt;
      k.y += k.vy * dt;

      /* boundary */
      const pad = k.r * 2.2;
      k.x = Math.max(pad, Math.min(W - pad, k.x));
      k.y = Math.max(pad, Math.min(H - pad, k.y));

      /* rattle timer */
      k.nextRattle -= dt;
      if (k.nextRattle <= 0 && !k.rattling) {
        k.rattling   = true;
        k.rattleT    = 0;
        k.nextRattle = 2.5 + Math.random() * 4;
      }

      if (k.rattling) {
        k.rattleT += dt;
        /* quick snapping rattle — decreasing amplitude */
        const decay = Math.max(0, 1 - k.rattleT * 2.2);
        k.headAngle  = Math.sin(k.rattleT * 38) * 22 * decay;
        if (k.rattleT > 0.75) {
          k.rattling  = false;
          k.headAngle = 0;
        }
      }

      if (k.clicked) {
        k.clickT += dt;
        if (k.clickT > 0.5) k.clicked = false;
      }
    }

    /* ── Draw one Kodama ── */
    function drawKodama(k, t) {
      const R   = k.r;
      const bob = Math.sin(t * 1.1 + k.phase) * 2.8;

      ctx.save();
      ctx.globalAlpha = k.alpha;
      ctx.translate(k.x, k.y + bob);

      /* ── body (smaller rounded shape below head) ── */
      ctx.shadowColor = 'rgba(180,255,225,0.5)';
      ctx.shadowBlur  = 16;
      ctx.fillStyle   = 'rgba(242,252,248,0.88)';
      ctx.beginPath();
      /* tapering body: wide at shoulders, narrows at base */
      ctx.moveTo(-R * 0.5, R * 0.45);
      ctx.bezierCurveTo(-R * 0.58, R * 0.55, -R * 0.38, R * 1.3, -R * 0.18, R * 1.45);
      ctx.lineTo( R * 0.18, R * 1.45);
      ctx.bezierCurveTo( R * 0.38, R * 1.3,  R * 0.58, R * 0.55,  R * 0.5, R * 0.45);
      ctx.closePath();
      ctx.fill();

      /* ── neck connector ── */
      ctx.fillStyle = 'rgba(242,252,248,0.92)';
      ctx.beginPath();
      ctx.ellipse(0, R * 0.44, R * 0.32, R * 0.16, 0, 0, Math.PI * 2);
      ctx.fill();

      /* ── head ── */
      ctx.save();
      ctx.rotate((k.headAngle * Math.PI) / 180);

      /* outer glow */
      const glow = ctx.createRadialGradient(0, 0, R * 0.2, 0, 0, R * 2.2);
      glow.addColorStop(0,   'rgba(220,255,240,0.22)');
      glow.addColorStop(0.5, 'rgba(160,255,210,0.09)');
      glow.addColorStop(1,   'rgba(100,220,180,0)');
      ctx.fillStyle = glow;
      ctx.shadowColor = 'rgba(160,255,210,0.9)';
      ctx.shadowBlur  = 32;
      ctx.beginPath();
      ctx.arc(0, 0, R * 2.2, 0, Math.PI * 2);
      ctx.fill();

      /* head circle — pure white, very slightly translucent */
      ctx.shadowBlur  = 20;
      ctx.shadowColor = 'rgba(200,255,235,0.7)';
      ctx.fillStyle   = 'rgba(245,253,250,0.96)';
      ctx.beginPath();
      ctx.arc(0, 0, R, 0, Math.PI * 2);
      ctx.fill();

      /* ── face — hollow eyes + hollow round mouth ── */
      ctx.shadowBlur = 0;
      const eyeY = -R * 0.08;
      const eyeX = R * 0.3;
      const eyeR = R * 0.13;

      /* eyes: dark outline, white (hollow) fill */
      [-eyeX, eyeX].forEach(ex => {
        ctx.fillStyle   = 'rgba(245,253,250,0.96)';
        ctx.strokeStyle = 'rgba(15,22,35,0.82)';
        ctx.lineWidth   = R * 0.06;
        ctx.beginPath();
        ctx.ellipse(ex + k.lookatX * 0.5, eyeY + k.lookatY * 0.5, eyeR, eyeR * 1.15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });

      /* mouth: small hollow circle */
      ctx.fillStyle   = 'rgba(245,253,250,0.96)';
      ctx.strokeStyle = 'rgba(15,22,35,0.7)';
      ctx.lineWidth   = R * 0.055;
      ctx.beginPath();
      ctx.arc(0, eyeY + R * 0.35, R * 0.09, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      /* ── small decorative dots on top of head ── */
      ctx.fillStyle = 'rgba(150,230,200,0.45)';
      ctx.beginPath(); ctx.arc(0,       -R * 0.78, R * 0.07, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(-R*0.14, -R * 0.65, R * 0.05, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc( R*0.14, -R * 0.65, R * 0.05, 0, Math.PI * 2); ctx.fill();

      /* clicked sparkle burst */
      if (k.clicked) {
        const burst = k.clickT / 0.5;
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          const rd = R * 1.2 + burst * R * 0.8;
          ctx.strokeStyle = `rgba(180,255,220,${(1 - burst) * 0.8})`;
          ctx.lineWidth   = 1.5;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * R * 1.1, Math.sin(a) * R * 1.1);
          ctx.lineTo(Math.cos(a) * rd,       Math.sin(a) * rd);
          ctx.stroke();
        }
      }

      ctx.restore();  /* head rotation */
      ctx.restore();  /* translate */
    }

    /* ── Draw ambient forest particles ── */
    const particles = Array.from({length: 30}, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: 0.8 + Math.random() * 2,
      vx: (Math.random() - 0.5) * 12,
      vy: -(Math.random() * 8 + 4),
      life: Math.random(),
      maxLife: 0.4 + Math.random() * 0.6,
    }));

    function updateParticles(dt) {
      particles.forEach(p => {
        p.x    += p.vx * dt;
        p.y    += p.vy * dt;
        p.life += dt / p.maxLife;
        if (p.life > 1) {
          p.x    = Math.random() * W;
          p.y    = H * 0.7 + Math.random() * H * 0.3;
          p.life = 0;
        }
        const a = Math.sin(p.life * Math.PI) * 0.45;
        ctx.fillStyle = `rgba(160,255,210,${a})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    /* ── Main loop ── */
    let elapsed = 0, last = null;

    function frame(ts) {
      if (cleanedUp) return;
      const dt = last ? Math.min((ts - last) / 1000, 0.05) : 0.016;
      last     = ts;
      elapsed += dt;

      ctx.clearRect(0, 0, W, H);

      updateParticles(dt);
      kodamas.forEach(k => {
        updateKodama(k, dt);
        drawKodama(k, elapsed);
      });

      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    /* ── Quote toast ── */
    function showQuote() {
      const toast = document.createElement('div');
      toast.style.cssText = [
        'position:fixed', 'bottom:5rem', 'left:50%',
        'transform:translateX(-50%)',
        'background:rgba(3,6,18,0.97)',
        'border:1.5px solid rgba(130,230,190,0.35)',
        'border-radius:12px',
        'padding:1.1rem 1.6rem',
        'text-align:center',
        'z-index:9999',
        'max-width:360px',
        'box-shadow:0 0 40px rgba(100,230,180,0.12)',
        'animation:toastIn 0.5s ease',
      ].join(';');
      toast.innerHTML = `
        <div style="font-size:1.5rem;margin-bottom:.45rem">🌿</div>
        <p style="font-style:italic;color:#d8f5ee;font-size:.82rem;line-height:1.6">${QUOTE}</p>
        <p style="font-family:'Fira Code',monospace;font-size:.68rem;color:#6adfc0;margin-top:.5rem">${ATTR}</p>`;
      document.body.appendChild(toast);
      setTimeout(() => {
        toast.style.animation = 'toastOut 0.4s ease forwards';
        setTimeout(() => toast.remove(), 400);
      }, 4500);
    }
  }

  /* ─── Public API ─── */
  window.awardPrize = function (answer) {
    if (answer === 'recursion')          return prizeConfetti();
    if (answer === 'moonlight sonata')   return prizePiano();
    if (answer === 'ghost of tsushima')  return prizeGame();
    if (answer === 'spirited away')      return prizeAnime();
  };

  window.prizeConfetti = prizeConfetti;

})();

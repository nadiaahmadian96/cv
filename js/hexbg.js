/* hexbg.js — particle network (replaces hexagons) sci-fi coding vibe */

(function () {
  const canvas = document.getElementById('hex-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  /* ─── Config ─── */
  const COUNT       = 72;
  const CONNECT_D   = 140;   // max px to draw line between particles
  const MOUSE_D     = 160;   // mouse repulsion radius
  const SPEED       = 0.38;  // base drift speed

  /* Magenta / purple palette */
  const COLORS = [
    [233, 30,  140],   // --accent magenta
    [139, 47,  255],   // --accent-2 purple
    [200, 80,  180],   // mid
  ];

  let W = 0, H = 0, particles = [], raf;
  const mouse = { x: -9999, y: -9999 };

  /* ─── Particle ─── */
  function makeParticle() {
    const c = COLORS[Math.floor(Math.random() * COLORS.length)];
    return {
      x:  Math.random() * W,
      y:  Math.random() * H,
      vx: (Math.random() - 0.5) * SPEED,
      vy: (Math.random() - 0.5) * SPEED,
      r:  Math.random() * 1.8 + 0.8,
      op: Math.random() * 0.45 + 0.15,
      cr: c[0], cg: c[1], cb: c[2],
    };
  }

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    particles = Array.from({ length: COUNT }, makeParticle);
  }

  /* ─── Update ─── */
  function update(p) {
    /* Mouse repulsion */
    const dx = p.x - mouse.x;
    const dy = p.y - mouse.y;
    const d2 = dx * dx + dy * dy;
    if (d2 < MOUSE_D * MOUSE_D) {
      const d  = Math.sqrt(d2);
      const f  = (MOUSE_D - d) / MOUSE_D * 0.9;
      p.vx += (dx / d) * f;
      p.vy += (dy / d) * f;
    }

    /* Dampen + move */
    p.vx *= 0.975;
    p.vy *= 0.975;
    p.x  += p.vx;
    p.y  += p.vy;

    /* Wrap */
    if (p.x < -10) p.x = W + 10;
    if (p.x > W + 10) p.x = -10;
    if (p.y < -10) p.y = H + 10;
    if (p.y > H + 10) p.y = -10;
  }

  /* ─── Draw frame ─── */
  function draw() {
    ctx.clearRect(0, 0, W, H);

    /* Connections */
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d  = Math.sqrt(dx * dx + dy * dy);
        if (d < CONNECT_D) {
          const alpha = (1 - d / CONNECT_D) * 0.35;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(233,30,140,${alpha.toFixed(3)})`;
          ctx.lineWidth = 0.7;
          ctx.stroke();
        }
      }
    }

    /* Dots */
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.cr},${p.cg},${p.cb},${p.op})`;
      ctx.fill();

      /* Small glow */
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.cr},${p.cg},${p.cb},${(p.op * 0.25).toFixed(3)})`;
      ctx.fill();
    });

    particles.forEach(update);
    raf = requestAnimationFrame(draw);
  }

  /* ─── Events ─── */
  window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
  window.addEventListener('touchmove', e => {
    if (e.touches.length) { mouse.x = e.touches[0].clientX; mouse.y = e.touches[0].clientY; }
  }, { passive: true });
  window.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });
  window.addEventListener('resize', () => {
    cancelAnimationFrame(raf);
    resize();
    raf = requestAnimationFrame(draw);
  });

  /* ─── Init ─── */
  canvas.style.position = 'fixed';
  canvas.style.inset    = '0';
  canvas.style.zIndex   = '-1';
  canvas.style.width    = '100%';
  canvas.style.height   = '100%';

  resize();
  raf = requestAnimationFrame(draw);
})();

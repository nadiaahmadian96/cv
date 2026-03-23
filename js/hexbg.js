/* hexbg.js — interactive animated hex-grid canvas background */

(function () {
  const canvas = document.getElementById('hex-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  /* ─── Config ─── */
  const CFG = {
    size:       38,        // hex circumradius
    gap:        3,         // gap between hexes
    idleSpeed:  0.0008,    // phase drift speed
    riseSpeed:  0.08,      // how fast a hex elevates toward mouse
    fallSpeed:  0.025,     // how fast it sinks back
    maxElev:    1.0,       // maximum elevation value
    radiusPx:   140,       // mouse influence radius
    colorBg:    '#eaeae8', // matches --bg
    colorHi:    '#00c896', // matches --accent
    colorLine:  '#c8c8c4', // resting hex stroke
    lineWidth:  1.2,
  };

  let W = 0, H = 0;
  let cols = 0, rows = 0;
  let cells = [];          // flat array of {cx, cy, elev, phase}
  let mouse = { x: -9999, y: -9999 };
  let raf;

  /* ─── Hex geometry ─── */
  // Flat-top hexagons
  const R  = CFG.size;
  const r  = R * Math.sqrt(3) / 2; // inradius
  const cw = R * 2 + CFG.gap;      // col step  (horiz distance between centres)
  const rh = r * 2 + CFG.gap;      // row step  (vert distance between centres)

  function hexPath(cx, cy, scale) {
    const s = R * scale;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;   // flat-top: 0°, 60°, …
      const x = cx + s * Math.cos(angle);
      const y = cy + s * Math.sin(angle);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  /* ─── Build grid ─── */
  function buildGrid() {
    cells = [];
    cols = Math.ceil(W / (cw * 0.75)) + 2;
    rows = Math.ceil(H / rh) + 2;

    for (let col = -1; col < cols; col++) {
      for (let row = -1; row < rows; row++) {
        const cx = col * cw * 0.75;
        // offset every other column by half a row
        const cy = row * rh + (col % 2 === 0 ? 0 : rh / 2);
        cells.push({
          cx,
          cy,
          elev:  0,
          phase: Math.random() * Math.PI * 2,
        });
      }
    }
  }

  /* ─── Resize ─── */
  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    buildGrid();
  }

  /* ─── Lerp colour between two hex strings ─── */
  function parseHex(h) {
    const v = parseInt(h.slice(1), 16);
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
  }
  const C_BG  = parseHex(CFG.colorBg);
  const C_LN  = parseHex(CFG.colorLine);
  const C_HI  = parseHex(CFG.colorHi);

  function lerpColour(a, b, t) {
    return `rgb(${Math.round(a[0]+(b[0]-a[0])*t)},${Math.round(a[1]+(b[1]-a[1])*t)},${Math.round(a[2]+(b[2]-a[2])*t)})`;
  }

  /* ─── Draw frame ─── */
  function draw(ts) {
    ctx.clearRect(0, 0, W, H);

    cells.forEach(cell => {
      /* idle pulse */
      const idle   = (Math.sin(ts * CFG.idleSpeed + cell.phase) + 1) / 2 * 0.12;

      /* mouse proximity */
      const dx     = cell.cx - mouse.x;
      const dy     = cell.cy - mouse.y;
      const dist   = Math.sqrt(dx * dx + dy * dy);
      const near   = Math.max(0, 1 - dist / CFG.radiusPx);

      /* update elevation */
      if (near > 0) {
        cell.elev = Math.min(CFG.maxElev, cell.elev + CFG.riseSpeed * near * 4);
      } else {
        cell.elev = Math.max(0, cell.elev - CFG.fallSpeed);
      }

      const e = Math.max(idle, cell.elev);  // combined influence

      /* scale: elevated hexes grow slightly */
      const scale = 1 - (1 - e) * 0.05;

      /* fill colour */
      const fillRgb   = lerpColour(C_BG, C_HI, e * 0.55);
      const strokeRgb = lerpColour(C_LN, C_HI, e);
      const alpha     = 0.18 + e * 0.55;

      hexPath(cell.cx, cell.cy, scale);

      /* fill (semi-transparent) */
      ctx.fillStyle = fillRgb.replace('rgb', 'rgba').replace(')', `,${alpha})`);
      ctx.fill();

      /* stroke */
      ctx.strokeStyle = strokeRgb;
      ctx.lineWidth   = CFG.lineWidth + e * 0.8;
      ctx.stroke();
    });

    raf = requestAnimationFrame(draw);
  }

  /* ─── Mouse / touch tracking ─── */
  window.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  }, { passive: true });

  window.addEventListener('touchmove', e => {
    if (e.touches.length) {
      mouse.x = e.touches[0].clientX;
      mouse.y = e.touches[0].clientY;
    }
  }, { passive: true });

  window.addEventListener('mouseleave', () => {
    mouse.x = -9999;
    mouse.y = -9999;
  });

  /* ─── Init ─── */
  window.addEventListener('resize', () => {
    cancelAnimationFrame(raf);
    resize();
    raf = requestAnimationFrame(draw);
  });

  resize();
  raf = requestAnimationFrame(draw);
})();

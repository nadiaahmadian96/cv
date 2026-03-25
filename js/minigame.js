/* minigame.js — Samurai Platformer: move, jump, slash skeleton warriors */

(function () {

  /* ─── Sprite constants ─── */
  const FW = 128, FH = 128, SCALE = 1.5;
  const DW = Math.round(FW * SCALE), DH = Math.round(FH * SCALE);

  const ANIMS = {
    s_idle: { src: 'assets/samurai/Idle.png',     frames: 6, fps: 8  },
    s_walk: { src: 'assets/samurai/Run.png',       frames: 8, fps: 12 },
    s_jump: { src: 'assets/samurai/Jump.png',      frames: 9, fps: 11, once: true },
    s_atk1: { src: 'assets/samurai/Attack_1.png',  frames: 4, fps: 16, once: true },
    s_atk2: { src: 'assets/samurai/Attack_2.png',  frames: 5, fps: 16, once: true },
    s_atk3: { src: 'assets/samurai/Attack_3.png',  frames: 4, fps: 16, once: true },
    s_hurt: { src: 'assets/samurai/Hurt.png',      frames: 3, fps: 12, once: true },
    s_dead: { src: 'assets/samurai/Dead.png',      frames: 6, fps: 7,  once: true },
    e_idle: { src: 'assets/Skeleton_Warrior/Idle.png',     frames: 7, fps: 8  },
    e_walk: { src: 'assets/Skeleton_Warrior/Walk.png',     frames: 7, fps: 9  },
    e_run:  { src: 'assets/Skeleton_Warrior/Run.png',      frames: 8, fps: 12 },
    e_atk1: { src: 'assets/Skeleton_Warrior/Attack_1.png', frames: 5, fps: 13, once: true },
    e_atk2: { src: 'assets/Skeleton_Warrior/Attack_2.png', frames: 6, fps: 13, once: true },
    e_hurt: { src: 'assets/Skeleton_Warrior/Hurt.png',     frames: 2, fps: 10, once: true },
    e_dead: { src: 'assets/Skeleton_Warrior/Dead.png',     frames: 4, fps: 8,  once: true },
  };

  /* ─── Physics ─── */
  const GRAVITY    = 1900;
  const JUMP_VEL   = -730;
  const MOVE_SPEED = 245;

  /* ─── Module vars ─── */
  let modal, canvas, ctx, animId;
  let imgs = {}, imgsReady = false;
  let keys = {};
  let player, enemies, particles, petals;
  let score, wave, hp, maxHp, shakeT, lastTime;
  let state; // 'start' | 'playing' | 'dead' | 'clear'
  let clearTimer;
  let PLATS;

  /* ══════════════════════════════════════
     OPEN
  ══════════════════════════════════════ */
  window.openGame = function () {
    if (!modal) buildUI();
    modal.style.display = 'flex';
    if (!imgsReady) preload(() => { imgsReady = true; initGame(); });
    else initGame();
  };

  /* ══════════════════════════════════════
     BUILD UI
  ══════════════════════════════════════ */
  function buildUI() {
    modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.92);display:none;align-items:center;justify-content:center;z-index:10000;flex-direction:column;gap:.7rem;';

    canvas = document.createElement('canvas');
    canvas.width  = Math.min(window.innerWidth  - 32, 720);
    canvas.height = Math.min(window.innerHeight - 90, 520);
    canvas.style.cssText = 'border-radius:12px;display:block;image-rendering:pixelated;image-rendering:crisp-edges;';
    ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const hint = document.createElement('p');
    hint.textContent = '← → move  ·  W / ↑ jump  ·  Z attack  (double jump!)';
    hint.style.cssText = 'color:rgba(255,255,255,0.2);font-family:"Fira Code",monospace;font-size:.65rem;letter-spacing:.08em;margin:0;';

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕ close';
    closeBtn.style.cssText = 'background:none;border:1px solid rgba(255,255,255,0.18);color:rgba(255,255,255,0.38);padding:.3rem 1rem;border-radius:6px;cursor:pointer;font-size:.78rem;font-family:"Fira Code",monospace;';
    closeBtn.onmouseenter = () => { closeBtn.style.color = '#e91e8c'; closeBtn.style.borderColor = '#e91e8c'; };
    closeBtn.onmouseleave = () => { closeBtn.style.color = 'rgba(255,255,255,0.38)'; closeBtn.style.borderColor = 'rgba(255,255,255,0.18)'; };
    closeBtn.onclick = () => { modal.style.display = 'none'; cancelAnimationFrame(animId); };

    /* Touch buttons */
    const touch = document.createElement('div');
    touch.style.cssText = 'display:flex;gap:.5rem;touch-action:none;';
    [
      ['←', () => keys.ArrowLeft = true,  () => keys.ArrowLeft = false],
      ['→', () => keys.ArrowRight = true, () => keys.ArrowRight = false],
      ['↑', () => doJump(),                () => {}],
      ['⚔', () => doAttack(),              () => {}],
    ].forEach(([lbl, dn, up]) => {
      const b = document.createElement('button');
      b.textContent = lbl;
      b.style.cssText = 'background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.18);color:rgba(255,255,255,0.65);width:54px;height:46px;border-radius:8px;cursor:pointer;font-size:1.1rem;touch-action:none;user-select:none;';
      b.addEventListener('touchstart', e => { e.preventDefault(); dn(); }, { passive: false });
      b.addEventListener('touchend',   e => { e.preventDefault(); up(); }, { passive: false });
      b.addEventListener('mousedown',  dn);
      b.addEventListener('mouseup',    up);
      touch.appendChild(b);
    });

    modal.append(canvas, hint, touch, closeBtn);
    modal.addEventListener('click', e => { if (e.target === modal) closeBtn.onclick(); });
    document.body.appendChild(modal);

    document.addEventListener('keydown', e => {
      if (modal.style.display === 'none') return;
      const prev = keys[e.code];
      keys[e.code] = true;
      if (['ArrowUp','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();
      if (!prev) {
        if (e.code === 'KeyW' || e.code === 'ArrowUp' || e.code === 'Space') doJump();
        if (e.code === 'KeyZ' || e.code === 'KeyJ'   || e.code === 'KeyX')  doAttack();
      }
    });
    document.addEventListener('keyup', e => { keys[e.code] = false; });
  }

  /* ══════════════════════════════════════
     PRELOAD
  ══════════════════════════════════════ */
  function preload(cb) {
    ctx.fillStyle = '#07070f'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#e91e8c'; ctx.font = '.9rem "Fira Code",monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('loading sprites...', canvas.width / 2, canvas.height / 2);
    let n = 0;
    const ks = Object.keys(ANIMS);
    ks.forEach(k => {
      const img = new Image();
      img.onload = img.onerror = () => { if (++n === ks.length) cb(); };
      img.src = ANIMS[k].src;
      imgs[k] = img;
    });
  }

  /* ══════════════════════════════════════
     INIT
  ══════════════════════════════════════ */
  function initGame() {
    const W = canvas.width, H = canvas.height;
    const gY = H - 18;

    PLATS = [
      { x: 0,       y: gY,       w: W,   h: 18, ground: true },
      { x: 60,      y: gY - 130, w: 170, h: 14 },
      { x: W/2-95,  y: gY - 195, w: 190, h: 14 },
      { x: W - 230, y: gY - 130, w: 170, h: 14 },
    ];

    score = 0; wave = 1; hp = 5; maxHp = 5;
    shakeT = 0; lastTime = 0; state = 'start'; clearTimer = 0;
    particles = []; petals = Array.from({ length: 22 }, () => newPetal(true));

    player = mkPlayer(120, gY);
    spawnWave();

    cancelAnimationFrame(animId);
    animId = requestAnimationFrame(loop);
  }

  function mkPlayer(x, y) {
    return {
      x, y, vx: 0, vy: 0,
      onGround: false, jumpsLeft: 2,
      facing: 1,
      anim: 's_idle', frame: 0, frameT: 0, done: false,
      invincible: 0,
      comboIdx: 0, comboWindow: 0,
      hitChecked: false,
      w: 42, h: 118,
    };
  }

  function spawnWave() {
    enemies = [];
    const W = canvas.width, gY = canvas.height - 18;
    const count = Math.min(2 + wave, 8);
    const xs = [W - 90, W - 230, W - 370, 80, 220, W - 510, 350, W - 140];
    for (let i = 0; i < count; i++) {
      enemies.push(mkEnemy(xs[i % xs.length], gY));
    }
  }

  function mkEnemy(x, y) {
    return {
      x, y, vx: 0, vy: 0,
      onGround: false,
      facing: x > canvas.width / 2 ? -1 : 1,
      hp: 2 + Math.floor(wave / 3),
      anim: 'e_idle', frame: 0, frameT: 0, done: false,
      eState: 'patrol',
      patrolDir: Math.random() > .5 ? 1 : -1,
      patrolT: Math.random() * 2,
      atkCooldown: Math.random() * 1.5,
      hitPlayer: false,
      w: 42, h: 108,
    };
  }

  /* ══════════════════════════════════════
     INPUT
  ══════════════════════════════════════ */
  function doJump() {
    if (state === 'start') { state = 'playing'; return; }
    if (state === 'dead')  { initGame(); return; }
    if (state !== 'playing') return;
    if (player.anim === 's_dead') return;
    if (player.jumpsLeft > 0) {
      player.vy = JUMP_VEL;
      player.jumpsLeft--;
      player.onGround = false;
      anim_set(player, 's_jump');
    }
  }

  function doAttack() {
    if (state === 'start') { state = 'playing'; return; }
    if (state === 'dead')  { initGame(); return; }
    if (state !== 'playing') return;
    const p = player;
    if (p.anim === 's_dead' || p.anim === 's_hurt') return;
    if (p.anim.startsWith('s_atk')) {
      // Buffer next hit in combo
      p.comboWindow = 0.38;
      return;
    }
    fireAttack();
  }

  function fireAttack() {
    const combos = ['s_atk1', 's_atk2', 's_atk3'];
    anim_set(player, combos[player.comboIdx % 3]);
    player.comboIdx++;
    player.hitChecked = false;
  }

  /* ══════════════════════════════════════
     ANIMATION
  ══════════════════════════════════════ */
  function anim_set(e, key) {
    if (e.anim === key && !ANIMS[key].once) return;
    e.anim = key; e.frame = 0; e.frameT = 0; e.done = false;
  }

  function anim_tick(e, dt) {
    if (e.done) return;
    const a = ANIMS[e.anim];
    e.frameT += dt * 1000;
    const d = 1000 / a.fps;
    while (e.frameT >= d) {
      e.frameT -= d;
      if (e.frame < a.frames - 1) e.frame++;
      else if (a.once) { e.done = true; return; }
      else e.frame = 0;
    }
  }

  /* ══════════════════════════════════════
     PHYSICS
  ══════════════════════════════════════ */
  function physics(e, dt) {
    const prevY = e.y;
    e.vy += GRAVITY * dt;
    e.x  += e.vx * dt;
    e.y  += e.vy * dt;
    e.onGround = false;

    PLATS.forEach(p => {
      if (e.x + e.w / 2 <= p.x || e.x - e.w / 2 >= p.x + p.w) return;
      // Land on top
      if (prevY <= p.y && e.y >= p.y && e.vy >= 0) {
        e.y = p.y; e.vy = 0; e.onGround = true;
        if (e === player) player.jumpsLeft = 2;
      }
    });

    const W = canvas.width;
    if (e.x - e.w / 2 < 0)  { e.x = e.w / 2;      e.vx = 0; }
    if (e.x + e.w / 2 > W)  { e.x = W - e.w / 2;  e.vx = 0; }
    if (e.y > canvas.height + 200) { e.y = canvas.height - 18; e.vy = 0; e.onGround = true; }
  }

  /* ══════════════════════════════════════
     MAIN LOOP
  ══════════════════════════════════════ */
  function loop(ts) {
    animId = requestAnimationFrame(loop);
    const dt = Math.min((ts - (lastTime || ts)) / 1000, 0.05);
    lastTime = ts;
    if (shakeT > 0) shakeT = Math.max(0, shakeT - dt);

    // Petals
    petals.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.rot += p.rv;
      if (p.y > canvas.height + 10) Object.assign(p, newPetal(false));
    });

    // Particles
    particles.forEach(p => {
      p.x += p.vx * dt * 60; p.y += p.vy * dt * 60;
      if (p.r) p.vy += 0.22 * dt * 60;
      p.alpha -= 0.028 * dt * 60;
    });
    particles = particles.filter(p => p.alpha > 0);

    if (state === 'playing') {
      updatePlayer(dt);
      updateEnemies(dt);
      if (enemies.length && enemies.every(e => e.eState === 'dead' && e.done)) {
        state = 'clear'; clearTimer = 2.4;
      }
    } else if (state === 'clear') {
      anim_tick(player, dt);
      clearTimer -= dt;
      if (clearTimer <= 0) { wave++; spawnWave(); state = 'playing'; }
    } else if (state === 'dead') {
      anim_tick(player, dt);
      enemies.forEach(e => anim_tick(e, dt));
    }

    render();
  }

  /* ══════════════════════════════════════
     UPDATE PLAYER
  ══════════════════════════════════════ */
  function updatePlayer(dt) {
    const p = player;
    if (p.anim === 's_dead') { anim_tick(p, dt); return; }

    p.invincible  = Math.max(0, p.invincible - dt);
    p.comboWindow = Math.max(0, p.comboWindow - dt);

    const left  = keys.ArrowLeft  || keys.KeyA;
    const right = keys.ArrowRight || keys.KeyD;
    const attacking = p.anim.startsWith('s_atk');

    // Movement (allowed during attack but slowed)
    if (!attacking) {
      if (left)       { p.vx = -MOVE_SPEED; p.facing = -1; }
      else if (right) { p.vx =  MOVE_SPEED; p.facing =  1; }
      else            { p.vx = 0; }
    } else {
      p.vx *= 0.75;
    }

    physics(p, dt);

    // Attack hit check at frame 1
    if (attacking && p.frame >= 1 && !p.hitChecked) {
      p.hitChecked = true;
      const reach = 115;
      enemies.forEach(e => {
        if (e.eState === 'dead') return;
        const dx = e.x - p.x;
        const inFront = p.facing === 1 ? dx > -30 : dx < 30;
        if (Math.abs(dx) < reach + e.w / 2 && inFront) hurtEnemy(e);
      });
    }

    // Attack done — chain combo or return
    if (attacking && p.done) {
      if (p.comboWindow > 0 && p.comboIdx < 3) { p.comboWindow = 0; fireAttack(); }
      else { p.comboIdx = 0; anim_set(p, 's_idle'); }
    }

    // Hurt done
    if (p.anim === 's_hurt' && p.done) {
      if (hp <= 0) { anim_set(p, 's_dead'); state = 'dead'; }
      else anim_set(p, 's_idle');
    }

    // Idle animation state
    if (!attacking && p.anim !== 's_hurt' && p.anim !== 's_dead') {
      if (!p.onGround) { if (p.anim !== 's_jump') anim_set(p, 's_jump'); }
      else if (Math.abs(p.vx) > 8) { if (p.anim !== 's_walk') anim_set(p, 's_walk'); }
      else { if (p.anim !== 's_idle') anim_set(p, 's_idle'); }
    }

    anim_tick(p, dt);
  }

  /* ══════════════════════════════════════
     UPDATE ENEMIES
  ══════════════════════════════════════ */
  function updateEnemies(dt) {
    enemies.forEach(e => {
      anim_tick(e, dt);
      if (e.eState === 'dead') return;
      e.atkCooldown = Math.max(0, e.atkCooldown - dt);
      physics(e, dt);

      const dx   = player.x - e.x;
      const dist = Math.abs(dx);

      if (e.eState === 'hurt') {
        if (e.done) {
          e.eState = e.hp <= 0 ? 'dead' : (dist < 320 ? 'chase' : 'patrol');
          if (e.eState === 'dead') anim_set(e, 'e_dead');
        }
        return;
      }

      if (e.eState === 'patrol') {
        e.patrolT += dt;
        e.vx = e.patrolDir * 62;
        e.facing = e.patrolDir;
        if (e.patrolT > 1.6 + Math.random()) { e.patrolDir *= -1; e.patrolT = 0; }
        if (e.anim !== 'e_walk') anim_set(e, 'e_walk');
        if (dist < 300) e.eState = 'chase';
      }

      else if (e.eState === 'chase') {
        if (dist > 420) { e.eState = 'patrol'; return; }
        e.facing = dx > 0 ? 1 : -1;
        e.vx = e.facing * (dist < 150 ? 110 : 180);
        if (e.anim !== 'e_run') anim_set(e, 'e_run');
        if (dist < 72 && e.atkCooldown <= 0) {
          e.eState = 'attack';
          e.vx = 0;
          anim_set(e, Math.random() < .5 ? 'e_atk1' : 'e_atk2');
          e.hitPlayer = false;
        }
      }

      else if (e.eState === 'attack') {
        e.vx = 0;
        // Hit lands at frame 2
        if (e.frame >= 2 && !e.hitPlayer) {
          e.hitPlayer = true;
          const inRange  = Math.abs(dx) < 88;
          const inFront  = e.facing === 1 ? player.x > e.x - 15 : player.x < e.x + 15;
          if (inRange && inFront && player.invincible <= 0 && player.anim !== 's_dead') {
            hp--;
            player.invincible = 1.1;
            shakeT = 0.2;
            anim_set(player, 's_hurt');
            burst(player.x, player.y - 100, '#ff4444', 6);
            if (hp <= 0) { anim_set(player, 's_dead'); state = 'dead'; }
          }
        }
        if (e.done) { e.eState = 'chase'; e.atkCooldown = 1.3; }
      }
    });
  }

  function hurtEnemy(e) {
    e.hp--;
    anim_set(e, 'e_hurt');
    e.eState = 'hurt';
    e.vx = e.facing * -80; // knockback
    score++;
    shakeT = 0.07;
    burst(e.x, e.y - 90, '#f0c060', 5);
    particles.push({ x: e.x, y: e.y - 80, vx: e.facing * 0.4, vy: -1.5, alpha: 1, text: e.hp <= 0 ? '💀' : '⚡', col: '#fff' });
  }

  function burst(x, y, col, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = 1.2 + Math.random() * 3.5;
      particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1.5, r: 2 + Math.random() * 3, alpha: 1, col });
    }
  }

  /* ══════════════════════════════════════
     RENDER
  ══════════════════════════════════════ */
  function render() {
    const W = canvas.width, H = canvas.height;

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    if (shakeT > 0) ctx.translate((Math.random() - .5) * 7, (Math.random() - .5) * 4);
    ctx.clearRect(-20, -20, W + 40, H + 40);

    drawBg(W, H);
    drawPlatforms();
    petals.forEach(drawPetal);
    particles.filter(p => p.r).forEach(drawPart);
    enemies.forEach(e => drawEnt(e));
    drawEnt(player, player.invincible > 0 && Math.sin(player.invincible * 28) > 0);
    particles.filter(p => p.text).forEach(drawPart);
    drawHUD(W);

    ctx.restore();

    // Overlays (outside shake)
    if (state === 'start') drawOverlay(W, H, '⚔  samurai', ['← → to move  ·  W / ↑ to jump  ·  Z to attack', 'press any key to begin']);
    if (state === 'dead' && player.done) drawOverlay(W, H, '⚔  fallen', [`wave ${wave}  ·  score: ${score}`, 'press Z or click to rise again']);
    if (state === 'clear') drawWaveClear(W, H);
  }

  function drawEnt(e, skip) {
    if (skip) return;
    const img = imgs[e.anim];
    if (!img || !img.naturalWidth) return;
    ctx.save();
    ctx.translate(e.x, e.y);
    if (e.facing === -1) ctx.scale(-1, 1);
    ctx.drawImage(img, e.frame * FW, 0, FW, FH, -DW / 2, -DH, DW, DH);
    ctx.restore();
  }

  function drawPlatforms() {
    PLATS.forEach(p => {
      if (p.ground) return;
      // Stone slab
      ctx.fillStyle = '#22103a';
      ctx.fillRect(p.x, p.y, p.w, p.h + 10);
      // Top edge glow
      ctx.strokeStyle = 'rgba(233,30,140,0.4)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + p.w, p.y); ctx.stroke();
      // Stone cracks
      ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 1;
      for (let bx = p.x + 22; bx < p.x + p.w - 10; bx += 22) {
        ctx.beginPath(); ctx.moveTo(bx, p.y + 1); ctx.lineTo(bx + 3, p.y + p.h + 8); ctx.stroke();
      }
    });
  }

  function drawBg(W, H) {
    const gY = H - 18;
    // Sky
    const sky = ctx.createLinearGradient(0, 0, 0, gY);
    sky.addColorStop(0, '#060612'); sky.addColorStop(1, '#110820');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, gY);
    // Moon
    const mX = W * .72, mY = H * .18;
    ctx.save();
    ctx.shadowColor = 'rgba(255,230,180,0.5)'; ctx.shadowBlur = 32;
    ctx.fillStyle = '#f5e8c8'; ctx.beginPath(); ctx.arc(mX, mY, 36, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(0,0,0,.07)';
    ctx.beginPath(); ctx.arc(mX - 10, mY - 6, 7, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // Far mountains
    ctx.fillStyle = '#0c0918'; ctx.beginPath(); ctx.moveTo(0, gY);
    [[W*.08,140],[W*.22,88],[W*.38,172],[W*.54,108],[W*.7,152],[W*.88,98],[W,68]].forEach(([x,y]) => ctx.lineTo(x, gY - y));
    ctx.lineTo(W, gY); ctx.closePath(); ctx.fill();
    // Near mountains
    ctx.fillStyle = '#0d0a1a'; ctx.beginPath(); ctx.moveTo(0, gY);
    [[W*.12,68],[W*.28,42],[W*.44,88],[W*.6,54],[W*.76,72],[W*.92,46],[W,34]].forEach(([x,y]) => ctx.lineTo(x, gY - y));
    ctx.lineTo(W, gY); ctx.closePath(); ctx.fill();
    // Torii
    const tX = W * .62;
    ctx.fillStyle = '#1e0a0a';
    ctx.fillRect(tX-26, gY-78, 6, 78); ctx.fillRect(tX+20, gY-78, 6, 78);
    ctx.fillRect(tX-36, gY-78, 72, 8); ctx.fillRect(tX-28, gY-66, 56, 6);
    ctx.strokeStyle = '#1e0a0a'; ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(tX-38, gY-76); ctx.quadraticCurveTo(tX, gY-94, tX+38, gY-76); ctx.stroke();
    // Ground
    const gr = ctx.createLinearGradient(0, gY, 0, H);
    gr.addColorStop(0, '#1a0c0c'); gr.addColorStop(1, '#0e0808');
    ctx.fillStyle = gr; ctx.fillRect(0, gY, W, H - gY);
    ctx.strokeStyle = 'rgba(233,30,140,0.22)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, gY); ctx.lineTo(W, gY); ctx.stroke();
  }

  function drawHUD(W) {
    ctx.save(); ctx.textBaseline = 'top'; ctx.font = '1rem "Fira Code",monospace';
    // Hearts
    let hearts = '';
    for (let i = 0; i < maxHp; i++) hearts += i < hp ? '♥' : '♡';
    ctx.fillStyle = '#e91e8c'; ctx.textAlign = 'left'; ctx.fillText(hearts, 12, 10);
    // Wave + score
    ctx.font = '.8rem "Fira Code",monospace'; ctx.textAlign = 'right';
    ctx.fillText(`wave ${wave}  ·  ${enemies.filter(e => e.eState !== 'dead').length} left  ·  ${score}pts`, W - 12, 10);
    ctx.restore();
  }

  function drawOverlay(W, H, title, lines) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.65)'; ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = 'bold 1.85rem "Fira Code",monospace'; ctx.fillStyle = '#e91e8c';
    ctx.shadowColor = '#e91e8c'; ctx.shadowBlur = 22;
    ctx.fillText(title, W / 2, H / 2 - 32); ctx.shadowBlur = 0;
    ctx.font = '.8rem "Fira Code",monospace';
    lines.forEach((l, i) => {
      ctx.fillStyle = i === 0 ? 'rgba(237,232,255,0.55)' : 'rgba(233,30,140,0.75)';
      ctx.fillText(l, W / 2, H / 2 + 14 + i * 30);
    });
    ctx.restore();
  }

  function drawWaveClear(W, H) {
    const fade = Math.min(1, 1 - clearTimer / 2.4);
    ctx.save();
    ctx.fillStyle = `rgba(0,0,0,${fade * 0.45})`; ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.globalAlpha = fade;
    ctx.font = 'bold 1.65rem "Fira Code",monospace'; ctx.fillStyle = '#f0c060';
    ctx.shadowColor = '#f0c060'; ctx.shadowBlur = 20;
    ctx.fillText(`wave ${wave} cleared  ⚔`, W / 2, H / 2);
    ctx.restore();
  }

  function drawPart(p) {
    ctx.save(); ctx.globalAlpha = Math.max(0, p.alpha);
    if (p.text) {
      ctx.font = 'bold .85rem "Fira Code",monospace'; ctx.fillStyle = p.col;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(p.text, p.x, p.y);
    } else {
      ctx.shadowColor = p.col; ctx.shadowBlur = 8; ctx.fillStyle = p.col;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  function drawPetal(p) {
    ctx.save(); ctx.globalAlpha = p.alpha; ctx.translate(p.x, p.y); ctx.rotate(p.rot);
    ctx.fillStyle = '#c02060'; ctx.beginPath(); ctx.ellipse(0, 0, p.r, p.r * .48, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function newPetal(rnd) {
    const W = canvas ? canvas.width : 720, H = canvas ? canvas.height : 520;
    return { x: Math.random() * W, y: rnd ? Math.random() * H : -8, r: 2 + Math.random() * 4,
      vx: -0.22 - Math.random() * .45, vy: .38 + Math.random() * .75,
      rot: Math.random() * Math.PI * 2, rv: (Math.random() - .5) * .05, alpha: .1 + Math.random() * .26 };
  }

})();

/* piano.js
   2-octave piano · circular audio visualizer · chord detection · sustain · velocity
*/
(function () {

  /* ── Elements ── */
  const btn        = document.getElementById('piano-btn');
  const modal      = document.getElementById('piano-modal');
  const closeBtn   = document.getElementById('piano-close');
  const keysEl     = document.getElementById('piano-keys');
  const vizEl      = document.getElementById('piano-viz');
  const sustainInd = document.getElementById('piano-sustain-ind');
  if (!btn || !modal || !keysEl) return;

  /* ══════════════════════════════════════════
     AUDIO ENGINE
  ══════════════════════════════════════════ */
  let ac        = null;
  let analyser  = null;
  let masterOut = null;

  function initAudio() {
    if (ac) {
      if (ac.state === 'suspended') ac.resume();
      return;
    }
    ac = new (window.AudioContext || window.webkitAudioContext)();
    ac.resume();

    analyser = ac.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.80;

    masterOut = ac.createGain();
    masterOut.gain.value = 0.28;
    masterOut.connect(analyser);
    analyser.connect(ac.destination);
  }

  /* Active / sustained note maps: noteId → { oscs[], envGain, hue } */
  const activeNotes   = new Map();
  const sustainedNotes = new Map();
  let sustainOn = false;

  function noteOn(note, velocity) {
    initAudio();
    /* retrigger if already sounding */
    if (activeNotes.has(note.note) || sustainedNotes.has(note.note)) {
      _stopNote(activeNotes.get(note.note) || sustainedNotes.get(note.note), true);
      activeNotes.delete(note.note);
      sustainedNotes.delete(note.note);
    }

    const vol     = Math.max(0.3, Math.min(1, velocity || 0.8));
    const envGain = ac.createGain();
    envGain.connect(masterOut);

    /* Piano-like harmonics */
    const harmonics = [
      { type:'triangle', mult:1,    amp:0.58 },
      { type:'sine',     mult:2,    amp:0.20 },
      { type:'sine',     mult:3,    amp:0.09 },
      { type:'sine',     mult:4,    amp:0.04 },
      { type:'sine',     mult:0.5,  amp:0.06 },
    ];

    const oscs = harmonics.map(h => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = h.type;
      o.frequency.value = note.freq * h.mult;
      g.gain.value = h.amp;
      o.connect(g);
      g.connect(envGain);
      o.start(ac.currentTime);
      return o;
    });

    /* ADSR — fast attack, piano-like decay into sustain */
    const t = ac.currentTime;
    envGain.gain.setValueAtTime(0, t);
    envGain.gain.linearRampToValueAtTime(vol, t + 0.007);
    envGain.gain.exponentialRampToValueAtTime(vol * 0.5, t + 0.1);

    activeNotes.set(note.note, { oscs, envGain, hue: noteHue(note.note) });
  }

  function _stopNote(data, immediate) {
    if (!data) return;
    const { oscs, envGain } = data;
    const tc = immediate ? 0.012 : 0.28;
    envGain.gain.cancelScheduledValues(ac.currentTime);
    envGain.gain.setTargetAtTime(0.0001, ac.currentTime, tc);
    oscs.forEach(o => { try { o.stop(ac.currentTime + tc * 6); } catch (_) {} });
  }

  function handleRelease(note) {
    const data = activeNotes.get(note.note);
    if (!data) return;
    if (sustainOn) {
      sustainedNotes.set(note.note, data);
      activeNotes.delete(note.note);
    } else {
      _stopNote(data, false);
      activeNotes.delete(note.note);
    }
    updateChord();
  }

  function releaseSustained() {
    sustainedNotes.forEach((data) => _stopNote(data, false));
    sustainedNotes.clear();
    updateChord();
  }

  /* ══════════════════════════════════════════
     CHORD DETECTION
  ══════════════════════════════════════════ */
  const SEMITONE = {C:0,'C#':1,D:2,'D#':3,E:4,F:5,'F#':6,G:7,'G#':8,A:9,'A#':10,B:11};
  const CHORD_MAP = {
    '0,4,7':'maj',     '0,3,7':'min',      '0,3,6':'dim',      '0,4,8':'aug',
    '0,2,7':'sus2',    '0,5,7':'sus4',
    '0,4,7,10':'7',    '0,4,7,11':'maj7',  '0,3,7,10':'min7',  '0,3,6,10':'m7♭5',
    '0,4,6,10':'7♭5',  '0,3,7,9':'min6',   '0,4,7,9':'6',
  };

  function baseName(noteId) { return noteId.replace(/\d/, ''); }

  let currentChord = '';

  function updateChord() {
    const names = [...new Set(
      [...activeNotes.keys(), ...sustainedNotes.keys()].map(baseName)
    )];

    if (names.length === 0) { currentChord = ''; return; }
    if (names.length === 1) { currentChord = names[0]; return; }

    const semis = names.map(n => SEMITONE[n] ?? 0).sort((a, b) => a - b);

    for (let r = 0; r < semis.length; r++) {
      const root = semis[r];
      const ivs  = semis.map(s => (s - root + 12) % 12).sort((a,b) => a-b).join(',');
      const type = CHORD_MAP[ivs];
      if (type) {
        const rootName = Object.keys(SEMITONE).find(k => SEMITONE[k] === root);
        currentChord = rootName + ' ' + type;
        return;
      }
    }
    currentChord = names.slice(0, 4).join(' · ');
  }

  /* ══════════════════════════════════════════
     VISUALIZER
  ══════════════════════════════════════════ */
  const vCtx = vizEl ? vizEl.getContext('2d') : null;
  let   rafId = null;
  let   vizT  = 0;
  let   prevTs = null;

  function resizeViz() {
    if (!vizEl) return;
    vizEl.width = vizEl.parentElement.clientWidth - 32;
  }

  /* Chromatic hue wheel — 12 evenly-spaced hues */
  const HUE_MAP = {C:0,'C#':30,D:60,'D#':90,E:120,F:160,'F#':195,G:215,'G#':240,A:270,'A#':300,B:330};
  function noteHue(noteId) { return HUE_MAP[baseName(noteId)] ?? 0; }

  function dominantHue() {
    const all = [...activeNotes.values(), ...sustainedNotes.values()];
    if (!all.length) return 210;
    /* circular average of hues */
    let sx = 0, sy = 0;
    all.forEach(d => {
      const r = d.hue * Math.PI / 180;
      sx += Math.cos(r); sy += Math.sin(r);
    });
    const h = Math.atan2(sy, sx) * 180 / Math.PI;
    return ((h % 360) + 360) % 360;
  }

  function drawFrame(ts) {
    if (!vCtx) return;
    const W  = vizEl.width;
    const H  = vizEl.height;
    const cx = W / 2;
    const cy = H / 2;
    const dt = prevTs ? Math.min((ts - prevTs) / 1000, 0.05) : 0.016;
    prevTs = ts;
    vizT  += dt;

    vCtx.clearRect(0, 0, W, H);

    const hue = dominantHue();
    const R   = Math.min(W * 0.13, H * 0.35);   /* circle base radius */
    const sounding = activeNotes.size + sustainedNotes.size > 0;

    /* ── Outer ambient glow (always) ── */
    const ambientR = analyser ? R * 1.9 : R * (1.5 + 0.06 * Math.sin(vizT * 1.5));
    const ambGrad  = vCtx.createRadialGradient(cx, cy, R * 0.6, cx, cy, ambientR);
    ambGrad.addColorStop(0, `hsla(${hue},70%,55%,${sounding ? 0.12 : 0.06})`);
    ambGrad.addColorStop(1, `hsla(${hue},60%,40%,0)`);
    vCtx.fillStyle = ambGrad;
    vCtx.beginPath();
    vCtx.arc(cx, cy, ambientR, 0, Math.PI * 2);
    vCtx.fill();

    if (!analyser || !sounding) {
      /* ── Idle: smooth breathing circle ── */
      const pulse = 1 + 0.04 * Math.sin(vizT * 1.6);
      vCtx.save();
      vCtx.shadowColor = `hsla(${hue},70%,65%,.7)`;
      vCtx.shadowBlur  = 20;
      vCtx.strokeStyle = `hsla(${hue},65%,68%,.4)`;
      vCtx.lineWidth   = 1.8;
      vCtx.beginPath();
      vCtx.arc(cx, cy, R * pulse, 0, Math.PI * 2);
      vCtx.stroke();
      /* inner dot */
      vCtx.fillStyle = `hsla(${hue},60%,65%,.18)`;
      vCtx.beginPath();
      vCtx.arc(cx, cy, R * 0.22, 0, Math.PI * 2);
      vCtx.fill();
      vCtx.restore();
    } else {
      /* ── Active: waveform circle ── */
      const bufLen = analyser.frequencyBinCount;
      const data   = new Uint8Array(bufLen);
      analyser.getByteTimeDomainData(data);

      const POINTS = 360;
      const step   = Math.floor(bufLen / POINTS);

      /* energy for outer ring */
      let energy = 0;
      for (let i = 0; i < bufLen; i++) energy += Math.abs(data[i] - 128);
      energy /= bufLen * 128;

      /* inner fill */
      const innerGrad = vCtx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.4);
      innerGrad.addColorStop(0,   `hsla(${hue},55%,22%,.22)`);
      innerGrad.addColorStop(0.7, `hsla(${hue},50%,14%,.12)`);
      innerGrad.addColorStop(1,   'rgba(0,0,0,0)');

      /* outer waveform ring */
      vCtx.save();
      vCtx.shadowColor = `hsla(${hue},85%,68%,.95)`;
      vCtx.shadowBlur  = 18 + energy * 24;
      vCtx.strokeStyle = `hsla(${hue},80%,72%,.92)`;
      vCtx.lineWidth   = 2.2;
      vCtx.beginPath();
      for (let i = 0; i <= POINTS; i++) {
        const v = data[(i % POINTS) * step] / 128 - 1;
        const a = (i / POINTS) * Math.PI * 2 - Math.PI / 2;
        const r = R + v * R * 0.52;
        const x = cx + r * Math.cos(a);
        const y = cy + r * Math.sin(a);
        i === 0 ? vCtx.moveTo(x, y) : vCtx.lineTo(x, y);
      }
      vCtx.closePath();
      vCtx.fillStyle = innerGrad;
      vCtx.fill();
      vCtx.stroke();

      /* secondary thin ring */
      vCtx.shadowBlur  = 8;
      vCtx.strokeStyle = `hsla(${hue},70%,60%,${energy * 0.65})`;
      vCtx.lineWidth   = 1;
      vCtx.beginPath();
      vCtx.arc(cx, cy, R * (1.3 + energy * 0.35), 0, Math.PI * 2);
      vCtx.stroke();

      vCtx.restore();
    }

    /* ── Chord / note label in center ── */
    if (currentChord) {
      vCtx.save();
      vCtx.textAlign    = 'center';
      vCtx.textBaseline = 'middle';
      const isChord  = currentChord.includes(' ');
      const fontSize = Math.min(isChord ? 28 : 34, R * 0.7);
      vCtx.font      = `700 ${fontSize}px -apple-system, sans-serif`;
      vCtx.fillStyle = `hsla(${hue},85%,88%,.92)`;
      vCtx.shadowColor = `hsla(${hue},90%,70%,.8)`;
      vCtx.shadowBlur  = 16;
      vCtx.fillText(currentChord, cx, cy);
      vCtx.restore();
    }
  }

  function startViz() {
    resizeViz();
    if (rafId) return;
    function loop(ts) { drawFrame(ts); rafId = requestAnimationFrame(loop); }
    rafId = requestAnimationFrame(loop);
  }
  function stopViz() {
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; prevTs = null; }
  }

  /* ══════════════════════════════════════════
     NOTE DEFINITIONS  C4 – B5  (2 octaves, 24 notes)
  ══════════════════════════════════════════ */
  const NOTES = [
    {note:'C4',  freq:261.63, type:'white', kbd:'z', label:'C'},
    {note:'C#4', freq:277.18, type:'black', kbd:'s', label:''},
    {note:'D4',  freq:293.66, type:'white', kbd:'x', label:'D'},
    {note:'D#4', freq:311.13, type:'black', kbd:'d', label:''},
    {note:'E4',  freq:329.63, type:'white', kbd:'c', label:'E'},
    {note:'F4',  freq:349.23, type:'white', kbd:'v', label:'F'},
    {note:'F#4', freq:369.99, type:'black', kbd:'g', label:''},
    {note:'G4',  freq:392.00, type:'white', kbd:'b', label:'G'},
    {note:'G#4', freq:415.30, type:'black', kbd:'h', label:''},
    {note:'A4',  freq:440.00, type:'white', kbd:'n', label:'A'},
    {note:'A#4', freq:466.16, type:'black', kbd:'j', label:''},
    {note:'B4',  freq:493.88, type:'white', kbd:'m', label:'B'},
    {note:'C5',  freq:523.25, type:'white', kbd:'q', label:'C'},
    {note:'C#5', freq:554.37, type:'black', kbd:'2', label:''},
    {note:'D5',  freq:587.33, type:'white', kbd:'w', label:'D'},
    {note:'D#5', freq:622.25, type:'black', kbd:'3', label:''},
    {note:'E5',  freq:659.25, type:'white', kbd:'e', label:'E'},
    {note:'F5',  freq:698.46, type:'white', kbd:'r', label:'F'},
    {note:'F#5', freq:739.99, type:'black', kbd:'5', label:''},
    {note:'G5',  freq:783.99, type:'white', kbd:'t', label:'G'},
    {note:'G#5', freq:830.61, type:'black', kbd:'6', label:''},
    {note:'A5',  freq:880.00, type:'white', kbd:'y', label:'A'},
    {note:'A#5', freq:932.33, type:'black', kbd:'7', label:''},
    {note:'B5',  freq:987.77, type:'white', kbd:'u', label:'B'},
  ];

  /* ── Build keyboard ── */
  const whites  = NOTES.filter(n => n.type === 'white');
  const blacks  = NOTES.filter(n => n.type === 'black');
  const TOTAL_W = whites.length;

  function blackLeft(n) {
    const wNames  = whites.map(w => w.note);
    const nameMap = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
    const base    = baseName(n.note);
    const oct     = parseInt(n.note.slice(-1));
    const prev    = nameMap[nameMap.indexOf(base) - 1] + oct;
    const wIdx    = wNames.indexOf(prev);
    return ((wIdx + 1) / TOTAL_W * 100) - (5.4 / 2) + '%';
  }

  const mouseHeld = new Set();
  const kbdHeld   = new Set();

  whites.forEach(n => {
    const el = document.createElement('div');
    el.className    = 'key-white';
    el.dataset.note = n.note;
    if (n.label === 'C') el.dataset.c = '';
    el.style.setProperty('--hue', noteHue(n.note));
    el.innerHTML = `<span class="key-note">${n.label}</span><span class="key-kbd">${n.kbd.toUpperCase()}</span>`;

    el.addEventListener('mousedown', e => {
      const rect = el.getBoundingClientRect();
      const vel  = 0.4 + 0.6 * ((e.clientY - rect.top) / rect.height);
      noteOn(n, vel);
      mouseHeld.add(n.note);
      el.classList.add('pressed');
      updateChord();
    });
    el.addEventListener('mouseup', () => {
      mouseHeld.delete(n.note);
      handleRelease(n);
      el.classList.remove('pressed');
    });
    el.addEventListener('mouseleave', () => {
      if (mouseHeld.has(n.note)) {
        mouseHeld.delete(n.note);
        handleRelease(n);
        el.classList.remove('pressed');
      }
    });
    keysEl.appendChild(el);
  });

  blacks.forEach(n => {
    const el = document.createElement('div');
    el.className    = 'key-black';
    el.dataset.note = n.note;
    el.style.left   = blackLeft(n);
    el.style.setProperty('--hue', noteHue(n.note));
    el.innerHTML    = `<span class="key-kbd">${n.kbd.toUpperCase()}</span>`;

    el.addEventListener('mousedown', e => {
      e.stopPropagation();
      noteOn(n, 0.85);
      mouseHeld.add(n.note);
      el.classList.add('pressed');
      updateChord();
    });
    el.addEventListener('mouseup', () => {
      mouseHeld.delete(n.note);
      handleRelease(n);
      el.classList.remove('pressed');
    });
    el.addEventListener('mouseleave', () => {
      if (mouseHeld.has(n.note)) {
        mouseHeld.delete(n.note);
        handleRelease(n);
        el.classList.remove('pressed');
      }
    });
    keysEl.appendChild(el);
  });

  /* ── Keyboard input ── */
  const kbdMap = {};
  NOTES.forEach(n => { kbdMap[n.kbd] = n; });

  document.addEventListener('keydown', e => {
    if (!modal.classList.contains('open')) return;
    if (e.key === 'Escape') { closePiano(); return; }

    if (e.code === 'Space') {
      e.preventDefault();
      if (!sustainOn) {
        sustainOn = true;
        if (sustainInd) { sustainInd.textContent = 'sustain on'; sustainInd.classList.add('active'); }
      }
      return;
    }

    if (e.repeat) return;
    const n = kbdMap[e.key.toLowerCase()];
    if (!n || kbdHeld.has(n.note)) return;
    kbdHeld.add(n.note);
    noteOn(n, 0.8);
    const el = keysEl.querySelector(`[data-note="${n.note}"]`);
    if (el) el.classList.add('pressed');
    updateChord();
  });

  document.addEventListener('keyup', e => {
    if (!modal.classList.contains('open')) return;

    if (e.code === 'Space') {
      sustainOn = false;
      if (sustainInd) { sustainInd.textContent = 'sustain off'; sustainInd.classList.remove('active'); }
      releaseSustained();
      return;
    }

    const n = kbdMap[e.key.toLowerCase()];
    if (!n) return;
    kbdHeld.delete(n.note);
    handleRelease(n);
    const el = keysEl.querySelector(`[data-note="${n.note}"]`);
    if (el) el.classList.remove('pressed');
  });

  /* ══════════════════════════════════════════
     OPEN / CLOSE
  ══════════════════════════════════════════ */
  window.openPiano = function () {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    startViz();
  };

  function closePiano() {
    activeNotes.forEach(d => _stopNote(d, true));
    activeNotes.clear();
    sustainedNotes.forEach(d => _stopNote(d, true));
    sustainedNotes.clear();
    sustainOn = false;
    kbdHeld.clear(); mouseHeld.clear();
    currentChord = '';
    keysEl.querySelectorAll('.pressed').forEach(el => el.classList.remove('pressed'));
    if (sustainInd) { sustainInd.textContent = 'sustain off'; sustainInd.classList.remove('active'); }
    modal.classList.remove('open');
    document.body.style.overflow = '';
    stopViz();
  }

  btn.addEventListener('click', window.openPiano);
  closeBtn.addEventListener('click', closePiano);
  modal.addEventListener('click', e => { if (e.target === modal) closePiano(); });

  /* ── pianoPlayNote: called by riddle-prizes.js ── */
  window.pianoPlayNote = function (freq) {
    const n = NOTES.find(nd => Math.abs(nd.freq - freq) < 1);
    if (!n) return;
    noteOn(n, 0.72);
    const el = keysEl.querySelector(`[data-note="${n.note}"]`);
    if (el) {
      el.classList.add('pressed');
      setTimeout(() => el.classList.remove('pressed'), 300);
    }
    updateChord();
    setTimeout(() => {
      _stopNote(activeNotes.get(n.note), false);
      activeNotes.delete(n.note);
      updateChord();
    }, 1400);
  };

})();

/* piano.js — mini piano easter egg with Web Audio API */

(function () {
  const btn    = document.getElementById('piano-btn');
  const modal  = document.getElementById('piano-modal');
  const close  = document.getElementById('piano-close');
  const keysEl = document.getElementById('piano-keys');
  if (!btn || !modal || !keysEl) return;

  /* ─── Audio ─── */
  let audioCtx = null;
  function getCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
  }

  function playNote(freq) {
    const ac  = getCtx();
    const env = ac.createGain();
    const master = ac.createGain();
    master.gain.value = 0.20;

    const oscs = [
      { type: 'triangle', freq: freq },
      { type: 'sine',     freq: freq * 2 },
      { type: 'sine',     freq: freq * 3 },
    ].map(({ type, freq: f }) => {
      const o = ac.createOscillator();
      o.type = type;
      o.frequency.value = f;
      o.connect(env);
      return o;
    });

    env.connect(master);
    master.connect(ac.destination);
    env.gain.setValueAtTime(0, ac.currentTime);
    env.gain.linearRampToValueAtTime(0.9,  ac.currentTime + 0.008);
    env.gain.exponentialRampToValueAtTime(0.35, ac.currentTime + 0.12);
    env.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 1.8);

    oscs.forEach(o => { o.start(ac.currentTime); o.stop(ac.currentTime + 1.8); });
  }

  /* ─── Note data ─── */
  const notes = [
    { note:'C4',  freq:261.63, type:'white', kbd:'a' },
    { note:'C#4', freq:277.18, type:'black', kbd:'w' },
    { note:'D4',  freq:293.66, type:'white', kbd:'s' },
    { note:'D#4', freq:311.13, type:'black', kbd:'e' },
    { note:'E4',  freq:329.63, type:'white', kbd:'d' },
    { note:'F4',  freq:349.23, type:'white', kbd:'f' },
    { note:'F#4', freq:369.99, type:'black', kbd:'t' },
    { note:'G4',  freq:392.00, type:'white', kbd:'g' },
    { note:'G#4', freq:415.30, type:'black', kbd:'y' },
    { note:'A4',  freq:440.00, type:'white', kbd:'h' },
    { note:'A#4', freq:466.16, type:'black', kbd:'u' },
    { note:'B4',  freq:493.88, type:'white', kbd:'j' },
    { note:'C5',  freq:523.25, type:'white', kbd:'k' },
    { note:'C#5', freq:554.37, type:'black', kbd:'o' },
    { note:'D5',  freq:587.33, type:'white', kbd:'l' },
    { note:'D#5', freq:622.25, type:'black', kbd:'p' },
    { note:'E5',  freq:659.25, type:'white', kbd:';' },
  ];

  const whites = notes.filter(n => n.type === 'white');
  const blacks = notes.filter(n => n.type === 'black');
  const total  = whites.length;

  /* Black key left-offset by name+octave */
  const blackOffset = { 'C#4':1,'D#4':2,'F#4':4,'G#4':5,'A#4':6,'C#5':8,'D#5':9,'D#5':10 };
  // recalculate properly by white-key index
  function blackLeft(note) {
    const whiteNames = whites.map(n => n.note);
    // find the white key just before this black key
    const noteNames = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
    const noteIdx   = noteNames.indexOf(note.note.replace(/\d/,''));
    const oct       = parseInt(note.note.slice(-1));
    // previous white
    const prevWhiteName = noteNames[noteIdx - 1];
    const prevWhiteNote = prevWhiteName + oct;
    const wIdx = whiteNames.indexOf(prevWhiteNote);
    // position: (wIdx+1)/total * 100 - half black key width
    return ((wIdx + 1) / total * 100) - (5.8 / 2) + '%';
  }

  /* ─── Build keyboard ─── */
  whites.forEach(n => {
    const el = document.createElement('div');
    el.className = 'key-white';
    el.dataset.note = n.note;
    el.innerHTML = `<span>${n.kbd.toUpperCase()}</span>`;
    el.addEventListener('mousedown', () => { playNote(n.freq); flash(el); });
    keysEl.appendChild(el);
  });

  blacks.forEach(n => {
    const el = document.createElement('div');
    el.className = 'key-black';
    el.dataset.note = n.note;
    el.style.left = blackLeft(n);
    el.innerHTML = `<span>${n.kbd.toUpperCase()}</span>`;
    el.addEventListener('mousedown', e => { e.stopPropagation(); playNote(n.freq); flash(el); });
    keysEl.appendChild(el);
  });

  function flash(el) {
    el.classList.add('pressed');
    setTimeout(() => el.classList.remove('pressed'), 280);
  }

  /* ─── Keyboard input ─── */
  const kbdMap = {};
  notes.forEach(n => { kbdMap[n.kbd] = n; });

  document.addEventListener('keydown', e => {
    if (e.repeat) return;
    const n = kbdMap[e.key.toLowerCase()];
    if (n && modal.classList.contains('open')) {
      playNote(n.freq);
      const el = keysEl.querySelector(`[data-note="${n.note}"]`);
      if (el) flash(el);
    }
    if (e.key === 'Escape') closePiano();
  });

  /* ─── Open / close ─── */
  btn.addEventListener('click', () => {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  });

  function closePiano() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  close.addEventListener('click', closePiano);
  modal.addEventListener('click', e => { if (e.target === modal) closePiano(); });
})();

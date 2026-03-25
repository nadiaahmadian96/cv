/* experience-boot.js — MacBook power-on sequence + code typewriter */

(function () {
  /* Token shorthand helpers */
  const cm = t => ({ t, c: 'cm' }); // comment
  const kw = t => ({ t, c: 'kw' }); // keyword
  const vr = t => ({ t, c: 'vr' }); // variable
  const tp = t => ({ t, c: 'tp' }); // type
  const ky = t => ({ t, c: 'ky' }); // object key
  const st = t => ({ t, c: 'st' }); // string
  const pt = t => ({ t, c: 'pt' }); // punctuation / default

  /* ─── Job definitions ─── */
  const JOBS = {
    ashna: {
      addr: '~/work/ashna-software.ts',
      meta: 'Full-Time · Jun 2022 — Oct 2025',
      lines: [
        [cm('// Full-Stack Developer @ Ashna Software')],
        [cm('// Jun 2022 — Oct 2025  ·  Full-Time · Vancouver, BC')],
        [],
        [kw('const '), vr('role'), pt(': '), tp('Experience'), pt(' = {')],
        [ky('  title:   '), st('"Full-Stack Developer"'), pt(',')],
        [ky('  company: '), st('"Ashna Software"'), pt(',')],
        [ky('  type:    '), st('"Full-Time"'), pt(',')],
        [],
        [cm('  // Real-time guard tour & enterprise facility platform')],
        [ky('  built'), pt(': [')],
        [pt('    '), st('"Guard tour system: NFC, BLE, QR codes, and live GPS tracking."'), pt(',')],
        [pt('    '), st('"Patrol ops for 200+ sites — incidents, live maps, audit logs."'), pt(',')],
        [pt('    '), st('"React dashboard with real-time alerts and exportable reports."'), pt(',')],
        [pt('    '), st('"REST APIs in Node.js, Express, .NET Core, and C# — dual DB."'), pt(',')],
        [pt('    '), st('"SQL Server for transactions, MongoDB for 50k+ daily event logs."'), pt(',')],
        [pt('    '), st('"Facility platform: multi-step approvals, reservations, payments."'), pt(',')],
        [pt('    '), st('"AWS EC2/S3, CloudWatch alerts, Docker-based CI/CD pipelines."'), pt(',')],
        [pt('  ],')],
        [pt('};')],
      ],
    },
    que: {
      addr: '~/work/que-gallery.ts',
      meta: 'Contract · Feb 2024 — Aug 2024',
      lines: [
        [cm('// Full-Stack Developer @ Que Gallery')],
        [cm('// Feb 2024 — Aug 2024  ·  Contract · Vancouver, BC')],
        [],
        [kw('const '), vr('role'), pt(': '), tp('Experience'), pt(' = {')],
        [ky('  title:   '), st('"Full-Stack Developer"'), pt(',')],
        [ky('  company: '), st('"Que Gallery"'), pt(',')],
        [ky('  type:    '), st('"Contract"'), pt(',')],
        [],
        [cm('  // Art gallery inventory, sales & consignment platform')],
        [ky('  built'), pt(': [')],
        [pt('    '), st('"Inventory and sales platform for a Vancouver art gallery."'), pt(',')],
        [pt('    '), st('"Real-time tracking of artwork sales, payments, and returns."'), pt(',')],
        [pt('    '), st('"Revenue distribution engine for multi-party consignments."'), pt(',')],
        [pt('    '), st('"Automated stakeholder balance sheets with reconciliation."'), pt(',')],
        [pt('    '), st('"Node.js + PostgreSQL API; ported to PHP + MySQL on request."'), pt(',')],
        [pt('    '), st('"Dashboard with smart filters, CSV exports, balance reports."'), pt(',')],
        [pt('  ],')],
        [pt('};')],
      ],
    },
    bahara: {
      addr: '~/work/bahara-bakery.swift',
      meta: 'Contract · Sep 2024 — Dec 2024',
      lines: [
        [cm('// iOS Developer @ Bahara Bakery')],
        [cm('// Sep 2024 — Dec 2024  ·  Contract · Vancouver, BC')],
        [],
        [kw('let '), vr('role'), pt(': '), tp('Experience'), pt(' = {')],
        [ky('  title:   '), st('"iOS Developer"'), pt(',')],
        [ky('  company: '), st('"Bahara Bakery"'), pt(',')],
        [ky('  type:    '), st('"Contract"'), pt(',')],
        [],
        [cm('  // Production SwiftUI app for a specialty bakery')],
        [ky('  built'), pt(': [')],
        [pt('    '), st('"SwiftUI app: product browsing, guided tutorials, pre-order flow."'), pt(',')],
        [pt('    '), st('"AI custom cake designer powered by OpenAI API integration."'), pt(',')],
        [pt('    '), st('"Date-locked pre-order scheduler with availability management."'), pt(',')],
        [pt('    '), st('"Offline-first: Core Data + CloudKit + Firebase sync architecture."'), pt(',')],
        [pt('    '), st('"Push notifications: order confirmed, ready for pickup, promos."'), pt(',')],
        [pt('    '), st('"Guided tutorial flow for custom orders and dietary preferences."'), pt(',')],
        [pt('  ],')],
        [pt('};')],
      ],
    },
  };

  /* ─── Boot each MacBook ─── */
  document.querySelectorAll('.macbook-exp[data-job]').forEach(wrapper => {
    const job = JOBS[wrapper.dataset.job];
    if (!job) return;

    const powerBtn = wrapper.querySelector('.mac-power-btn');
    const offState = wrapper.querySelector('.mac-off-state');
    const onState  = wrapper.querySelector('.mac-on-state');
    const addrEl   = wrapper.querySelector('.mac-addr');
    const metaEl   = wrapper.querySelector('.mac-meta-badge');
    const codeOut  = wrapper.querySelector('.mac-code-out');
    const screen   = wrapper.querySelector('.mac-screen');
    const editor   = wrapper.querySelector('.mac-editor');
    if (!powerBtn) return;

    addrEl.textContent = job.addr;
    metaEl.textContent = job.meta;

    let booted = false;

    powerBtn.addEventListener('click', () => {
      if (booted) return;
      booted = true;

      offState.classList.add('powering');

      setTimeout(() => {
        screen.classList.add('boot-flash');
        setTimeout(() => screen.classList.remove('boot-flash'), 260);
      }, 260);

      setTimeout(() => {
        offState.hidden = true;
        onState.hidden  = false;
        requestAnimationFrame(() => onState.classList.add('on-fade-in'));
        startTyping(codeOut, job.lines, editor);
      }, 530);
    });
  });

  /* ─── Typewriter engine ─── */
  function startTyping(outputEl, lines, editorEl) {
    /* Flatten to a queue of {type:'nl'} | {type:'ch', ch, c} */
    const queue = [];
    for (const line of lines) {
      queue.push({ type: 'nl' });
      if (line && line.length) {
        for (const seg of line) {
          for (let i = 0; i < seg.t.length; i++) {
            queue.push({ type: 'ch', ch: seg.t[i], c: seg.c });
          }
        }
      }
    }

    let qi = 0, lineCount = 0;
    let lineEl = null, span = null, spanCls = null;

    function tick() {
      if (qi >= queue.length) {
        /* Done — append blinking cursor to last line */
        if (lineEl) {
          const cur = document.createElement('span');
          cur.className = 'mac-cursor-end';
          lineEl.appendChild(cur);
        }
        return;
      }

      const a = queue[qi++];

      if (a.type === 'nl') {
        lineCount++;
        lineEl = document.createElement('div');
        lineEl.className = 'mcl';
        const num = document.createElement('span');
        num.className = 'mcl-num';
        num.textContent = String(lineCount).padStart(2, ' ');
        lineEl.appendChild(num);
        outputEl.appendChild(lineEl);
        span = null; spanCls = null;
        if (editorEl) editorEl.scrollTop = editorEl.scrollHeight;
        setTimeout(tick, 22);
        return;
      }

      /* Character — reuse span if same token class */
      if (a.c !== spanCls) {
        spanCls = a.c;
        span = document.createElement('span');
        if (spanCls) span.className = 'tok-' + spanCls;
        lineEl.appendChild(span);
      }
      span.textContent += a.ch;

      if (qi % 8 === 0 && editorEl) editorEl.scrollTop = editorEl.scrollHeight;

      setTimeout(tick, 11);
    }

    tick();
  }
})();

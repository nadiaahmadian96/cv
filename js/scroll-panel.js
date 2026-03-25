/* scroll-panel.js — sticky skills panel (right column, hidden on mobile) */

(function () {
  const panelData = {
    fullstack: {
      label: 'Full-Stack',
      tags:  ['React.js', 'Next.js', 'TypeScript', 'Node.js', 'Express', 'Material-UI'],
      desc:  'Web · Frontend + Backend'
    },
    ios: {
      label: 'iOS',
      tags:  ['Swift', 'SwiftUI', 'Firebase', 'Core Data', 'CloudKit', 'OpenAI API'],
      desc:  'Mobile · Apple Platforms'
    },
    backend: {
      label: 'Backend',
      tags:  ['.NET Core', 'C#', 'PostgreSQL', 'MongoDB', 'SQL Server', 'JWT / RBAC'],
      desc:  'Systems · APIs + Databases'
    },
    cloud: {
      label: 'Cloud',
      tags:  ['AWS EC2', 'AWS S3', 'Docker', 'CloudWatch', 'Nginx', 'CI/CD'],
      desc:  'Cloud · DevOps + Infra'
    }
  };

  const labelEl = document.getElementById('panel-label');
  const tagsEl  = document.getElementById('panel-tags');
  const descEl  = document.getElementById('panel-desc');
  const cards   = document.querySelectorAll('.skill-card[data-panel]');

  if (!labelEl || !cards.length) return;

  function updatePanel(key) {
    const d = panelData[key];
    if (!d) return;
    labelEl.textContent = d.label;
    descEl.textContent  = d.desc;
    tagsEl.innerHTML    = '';
    d.tags.forEach((t, i) => {
      const span = document.createElement('span');
      span.textContent = t;
      span.style.animationDelay = (i * 40) + 'ms';
      tagsEl.appendChild(span);
    });
    cards.forEach(c => c.classList.toggle('active-panel', c.dataset.panel === key));
  }

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) updatePanel(e.target.dataset.panel); });
  }, { threshold: 0.5 });

  cards.forEach(c => obs.observe(c));
})();

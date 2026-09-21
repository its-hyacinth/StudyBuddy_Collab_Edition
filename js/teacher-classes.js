/**
 * StudyBuddy — Teacher Classes
 */
document.addEventListener('DOMContentLoaded', () => {
  const session = initShell('teacher');
  if (!session) return;
  wireModalClosers();

  function render() {
    const classes = getClasses();
    const vals = document.querySelectorAll('.stat-grid .stat-value');
    if (vals[0]) vals[0].textContent = classes.length;
    if (vals[1]) vals[1].textContent = classes.reduce((s, c) => s + c.students, 0);
    if (vals[2]) vals[2].textContent = Math.round(classes.reduce((s, c) => s + c.progress, 0) / (classes.length || 1)) + '%';

    const tbody = document.querySelector('#classesTable tbody') || document.getElementById('classesTableBody');
    if (tbody) {
      tbody.innerHTML = classes.map((c) => `
        <tr>
          <td><div class="cell-title"><div class="cell-icon"><i data-lucide="graduation-cap"></i></div>
            <div><div class="title">${c.name}</div><div class="subtitle">${c.subject}</div></div></div></td>
          <td>${c.students}</td>
          <td>${c.nextActivity}<br><small>${formatDate(c.nextDate)}</small></td>
          <td><div class="progress-row"><div class="progress-bar"><div class="fill ${c.short}" style="width:${c.progress}%"></div></div><span class="progress-pct">${c.progress}%</span></div></td>
        </tr>`).join('');
    }

    const grid = document.getElementById('classesGrid');
    if (grid) {
      grid.innerHTML = classes.map((c) => `
        <div class="subject-card">
          <div class="subject-card-top">
            <div class="subj-icon" style="background:var(--page-bg)"><i data-lucide="graduation-cap"></i></div>
            <div class="subj-info"><h3>${c.name}</h3><p>${c.subject} · ${c.students} students</p></div>
          </div>
          <div class="progress-row"><div class="progress-bar"><div class="fill ${c.short}" style="width:${c.progress}%"></div></div><span class="progress-pct">${c.progress}%</span></div>
        </div>`).join('');
    }

    const overview = document.getElementById('classesOverview');
    if (overview) {
      overview.innerHTML = classes.map((c) => `
        <div class="list-item">
          <span class="dot ${c.short}"></span>
          <div class="item-meta"><div class="item-title">${c.name}</div><div class="item-sub">${c.students} students</div></div>
          <span class="progress-pct">${c.progress}%</span>
        </div>`).join('');
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  document.getElementById('addClassBtn')?.addEventListener('click', () => openModal('addClassModal'));
  document.getElementById('addClassForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('className')?.value.trim();
    const subject = document.getElementById('classSubject')?.value.trim();
    const students = Number(document.getElementById('classStudents')?.value) || 0;
    if (!name || !subject) { showToast('Name and subject required', 'error'); return; }
    const list = getClasses();
    list.push({
      id: uid('cls'), name, subject, short: subjectShort(subject),
      students, nextActivity: 'TBD', nextDate: '2025-09-30', progress: 0,
    });
    sbSet(SB_KEYS.CLASSES, list);
    closeModal('addClassModal');
    e.target.reset();
    showToast('Class created');
    render();
  });

  render();
});

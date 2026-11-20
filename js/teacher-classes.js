/**
 * StudyBuddy — Teacher Classes
 */
document.addEventListener('DOMContentLoaded', () => {
  const session = initShell('teacher');
  if (!session) return;
  wireModalClosers();

  let search = '';

  function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  // Students from Google Classroom (c.students) + students you added yourself to this class
  function enrolledCount(c, students) {
    const added = students.filter((s) => s.classId === c.id).length;
    return (Number(c.students) || 0) + added;
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function render() {
    const classes = getClasses();
    const students = getStudents();

    // ---- Stat cards (by ID, so a layout change can't mix them up) ----
    const avgProgress = Math.round(
      classes.reduce((s, c) => s + (Number(c.progress) || 0), 0) / (classes.length || 1)
    );
    // Total = students from Classroom + every student added on the Students page
    const baseTotal = classes.reduce((s, c) => s + (Number(c.students) || 0), 0);
    setText('statTotalClasses', classes.length);
    setText('statTotalStudents', baseTotal + students.length);
    setText('statAvgProgress', avgProgress + '%');
    // Same rule as the Dashboard: every assignment that isn't completed
    setText('statActiveAsg', getAssignments().filter((a) => a.status !== 'completed').length);

    // ---- Filter by search ----
    const q = search.toLowerCase();
    const list = q
      ? classes.filter((c) => c.name.toLowerCase().includes(q) || String(c.subject).toLowerCase().includes(q))
      : classes;

    // ---- Table (7 columns, matching the header) ----
    const tbody = document.getElementById('classesTableBody');
    if (tbody) {
      tbody.innerHTML = list.length
        ? list.map((c) => `
        <tr data-id="${escapeHtml(c.id)}">
          <td>
            <div class="cell-title">
              <div class="cell-icon"><i data-lucide="graduation-cap"></i></div>
              <div>
                <div class="title">${escapeHtml(c.name)}</div>
                <div class="subtitle">${escapeHtml(c.subject)} · ${escapeHtml(c.professor || 'TBA')}</div>
              </div>
            </div>
          </td>
          <td><span class="subject-tag ${escapeHtml(c.short)}"><span class="dot ${escapeHtml(c.short)}"></span> ${escapeHtml(c.subject)}</span></td>
          <td>${enrolledCount(c, students)}</td>
          <td>
            <div class="title">${escapeHtml(c.nextActivity)}</div>
            <div class="subtitle">${escapeHtml(formatDate(c.nextDate))}</div>
          </td>
          <td>
            <div class="progress-row">
              <div class="progress-bar"><div class="fill ${escapeHtml(c.short)}" style="width:${Number(c.progress) || 0}%"></div></div>
              <span class="progress-pct">${Number(c.progress) || 0}%</span>
            </div>
          </td>
          <td><span class="badge badge-success">Active</span></td>
          <td></td>
        </tr>`).join('')
        : '<tr><td colspan="7" style="text-align:center;padding:24px">No classes found.</td></tr>';
    }

    // ---- Grid view ----
    const grid = document.getElementById('classesGridView');
    if (grid) {
      grid.innerHTML = list.map((c) => `
        <div class="subject-card" data-id="${escapeHtml(c.id)}">
          <div class="subject-card-top">
            <div class="subj-icon" style="background:var(--page-bg)"><i data-lucide="graduation-cap"></i></div>
            <div class="subj-info"><h3>${escapeHtml(c.name)}</h3><p>${escapeHtml(c.subject)}</p></div>
            <span class="badge badge-success">Active</span>
          </div>
          <div class="subject-card-stats">
            <div class="ss"><div class="ss-val">${enrolledCount(c, students)}</div><div class="ss-lbl">Students</div></div>
            <div class="ss"><div class="ss-val">${Number(c.progress) || 0}%</div><div class="ss-lbl">Progress</div></div>
          </div>
        </div>`).join('');
    }

    // ---- Overview (keeps the donut, rebuilds center + legend) ----
    const center = document.querySelector('#classOverview .center-label');
    if (center) center.innerHTML = `${avgProgress}%<small>Avg Progress</small>`;
    const ring = document.querySelector('#classOverview .donut circle:nth-of-type(2)');
    if (ring) ring.setAttribute('stroke-dashoffset', (226.2 * (1 - avgProgress / 100)).toFixed(1));
    const legend = document.querySelector('#classOverview .donut-legend');
    if (legend) {
      legend.innerHTML = classes.slice(0, 5).map((c) => `
        <div class="donut-legend-row">
          <div class="lbl"><span>${escapeHtml(c.name)}</span><span>${Number(c.progress) || 0}%</span></div>
          <div class="progress-bar"><div class="fill ${escapeHtml(c.short)}" style="width:${Number(c.progress) || 0}%"></div></div>
        </div>`).join('');
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  // ---- Table / Grid toggle ----
  document.querySelectorAll('#classViewToggle button').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#classViewToggle button').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const isGrid = btn.dataset.view === 'grid';
      document.getElementById('classesTableView').style.display = isGrid ? 'none' : '';
      document.getElementById('classesGridView').style.display = isGrid ? '' : 'none';
    });
  });

  document.getElementById('classSearch')?.addEventListener('input', (e) => {
    search = e.target.value.trim();
    render();
  });

  document.getElementById('syncClassroomBtn')?.addEventListener('click', async (e) => {
    const result = await syncGoogleClassroom(e.currentTarget);
    if (result?.ok) render();
  });

  document.getElementById('addClassBtn')?.addEventListener('click', () => openModal('addClassModal'));

  document.getElementById('addClassForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('className')?.value.trim();
    const subject = document.getElementById('classSubject')?.value.trim();
    if (!name || !subject) { showToast('Name and subject required', 'error'); return; }

    const list = getClasses();
    list.push({
      id: uid('cls'), name, subject, short: subjectShort(subject),
      students: 0, nextActivity: 'TBD', nextDate: '2025-09-30', progress: 0,
    });
    sbSet(SB_KEYS.CLASSES, list);
    closeModal('addClassModal');
    e.target.reset();
    showToast('Class created');
    render();
  });

  render();
});
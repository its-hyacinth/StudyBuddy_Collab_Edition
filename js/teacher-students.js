/**
 * StudyBuddy — Teacher Students
 */
document.addEventListener('DOMContentLoaded', () => {
  const session = initShell('teacher');
  if (!session) return;
  wireModalClosers();

  let search = '';
  let statusFilter = '';
  let courseFilter = '';
  let yearFilter = '';

  const AT_RISK_GPA = 2.5;

  // Escape user-provided text before putting it into innerHTML (prevents XSS)
  function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function initials(name) {
    return name.split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  }

  function render() {
    const all = getStudents();

    // ---- Filtering ----
    let list = all.slice();
    if (statusFilter) list = list.filter((s) => s.status === statusFilter);
    if (courseFilter) list = list.filter((s) => s.course === courseFilter);
    if (yearFilter) list = list.filter((s) => s.year === yearFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((s) =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.course.toLowerCase().includes(q)
      );
    }

    // ---- Stat cards ----
    const activeCount = all.filter((s) => s.status === 'active').length;
    const inactiveCount = all.length - activeCount;
    const avgGpa = all.reduce((sum, s) => sum + (Number(s.gpa) || 0), 0) / (all.length || 1);
    const atRisk = all.filter((s) => Number(s.gpa) > 0 && Number(s.gpa) < AT_RISK_GPA);

    const setText = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    };
    setText('statTotalStudents', all.length);
    setText('statActiveStudents', activeCount);
    setText('statAvgGpa', avgGpa.toFixed(1));
    setText('statAtRisk', atRisk.length);

    // ---- Table ----
    const tbody = document.getElementById('studentsTableBody');
    if (tbody) {
      tbody.innerHTML = list.length
        ? list.map((s) => `
        <tr data-id="${escapeHtml(s.id)}" data-status="${escapeHtml(s.status)}">
          <td>
            <div class="cell-title">
              <div class="avatar" style="width:36px;height:36px;border-radius:50%;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:12px">
                ${escapeHtml(initials(s.name))}
              </div>
              <div>
                <div class="title">${escapeHtml(s.name)}</div>
                <div class="subtitle">${s.studentId ? 'ID: ' + escapeHtml(s.studentId) : ''}</div>
              </div>
            </div>
          </td>
          <td>${escapeHtml(s.email)}</td>
          <td>${escapeHtml(s.course)}</td>
          <td>${escapeHtml(s.year)}</td>
          <td><strong>${escapeHtml(s.gpa)}</strong></td>
          <td><span class="badge ${statusClass(s.status)}">${statusLabel(s.status)}</span></td>
          <td></td>
        </tr>`).join('')
        : '<tr><td colspan="7" style="text-align:center;padding:24px">No students found.</td></tr>';
    }

    // ---- Student overview (donut center + legend; keeps the donut markup intact) ----
    const pct = all.length ? Math.round((activeCount / all.length) * 100) : 0;
    const center = document.querySelector('#studentOverview .center-label');
    if (center) center.innerHTML = `${pct}%<small>Active</small>`;
    const ring = document.querySelector('#studentOverview .donut circle:nth-of-type(2)');
    if (ring) {
      const circumference = 226.2;
      ring.setAttribute('stroke-dashoffset', (circumference * (1 - pct / 100)).toFixed(1));
    }
    const legendRows = document.querySelectorAll('#studentOverview .donut-legend-row');
    if (legendRows[0]) {
      legendRows[0].querySelector('.lbl span:last-child').textContent = activeCount;
      legendRows[0].querySelector('.fill').style.width = pct + '%';
    }
    if (legendRows[1]) {
      legendRows[1].querySelector('.lbl span:last-child').textContent = inactiveCount;
      legendRows[1].querySelector('.fill').style.width = (all.length ? 100 - pct : 0) + '%';
    }

    // ---- Top performers ----
    const top = document.getElementById('topPerformers');
    if (top) {
      const colors = [
        ['#DBEAFE', '#2563EB'],
        ['#EDE9FE', '#7C3AED'],
        ['#FFEDD5', '#EA580C']
      ];
      top.innerHTML = all
        .slice()
        .sort((a, b) => (Number(b.gpa) || 0) - (Number(a.gpa) || 0))
        .slice(0, 3)
        .map((s, i) => `
        <div class="list-item">
          <div class="cell-icon" style="background:${colors[i][0]};color:${colors[i][1]};width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px">${i + 1}</div>
          <div class="item-meta">
            <div class="item-title">${escapeHtml(s.name)}</div>
            <div class="item-sub">GPA ${escapeHtml(s.gpa)} · ${escapeHtml(s.course)}</div>
          </div>
        </div>`).join('');
    }

    // ---- At-risk students ----
    const riskBox = document.getElementById('atRiskStudents');
    if (riskBox) {
      riskBox.innerHTML = atRisk.length
        ? atRisk.slice(0, 5).map((s) => `
        <div class="list-item">
          <div class="item-meta">
            <div class="item-title">${escapeHtml(s.name)}</div>
            <div class="item-sub">GPA ${escapeHtml(s.gpa)} · ${escapeHtml(s.course)}</div>
          </div>
          <span class="badge badge-warning">At Risk</span>
        </div>`).join('')
        : '<div class="list-item"><div class="item-meta"><div class="item-sub">No at-risk students.</div></div></div>';
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  // ---- Event wiring ----
  document.getElementById('studentSearch')?.addEventListener('input', (e) => {
    search = e.target.value.trim();
    render();
  });
  document.getElementById('studentStatusFilter')?.addEventListener('change', (e) => {
    statusFilter = e.target.value;
    render();
  });
  document.getElementById('studentCourseFilter')?.addEventListener('change', (e) => {
    courseFilter = e.target.value;
    render();
  });
  document.getElementById('studentYearFilter')?.addEventListener('change', (e) => {
    yearFilter = e.target.value;
    render();
  });
  document.getElementById('addStudentBtn')?.addEventListener('click', () => openModal('addStudentModal'));

  document.getElementById('addStudentForm')?.addEventListener('submit', (e) => {
    e.preventDefault();

    // IDs now match the HTML (studentName, studentEmail, studentCourse, studentYear)
    const name = document.getElementById('studentName')?.value.trim();
    const email = document.getElementById('studentEmail')?.value.trim();
    const course = document.getElementById('studentCourse')?.value.trim() || 'BSIT';
    const year = document.getElementById('studentYear')?.value.trim() || '1st Year';

    if (!name || !email) {
      showToast('Name and email required', 'error');
      return;
    }

    const list = getStudents();

    if (list.some((s) => s.email.toLowerCase() === email.toLowerCase())) {
      showToast('A student with that email already exists', 'error');
      return;
    }

    list.push({ id: uid('stu'), name, email, course, year, gpa: 0, status: 'active' });
    sbSet(SB_KEYS.STUDENTS, list);

    closeModal('addStudentModal');
    e.target.reset();
    showToast('Student added');
    render();
  });

  render();
});
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

  function studentGpa(student) {
    return student.gpa !== null && student.gpa !== undefined && Number.isFinite(Number(student.gpa))
      ? Number(student.gpa).toFixed(2)
      : 'N/A';
  }

  function showStudentInsight(title, content) {
    document.getElementById('studentInsightsTitle').textContent = title;
    document.getElementById('studentInsightsBody').innerHTML = content;
    openModal('studentInsightsModal');
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  function openStudentDetails(student) {
    const cls = getClasses().find((item) => item.id === student.classId);
    const status = student.status || 'inactive';
    const details = [
      ['Email', student.email || 'Not provided'],
      ['Course', student.course || 'Not provided'],
      ['Year level', student.year || 'Not provided'],
      ['Class', cls?.name || 'No class assigned'],
      ['Student ID', student.studentId || 'Not provided'],
      ['GPA', studentGpa(student)],
    ];
    showStudentInsight(student.name || 'Student details', `
      <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px">
        ${details.map(([label, value]) => `
          <div>
            <div class="stat-label">${escapeHtml(label)}</div>
            <div class="title">${escapeHtml(value)}</div>
          </div>`).join('')}
        <div>
          <div class="stat-label">Status</div>
          <span class="badge ${statusClass(status)}">${escapeHtml(statusLabel(status))}</span>
        </div>
      </div>`);
  }

  function openStudentOverview() {
    const students = getStudents();
    const classes = getClasses();
    const roster = students.length ? students.map((student) => {
      const cls = classes.find((item) => item.id === student.classId);
      return `
        <div class="list-item">
          <div class="item-meta">
            <div class="item-title">${escapeHtml(student.name)}</div>
            <div class="item-sub">${escapeHtml(student.course || 'Course not set')} · ${escapeHtml(student.year || 'Year not set')} · ${escapeHtml(cls?.name || 'No class assigned')}</div>
          </div>
          <span class="badge ${statusClass(student.status || 'inactive')}">${escapeHtml(statusLabel(student.status || 'inactive'))}</span>
        </div>`;
    }).join('') : '<p class="empty-state">No student records available.</p>';

    showStudentInsight('Student overview', `
      <div>${roster}</div>`);
  }

  function openTopPerformers() {
    const students = getStudents().slice()
      .sort((a, b) => (Number(b.gpa) || 0) - (Number(a.gpa) || 0));
    const content = students.length ? students.map((student, index) => `
      <div class="list-item">
        <span class="badge badge-info">${index + 1}</span>
        <div class="item-meta">
          <div class="item-title">${escapeHtml(student.name)}</div>
          <div class="item-sub">GPA ${escapeHtml(studentGpa(student))} · ${escapeHtml(student.course || 'Course not set')} · ${escapeHtml(student.year || 'Year not set')}</div>
        </div>
        <span class="badge ${statusClass(student.status || 'inactive')}">${escapeHtml(statusLabel(student.status || 'inactive'))}</span>
      </div>`).join('') : '<p class="empty-state">No student performance data available.</p>';
    showStudentInsight('Student performance', content);
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
    // Same total as My Classes and the Dashboard: Classroom students + students added here
    const classes = getClasses();
    const classroomTotal = classes.reduce((s, c) => s + (Number(c.students) || 0), 0);
    setText('statTotalStudents', classroomTotal + all.length);
    const totalDelta = document.getElementById('statTotalStudents')?.closest('.stat-card')?.querySelector('.stat-delta');
    if (totalDelta) totalDelta.innerHTML = `<i data-lucide="users"></i> ${classroomTotal} Classroom · ${all.length} added`;
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
              <div class="avatar" style="width:36px;height:36px;flex-shrink:0;border-radius:50%;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:12px">
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
          <td>${escapeHtml(classes.find((c) => c.id === s.classId)?.name || '—')}</td>
          <td><strong>${escapeHtml(s.gpa)}</strong></td>
          <td><span class="badge ${statusClass(s.status)}">${statusLabel(s.status)}</span></td>
          <td>
            <div class="action-menu-wrap">
              <button type="button" class="action-menu-btn" data-student-menu
                aria-label="Actions for ${escapeHtml(s.name)}" aria-expanded="false">
                <i data-lucide="more-horizontal"></i>
              </button>
              <div class="action-dropdown">
                <button type="button" class="danger" data-unenroll="${escapeHtml(s.id)}">
                  <i data-lucide="user-minus"></i> Unenroll
                </button>
              </div>
            </div>
          </td>
        </tr>`).join('')
        : '<tr><td colspan="8" style="text-align:center;padding:24px">No students found.</td></tr>';
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
        <div class="list-item" role="button" tabindex="0" data-student-details="${escapeHtml(s.id)}" aria-label="View details for ${escapeHtml(s.name)}">
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
  const wireInsightCard = (card, showDetails) => {
    if (!card) return;
    card.addEventListener('click', (event) => {
      if (event.target.closest('[data-student-details]')) return;
      showDetails();
    });
    card.querySelector('.card-header')?.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      showDetails();
    });
  };
  wireInsightCard(document.querySelector('[data-student-insight-card="overview"]'), openStudentOverview);
  wireInsightCard(document.querySelector('[data-student-insight-card="top-performers"]'), openTopPerformers);
  const topPerformers = document.getElementById('topPerformers');
  topPerformers?.addEventListener('click', (event) => {
    const row = event.target.closest('[data-student-details]');
    if (!row) return;
    const student = getStudents().find((item) => item.id === row.dataset.studentDetails);
    if (student) openStudentDetails(student);
  });
  topPerformers?.addEventListener('keydown', (event) => {
    const row = event.target.closest('[data-student-details]');
    if (!row || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    const student = getStudents().find((item) => item.id === row.dataset.studentDetails);
    if (student) openStudentDetails(student);
  });
  document.getElementById('addStudentBtn')?.addEventListener('click', () => {
    const sel = document.getElementById('studentClass');
    if (sel) {
      sel.innerHTML = '<option value="">No class</option>' +
        getClasses().map((c) => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.name)}</option>`).join('');
    }
    openModal('addStudentModal');
  });

  // ---- Unenroll: removes the student from their class and from the students list ----
  // Confirmation popup built with the app's own modal styles (instead of the browser's plain dialog)
  let pendingUnenrollId = null;
  const unenrollModal = document.createElement('div');
  unenrollModal.className = 'modal-backdrop';
  unenrollModal.id = 'unenrollModal';
  unenrollModal.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3>Unenroll Student</h3>
        <button type="button" class="modal-close" id="unenrollCloseBtn" aria-label="Close"><i data-lucide="x"></i></button>
      </div>
      <div class="modal-body">
        <p id="unenrollMessage" style="margin:0;line-height:1.6"></p>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-ghost" id="unenrollCancelBtn">Cancel</button>
        <button type="button" class="btn" id="unenrollConfirmBtn"
          style="background:#DC2626;color:#fff;border:none;font-weight:600">Unenroll</button>
      </div>
    </div>`;
  document.body.appendChild(unenrollModal);

  const closeUnenroll = () => { pendingUnenrollId = null; closeModal('unenrollModal'); };
  document.getElementById('unenrollCloseBtn').addEventListener('click', closeUnenroll);
  document.getElementById('unenrollCancelBtn').addEventListener('click', closeUnenroll);

  document.getElementById('unenrollConfirmBtn').addEventListener('click', () => {
    const id = pendingUnenrollId;
    const student = getStudents().find((s) => s.id === id);
    closeUnenroll();
    if (!student) return;

    const cls = getClasses().find((c) => c.id === student.classId);
    sbSet(SB_KEYS.STUDENTS, getStudents().filter((s) => s.id !== id));
    showToast(`${student.name} unenrolled${cls ? ' from ' + cls.name : ''}`, 'warning');
    render();
  });

  document.getElementById('studentsTableBody')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-unenroll]');
    if (btn) {
      btn.closest('.action-dropdown')?.classList.remove('open');
      btn.closest('.action-menu-wrap')?.querySelector('[data-student-menu]')?.setAttribute('aria-expanded', 'false');
    } else {
      const menuButton = e.target.closest('[data-student-menu]');
      if (!menuButton) return;

      const menu = menuButton.nextElementSibling;
      const willOpen = !menu.classList.contains('open');
      document.querySelectorAll('#studentsTableBody .action-dropdown.open').forEach((openMenu) => {
        openMenu.classList.remove('open');
        openMenu.previousElementSibling.setAttribute('aria-expanded', 'false');
      });
      menu.classList.toggle('open', willOpen);
      menuButton.setAttribute('aria-expanded', String(willOpen));
      return;
    }

    const student = getStudents().find((s) => s.id === btn.dataset.unenroll);
    if (!student) return;

    const cls = getClasses().find((c) => c.id === student.classId);
    pendingUnenrollId = student.id;
    document.getElementById('unenrollMessage').innerHTML =
      `Are you sure you want to unenroll <strong>${escapeHtml(student.name)}</strong>` +
      (cls ? ` from <strong>${escapeHtml(cls.name)}</strong>` : '') +
      `? They will be removed from the list.`;
    openModal('unenrollModal');
    if (typeof lucide !== 'undefined') lucide.createIcons();
  });

  document.addEventListener('click', (e) => {
    if (e.target.closest('#studentsTableBody .action-menu-wrap')) return;
    document.querySelectorAll('#studentsTableBody .action-dropdown.open').forEach((menu) => {
      menu.classList.remove('open');
      menu.previousElementSibling.setAttribute('aria-expanded', 'false');
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('#studentsTableBody .action-dropdown.open').forEach((menu) => {
      menu.classList.remove('open');
      menu.previousElementSibling.setAttribute('aria-expanded', 'false');
    });
  });

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

    const classId = document.getElementById('studentClass')?.value || null;
    list.push({ id: uid('stu'), name, email, course, year, classId, gpa: 0, status: 'active' });
    sbSet(SB_KEYS.STUDENTS, list);

    closeModal('addStudentModal');
    e.target.reset();
    showToast('Student added');
    render();
  });

  render();
});
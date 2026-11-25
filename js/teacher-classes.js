/**
 * StudyBuddy — Teacher Classes
 */
document.addEventListener('DOMContentLoaded', () => {
  const session = initShell('teacher');
  if (!session) return;
  wireModalClosers();

  let search = '';
  let editingId = null;      // class being edited (null = adding a new one)
  let currentDetailId = null; // class shown in the details popup
  const query = new URLSearchParams(window.location.search);
  const editId = query.get('edit');
  const returnClassId = query.get('returnClass');

  function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  // The logged-in teacher owns these classes, so they are the instructor.
  // Tries the common session field names; falls back to the class's own
  // professor (from Classroom) and finally "TBA".
  function ownerName() {
    const u = session.user || session;
    return (
      u.name || u.fullName || u.full_name || u.displayName ||
      [u.firstName || u.first_name, u.lastName || u.last_name].filter(Boolean).join(' ') ||
      ''
    ).trim();
  }

  function instructorName(c) {
    return ownerName() || c.professor || 'TBA';
  }

  // "09:00" -> "9:00 AM", "13:30" -> "1:30 PM"
  function formatTime(t) {
    if (!t || !/^\d{1,2}:\d{2}$/.test(t)) return '';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
  }

  // "9:00 AM – 12:00 PM" (empty if the class has no time, e.g. synced from Classroom)
  function timeText(c) {
    return c.startTime && c.endTime
      ? `${formatTime(c.startTime)} – ${formatTime(c.endTime)}`
      : '';
  }

  // Students from Google Classroom (c.students) + students you added yourself to this class
  function enrolledCount(c, students) {
    return (Number(c.students) || 0) + classRoster(c, students, true).length;
  }

  function fillClassOfferingSelects() {
    const course = document.getElementById('classCourse');
    const year = document.getElementById('classYear');
    if (course && !course.options.length) course.innerHTML = courseOptionsHtml('Select course');
    if (year && !year.options.length) year.innerHTML = yearOptionsHtml('Select year');
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function render() {
    const classes = getClasses();
    const students = getStudents();
    const assignments = getAssignments();
    const grades = getGrades();
    const upcomingAssignments = getUpcomingAssignments(assignments, assignments.length);
    const classForAssignment = (assignment) => classes.find((cls) =>
      String(cls.id) === String(assignment.classId || assignment.subjectId)
    ) || classes.find((cls) => assignment.subjectCode
      && normalizeSubjectCode(classSubjectCode(cls)) === normalizeSubjectCode(assignment.subjectCode)
    ) || classes.find((cls) => cls.name === assignment.subject || classDisplayName(cls) === assignment.subject);
    const nextAssignmentsByClass = new Map();
    upcomingAssignments.forEach((assignment) => {
      const cls = classForAssignment(assignment);
      if (cls && !nextAssignmentsByClass.has(String(cls.id))) {
        nextAssignmentsByClass.set(String(cls.id), assignment);
      }
    });
    const classProgress = classes.map((cls) => ({
      cls,
      performance: classPerformance(cls, grades),
    }));
    const performanceByClass = new Map(classProgress.map(({ cls, performance }) => [String(cls.id), performance]));
    const classesWithPerformance = classProgress.filter((item) => item.performance);

    // ---- Stat cards (by ID, so a layout change can't mix them up) ----
    const avgProgress = classesWithPerformance.length
      ? Math.round(classesWithPerformance.reduce((sum, item) => sum + item.performance.average, 0) / classesWithPerformance.length)
      : null;
    // Total = students from Classroom + every student added on the Students page
    const baseTotal = classes.reduce((s, c) => s + (Number(c.students) || 0), 0);
    setText('statTotalClasses', classes.length);
    setText('statTotalStudents', baseTotal + students.length);
    setText('statAvgProgress', avgProgress === null ? '—' : `${avgProgress}%`);
    const progressContext = document.getElementById('statAvgProgressContext');
    if (progressContext) {
      progressContext.textContent = classesWithPerformance.length
        ? `Based on ${classesWithPerformance.length} class${classesWithPerformance.length === 1 ? '' : 'es'} with graded work`
        : 'Waiting for graded work';
      progressContext.className = `stat-delta ${classesWithPerformance.length ? 'up' : ''}`.trim();
    }
    // Same rule as the Dashboard: every assignment that isn't completed
    setText('statActiveAsg', assignments.filter((a) => a.status !== 'completed').length);

    // ---- Filter by search ----
    const q = search.toLowerCase();
    const list = q
      ? classes.filter((c) => String(c.name || '').toLowerCase().includes(q)
        || String(c.subject || '').toLowerCase().includes(q)
        || classSubjectCode(c).toLowerCase().includes(q))
      : classes;

    // ---- Table (7 columns, matching the header) ----
    const tbody = document.getElementById('classesTableBody');
    if (tbody) {
      tbody.innerHTML = list.length
        ? list.map((c) => {
          const code = classSubjectCode(c);
          const title = c.subject && c.subject !== c.name ? c.subject : '';
          const performance = performanceByClass.get(String(c.id));
          const progress = performance ? performance.average : null;
          const nextActivity = nextAssignmentsByClass.get(String(c.id));
          return `
        <tr data-id="${escapeHtml(c.id)}" style="cursor:pointer" title="Click for class details">
          <td>
            <div class="cell-title">
              <div class="cell-icon"><i data-lucide="graduation-cap"></i></div>
              <div>
                <div class="title">${escapeHtml(c.name)}</div>
                <div class="subtitle">${escapeHtml([classBlockLabel(c), title, c.room || 'Room TBA'].filter(Boolean).join(' · '))}</div>
              </div>
            </div>
          </td>
          <td style="text-align:center"><span class="subject-tag ${escapeHtml(c.short)}"><span class="dot ${escapeHtml(c.short)}"></span> ${escapeHtml(code || c.subject || '—')}</span></td>
         <td style="text-align:center">${enrolledCount(c, students)}</td>
          <td>
           <div class="title">${escapeHtml(nextActivity?.title || nextActivity?.name || 'No upcoming activity')}</div>
           <div class="subtitle">${escapeHtml(nextActivity?.dueDate ? formatDate(nextActivity.dueDate) : '—')}</div>
          </td>
          <td>
            <div class="progress-row">
              <div class="progress-bar" title="${performance ? `${performance.gradedCount} graded submission${performance.gradedCount === 1 ? '' : 's'}` : 'No graded submissions yet'}"><div class="fill ${escapeHtml(c.short)}" style="width:${progress ?? 0}%"></div></div>
              <span class="progress-pct">${progress === null ? '—' : `${progress}%`}</span>
            </div>
          </td>
          <td><span class="badge badge-success">Active</span></td>
          <td></td>
        </tr>`;
        }).join('')
        : '<tr><td colspan="7" style="text-align:center;padding:24px">No classes found.</td></tr>';
    }

    // ---- Grid view ----
    const grid = document.getElementById('classesGridView');
    if (grid) {
      grid.innerHTML = list.map((c) => {
        const performance = performanceByClass.get(String(c.id));
        return `
        <div class="subject-card ${escapeHtml(c.short)}" data-id="${escapeHtml(c.id)}" style="cursor:pointer" title="Click for class details">
          <div class="subject-card-top">
            <div class="subj-icon" style="background:var(--page-bg)"><i data-lucide="graduation-cap"></i></div>
            <div class="subj-info"><h3>${escapeHtml(classDisplayName(c))}</h3><p><span class="subject-tag ${escapeHtml(c.short)}">${escapeHtml(c.subject || classSubjectCode(c))}</span></p></div>
            <span class="badge badge-success">Active</span>
          </div>
          <div class="subject-card-stats" style="display:grid;grid-template-columns:repeat(2,1fr);justify-items:center;text-align:center;width:100%">
            <div class="ss" style="width:100%;text-align:center;margin:0"><div class="ss-val">${enrolledCount(c, students)}</div><div class="ss-lbl">Students</div></div>
            <div class="ss" style="width:100%;text-align:center;margin:0"><div class="ss-val">${performance ? `${performance.average}%` : '—'}</div><div class="ss-lbl">Progress</div></div>
          </div>
        </div>`;
      }).join('');
    }

    // ---- Overview (keeps the donut, rebuilds center + legend) ----
    const center = document.querySelector('#classOverview .center-label');
    if (center) center.innerHTML = `${avgProgress === null ? '—' : `${avgProgress}%`}<small>Avg Progress</small>`;
    const ring = document.querySelector('#classOverview .donut circle:nth-of-type(2)');
    if (ring) ring.setAttribute('stroke-dashoffset', (226.2 * (1 - (avgProgress ?? 0) / 100)).toFixed(1));
    const legend = document.querySelector('#classOverview .donut-legend');
    if (legend) {
      legend.innerHTML = classProgress.slice(0, 5).map(({ cls: c, performance }) => `
        <div class="donut-legend-row">
          <div class="lbl"><span>${escapeHtml(classDisplayName(c))}</span><span>${performance ? `${performance.average}%` : '—'}</span></div>
          <div class="progress-bar" title="${performance ? `${performance.gradedCount} graded submission${performance.gradedCount === 1 ? '' : 's'}` : 'No graded submissions yet'}"><div class="fill ${escapeHtml(c.short)}" style="width:${performance?.average ?? 0}%"></div></div>
        </div>`).join('');
    }

    // ---- Upcoming assignment deadlines ----
    const deadlines = document.getElementById('upcomingDeadlines');
    if (deadlines) {
      const today = localDateStr();
      const upcoming = getUpcomingAssignments(assignments);
      deadlines.innerHTML = upcoming.length ? upcoming.map((assignment) => {
        const dueDay = new Date(`${assignment.dueDate}T00:00:00`);
        const todayStart = new Date(`${today}T00:00:00`);
        const daysUntilDue = Math.round((dueDay - todayStart) / 86400000);
        const dueLabel = daysUntilDue === 0 ? 'Due today'
          : daysUntilDue === 1 ? 'Tomorrow'
            : `${daysUntilDue} days`;
        const classInfo = classes.find((item) => item.id === assignment.classId
          || item.id === assignment.subjectId
          || item.name === assignment.subject);
        const subject = assignment.subject || classInfo?.subject || classInfo?.name || 'General';
        const dueTime = assignment.dueTime ? formatTime(assignment.dueTime) : '';
        return `
          <a href="assignments.php" class="list-item list-item-link" aria-label="Go to Assignments for ${escapeHtml(assignment.title || 'Untitled assignment')}">
            <div class="item-meta">
              <div class="item-title">${escapeHtml(assignment.title || 'Untitled assignment')}</div>
              <div class="item-sub">${escapeHtml(subject)} · ${escapeHtml(formatDate(assignment.dueDate))}${dueTime ? ` · ${escapeHtml(dueTime)}` : ''}</div>
            </div>
            <span class="badge badge-upcoming">${dueLabel}</span>
          </a>`;
      }).join('') : '<p class="empty-state" style="padding:16px">No upcoming deadlines.</p>';
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  // ---- Class details (opens when a class row / card is clicked) ----
  function openClassDetails(id) {
    const c = getClasses().find((x) => x.id === id);
    if (!c) return;
    currentDetailId = id;
    const students = getStudents();
    const notSet = 'Not set';

    const code = classSubjectCode(c);
    setText('detailName', classBlockLabel(c) ? `${c.name} — ${classBlockLabel(c)}` : c.name);
    setText('detailSubject', code
      ? `${code}${c.subject && c.subject !== code ? ' · ' + c.subject : ''}`
      : (c.subject || notSet));
    setText('detailInstructor', instructorName(c));
    setText('detailRoom', c.room || notSet);
    setText('detailDays', c.schedule || notSet);
    setText('detailTime', timeText(c) || notSet);
    setText('detailStudents', enrolledCount(c, students));
    const performance = classPerformance(c, getGrades());
    setText('detailProgress', performance ? `${performance.average}%` : '—');
    setText('detailDescription', c.description || 'No description provided.');

    openModal('classDetailsModal');
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  function handleClassClick(e) {
    if (e.target.closest('button, a, .action-menu-wrap')) return;
    const item = e.target.closest('[data-id]');
    if (item) window.location.href = `class.php?id=${encodeURIComponent(item.dataset.id)}`;
  }
  document.getElementById('classesTableBody')?.addEventListener('click', handleClassClick);
  document.getElementById('classesGridView')?.addEventListener('click', handleClassClick);

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

  // ---- Add / Edit class form ----
  function setFormMode(isEdit) {
    setText('addClassTitle', isEdit ? 'Edit Class' : 'Add New Class');
    setText('saveClassBtn', isEdit ? 'Save Changes' : 'Create Class');
  }

  function openAddClass() {
    editingId = null;
    fillClassOfferingSelects();
    document.getElementById('addClassForm')?.reset();
    setFormMode(false);
    openModal('addClassModal');
  }

  function openEditClass(id) {
    const c = getClasses().find((x) => x.id === id);
    if (!c) return;
    editingId = id;
    const setVal = (field, v) => { const el = document.getElementById(field); if (el) el.value = v ?? ''; };

    fillClassOfferingSelects();
    const courseSelect = document.getElementById('classCourse');
    const courseCode = normalizeCourseCode(c.course);
    if (courseSelect && courseCode && ![...courseSelect.options].some((option) => option.value === courseCode)) {
      courseSelect.add(new Option(courseCode, courseCode));
    }
    setVal('className', c.name);
    setVal('classSubjectCode', classSubjectCode(c));
    setVal('classSubject', c.subject);
    setVal('classCourse', courseCode);
    setVal('classYear', yearLevelLabel(c.year));
    setVal('classBlock', c.block || '');
    setVal('classRoom', c.room);
    setVal('classSchedule', c.schedule);
    setVal('classStartTime', c.startTime || '09:00');
    setVal('classEndTime', c.endTime || '10:00');
    setVal('classDescription', c.description);

    setFormMode(true);
    openModal('addClassModal');
  }

  fillClassOfferingSelects();
  document.getElementById('addClassBtn')?.addEventListener('click', openAddClass);

  document.getElementById('editClassBtn')?.addEventListener('click', () => {
    const id = currentDetailId;
    closeModal('classDetailsModal');
    if (id) openEditClass(id);
  });

  document.getElementById('addClassForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('className')?.value.trim();
    const subjectCode = document.getElementById('classSubjectCode')?.value.trim();
    const subject = document.getElementById('classSubject')?.value.trim();
    const course = normalizeCourseCode(document.getElementById('classCourse')?.value || '');
    const year = yearLevelLabel(document.getElementById('classYear')?.value || '');
    const block = document.getElementById('classBlock')?.value.trim() || '';
    const room = document.getElementById('classRoom')?.value.trim() || '';
    const schedule = document.getElementById('classSchedule')?.value.trim() || '';
    const startTime = document.getElementById('classStartTime')?.value || '';
    const endTime = document.getElementById('classEndTime')?.value || '';
    const description = document.getElementById('classDescription')?.value.trim() || '';

    if (!name || !subjectCode || !subject) { showToast('Subject code, class name, and subject title are required', 'error'); return; }
    if (!course || !year || !block) { showToast('Course, year level, and block are required', 'error'); return; }
    if (!normalizeSubjectCode(subjectCode)) { showToast('Subject code needs at least one letter or number', 'error'); return; }
    if (!startTime || !endTime) { showToast('Start and end time required', 'error'); return; }
    if (endTime <= startTime) { showToast('End time must be after start time', 'error'); return; }

    const list = getClasses();
    const offering = classOfferingKey({ subjectCode, course, year, block });
    const duplicate = list.find((c) => c.id !== editingId && classOfferingKey(c) === offering);
    if (duplicate) {
      showToast(`${subjectCode} is already offered to ${classBlockLabel({ course, year, block })}`, 'error');
      return;
    }
    const fields = {
      name, subject, subjectCode, code: subjectCode,
      course, year, block,
      short: subjectTone(subjectCode),
      room, schedule, startTime, endTime, description,
    };

    if (editingId) {
      const idx = list.findIndex((c) => c.id === editingId);
      if (idx === -1) { showToast('Class not found', 'error'); return; }
      list[idx] = { ...list[idx], ...fields };
    } else {
      list.push({
        id: uid('cls'), ...fields, joinCode: makeJoinCode(),
        students: 0, nextActivity: 'TBD', nextDate: '2025-09-30', progress: 0,
      });
    }

    sbSet(SB_KEYS.CLASSES, list);
    const savedClassId = editingId;
    const returnToClassDetails = savedClassId && returnClassId === String(savedClassId);
    closeModal('addClassModal');
    if (returnToClassDetails) {
      window.location.href = `class.php?id=${encodeURIComponent(savedClassId)}`;
      return;
    }
    showToast(editingId ? 'Class updated' : 'Class created');
    editingId = null;
    e.target.reset();
    setFormMode(false);
    render();
  });

  function ensureJoinCodes() {
    const classes = getClasses();
    if (!classes.some((item) => !item.joinCode)) return;
    sbSet(SB_KEYS.CLASSES, classes.map((item) => item.joinCode ? item : { ...item, joinCode: makeJoinCode() }));
  }
  ensureJoinCodes();
  if (editId) openEditClass(editId);
  render();
  sbWhenReady(() => {
    ensureJoinCodes();
    if (editId) openEditClass(editId);
    render();
  });
  const classStateKeys = new Set([SB_KEYS.ASSIGNMENTS, SB_KEYS.CLASSES, SB_KEYS.STUDENTS, SB_KEYS.GRADES]);
  window.addEventListener('studybuddy:state-updated', (event) => {
    if (classStateKeys.has(event.detail?.key)) render();
  });
  window.addEventListener('focus', () => {
    sbInvalidate(...classStateKeys);
    render();
  });
});
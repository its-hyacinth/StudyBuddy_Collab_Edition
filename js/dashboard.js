/**
 * StudyBuddy — Student Dashboard
 */
document.addEventListener('DOMContentLoaded', () => {
  const session = initShell('student');
  if (!session) return;

  const firstName = (session.name || 'Juan').split(' ')[0].replace('Prof.', '').trim() || 'Juan';
  const greeting = document.getElementById('greeting');
  const greetingSub = document.getElementById('greetingSub');
  if (greeting) greeting.textContent = `${greetingTime()}, ${firstName}! 👋`;
  if (greetingSub) greetingSub.textContent = `${CLASSROOM_META.section} · ${CLASSROOM_META.term} · ${CLASSROOM_META.campus}`;

  const subjects = getSubjects();
  const assignments = getAssignments();
  const tasks = getTasks();
  const schedule = getSchedule();
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[char]));
  const subjectAssignments = (subject) => assignments.filter((assignment) =>
    assignment.subjectId === subject.id
    || assignment.classId === subject.id
    || (subject.classroomId && (assignment.classId === subject.classroomId || assignment.classroomId === subject.classroomId))
    || (!assignment.subjectId && [subject.name, subject.shortName, subject.short, subject.code].includes(assignment.subject))
  );
  const completedTasks = tasks.filter((task) => task.status === 'completed').length;
  const completedAssignments = assignments.filter((assignment) => assignment.status === 'completed').length;
  const overallProgress = subjects.length
    ? Math.round(subjects.reduce((sum, subject) => sum + Math.min(Math.max(Number(subject.progress) || 0, 0), 100), 0) / subjects.length)
    : 0;
  const todayStr = localDateStr();

  const setStat = (id, value) => {
    const el = document.getElementById(id);
    if (!el) return;
    const val = el.querySelector('.stat-value');
    if (val) val.textContent = value;
  };
  setStat('statSubjects', subjects.length);
  setStat('statAssignments', assignments.filter((a) => a.status !== 'completed').length);
  setStat('statTasks', tasks.filter((t) => t.status !== 'completed').length);
  setStat('statProgress', `${overallProgress}%`);
  const progressDelta = document.querySelector('#statProgress .stat-delta');
  if (progressDelta) progressDelta.textContent = `${subjects.length} subjects tracked`;
  const assignmentDelta = document.querySelector('#statAssignments .stat-delta');
  if (assignmentDelta) {
    const overdue = assignments.filter((assignment) => assignment.status === 'overdue' || (assignment.dueDate && assignment.dueDate < todayStr)).length;
    assignmentDelta.textContent = overdue ? `${overdue} overdue` : 'No overdue assignments';
  }
  const taskDelta = document.querySelector('#statTasks .stat-delta');
  if (taskDelta) {
    const dueToday = tasks.filter((task) => task.status !== 'completed' && (task.today || task.dueDate === localDateStr())).length;
    taskDelta.textContent = `${dueToday} due today`;
  }

  const todayItems = schedule.filter((s) => s.date === todayStr).sort((a, b) => String(a.startTime || '').localeCompare(String(b.startTime || '')));
  const schedEl = document.getElementById('todaySchedule');
  if (schedEl) {
    schedEl.innerHTML = todayItems.length
      ? todayItems.map((s) => `
        <div class="schedule-item">
          <span class="dot ${escapeHtml(subjectShort(s.subject))}"></span>
          <div class="time">${escapeHtml(formatTime(s.startTime))} – ${escapeHtml(formatTime(s.endTime))}</div>
          <div class="info">
            <div class="subj">${escapeHtml(s.title)}</div>
            <div class="room">${escapeHtml(s.room || s.type)}</div>
          </div>
          <i data-lucide="chevron-right" class="chevron"></i>
        </div>`).join('')
      : '<p class="empty-state" style="padding:16px">No classes scheduled today.</p>';
  }

  const recentEl = document.getElementById('recentSubjects');
  if (recentEl) {
    recentEl.innerHTML = subjects.slice(0, 4).map((s) => {
      const count = subjectAssignments(s).length;
      const color = /^#[\da-f]{6}$/i.test(s.color || '') ? s.color : '#2563EB';
      const subjectProgress = Math.min(Math.max(Number(s.progress) || 0, 0), 100);
      return `
      <a href="subjects.php?subject=${encodeURIComponent(s.id)}" class="subject-tile">
        <div class="tile-top">
          <div class="tile-icon" style="background:${color}22;color:${color}"><i data-lucide="${escapeHtml(s.icon || 'book-open')}"></i></div>
          <div>
            <div class="tile-name">${escapeHtml(s.name)}</div>
            <div class="tile-count">${count} assignments</div>
          </div>
        </div>
        <div class="progress-bar"><div class="fill ${escapeHtml(s.short || '')}" style="width:${subjectProgress}%;background:${color}"></div></div>
      </a>`;
    }).join('') || '<p class="empty-state">No subjects added yet.</p>';
  }

  const upcoming = assignments
    .filter((a) => a.status !== 'completed')
    .sort((a, b) => String(a.dueDate || '9999-12-31').localeCompare(String(b.dueDate || '9999-12-31')))
    .slice(0, 5);
  const upEl = document.getElementById('upcomingAssignments');
  if (upEl) {
    upEl.innerHTML = upcoming.length ? upcoming.map((a) => {
      const days = a.dueDate ? daysUntil(a.dueDate) : null;
      let badge = 'badge-upcoming';
      let label = days === null ? 'No due date' : `${days} days left`;
      if (a.status === 'overdue' || days < 0) { badge = 'badge-overdue'; label = 'Overdue'; }
      else if (days !== null && days <= 2) { badge = 'badge-overdue'; label = `${days} days left`; }
      else if (days !== null && days <= 5) { badge = 'badge-pending'; label = `${days} days left`; }
      return `
        <div class="list-item">
          <span class="dot ${escapeHtml(subjectShort(a.subject))}"></span>
          <div class="item-meta">
            <div class="item-title">${escapeHtml(a.title)}</div>
            <div class="item-sub">${escapeHtml(a.subject)} · ${a.dueDate ? `Due ${escapeHtml(formatDate(a.dueDate))}` : 'No due date'}</div>
          </div>
          <span class="badge ${badge}">${escapeHtml(label)}</span>
        </div>`;
    }).join('') : '<p class="empty-state">No upcoming assignments.</p>';
  }

  const now = new Date();
  let calY = now.getFullYear(), calM = now.getMonth();
  const eventDates = schedule.map((s) => s.date);
  const mini = document.getElementById('miniCalendar');
  const renderCal = (y, m) => {
    calY = y; calM = m;
    if (m < 0) { calY--; calM = 11; }
    if (m > 11) { calY++; calM = 0; }
    renderMiniCalendar(mini, calY, calM, eventDates, renderCal);
  };
  renderCal(calY, calM);

  const eventsEl = document.getElementById('upcomingEvents');
  if (eventsEl) {
    const upcomingEvents = schedule.filter((item) => item.date >= todayStr)
      .sort((a, b) => `${a.date}${a.startTime || ''}`.localeCompare(`${b.date}${b.startTime || ''}`)).slice(0, 4);
    eventsEl.innerHTML = upcomingEvents.length ? upcomingEvents.map((s) => `
      <div class="list-item">
        <span class="dot ${escapeHtml(subjectShort(s.subject))}"></span>
        <div class="item-meta">
          <div class="item-title">${escapeHtml(s.title)}</div>
          <div class="item-sub">${escapeHtml(formatDate(s.date))} · ${escapeHtml(formatTime(s.startTime))}</div>
        </div>
      </div>`).join('') : '<p class="empty-state">No upcoming events.</p>';
  }

  // Progress donut
  const donutWrap = document.getElementById('studyProgressDonut');
  if (donutWrap) {
    donutWrap.innerHTML = `
      <div class="donut-wrap">
        <div class="donut">
          ${createDonutSVG(overallProgress)}
          <div class="center-label">${overallProgress}%<small>Overall</small></div>
        </div>
        <div class="donut-legend">
          <div class="donut-legend-row">
            <div class="lbl"><span>Completed Tasks</span><span>${completedTasks}/${tasks.length}</span></div>
            <div class="progress-bar"><div class="fill green" style="width:${tasks.length ? (completedTasks / tasks.length) * 100 : 0}%"></div></div>
          </div>
          <div class="donut-legend-row">
            <div class="lbl"><span>Completed Assignments</span><span>${completedAssignments}/${assignments.length}</span></div>
            <div class="progress-bar"><div class="fill blue" style="width:${assignments.length ? (completedAssignments / assignments.length) * 100 : 0}%"></div></div>
          </div>
          <div class="donut-legend-row">
            <div class="lbl"><span>Subjects On Track</span><span>${subjects.filter((subject) => Number(subject.progress) >= 70).length}/${subjects.length}</span></div>
            <div class="progress-bar"><div class="fill purple" style="width:${subjects.length ? subjects.filter((subject) => Number(subject.progress) >= 70).length / subjects.length * 100 : 0}%"></div></div>
          </div>
        </div>
      </div>`;
  }

  const runClassroomSync = async (btn) => {
    const result = await syncGoogleClassroom(btn);
    if (result?.ok) setTimeout(() => location.reload(), 400);
  };
  document.getElementById('syncCalendarBtn')?.addEventListener('click', (e) => runClassroomSync(e.currentTarget));
  document.getElementById('syncClassroomBtn')?.addEventListener('click', (e) => runClassroomSync(e.currentTarget));
  document.getElementById('openCalendarBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    openInGoogleClassroom();
  });
  document.getElementById('openClassroomBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    openInGoogleClassroom();
  });

  document.querySelectorAll('[data-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const action = btn.getAttribute('data-action');
      const map = {
        'add-subject': 'subjects.php',
        'add-assignment': 'assignments.php',
        'add-task': 'todo.php',
        'upload-drive': 'drive.php',
        'view-schedule': 'schedule.php',
        'upload-file': 'drive.php?upload=1',
      };
      if (map[action]) window.location.href = map[action];
    });
  });

  if (typeof lucide !== 'undefined') lucide.createIcons();
});

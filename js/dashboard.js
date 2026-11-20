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
  const progress = getProgress();
  const schedule = getSchedule();

  const setStat = (id, value) => {
    const el = document.getElementById(id);
    if (!el) return;
    const val = el.querySelector('.stat-value');
    if (val) val.textContent = value;
  };
  setStat('statSubjects', subjects.length);
  setStat('statAssignments', assignments.filter((a) => a.status !== 'completed').length);
  setStat('statTasks', tasks.filter((t) => t.status !== 'completed').length);
  setStat('statProgress', `${progress.overall}%`);

  const todayStr = localDateStr();
  const todayItems = schedule.filter((s) => s.date === todayStr);
  const schedEl = document.getElementById('todaySchedule');
  if (schedEl) {
    schedEl.innerHTML = todayItems.length
      ? todayItems.map((s) => `
        <div class="schedule-item">
          <span class="dot ${subjectShort(s.subject)}"></span>
          <div class="time">${formatTime(s.startTime)} – ${formatTime(s.endTime)}</div>
          <div class="info">
            <div class="subj">${s.title}</div>
            <div class="room">${s.room || s.type}</div>
          </div>
          <i data-lucide="chevron-right" class="chevron"></i>
        </div>`).join('')
      : '<p class="empty-state" style="padding:16px">No classes scheduled today.</p>';
  }

  const recentEl = document.getElementById('recentSubjects');
  if (recentEl) {
    recentEl.innerHTML = subjects.slice(0, 4).map((s) => `
      <a href="subjects.php" class="subject-tile">
        <div class="tile-top">
          <div class="tile-icon" style="background:${s.color}22;color:${s.color}"><i data-lucide="${s.icon}"></i></div>
          <div>
            <div class="tile-name">${s.name}</div>
            <div class="tile-count">${s.assignments} assignments</div>
          </div>
        </div>
        <div class="progress-bar"><div class="fill ${s.short}" style="width:${s.progress}%"></div></div>
      </a>`).join('');
  }

  const upcoming = assignments
    .filter((a) => a.status !== 'completed')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5);
  const upEl = document.getElementById('upcomingAssignments');
  if (upEl) {
    upEl.innerHTML = upcoming.map((a) => {
      const days = daysUntil(a.dueDate);
      let badge = 'badge-upcoming';
      let label = `${days} days left`;
      if (a.status === 'overdue' || days < 0) { badge = 'badge-overdue'; label = 'Overdue'; }
      else if (days <= 2) { badge = 'badge-overdue'; label = `${days} days left`; }
      else if (days <= 5) { badge = 'badge-pending'; label = `${days} days left`; }
      return `
        <div class="list-item">
          <span class="dot ${subjectShort(a.subject)}"></span>
          <div class="item-meta">
            <div class="item-title">${a.title}</div>
            <div class="item-sub">${a.subject} · Due ${formatDate(a.dueDate)}</div>
          </div>
          <span class="badge ${badge}">${label}</span>
        </div>`;
    }).join('');
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
    eventsEl.innerHTML = schedule.slice(0, 4).map((s) => `
      <div class="list-item">
        <span class="dot ${subjectShort(s.subject)}"></span>
        <div class="item-meta">
          <div class="item-title">${s.title}</div>
          <div class="item-sub">${formatDate(s.date)} · ${formatTime(s.startTime)}</div>
        </div>
      </div>`).join('');
  }

  // Progress donut
  const donutWrap = document.getElementById('studyProgressDonut');
  if (donutWrap) {
    donutWrap.innerHTML = `
      <div class="donut-wrap">
        <div class="donut">
          ${createDonutSVG(progress.overall)}
          <div class="center-label">${progress.overall}%<small>Overall</small></div>
        </div>
        <div class="donut-legend">
          <div class="donut-legend-row">
            <div class="lbl"><span>Completed Tasks</span><span>${progress.completedTasks}/${progress.totalTasks}</span></div>
            <div class="progress-bar"><div class="fill green" style="width:${(progress.completedTasks / progress.totalTasks) * 100}%"></div></div>
          </div>
          <div class="donut-legend-row">
            <div class="lbl"><span>Completed Assignments</span><span>${progress.completedAssignments}/${progress.totalAssignments}</span></div>
            <div class="progress-bar"><div class="fill blue" style="width:${(progress.completedAssignments / progress.totalAssignments) * 100}%"></div></div>
          </div>
          <div class="donut-legend-row">
            <div class="lbl"><span>Subjects Mastered</span><span>${progress.subjectsMastered}/${progress.totalSubjects}</span></div>
            <div class="progress-bar"><div class="fill purple" style="width:${(progress.subjectsMastered / progress.totalSubjects) * 100}%"></div></div>
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
        'upload-file': 'drive.php',
      };
      if (map[action]) window.location.href = map[action];
    });
  });

  if (typeof lucide !== 'undefined') lucide.createIcons();
});

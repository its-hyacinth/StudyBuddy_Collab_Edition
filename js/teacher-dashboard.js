/**
 * StudyBuddy — Teacher Dashboard
 */
document.addEventListener('DOMContentLoaded', () => {
  const session = initShell('teacher');
  if (!session) return;

  function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  // Students from Google Classroom + students added on the Students page.
  // Same formula as the My Classes page, so the numbers always match.
  function enrolledCount(cls, students) {
    return (Number(cls.students) || 0) + classRoster(cls, students, true).length;
  }

  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  const greeting = document.getElementById('greeting');
  if (greeting) {
    // Use the logged-in teacher's name so it matches Settings and the sidebar
    const lastName = (session.name || '').replace(/^Prof\.?\s*/i, '').trim().split(' ').slice(-1)[0];
    greeting.textContent = `${greetingTime()}, ${lastName ? 'Prof. ' + lastName : 'Prof.'}! 👋`;
  }

  function paintDashboard() {
  const students = getStudents();
  const classes = getClasses();
  const assignments = getAssignments();
  const grades = getGrades();

  // ---- Stat cards (the IDs are on the .stat-value elements themselves) ----
  const baseTotal = classes.reduce((sum, c) => sum + (Number(c.students) || 0), 0);
  setText('statStudents', baseTotal + students.length);
  setText('statClasses', classes.length);
  setText('statAssignments', assignments.filter((a) => a.status !== 'completed').length);
  // Same rule as the Grades page: every grade record still marked 'pending'
  const pendingGrading = grades.filter((g) => g.status === 'pending').length;
  setText('statPending', pendingGrading);
  const pendingDelta = document.getElementById('statPending')?.closest('.stat-card')?.querySelector('.stat-delta');
  if (pendingDelta) {
    pendingDelta.className = `stat-delta ${pendingGrading ? 'down' : 'up'}`;
    pendingDelta.innerHTML = pendingGrading
      ? '<i data-lucide="alert-circle"></i> Needs attention'
      : '<i data-lucide="check-circle"></i> All caught up';
  }

  // ---- My Classes table ----
  const table = document.querySelector('#classesTable tbody') || document.getElementById('classesTableBody');
  if (table) {
    table.innerHTML = classes.map((c) => `
      <tr data-id="${escapeHtml(c.id)}">
        <td>
          <div class="cell-title">
            <div class="cell-icon" style="background:var(--${escapeHtml(c.short)}, #2563EB)22">
              <i data-lucide="graduation-cap"></i>
            </div>
            <div><div class="title">${escapeHtml(classDisplayName(c))}</div></div>
          </div>
        </td>
        <td><span class="subject-tag ${escapeHtml(c.short)}">${escapeHtml(classSubjectCode(c) || c.subject)}</span></td>
        <td style="text-align:center;">${enrolledCount(c, students)}</td>
        <td><div class="title" style="font-size:13px">${escapeHtml(c.nextActivity)}</div><div class="subtitle">${escapeHtml(formatDate(c.nextDate))}</div></td>
        <td>
          <div class="progress-row">
            <div class="progress-bar"><div class="fill ${escapeHtml(c.short)}" style="width:${Number(c.progress) || 0}%"></div></div>
            <span class="progress-pct">${Number(c.progress) || 0}%</span>
          </div>
        </td>
        <td><a href="classes.php" class="btn btn-ghost btn-sm">Manage</a></td>
      </tr>`).join('');
  }

  // ---- Recent activity ----
  const activity = document.getElementById('recentActivity');
  if (activity) {
    const msgs = getMessages();
    activity.innerHTML = [
      ...msgs.slice(0, 3).map((m) => ({ title: `Message from ${m.from}`, sub: m.preview, time: m.time })),
      { title: 'Assignment submitted', sub: 'Math Quiz 1 — Maria Santos', time: '2h ago' },
      { title: 'Grade updated', sub: 'Essay Draft — Pedro Garcia', time: 'Yesterday' },
    ].map((a) => `
      <div class="list-item">
        <div class="card-icon blue"><i data-lucide="activity"></i></div>
        <div class="item-meta"><div class="item-title">${escapeHtml(a.title)}</div><div class="item-sub">${escapeHtml(a.sub)}</div></div>
        <span style="font-size:11px;color:var(--text-muted)">${escapeHtml(a.time)}</span>
      </div>`).join('');
  }

  // ---- Class performance ----
  // #classPerformance already IS the .bar-chart element, so fill it directly
  // (the old code nested a second .bar-chart inside it and broke the layout)
  const chart = document.getElementById('classPerformance');
  if (chart) {
    chart.innerHTML = classes.map((c) => `
      <div class="bar-col">
        <div class="bar-val">${Number(c.progress) || 0}%</div>
        <div class="bar" style="height:${Number(c.progress) || 0}%;background:var(--${escapeHtml(c.short)})"></div>
        <div class="bar-label">${escapeHtml((classSubjectCode(c) || String(c.subject || c.name)).slice(0, 10))}</div>
      </div>`).join('');
  }

  // ---- Today's schedule ----
  const sched = document.getElementById('todaySchedule');
  if (sched) {
    const items = getSchedule().filter((s) => s.date === localDateStr());
    sched.innerHTML = items.length
      ? items.map((s, i) => `
      <div class="schedule-item">
        <div class="time">${escapeHtml(formatTime(s.startTime))} – ${escapeHtml(formatTime(s.endTime))}</div>
        <div class="info"><div class="subj">${escapeHtml(s.title)}</div><div class="room">${escapeHtml(s.room || s.type || '')}</div></div>
        <span class="badge ${i === 0 ? 'badge-progress' : 'badge-upcoming'}">${i === 0 ? 'In Progress' : 'Upcoming'}</span>
      </div>`).join('')
      : '<p class="empty-state" style="padding:16px">No classes scheduled today.</p>';
  }

  // ---- Class reminders ----
  const reminders = document.getElementById('classReminders');
  if (reminders) {
    reminders.innerHTML = assignments.filter((a) => a.status !== 'completed').slice(0, 4).map((a) => `
      <div class="list-item">
        <span class="dot ${escapeHtml(subjectShort(a.subject))}"></span>
        <div class="item-meta"><div class="item-title">${escapeHtml(a.subject)} — ${escapeHtml(a.title)}</div>
        <div class="item-sub">${escapeHtml(formatDate(a.dueDate))}</div></div>
      </div>`).join('');
  }

  }

  paintDashboard();
  sbWhenReady(paintDashboard);

  document.querySelectorAll('[data-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const map = {
        'create-assignment': 'assignments.php',
        'add-grade': 'grades.php',
        'view-calendar': 'calendar.php',
        'message-students': 'messages.php',
      };
      const href = map[btn.dataset.action];
      if (href) location.href = href;
    });
  });

  if (typeof lucide !== 'undefined') lucide.createIcons();
});
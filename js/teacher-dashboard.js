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

  function activityTime(timestamp) {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return '';
    const elapsed = Math.max(0, Date.now() - date.getTime());
    if (elapsed < 60_000) return 'Just now';
    if (elapsed < 3_600_000) return `${Math.floor(elapsed / 60_000)}m ago`;
    if (elapsed < 86_400_000) return `${Math.floor(elapsed / 3_600_000)}h ago`;
    if (elapsed < 172_800_000) return 'Yesterday';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

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
    const events = [];
    const addEvent = (timestamp, event) => {
      const time = Date.parse(timestamp || '');
      if (Number.isFinite(time)) events.push({ ...event, timestamp: time });
    };
    grades.forEach((grade) => {
      const className = grade.class || classDisplayName(classes.find((item) => String(item.id) === String(grade.classId))) || 'Class';
      if (grade.submission?.submittedAt) {
        addEvent(grade.submission.submittedAt, {
          title: `${grade.student || 'Student'} submitted ${grade.assignment || 'an assignment'}`,
          sub: className,
          icon: 'file-check',
          href: `grades.php?grade=${encodeURIComponent(grade.id)}`,
        });
      }
      if (grade.status === 'graded' && grade.gradedAt) {
        addEvent(grade.gradedAt, {
          title: `Grade updated for ${grade.student || 'student'}`,
          sub: `${grade.assignment || 'Assignment'} · ${className}`,
          icon: 'award',
          href: `grades.php?grade=${encodeURIComponent(grade.id)}`,
        });
      }
    });
    assignments.forEach((assignment) => {
      if (!assignment.createdAt) return;
      const cls = classes.find((item) => String(item.id) === String(assignment.classId || assignment.subjectId));
      addEvent(assignment.createdAt, {
        title: `Assignment created: ${assignment.title || 'Untitled assignment'}`,
        sub: cls ? classDisplayName(cls) : (assignment.subject || 'Class'),
        icon: 'clipboard-plus',
        href: `assignments.php?assignment=${encodeURIComponent(assignment.id)}`,
      });
    });
    getMessages().forEach((message) => {
      if (!message.createdAt) return;
      addEvent(message.createdAt, {
        title: `Message sent to ${message.from || 'student'}`,
        sub: `${message.class || 'General'} · ${message.preview || ''}`,
        icon: 'message-square',
        href: `messages.php?message=${encodeURIComponent(message.id)}`,
      });
    });
    activity.innerHTML = events
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5)
      .map((event) => `
      <a class="list-item list-item-link" href="${escapeHtml(event.href)}">
        <div class="cell-icon" style="background:#DBEAFE;color:#2563EB;width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center"><i data-lucide="${event.icon}"></i></div>
        <div class="item-meta"><div class="item-title">${escapeHtml(event.title)}</div><div class="item-sub">${escapeHtml(event.sub)}</div></div>
        <span style="font-size:11px;color:var(--text-muted)">${escapeHtml(activityTime(event.timestamp))}</span>
      </a>`).join('') || '<p class="empty-state" style="padding:16px">No recent activity yet.</p>';
  }

  // ---- Class performance ----
  const chart = document.getElementById('classPerformance');
  if (chart) {
    chart.innerHTML = classes.length ? classes.map((c) => {
      const performance = classPerformance(c, grades);
      const value = performance ? `${performance.average}%` : '—';
      const height = performance ? performance.average : 0;
      const label = classSubjectCode(c) || c.subject || c.name || 'Class';
      const title = performance
        ? `${classDisplayName(c)}: ${performance.average}% from ${performance.gradedCount} graded submission${performance.gradedCount === 1 ? '' : 's'}`
        : `${classDisplayName(c)}: no graded submissions`;
      return `
      <div class="bar-col">
        <div class="bar-val" title="${escapeHtml(title)}">${value}</div>
        <div class="bar" title="${escapeHtml(title)}" style="height:${height}%;background:var(--${escapeHtml(c.short)}, var(--primary))"></div>
        <div class="bar-label" title="${escapeHtml(classDisplayName(c))}">${escapeHtml(label.slice(0, 10))}</div>
      </div>`;
    }).join('') : '<p class="empty-state" style="padding:16px">No classes available.</p>';
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

  if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  paintDashboard();
  sbWhenReady(paintDashboard);
  const dashboardStateKeys = new Set([
    SB_KEYS.ASSIGNMENTS, SB_KEYS.CLASSES, SB_KEYS.STUDENTS, SB_KEYS.GRADES, SB_KEYS.MESSAGES,
  ]);
  window.addEventListener('studybuddy:state-updated', (event) => {
    if (dashboardStateKeys.has(event.detail?.key)) paintDashboard();
  });
  window.addEventListener('focus', () => {
    sbInvalidate(...dashboardStateKeys);
    paintDashboard();
  });

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

});
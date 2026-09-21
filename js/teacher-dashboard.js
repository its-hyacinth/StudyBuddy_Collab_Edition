/**
 * StudyBuddy — Teacher Dashboard
 */
document.addEventListener('DOMContentLoaded', () => {
  const session = initShell('teacher');
  if (!session) return;

  const greeting = document.getElementById('greeting');
  if (greeting) greeting.textContent = `${greetingTime()}, Prof.! 👋`;

  const students = getStudents();
  const classes = getClasses();
  const assignments = getAssignments();
  const grades = getGrades();

  const setVal = (sel, v) => {
    const el = document.querySelector(sel);
    if (el) el.textContent = v;
  };
  setVal('#statStudents .stat-value', students.length * 15 || 124);
  setVal('#statClasses .stat-value', classes.length);
  setVal('#statAssignments .stat-value', assignments.filter((a) => a.status !== 'completed').length);
  setVal('#statGrading .stat-value', grades.filter((g) => g.status === 'pending').length);

  // Also update by index if IDs differ
  const vals = document.querySelectorAll('.stat-grid .stat-value');
  if (vals.length >= 4) {
    vals[0].textContent = 124;
    vals[1].textContent = classes.length;
    vals[2].textContent = assignments.length;
    vals[3].textContent = grades.filter((g) => g.status === 'pending').length;
  }

  const table = document.querySelector('#classesTable tbody') || document.getElementById('classesTableBody');
  if (table) {
    table.innerHTML = classes.map((c) => `
      <tr>
        <td>
          <div class="cell-title">
            <div class="cell-icon" style="background:var(--${c.short === 'cs' ? 'cs' : c.short}, #2563EB)22">
              <i data-lucide="graduation-cap"></i>
            </div>
            <div><div class="title">${c.name}</div></div>
          </div>
        </td>
        <td><span class="subject-tag ${c.short}">${c.subject}</span></td>
        <td>${c.students}</td>
        <td><div class="title" style="font-size:13px">${c.nextActivity}</div><div class="subtitle">${formatDate(c.nextDate)}</div></td>
        <td>
          <div class="progress-row">
            <div class="progress-bar"><div class="fill ${c.short}" style="width:${c.progress}%"></div></div>
            <span class="progress-pct">${c.progress}%</span>
          </div>
        </td>
        <td><i data-lucide="chevron-right" class="chevron"></i></td>
      </tr>`).join('');
  }

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
        <div class="item-meta"><div class="item-title">${a.title}</div><div class="item-sub">${a.sub}</div></div>
        <span style="font-size:11px;color:var(--text-muted)">${a.time}</span>
      </div>`).join('');
  }

  const chart = document.getElementById('classPerformance');
  if (chart) {
    chart.innerHTML = `<div class="bar-chart">${classes.map((c) => `
      <div class="bar-col">
        <div class="bar-val">${c.progress}%</div>
        <div class="bar" style="height:${c.progress}%;background:var(--${c.short === 'cs' ? 'cs' : c.short})"></div>
        <div class="bar-label">${c.subject.split(' ')[0].slice(0, 8)}</div>
      </div>`).join('')}</div>`;
  }

  const sched = document.getElementById('todaySchedule');
  if (sched) {
    const items = getSchedule().filter((s) => s.date === '2025-09-12');
    sched.innerHTML = items.map((s, i) => `
      <div class="schedule-item">
        <div class="time">${formatTime(s.startTime)} – ${formatTime(s.endTime)}</div>
        <div class="info"><div class="subj">${s.title}</div><div class="room">${s.room}</div></div>
        <span class="badge ${i === 0 ? 'badge-progress' : 'badge-upcoming'}">${i === 0 ? 'In Progress' : 'Upcoming'}</span>
      </div>`).join('');
  }

  const reminders = document.getElementById('classReminders');
  if (reminders) {
    reminders.innerHTML = assignments.filter((a) => a.status !== 'completed').slice(0, 4).map((a) => `
      <div class="list-item">
        <span class="dot ${subjectShort(a.subject)}"></span>
        <div class="item-meta"><div class="item-title">${a.subject} — ${a.title}</div>
        <div class="item-sub">${formatDate(a.dueDate)}</div></div>
      </div>`).join('');
  }

  document.querySelectorAll('[data-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const map = {
        'create-assignment': 'assignments.html',
        'add-grade': 'grades.html',
        'view-calendar': 'calendar.html',
        'message-students': 'messages.html',
      };
      const href = map[btn.dataset.action];
      if (href) location.href = href;
    });
  });

  if (typeof lucide !== 'undefined') lucide.createIcons();
});

/**
 * StudyBuddy — Study Progress
 */
document.addEventListener('DOMContentLoaded', () => {
  const session = initShell('student');
  if (!session) return;
  wireModalClosers();

  let chartMode = '7days';
  const now = new Date();
  let calY = now.getFullYear(), calM = now.getMonth();
  let activeProgressDetailType = null;

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[char]));
  }

  function subjectAssignmentsFor(subject, assignments) {
    return assignments.filter((assignment) =>
      assignment.subjectId === subject.id
      || assignment.classId === subject.id
      || (subject.classroomId && (assignment.classId === subject.classroomId || assignment.classroomId === subject.classroomId))
      || (!assignment.subjectId && [subject.name, subject.shortName, subject.short, subject.code].includes(assignment.subject))
    );
  }

  function subjectProgress(subject, assignments) {
    const value = Number(subject.progress) || 0;
    if ((subject.source === 'classroom' || subject.classroomId) && assignments.length) {
      return Math.round(assignments.filter((assignment) => assignment.status === 'completed').length / assignments.length * 100);
    }
    return Math.min(Math.max(value, 0), 100);
  }

  function progressMetrics() {
    const tasks = getTasks();
    const assignments = getAssignments();
    const subjects = getSubjects();
    const overall = subjects.length
      ? Math.round(subjects.reduce((sum, subject) => sum + subjectProgress(subject, subjectAssignmentsFor(subject, assignments)), 0) / subjects.length)
      : 0;
    return {
      tasks,
      assignments,
      subjects,
      completedTasks: tasks.filter((task) => task.status === 'completed').length,
      completedAssignments: assignments.filter((assignment) => assignment.status === 'completed').length,
      overall,
    };
  }

  function progressItemStatus(item, type) {
    if (item.status === 'completed') return 'completed';
    const today = localDateStr();
    const overdueByDate = item.dueDate && item.dueDate < today;
    const overdueByTime = type === 'tasks' && item.dueDate === today && item.dueTime
      && item.dueTime < `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`;
    return item.status === 'overdue' || overdueByDate || overdueByTime ? 'overdue' : 'pending';
  }

  function renderStats() {
    const p = getProgress() || {};
    const metrics = progressMetrics();
    const hoursStudied = Math.max(Number(p.hoursStudied) || 0, 0);
    const weeklyGoalHours = Math.max(Number(p.weeklyGoalHours) || 0, 0);
    const remainingTasks = Math.max(metrics.tasks.length - metrics.completedTasks, 0);
    const remainingAssignments = Math.max(metrics.assignments.length - metrics.completedAssignments, 0);
    const el = document.getElementById('progressStats');
    if (!el) return;
    el.innerHTML = `
      <div class="stat-card" role="button" tabindex="0" data-progress-detail="overall" aria-haspopup="dialog" aria-controls="progressStatModal">
        <div class="stat-icon blue"><i data-lucide="target"></i></div>
        <div class="stat-body"><div class="stat-label">Overall Progress</div><div class="stat-value">${metrics.overall}%</div><div class="stat-delta">${metrics.subjects.length} subjects</div></div>
      </div>
      <div class="stat-card" role="button" tabindex="0" data-progress-detail="tasks" aria-haspopup="dialog" aria-controls="progressStatModal">
        <div class="stat-icon green"><i data-lucide="check-circle"></i></div>
        <div class="stat-body"><div class="stat-label">Tasks Completed</div><div class="stat-value">${metrics.completedTasks}/${metrics.tasks.length}</div><div class="stat-delta">${remainingTasks} remaining</div></div>
      </div>
      <div class="stat-card" role="button" tabindex="0" data-progress-detail="assignments" aria-haspopup="dialog" aria-controls="progressStatModal">
        <div class="stat-icon purple"><i data-lucide="clipboard-check"></i></div>
        <div class="stat-body"><div class="stat-label">Assignments Done</div><div class="stat-value">${metrics.completedAssignments}/${metrics.assignments.length}</div><div class="stat-delta">${remainingAssignments} remaining</div></div>
      </div>
      <div class="stat-card" role="button" tabindex="0" data-progress-detail="hours" aria-haspopup="dialog" aria-controls="progressStatModal">
        <div class="stat-icon orange"><i data-lucide="clock"></i></div>
        <div class="stat-body"><div class="stat-label">Hours Studied</div><div class="stat-value">${hoursStudied}h</div><div class="stat-delta">${weeklyGoalHours ? `Goal: ${weeklyGoalHours}h/week` : 'No weekly goal set'}</div></div>
      </div>`;
  }

  function showProgressDetails(type, activeFilter = 'all') {
    const title = document.getElementById('progressStatTitle');
    const content = document.getElementById('progressStatContent');
    if (!title || !content) return;

    document.querySelector('#progressStatModal .modal')?.classList.remove('is-compact');
    const p = getProgress() || {};
    const metrics = progressMetrics();
    activeProgressDetailType = type;
    const hoursStudied = Math.max(Number(p.hoursStudied) || 0, 0);
    const weeklyGoalHours = Math.max(Number(p.weeklyGoalHours) || 0, 0);
    const progress = {
      overall: {
        title: 'Overall Progress',
        description: 'Average progress across your subjects.',
        body: metrics.subjects.length ? metrics.subjects.map((subject) => {
          const value = subjectProgress(subject, subjectAssignmentsFor(subject, metrics.assignments));
          const color = /^#[\da-f]{6}$/i.test(subject.color || '') ? subject.color : '#2563EB';
          return `
            <div class="progress-stat-subject">
              <div class="progress-stat-subject-heading"><span>${escapeHtml(subject.name)}</span><strong>${value}%</strong></div>
              <div class="progress-bar"><div class="fill" style="width:${value}%;background:${color}"></div></div>
            </div>`;
        }).join('') : '<p class="empty-state">No subjects to show yet.</p>',
      },
      tasks: {
        title: 'Tasks Completed',
        description: `${metrics.completedTasks} of ${metrics.tasks.length} tasks are completed. ${Math.max(metrics.tasks.length - metrics.completedTasks, 0)} remaining.`,
        items: metrics.tasks,
        empty: 'No tasks have been added yet.',
      },
      assignments: {
        title: 'Assignments Done',
        description: `${metrics.completedAssignments} of ${metrics.assignments.length} assignments are completed. ${Math.max(metrics.assignments.length - metrics.completedAssignments, 0)} remaining.`,
        items: metrics.assignments,
        empty: 'No assignments have been added yet.',
      },
      hours: {
        title: 'Hours Studied',
        description: weeklyGoalHours
          ? `${hoursStudied} of ${weeklyGoalHours} hours logged toward your weekly goal.`
          : `${hoursStudied} study hours logged. You have not set a weekly goal yet.`,
        body: `
          <div class="progress-stat-summary">
            <strong>${hoursStudied}h</strong>
            <span>${weeklyGoalHours ? `of ${weeklyGoalHours}h weekly goal` : 'studied so far'}</span>
          </div>
          ${weeklyGoalHours ? `<div class="progress-bar"><div class="fill green" style="width:${Math.min(Math.round(hoursStudied / weeklyGoalHours * 100), 100)}%"></div></div>` : ''}`,
      },
    }[type];
    if (!progress) return;

    title.textContent = progress.title;
    let body = progress.body || '';
    if (Array.isArray(progress.items)) {
      const items = progress.items.map((item) => ({ item, status: progressItemStatus(item, type) }));
      const filters = [
        { id: 'all', label: 'All' },
        { id: 'pending', label: 'Pending' },
        { id: 'overdue', label: 'Overdue' },
        { id: 'completed', label: 'Completed' },
      ];
      const visibleItems = activeFilter === 'all'
        ? items
        : items.filter((entry) => entry.status === activeFilter);
      body = `
        <div class="progress-stat-filters" role="group" aria-label="Filter by status">
          ${filters.map((filter) => {
            const count = filter.id === 'all' ? items.length : items.filter((entry) => entry.status === filter.id).length;
            return `<button type="button" class="progress-stat-filter ${activeFilter === filter.id ? 'active' : ''}" data-progress-filter="${filter.id}" aria-pressed="${activeFilter === filter.id}">${filter.label}<span>${count}</span></button>`;
          }).join('')}
        </div>
        <div class="progress-stat-list">
          ${visibleItems.length ? visibleItems.map(({ item, status }) => {
            const metadata = [
              item.subject || 'General',
              item.dueDate ? `Due ${formatDate(item.dueDate)}` : 'No due date',
            ].map(escapeHtml).join(' · ');
            return `
              <div class="list-item">
                <div class="item-meta">
                  <div class="item-title">${escapeHtml(item.title || 'Untitled')}</div>
                  <div class="item-sub">${metadata}</div>
                </div>
                <span class="badge ${escapeHtml(statusClass(status))}">${escapeHtml(statusLabel(status))}</span>
              </div>`;
          }).join('') : `<p class="empty-state">${activeFilter === 'all' ? progress.empty : `No ${activeFilter} ${type}.`}</p>`}
        </div>`;
    }
    content.innerHTML = `<p class="progress-stat-description">${escapeHtml(progress.description)}</p>${body}`;
    openModal('progressStatModal');
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  function renderChart() {
    const p = getProgress();
    const data = chartMode === '30days' ? p.chart30Days
      : chartMode === 'month' ? p.chartMonth
      : p.chart7Days;
    const wrap = document.getElementById('progressChart');
    if (!wrap) return;

    const series = Array.isArray(data)
      ? data.map((point) => ({ ...point, value: Math.min(Math.max(Number(point.value) || 0, 0), 100) }))
      : [];
    if (!series.length) {
      wrap.innerHTML = '<p class="empty-state">No progress history available for this range.</p>';
      return;
    }

    const w = 560, h = 200, pad = 30;
    const max = Math.max(...series.map((point) => point.value), 100);
    const pts = series.map((d, i) => {
      const x = pad + (i / Math.max(series.length - 1, 1)) * (w - pad * 2);
      const y = h - pad - (d.value / max) * (h - pad * 2);
      return { x, y, ...d };
    });
    const polyline = pts.map((p) => `${p.x},${p.y}`).join(' ');
    const last = pts[pts.length - 1];

    wrap.innerHTML = `
      <div class="line-chart-wrap">
        <svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#2563EB" stop-opacity="0.2"/>
              <stop offset="100%" stop-color="#2563EB" stop-opacity="0"/>
            </linearGradient>
          </defs>
          ${[0, 25, 50, 75, 100].map((v) => {
            const y = h - pad - (v / max) * (h - pad * 2);
            return `<line x1="${pad}" y1="${y}" x2="${w - pad}" y2="${y}" stroke="#E2E8F0" stroke-width="1"/>`;
          }).join('')}
          <polygon fill="url(#areaGrad)" points="${pts[0].x},${h - pad} ${polyline} ${last.x},${h - pad}" />
          <polyline fill="none" stroke="#2563EB" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" points="${polyline}" />
          ${pts.map((pt) => `<circle cx="${pt.x}" cy="${pt.y}" r="4" fill="#fff" stroke="#2563EB" stroke-width="2"/>`).join('')}
          <circle cx="${last.x}" cy="${last.y}" r="6" fill="#2563EB"/>
          ${pts.map((pt) => `<text x="${pt.x}" y="${h - 8}" text-anchor="middle" font-size="11" fill="#94A3B8">${escapeHtml(pt.label)}</text>`).join('')}
        </svg>
        <div class="chart-tooltip" style="left:${(last.x / w) * 100}%;top:${(last.y / h) * 100}%">${escapeHtml(last.label)} · ${last.value}%</div>
      </div>`;
  }

  function renderSubjectTable() {
    const el = document.getElementById('subjectProgressTable');
    const tbody = el?.querySelector?.('tbody') || el;
    if (!tbody) return;
    const assignments = getAssignments();
    const subjects = getSubjects();
    if (!subjects.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No subjects available yet.</td></tr>';
      return;
    }

    const rows = subjects.map((s) => {
      const subjectAssignments = subjectAssignmentsFor(s, assignments);
      const progress = subjectProgress(s, subjectAssignments);
      const completed = subjectAssignments.filter((assignment) => assignment.status === 'completed').length;
      const status = progress >= 70 ? 'On Track' : progress >= 40 ? 'In Progress' : 'Needs Focus';
      const badge = progress >= 70 ? 'badge-completed' : progress >= 40 ? 'badge-progress' : 'badge-pending';
      const color = /^#[\da-f]{6}$/i.test(s.color || '') ? s.color : '#2563EB';
      return `
        <tr data-subject-id="${escapeHtml(s.id)}">
          <td>
            <div class="cell-title">
              <div class="cell-icon" style="background:${color}22;color:${color}"><i data-lucide="${escapeHtml(s.icon || 'book-open')}"></i></div>
              <div class="title">${escapeHtml(s.name)}</div>
            </div>
          </td>
          <td>
            <div class="progress-row">
              <div class="progress-bar"><div class="fill" style="width:${progress}%;background:${color}"></div></div>
              <span class="progress-pct">${progress}%</span>
            </div>
          </td>
          <td>${subjectAssignments.length}</td>
          <td>${completed}</td>
          <td><span class="badge ${badge}">${status}</span></td>
        </tr>`;
    }).join('');
    if (el?.tagName === 'TABLE') {
      const thead = el.querySelector('thead');
      el.innerHTML = (thead ? thead.outerHTML : '<thead><tr><th>Subject</th><th>Progress</th><th>Assignments</th><th>Completed</th><th>Status</th></tr></thead>') + `<tbody>${rows}</tbody>`;
    } else {
      tbody.innerHTML = rows;
    }
  }

  function renderGoals() {
    const p = getProgress() || {};
    const hoursStudied = Math.max(Number(p.hoursStudied) || 0, 0);
    const weeklyGoalHours = Math.max(Number(p.weeklyGoalHours) || 0, 0);
    const pct = weeklyGoalHours ? Math.round((hoursStudied / weeklyGoalHours) * 100) : 0;
    const ringPct = Math.min(Math.max(pct, 0), 100);
    const el = document.getElementById('studyGoalsDonut');
    if (el) {
      el.innerHTML = `
        <div class="donut-wrap">
          <div class="donut">${createDonutSVG(ringPct, '#16A34A')}<div class="center-label">${pct}%<small>Goal</small></div></div>
          <div class="donut-legend">
            <div class="donut-legend-row">
              <div class="lbl"><span>Hours studied</span><span>${hoursStudied}h</span></div>
              <div class="progress-bar"><div class="fill green" style="width:${ringPct}%"></div></div>
            </div>
            <div class="donut-legend-row">
              <div class="lbl"><span>Weekly target</span><span>${weeklyGoalHours ? `${weeklyGoalHours}h` : 'Not set'}</span></div>
            </div>
          </div>
        </div>`;
    }
  }

  function openCalendarDate(date) {
    const [year, month, day] = date.split('-').map(Number);
    const title = document.getElementById('progressStatTitle');
    const content = document.getElementById('progressStatContent');
    if (!title || !content) return;

    const dateLabel = new Date(year, month - 1, day).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
    const schedule = getSchedule()
      .filter((entry) => entry.date === date)
      .sort((a, b) => String(a.startTime || '').localeCompare(String(b.startTime || '')));
    const assignments = getAssignments().filter((assignment) =>
      assignment.dueDate === date && assignment.status !== 'completed'
    );
    const tasks = getTasks().filter((task) =>
      task.dueDate === date && task.status !== 'completed'
    );
    const groups = [
      {
        title: 'Schedule',
        items: schedule.map((entry) => ({
          title: entry.title || 'Untitled event',
          detail: `${entry.subject || 'General'} · ${entry.startTime ? formatTime(entry.startTime) : 'Time not set'}`,
        })),
        href: 'schedule.php',
        link: 'Open Schedule',
      },
      {
        title: 'Assignment deadlines',
        items: assignments.map((assignment) => ({
          title: assignment.title || 'Untitled assignment',
          detail: assignment.subject || 'General',
        })),
        href: 'assignments.php',
        link: 'Open Assignments',
      },
      {
        title: 'Tasks',
        items: tasks.map((task) => ({
          title: task.title || 'Untitled task',
          detail: task.subject || 'General',
        })),
        href: 'todo.php',
        link: 'Open To-Do List',
      },
    ].filter((group) => group.items.length);

    activeProgressDetailType = null;
    document.querySelector('#progressStatModal .modal')?.classList.add('is-compact');
    title.textContent = dateLabel;
    content.innerHTML = groups.length ? groups.map((group) => `
      <section class="progress-calendar-group">
        <h4>${escapeHtml(group.title)}</h4>
        <div class="progress-calendar-items">
          ${group.items.map((item) => `
            <div class="list-item">
              <div class="item-meta">
                <div class="item-title">${escapeHtml(item.title)}</div>
                <div class="item-sub">${escapeHtml(item.detail)}</div>
              </div>
            </div>`).join('')}
        </div>
        <a class="btn btn-outline btn-sm" href="${group.href}">${group.link}</a>
      </section>`).join('') : '<p class="empty-state">Nothing is scheduled for this day.</p>';
    openModal('progressStatModal');
  }

  function showDeadlineDetails(id) {
    const assignment = getAssignments().find((item) => item.id === id);
    const title = document.getElementById('progressStatTitle');
    const content = document.getElementById('progressStatContent');
    if (!title || !content) return;
    if (!assignment) {
      showToast('This assignment is no longer available.', 'error');
      renderDeadlines();
      return;
    }

    const status = progressItemStatus(assignment, 'assignments');
    activeProgressDetailType = null;
    document.querySelector('#progressStatModal .modal')?.classList.add('is-compact');
    title.textContent = assignment.title || 'Assignment details';
    content.innerHTML = `
      <p class="progress-stat-description">${escapeHtml(assignment.description || 'No description provided.')}</p>
      <div class="progress-deadline-details">
        <div class="progress-deadline-field">
          <span>Subject</span>
          <strong>${escapeHtml(assignment.subject || 'General')}</strong>
        </div>
        <div class="progress-deadline-field">
          <span>Due date</span>
          <strong>${assignment.dueDate ? escapeHtml(formatDate(assignment.dueDate)) : 'Not set'}</strong>
        </div>
      </div>
      <div class="progress-deadline-actions">
        <span class="badge ${escapeHtml(statusClass(status))}">${escapeHtml(statusLabel(status))}</span>
        <a class="btn btn-primary btn-sm" href="assignments.php">Open Assignments</a>
      </div>
    `;
    openModal('progressStatModal');
  }

  function renderMiniCalendarView() {
    const mini = document.getElementById('progressMiniCalendar');
    if (!mini) return;
    const eventDates = [
      ...getSchedule().map((entry) => entry.date),
      ...getAssignments().filter((assignment) => assignment.status !== 'completed').map((assignment) => assignment.dueDate),
      ...getTasks().filter((task) => task.status !== 'completed').map((task) => task.dueDate),
    ].filter(Boolean);
    renderMiniCalendar(
      mini,
      calY,
      calM,
      eventDates,
      (year, month) => {
        const selectedMonth = new Date(year, month, 1);
        calY = selectedMonth.getFullYear();
        calM = selectedMonth.getMonth();
        renderMiniCalendarView();
      },
      openCalendarDate
    );
  }

  function renderDeadlines() {
    const el = document.getElementById('progressDeadlineList') || document.getElementById('upcomingDeadlines');
    if (!el) return;
    const today = localDateStr();
    const assignments = getAssignments()
      .filter((assignment) => assignment.status !== 'completed')
      .sort((a, b) => String(a.dueDate || '9999-12-31').localeCompare(String(b.dueDate || '9999-12-31')))
      .slice(0, 4);
    el.innerHTML = assignments.length ? assignments.map((assignment) => {
      const dueDate = assignment.dueDate || '';
      const overdue = dueDate && (assignment.status === 'overdue' || dueDate < today);
      const dueLabel = overdue ? `Overdue · ${formatDate(dueDate)}`
        : dueDate === today ? 'Due today'
          : dueDate ? `Due ${formatDate(dueDate)}` : 'No due date';
      return `
        <div class="list-item" data-progress-deadline="${escapeHtml(assignment.id)}" role="button" tabindex="0" aria-label="View details for ${escapeHtml(assignment.title || 'assignment')}" aria-haspopup="dialog" aria-controls="progressStatModal">
          <span class="dot ${escapeHtml(subjectShort(assignment.subject))}"></span>
          <div class="item-meta">
            <div class="item-title">${escapeHtml(assignment.title)}</div>
            <div class="item-sub">${escapeHtml(dueLabel)}</div>
          </div>
        </div>`;
    }).join('') : '<p class="empty-state">No upcoming deadlines.</p>';
  }

  function render() {
    renderStats();
    renderChart();
    renderSubjectTable();
    renderGoals();
    renderMiniCalendarView();
    renderDeadlines();
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  document.querySelectorAll('#progressChartTabs [data-range]').forEach((btn) => {
    btn.addEventListener('click', () => {
      chartMode = btn.dataset.range;
      document.querySelectorAll('#progressChartTabs [data-range]').forEach((b) => b.classList.toggle('active', b === btn));
      renderChart();
    });
  });

  const progressStats = document.getElementById('progressStats');
  progressStats?.addEventListener('click', (event) => {
    const card = event.target.closest('[data-progress-detail]');
    if (card) showProgressDetails(card.dataset.progressDetail);
  });
  progressStats?.addEventListener('keydown', (event) => {
    const card = event.target.closest('[data-progress-detail]');
    if (!card || !['Enter', ' '].includes(event.key)) return;
    event.preventDefault();
    showProgressDetails(card.dataset.progressDetail);
  });
  document.getElementById('progressStatContent')?.addEventListener('click', (event) => {
    const filter = event.target.closest('[data-progress-filter]');
    if (!filter) return;
    if (activeProgressDetailType) showProgressDetails(activeProgressDetailType, filter.dataset.progressFilter);
  });
  document.getElementById('progressDeadlineList')?.addEventListener('click', (event) => {
    const deadline = event.target.closest('[data-progress-deadline]');
    if (deadline) showDeadlineDetails(deadline.dataset.progressDeadline);
  });
  document.getElementById('progressDeadlineList')?.addEventListener('keydown', (event) => {
    const deadline = event.target.closest('[data-progress-deadline]');
    if (!deadline || !['Enter', ' '].includes(event.key)) return;
    event.preventDefault();
    showDeadlineDetails(deadline.dataset.progressDeadline);
  });

  render();
});

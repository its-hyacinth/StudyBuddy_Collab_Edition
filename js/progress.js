/**
 * StudyBuddy — Study Progress
 */
document.addEventListener('DOMContentLoaded', () => {
  const session = initShell('student');
  if (!session) return;

  let chartMode = '7days';
  const now = new Date();
  let calY = now.getFullYear(), calM = now.getMonth();

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[char]));
  }

  function progressMetrics() {
    const tasks = getTasks();
    const assignments = getAssignments();
    const subjects = getSubjects();
    const overall = subjects.length
      ? Math.round(subjects.reduce((sum, subject) => sum + Math.min(Math.max(Number(subject.progress) || 0, 0), 100), 0) / subjects.length)
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
      <div class="stat-card" style="cursor:default">
        <div class="stat-icon blue"><i data-lucide="target"></i></div>
        <div class="stat-body"><div class="stat-label">Overall Progress</div><div class="stat-value">${metrics.overall}%</div><div class="stat-delta">${metrics.subjects.length} subjects</div></div>
      </div>
      <div class="stat-card" style="cursor:default">
        <div class="stat-icon green"><i data-lucide="check-circle"></i></div>
        <div class="stat-body"><div class="stat-label">Tasks Completed</div><div class="stat-value">${metrics.completedTasks}/${metrics.tasks.length}</div><div class="stat-delta">${remainingTasks} remaining</div></div>
      </div>
      <div class="stat-card" style="cursor:default">
        <div class="stat-icon purple"><i data-lucide="clipboard-check"></i></div>
        <div class="stat-body"><div class="stat-label">Assignments Done</div><div class="stat-value">${metrics.completedAssignments}/${metrics.assignments.length}</div><div class="stat-delta">${remainingAssignments} remaining</div></div>
      </div>
      <div class="stat-card" style="cursor:default">
        <div class="stat-icon orange"><i data-lucide="clock"></i></div>
        <div class="stat-body"><div class="stat-label">Hours Studied</div><div class="stat-value">${hoursStudied}h</div><div class="stat-delta">${weeklyGoalHours ? `Goal: ${weeklyGoalHours}h/week` : 'No weekly goal set'}</div></div>
      </div>`;
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
      const progress = Math.min(Math.max(Number(s.progress) || 0, 0), 100);
      const subjectAssignments = assignments.filter((assignment) =>
        assignment.subjectId === s.id
        || assignment.classId === s.id
        || (s.classroomId && (assignment.classId === s.classroomId || assignment.classroomId === s.classroomId))
        || (!assignment.subjectId && [s.name, s.shortName, s.short, s.code].includes(assignment.subject))
      );
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

  function renderMiniCalendarView() {
    const mini = document.getElementById('progressMiniCalendar');
    if (!mini) return;
    renderMiniCalendar(mini, calY, calM, getSchedule().map((s) => s.date), (year, month) => {
      const selectedMonth = new Date(year, month, 1);
      calY = selectedMonth.getFullYear();
      calM = selectedMonth.getMonth();
      renderMiniCalendarView();
    });
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
        <div class="list-item">
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

  render();
});

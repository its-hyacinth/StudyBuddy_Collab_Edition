/**
 * StudyBuddy — Study Progress
 */
document.addEventListener('DOMContentLoaded', () => {
  const session = initShell('student');
  if (!session) return;

  let chartMode = '7days';
  const now = new Date();
  let calY = now.getFullYear(), calM = now.getMonth();

  function renderStats() {
    const p = getProgress();
    const map = {
      statCompletedTasks: p.completedTasks,
      statTotalAssignments: p.totalAssignments,
      statHoursStudied: p.hoursStudied,
      statOverallProgress: `${p.overall}%`,
    };
    Object.entries(map).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (!el) return;
      const v = el.querySelector('.stat-value');
      if (v) v.textContent = val;
      else if (el.classList.contains('stat-value')) el.textContent = val;
    });
    // Also try generic stat grid updates
    const cards = document.querySelectorAll('.stat-card .stat-value');
    if (cards.length >= 4) {
      cards[0].textContent = p.completedTasks;
      cards[1].textContent = p.totalAssignments;
      cards[2].textContent = p.hoursStudied;
      cards[3].textContent = `${p.overall}%`;
    }
  }

  function renderChart() {
    const p = getProgress();
    const data = chartMode === '30days' ? p.chart30Days
      : chartMode === 'month' ? p.chartMonth
      : p.chart7Days;
    const wrap = document.getElementById('progressChart');
    if (!wrap) return;

    const w = 560, h = 200, pad = 30;
    const max = Math.max(...data.map((d) => d.value), 100);
    const pts = data.map((d, i) => {
      const x = pad + (i / Math.max(data.length - 1, 1)) * (w - pad * 2);
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
          ${pts.map((pt) => `<text x="${pt.x}" y="${h - 8}" text-anchor="middle" font-size="11" fill="#94A3B8">${pt.label}</text>`).join('')}
        </svg>
        <div class="chart-tooltip" style="left:${(last.x / w) * 100}%;top:${(last.y / h) * 100}%">${last.label} · ${last.value}%</div>
      </div>`;
  }

  function renderSubjectTable() {
    const el = document.getElementById('subjectProgressTable');
    const tbody = el?.querySelector?.('tbody') || el;
    if (!tbody) return;
    const rows = getSubjects().map((s) => {
      const status = s.progress >= 60 ? 'On Track' : 'Needs Focus';
      const badge = s.progress >= 60 ? 'badge-upcoming' : 'badge-pending';
      return `
        <tr>
          <td>
            <div class="cell-title">
              <div class="cell-icon" style="background:${s.color}22;color:${s.color}"><i data-lucide="${s.icon}"></i></div>
              <div class="title">${s.name}</div>
            </div>
          </td>
          <td>
            <div class="progress-row">
              <div class="progress-bar"><div class="fill" style="width:${s.progress}%;background:${s.color}"></div></div>
              <span class="progress-pct">${s.progress}%</span>
            </div>
          </td>
          <td>${s.completed}/${s.assignments}</td>
          <td><span class="badge ${badge}">${status}</span></td>
        </tr>`;
    }).join('');
    if (el?.tagName === 'TABLE') {
      const thead = el.querySelector('thead');
      el.innerHTML = (thead ? thead.outerHTML : '<thead><tr><th>Subject</th><th>Progress</th><th>Done</th><th>Status</th></tr></thead>') + `<tbody>${rows}</tbody>`;
    } else {
      tbody.innerHTML = rows;
    }
  }

  function renderGoals() {
    const p = getProgress();
    const pct = Math.round((p.hoursStudied / p.weeklyGoalHours) * 100);
    const el = document.getElementById('studyGoals');
    if (el) {
      el.innerHTML = `
        <div class="donut-wrap">
          <div class="donut">${createDonutSVG(Math.min(pct, 100), '#16A34A')}<div class="center-label">${pct}%<small>Goal</small></div></div>
          <div>
            <p style="font-size:13px;margin-bottom:8px"><strong>${p.hoursStudied}</strong> / ${p.weeklyGoalHours} hours this week</p>
            <div class="progress-bar"><div class="fill green" style="width:${Math.min(pct, 100)}%"></div></div>
          </div>
        </div>`;
    }
  }

  function render() {
    renderStats();
    renderChart();
    renderSubjectTable();
    renderGoals();
    const mini = document.getElementById('miniCalendar');
    renderMiniCalendar(mini, calY, calM, getSchedule().map((s) => s.date), (y, m) => {
      calY = y; calM = m;
      renderMiniCalendar(mini, calY, calM, getSchedule().map((s) => s.date), arguments.callee);
    });
    const dl = document.getElementById('upcomingDeadlines');
    if (dl) {
      dl.innerHTML = getAssignments().filter((a) => a.status !== 'completed').slice(0, 4).map((a) => `
        <div class="list-item">
          <span class="dot ${subjectShort(a.subject)}"></span>
          <div class="item-meta"><div class="item-title">${a.title}</div><div class="item-sub">${formatDate(a.dueDate)}</div></div>
        </div>`).join('');
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  document.querySelectorAll('[data-chart]').forEach((btn) => {
    btn.addEventListener('click', () => {
      chartMode = btn.dataset.chart;
      document.querySelectorAll('[data-chart]').forEach((b) => b.classList.toggle('active', b === btn));
      renderChart();
    });
  });

  render();
});

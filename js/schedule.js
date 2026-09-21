/**
 * StudyBuddy — Schedule / Calendar (student + teacher)
 */
document.addEventListener('DOMContentLoaded', () => {
  const isTeacher = document.body.dataset.role === 'teacher';
  const session = initShell(isTeacher ? 'teacher' : 'student');
  if (!session) return;
  wireModalClosers();

  let view = 'calendar';
  let calY = 2025;
  let calM = 8; // September 2025 to match seed

  function eventsForDay(y, m, d) {
    const key = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    return getSchedule().filter((s) => s.date === key);
  }

  function renderFullCalendar() {
    const el = document.getElementById('fullCalendar');
    if (!el) return;
    const first = new Date(calY, calM, 1);
    const startDow = first.getDay();
    const daysInMonth = new Date(calY, calM + 1, 0).getDate();
    const today = new Date();
    const label = first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const monthLabel = document.getElementById('calMonthLabel') || document.getElementById('monthLabel');
    if (monthLabel) monthLabel.textContent = label;

    let html = `<div class="cal-grid cal-full">
      ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => `<div class="cal-dow">${d}</div>`).join('')}`;

    for (let i = 0; i < startDow; i++) html += `<div class="cal-day other"></div>`;
    for (let d = 1; d <= daysInMonth; d++) {
      const isToday = today.getFullYear() === calY && today.getMonth() === calM && today.getDate() === d;
      const events = eventsForDay(calY, calM, d);
      html += `<div class="cal-day${isToday ? ' today' : ''}">
        <span class="day-num">${d}</span>
        ${events.slice(0, 3).map((ev) => `
          <div class="cal-event-chip ${subjectShort(ev.subject)} ${ev.type === 'deadline' ? 'task' : ''}">
            <span class="dot ${subjectShort(ev.subject)}" style="width:6px;height:6px"></span>
            ${ev.title} ${ev.startTime ? formatTime(ev.startTime) : ''}
          </div>`).join('')}
        ${events.length > 3 ? `<div style="font-size:10px;color:var(--text-muted)">+${events.length - 3} more</div>` : ''}
      </div>`;
    }
    html += '</div>';
    el.innerHTML = html;
  }

  function renderList() {
    const el = document.getElementById('scheduleList');
    if (!el) return;
    const list = [...getSchedule()].sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
    el.innerHTML = list.map((s) => `
      <div class="list-item">
        <span class="dot ${subjectShort(s.subject)}"></span>
        <div class="item-meta">
          <div class="item-title">${s.title}</div>
          <div class="item-sub">${formatDate(s.date)} · ${formatTime(s.startTime)} – ${formatTime(s.endTime)}${s.room ? ' · ' + s.room : ''}</div>
        </div>
        <span class="badge badge-info">${s.type}</span>
      </div>`).join('');
  }

  function renderMini() {
    const mini = document.getElementById('miniCalendar');
    const dates = getSchedule().map((s) => s.date);
    renderMiniCalendar(mini, calY, calM, dates, (y, m) => {
      calY = y; calM = m;
      if (calM < 0) { calY--; calM = 11; }
      if (calM > 11) { calY++; calM = 0; }
      render();
    });
  }

  function renderUpcoming() {
    const el = document.getElementById('upcomingEvents');
    if (!el) return;
    el.innerHTML = getSchedule().slice(0, 5).map((s) => `
      <div class="list-item">
        <span class="dot ${subjectShort(s.subject)}"></span>
        <div class="item-meta">
          <div class="item-title">${s.title}</div>
          <div class="item-sub">${formatDate(s.date)} · ${formatTime(s.startTime)}</div>
        </div>
      </div>`).join('');
  }

  function render() {
    const calView = document.getElementById('calendarView');
    const listView = document.getElementById('listView');
    if (view === 'calendar') {
      if (calView) calView.style.display = '';
      if (listView) listView.style.display = 'none';
      renderFullCalendar();
    } else {
      if (calView) calView.style.display = 'none';
      if (listView) listView.style.display = '';
      renderList();
    }
    renderMini();
    renderUpcoming();
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  document.querySelectorAll('[data-view]').forEach((btn) => {
    btn.addEventListener('click', () => {
      view = btn.dataset.view;
      document.querySelectorAll('[data-view]').forEach((b) => b.classList.toggle('active', b.dataset.view === view));
      render();
    });
  });

  document.getElementById('calPrev')?.addEventListener('click', () => {
    calM--;
    if (calM < 0) { calY--; calM = 11; }
    render();
  });
  document.getElementById('calNext')?.addEventListener('click', () => {
    calM++;
    if (calM > 11) { calY++; calM = 0; }
    render();
  });

  document.getElementById('addScheduleBtn')?.addEventListener('click', () => openModal('addScheduleModal'));

  const subjSelect = document.getElementById('schSubject');
  if (subjSelect && subjSelect.options.length <= 1) {
    getSubjects().forEach((s) => {
      const o = document.createElement('option');
      o.value = s.id;
      o.textContent = s.name;
      subjSelect.appendChild(o);
    });
  }

  document.getElementById('addScheduleForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('schTitle')?.value.trim();
    const subjectId = document.getElementById('schSubject')?.value;
    const subject = getSubjects().find((s) => s.id === subjectId)?.name || title;
    const date = document.getElementById('schDate')?.value;
    const startTime = document.getElementById('schStart')?.value || '09:00';
    const endTime = document.getElementById('schEnd')?.value || '10:00';
    const room = document.getElementById('schRoom')?.value.trim() || '';
    if (!title || !date) { showToast('Title and date required', 'error'); return; }
    addSchedule({ title, subjectId, subject, date, startTime, endTime, room, type: 'class' });
    closeModal('addScheduleModal');
    e.target.reset();
    showToast('Schedule entry added');
    render();
  });

  document.getElementById('syncCalendarBtn')?.addEventListener('click', (e) => mockGoogleCalendarSync(e.currentTarget));
  document.getElementById('openCalendarBtn')?.addEventListener('click', (e) => { e.preventDefault(); openInGoogleCalendar(); });

  render();
});

/**
 * StudyBuddy — Schedule / Calendar (student + teacher)
 */
document.addEventListener('DOMContentLoaded', async () => {
  const isTeacher = document.body.dataset.role === 'teacher';
  const session = initShell(isTeacher ? 'teacher' : 'student');
  if (!session) return;
  try {
    await sbPrefetchState([
      SB_KEYS.ASSIGNMENTS,
      SB_KEYS.SCHEDULE,
      SB_KEYS.CLASSES,
      ...(!isTeacher ? [SB_KEYS.SUBJECTS, SB_KEYS.TASKS] : []),
    ]);
  } catch (error) {
    console.error('Could not preload schedule data:', error);
  }
  wireModalClosers();

  const pageParams = new URLSearchParams(window.location.search);
  let view = pageParams.get('view') === 'list' ? 'list' : 'calendar';
  const now = new Date();
  let calY = now.getFullYear();
  let calM = now.getMonth();
  let selectedScheduleDate = null;
  let editingScheduleId = null;
  let reopenDayAfterScheduleForm = false;
  const requestedDate = pageParams.get('date');
  const requestedDateMatch = requestedDate?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const requestedDateParts = requestedDateMatch ? requestedDateMatch.slice(1).map(Number) : null;
  const requestedDateObject = requestedDateParts
    ? new Date(requestedDateParts[0], requestedDateParts[1] - 1, requestedDateParts[2])
    : null;
  const validRequestedDate = Boolean(requestedDateParts && requestedDateObject
    && requestedDateObject.getFullYear() === requestedDateParts[0]
    && requestedDateObject.getMonth() === requestedDateParts[1] - 1
    && requestedDateObject.getDate() === requestedDateParts[2]);
  if (validRequestedDate) {
    calY = requestedDateObject.getFullYear();
    calM = requestedDateObject.getMonth();
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[char]));
  }

  function eventsForDay(y, m, d, schedule) {
    const key = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    return schedule.filter((s) => s.date === key);
  }

  function personalEvents() {
    const scheduleEntries = getSchedule().filter((entry) =>
      entry.source !== 'google-calendar' && entry.source !== 'classroom'
    );
    const scheduleIds = new Set(scheduleEntries.map((entry) => String(entry.id)));
    return [
      ...scheduleEntries,
      ...(window.SB_GOOGLE_EVENTS || []).filter((entry) =>
        !scheduleIds.has(String(entry.studyBuddyScheduleId || ''))
      ),
    ];
  }

  function scheduleSubjects() {
    return isTeacher ? [] : getSubjects();
  }

  function findPersonalEvent(id) {
    return personalEvents().find((entry) => entry.id === id);
  }

  function calendarDeadlineEntries() {
    const entries = getAssignments()
      .filter((assignment) => assignment.dueDate
        && (assignment.source === 'classroom' || assignment.status !== 'completed'))
      .map((assignment) => ({
        ...assignment,
        date: assignment.dueDate,
        startTime: assignment.dueTime || '',
        endTime: '',
        type: 'deadline',
        calendarSource: 'assignment',
      }));
    if (!isTeacher) {
      entries.push(...getTasks()
        .filter((task) => task.dueDate && task.status !== 'completed')
        .map((task) => ({
          ...task,
          date: task.dueDate,
          startTime: task.dueTime || '',
          endTime: '',
          type: 'deadline',
          calendarSource: 'task',
        })));
    }
    return entries;
  }

  function calendarEntries() {
    return [
      ...personalEvents().map((entry) => ({
        ...entry,
        calendarSource: entry.calendarSource || (entry.source === 'google-calendar' ? 'google' : 'schedule'),
      })),
      ...calendarDeadlineEntries(),
    ];
  }

  function googleCalendarSyncEntries() {
    const entries = getSchedule().filter((entry) =>
      entry.source !== 'google-calendar' && entry.source !== 'classroom'
    );
    if (isTeacher) return entries;

    entries.push(...calendarDeadlineEntries()
      .filter((entry) => entry.status !== 'completed')
      .map((entry) => ({
        id: entry.id,
        title: entry.title,
        subject: entry.subject || '',
        date: entry.date,
        startTime: entry.dueTime || entry.startTime || '',
        endTime: '',
        room: '',
      })));
    return entries;
  }

  function taskDeadlineStatus(task) {
    if (task.status === 'overdue' || task.dueDate < localDateStr()) return 'overdue';
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    if (task.dueDate === localDateStr(now) && task.dueTime && task.dueTime < currentTime) return 'overdue';
    return task.status || 'pending';
  }

  function calendarEntryStatus(entry) {
    if (entry.calendarSource === 'task') return taskDeadlineStatus(entry);
    if (entry.calendarSource === 'assignment' && entry.status === 'completed') return 'completed';
    if (entry.calendarSource === 'assignment' && (entry.status === 'overdue' || entry.date < localDateStr())) return 'overdue';
    return entry.type || 'event';
  }

  function filteredCalendarEntries() {
    const classFilter = document.getElementById('calClassFilter')?.value || '';
    const typeFilter = document.getElementById('calTypeFilter')?.value || '';
    return calendarEntries()
      .filter((entry) => {
        const matchesClass = !classFilter || [entry.subject, entry.subjectId, entry.classId]
          .some((value) => String(value || '') === classFilter);
        const matchesType = !typeFilter || String(entry.type || 'event').toLowerCase() === typeFilter;
        return matchesClass && matchesType;
      })
      .sort((a, b) => `${a.date}${a.startTime || ''}`.localeCompare(`${b.date}${b.startTime || ''}`));
  }

  function renderClassFilterOptions() {
    const select = document.getElementById('calClassFilter');
    if (!select) return;
    const selected = select.value;
    const classes = new Set([
      ...Array.from(select.options).slice(1).map((option) => option.value),
      ...getClasses().map((item) => item.name),
      ...scheduleSubjects().map((item) => item.name),
      ...getSchedule().map((item) => item.subject),
      ...getAssignments().map((item) => item.subject),
      ...(!isTeacher ? getTasks().map((item) => item.subject) : []),
    ].filter(Boolean).map(String));
    select.innerHTML = `<option value="">All Classes</option>${[...classes].sort((a, b) => a.localeCompare(b))
      .map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join('')}`;
    select.value = classes.has(selected) ? selected : '';
  }

  function scheduleDayAttributes(date) {
    if (!document.getElementById('dayScheduleModal')) return '';
    const [year, month, day] = date.split('-').map(Number);
    const label = new Date(year, month - 1, day).toLocaleDateString();
    return `data-schedule-date="${escapeHtml(date)}" role="button" tabindex="0" aria-label="View events for ${escapeHtml(label)}" aria-haspopup="dialog" aria-controls="dayScheduleModal"`;
  }

  function wireDayScheduleLinks(container) {
    container.querySelectorAll('[data-schedule-date]').forEach((item) => {
      item.addEventListener('click', () => openDaySchedule(item.dataset.scheduleDate));
      if (item.tagName !== 'BUTTON') {
        item.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openDaySchedule(item.dataset.scheduleDate);
          }
        });
      }
    });
  }

  function scheduleActions(entry, context, reopenDay) {
    if (entry.readOnly) return '';
    const id = escapeHtml(entry.id);
    const menuId = `schedule-menu-${context}-${String(entry.id).replace(/[^A-Za-z0-9_-]/g, '')}`;
    return `
      <div class="action-menu-wrap schedule-actions">
        <button type="button" class="action-menu-btn" data-schedule-menu="${menuId}" aria-label="Actions for ${escapeHtml(entry.title)}"><i data-lucide="more-vertical"></i></button>
        <div class="action-dropdown" id="${menuId}">
          <button type="button" data-edit-schedule="${id}" data-reopen-day="${reopenDay}"><i data-lucide="pencil"></i> Edit</button>
          <button type="button" data-delete-schedule="${id}" data-reopen-day="${reopenDay}" class="danger"><i data-lucide="trash-2"></i> Delete</button>
        </div>
      </div>`;
  }

  function wireScheduleActions(container) {
    container.querySelectorAll('[data-schedule-menu]').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        document.querySelectorAll('.action-dropdown').forEach((menu) => menu.classList.remove('open'));
        document.getElementById(button.dataset.scheduleMenu)?.classList.toggle('open');
      });
    });
    container.querySelectorAll('[data-edit-schedule]').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        const entry = findPersonalEvent(button.dataset.editSchedule);
        if (!entry) {
          showToast('This schedule event is no longer available', 'error');
          return;
        }
        openScheduleForm(entry, entry.date, button.dataset.reopenDay === 'true');
      });
    });
    container.querySelectorAll('[data-delete-schedule]').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        const entry = findPersonalEvent(button.dataset.deleteSchedule);
        if (!entry) {
          showToast('This schedule event is no longer available', 'error');
          return;
        }
        const removeScheduleEntry = () => {
          const current = findPersonalEvent(entry.id);
          if (!current) {
            showToast('This schedule event is no longer available', 'error');
            render();
            return;
          }
          const reopenDay = button.dataset.reopenDay === 'true';
          const finish = () => {
            showToast('Schedule event deleted', 'warning');
            render();
            if (reopenDay) openDaySchedule(current.date);
          };
          if (current.source === 'google-calendar') {
            const body = new URLSearchParams({ id: current.googleEventId });
            fetch(`${SB_API_BASE}google.php?action=calendar-delete`, {
              method: 'POST',
              credentials: 'same-origin',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.content || '',
              },
              body,
            }).then(async (response) => {
              const result = await response.json().catch(() => ({}));
              if (!response.ok || !result.ok) throw new Error(result.message || 'Could not delete that Google Calendar event.');
              if (typeof window.refreshGoogleCalendar === 'function') await window.refreshGoogleCalendar();
              finish();
            }).catch((error) => showToast(error.message || 'Could not delete that event.', 'error'));
            return;
          }
          deleteSchedule(current.id);
          finish();
        };
        if (isTeacher) {
          if (window.confirm(`Delete "${entry.title}" from your schedule?`)) removeScheduleEntry();
        } else {
          showDeleteConfirmation('schedule event', entry.title || 'Untitled event', removeScheduleEntry);
        }
      });
    });
  }

  function renderFullCalendar() {
    const el = document.getElementById('fullCalendar') || document.getElementById('calGrid');
    if (!el) return;
    const first = new Date(calY, calM, 1);
    const startDow = first.getDay();
    const daysInMonth = new Date(calY, calM + 1, 0).getDate();
    const previousMonthDays = new Date(calY, calM, 0).getDate();
    const totalCells = Math.ceil((startDow + daysInMonth) / 7) * 7;
    const today = new Date();
    const label = first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const monthLabel = document.getElementById('fullCalMonth')
      || document.getElementById('calMonthLabel')
      || document.getElementById('monthLabel');
    if (monthLabel) monthLabel.textContent = label;

    const entries = filteredCalendarEntries();
    const calendarDeadlines = calendarDeadlineEntries();
    let html = `${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => `<div class="cal-dow">${d}</div>`).join('')}`;

    for (let i = 0; i < totalCells; i++) {
      const day = i - startDow + 1;
      if (day < 1) {
        html += `<div class="cal-day other"><span class="day-num">${previousMonthDays + day}</span></div>`;
        continue;
      }
      if (day > daysInMonth) {
        html += `<div class="cal-day other"><span class="day-num">${day - daysInMonth}</span></div>`;
        continue;
      }

      const isToday = today.getFullYear() === calY && today.getMonth() === calM && today.getDate() === day;
      const dateKey = `${calY}-${String(calM + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayEntries = eventsForDay(calY, calM, day, entries);
      const deadlines = isTeacher
        ? dayEntries.filter((entry) => entry.calendarSource === 'assignment')
        : calendarDeadlines.filter((entry) => entry.date === dateKey);
      const otherEvents = dayEntries
        .filter((entry) => entry.calendarSource !== 'assignment' && entry.calendarSource !== 'task')
        .sort((a, b) => String(a.startTime || '').localeCompare(String(b.startTime || '')));
      const otherEventLimit = Math.max(3 - deadlines.length, otherEvents.length ? 1 : 0);
      const events = [
        ...deadlines,
        ...otherEvents.slice(0, otherEventLimit),
      ];
      const dayButtonAttributes = scheduleDayAttributes(dateKey);
      html += `<div class="cal-day${isToday ? ' today' : ''}" ${dayButtonAttributes}>
        <span class="day-num">${day}</span>
        ${events.map((ev) => `
          <div class="cal-event-chip ${escapeHtml(subjectShort(ev.subject))} ${ev.type === 'deadline' ? 'task' : ''}" title="${escapeHtml(`${ev.calendarSource === 'assignment' ? 'Assignment' : ev.calendarSource === 'task' ? 'Task' : 'Event'} due: ${ev.title || ''}`)}">
            <span class="dot ${escapeHtml(subjectShort(ev.subject))}" style="width:6px;height:6px"></span>
            <span class="cal-event-label">${ev.calendarSource === 'assignment' ? (ev.source === 'classroom' ? 'GC: ' : 'Asg: ') : ev.calendarSource === 'task' ? 'Task: ' : ''}${escapeHtml(ev.title)} ${ev.startTime ? escapeHtml(formatTime(ev.startTime)) : ''}</span>
          </div>`).join('')}
        ${deadlines.length + otherEvents.length > events.length ? `<div style="font-size:10px;color:var(--text-muted)">+${deadlines.length + otherEvents.length - events.length} more</div>` : ''}
      </div>`;
    }
    el.innerHTML = html;
    wireDayScheduleLinks(el);
  }

  function openDaySchedule(date) {
    selectedScheduleDate = date;
    const [year, month, day] = date.split('-').map(Number);
    const dateLabel = new Date(year, month - 1, day).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
    document.getElementById('dayScheduleTitle').textContent = dateLabel;

    const events = personalEvents()
      .filter((entry) => entry.date === date)
      .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
    const scheduleItems = events.map((entry) => `
      <article class="day-schedule-item">
        <div class="day-schedule-copy">
          <div class="day-schedule-heading">
            <h4>${escapeHtml(entry.title)}</h4>
            <span class="badge badge-info">${escapeHtml(entry.type || 'event')}</span>
          </div>
          <div class="day-schedule-meta">${escapeHtml(entry.subject || 'General')} · ${entry.startTime ? escapeHtml(formatTime(entry.startTime)) : entry.allDay ? 'All day' : 'Time not set'}${entry.endTime ? ` – ${escapeHtml(formatTime(entry.endTime))}` : ''}</div>
          ${entry.room ? `<div class="day-schedule-location">${escapeHtml(entry.room)}</div>` : ''}
        </div>
        ${scheduleActions(entry, 'day', true)}
      </article>`).join('');
    const assignments = getAssignments()
      .filter((assignment) => assignment.dueDate === date
        && (assignment.source === 'classroom' || assignment.status !== 'completed'))
      .sort((a, b) => String(a.title || '').localeCompare(String(b.title || '')));
    const assignmentItems = assignments.map((assignment) => {
      const status = assignment.status === 'completed' ? 'completed'
        : assignment.status === 'overdue' || assignment.dueDate < localDateStr()
        ? 'overdue'
        : assignment.status === 'pending' ? 'pending' : 'upcoming';
      return `
        <article class="day-schedule-item">
          <div class="day-schedule-copy">
            <div class="day-schedule-heading">
              <h4>${isTeacher
                ? escapeHtml(assignment.title || 'Untitled assignment')
                : `<a href="assignments.php?assignment=${encodeURIComponent(assignment.id)}">${assignment.source === 'classroom' ? 'Classroom: ' : ''}${escapeHtml(assignment.title || 'Untitled assignment')}</a>`}</h4>
              <span class="badge ${escapeHtml(statusClass(status))}">${escapeHtml(statusLabel(status))}</span>
            </div>
            <div class="day-schedule-meta">${escapeHtml(assignment.subject || 'General')} · Due ${escapeHtml(formatDate(assignment.dueDate))}</div>
          </div>
        </article>`;
    }).join('');
    const tasks = isTeacher ? [] : getTasks()
      .filter((task) => task.dueDate === date && task.status !== 'completed')
      .sort((a, b) => `${a.dueTime || ''}${a.title || ''}`.localeCompare(`${b.dueTime || ''}${b.title || ''}`));
    const taskItems = tasks.map((task) => {
      const status = taskDeadlineStatus(task);
      return `
        <article class="day-schedule-item">
          <div class="day-schedule-copy">
            <div class="day-schedule-heading">
              <h4><a href="todo.php">${escapeHtml(task.title || 'Untitled task')}</a></h4>
              <span class="badge ${escapeHtml(statusClass(status))}">${escapeHtml(statusLabel(status))}</span>
            </div>
            <div class="day-schedule-meta">${escapeHtml(task.subject || 'General')} · Due ${escapeHtml(formatDate(task.dueDate))}${task.dueTime ? ` · ${escapeHtml(formatTime(task.dueTime))}` : ''}</div>
          </div>
        </article>`;
    }).join('');
    const eventList = document.getElementById('dayScheduleEvents');
    eventList.innerHTML = [
      scheduleItems ? `<section class="calendar-day-section"><h4>Schedule</h4>${scheduleItems}</section>` : '',
      assignmentItems ? `<section class="calendar-day-section"><h4>Assignment deadlines</h4>${assignmentItems}${isTeacher ? '<a class="view-all" href="assignments.php">Manage assignments</a>' : ''}</section>` : '',
      taskItems ? `<section class="calendar-day-section"><h4>Task deadlines</h4>${taskItems}<a class="view-all" href="todo.php">View tasks</a></section>` : '',
    ].join('') || (isTeacher ? '<p class="empty-state">Nothing is scheduled for this day.</p>' : '<p class="empty-state">No events, tasks, or assignments scheduled for this day.</p>');

    wireScheduleActions(eventList);
    if (typeof lucide !== 'undefined') lucide.createIcons();
    openModal('dayScheduleModal');
  }

  function openScheduleForm(event = null, date = '', returnToDayDetails = false) {
    editingScheduleId = event?.id || null;
    reopenDayAfterScheduleForm = returnToDayDetails;
    const subject = scheduleSubjects().find((item) => item.id === event?.subjectId || item.name === event?.subject);
    document.getElementById('schTitle').value = event?.title || '';
    document.getElementById('schSubject').value = subject?.id || '';
    document.getElementById('schDate').value = event?.date || date || localDateStr();
    document.getElementById('schType').value = event?.type || 'class';
    document.getElementById('schStartTime').value = event?.startTime || '09:00';
    document.getElementById('schEndTime').value = event?.endTime || '';
    document.getElementById('schRoom').value = event?.room || '';
    document.getElementById('addScheduleTitle').textContent = editingScheduleId ? 'Edit Schedule Event' : 'Add Schedule Event';
    document.querySelector('#addScheduleForm [type="submit"]').textContent = editingScheduleId ? 'Save Changes' : 'Add Event';
    if (returnToDayDetails) closeModal('dayScheduleModal');
    openModal('addScheduleModal');
  }

  function renderList() {
    const el = document.getElementById('scheduleList');
    if (!el) return;
    const list = filteredCalendarEntries();
    el.innerHTML = list.length ? list.map((s) => `
      <div class="list-item">
        <span class="dot ${escapeHtml(subjectShort(s.subject))}"></span>
        <div class="item-meta">
          <button type="button" class="schedule-day-link" data-schedule-date="${escapeHtml(s.date)}">
            <span class="item-title">${escapeHtml(s.title)}</span>
            <span class="item-sub">${escapeHtml(formatDate(s.date))}${s.startTime ? ` · ${escapeHtml(formatTime(s.startTime))}${s.endTime ? ` – ${escapeHtml(formatTime(s.endTime))}` : ''}` : s.allDay ? ' · All day' : ' · Due date'}${s.room ? ` · ${escapeHtml(s.room)}` : ''}</span>
          </button>
        </div>
        <span class="badge ${escapeHtml(statusClass(calendarEntryStatus(s)))}">${escapeHtml(statusLabel(calendarEntryStatus(s)))}</span>
        ${s.calendarSource === 'assignment' ? '<a class="view-all" href="assignments.php">Assignments</a>' : s.calendarSource === 'task' ? '<a class="view-all" href="todo.php">Tasks</a>' : scheduleActions(s, 'list', false)}
      </div>`).join('') : '<p class="empty-state">No calendar items match these filters.</p>';
    wireDayScheduleLinks(el);
    wireScheduleActions(el);
  }

  function renderMini() {
    const mini = document.getElementById('miniCalendar');
    if (!mini) return;
    const dates = calendarEntries().map((entry) => entry.date);
    renderMiniCalendar(mini, calY, calM, dates, (y, m) => {
      calY = y; calM = m;
      if (calM < 0) { calY--; calM = 11; }
      if (calM > 11) { calY++; calM = 0; }
      render();
      window.refreshGoogleCalendar?.().catch((error) => showToast(error.message || 'Could not load Google Calendar.', 'error'));
    }, openDaySchedule);
  }

  function renderUpcoming() {
    const el = document.getElementById('scheduleEventsList') || document.getElementById('upcomingEvents');
    if (!el) return;
    const upcoming = calendarEntries()
      .filter((s) => s.date >= localDateStr()
        && !(s.calendarSource === 'assignment' && s.status === 'completed'))
      .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))
      .slice(0, 5);
    el.innerHTML = upcoming.length ? upcoming.map((s) => `
      <div class="list-item">
        <span class="dot ${escapeHtml(subjectShort(s.subject))}"></span>
        <div class="item-meta">
          <button type="button" class="schedule-day-link" data-schedule-date="${escapeHtml(s.date)}">
            <span class="item-title">${escapeHtml(s.title)}</span>
            <span class="item-sub">${escapeHtml(formatDate(s.date))}${s.startTime ? ` · ${escapeHtml(formatTime(s.startTime))}` : s.allDay ? ' · All day' : ' · Due date'}</span>
          </button>
        </div>
        ${s.calendarSource === 'assignment' ? '<a class="view-all" href="assignments.php">Assignments</a>' : s.calendarSource === 'task' ? '<a class="view-all" href="todo.php">Tasks</a>' : scheduleActions(s, 'upcoming', false)}
      </div>`).join('') : '<p class="empty-state">No upcoming events.</p>';
    wireDayScheduleLinks(el);
    wireScheduleActions(el);
  }

  function renderTodaySchedule() {
    const el = document.getElementById('todayScheduleAside');
    if (!el) return;
    const today = localDateStr();
    const items = personalEvents()
      .filter((entry) => entry.date === today)
      .sort((a, b) => String(a.startTime || '').localeCompare(String(b.startTime || '')));
    el.innerHTML = items.length ? items.map((entry) => `
      <div class="schedule-item" ${scheduleDayAttributes(entry.date)}>
        <span class="time">${entry.startTime ? escapeHtml(formatTime(entry.startTime)) : entry.allDay ? 'All day' : 'Time not set'}${entry.endTime ? ` – ${escapeHtml(formatTime(entry.endTime))}` : ''}</span>
        <div class="info">
          <div class="subj">${escapeHtml(entry.title || entry.subject || 'Schedule event')}</div>
          <div class="room">${escapeHtml(entry.room || entry.subject || 'No location set')}</div>
        </div>
        <span class="badge ${escapeHtml(statusClass(entry.type || 'class'))}">${escapeHtml(statusLabel(entry.type || 'class'))}</span>
      </div>`).join('') : '<p class="empty-state">No classes or events scheduled for today.</p>';
    wireDayScheduleLinks(el);
  }

  function render() {
    document.querySelectorAll('[data-view]').forEach((button) => {
      button.classList.toggle('active', button.dataset.view === view);
      button.setAttribute('aria-selected', button.dataset.view === view ? 'true' : 'false');
    });
    renderClassFilterOptions();
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
    renderTodaySchedule();
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  document.querySelectorAll('[data-view]').forEach((btn) => {
    btn.addEventListener('click', () => {
      view = btn.dataset.view;
      document.querySelectorAll('[data-view]').forEach((b) => b.classList.toggle('active', b.dataset.view === view));
      render();
    });
  });
  document.getElementById('calClassFilter')?.addEventListener('change', render);
  document.getElementById('calTypeFilter')?.addEventListener('change', render);

  const prevButton = document.getElementById('fullCalPrev')
    || document.getElementById('calPrevMonth')
    || document.getElementById('calPrev');
  prevButton?.addEventListener('click', () => {
    calM--;
    if (calM < 0) { calY--; calM = 11; }
    render();
    window.refreshGoogleCalendar?.().catch((error) => showToast(error.message || 'Could not load Google Calendar.', 'error'));
  });
  const nextButton = document.getElementById('fullCalNext')
    || document.getElementById('calNextMonth')
    || document.getElementById('calNext');
  nextButton?.addEventListener('click', () => {
    calM++;
    if (calM > 11) { calY++; calM = 0; }
    render();
    window.refreshGoogleCalendar?.().catch((error) => showToast(error.message || 'Could not load Google Calendar.', 'error'));
  });
  const todayButton = document.getElementById('fullCalToday')
    || document.getElementById('calTodayBtn')
    || document.getElementById('calToday');
  todayButton?.addEventListener('click', () => {
    const currentDate = new Date();
    calY = currentDate.getFullYear();
    calM = currentDate.getMonth();
    render();
    window.refreshGoogleCalendar?.().catch((error) => showToast(error.message || 'Could not load Google Calendar.', 'error'));
  });

  document.getElementById('addScheduleBtn')?.addEventListener('click', () => openScheduleForm());
  document.getElementById('addDayScheduleBtn')?.addEventListener('click', () => {
    if (selectedScheduleDate) openScheduleForm(null, selectedScheduleDate, true);
  });
  document.querySelectorAll('[data-close-modal="addScheduleModal"]').forEach((button) => {
    button.addEventListener('click', () => {
      if (reopenDayAfterScheduleForm && selectedScheduleDate) {
        reopenDayAfterScheduleForm = false;
        openDaySchedule(selectedScheduleDate);
      }
    });
  });

  const subjSelect = document.getElementById('schSubject');
  if (subjSelect) {
    const subjects = scheduleSubjects();
    const selected = subjects.some((subject) => subject.id === subjSelect.value) ? subjSelect.value : '';
    subjSelect.innerHTML = '<option value="">General / no subject</option>' + subjects.map((subject) =>
      `<option value="${escapeHtml(subject.id)}">${escapeHtml(subject.name)}</option>`
    ).join('');
    subjSelect.value = selected;
  }

  document.getElementById('addScheduleForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('schTitle')?.value.trim();
    const subjectId = document.getElementById('schSubject')?.value;
    const existing = editingScheduleId ? findPersonalEvent(editingScheduleId) : null;
    const subject = scheduleSubjects().find((s) => s.id === subjectId)?.name || existing?.subject || title;
    const date = document.getElementById('schDate')?.value;
    const startTime = document.getElementById('schStartTime')?.value || '09:00';
    const endTime = document.getElementById('schEndTime')?.value || '10:00';
    const type = document.getElementById('schType')?.value || 'class';
    const room = document.getElementById('schRoom')?.value.trim() || '';
    if (!title || !date) { showToast('Title and date required', 'error'); return; }
    if (endTime <= startTime) { showToast('End time must be later than start time.', 'error'); return; }
    const schedule = { title, subjectId, subject, date, startTime, endTime, room, type };
    const saveOnGoogle = !!existing && existing.source === 'google-calendar';
    try {
      if (saveOnGoogle) {
        const body = new URLSearchParams({
          title,
          subject,
          date,
          startTime,
          endTime,
          room,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Manila',
        });
        if (existing?.googleEventId) body.set('googleEventId', existing.googleEventId);
        const response = await fetch(`${SB_API_BASE}google.php?action=calendar-save`, {
          method: 'POST',
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.content || '',
          },
          body,
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.ok) throw new Error(result.message || 'Could not save that event on Google Calendar.');
        if (typeof window.refreshGoogleCalendar === 'function') await window.refreshGoogleCalendar();
      } else if (editingScheduleId) {
        updateSchedule(editingScheduleId, schedule);
      } else {
        addSchedule(schedule);
      }
    } catch (error) {
      showToast(error.message || 'Could not save that event.', 'error');
      return;
    }
    const dayToReopen = reopenDayAfterScheduleForm ? date : null;
    closeModal('addScheduleModal');
    e.target.reset();
    editingScheduleId = null;
    reopenDayAfterScheduleForm = false;
    showToast(saveOnGoogle ? 'Saved to Google Calendar' : (dayToReopen ? 'Schedule event saved' : 'Schedule entry added'));
    render();
    if (dayToReopen) openDaySchedule(dayToReopen);
  });

  const runClassroomSync = async (btn) => {
    const result = await syncGoogleClassroom(btn);
    if (result?.ok) setTimeout(() => location.reload(), 400);
  };
  document.querySelectorAll('#syncClassroomBtn, #connectClassroomBtn').forEach((btn) => {
    btn.addEventListener('click', (e) => runClassroomSync(e.currentTarget));
  });
  document.querySelectorAll('#syncCalendarBtn, #syncGoogleCalendarBtn, #syncGoogleCalBtn, #connectGoogleCalBtn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      syncScheduleToGoogleCalendar(googleCalendarSyncEntries(), e.currentTarget);
    });
  });
  document.getElementById('importGoogleCalBtn')?.addEventListener('click', (event) => {
    syncGoogleCalendar(event.currentTarget);
  });
  let googleCalendarRefreshRequest = null;
  window.refreshGoogleCalendar = async () => {
    if (googleCalendarRefreshRequest) return googleCalendarRefreshRequest;
    googleCalendarRefreshRequest = (async () => {
      const status = window.SB_GOOGLE;
      if (!googleCalendarSyncReady(status)) {
        window.SB_GOOGLE_EVENTS = [];
        render();
        return [];
      }
      const { start, end } = googleCalendarMonthRange(calY, calM);
      const events = await fetchGoogleCalendarEvents(start, end);
      render();
      return events;
    })();
    try {
      return await googleCalendarRefreshRequest;
    } finally {
      googleCalendarRefreshRequest = null;
    }
  };
  document.querySelectorAll('#openCalendarBtn, #openGoogleCalendarBtn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openInGoogleCalendar();
    });
  });
  document.querySelectorAll('#openClassroomBtn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openInGoogleClassroom();
    });
  });

  render();
  sbWhenReady(render);
  const openRequestedDate = () => {
    if (validRequestedDate) openDaySchedule(requestedDate);
  };
  if (window.SB_PENDING_SCHEDULE_SYNC) {
    window.SB_PENDING_SCHEDULE_SYNC = false;
    syncScheduleToGoogleCalendar(googleCalendarSyncEntries(), document.getElementById('syncGoogleCalBtn'));
    openRequestedDate();
  } else if (window.SB_PENDING_CALENDAR_IMPORT) {
    window.SB_PENDING_CALENDAR_IMPORT = false;
    syncGoogleCalendar(document.getElementById('importGoogleCalBtn')).finally(openRequestedDate);
  } else if (googleCalendarSyncReady(window.SB_GOOGLE)) {
    window.refreshGoogleCalendar()
      .then(openRequestedDate)
      .catch((error) => {
        showToast(error.message || 'Could not load Google Calendar.', 'error');
        openRequestedDate();
      });
  } else {
    openRequestedDate();
  }
});

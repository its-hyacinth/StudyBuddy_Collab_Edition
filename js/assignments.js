/**
 * StudyBuddy — Assignments (student + teacher)
 */
document.addEventListener('DOMContentLoaded', () => {
  const isTeacher = document.body.dataset.role === 'teacher';
  const session = initShell(isTeacher ? 'teacher' : 'student');
  if (!session) return;
  wireModalClosers();

  let filter = 'all';
  let search = '';
  let classFilter = '';
  let sortBy = 'due-asc';
  let page = 1;
  let editingAsgId = null;  // teacher: assignment being edited (null = creating)
  let currentAsgId = null;  // teacher: assignment open in the details popup
  const perPage = isTeacher ? 8 : 15;

  function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  // First existing element's value from a list of possible IDs
  function val(...ids) {
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) return el.value;
    }
    return undefined;
  }

  // ---- Teacher: due time helpers (student side never uses these) ----
  // "23:59" -> "11:59 PM"
  function formatTimeOfDay(t) {
    if (!t || !/^\d{1,2}:\d{2}$/.test(t)) return '';
    const [h, m] = t.split(':').map(Number);
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
  }

  // Sort key: date, plus time for teacher assignments that have one
  function dueKey(a, fallback) {
    if (!a.dueDate) return fallback;
    return isTeacher && a.dueTime ? `${a.dueDate}T${a.dueTime}` : a.dueDate;
  }

  // Past due? Date-only on the student side; date + time for teacher assignments
  function isPastDue(a) {
    if (!a.dueDate) return false;
    const today = localDateStr();
    if (a.dueDate < today) return true;
    if (isTeacher && a.dueTime && a.dueDate === today) {
      const n = new Date();
      const nowTime = `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`;
      return a.dueTime < nowTime;
    }
    return false;
  }

  // Same formula as My Classes / Dashboard: Classroom students + students you added
  function enrolledCount(cls, students) {
    return (Number(cls.students) || 0) + students.filter((s) => s.classId === cls.id).length;
  }

  function classOf(a, classes) {
    return classes.find((c) => c.id === a.classId || c.id === a.subjectId)
      || classes.find((c) => c.name === a.subject);
  }

  function displayStatus(assignment) {
    if (assignment.status === 'completed') return 'completed';
    if (assignment.status === 'overdue' || isPastDue(assignment)) return 'overdue';
    return assignment.status === 'pending' ? 'pending' : 'upcoming';
  }

  function filtered() {
    let list = getAssignments().map((assignment) => ({ ...assignment, displayStatus: displayStatus(assignment) }));
    if (filter === 'upcoming') list = list.filter((a) => a.displayStatus === 'upcoming' || a.displayStatus === 'pending');
    else if (filter !== 'all') list = list.filter((a) => a.displayStatus === filter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((a) => String(a.title || '').toLowerCase().includes(q) || String(a.subject || '').toLowerCase().includes(q));
    }
    if (classFilter) {
      if (isTeacher) {
        const cls = getClasses().find((c) => c.id === classFilter);
        list = list.filter((a) => a.classId === classFilter || a.subjectId === classFilter || (cls && a.subject === cls.name));
      } else {
        const subject = getSubjects().find((item) => item.id === classFilter);
        list = list.filter((a) => a.subjectId === classFilter
          || a.classId === classFilter
          || (subject?.classroomId && a.classroomId === subject.classroomId)
          || (subject && a.subject === subject.name));
      }
    }
    list = [...list].sort((a, b) => {
      if (sortBy === 'due' || sortBy === 'due-asc') return String(dueKey(a, '9999-12-31')).localeCompare(String(dueKey(b, '9999-12-31')));
      if (sortBy === 'due-desc') return String(dueKey(b, '')).localeCompare(String(dueKey(a, '')));
      if (sortBy === 'title') return String(a.title || '').localeCompare(String(b.title || ''));
      if (sortBy === 'points') return (Number(b.points) || 0) - (Number(a.points) || 0);
      return a.displayStatus.localeCompare(b.displayStatus);
    });
    return list;
  }

  function renderStats() {
    const all = getAssignments();
    const stats = {
      total: all.length,
      completed: all.filter((a) => a.status === 'completed').length,
      upcoming: all.filter((a) => displayStatus(a) === 'upcoming' || displayStatus(a) === 'pending').length,
      overdue: all.filter((a) => displayStatus(a) === 'overdue').length,
    };
    const el = document.getElementById('asgStats');
    if (!el) {
      const map = [
        ['statTotal', stats.total],
        ['statCompleted', stats.completed],
        ['statPending', stats.upcoming],
        ['statOverdue', stats.overdue],
      ];
      map.forEach(([id, v]) => {
        const node = document.getElementById(id);
        if (node) {
          const inner = node.querySelector('.stat-value');
          (inner || node).textContent = v;
        }
      });
      return;
    }
    const cards = [
      { filter: 'all', label: 'Total', value: stats.total, icon: 'clipboard-list', color: 'blue' },
      { filter: 'completed', label: 'Completed', value: stats.completed, icon: 'check-circle', color: 'green' },
      { filter: 'upcoming', label: isTeacher ? 'Upcoming' : 'Pending', value: stats.upcoming, icon: 'clock', color: 'purple' },
      { filter: 'overdue', label: 'Overdue', value: stats.overdue, icon: 'alert-circle', color: 'red' },
    ];
    el.innerHTML = cards.map((card) => `
      <div class="stat-card" role="button" tabindex="0" data-filter="${card.filter}" aria-pressed="${filter === card.filter}" aria-label="${card.label}: ${card.value} assignments">
        <div class="stat-icon ${card.color}"><i data-lucide="${card.icon}"></i></div>
        <div class="stat-body"><div class="stat-label">${card.label}</div><div class="stat-value">${card.value}</div></div>
      </div>`).join('');
  }

  function renderTabs() {
    const all = getAssignments();
    const counts = {
      all: all.length,
      upcoming: all.filter((a) => displayStatus(a) === 'upcoming' || displayStatus(a) === 'pending').length,
      overdue: all.filter((a) => displayStatus(a) === 'overdue').length,
      completed: all.filter((a) => a.status === 'completed').length,
    };
    // Student page uses #asgTabs, teacher page uses #asgFilterTabs
    const tabs = document.getElementById('asgTabs') || document.getElementById('asgFilterTabs');
    if (!tabs) return;
    const items = [
      ['all', 'All'],
      ['upcoming', 'Upcoming'],
      ['overdue', 'Overdue'],
      ['completed', 'Completed'],
    ];
    tabs.innerHTML = items.map(([key, label]) => `
      <button type="button" class="filter-tab ${filter === key ? 'active' : ''}" data-filter="${key}">
        ${label} <span class="count">${counts[key]}</span>
      </button>`).join('');
    tabs.querySelectorAll('.filter-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        filter = tab.dataset.filter;
        page = 1;
        render();
      });
    });
  }

  function studentRow(a) {
    const color = getSubjects().find((s) => s.id === a.subjectId)?.color || '#2563EB';
    const status = a.displayStatus || displayStatus(a);
    const completed = status === 'completed';
    return `
      <tr data-id="${escapeHtml(a.id)}" data-status="${escapeHtml(a.status)}" class="${completed ? 'assignment-completed' : ''}">
        <td><label class="custom-check"><input type="checkbox" class="row-check" aria-label="Mark ${escapeHtml(a.title)} as ${completed ? 'incomplete' : 'complete'}" ${completed ? 'checked' : ''} /><span class="box"></span></label></td>
        <td>
          <div class="cell-title">
            <div class="cell-icon" style="background:${color}22;color:${color}"><i data-lucide="file-text"></i></div>
            <div>
              <div class="title" data-details="${escapeHtml(a.id)}" role="button" tabindex="0" style="cursor:pointer">${escapeHtml(a.title)}</div>
              <div class="subtitle">${escapeHtml(a.description ? a.description.slice(0, 40) : a.subject)}</div>
            </div>
          </div>
        </td>
        <td><span class="subject-tag ${subjectShort(a.subject)}">${escapeHtml(a.subject)}</span></td>
        <td>${formatDate(a.dueDate)}</td>
        <td><span class="badge ${statusClass(status)}">${statusLabel(status)}</span></td>
        <td>${actionMenu(a)}</td>
      </tr>`;
  }

  function showAssignmentDetails(id) {
    const assignment = getAssignments().find((item) => item.id === id);
    if (!assignment) { showToast('Assignment details are no longer available.', 'error'); return; }
    const setText = (elementId, value) => {
      const element = document.getElementById(elementId);
      if (element) element.textContent = value;
    };
    setText('assignmentDetailsTitle', assignment.title || 'Untitled assignment');
    setText('assignmentDetailsSubject', assignment.subject || 'Unassigned');
    setText('assignmentDetailsDueDate', assignment.dueDate ? formatDate(assignment.dueDate) : 'No due date');
    setText('assignmentDetailsPoints', assignment.points ? `${assignment.points} points` : 'Not set');
    setText('assignmentDetailsDescription', assignment.description || 'No description provided.');
    const status = document.getElementById('assignmentDetailsStatus');
    if (status) {
      const value = displayStatus(assignment);
      status.className = `badge ${statusClass(value)}`;
      status.textContent = statusLabel(value);
    }
    openModal('assignmentDetailsModal');
  }

  function teacherRow(a, classes, students) {
    const cls = classOf(a, classes);
    const short = cls?.short || subjectShort(a.subject);
    const enrolled = cls ? enrolledCount(cls, students) : '—';
    const status = a.displayStatus || a.status;
    return `
      <tr data-id="${escapeHtml(a.id)}" data-status="${escapeHtml(a.status)}" style="cursor:pointer" title="Click for details">
        <td>
          <div class="cell-title">
            <div class="cell-icon" style="color:var(--${escapeHtml(short)}, #2563EB)"><i data-lucide="file-text"></i></div>
            <div>
              <div class="title">${escapeHtml(a.title)}</div>
              <div class="subtitle">${escapeHtml(a.description ? a.description.slice(0, 40) : '')}</div>
            </div>
          </div>
        </td>
        <td><span class="subject-tag ${escapeHtml(short)}"><span class="dot ${escapeHtml(short)}"></span> ${escapeHtml(cls?.name || a.subject)}</span></td>
        <td>${formatDate(a.dueDate)}${a.dueTime ? `<div class="subtitle">${escapeHtml(formatTimeOfDay(a.dueTime))}</div>` : ''}</td>
        <td>${a.points ? escapeHtml(a.points) + ' pts' : '—'}</td>
        <td style="text-align:center">${Number(a.submissions) || 0} / ${enrolled}</td>
        <td><span class="badge ${statusClass(status)}">${statusLabel(status)}</span></td>
        <td>${actionMenu(a)}</td>
      </tr>`;
  }

  function actionMenu(a) {
    return `
      <div class="action-menu-wrap">
        <button type="button" class="action-menu-btn" data-menu="${escapeHtml(a.id)}" aria-label="Actions"><i data-lucide="more-vertical"></i></button>
        <div class="action-dropdown" id="amenu-${escapeHtml(a.id)}">
          ${isTeacher ? `<button type="button" data-view="${escapeHtml(a.id)}"><i data-lucide="eye"></i> View</button>
          <button type="button" data-edit="${escapeHtml(a.id)}"><i data-lucide="edit"></i> Edit</button>` : ''}
          ${a.status !== 'completed' ? `<button type="button" data-complete="${escapeHtml(a.id)}"><i data-lucide="check"></i> Mark Complete</button>` : ''}
          <button type="button" data-delete="${escapeHtml(a.id)}" class="danger"><i data-lucide="trash-2"></i> Delete</button>
        </div>
      </div>`;
  }

  function setAssignmentCompletion(id, completed) {
    const assignment = getAssignments().find((a) => a.id === id);
    if (!assignment) return;

    if (completed) {
      if (assignment.status !== 'completed') {
        updateAssignment(id, { status: 'completed', completionPreviousStatus: assignment.status });
      }
      return;
    }

    const previousStatus = assignment.completionPreviousStatus
      || (assignment.dueDate && assignment.dueDate < localDateStr() ? 'overdue' : 'upcoming');
    updateAssignment(id, { status: previousStatus, completionPreviousStatus: null });
  }

  function renderTable() {
    const list = filtered();
    const tbody = document.getElementById('assignmentsTableBody')
      || document.querySelector('#asgTable tbody')
      || document.getElementById('asgTableBody');
    const table = document.getElementById('asgTable');
    const colSpan = isTeacher ? 7 : 6;

    const pages = Math.max(1, Math.ceil(list.length / perPage));
    page = Math.min(page, pages);
    const start = (page - 1) * perPage;
    const slice = list.slice(start, start + perPage);

    let rows;
    if (isTeacher) {
      const classes = getClasses();
      const students = getStudents();
      rows = slice.map((a) => teacherRow(a, classes, students)).join('');
    } else {
      rows = slice.map(studentRow).join('');
    }

    if (tbody) {
      tbody.innerHTML = rows || `<tr><td colspan="${colSpan}" style="text-align:center;color:var(--text-muted);padding:24px">No assignments found.</td></tr>`;
    } else if (table) {
      const thead = table.querySelector('thead');
      table.innerHTML = (thead ? thead.outerHTML : `
        <thead><tr>
          <th scope="col"><label class="custom-check"><input type="checkbox" id="selectAll" aria-label="Mark all assignments on this page as complete" /><span class="box"></span></label></th>
          <th>Assignment</th><th>Subject</th><th>Due Date</th><th>Status</th><th></th>
        </tr></thead>`) + `<tbody>${rows}</tbody>`;
    }

    document.querySelectorAll('[data-menu]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.action-dropdown').forEach((d) => d.classList.remove('open'));
        document.getElementById(`amenu-${btn.dataset.menu}`)?.classList.toggle('open');
      });
    });
    document.querySelectorAll('[data-complete]').forEach((btn) => {
      btn.addEventListener('click', () => {
        setAssignmentCompletion(btn.dataset.complete, true);
        showToast('Marked as completed');
        render();
      });
    });
    document.querySelectorAll('[data-delete]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const assignment = getAssignments().find((item) => item.id === btn.dataset.delete);
        if (!assignment) {
          showToast('This assignment is no longer available.', 'error');
          render();
          return;
        }
        const removeAssignment = () => {
          const current = getAssignments().find((item) => item.id === assignment.id);
          if (!current) {
            showToast('This assignment is no longer available.', 'error');
            render();
            return;
          }
          deleteAssignment(current.id);
          showToast('Assignment deleted', 'warning');
          render();
        };
        if (isTeacher) removeAssignment();
        else showDeleteConfirmation('assignment', assignment.title || 'Untitled assignment', removeAssignment);
      });
    });

    const selectAll = document.getElementById('selectAll');
    if (selectAll && !isTeacher) {
      const completedCount = slice.filter((assignment) => assignment.status === 'completed').length;
      selectAll.disabled = slice.length === 0;
      selectAll.checked = slice.length > 0 && completedCount === slice.length;
      selectAll.indeterminate = completedCount > 0 && completedCount < slice.length;
      selectAll.onchange = () => {
        slice.forEach((assignment) => setAssignmentCompletion(assignment.id, selectAll.checked));
        showToast(selectAll.checked ? 'All assignments on this page marked as completed' : 'Assignments on this page marked as incomplete');
        render();
      };
    }

    document.querySelectorAll('.row-check').forEach((checkbox) => {
      checkbox.addEventListener('change', () => {
        const id = checkbox.closest('tr')?.dataset.id;
        if (!id) return;
        setAssignmentCompletion(id, checkbox.checked);
        showToast(checkbox.checked ? 'Marked as completed' : 'Marked as incomplete');
        render();
      });
    });
    document.querySelectorAll('[data-details]').forEach((item) => {
      const open = () => showAssignmentDetails(item.dataset.details);
      item.addEventListener('click', open);
      item.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); }
      });
    });

    const pag = document.getElementById('asgPagination');
    if (pag) {
      const total = list.length;
      const from = total ? start + 1 : 0;
      const to = Math.min(start + perPage, total);
      let btns = '';
      for (let i = 1; i <= pages; i++) {
        btns += `<button type="button" class="page-btn ${i === page ? 'active' : ''}" data-page="${i}">${i}</button>`;
      }
      pag.innerHTML = `
        <div class="pagination-info">Showing ${from}–${to} of ${total} assignments</div>
        <div class="pagination-controls">
          <button type="button" class="page-btn" data-page="${page - 1}" ${page <= 1 ? 'disabled' : ''} aria-label="Previous page"><i data-lucide="chevron-left"></i></button>
          ${btns}
          <button type="button" class="page-btn" data-page="${page + 1}" ${page >= pages ? 'disabled' : ''} aria-label="Next page"><i data-lucide="chevron-right"></i></button>
        </div>`;
      pag.querySelectorAll('[data-page]').forEach((b) => {
        b.addEventListener('click', () => {
          const p = Number(b.dataset.page);
          if (p >= 1 && p <= pages) { page = p; render(); }
        });
      });
    }
  }

  function renderAside() {
    const all = getAssignments();
    const classes = isTeacher ? getClasses() : [];
    const deadlines = isTeacher
      ? getUpcomingAssignments(all)
      : all.filter((a) => a.status !== 'completed')
        .sort((a, b) => String(dueKey(a, '9999-12-31')).localeCompare(String(dueKey(b, '9999-12-31'))))
        .slice(0, 5);
    const dl = document.getElementById('upcomingDeadlines')
      || document.getElementById(isTeacher ? 'asgDeadlines' : 'deadlineList');
    if (dl) {
      dl.innerHTML = deadlines.length
        ? deadlines.map((a) => {
          const classInfo = isTeacher ? classOf(a, classes) : null;
          const subject = a.subject || classInfo?.subject || classInfo?.name || 'General';
          if (isTeacher) {
            const daysUntilDue = Math.round(
              (new Date(`${a.dueDate}T00:00:00`) - new Date(`${localDateStr()}T00:00:00`)) / 86400000
            );
            const dueLabel = daysUntilDue === 0 ? 'Due today'
              : daysUntilDue === 1 ? 'Tomorrow'
                : `${daysUntilDue} days`;
            return `
              <div class="list-item">
                <span class="dot ${escapeHtml(subjectShort(subject))}"></span>
                <div class="item-meta">
                  <div class="item-title">${escapeHtml(a.title || 'Untitled assignment')}</div>
                  <div class="item-sub">${escapeHtml(subject)} · ${escapeHtml(formatDate(a.dueDate))}${a.dueTime ? ` · ${escapeHtml(formatTimeOfDay(a.dueTime))}` : ''}</div>
                </div>
                <span class="badge badge-upcoming">${dueLabel}</span>
              </div>`;
          }
          return `
            <div class="list-item">
              <span class="dot ${escapeHtml(subjectShort(subject))}"></span>
              <div class="item-meta">
                <div class="item-title">${escapeHtml(a.title)}</div>
                <div class="item-sub">${escapeHtml(subject)} · ${a.dueDate ? escapeHtml(formatDate(a.dueDate)) : 'No due date'}</div>
              </div>
              <span class="badge ${statusClass(displayStatus(a))}">${statusLabel(displayStatus(a))}</span>
            </div>`;
        }).join('')
        : '<p class="empty-state" style="padding:16px">No upcoming deadlines.</p>';
    }

    const completed = all.filter((a) => a.status === 'completed').length;
    const pending = all.filter((a) => displayStatus(a) === 'upcoming' || displayStatus(a) === 'pending').length;
    const overdue = all.filter((a) => displayStatus(a) === 'overdue').length;
    const pct = all.length ? Math.round((completed / all.length) * 100) : 0;
    const donut = document.getElementById('asgProgressDonut');
    if (donut) {
      donut.innerHTML = `
        <div class="donut-wrap">
          <div class="donut">${createDonutSVG(pct)}<div class="center-label">${pct}%<small>Done</small></div></div>
          <div class="donut-legend">
            <div class="donut-legend-row"><div class="lbl"><span>Completed</span><span>${completed}</span></div></div>
            <div class="donut-legend-row"><div class="lbl"><span>Pending</span><span>${pending}</span></div></div>
            <div class="donut-legend-row"><div class="lbl"><span>Overdue</span><span>${overdue}</span></div></div>
          </div>
        </div>`;
    }
  }

  function render() {
    renderStats();
    renderTabs();
    renderTable();
    renderAside();
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  const statsElement = document.getElementById('asgStats');
  statsElement?.addEventListener('click', (event) => {
    const card = event.target.closest('.stat-card[data-filter]');
    if (!card || !statsElement.contains(card)) return;
    filter = card.dataset.filter;
    page = 1;
    render();
  });
  statsElement?.addEventListener('keydown', (event) => {
    const card = event.target.closest('.stat-card[data-filter]');
    if (!card || !statsElement.contains(card) || !['Enter', ' '].includes(event.key)) return;
    event.preventDefault();
    filter = card.dataset.filter;
    page = 1;
    render();
  });

  document.getElementById('asgSearch')?.addEventListener('input', (e) => {
    search = e.target.value.trim();
    page = 1;
    render();
  });
  document.getElementById('asgClassFilter')?.addEventListener('change', (e) => {
    classFilter = e.target.value;
    page = 1;
    render();
  });
  const subjectFilterElement = document.getElementById('asgSubjectFilter');
  if (subjectFilterElement && !isTeacher) {
    subjectFilterElement.innerHTML = '<option value="">All Subjects</option>' + getSubjects().map((subject) =>
      `<option value="${escapeHtml(subject.id)}">${escapeHtml(subject.name)}</option>`
    ).join('');
    subjectFilterElement.addEventListener('change', (event) => {
      classFilter = event.target.value;
      page = 1;
      render();
    });
  }
  document.getElementById('asgSort')?.addEventListener('change', (e) => {
    sortBy = e.target.value;
    render();
  });

  document.getElementById('syncClassroomBtn')?.addEventListener('click', async (e) => {
    const result = await syncGoogleClassroom(e.currentTarget);
    if (result?.ok) render();
  });
  // ---- Teacher: fill the class dropdowns from the real classes ----
  if (isTeacher) {
    const classes = getClasses();
    const filterSel = document.getElementById('asgClassFilter');
    if (filterSel) {
      filterSel.innerHTML = '<option value="">All Classes</option>' +
        classes.map((c) => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.name)}</option>`).join('');
    }
    const classSel = document.getElementById('asgClass');
    if (classSel) {
      classSel.innerHTML = '<option value="">Select class</option>' +
        classes.map((c) => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.name)}</option>`).join('');
    }
  }

  // ---- Teacher: assignment details popup + edit ----
  function setEl(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function setAsgFormMode(isEdit) {
    setEl('asgModalTitle', isEdit ? 'Edit Assignment' : 'Create Assignment');
    setEl('saveAsgBtn', isEdit ? 'Save Changes' : 'Create Assignment');
  }

  function resetAsgForm() {
    editingAsgId = null;
    document.getElementById('createAsgForm')?.reset();
    setAsgFormMode(false);
  }

  function showTeacherAssignmentDetails(id) {
    const a = getAssignments().find((x) => x.id === id);
    if (!a) { showToast('Assignment is no longer available.', 'error'); return; }
    currentAsgId = id;
    const cls = classOf(a, getClasses());
    const enrolled = cls ? enrolledCount(cls, getStudents()) : '—';
    const due = a.dueDate
      ? formatDate(a.dueDate) + (a.dueTime ? ' · ' + formatTimeOfDay(a.dueTime) : '')
      : 'No due date';

    setEl('tAsgTitle', a.title || 'Untitled assignment');
    setEl('tAsgClass', cls?.name || a.subject || 'Unassigned');
    setEl('tAsgDue', due);
    setEl('tAsgPoints', a.points ? `${a.points} points` : 'Not set');
    setEl('tAsgSubmissions', `${Number(a.submissions) || 0} / ${enrolled}`);
    setEl('tAsgDescription', a.description || 'No description provided.');
    const badge = document.getElementById('tAsgStatus');
    if (badge) {
      const st = displayStatus(a);
      badge.className = `badge ${statusClass(st)}`;
      badge.textContent = statusLabel(st);
    }
    openModal('asgDetailsModal');
  }

  function openEditAssignment(id) {
    const a = getAssignments().find((x) => x.id === id);
    if (!a) return;
    editingAsgId = id;
    const set = (field, v) => { const el = document.getElementById(field); if (el) el.value = v ?? ''; };
    set('asgTitle', a.title);
    set('asgClass', a.classId || a.subjectId || '');
    set('asgDueDate', a.dueDate);
    set('asgDueTime', a.dueTime || '23:59');
    set('asgPoints', a.points);
    set('asgDescription', a.description);
    setAsgFormMode(true);
    openModal('createAsgModal');
  }

  if (isTeacher) {
    document.getElementById('assignmentsTableBody')?.addEventListener('click', (e) => {
      const editBtn = e.target.closest('[data-edit]');
      if (editBtn) {
        document.querySelectorAll('.action-dropdown').forEach((d) => d.classList.remove('open'));
        openEditAssignment(editBtn.dataset.edit);
        return;
      }
      const viewBtn = e.target.closest('[data-view]');
      if (viewBtn) {
        document.querySelectorAll('.action-dropdown').forEach((d) => d.classList.remove('open'));
        showTeacherAssignmentDetails(viewBtn.dataset.view);
        return;
      }
      // Other buttons (menu toggle, complete, delete) keep their own behavior
      if (e.target.closest('button, a, .action-menu-wrap')) return;
      const row = e.target.closest('tr[data-id]');
      if (row) showTeacherAssignmentDetails(row.dataset.id);
    });

    document.getElementById('editAsgBtn')?.addEventListener('click', () => {
      const id = currentAsgId;
      closeModal('asgDetailsModal');
      if (id) openEditAssignment(id);
    });
  }

  // ---- Open the create modal (all button IDs used by student + teacher pages) ----
  ['addAssignmentBtn', 'createAssignmentBtn', 'createAsgBtn', 'qaCreateAsg'].forEach((id) => {
    document.getElementById(id)?.addEventListener('click', () => {
      if (isTeacher) resetAsgForm();
      openModal('addAssignmentModal');
      openModal('createAsgModal');
    });

    document.querySelectorAll('[data-action]').forEach((button) => {
      button.addEventListener('click', () => {
        const action = button.dataset.action;
        if (action === 'add-assignment') openModal('addAssignmentModal');
        else if (action === 'mark-complete') {
          const selectAll = document.getElementById('selectAll');
          if (!selectAll) return;
          if (selectAll.checked) { showToast('All assignments on this page are already complete.', 'info'); return; }
          selectAll.checked = true;
          selectAll.dispatchEvent(new Event('change', { bubbles: true }));
        } else if (action === 'add-task') window.location.href = 'todo.php';
        else if (action === 'view-progress') window.location.href = 'progress.php';
      });
    });
  });

  const form = document.getElementById('addAssignmentForm') || document.getElementById('createAsgForm');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = val('asgTitle')?.trim();
    const dueDate = val('asgDueDate', 'asgDue');
    const description = (val('asgDescription', 'asgDesc') || '').trim();
    if (!title || !dueDate) { showToast('Title and due date are required', 'error'); return; }

    let data;
    if (isTeacher) {
      const classId = val('asgClass');
      const cls = getClasses().find((c) => c.id === classId);
      if (!cls) { showToast('Please select a class', 'error'); return; }
      const dueTime = val('asgDueTime') || '';
      if (!dueTime) { showToast('Due time is required', 'error'); return; }
      data = {
        title, description, dueDate, dueTime, status: 'upcoming',
        classId: cls.id,
        subjectId: cls.id,
        subject: cls.name,
        points: Number(val('asgPoints')) || 0,
        submissions: 0,
      };
    } else {
      const subjectSelect = document.getElementById('asgSubject');
      data = {
        title, description, dueDate, status: 'upcoming',
        subjectId: subjectSelect?.value,
        subject: subjectSelect?.selectedOptions?.[0]?.text || subjectSelect?.value,
      };
    }

    const wasEditing = isTeacher && editingAsgId;
    if (wasEditing) {
      // Keep status/submissions; only update the fields the form edits
      const { status, submissions, ...patch } = data;
      const existing = getAssignments().find((a) => a.id === editingAsgId);
      if (existing?.status === 'overdue') patch.status = 'upcoming'; // recalculated from the new date/time
      updateAssignment(editingAsgId, patch);
    } else {
      addAssignment(data);
    }
    closeModal('addAssignmentModal');
    closeModal('createAsgModal');
    form.reset();
    if (isTeacher) { editingAsgId = null; setAsgFormMode(false); }
    showToast(wasEditing ? 'Assignment updated' : 'Assignment created');
    render();
  });

  // Populate subject select (student page) if empty
  const subjSelect = document.getElementById('asgSubject');
  if (subjSelect && !isTeacher) {
    const subjects = getSubjects();
    subjSelect.innerHTML = `<option value="">${subjects.length ? 'Select subject' : 'No subjects available'}</option>` + subjects.map((subject) =>
      `<option value="${escapeHtml(subject.id)}">${escapeHtml(subject.name)}</option>`
    ).join('');
    subjSelect.disabled = subjects.length === 0;
  }

  render();
  const requestedAssignmentId = !isTeacher
    ? new URLSearchParams(window.location.search).get('assignment')
    : null;
  if (requestedAssignmentId) showAssignmentDetails(requestedAssignmentId);
});
/**
 * StudyBuddy — To-Do List
 */
document.addEventListener('DOMContentLoaded', () => {
  const session = initShell('student');
  if (!session) return;
  wireModalClosers();

  let filter = 'all';
  let sortBy = 'due';

  function filtered() {
    let list = getTasks();
    if (filter === 'today') list = list.filter((t) => t.today || t.dueDate === localDateStr());
    else if (filter === 'upcoming') list = list.filter((t) => t.status === 'upcoming' || t.status === 'pending');
    else if (filter === 'completed') list = list.filter((t) => t.status === 'completed');
    list = [...list].sort((a, b) => {
      if (sortBy === 'due') return (a.dueDate + (a.dueTime || '')).localeCompare(b.dueDate + (b.dueTime || ''));
      return a.title.localeCompare(b.title);
    });
    return list;
  }

  function renderTabs() {
    const all = getTasks();
    const counts = {
      all: all.length,
      today: all.filter((t) => t.today || t.dueDate === localDateStr()).length,
      upcoming: all.filter((t) => t.status !== 'completed').length,
      completed: all.filter((t) => t.status === 'completed').length,
    };
    const tabs = document.getElementById('todoTabs');
    if (!tabs) return;
    [['all', 'All'], ['today', 'Today'], ['upcoming', 'Upcoming'], ['completed', 'Completed']].forEach(([key, label]) => {
      // rebuild
    });
    tabs.innerHTML = [
      ['all', 'All'], ['today', 'Today'], ['upcoming', 'Upcoming'], ['completed', 'Completed'],
    ].map(([key, label]) => `
      <button type="button" class="filter-tab ${filter === key ? 'active' : ''}" data-filter="${key}">
        ${label} <span class="count">${counts[key]}</span>
      </button>`).join('');
    tabs.querySelectorAll('.filter-tab').forEach((tab) => {
      tab.addEventListener('click', () => { filter = tab.dataset.filter; render(); });
    });
  }

  function renderList() {
    const list = filtered();
    const el = document.getElementById('todoList');
    if (!el) return;
    el.innerHTML = list.length ? list.map((t) => `
      <div class="todo-item ${t.status === 'completed' ? 'done' : ''}" data-id="${t.id}">
        <label class="custom-check">
          <input type="checkbox" class="todo-check" data-id="${t.id}" ${t.status === 'completed' ? 'checked' : ''} />
          <span class="box"></span>
        </label>
        <div class="todo-icon" style="background:${getSubjects().find((s) => s.id === t.subjectId)?.color || '#2563EB'}22;color:${getSubjects().find((s) => s.id === t.subjectId)?.color || '#2563EB'}">
          <i data-lucide="check-square"></i>
        </div>
        <div class="todo-body">
          <div class="todo-title">${t.title}</div>
          <div class="todo-meta">
            <span class="subject-tag ${subjectShort(t.subject)}">${t.subject}</span>
            <span class="todo-due"><i data-lucide="clock" style="width:12px;height:12px;display:inline"></i> ${formatDate(t.dueDate)} ${t.dueTime ? formatTime(t.dueTime) : ''}</span>
          </div>
        </div>
        <span class="badge ${statusClass(t.status)}">${statusLabel(t.status)}</span>
        <div class="action-menu-wrap">
          <button type="button" class="action-menu-btn" data-menu="${t.id}"><i data-lucide="more-vertical"></i></button>
          <div class="action-dropdown" id="tmenu-${t.id}">
            <button type="button" data-delete="${t.id}" class="danger"><i data-lucide="trash-2"></i> Delete</button>
          </div>
        </div>
      </div>`).join('') : '<p class="empty-state">No tasks in this view.</p>';

    el.querySelectorAll('.todo-check').forEach((cb) => {
      cb.addEventListener('change', () => {
        updateTask(cb.dataset.id, { status: cb.checked ? 'completed' : 'pending' });
        showToast(cb.checked ? 'Task completed!' : 'Task reopened');
        render();
      });
    });
    el.querySelectorAll('[data-menu]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.action-dropdown').forEach((d) => d.classList.remove('open'));
        document.getElementById(`tmenu-${btn.dataset.menu}`)?.classList.toggle('open');
      });
    });
    el.querySelectorAll('[data-delete]').forEach((btn) => {
      btn.addEventListener('click', () => {
        deleteTask(btn.dataset.delete);
        showToast('Task deleted', 'warning');
        render();
      });
    });
  }

  function renderAside() {
    const today = getTasks().filter((t) => (t.today || t.dueDate === '2025-09-12') && t.status !== 'completed');
    const el = document.getElementById('todayTasks');
    if (el) {
      el.innerHTML = today.map((t) => `
        <div class="list-item">
          <span class="subject-tag ${subjectShort(t.subject)}">${t.subject}</span>
          <div class="item-meta"><div class="item-title">${t.title}</div>
          <div class="item-sub">${t.dueTime ? formatTime(t.dueTime) : formatDate(t.dueDate)}</div></div>
        </div>`).join('') || '<p style="color:var(--text-muted);font-size:13px;padding:8px 0">All caught up for today!</p>';
    }
  }

  function render() {
    renderTabs();
    renderList();
    renderAside();
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  document.getElementById('addTaskBtn')?.addEventListener('click', () => openModal('addTaskModal'));
  document.getElementById('todoSort')?.addEventListener('change', (e) => { sortBy = e.target.value; render(); });

  const subjSelect = document.getElementById('taskSubject');
  if (subjSelect && subjSelect.options.length <= 1) {
    getSubjects().forEach((s) => {
      const o = document.createElement('option');
      o.value = s.id;
      o.textContent = s.name;
      subjSelect.appendChild(o);
    });
  }

  document.getElementById('addTaskForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('taskTitle')?.value.trim();
    const subjectId = document.getElementById('taskSubject')?.value;
    const subject = getSubjects().find((s) => s.id === subjectId)?.name || 'General';
    const dueDate = document.getElementById('taskDue')?.value;
    const dueTime = document.getElementById('taskTime')?.value || '12:00';
    if (!title || !dueDate) { showToast('Title and due date required', 'error'); return; }
    addTask({ title, subjectId, subject, dueDate, dueTime, status: 'pending', today: dueDate === '2025-09-12' });
    closeModal('addTaskModal');
    e.target.reset();
    showToast('Task added');
    render();
  });

  document.querySelectorAll('[data-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const a = btn.getAttribute('data-action');
      if (a === 'add-task') openModal('addTaskModal');
      else if (a === 'add-assignment') window.location.href = 'assignments.php';
      else if (a === 'add-subject') window.location.href = 'subjects.php';
      else if (a === 'add-schedule') window.location.href = 'schedule.php';
    });
  });

  render();
});

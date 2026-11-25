/**
 * StudyBuddy — To-Do List
 */
document.addEventListener('DOMContentLoaded', () => {
  const session = initShell('student');
  if (!session) return;
  wireModalClosers();

  let filter = 'all';
  let sortBy = 'due';
  let editingTaskId = null;

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[char]));
  }

  function displayStatus(task) {
    if (task.status === 'completed') return 'completed';
    const now = new Date();
    const today = localDateStr(now);
    if (task.dueDate && (task.dueDate < today
      || (task.dueDate === today && task.dueTime && task.dueTime < `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`))) return 'overdue';
    return task.status || 'pending';
  }

  function filtered() {
    let list = getTasks();
    if (filter === 'today') list = list.filter((t) => t.today || t.dueDate === localDateStr());
    else if (filter === 'upcoming') list = list.filter((t) => ['upcoming', 'pending'].includes(displayStatus(t)));
    else if (filter === 'completed') list = list.filter((t) => t.status === 'completed');
    list = [...list].sort((a, b) => {
      if (sortBy === 'due') return `${a.dueDate || '9999-12-31'}${a.dueTime || ''}`.localeCompare(`${b.dueDate || '9999-12-31'}${b.dueTime || ''}`);
      return String(a.title || '').localeCompare(String(b.title || ''));
    });
    return list;
  }

  function renderTabs() {
    const all = getTasks();
    const counts = {
      all: all.length,
      today: all.filter((t) => t.today || t.dueDate === localDateStr()).length,
      upcoming: all.filter((t) => ['upcoming', 'pending'].includes(displayStatus(t))).length,
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
    el.innerHTML = list.length ? list.map((t) => {
      const subject = t.subject || 'General';
      const subjectClass = escapeHtml(subjectShort(subject));
      const safeId = escapeHtml(t.id);
      const taskStatus = displayStatus(t);
      return `
      <div class="todo-item ${taskStatus === 'completed' ? 'done' : ''}" data-id="${safeId}">
        <label class="custom-check">
          <input type="checkbox" class="todo-check" data-id="${safeId}" ${taskStatus === 'completed' ? 'checked' : ''} />
          <span class="box"></span>
        </label>
        <button type="button" class="todo-body" data-details="${safeId}" aria-haspopup="dialog">
          <span class="todo-title">${escapeHtml(t.title)}</span>
          <span class="todo-meta">
            <span class="subject-tag ${subjectClass}">${escapeHtml(subject)}</span>
            <span class="todo-due"><i data-lucide="clock" style="width:12px;height:12px;display:inline"></i> ${escapeHtml(t.dueDate ? formatDate(t.dueDate) : 'No due date')} ${t.dueTime ? escapeHtml(formatTime(t.dueTime)) : ''}</span>
          </span>
        </button>
        <span class="badge ${statusClass(taskStatus)}">${escapeHtml(statusLabel(taskStatus))}</span>
        <div class="action-menu-wrap">
          <button type="button" class="action-menu-btn" data-menu="${safeId}"><i data-lucide="more-vertical"></i></button>
          <div class="action-dropdown" id="tmenu-${safeId}">
            <button type="button" data-edit="${safeId}"><i data-lucide="pencil"></i> Edit</button>
            <button type="button" data-delete="${safeId}" class="danger"><i data-lucide="trash-2"></i> Delete</button>
          </div>
        </div>
      </div>`;
    }).join('') : '<p class="empty-state">No tasks in this view.</p>';

    el.querySelectorAll('.todo-check').forEach((cb) => {
      cb.addEventListener('change', () => {
        updateTask(cb.dataset.id, { status: cb.checked ? 'completed' : 'pending' });
        showToast(cb.checked ? 'Task completed!' : 'Task reopened');
        render();
      });
    });
    el.querySelectorAll('[data-details]').forEach((btn) => {
      btn.addEventListener('click', () => showTaskDetails(btn.dataset.details));
    });
    el.querySelectorAll('[data-menu]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.action-dropdown').forEach((d) => d.classList.remove('open'));
        document.getElementById(`tmenu-${btn.dataset.menu}`)?.classList.toggle('open');
      });
    });
    el.querySelectorAll('[data-edit]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const task = getTasks().find((item) => item.id === btn.dataset.edit);
        if (!task) {
          showToast('This task is no longer available.', 'error');
          render();
          return;
        }
        openTaskForm(task);
      });
    });
    el.querySelectorAll('[data-delete]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const task = getTasks().find((item) => item.id === btn.dataset.delete);
        if (!task) {
          showToast('This task is no longer available.', 'error');
          render();
          return;
        }
        showDeleteConfirmation('task', task.title || 'Untitled task', () => {
          const currentTask = getTasks().find((item) => item.id === task.id);
          if (!currentTask) {
            showToast('This task is no longer available.', 'error');
            render();
            return;
          }
          deleteTask(currentTask.id);
          showToast('Task deleted', 'warning');
          render();
        });
      });
    });
  }

  function showTaskDetails(id) {
    const task = getTasks().find((item) => String(item.id) === String(id));
    if (!task) {
      showToast('Task details are no longer available', 'error');
      return;
    }

    document.getElementById('taskDetailsTitle').textContent = task.title;
    document.getElementById('taskDetailsSubject').textContent = task.subject || 'General';
    document.getElementById('taskDetailsDueDate').textContent = formatDate(task.dueDate);
    document.getElementById('taskDetailsDueTime').textContent = task.dueTime ? formatTime(task.dueTime) : 'Not set';
    document.getElementById('taskDetailsNotes').textContent = task.notes || 'No description added.';
    const status = document.getElementById('taskDetailsStatus');
    const currentStatus = displayStatus(task);
    status.className = `badge ${statusClass(currentStatus)}`;
    status.textContent = statusLabel(currentStatus);
    openModal('taskDetailsModal');
  }

  function renderAside() {
    const today = getTasks().filter((t) => (t.today || t.dueDate === localDateStr()) && t.status !== 'completed');
    const count = document.getElementById('todayTasksCount');
    if (count) {
      count.textContent = today.length ? `${today.length} left` : 'All done';
      count.className = `badge ${today.length ? 'badge-pending' : 'badge-completed'}`;
    }
    const el = document.getElementById('todayTasksList') || document.getElementById('todayTasks');
    if (el) {
      el.innerHTML = today.map((t) => `
        <div class="list-item">
          <span class="subject-tag ${escapeHtml(subjectShort(t.subject))}">${escapeHtml(t.subject || 'General')}</span>
          <div class="item-meta"><div class="item-title">${escapeHtml(t.title)}</div>
          <div class="item-sub">${escapeHtml(t.dueTime ? formatTime(t.dueTime) : t.dueDate ? formatDate(t.dueDate) : 'No due date')}</div></div>
        </div>`).join('') || '<p style="color:var(--text-muted);font-size:13px;padding:8px 0">All caught up for today!</p>';
    }
  }

  function render() {
    renderTabs();
    renderList();
    renderAside();
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  function createTask({ title, subjectId, dueDate, dueTime, notes }) {
    const cleanTitle = String(title || '').trim();
    if (!cleanTitle) {
      showToast('Task title is required', 'error');
      return false;
    }

    const taskDate = dueDate || localDateStr();
    const subject = getSubjects().find((s) => s.id === subjectId)?.name || 'General';
    addTask({
      title: cleanTitle,
      subjectId,
      subject,
      dueDate: taskDate,
      dueTime: dueTime || '12:00',
      notes: notes || '',
      status: 'pending',
      today: taskDate === localDateStr(),
    });
    showToast('Task added');
    render();
    return true;
  }

  function openTaskForm(task = null) {
    editingTaskId = task?.id || null;
    const form = document.getElementById('addTaskForm');
    form?.reset();
    document.getElementById('addTaskTitle').textContent = task ? 'Edit Task' : 'Add Task';
    const submitButton = form?.querySelector('[type="submit"]');
    if (submitButton) submitButton.textContent = task ? 'Save Changes' : 'Add Task';
    if (task) {
      document.getElementById('taskTitle').value = task.title || '';
      document.getElementById('taskSubject').value = task.subjectId || '';
      document.getElementById('taskDueDate').value = task.dueDate || localDateStr();
      document.getElementById('taskDueTime').value = task.dueTime || '';
      document.getElementById('taskNotes').value = task.notes || '';
    }
    openModal('addTaskModal');
  }

  document.getElementById('addTaskBtn')?.addEventListener('click', () => openTaskForm());
  document.getElementById('todoSort')?.addEventListener('change', (e) => { sortBy = e.target.value; render(); });

  const taskSubjects = getSubjects();
  ['taskSubject', 'quickTaskSubject'].forEach((id) => {
    const select = document.getElementById(id);
    if (!select) return;
    const previous = taskSubjects.some((subject) => subject.id === select.value) ? select.value : '';
    select.innerHTML = `<option value="">${taskSubjects.length ? 'General / no subject' : 'No subjects available'}</option>` + taskSubjects.map((subject) =>
      `<option value="${escapeHtml(subject.id)}">${escapeHtml(subject.name)}</option>`
    ).join('');
    select.value = previous;
  });

  document.getElementById('addTaskForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('taskTitle')?.value.trim();
    const subjectId = document.getElementById('taskSubject')?.value;
    const dueDate = document.getElementById('taskDueDate')?.value;
    const dueTime = document.getElementById('taskDueTime')?.value;
    const notes = document.getElementById('taskNotes')?.value;
    if (!title || !dueDate) { showToast('Title and due date required', 'error'); return; }
    const isEditing = Boolean(editingTaskId);
    if (isEditing) {
      const task = getTasks().find((item) => item.id === editingTaskId);
      if (!task) {
        showToast('This task is no longer available.', 'error');
        render();
        return;
      }
      const subject = getSubjects().find((item) => item.id === subjectId)?.name || 'General';
      updateTask(task.id, {
        title,
        subjectId,
        subject,
        dueDate,
        dueTime: dueTime || '',
        notes: notes || '',
        today: dueDate === localDateStr(),
      });
      showToast('Task updated');
    } else if (!createTask({ title, subjectId, dueDate, dueTime, notes })) {
      return;
    }
    closeModal('addTaskModal');
    e.target.reset();
    editingTaskId = null;
    document.getElementById('addTaskTitle').textContent = 'Add Task';
    const submitButton = e.target.querySelector('[type="submit"]');
    if (submitButton) submitButton.textContent = 'Add Task';
    if (isEditing) render();
  });

  document.getElementById('quickAddForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('quickTaskTitle')?.value || '';
    const subjectId = document.getElementById('quickTaskSubject')?.value || '';
    const dueDate = document.getElementById('quickTaskDate')?.value || '';
    if (!createTask({ title, subjectId, dueDate })) return;
    e.target.reset();
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

  const requestedTaskId = new URLSearchParams(window.location.search).get('task');
  render();
  sbWhenReady(() => {
    render();
    if (requestedTaskId) showTaskDetails(requestedTaskId);
  });
});

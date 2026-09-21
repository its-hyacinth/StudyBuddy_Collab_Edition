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
  let classFilter = 'all';
  let sortBy = 'due';
  let page = 1;
  const perPage = 8;

  function filtered() {
    let list = getAssignments();
    if (filter !== 'all') list = list.filter((a) => a.status === filter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((a) => a.title.toLowerCase().includes(q) || a.subject.toLowerCase().includes(q));
    }
    if (isTeacher && classFilter !== 'all') {
      list = list.filter((a) => a.subject === classFilter || a.subjectId === classFilter);
    }
    list = [...list].sort((a, b) => {
      if (sortBy === 'due') return a.dueDate.localeCompare(b.dueDate);
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      return a.status.localeCompare(b.status);
    });
    return list;
  }

  function renderStats() {
    const all = getAssignments();
    const stats = {
      total: all.length,
      completed: all.filter((a) => a.status === 'completed').length,
      upcoming: all.filter((a) => a.status === 'upcoming' || a.status === 'pending').length,
      overdue: all.filter((a) => a.status === 'overdue').length,
    };
    const el = document.getElementById('asgStats');
    if (!el) {
      // Update individual stat values if present
      const map = [
        ['statTotal', stats.total],
        ['statCompleted', stats.completed],
        ['statPending', stats.upcoming],
        ['statOverdue', stats.overdue],
      ];
      map.forEach(([id, v]) => {
        const node = document.getElementById(id);
        if (node) {
          const val = node.querySelector('.stat-value');
          if (val) val.textContent = v;
        }
      });
      return;
    }
    el.innerHTML = `
      <div class="stat-card"><div class="stat-icon blue"><i data-lucide="clipboard-list"></i></div><div class="stat-body"><div class="stat-label">Total</div><div class="stat-value">${stats.total}</div></div></div>
      <div class="stat-card"><div class="stat-icon green"><i data-lucide="check-circle"></i></div><div class="stat-body"><div class="stat-label">Completed</div><div class="stat-value">${stats.completed}</div></div></div>
      <div class="stat-card"><div class="stat-icon purple"><i data-lucide="clock"></i></div><div class="stat-body"><div class="stat-label">${isTeacher ? 'Upcoming' : 'Pending'}</div><div class="stat-value">${stats.upcoming}</div></div></div>
      <div class="stat-card"><div class="stat-icon red"><i data-lucide="alert-circle"></i></div><div class="stat-body"><div class="stat-label">Overdue</div><div class="stat-value">${stats.overdue}</div></div></div>`;
  }

  function renderTabs() {
    const all = getAssignments();
    const counts = {
      all: all.length,
      upcoming: all.filter((a) => a.status === 'upcoming').length,
      overdue: all.filter((a) => a.status === 'overdue').length,
      completed: all.filter((a) => a.status === 'completed').length,
    };
    const tabs = document.getElementById('asgTabs');
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

  function renderTable() {
    const list = filtered();
    const tbody = document.querySelector('#asgTable tbody') || document.getElementById('asgTableBody');
    const table = document.getElementById('asgTable');
    let start = 0, slice = list;
    if (isTeacher) {
      start = (page - 1) * perPage;
      slice = list.slice(start, start + perPage);
    }

    const rows = slice.map((a) => `
      <tr data-id="${a.id}">
        <td><label class="custom-check"><input type="checkbox" class="row-check" /><span class="box"></span></label></td>
        <td>
          <div class="cell-title">
            <div class="cell-icon" style="background:${getSubjects().find((s) => s.id === a.subjectId)?.color || '#2563EB'}22;color:${getSubjects().find((s) => s.id === a.subjectId)?.color || '#2563EB'}">
              <i data-lucide="file-text"></i>
            </div>
            <div>
              <div class="title">${a.title}</div>
              <div class="subtitle">${a.description ? a.description.slice(0, 40) : a.subject}</div>
            </div>
          </div>
        </td>
        <td><span class="subject-tag ${subjectShort(a.subject)}">${a.subject}</span></td>
        <td>${formatDate(a.dueDate)}</td>
        <td><span class="badge ${statusClass(a.status)}">${statusLabel(a.status)}</span></td>
        <td>
          <div class="action-menu-wrap">
            <button type="button" class="action-menu-btn" data-menu="${a.id}"><i data-lucide="more-vertical"></i></button>
            <div class="action-dropdown" id="amenu-${a.id}">
              ${a.status !== 'completed' ? `<button type="button" data-complete="${a.id}"><i data-lucide="check"></i> Mark Complete</button>` : ''}
              <button type="button" data-delete="${a.id}" class="danger"><i data-lucide="trash-2"></i> Delete</button>
            </div>
          </div>
        </td>
      </tr>`).join('');

    if (tbody) {
      tbody.innerHTML = rows || '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:24px">No assignments found.</td></tr>';
    } else if (table) {
      // Replace entire table content preserving header
      const thead = table.querySelector('thead');
      table.innerHTML = (thead ? thead.outerHTML : `
        <thead><tr>
          <th><label class="custom-check"><input type="checkbox" id="selectAll" /><span class="box"></span></label></th>
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
        updateAssignmentStatus(btn.dataset.complete, 'completed');
        showToast('Marked as completed');
        render();
      });
    });
    document.querySelectorAll('[data-delete]').forEach((btn) => {
      btn.addEventListener('click', () => {
        deleteAssignment(btn.dataset.delete);
        showToast('Assignment deleted', 'warning');
        render();
      });
    });

    const selectAll = document.getElementById('selectAll');
    selectAll?.addEventListener('change', () => {
      document.querySelectorAll('.row-check').forEach((c) => { c.checked = selectAll.checked; });
    });

    // Pagination
    const pag = document.getElementById('asgPagination');
    if (pag && isTeacher) {
      const total = list.length;
      const pages = Math.max(1, Math.ceil(total / perPage));
      const from = total ? start + 1 : 0;
      const to = Math.min(start + perPage, total);
      let btns = '';
      for (let i = 1; i <= pages; i++) {
        btns += `<button type="button" class="page-btn ${i === page ? 'active' : ''}" data-page="${i}">${i}</button>`;
      }
      pag.innerHTML = `
        <div class="pagination-info">Showing ${from}–${to} of ${total}</div>
        <div class="pagination-controls">
          <button type="button" class="page-btn" data-page="${page - 1}" ${page <= 1 ? 'disabled' : ''}><i data-lucide="chevron-left"></i></button>
          ${btns}
          <button type="button" class="page-btn" data-page="${page + 1}" ${page >= pages ? 'disabled' : ''}><i data-lucide="chevron-right"></i></button>
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
    const deadlines = getAssignments()
      .filter((a) => a.status !== 'completed')
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 5);
    const dl = document.getElementById('upcomingDeadlines') || document.getElementById('asgDeadlines');
    if (dl) {
      dl.innerHTML = deadlines.map((a) => `
        <div class="list-item">
          <span class="dot ${subjectShort(a.subject)}"></span>
          <div class="item-meta">
            <div class="item-title">${a.title}</div>
            <div class="item-sub">${formatDate(a.dueDate)}</div>
          </div>
          <span class="badge ${statusClass(a.status)}">${statusLabel(a.status)}</span>
        </div>`).join('');
    }

    const all = getAssignments();
    const completed = all.filter((a) => a.status === 'completed').length;
    const pending = all.filter((a) => a.status === 'upcoming' || a.status === 'pending').length;
    const overdue = all.filter((a) => a.status === 'overdue').length;
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

  document.getElementById('asgSearch')?.addEventListener('input', (e) => {
    search = e.target.value;
    page = 1;
    render();
  });
  document.getElementById('asgClassFilter')?.addEventListener('change', (e) => {
    classFilter = e.target.value;
    page = 1;
    render();
  });
  document.getElementById('asgSort')?.addEventListener('change', (e) => {
    sortBy = e.target.value;
    render();
  });

  const addBtn = document.getElementById('addAssignmentBtn') || document.getElementById('createAssignmentBtn');
  addBtn?.addEventListener('click', () => {
    openModal('addAssignmentModal');
    openModal('createAsgModal');
  });

  const form = document.getElementById('addAssignmentForm') || document.getElementById('createAsgForm');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('asgTitle')?.value.trim();
    const subjectSelect = document.getElementById('asgSubject');
    const subjectId = subjectSelect?.value;
    const subject = subjectSelect?.selectedOptions?.[0]?.text || subjectSelect?.value;
    const dueDate = document.getElementById('asgDue')?.value;
    const description = document.getElementById('asgDesc')?.value.trim();
    if (!title || !dueDate) { showToast('Title and due date are required', 'error'); return; }
    addAssignment({ title, subjectId, subject, dueDate, description, status: 'upcoming' });
    closeModal('addAssignmentModal');
    closeModal('createAsgModal');
    form.reset();
    showToast('Assignment created');
    render();
  });

  // Populate subject select if empty
  const subjSelect = document.getElementById('asgSubject');
  if (subjSelect && subjSelect.options.length <= 1) {
    getSubjects().forEach((s) => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = s.name;
      subjSelect.appendChild(opt);
    });
  }

  render();
});

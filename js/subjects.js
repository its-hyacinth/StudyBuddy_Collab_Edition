/**
 * StudyBuddy — Subjects page
 */
document.addEventListener('DOMContentLoaded', () => {
  const session = initShell('student');
  if (!session) return;
  wireModalClosers();

  let selectedId = null;
  const iconBg = (color) => `${color}22`;

  function render() {
    const subjects = getSubjects();
    if (!selectedId && subjects.length) selectedId = subjects[0].id;

    const grid = document.getElementById('subjectGrid');
    if (grid) {
      grid.innerHTML = subjects.map((s) => `
        <div class="subject-card" data-subject-id="${s.id}">
          <div class="subject-card-top">
            <div class="subj-icon" style="background:${iconBg(s.color)};color:${s.color}"><i data-lucide="${s.icon || 'book'}"></i></div>
            <div class="subj-info">
              <h3>${s.name}</h3>
              <p>${s.room || ''} · ${s.professor || ''}</p>
            </div>
            <div class="action-menu-wrap">
              <button type="button" class="action-menu-btn" data-menu="${s.id}"><i data-lucide="more-vertical"></i></button>
              <div class="action-dropdown" id="menu-${s.id}">
                <button type="button" data-delete="${s.id}" class="danger"><i data-lucide="trash-2"></i> Delete</button>
              </div>
            </div>
          </div>
          <div class="progress-row">
            <div class="progress-bar"><div class="fill ${s.short}" style="width:${s.progress}%;background:${s.color}"></div></div>
            <span class="progress-pct">${s.progress}%</span>
          </div>
          <div class="subject-card-stats">
            <div class="ss"><div class="ss-val">${s.assignments}</div><div class="ss-lbl">Assignments</div></div>
            <div class="ss"><div class="ss-val">${s.completed}</div><div class="ss-lbl">Completed</div></div>
            <div class="ss"><div class="ss-val">${s.pending}</div><div class="ss-lbl">Pending</div></div>
          </div>
        </div>`).join('');

      grid.querySelectorAll('.subject-card').forEach((card) => {
        card.addEventListener('click', (e) => {
          if (e.target.closest('.action-menu-wrap')) return;
          selectedId = card.dataset.subjectId;
          renderDetail();
          renderTabs();
        });
      });
      grid.querySelectorAll('[data-menu]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = btn.getAttribute('data-menu');
          document.querySelectorAll('.action-dropdown').forEach((d) => d.classList.remove('open'));
          document.getElementById(`menu-${id}`)?.classList.toggle('open');
        });
      });
      grid.querySelectorAll('[data-delete]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          deleteSubject(btn.getAttribute('data-delete'));
          selectedId = null;
          showToast('Subject deleted', 'warning');
          render();
        });
      });
    }

    renderTabs();
    renderDetail();
    renderOverview();
    renderFacts();
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  function renderTabs() {
    const subjects = getSubjects();
    const tabs = document.getElementById('subjectTabs');
    if (!tabs) return;
    tabs.innerHTML = subjects.map((s) => `
      <button type="button" class="subject-tab ${s.id === selectedId ? 'active' : ''}" data-id="${s.id}">${s.name}</button>
    `).join('');
    tabs.querySelectorAll('.subject-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        selectedId = tab.dataset.id;
        renderTabs();
        renderDetail();
        if (typeof lucide !== 'undefined') lucide.createIcons();
      });
    });
  }

  function renderDetail() {
    const s = getSubjects().find((x) => x.id === selectedId);
    const el = document.getElementById('subjectDetail');
    if (!el || !s) { if (el) el.innerHTML = '<p class="empty-state">Select a subject</p>'; return; }
    const activity = getAssignments().filter((a) => a.subjectId === s.id).slice(0, 4);
    el.innerHTML = `
      <div class="card" style="margin-bottom:0">
        <div style="display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap">
          <div class="subj-icon" style="width:56px;height:56px;border-radius:14px;background:${iconBg(s.color)};color:${s.color};display:flex;align-items:center;justify-content:center">
            <i data-lucide="${s.icon || 'book'}"></i>
          </div>
          <div style="flex:1;min-width:200px">
            <h3 style="font-size:18px;margin-bottom:4px">${s.name}</h3>
            <p style="color:var(--text-muted);font-size:13px;margin-bottom:8px">${s.room} · ${s.professor}</p>
            <p style="font-size:13.5px;color:var(--text-body)">${s.description || ''}</p>
          </div>
        </div>
        <div class="subject-detail-stats">
          <div class="detail-stat-box">
            <div class="ds-val">${s.assignments}</div>
            <div class="ds-lbl">Assignments</div>
            <a href="assignments.html">View All</a>
          </div>
          <div class="detail-stat-box">
            <div class="ds-val">${s.completed}</div>
            <div class="ds-lbl">Completed</div>
            <a href="assignments.html">View Completed</a>
          </div>
          <div class="detail-stat-box">
            <div class="ds-val">${s.pending}</div>
            <div class="ds-lbl">Pending</div>
            <a href="assignments.html">View Pending</a>
          </div>
        </div>
        <h4 style="margin:8px 0 12px;font-size:14px">Recent Activity</h4>
        ${activity.length ? activity.map((a) => `
          <div class="list-item">
            <div class="cell-icon" style="width:32px;height:32px;border-radius:8px;background:${iconBg(s.color)};color:${s.color};display:flex;align-items:center;justify-content:center"><i data-lucide="file-text"></i></div>
            <div class="item-meta">
              <div class="item-title">${a.title}</div>
              <div class="item-sub">${formatDate(a.dueDate)}</div>
            </div>
            <span class="badge ${statusClass(a.status)}">${statusLabel(a.status)}</span>
          </div>`).join('') : '<p style="color:var(--text-muted);font-size:13px">No recent activity.</p>'}
      </div>`;
  }

  function renderOverview() {
    const el = document.getElementById('subjectOverview');
    if (!el) return;
    el.innerHTML = getSubjects().map((s) => `
      <div class="list-item" data-goto="${s.id}">
        <span class="dot" style="background:${s.color}"></span>
        <div class="item-meta">
          <div class="item-title">${s.name}</div>
          <div class="progress-row" style="margin-top:4px">
            <div class="progress-bar"><div class="fill" style="width:${s.progress}%;background:${s.color}"></div></div>
            <span class="progress-pct">${s.progress}%</span>
          </div>
        </div>
        <i data-lucide="chevron-right" class="chevron"></i>
      </div>`).join('');
    el.querySelectorAll('[data-goto]').forEach((row) => {
      row.addEventListener('click', () => {
        selectedId = row.getAttribute('data-goto');
        renderTabs();
        renderDetail();
        if (typeof lucide !== 'undefined') lucide.createIcons();
      });
    });
  }

  function renderFacts() {
    const el = document.getElementById('quickFacts');
    if (!el) return;
    const subjects = getSubjects();
    const asgs = getAssignments();
    const completed = asgs.filter((a) => a.status === 'completed').length;
    const pending = asgs.filter((a) => a.status !== 'completed').length;
    el.innerHTML = `
      <div class="list-item" style="cursor:default"><div class="item-meta"><div class="item-title">Total Subjects</div></div><strong>${subjects.length}</strong></div>
      <div class="list-item" style="cursor:default"><div class="item-meta"><div class="item-title">Total Assignments</div></div><strong>${asgs.length}</strong></div>
      <div class="list-item" style="cursor:default"><div class="item-meta"><div class="item-title">Completed</div></div><strong>${completed}</strong></div>
      <div class="list-item" style="cursor:default"><div class="item-meta"><div class="item-title">Pending</div></div><strong>${pending}</strong></div>
      <div class="tip-footer" style="margin-top:12px;font-style:italic;color:var(--text-muted);font-size:12px">
        <i data-lucide="graduation-cap"></i> Small steps every day lead to big results.
      </div>`;
  }

  document.getElementById('addSubjectBtn')?.addEventListener('click', () => openModal('addSubjectModal'));

  // Color picker
  document.querySelectorAll('.color-swatch').forEach((sw) => {
    sw.addEventListener('click', () => {
      document.querySelectorAll('.color-swatch').forEach((s) => s.classList.remove('selected'));
      sw.classList.add('selected');
      const hidden = document.getElementById('subjectColor');
      if (hidden) hidden.value = sw.dataset.color || '#2563EB';
    });
  });

  document.getElementById('addSubjectForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = (document.getElementById('subjName') || document.getElementById('subjectName'))?.value.trim();
    const room = (document.getElementById('subjRoom') || document.getElementById('subjectRoom'))?.value.trim();
    const professor = (document.getElementById('subjProfessor') || document.getElementById('subjectProfessor'))?.value.trim();
    const description = (document.getElementById('subjDesc') || document.getElementById('subjectDescription'))?.value.trim();
    const color = document.querySelector('.color-swatch.selected')?.dataset.color
      || document.getElementById('subjectColor')?.value
      || '#2563EB';
    const shortMap = { '#2563EB': 'math', '#16A34A': 'science', '#7C3AED': 'english', '#EA580C': 'cs', '#0D9488': 'filipino', '#E11D48': 'history' };
    if (!name) { showToast('Subject name is required', 'error'); return; }
    addSubject({
      name, room, professor, description, color,
      short: shortMap[color] || 'math',
      icon: 'book-open',
    });
    closeModal('addSubjectModal');
    e.target.reset();
    showToast('Subject added successfully');
    render();
  });

  render();
});

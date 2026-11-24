/**
 * StudyBuddy — Subjects page
 */
document.addEventListener('DOMContentLoaded', () => {
  const session = initShell('student');
  if (!session) return;
  wireModalClosers();

  const requestedSubjectId = new URLSearchParams(window.location.search).get('subject');
  let selectedId = requestedSubjectId;
  let showAllSubjects = !requestedSubjectId;
  let assignmentFilter = 'all';
  let subjects = [];
  let assignments = [];
  const iconBg = (color) => `${color}22`;
  const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[character]));
  const isCompleted = (assignment) => String(assignment.status || '').toLowerCase() === 'completed';
  const uniqueAssignments = (list) => {
    const seen = new Set();
    return list.filter((assignment) => {
      const key = assignment.classroomWorkId
        ? `classroom:${assignment.subjectId}:${assignment.classroomWorkId}`
        : assignment.id ? `id:${assignment.id}` : null;
      if (!key) return true;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };
  const assignmentsFor = (subjectId) => {
    const subject = subjects.find((item) => item.id === subjectId);
    return uniqueAssignments(assignments.filter((assignment) =>
      assignment.subjectId === subjectId
      || assignment.classId === subjectId
      || (subject?.classroomId && (assignment.classId === subject.classroomId || assignment.classroomId === subject.classroomId))
      || (!assignment.subjectId && subject && [subject.name, subject.shortName, subject.code].includes(assignment.subject))
    ));
  };

  function selectSubject(id) {
    selectedId = id;
    showAllSubjects = false;
    assignmentFilter = 'all';
    const url = new URL(window.location.href);
    url.searchParams.set('subject', id);
    window.history.replaceState({}, '', url);
    render();
    document.getElementById('subjectDetail')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function setAssignmentFilter(filter, allSubjects = false) {
    assignmentFilter = filter;
    if (allSubjects) {
      showAllSubjects = true;
      const url = new URL(window.location.href);
      url.searchParams.delete('subject');
      window.history.replaceState({}, '', url);
    }
    renderTabs();
    renderDetail();
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  function render() {
    subjects = getSubjects();
    assignments = getAssignments();
    if (!subjects.some((subject) => subject.id === selectedId)) {
      selectedId = subjects[0]?.id || null;
      assignmentFilter = 'all';
      const url = new URL(window.location.href);
      if (requestedSubjectId) showAllSubjects = true;
      if (showAllSubjects) url.searchParams.delete('subject');
      else if (selectedId) url.searchParams.set('subject', selectedId);
      else url.searchParams.delete('subject');
      window.history.replaceState({}, '', url);
    }

    const grid = document.getElementById('subjectGrid');
    if (grid) {
      grid.innerHTML = subjects.length ? subjects.map((s) => {
        const subjectAssignments = assignmentsFor(s.id);
        const completed = subjectAssignments.filter(isCompleted).length;
        const color = /^#[\da-f]{6}$/i.test(s.color || '') ? s.color : '#2563EB';
        const subjectProgress = s.progress === null || s.progress === undefined || s.progress === ''
          ? null
          : Math.min(Math.max(Number(s.progress) || 0, 0), 100);
        const courseDetails = [s.code, s.room, s.professor ? `Prof. ${s.professor}` : ''].filter(Boolean).join(' · ');
        return `
        <div class="subject-card ${!showAllSubjects && s.id === selectedId ? 'is-selected' : ''}" data-subject-id="${escapeHTML(s.id)}" role="button" tabindex="0" aria-pressed="${!showAllSubjects && s.id === selectedId}">
          <div class="subject-card-top">
            <div class="subj-icon" style="background:${iconBg(color)};color:${color}"><i data-lucide="${escapeHTML(s.icon || 'book')}"></i></div>
            <div class="subj-info">
              <h3>${escapeHTML(s.name)}</h3>
              <p>${escapeHTML(courseDetails || 'Details not provided by Google Classroom')}</p>
            </div>
            <div class="action-menu-wrap">
              <button type="button" class="action-menu-btn" data-menu="${escapeHTML(s.id)}"><i data-lucide="more-vertical"></i></button>
              <div class="action-dropdown" id="menu-${escapeHTML(s.id)}">
                <button type="button" data-delete="${escapeHTML(s.id)}" class="danger"><i data-lucide="trash-2"></i> Delete</button>
              </div>
            </div>
          </div>
          ${subjectProgress === null
            ? '<p class="subject-detail-meta">Progress not provided by Google Classroom</p>'
            : `<div class="progress-row">
                <div class="progress-bar"><div class="fill ${escapeHTML(s.short || '')}" style="width:${subjectProgress}%;background:${color}"></div></div>
                <span class="progress-pct">${subjectProgress}%</span>
              </div>`}
          <div class="subject-card-stats">
            <div class="ss"><div class="ss-val">${subjectAssignments.length}</div><div class="ss-lbl">Assignments</div></div>
            <div class="ss"><div class="ss-val">${completed}</div><div class="ss-lbl">Completed</div></div>
            <div class="ss"><div class="ss-val">${subjectAssignments.length - completed}</div><div class="ss-lbl">Pending</div></div>
          </div>
        </div>`;
      }).join('') : '<p class="empty-state">No subjects yet. Add one or sync your Classroom courses.</p>';

      grid.querySelectorAll('.subject-card').forEach((card) => {
        card.addEventListener('click', (e) => {
          if (e.target.closest('.action-menu-wrap')) return;
          selectSubject(card.dataset.subjectId);
        });
        card.addEventListener('keydown', (e) => {
          if (e.target !== card || !['Enter', ' '].includes(e.key)) return;
          e.preventDefault();
          selectSubject(card.dataset.subjectId);
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
          const subject = getSubjects().find((item) => item.id === btn.getAttribute('data-delete'));
          if (!subject) {
            showToast('This subject is no longer available.', 'error');
            render();
            return;
          }
          showDeleteConfirmation('subject', subject.name || 'Untitled subject', () => {
            const current = getSubjects().find((item) => item.id === subject.id);
            if (!current) {
              showToast('This subject is no longer available.', 'error');
              render();
              return;
            }
            deleteSubject(current.id);
            selectedId = null;
            assignmentFilter = 'all';
            showToast('Subject deleted', 'warning');
            render();
          });
        });
      });
    }

    renderTabs();
    renderDetail();
    renderFacts();
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  function renderTabs() {
    const tabs = document.getElementById('subjectTabs');
    if (!tabs) return;
    const subject = subjects.find((item) => item.id === selectedId);
    if (!subject && !showAllSubjects) {
      tabs.innerHTML = '';
      return;
    }

    const allAssignments = uniqueAssignments(assignments);
    const completed = allAssignments.filter(isCompleted).length;
    const filters = [
      { id: 'all', label: 'All Subjects', count: allAssignments.length },
      { id: 'pending', label: 'Pending', count: allAssignments.length - completed },
      { id: 'completed', label: 'Completed', count: completed },
    ];
    tabs.innerHTML = filters.map((filter) => `
      <button type="button" class="subject-tab ${showAllSubjects && filter.id === assignmentFilter ? 'active' : ''}" data-filter="${filter.id}" aria-pressed="${showAllSubjects && filter.id === assignmentFilter}" aria-controls="subjectAssignmentList">
        ${filter.label} <span class="count">${filter.count}</span>
      </button>
    `).join('');
    tabs.querySelectorAll('.subject-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        setAssignmentFilter(tab.dataset.filter, true);
      });
    });
  }

  function renderDetail() {
    const s = subjects.find((x) => x.id === selectedId);
    const el = document.getElementById('subjectDetail');
    if (!el || (!s && !showAllSubjects)) { if (el) el.innerHTML = '<p class="empty-state">Select a subject</p>'; return; }
    const subjectAssignments = showAllSubjects ? uniqueAssignments(assignments) : assignmentsFor(s.id);
    const completed = subjectAssignments.filter(isCompleted).length;
    const pending = subjectAssignments.length - completed;
    const visibleAssignments = subjectAssignments.filter((assignment) => {
      if (assignmentFilter === 'completed') return isCompleted(assignment);
      if (assignmentFilter === 'pending') return !isCompleted(assignment);
      return true;
    });
    const heading = showAllSubjects ? 'All Subjects' : s.name;
    const subjectColor = showAllSubjects || !/^#[\da-f]{6}$/i.test(s?.color || '') ? '#2563EB' : s.color;
    const metadata = showAllSubjects
      ? `${subjects.length} subjects · ${subjectAssignments.length} assignments`
      : [s.code, s.sectionCode, s.units ? `${s.units} units` : '', s.room, s.professor ? `Prof. ${s.professor}` : ''].filter(Boolean).join(' · ');
    el.innerHTML = `
      <div class="card-header">
        <div class="card-header-left">
          <div class="card-icon" style="background:${iconBg(subjectColor)};color:${subjectColor}"><i data-lucide="${showAllSubjects ? 'book-open' : escapeHTML(s.icon || 'book')}"></i></div>
          <div>
            <h2 class="card-title">${escapeHTML(heading)}</h2>
            <p class="subject-detail-meta">${escapeHTML(metadata)}</p>
          </div>
        </div>
      </div>
      ${showAllSubjects ? '<p class="subject-detail-description">Assignments from all of your subjects.</p>' : s.description ? `<p class="subject-detail-description">${escapeHTML(s.description)}</p>` : ''}
      <div class="subject-detail-stats">
        <button type="button" class="detail-stat-box ${assignmentFilter === 'all' ? 'is-active' : ''}" data-assignment-filter="all" aria-pressed="${assignmentFilter === 'all'}" aria-controls="subjectAssignmentList">
          <div class="ds-val">${subjectAssignments.length}</div>
          <div class="ds-lbl">Assignments</div>
        </button>
        <button type="button" class="detail-stat-box ${assignmentFilter === 'completed' ? 'is-active' : ''}" data-assignment-filter="completed" aria-pressed="${assignmentFilter === 'completed'}" aria-controls="subjectAssignmentList">
          <div class="ds-val">${completed}</div>
          <div class="ds-lbl">Completed</div>
        </button>
        <button type="button" class="detail-stat-box ${assignmentFilter === 'pending' ? 'is-active' : ''}" data-assignment-filter="pending" aria-pressed="${assignmentFilter === 'pending'}" aria-controls="subjectAssignmentList">
          <div class="ds-val">${pending}</div>
          <div class="ds-lbl">Pending</div>
        </button>
      </div>
      <h3 class="subject-assignments-heading">Assignments</h3>
      <div class="subject-assignment-list" id="subjectAssignmentList" aria-live="polite">
        ${visibleAssignments.length ? visibleAssignments.map((assignment) => {
          const status = assignment.status || 'pending';
          const assignmentSubject = subjects.find((subject) => subject.id === assignment.subjectId);
          const subjectName = assignment.subject || assignmentSubject?.name || 'Unassigned';
          const assignmentColor = showAllSubjects ? assignmentSubject?.color || '#2563EB' : s.color;
          return `
          <div class="list-item">
            <div class="cell-icon" style="width:32px;height:32px;border-radius:8px;background:${iconBg(assignmentColor)};color:${assignmentColor};display:flex;align-items:center;justify-content:center"><i data-lucide="file-text"></i></div>
            <div class="item-meta">
              <div class="item-title">${escapeHTML(assignment.title)}</div>
              <div class="item-sub">${showAllSubjects ? `${escapeHTML(subjectName)} · ` : ''}${assignment.dueDate ? `Due ${formatDate(assignment.dueDate)}` : 'No due date'}</div>
            </div>
            <span class="badge ${statusClass(status)}">${statusLabel(status)}</span>
          </div>`;
        }).join('') : `<p class="subject-assignments-empty">No ${assignmentFilter === 'all' ? '' : `${assignmentFilter} `}assignments ${showAllSubjects ? 'across your subjects' : 'for this subject'}.</p>`}
      </div>`;
    el.querySelectorAll('[data-assignment-filter]').forEach((button) => {
      button.addEventListener('click', () => setAssignmentFilter(button.dataset.assignmentFilter, showAllSubjects));
    });
  }

  function renderFacts() {
    const el = document.getElementById('quickFacts');
    if (!el) return;
    const asgs = assignments;
    const allAssignments = uniqueAssignments(asgs);
    const completed = allAssignments.filter(isCompleted).length;
    const pending = allAssignments.length - completed;
    el.innerHTML = `
      <div class="list-item" role="button" tabindex="0" aria-haspopup="dialog" aria-controls="quickFactModal" data-quick-fact="subjects"><div class="item-meta"><div class="item-title">Total Subjects</div></div><strong>${subjects.length}</strong></div>
      <div class="list-item" role="button" tabindex="0" aria-haspopup="dialog" aria-controls="quickFactModal" data-quick-fact="assignments"><div class="item-meta"><div class="item-title">Total Assignments</div></div><strong>${allAssignments.length}</strong></div>
      <div class="list-item" role="button" tabindex="0" aria-haspopup="dialog" aria-controls="quickFactModal" data-quick-fact="completed"><div class="item-meta"><div class="item-title">Completed</div></div><strong>${completed}</strong></div>
      <div class="list-item" role="button" tabindex="0" aria-haspopup="dialog" aria-controls="quickFactModal" data-quick-fact="pending"><div class="item-meta"><div class="item-title">Pending</div></div><strong>${pending}</strong></div>
    `;
  }

  function showQuickFact(type) {
    const title = document.getElementById('quickFactTitle');
    const content = document.getElementById('quickFactContent');
    if (!title || !content) return;

    const allAssignments = uniqueAssignments(assignments);
    const completedAssignments = allAssignments.filter(isCompleted);
    const facts = {
      subjects: {
        title: 'Total Subjects',
        description: 'All subjects currently saved to your account.',
        items: subjects.map((subject) => {
          const details = [subject.code, subject.room, subject.professor].filter(Boolean).map(escapeHTML).join(' · ');
          return `<div class="list-item" style="cursor:default"><div class="item-meta"><div class="item-title">${escapeHTML(subject.name || 'Untitled subject')}</div><div class="item-sub">${details || 'No additional details'}</div></div></div>`;
        }),
        empty: 'No subjects have been added yet.',
      },
      assignments: {
        title: 'Total Assignments',
        description: 'All assignments across your subjects. Duplicate Classroom entries are counted once.',
        items: allAssignments,
        empty: 'There are no assignments yet.',
      },
      completed: {
        title: 'Completed Assignments',
        description: 'Assignments marked as completed.',
        items: completedAssignments,
        empty: 'There are no completed assignments yet.',
      },
      pending: {
        title: 'Pending Assignments',
        description: 'Assignments not marked as completed.',
        items: allAssignments.filter((assignment) => !isCompleted(assignment)),
        empty: 'There are no pending assignments.',
      },
    }[type];
    if (!facts) return;

    title.textContent = facts.title;
    const items = type === 'subjects' ? facts.items : facts.items.map((assignment) => {
      const linkedSubject = subjects.find((subject) =>
        assignment.subjectId === subject.id
        || assignment.classId === subject.id
        || (subject.classroomId && (assignment.classId === subject.classroomId || assignment.classroomId === subject.classroomId))
      );
      const subjectName = assignment.subject || linkedSubject?.name || 'Unassigned';
      const status = statusLabel(assignment.status || 'pending');
      const dueDate = assignment.dueDate ? `Due ${formatDate(assignment.dueDate)}` : 'No due date';
      return `<div class="list-item" style="cursor:default"><div class="item-meta"><div class="item-title">${escapeHTML(assignment.title || 'Untitled assignment')}</div><div class="item-sub">${escapeHTML(subjectName)} · ${escapeHTML(dueDate)} · ${escapeHTML(status)}</div></div></div>`;
    });
    content.innerHTML = `<p style="margin-bottom:12px;color:var(--text-muted);font-size:13px">${facts.description}</p>${items.length ? items.join('') : `<p class="subject-assignments-empty">${facts.empty}</p>`}`;
    openModal('quickFactModal');
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  document.getElementById('quickFacts')?.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-quick-fact]');
    if (trigger) showQuickFact(trigger.dataset.quickFact);
  });
  document.getElementById('quickFacts')?.addEventListener('keydown', (event) => {
    const trigger = event.target.closest('[data-quick-fact]');
    if (!trigger || !['Enter', ' '].includes(event.key)) return;
    event.preventDefault();
    showQuickFact(trigger.dataset.quickFact);
  });

  document.getElementById('addSubjectBtn')?.addEventListener('click', () => openModal('addSubjectModal'));
  document.getElementById('syncClassroomBtn')?.addEventListener('click', async (e) => {
    const result = await syncGoogleClassroom(e.currentTarget);
    if (result?.ok) render();
  });
  document.querySelectorAll('[data-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const routes = {
        'add-assignment': 'assignments.php',
        'add-task': 'todo.php',
        'view-schedule': 'schedule.php',
        'open-drive': 'drive.php',
      };
      if (routes[button.dataset.action]) window.location.href = routes[button.dataset.action];
    });
  });

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

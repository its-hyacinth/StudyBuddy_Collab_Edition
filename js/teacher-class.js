document.addEventListener('DOMContentLoaded', () => {
  const session = initShell('teacher');
  if (!session) return;
  wireModalClosers();

  const classId = new URLSearchParams(window.location.search).get('id') || '';
  const escapeHtml = (str) => String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));

  function currentClass() {
    return getClasses().find((item) => item.id === classId) || null;
  }

  function ensureCode(cls) {
    if (cls.joinCode) return cls;
    const list = getClasses();
    const index = list.findIndex((item) => item.id === cls.id);
    if (index === -1) return cls;
    list[index] = { ...list[index], joinCode: makeJoinCode() };
    sbSet(SB_KEYS.CLASSES, list);
    return list[index];
  }

  function render() {
    let cls = currentClass();
    if (!cls) {
      document.getElementById('classTitle').textContent = 'Class not found';
      document.getElementById('classMeta').textContent = 'This class is not on your list.';
      return;
    }
    cls = ensureCode(cls);
    document.title = `StudyBuddy — ${cls.name || 'Class'}`;
    document.getElementById('classTitle').textContent = cls.name || 'Class';
    document.getElementById('classMeta').textContent = [classBlockLabel(cls), classSubjectCode(cls), cls.subject].filter(Boolean).join(' · ');
    document.getElementById('joinCode').textContent = cls.joinCode;
    const edit = document.getElementById('editClassLink');
    if (edit) {
      const id = encodeURIComponent(cls.id);
      edit.href = `classes.php?edit=${id}&returnClass=${id}`;
    }

    const roster = classRoster(cls, getStudents(), true);
    document.getElementById('peopleCount').textContent = `${roster.length} student${roster.length === 1 ? '' : 's'}`;
    document.getElementById('peopleList').innerHTML = roster.length
      ? roster.map((student) => `
        <div class="list-item">
          <div class="item-meta">
            <div class="item-title">${escapeHtml(student.name || 'Student')}</div>
            <div class="item-sub">${escapeHtml([student.email, student.standing === 'irregular' ? 'Irregular' : ''].filter(Boolean).join(' · '))}</div>
          </div>
        </div>`).join('')
      : '<p class="empty-state">No students in this class yet. Add one, or share the class code.</p>';

    const activities = getAssignments()
      .filter((item) => item.classId === cls.id)
      .sort((a, b) => String(b.dueDate || '').localeCompare(String(a.dueDate || '')));
    document.getElementById('activityList').innerHTML = activities.length
      ? activities.map((item) => `
        <div class="list-item">
          <div class="item-meta">
            <div class="item-title">${escapeHtml(item.title || 'Assignment')}</div>
            <div class="item-sub">${escapeHtml([item.dueDate ? formatDate(item.dueDate) : 'No deadline', item.points ? `${item.points} pts` : '', item.status || ''].filter(Boolean).join(' · '))}</div>
          </div>
        </div>`).join('')
      : '<p class="empty-state">No assignments for this class yet. Create one and choose this class.</p>';

    const details = [
      ['Subject code', classSubjectCode(cls) || '—'],
      ['Course', cls.course || '—'],
      ['Year', yearLevelLabel(cls.year) || '—'],
      ['Block', cls.block || '—'],
      ['Room', cls.room || 'TBA'],
      ['Schedule', [cls.schedule, cls.startTime, cls.endTime].filter(Boolean).join(' · ') || 'Not set'],
      ['Description', cls.description || 'No description provided.'],
    ];
    document.getElementById('classDetails').innerHTML = details.map(([label, value]) =>
      `<p style="margin:0 0 10px"><strong>${escapeHtml(label)}</strong><br>${escapeHtml(value)}</p>`
    ).join('');
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  document.getElementById('copyCodeBtn')?.addEventListener('click', async () => {
    const code = document.getElementById('joinCode')?.textContent || '';
    try {
      await navigator.clipboard.writeText(code);
      showToast('Class code copied');
    } catch {
      showToast(code, 'success');
    }
  });

  document.getElementById('regenCodeBtn')?.addEventListener('click', () => {
    const list = getClasses();
    const index = list.findIndex((item) => item.id === classId);
    if (index === -1) return;
    list[index] = { ...list[index], joinCode: makeJoinCode() };
    sbSet(SB_KEYS.CLASSES, list);
    showToast('New class code ready. The previous code no longer works.');
    render();
  });

  document.getElementById('addStudentBtn')?.addEventListener('click', () => openModal('addStudentModal'));
  document.getElementById('addStudentForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = event.target.querySelector('button[type="submit"]');
    const name = document.getElementById('studentName').value.trim();
    const email = document.getElementById('studentEmail').value.trim();
    if (button) button.disabled = true;
    try {
      const response = await fetch('../api/enroll.php', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.content || '',
        },
        body: JSON.stringify({ classId, name, email }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) {
        showToast(result.message || 'Could not add that student', 'error');
        return;
      }
      sbInvalidate(SB_KEYS.STUDENTS);
      closeModal('addStudentModal');
      event.target.reset();
      showToast(result.message || 'Student added');
      render();
    } catch {
      showToast('Could not add that student', 'error');
    } finally {
      if (button) button.disabled = false;
    }
  });

  render();
  sbWhenReady(render);
});

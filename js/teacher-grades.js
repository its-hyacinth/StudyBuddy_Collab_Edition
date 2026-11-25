/**
 * StudyBuddy — Teacher Grades
 */
document.addEventListener('DOMContentLoaded', () => {
  const session = initShell('teacher');
  if (!session) return;

  let classFilter = '';
  let statusFilter = '';
  let search = '';
  const requestedGradeId = new URLSearchParams(window.location.search).get('grade');

  function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  const gradeClassFilter = document.getElementById('gradeClassFilter');
  if (gradeClassFilter) {
    gradeClassFilter.innerHTML = '<option value="">All Classes</option>' + getClasses().map((cls) =>
      `<option value="${escapeHtml(cls.id)}">${escapeHtml(classDisplayName(cls))}</option>`
    ).join('');
  }

  function render() {
    let grades = getGrades();
    if (classFilter) {
      const cls = getClasses().find((item) => item.id === classFilter);
      const labels = new Set([
        cls?.name, cls?.subject, classDisplayName(cls), classSubjectCode(cls),
      ].filter(Boolean));
      grades = grades.filter((grade) => grade.classId === classFilter || labels.has(grade.class));
    }
    if (statusFilter) grades = grades.filter((grade) => grade.status === statusFilter);
    if (search) {
      const query = search.toLowerCase();
      grades = grades.filter((grade) =>
        [grade.student, grade.assignment, grade.class].some((value) => String(value || '').toLowerCase().includes(query))
      );
    }
    if (requestedGradeId) grades = grades.filter((grade) => String(grade.id) === requestedGradeId);

    const all = getGrades();
    const vals = document.querySelectorAll('.stat-grid .stat-value');
    if (vals[0]) vals[0].textContent = all.length;
    if (vals[1]) vals[1].textContent = all.filter((g) => g.status === 'graded').length;
    if (vals[2]) vals[2].textContent = all.filter((g) => g.status === 'pending').length;
    const graded = all.filter((g) => g.score != null);
    const avg = graded.length ? Math.round(graded.reduce((s, g) => s + (g.score / g.max) * 100, 0) / graded.length) : 0;
    if (vals[3]) vals[3].textContent = avg + '%';

    const tbody = document.querySelector('#gradesTable tbody') || document.getElementById('gradesTableBody');
    if (tbody) {
      tbody.innerHTML = grades.map((g) => `
        <tr data-id="${escapeHtml(g.id)}">
          <td>${escapeHtml(g.student)}</td>
          <td>${escapeHtml(g.assignment)}</td>
          <td>${escapeHtml(g.class)}</td>
          <td>
            ${g.status === 'pending'
              ? `<input type="number" class="form-control score-input" data-id="${escapeHtml(g.id)}" min="0" max="${Number(g.max) || 0}" placeholder="0–${Number(g.max) || 0}" style="height:36px;width:90px" />`
              : `<strong>${escapeHtml(g.score)}</strong>`}
          </td>
          <td>${escapeHtml(g.max)}</td>
          <td><span class="badge ${statusClass(g.status)}">${statusLabel(g.status)}</span></td>
          <td>${g.submission?.gradeId
            ? `<a href="../api/submissions.php?file=${encodeURIComponent(g.submission.gradeId)}">${escapeHtml(g.submission.fileName || 'Download file')}</a><div class="subtitle">${escapeHtml(g.submission.submittedAt ? new Date(g.submission.submittedAt).toLocaleString() : '')}</div>`
            : '—'}</td>
          <td>
            ${g.status === 'pending'
              ? `<button type="button" class="btn btn-sm btn-primary" data-save="${escapeHtml(g.id)}">Save</button>`
              : `<button type="button" class="btn btn-sm btn-ghost" data-edit="${escapeHtml(g.id)}">Edit</button>`}
          </td>
        </tr>`).join('');

      tbody.querySelectorAll('[data-save]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.save;
          const input = tbody.querySelector(`.score-input[data-id="${id}"]`);
          const value = input?.value.trim() || '';
          const score = Number(value);
          const g = getGrades().find((x) => x.id === id);
          if (!g || value === '' || !Number.isFinite(score) || score < 0 || score > Number(g.max)) {
            showToast('Enter a score between 0 and the maximum points.', 'error');
            return;
          }
          updateGrade(id, { score, status: 'graded', gradedAt: new Date().toISOString() });
          showToast('Grade saved');
          render();
        });
      });
      tbody.querySelectorAll('[data-edit]').forEach((btn) => {
        btn.addEventListener('click', () => {
          updateGrade(btn.dataset.edit, { status: 'pending', score: null, gradedAt: null });
          render();
        });
      });
    }

    const pending = document.getElementById('pendingGradingList');
    if (pending) {
      pending.innerHTML = getGrades().filter((g) => g.status === 'pending').map((g) => `
        <div class="list-item">
          <div class="item-meta"><div class="item-title">${escapeHtml(g.student)}</div>
          <div class="item-sub">${escapeHtml(g.assignment)} · ${escapeHtml(g.class)}</div></div>
          <span class="badge badge-pending">Pending</span>
        </div>`).join('') || '<p style="color:var(--text-muted);font-size:13px">All caught up!</p>';
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  document.getElementById('gradeClassFilter')?.addEventListener('change', (e) => {
    classFilter = e.target.value;
    render();
  });
  document.getElementById('gradeStatusFilter')?.addEventListener('change', (e) => {
    statusFilter = e.target.value;
    render();
  });
  document.getElementById('gradeSearch')?.addEventListener('input', (e) => {
    search = e.target.value.trim();
    render();
  });

  render();
  sbWhenReady(() => {
    render();
    if (requestedGradeId) {
      const tbody = document.querySelector('#gradesTable tbody') || document.getElementById('gradesTableBody');
      [...(tbody?.querySelectorAll('tr') || [])]
        .find((row) => row.dataset.id === requestedGradeId)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
});

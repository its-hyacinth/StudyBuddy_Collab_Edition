/**
 * StudyBuddy — Teacher Grades
 */
document.addEventListener('DOMContentLoaded', () => {
  const session = initShell('teacher');
  if (!session) return;

  let classFilter = 'all';

  function render() {
    let grades = getGrades();
    if (classFilter !== 'all') grades = grades.filter((g) => g.class === classFilter);

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
        <tr data-id="${g.id}">
          <td>${g.student}</td>
          <td>${g.assignment}</td>
          <td>${g.class}</td>
          <td>
            ${g.status === 'pending'
              ? `<input type="number" class="form-control score-input" data-id="${g.id}" min="0" max="${g.max}" placeholder="0–${g.max}" style="height:36px;width:90px" />`
              : `<strong>${g.score}</strong> / ${g.max}`}
          </td>
          <td><span class="badge ${statusClass(g.status)}">${statusLabel(g.status)}</span></td>
          <td>
            ${g.status === 'pending'
              ? `<button type="button" class="btn btn-sm btn-primary" data-save="${g.id}">Save</button>`
              : `<button type="button" class="btn btn-sm btn-ghost" data-edit="${g.id}">Edit</button>`}
          </td>
        </tr>`).join('');

      tbody.querySelectorAll('[data-save]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.save;
          const input = tbody.querySelector(`.score-input[data-id="${id}"]`);
          const score = Number(input?.value);
          const g = getGrades().find((x) => x.id === id);
          if (!g || Number.isNaN(score)) { showToast('Enter a valid score', 'error'); return; }
          updateGrade(id, { score, status: 'graded' });
          showToast('Grade saved');
          render();
        });
      });
      tbody.querySelectorAll('[data-edit]').forEach((btn) => {
        btn.addEventListener('click', () => {
          updateGrade(btn.dataset.edit, { status: 'pending', score: null });
          render();
        });
      });
    }

    const pending = document.getElementById('pendingGradingList');
    if (pending) {
      pending.innerHTML = getGrades().filter((g) => g.status === 'pending').map((g) => `
        <div class="list-item">
          <div class="item-meta"><div class="item-title">${g.student}</div>
          <div class="item-sub">${g.assignment} · ${g.class}</div></div>
          <span class="badge badge-pending">Pending</span>
        </div>`).join('') || '<p style="color:var(--text-muted);font-size:13px">All caught up!</p>';
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  document.getElementById('gradeClassFilter')?.addEventListener('change', (e) => {
    classFilter = e.target.value;
    render();
  });

  render();
});

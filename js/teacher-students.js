/**
 * StudyBuddy — Teacher Students
 */
document.addEventListener('DOMContentLoaded', () => {
  const session = initShell('teacher');
  if (!session) return;
  wireModalClosers();

  let search = '';
  let statusFilter = 'all';

  function render() {
    let list = getStudents();
    if (statusFilter !== 'all') list = list.filter((s) => s.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((s) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || s.course.toLowerCase().includes(q));
    }

    const all = getStudents();
    const vals = document.querySelectorAll('.stat-grid .stat-value');
    if (vals[0]) vals[0].textContent = all.length;
    if (vals[1]) vals[1].textContent = all.filter((s) => s.status === 'active').length;
    if (vals[2]) vals[2].textContent = (all.reduce((s, st) => s + st.gpa, 0) / (all.length || 1)).toFixed(1);
    if (vals[3]) vals[3].textContent = [...new Set(all.map((s) => s.course))].length;

    const tbody = document.querySelector('#studentsTable tbody') || document.getElementById('studentsTableBody');
    if (tbody) {
      tbody.innerHTML = list.map((s) => `
        <tr>
          <td>
            <div class="cell-title">
              <div class="avatar" style="width:36px;height:36px;border-radius:50%;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:12px">
                ${s.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
              </div>
              <div><div class="title">${s.name}</div><div class="subtitle">${s.email}</div></div>
            </div>
          </td>
          <td>${s.course}</td>
          <td>${s.year}</td>
          <td><strong>${s.gpa}</strong></td>
          <td><span class="badge ${statusClass(s.status)}">${statusLabel(s.status)}</span></td>
        </tr>`).join('');
    }

    const overview = document.getElementById('studentsOverview');
    if (overview) {
      overview.innerHTML = all.slice(0, 5).map((s) => `
        <div class="list-item">
          <div class="item-meta"><div class="item-title">${s.name}</div><div class="item-sub">${s.course} · GPA ${s.gpa}</div></div>
          <span class="badge ${statusClass(s.status)}">${statusLabel(s.status)}</span>
        </div>`).join('');
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  document.getElementById('studentSearch')?.addEventListener('input', (e) => { search = e.target.value; render(); });
  document.getElementById('studentStatusFilter')?.addEventListener('change', (e) => { statusFilter = e.target.value; render(); });
  document.getElementById('addStudentBtn')?.addEventListener('click', () => openModal('addStudentModal'));

  document.getElementById('addStudentForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('stuName')?.value.trim();
    const email = document.getElementById('stuEmail')?.value.trim();
    const course = document.getElementById('stuCourse')?.value.trim() || 'BSIT';
    const year = document.getElementById('stuYear')?.value.trim() || '1st Year';
    if (!name || !email) { showToast('Name and email required', 'error'); return; }
    const list = getStudents();
    list.push({ id: uid('stu'), name, email, course, year, gpa: 0, status: 'active' });
    sbSet(SB_KEYS.STUDENTS, list);
    closeModal('addStudentModal');
    e.target.reset();
    showToast('Student added');
    render();
  });

  render();
});

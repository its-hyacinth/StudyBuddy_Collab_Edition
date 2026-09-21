/**
 * StudyBuddy — Teacher Resources
 */
document.addEventListener('DOMContentLoaded', () => {
  const session = initShell('teacher');
  if (!session) return;
  wireModalClosers();

  let classFilter = 'all';
  let typeFilter = 'all';

  const typeIcon = { pdf: 'file', doc: 'file-text', zip: 'archive', slide: 'presentation' };

  function render() {
    let list = getResources();
    if (classFilter !== 'all') list = list.filter((r) => r.class === classFilter);
    if (typeFilter !== 'all') list = list.filter((r) => r.type === typeFilter);

    const vals = document.querySelectorAll('.stat-grid .stat-value');
    const all = getResources();
    if (vals[0]) vals[0].textContent = all.length;
    if (vals[1]) vals[1].textContent = all.filter((r) => r.type === 'pdf').length;
    if (vals[2]) vals[2].textContent = [...new Set(all.map((r) => r.class))].length;

    const tbody = document.querySelector('#resourcesTable tbody') || document.getElementById('resourcesTableBody');
    if (tbody) {
      tbody.innerHTML = list.map((r) => `
        <tr>
          <td>
            <div class="cell-title">
              <div class="file-icon ${r.type === 'doc' ? 'doc' : r.type === 'slide' ? 'slide' : r.type === 'pdf' ? 'pdf' : 'folder'}">
                <i data-lucide="${typeIcon[r.type] || 'file'}"></i>
              </div>
              <div><div class="title">${r.title}</div><div class="subtitle">${r.type.toUpperCase()}</div></div>
            </div>
          </td>
          <td>${r.class}</td>
          <td>${r.size}</td>
          <td>${formatDate(r.uploaded)}</td>
          <td>
            <button type="button" class="btn btn-sm btn-ghost" data-open="${r.id}"><i data-lucide="external-link"></i></button>
            <button type="button" class="btn btn-sm btn-ghost danger" data-delete="${r.id}"><i data-lucide="trash-2"></i></button>
          </td>
        </tr>`).join('');

      tbody.querySelectorAll('[data-open]').forEach((btn) => {
        btn.addEventListener('click', () => showToast('Opening resource (mock) — would fetch from Drive', 'info'));
      });
      tbody.querySelectorAll('[data-delete]').forEach((btn) => {
        btn.addEventListener('click', () => {
          sbSet(SB_KEYS.RESOURCES, getResources().filter((r) => r.id !== btn.dataset.delete));
          showToast('Resource removed', 'warning');
          render();
        });
      });
    }

    const recent = document.getElementById('recentResources');
    if (recent) {
      recent.innerHTML = all.slice(0, 4).map((r) => `
        <div class="list-item">
          <div class="file-icon pdf"><i data-lucide="${typeIcon[r.type] || 'file'}"></i></div>
          <div class="item-meta"><div class="item-title">${r.title}</div><div class="item-sub">${r.class}</div></div>
        </div>`).join('');
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  document.getElementById('resourceClassFilter')?.addEventListener('change', (e) => { classFilter = e.target.value; render(); });
  document.getElementById('resourceTypeFilter')?.addEventListener('change', (e) => { typeFilter = e.target.value; render(); });
  document.getElementById('uploadResourceBtn')?.addEventListener('click', () => openModal('uploadResourceModal'));

  document.getElementById('uploadResourceForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('resTitle')?.value.trim();
    const cls = document.getElementById('resClass')?.value || 'General';
    const type = document.getElementById('resType')?.value || 'pdf';
    if (!title) { showToast('Title required', 'error'); return; }
    const list = getResources();
    list.unshift({
      id: uid('res'), title, class: cls, type, size: '1.0 MB', uploaded: '2025-09-12',
    });
    sbSet(SB_KEYS.RESOURCES, list);
    closeModal('uploadResourceModal');
    e.target.reset();
    showToast('Resource uploaded (mock)');
    render();
  });

  render();
});

/**
 * StudyBuddy — Teacher Resources
 */
document.addEventListener('DOMContentLoaded', () => {
  const session = initShell('teacher');
  if (!session) return;
  wireModalClosers();

  let classFilter = 'all';
  let typeFilter = 'all';

  const typeIcon = { pdf: 'file', doc: 'file-text', zip: 'archive', slide: 'presentation', image: 'image' };

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[char]));
  }

  function resourceType(file) {
    const extension = file.name.split('.').pop().toLowerCase();
    if (['doc', 'docx', 'txt'].includes(extension)) return 'doc';
    if (['ppt', 'pptx'].includes(extension)) return 'slide';
    if (extension === 'zip') return 'zip';
    if (['png', 'jpg', 'jpeg'].includes(extension)) return 'image';
    return 'pdf';
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

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
              <div><div class="title">${escapeHtml(r.title)}</div><div class="subtitle">${escapeHtml(r.type.toUpperCase())}</div></div>
            </div>
          </td>
          <td>${escapeHtml(r.class)}</td>
          <td><span class="badge badge-info">${escapeHtml(r.type.toUpperCase())}</span></td>
          <td>${escapeHtml(r.size)}</td>
          <td>${escapeHtml(formatDate(r.uploaded))}</td>
          <td>${Number(r.downloads) || 0}</td>
          <td>
            <button type="button" class="btn btn-sm btn-ghost" data-open="${escapeHtml(r.id)}" aria-label="Open ${escapeHtml(r.title)}"><i data-lucide="external-link"></i></button>
            <button type="button" class="btn btn-sm btn-ghost danger" data-delete="${escapeHtml(r.id)}" aria-label="Delete ${escapeHtml(r.title)}"><i data-lucide="trash-2"></i></button>
          </td>
        </tr>`).join('');

      tbody.querySelectorAll('[data-open]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const resource = getResources().find((item) => item.id === btn.dataset.open);
          if (!resource?.url) {
            showToast('This resource has no uploaded file. Upload it again to view it.', 'error');
            return;
          }
          window.open(resource.url, '_blank', 'noopener');
        });
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
          <div class="item-meta"><div class="item-title">${escapeHtml(r.title)}</div><div class="item-sub">${escapeHtml(r.class)}</div></div>
        </div>`).join('');
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  document.getElementById('resourceClassFilter')?.addEventListener('change', (e) => { classFilter = e.target.value; render(); });
  document.getElementById('resourceTypeFilter')?.addEventListener('change', (e) => { typeFilter = e.target.value; render(); });
  document.getElementById('uploadResourceBtn')?.addEventListener('click', () => openModal('uploadResourceModal'));

  document.getElementById('uploadResourceForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('resourceTitle')?.value.trim();
    const cls = document.getElementById('resourceClass')?.value || 'General';
    const file = document.getElementById('resourceFile')?.files?.[0];
    if (!title) { showToast('Title required', 'error'); return; }
    if (!file) { showToast('Choose a file to upload.', 'error'); return; }

    const button = document.getElementById('saveResourceBtn');
    if (button) button.disabled = true;
    try {
      const body = new FormData();
      body.append('file', file);
      const response = await fetch('../api/upload.php', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.content || '' },
        body,
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.ok) {
        throw new Error(result?.message || 'Unable to upload resource file.');
      }

      const list = getResources();
      list.unshift({
        id: uid('res'),
        title,
        class: cls,
        type: resourceType(file),
        size: formatBytes(file.size),
        uploaded: localDateStr(),
        downloads: 0,
        fileName: result.name,
        url: `../${result.url}`,
      });
      sbSet(SB_KEYS.RESOURCES, list);
      closeModal('uploadResourceModal');
      e.target.reset();
      showToast('Resource uploaded');
      render();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Resource upload failed.', 'error');
    } finally {
      if (button) button.disabled = false;
    }
  });

  render();
});

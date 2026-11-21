/**
 * StudyBuddy — Google Drive mock
 */
document.addEventListener('DOMContentLoaded', () => {
  const session = initShell('student');
  if (!session) return;
  wireModalClosers();

  let tab = 'my-drive';
  let search = '';
  let page = 1;
  const perPage = 8;
  let currentFolderId = null;
  const selectedIds = new Set();

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[char]));
  }

  function filtered() {
    let list = getDriveFiles();
    if (tab === 'trash') list = list.filter((f) => f.trashed);
    else list = list.filter((f) => !f.trashed);
    if (tab === 'shared') list = list.filter((f) => f.shared);
    if (tab === 'starred') list = list.filter((f) => f.starred);
    if (tab === 'recent') {
      list = [...list].sort((a, b) => String(b.modified || '').localeCompare(String(a.modified || ''))).slice(0, 8);
    } else if (tab === 'my-drive') {
      list = list.filter((f) => (f.parentId || null) === currentFolderId);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((f) => String(f.name || '').toLowerCase().includes(q));
    }
    return list;
  }

  const typeIcon = { folder: 'folder', doc: 'file-text', sheet: 'table', slide: 'presentation', pdf: 'file', image: 'image' };
  const typeFromFile = (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    if (['doc', 'docx', 'txt'].includes(ext)) return 'doc';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return 'sheet';
    if (['ppt', 'pptx'].includes(ext)) return 'slide';
    if (['png', 'jpg', 'jpeg'].includes(ext)) return 'image';
    return 'pdf';
  };
  const formatBytes = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  const mutateFile = (id, patch) => {
    sbSet(SB_KEYS.DRIVE, getDriveFiles().map((file) => file.id === id ? { ...file, ...patch } : file));
  };

  function renderTable() {
    const list = filtered();
    const pages = Math.max(1, Math.ceil(list.length / perPage));
    page = Math.min(page, pages);
    const start = (page - 1) * perPage;
    const slice = list.slice(start, start + perPage);
    const tbody = document.querySelector('#driveTable tbody') || document.getElementById('driveTableBody');
    const rows = slice.map((f) => `
      <tr data-id="${escapeHtml(f.id)}" data-type="${escapeHtml(f.type)}">
        <td><label class="custom-check"><input type="checkbox" data-select="${escapeHtml(f.id)}" aria-label="Select ${escapeHtml(f.name)}" ${selectedIds.has(f.id) ? 'checked' : ''} /><span class="box"></span></label></td>
        <td>
          <div class="cell-title" style="cursor:pointer" data-open="${escapeHtml(f.id)}" role="button" tabindex="0">
            <div class="file-icon ${f.type}"><i data-lucide="${typeIcon[f.type] || 'file'}"></i></div>
            <div><div class="title">${escapeHtml(f.name)}</div></div>
          </div>
        </td>
        <td>${escapeHtml(f.owner || 'Me')}</td>
        <td>${escapeHtml(f.modified ? formatDate(f.modified) : '—')}</td>
        <td>${escapeHtml(f.size || '—')}</td>
        <td>
          <div class="action-menu-wrap">
            <button type="button" class="action-menu-btn" data-menu="${escapeHtml(f.id)}" aria-label="Actions for ${escapeHtml(f.name)}"><i data-lucide="more-vertical"></i></button>
            <div class="action-dropdown" id="dmenu-${escapeHtml(f.id)}">
              ${f.trashed
                ? `<button type="button" data-restore="${escapeHtml(f.id)}"><i data-lucide="rotate-ccw"></i> Restore</button>`
                : `<button type="button" data-star="${escapeHtml(f.id)}"><i data-lucide="${f.starred ? 'star-off' : 'star'}"></i> ${f.starred ? 'Remove star' : 'Add star'}</button>
                   <button type="button" data-trash="${escapeHtml(f.id)}" class="danger"><i data-lucide="trash-2"></i> Move to trash</button>`}
              ${f.url ? `<a href="${escapeHtml(f.url)}" target="_blank" rel="noopener"><i data-lucide="external-link"></i> Open file</a>` : ''}
            </div>
          </div>
        </td>
      </tr>`).join('');

    if (tbody) tbody.innerHTML = rows || '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-muted)">No files found.</td></tr>';

    document.querySelectorAll('[data-open]').forEach((el) => {
      const open = () => {
        const file = getDriveFiles().find((item) => item.id === el.dataset.open);
        if (!file) return;
        if (file.type === 'folder') {
          currentFolderId = file.id;
          page = 1;
          render();
        } else if (file.url) {
          window.open(file.url, '_blank', 'noopener');
        } else {
          showToast('This item has no downloadable file attached.', 'info');
        }
      };
      el.addEventListener('click', open);
      el.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); }
      });
    });
    document.querySelectorAll('[data-select]').forEach((checkbox) => {
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) selectedIds.add(checkbox.dataset.select);
        else selectedIds.delete(checkbox.dataset.select);
        renderBulkActions();
      });
    });
    const selectAll = document.getElementById('driveSelectAll');
    if (selectAll) {
      const selectedCount = slice.filter((file) => selectedIds.has(file.id)).length;
      selectAll.checked = slice.length > 0 && selectedCount === slice.length;
      selectAll.indeterminate = selectedCount > 0 && selectedCount < slice.length;
      selectAll.disabled = slice.length === 0;
    }
    document.querySelectorAll('[data-menu]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.action-dropdown').forEach((d) => d.classList.remove('open'));
        document.getElementById(`dmenu-${btn.dataset.menu}`)?.classList.toggle('open');
      });
    });
    document.querySelectorAll('[data-star]').forEach((btn) => {
      btn.addEventListener('click', () => { mutateFile(btn.dataset.star, { starred: !getDriveFiles().find((file) => file.id === btn.dataset.star)?.starred }); render(); });
    });
    document.querySelectorAll('[data-trash]').forEach((btn) => {
      btn.addEventListener('click', () => {
        mutateFile(btn.dataset.trash, { trashed: true, parentId: null });
        selectedIds.delete(btn.dataset.trash);
        showToast('Moved to trash');
        render();
      });
    });
    document.querySelectorAll('[data-restore]').forEach((btn) => {
      btn.addEventListener('click', () => {
        mutateFile(btn.dataset.restore, { trashed: false, parentId: null });
        showToast('File restored');
        render();
      });
    });

    const pag = document.getElementById('drivePagination');
    if (pag) {
      const total = list.length;
      pag.innerHTML = `<div class="pagination-info">Showing ${total ? start + 1 : 0}–${Math.min(start + perPage, total)} of ${total}</div>
        <div class="pagination-controls">
          <button type="button" class="page-btn" id="drvPrev" ${page <= 1 ? 'disabled' : ''}><i data-lucide="chevron-left"></i></button>
          <button type="button" class="page-btn" id="drvNext" ${page >= pages ? 'disabled' : ''}><i data-lucide="chevron-right"></i></button>
        </div>`;
      document.getElementById('drvPrev')?.addEventListener('click', () => { page--; render(); });
      document.getElementById('drvNext')?.addEventListener('click', () => { page++; render(); });
    }
    renderBulkActions();
  }

  function renderBreadcrumb() {
    const el = document.getElementById('driveBreadcrumb');
    if (!el) return;
    const files = getDriveFiles();
    const ancestors = [];
    let folder = files.find((file) => file.id === currentFolderId && file.type === 'folder');
    while (folder) {
      ancestors.unshift(folder);
      folder = files.find((file) => file.id === folder.parentId && file.type === 'folder');
    }
    el.innerHTML = [
      `<a href="#" data-crumb-folder="">My Drive</a>`,
      ...ancestors.map((item, index) => index === ancestors.length - 1
        ? `<span class="current">${escapeHtml(item.name)}</span>`
        : `<a href="#" data-crumb-folder="${escapeHtml(item.id)}">${escapeHtml(item.name)}</a>`),
    ].join(' <i data-lucide="chevron-right" style="width:14px;height:14px"></i> ');
    el.querySelectorAll('[data-crumb-folder]').forEach((a) => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        currentFolderId = a.dataset.crumbFolder || null;
        page = 1;
        render();
      });
    });
  }

  function renderStorage() {
    const s = getSettings();
    const files = getDriveFiles().filter((file) => !file.trashed && file.type !== 'folder');
    const usedBytes = files.reduce((total, file) => total + (Number(file.sizeBytes) || 0), 0);
    const usedGb = usedBytes / (1024 ** 3);
    const totalGb = Math.max(Number(s.storageTotal) || 50, 0.1);
    const pct = Math.min(Math.round((usedGb / totalGb) * 100), 100);
    const el = document.getElementById('storageDonut');
    if (el) {
      el.innerHTML = `
        <div class="donut-wrap" style="flex-direction:column;align-items:center">
          <div class="donut" style="width:120px;height:120px">${createDonutSVG(pct, '#2563EB')}
            <div class="center-label">${pct}%<small>used</small></div>
          </div>
          <p style="margin-top:8px;font-size:13px;font-weight:600">${usedGb.toFixed(2)} GB / ${totalGb} GB</p>
        </div>
        <div class="storage-legend">
          <div class="storage-legend-row"><div class="sl-left"><span class="dot" style="background:#2563EB"></span> Files</div><div class="sl-val">${files.length}</div></div>
          <div class="storage-legend-row"><div class="sl-left"><span class="dot" style="background:#E2E8F0"></span> Available</div><div class="sl-val">${Math.max(totalGb - usedGb, 0).toFixed(2)} GB</div></div>
        </div>`;
    }
    const recent = document.getElementById('recentFilesList') || document.getElementById('recentFiles');
    if (recent) {
      recent.innerHTML = [...files].sort((a, b) => String(b.modified || '').localeCompare(String(a.modified || ''))).slice(0, 4).map((f) => `
        <div class="list-item">
          <div class="file-icon ${f.type}"><i data-lucide="${typeIcon[f.type] || 'file'}"></i></div>
          <div class="item-meta"><div class="item-title">${escapeHtml(f.name)}</div><div class="item-sub">${escapeHtml(f.modified ? formatDate(f.modified) : '—')} · ${escapeHtml(f.size || '—')}</div></div>
        </div>`).join('') || '<p class="empty-state">No files uploaded yet.</p>';
    }
  }

  function renderBulkActions() {
    const toolbar = document.querySelector('#driveSearch')?.closest('.toolbar');
    if (!toolbar) return;
    let actions = document.getElementById('driveBulkActions');
    if (!actions) {
      actions = document.createElement('div');
      actions.id = 'driveBulkActions';
      actions.className = 'drive-bulk-actions';
      toolbar.appendChild(actions);
    }
    actions.innerHTML = selectedIds.size
      ? `<span>${selectedIds.size} selected</span><button type="button" class="btn btn-ghost btn-sm danger" id="trashSelectedBtn"><i data-lucide="trash-2"></i> Move to trash</button><button type="button" class="btn btn-ghost btn-sm" id="clearSelectionBtn">Clear</button>`
      : '';
    document.getElementById('trashSelectedBtn')?.addEventListener('click', () => {
      const selected = new Set(selectedIds);
      sbSet(SB_KEYS.DRIVE, getDriveFiles().map((file) => selected.has(file.id) ? { ...file, trashed: true, parentId: null } : file));
      selectedIds.clear();
      showToast('Selected files moved to trash');
      render();
    });
    document.getElementById('clearSelectionBtn')?.addEventListener('click', () => {
      selectedIds.clear();
      render();
    });
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  function populateFolderSelect() {
    const select = document.getElementById('uploadFolder');
    if (!select) return;
    const folders = getDriveFiles().filter((file) => file.type === 'folder' && !file.trashed);
    select.innerHTML = '<option value="">My Drive (root)</option>' + folders.map((folder) =>
      `<option value="${escapeHtml(folder.id)}">${escapeHtml(folder.name)}</option>`
    ).join('');
    select.value = currentFolderId || '';
  }

  async function uploadFiles(files, folderId) {
    const button = document.querySelector('#uploadForm [type="submit"]');
    if (!files.length) { showToast('Choose at least one file to upload.', 'error'); return; }
    if (button) button.disabled = true;
    try {
      for (const file of files) {
        const body = new FormData();
        body.append('file', file);
        const response = await fetch('../api/upload.php', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.content || '' },
          body,
        });
        const result = await response.json();
        if (!response.ok || !result.ok) throw new Error(result.message || `Unable to upload ${file.name}.`);
        const current = getDriveFiles();
        current.push({
          id: uid('drv'),
          name: result.name,
          type: typeFromFile(file),
          owner: 'Me',
          modified: localDateStr(),
          size: formatBytes(file.size),
          sizeBytes: file.size,
          parentId: folderId || null,
          url: `../${result.url}`,
        });
        sbSet(SB_KEYS.DRIVE, current);
      }
      closeModal('uploadModal');
      document.getElementById('uploadForm')?.reset();
      showToast(`${files.length} file${files.length === 1 ? '' : 's'} uploaded.`);
      render();
    } catch (error) {
      render();
      showToast(error.message || 'Upload failed.', 'error');
    } finally {
      if (button) button.disabled = false;
    }
  }

  function render() {
    renderTable();
    renderBreadcrumb();
    renderStorage();
    populateFolderSelect();
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  document.querySelectorAll('#driveTabs .filter-tab, [data-drive-tab]').forEach((tabEl) => {
    tabEl.addEventListener('click', () => {
      tab = tabEl.dataset.driveTab || tabEl.dataset.tab || 'my-drive';
      document.querySelectorAll('#driveTabs .filter-tab, [data-drive-tab]').forEach((t) => t.classList.remove('active'));
      tabEl.classList.add('active');
      if (tab !== 'my-drive') currentFolderId = null;
      page = 1;
      render();
    });
  });

  document.getElementById('driveSearch')?.addEventListener('input', (e) => {
    search = e.target.value;
    page = 1;
    render();
  });
  document.getElementById('driveSelectAll')?.addEventListener('change', (event) => {
    const start = (page - 1) * perPage;
    filtered().slice(start, start + perPage).forEach((file) =>
      event.target.checked ? selectedIds.add(file.id) : selectedIds.delete(file.id)
    );
    render();
  });

  ['uploadFileBtn', 'qaUploadBtn'].forEach((id) => document.getElementById(id)?.addEventListener('click', () => {
    populateFolderSelect();
    openModal('uploadModal');
  }));
  ['newFolderBtn', 'qaNewFolderBtn'].forEach((id) => document.getElementById(id)?.addEventListener('click', () => openModal('newFolderModal')));

  document.getElementById('uploadForm')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const input = document.getElementById('uploadFile');
    uploadFiles([...input.files], document.getElementById('uploadFolder')?.value || null);
  });

  document.getElementById('newFolderForm')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = document.getElementById('folderName')?.value.trim();
    if (!name) { showToast('Folder name is required.', 'error'); return; }
    const files = getDriveFiles();
    files.push({ id: uid('drv'), name, type: 'folder', owner: 'Me', modified: localDateStr(), size: '—', parentId: currentFolderId });
    sbSet(SB_KEYS.DRIVE, files);
    closeModal('newFolderModal');
    event.target.reset();
    showToast('Folder created.');
    render();
  });

  document.querySelectorAll('[data-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const a = btn.getAttribute('data-action');
      if (a === 'upload') openModal('uploadModal');
      else if (a === 'new-folder') openModal('newFolderModal');
      else if (a === 'open-drive') openInGoogleDrive();
      else if (a === 'share-link') {
        const file = getDriveFiles().find((item) => selectedIds.has(item.id) && item.url);
        if (!file) { showToast('Select an uploaded file first.', 'info'); return; }
        const link = new URL(file.url, window.location.href).href;
        if (!file.shared) mutateFile(file.id, { shared: true });
        if (navigator.clipboard?.writeText) {
          navigator.clipboard.writeText(link).then(() => showToast('File link copied.')).catch(() => window.prompt('Copy this file link:', link));
        } else {
          window.prompt('Copy this file link:', link);
        }
      }
      else if (a === 'sync-drive') mockGoogleDriveSync(btn);
    });
  });

  const params = new URLSearchParams(window.location.search);
  if (params.get('upload') === '1') {
    openModal('uploadModal');
    params.delete('upload');
    const query = params.toString();
    window.history.replaceState({}, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`);
  }
  render();
});

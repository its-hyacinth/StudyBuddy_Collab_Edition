/**
 * StudyBuddy — Google Drive mock
 */
document.addEventListener('DOMContentLoaded', () => {
  const session = initShell('student');
  if (!session) return;
  wireModalClosers();

  let tab = 'my';
  let search = '';
  let page = 1;
  const perPage = 8;
  let breadcrumb = ['My Drive'];

  function filtered() {
    let list = getDriveFiles();
    if (tab === 'shared') list = list.filter((f) => f.shared);
    if (tab === 'starred') list = list.filter((f) => f.starred);
    if (tab === 'trash') list = list.filter((f) => f.trashed);
    if (tab === 'recent') list = [...list].sort((a, b) => b.modified.localeCompare(a.modified)).slice(0, 8);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((f) => f.name.toLowerCase().includes(q));
    }
    return list;
  }

  const typeIcon = { folder: 'folder', doc: 'file-text', sheet: 'sheet', slide: 'presentation', pdf: 'file', image: 'image' };

  function renderTable() {
    const list = filtered();
    const start = (page - 1) * perPage;
    const slice = list.slice(start, start + perPage);
    const tbody = document.querySelector('#driveTable tbody') || document.getElementById('driveTableBody');
    const rows = slice.map((f) => `
      <tr data-id="${f.id}" data-type="${f.type}" data-name="${f.name}">
        <td><label class="custom-check"><input type="checkbox" /><span class="box"></span></label></td>
        <td>
          <div class="cell-title" style="cursor:pointer" data-open="${f.id}">
            <div class="file-icon ${f.type}"><i data-lucide="${typeIcon[f.type] || 'file'}"></i></div>
            <div><div class="title">${f.name}</div></div>
          </div>
        </td>
        <td>${f.owner}</td>
        <td>${formatDate(f.modified)}</td>
        <td>${f.size}</td>
        <td>
          <div class="action-menu-wrap">
            <button type="button" class="action-menu-btn" data-menu="${f.id}"><i data-lucide="more-vertical"></i></button>
            <div class="action-dropdown" id="dmenu-${f.id}">
              <button type="button" data-share="${f.name}"><i data-lucide="link"></i> Get link</button>
              <button type="button" data-open-drive="${f.id}"><i data-lucide="external-link"></i> Open in Drive</button>
            </div>
          </div>
        </td>
      </tr>`).join('');

    if (tbody) tbody.innerHTML = rows || '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-muted)">No files found.</td></tr>';

    document.querySelectorAll('[data-open]').forEach((el) => {
      el.addEventListener('click', () => {
        const row = el.closest('tr');
        if (row?.dataset.type === 'folder') {
          breadcrumb.push(row.dataset.name);
          renderBreadcrumb();
          showToast(`Opened folder: ${row.dataset.name} (mock)`, 'info');
        } else {
          showToast(`Preview: ${row?.dataset.name} (mock)`, 'info');
        }
      });
    });
    document.querySelectorAll('[data-menu]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.action-dropdown').forEach((d) => d.classList.remove('open'));
        document.getElementById(`dmenu-${btn.dataset.menu}`)?.classList.toggle('open');
      });
    });
    document.querySelectorAll('[data-share]').forEach((btn) => {
      btn.addEventListener('click', () => getShareableLink(btn.dataset.share));
    });
    document.querySelectorAll('[data-open-drive]').forEach((btn) => {
      btn.addEventListener('click', () => openInGoogleDrive());
    });

    const pag = document.getElementById('drivePagination');
    if (pag) {
      const total = list.length;
      const pages = Math.max(1, Math.ceil(total / perPage));
      pag.innerHTML = `<div class="pagination-info">Showing ${total ? start + 1 : 0}–${Math.min(start + perPage, total)} of ${total}</div>
        <div class="pagination-controls">
          <button type="button" class="page-btn" id="drvPrev" ${page <= 1 ? 'disabled' : ''}><i data-lucide="chevron-left"></i></button>
          <button type="button" class="page-btn" id="drvNext" ${page >= pages ? 'disabled' : ''}><i data-lucide="chevron-right"></i></button>
        </div>`;
      document.getElementById('drvPrev')?.addEventListener('click', () => { page--; render(); });
      document.getElementById('drvNext')?.addEventListener('click', () => { page++; render(); });
    }
  }

  function renderBreadcrumb() {
    const el = document.getElementById('driveBreadcrumb');
    if (!el) return;
    el.innerHTML = breadcrumb.map((b, i) =>
      i === breadcrumb.length - 1
        ? `<span class="current">${b}</span>`
        : `<a href="#" data-crumb="${i}">${b}</a> <i data-lucide="chevron-right" style="width:14px;height:14px"></i> `
    ).join('');
    el.querySelectorAll('[data-crumb]').forEach((a) => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        breadcrumb = breadcrumb.slice(0, Number(a.dataset.crumb) + 1);
        renderBreadcrumb();
      });
    });
  }

  function renderStorage() {
    const s = getSettings();
    const pct = Math.round((s.storageUsed / s.storageTotal) * 100);
    const el = document.getElementById('storageDonut');
    if (el) {
      el.innerHTML = `
        <div class="donut-wrap" style="flex-direction:column;align-items:center">
          <div class="donut" style="width:120px;height:120px">${createDonutSVG(pct, '#2563EB')}
            <div class="center-label">${pct}%<small>used</small></div>
          </div>
          <p style="margin-top:8px;font-size:13px;font-weight:600">${s.storageUsed} GB / ${s.storageTotal} GB</p>
        </div>
        <div class="storage-legend">
          <div class="storage-legend-row"><div class="sl-left"><span class="dot" style="background:#2563EB"></span> My Drive</div><div class="sl-val">22.1 GB</div></div>
          <div class="storage-legend-row"><div class="sl-left"><span class="dot" style="background:#7C3AED"></span> Shared drives</div><div class="sl-val">12.1 GB</div></div>
          <div class="storage-legend-row"><div class="sl-left"><span class="dot" style="background:#E2E8F0"></span> Available</div><div class="sl-val">${(s.storageTotal - s.storageUsed).toFixed(1)} GB</div></div>
        </div>`;
    }
    const recent = document.getElementById('recentFiles');
    if (recent) {
      recent.innerHTML = getDriveFiles().filter((f) => f.type !== 'folder').slice(0, 4).map((f) => `
        <div class="list-item">
          <div class="file-icon ${f.type}"><i data-lucide="${typeIcon[f.type] || 'file'}"></i></div>
          <div class="item-meta"><div class="item-title">${f.name}</div><div class="item-sub">${formatDate(f.modified)}</div></div>
        </div>`).join('');
    }
  }

  function render() {
    renderTable();
    renderBreadcrumb();
    renderStorage();
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  document.querySelectorAll('#driveTabs .filter-tab, [data-drive-tab]').forEach((tabEl) => {
    tabEl.addEventListener('click', () => {
      tab = tabEl.dataset.driveTab || tabEl.dataset.tab || 'my';
      document.querySelectorAll('#driveTabs .filter-tab, [data-drive-tab]').forEach((t) => t.classList.remove('active'));
      tabEl.classList.add('active');
      page = 1;
      render();
    });
  });

  document.getElementById('driveSearch')?.addEventListener('input', (e) => {
    search = e.target.value;
    page = 1;
    render();
  });

  document.getElementById('uploadBtn')?.addEventListener('click', () => {
    showToast('Upload would open file picker → PHP → Google Drive API', 'info');
  });

  document.querySelectorAll('[data-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const a = btn.getAttribute('data-action');
      if (a === 'upload') showToast('Upload simulated', 'info');
      else if (a === 'new-folder') {
        const name = prompt('Folder name:');
        if (name) {
          const files = getDriveFiles();
          files.unshift({ id: uid('drv'), name, type: 'folder', owner: 'Me', modified: '2025-09-12', size: '—' });
          sbSet(SB_KEYS.DRIVE, files);
          showToast('Folder created');
          render();
        }
      } else if (a === 'open-drive') openInGoogleDrive();
      else if (a === 'share-link') getShareableLink('StudyBuddy');
      else if (a === 'sync-drive') mockGoogleDriveSync(btn);
    });
  });

  render();
});

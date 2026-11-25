/**
 * StudyBuddy — Teacher Resources
 */
document.addEventListener('DOMContentLoaded', () => {
  const session = initShell('teacher');
  if (!session) return;
  wireModalClosers();

  let classFilter = 'all';
  let typeFilter = 'all';
  let folderFilter = 'all';
  let search = '';
  let draggedResourceId = null;
  let suppressClickUntil = 0;
  let currentResources = [];

  const typeIcon = { pdf: 'file', doc: 'file-text', zip: 'archive', slide: 'presentation', image: 'image', link: 'external-link', folder: 'folder' };

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[char]));
  }

  function resourceType(file) {
    return resourceTypeFromName(file.name);
  }

  function resourceTypeFromName(name) {
    const extension = String(name || '').split('.').pop().toLowerCase();
    if (['doc', 'docx', 'txt'].includes(extension)) return 'doc';
    if (['ppt', 'pptx'].includes(extension)) return 'slide';
    if (extension === 'zip') return 'zip';
    if (['png', 'jpg', 'jpeg'].includes(extension)) return 'image';
    if (extension === 'pdf') return 'pdf';
    return 'link';
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function parseSize(value) {
    const match = String(value || '').match(/^([\d.]+)\s*(B|KB|MB|GB)$/i);
    if (!match) return 0;
    const unit = match[2].toUpperCase();
    const multiplier = { B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3 }[unit];
    return Number(match[1]) * multiplier;
  }

  function classNames() {
    const values = [
      ...getClasses().map((item) => classDisplayName(item) || item.name || item.subject),
      ...getResources().map((item) => item.class),
    ].filter(Boolean);
    return [...new Set(values)].length
      ? [...new Set(values)]
      : ['Math 101', 'Science 205', 'English 101', 'CS 308', 'Filipino 101'];
  }

  function populateSelect(select, options, placeholder, emptyValue = '') {
    if (!select) return;
    const previous = select.value;
    select.innerHTML = `<option value="${emptyValue}">${placeholder}</option>` + options.map((option) =>
      `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`
    ).join('');
    select.value = options.some((option) => option.value === previous) ? previous : emptyValue;
  }

  function populateResourceSelects(resources = getResources()) {
    const classes = classNames().map((name) => ({ value: name, label: name }));
    populateSelect(document.getElementById('resourceClassFilter'), classes, 'All Classes');
    populateSelect(document.getElementById('resourceClass'), classes, 'Select class');
    populateSelect(document.getElementById('driveResourceClass'), classes, 'Select class');

    const folders = resources.filter((resource) => resource.type === 'folder');
    const folderOptions = folders.map((folder) => ({
      value: folder.id,
      label: folderPath(resources, folder.id).map((item) => item.title).join(' / '),
    }));
    populateSelect(document.getElementById('resourceFolder'), folderOptions, 'All resources');
    populateSelect(document.getElementById('driveResourceFolder'), folderOptions, 'All resources');
  }

  function folderPath(resources, folderId) {
    const folders = new Map(resources.filter((resource) => resource.type === 'folder').map((folder) => [folder.id, folder]));
    const path = [];
    let folder = folders.get(folderId);
    while (folder && !path.some((item) => item.id === folder.id)) {
      path.unshift(folder);
      folder = folders.get(folder.folderId);
    }
    return path;
  }

  function canMoveResource(resource, destinationId, resources) {
    if (!resource) return false;
    if (!destinationId) return true;
    const destination = resources.find((item) => item.id === destinationId && item.type === 'folder');
    if (!destination) return false;
    if (resource.type !== 'folder') return true;

    let parent = destination;
    const visited = new Set();
    while (parent && !visited.has(parent.id)) {
      if (parent.id === resource.id) return false;
      visited.add(parent.id);
      parent = resources.find((item) => item.id === parent.folderId && item.type === 'folder');
    }
    return true;
  }

  function moveResource(resourceId, destinationId) {
    const resources = getResources();
    const resource = resources.find((item) => item.id === resourceId);
    const destination = destinationId || null;
    if (!canMoveResource(resource, destination, resources)) {
      showToast('A folder cannot be moved into itself or one of its subfolders.', 'error');
      return;
    }
    if ((resource.folderId || null) === destination) return;

    sbSet(SB_KEYS.RESOURCES, resources.map((item) =>
      item.id === resourceId ? { ...item, folderId: destination } : item
    ));
    showToast(`Moved "${resource.title}" ${destination ? 'into the folder.' : 'to All resources.'}`);
    render();
  }

  function bindDropTarget(element, destinationId) {
    element.addEventListener('dragover', (event) => {
      const resource = currentResources.find((item) => item.id === draggedResourceId);
      if (!canMoveResource(resource, destinationId, currentResources)) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
      element.classList.add('drop-target');
    });
    element.addEventListener('dragleave', (event) => {
      if (!element.contains(event.relatedTarget)) element.classList.remove('drop-target');
    });
    element.addEventListener('drop', (event) => {
      event.preventDefault();
      element.classList.remove('drop-target');
      const resourceId = draggedResourceId || event.dataTransfer?.getData('text/plain');
      if (resourceId) moveResource(resourceId, destinationId);
    });
  }

  function renderBreadcrumb(resources) {
    const breadcrumb = document.getElementById('resourceBreadcrumb');
    if (!breadcrumb) return;
    const path = folderPath(resources, folderFilter);
    const root = folderFilter === 'all'
      ? '<span class="current" data-drop-folder="">All resources</span>'
      : '<a href="#" data-open-folder="" data-drop-folder="">All resources</a>';
    const parents = path.slice(0, -1).map((folder) =>
      `<a href="#" data-open-folder="${escapeHtml(folder.id)}" data-drop-folder="${escapeHtml(folder.id)}">${escapeHtml(folder.title)}</a>`
    );
    const current = path.length
      ? `<span class="current" data-drop-folder="${escapeHtml(path[path.length - 1].id)}">${escapeHtml(path[path.length - 1].title)}</span>`
      : '';
    breadcrumb.innerHTML = [root, ...parents, current].filter(Boolean).join('<i data-lucide="chevron-right" aria-hidden="true"></i>');
    const backButton = document.getElementById('resourceFolderBack');
    const currentFolder = resources.find((resource) => resource.id === folderFilter && resource.type === 'folder');
    if (backButton) {
      backButton.hidden = !currentFolder;
      backButton.dataset.parentFolder = currentFolder?.folderId || '';
    }
    breadcrumb.querySelectorAll('[data-open-folder]').forEach((item) => {
      item.addEventListener('click', (event) => {
        event.preventDefault();
        folderFilter = item.dataset.openFolder || 'all';
        render();
      });
    });
    breadcrumb.querySelectorAll('[data-drop-folder]').forEach((item) =>
      bindDropTarget(item, item.dataset.dropFolder || null)
    );
  }

  function safeGoogleDriveUrl(value) {
    try {
      const url = new URL(value);
      if (url.protocol !== 'https:' || !['drive.google.com', 'docs.google.com'].includes(url.hostname)) return null;
      return url.href;
    } catch {
      return null;
    }
  }

  function openResource(resource) {
    if (!resource) return;
    if (resource.type === 'folder') {
      closeModal('resourceDetailsModal');
      folderFilter = resource.id;
      render();
      return;
    }
    if (!resource.url) {
      showToast('This resource has no uploaded file. Upload it again to view it.', 'error');
      return;
    }
    let url;
    try {
      url = new URL(resource.url, window.location.href);
    } catch {
      showToast('This resource link is invalid.', 'error');
      return;
    }
    if (!['http:', 'https:'].includes(url.protocol)
      || (url.origin !== window.location.origin && !safeGoogleDriveUrl(url.href))) {
      showToast('This resource link is not supported.', 'error');
      return;
    }
    closeModal('resourceDetailsModal');
    window.open(url.href, '_blank', 'noopener,noreferrer');
  }

  function showResourceDetails(resourceId) {
    const resources = getResources();
    const resource = resources.find((item) => item.id === resourceId);
    if (!resource) {
      showToast('This resource is no longer available.', 'error');
      render();
      return;
    }

    const isFolder = resource.type === 'folder';
    const location = resource.folderId
      ? folderPath(resources, resource.folderId).map((folder) => folder.title).join(' / ')
      : 'All resources';
    const details = isFolder
      ? [
          ['Type', 'Folder'],
          ['Items', resources.filter((item) => item.folderId === resource.id).length],
          ['Created', formatDate(resource.uploaded)],
          ['Location', location],
        ]
      : [
          ['Class', resource.class || '—'],
          ['Type', String(resource.type || 'file').toUpperCase()],
          ['Size', resource.size || '—'],
          ['Uploaded', formatDate(resource.uploaded)],
          ['Downloads', Number(resource.downloads) || 0],
          ['Location', location],
        ];
    if (resource.description) details.push(['Description', resource.description]);

    document.getElementById('resourceDetailsTitle').textContent = resource.title || 'Resource details';
    document.getElementById('resourceDetailsHint').textContent = isFolder
      ? 'Folder information'
      : 'Resource information';
    document.getElementById('resourceDetailsContent').innerHTML = `
      <dl class="resource-details">
        ${details.map(([label, value]) => `
          <div class="resource-detail-row">
            <dt>${escapeHtml(label)}</dt>
            <dd>${escapeHtml(value)}</dd>
          </div>`).join('')}
      </dl>`;
    const openButton = document.getElementById('resourceDetailsOpenBtn');
    openButton.textContent = isFolder ? 'Open folder' : 'Open resource';
    openButton.dataset.resourceId = resource.id;
    openModal('resourceDetailsModal');
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  function openUploadModal() {
    populateResourceSelects();
    const folder = document.getElementById('resourceFolder');
    if (folder) folder.value = folderFilter === 'all' ? '' : folderFilter;
    openModal('uploadResourceModal');
  }

  async function loadDriveFileChoices() {
    const select = document.getElementById('driveResourcePick');
    if (!select) return;
    select.innerHTML = '<option value="">Loading your Drive files…</option>';
    try {
      const status = window.SB_GOOGLE || await googleConnectionStatus(true);
      if (!status?.connected) {
        select.innerHTML = '<option value="">Connect Google Drive in Settings first</option>';
        return;
      }
      const response = await fetch(`${SB_API_BASE}google.php?action=drive&view=recent`, { credentials: 'same-origin' });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(result.message || 'Could not load Google Drive.');
      const files = (result.files || []).filter((file) => file.type !== 'folder' && file.url);
      select.innerHTML = '<option value="">Choose a file, or paste a link below</option>' + files.map((file) =>
        `<option value="${escapeHtml(file.url)}" data-name="${escapeHtml(file.name)}">${escapeHtml(file.name)}</option>`
      ).join('');
    } catch (error) {
      select.innerHTML = `<option value="">${escapeHtml(error.message || 'Could not load Google Drive.')}</option>`;
    }
  }

  function openDriveResourceModal() {
    populateResourceSelects();
    const folder = document.getElementById('driveResourceFolder');
    if (folder) folder.value = folderFilter === 'all' ? '' : folderFilter;
    openModal('driveResourceModal');
    loadDriveFileChoices();
  }

  function closeResourceMenus() {
    document.querySelectorAll('#resourcesTable .action-dropdown.open').forEach((menu) => menu.classList.remove('open'));
    document.querySelectorAll('#resourcesTable [data-menu]').forEach((button) => button.setAttribute('aria-expanded', 'false'));
  }

  function positionResourceMenu(menu, button) {
    const buttonRect = button.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    const margin = 8;
    const left = Math.max(margin, Math.min(buttonRect.right - menuRect.width, window.innerWidth - menuRect.width - margin));
    const spaceBelow = window.innerHeight - buttonRect.bottom - margin;
    const spaceAbove = buttonRect.top - margin;
    const top = spaceBelow >= menuRect.height || spaceBelow >= spaceAbove
      ? buttonRect.bottom
      : buttonRect.top - menuRect.height;

    menu.style.left = `${left}px`;
    menu.style.top = `${Math.max(margin, Math.min(top, window.innerHeight - menuRect.height - margin))}px`;
  }

  function render() {
    const all = getResources();
    currentResources = all;
    if (folderFilter !== 'all' && !all.some((resource) => resource.id === folderFilter && resource.type === 'folder')) {
      folderFilter = 'all';
    }
    populateResourceSelects(all);
    renderBreadcrumb(all);
    let list = all;
    const currentFolderId = folderFilter === 'all' ? null : folderFilter;
    list = list.filter((resource) => (resource.folderId || null) === currentFolderId);
    const folderCount = document.getElementById('resourceFolderCount');
    const directItemCount = all.filter((resource) => (resource.folderId || null) === currentFolderId).length;
    if (folderCount) folderCount.textContent = `${directItemCount} item${directItemCount === 1 ? '' : 's'}`;
    if (classFilter !== 'all') list = list.filter((r) => r.class === classFilter);
    if (typeFilter !== 'all') list = list.filter((r) => r.type === typeFilter);
    if (search) {
      const query = search.toLowerCase();
      list = list.filter((resource) =>
        String(resource.title || '').toLowerCase().includes(query)
        || String(resource.class || '').toLowerCase().includes(query)
      );
    }

    const files = all.filter((resource) => resource.type !== 'folder');
    const totalResources = document.getElementById('statTotalResources');
    const totalDownloads = document.getElementById('statDownloads');
    const storageUsed = document.getElementById('statStorage');
    const sharedClasses = document.getElementById('statShared');
    if (totalResources) totalResources.textContent = files.length;
    if (totalDownloads) totalDownloads.textContent = files.reduce((total, resource) => total + (Number(resource.downloads) || 0), 0);
    if (storageUsed) storageUsed.textContent = formatBytes(files.reduce((total, resource) => total + (Number(resource.sizeBytes) || parseSize(resource.size)), 0));
    if (sharedClasses) sharedClasses.textContent = new Set(files.filter((resource) => resource.shared).map((resource) => resource.class)).size;

    const tbody = document.querySelector('#resourcesTable tbody') || document.getElementById('resourcesTableBody');
    if (tbody) {
      const hasCurrentItems = all.some((resource) => (resource.folderId || null) === currentFolderId);
      const emptyMessage = search || classFilter !== 'all' || typeFilter !== 'all'
        ? 'No resources match the current filters.'
        : folderFilter === 'all'
          ? 'No resources yet. Upload a file or create a folder.'
          : hasCurrentItems
            ? 'No resources match the current filters.'
            : 'This folder is empty. Drag resources here or upload into this folder.';
      tbody.innerHTML = list.length ? list.map((r) => `
        <tr data-resource-id="${escapeHtml(r.id)}" ${r.type === 'folder' ? `data-drop-folder="${escapeHtml(r.id)}"` : ''} draggable="true">
          <td>
            <div class="cell-title">
              <div class="file-icon ${escapeHtml(r.type)}">
                <i data-lucide="${typeIcon[r.type] || 'file'}"></i>
              </div>
              <div>
                <div class="title">${escapeHtml(r.title)}</div>
                <div class="subtitle">${escapeHtml(r.description || r.type.toUpperCase())}</div>
              </div>
            </div>
          </td>
          <td>${escapeHtml(r.class || '—')}</td>
          <td><span class="badge badge-info">${escapeHtml(r.type.toUpperCase())}</span></td>
          <td>${escapeHtml(r.size || '—')}</td>
          <td>${escapeHtml(formatDate(r.uploaded))}</td>
          <td>${Number(r.downloads) || 0}</td>
          <td class="resource-actions-cell">
            <div class="resource-actions">
              <button type="button" class="btn btn-sm btn-ghost" data-open="${escapeHtml(r.id)}" aria-label="${r.type === 'folder' ? 'Open folder' : 'Open resource'} ${escapeHtml(r.title)}" title="${r.type === 'folder' ? 'Open folder' : 'Open resource'}">
                <i data-lucide="${r.type === 'folder' ? 'folder-open' : 'external-link'}"></i>
              </button>
              <div class="action-menu-wrap">
                <button type="button" class="action-menu-btn" data-menu="${escapeHtml(r.id)}" aria-label="More actions for ${escapeHtml(r.title)}" aria-haspopup="true" aria-expanded="false">
                  <i data-lucide="more-vertical"></i>
                </button>
                <div class="action-dropdown resource-action-dropdown" id="menu-${escapeHtml(r.id)}" role="menu">
                  <button type="button" data-info="${escapeHtml(r.id)}" role="menuitem"><i data-lucide="info"></i> Details</button>
                  <button type="button" class="danger" data-delete="${escapeHtml(r.id)}" role="menuitem"><i data-lucide="trash-2"></i> Delete</button>
                </div>
              </div>
            </div>
          </td>
        </tr>`).join('')
        : `<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-muted)">${emptyMessage}</td></tr>`;

      tbody.querySelectorAll('[data-info]').forEach((button) => {
        button.addEventListener('click', () => {
          button.closest('.action-dropdown')?.classList.remove('open');
          button.closest('.action-menu-wrap')?.querySelector('[data-menu]')?.setAttribute('aria-expanded', 'false');
          showResourceDetails(button.dataset.info);
        });
      });

      tbody.querySelectorAll('[data-menu]').forEach((button) => {
        button.addEventListener('click', (event) => {
          event.stopPropagation();
          const menu = document.getElementById(`menu-${button.dataset.menu}`);
          const willOpen = !menu?.classList.contains('open');
          closeResourceMenus();
          if (willOpen && menu) {
            menu.classList.add('open');
            positionResourceMenu(menu, button);
            button.setAttribute('aria-expanded', 'true');
          }
        });
      });

      tbody.querySelectorAll('[data-open]').forEach((btn) => {
        btn.addEventListener('click', () => {
          openResource(getResources().find((item) => item.id === btn.dataset.open));
        });
      });
      tbody.querySelectorAll('[data-delete]').forEach((btn) => {
        btn.addEventListener('click', () => {
          btn.closest('.action-dropdown')?.classList.remove('open');
          btn.closest('.action-menu-wrap')?.querySelector('[data-menu]')?.setAttribute('aria-expanded', 'false');
          const resource = getResources().find((item) => item.id === btn.dataset.delete);
          if (!resource) {
            showToast('This resource is no longer available.', 'error');
            render();
            return;
          }
          const removeResource = async () => {
            const current = getResources().find((item) => item.id === resource.id);
            if (!current) {
              showToast('This resource is no longer available.', 'error');
              render();
              return;
            }
            if (current.source === 'upload') {
              try {
                const response = await fetch(`../api/resource-files.php?resource=${encodeURIComponent(current.id)}`, {
                  method: 'DELETE',
                  credentials: 'same-origin',
                  headers: { 'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.content || '' },
                });
                const result = await response.json().catch(() => null);
                if (!response.ok || !result?.ok) {
                  throw new Error(result?.message || `Unable to delete resource file (HTTP ${response.status}).`);
                }
              } catch (error) {
                showToast(error instanceof Error ? error.message : 'Unable to delete resource file.', 'error');
                return;
              }
            }
            const updated = getResources()
              .filter((item) => item.id !== current.id)
              .map((item) => item.folderId === current.id ? { ...item, folderId: current.folderId || null } : item);
            sbSet(SB_KEYS.RESOURCES, updated);
            if (folderFilter === current.id) folderFilter = current.folderId || 'all';
            showToast(current.type === 'folder' ? 'Folder deleted; its contents were moved to the parent folder.' : 'Resource deleted', 'warning');
            render();
          };
          showDeleteConfirmation('resource', resource.title || 'Untitled resource', removeResource, {
            title: resource.type === 'folder' ? 'Delete folder?' : 'Delete resource?',
            description: resource.type === 'folder'
              ? 'Are you sure you want to delete this folder?'
              : 'Are you sure you want to delete this resource?',
            warning: resource.type === 'folder'
              ? 'Items inside will be moved to the parent folder.'
              : 'This resource will be removed from your Resources list.',
            buttonLabel: resource.type === 'folder' ? 'Delete folder' : 'Delete resource',
          });
        });
      });

      tbody.querySelectorAll('tr[data-resource-id]').forEach((row) => {
        row.addEventListener('click', (event) => {
          if (Date.now() < suppressClickUntil || event.target.closest('button, a, input, .action-menu-wrap')) return;
          openResource(getResources().find((item) => item.id === row.dataset.resourceId));
        });
        row.addEventListener('dragstart', (event) => {
          draggedResourceId = row.dataset.resourceId;
          suppressClickUntil = Date.now() + 1000;
          row.classList.add('is-dragging');
          if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', draggedResourceId);
          }
        });
        row.addEventListener('dragend', () => {
          draggedResourceId = null;
          suppressClickUntil = Date.now() + 300;
          row.classList.remove('is-dragging');
          document.querySelectorAll('.drop-target').forEach((target) => target.classList.remove('drop-target'));
        });
        if (row.dataset.dropFolder) bindDropTarget(row, row.dataset.dropFolder);
      });
    }

    const recent = document.getElementById('recentResources');
    if (recent) {
      recent.innerHTML = all.slice(0, 4).map((r) => `
        <div class="list-item">
          <div class="file-icon ${escapeHtml(r.type)}"><i data-lucide="${typeIcon[r.type] || 'file'}"></i></div>
          <div class="item-meta"><div class="item-title">${escapeHtml(r.title)}</div><div class="item-sub">${escapeHtml(r.class)}</div></div>
        </div>`).join('');
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  document.getElementById('resourceClassFilter')?.addEventListener('change', (e) => { classFilter = e.target.value || 'all'; render(); });
  document.getElementById('resourceTypeFilter')?.addEventListener('change', (e) => { typeFilter = e.target.value || 'all'; render(); });
  document.getElementById('resourceSearch')?.addEventListener('input', (e) => { search = e.target.value.trim(); render(); });
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.action-menu-wrap')) closeResourceMenus();
  });
  document.addEventListener('scroll', closeResourceMenus, true);
  window.addEventListener('resize', closeResourceMenus);
  document.getElementById('resourceFolderBack')?.addEventListener('click', (event) => {
    folderFilter = event.currentTarget.dataset.parentFolder || 'all';
    render();
  });
  document.getElementById('resourceDetailsOpenBtn')?.addEventListener('click', (event) => {
    const resource = getResources().find((item) => item.id === event.currentTarget.dataset.resourceId);
    openResource(resource);
  });

  ['uploadResourceBtn', 'qaUpload'].forEach((id) =>
    document.getElementById(id)?.addEventListener('click', openUploadModal)
  );
  document.getElementById('qaLinkDrive')?.addEventListener('click', openDriveResourceModal);
  ['qaCreateFolder', 'resourceNewFolderBtn'].forEach((id) => document.getElementById(id)?.addEventListener('click', () => {
    document.getElementById('newResourceFolderForm')?.reset();
    openModal('newResourceFolderModal');
  }));
  document.getElementById('qaShareAll')?.addEventListener('click', () => {
    const shareableCount = getResources().filter((resource) => resource.type !== 'folder' && resource.url).length;
    if (!shareableCount) {
      showToast('Upload a file or add a Google Drive link before sharing resources.', 'info');
      return;
    }
    document.getElementById('shareAllResourcesCount').textContent =
      `${shareableCount} resource${shareableCount === 1 ? '' : 's'} with a file or Drive link will be shared.`;
    openModal('shareAllResourcesModal');
  });

  document.getElementById('newResourceFolderForm')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = document.getElementById('newResourceFolderName')?.value.trim();
    if (!name) {
      showToast('Folder name is required.', 'error');
      return;
    }
    const resources = getResources();
    const parentId = folderFilter === 'all' ? null : folderFilter;
    if (resources.some((resource) => resource.type === 'folder'
      && (resource.folderId || null) === parentId
      && resource.title.toLowerCase() === name.toLowerCase())) {
      showToast('A folder with that name already exists here.', 'error');
      return;
    }
    resources.unshift({
      id: uid('folder'),
      title: name,
      class: '',
      type: 'folder',
      folderId: parentId,
      size: '—',
      uploaded: localDateStr(),
      downloads: 0,
    });
    sbSet(SB_KEYS.RESOURCES, resources);
    closeModal('newResourceFolderModal');
    event.target.reset();
    showToast('Resource folder created.');
    render();
  });

  document.getElementById('uploadResourceForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('resourceTitle')?.value.trim();
    const cls = document.getElementById('resourceClass')?.value || '';
    const file = document.getElementById('resourceFile')?.files?.[0];
    if (!title) { showToast('Title required', 'error'); return; }
    if (!file) { showToast('Choose a file to upload.', 'error'); return; }

    const button = document.getElementById('saveResourceBtn');
    if (button) button.disabled = true;
    try {
      const body = new FormData();
      body.append('file', file);
      const response = await fetch('../api/resource-files.php', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.content || '' },
        body,
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.ok) {
        throw new Error(result?.message || `Unable to upload resource file (HTTP ${response.status}).`);
      }
      if (typeof result.resourceId !== 'string' || !result.resourceId || typeof result.url !== 'string' || !result.url) {
        throw new Error('The upload service returned an invalid resource reference.');
      }

      const list = getResources();
      list.unshift({
        id: result.resourceId,
        title,
        class: cls,
        type: resourceType(file),
        size: formatBytes(file.size),
        sizeBytes: file.size,
        uploaded: localDateStr(),
        downloads: 0,
        folderId: document.getElementById('resourceFolder')?.value || null,
        description: document.getElementById('resourceDescription')?.value.trim() || '',
        fileName: result.name,
        url: `../${result.url}`,
        source: 'upload',
      });
      sbSet(SB_KEYS.RESOURCES, list);
      if (!getResources().some((resource) => resource.id === result.resourceId)) {
        try {
          const cleanup = await fetch(`../api/resource-files.php?resource=${encodeURIComponent(result.resourceId)}`, {
            method: 'DELETE',
            credentials: 'same-origin',
            headers: { 'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.content || '' },
          });
          if (!cleanup.ok) console.error('Could not remove an uploaded resource after its details failed to save.');
        } catch (cleanupError) {
          console.error('Could not remove an uploaded resource after its details failed to save.', cleanupError);
        }
        throw new Error('The file uploaded, but its resource details could not be saved. Please try again.');
      }
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

  document.getElementById('driveResourcePick')?.addEventListener('change', (event) => {
    const option = event.target.selectedOptions?.[0];
    const url = event.target.value;
    if (!url) return;
    const link = document.getElementById('driveResourceUrl');
    const title = document.getElementById('driveResourceName');
    if (link) link.value = url;
    if (title && !title.value.trim()) title.value = option?.dataset.name || option?.textContent || '';
  });

  document.getElementById('driveResourceForm')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const title = document.getElementById('driveResourceName')?.value.trim();
    const className = document.getElementById('driveResourceClass')?.value;
    const url = safeGoogleDriveUrl(document.getElementById('driveResourceUrl')?.value.trim());
    if (!title || !className) {
      showToast('Resource title and class are required.', 'error');
      return;
    }
    if (!url) {
      showToast('Enter a secure Google Drive or Google Docs link.', 'error');
      return;
    }
    const resources = getResources();
    resources.unshift({
      id: uid('res'),
      title,
      class: className,
      type: resourceTypeFromName(title),
      size: 'Link',
      uploaded: localDateStr(),
      downloads: 0,
      folderId: document.getElementById('driveResourceFolder')?.value || null,
      description: document.getElementById('driveResourceDescription')?.value.trim() || '',
      source: 'google-drive',
      url,
    });
    sbSet(SB_KEYS.RESOURCES, resources);
    closeModal('driveResourceModal');
    event.target.reset();
    showToast('Google Drive resource added.');
    render();
  });

  document.getElementById('confirmShareAllResourcesBtn')?.addEventListener('click', async (event) => {
    const button = event.currentTarget;
    const resources = getResources();
    const shareableCount = resources.filter((resource) => resource.type !== 'folder' && resource.url).length;
    if (!shareableCount) {
      closeModal('shareAllResourcesModal');
      showToast('No resources with files or Drive links are available to share.', 'info');
      return;
    }

    button.disabled = true;
    try {
      const response = await fetch('../api/shared-resources.php', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.content || '',
        },
        body: JSON.stringify({ action: 'share-all' }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.ok) throw new Error(result?.message || 'Unable to share resources.');
      closeModal('shareAllResourcesModal');
      render();
      if (result.studentCount) {
        const resourceLabel = result.resourceCount === 1 ? 'resource' : 'resources';
        const studentLabel = result.studentCount === 1 ? 'student' : 'students';
        showToast(`${result.resourceCount} ${resourceLabel} shared with ${result.studentCount} enrolled ${studentLabel}.`);
      } else {
        const resourceLabel = result.resourceCount === 1 ? 'resource' : 'resources';
        showToast(`${result.resourceCount} ${resourceLabel} marked shared. No rostered student accounts matched yet.`, 'info');
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to share resources.', 'error');
    } finally {
      button.disabled = false;
    }
  });

  render();
  sbWhenReady(render);
});

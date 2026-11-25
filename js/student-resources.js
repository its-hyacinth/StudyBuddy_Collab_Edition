document.addEventListener('DOMContentLoaded', () => {
  const session = initShell('student');
  if (!session) return;

  const list = document.getElementById('studentResourceList');
  const search = document.getElementById('resourceSearch');
  const classFilter = document.getElementById('resourceClassFilter');
  const count = document.getElementById('resourceCount');
  const icons = {
    pdf: 'file',
    doc: 'file-text',
    zip: 'archive',
    slide: 'presentation',
    image: 'image',
    link: 'external-link',
  };
  let resources = [];

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (character) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[character]));
  }

  function resourceType(resource) {
    const type = String(resource.type || '').toLowerCase();
    return Object.prototype.hasOwnProperty.call(icons, type) ? type : 'link';
  }

  function safeResourceUrl(resource) {
    try {
      const url = new URL(resource.url, window.location.href);
      const isDriveUrl = url.protocol === 'https:'
        && ['drive.google.com', 'docs.google.com'].includes(url.hostname);
      if (url.origin !== window.location.origin && !isDriveUrl) return null;
      if (!['http:', 'https:'].includes(url.protocol)) return null;
      return url;
    } catch {
      return null;
    }
  }

  function resourceDownloadUrl(resource) {
    const url = safeResourceUrl(resource);
    if (!url || url.origin !== window.location.origin) return null;
    if (/\/api\/resource-files\.php$/i.test(url.pathname) && url.searchParams.has('resource')) {
      url.searchParams.set('download', '1');
    }
    return url;
  }

  function populateClassFilter() {
    const selected = classFilter.value;
    const classes = [...new Set(resources.map((resource) => String(resource.class || '').trim()).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b));
    classFilter.innerHTML = '<option value="">All classes</option>' + classes
      .map((className) => `<option value="${escapeHtml(className)}">${escapeHtml(className)}</option>`)
      .join('');
    classFilter.value = classes.includes(selected) ? selected : '';
  }

  function visibleResources() {
    const query = search.value.trim().toLowerCase();
    const selectedClass = classFilter.value;
    return resources.filter((resource) => {
      if (selectedClass && String(resource.class || '') !== selectedClass) return false;
      return !query || [
        resource.title,
        resource.class,
        resource.teacherName,
        resource.description,
        resource.fileName,
      ].some((value) => String(value || '').toLowerCase().includes(query));
    });
  }

  function render() {
    const filtered = visibleResources();
    count.textContent = `${filtered.length} resource${filtered.length === 1 ? '' : 's'}`;
    if (!filtered.length) {
      list.innerHTML = resources.length
        ? '<p class="empty-state">No resources match your search or class filter.</p>'
        : '<div class="empty-state"><i data-lucide="folder-open"></i><p>No teacher-uploaded files have been shared with your classes yet.</p></div>';
      if (typeof lucide !== 'undefined') lucide.createIcons();
      return;
    }

    list.innerHTML = filtered.map((resource) => {
      const type = resourceType(resource);
      const viewUrl = safeResourceUrl(resource);
      const downloadUrl = resourceDownloadUrl(resource);
      const metadata = [
        resource.class || 'Class not specified',
        resource.teacherName || 'Your teacher',
        resource.uploaded ? formatDate(resource.uploaded) : '',
      ].filter(Boolean);
      return `
        <article class="student-resource-item">
          <div class="file-icon ${type}" aria-hidden="true"><i data-lucide="${icons[type]}"></i></div>
          <div class="student-resource-details">
            <h2 class="student-resource-title">${escapeHtml(resource.title || 'Untitled resource')}</h2>
            <p class="student-resource-meta">${metadata.map(escapeHtml).join('<span aria-hidden="true">·</span>')}</p>
            ${resource.description ? `<p class="student-resource-description">${escapeHtml(resource.description)}</p>` : ''}
            <span class="badge badge-info">${escapeHtml(type.toUpperCase())}${resource.size ? ` · ${escapeHtml(resource.size)}` : ''}</span>
          </div>
          <div class="student-resource-actions">
            ${viewUrl
              ? `<a class="btn btn-primary student-resource-open" href="${escapeHtml(viewUrl.href)}" target="_blank" rel="noopener noreferrer" data-open-resource="${escapeHtml(resource.id)}"><i data-lucide="external-link"></i> View resource</a>`
              : `<button type="button" class="btn btn-primary student-resource-open" data-open-resource="${escapeHtml(resource.id)}"><i data-lucide="external-link"></i> View resource</button>`}
            ${downloadUrl
              ? `<a class="btn btn-outline student-resource-download" href="${escapeHtml(downloadUrl.href)}" download="${escapeHtml(resource.fileName || resource.title || 'resource')}"><i data-lucide="download"></i> Download</a>`
              : '<button type="button" class="btn btn-outline student-resource-download" disabled><i data-lucide="download"></i> Download</button>'}
          </div>
        </article>`;
    }).join('');

    list.querySelectorAll('[data-open-resource]').forEach((link) => {
      link.addEventListener('click', (event) => {
        const resource = resources.find((item) => String(item.id) === link.dataset.openResource);
        if (!resource) return;
        const url = safeResourceUrl(resource);
        if (!url) {
          event.preventDefault();
          showToast('This resource link is not supported.', 'error');
          return;
        }
        const isDriveUrl = ['drive.google.com', 'docs.google.com'].includes(url.hostname);
        if (isDriveUrl) {
          fetch('../api/resource-files.php', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.content || '',
            },
            body: JSON.stringify({ action: 'track-download', resourceId: resource.id }),
          }).then(async (response) => {
            const result = await response.json().catch(() => null);
            if (!response.ok || !result?.ok) {
              throw new Error(result?.message || `Unable to record resource access (HTTP ${response.status}).`);
            }
          }).catch((error) => console.error('Could not record shared resource access:', error));
        }
      });
    });
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  async function loadResources() {
    list.innerHTML = '<p class="empty-state">Loading shared resources…</p>';
    count.textContent = '';
    try {
      const response = await fetch('../api/shared-resources.php', {
        credentials: 'same-origin',
        cache: 'no-store',
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.ok || !Array.isArray(result.resources)) {
        throw new Error(result?.message || `Unable to load teacher resources (HTTP ${response.status}).`);
      }
      resources = result.resources.filter((resource) => resource && resource.id && resource.url);
      populateClassFilter();
      render();
    } catch (error) {
      console.error('Could not load teacher resources:', error);
      count.textContent = '';
      list.innerHTML = `
        <div class="empty-state">
          <p>${escapeHtml(error instanceof Error ? error.message : 'Unable to load teacher resources.')}</p>
          <button type="button" class="btn btn-outline" id="retryResourcesBtn">Try again</button>
        </div>`;
      document.getElementById('retryResourcesBtn')?.addEventListener('click', loadResources);
    }
  }

  search.addEventListener('input', render);
  classFilter.addEventListener('change', render);
  loadResources();
});

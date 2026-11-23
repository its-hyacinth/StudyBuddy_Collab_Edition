/**
 * StudyBuddy — Shared sidebar + header behavior
 */

const STUDENT_NAV = [
  { href: 'dashboard.php', icon: 'layout-dashboard', label: 'Dashboard' },
  { href: 'subjects.php', icon: 'book-open', label: 'Subjects' },
  { href: 'assignments.php', icon: 'clipboard-list', label: 'Assignments' },
  { href: 'todo.php', icon: 'check-square', label: 'To-Do List' },
  { href: 'schedule.php', icon: 'calendar', label: 'Schedule' },
  { href: 'progress.php', icon: 'trending-up', label: 'Study Progress' },
  { href: 'drive.php', icon: 'hard-drive', label: 'Google Drive' },
];

const TEACHER_NAV = [
  { href: 'dashboard.php', icon: 'layout-dashboard', label: 'Dashboard' },
  { href: 'classes.php', icon: 'graduation-cap', label: 'My Classes' },
  { href: 'assignments.php', icon: 'clipboard-list', label: 'Assignments' },
  { href: 'grades.php', icon: 'award', label: 'Grades' },
  { href: 'students.php', icon: 'users', label: 'Students' },
  { href: 'messages.php', icon: 'message-square', label: 'Messages' },
  { href: 'calendar.php', icon: 'calendar', label: 'Calendar' },
  { href: 'drive.php', icon: 'hard-drive', label: 'Google Drive' },
  { href: 'resources.php', icon: 'folder-open', label: 'Resources' },
];

function getActivePage() {
  const parts = window.location.pathname.split('/');
  return parts[parts.length - 1] || 'dashboard.php';
}

let deleteConfirmationCallback = null;

function ensureDeleteConfirmationModal() {
  let modal = document.getElementById('deleteConfirmationModal');
  if (modal) return modal;

  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-backdrop" id="deleteConfirmationModal">
      <div class="modal delete-confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="deleteConfirmationTitle" aria-describedby="deleteConfirmationDescription">
        <div class="modal-header">
          <h3 id="deleteConfirmationTitle"></h3>
          <button type="button" class="modal-close" data-cancel-delete aria-label="Cancel deletion">
            <i data-lucide="x"></i>
          </button>
        </div>
        <div class="modal-body">
          <p id="deleteConfirmationDescription" class="delete-confirm-description"></p>
          <div class="delete-confirm-item">
            <span class="delete-confirm-icon"><i data-lucide="trash-2"></i></span>
            <strong id="deleteConfirmationItem"></strong>
          </div>
          <p id="deleteConfirmationWarning" class="delete-confirm-warning"></p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-ghost delete-confirm-cancel" data-cancel-delete>Cancel</button>
          <button type="button" class="btn btn-danger" data-confirm-delete></button>
        </div>
      </div>
    </div>`);

  modal = document.getElementById('deleteConfirmationModal');
  const cancel = () => {
    deleteConfirmationCallback = null;
    closeModal('deleteConfirmationModal');
  };
  modal.querySelectorAll('[data-cancel-delete]').forEach((button) => {
    button.addEventListener('click', cancel);
  });
  modal.addEventListener('click', (event) => {
    if (event.target === modal) cancel();
  });
  modal.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      cancel();
    }
  });
  modal.querySelector('[data-confirm-delete]')?.addEventListener('click', () => {
    const callback = deleteConfirmationCallback;
    deleteConfirmationCallback = null;
    closeModal('deleteConfirmationModal');
    callback?.();
  });
  if (typeof lucide !== 'undefined') lucide.createIcons();
  return modal;
}

function showDeleteConfirmation(itemType, itemName, onConfirm, options = {}) {
  if (typeof onConfirm !== 'function') throw new TypeError('A delete confirmation callback is required.');
  const modal = ensureDeleteConfirmationModal();
  const config = options || {};
  modal.querySelector('#deleteConfirmationTitle').textContent = config.title || `Delete ${itemType}?`;
  modal.querySelector('#deleteConfirmationDescription').textContent = config.description
    || `Are you sure you want to permanently delete this ${itemType}?`;
  modal.querySelector('#deleteConfirmationItem').textContent = itemName || `Untitled ${itemType}`;
  modal.querySelector('#deleteConfirmationWarning').textContent = config.warning || 'This action cannot be undone.';
  modal.querySelector('[data-confirm-delete]').textContent = config.buttonLabel || `Delete ${itemType}`;
  deleteConfirmationCallback = onConfirm;
  openModal('deleteConfirmationModal');
  modal.querySelector('.delete-confirm-cancel')?.focus();
}

function renderSidebar(role) {
  const nav = role === 'teacher' ? TEACHER_NAV : STUDENT_NAV;
  const active = getActivePage();
  const session = getSession() || {};
  const logoSrc = '../assets/logo.png';

  const navHtml = nav.map((item) => `
    <a href="${item.href}" class="${item.href === active ? 'active' : ''}">
      <i data-lucide="${item.icon}"></i>
      <span>${item.label}</span>
    </a>
  `).join('');

  return `
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-brand">
        <img src="${logoSrc}" alt="StudyBuddy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
        <div class="brand-icon" style="display:none"><i data-lucide="graduation-cap"></i></div>
        <span>StudyBuddy</span>
      </div>
      <nav class="sidebar-nav">
        ${navHtml}
        <div class="sidebar-divider"></div>
        <a href="settings.php" class="${active === 'settings.php' ? 'active' : ''}">
          <i data-lucide="settings"></i><span>Settings</span>
        </a>
        <a href="#" id="logoutBtn">
          <i data-lucide="log-out"></i><span>Log Out</span>
        </a>
      </nav>
      <div class="sidebar-footer">
        <div class="user-card" id="sidebarUserCard">
          <div class="avatar">${session.avatarInitials || 'JD'}</div>
          <div class="meta">
            <div class="name">${session.name || 'User'}</div>
            <div class="role">${role === 'teacher' ? 'Teacher' : 'Student'}</div>
          </div>
          <i data-lucide="chevron-right" class="chevron"></i>
        </div>
      </div>
    </aside>
    <div class="sidebar-overlay" id="sidebarOverlay"></div>
  `;
}

function renderHeader(role, searchPlaceholder) {
  const session = getSession() || {};
  const placeholder = searchPlaceholder || (role === 'teacher'
    ? 'Search classes, students, assignments, or anything...'
    : 'Search subjects, assignments, or tasks...');

  return `
    <header class="top-header">
      <button type="button" class="menu-toggle" id="menuToggle" aria-label="Menu">
        <i data-lucide="menu"></i>
      </button>
      <div class="header-search">
        <i data-lucide="search" class="search-icon"></i>
        <input type="search" placeholder="${placeholder}" id="globalSearch" />
      </div>
      <div class="header-actions">
        <button type="button" class="icon-btn" id="notifBtn" aria-label="Notifications">
          <i data-lucide="bell"></i>
          <span class="badge-dot"></span>
        </button>
        <div class="header-divider"></div>
        <div class="header-user" id="headerUser">
          <div class="avatar">${session.avatarInitials || 'JD'}</div>
          <div>
            <div class="name">${session.name || 'User'}</div>
            <div class="role-label">${role === 'teacher' ? 'Teacher' : 'Student'}</div>
          </div>
          <i data-lucide="chevron-down" class="chevron"></i>
        </div>
      </div>
    </header>
  `;
}

function initShell(role) {
  seedIfNeeded();
  const session = requireAuth(role);
  if (!session) return null;

  const shell = document.getElementById('appShell');
  if (!shell) return session;

  const existingMain = shell.querySelector('.page-content');
  const pageContent = existingMain ? existingMain.outerHTML : '<div class="page-content"></div>';

  shell.innerHTML = `
    ${renderSidebar(role)}
    <div class="main-wrap">
      ${renderHeader(role)}
      ${pageContent}
    </div>
  `;

  document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    logout();
  });

  document.getElementById('menuToggle')?.addEventListener('click', () => {
    document.body.classList.toggle('sidebar-open');
  });
  document.getElementById('sidebarOverlay')?.addEventListener('click', () => {
    document.body.classList.remove('sidebar-open');
  });

  document.getElementById('notifBtn')?.addEventListener('click', () => {
    showToast('You have 3 new notifications', 'info');
  });

  document.getElementById('sidebarUserCard')?.addEventListener('click', () => {
    window.location.href = 'settings.php';
  });
  document.getElementById('headerUser')?.addEventListener('click', () => {
    window.location.href = 'settings.php';
  });

  // Close action menus on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.action-menu-wrap')) {
      document.querySelectorAll('.action-dropdown.open').forEach((d) => d.classList.remove('open'));
    }
  });

  if (typeof lucide !== 'undefined') lucide.createIcons();
  return session;
}

function wireModalClosers() {
  document.querySelectorAll('[data-close-modal]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-close-modal');
      closeModal(id);
    });
  });
  document.querySelectorAll('.modal-backdrop').forEach((backdrop) => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) backdrop.classList.remove('open');
    });
  });
}

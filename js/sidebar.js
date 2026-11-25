/**
 * StudyBuddy — Shared sidebar + header behavior
 */

(() => {
  const savedTheme = (() => {
    try { return localStorage.getItem('sb_theme') || 'light'; }
    catch (_) { return 'light'; }
  })();
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

  function applyTheme() {
    const theme = savedTheme === 'system'
      ? (systemDark.matches ? 'dark' : 'light')
      : (savedTheme === 'dark' ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
  }

  applyTheme();
  if (systemDark.addEventListener) systemDark.addEventListener('change', () => {
    if (savedTheme === 'system') applyTheme();
  });
  else if (systemDark.addListener) systemDark.addListener(() => {
    if (savedTheme === 'system') applyTheme();
  });
})();

const STUDENT_NAV = [
  { href: 'dashboard.php', icon: 'layout-dashboard', label: 'Dashboard' },
  { href: 'subjects.php', icon: 'book-open', label: 'Subjects' },
  { href: 'resources.php', icon: 'folder-open', label: 'Resources' },
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
  const page = parts[parts.length - 1] || 'dashboard.php';
  return page === 'class.php' ? 'classes.php' : page;
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
        <div class="notification-wrap" id="notificationWrap">
          <button type="button" class="icon-btn" id="notifBtn" aria-label="Notifications" aria-expanded="false" aria-controls="notificationsPanel">
            <i data-lucide="bell"></i>
            <span class="badge-dot" id="notifDot" hidden></span>
          </button>
          <section class="notification-panel" id="notificationsPanel" aria-label="Notifications" hidden>
            <div class="notification-panel-header">
              <h2>Notifications</h2>
              <button type="button" id="markAllNotificationsRead" hidden>Mark all read</button>
            </div>
            <div class="notification-list" id="notificationList" aria-live="polite">
              <p class="notification-empty">Loading notifications...</p>
            </div>
          </section>
        </div>
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

  const notificationWrap = document.getElementById('notificationWrap');
  const notificationButton = document.getElementById('notifBtn');
  const notificationPanel = document.getElementById('notificationsPanel');
  const notificationList = document.getElementById('notificationList');
  const notificationDot = document.getElementById('notifDot');
  const markAllReadButton = document.getElementById('markAllNotificationsRead');
  let notificationRequest = null;
  let notificationRefreshTimer = null;

  function escapeNotificationHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[char]));
  }

  function notificationDestination(item) {
    const storedTarget = String(item.dataset.notificationTarget || '');
    const allowedPages = role === 'teacher'
      ? ['dashboard.php', 'grades.php', 'assignments.php']
      : ['dashboard.php', 'assignments.php', 'todo.php', 'subjects.php', 'resources.php'];
    const page = storedTarget.split('?')[0];
    if (allowedPages.includes(page) && /^[a-z-]+\.php(?:\?[A-Za-z0-9._~%=&-]*)?$/.test(storedTarget)) {
      return storedTarget;
    }

    const title = item.querySelector('.notification-item-title')?.textContent?.toLowerCase() || '';
    if (role === 'teacher') return title.includes('assignment submitted') ? 'grades.php' : 'dashboard.php';
    if (title.includes('task')) return 'todo.php';
    if (title.includes('assignment') || title.includes('activity')) return 'assignments.php';
    if (title.includes('resource')) return 'resources.php';
    if (title.includes('class')) return 'subjects.php';
    return 'dashboard.php';
  }

  function renderNotifications(items, unreadCount) {
    const unread = Math.max(0, Number(unreadCount) || 0);
    notificationDot.hidden = unread === 0;
    notificationButton.setAttribute('aria-label', unread ? `Notifications, ${unread} unread` : 'Notifications');
    markAllReadButton.hidden = unread === 0;
    if (!items.length) {
      notificationList.innerHTML = '<p class="notification-empty">No notifications yet.</p>';
      return;
    }

    notificationList.innerHTML = items.map((item) => {
      const createdAt = new Date(String(item.created_at || ''));
      const time = Number.isNaN(createdAt.getTime()) ? '' : createdAt.toLocaleString();
      const id = Number(item.id);
      return `
        <button type="button" class="notification-item ${Number(item.is_read) ? '' : 'unread'}" data-notification-read="${id}" data-notification-target="${escapeNotificationHtml(item.target_url || '')}">
          <span class="notification-item-title">${escapeNotificationHtml(item.title || 'Update')}</span>
          <span class="notification-item-body">${escapeNotificationHtml(item.body || '')}</span>
          <time>${escapeNotificationHtml(time)}</time>
        </button>`;
    }).join('');
  }

  async function refreshNotifications(showError = false) {
    if (notificationRequest) return notificationRequest;
    notificationRequest = (async () => {
      try {
        const response = await fetch(`${SB_API_BASE}notifications.php`, {
          credentials: 'same-origin',
          cache: 'no-store',
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.ok) throw new Error(result.message || 'Notifications could not be loaded.');
        renderNotifications(Array.isArray(result.items) ? result.items : [], result.unreadCount);
      } catch (error) {
        notificationList.innerHTML = '<p class="notification-empty">Notifications could not be loaded.</p>';
        if (showError) showToast(error.message || 'Notifications could not be loaded.', 'error');
        else console.error('Could not refresh notifications.', error);
      } finally {
        notificationRequest = null;
      }
    })();
    return notificationRequest;
  }

  async function setNotificationsRead(action, id) {
    try {
      const response = await fetch(`${SB_API_BASE}notifications.php`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.content || '',
        },
        body: JSON.stringify({ action, ...(id ? { id } : {}) }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(result.message || 'Notification could not be updated.');
      if (notificationRequest) await notificationRequest;
      await refreshNotifications(true);
    } catch (error) {
      showToast(error.message || 'Notification could not be updated.', 'error');
    }
  }

  notificationButton?.addEventListener('click', () => {
    const open = notificationPanel.hidden;
    notificationPanel.hidden = !open;
    notificationButton.setAttribute('aria-expanded', String(open));
    if (open) refreshNotifications(true);
  });
  notificationPanel?.addEventListener('click', async (event) => {
    if (event.target.closest('#markAllNotificationsRead')) {
      setNotificationsRead('read-all');
      return;
    }
    const item = event.target.closest('[data-notification-read]');
    if (item) {
      const target = notificationDestination(item);
      await setNotificationsRead('read', Number(item.dataset.notificationRead));
      window.location.href = target;
    }
  });
  document.addEventListener('click', (event) => {
    if (!notificationWrap?.contains(event.target) && notificationPanel && !notificationPanel.hidden) {
      notificationPanel.hidden = true;
      notificationButton.setAttribute('aria-expanded', 'false');
    }
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && notificationPanel && !notificationPanel.hidden) {
      notificationPanel.hidden = true;
      notificationButton.setAttribute('aria-expanded', 'false');
    }
  });
  window.addEventListener('focus', () => refreshNotifications());
  window.addEventListener('studybuddy:state-updated', (event) => {
    if (!['studybuddy_assignments', 'studybuddy_tasks'].includes(event.detail?.key)) return;
    window.clearTimeout(notificationRefreshTimer);
    notificationRefreshTimer = window.setTimeout(() => refreshNotifications(), 150);
  });
  window.setInterval(() => refreshNotifications(), 60000);
  refreshNotifications();

  document.getElementById('sidebarUserCard')?.addEventListener('click', () => {
    window.location.href = 'settings.php';
  });
  document.getElementById('headerUser')?.addEventListener('click', () => {
    window.location.href = 'settings.php';
  });

  const globalSearch = document.getElementById('globalSearch');
  if (globalSearch && role === 'teacher') {
    const searchContainer = globalSearch.closest('.header-search');
    const resultsPanel = document.createElement('div');
    resultsPanel.id = 'globalSearchResults';
    resultsPanel.className = 'global-search-results';
    resultsPanel.setAttribute('role', 'listbox');
    resultsPanel.hidden = true;
    globalSearch.insertAdjacentElement('afterend', resultsPanel);
    globalSearch.setAttribute('aria-autocomplete', 'list');
    globalSearch.setAttribute('aria-haspopup', 'listbox');
    globalSearch.setAttribute('aria-controls', resultsPanel.id);
    globalSearch.setAttribute('aria-expanded', 'false');

    const escapeSearchHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[char]));
    const normalizeSearchText = (value) => String(value ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    const hideSearchResults = () => {
      resultsPanel.hidden = true;
      globalSearch.setAttribute('aria-expanded', 'false');
    };

    function findTeacherSearchResults(query) {
      const classes = getClasses();
      const normalizedQuery = normalizeSearchText(query);
      const terms = normalizedQuery.split(/\s+/).filter(Boolean);
      const matches = (values) => {
        const searchableText = normalizeSearchText(
          values.filter((value) => value !== null && value !== undefined).join(' ')
        );
        return terms.every((term) => searchableText.includes(term));
      };
      const studentMatches = getStudents()
        .filter((student) => {
          const studentClasses = classes.filter((cls) => studentMatchesClass(student, cls, true));
          return matches([
            student.name, student.email, student.studentId, student.course,
            student.year, student.yearLevel, student.section, student.block,
            student.standing, student.status, student.gpa, student.subjectCode,
            ...studentClasses.map(classDisplayName),
          ]);
        })
        .slice(0, 3)
        .map((student) => ({
          type: 'Student',
          title: student.name || student.email || 'Student',
          detail: [student.email, student.studentId && `ID ${student.studentId}`, student.course, student.year || student.yearLevel]
            .filter(Boolean)
            .join(' · '),
          href: `students.php?search=${encodeURIComponent(student.email || student.studentId || student.name || '')}`,
        }));
      const classMatches = classes
        .filter((cls) => matches([
          classDisplayName(cls), cls.name, cls.subject, cls.subjectCode, cls.code,
          cls.course, cls.year, cls.block, cls.room, cls.joinCode,
        ]))
        .slice(0, 3)
        .map((cls) => ({
          type: 'Class',
          title: classDisplayName(cls),
          detail: [cls.course, cls.year && yearLevelLabel(cls.year), cls.block && `Block ${cls.block}`]
            .filter(Boolean)
            .join(' · '),
          href: `class.php?id=${encodeURIComponent(cls.id)}`,
        }));
      const assignmentMatches = getAssignments()
        .filter((assignment) => {
          const cls = classes.find((item) => item.id === (assignment.classId || assignment.subjectId));
          return matches([
            assignment.title, assignment.name, assignment.description,
            assignment.subject, assignment.subjectCode, assignment.status,
            assignment.dueDate, cls && classDisplayName(cls),
          ]);
        })
        .slice(0, 3)
        .map((assignment) => {
          const cls = classes.find((item) => item.id === (assignment.classId || assignment.subjectId));
          return {
            type: 'Assignment',
            title: assignment.title || assignment.name || 'Assignment',
            detail: [cls && classDisplayName(cls), assignment.dueDate && `Due ${assignment.dueDate}`]
              .filter(Boolean)
              .join(' · '),
            href: `assignments.php?assignment=${encodeURIComponent(assignment.id)}`,
          };
        });
      return [...studentMatches, ...classMatches, ...assignmentMatches].slice(0, 8);
    }

    function renderTeacherSearchResults() {
      const query = globalSearch.value.trim();
      if (!query) {
        hideSearchResults();
        return;
      }

      const results = findTeacherSearchResults(query);
      resultsPanel.innerHTML = results.length
        ? results.map((result) => `
          <a class="global-search-result" href="${escapeSearchHtml(result.href)}" role="option">
            <span class="global-search-result-copy">
              <span class="global-search-result-title">${escapeSearchHtml(result.title)}</span>
              <span class="global-search-result-detail">${escapeSearchHtml(result.detail || '')}</span>
            </span>
            <span class="global-search-result-type">${escapeSearchHtml(result.type)}</span>
          </a>`).join('')
        : '<div class="global-search-empty">No matching students, classes, or assignments.</div>';
      resultsPanel.hidden = false;
      globalSearch.setAttribute('aria-expanded', 'true');
    }

    let waitingForSearchData = false;
    globalSearch.addEventListener('input', () => {
      if (SB_BOOT_SETTLED) {
        renderTeacherSearchResults();
        return;
      }
      resultsPanel.innerHTML = '<div class="global-search-empty">Loading teacher information...</div>';
      resultsPanel.hidden = false;
      globalSearch.setAttribute('aria-expanded', 'true');
      if (waitingForSearchData) return;
      waitingForSearchData = true;
      sbWhenReady(() => {
        waitingForSearchData = false;
        if (document.activeElement === globalSearch) renderTeacherSearchResults();
      });
    });
    globalSearch.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        hideSearchResults();
      } else if (event.key === 'ArrowDown' && !resultsPanel.hidden) {
        const firstResult = resultsPanel.querySelector('a');
        if (firstResult) {
          event.preventDefault();
          firstResult.focus();
        }
      } else if (event.key === 'Enter' && !resultsPanel.hidden) {
        const firstResult = resultsPanel.querySelector('a');
        if (firstResult) {
          event.preventDefault();
          window.location.href = firstResult.href;
        }
      }
    });
    document.addEventListener('click', (event) => {
      if (!searchContainer?.contains(event.target)) hideSearchResults();
    });
  }

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

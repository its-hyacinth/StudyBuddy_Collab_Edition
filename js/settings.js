/**
 * StudyBuddy — Settings (student + teacher)
 */
document.addEventListener('DOMContentLoaded', () => {
  const isTeacher = document.body.dataset.role === 'teacher';
  const session = initShell(isTeacher ? 'teacher' : 'student');
  if (!session) return;
  wireModalClosers();

  const settings = getSettings();
  const profile = (isTeacher ? settings.teacherProfile : settings.profile) || {};

  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const $ = (id) => document.getElementById(id);

  function initialsOf(name) {
    return String(name || '')
      .replace(/^Prof\.?\s*/i, '')
      .split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';
  }

  // ---------- Panels ----------
  function activatePanel(name) {
    document.querySelectorAll('.settings-nav button, [data-settings-tab]').forEach((btn) => {
      btn.classList.toggle('active', (btn.dataset.settingsTab || btn.dataset.tab || btn.dataset.panel) === name);
    });
    document.querySelectorAll('.settings-panel').forEach((panel) => {
      panel.classList.toggle('active', panel.id === `panel-${name}` || panel.dataset.panel === name);
    });
  }

  document.querySelectorAll('.settings-nav button, [data-settings-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.settingsTab || btn.dataset.tab || btn.dataset.panel || 'account';
      activatePanel(name);
    });
  });

  // ---------- Profile ----------
  // The logged-in session is the source of truth for name and email, so this page
  // always matches the sidebar and the rest of the site.
  const fieldMap = isTeacher
    ? {
        fullName: session.name || profile.fullName,
        email: session.email || profile.email,
        employeeId: profile.employeeId,
        phone: profile.phone,
        school: profile.school,
        department: profile.department,
      }
    : {
        fullName: profile.fullName,
        email: profile.email,
        studentId: profile.studentId,
        phone: profile.phone,
        school: profile.school,
        course: profile.course,
        yearLevel: profile.yearLevel,
      };

  function showProfile(values) {
    Object.entries(values).forEach(([key, val]) => {
      // Student layout: rows with data-field, inputs named field-<key>
      const row = document.querySelector(`[data-field="${key}"]`);
      const valueEl = row?.querySelector('.row-value');
      if (valueEl) valueEl.textContent = val || '—';
      const input = $(`field-${key}`);
      if (input) input.value = val || '';
      // Teacher layout: inputs named profile<Key>
      const tInput = $(`profile${cap(key)}`);
      if (tInput) tInput.value = val || '';
    });

    // Side card + account info (teacher page)
    const name = values.fullName || '';
    if ($('settingsDisplayName')) $('settingsDisplayName').textContent = name;
    if ($('settingsDisplayEmail')) $('settingsDisplayEmail').textContent = values.email || '';
    if ($('settingsAvatar')) $('settingsAvatar').textContent = initialsOf(name);
    if ($('infoEmployeeId')) $('infoEmployeeId').textContent = values.employeeId || '—';
    if ($('infoDepartment')) $('infoDepartment').textContent = values.department || '—';
    // Student overview aside
    if ($('overviewName')) $('overviewName').textContent = name;
    if ($('overviewEmail')) $('overviewEmail').textContent = values.email || '';
  }
  showProfile(fieldMap);

  // Teacher: the Save Changes button on the profile form
  $('profileForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const next = {
      fullName: $('profileFullName')?.value.trim(),
      email: $('profileEmail')?.value.trim(),
      employeeId: $('profileEmployeeId')?.value.trim(),
      phone: $('profilePhone')?.value.trim(),
      school: $('profileSchool')?.value.trim(),
      department: $('profileDepartment')?.value.trim(),
    };
    if (!next.fullName) { showToast('Full name is required', 'error'); return; }
    if (!/^\S+@\S+\.\S+$/.test(next.email || '')) { showToast('Enter a valid email', 'error'); return; }

    updateSettings({ teacherProfile: { ...getSettings().teacherProfile, ...next } });
    const user = getSession();
    if (user) setSession({ ...user, name: next.fullName, email: next.email }, user.role);
    Object.assign(fieldMap, next);
    showProfile(next);
    showToast('Profile saved. Other pages will show your new name on next load.');
  });

  // Student: click a row to edit it
  document.querySelectorAll('.settings-row[data-field]').forEach((row) => {
    row.addEventListener('click', () => {
      const field = row.dataset.field;
      const current = fieldMap[field] || '';
      const next = prompt(`Edit ${field}`, current);
      if (next === null) return;
      if (isTeacher) {
        updateSettings({ teacherProfile: { ...getSettings().teacherProfile, [field]: next } });
      } else {
        updateSettings({ profile: { ...getSettings().profile, [field]: next } });
      }
      fieldMap[field] = next;
      showProfile(fieldMap);
      if (field === 'fullName') {
        const user = getSession();
        if (user) setSession({ ...user, name: next }, user.role);
      }
      showToast('Profile updated');
    });
  });

  // ---------- Notifications ----------
  // Student markup uses [data-notif]; teacher markup uses these IDs.
  const notifIds = { notifEmail: 'email', notifPush: 'push', notifDeadlines: 'deadlines', notifMessages: 'messages' };

  function wireNotif(input, key) {
    if (!input || input.type !== 'checkbox') return;
    const saved = settings.notifications?.[key];
    if (saved !== undefined) input.checked = !!saved; // otherwise keep the page default
    input.addEventListener('change', () => {
      const notifications = { ...getSettings().notifications, [key]: input.checked };
      updateSettings({ notifications });
      showToast('Notification preference saved');
    });
  }
  document.querySelectorAll('[data-notif]').forEach((toggle) => {
    wireNotif(toggle.querySelector('input') || toggle, toggle.dataset.notif);
  });
  Object.entries(notifIds).forEach(([id, key]) => wireNotif($(id), key));

  // ---------- Appearance ----------
  function applyAppearance(a) {
    const theme = a.theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : (a.theme || 'light');
    document.documentElement.setAttribute('data-theme', theme);
    document.body.classList.toggle('compact-mode', !!a.compact);
  }
  const appearance = { theme: 'light', compact: false, ...(settings.appearance || {}) };
  if ($('themeSelect')) $('themeSelect').value = appearance.theme;
  if ($('compactMode')) $('compactMode').checked = !!appearance.compact;
  applyAppearance(appearance);

  $('themeSelect')?.addEventListener('change', (e) => {
    appearance.theme = e.target.value;
    updateSettings({ appearance: { ...(getSettings().appearance || {}), ...appearance } });
    applyAppearance(appearance);
    showToast('Theme saved');
  });
  $('compactMode')?.addEventListener('change', (e) => {
    appearance.compact = e.target.checked;
    updateSettings({ appearance: { ...(getSettings().appearance || {}), ...appearance } });
    applyAppearance(appearance);
    showToast('Layout preference saved');
  });

  // ---------- Connected accounts ----------
  function refreshConnected() {
    const connected = getSettings().connected || {};
    const classroomOn = !!connected.googleClassroom;
    const calOn = !!connected.googleCalendar;
    const driveOn = !!connected.googleDrive;

    const setToggle = (id, on) => {
      const el = $(id);
      if (el) el.checked = on;
    };
    setToggle('toggleGoogleClassroom', classroomOn);
    setToggle('toggleGoogleCalendar', calOn);
    setToggle('toggleGoogleDrive', driveOn);

    const classroomStatus = $('classroomConnectStatus');
    const calStatus = $('calendarConnectStatus') || $('googleCalStatus');
    const driveStatus = $('driveConnectStatus') || $('googleDriveStatus');
    if (classroomStatus) {
      classroomStatus.textContent = classroomOn
        ? 'Connected · Classes and coursework sync from Classroom'
        : (isTeacher
          ? 'Not connected · Import classes, roster, and coursework'
          : 'Not connected · Import BSIT 4 classes from Classroom');
    }
    if (calStatus) calStatus.textContent = calOn ? 'Connected' : 'Not connected · Optional schedule overlay';
    if (driveStatus) driveStatus.textContent = driveOn ? 'Connected' : 'Not connected · Access your files';

    const classroomBtn = $('toggleClassroom') || $('connectGoogleClassroom');
    const calBtn = $('toggleCalendar') || $('connectGoogleCalendar');
    const driveBtn = $('toggleDrive') || $('connectGoogleDrive');
    if (classroomBtn && classroomBtn.tagName === 'BUTTON') classroomBtn.textContent = classroomOn ? 'Disconnect' : 'Connect';
    if (calBtn && calBtn.tagName === 'BUTTON') calBtn.textContent = calOn ? 'Disconnect' : 'Connect';
    if (driveBtn && driveBtn.tagName === 'BUTTON') driveBtn.textContent = driveOn ? 'Disconnect' : 'Connect';

    const clientInput = $('googleClientId');
    if (clientInput && !clientInput.value) clientInput.value = getGoogleClientId();
  }

  async function toggleService(service, wantOn) {
    if (service === 'classroom' && wantOn) {
      await syncGoogleClassroom();
    } else if (wantOn) {
      connectGoogleAccount(service);
    } else {
      disconnectGoogleAccount(service);
    }
    refreshConnected();
  }

  $('toggleGoogleClassroom')?.addEventListener('change', (e) => toggleService('classroom', e.target.checked));
  $('toggleGoogleCalendar')?.addEventListener('change', (e) => toggleService('calendar', e.target.checked));
  $('toggleGoogleDrive')?.addEventListener('change', (e) => toggleService('drive', e.target.checked));
  [['toggleClassroom', 'classroom', 'googleClassroom'], ['connectGoogleClassroom', 'classroom', 'googleClassroom'],
   ['toggleCalendar', 'calendar', 'googleCalendar'], ['connectGoogleCalendar', 'calendar', 'googleCalendar'],
   ['toggleDrive', 'drive', 'googleDrive'], ['connectGoogleDrive', 'drive', 'googleDrive']]
    .forEach(([id, service, key]) => {
      $(id)?.addEventListener('click', () => toggleService(service, !getSettings().connected?.[key]));
    });

  $('saveGoogleClientId')?.addEventListener('click', () => {
    const id = $('googleClientId')?.value.trim();
    setGoogleClientId(id);
    showToast(id ? 'Classroom client ID saved' : 'Client ID cleared — using enrolled-course catalog', 'success');
  });
  $('syncClassroomSettingsBtn')?.addEventListener('click', async (e) => {
    await syncGoogleClassroom(e.currentTarget);
    refreshConnected();
  });

  // ---------- Security ----------
  // Student layout opens a modal; teacher layout has an inline form (#passwordForm).
  if ($('changePasswordModal')) {
    $('changePasswordBtn')?.addEventListener('click', () => openModal('changePasswordModal'));
  }
  $('editProfileBtn')?.addEventListener('click', () => openModal('editProfileModal'));

  $('changePasswordForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const pw = $('newPassword')?.value;
    if (!pw || pw.length < 6) { showToast('Password must be at least 6 characters', 'error'); return; }
    closeModal('changePasswordModal');
    showToast('Password updated (demo)');
  });

  $('passwordForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const current = $('currentPassword')?.value;
    const pw = $('newPassword')?.value;
    const confirmPw = $('confirmPassword')?.value;
    if (!current) { showToast('Enter your current password', 'error'); return; }
    if (!pw || pw.length < 6) { showToast('New password must be at least 6 characters', 'error'); return; }
    if (pw !== confirmPw) { showToast('Passwords do not match', 'error'); return; }
    // Nothing is stored here: a real password change has to be done by the PHP server.
    showToast('Checks passed, but password changes are not connected to the server yet', 'warning');
  });

  $('clearDataBtn')?.addEventListener('click', () => {
    if (!confirm('Reset all StudyBuddy demo data?')) return;
    Object.values(SB_KEYS).forEach((k) => sbRemove(k));
    seedIfNeeded();
    showToast('Demo data reset');
    setTimeout(() => location.reload(), 500);
  });

  document.querySelectorAll('[data-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const a = btn.dataset.action;
      if (a === 'edit-profile') openModal('editProfileModal');
      else if (a === 'change-password') openModal('changePasswordModal');
      else if (a === 'connected') activatePanel('connected');
      else if (a === 'storage') activatePanel('storage');
    });
  });

  refreshConnected();
  // Open the first panel in the nav (teacher: "profile", student: "account")
  const firstNav = document.querySelector('.settings-nav button, [data-settings-tab]');
  activatePanel(firstNav ? (firstNav.dataset.settingsTab || firstNav.dataset.tab || firstNav.dataset.panel) : 'account');
  if (typeof lucide !== 'undefined') lucide.createIcons();
});
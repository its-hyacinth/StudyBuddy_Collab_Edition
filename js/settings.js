/**
 * StudyBuddy — Settings (student + teacher)
 * Profile edits are now saved to the server (handled by the settings page's own PHP) first,
 * then mirrored to localStorage and the page.
 */
document.addEventListener('DOMContentLoaded', () => {
  const isTeacher = document.body.dataset.role === 'teacher';
  const session = initShell(isTeacher ? 'teacher' : 'student');
  if (!session) return;
  wireModalClosers();

  const settings = getSettings();
  function cleanStudentProfile(values) {
    const cleaned = { ...values };
    const sampleValues = {
      studentId: '2023-04521',
      phone: '+63 912 345 6789',
      school: CLASSROOM_META.school,
      course: CLASSROOM_META.course,
      yearLevel: CLASSROOM_META.yearLevel,
    };
    Object.entries(sampleValues).forEach(([key, value]) => {
      if (cleaned[key] === value) delete cleaned[key];
    });
    return cleaned;
  }
  const profile = isTeacher
    ? { ...(settings.teacherProfile || {}) }
    : cleanStudentProfile(settings.profile || {});
  // Real values injected by PHP (see settings page snippet). Falls back to {} if absent.
  const server = window.SB_USER || {};

  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const $ = (id) => document.getElementById(id);

  function initialsOf(name) {
    return String(name || '')
      .replace(/^(Prof|Dr|Mr|Ms|Mrs)\.?\s*/i, '')
      .split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';
  }

  // ---------- Server helper ----------
  async function saveProfileToServer(fields) {
    // Posts to the settings page itself (the PHP at the top of the page handles it)
    const res = await fetch(window.location.pathname, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        'X-Profile-Save': '1',
        'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.content || '',
      },
      body: JSON.stringify(fields),
    });
    let data = {};
    try { data = await res.json(); } catch (_) { /* non-JSON response */ }
    if (!res.ok || !data.success) throw new Error(data.message || 'Save failed');
    return data;
  }

  // Keep the sidebar/header in sync (add data-user-name / data-user-email to those elements)
  function refreshShellUser(name, email) {
    if (name !== undefined) document.querySelectorAll('[data-user-name]').forEach((el) => (el.textContent = name));
    if (email !== undefined) document.querySelectorAll('[data-user-email]').forEach((el) => (el.textContent = email));
    if (name !== undefined) document.querySelectorAll('[data-user-initials]').forEach((el) => (el.textContent = initialsOf(name)));
  }

  // Mirror a successful save into localStorage + session
  // The server (PHP session + database) is the source of truth, so this is best-effort only.
  function persistLocally(next) {
    try {
      const key = isTeacher ? 'teacherProfile' : 'profile';
      if (typeof updateSettings === 'function' && typeof getSettings === 'function') {
        const currentSettings = getSettings();
        const currentProfile = isTeacher
          ? currentSettings.teacherProfile || {}
          : cleanStudentProfile(currentSettings.profile || {});
        updateSettings({ [key]: { ...currentProfile, ...next } });
      }
      if (typeof getSession === 'function' && typeof setSession === 'function') {
        const user = getSession();
        if (user) {
          const patch = {};
          if (next.fullName !== undefined) patch.name = next.fullName;
          if (next.email !== undefined) patch.email = next.email;
          if (Object.keys(patch).length) setSession({ ...user, ...patch }, user.role);
        }
      }
    } catch (err) {
      console.warn('Local profile cache not updated:', err);
    }
  }

  // ---------- Panels ----------
  function activatePanel(name) {
    document.querySelectorAll('.settings-nav button, [data-settings-tab]').forEach((btn) => {
      const active = (btn.dataset.settingsTab || btn.dataset.tab || btn.dataset.panel) === name;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', String(active));
    });
    document.querySelectorAll('.settings-panel').forEach((panel) => {
      const active = panel.id === `panel-${name}` || panel.dataset.panel === name;
      panel.classList.toggle('active', active);
      panel.hidden = !active;
    });
  }

  document.querySelectorAll('.settings-nav button, [data-settings-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.settingsTab || btn.dataset.tab || btn.dataset.panel || 'account';
      activatePanel(name);
    });
  });

  // ---------- Profile ----------
  // Priority: server (database) > session > localStorage
  const fieldMap = isTeacher
    ? {
        fullName: server.fullName || session.name || profile.fullName,
        email: server.email || session.email || profile.email,
        employeeId: server.employeeId ?? profile.employeeId,
        phone: server.phone ?? profile.phone,
        school: server.school ?? profile.school,
        department: server.department ?? profile.department,
      }
    : {
        fullName: server.fullName || session.name || profile.fullName,
        email: server.email || session.email || profile.email,
        studentId: server.studentId ?? profile.studentId,
        phone: server.phone ?? profile.phone,
        school: server.school ?? profile.school,
        course: server.course ?? profile.course,
        yearLevel: server.yearLevel ?? profile.yearLevel,
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
    const name = values.fullName ?? fieldMap.fullName ?? '';
    const email = values.email ?? fieldMap.email ?? '';
    if ($('settingsDisplayName')) $('settingsDisplayName').textContent = name;
    if ($('settingsName')) $('settingsName').textContent = name;
    if ($('settingsDisplayEmail')) $('settingsDisplayEmail').textContent = email;
    if ($('settingsAvatar')) $('settingsAvatar').textContent = initialsOf(name);
    if ($('infoEmployeeId')) $('infoEmployeeId').textContent = values.employeeId || fieldMap.employeeId || '—';
    if ($('infoDepartment')) $('infoDepartment').textContent = values.department || fieldMap.department || '—';
    // Student overview aside
    if ($('overviewName')) $('overviewName').textContent = name;
    if ($('overviewEmail')) $('overviewEmail').textContent = email;
    if ($('settingsRole') && !isTeacher) {
      $('settingsRole').textContent = `Student${values.course || fieldMap.course ? ` · ${values.course || fieldMap.course}` : ''}${values.yearLevel || fieldMap.yearLevel ? ` · ${values.yearLevel || fieldMap.yearLevel}` : ''}`;
    }
  }
  showProfile(fieldMap);

  function openProfileEditor(field = 'fullName') {
    if (field === 'password') {
      openModal('changePasswordModal');
      return;
    }
    const input = $('editValue');
    const fieldInput = $('editField');
    if (!input || !fieldInput || !Object.prototype.hasOwnProperty.call(fieldMap, field)) return;
    fieldInput.value = field;
    input.type = field === 'email' ? 'email' : 'text';
    input.value = fieldMap[field] || '';
    input.autocomplete = field === 'email' ? 'email' : 'off';
    const label = $('editFieldLabel');
    if (label) label.textContent = field.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase());
    openModal('editProfileModal');
  }

  $('editProfileForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const field = $('editField')?.value;
    const next = $('editValue')?.value.trim();
    if (!field || next === undefined || !Object.prototype.hasOwnProperty.call(fieldMap, field)) {
      showToast('Choose a valid profile field.', 'error');
      return;
    }
    if (field === 'fullName' && !next) { showToast('Full name is required.', 'error'); return; }
    if (field === 'email' && !/^\S+@\S+\.\S+$/.test(next)) { showToast('Enter a valid email.', 'error'); return; }
    const submit = event.currentTarget.querySelector('[type="submit"]');
    if (submit) submit.disabled = true;
    try {
      await saveProfileToServer({ [field]: next });
      persistLocally({ [field]: next });
      fieldMap[field] = next;
      showProfile(fieldMap);
      if (field === 'fullName') refreshShellUser(next, undefined);
      if (field === 'email') refreshShellUser(undefined, next);
      closeModal('editProfileModal');
      showToast('Profile updated.');
    } catch (error) {
      showToast(error.message || 'Profile could not be saved.', 'error');
    } finally {
      if (submit) submit.disabled = false;
    }
  });

  // Teacher: Save Changes on the profile form
  $('profileForm')?.addEventListener('submit', async (e) => {
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

    const btn = $('saveProfileBtn');
    if (btn) btn.disabled = true;
    try {
      await saveProfileToServer(next);
      persistLocally(next);
      Object.assign(fieldMap, next);
      showProfile(next);
      refreshShellUser(next.fullName, next.email);
      showToast('Profile saved');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      if (btn) btn.disabled = false;
    }
  });

  // Student: click a row to edit it (one field at a time)
  document.querySelectorAll('.settings-row[data-field]').forEach((row) => {
    const openEditor = () => openProfileEditor(row.dataset.field);
    row.setAttribute('role', 'button');
    row.setAttribute('tabindex', '0');
    row.addEventListener('click', openEditor);
    row.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openEditor(); }
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
  // Saved under its own localStorage keys so every page can apply it (see the head snippet).
  const THEME_KEY = 'sb_theme';
  const COMPACT_KEY = 'sb_compact';
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (_) { return d; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (_) { /* storage blocked */ } },
  };
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

  function applyAppearance(a) {
    const theme = a.theme === 'system'
      ? (systemDark.matches ? 'dark' : 'light')
      : (a.theme === 'dark' ? 'dark' : 'light');
    const root = document.documentElement;
    // Set every common convention so it works with however the CSS was written
    root.setAttribute('data-theme', theme);
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
    document.body.classList.toggle('dark', theme === 'dark');
    document.body.classList.toggle('compact-mode', !!a.compact);
  }

  const savedAppearance = settings.appearance || {};
  const appearance = {
    theme: store.get(THEME_KEY, savedAppearance.theme || 'light'),
    compact: store.get(COMPACT_KEY, String(!!savedAppearance.compact)) === 'true',
  };
  if ($('themeSelect')) $('themeSelect').value = appearance.theme;
  if ($('compactMode')) $('compactMode').checked = appearance.compact;
  applyAppearance(appearance);

  function saveAppearance() {
    store.set(THEME_KEY, appearance.theme);
    store.set(COMPACT_KEY, String(appearance.compact));
    try {
      if (typeof updateSettings === 'function' && typeof getSettings === 'function') {
        updateSettings({ appearance: { ...(getSettings().appearance || {}), ...appearance } });
      }
    } catch (_) { /* optional mirror */ }
  }

  $('themeSelect')?.addEventListener('change', (e) => {
    appearance.theme = e.target.value;
    saveAppearance();
    applyAppearance(appearance);
    showToast('Theme saved');
  });
  $('compactMode')?.addEventListener('change', (e) => {
    appearance.compact = e.target.checked;
    saveAppearance();
    applyAppearance(appearance);
    showToast('Layout preference saved');
  });
  // "System" follows the OS live
  const onSystemChange = () => { if (appearance.theme === 'system') applyAppearance(appearance); };
  if (systemDark.addEventListener) systemDark.addEventListener('change', onSystemChange);
  else if (systemDark.addListener) systemDark.addListener(onSystemChange);

  const privacy = { profileVisibility: 'classmates', showProgress: true, activityStatus: true, ...(settings.privacy || {}) };
  if ($('profileVisibility')) $('profileVisibility').value = privacy.profileVisibility;
  if ($('showProgress')) $('showProgress').checked = !!privacy.showProgress;
  if ($('activityStatus')) $('activityStatus').checked = !!privacy.activityStatus;
  const savePrivacy = () => {
    privacy.profileVisibility = $('profileVisibility')?.value || privacy.profileVisibility;
    privacy.showProgress = !!$('showProgress')?.checked;
    privacy.activityStatus = !!$('activityStatus')?.checked;
    updateSettings({ privacy });
    showToast('Privacy preferences saved.');
  };
  ['profileVisibility', 'showProgress', 'activityStatus'].forEach((id) => $(id)?.addEventListener('change', savePrivacy));

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
    setToggle('toggleGoogleCalendar', isTeacher && calOn);
    setToggle('toggleGoogleDrive', isTeacher && driveOn);

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
    if (calStatus) calStatus.textContent = calOn
      ? 'Connected · Events come from your Google Calendar'
      : 'Not connected · Show events from Google Calendar';
    if (driveStatus) driveStatus.textContent = driveOn
      ? 'Connected · Files come from your Google Drive'
      : 'Not connected · Access your Google Drive files';
    const googleStatus = window.SB_GOOGLE;
    const setupNote = $('googleSetupNote');
    if (setupNote && googleStatus) {
      if (!googleStatus.configured) {
        setupNote.textContent = `Classroom, Calendar, and Drive use one Google login. Put the OAuth client ID and secret in config/google.php. Redirect URI: ${googleStatus.redirectUri}`;
      } else if (googleStatus.connected) {
        const calendarReady = String(googleStatus.scopes || '').includes('/auth/calendar');
        setupNote.textContent = `Connected as ${googleStatus.email}. ${calendarReady ? 'Classroom, Calendar, and Drive use this account.' : 'Reconnect Google to allow Calendar.'}`;
      } else {
        setupNote.textContent = 'Google credentials are saved. Connect Classroom, Calendar, or Drive to sign in.';
      }
    }
    const accountEmail = $('googleAccountEmail');
    if (accountEmail && googleStatus?.email) accountEmail.textContent = googleStatus.email;

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
    if (service !== 'classroom' && service !== 'drive' && service !== 'calendar') return;
    try {
      const status = await googleConnectionStatus(true);
      const calendarReady = String(status.scopes || '').includes('/auth/calendar');
      if (!status.configured) {
        showToast('Add the Google client ID and secret in config/google.php. The redirect URI is listed under Connected Accounts.', 'warning');
        refreshConnected();
        return;
      }
      if (wantOn && (!status.connected || (service === 'calendar' && !calendarReady))) {
        beginGoogleConnect();
        return;
      }
      if (wantOn && service === 'classroom') {
        await syncGoogleClassroom();
      } else if (wantOn && service === 'calendar') {
        await syncGoogleCalendar();
      } else if (wantOn) {
        showToast(status.email ? `Google Drive is connected as ${status.email}` : 'Google Drive is connected.', 'success');
        if (typeof window.refreshDriveFromGoogle === 'function') await window.refreshDriveFromGoogle();
      } else {
        const response = await fetch(`${SB_API_BASE}google.php?action=disconnect`, {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.content || '' },
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.ok) throw new Error(result.message || 'Could not disconnect Google.');
        window.SB_GOOGLE = null;
        const current = getSettings();
        updateSettings({
          connected: { ...current.connected, googleClassroom: false, googleDrive: false, googleCalendar: false },
        });
        showToast('Disconnected Google Classroom, Calendar, and Drive.', 'warning');
      }
      await refreshGoogleConnection();
    } catch (error) {
      showToast(error.message || 'Google connection failed.', 'error');
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
  window.refreshConnectedAccounts = refreshConnected;

  // ---------- Security ----------
  // Student layout opens a modal; teacher layout has an inline form (#passwordForm).
  if ($('changePasswordModal')) {
    $('changePasswordBtn')?.addEventListener('click', () => openModal('changePasswordModal'));
  }
  $('editProfileBtn')?.addEventListener('click', () => openModal('editProfileModal'));

  $('changePasswordForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const currentPassword = $('currentPassword')?.value || '';
    const newPassword = $('newPassword')?.value || '';
    const confirmPassword = $('confirmPassword')?.value || '';
    if (!currentPassword) { showToast('Enter your current password.', 'error'); return; }
    if (newPassword.length < 8) { showToast('New password must be at least 8 characters.', 'error'); return; }
    if (newPassword !== confirmPassword) { showToast('Passwords do not match.', 'error'); return; }
    const submit = form.querySelector('[type="submit"]');
    if (submit) submit.disabled = true;
    try {
      const response = await apiAuth('change-password', { currentPassword, newPassword, code: $('passwordAuthenticatorCode')?.value || '' });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.message || 'Password could not be updated.');
      closeModal('changePasswordModal');
      form.reset();
      showToast('Password updated.');
    } catch (error) {
      showToast(error.message || 'Password could not be updated.', 'error');
    } finally {
      if (submit) submit.disabled = false;
    }
  });

  $('passwordForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const current = $('currentPassword')?.value || '';
    const pw = $('newPassword')?.value || '';
    const confirmPw = $('confirmPassword')?.value || '';
    if (pw.length < 8) { showToast('New password must be at least 8 characters', 'error'); return; }
    if (pw !== confirmPw) { showToast('Passwords do not match', 'error'); return; }
    try {
      const response = await apiAuth('change-password', { currentPassword: current, newPassword: pw, code: $('passwordAuthenticatorCode')?.value || '' });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.message || 'Password could not be updated.');
      e.currentTarget.reset();
      showToast('Password updated.');
    } catch (error) {
      showToast(error.message || 'Password could not be updated.', 'error');
    }
  });

  $('deleteAccountBtn')?.addEventListener('click', () => openModal('deleteAccountModal'));
  $('deleteAccountForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const password = $('deleteAccountPassword')?.value || '';
    const confirmation = $('deleteAccountConfirmation')?.value.trim() || '';
    if (confirmation !== 'DELETE') { showToast('Type DELETE exactly to confirm.', 'error'); return; }
    const submit = form.querySelector('[type="submit"]');
    if (submit) submit.disabled = true;
    try {
      const response = await apiAuth('delete-account', { password, confirmation, code: $('deleteAccountCode')?.value.trim() || '' });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.message || 'Account could not be deleted.');
      if (result.cleanupWarning) showToast('Account deleted, but some uploaded files could not be removed.', 'warning');
      window.location.href = '../index.php';
    } catch (error) {
      showToast(error.message || 'Account could not be deleted.', 'error');
    } finally {
      if (submit) submit.disabled = false;
    }
  });

  $('clearDataBtn')?.addEventListener('click', () => {
    if (!confirm('Reset all StudyBuddy demo data?')) return;
    Object.values(SB_KEYS).forEach((k) => sbRemove(k));
    seedIfNeeded();
    showToast('Demo data reset');
    setTimeout(() => location.reload(), 500);
  });

  function exportAccountData() {
    const data = {
      exportedAt: new Date().toISOString(),
      profile: getSettings().profile || {},
      subjects: getSubjects(),
      assignments: getAssignments(),
      tasks: getTasks(),
      schedule: getSchedule(),
      driveFiles: getDriveFiles().map(({ url, ...file }) => file),
      progress: getProgress(),
      settings: getSettings(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `studybuddy-data-${localDateStr()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Your data export has been downloaded.');
  }
  $('exportDataBtn')?.addEventListener('click', exportAccountData);

  const subjectCount = $('settingsSubjectCount');
  if (subjectCount) subjectCount.textContent = getSubjects().length;
  const progressValue = $('settingsProgressValue');
  if (progressValue) {
    const subjects = getSubjects();
    const average = subjects.length
      ? Math.round(subjects.reduce((sum, subject) => sum + Math.min(Math.max(Number(subject.progress) || 0, 0), 100), 0) / subjects.length)
      : 0;
    progressValue.textContent = `${average}%`;
  }
  const storageValue = $('localStorageUsage');
  const storageBar = $('storageBar');
  if (storageValue && storageBar) {
    const usedBytes = getDriveFiles().reduce((sum, file) => sum + (Number(file.sizeBytes) || 0), 0);
    const totalGb = Math.max(Number(getSettings().storageTotal) || 50, 0.1);
    const usedGb = usedBytes / (1024 ** 3);
    storageValue.textContent = `${usedGb.toFixed(2)} GB of ${totalGb} GB`;
    storageBar.style.width = `${Math.min((usedGb / totalGb) * 100, 100)}%`;
  }

  document.querySelectorAll('[data-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const a = btn.dataset.action;
      if (a === 'edit-profile') openProfileEditor('fullName');
      else if (a === 'change-password') openModal('changePasswordModal');
      else if (a === 'connect-google') activatePanel('connected');
      else if (a === 'export-data') exportAccountData();
      else if (a === 'logout') logout();
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
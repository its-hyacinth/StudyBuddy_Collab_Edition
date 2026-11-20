/**
 * StudyBuddy — Settings (student + teacher)
 */
document.addEventListener('DOMContentLoaded', () => {
  const isTeacher = document.body.dataset.role === 'teacher';
  const session = initShell(isTeacher ? 'teacher' : 'student');
  if (!session) return;
  wireModalClosers();

  const settings = getSettings();
  const profile = isTeacher ? settings.teacherProfile : settings.profile;

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

  // Hydrate account fields
  const fieldMap = isTeacher
    ? {
        fullName: profile.fullName,
        email: profile.email,
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

  Object.entries(fieldMap).forEach(([key, val]) => {
    const row = document.querySelector(`[data-field="${key}"]`);
    if (row) {
      const valueEl = row.querySelector('.row-value');
      if (valueEl) valueEl.textContent = val || '—';
    }
    const input = document.getElementById(`field-${key}`);
    if (input) input.value = val || '';
  });

  // Overview aside
  const overviewName = document.getElementById('overviewName');
  const overviewEmail = document.getElementById('overviewEmail');
  if (overviewName) overviewName.textContent = profile.fullName;
  if (overviewEmail) overviewEmail.textContent = profile.email;

  document.querySelectorAll('.settings-row[data-field]').forEach((row) => {
    row.addEventListener('click', () => {
      const field = row.dataset.field;
      const current = fieldMap[field] || '';
      const next = prompt(`Edit ${field}`, current);
      if (next === null) return;
      const patch = {};
      if (isTeacher) {
        const teacherProfile = { ...getSettings().teacherProfile, [field]: next };
        updateSettings({ teacherProfile });
      } else {
        const profileNext = { ...getSettings().profile, [field]: next };
        updateSettings({ profile: profileNext });
      }
      const valueEl = row.querySelector('.row-value');
      if (valueEl) valueEl.textContent = next;
      fieldMap[field] = next;
      if (field === 'fullName') {
        const user = getSession();
        if (user) {
          setSession({ ...user, name: next }, user.role);
          if (overviewName) overviewName.textContent = next;
        }
      }
      showToast('Profile updated');
    });
  });

  // Notifications toggles
  document.querySelectorAll('[data-notif]').forEach((toggle) => {
    const key = toggle.dataset.notif;
    const input = toggle.querySelector('input') || toggle;
    if (input.type === 'checkbox') {
      input.checked = !!settings.notifications?.[key];
      input.addEventListener('change', () => {
        const notifications = { ...getSettings().notifications, [key]: input.checked };
        updateSettings({ notifications });
        showToast('Notification preference saved');
      });
    }
  });

  // Connected accounts
  function refreshConnected() {
    const connected = getSettings().connected || {};
    const classroomOn = !!connected.googleClassroom;
    const calOn = !!connected.googleCalendar;
    const driveOn = !!connected.googleDrive;

    const setToggle = (id, on) => {
      const el = document.getElementById(id);
      if (el) el.checked = on;
    };
    setToggle('toggleGoogleClassroom', classroomOn);
    setToggle('toggleGoogleCalendar', calOn);
    setToggle('toggleGoogleDrive', driveOn);

    const classroomStatus = document.getElementById('classroomConnectStatus');
    const calStatus = document.getElementById('calendarConnectStatus') || document.getElementById('googleCalStatus');
    const driveStatus = document.getElementById('driveConnectStatus') || document.getElementById('googleDriveStatus');
    if (classroomStatus) {
      classroomStatus.textContent = classroomOn
        ? 'Connected · Classes and coursework sync from Classroom'
        : 'Not connected · Import BSIT 4 classes from Classroom';
    }
    if (calStatus) calStatus.textContent = calOn ? 'Connected' : 'Not connected · Optional schedule overlay';
    if (driveStatus) driveStatus.textContent = driveOn ? 'Connected' : 'Not connected · Access your files';

    const classroomBtn = document.getElementById('toggleClassroom') || document.getElementById('connectGoogleClassroom');
    const calBtn = document.getElementById('toggleCalendar') || document.getElementById('connectGoogleCalendar');
    const driveBtn = document.getElementById('toggleDrive') || document.getElementById('connectGoogleDrive');
    if (classroomBtn && classroomBtn.tagName === 'BUTTON') classroomBtn.textContent = classroomOn ? 'Disconnect' : 'Connect';
    if (calBtn && calBtn.tagName === 'BUTTON') calBtn.textContent = calOn ? 'Disconnect' : 'Connect';
    if (driveBtn && driveBtn.tagName === 'BUTTON') driveBtn.textContent = driveOn ? 'Disconnect' : 'Connect';

    const clientInput = document.getElementById('googleClientId');
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

  document.getElementById('toggleGoogleClassroom')?.addEventListener('change', (e) => {
    toggleService('classroom', e.target.checked);
  });
  document.getElementById('toggleGoogleCalendar')?.addEventListener('change', (e) => {
    toggleService('calendar', e.target.checked);
  });
  document.getElementById('toggleGoogleDrive')?.addEventListener('change', (e) => {
    toggleService('drive', e.target.checked);
  });
  document.getElementById('toggleClassroom')?.addEventListener('click', () => {
    toggleService('classroom', !getSettings().connected?.googleClassroom);
  });
  document.getElementById('connectGoogleClassroom')?.addEventListener('click', () => {
    toggleService('classroom', !getSettings().connected?.googleClassroom);
  });
  document.getElementById('toggleCalendar')?.addEventListener('click', () => {
    toggleService('calendar', !getSettings().connected?.googleCalendar);
  });
  document.getElementById('connectGoogleCalendar')?.addEventListener('click', () => {
    toggleService('calendar', !getSettings().connected?.googleCalendar);
  });
  document.getElementById('toggleDrive')?.addEventListener('click', () => {
    toggleService('drive', !getSettings().connected?.googleDrive);
  });
  document.getElementById('connectGoogleDrive')?.addEventListener('click', () => {
    toggleService('drive', !getSettings().connected?.googleDrive);
  });
  document.getElementById('saveGoogleClientId')?.addEventListener('click', () => {
    const id = document.getElementById('googleClientId')?.value.trim();
    setGoogleClientId(id);
    showToast(id ? 'Classroom client ID saved' : 'Client ID cleared — using enrolled-course catalog', 'success');
  });
  document.getElementById('syncClassroomSettingsBtn')?.addEventListener('click', async (e) => {
    await syncGoogleClassroom(e.currentTarget);
    refreshConnected();
  });

  document.getElementById('changePasswordBtn')?.addEventListener('click', () => openModal('changePasswordModal'));
  document.getElementById('editProfileBtn')?.addEventListener('click', () => openModal('editProfileModal'));

  document.getElementById('changePasswordForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const pw = document.getElementById('newPassword')?.value;
    if (!pw || pw.length < 6) { showToast('Password must be at least 6 characters', 'error'); return; }
    closeModal('changePasswordModal');
    showToast('Password updated (demo)');
  });

  document.getElementById('clearDataBtn')?.addEventListener('click', () => {
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
  activatePanel('account');
  if (typeof lucide !== 'undefined') lucide.createIcons();
});

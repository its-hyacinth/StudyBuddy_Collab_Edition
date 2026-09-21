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
      btn.classList.toggle('active', (btn.dataset.settingsTab || btn.dataset.tab) === name);
    });
    document.querySelectorAll('.settings-panel').forEach((panel) => {
      panel.classList.toggle('active', panel.id === `panel-${name}` || panel.dataset.panel === name);
    });
  }

  document.querySelectorAll('.settings-nav button, [data-settings-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.settingsTab || btn.dataset.tab || 'account';
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
    const calBadge = document.getElementById('calConnectedBadge');
    const driveBadge = document.getElementById('driveConnectedBadge');
    const calBtn = document.getElementById('toggleCalendar');
    const driveBtn = document.getElementById('toggleDrive');
    if (calBadge) {
      calBadge.textContent = connected.googleCalendar ? 'Connected' : 'Not connected';
      calBadge.className = `badge ${connected.googleCalendar ? 'badge-completed' : 'badge-pending'}`;
    }
    if (driveBadge) {
      driveBadge.textContent = connected.googleDrive ? 'Connected' : 'Not connected';
      driveBadge.className = `badge ${connected.googleDrive ? 'badge-completed' : 'badge-pending'}`;
    }
    if (calBtn) calBtn.textContent = connected.googleCalendar ? 'Disconnect' : 'Connect';
    if (driveBtn) driveBtn.textContent = connected.googleDrive ? 'Disconnect' : 'Connect';
  }

  document.getElementById('toggleCalendar')?.addEventListener('click', () => {
    const connected = getSettings().connected || {};
    if (connected.googleCalendar) disconnectGoogleAccount('calendar');
    else connectGoogleAccount('calendar');
    refreshConnected();
  });
  document.getElementById('toggleDrive')?.addEventListener('click', () => {
    const connected = getSettings().connected || {};
    if (connected.googleDrive) disconnectGoogleAccount('drive');
    else connectGoogleAccount('drive');
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
    Object.values(SB_KEYS).forEach((k) => localStorage.removeItem(k));
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

/**
 * StudyBuddy — Google Calendar / Google Drive integration placeholders
 *
 * ============================================================
 * FUTURE ARCHITECTURE (production)
 * ============================================================
 *   StudyBuddy (JS frontend)
 *        │  fetch / XHR
 *        ▼
 *   PHP backend (API endpoints)
 *        │
 *        ├──► MySQL DB  (users, subjects, assignments, sync tokens)
 *        ├──► Google Calendar API  (OAuth 2.0 + calendar.events)
 *        └──► Google Drive API     (OAuth 2.0 + drive.files)
 *
 * The functions below simulate the latency and UX of those API
 * calls so the frontend can be wired to real PHP endpoints later
 * without restructuring the UI. Replace mock bodies with:
 *   fetch('/api/google/calendar/sync', { method: 'POST', credentials: 'include' })
 *   fetch('/api/google/drive/sync', { method: 'POST', credentials: 'include' })
 * ============================================================
 */

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * mockGoogleCalendarSync
 * Simulates syncing local schedule events with Google Calendar.
 * In production: PHP exchanges OAuth token → lists/creates events.
 */
async function mockGoogleCalendarSync(buttonEl) {
  if (buttonEl) {
    buttonEl.classList.add('loading');
    const original = buttonEl.innerHTML;
    buttonEl.dataset.originalHtml = original;
    buttonEl.innerHTML = '<span class="spinner"></span> Syncing...';
  }
  try {
    await delay(1200);
    const settings = getSettings();
    updateSettings({
      connected: { ...settings.connected, googleCalendar: true },
    });
    showToast('Synced with Google Calendar ✅', 'success');
    return { ok: true, syncedAt: new Date().toISOString() };
  } catch (err) {
    showToast('Calendar sync failed. Try again.', 'error');
    return { ok: false, error: err };
  } finally {
    if (buttonEl) {
      buttonEl.classList.remove('loading');
      if (buttonEl.dataset.originalHtml) {
        buttonEl.innerHTML = buttonEl.dataset.originalHtml;
        if (typeof lucide !== 'undefined') lucide.createIcons();
      }
    }
  }
}

/**
 * mockGoogleDriveSync
 * Simulates syncing Drive file metadata into the local Drive view.
 * In production: PHP uses Drive API files.list with pageToken.
 */
async function mockGoogleDriveSync(buttonEl) {
  if (buttonEl) {
    buttonEl.classList.add('loading');
    const original = buttonEl.innerHTML;
    buttonEl.dataset.originalHtml = original;
    buttonEl.innerHTML = '<span class="spinner"></span> Syncing...';
  }
  try {
    await delay(1200);
    const settings = getSettings();
    updateSettings({
      connected: { ...settings.connected, googleDrive: true },
    });
    showToast('Synced with Google Drive ✅', 'success');
    return { ok: true, syncedAt: new Date().toISOString() };
  } catch (err) {
    showToast('Drive sync failed. Try again.', 'error');
    return { ok: false, error: err };
  } finally {
    if (buttonEl) {
      buttonEl.classList.remove('loading');
      if (buttonEl.dataset.originalHtml) {
        buttonEl.innerHTML = buttonEl.dataset.originalHtml;
        if (typeof lucide !== 'undefined') lucide.createIcons();
      }
    }
  }
}

/**
 * openInGoogleCalendar — opens Google Calendar in a new tab.
 * Once OAuth is wired, this can deep-link to the synced calendar ID.
 */
function openInGoogleCalendar() {
  window.open('https://calendar.google.com', '_blank', 'noopener,noreferrer');
}

/**
 * openInGoogleDrive — opens Google Drive in a new tab.
 * Once OAuth is wired, this can deep-link to a folder/file ID.
 */
function openInGoogleDrive(fileId) {
  const url = fileId
    ? `https://drive.google.com/file/d/${fileId}/view`
    : 'https://drive.google.com';
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * getShareableLink — mock shareable Drive link.
 * Production: PHP calls drive.permissions.create + returns webViewLink.
 */
function getShareableLink(fileName) {
  const fakeId = btoa(fileName || 'file').replace(/=/g, '').slice(0, 16);
  const link = `https://drive.google.com/file/d/${fakeId}/view?usp=sharing`;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(link).then(() => {
      showToast('Shareable link copied to clipboard', 'success');
    }).catch(() => showToast(link, 'info'));
  } else {
    showToast(link, 'info');
  }
  return link;
}

/**
 * connectGoogleAccount / disconnectGoogleAccount
 * Toggle mocked connection state stored in localStorage settings.
 */
function connectGoogleAccount(service) {
  const settings = getSettings();
  const connected = { ...settings.connected };
  if (service === 'calendar') connected.googleCalendar = true;
  if (service === 'drive') connected.googleDrive = true;
  updateSettings({ connected });
  showToast(`Connected to Google ${service === 'calendar' ? 'Calendar' : 'Drive'}`, 'success');
  return connected;
}

function disconnectGoogleAccount(service) {
  const settings = getSettings();
  const connected = { ...settings.connected };
  if (service === 'calendar') connected.googleCalendar = false;
  if (service === 'drive') connected.googleDrive = false;
  updateSettings({ connected });
  showToast(`Disconnected Google ${service === 'calendar' ? 'Calendar' : 'Drive'}`, 'warning');
  return connected;
}

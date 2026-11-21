/** Google Authenticator setup and linking a Google account from Settings. */
function drawAuthenticatorQr(target, text) {
  if (!target || typeof qrcode !== 'function') return false;
  const qr = qrcode(0, 'M');
  qr.addData(text);
  qr.make();
  const img = document.createElement('img');
  img.alt = 'Google Authenticator QR code';
  img.width = 196;
  img.height = 196;
  img.src = qr.createDataURL(4, 8);
  target.replaceChildren(img);
  return true;
}

function loadQrLibrary() {
  if (typeof qrcode === 'function') return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = '../js/vendor/qrcode.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('QR code library failed to load. Enter the setup key manually.'));
    document.head.appendChild(script);
  });
}

async function initAuthenticatorPanel() {
  const panel = document.getElementById('authenticatorPanel');
  if (!panel || panel.dataset.ready === '1') return;
  panel.dataset.ready = '1';
  const statusEl = document.getElementById('authenticatorStatus');
  const idle = document.getElementById('authenticatorIdle');
  const setup = document.getElementById('authenticatorSetup');
  const disable = document.getElementById('authenticatorDisable');
  const backup = document.getElementById('authenticatorBackup');
  let account = { hasPassword: true, totpEnabled: false, googleLinked: false, googleSignInConfigured: false };

  function paint() {
    if (statusEl) {
      statusEl.textContent = account.totpEnabled
        ? 'Google Authenticator is on. Sign-in asks for a 6-digit code.'
        : 'Off. Turn it on to require a Google Authenticator code at sign-in.';
    }
    if (idle) idle.hidden = account.totpEnabled;
    if (disable) disable.hidden = !account.totpEnabled;
    const linkStatus = document.getElementById('googleLinkStatus');
    if (linkStatus) {
      linkStatus.textContent = account.googleLinked
        ? 'This account can sign in with Google.'
        : (account.googleSignInConfigured
          ? 'Connect the Google account that uses this same email address.'
          : 'Google sign-in is not configured yet. Add a client ID in config/google.php.');
    }
    const unlink = document.getElementById('unlinkGoogle');
    if (unlink) unlink.hidden = !account.googleLinked;
    const host = document.getElementById('googleLinkButtonHost');
    if (host) host.hidden = account.googleLinked || !account.googleSignInConfigured;
  }

  try {
    const response = await fetch(`${SB_AUTH_BASE}auth.php?action=account`);
    const result = await response.json();
    if (response.ok && result.ok) account = result;
  } catch { /* the panel still offers setup, and the server checks the session */ }
  paint();

  document.getElementById('enableAuthenticator')?.addEventListener('click', async () => {
    try {
      const response = await apiAuth('authenticator-start');
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.message || 'Setup could not start.');
      document.getElementById('authenticatorSecret').textContent = result.secret;
      setup.hidden = false;
      backup.hidden = true;
      try {
        await loadQrLibrary();
        drawAuthenticatorQr(document.getElementById('authenticatorQr'), result.otpauth);
      } catch (error) {
        showToast(error.message, 'warning');
      }
    } catch (error) {
      showToast(error.message || 'Setup could not start.', 'error');
    }
  });

  document.getElementById('cancelAuthenticator')?.addEventListener('click', () => { setup.hidden = true; });
  document.getElementById('confirmAuthenticator')?.addEventListener('click', async () => {
    const code = document.getElementById('authenticatorCode')?.value.trim() || '';
    try {
      const response = await apiAuth('authenticator-confirm', { code });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.message || 'The code was not accepted.');
      account.totpEnabled = true;
      setup.hidden = true;
      const list = document.getElementById('authenticatorBackupList');
      if (list) list.replaceChildren(...(result.backupCodes || []).map((item) => {
        const node = document.createElement('div');
        node.textContent = item;
        return node;
      }));
      backup.hidden = false;
      paint();
      showToast('Google Authenticator is enabled. Save the backup codes.');
    } catch (error) {
      showToast(error.message || 'The code was not accepted.', 'error');
    }
  });

  document.getElementById('disableAuthenticator')?.addEventListener('click', async () => {
    const code = document.getElementById('disableAuthenticatorCode')?.value.trim() || '';
    try {
      const response = await apiAuth('authenticator-disable', { code });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.message || 'Authenticator could not be turned off.');
      account.totpEnabled = false;
      backup.hidden = true;
      paint();
      showToast('Google Authenticator is off.');
    } catch (error) {
      showToast(error.message || 'Authenticator could not be turned off.', 'error');
    }
  });

  document.getElementById('unlinkGoogle')?.addEventListener('click', async () => {
    try {
      const response = await apiAuth('unlink-google');
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.message || 'Google could not be disconnected.');
      account.googleLinked = false;
      paint();
      showToast('Google sign-in disconnected.');
    } catch (error) {
      showToast(error.message || 'Google could not be disconnected.', 'error');
    }
  });

  const clientId = panel.dataset.googleClientId || '';
  if (clientId && !account.googleLinked) {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => {
      const host = document.getElementById('googleLinkButtonHost');
      if (!host || !window.google?.accounts?.id) return;
      google.accounts.id.initialize({
        client_id: clientId,
        callback: async (googleResponse) => {
          try {
            const response = await apiAuth('link-google', { credential: googleResponse.credential });
            const result = await response.json();
            if (!response.ok || !result.ok) throw new Error(result.message || 'Google could not be connected.');
            account.googleLinked = true;
            paint();
            showToast('Google sign-in connected.');
          } catch (error) {
            showToast(error.message || 'Google could not be connected.', 'error');
          }
        },
        auto_select: false,
      });
      google.accounts.id.renderButton(host, { type: 'standard', theme: 'outline', size: 'medium', text: 'continue_with', width: 240 });
    };
    document.head.appendChild(script);
  }
}

document.addEventListener('DOMContentLoaded', () => { initAuthenticatorPanel(); });

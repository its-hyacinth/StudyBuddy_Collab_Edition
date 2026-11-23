/** StudyBuddy authentication backed by PHP sessions and MySQL. */
const SB_AUTH_BASE = (window.location.pathname.includes('/student/') || window.location.pathname.includes('/teacher/')) ? '../api/' : 'api/';
function csrfToken() { return document.querySelector('meta[name="csrf-token"]')?.content || ''; }
function apiAuth(action, data = {}) {
  const body = new URLSearchParams({ action, ...data });
  return fetch(`${SB_AUTH_BASE}auth.php?action=${encodeURIComponent(action)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-CSRF-Token': csrfToken() },
    body,
  });
}
function getSession() {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', `${SB_AUTH_BASE}auth.php?action=session`, false);
  xhr.send();
  try { const r = JSON.parse(xhr.responseText); return r.user || null; } catch { return null; }
}
function requireAuth(expectedRole) {
  const session = getSession();
  if (!session) { location.href = '../index.php'; return null; }
  if (expectedRole && session.role !== expectedRole) {
    location.href = session.role === 'teacher' ? '../teacher/dashboard.php' : '../student/dashboard.php';
    return null;
  }
  return session;
}
function logout() {
  apiAuth('logout').finally(() => {
    location.href = location.pathname.includes('/student/') || location.pathname.includes('/teacher/') ? '../index.php' : 'index.php';
  });
}
function showAuthError(el, message) { if (el) { el.textContent = message; el.classList.add('show'); } }
function clearAuthError(el) { if (el) { el.textContent = ''; el.classList.remove('show'); } }

function wirePasswordToggle(inputId, toggleId, label = 'password') {
  const input = document.getElementById(inputId);
  const toggle = document.getElementById(toggleId);
  if (!input || !toggle) return;
  toggle.addEventListener('click', () => {
    const showPassword = input.type === 'password';
    input.type = showPassword ? 'text' : 'password';
    toggle.setAttribute('aria-label', `${showPassword ? 'Hide' : 'Show'} ${label}`);
    toggle.setAttribute('aria-pressed', String(showPassword));
    toggle.innerHTML = `<i data-lucide="${showPassword ? 'eye-off' : 'eye'}"></i>`;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  });
}

let pendingChallenge = '';
let pendingRemember = false;

function showAuthStep(step) {
  document.getElementById('loginForm')?.toggleAttribute('hidden', step !== 'login');
  document.getElementById('signupForm')?.toggleAttribute('hidden', step !== 'login');
  document.getElementById('totpForm')?.toggleAttribute('hidden', step !== 'totp');
  document.getElementById('googleRoleForm')?.toggleAttribute('hidden', step !== 'role');
  document.querySelector('.auth-divider')?.toggleAttribute('hidden', step !== 'login');
  document.getElementById('googleLogin')?.toggleAttribute('hidden', step !== 'login');
  document.getElementById('googleButtonHost')?.toggleAttribute('hidden', step !== 'login');
  document.querySelector('.demo-toggles')?.toggleAttribute('hidden', step !== 'login');
}

function finishAuth(result) {
  if (result.redirect) location.href = result.redirect;
}

async function submitGoogleCredential(credential) {
  const errorEl = document.getElementById('loginError') || document.getElementById('signupError');
  clearAuthError(errorEl);
  try {
    const response = await apiAuth('google', { credential, remember: pendingRemember ? '1' : '0' });
    const result = await response.json();
    if (!response.ok || !result.ok) {
      showAuthError(errorEl, result.message || 'Google sign-in failed.');
      return;
    }
    if (result.requiresTotp) {
      pendingChallenge = result.challenge;
      showAuthStep('totp');
      document.getElementById('totpCode')?.focus();
      return;
    }
    if (result.needsRole) {
      const text = document.getElementById('googleRoleText');
      if (text) text.textContent = `Continue as ${result.email}. Choose how you will use StudyBuddy.`;
      showAuthStep('role');
      return;
    }
    finishAuth(result);
  } catch {
    showAuthError(errorEl, 'Unable to connect to the server.');
  }
}

function initGoogleButton() {
  const host = document.getElementById('googleButtonHost');
  const fallback = document.getElementById('googleLogin');
  const clientId = document.querySelector('meta[name="google-client-id"]')?.content?.trim() || '';
  const errorEl = document.getElementById('loginError') || document.getElementById('signupError');
  if (!clientId) {
    fallback?.addEventListener('click', () => showAuthError(errorEl, 'Google sign-in needs an OAuth client ID in config/google.php. You can still sign in with email, and turn on Google Authenticator in Settings.'));
    return;
  }
  const script = document.createElement('script');
  script.src = 'https://accounts.google.com/gsi/client';
  script.async = true;
  script.onload = () => {
    if (!window.google?.accounts?.id || !host) return;
    google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => submitGoogleCredential(response.credential),
      auto_select: false,
      cancel_on_tap_outside: true,
    });
    google.accounts.id.renderButton(host, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'rectangular',
      width: Math.max(host.offsetWidth || 320, 280),
      logo_alignment: 'left',
    });
    if (fallback) fallback.hidden = true;
  };
  script.onerror = () => fallback?.addEventListener('click', () => showAuthError(errorEl, 'Google sign-in could not be loaded. Check your connection and try again.'));
  document.head.appendChild(script);
}

function initLoginPage() {
  const form = document.getElementById('loginForm');
  const errorEl = document.getElementById('loginError');
  const pw = document.getElementById('password');
  wirePasswordToggle('password', 'togglePassword');
  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearAuthError(errorEl);
    const email = document.getElementById('email').value.trim();
    const password = pw.value;
    pendingRemember = !!document.getElementById('remember')?.checked;
    if (!email || !password) { showAuthError(errorEl, 'Please enter both email and password.'); return; }
    const submit = form.querySelector('[type="submit"]');
    if (submit) submit.disabled = true;
    try {
      const response = await apiAuth('login', { email, password, remember: pendingRemember ? '1' : '0' });
      const result = await response.json();
      if (!response.ok || !result.ok) { showAuthError(errorEl, result.message || 'Unable to log in.'); return; }
      if (result.requiresTotp) {
        pendingChallenge = result.challenge;
        showAuthStep('totp');
        document.getElementById('totpCode')?.focus();
        return;
      }
      finishAuth(result);
    } catch {
      showAuthError(errorEl, 'Unable to connect to the server.');
    } finally {
      if (submit) submit.disabled = false;
    }
  });
  document.getElementById('totpForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearAuthError(errorEl);
    const code = document.getElementById('totpCode')?.value.trim() || '';
    if (!pendingChallenge) { showAuthError(errorEl, 'Enter your password again.'); showAuthStep('login'); return; }
    try {
      const response = await apiAuth('verify-totp', { challenge: pendingChallenge, code, remember: pendingRemember ? '1' : '0' });
      const result = await response.json();
      if (!response.ok || !result.ok) { showAuthError(errorEl, result.message || 'That code was not accepted.'); return; }
      finishAuth(result);
    } catch {
      showAuthError(errorEl, 'Unable to connect to the server.');
    }
  });
  document.getElementById('totpBack')?.addEventListener('click', () => {
    pendingChallenge = '';
    clearAuthError(errorEl);
    showAuthStep('login');
  });
  document.getElementById('googleRoleForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearAuthError(errorEl);
    const role = document.getElementById('googleRole')?.value || 'student';
    try {
      const response = await apiAuth('google-complete', { role });
      const result = await response.json();
      if (!response.ok || !result.ok) { showAuthError(errorEl, result.message || 'Could not finish Google sign-in.'); return; }
      finishAuth(result);
    } catch {
      showAuthError(errorEl, 'Unable to connect to the server.');
    }
  });
  document.getElementById('demoStudent')?.addEventListener('click', () => showAuthError(errorEl, 'Demo accounts are disabled. Please register a student account.'));
  document.getElementById('demoTeacher')?.addEventListener('click', () => showAuthError(errorEl, 'Demo accounts are disabled. Please register a teacher account.'));
  document.querySelector('.auth-options a')?.addEventListener('click', (event) => {
    event.preventDefault();
    showAuthError(errorEl, 'Email password reset is not set up on this server. Sign in with Google, or use a backup code if Google Authenticator is enabled.');
  });
  initGoogleButton();
  fetch(`${SB_AUTH_BASE}auth.php?action=session`).then((response) => response.json()).then((result) => {
    if (result?.googleSignup) {
      const text = document.getElementById('googleRoleText');
      if (text) text.textContent = `Continue as ${result.googleSignup.email}. Choose how you will use StudyBuddy.`;
      showAuthStep('role');
    }
  }).catch(() => {});
}

function initSignupPage() {
  const form = document.getElementById('signupForm');
  const errorEl = document.getElementById('signupError');
  wirePasswordToggle('password', 'togglePassword');
  wirePasswordToggle('confirmPassword', 'toggleConfirmPassword', 'confirm password');
  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearAuthError(errorEl);
    const name = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const role = document.getElementById('role')?.value || 'student';
    if (!name || !email || !password || !confirmPassword) { showAuthError(errorEl, 'Please fill in all required fields.'); return; }
    if (password.length < 8) { showAuthError(errorEl, 'Password must be at least 8 characters.'); return; }
    if (password !== confirmPassword) { showAuthError(errorEl, 'Passwords do not match.'); return; }
    try {
      const response = await apiAuth('register', { name, email, password, role });
      const result = await response.json();
      if (!response.ok || !result.ok) { showAuthError(errorEl, result.message || 'Unable to create account.'); return; }
      finishAuth(result);
    } catch {
      showAuthError(errorEl, 'Unable to connect to the server.');
    }
  });
  const signupRole = document.getElementById('googleRole');
  const accountRole = document.getElementById('role');
  if (signupRole && accountRole) signupRole.value = accountRole.value;
  document.getElementById('totpForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearAuthError(errorEl);
    const code = document.getElementById('totpCode')?.value.trim() || '';
    try {
      const response = await apiAuth('verify-totp', { challenge: pendingChallenge, code, remember: '0' });
      const result = await response.json();
      if (!response.ok || !result.ok) { showAuthError(errorEl, result.message || 'That code was not accepted.'); return; }
      finishAuth(result);
    } catch {
      showAuthError(errorEl, 'Unable to connect to the server.');
    }
  });
  document.getElementById('totpBack')?.addEventListener('click', () => { pendingChallenge = ''; clearAuthError(errorEl); showAuthStep('login'); });
  document.getElementById('googleRoleForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearAuthError(errorEl);
    try {
      const response = await apiAuth('google-complete', { role: document.getElementById('googleRole')?.value || 'student' });
      const result = await response.json();
      if (!response.ok || !result.ok) { showAuthError(errorEl, result.message || 'Could not finish Google sign-in.'); return; }
      finishAuth(result);
    } catch {
      showAuthError(errorEl, 'Unable to connect to the server.');
    }
  });
  initGoogleButton();
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('loginForm')) initLoginPage();
  if (document.getElementById('signupForm')) initSignupPage();
});

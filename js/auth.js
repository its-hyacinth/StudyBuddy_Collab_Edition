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
  document.querySelector('.demo-toggles')?.toggleAttribute('hidden', step !== 'login');
}

function configureSignupRoleFields(roleId, studentFieldsId, teacherFieldsId) {
  const isStudent = document.getElementById(roleId)?.value === 'student';
  [[studentFieldsId, isStudent], [teacherFieldsId, !isStudent]].forEach(([fieldsId, visible]) => {
    const fields = document.getElementById(fieldsId);
    if (!fields) return;
    fields.hidden = !visible;
    fields.querySelectorAll('input[name]').forEach((input) => {
      input.required = visible;
      input.disabled = !visible;
    });
  });
}

function readStudentSignupFields(fieldsId) {
  const fields = document.getElementById(fieldsId);
  const value = (name) => fields?.querySelector(`[name="${name}"]`)?.value.trim() || '';
  return {
    studentId: value('studentId'),
    phone: value('phone'),
    school: value('school'),
    course: value('course'),
    yearLevel: value('yearLevel'),
  };
}

function hasSignupProfileFields(profile) {
  return Object.values(profile).every((value) => value !== '');
}

function readTeacherSignupFields(fieldsId) {
  const fields = document.getElementById(fieldsId);
  const value = (name) => fields?.querySelector(`[name="${name}"]`)?.value.trim() || '';
  return {
    employeeId: value('employeeId'),
    phone: value('phone'),
    school: value('school'),
    department: value('department'),
  };
}

function focusFirstMissingSignupField(fieldsId, profile) {
  const fields = document.getElementById(fieldsId);
  for (const [name, value] of Object.entries(profile)) {
    if (!value) {
      fields?.querySelector(`[name="${name}"]`)?.focus();
      return;
    }
  }
}

function wireGoogleRoleForm(errorEl) {
  const form = document.getElementById('googleRoleForm');
  if (!form) return;
  const roleStep = document.getElementById('googleRoleStep');
  const detailsStep = document.getElementById('googleDetailsStep');
  const role = document.getElementById('googleRole');
  const continueButton = document.getElementById('googleContinueBtn');
  const backButton = document.getElementById('googleBackBtn');
  const showDetails = () => {
    clearAuthError(errorEl);
    configureSignupRoleFields('googleRole', 'googleStudentFields', 'googleTeacherFields');
    if (roleStep) roleStep.hidden = true;
    if (detailsStep) detailsStep.hidden = false;
    (role?.value === 'student'
      ? document.querySelector('#googleStudentFields input[name="studentId"]')
      : document.querySelector('#googleTeacherFields input[name="employeeId"]')
    )?.focus();
  };
  continueButton?.addEventListener('click', showDetails);
  backButton?.addEventListener('click', () => {
    clearAuthError(errorEl);
    if (detailsStep) detailsStep.hidden = true;
    if (roleStep) roleStep.hidden = false;
    role?.focus();
  });
  role?.addEventListener('change', () => {
    configureSignupRoleFields('googleRole', 'googleStudentFields', 'googleTeacherFields');
  });
  configureSignupRoleFields('googleRole', 'googleStudentFields', 'googleTeacherFields');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearAuthError(errorEl);
    if (detailsStep?.hidden) {
      showDetails();
      return;
    }
    const selectedRole = role?.value || 'student';
    const isStudent = selectedRole === 'student';
    const profileFieldsId = isStudent ? 'googleStudentFields' : 'googleTeacherFields';
    const profile = isStudent ? readStudentSignupFields(profileFieldsId) : readTeacherSignupFields(profileFieldsId);
    if (!hasSignupProfileFields(profile)) {
      showAuthError(errorEl, `Please fill in all ${isStudent ? 'student' : 'teacher'} information fields.`);
      focusFirstMissingSignupField(profileFieldsId, profile);
      return;
    }
    const submit = form.querySelector('[type="submit"]');
    if (submit) submit.disabled = true;
    try {
      const response = await apiAuth('google-complete', { role: selectedRole, ...profile });
      const result = await response.json();
      if (!response.ok || !result.ok) { showAuthError(errorEl, result.message || 'Could not finish Google sign-in.'); return; }
      finishAuth(result);
    } catch {
      showAuthError(errorEl, 'Unable to connect to the server.');
    } finally {
      if (submit) submit.disabled = false;
    }
  });
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
  const button = document.getElementById('googleLogin');
  if (!button) return;
  button.addEventListener('click', (event) => {
    const clientId = document.querySelector('meta[name="google-client-id"]')?.content?.trim() || '';
    const errorEl = document.getElementById('loginError') || document.getElementById('signupError');
    if (!clientId) {
      event.preventDefault();
      showAuthError(errorEl, 'Google sign-in needs an OAuth client ID in config/google.php. You can still sign in with email.');
      return;
    }
    const remember = document.getElementById('remember')?.checked ? '1' : '0';
    const url = new URL(button.href, window.location.href);
    url.searchParams.set('remember', remember);
    button.href = `${url.pathname}${url.search}`;
  });
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
  wireGoogleRoleForm(errorEl);
  document.getElementById('demoStudent')?.addEventListener('click', () => showAuthError(errorEl, 'Demo accounts are disabled. Please register a student account.'));
  document.getElementById('demoTeacher')?.addEventListener('click', () => showAuthError(errorEl, 'Demo accounts are disabled. Please register a teacher account.'));
  document.querySelector('.auth-options a')?.addEventListener('click', (event) => {
    event.preventDefault();
    showAuthError(errorEl, 'Email password reset is not set up on this server. Sign in with Google, or use a backup code if Google Authenticator is enabled.');
  });
  initGoogleButton();
  const authParams = new URLSearchParams(window.location.search);
  if (authParams.get('google') === 'error') {
    showAuthError(errorEl, authParams.get('message') || 'Google sign-in failed.');
    authParams.delete('google');
    authParams.delete('message');
    const query = authParams.toString();
    window.history.replaceState({}, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
  }
  fetch(`${SB_AUTH_BASE}auth.php?action=session`).then((response) => response.json()).then((result) => {
    if (result?.requiresTotp && result.challenge) {
      pendingChallenge = result.challenge;
      pendingRemember = !!result.remember;
      showAuthStep('totp');
      document.getElementById('totpCode')?.focus();
      return;
    }
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
  const credentialsStep = document.getElementById('signupCredentialsStep');
  const detailsStep = document.getElementById('signupDetailsStep');
  const role = document.getElementById('role');
  const validateCredentials = () => {
    const name = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email');
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    if (!name || !email.value.trim() || !password || !confirmPassword) {
      showAuthError(errorEl, 'Please fill in all required fields.');
      return false;
    }
    if (!email.validity.valid) {
      showAuthError(errorEl, 'Enter a valid email address.');
      email.focus();
      return false;
    }
    if (password.length < 8) { showAuthError(errorEl, 'Password must be at least 8 characters.'); return false; }
    if (password !== confirmPassword) { showAuthError(errorEl, 'Passwords do not match.'); return false; }
    return true;
  };
  const showDetailsStep = () => {
    clearAuthError(errorEl);
    if (!validateCredentials()) return;
    configureSignupRoleFields('role', 'signupStudentFields', 'signupTeacherFields');
    if (credentialsStep) credentialsStep.hidden = true;
    if (detailsStep) detailsStep.hidden = false;
    (role?.value === 'student'
      ? document.querySelector('#signupStudentFields input[name="studentId"]')
      : document.querySelector('#signupTeacherFields input[name="employeeId"]'))?.focus();
  };
  document.getElementById('signupContinueBtn')?.addEventListener('click', showDetailsStep);
  document.getElementById('signupBackBtn')?.addEventListener('click', () => {
    clearAuthError(errorEl);
    if (detailsStep) detailsStep.hidden = true;
    if (credentialsStep) credentialsStep.hidden = false;
    role?.focus();
  });
  role?.addEventListener('change', () => {
    configureSignupRoleFields('role', 'signupStudentFields', 'signupTeacherFields');
  });
  configureSignupRoleFields('role', 'signupStudentFields', 'signupTeacherFields');
  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearAuthError(errorEl);
    if (detailsStep?.hidden) {
      showDetailsStep();
      return;
    }
    if (!validateCredentials()) {
      if (detailsStep) detailsStep.hidden = true;
      if (credentialsStep) credentialsStep.hidden = false;
      return;
    }
    const name = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const selectedRole = role?.value || 'student';
    const isStudent = selectedRole === 'student';
    const profileFieldsId = isStudent ? 'signupStudentFields' : 'signupTeacherFields';
    const profile = isStudent ? readStudentSignupFields(profileFieldsId) : readTeacherSignupFields(profileFieldsId);
    if (!hasSignupProfileFields(profile)) {
      showAuthError(errorEl, `Please fill in all ${isStudent ? 'student' : 'teacher'} information fields.`);
      focusFirstMissingSignupField(profileFieldsId, profile);
      return;
    }
    const submit = form.querySelector('[type="submit"]');
    if (submit) submit.disabled = true;
    try {
      const response = await apiAuth('register', { name, email, password, role: selectedRole, ...profile });
      const result = await response.json();
      if (!response.ok || !result.ok) { showAuthError(errorEl, result.message || 'Unable to create account.'); return; }
      finishAuth(result);
    } catch {
      showAuthError(errorEl, 'Unable to connect to the server.');
    } finally {
      if (submit) submit.disabled = false;
    }
  });
  const signupRole = document.getElementById('googleRole');
  const accountRole = document.getElementById('role');
  if (signupRole && accountRole) signupRole.value = accountRole.value;
  wireGoogleRoleForm(errorEl);
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
  initGoogleButton();
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('loginForm')) initLoginPage();
  if (document.getElementById('signupForm')) initSignupPage();
});

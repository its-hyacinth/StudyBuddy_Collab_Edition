/**
 * StudyBuddy — Auth (login / signup / logout / role)
 */

function getSession() {
  const user = sbGet(SB_KEYS.USER);
  const role = localStorage.getItem(SB_KEYS.ROLE) || (user && user.role) || null;
  return user ? { ...user, role } : null;
}

function setSession(user, role) {
  sbSet(SB_KEYS.USER, { ...user, role });
  localStorage.setItem(SB_KEYS.ROLE, role);
}

function clearSession() {
  sbRemove(SB_KEYS.USER);
  localStorage.removeItem(SB_KEYS.ROLE);
}

function requireAuth(expectedRole) {
  const session = getSession();
  if (!session) {
    window.location.href = '../index.html';
    return null;
  }
  if (expectedRole && session.role !== expectedRole) {
    window.location.href = session.role === 'teacher'
      ? '../teacher/dashboard.html'
      : '../student/dashboard.html';
    return null;
  }
  return session;
}

function logout() {
  clearSession();
  const depth = window.location.pathname.includes('/student/') || window.location.pathname.includes('/teacher/')
    ? '../index.html'
    : 'index.html';
  window.location.href = depth;
}

function detectRoleFromEmail(email) {
  const e = (email || '').toLowerCase();
  if (e.includes('prof') || e.includes('teacher') || e.includes('admin')) return 'teacher';
  return 'student';
}

function loginAs(role, overrides = {}) {
  seedIfNeeded();
  const settings = getSettings();
  const profile = role === 'teacher' ? settings.teacherProfile : settings.profile;
  const user = {
    name: overrides.name || profile.fullName || (role === 'teacher' ? 'Prof. Juan Dela Cruz' : 'Juan Dela Cruz'),
    email: overrides.email || profile.email || (role === 'teacher' ? 'prof.delacruz@email.com' : 'juan.delacruz@email.com'),
    role,
    avatarInitials: (overrides.name || profile.fullName || 'JD')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase(),
  };
  setSession(user, role);
  window.location.href = role === 'teacher' ? 'teacher/dashboard.html' : 'student/dashboard.html';
}

function initLoginPage() {
  seedIfNeeded();
  const form = document.getElementById('loginForm');
  const errorEl = document.getElementById('loginError');
  const togglePw = document.getElementById('togglePassword');
  const pwInput = document.getElementById('password');

  // Already logged in?
  const session = getSession();
  if (session) {
    window.location.href = session.role === 'teacher' ? 'teacher/dashboard.html' : 'student/dashboard.html';
    return;
  }

  togglePw?.addEventListener('click', () => {
    const type = pwInput.type === 'password' ? 'text' : 'password';
    pwInput.type = type;
    const icon = togglePw.querySelector('[data-lucide]');
    if (icon) {
      icon.setAttribute('data-lucide', type === 'password' ? 'eye' : 'eye-off');
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
  });

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    if (!email || !password) {
      if (errorEl) {
        errorEl.textContent = 'Please enter both email and password.';
        errorEl.classList.add('show');
      }
      return;
    }
    if (errorEl) errorEl.classList.remove('show');
    const role = detectRoleFromEmail(email);
    const name = role === 'teacher' ? 'Prof. Juan Dela Cruz' : 'Juan Dela Cruz';
    loginAs(role, { email, name });
  });

  document.getElementById('demoStudent')?.addEventListener('click', () => loginAs('student'));
  document.getElementById('demoTeacher')?.addEventListener('click', () => loginAs('teacher'));
  document.getElementById('googleLogin')?.addEventListener('click', () => {
    showToast('Google Sign-In would connect Classroom via OAuth. Using the student demo for now.', 'info');
    setTimeout(() => loginAs('student', { email: 'juan.google@gmail.com' }), 600);
  });
}

function initSignupPage() {
  seedIfNeeded();
  const form = document.getElementById('signupForm');
  const errorEl = document.getElementById('signupError');

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const role = document.getElementById('role')?.value || detectRoleFromEmail(email);

    if (!name || !email || !password) {
      if (errorEl) {
        errorEl.textContent = 'Please fill in all required fields.';
        errorEl.classList.add('show');
      }
      return;
    }
    if (password.length < 6) {
      if (errorEl) {
        errorEl.textContent = 'Password must be at least 6 characters.';
        errorEl.classList.add('show');
      }
      return;
    }
    loginAs(role, { name, email });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('loginForm')) initLoginPage();
  if (document.getElementById('signupForm')) initSignupPage();
});

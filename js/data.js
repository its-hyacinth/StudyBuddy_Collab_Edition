/**
 * StudyBuddy — shared data helpers backed by the PHP/MySQL state API.
 * Collection data is stored in dedicated MySQL tables; preferences use app_state.
 */

const SB_KEYS = {
  USER: 'studybuddy_user',
  ROLE: 'studybuddy_role',
  SUBJECTS: 'studybuddy_subjects',
  ASSIGNMENTS: 'studybuddy_assignments',
  TASKS: 'studybuddy_tasks',
  SCHEDULE: 'studybuddy_schedule',
  CLASSES: 'studybuddy_classes',
  STUDENTS: 'studybuddy_students',
  GRADES: 'studybuddy_grades',
  MESSAGES: 'studybuddy_messages',
  RESOURCES: 'studybuddy_resources',
  DRIVE: 'studybuddy_drive',
  SETTINGS: 'studybuddy_settings',
  SEEDED: 'studybuddy_seeded',
  PROGRESS: 'studybuddy_progress',
};

const SB_SEED_VERSION = 2;

const SB_API_BASE = (window.location.pathname.includes('/student/') || window.location.pathname.includes('/teacher/')) ? '../api/' : 'api/';
const SB_STATE_CACHE = new Map();
const SB_ROLE_STATE_KEYS = window.location.pathname.includes('/teacher/')
  ? [
      SB_KEYS.ASSIGNMENTS,
      SB_KEYS.SCHEDULE,
      SB_KEYS.CLASSES,
      SB_KEYS.STUDENTS,
      SB_KEYS.GRADES,
      SB_KEYS.MESSAGES,
      SB_KEYS.RESOURCES,
      SB_KEYS.SETTINGS,
    ]
  : [
      SB_KEYS.SUBJECTS,
      SB_KEYS.ASSIGNMENTS,
      SB_KEYS.TASKS,
      SB_KEYS.SCHEDULE,
      SB_KEYS.CLASSES,
      SB_KEYS.PROGRESS,
      SB_KEYS.SETTINGS,
      SB_KEYS.DRIVE,
    ];

let SB_BOOT_SETTLED = false;
let SB_BOOT_FAILED = false;

const SB_BOOT = (function prefetchRoleState() {
  const path = window.location.pathname;
  const onAuthPage = /\/(index|signup)\.php$/i.test(path) || /\/$/.test(path);
  if (onAuthPage) return Promise.resolve();
  const keys = SB_ROLE_STATE_KEYS;
  if (!keys.length) return Promise.resolve();
  const params = new URLSearchParams({ keys: keys.join(',') });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  return fetch(`${SB_API_BASE}state.php?${params}`, {
    credentials: 'same-origin',
    cache: 'no-store',
    signal: controller.signal,
  })
    .then((response) => {
      if (response.status === 401) {
        const path = window.location.pathname;
        const onAuthPage = /\/(index|signup)\.php$/i.test(path) || /\/$/.test(path);
        if (!onAuthPage) {
          window.location.href = path.includes('/student/') || path.includes('/teacher/') ? '../index.php' : 'index.php';
        }
        return null;
      }
      if (!response.ok) return null;
      return response.json();
    })
    .then((result) => {
      if (!result?.ok || !result.values) {
        SB_BOOT_FAILED = true;
        return;
      }
      keys.forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(result.values, key)) SB_STATE_CACHE.set(key, result.values[key]);
      });
    })
    .catch((error) => {
      SB_BOOT_FAILED = true;
      console.error('StudyBuddy could not preload data:', error);
    })
    .finally(() => clearTimeout(timer));
})();

SB_BOOT.finally(() => {
  SB_BOOT_SETTLED = true;
  document.dispatchEvent(new CustomEvent('sb-ready'));
});

function sbWhenReady(callback) {
  if (typeof callback !== 'function') return;
  if (SB_BOOT_SETTLED) callback();
  else document.addEventListener('sb-ready', () => callback(), { once: true });
}

function sbInvalidate(...keys) {
  keys.forEach((key) => SB_STATE_CACHE.delete(key));
}

function makeJoinCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 7; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)];
  return code;
}

function sbRequest(method, key, value) {
  const xhr = new XMLHttpRequest();
  const url = `${SB_API_BASE}state.php?key=${encodeURIComponent(key)}`;
  xhr.open(method, url, false); // synchronous to preserve the existing app's data-helper interface
  xhr.setRequestHeader('X-CSRF-Token', document.querySelector('meta[name="csrf-token"]')?.content || '');
  if (method === 'POST') { xhr.setRequestHeader('Content-Type','application/json'); xhr.send(JSON.stringify({key,value})); }
  else xhr.send();
  if (xhr.status === 401) { window.location.href = window.location.pathname.includes('/student/') || window.location.pathname.includes('/teacher/') ? '../index.php' : 'index.php'; return null; }
  if (xhr.status < 200 || xhr.status >= 300) { console.error('StudyBuddy server request failed:', xhr.responseText); return null; }
  try { return JSON.parse(xhr.responseText); } catch { return null; }
}
function sbGet(key, fallback = null) {
  if (SB_STATE_CACHE.has(key)) return SB_STATE_CACHE.get(key) ?? fallback;
  if (!SB_BOOT_SETTLED || SB_BOOT_FAILED) return fallback;
  const missingKeys = SB_ROLE_STATE_KEYS.filter((stateKey) => !SB_STATE_CACHE.has(stateKey));
  if (missingKeys.includes(key)) {
    const xhr = new XMLHttpRequest();
    const params = new URLSearchParams({ keys: missingKeys.join(',') });
    xhr.open('GET', `${SB_API_BASE}state.php?${params}`, false);
    xhr.setRequestHeader('Cache-Control', 'no-store');
    xhr.send();
    if (xhr.status === 401) {
      window.location.href = window.location.pathname.includes('/student/') || window.location.pathname.includes('/teacher/') ? '../index.php' : 'index.php';
      return fallback;
    }
    if (xhr.status < 200 || xhr.status >= 300) {
      console.error('StudyBuddy server request failed:', xhr.responseText);
      return fallback;
    }
    try {
      const result = JSON.parse(xhr.responseText);
      if (!result.ok || !result.values || missingKeys.some((stateKey) =>
        !Object.prototype.hasOwnProperty.call(result.values, stateKey)
      )) {
        console.error('StudyBuddy server returned incomplete state data:', result);
        return fallback;
      }
      missingKeys.forEach((stateKey) => SB_STATE_CACHE.set(stateKey, result.values[stateKey]));
      return SB_STATE_CACHE.get(key) ?? fallback;
    } catch (error) {
      console.error('StudyBuddy server returned invalid state data:', error);
      return fallback;
    }
  }
  const result = sbRequest('GET', key);
  if (result && result.ok) {
    SB_STATE_CACHE.set(key, result.value);
    return result.value ?? fallback;
  }
  return fallback;
}
async function sbPrefetchState(keys) {
  const missingKeys = keys.filter((key) => !SB_STATE_CACHE.has(key));
  if (!missingKeys.length) return;
  const params = new URLSearchParams({ keys: missingKeys.join(',') });
  const response = await fetch(`${SB_API_BASE}state.php?${params}`, {
    credentials: 'same-origin',
    cache: 'no-store',
  });
  if (response.status === 401) {
    window.location.href = window.location.pathname.includes('/student/') || window.location.pathname.includes('/teacher/') ? '../index.php' : 'index.php';
    return;
  }
  if (!response.ok) throw new Error(`Could not load schedule data: HTTP ${response.status}`);
  const result = await response.json();
  if (!result.ok) throw new Error(result.message || 'Could not load schedule data.');
  missingKeys.forEach((key) => {
    if (!Object.prototype.hasOwnProperty.call(result.values, key)) {
      throw new Error(`Schedule data response was missing ${key}.`);
    }
    SB_STATE_CACHE.set(key, result.values[key]);
  });
}
function sbSet(key, value) {
  const result = sbRequest('POST', key, value);
  if (result && result.ok) {
    SB_STATE_CACHE.set(key, value);
    window.SB_LAST_DELIVERY = result.delivery || null;
    window.dispatchEvent(new CustomEvent('studybuddy:state-updated', { detail: { key } }));
  }
}
function sbRemove(key) {
  const xhr = new XMLHttpRequest(); xhr.open('DELETE', `${SB_API_BASE}state.php?key=${encodeURIComponent(key)}`, false);
  xhr.setRequestHeader('X-CSRF-Token', document.querySelector('meta[name="csrf-token"]')?.content || ''); xhr.send();
  if (xhr.status >= 200 && xhr.status < 300) SB_STATE_CACHE.delete(key);
}

function uid(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function localDateStr(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/* Default profile values used by the settings page. */
const CLASSROOM_META = {
  school: 'Cebu Technological University — Consolacion Campus',
  campus: 'Consolacion Campus',
  course: 'BS Information Technology',
  yearLevel: '4th Year',
  section: 'BSIT_DAY_4-B',
  term: '1st Semester SY 2026-2027',
  totalUnits: 17,
};

function subjectToClass(subject) {
  const subjectCode = String(subject.subjectCode || subject.code || subject.sectionCode || '').trim();
  return {
    id: `cls_${subject.id}`,
    name: [subjectCode, subject.shortName || subject.name].filter(Boolean).join(' · '),
    subject: subject.name,
    subjectCode,
    code: subjectCode,
    subjectId: subject.id,
    short: subject.short,
    progress: subject.progress ?? null,
    professor: subject.professor || '',
    room: subject.room || '',
    section: subject.section || '',
    source: 'classroom',
  };
}

/** Letters and digits only, so "PC 4112", "pc-4112", and "PC4112" match. */
function normalizeSubjectCode(code) {
  return String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function classSubjectCode(cls) {
  return String(cls?.subjectCode || cls?.code || '').trim();
}

const SB_COURSES = [
  { code: 'BEEd', name: 'Bachelor of Elementary Education' },
  { code: 'BSEd-English', name: 'Bachelor of Secondary Education – English' },
  { code: 'BSEd-Filipino', name: 'Bachelor of Secondary Education – Filipino' },
  { code: 'BSEd-Math', name: 'Bachelor of Secondary Education – Mathematics' },
  { code: 'AB Political Science', name: 'Bachelor of Arts in Political Science' },
  { code: 'BSBA-FM', name: 'Bachelor of Science in Business Administration – Financial Management' },
  { code: 'BSHM', name: 'Bachelor of Science in Hospitality Management' },
  { code: 'BSIT', name: 'Bachelor of Science in Information Technology' },
];

const SB_YEAR_LEVELS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

function courseOptionsHtml(placeholder = 'Select course') {
  return `<option value="">${placeholder}</option>` + SB_COURSES.map((course) =>
    `<option value="${course.code}">${course.code} — ${course.name}</option>`
  ).join('');
}

function yearOptionsHtml(placeholder = 'Select year') {
  return `<option value="">${placeholder}</option>` + SB_YEAR_LEVELS.map((year) =>
    `<option value="${year}">${year}</option>`
  ).join('');
}

function normalizeCourseCode(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return '';
  const match = SB_COURSES.find((course) => {
    const code = course.code.toLowerCase();
    const name = course.name.toLowerCase();
    return raw === code || raw === name || name.includes(raw) || raw.includes(code);
  });
  return match ? match.code : String(value || '').trim();
}

function normalizeYearLevel(value) {
  const text = String(value || '').trim().toLowerCase();
  const words = { first: '1', second: '2', third: '3', fourth: '4' };
  for (const [word, number] of Object.entries(words)) {
    if (text.includes(word)) return number;
  }
  const digit = text.match(/[1-4]/);
  return digit ? digit[0] : '';
}

function yearLevelLabel(value) {
  const number = normalizeYearLevel(value);
  return number ? SB_YEAR_LEVELS[Number(number) - 1] : String(value || '').trim();
}

function normalizeBlock(value) {
  return String(value || '').toLowerCase().replace(/block|section/g, '').replace(/[^a-z0-9]/g, '');
}

function isIrregularStudent(student) {
  const standing = String(student?.standing || '').trim().toLowerCase();
  return standing === 'irregular' || standing === 'irreg';
}

function classBlockLabel(cls) {
  if (!cls) return '';
  const course = normalizeCourseCode(cls.course);
  const year = yearLevelLabel(cls.year);
  const block = String(cls.block || '').trim();
  return [course, year, block ? `Block ${block}` : ''].filter(Boolean).join(' · ');
}

function classOfferingKey(cls) {
  return [
    normalizeSubjectCode(classSubjectCode(cls)),
    normalizeCourseCode(cls?.course).toLowerCase(),
    normalizeYearLevel(cls?.year),
    normalizeBlock(cls?.block),
  ].join('|');
}

function classDisplayName(cls) {
  if (!cls) return '';
  const code = classSubjectCode(cls);
  const name = String(cls.name || cls.subject || 'Untitled class').trim();
  const subject = code && !name.toUpperCase().includes(code.toUpperCase()) ? `${code} · ${name}` : name;
  const block = classBlockLabel(cls);
  return block ? `${block} — ${subject}` : subject;
}

function gradeMatchesClass(grade, cls) {
  if (grade.classId) return String(grade.classId) === String(cls.id);
  const gradeLabel = normalizeSubjectCode(grade.class);
  if (!gradeLabel) return false;
  const classLabels = [classDisplayName(cls), cls.name, cls.subject]
    .map(normalizeSubjectCode)
    .filter(Boolean);
  if (classLabels.includes(gradeLabel)) return true;
  const classCode = normalizeSubjectCode(classSubjectCode(cls));
  return !!classCode && gradeLabel.startsWith(classCode);
}

function classPerformance(cls, grades) {
  const graded = grades.filter((grade) =>
    grade.status === 'graded'
    && grade.score !== null
    && grade.score !== undefined
    && grade.score !== ''
    && Number.isFinite(Number(grade.score))
    && Number(grade.max) > 0
    && gradeMatchesClass(grade, cls)
  );
  if (!graded.length) return null;
  const earned = graded.reduce((sum, grade) => sum + Number(grade.score), 0);
  const possible = graded.reduce((sum, grade) => sum + Number(grade.max), 0);
  return {
    average: Math.min(100, Math.max(0, Math.round((earned / possible) * 100))),
    gradedCount: graded.length,
  };
}

function studentMatchesClass(student, cls, includeIrregular = true) {
  if (!student || !cls) return false;
  if (String(student.status || 'active').toLowerCase() === 'inactive') return false;
  const enrolledIds = Array.isArray(student.classIds) ? student.classIds.map(String) : [];
  const enrolled = !!(student.classId && student.classId === cls.id) || enrolledIds.includes(String(cls.id));
  if (isIrregularStudent(student)) return includeIrregular && enrolled;
  if (enrolled) return true;
  const course = normalizeCourseCode(student.course);
  const year = normalizeYearLevel(student.year);
  const block = normalizeBlock(student.section);
  const classCourse = normalizeCourseCode(cls.course);
  const classYear = normalizeYearLevel(cls.year);
  const classBlock = normalizeBlock(cls.block);
  return !!(course && year && block && course === classCourse && year === classYear && block === classBlock);
}

function classRoster(cls, students, includeIrregular = true) {
  return (Array.isArray(students) ? students : []).filter((student) => studentMatchesClass(student, cls, includeIrregular));
}

function findClassBySubjectCode(code) {
  const norm = normalizeSubjectCode(code);
  if (!norm) return null;
  return getClasses().find((cls) => normalizeSubjectCode(classSubjectCode(cls)) === norm) || null;
}

function findClassForLabel(label) {
  const byCode = findClassBySubjectCode(label);
  if (byCode) return byCode;
  const needle = String(label || '').trim().toLowerCase();
  if (!needle) return null;
  return getClasses().find((cls) =>
    String(cls.name || '').toLowerCase() === needle
    || String(cls.subject || '').toLowerCase() === needle
    || classDisplayName(cls).toLowerCase() === needle
  ) || null;
}

function subjectTone(seed) {
  const palette = ['math', 'science', 'english', 'cs', 'filipino', 'history'];
  const text = normalizeSubjectCode(seed) || String(seed || '');
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = (hash * 33 + text.charCodeAt(i)) >>> 0;
  return palette[hash % palette.length];
}

/* ---------- Demo-only records for non-student pages ---------- */
const SEED_STUDENTS = [
  { id: 'stu_1', name: 'Maria Santos', email: 'maria.santos@email.com', course: 'BSIT', year: '2nd Year', gpa: 3.8, status: 'active' },
  { id: 'stu_2', name: 'Juan Dela Cruz', email: 'juan.delacruz@email.com', course: 'BSIT', year: '2nd Year', gpa: 3.5, status: 'active' },
  { id: 'stu_3', name: 'Ana Reyes', email: 'ana.reyes@email.com', course: 'BSCS', year: '1st Year', gpa: 3.9, status: 'active' },
  { id: 'stu_4', name: 'Pedro Garcia', email: 'pedro.garcia@email.com', course: 'BSIT', year: '3rd Year', gpa: 3.2, status: 'active' },
  { id: 'stu_5', name: 'Lisa Mendoza', email: 'lisa.mendoza@email.com', course: 'BSECE', year: '2nd Year', gpa: 3.6, status: 'active' },
  { id: 'stu_6', name: 'Carlos Lopez', email: 'carlos.lopez@email.com', course: 'BSIT', year: '2nd Year', gpa: 3.4, status: 'inactive' },
  { id: 'stu_7', name: 'Sofia Cruz', email: 'sofia.cruz@email.com', course: 'BSCS', year: '1st Year', gpa: 3.7, status: 'active' },
  { id: 'stu_8', name: 'Miguel Torres', email: 'miguel.torres@email.com', course: 'BSIT', year: '4th Year', gpa: 3.1, status: 'active' },
];

const SEED_GRADES = [
  { id: 'grd_1', student: 'Maria Santos', assignment: 'Quiz 1 — Threat Models', class: 'PC 4112 · IAS 2 Lec', score: 28, max: 30, status: 'graded' },
  { id: 'grd_2', student: 'Juan Dela Cruz', assignment: 'Quiz 1 — Threat Models', class: 'PC 4112 · IAS 2 Lec', score: 25, max: 30, status: 'graded' },
  { id: 'grd_3', student: 'Ana Reyes', assignment: 'Packet Capture Lab', class: 'PC 4112L · IAS 2 Lab', score: null, max: 100, status: 'pending' },
  { id: 'grd_4', student: 'Pedro Garcia', assignment: 'Chapter 4 Draft', class: 'PC 4114 · Capstone 2', score: 68, max: 100, status: 'graded' },
  { id: 'grd_5', student: 'Lisa Mendoza', assignment: 'Flutter Screen Prototype', class: 'AP 6 · Cross-Platform Script Dev', score: null, max: 50, status: 'pending' },
  { id: 'grd_6', student: 'Sofia Cruz', assignment: 'Midterm Lab — User Admin', class: 'PC 4113 · SysAdmin', score: 44, max: 50, status: 'graded' },
  { id: 'grd_7', student: 'Miguel Torres', assignment: 'API Integration Mini App', class: 'AP 6 · Cross-Platform Script Dev', score: null, max: 100, status: 'pending' },
  { id: 'grd_8', student: 'Carlos Lopez', assignment: 'Requirements Traceability Matrix', class: 'P ELEC 4 · SIA 2', score: 48, max: 60, status: 'graded' },
];

const SEED_MESSAGES = [
  { id: 'msg_1', from: 'Maria Santos', preview: 'Can I request an extension for the packet capture lab?', time: '10:32 AM', unread: true, class: 'PC 4112L · IAS 2 Lab' },
  { id: 'msg_2', from: 'Ana Reyes', preview: 'Posted the Chapter 4 comments in Classroom.', time: 'Yesterday', unread: true, class: 'PC 4114 · Capstone 2' },
  { id: 'msg_3', from: 'Pedro Garcia', preview: 'When is the next SysAdmin lab due?', time: 'Nov 4', unread: false, class: 'PC 4113 · SysAdmin' },
  { id: 'msg_4', from: 'Lisa Mendoza', preview: 'I submitted the Flutter prototype on Drive.', time: 'Nov 3', unread: false, class: 'AP 6 · Cross-Platform Script Dev' },
  { id: 'msg_5', from: 'Sofia Cruz', preview: 'Could you clarify the RTM columns?', time: 'Nov 2', unread: false, class: 'P ELEC 4 · SIA 2' },
];

const SEED_RESOURCES = [
  { id: 'res_1', title: 'IAS 2 Lecture Slides', class: 'PC 4112 · IAS 2 Lec', type: 'pdf', size: '1.2 MB', uploaded: '2026-10-20' },
  { id: 'res_2', title: 'Lab Safety & Tooling Guide', class: 'PC 4112L · IAS 2 Lab', type: 'pdf', size: '840 KB', uploaded: '2026-10-18' },
  { id: 'res_3', title: 'Capstone Chapter Rubric', class: 'PC 4114 · Capstone 2', type: 'doc', size: '120 KB', uploaded: '2026-10-25' },
  { id: 'res_4', title: 'Flutter Starter Kit', class: 'AP 6 · Cross-Platform Script Dev', type: 'zip', size: '3.4 MB', uploaded: '2026-10-22' },
  { id: 'res_5', title: 'SIA 2 Architecture Patterns', class: 'P ELEC 4 · SIA 2', type: 'slide', size: '2.1 MB', uploaded: '2026-11-01' },
];

const SEED_DRIVE = [
  { id: 'drv_1', name: 'IAS 2', type: 'folder', owner: 'Me', modified: '2026-11-04', size: '—' },
  { id: 'drv_2', name: 'SysAdmin Labs', type: 'folder', owner: 'Me', modified: '2026-11-03', size: '—' },
  { id: 'drv_3', name: 'Threat Model Notes.docx', type: 'doc', owner: 'Me', modified: '2026-11-05', size: '245 KB' },
  { id: 'drv_4', name: 'Packet Capture Log.xlsx', type: 'sheet', owner: 'Me', modified: '2026-11-04', size: '88 KB' },
  { id: 'drv_5', name: 'Capstone Defense.pptx', type: 'slide', owner: 'Me', modified: '2026-10-28', size: '1.8 MB' },
  { id: 'drv_6', name: 'Course Syllabus.pdf', type: 'pdf', owner: 'Classroom', modified: '2026-08-20', size: '420 KB', shared: true },
  { id: 'drv_7', name: 'Team Photo.png', type: 'image', owner: 'Me', modified: '2026-10-15', size: '2.3 MB' },
  { id: 'drv_8', name: 'SIA 2 Diagrams', type: 'folder', owner: 'Me', modified: '2026-11-02', size: '—' },
  { id: 'drv_9', name: 'Weekly Schedule.pdf', type: 'pdf', owner: 'Me', modified: '2026-11-06', size: '156 KB' },
  { id: 'drv_10', name: 'Cross-Platform Code', type: 'folder', owner: 'Me', modified: '2026-11-05', size: '—' },
];

const SEED_PROGRESS = {
  overall: 68,
  completedTasks: 12,
  totalTasks: 18,
  completedAssignments: 3,
  totalAssignments: 12,
  subjectsMastered: 2,
  totalSubjects: 6,
  hoursStudied: 24,
  weeklyGoalHours: 30,
  chart7Days: [
    { label: 'Oct 31', value: 45 },
    { label: 'Nov 1', value: 52 },
    { label: 'Nov 2', value: 48 },
    { label: 'Nov 3', value: 58 },
    { label: 'Nov 4', value: 62 },
    { label: 'Nov 5', value: 65 },
    { label: 'Nov 6', value: 68 },
  ],
  chart30Days: [
    { label: 'W1', value: 40 }, { label: 'W2', value: 48 }, { label: 'W3', value: 55 }, { label: 'W4', value: 68 },
  ],
  chartMonth: [
    { label: 'Week 1', value: 42 }, { label: 'Week 2', value: 50 }, { label: 'Week 3', value: 60 }, { label: 'Week 4', value: 68 },
  ],
};

const SEED_SETTINGS = {
  profile: {
    fullName: 'Juan Dela Cruz',
    email: 'juan.delacruz@email.com',
    verified: true,
  },
  teacherProfile: {
    fullName: 'Prof. Juan Dela Cruz',
    email: 'prof.delacruz@email.com',
    employeeId: 'T-2019-088',
    phone: '+63 917 111 2233',
    school: CLASSROOM_META.school,
    department: 'College of Computer Studies',
    verified: true,
  },
  notifications: { email: true, push: true, deadlines: true, messages: true },
  appearance: { theme: 'light', compact: false },
  privacy: { profileVisibility: 'classmates', showProgress: true, activityStatus: true },
  connected: { googleClassroom: false, googleCalendar: false, googleDrive: false },
  storageUsed: 34.2,
  storageTotal: 50,
};

function seedIfNeeded() {
  // No automatic demo records: each account starts with its own database-backed data.
}

/* ---------- CRUD Helpers ---------- */
function getSubjects() { return sbGet(SB_KEYS.SUBJECTS, []); }
function addSubject(subj) {
  const list = getSubjects();
  const item = { id: uid('subj'), progress: 0, assignments: 0, completed: 0, pending: 0, ...subj };
  list.push(item);
  sbSet(SB_KEYS.SUBJECTS, list);
  return item;
}
function updateSubject(id, patch) {
  const list = getSubjects().map((s) => (s.id === id ? { ...s, ...patch } : s));
  sbSet(SB_KEYS.SUBJECTS, list);
  return list.find((s) => s.id === id);
}
function deleteSubject(id) {
  sbSet(SB_KEYS.SUBJECTS, getSubjects().filter((s) => s.id !== id));
}

function getAssignments() { return sbGet(SB_KEYS.ASSIGNMENTS, []); }
function getSubjectAssignments(subject, assignments = getAssignments()) {
  return assignments.filter((assignment) =>
    assignment.subjectId === subject.id
    || assignment.classId === subject.id
    || (subject.classroomId && (assignment.classId === subject.classroomId || assignment.classroomId === subject.classroomId))
    || (!assignment.subjectId && [subject.name, subject.shortName, subject.short, subject.code].includes(assignment.subject))
  );
}
function getSubjectProgress(subject, assignments = getAssignments()) {
  const value = Number(subject.progress) || 0;
  const subjectAssignments = getSubjectAssignments(subject, assignments);
  if ((subject.source === 'classroom' || subject.classroomId) && subjectAssignments.length) {
    return Math.round(subjectAssignments.filter((assignment) => assignment.status === 'completed').length / subjectAssignments.length * 100);
  }
  return Math.min(Math.max(value, 0), 100);
}
function getOverallSubjectProgress(subjects = getSubjects(), assignments = getAssignments()) {
  return subjects.length
    ? Math.round(subjects.reduce((sum, subject) => sum + getSubjectProgress(subject, assignments), 0) / subjects.length)
    : 0;
}
function getUpcomingAssignments(assignments = getAssignments(), limit = 5) {
  const today = localDateStr();
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const maxItems = Math.max(0, Math.floor(Number(limit) || 0));
  return (Array.isArray(assignments) ? assignments : [])
    .filter((assignment) => {
      const dueDate = assignment.dueDate || '';
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate) || assignment.status === 'completed') return false;
      const [year, month, day] = dueDate.split('-').map(Number);
      const parsed = new Date(year, month - 1, day);
      if (parsed.getFullYear() !== year || parsed.getMonth() !== month - 1 || parsed.getDate() !== day) return false;
      return dueDate > today
        || (dueDate === today && (!assignment.dueTime || assignment.dueTime >= currentTime));
    })
    .sort((a, b) => `${a.dueDate}T${a.dueTime || '23:59'}`.localeCompare(`${b.dueDate}T${b.dueTime || '23:59'}`))
    .slice(0, maxItems);
}
function addAssignment(asg) {
  const list = getAssignments();
  const item = { id: uid('asg'), createdAt: new Date().toISOString(), status: 'upcoming', points: 50, ...asg };
  list.push(item);
  sbSet(SB_KEYS.ASSIGNMENTS, list);
  return item;
}
function updateAssignment(id, patch) {
  const list = getAssignments().map((a) => (a.id === id ? { ...a, ...patch } : a));
  sbSet(SB_KEYS.ASSIGNMENTS, list);
  return list.find((a) => a.id === id);
}
function updateAssignmentStatus(id, status) {
  return updateAssignment(id, { status });
}
function deleteAssignment(id) {
  sbSet(SB_KEYS.ASSIGNMENTS, getAssignments().filter((a) => a.id !== id));
}

function getTasks() { return sbGet(SB_KEYS.TASKS, []); }
function addTask(task) {
  const list = getTasks();
  const item = { id: uid('task'), status: 'pending', today: false, ...task };
  list.push(item);
  sbSet(SB_KEYS.TASKS, list);
  return item;
}
function updateTask(id, patch) {
  const list = getTasks().map((t) => (t.id === id ? { ...t, ...patch } : t));
  sbSet(SB_KEYS.TASKS, list);
  return list.find((t) => t.id === id);
}
function deleteTask(id) {
  sbSet(SB_KEYS.TASKS, getTasks().filter((t) => t.id !== id));
}

function getSchedule() { return sbGet(SB_KEYS.SCHEDULE, []); }
function addSchedule(entry) {
  const list = getSchedule();
  const item = { id: uid('sch'), type: 'class', ...entry };
  list.push(item);
  sbSet(SB_KEYS.SCHEDULE, list);
  return item;
}
function updateSchedule(id, patch) {
  const list = getSchedule().map((entry) => (entry.id === id ? { ...entry, ...patch } : entry));
  sbSet(SB_KEYS.SCHEDULE, list);
  return list.find((entry) => entry.id === id);
}
function deleteSchedule(id) {
  sbSet(SB_KEYS.SCHEDULE, getSchedule().filter((s) => s.id !== id));
}

function getClasses() { return sbGet(SB_KEYS.CLASSES, []); }
function getStudents() { return sbGet(SB_KEYS.STUDENTS, []); }
function getGrades() { return sbGet(SB_KEYS.GRADES, []); }
function updateGrade(id, patch) {
  const list = getGrades().map((g) => (g.id === id ? { ...g, ...patch } : g));
  sbSet(SB_KEYS.GRADES, list);
  return list.find((g) => g.id === id);
}
function getMessages() { return sbGet(SB_KEYS.MESSAGES, []); }
function getResources() { return sbGet(SB_KEYS.RESOURCES, []); }
function getDriveFiles() { return sbGet(SB_KEYS.DRIVE, []); }
function getProgress() { return sbGet(SB_KEYS.PROGRESS, SEED_PROGRESS); }
function getSettings() { return sbGet(SB_KEYS.SETTINGS, SEED_SETTINGS); }
function updateSettings(patch) {
  const current = getSettings();
  const next = { ...current, ...patch };
  sbSet(SB_KEYS.SETTINGS, next);
  return next;
}

/* ---------- Status helpers ---------- */
const STATUS_CLASS = {
  upcoming: 'badge-upcoming',
  overdue: 'badge-overdue',
  completed: 'badge-completed',
  pending: 'badge-pending',
  'in-progress': 'badge-progress',
  graded: 'badge-completed',
  active: 'badge-completed',
  inactive: 'badge-pending',
};

function statusClass(status) {
  return STATUS_CLASS[String(status).toLowerCase()] || 'badge-info';
}

function statusLabel(status) {
  const s = String(status);
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ');
}

function subjectShort(name) {
  const subjects = getSubjects();
  const match = subjects.find((s) => s.name === name || s.shortName === name || s.short === name || s.id === name);
  if (match) return match.short;
  const map = {
    Mathematics: 'math',
    Science: 'science',
    English: 'english',
    'Computer Science': 'cs',
    Filipino: 'filipino',
    History: 'history',
    'Information Assurance and Security 2 (Lec)': 'ias',
    'Information Assurance and Security 2 (Lab)': 'iaslab',
    'Systems Administration and Maintenance': 'sysad',
    'Capstone Project and Research 2': 'capstone',
    'Systems Integration and Architecture 2': 'sia',
    'Cross-Platform Script Development Technology': 'xplat',
    'IAS 2 Lec': 'ias',
    'IAS 2 Lab': 'iaslab',
    SysAdmin: 'sysad',
    'Capstone 2': 'capstone',
    'SIA 2': 'sia',
    'Cross-Platform Script Dev': 'xplat',
  };
  return map[name] || 'ias';
}

function daysUntil(dateStr) {
  const target = new Date(dateStr + 'T23:59:59');
  const now = new Date();
  const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  return diff;
}

function formatDate(dateStr) {
  let value = '';
  if (dateStr instanceof Date) {
    if (Number.isNaN(dateStr.getTime())) return 'Date unavailable';
    return dateStr.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  if (dateStr && typeof dateStr === 'object') {
    const year = Number(dateStr.year);
    const month = Number(dateStr.month);
    const day = Number(dateStr.day);
    if (Number.isInteger(year) && Number.isInteger(month) && Number.isInteger(day)) {
      value = `${year}-${month}-${day}`;
    } else return 'Date unavailable';
  } else {
    value = String(dateStr ?? '').trim();
  }
  if (!value) return 'No due date';
  const match = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:$|T)/);
  if (!match) return 'Date unavailable';
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const d = new Date(year, month - 1, day);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return 'Date unavailable';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hr = h % 12 || 12;
  return `${hr}:${String(m).padStart(2, '0')} ${ampm}`;
}

function greetingTime() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function showToast(message, type = 'success') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    toast.style.transition = 'all 200ms ease';
    setTimeout(() => toast.remove(), 220);
  }, 2800);
}

function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('open');
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
}

function createDonutSVG(percent, color = '#2563EB', size = 100) {
  const r = 36;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;
  return `
    <svg viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="${r}" fill="none" stroke="#E2E8F0" stroke-width="10"/>
      <circle cx="50" cy="50" r="${r}" fill="none" stroke="${color}" stroke-width="10"
        stroke-dasharray="${c}" stroke-dashoffset="${offset}" stroke-linecap="round"/>
    </svg>`;
}

function renderMiniCalendar(container, year, month, eventDates = [], onNav, onSelectDate) {
  if (!container) return;
  const first = new Date(year, month, 1);
  const startDow = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const monthName = first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const eventSet = new Set(eventDates.map((d) => {
    const dt = new Date(d + 'T00:00:00');
    return `${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}`;
  }));

  let html = `
    <div class="cal-nav">
      <h4>${monthName}</h4>
      <div class="cal-nav-btns">
        <button type="button" class="icon-btn cal-prev" aria-label="Previous"><i data-lucide="chevron-left"></i></button>
        <button type="button" class="icon-btn cal-next" aria-label="Next"><i data-lucide="chevron-right"></i></button>
      </div>
    </div>
    <div class="cal-grid">
      ${['Su','Mo','Tu','We','Th','Fr','Sa'].map((d) => `<div class="cal-dow">${d}</div>`).join('')}
  `;

  const prevDays = new Date(year, month, 0).getDate();
  for (let i = startDow - 1; i >= 0; i--) {
    html += `<div class="cal-day other"><span class="day-num">${prevDays - i}</span></div>`;
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
    const key = `${year}-${month}-${d}`;
    const hasEvent = eventSet.has(key);
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dateLabel = new Date(year, month, d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const dateAttributes = typeof onSelectDate === 'function'
      ? `data-calendar-date="${dateKey}" role="button" tabindex="0" aria-label="View events for ${dateLabel}" aria-haspopup="dialog"`
      : '';
    html += `<div class="cal-day${isToday ? ' today' : ''}" ${dateAttributes}>
      <span class="day-num">${d}</span>
      ${hasEvent ? '<div class="day-dots"><span style="background:#2563EB"></span></div>' : ''}
    </div>`;
  }
  const totalCells = startDow + daysInMonth;
  const remaining = (7 - (totalCells % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    html += `<div class="cal-day other"><span class="day-num">${i}</span></div>`;
  }
  html += '</div>';
  container.innerHTML = html;
  if (typeof lucide !== 'undefined') lucide.createIcons();
  container.querySelector('.cal-prev')?.addEventListener('click', () => onNav && onNav(year, month - 1));
  container.querySelector('.cal-next')?.addEventListener('click', () => onNav && onNav(year, month + 1));
  container.querySelectorAll('[data-calendar-date]').forEach((day) => {
    const selectDate = () => onSelectDate(day.dataset.calendarDate);
    day.addEventListener('click', selectDate);
    day.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        selectDate();
      }
    });
  });
}

// Initialize seed on load
seedIfNeeded();

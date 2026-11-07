/**
 * StudyBuddy — Mock seed data + localStorage helpers
 * All app data persists in localStorage for offline demo use.
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

function sbGet(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function sbSet(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function sbRemove(key) {
  localStorage.removeItem(key);
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

/* COR + Google Classroom catalog — BSIT 4, 1st Sem SY 2026-2027, CTU Consolacion */
const CLASSROOM_META = {
  school: 'Cebu Technological University — Consolacion Campus',
  campus: 'Consolacion Campus',
  course: 'BS Information Technology',
  yearLevel: '4th Year',
  section: 'BSIT_DAY_4-B',
  term: '1st Semester SY 2026-2027',
  totalUnits: 17,
};

const CLASSROOM_COURSES = [
  {
    id: 'gc_pc4112',
    subjectId: 'subj_ias_lec',
    name: 'Information Assurance and Security 2 (Lec)',
    shortName: 'IAS 2 Lec',
    code: 'PC 4112',
    sectionCode: 'CM236',
    units: 2,
    short: 'ias',
    color: '#2563EB',
    icon: 'shield',
    room: 'TBA',
    professor: 'TBA',
    progress: 48,
    meetings: [{ days: [1], start: '07:00', end: '09:00' }],
    description: 'Lecture for Information Assurance and Security 2. Instructor listed as TBA until Google Classroom returns the teacher.',
    coursework: [
      { id: 'asg_ias_quiz', title: 'Quiz 1 — Threat Models', dueDate: '2026-10-28', status: 'completed', description: 'CIA triad, STRIDE, and risk scoring.', points: 30 },
      { id: 'asg_ias_threat', title: 'Threat Modeling Worksheet', dueDate: '2026-11-10', status: 'upcoming', description: 'Model threats for a campus web app.', points: 50 },
    ],
  },
  {
    id: 'gc_pc4112l',
    subjectId: 'subj_ias_lab',
    name: 'Information Assurance and Security 2 (Lab)',
    shortName: 'IAS 2 Lab',
    code: 'PC 4112L',
    sectionCode: 'CM237',
    units: 3,
    short: 'iaslab',
    color: '#16A34A',
    icon: 'lock',
    room: 'TBA',
    professor: 'TBA',
    progress: 40,
    meetings: [{ days: [1, 3, 5], start: '07:00', end: '12:00' }],
    description: 'Laboratory for IAS 2 (MWF 7:00 AM–12:00 PM). Room and professor TBA.',
    coursework: [
      { id: 'asg_ias_pcap', title: 'Packet Capture Lab', dueDate: '2026-11-07', status: 'upcoming', description: 'Wireshark capture and analysis write-up.', points: 100 },
      { id: 'asg_ias_audit', title: 'Security Audit Checklist', dueDate: '2026-11-21', status: 'upcoming', description: 'Walk a small service against OWASP ASVS.', points: 80 },
    ],
  },
  {
    id: 'gc_pc4113',
    subjectId: 'subj_sysad',
    name: 'Systems Administration and Maintenance',
    shortName: 'SysAdmin',
    code: 'PC 4113',
    sectionCode: 'CM238',
    units: 3,
    short: 'sysad',
    color: '#7C3AED',
    icon: 'server',
    room: 'TBA',
    professor: 'TBA',
    progress: 55,
    meetings: [{ days: [3], start: '09:30', end: '12:00' }],
    description: 'Systems administration and maintenance. Wednesday 9:30 AM–12:00 PM.',
    coursework: [
      { id: 'asg_sys_mid', title: 'Midterm Lab — User Admin', dueDate: '2026-10-22', status: 'completed', description: 'Linux users, groups, and sudoers.', points: 50 },
      { id: 'asg_sys_lab', title: 'Linux User Administration Lab', dueDate: '2026-11-12', status: 'upcoming', description: 'Create users, ACLs, and a backup cron.', points: 100 },
    ],
  },
  {
    id: 'gc_pc4114',
    subjectId: 'subj_capstone',
    name: 'Capstone Project and Research 2',
    shortName: 'Capstone 2',
    code: 'PC 4114',
    sectionCode: 'CM239',
    units: 3,
    short: 'capstone',
    color: '#EA580C',
    icon: 'graduation-cap',
    room: 'TBA',
    professor: 'TBA',
    progress: 62,
    meetings: [{ days: [5], start: '13:00', end: '16:00' }],
    description: 'Capstone Project and Research 2. Friday 1:00 PM–4:00 PM.',
    coursework: [
      { id: 'asg_cap_notes', title: 'Proposal Defense Notes', dueDate: '2026-10-15', status: 'completed', description: 'Panel comments compiled.', points: 40 },
      { id: 'asg_cap_ch4', title: 'Chapter 4 Draft', dueDate: '2026-11-14', status: 'upcoming', description: 'Results and discussion draft.', points: 100 },
    ],
  },
  {
    id: 'gc_pelec4',
    subjectId: 'subj_sia',
    name: 'Systems Integration and Architecture 2',
    shortName: 'SIA 2',
    code: 'P ELEC 4',
    sectionCode: 'CM240',
    units: 3,
    short: 'sia',
    color: '#0D9488',
    icon: 'blocks',
    room: 'TBA',
    professor: 'TBA',
    progress: 35,
    meetings: [{ days: [1, 2, 4], start: '10:00', end: '12:00' }],
    description: 'Systems Integration and Architecture 2. Monday, Tuesday, Thursday 10:00 AM–12:00 PM.',
    coursework: [
      { id: 'asg_sia_rtm', title: 'Requirements Traceability Matrix', dueDate: '2026-11-03', status: 'overdue', description: 'Map requirements to integration components.', points: 60 },
      { id: 'asg_sia_arch', title: 'Integration Architecture Diagram', dueDate: '2026-11-18', status: 'upcoming', description: 'Context + container diagrams for the system.', points: 80 },
    ],
  },
  {
    id: 'gc_ap6',
    subjectId: 'subj_xplat',
    name: 'Cross-Platform Script Development Technology',
    shortName: 'Cross-Platform Script Dev',
    code: 'AP 6',
    sectionCode: 'CM241',
    units: 3,
    short: 'xplat',
    color: '#E11D48',
    icon: 'smartphone',
    room: 'TBA',
    professor: 'TBA',
    progress: 28,
    meetings: [{ days: [2, 4], start: '07:00', end: '09:30' }],
    description: 'Cross-platform script development. Tuesday and Thursday 7:00 AM–9:30 AM.',
    coursework: [
      { id: 'asg_xp_ui', title: 'Flutter Screen Prototype', dueDate: '2026-11-04', status: 'overdue', description: 'Build two screens with navigation.', points: 50 },
      { id: 'asg_xp_api', title: 'API Integration Mini App', dueDate: '2026-11-20', status: 'upcoming', description: 'Consume a REST API from a cross-platform client.', points: 100 },
    ],
  },
];

function catalogCourseToSubject(course) {
  const asgs = course.coursework || [];
  const completed = asgs.filter((a) => a.status === 'completed').length;
  const pending = asgs.filter((a) => a.status !== 'completed').length;
  return {
    id: course.subjectId,
    classroomId: course.id,
    name: course.name,
    shortName: course.shortName,
    short: course.short,
    code: course.code,
    sectionCode: course.sectionCode,
    section: CLASSROOM_META.section,
    units: course.units,
    color: course.color,
    icon: course.icon,
    room: course.room || 'TBA',
    professor: course.professor || 'TBA',
    description: course.description,
    meetings: course.meetings,
    progress: course.progress,
    assignments: asgs.length,
    completed,
    pending,
    source: 'classroom',
  };
}

function subjectToClass(subject) {
  return {
    id: `cls_${subject.id}`,
    name: `${subject.code} · ${subject.shortName || subject.name}`,
    subject: subject.name,
    subjectId: subject.id,
    short: subject.short,
    students: 28,
    nextActivity: 'Classroom coursework',
    nextDate: '2026-11-14',
    progress: subject.progress || 0,
    professor: subject.professor || 'TBA',
    room: subject.room || 'TBA',
    section: subject.section || CLASSROOM_META.section,
    source: 'classroom',
  };
}

function buildScheduleFromSubjects(subjects, start = new Date(2026, 10, 2), end = new Date(2026, 11, 18)) {
  const list = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  while (cursor <= end) {
    const dow = cursor.getDay();
    const date = localDateStr(cursor);
    subjects.forEach((s) => {
      (s.meetings || []).forEach((m) => {
        if (!m.days.includes(dow)) return;
        list.push({
          id: `sch_${s.id}_${date}`,
          title: s.shortName || s.name,
          subjectId: s.id,
          subject: s.name,
          date,
          startTime: m.start,
          endTime: m.end,
          room: s.room || 'TBA',
          type: 'class',
          source: 'classroom',
        });
      });
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return list;
}

/* ---------- Seed Data ---------- */
const SEED_SUBJECTS = CLASSROOM_COURSES.map(catalogCourseToSubject);

const SEED_ASSIGNMENTS = CLASSROOM_COURSES.flatMap((course) =>
  (course.coursework || []).map((work) => ({
    ...work,
    classroomId: course.id,
    subjectId: course.subjectId,
    subject: course.name,
    source: 'classroom',
  }))
);

const SEED_TASKS = [
  { id: 'task_1', title: 'Review IAS 2 lecture notes', subjectId: 'subj_ias_lec', subject: 'Information Assurance and Security 2 (Lec)', dueDate: '2026-11-06', dueTime: '10:00', status: 'pending', today: true },
  { id: 'task_2', title: 'Finish packet capture write-up', subjectId: 'subj_ias_lab', subject: 'Information Assurance and Security 2 (Lab)', dueDate: '2026-11-06', dueTime: '14:00', status: 'pending', today: true },
  { id: 'task_3', title: 'Draft Capstone Chapter 4 outline', subjectId: 'subj_capstone', subject: 'Capstone Project and Research 2', dueDate: '2026-11-07', dueTime: '18:00', status: 'upcoming', today: false },
  { id: 'task_4', title: 'Fix Flutter navigation bug', subjectId: 'subj_xplat', subject: 'Cross-Platform Script Development Technology', dueDate: '2026-11-06', dueTime: '16:00', status: 'pending', today: true },
  { id: 'task_5', title: 'Read SysAdmin backup chapter', subjectId: 'subj_sysad', subject: 'Systems Administration and Maintenance', dueDate: '2026-11-05', dueTime: '09:00', status: 'completed', today: false },
  { id: 'task_6', title: 'Sketch SIA 2 container diagram', subjectId: 'subj_sia', subject: 'Systems Integration and Architecture 2', dueDate: '2026-11-08', dueTime: '11:00', status: 'upcoming', today: false },
  { id: 'task_7', title: 'Prepare Friday capstone demo notes', subjectId: 'subj_capstone', subject: 'Capstone Project and Research 2', dueDate: '2026-11-07', dueTime: '13:00', status: 'upcoming', today: false },
  { id: 'task_8', title: 'Organize IAS lab screenshots', subjectId: 'subj_ias_lab', subject: 'Information Assurance and Security 2 (Lab)', dueDate: '2026-11-04', dueTime: '20:00', status: 'completed', today: false },
];

const SEED_SCHEDULE = buildScheduleFromSubjects(SEED_SUBJECTS);

const SEED_CLASSES = SEED_SUBJECTS.map(subjectToClass);

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
    studentId: '2023-04521',
    phone: '+63 912 345 6789',
    school: CLASSROOM_META.school,
    course: CLASSROOM_META.course,
    yearLevel: CLASSROOM_META.yearLevel,
    section: CLASSROOM_META.section,
    term: CLASSROOM_META.term,
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
  connected: { googleClassroom: false, googleCalendar: false, googleDrive: false },
  storageUsed: 34.2,
  storageTotal: 50,
};

function seedIfNeeded() {
  if (sbGet(SB_KEYS.SEEDED) === SB_SEED_VERSION) return;
  sbSet(SB_KEYS.SUBJECTS, SEED_SUBJECTS);
  sbSet(SB_KEYS.ASSIGNMENTS, SEED_ASSIGNMENTS);
  sbSet(SB_KEYS.TASKS, SEED_TASKS);
  sbSet(SB_KEYS.SCHEDULE, SEED_SCHEDULE);
  sbSet(SB_KEYS.CLASSES, SEED_CLASSES);
  sbSet(SB_KEYS.STUDENTS, SEED_STUDENTS);
  sbSet(SB_KEYS.GRADES, SEED_GRADES);
  sbSet(SB_KEYS.MESSAGES, SEED_MESSAGES);
  sbSet(SB_KEYS.RESOURCES, SEED_RESOURCES);
  sbSet(SB_KEYS.DRIVE, SEED_DRIVE);
  sbSet(SB_KEYS.PROGRESS, SEED_PROGRESS);
  sbSet(SB_KEYS.SETTINGS, SEED_SETTINGS);
  sbSet(SB_KEYS.SEEDED, SB_SEED_VERSION);
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
function addAssignment(asg) {
  const list = getAssignments();
  const item = { id: uid('asg'), status: 'upcoming', points: 50, ...asg };
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
  const d = new Date(dateStr + 'T00:00:00');
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

function renderMiniCalendar(container, year, month, eventDates = [], onNav) {
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
    html += `<div class="cal-day${isToday ? ' today' : ''}">
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
}

// Initialize seed on load
seedIfNeeded();

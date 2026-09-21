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

/* ---------- Seed Data ---------- */
const SEED_SUBJECTS = [
  {
    id: 'subj_math',
    name: 'Mathematics',
    short: 'math',
    color: '#2563EB',
    icon: 'calculator',
    room: 'Room 302',
    professor: 'Prof. Santos',
    description: 'Covers basic and advanced mathematical concepts, problem solving, and applications.',
    progress: 75,
    assignments: 5,
    completed: 4,
    pending: 1,
  },
  {
    id: 'subj_sci',
    name: 'Science',
    short: 'science',
    color: '#16A34A',
    icon: 'flask-conical',
    room: 'Lab 105',
    professor: 'Prof. Reyes',
    description: 'Explores biology, chemistry, and physics through experiments and theory.',
    progress: 50,
    assignments: 4,
    completed: 2,
    pending: 2,
  },
  {
    id: 'subj_eng',
    name: 'English',
    short: 'english',
    color: '#7C3AED',
    icon: 'book-open',
    room: 'Room 210',
    professor: 'Prof. Cruz',
    description: 'Develops reading, writing, and communication skills through literature and composition.',
    progress: 80,
    assignments: 3,
    completed: 3,
    pending: 0,
  },
  {
    id: 'subj_cs',
    name: 'Computer Science',
    short: 'cs',
    color: '#EA580C',
    icon: 'code-2',
    room: 'Lab 401',
    professor: 'Prof. Garcia',
    description: 'Introduction to programming, algorithms, and software development fundamentals.',
    progress: 60,
    assignments: 4,
    completed: 2,
    pending: 2,
  },
  {
    id: 'subj_fil',
    name: 'Filipino',
    short: 'filipino',
    color: '#0D9488',
    icon: 'languages',
    room: 'Room 115',
    professor: 'Prof. Mendoza',
    description: 'Pag-aaral ng wika, panitikan, at kulturang Filipino.',
    progress: 70,
    assignments: 2,
    completed: 1,
    pending: 1,
  },
  {
    id: 'subj_hist',
    name: 'History',
    short: 'history',
    color: '#E11D48',
    icon: 'landmark',
    room: 'Room 220',
    professor: 'Prof. Lopez',
    description: 'World and Philippine history covering major events and their significance.',
    progress: 55,
    assignments: 3,
    completed: 1,
    pending: 2,
  },
];

const SEED_ASSIGNMENTS = [
  { id: 'asg_1', title: 'Algebra Homework Set 3', subjectId: 'subj_math', subject: 'Mathematics', dueDate: '2025-09-12', status: 'upcoming', description: 'Complete problems 1–20 from Chapter 3.', points: 50 },
  { id: 'asg_2', title: 'Science Lab Report', subjectId: 'subj_sci', subject: 'Science', dueDate: '2025-09-14', status: 'upcoming', description: 'Write a report on the photosynthesis experiment.', points: 100 },
  { id: 'asg_3', title: 'Essay: Modern Literature', subjectId: 'subj_eng', subject: 'English', dueDate: '2025-09-18', status: 'upcoming', description: 'Write a 1500-word essay on contemporary themes.', points: 75 },
  { id: 'asg_4', title: 'Python Mini Project', subjectId: 'subj_cs', subject: 'Computer Science', dueDate: '2025-09-10', status: 'overdue', description: 'Build a CLI to-do app using Python.', points: 100 },
  { id: 'asg_5', title: 'Math Quiz 1', subjectId: 'subj_math', subject: 'Mathematics', dueDate: '2025-09-05', status: 'completed', description: 'Covered Chapters 1–2.', points: 30 },
  { id: 'asg_6', title: 'Vocabulary Worksheet', subjectId: 'subj_eng', subject: 'English', dueDate: '2025-09-03', status: 'completed', description: 'Unit 4 vocabulary exercises.', points: 20 },
  { id: 'asg_7', title: 'Chemistry Worksheet', subjectId: 'subj_sci', subject: 'Science', dueDate: '2025-09-08', status: 'overdue', description: 'Balancing chemical equations.', points: 40 },
  { id: 'asg_8', title: 'HTML/CSS Landing Page', subjectId: 'subj_cs', subject: 'Computer Science', dueDate: '2025-09-20', status: 'upcoming', description: 'Create a responsive landing page.', points: 80 },
  { id: 'asg_9', title: 'Tula Analysis', subjectId: 'subj_fil', subject: 'Filipino', dueDate: '2025-09-16', status: 'upcoming', description: 'Suriin ang isang tula ni Rizal.', points: 50 },
  { id: 'asg_10', title: 'WWII Timeline', subjectId: 'subj_hist', subject: 'History', dueDate: '2025-09-22', status: 'upcoming', description: 'Create a visual timeline of key WWII events.', points: 60 },
  { id: 'asg_11', title: 'Geometry Problem Set', subjectId: 'subj_math', subject: 'Mathematics', dueDate: '2025-09-01', status: 'completed', description: 'Triangles and congruence.', points: 40 },
  { id: 'asg_12', title: 'Reading Reflection', subjectId: 'subj_eng', subject: 'English', dueDate: '2025-08-28', status: 'completed', description: 'Reflect on the assigned short story.', points: 25 },
  { id: 'asg_13', title: 'Data Structures Quiz', subjectId: 'subj_cs', subject: 'Computer Science', dueDate: '2025-09-04', status: 'completed', description: 'Arrays, stacks, and queues.', points: 50 },
  { id: 'asg_14', title: 'Cell Structure Diagram', subjectId: 'subj_sci', subject: 'Science', dueDate: '2025-09-02', status: 'completed', description: 'Label plant and animal cells.', points: 30 },
  { id: 'asg_15', title: 'Kasaysayan Essay', subjectId: 'subj_hist', subject: 'History', dueDate: '2025-09-25', status: 'upcoming', description: 'Philippine Revolution essay.', points: 70 },
  { id: 'asg_16', title: 'Sanaysay Draft', subjectId: 'subj_fil', subject: 'Filipino', dueDate: '2025-09-07', status: 'overdue', description: 'First draft of personal sanaysay.', points: 40 },
];

const SEED_TASKS = [
  { id: 'task_1', title: 'Review Algebra notes', subjectId: 'subj_math', subject: 'Mathematics', dueDate: '2025-09-12', dueTime: '10:00', status: 'pending', today: true },
  { id: 'task_2', title: 'Finish lab report draft', subjectId: 'subj_sci', subject: 'Science', dueDate: '2025-09-12', dueTime: '14:00', status: 'pending', today: true },
  { id: 'task_3', title: 'Read Chapter 5', subjectId: 'subj_eng', subject: 'English', dueDate: '2025-09-13', dueTime: '18:00', status: 'upcoming', today: false },
  { id: 'task_4', title: 'Debug Python project', subjectId: 'subj_cs', subject: 'Computer Science', dueDate: '2025-09-12', dueTime: '16:00', status: 'pending', today: true },
  { id: 'task_5', title: 'Memorize vocabulary list', subjectId: 'subj_eng', subject: 'English', dueDate: '2025-09-11', dueTime: '09:00', status: 'completed', today: false },
  { id: 'task_6', title: 'Practice calculus problems', subjectId: 'subj_math', subject: 'Mathematics', dueDate: '2025-09-14', dueTime: '11:00', status: 'upcoming', today: false },
  { id: 'task_7', title: 'Prepare Filipino presentation', subjectId: 'subj_fil', subject: 'Filipino', dueDate: '2025-09-15', dueTime: '13:00', status: 'upcoming', today: false },
  { id: 'task_8', title: 'Organize study notes', subjectId: 'subj_hist', subject: 'History', dueDate: '2025-09-10', dueTime: '20:00', status: 'completed', today: false },
];

const SEED_SCHEDULE = [
  { id: 'sch_1', title: 'Mathematics', subjectId: 'subj_math', subject: 'Mathematics', date: '2025-09-12', startTime: '08:00', endTime: '09:30', room: 'Room 302', type: 'class' },
  { id: 'sch_2', title: 'Science', subjectId: 'subj_sci', subject: 'Science', date: '2025-09-12', startTime: '10:00', endTime: '11:30', room: 'Lab 105', type: 'class' },
  { id: 'sch_3', title: 'English', subjectId: 'subj_eng', subject: 'English', date: '2025-09-12', startTime: '13:00', endTime: '14:30', room: 'Room 210', type: 'class' },
  { id: 'sch_4', title: 'Computer Science', subjectId: 'subj_cs', subject: 'Computer Science', date: '2025-09-15', startTime: '09:00', endTime: '10:30', room: 'Lab 401', type: 'class' },
  { id: 'sch_5', title: 'Filipino', subjectId: 'subj_fil', subject: 'Filipino', date: '2025-09-16', startTime: '11:00', endTime: '12:30', room: 'Room 115', type: 'class' },
  { id: 'sch_6', title: 'History', subjectId: 'subj_hist', subject: 'History', date: '2025-09-17', startTime: '14:00', endTime: '15:30', room: 'Room 220', type: 'class' },
  { id: 'sch_7', title: 'Math Quiz Due', subjectId: 'subj_math', subject: 'Mathematics', date: '2025-09-12', startTime: '23:59', endTime: '23:59', room: '', type: 'deadline' },
  { id: 'sch_8', title: 'Group Study Session', subjectId: 'subj_cs', subject: 'Computer Science', date: '2025-09-18', startTime: '15:00', endTime: '17:00', room: 'Library', type: 'event' },
  { id: 'sch_9', title: 'Science Lab', subjectId: 'subj_sci', subject: 'Science', date: '2025-09-19', startTime: '08:00', endTime: '10:00', room: 'Lab 105', type: 'class' },
  { id: 'sch_10', title: 'English Presentation', subjectId: 'subj_eng', subject: 'English', date: '2025-09-22', startTime: '13:00', endTime: '14:00', room: 'Room 210', type: 'event' },
];

const SEED_CLASSES = [
  { id: 'cls_1', name: 'Math 101', subject: 'Mathematics', short: 'math', students: 32, nextActivity: 'Quiz 1', nextDate: '2025-09-15', progress: 75 },
  { id: 'cls_2', name: 'Science 205', subject: 'Science', short: 'science', students: 28, nextActivity: 'Lab Report', nextDate: '2025-09-14', progress: 68 },
  { id: 'cls_3', name: 'English 101', subject: 'English', short: 'english', students: 30, nextActivity: 'Essay Draft', nextDate: '2025-09-18', progress: 82 },
  { id: 'cls_4', name: 'CS 308', subject: 'Computer Science', short: 'cs', students: 24, nextActivity: 'Project Demo', nextDate: '2025-09-20', progress: 60 },
  { id: 'cls_5', name: 'Filipino 101', subject: 'Filipino', short: 'filipino', students: 26, nextActivity: 'Oral Recitation', nextDate: '2025-09-16', progress: 52 },
];

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
  { id: 'grd_1', student: 'Maria Santos', assignment: 'Math Quiz 1', class: 'Math 101', score: 28, max: 30, status: 'graded' },
  { id: 'grd_2', student: 'Juan Dela Cruz', assignment: 'Math Quiz 1', class: 'Math 101', score: 25, max: 30, status: 'graded' },
  { id: 'grd_3', student: 'Ana Reyes', assignment: 'Lab Report', class: 'Science 205', score: null, max: 100, status: 'pending' },
  { id: 'grd_4', student: 'Pedro Garcia', assignment: 'Essay Draft', class: 'English 101', score: 68, max: 75, status: 'graded' },
  { id: 'grd_5', student: 'Lisa Mendoza', assignment: 'Python Project', class: 'CS 308', score: null, max: 100, status: 'pending' },
  { id: 'grd_6', student: 'Sofia Cruz', assignment: 'Vocabulary Worksheet', class: 'English 101', score: 18, max: 20, status: 'graded' },
  { id: 'grd_7', student: 'Miguel Torres', assignment: 'HTML Landing Page', class: 'CS 308', score: null, max: 80, status: 'pending' },
  { id: 'grd_8', student: 'Carlos Lopez', assignment: 'Chemistry Worksheet', class: 'Science 205', score: 32, max: 40, status: 'graded' },
];

const SEED_MESSAGES = [
  { id: 'msg_1', from: 'Maria Santos', preview: 'Sir, can I request an extension for the lab report?', time: '10:32 AM', unread: true, class: 'Science 205' },
  { id: 'msg_2', from: 'Ana Reyes', preview: 'Thank you for the feedback on my essay!', time: 'Yesterday', unread: true, class: 'English 101' },
  { id: 'msg_3', from: 'Pedro Garcia', preview: 'When is the next quiz scheduled?', time: 'Sep 10', unread: false, class: 'Math 101' },
  { id: 'msg_4', from: 'Lisa Mendoza', preview: 'I submitted my project on Drive.', time: 'Sep 9', unread: false, class: 'CS 308' },
  { id: 'msg_5', from: 'Sofia Cruz', preview: 'Could you clarify question 5?', time: 'Sep 8', unread: false, class: 'Math 101' },
];

const SEED_RESOURCES = [
  { id: 'res_1', title: 'Algebra Formula Sheet', class: 'Math 101', type: 'pdf', size: '1.2 MB', uploaded: '2025-09-01' },
  { id: 'res_2', title: 'Lab Safety Guidelines', class: 'Science 205', type: 'pdf', size: '840 KB', uploaded: '2025-08-28' },
  { id: 'res_3', title: 'Essay Rubric', class: 'English 101', type: 'doc', size: '120 KB', uploaded: '2025-09-05' },
  { id: 'res_4', title: 'Python Starter Kit', class: 'CS 308', type: 'zip', size: '3.4 MB', uploaded: '2025-09-03' },
  { id: 'res_5', title: 'Lecture Slides Week 3', class: 'Filipino 101', type: 'slide', size: '2.1 MB', uploaded: '2025-09-08' },
];

const SEED_DRIVE = [
  { id: 'drv_1', name: 'Mathematics', type: 'folder', owner: 'Me', modified: '2025-09-10', size: '—' },
  { id: 'drv_2', name: 'Science Labs', type: 'folder', owner: 'Me', modified: '2025-09-08', size: '—' },
  { id: 'drv_3', name: 'Algebra Notes.docx', type: 'doc', owner: 'Me', modified: '2025-09-11', size: '245 KB' },
  { id: 'drv_4', name: 'Lab Report Template.xlsx', type: 'sheet', owner: 'Me', modified: '2025-09-09', size: '88 KB' },
  { id: 'drv_5', name: 'Project Presentation.pptx', type: 'slide', owner: 'Me', modified: '2025-09-07', size: '1.8 MB' },
  { id: 'drv_6', name: 'Syllabus.pdf', type: 'pdf', owner: 'Prof. Santos', modified: '2025-08-20', size: '420 KB', shared: true },
  { id: 'drv_7', name: 'Group Photo.png', type: 'image', owner: 'Me', modified: '2025-09-05', size: '2.3 MB' },
  { id: 'drv_8', name: 'English Essays', type: 'folder', owner: 'Me', modified: '2025-09-02', size: '—' },
  { id: 'drv_9', name: 'Study Schedule.pdf', type: 'pdf', owner: 'Me', modified: '2025-09-12', size: '156 KB' },
  { id: 'drv_10', name: 'CS Project Code', type: 'folder', owner: 'Me', modified: '2025-09-11', size: '—' },
];

const SEED_PROGRESS = {
  overall: 68,
  completedTasks: 12,
  totalTasks: 18,
  completedAssignments: 5,
  totalAssignments: 16,
  subjectsMastered: 2,
  totalSubjects: 6,
  hoursStudied: 24,
  weeklyGoalHours: 30,
  chart7Days: [
    { label: 'Sep 9', value: 45 },
    { label: 'Sep 10', value: 52 },
    { label: 'Sep 11', value: 48 },
    { label: 'Sep 12', value: 58 },
    { label: 'Sep 13', value: 62 },
    { label: 'Sep 14', value: 65 },
    { label: 'Sep 15', value: 68 },
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
    school: 'State University',
    course: 'BS Information Technology',
    yearLevel: '2nd Year',
    verified: true,
  },
  teacherProfile: {
    fullName: 'Prof. Juan Dela Cruz',
    email: 'prof.delacruz@email.com',
    employeeId: 'T-2019-088',
    phone: '+63 917 111 2233',
    school: 'State University',
    department: 'College of Computing',
    verified: true,
  },
  notifications: { email: true, push: true, deadlines: true, messages: true },
  appearance: { theme: 'light', compact: false },
  connected: { googleCalendar: false, googleDrive: false },
  storageUsed: 34.2,
  storageTotal: 50,
};

function seedIfNeeded() {
  if (sbGet(SB_KEYS.SEEDED)) return;
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
  sbSet(SB_KEYS.SEEDED, true);
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
  const map = {
    Mathematics: 'math',
    Science: 'science',
    English: 'english',
    'Computer Science': 'cs',
    Filipino: 'filipino',
    History: 'history',
  };
  return map[name] || 'math';
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

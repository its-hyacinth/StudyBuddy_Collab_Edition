/**
 * StudyBuddy — Google Classroom integration
 *
 * Classes, teachers, and coursework come from Classroom — not Calendar.
 * Drive remains a file store; Calendar is optional.
 *
 * Live API (optional): set a Google Cloud OAuth Client ID via
 *   window.SB_GOOGLE_CLIENT_ID = '....apps.googleusercontent.com'
 * or Settings → Connected Accounts. Authorized JavaScript origins must
 * include this site. Scopes: classroom.courses.readonly,
 * classroom.coursework.me.readonly, classroom.rosters.readonly.
 *
 * Without a client ID, sync uses the COR-based Classroom catalog
 * (BSIT 4, 1st Sem SY 2026-2027). Teachers stay TBA until Classroom
 * returns instructor names.
 */

const CLASSROOM_SCOPES = [
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/classroom.coursework.me.readonly',
  'https://www.googleapis.com/auth/classroom.rosters.readonly',
].join(' ');

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getGoogleClientId() {
  return String(window.SB_GOOGLE_CLIENT_ID || localStorage.getItem('studybuddy_google_client_id') || '').trim();
}

function setGoogleClientId(id) {
  const value = String(id || '').trim();
  if (value) localStorage.setItem('studybuddy_google_client_id', value);
  else localStorage.removeItem('studybuddy_google_client_id');
  return value;
}

function withButtonLoading(buttonEl, label = 'Syncing...') {
  if (!buttonEl) return () => {};
  buttonEl.classList.add('loading');
  const original = buttonEl.innerHTML;
  buttonEl.dataset.originalHtml = original;
  buttonEl.innerHTML = `<span class="spinner"></span> ${label}`;
  return () => {
    buttonEl.classList.remove('loading');
    if (buttonEl.dataset.originalHtml) {
      buttonEl.innerHTML = buttonEl.dataset.originalHtml;
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
  };
}

function classroomCourseworkMock() {
  return CLASSROOM_COURSES.flatMap((course) =>
    (course.coursework || []).map((work) => ({
      ...work,
      classroomId: course.id,
      subjectId: course.subjectId,
      subject: course.name,
      source: 'classroom',
    }))
  );
}

function mapLiveCourseToSubject(course, teacherName) {
  const catalog = CLASSROOM_COURSES.find((c) => {
    const hay = `${course.name || ''} ${course.section || ''} ${course.descriptionHeading || ''}`.toUpperCase();
    return hay.includes(c.code.replace(/\s/g, '')) || hay.includes(c.code) || hay.includes(c.shortName.toUpperCase());
  });
  const base = catalog || {
    subjectId: `subj_${course.id}`,
    short: subjectShort(course.name || 'Class'),
    color: '#2563EB',
    icon: 'book-open',
    units: 3,
    meetings: [],
    code: course.section || '',
    sectionCode: '',
    shortName: course.name,
  };
  return {
    id: base.subjectId,
    classroomId: course.id,
    name: course.name || base.name,
    shortName: base.shortName || course.name,
    short: base.short,
    code: base.code,
    sectionCode: base.sectionCode,
    section: course.section || CLASSROOM_META.section,
    units: base.units,
    color: base.color,
    icon: base.icon,
    room: course.room || 'TBA',
    professor: teacherName || 'TBA',
    description: course.descriptionHeading || course.description || base.description || '',
    meetings: base.meetings,
    progress: base.progress || 0,
    assignments: 0,
    completed: 0,
    pending: 0,
    source: 'classroom',
  };
}

function mapLiveCoursework(work, subject) {
  const due = work.dueDate
    ? `${work.dueDate.year}-${String(work.dueDate.month).padStart(2, '0')}-${String(work.dueDate.day).padStart(2, '0')}`
    : localDateStr(new Date(Date.now() + 7 * 86400000));
  const today = localDateStr();
  let status = 'upcoming';
  if (due < today) status = 'overdue';
  return {
    id: `asg_gc_${work.id}`,
    classroomWorkId: work.id,
    title: work.title || 'Untitled coursework',
    subjectId: subject.id,
    subject: subject.name,
    dueDate: due,
    status,
    description: work.description || '',
    points: work.maxPoints || 50,
    source: 'classroom',
  };
}

async function classroomApi(path, token) {
  const res = await fetch(`https://classroom.googleapis.com/v1/${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Classroom API ${res.status}`);
  }
  return res.json();
}

function requestClassroomAccessToken(clientId) {
  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.oauth2) {
      reject(new Error('Google Identity Services failed to load.'));
      return;
    }
    const client = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: CLASSROOM_SCOPES,
      callback: (resp) => {
        if (resp.error) reject(new Error(resp.error_description || resp.error));
        else resolve(resp.access_token);
      },
    });
    client.requestAccessToken({ prompt: '' });
  });
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if ([...document.scripts].some((s) => s.src === src)) {
      resolve();
      return;
    }
    const el = document.createElement('script');
    el.src = src;
    el.async = true;
    el.onload = () => resolve();
    el.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(el);
  });
}

async function fetchLiveClassroomPayload() {
  const clientId = getGoogleClientId();
  if (!clientId) return null;
  await loadScript('https://accounts.google.com/gsi/client');
  const token = await requestClassroomAccessToken(clientId);
  const list = await classroomApi('courses?courseStates=ACTIVE&pageSize=50', token);
  const courses = list.courses || [];
  if (!courses.length) return { courses: [], assignments: [], empty: true, live: true };

  const subjects = [];
  const assignments = [];
  for (const course of courses) {
    let teacherName = 'TBA';
    try {
      const teachers = await classroomApi(`courses/${course.id}/teachers?pageSize=5`, token);
      const named = (teachers.teachers || []).find((t) => t.profile?.name?.fullName);
      if (named) teacherName = named.profile.name.fullName;
    } catch {
      teacherName = 'TBA';
    }
    const subject = mapLiveCourseToSubject(course, teacherName);
    subjects.push(subject);
    try {
      const work = await classroomApi(`courses/${course.id}/courseWork?pageSize=50`, token);
      (work.courseWork || []).forEach((item) => assignments.push(mapLiveCoursework(item, subject)));
    } catch {
      /* coursework scope may be denied */
    }
  }
  return { courses: subjects, assignments, live: true };
}

function applyClassroomPayload(payload) {
  const isLivePayload = !!payload.live;
  const courses = isLivePayload
    ? (payload.courses || [])
    : payload.courses && payload.courses.length
      ? payload.courses
      : CLASSROOM_COURSES.map(catalogCourseToSubject);

  const existingAsg = getAssignments().filter((a) =>
    a.source !== 'classroom' && !a.classroomId && !a.classroomWorkId
  );
  const classroomAsg = isLivePayload
    ? (payload.assignments || [])
    : payload.assignments && payload.assignments.length
      ? payload.assignments
      : classroomCourseworkMock();

  const withCounts = courses.map((s) => {
    const asgs = classroomAsg.filter((a) => a.subjectId === s.id);
    const completed = asgs.filter((a) => a.status === 'completed').length;
    const pending = asgs.filter((a) => a.status !== 'completed').length;
    return { ...s, assignments: asgs.length, completed, pending, source: 'classroom' };
  });

  sbSet(SB_KEYS.SUBJECTS, withCounts);
  sbSet(SB_KEYS.ASSIGNMENTS, [...classroomAsg, ...existingAsg]);
  sbSet(SB_KEYS.SCHEDULE, buildScheduleFromSubjects(withCounts));
  sbSet(SB_KEYS.CLASSES, withCounts.map(subjectToClass));

  const settings = getSettings();
  updateSettings({
    connected: { ...settings.connected, googleClassroom: true },
    classroomSyncedAt: new Date().toISOString(),
  });

  return {
    courseCount: withCounts.length,
    assignmentCount: classroomAsg.length,
    live: !!payload.live,
  };
}

/**
 * Sync classes + coursework from Google Classroom.
 * Live Classroom API when a client ID is set; otherwise COR catalog.
 */
async function syncGoogleClassroom(buttonEl) {
  const done = withButtonLoading(buttonEl, 'Syncing Classroom...');
  try {
    let payload = { courses: [], assignments: [] };
    const clientId = getGoogleClientId();
    if (clientId) {
      try {
        payload = await fetchLiveClassroomPayload();
      } catch (err) {
        showToast(err.message || 'Classroom sign-in failed. Using enrolled courses.', 'warning');
        payload = { courses: [], assignments: [] };
      }
    } else {
      await delay(900);
    }
    const result = applyClassroomPayload(payload || {});
    const source = result.live ? 'Google Classroom' : 'your enrolled Classroom courses';
    showToast(`Synced ${result.courseCount} classes from ${source}`, 'success');
    return { ok: true, ...result };
  } catch (err) {
    showToast('Classroom sync failed. Try again.', 'error');
    return { ok: false, error: err };
  } finally {
    done();
  }
}

async function mockGoogleClassroomSync(buttonEl) {
  return syncGoogleClassroom(buttonEl);
}

function openInGoogleClassroom(courseId) {
  const url = courseId
    ? `https://classroom.google.com/c/${courseId}`
    : 'https://classroom.google.com';
  window.open(url, '_blank', 'noopener,noreferrer');
}

function connectGoogleAccount(service) {
  const settings = getSettings();
  const connected = { ...settings.connected };
  if (service === 'classroom') connected.googleClassroom = true;
  if (service === 'calendar') connected.googleCalendar = true;
  if (service === 'drive') connected.googleDrive = true;
  updateSettings({ connected });
  const labels = { classroom: 'Classroom', calendar: 'Calendar', drive: 'Drive' };
  showToast(`Connected to Google ${labels[service] || service}`, 'success');
  return connected;
}

function disconnectGoogleAccount(service) {
  const settings = getSettings();
  const connected = { ...settings.connected };
  if (service === 'classroom') connected.googleClassroom = false;
  if (service === 'calendar') connected.googleCalendar = false;
  if (service === 'drive') connected.googleDrive = false;
  updateSettings({ connected });
  const labels = { classroom: 'Classroom', calendar: 'Calendar', drive: 'Drive' };
  showToast(`Disconnected Google ${labels[service] || service}`, 'warning');
  return connected;
}

async function mockGoogleCalendarSync(buttonEl) {
  const done = withButtonLoading(buttonEl, 'Syncing...');
  try {
    await delay(800);
    connectGoogleAccount('calendar');
    showToast('Calendar is optional — classes now sync from Google Classroom.', 'info');
    return { ok: true };
  } finally {
    done();
  }
}

async function mockGoogleDriveSync(buttonEl) {
  const done = withButtonLoading(buttonEl, 'Syncing...');
  try {
    await delay(800);
    connectGoogleAccount('drive');
    showToast('Synced with Google Drive', 'success');
    return { ok: true };
  } finally {
    done();
  }
}

function openInGoogleCalendar() {
  window.open('https://calendar.google.com', '_blank', 'noopener,noreferrer');
}

function openInGoogleDrive(fileId) {
  const url = fileId
    ? `https://drive.google.com/file/d/${fileId}/view`
    : 'https://drive.google.com';
  window.open(url, '_blank', 'noopener,noreferrer');
}

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

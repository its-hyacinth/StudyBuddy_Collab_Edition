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
 * Without Google Classroom data, the student sections remain empty until
 * the account is connected and synced.
 */

const CLASSROOM_SCOPES = [
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/classroom.coursework.me.readonly',
  'https://www.googleapis.com/auth/classroom.rosters.readonly',
].join(' ');

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

function mapLiveCourseToSubject(course, teacherName) {
  const courseId = String(course.id || '').trim();
  const courseName = String(course.name || '').trim();
  if (!courseId || !courseName) throw new Error('Google Classroom returned a course without an ID or name.');
  return {
    id: `subj_gc_${courseId}`,
    classroomId: courseId,
    name: courseName,
    shortName: courseName,
    short: subjectShort(courseName),
    code: course.section || '',
    sectionCode: '',
    section: course.section || '',
    color: '#2563EB',
    icon: 'book-open',
    room: course.room || '',
    professor: teacherName || '',
    description: course.descriptionHeading || course.description || '',
    progress: null,
    assignments: 0,
    completed: 0,
    pending: 0,
    source: 'classroom',
  };
}

function mapSubmittedFiles(submission) {
  const attachments = submission?.assignmentSubmission?.attachments;
  if (!Array.isArray(attachments)) return [];
  return attachments.flatMap((attachment) => {
    const file = attachment?.driveFile;
    const id = String(file?.id || '').trim();
    if (!id) return [];
    return [{
      id,
      title: String(file.title || 'Submitted file'),
      url: String(file.alternateLink || `https://drive.google.com/open?id=${encodeURIComponent(id)}`),
    }];
  });
}

function mapLiveCoursework(work, subject) {
  const dueDate = work.dueDate
    ? `${work.dueDate.year}-${String(work.dueDate.month).padStart(2, '0')}-${String(work.dueDate.day).padStart(2, '0')}`
    : '';
  const submission = work.studentSubmission || null;
  const submissionState = String(submission?.state || (work.workType === 'MATERIAL' ? 'NOT_APPLICABLE' : '')).toUpperCase();
  const submitted = ['TURNED_IN', 'RETURNED'].includes(submissionState);
  const today = localDateStr();
  let status = submitted ? 'completed' : 'upcoming';
  if (!submitted && dueDate && dueDate < today) status = 'overdue';
  return {
    id: `asg_gc_${work.id}`,
    classroomWorkId: work.id,
    title: work.title || 'Untitled coursework',
    subjectId: subject.id,
    subject: subject.name,
    dueDate,
    status,
    description: work.description || '',
    points: work.maxPoints ?? null,
    submissionState,
    submissionStatusUnavailable: !!work.studentSubmissionError,
    submissionUpdatedAt: submitted ? submission?.updateTime || submission?.creationTime || '' : '',
    submissionGrade: submission?.assignedGrade ?? null,
    submissionAttachments: submitted ? mapSubmittedFiles(submission) : [],
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

async function classroomApiPages(path, listKey, token, maxPages = 5) {
  const items = [];
  let pageToken = '';
  for (let pageIndex = 0; pageIndex < maxPages; pageIndex++) {
    const pagePath = pageToken
      ? `${path}${path.includes('?') ? '&' : '?'}pageToken=${encodeURIComponent(pageToken)}`
      : path;
    const page = await classroomApi(pagePath, token);
    if (Array.isArray(page[listKey])) items.push(...page[listKey]);
    pageToken = String(page.nextPageToken || '');
    if (!pageToken) break;
  }
  return items;
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

async function googleConnectionStatus(force = false) {
  if (!force && window.SB_GOOGLE && window.SB_GOOGLE.ok) return window.SB_GOOGLE;
  const response = await fetch(`${SB_API_BASE}google.php?action=status`, { credentials: 'same-origin' });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok) {
    throw new Error(data.message || 'Could not check the Google connection.');
  }
  window.SB_GOOGLE = data;
  return data;
}

function beginGoogleConnect(nextPath) {
  const next = nextPath || `${window.location.pathname}${window.location.search}`;
  window.location.href = `${SB_API_BASE}google.php?action=start&next=${encodeURIComponent(next)}`;
}

function applyGoogleConnection(status) {
  window.SB_GOOGLE = status;
  if (!status || !status.configured || typeof getSettings !== 'function') return;
  const settings = getSettings();
  updateSettings({
    connected: {
      ...settings.connected,
      googleClassroom: !!status.connected,
      googleDrive: !!status.connected,
      googleCalendar: !!status.connected && String(status.scopes || '').includes('/auth/calendar'),
    },
    googleEmail: status.email || '',
  });
}

async function refreshGoogleConnection() {
  try {
    const status = await googleConnectionStatus(true);
    applyGoogleConnection(status);
    if (typeof window.refreshConnectedAccounts === 'function') window.refreshConnectedAccounts();
    if (typeof window.refreshDriveFromGoogle === 'function') await window.refreshDriveFromGoogle();
    if (typeof window.refreshGoogleCalendar === 'function') {
      try {
        await window.refreshGoogleCalendar();
      } catch (error) {
        showToast(error.message || 'Could not load Google Calendar.', 'error');
      }
    }
    return status;
  } catch (error) {
    console.error(error);
    return null;
  }
}

async function fetchServerClassroom() {
  const response = await fetch(`${SB_API_BASE}google.php?action=classroom`, { credentials: 'same-origin' });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok) throw new Error(data.message || 'Classroom sync failed.');
  const subjects = [];
  const assignments = [];
  const submissionErrors = Array.isArray(data.submissionErrors) ? data.submissionErrors : [];
  (data.courses || []).forEach((course) => {
    const subject = mapLiveCourseToSubject(course, course.teacherName || 'TBA');
    subjects.push(subject);
    (course.courseWork || []).forEach((work) => assignments.push(mapLiveCoursework(work, subject)));
  });
  return { courses: subjects, assignments, live: true, email: data.email || '', submissionErrors };
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
  const courses = await classroomApiPages('courses?courseStates=ACTIVE&pageSize=50', 'courses', token);
  if (!courses.length) return { courses: [], assignments: [], empty: true, live: true };

  const subjects = [];
  const assignments = [];
  const submissionErrors = [];
  for (const course of courses) {
    let teacherName = '';
    try {
      const teachers = await classroomApi(`courses/${course.id}/teachers?pageSize=5`, token);
      const named = (teachers.teachers || []).find((t) => t.profile?.name?.fullName);
      if (named) teacherName = named.profile.name.fullName;
    } catch (error) {
      console.warn('Could not load course teacher information from Google Classroom.', error);
    }
    const subject = mapLiveCourseToSubject(course, teacherName);
    subjects.push(subject);
    try {
      const coursePath = `courses/${encodeURIComponent(course.id)}`;
      const courseWork = await classroomApiPages(`${coursePath}/courseWork?pageSize=50`, 'courseWork', token, 3);
      let submissionsByWork = new Map();
      let submissionFetchFailed = false;
      if (courseWork.length) {
        try {
          const submissions = await classroomApiPages(
            `${coursePath}/courseWork/-/studentSubmissions?userId=me&pageSize=100`,
            'studentSubmissions',
            token,
            10
          );
          submissionsByWork = new Map(submissions.map((submission) => [String(submission.courseWorkId), submission]));
        } catch (error) {
          submissionFetchFailed = true;
          submissionErrors.push({ courseId: course.id, message: error.message || 'Could not load course submissions.' });
        }
      }
      assignments.push(...courseWork.map((item) => mapLiveCoursework({
        ...item,
        studentSubmission: submissionsByWork.get(String(item.id)) || null,
        studentSubmissionError: submissionFetchFailed,
      }, subject)));
    } catch (error) {
      console.warn('Could not load coursework from Google Classroom for this course.', error);
    }
  }
  return { courses: subjects, assignments, submissionErrors, live: true };
}

function applyClassroomPayload(payload) {
  const courses = Array.isArray(payload.courses) ? payload.courses : [];
  const previousClassroomAssignments = new Map(getAssignments()
    .filter((assignment) => assignment.source === 'classroom' || assignment.classroomWorkId)
    .map((assignment) => [
      String(assignment.classroomWorkId || String(assignment.id || '').replace(/^asg_gc_/, '')),
      assignment,
    ]));
  const classroomAsg = (Array.isArray(payload.assignments) ? payload.assignments : []).map((assignment) => {
    if (!assignment.submissionStatusUnavailable) return assignment;
    const workId = String(assignment.classroomWorkId || String(assignment.id || '').replace(/^asg_gc_/, ''));
    const previous = previousClassroomAssignments.get(workId);
    if (!previous) return assignment;
    return {
      ...assignment,
      status: previous.status || assignment.status,
      submissionState: previous.submissionState || assignment.submissionState,
      submissionUpdatedAt: previous.submissionUpdatedAt || assignment.submissionUpdatedAt,
      submissionGrade: previous.submissionGrade ?? assignment.submissionGrade,
      submissionAttachments: previous.submissionAttachments || assignment.submissionAttachments,
    };
  });
  const localSubjects = getSubjects().filter((subject) => subject.source !== 'classroom');
  const existingAsg = getAssignments().filter((a) =>
    a.source !== 'classroom' && !a.classroomId && !a.classroomWorkId
  );
  const previousClassroomTasks = new Map(getTasks()
    .filter((task) => task.source === 'classroom' || task.classroomWorkId)
    .map((task) => [String(task.classroomWorkId || ''), task]));
  const classroomTasks = classroomAsg.map((assignment) => {
    const classroomWorkId = String(assignment.classroomWorkId || String(assignment.id || '').replace(/^asg_gc_/, ''));
    const previous = previousClassroomTasks.get(classroomWorkId);
    return {
      id: previous?.id || `task_gc_${classroomWorkId || assignment.id}`,
      assignmentId: assignment.id,
      classroomWorkId,
      title: assignment.title,
      subjectId: assignment.subjectId,
      subject: assignment.subject,
      dueDate: assignment.dueDate || '',
      dueTime: assignment.dueTime || '',
      notes: assignment.description || '',
      status: assignment.status || 'upcoming',
      today: !!assignment.dueDate && assignment.dueDate === localDateStr(),
      submissionState: assignment.submissionState || '',
      submissionUpdatedAt: assignment.submissionUpdatedAt || '',
      submissionGrade: assignment.submissionGrade ?? null,
      submissionAttachments: assignment.submissionAttachments || [],
      submissionStatusUnavailable: !!assignment.submissionStatusUnavailable,
      source: 'classroom',
    };
  });
  const localTasks = getTasks().filter((task) => task.source !== 'classroom' && !task.classroomWorkId);
  const localSchedule = getSchedule().filter((entry) => entry.source !== 'classroom');
  const localClasses = getClasses().filter((item) => item.source !== 'classroom');

  const withCounts = courses.map((s) => {
    const asgs = classroomAsg.filter((a) => a.subjectId === s.id);
    const completed = asgs.filter((a) => a.status === 'completed').length;
    const pending = asgs.filter((a) => a.status !== 'completed').length;
    return { ...s, assignments: asgs.length, completed, pending, source: 'classroom' };
  });

  sbSet(SB_KEYS.SUBJECTS, [...withCounts, ...localSubjects]);
  sbSet(SB_KEYS.ASSIGNMENTS, [...classroomAsg, ...existingAsg]);
  sbSet(SB_KEYS.TASKS, [...classroomTasks, ...localTasks]);
  sbSet(SB_KEYS.SCHEDULE, localSchedule);
  sbSet(SB_KEYS.CLASSES, [...withCounts.map(subjectToClass), ...localClasses]);

  const settings = getSettings();
  updateSettings({
    connected: { ...settings.connected, googleClassroom: true },
    classroomSyncedAt: new Date().toISOString(),
  });

  return {
    courseCount: withCounts.length,
    assignmentCount: classroomAsg.length,
    taskCount: classroomTasks.length,
    completedCount: classroomAsg.filter((assignment) => assignment.status === 'completed').length,
    live: true,
  };
}

/**
 * Sync classes + coursework from Google Classroom.
 */
async function syncGoogleClassroom(buttonEl) {
  const done = withButtonLoading(buttonEl, 'Syncing Classroom...');
  try {
    const status = await googleConnectionStatus();
    if (status.configured) {
      if (!status.connected) {
        beginGoogleConnect();
        return { ok: false, pending: true };
      }
      const payload = await fetchServerClassroom();
      const result = applyClassroomPayload(payload);
      const who = payload.email ? ` (${payload.email})` : '';
      const submissionErrorCount = Array.isArray(payload.submissionErrors) ? payload.submissionErrors.length : 0;
      const message = `Synced ${result.courseCount} classes, ${result.assignmentCount} coursework items, and ${result.taskCount} tasks from Google Classroom${who}; ${result.completedCount} completed`;
      showToast(
        submissionErrorCount ? `${message}. Could not load submissions for ${submissionErrorCount} courses.` : message,
        submissionErrorCount ? 'warning' : 'success'
      );
      return { ok: true, ...result };
    }
    const clientId = getGoogleClientId();
    if (!clientId) throw new Error('Google Classroom is not configured. Connect Google in Settings before syncing.');
    const payload = await fetchLiveClassroomPayload();
    if (!payload) throw new Error('Google Classroom did not return any course data.');
    const result = applyClassroomPayload(payload);
    const submissionErrorCount = Array.isArray(payload.submissionErrors) ? payload.submissionErrors.length : 0;
    const message = `Synced ${result.courseCount} classes, ${result.assignmentCount} coursework items, and ${result.taskCount} tasks; ${result.completedCount} completed.`;
    showToast(
      submissionErrorCount ? `${message} Could not load submissions for ${submissionErrorCount} courses.` : message,
      submissionErrorCount ? 'warning' : 'success'
    );
    return { ok: true, ...result };
  } catch (err) {
    showToast(err.message || 'Classroom sync failed. Try again.', 'error');
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

async function syncGoogleCalendar(buttonEl) {
  const done = withButtonLoading(buttonEl, 'Syncing Calendar...');
  try {
    const status = await googleConnectionStatus(true);
    if (!status.configured) {
      showToast('Add the Google client ID and secret in config/google.php, then connect Calendar.', 'warning');
      return { ok: false };
    }
    if (!status.connected || !String(status.scopes || '').includes('/auth/calendar')) {
      if (isTodaySync) {
        beginGoogleConnect();
      } else {
        const next = new URL(window.location.href);
        next.searchParams.set('syncScheduleAfterConnect', '1');
        beginGoogleConnect(`${next.pathname}${next.search}${next.hash}`);
      }
      return { ok: false, pending: true };
    }
    applyGoogleConnection(status);
    if (typeof window.refreshGoogleCalendar === 'function') await window.refreshGoogleCalendar();
    showToast(status.email ? `Synced Google Calendar for ${status.email}` : 'Synced Google Calendar', 'success');
    return { ok: true };
  } catch (err) {
    showToast(err.message || 'Calendar sync failed.', 'error');
    return { ok: false, error: err };
  } finally {
    done();
  }
}

async function syncScheduleEventsToGoogleCalendar(events, date, buttonEl) {
  const isTodaySync = Boolean(date);
  const done = withButtonLoading(buttonEl, isTodaySync ? 'Syncing today...' : 'Syncing schedule...');
  let synced = 0;
  try {
    const scheduleEvents = (Array.isArray(events) ? events : [])
      .filter((entry) => entry && (!date || entry.date === date));
    if (!scheduleEvents.length) {
      showToast(isTodaySync ? 'There are no schedule entries for today to sync.' : 'There are no schedule entries to sync.', 'info');
      return { ok: false };
    }

    const status = await googleConnectionStatus(true);
    if (!status.configured) {
      showToast('Google Calendar is not configured on this server.', 'error');
      return { ok: false };
    }
    if (!status.connected || !String(status.scopes || '').includes('/auth/calendar')) {
      beginGoogleConnect();
      return { ok: false, pending: true };
    }
    applyGoogleConnection(status);

    const failed = [];
    for (let index = 0; index < scheduleEvents.length; index += 100) {
      const batch = scheduleEvents.slice(index, index + 100);
      const body = new URLSearchParams({
        date,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Manila',
        events: JSON.stringify(batch.map((entry) => ({
          id: entry.id,
          title: entry.title,
          subject: entry.subject || '',
          date: entry.date,
          startTime: entry.startTime || '',
          endTime: entry.endTime || '',
          room: entry.room || '',
        }))),
      });
      const response = await fetch(`${SB_API_BASE}google.php?action=calendar-sync-schedule`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.content || '',
        },
        body,
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(result.message || 'Could not sync the schedule.');
      synced += Number(result.synced) || 0;
      if (Array.isArray(result.failed)) failed.push(...result.failed);
    }

    if (failed.length) {
      const firstFailure = failed[0];
      showToast(
        `Synced ${synced} of ${scheduleEvents.length}. ${firstFailure.title}: ${String(firstFailure.message || 'Could not sync event.').slice(0, 120)}`,
        'warning'
      );
    } else {
      showToast(`Synced ${synced} schedule events to Google Calendar.`, 'success');
    }
    return { ok: true, synced, failed };
  } catch (error) {
    const message = synced
      ? `Synced ${synced} events, but could not finish: ${error.message || 'Google Calendar sync failed.'}`
      : error.message || 'Google Calendar sync failed.';
    showToast(message, 'error');
    return { ok: false, error };
  } finally {
    done();
  }
}

async function syncTodayScheduleToGoogleCalendar(events, date, buttonEl) {
  return syncScheduleEventsToGoogleCalendar(events, date, buttonEl);
}

async function syncScheduleToGoogleCalendar(events, buttonEl) {
  return syncScheduleEventsToGoogleCalendar(events, '', buttonEl);
}

async function mockGoogleCalendarSync(buttonEl) {
  return syncGoogleCalendar(buttonEl);
}

async function mockGoogleDriveSync(buttonEl) {
  const done = withButtonLoading(buttonEl, 'Syncing...');
  try {
    const status = await googleConnectionStatus();
    if (!status.configured) {
      showToast('Add the Google client ID and secret in config/google.php, then connect Drive.', 'warning');
      return { ok: false };
    }
    if (!status.connected) {
      beginGoogleConnect();
      return { ok: false, pending: true };
    }
    applyGoogleConnection(status);
    if (typeof window.refreshDriveFromGoogle === 'function') await window.refreshDriveFromGoogle();
    showToast(status.email ? `Synced Google Drive for ${status.email}` : 'Synced with Google Drive', 'success');
    return { ok: true };
  } catch (err) {
    showToast(err.message || 'Drive sync failed.', 'error');
    return { ok: false, error: err };
  } finally {
    done();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const flag = params.get('google');
  if (flag) {
    if (flag === 'connected') {
      showToast('Google Classroom, Calendar, and Drive are connected.', 'success');
      if (params.get('syncScheduleAfterConnect') === '1') {
        window.SB_PENDING_SCHEDULE_SYNC = true;
      } else {
        syncGoogleClassroom();
      }
    } else if (flag === 'error') {
      showToast(params.get('message') || 'Google connection failed.', 'error');
    }
    params.delete('google');
    params.delete('message');
    params.delete('syncScheduleAfterConnect');
    const query = params.toString();
    window.history.replaceState({}, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`);
  }
  refreshGoogleConnection();
});

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

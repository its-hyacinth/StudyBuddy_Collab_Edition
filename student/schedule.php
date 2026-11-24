<?php $expectedRole = 'student'; require_once __DIR__ . '/../includes/page_guard.php'; ?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta name="csrf-token" content="<?= e($_SESSION['csrf_token']) ?>">
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>StudyBuddy — Schedule</title>
  <link rel="stylesheet" href="../css/style.css" />
  <link rel="stylesheet" href="../css/components.css" />
  <link rel="stylesheet" href="../css/pages.css" />
  <link rel="stylesheet" href="../css/student.css" />
  <script src="https://unpkg.com/lucide@latest"></script>
</head>
<body class="student-app">
  <div class="app-shell" id="appShell">
    <div class="page-content">
      <div class="page-header">
        <div>
          <h1 class="page-title">
            <span class="title-icon"><i data-lucide="calendar"></i></span>
            Schedule
          </h1>
          <p class="page-subtitle">View your classes, deadlines, and events in calendar or list view.</p>
        </div>
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
  <div class="view-toggle" id="scheduleViewToggle" role="tablist">
    <button type="button" class="active" data-view="calendar" role="tab">
      <i data-lucide="calendar"></i> Calendar
    </button>
    <button type="button" data-view="list" role="tab">
      <i data-lucide="list"></i> List
    </button>
  </div>
  <button type="button" class="btn btn-outline" id="syncGoogleCalBtn">
    <i data-lucide="calendar"></i> Sync schedule to Google Calendar
  </button>
  <button type="button" class="btn btn-primary" id="addScheduleBtn">
    <i data-lucide="plus"></i> Add Event
  </button>
</div>
      </div>

      <div class="page-layout">
        <div class="page-main">
          <div class="card" id="calendarView">
            <div class="cal-nav">
              <h4 id="fullCalMonth"></h4>
              <div class="cal-nav-btns">
                <button type="button" class="icon-btn" id="fullCalPrev" aria-label="Previous month"><i data-lucide="chevron-left"></i></button>
                <button type="button" class="btn btn-ghost btn-sm" id="fullCalToday">Today</button>
                <button type="button" class="icon-btn" id="fullCalNext" aria-label="Next month"><i data-lucide="chevron-right"></i></button>
              </div>
            </div>
            <div class="cal-grid cal-full" id="fullCalendar"></div>
          </div>

          <div class="card" id="listView" style="display:none">
            <div class="card-header">
              <div class="card-header-left">
                <div class="card-icon blue"><i data-lucide="list"></i></div>
                <h2 class="card-title">All Events</h2>
              </div>
            </div>
            <div id="scheduleList"></div>
          </div>
        </div>

        <aside class="page-aside">
          <div class="card" id="scheduleUpcomingEvents">
            <div class="card-header">
              <div class="card-header-left">
                <div class="card-icon teal"><i data-lucide="calendar-days"></i></div>
                <h2 class="card-title">Upcoming Events</h2>
              </div>
            </div>
            <div id="scheduleEventsList"></div>
          </div>

          <div class="card">
            <div class="card-header">
              <div class="card-header-left">
                <div class="card-icon green"><i data-lucide="refresh-cw"></i></div>
                <h2 class="card-title">Google Classroom</h2>
              </div>
            </div>
            <p style="font-size:13px;color:var(--text-muted);margin-bottom:14px">Sync to load courses and assignments from Google Classroom. Classroom may not include meeting times; add those events here.</p>
            <button type="button" class="btn btn-primary btn-block" id="syncClassroomBtn">
              <i data-lucide="refresh-cw"></i> Sync with Google Classroom
            </button>
            <button type="button" class="btn btn-outline btn-block btn-sm" style="margin-top:8px" id="openClassroomBtn">
              <i data-lucide="external-link"></i> Open Google Classroom
            </button>
          </div>
        </aside>
      </div>
    </div>
  </div>

  <div class="modal-backdrop" id="addScheduleModal">
    <div class="modal" role="dialog" aria-labelledby="addScheduleTitle">
      <div class="modal-header">
        <h3 id="addScheduleTitle">Add Schedule Event</h3>
        <button type="button" class="modal-close" data-close-modal="addScheduleModal" aria-label="Close">
          <i data-lucide="x"></i>
        </button>
      </div>
      <form id="addScheduleForm">
        <div class="modal-body">
          <div class="form-group">
            <label for="schTitle">Title</label>
            <input type="text" class="form-control" id="schTitle" name="title" placeholder="Event title" required />
          </div>
          <div class="form-group">
            <label for="schSubject">Subject</label>
            <select class="form-control" id="schSubject" name="subjectId">
              <option value="">Select subject (optional)</option>
            </select>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="schDate">Date</label>
              <input type="date" class="form-control" id="schDate" name="date" required />
            </div>
            <div class="form-group">
              <label for="schType">Type</label>
              <select class="form-control" id="schType" name="type">
                <option value="class">Class</option>
                <option value="deadline">Deadline</option>
                <option value="event">Event</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="schStartTime">Start Time</label>
              <input type="time" class="form-control" id="schStartTime" name="startTime" required />
            </div>
            <div class="form-group">
              <label for="schEndTime">End Time</label>
              <input type="time" class="form-control" id="schEndTime" name="endTime" />
            </div>
          </div>
          <div class="form-group">
            <label for="schRoom">Room / Location</label>
            <input type="text" class="form-control" id="schRoom" name="room" placeholder="Room" />
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-ghost" data-close-modal="addScheduleModal">Cancel</button>
          <button type="submit" class="btn btn-primary">Add Event</button>
        </div>
      </form>
    </div>
  </div>

  <div class="modal-backdrop" id="dayScheduleModal">
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="dayScheduleTitle">
      <div class="modal-header">
        <h3 id="dayScheduleTitle">Schedule for this day</h3>
        <button type="button" class="modal-close" data-close-modal="dayScheduleModal" aria-label="Close day schedule">
          <i data-lucide="x"></i>
        </button>
      </div>
      <div class="modal-body">
        <div id="dayScheduleEvents"></div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-ghost" data-close-modal="dayScheduleModal">Close</button>
        <button type="button" class="btn btn-primary" id="addDayScheduleBtn">
          <i data-lucide="plus"></i> Add Event
        </button>
      </div>
    </div>
  </div>

  <script src="../js/data.js"></script>
  <script src="../js/auth.js"></script>
  <script src="../js/sidebar.js"></script>
  <script src="../js/google-integration.js"></script>
  <script src="../js/schedule.js"></script>
</body>
</html>

<?php $expectedRole = 'teacher'; require_once __DIR__ . '/../includes/page_guard.php'; ?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta name="csrf-token" content="<?= e($_SESSION['csrf_token']) ?>">
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>StudyBuddy — Calendar</title>
  <link rel="stylesheet" href="../css/style.css" />
  <link rel="stylesheet" href="../css/components.css" />
  <link rel="stylesheet" href="../css/pages.css" />
  <script src="https://unpkg.com/lucide@latest"></script>
</head>
<body data-role="teacher">
  <div class="app-shell" id="appShell">
    <div class="page-content">
      <div class="page-header">
        <div>
          <h1 class="page-title">
            <span class="title-icon"><i data-lucide="calendar"></i></span>
            Calendar
          </h1>
          <p class="page-subtitle">Manage your class schedule, deadlines, and events.</p>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <button type="button" class="btn btn-outline" id="syncClassroomBtn">
            <i data-lucide="refresh-cw"></i> Sync Google Classroom
          </button>
          <button type="button" class="btn btn-outline" id="syncGoogleCalBtn">
            <i data-lucide="calendar"></i> Sync Google Calendar
          </button>
          <button type="button" class="btn btn-primary" id="addScheduleBtn">
            <i data-lucide="plus"></i> Add Schedule
          </button>
        </div>
      </div>

      <div class="page-layout">
        <div class="page-main">
          <div class="toolbar">
            <div class="view-toggle" id="calViewToggle">
              <button type="button" class="active" data-view="calendar"><i data-lucide="calendar"></i> Calendar</button>
              <button type="button" data-view="list"><i data-lucide="list"></i> List</button>
            </div>
            <select id="calClassFilter" aria-label="Filter by class">
              <option value="">All Classes</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Science">Science</option>
              <option value="English">English</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Filipino">Filipino</option>
              <option value="History">History</option>
            </select>
            <select id="calTypeFilter" aria-label="Filter by type">
              <option value="">All Types</option>
              <option value="class">Class</option>
              <option value="deadline">Deadline</option>
              <option value="event">Event</option>
            </select>
          </div>

          <!-- Calendar View -->
          <div class="card" id="calendarView">
            <div class="cal-nav">
              <h4 id="calMonthLabel">September 2025</h4>
              <div class="cal-nav-btns">
                <button type="button" class="icon-btn" id="calPrevMonth" aria-label="Previous month"><i data-lucide="chevron-left"></i></button>
                <button type="button" class="btn btn-ghost btn-sm" id="calTodayBtn">Today</button>
                <button type="button" class="icon-btn" id="calNextMonth" aria-label="Next month"><i data-lucide="chevron-right"></i></button>
              </div>
            </div>
            <div class="cal-grid cal-full" id="calGrid">
              <div class="cal-dow">Sun</div>
              <div class="cal-dow">Mon</div>
              <div class="cal-dow">Tue</div>
              <div class="cal-dow">Wed</div>
              <div class="cal-dow">Thu</div>
              <div class="cal-dow">Fri</div>
              <div class="cal-dow">Sat</div>
              <!-- Week 1 -->
              <div class="cal-day other"><span class="day-num">31</span></div>
              <div class="cal-day"><span class="day-num">1</span></div>
              <div class="cal-day"><span class="day-num">2</span></div>
              <div class="cal-day"><span class="day-num">3</span></div>
              <div class="cal-day"><span class="day-num">4</span></div>
              <div class="cal-day"><span class="day-num">5</span><div class="cal-event-chip math">Quiz Due</div></div>
              <div class="cal-day"><span class="day-num">6</span></div>
              <!-- Week 2 -->
              <div class="cal-day"><span class="day-num">7</span></div>
              <div class="cal-day"><span class="day-num">8</span></div>
              <div class="cal-day"><span class="day-num">9</span></div>
              <div class="cal-day"><span class="day-num">10</span><div class="cal-event-chip cs">Project Due</div></div>
              <div class="cal-day"><span class="day-num">11</span></div>
              <div class="cal-day today"><span class="day-num">12</span>
                <div class="cal-event-chip math">Math 8–9:30</div>
                <div class="cal-event-chip science">Science 10–11:30</div>
                <div class="cal-event-chip english">English 1–2:30</div>
              </div>
              <div class="cal-day"><span class="day-num">13</span></div>
              <!-- Week 3 -->
              <div class="cal-day"><span class="day-num">14</span><div class="cal-event-chip science">Lab Report Due</div></div>
              <div class="cal-day"><span class="day-num">15</span><div class="cal-event-chip math">Quiz 1</div><div class="cal-event-chip cs">CS 9–10:30</div></div>
              <div class="cal-day"><span class="day-num">16</span><div class="cal-event-chip filipino">Oral Recitation</div></div>
              <div class="cal-day"><span class="day-num">17</span><div class="cal-event-chip history">History 2–3:30</div></div>
              <div class="cal-day"><span class="day-num">18</span><div class="cal-event-chip english">Essay Due</div><div class="cal-event-chip task">Group Study</div></div>
              <div class="cal-day"><span class="day-num">19</span><div class="cal-event-chip science">Science Lab</div></div>
              <div class="cal-day"><span class="day-num">20</span><div class="cal-event-chip cs">Project Demo</div></div>
              <!-- Week 4 -->
              <div class="cal-day"><span class="day-num">21</span></div>
              <div class="cal-day"><span class="day-num">22</span><div class="cal-event-chip english">Presentation</div><div class="cal-event-chip history">Essay Due</div></div>
              <div class="cal-day"><span class="day-num">23</span></div>
              <div class="cal-day"><span class="day-num">24</span></div>
              <div class="cal-day"><span class="day-num">25</span><div class="cal-event-chip history">Kasaysayan Essay</div></div>
              <div class="cal-day"><span class="day-num">26</span></div>
              <div class="cal-day"><span class="day-num">27</span></div>
              <!-- Week 5 -->
              <div class="cal-day"><span class="day-num">28</span></div>
              <div class="cal-day"><span class="day-num">29</span></div>
              <div class="cal-day"><span class="day-num">30</span></div>
              <div class="cal-day other"><span class="day-num">1</span></div>
              <div class="cal-day other"><span class="day-num">2</span></div>
              <div class="cal-day other"><span class="day-num">3</span></div>
              <div class="cal-day other"><span class="day-num">4</span></div>
            </div>
          </div>

          <!-- List View -->
          <div class="card" id="listView" style="display:none;">
            <div id="scheduleList">
              <div class="schedule-item" data-id="sch_1">
                <span class="time">8:00 – 9:30 AM</span>
                <div class="info">
                  <div class="subj">Mathematics</div>
                  <div class="room">Room 302 · Sep 12, 2025</div>
                </div>
                <span class="badge badge-info">Class</span>
                <div class="action-menu-wrap">
                  <button type="button" class="action-menu-btn" aria-label="Actions"><i data-lucide="more-horizontal"></i></button>
                  <div class="action-dropdown">
                    <button type="button"><i data-lucide="edit"></i> Edit</button>
                    <button type="button" class="danger"><i data-lucide="trash-2"></i> Delete</button>
                  </div>
                </div>
              </div>
              <div class="schedule-item" data-id="sch_2">
                <span class="time">10:00 – 11:30 AM</span>
                <div class="info">
                  <div class="subj">Science</div>
                  <div class="room">Lab 105 · Sep 12, 2025</div>
                </div>
                <span class="badge badge-info">Class</span>
                <div class="action-menu-wrap">
                  <button type="button" class="action-menu-btn" aria-label="Actions"><i data-lucide="more-horizontal"></i></button>
                  <div class="action-dropdown">
                    <button type="button"><i data-lucide="edit"></i> Edit</button>
                    <button type="button" class="danger"><i data-lucide="trash-2"></i> Delete</button>
                  </div>
                </div>
              </div>
              <div class="schedule-item" data-id="sch_3">
                <span class="time">1:00 – 2:30 PM</span>
                <div class="info">
                  <div class="subj">English</div>
                  <div class="room">Room 210 · Sep 12, 2025</div>
                </div>
                <span class="badge badge-info">Class</span>
                <div class="action-menu-wrap">
                  <button type="button" class="action-menu-btn" aria-label="Actions"><i data-lucide="more-horizontal"></i></button>
                  <div class="action-dropdown">
                    <button type="button"><i data-lucide="edit"></i> Edit</button>
                    <button type="button" class="danger"><i data-lucide="trash-2"></i> Delete</button>
                  </div>
                </div>
              </div>
              <div class="schedule-item" data-id="sch_4">
                <span class="time">9:00 – 10:30 AM</span>
                <div class="info">
                  <div class="subj">Computer Science</div>
                  <div class="room">Lab 401 · Sep 15, 2025</div>
                </div>
                <span class="badge badge-info">Class</span>
                <div class="action-menu-wrap">
                  <button type="button" class="action-menu-btn" aria-label="Actions"><i data-lucide="more-horizontal"></i></button>
                  <div class="action-dropdown">
                    <button type="button"><i data-lucide="edit"></i> Edit</button>
                    <button type="button" class="danger"><i data-lucide="trash-2"></i> Delete</button>
                  </div>
                </div>
              </div>
              <div class="schedule-item" data-id="sch_7">
                <span class="time">11:59 PM</span>
                <div class="info">
                  <div class="subj">Math Quiz Due</div>
                  <div class="room">Online · Sep 12, 2025</div>
                </div>
                <span class="badge badge-overdue">Deadline</span>
                <div class="action-menu-wrap">
                  <button type="button" class="action-menu-btn" aria-label="Actions"><i data-lucide="more-horizontal"></i></button>
                  <div class="action-dropdown">
                    <button type="button"><i data-lucide="edit"></i> Edit</button>
                    <button type="button" class="danger"><i data-lucide="trash-2"></i> Delete</button>
                  </div>
                </div>
              </div>
              <div class="schedule-item" data-id="sch_8">
                <span class="time">3:00 – 5:00 PM</span>
                <div class="info">
                  <div class="subj">Group Study Session</div>
                  <div class="room">Library · Sep 18, 2025</div>
                </div>
                <span class="badge badge-upcoming">Event</span>
                <div class="action-menu-wrap">
                  <button type="button" class="action-menu-btn" aria-label="Actions"><i data-lucide="more-horizontal"></i></button>
                  <div class="action-dropdown">
                    <button type="button"><i data-lucide="edit"></i> Edit</button>
                    <button type="button" class="danger"><i data-lucide="trash-2"></i> Delete</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside class="page-aside">
          <div class="card">
            <div class="card-header">
              <div class="card-header-left">
                <div class="card-icon blue"><i data-lucide="calendar-days"></i></div>
                <h2 class="card-title">Mini Calendar</h2>
              </div>
            </div>
            <div id="miniCalendar"></div>
          </div>

          <div class="card">
            <div class="card-header">
              <div class="card-header-left">
                <div class="card-icon green"><i data-lucide="clock"></i></div>
                <h2 class="card-title">Today's Schedule</h2>
              </div>
            </div>
            <div id="todayScheduleAside"></div>
          </div>

          <div class="card">
            <div class="card-header">
              <div class="card-header-left">
                <div class="card-icon purple"><i data-lucide="link"></i></div>
                <h2 class="card-title">Google Classroom</h2>
              </div>
            </div>
            <div id="googleCalStatus">
              <p style="font-size:13px;color:var(--text-muted);margin-bottom:12px;">Classes come from Google Classroom. Instructors stay TBA until Classroom returns teacher names.</p>
              <button type="button" class="btn btn-outline btn-block" id="connectClassroomBtn">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="width:18px;height:18px">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.03 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Connect Google Classroom
              </button>
            </div>
          </div>

          <div class="tip-card">
            <div class="tip-icon"><i data-lucide="lightbulb"></i></div>
            <p>"Color-code events by class type — classes, deadlines, and meetings — to scan your week at a glance."</p>
            <div class="tip-footer"><i data-lucide="sparkles"></i> Calendar tip</div>
          </div>
        </aside>
      </div>
    </div>
  </div>

  <!-- Add Schedule Modal -->
  <div class="modal-backdrop" id="addScheduleModal">
    <div class="modal">
      <div class="modal-header">
        <h3 id="addScheduleTitle">Add Schedule</h3>
        <button type="button" class="modal-close" data-close-modal="addScheduleModal" aria-label="Close">
          <i data-lucide="x"></i>
        </button>
      </div>
      <form id="addScheduleForm">
        <div class="modal-body">
          <div class="form-group">
            <label for="schTitle">Title</label>
            <input class="form-control" type="text" id="schTitle" placeholder="Event title" required />
          </div>
          <div class="form-group">
            <label for="schSubject">Subject / Class</label>
            <select class="form-control" id="schSubject" required>
              <option value="">Select subject</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Science">Science</option>
              <option value="English">English</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Filipino">Filipino</option>
              <option value="History">History</option>
            </select>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="schDate">Date</label>
              <input class="form-control" type="date" id="schDate" required />
            </div>
            <div class="form-group">
              <label for="schType">Type</label>
              <select class="form-control" id="schType" required>
                <option value="class">Class</option>
                <option value="deadline">Deadline</option>
                <option value="event">Event</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="schStartTime">Start Time</label>
              <input class="form-control" type="time" id="schStartTime" required />
            </div>
            <div class="form-group">
              <label for="schEndTime">End Time</label>
              <input class="form-control" type="time" id="schEndTime" required />
            </div>
          </div>
          <div class="form-group">
            <label for="schRoom">Room / Location</label>
            <input class="form-control" type="text" id="schRoom" placeholder="Room 302" />
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-ghost" data-close-modal="addScheduleModal">Cancel</button>
          <button type="submit" class="btn btn-primary" id="saveScheduleBtn">Add Schedule</button>
        </div>
      </form>
    </div>
  </div>

  <div class="modal-backdrop" id="dayScheduleModal">
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="dayScheduleTitle">
      <div class="modal-header">
        <h3 id="dayScheduleTitle">Events for this day</h3>
        <button type="button" class="modal-close" data-close-modal="dayScheduleModal" aria-label="Close day details">
          <i data-lucide="x"></i>
        </button>
      </div>
      <div class="modal-body">
        <div id="dayScheduleEvents"></div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-ghost" data-close-modal="dayScheduleModal">Close</button>
        <button type="button" class="btn btn-primary" id="addDayScheduleBtn">
          <i data-lucide="plus"></i> Add Schedule
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

<?php $expectedRole = 'student'; require_once __DIR__ . '/../includes/page_guard.php'; ?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta name="csrf-token" content="<?= e($_SESSION['csrf_token']) ?>">
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>StudyBuddy — Dashboard</title>
  <link rel="stylesheet" href="../css/style.css" />
  <link rel="stylesheet" href="../css/components.css" />
  <link rel="stylesheet" href="../css/pages.css" />
  <link rel="stylesheet" href="../css/student.css" />
  <script src="https://unpkg.com/lucide@latest"></script>
</head>
<body class="student-app">
  <div class="app-shell" id="appShell">
    <div class="page-content">
      <h1 class="greeting" id="greeting">Good morning, Juan!</h1>
      <p class="greeting-sub" id="greetingSub">Here's what's happening with your studies today.</p>

      <div class="stat-grid">
        <a href="subjects.php" class="stat-card" id="statSubjects">
          <div class="stat-icon blue"><i data-lucide="book-open"></i></div>
          <div class="stat-body">
            <div class="stat-label">Subjects</div>
            <div class="stat-value">6</div>
            <div class="stat-delta up"><i data-lucide="trending-up"></i> All enrolled</div>
          </div>
          <i data-lucide="chevron-right" class="stat-arrow"></i>
        </a>
        <a href="assignments.php" class="stat-card" id="statAssignments">
          <div class="stat-icon purple"><i data-lucide="clipboard-list"></i></div>
          <div class="stat-body">
            <div class="stat-label">Assignments</div>
            <div class="stat-value">16</div>
            <div class="stat-delta down"><i data-lucide="alert-circle"></i> 3 overdue</div>
          </div>
          <i data-lucide="chevron-right" class="stat-arrow"></i>
        </a>
        <a href="todo.php" class="stat-card" id="statTasks">
          <div class="stat-icon green"><i data-lucide="check-square"></i></div>
          <div class="stat-body">
            <div class="stat-label">Tasks</div>
            <div class="stat-value">8</div>
            <div class="stat-delta up"><i data-lucide="clock"></i> 3 due today</div>
          </div>
          <i data-lucide="chevron-right" class="stat-arrow"></i>
        </a>
        <a href="progress.php" class="stat-card" id="statProgress">
          <div class="stat-icon orange"><i data-lucide="trending-up"></i></div>
          <div class="stat-body">
            <div class="stat-label">Study Progress</div>
            <div class="stat-value">68%</div>
            <div class="stat-delta up"><i data-lucide="trending-up"></i> +5% this week</div>
          </div>
          <i data-lucide="chevron-right" class="stat-arrow"></i>
        </a>
      </div>

      <div class="page-layout">
        <div class="page-main">
          <div class="dash-grid-2">
            <div class="card">
              <div class="card-header">
                <div class="card-header-left">
                  <div class="card-icon blue"><i data-lucide="calendar-clock"></i></div>
                  <h2 class="card-title">Today's Schedule</h2>
                </div>
                <a href="schedule.php?view=list" class="view-all" aria-label="View all schedule entries">View all</a>
              </div>
              <div id="todaySchedule">
                <div class="schedule-item">
                  <div class="time">8:00 – 9:30 AM</div>
                  <div class="info">
                    <div class="subj">Mathematics</div>
                    <div class="room">Room 302</div>
                  </div>
                  <span class="badge badge-upcoming">Class</span>
                </div>
                <div class="schedule-item">
                  <div class="time">10:00 – 11:30 AM</div>
                  <div class="info">
                    <div class="subj">Science</div>
                    <div class="room">Lab 105</div>
                  </div>
                  <span class="badge badge-upcoming">Class</span>
                </div>
                <div class="schedule-item">
                  <div class="time">1:00 – 2:30 PM</div>
                  <div class="info">
                    <div class="subj">English</div>
                    <div class="room">Room 210</div>
                  </div>
                  <span class="badge badge-upcoming">Class</span>
                </div>
              </div>
            </div>

            <div class="card">
              <div class="card-header">
                <div class="card-header-left">
                  <div class="card-icon purple"><i data-lucide="book-open"></i></div>
                  <h2 class="card-title">Recent Subjects</h2>
                </div>
                <a href="subjects.php#subjectGrid" class="view-all" aria-label="View all subjects">View all</a>
              </div>
              <div class="subject-tiles" id="recentSubjects">
                <a href="subjects.php" class="subject-tile">
                  <div class="tile-top">
                    <div class="tile-icon" style="background:#DBEAFE;color:#2563EB"><i data-lucide="calculator"></i></div>
                    <div>
                      <div class="tile-name">Mathematics</div>
                      <div class="tile-count">75% complete</div>
                    </div>
                  </div>
                  <div class="progress-bar"><div class="fill math" style="width:75%"></div></div>
                </a>
                <a href="subjects.php" class="subject-tile">
                  <div class="tile-top">
                    <div class="tile-icon" style="background:#DCFCE7;color:#16A34A"><i data-lucide="flask-conical"></i></div>
                    <div>
                      <div class="tile-name">Science</div>
                      <div class="tile-count">50% complete</div>
                    </div>
                  </div>
                  <div class="progress-bar"><div class="fill science" style="width:50%"></div></div>
                </a>
                <a href="subjects.php" class="subject-tile">
                  <div class="tile-top">
                    <div class="tile-icon" style="background:#EDE9FE;color:#7C3AED"><i data-lucide="book-open"></i></div>
                    <div>
                      <div class="tile-name">English</div>
                      <div class="tile-count">80% complete</div>
                    </div>
                  </div>
                  <div class="progress-bar"><div class="fill english" style="width:80%"></div></div>
                </a>
                <a href="subjects.php" class="subject-tile">
                  <div class="tile-top">
                    <div class="tile-icon" style="background:#FFEDD5;color:#EA580C"><i data-lucide="code-2"></i></div>
                    <div>
                      <div class="tile-name">Computer Science</div>
                      <div class="tile-count">60% complete</div>
                    </div>
                  </div>
                  <div class="progress-bar"><div class="fill cs" style="width:60%"></div></div>
                </a>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <div class="card-header-left">
                <div class="card-icon orange"><i data-lucide="clipboard-list"></i></div>
                <h2 class="card-title">Pending Assignments</h2>
              </div>
              <a href="assignments.php#asgTable" class="view-all" aria-label="View all assignments">View all</a>
            </div>
            <div id="upcomingAssignments">
              <div class="list-item">
                <div class="cell-icon" style="background:#DBEAFE;color:#2563EB;width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center"><i data-lucide="file-text"></i></div>
                <div class="item-meta">
                  <div class="item-title">Algebra Homework Set 3</div>
                  <div class="item-sub">Mathematics · Due Sep 12, 2025</div>
                </div>
                <span class="badge badge-upcoming">Upcoming</span>
                <i data-lucide="chevron-right" class="chevron"></i>
              </div>
              <div class="list-item">
                <div class="cell-icon" style="background:#DCFCE7;color:#16A34A;width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center"><i data-lucide="flask-conical"></i></div>
                <div class="item-meta">
                  <div class="item-title">Science Lab Report</div>
                  <div class="item-sub">Science · Due Sep 14, 2025</div>
                </div>
                <span class="badge badge-upcoming">Upcoming</span>
                <i data-lucide="chevron-right" class="chevron"></i>
              </div>
              <div class="list-item">
                <div class="cell-icon" style="background:#FFEDD5;color:#EA580C;width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center"><i data-lucide="code-2"></i></div>
                <div class="item-meta">
                  <div class="item-title">HTML/CSS Landing Page</div>
                  <div class="item-sub">Computer Science · Due Sep 20, 2025</div>
                </div>
                <span class="badge badge-upcoming">Upcoming</span>
                <i data-lucide="chevron-right" class="chevron"></i>
              </div>
            </div>
          </div>
        </div>

        <aside class="page-aside">
          <div class="card">
            <div class="card-header">
              <div class="card-header-left">
                <div class="card-icon blue"><i data-lucide="calendar"></i></div>
                <h2 class="card-title">Calendar</h2>
              </div>
            </div>
            <div id="miniCalendar"></div>
            <div style="display:flex;gap:8px;margin-top:12px">
              <button type="button" class="btn btn-outline btn-sm btn-block" id="syncClassroomBtn">
                <i data-lucide="refresh-cw"></i> Sync Classroom
              </button>
              <button type="button" class="btn btn-primary btn-sm btn-block" id="openClassroomBtn">
                <i data-lucide="external-link"></i> Open
              </button>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <div class="card-header-left">
                <div class="card-icon teal"><i data-lucide="calendar-days"></i></div>
                <h2 class="card-title">Upcoming Events</h2>
              </div>
            </div>
            <div id="upcomingEvents">
              <div class="list-item">
                <span class="dot math"></span>
                <div class="item-meta">
                  <div class="item-title">Math Quiz Due</div>
                  <div class="item-sub">Sep 12 · 11:59 PM</div>
                </div>
              </div>
              <div class="list-item">
                <span class="dot cs"></span>
                <div class="item-meta">
                  <div class="item-title">Group Study Session</div>
                  <div class="item-sub">Sep 18 · 3:00 PM</div>
                </div>
              </div>
              <div class="list-item">
                <span class="dot english"></span>
                <div class="item-meta">
                  <div class="item-title">English Presentation</div>
                  <div class="item-sub">Sep 22 · 1:00 PM</div>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <div class="card-header-left">
                <div class="card-icon green"><i data-lucide="pie-chart"></i></div>
                <h2 class="card-title">Study Progress</h2>
              </div>
              <a href="progress.php" class="view-all">Details</a>
            </div>
            <div id="studyProgressDonut">
              <div class="donut-wrap">
                <div class="donut">
                  <svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="36" fill="none" stroke="#E2E8F0" stroke-width="10"/><circle cx="50" cy="50" r="36" fill="none" stroke="#2563EB" stroke-width="10" stroke-dasharray="226.2" stroke-dashoffset="72.4" stroke-linecap="round"/></svg>
                  <div class="center-label">68%<small>Overall</small></div>
                </div>
                <div class="donut-legend">
                  <div class="donut-legend-row">
                    <div class="lbl"><span>Completed</span><span>12/18</span></div>
                    <div class="progress-bar"><div class="fill green" style="width:67%"></div></div>
                  </div>
                  <div class="donut-legend-row">
                    <div class="lbl"><span>Assignments</span><span>5/16</span></div>
                    <div class="progress-bar"><div class="fill blue" style="width:31%"></div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <div class="card-header-left">
                <div class="card-icon purple"><i data-lucide="zap"></i></div>
                <h2 class="card-title">Quick Actions</h2>
              </div>
            </div>
            <div class="qa-grid">
              <button type="button" class="qa-btn blue" data-action="add-task">
                <i data-lucide="plus-circle"></i> Add Task
              </button>
              <button type="button" class="qa-btn purple" data-action="add-assignment">
                <i data-lucide="clipboard-plus"></i> New Assignment
              </button>
              <button type="button" class="qa-btn green" data-action="view-schedule">
                <i data-lucide="calendar"></i> View Schedule
              </button>
              <button type="button" class="qa-btn orange" data-action="upload-file">
                <i data-lucide="upload"></i> Upload File
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  </div>

  <script src="../js/data.js"></script>
  <script src="../js/auth.js"></script>
  <script src="../js/sidebar.js"></script>
  <script src="../js/google-integration.js"></script>
  <script src="../js/dashboard.js"></script>
</body>
</html>

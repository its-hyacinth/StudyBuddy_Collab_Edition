<?php $expectedRole = 'teacher'; require_once __DIR__ . '/../includes/page_guard.php'; ?>
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
  <script src="https://unpkg.com/lucide@latest"></script>
</head>
<body>
  <div class="app-shell" id="appShell">
    <div class="page-content">
      <div class="greeting-banner">
        <div>
          <h1 class="greeting" id="greeting">Good morning, Prof.!</h1>
          <p class="greeting-sub" id="greetingSub">Here's what's happening across your classes today.</p>
        </div>
        <div class="banner-art">
          <img src="../assets/wallpaper.png" alt="" />
        </div>
      </div>

      <div class="stat-grid" id="dashStats">
        <div class="stat-card">
          <div class="stat-icon blue"><i data-lucide="users"></i></div>
          <div class="stat-body">
            <div class="stat-label">Total Students</div>
            <div class="stat-value" id="statStudents">124</div>
            <div class="stat-delta up"><i data-lucide="trending-up"></i> +8 this semester</div>
          </div>
          <i data-lucide="chevron-right" class="stat-arrow"></i>
        </div>
        <div class="stat-card">
          <div class="stat-icon purple"><i data-lucide="graduation-cap"></i></div>
          <div class="stat-body">
            <div class="stat-label">My Classes</div>
            <div class="stat-value" id="statClasses">5</div>
            <div class="stat-delta up"><i data-lucide="trending-up"></i> All active</div>
          </div>
          <i data-lucide="chevron-right" class="stat-arrow"></i>
        </div>
        <div class="stat-card">
          <div class="stat-icon green"><i data-lucide="clipboard-list"></i></div>
          <div class="stat-body">
            <div class="stat-label">Active Assignments</div>
            <div class="stat-value" id="statAssignments">16</div>
            <div class="stat-delta up"><i data-lucide="trending-up"></i> +3 this week</div>
          </div>
          <i data-lucide="chevron-right" class="stat-arrow"></i>
        </div>
        <div class="stat-card">
          <div class="stat-icon orange"><i data-lucide="pen-line"></i></div>
          <div class="stat-body">
            <div class="stat-label">Pending Grading</div>
            <div class="stat-value" id="statPending">12</div>
            <div class="stat-delta down"><i data-lucide="trending-down"></i> 4 due today</div>
          </div>
          <i data-lucide="chevron-right" class="stat-arrow"></i>
        </div>
      </div>

      <div class="page-layout">
        <div class="page-main">
          <div class="card" style="margin-bottom: 16px;">
            <div class="card-header">
              <div class="card-header-left">
                <div class="card-icon blue"><i data-lucide="graduation-cap"></i></div>
                <h2 class="card-title">My Classes</h2>
              </div>
              <a href="classes.php" class="view-all">View all</a>
            </div>
            <div class="table-wrap">
              <table class="data-table" id="classesTable">
                <thead>
                  <tr>
                    <th>Class</th>
                    <th>Subject</th>
                    <th>Students</th>
                    <th>Next Activity</th>
                    <th>Progress</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <div class="cell-title">
                        <div class="cell-icon" style="background:#DBEAFE;color:#2563EB"><i data-lucide="calculator"></i></div>
                        <div>
                          <div class="title">Math 101</div>
                          <div class="subtitle">Room 302</div>
                        </div>
                      </div>
                    </td>
                    <td><span class="subject-tag math"><span class="dot math"></span> Mathematics</span></td>
                    <td>32</td>
                    <td>
                      <div class="title">Quiz 1</div>
                      <div class="subtitle">Sep 15, 2025</div>
                    </td>
                    <td>
                      <div class="progress-row">
                        <div class="progress-bar"><div class="fill math" style="width:75%"></div></div>
                        <span class="progress-pct">75%</span>
                      </div>
                    </td>
                    <td><a href="classes.php" class="btn btn-ghost btn-sm">Manage</a></td>
                  </tr>
                  <tr>
                    <td>
                      <div class="cell-title">
                        <div class="cell-icon" style="background:#DCFCE7;color:#16A34A"><i data-lucide="flask-conical"></i></div>
                        <div>
                          <div class="title">Science 205</div>
                          <div class="subtitle">Lab 105</div>
                        </div>
                      </div>
                    </td>
                    <td><span class="subject-tag science"><span class="dot science"></span> Science</span></td>
                    <td>28</td>
                    <td>
                      <div class="title">Lab Report</div>
                      <div class="subtitle">Sep 14, 2025</div>
                    </td>
                    <td>
                      <div class="progress-row">
                        <div class="progress-bar"><div class="fill science" style="width:68%"></div></div>
                        <span class="progress-pct">68%</span>
                      </div>
                    </td>
                    <td><a href="classes.php" class="btn btn-ghost btn-sm">Manage</a></td>
                  </tr>
                  <tr>
                    <td>
                      <div class="cell-title">
                        <div class="cell-icon" style="background:#EDE9FE;color:#7C3AED"><i data-lucide="book-open"></i></div>
                        <div>
                          <div class="title">English 101</div>
                          <div class="subtitle">Room 210</div>
                        </div>
                      </div>
                    </td>
                    <td><span class="subject-tag english"><span class="dot english"></span> English</span></td>
                    <td>30</td>
                    <td>
                      <div class="title">Essay Draft</div>
                      <div class="subtitle">Sep 18, 2025</div>
                    </td>
                    <td>
                      <div class="progress-row">
                        <div class="progress-bar"><div class="fill english" style="width:82%"></div></div>
                        <span class="progress-pct">82%</span>
                      </div>
                    </td>
                    <td><a href="classes.php" class="btn btn-ghost btn-sm">Manage</a></td>
                  </tr>
                  <tr>
                    <td>
                      <div class="cell-title">
                        <div class="cell-icon" style="background:#FFEDD5;color:#EA580C"><i data-lucide="code-2"></i></div>
                        <div>
                          <div class="title">CS 308</div>
                          <div class="subtitle">Lab 401</div>
                        </div>
                      </div>
                    </td>
                    <td><span class="subject-tag cs"><span class="dot cs"></span> Computer Science</span></td>
                    <td>24</td>
                    <td>
                      <div class="title">Project Demo</div>
                      <div class="subtitle">Sep 20, 2025</div>
                    </td>
                    <td>
                      <div class="progress-row">
                        <div class="progress-bar"><div class="fill cs" style="width:60%"></div></div>
                        <span class="progress-pct">60%</span>
                      </div>
                    </td>
                    <td><a href="classes.php" class="btn btn-ghost btn-sm">Manage</a></td>
                  </tr>
                  <tr>
                    <td>
                      <div class="cell-title">
                        <div class="cell-icon" style="background:#CCFBF1;color:#0D9488"><i data-lucide="languages"></i></div>
                        <div>
                          <div class="title">Filipino 101</div>
                          <div class="subtitle">Room 115</div>
                        </div>
                      </div>
                    </td>
                    <td><span class="subject-tag filipino"><span class="dot filipino"></span> Filipino</span></td>
                    <td>26</td>
                    <td>
                      <div class="title">Oral Recitation</div>
                      <div class="subtitle">Sep 16, 2025</div>
                    </td>
                    <td>
                      <div class="progress-row">
                        <div class="progress-bar"><div class="fill filipino" style="width:52%"></div></div>
                        <span class="progress-pct">52%</span>
                      </div>
                    </td>
                    <td><a href="classes.php" class="btn btn-ghost btn-sm">Manage</a></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="dash-grid-2">
            <div class="card">
              <div class="card-header">
                <div class="card-header-left">
                  <div class="card-icon green"><i data-lucide="activity"></i></div>
                  <h2 class="card-title">Recent Activity</h2>
                </div>
              </div>
              <div id="recentActivity">
                <div class="list-item">
                  <div class="cell-icon" style="background:#DBEAFE;color:#2563EB;width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center"><i data-lucide="file-check"></i></div>
                  <div class="item-meta">
                    <div class="item-title">Maria Santos submitted Lab Report</div>
                    <div class="item-sub">Science 205 · 10:32 AM</div>
                  </div>
                  <span class="badge badge-success">Submitted</span>
                </div>
                <div class="list-item">
                  <div class="cell-icon" style="background:#EDE9FE;color:#7C3AED;width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center"><i data-lucide="message-square"></i></div>
                  <div class="item-meta">
                    <div class="item-title">New message from Ana Reyes</div>
                    <div class="item-sub">English 101 · Yesterday</div>
                  </div>
                  <span class="badge badge-info">Unread</span>
                </div>
                <div class="list-item">
                  <div class="cell-icon" style="background:#FFEDD5;color:#EA580C;width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center"><i data-lucide="clipboard-plus"></i></div>
                  <div class="item-meta">
                    <div class="item-title">Created assignment: HTML Landing Page</div>
                    <div class="item-sub">CS 308 · Sep 10</div>
                  </div>
                  <span class="badge badge-upcoming">New</span>
                </div>
                <div class="list-item">
                  <div class="cell-icon" style="background:#FEE2E2;color:#DC2626;width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center"><i data-lucide="alert-circle"></i></div>
                  <div class="item-meta">
                    <div class="item-title">3 overdue submissions in CS 308</div>
                    <div class="item-sub">Needs attention · Sep 9</div>
                  </div>
                  <span class="badge badge-overdue">Overdue</span>
                </div>
                <div class="list-item">
                  <div class="cell-icon" style="background:#DCFCE7;color:#16A34A;width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center"><i data-lucide="award"></i></div>
                  <div class="item-meta">
                    <div class="item-title">Graded Math Quiz 1 for 32 students</div>
                    <div class="item-sub">Math 101 · Sep 8</div>
                  </div>
                  <span class="badge badge-completed">Graded</span>
                </div>
              </div>
            </div>

            <div class="card">
              <div class="card-header">
                <div class="card-header-left">
                  <div class="card-icon purple"><i data-lucide="bar-chart-3"></i></div>
                  <h2 class="card-title">Class Performance</h2>
                </div>
              </div>
              <div class="bar-chart" id="classPerformance">
                <div class="bar-col">
                  <span class="bar-val">75%</span>
                  <div class="bar" style="height:75%;background:var(--math)"></div>
                  <span class="bar-label">Math</span>
                </div>
                <div class="bar-col">
                  <span class="bar-val">68%</span>
                  <div class="bar" style="height:68%;background:var(--science)"></div>
                  <span class="bar-label">Science</span>
                </div>
                <div class="bar-col">
                  <span class="bar-val">82%</span>
                  <div class="bar" style="height:82%;background:var(--english)"></div>
                  <span class="bar-label">English</span>
                </div>
                <div class="bar-col">
                  <span class="bar-val">60%</span>
                  <div class="bar" style="height:60%;background:var(--cs)"></div>
                  <span class="bar-label">CS</span>
                </div>
                <div class="bar-col">
                  <span class="bar-val">52%</span>
                  <div class="bar" style="height:52%;background:var(--filipino)"></div>
                  <span class="bar-label">Filipino</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside class="page-aside">
          <div class="card">
            <div class="card-header">
              <div class="card-header-left">
                <div class="card-icon blue"><i data-lucide="clock"></i></div>
                <h2 class="card-title">Today's Schedule</h2>
              </div>
              <a href="calendar.php" class="view-all">View all</a>
            </div>
            <div id="todaySchedule">
              <div class="schedule-item">
                <span class="time">8:00 – 9:30 AM</span>
                <div class="info">
                  <div class="subj">Mathematics</div>
                  <div class="room">Room 302</div>
                </div>
              </div>
              <div class="schedule-item">
                <span class="time">10:00 – 11:30 AM</span>
                <div class="info">
                  <div class="subj">Science</div>
                  <div class="room">Lab 105</div>
                </div>
              </div>
              <div class="schedule-item">
                <span class="time">1:00 – 2:30 PM</span>
                <div class="info">
                  <div class="subj">English</div>
                  <div class="room">Room 210</div>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <div class="card-header-left">
                <div class="card-icon green"><i data-lucide="zap"></i></div>
                <h2 class="card-title">Quick Actions</h2>
              </div>
            </div>
            <div class="qa-grid" id="quickActions">
              <a href="assignments.php" class="qa-btn blue"><i data-lucide="plus-circle"></i> Create Assignment</a>
              <a href="grades.php" class="qa-btn purple"><i data-lucide="pen-line"></i> Grade Submissions</a>
              <a href="messages.php" class="qa-btn green"><i data-lucide="send"></i> Message Students</a>
              <a href="resources.php" class="qa-btn orange"><i data-lucide="upload"></i> Upload Resource</a>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <div class="card-header-left">
                <div class="card-icon orange"><i data-lucide="bell-ring"></i></div>
                <h2 class="card-title">Class Reminders</h2>
              </div>
            </div>
            <div id="classReminders">
              <div class="list-item">
                <div class="item-meta">
                  <div class="item-title">Lab Report due tomorrow</div>
                  <div class="item-sub">Science 205 · 28 students</div>
                </div>
                <i data-lucide="chevron-right" class="chevron"></i>
              </div>
              <div class="list-item">
                <div class="item-meta">
                  <div class="item-title">Grade pending: Python Project</div>
                  <div class="item-sub">CS 308 · 5 submissions</div>
                </div>
                <i data-lucide="chevron-right" class="chevron"></i>
              </div>
              <div class="list-item">
                <div class="item-meta">
                  <div class="item-title">Parent-teacher meeting</div>
                  <div class="item-sub">Sep 18 · 3:00 PM</div>
                </div>
                <i data-lucide="chevron-right" class="chevron"></i>
              </div>
            </div>
          </div>

          <div class="tip-card">
            <div class="tip-icon"><i data-lucide="lightbulb"></i></div>
            <p>"Students who receive feedback within 48 hours show 23% higher engagement on follow-up assignments."</p>
            <div class="tip-footer"><i data-lucide="sparkles"></i> Teaching tip of the day</div>
          </div>
        </aside>
      </div>
    </div>
  </div>
  <script src="../js/data.js"></script>
  <script src="../js/auth.js"></script>
  <script src="../js/sidebar.js"></script>
  <script src="../js/google-integration.js"></script>
  <script src="../js/teacher-dashboard.js"></script>
</body>
</html>

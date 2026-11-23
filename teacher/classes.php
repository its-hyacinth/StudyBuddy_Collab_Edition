<?php $expectedRole = 'teacher'; require_once __DIR__ . '/../includes/page_guard.php'; ?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta name="csrf-token" content="<?= e($_SESSION['csrf_token']) ?>">
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>StudyBuddy — My Classes</title>
  <link rel="stylesheet" href="../css/style.css" />
  <link rel="stylesheet" href="../css/components.css" />
  <link rel="stylesheet" href="../css/pages.css" />
  <script src="https://unpkg.com/lucide@latest"></script>
</head>
<body>
  <div class="app-shell" id="appShell">
    <div class="page-content">
      <div class="page-header">
        <div>
          <h1 class="page-title">
            <span class="title-icon"><i data-lucide="graduation-cap"></i></span>
            My Classes
          </h1>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button type="button" class="btn btn-outline" id="syncClassroomBtn">
            <i data-lucide="refresh-cw"></i> Sync Classroom
          </button>
          <button type="button" class="btn btn-primary" id="addClassBtn">
            <i data-lucide="plus"></i> Add Class
          </button>
        </div>
      </div>

      <div class="stat-grid" id="classStats">
        <div class="stat-card">
          <div class="stat-icon blue"><i data-lucide="book-open"></i></div>
          <div class="stat-body">
            <div class="stat-label">Total Classes</div>
            <div class="stat-value" id="statTotalClasses">5</div>
            <div class="stat-delta up"><i data-lucide="trending-up"></i> All active</div>
          </div>
        </div>
        <a href="students.php" class="stat-card">
          <div class="stat-icon green"><i data-lucide="users"></i></div>
          <div class="stat-body">
            <div class="stat-label">Total Students</div>
            <div class="stat-value" id="statTotalStudents">140</div>
            <div class="stat-delta up"><i data-lucide="trending-up"></i> +8 this semester</div>
          </div>
        </a>
        <a href="assignments.php" class="stat-card">
          <div class="stat-icon purple"><i data-lucide="clipboard-list"></i></div>
          <div class="stat-body">
            <div class="stat-label">Active Assignments</div>
            <div class="stat-value" id="statActiveAsg">16</div>
            <div class="stat-delta up"><i data-lucide="trending-up"></i> Across all classes</div>
          </div>
        </a>
        <div class="stat-card">
          <div class="stat-icon orange"><i data-lucide="trending-up"></i></div>
          <div class="stat-body">
            <div class="stat-label">Avg. Progress</div>
            <div class="stat-value" id="statAvgProgress">67%</div>
            <div class="stat-delta up"><i data-lucide="trending-up"></i> +5% from last month</div>
          </div>
        </div>
      </div>

      <div class="page-layout">
        <div class="page-main">
          <div class="toolbar">
            <div class="search-mini">
              <i data-lucide="search"></i>
              <input type="search" id="classSearch" placeholder="Search classes..." />
            </div>
           <div class="segmented" id="classViewToggle"
     style="display: flex; align-items: center; justify-content: center; gap: 10px;">

    <button type="button" class="active" data-view="table"
            style="display: flex; align-items: center; justify-content: center; gap: 8px;">
        <i data-lucide="list"></i> Table
    </button>

    <button type="button" data-view="grid"
            style="display: flex; align-items: center; justify-content: center; gap: 8px;">
        <i data-lucide="layout-grid"></i> Grid
    </button>

</div>
          </div>

          <div class="card" id="classesTableView">
            <div class="table-wrap">
              <table class="data-table" id="classesTable">
                <thead>
                  <tr>
                     <th style="width: 24%; text-align: center; padding: 10px 12px;">Class Name</th>
                     <th style="width: 20%; text-align: center; padding: 10px 12px;">Subject</th>
                    <th>Students</th>
                    <th>Next Activity</th>
                    <th>Progress</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody id="classesTableBody">
                  <tr data-id="cls_1">
                    <td>
                      <div class="cell-title">
                        <div class="cell-icon" style="background:#DBEAFE;color:#2563EB"><i data-lucide="calculator"></i></div>
                        <div>
                          <div class="title">Math 101</div>
                          <div class="subtitle">Room 302 · Mon/Wed/Fri</div>
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
                    <td><span class="badge badge-success">Active</span></td>
                    <td>
                      <div class="action-menu-wrap">
                        <button type="button" class="action-menu-btn" aria-label="Actions"><i data-lucide="more-horizontal"></i></button>
                        <div class="action-dropdown">
                          <button type="button"><i data-lucide="eye"></i> View Details</button>
                          <button type="button"><i data-lucide="users"></i> View Roster</button>
                          <button type="button"><i data-lucide="edit"></i> Edit Class</button>
                          <button type="button" class="danger"><i data-lucide="trash-2"></i> Delete</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr data-id="cls_2">
                    <td>
                      <div class="cell-title">
                        <div class="cell-icon" style="background:#DCFCE7;color:#16A34A"><i data-lucide="flask-conical"></i></div>
                        <div>
                          <div class="title">Science 205</div>
                          <div class="subtitle">Lab 105 · Tue/Thu</div>
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
                    <td><span class="badge badge-success">Active</span></td>
                    <td>
                      <div class="action-menu-wrap">
                        <button type="button" class="action-menu-btn" aria-label="Actions"><i data-lucide="more-horizontal"></i></button>
                        <div class="action-dropdown">
                          <button type="button"><i data-lucide="eye"></i> View Details</button>
                          <button type="button"><i data-lucide="users"></i> View Roster</button>
                          <button type="button"><i data-lucide="edit"></i> Edit Class</button>
                          <button type="button" class="danger"><i data-lucide="trash-2"></i> Delete</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr data-id="cls_3">
                    <td>
                      <div class="cell-title">
                        <div class="cell-icon" style="background:#EDE9FE;color:#7C3AED"><i data-lucide="book-open"></i></div>
                        <div>
                          <div class="title">English 101</div>
                          <div class="subtitle">Room 210 · Mon/Wed</div>
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
                    <td><span class="badge badge-success">Active</span></td>
                    <td>
                      <div class="action-menu-wrap">
                        <button type="button" class="action-menu-btn" aria-label="Actions"><i data-lucide="more-horizontal"></i></button>
                        <div class="action-dropdown">
                          <button type="button"><i data-lucide="eye"></i> View Details</button>
                          <button type="button"><i data-lucide="users"></i> View Roster</button>
                          <button type="button"><i data-lucide="edit"></i> Edit Class</button>
                          <button type="button" class="danger"><i data-lucide="trash-2"></i> Delete</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr data-id="cls_4">
                    <td>
                      <div class="cell-title">
                        <div class="cell-icon" style="background:#FFEDD5;color:#EA580C"><i data-lucide="code-2"></i></div>
                        <div>
                          <div class="title">CS 308</div>
                          <div class="subtitle">Lab 401 · Tue/Thu</div>
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
                    <td><span class="badge badge-success">Active</span></td>
                    <td>
                      <div class="action-menu-wrap">
                        <button type="button" class="action-menu-btn" aria-label="Actions"><i data-lucide="more-horizontal"></i></button>
                        <div class="action-dropdown">
                          <button type="button"><i data-lucide="eye"></i> View Details</button>
                          <button type="button"><i data-lucide="users"></i> View Roster</button>
                          <button type="button"><i data-lucide="edit"></i> Edit Class</button>
                          <button type="button" class="danger"><i data-lucide="trash-2"></i> Delete</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr data-id="cls_5">
                    <td>
                      <div class="cell-title">
                        <div class="cell-icon" style="background:#CCFBF1;color:#0D9488"><i data-lucide="languages"></i></div>
                        <div>
                          <div class="title">Filipino 101</div>
                          <div class="subtitle">Room 115 · Wed/Fri</div>
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
                    <td><span class="badge badge-success">Active</span></td>
                    <td>
                      <div class="action-menu-wrap">
                        <button type="button" class="action-menu-btn" aria-label="Actions"><i data-lucide="more-horizontal"></i></button>
                        <div class="action-dropdown">
                          <button type="button"><i data-lucide="eye"></i> View Details</button>
                          <button type="button"><i data-lucide="users"></i> View Roster</button>
                          <button type="button"><i data-lucide="edit"></i> Edit Class</button>
                          <button type="button" class="danger"><i data-lucide="trash-2"></i> Delete</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="subject-cards" id="classesGridView" style="display:none;">
            <div class="subject-card" data-id="cls_1">
              <div class="subject-card-top">
                <div class="subj-icon" style="background:#DBEAFE;color:#2563EB"><i data-lucide="calculator"></i></div>
                <div class="subj-info">
                  <h3>Math 101</h3>
                  <p>Mathematics · Room 302</p>
                </div>
                <span class="badge badge-success">Active</span>
              </div>
              <div class="subject-card-stats">
                <div class="ss"><div class="ss-val">32</div><div class="ss-lbl">Students</div></div>
                <div class="ss"><div class="ss-val">5</div><div class="ss-lbl">Assignments</div></div>
                <div class="ss"><div class="ss-val">75%</div><div class="ss-lbl">Progress</div></div>
              </div>
            </div>
            <div class="subject-card" data-id="cls_2">
              <div class="subject-card-top">
                <div class="subj-icon" style="background:#DCFCE7;color:#16A34A"><i data-lucide="flask-conical"></i></div>
                <div class="subj-info">
                  <h3>Science 205</h3>
                  <p>Science · Lab 105</p>
                </div>
                <span class="badge badge-success">Active</span>
              </div>
              <div class="subject-card-stats">
                <div class="ss"><div class="ss-val">28</div><div class="ss-lbl">Students</div></div>
                <div class="ss"><div class="ss-val">4</div><div class="ss-lbl">Assignments</div></div>
                <div class="ss"><div class="ss-val">68%</div><div class="ss-lbl">Progress</div></div>
              </div>
            </div>
            <div class="subject-card" data-id="cls_3">
              <div class="subject-card-top">
                <div class="subj-icon" style="background:#EDE9FE;color:#7C3AED"><i data-lucide="book-open"></i></div>
                <div class="subj-info">
                  <h3>English 101</h3>
                  <p>English · Room 210</p>
                </div>
                <span class="badge badge-success">Active</span>
              </div>
              <div class="subject-card-stats">
                <div class="ss"><div class="ss-val">30</div><div class="ss-lbl">Students</div></div>
                <div class="ss"><div class="ss-val">3</div><div class="ss-lbl">Assignments</div></div>
                <div class="ss"><div class="ss-val">82%</div><div class="ss-lbl">Progress</div></div>
              </div>
            </div>
            <div class="subject-card" data-id="cls_4">
              <div class="subject-card-top">
                <div class="subj-icon" style="background:#FFEDD5;color:#EA580C"><i data-lucide="code-2"></i></div>
                <div class="subj-info">
                  <h3>CS 308</h3>
                  <p>Computer Science · Lab 401</p>
                </div>
                <span class="badge badge-success">Active</span>
              </div>
              <div class="subject-card-stats">
                <div class="ss"><div class="ss-val">24</div><div class="ss-lbl">Students</div></div>
                <div class="ss"><div class="ss-val">4</div><div class="ss-lbl">Assignments</div></div>
                <div class="ss"><div class="ss-val">60%</div><div class="ss-lbl">Progress</div></div>
              </div>
            </div>
            <div class="subject-card" data-id="cls_5">
              <div class="subject-card-top">
                <div class="subj-icon" style="background:#CCFBF1;color:#0D9488"><i data-lucide="languages"></i></div>
                <div class="subj-info">
                  <h3>Filipino 101</h3>
                  <p>Filipino · Room 115</p>
                </div>
                <span class="badge badge-success">Active</span>
              </div>
              <div class="subject-card-stats">
                <div class="ss"><div class="ss-val">26</div><div class="ss-lbl">Students</div></div>
                <div class="ss"><div class="ss-val">2</div><div class="ss-lbl">Assignments</div></div>
                <div class="ss"><div class="ss-val">52%</div><div class="ss-lbl">Progress</div></div>
              </div>
            </div>
          </div>
        </div>

        <aside class="page-aside">
          <div class="card">
            <div class="card-header">
              <div class="card-header-left">
                <div class="card-icon blue"><i data-lucide="pie-chart"></i></div>
                <h2 class="card-title">Overview</h2>
              </div>
            </div>
            <div class="donut-wrap" id="classOverview">
              <div class="donut">
                <svg viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="36" fill="none" stroke="#E2E8F0" stroke-width="10"/>
                  <circle cx="50" cy="50" r="36" fill="none" stroke="#2563EB" stroke-width="10"
                    stroke-dasharray="226.2" stroke-dashoffset="74.6" stroke-linecap="round"/>
                </svg>
                <div class="center-label">67%<small>Avg Progress</small></div>
              </div>
              <div class="donut-legend">
                <div class="donut-legend-row">
                  <div class="lbl"><span>Math 101</span><span>75%</span></div>
                  <div class="progress-bar"><div class="fill math" style="width:75%"></div></div>
                </div>
                <div class="donut-legend-row">
                  <div class="lbl"><span>Science 205</span><span>68%</span></div>
                  <div class="progress-bar"><div class="fill science" style="width:68%"></div></div>
                </div>
                <div class="donut-legend-row">
                  <div class="lbl"><span>English 101</span><span>82%</span></div>
                  <div class="progress-bar"><div class="fill english" style="width:82%"></div></div>
                </div>
                <div class="donut-legend-row">
                  <div class="lbl"><span>CS 308</span><span>60%</span></div>
                  <div class="progress-bar"><div class="fill cs" style="width:60%"></div></div>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <a href="assignments.php" class="card-header-left" style="text-decoration:none;" aria-label="Go to Assignments">
                <div class="card-icon green"><i data-lucide="calendar"></i></div>
                <h2 class="card-title">Upcoming Deadlines</h2>
              </a>
            </div>
            <div id="upcomingDeadlines">
              <p class="empty-state" style="padding:16px">Loading deadlines...</p>
            </div>
          </div>

          <div class="tip-card">
            <div class="tip-icon"><i data-lucide="lightbulb"></i></div>
            <p>"Organize your classes by color-coding subjects to quickly identify them across the dashboard."</p>
            <div class="tip-footer"><i data-lucide="sparkles"></i> Pro tip</div>
          </div>
        </aside>
      </div>
    </div>
  </div>

  <!-- Add Class Modal -->
  <div class="modal-backdrop" id="addClassModal">
    <div class="modal">
      <div class="modal-header">
        <h3 id="addClassTitle">Add New Class</h3>
        <button type="button" class="modal-close" data-close-modal="addClassModal" aria-label="Close">
          <i data-lucide="x"></i>
        </button>
      </div>
      <form id="addClassForm">
        <div class="modal-body">
          <div class="form-group">
            <label for="className">Class Name</label>
            <input class="form-control" type="text" id="className" placeholder="e.g. Math 101" required />
          </div>
          <div class="form-group">
            <label for="classSubject">Subject</label>
            <select class="form-control" id="classSubject" required>
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
              <label for="classRoom">Room</label>
              <input class="form-control" type="text" id="classRoom" placeholder="Room 302" />
            </div>
            <div class="form-group">
              <label for="classSchedule">Schedule</label>
              <input class="form-control" type="text" id="classSchedule" placeholder="Mon/Wed/Fri" />
            </div>
          </div>
          <!-- NEW: class time -->
          <div class="form-row">
            <div class="form-group">
              <label for="classStartTime">Start Time</label>
              <input class="form-control" type="time" id="classStartTime" value="09:00" required />
            </div>
            <div class="form-group">
              <label for="classEndTime">End Time</label>
              <input class="form-control" type="time" id="classEndTime" value="10:00" required />
            </div>
          </div>
          <div class="form-group">
            <label for="classDescription">Description</label>
            <textarea class="form-control" id="classDescription" placeholder="Brief course description..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-ghost" data-close-modal="addClassModal">Cancel</button>
          <button type="submit" class="btn btn-primary" id="saveClassBtn">Create Class</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Class Details Modal -->
  <div class="modal-backdrop" id="classDetailsModal">
    <div class="modal">
      <div class="modal-header">
        <h3 id="detailName">Class Details</h3>
        <button type="button" class="modal-close" data-close-modal="classDetailsModal" aria-label="Close">
          <i data-lucide="x"></i>
        </button>
      </div>
      <div class="modal-body">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px 16px">
          <div><div class="stat-label" style="font-weight:700;font-size:15px;color:#0F172A;margin-bottom:2px">Subject</div><div class="title" id="detailSubject"></div></div>
          <div><div class="stat-label" style="font-weight:700;font-size:15px;color:#0F172A;margin-bottom:2px">Instructor</div><div class="title" id="detailInstructor"></div></div>
          <div><div class="stat-label" style="font-weight:700;font-size:15px;color:#0F172A;margin-bottom:2px">Room</div><div class="title" id="detailRoom"></div></div>
          <div><div class="stat-label" style="font-weight:700;font-size:15px;color:#0F172A;margin-bottom:2px">Days</div><div class="title" id="detailDays"></div></div>
          <div><div class="stat-label" style="font-weight:700;font-size:15px;color:#0F172A;margin-bottom:2px">Time</div><div class="title" id="detailTime"></div></div>
          <div><div class="stat-label" style="font-weight:700;font-size:15px;color:#0F172A;margin-bottom:2px">Students</div><div class="title" id="detailStudents"></div></div>
          <div><div class="stat-label" style="font-weight:700;font-size:15px;color:#0F172A;margin-bottom:2px">Progress</div><div class="title" id="detailProgress"></div></div>
        </div>
        <div style="margin-top:18px">
          <div class="stat-label" style="font-weight:700;font-size:15px;color:#0F172A;margin-bottom:2px">Description</div>
          <div class="subtitle" id="detailDescription" style="margin-top:4px"></div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-ghost" data-close-modal="classDetailsModal">Close</button>
        <button type="button" class="btn btn-primary" id="editClassBtn"><i data-lucide="edit"></i> Edit Class</button>
      </div>
    </div>
  </div>

  <script src="../js/data.js"></script>
  <script src="../js/auth.js"></script>
  <script src="../js/sidebar.js"></script>
  <script src="../js/google-integration.js"></script>
  <script src="../js/teacher-classes.js"></script>
</body>
</html>
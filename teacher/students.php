<?php $expectedRole = 'teacher'; require_once __DIR__ . '/../includes/page_guard.php'; ?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta name="csrf-token" content="<?= e($_SESSION['csrf_token']) ?>">
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>StudyBuddy — Students</title>
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
            <span class="title-icon"><i data-lucide="users"></i></span>
            Students
          </h1>
          <p class="page-subtitle">View and manage students enrolled in your classes.</p>
        </div>
        <button type="button" class="btn btn-primary" id="addStudentBtn">
          <i data-lucide="user-plus"></i> Add Student
        </button>
      </div>

      <div class="stat-grid" id="studentStats">
        <div class="stat-card">
          <div class="stat-icon blue"><i data-lucide="users"></i></div>
          <div class="stat-body">
            <div class="stat-label">Total Students</div>
            <div class="stat-value" id="statTotalStudents">124</div>
            <div class="stat-delta up"><i data-lucide="trending-up"></i> +8 this semester</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon green"><i data-lucide="user-check"></i></div>
          <div class="stat-body">
            <div class="stat-label">Active</div>
            <div class="stat-value" id="statActiveStudents">118</div>
            <div class="stat-delta up"><i data-lucide="trending-up"></i> 95% active</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon purple"><i data-lucide="graduation-cap"></i></div>
          <div class="stat-body">
            <div class="stat-label">Avg. GPA</div>
            <div class="stat-value" id="statAvgGpa">3.5</div>
            <div class="stat-delta up"><i data-lucide="trending-up"></i> +0.2 from last term</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon orange"><i data-lucide="alert-circle"></i></div>
          <div class="stat-body">
            <div class="stat-label">At Risk</div>
            <div class="stat-value" id="statAtRisk">6</div>
            <div class="stat-delta down"><i data-lucide="trending-down"></i> GPA below 2.5</div>
          </div>
        </div>
      </div>

      <div class="page-layout">
        <div class="page-main">
          <div class="toolbar">
            <div class="search-mini">
              <i data-lucide="search"></i>
              <input type="search" id="studentSearch" placeholder="Search by name or email..." />
            </div>
            <select id="studentCourseFilter" aria-label="Filter by course">
              <option value="">All Courses</option>
              <option value="BSIT">BSIT</option>
              <option value="BSCS">BSCS</option>
              <option value="BSECE">BSECE</option>
            </select>
            <select id="studentYearFilter" aria-label="Filter by year">
              <option value="">All Years</option>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
            </select>
            <select id="studentStatusFilter" aria-label="Filter by status">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div class="card">
            <div class="table-wrap">
              <table class="data-table" id="studentsTable">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Email</th>
                    <th>Course</th>
                    <th>Year</th>
                    <th>GPA</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody id="studentsTableBody">
                  <tr data-id="stu_1" data-status="active">
                    <td>
                      <div class="cell-title">
                        <div class="cell-icon" style="background:#DBEAFE;color:#2563EB"><i data-lucide="user"></i></div>
                        <div>
                          <div class="title">Maria Santos</div>
                          <div class="subtitle">ID: 2023-00101</div>
                        </div>
                      </div>
                    </td>
                    <td>maria.santos@email.com</td>
                    <td>BSIT</td>
                    <td>2nd Year</td>
                    <td><strong>3.8</strong></td>
                    <td><span class="badge badge-success">Active</span></td>
                    <td>
                      <div class="action-menu-wrap">
                        <button type="button" class="action-menu-btn" aria-label="Actions"><i data-lucide="more-horizontal"></i></button>
                        <div class="action-dropdown">
                          <button type="button"><i data-lucide="eye"></i> View Profile</button>
                          <button type="button"><i data-lucide="message-square"></i> Message</button>
                          <button type="button"><i data-lucide="award"></i> View Grades</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr data-id="stu_2" data-status="active">
                    <td>
                      <div class="cell-title">
                        <div class="cell-icon" style="background:#DBEAFE;color:#2563EB"><i data-lucide="user"></i></div>
                        <div>
                          <div class="title">Juan Dela Cruz</div>
                          <div class="subtitle">ID: 2023-04521</div>
                        </div>
                      </div>
                    </td>
                    <td>juan.delacruz@email.com</td>
                    <td>BSIT</td>
                    <td>2nd Year</td>
                    <td><strong>3.5</strong></td>
                    <td><span class="badge badge-success">Active</span></td>
                    <td>
                      <div class="action-menu-wrap">
                        <button type="button" class="action-menu-btn" aria-label="Actions"><i data-lucide="more-horizontal"></i></button>
                        <div class="action-dropdown">
                          <button type="button"><i data-lucide="eye"></i> View Profile</button>
                          <button type="button"><i data-lucide="message-square"></i> Message</button>
                          <button type="button"><i data-lucide="award"></i> View Grades</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr data-id="stu_3" data-status="active">
                    <td>
                      <div class="cell-title">
                        <div class="cell-icon" style="background:#EDE9FE;color:#7C3AED"><i data-lucide="user"></i></div>
                        <div>
                          <div class="title">Ana Reyes</div>
                          <div class="subtitle">ID: 2024-00234</div>
                        </div>
                      </div>
                    </td>
                    <td>ana.reyes@email.com</td>
                    <td>BSCS</td>
                    <td>1st Year</td>
                    <td><strong>3.9</strong></td>
                    <td><span class="badge badge-success">Active</span></td>
                    <td>
                      <div class="action-menu-wrap">
                        <button type="button" class="action-menu-btn" aria-label="Actions"><i data-lucide="more-horizontal"></i></button>
                        <div class="action-dropdown">
                          <button type="button"><i data-lucide="eye"></i> View Profile</button>
                          <button type="button"><i data-lucide="message-square"></i> Message</button>
                          <button type="button"><i data-lucide="award"></i> View Grades</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr data-id="stu_4" data-status="active">
                    <td>
                      <div class="cell-title">
                        <div class="cell-icon" style="background:#FFEDD5;color:#EA580C"><i data-lucide="user"></i></div>
                        <div>
                          <div class="title">Pedro Garcia</div>
                          <div class="subtitle">ID: 2022-00789</div>
                        </div>
                      </div>
                    </td>
                    <td>pedro.garcia@email.com</td>
                    <td>BSIT</td>
                    <td>3rd Year</td>
                    <td><strong>3.2</strong></td>
                    <td><span class="badge badge-success">Active</span></td>
                    <td>
                      <div class="action-menu-wrap">
                        <button type="button" class="action-menu-btn" aria-label="Actions"><i data-lucide="more-horizontal"></i></button>
                        <div class="action-dropdown">
                          <button type="button"><i data-lucide="eye"></i> View Profile</button>
                          <button type="button"><i data-lucide="message-square"></i> Message</button>
                          <button type="button"><i data-lucide="award"></i> View Grades</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr data-id="stu_5" data-status="active">
                    <td>
                      <div class="cell-title">
                        <div class="cell-icon" style="background:#CCFBF1;color:#0D9488"><i data-lucide="user"></i></div>
                        <div>
                          <div class="title">Lisa Mendoza</div>
                          <div class="subtitle">ID: 2023-00356</div>
                        </div>
                      </div>
                    </td>
                    <td>lisa.mendoza@email.com</td>
                    <td>BSECE</td>
                    <td>2nd Year</td>
                    <td><strong>3.6</strong></td>
                    <td><span class="badge badge-success">Active</span></td>
                    <td>
                      <div class="action-menu-wrap">
                        <button type="button" class="action-menu-btn" aria-label="Actions"><i data-lucide="more-horizontal"></i></button>
                        <div class="action-dropdown">
                          <button type="button"><i data-lucide="eye"></i> View Profile</button>
                          <button type="button"><i data-lucide="message-square"></i> Message</button>
                          <button type="button"><i data-lucide="award"></i> View Grades</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr data-id="stu_6" data-status="inactive">
                    <td>
                      <div class="cell-title">
                        <div class="cell-icon" style="background:#F1F5F9;color:#64748B"><i data-lucide="user"></i></div>
                        <div>
                          <div class="title">Carlos Lopez</div>
                          <div class="subtitle">ID: 2023-00467</div>
                        </div>
                      </div>
                    </td>
                    <td>carlos.lopez@email.com</td>
                    <td>BSIT</td>
                    <td>2nd Year</td>
                    <td><strong>3.4</strong></td>
                    <td><span class="badge badge-pending">Inactive</span></td>
                    <td>
                      <div class="action-menu-wrap">
                        <button type="button" class="action-menu-btn" aria-label="Actions"><i data-lucide="more-horizontal"></i></button>
                        <div class="action-dropdown">
                          <button type="button"><i data-lucide="eye"></i> View Profile</button>
                          <button type="button"><i data-lucide="message-square"></i> Message</button>
                          <button type="button"><i data-lucide="award"></i> View Grades</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr data-id="stu_7" data-status="active">
                    <td>
                      <div class="cell-title">
                        <div class="cell-icon" style="background:#EDE9FE;color:#7C3AED"><i data-lucide="user"></i></div>
                        <div>
                          <div class="title">Sofia Cruz</div>
                          <div class="subtitle">ID: 2024-00578</div>
                        </div>
                      </div>
                    </td>
                    <td>sofia.cruz@email.com</td>
                    <td>BSCS</td>
                    <td>1st Year</td>
                    <td><strong>3.7</strong></td>
                    <td><span class="badge badge-success">Active</span></td>
                    <td>
                      <div class="action-menu-wrap">
                        <button type="button" class="action-menu-btn" aria-label="Actions"><i data-lucide="more-horizontal"></i></button>
                        <div class="action-dropdown">
                          <button type="button"><i data-lucide="eye"></i> View Profile</button>
                          <button type="button"><i data-lucide="message-square"></i> Message</button>
                          <button type="button"><i data-lucide="award"></i> View Grades</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr data-id="stu_8" data-status="active">
                    <td>
                      <div class="cell-title">
                        <div class="cell-icon" style="background:#FFEDD5;color:#EA580C"><i data-lucide="user"></i></div>
                        <div>
                          <div class="title">Miguel Torres</div>
                          <div class="subtitle">ID: 2021-00689</div>
                        </div>
                      </div>
                    </td>
                    <td>miguel.torres@email.com</td>
                    <td>BSIT</td>
                    <td>4th Year</td>
                    <td><strong>3.1</strong></td>
                    <td><span class="badge badge-success">Active</span></td>
                    <td>
                      <div class="action-menu-wrap">
                        <button type="button" class="action-menu-btn" aria-label="Actions"><i data-lucide="more-horizontal"></i></button>
                        <div class="action-dropdown">
                          <button type="button"><i data-lucide="eye"></i> View Profile</button>
                          <button type="button"><i data-lucide="message-square"></i> Message</button>
                          <button type="button"><i data-lucide="award"></i> View Grades</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <aside class="page-aside">
          <div class="card">
            <div class="card-header">
              <div class="card-header-left">
                <div class="card-icon blue"><i data-lucide="pie-chart"></i></div>
                <h2 class="card-title">Student Overview</h2>
              </div>
            </div>
            <div id="studentOverview">
              <div class="donut-wrap">
                <div class="donut">
                  <svg viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="36" fill="none" stroke="#E2E8F0" stroke-width="10"/>
                    <circle cx="50" cy="50" r="36" fill="none" stroke="#16A34A" stroke-width="10"
                      stroke-dasharray="226.2" stroke-dashoffset="11.3" stroke-linecap="round"/>
                  </svg>
                  <div class="center-label">95%<small>Active</small></div>
                </div>
                <div class="donut-legend">
                  <div class="donut-legend-row">
                    <div class="lbl"><span>Active</span><span>118</span></div>
                    <div class="progress-bar"><div class="fill green" style="width:95%"></div></div>
                  </div>
                  <div class="donut-legend-row">
                    <div class="lbl"><span>Inactive</span><span>6</span></div>
                    <div class="progress-bar"><div class="fill orange" style="width:5%"></div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <div class="card-header-left">
                <div class="card-icon green"><i data-lucide="trophy"></i></div>
                <h2 class="card-title">Top Performers</h2>
              </div>
            </div>
            <div id="topPerformers">
              <div class="list-item">
                <div class="cell-icon" style="background:#DBEAFE;color:#2563EB;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px">1</div>
                <div class="item-meta">
                  <div class="item-title">Ana Reyes</div>
                  <div class="item-sub">GPA 3.9 · BSCS</div>
                </div>
              </div>
              <div class="list-item">
                <div class="cell-icon" style="background:#EDE9FE;color:#7C3AED;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px">2</div>
                <div class="item-meta">
                  <div class="item-title">Maria Santos</div>
                  <div class="item-sub">GPA 3.8 · BSIT</div>
                </div>
              </div>
              <div class="list-item">
                <div class="cell-icon" style="background:#FFEDD5;color:#EA580C;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px">3</div>
                <div class="item-meta">
                  <div class="item-title">Sofia Cruz</div>
                  <div class="item-sub">GPA 3.7 · BSCS</div>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <div class="card-header-left">
                <div class="card-icon orange"><i data-lucide="alert-triangle"></i></div>
                <h2 class="card-title">At-Risk Students</h2>
              </div>
            </div>
            <div id="atRiskStudents">
              <div class="list-item">
                <div class="item-meta">
                  <div class="item-title">Miguel Torres</div>
                  <div class="item-sub">GPA 3.1 · 3 overdue assignments</div>
                </div>
                <span class="badge badge-warning">At Risk</span>
              </div>
              <div class="list-item">
                <div class="item-meta">
                  <div class="item-title">Pedro Garcia</div>
                  <div class="item-sub">GPA 3.2 · Low attendance</div>
                </div>
                <span class="badge badge-warning">At Risk</span>
              </div>
            </div>
          </div>

          <div class="tip-card">
            <div class="tip-icon"><i data-lucide="lightbulb"></i></div>
            <p>"Reach out to at-risk students early — a quick check-in can prevent disengagement before grades slip."</p>
            <div class="tip-footer"><i data-lucide="sparkles"></i> Student success tip</div>
          </div>
        </aside>
      </div>
    </div>
  </div>

  <!-- Add Student Modal -->
  <div class="modal-backdrop" id="addStudentModal">
    <div class="modal">
      <div class="modal-header">
        <h3>Add Student</h3>
        <button type="button" class="modal-close" data-close-modal="addStudentModal" aria-label="Close">
          <i data-lucide="x"></i>
        </button>
      </div>
      <form id="addStudentForm">
        <div class="modal-body">
          <div class="form-group">
            <label for="studentName">Full Name</label>
            <input class="form-control" type="text" id="studentName" placeholder="Student name" required />
          </div>
          <div class="form-group">
            <label for="studentEmail">Email</label>
            <input class="form-control" type="email" id="studentEmail" placeholder="student@email.com" required />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="studentCourse">Course</label>
              <select class="form-control" id="studentCourse" required>
                <option value="">Select course</option>
                <option value="BSIT">BSIT</option>
                <option value="BSCS">BSCS</option>
                <option value="BSECE">BSECE</option>
              </select>
            </div>
            <div class="form-group">
              <label for="studentYear">Year Level</label>
              <select class="form-control" id="studentYear" required>
                <option value="">Select year</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-ghost" data-close-modal="addStudentModal">Cancel</button>
          <button type="submit" class="btn btn-primary" id="saveStudentBtn">Add Student</button>
        </div>
      </form>
    </div>
  </div>

  <script src="../js/data.js"></script>
  <script src="../js/auth.js"></script>
  <script src="../js/sidebar.js"></script>
  <script src="../js/google-integration.js"></script>
  <script src="../js/teacher-students.js"></script>
</body>
</html>

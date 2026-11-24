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
  <script defer src="https://unpkg.com/lucide@latest"></script>
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
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button type="button" class="btn btn-outline" id="importStudentsBtn">
            <i data-lucide="upload"></i> Import List
          </button>
          <button type="button" class="btn btn-primary" id="addStudentBtn">
            <i data-lucide="user-plus"></i> Add Student
          </button>
        </div>
      </div>

      <div class="stat-grid" id="studentStats">
        <div class="stat-card">
          <div class="stat-icon blue"><i data-lucide="users"></i></div>
          <div class="stat-body">
            <div class="stat-label">Total Students</div>
            <div class="stat-value" id="statTotalStudents">0</div>
            <div class="stat-delta up"><i data-lucide="users"></i> Loading…</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon green"><i data-lucide="user-check"></i></div>
          <div class="stat-body">
            <div class="stat-label">Active</div>
            <div class="stat-value" id="statActiveStudents">0</div>
            <div class="stat-delta up"><i data-lucide="trending-up"></i> Currently enrolled</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon purple"><i data-lucide="graduation-cap"></i></div>
          <div class="stat-body">
            <div class="stat-label">Avg. GPA</div>
            <div class="stat-value" id="statAvgGpa">0.0</div>
            <div class="stat-delta up"><i data-lucide="trending-up"></i> Across added students</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon orange"><i data-lucide="alert-circle"></i></div>
          <div class="stat-body">
            <div class="stat-label">At Risk</div>
            <div class="stat-value" id="statAtRisk">0</div>
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
                    <th>Class</th>
                    <th style="text-align: left;">GPA</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <!-- Rows are filled in by teacher-students.js -->
                <tbody id="studentsTableBody"></tbody>
              </table>
            </div>
          </div>
        </div>

        <aside class="page-aside">
          <div class="card insight-card" data-student-insight-card="overview">
            <div class="card-header" role="button" tabindex="0" aria-label="Show more student overview information">
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
                      stroke-dasharray="226.2" stroke-dashoffset="226.2" stroke-linecap="round"/>
                  </svg>
                  <div class="center-label">0%<small>Active</small></div>
                </div>
                <div class="donut-legend">
                  <div class="donut-legend-row">
                    <div class="lbl"><span>Active</span><span>0</span></div>
                    <div class="progress-bar"><div class="fill green" style="width:0%"></div></div>
                  </div>
                  <div class="donut-legend-row">
                    <div class="lbl"><span>Inactive</span><span>0</span></div>
                    <div class="progress-bar"><div class="fill orange" style="width:0%"></div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="card insight-card" data-student-insight-card="top-performers">
            <div class="card-header" role="button" tabindex="0" aria-label="Show more top performer information">
              <div class="card-header-left">
                <div class="card-icon green"><i data-lucide="trophy"></i></div>
                <h2 class="card-title">Top Performers</h2>
              </div>
            </div>
            <!-- Filled in by teacher-students.js -->
            <div id="topPerformers"></div>
          </div>

          <div class="card">
            <div class="card-header">
              <div class="card-header-left">
                <div class="card-icon orange"><i data-lucide="alert-triangle"></i></div>
                <h2 class="card-title">At-Risk Students</h2>
              </div>
            </div>
            <!-- Filled in by teacher-students.js -->
            <div id="atRiskStudents"></div>
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

  <!-- Import roster from Excel, CSV, PDF, or text -->
  <div class="modal-backdrop" id="importStudentsModal">
    <div class="modal" style="max-width:680px">
      <div class="modal-header">
        <h3>Import Student List</h3>
        <button type="button" class="modal-close" data-close-modal="importStudentsModal" aria-label="Close">
          <i data-lucide="x"></i>
        </button>
      </div>
      <div class="modal-body">
        <p class="subtitle" style="margin-bottom:14px">Upload an Excel spreadsheet, CSV, text file, or PDF. A subject code column enrolls each student in that class. Rows without a code use the class you pick below.</p>
        <div class="form-group">
          <label for="rosterFile">File</label>
          <input class="form-control" type="file" id="rosterFile" accept=".csv,.tsv,.txt,.xls,.xlsx,.pdf,application/pdf,text/csv,text/plain" style="height:auto;padding:10px" />
        </div>
        <div class="form-group">
          <label for="importDefaultClass">Class for rows without a subject code</label>
          <select class="form-control" id="importDefaultClass"></select>
        </div>
        <div id="importPreview"></div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-ghost" id="downloadRosterTemplate">CSV template</button>
        <button type="button" class="btn btn-ghost" data-close-modal="importStudentsModal">Cancel</button>
        <button type="button" class="btn btn-primary" id="confirmImportBtn" disabled>Import students</button>
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
          <div class="form-group">
            <label for="studentClass">Class</label>
            <!-- Options are filled in by teacher-students.js when the modal opens -->
            <select class="form-control" id="studentClass"></select>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-ghost" data-close-modal="addStudentModal">Cancel</button>
          <button type="submit" class="btn btn-primary" id="saveStudentBtn">Add Student</button>
        </div>
      </form>
    </div>
  </div>

  <div class="modal-backdrop" id="studentInsightsModal" role="dialog" aria-modal="true" aria-labelledby="studentInsightsTitle">
    <div class="modal">
      <div class="modal-header">
        <h3 id="studentInsightsTitle">Student details</h3>
        <button type="button" class="modal-close" data-close-modal="studentInsightsModal" aria-label="Close">
          <i data-lucide="x"></i>
        </button>
      </div>
      <div class="modal-body" id="studentInsightsBody"></div>
      <div class="modal-footer">
        <button type="button" class="btn btn-ghost" data-close-modal="studentInsightsModal">Close</button>
      </div>
    </div>
  </div>

  <script src="../js/data.js"></script>
  <script src="../js/auth.js"></script>
  <script src="../js/sidebar.js"></script>
  <script src="../js/google-integration.js"></script>
  <script src="../js/teacher-students.js"></script>
</body>
</html>
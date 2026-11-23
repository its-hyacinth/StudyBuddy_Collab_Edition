<?php $expectedRole = 'student'; require_once __DIR__ . '/../includes/page_guard.php'; ?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta name="csrf-token" content="<?= e($_SESSION['csrf_token']) ?>">
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>StudyBuddy — Assignments</title>
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
            <span class="title-icon"><i data-lucide="clipboard-list"></i></span>
            Assignments
          </h1>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button type="button" class="btn btn-outline" id="syncClassroomBtn">
            <i data-lucide="refresh-cw"></i> Sync Classroom
          </button>
          <button type="button" class="btn btn-primary" id="addAssignmentBtn">
            <i data-lucide="plus"></i> Add Assignment
          </button>
        </div>
      </div>

      <div class="page-layout">
        <div class="page-main">
          <div class="stat-grid" id="asgStats" style="grid-template-columns:repeat(4,1fr)">
            <div class="stat-card" style="cursor:default">
              <div class="stat-icon blue"><i data-lucide="clipboard-list"></i></div>
              <div class="stat-body">
                <div class="stat-label">Total</div>
                <div class="stat-value">16</div>
              </div>
            </div>
            <div class="stat-card" style="cursor:default">
              <div class="stat-icon purple"><i data-lucide="clock"></i></div>
              <div class="stat-body">
                <div class="stat-label">Upcoming</div>
                <div class="stat-value">7</div>
              </div>
            </div>
            <div class="stat-card" style="cursor:default">
              <div class="stat-icon red"><i data-lucide="alert-triangle"></i></div>
              <div class="stat-body">
                <div class="stat-label">Overdue</div>
                <div class="stat-value">3</div>
              </div>
            </div>
            <div class="stat-card" style="cursor:default">
              <div class="stat-icon green"><i data-lucide="check-circle"></i></div>
              <div class="stat-body">
                <div class="stat-label">Completed</div>
                <div class="stat-value">6</div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="filter-tabs" id="asgTabs" role="tablist">
              <button type="button" class="filter-tab active" data-filter="all">All <span class="count">16</span></button>
              <button type="button" class="filter-tab" data-filter="upcoming">Upcoming <span class="count">7</span></button>
              <button type="button" class="filter-tab" data-filter="overdue">Overdue <span class="count">3</span></button>
              <button type="button" class="filter-tab" data-filter="completed">Completed <span class="count">6</span></button>
            </div>

            <div class="toolbar">
              <div class="search-mini">
                <i data-lucide="search"></i>
                <input type="search" id="asgSearch" placeholder="Search assignments..." />
              </div>
              <select id="asgSubjectFilter" aria-label="Filter by subject">
                <option value="">All Subjects</option>
                <option value="subj_math">Mathematics</option>
                <option value="subj_sci">Science</option>
                <option value="subj_eng">English</option>
                <option value="subj_cs">Computer Science</option>
                <option value="subj_fil">Filipino</option>
                <option value="subj_hist">History</option>
              </select>
            </div>

            <div class="table-wrap">
              <table class="data-table" id="asgTable">
                <thead>
                  <tr>
                    <th scope="col">
                      <label class="custom-check">
                        <input type="checkbox" id="selectAll" aria-label="Mark all assignments on this page as complete" />
                        <span class="box"></span>
                      </label>
                    </th>
                    <th>Assignment</th>
                    <th>Subject</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th aria-label="Actions"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr data-id="asg_1" data-status="upcoming">
                    <td><label class="custom-check"><input type="checkbox" class="row-check" aria-label="Select Algebra Homework Set 3" /><span class="box"></span></label></td>
                    <td>
                      <div class="cell-title">
                        <div class="cell-icon" style="background:#DBEAFE;color:#2563EB"><i data-lucide="file-text"></i></div>
                        <div>
                          <div class="title">Algebra Homework Set 3</div>
                          <div class="subtitle">Complete problems 1–20</div>
                        </div>
                      </div>
                    </td>
                    <td><span class="subject-tag math">Mathematics</span></td>
                    <td>Sep 12, 2025</td>
                    <td><span class="badge badge-upcoming">Upcoming</span></td>
                    <td>
                      <div class="action-menu-wrap">
                        <button type="button" class="action-menu-btn" aria-label="Actions"><i data-lucide="more-horizontal"></i></button>
                      </div>
                    </td>
                  </tr>
                  <tr data-id="asg_4" data-status="overdue">
                    <td><label class="custom-check"><input type="checkbox" class="row-check" aria-label="Select Python Mini Project" /><span class="box"></span></label></td>
                    <td>
                      <div class="cell-title">
                        <div class="cell-icon" style="background:#FFEDD5;color:#EA580C"><i data-lucide="code-2"></i></div>
                        <div>
                          <div class="title">Python Mini Project</div>
                          <div class="subtitle">Build a CLI to-do app</div>
                        </div>
                      </div>
                    </td>
                    <td><span class="subject-tag cs">Computer Science</span></td>
                    <td>Sep 10, 2025</td>
                    <td><span class="badge badge-overdue">Overdue</span></td>
                    <td>
                      <div class="action-menu-wrap">
                        <button type="button" class="action-menu-btn" aria-label="Actions"><i data-lucide="more-horizontal"></i></button>
                      </div>
                    </td>
                  </tr>
                  <tr data-id="asg_5" data-status="completed">
                    <td><label class="custom-check"><input type="checkbox" class="row-check" aria-label="Select Math Quiz 1" /><span class="box"></span></label></td>
                    <td>
                      <div class="cell-title">
                        <div class="cell-icon" style="background:#DBEAFE;color:#2563EB"><i data-lucide="check-circle"></i></div>
                        <div>
                          <div class="title">Math Quiz 1</div>
                          <div class="subtitle">Chapters 1–2</div>
                        </div>
                      </div>
                    </td>
                    <td><span class="subject-tag math">Mathematics</span></td>
                    <td>Sep 5, 2025</td>
                    <td><span class="badge badge-completed">Completed</span></td>
                    <td>
                      <div class="action-menu-wrap">
                        <button type="button" class="action-menu-btn" aria-label="Actions"><i data-lucide="more-horizontal"></i></button>
                      </div>
                    </td>
                  </tr>
                  <tr data-id="asg_8" data-status="upcoming">
                    <td><label class="custom-check"><input type="checkbox" class="row-check" aria-label="Select HTML/CSS Landing Page" /><span class="box"></span></label></td>
                    <td>
                      <div class="cell-title">
                        <div class="cell-icon" style="background:#FFEDD5;color:#EA580C"><i data-lucide="layout"></i></div>
                        <div>
                          <div class="title">HTML/CSS Landing Page</div>
                          <div class="subtitle">Responsive landing page</div>
                        </div>
                      </div>
                    </td>
                    <td><span class="subject-tag cs">Computer Science</span></td>
                    <td>Sep 20, 2025</td>
                    <td><span class="badge badge-upcoming">Upcoming</span></td>
                    <td>
                      <div class="action-menu-wrap">
                        <button type="button" class="action-menu-btn" aria-label="Actions"><i data-lucide="more-horizontal"></i></button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="pagination" id="asgPagination">
              <div class="pagination-info">Showing 1–4 of 16 assignments</div>
              <div class="pagination-controls">
                <button type="button" class="page-btn" disabled aria-label="Previous"><i data-lucide="chevron-left"></i></button>
                <button type="button" class="page-btn active">1</button>
                <button type="button" class="page-btn">2</button>
                <button type="button" class="page-btn">3</button>
                <button type="button" class="page-btn" aria-label="Next"><i data-lucide="chevron-right"></i></button>
              </div>
            </div>
          </div>
        </div>

        <aside class="page-aside">
          <div class="card" id="asgDeadlines">
            <div class="card-header">
              <div class="card-header-left">
                <div class="card-icon red"><i data-lucide="alarm-clock"></i></div>
                <h2 class="card-title">Upcoming Deadlines</h2>
              </div>
            </div>
            <div id="deadlineList">
              <div class="list-item">
                <span class="dot cs"></span>
                <div class="item-meta">
                  <div class="item-title">Python Mini Project</div>
                  <div class="item-sub">Overdue · Sep 10</div>
                </div>
                <span class="badge badge-overdue">Overdue</span>
              </div>
              <div class="list-item">
                <span class="dot math"></span>
                <div class="item-meta">
                  <div class="item-title">Algebra Homework Set 3</div>
                  <div class="item-sub">Due Sep 12</div>
                </div>
                <span class="badge badge-upcoming">Upcoming</span>
              </div>
              <div class="list-item">
                <span class="dot science"></span>
                <div class="item-meta">
                  <div class="item-title">Science Lab Report</div>
                  <div class="item-sub">Due Sep 14</div>
                </div>
                <span class="badge badge-upcoming">Upcoming</span>
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
              <button type="button" class="qa-btn blue" data-action="add-assignment">
                <i data-lucide="clipboard-plus"></i> Add Assignment
              </button>
              <button type="button" class="qa-btn green" data-action="mark-complete">
                <i data-lucide="check-circle"></i> Mark Complete
              </button>
              <button type="button" class="qa-btn purple" data-action="add-task">
                <i data-lucide="plus-circle"></i> Add Task
              </button>
              <button type="button" class="qa-btn orange" data-action="view-progress">
                <i data-lucide="trending-up"></i> View Progress
              </button>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <div class="card-header-left">
                <div class="card-icon green"><i data-lucide="pie-chart"></i></div>
                <h2 class="card-title">Completion Rate</h2>
              </div>
            </div>
            <div id="asgProgressDonut">
              <div class="donut-wrap">
                <div class="donut">
                  <svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="36" fill="none" stroke="#E2E8F0" stroke-width="10"/><circle cx="50" cy="50" r="36" fill="none" stroke="#16A34A" stroke-width="10" stroke-dasharray="226.2" stroke-dashoffset="141.4" stroke-linecap="round"/></svg>
                  <div class="center-label">38%<small>Done</small></div>
                </div>
                <div class="donut-legend">
                  <div class="donut-legend-row">
                    <div class="lbl"><span>Completed</span><span>6</span></div>
                    <div class="progress-bar"><div class="fill green" style="width:38%"></div></div>
                  </div>
                  <div class="donut-legend-row">
                    <div class="lbl"><span>Pending</span><span>10</span></div>
                    <div class="progress-bar"><div class="fill orange" style="width:62%"></div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  </div>

  <div class="modal-backdrop" id="addAssignmentModal">
    <div class="modal" role="dialog" aria-labelledby="addAssignmentTitle">
      <div class="modal-header">
        <h3 id="addAssignmentTitle">Add Assignment</h3>
        <button type="button" class="modal-close" data-close-modal="addAssignmentModal" aria-label="Close">
          <i data-lucide="x"></i>
        </button>
      </div>
      <form id="addAssignmentForm">
        <div class="modal-body">
          <div class="form-group">
            <label for="asgTitle">Title</label>
            <input type="text" class="form-control" id="asgTitle" name="title" placeholder="Assignment title" required />
          </div>
          <div class="form-group">
            <label for="asgSubject">Subject</label>
            <select class="form-control" id="asgSubject" name="subjectId" required>
              <option value="">Select subject</option>
              <option value="subj_math">Mathematics</option>
              <option value="subj_sci">Science</option>
              <option value="subj_eng">English</option>
              <option value="subj_cs">Computer Science</option>
              <option value="subj_fil">Filipino</option>
              <option value="subj_hist">History</option>
            </select>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="asgDueDate">Due Date</label>
              <input type="date" class="form-control" id="asgDueDate" name="dueDate" required />
            </div>
            <div class="form-group">
              <label for="asgPoints">Points</label>
              <input type="number" class="form-control" id="asgPoints" name="points" placeholder="50" min="0" />
            </div>
          </div>
          <div class="form-group">
            <label for="asgDescription">Description</label>
            <textarea class="form-control" id="asgDescription" name="description" placeholder="Assignment details..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-ghost" data-close-modal="addAssignmentModal">Cancel</button>
          <button type="submit" class="btn btn-primary">Add Assignment</button>
        </div>
      </form>
    </div>
  </div>

  <div class="modal-backdrop" id="assignmentDetailsModal">
    <div class="modal" role="dialog" aria-labelledby="assignmentDetailsTitle">
      <div class="modal-header">
        <h3 id="assignmentDetailsTitle">Assignment details</h3>
        <button type="button" class="modal-close" data-close-modal="assignmentDetailsModal" aria-label="Close">
          <i data-lucide="x"></i>
        </button>
      </div>
      <div class="modal-body">
        <div class="form-group"><span class="row-label">Subject</span><div id="assignmentDetailsSubject">—</div></div>
        <div class="form-row">
          <div class="form-group"><span class="row-label">Due date</span><div id="assignmentDetailsDueDate">—</div></div>
          <div class="form-group"><span class="row-label">Points</span><div id="assignmentDetailsPoints">—</div></div>
        </div>
        <div class="form-group"><span class="row-label">Status</span><div><span class="badge badge-info" id="assignmentDetailsStatus">Upcoming</span></div></div>
        <div class="form-group"><span class="row-label">Description</span><p id="assignmentDetailsDescription">—</p></div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-primary" data-close-modal="assignmentDetailsModal">Close</button>
      </div>
    </div>
  </div>

  <script src="../js/data.js"></script>
  <script src="../js/auth.js"></script>
  <script src="../js/sidebar.js"></script>
  <script src="../js/google-integration.js"></script>
  <script src="../js/assignments.js"></script>
</body>
</html>

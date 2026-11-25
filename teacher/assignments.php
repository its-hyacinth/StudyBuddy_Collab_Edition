<?php $expectedRole = 'teacher'; require_once __DIR__ . '/../includes/page_guard.php'; ?>
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
  <script defer src="https://unpkg.com/lucide@latest"></script>
</head>
<body data-role="teacher">
  <div class="app-shell" id="appShell">
    <div class="page-content">
      <div class="page-header">
        <div>
          <h1 class="page-title">
            <span class="title-icon"><i data-lucide="clipboard-list"></i></span>
            Assignments
          </h1>
          <p class="page-subtitle">Create, manage, and track assignments across all your classes.</p>
        </div>
        <button type="button" class="btn btn-primary" id="createAsgBtn">
          <i data-lucide="plus"></i> Create Assignment
        </button>
      </div>

      <div class="filter-tabs" id="asgFilterTabs">
        <button type="button" class="filter-tab active" data-filter="all">
          All <span class="count" id="countAll">16</span>
        </button>
        <button type="button" class="filter-tab" data-filter="upcoming">
          Upcoming <span class="count" id="countUpcoming">8</span>
        </button>
        <button type="button" class="filter-tab" data-filter="overdue">
          Overdue <span class="count" id="countOverdue">3</span>
        </button>
        <button type="button" class="filter-tab" data-filter="completed">
          Completed <span class="count" id="countCompleted">5</span>
        </button>
      </div>

      <div class="page-layout">
        <div class="page-main">
          <div class="toolbar">
            <div class="search-mini">
              <i data-lucide="search"></i>
              <input type="search" id="asgSearch" placeholder="Search assignments..." />
            </div>
            <select id="asgClassFilter" aria-label="Filter by class">
              <option value="">All Classes</option>
            </select>
            <select id="asgSort" aria-label="Sort by due date">
              <option value="due-asc">Due Date (Earliest)</option>
              <option value="due-desc">Due Date (Latest)</option>
              <option value="title">Title (A–Z)</option>
              <option value="points">Points (Highest)</option>
            </select>
          </div>

          <div class="card">
            <div class="table-wrap">
              <table class="data-table" id="assignmentsTable">
                <thead>
                  <tr>
                     <th style="width: 24%; text-align: center; padding: 10px 12px;">Assignment</th>
                     <th style="width: 20%; text-align: center; padding: 10px 12px;">Class</th>
                    <th>Due Date</th>
                    <th>Points</th>
                    <th>Submissions</th>
                     <th style="width: 17%; text-align: center; padding: 10px 12px;">Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody id="assignmentsTableBody">
                  <tr data-id="asg_1" data-status="upcoming">
                    <td>
                      <div class="cell-title">
                        <div class="cell-icon" style="background:#DBEAFE;color:#2563EB"><i data-lucide="file-text"></i></div>
                        <div>
                          <div class="title">Algebra Homework Set 3</div>
                          <div class="subtitle">Complete problems 1–20</div>
                        </div>
                      </div>
                    </td>
                    <td><span class="subject-tag math"><span class="dot math"></span> Math 101</span></td>
                    <td>Sep 12, 2025</td>
                    <td>50 pts</td>
                    <td>28 / 32</td>
                    <td><span class="badge badge-upcoming">Upcoming</span></td>
                    <td>
                      <div class="action-menu-wrap">
                        <button type="button" class="action-menu-btn" aria-label="Actions"><i data-lucide="more-horizontal"></i></button>
                        <div class="action-dropdown">
                          <button type="button"><i data-lucide="eye"></i> View</button>
                          <button type="button"><i data-lucide="edit"></i> Edit</button>
                          <button type="button"><i data-lucide="users"></i> Submissions</button>
                          <button type="button" class="danger"><i data-lucide="trash-2"></i> Delete</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr data-id="asg_2" data-status="upcoming">
                    <td>
                      <div class="cell-title">
                        <div class="cell-icon" style="background:#DCFCE7;color:#16A34A"><i data-lucide="file-text"></i></div>
                        <div>
                          <div class="title">Science Lab Report</div>
                          <div class="subtitle">Photosynthesis experiment</div>
                        </div>
                      </div>
                    </td>
                    <td><span class="subject-tag science"><span class="dot science"></span> Science 205</span></td>
                    <td>Sep 14, 2025</td>
                    <td>100 pts</td>
                    <td>22 / 28</td>
                    <td><span class="badge badge-upcoming">Upcoming</span></td>
                    <td>
                      <div class="action-menu-wrap">
                        <button type="button" class="action-menu-btn" aria-label="Actions"><i data-lucide="more-horizontal"></i></button>
                        <div class="action-dropdown">
                          <button type="button"><i data-lucide="eye"></i> View</button>
                          <button type="button"><i data-lucide="edit"></i> Edit</button>
                          <button type="button"><i data-lucide="users"></i> Submissions</button>
                          <button type="button" class="danger"><i data-lucide="trash-2"></i> Delete</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr data-id="asg_4" data-status="overdue">
                    <td>
                      <div class="cell-title">
                        <div class="cell-icon" style="background:#FFEDD5;color:#EA580C"><i data-lucide="file-text"></i></div>
                        <div>
                          <div class="title">Python Mini Project</div>
                          <div class="subtitle">CLI to-do app</div>
                        </div>
                      </div>
                    </td>
                    <td><span class="subject-tag cs"><span class="dot cs"></span> CS 308</span></td>
                    <td>Sep 10, 2025</td>
                    <td>100 pts</td>
                    <td>18 / 24</td>
                    <td><span class="badge badge-overdue">Overdue</span></td>
                    <td>
                      <div class="action-menu-wrap">
                        <button type="button" class="action-menu-btn" aria-label="Actions"><i data-lucide="more-horizontal"></i></button>
                        <div class="action-dropdown">
                          <button type="button"><i data-lucide="eye"></i> View</button>
                          <button type="button"><i data-lucide="edit"></i> Edit</button>
                          <button type="button"><i data-lucide="users"></i> Submissions</button>
                          <button type="button" class="danger"><i data-lucide="trash-2"></i> Delete</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr data-id="asg_5" data-status="completed">
                    <td>
                      <div class="cell-title">
                        <div class="cell-icon" style="background:#DBEAFE;color:#2563EB"><i data-lucide="file-check"></i></div>
                        <div>
                          <div class="title">Math Quiz 1</div>
                          <div class="subtitle">Chapters 1–2</div>
                        </div>
                      </div>
                    </td>
                    <td><span class="subject-tag math"><span class="dot math"></span> Math 101</span></td>
                    <td>Sep 5, 2025</td>
                    <td>30 pts</td>
                    <td>32 / 32</td>
                    <td><span class="badge badge-completed">Completed</span></td>
                    <td>
                      <div class="action-menu-wrap">
                        <button type="button" class="action-menu-btn" aria-label="Actions"><i data-lucide="more-horizontal"></i></button>
                        <div class="action-dropdown">
                          <button type="button"><i data-lucide="eye"></i> View</button>
                          <button type="button"><i data-lucide="edit"></i> Edit</button>
                          <button type="button"><i data-lucide="users"></i> Submissions</button>
                          <button type="button" class="danger"><i data-lucide="trash-2"></i> Delete</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr data-id="asg_8" data-status="upcoming">
                    <td>
                      <div class="cell-title">
                        <div class="cell-icon" style="background:#FFEDD5;color:#EA580C"><i data-lucide="file-text"></i></div>
                        <div>
                          <div class="title">HTML/CSS Landing Page</div>
                          <div class="subtitle">Responsive design project</div>
                        </div>
                      </div>
                    </td>
                    <td><span class="subject-tag cs"><span class="dot cs"></span> CS 308</span></td>
                    <td>Sep 20, 2025</td>
                    <td>80 pts</td>
                    <td>12 / 24</td>
                    <td><span class="badge badge-upcoming">Upcoming</span></td>
                    <td>
                      <div class="action-menu-wrap">
                        <button type="button" class="action-menu-btn" aria-label="Actions"><i data-lucide="more-horizontal"></i></button>
                        <div class="action-dropdown">
                          <button type="button"><i data-lucide="eye"></i> View</button>
                          <button type="button"><i data-lucide="edit"></i> Edit</button>
                          <button type="button"><i data-lucide="users"></i> Submissions</button>
                          <button type="button" class="danger"><i data-lucide="trash-2"></i> Delete</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="pagination" id="asgPagination">
              <div class="pagination-info" id="asgPaginationInfo">Showing 1–5 of 16 assignments</div>
              <div class="pagination-controls">
                <button type="button" class="page-btn" id="asgPrevPage" disabled aria-label="Previous page">
                  <i data-lucide="chevron-left"></i>
                </button>
                <button type="button" class="page-btn active" data-page="1">1</button>
                <button type="button" class="page-btn" data-page="2">2</button>
                <button type="button" class="page-btn" data-page="3">3</button>
                <button type="button" class="page-btn" data-page="4">4</button>
                <button type="button" class="page-btn" id="asgNextPage" aria-label="Next page">
                  <i data-lucide="chevron-right"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <aside class="page-aside">
          <div class="card">
            <div class="card-header">
              <div class="card-header-left">
                <div class="card-icon red"><i data-lucide="alarm-clock"></i></div>
                <h2 class="card-title">Upcoming Deadlines</h2>
              </div>
            </div>
            <div id="asgDeadlines">
              <p class="empty-state" style="padding:16px">Loading deadlines...</p>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <div class="card-header-left">
                <div class="card-icon green"><i data-lucide="zap"></i></div>
                <h2 class="card-title">Quick Actions</h2>
              </div>
            </div>
            <div class="qa-grid">
              <button type="button" class="qa-btn blue" id="qaCreateAsg"><i data-lucide="plus-circle"></i> New Assignment</button>
              <a href="grades.php" class="qa-btn purple"><i data-lucide="pen-line"></i> Grade Work</a>
              <a href="resources.php" class="qa-btn green"><i data-lucide="paperclip"></i> Attach Resource</a>
              <button type="button" class="qa-btn orange" id="qaDuplicateAsg"><i data-lucide="copy"></i> Duplicate</button>
            </div>
          </div>

          <div class="tip-card">
            <div class="tip-icon"><i data-lucide="lightbulb"></i></div>
            <p>"Set clear rubrics and point values upfront — students submit 40% more often when expectations are explicit."</p>
            <div class="tip-footer"><i data-lucide="sparkles"></i> Assignment tip</div>
          </div>
        </aside>
      </div>
    </div>
  </div>

  <!-- Create Assignment Modal -->
  <div class="modal-backdrop" id="createAsgModal">
    <div class="modal">
      <div class="modal-header">
        <h3 id="asgModalTitle">Create Assignment</h3>
        <button type="button" class="modal-close" data-close-modal="createAsgModal" aria-label="Close">
          <i data-lucide="x"></i>
        </button>
      </div>
      <form id="createAsgForm">
        <div class="modal-body">
          <div class="form-group">
            <label for="asgTitle">Title</label>
            <input class="form-control" type="text" id="asgTitle" placeholder="Assignment title" required />
          </div>
          <div class="form-group">
            <label for="asgClass">Class</label>
            <select class="form-control" id="asgClass" required>
              <option value="">Select class</option>
            </select>
            <p id="asgClassHint" class="subtitle" hidden style="margin-top:6px">
              No classes yet. <a href="classes.php">Add a class</a> and set its course, year, and block first.
            </p>
            <label class="check-line" for="asgIncludeIrregular">
              <input type="checkbox" id="asgIncludeIrregular" checked />
              <span>Include irregular students enrolled in this class</span>
            </label>
            <p id="asgAudienceHint" class="subtitle"></p>
          </div>
          <!-- NEW: due date + due time -->
          <div class="form-row">
            <div class="form-group">
              <label for="asgDueDate">Due Date</label>
              <input class="form-control" type="date" id="asgDueDate" required />
            </div>
            <div class="form-group">
              <label for="asgDueTime">Due Time</label>
              <input class="form-control" type="time" id="asgDueTime" value="23:59" required />
            </div>
          </div>
          <div class="form-group">
            <label for="asgPoints">Points</label>
            <input class="form-control" type="number" id="asgPoints" placeholder="50" min="1" required />
          </div>
          <div class="form-group">
            <label for="asgDescription">Description</label>
            <textarea class="form-control" id="asgDescription" placeholder="Instructions for students..."></textarea>
          </div>
          <div class="form-group">
            <label for="asgAttachment">Attachment for students (optional)</label>
            <input class="form-control" type="file" id="asgAttachment" />
            <p class="subtitle" id="asgAttachmentCurrent" hidden style="margin-top:6px"></p>
            <p class="subtitle" style="margin-top:6px">Maximum file size: 4 MB. Students can open or download this file from assignment details.</p>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-ghost" data-close-modal="createAsgModal">Cancel</button>
          <button type="submit" class="btn btn-primary" id="saveAsgBtn">Create Assignment</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Assignment Details Modal -->
  <div class="modal-backdrop" id="asgDetailsModal">
    <div class="modal">
      <div class="modal-header">
        <h3 id="tAsgTitle">Assignment Details</h3>
        <button type="button" class="modal-close" data-close-modal="asgDetailsModal" aria-label="Close">
          <i data-lucide="x"></i>
        </button>
      </div>
      <div class="modal-body">
        <div class="form-grid-two">
          <div><div class="stat-label" style="font-weight:700;font-size:15px;color:#0F172A;margin-bottom:2px">Class</div><div class="title" id="tAsgClass"></div></div>
          <div><div class="stat-label" style="font-weight:700;font-size:15px;color:#0F172A;margin-bottom:2px">Status</div><div><span class="badge" id="tAsgStatus"></span></div></div>
          <div><div class="stat-label" style="font-weight:700;font-size:15px;color:#0F172A;margin-bottom:2px">Due</div><div class="title" id="tAsgDue"></div></div>
          <div><div class="stat-label" style="font-weight:700;font-size:15px;color:#0F172A;margin-bottom:2px">Points</div><div class="title" id="tAsgPoints"></div></div>
          <div><div class="stat-label" style="font-weight:700;font-size:15px;color:#0F172A;margin-bottom:2px">Submissions</div><div class="title" id="tAsgSubmissions"></div></div>
        </div>
        <div style="margin-top:18px">
          <div class="stat-label" style="font-weight:700;font-size:15px;color:#0F172A;margin-bottom:2px">Description</div>
          <div class="subtitle" id="tAsgDescription" style="margin-top:4px"></div>
        </div>
        <div id="tAsgAttachmentGroup" hidden style="margin-top:18px">
          <div class="stat-label" style="font-weight:700;font-size:15px;color:#0F172A;margin-bottom:2px">Attachment for students</div>
          <div class="subtitle" id="tAsgAttachment" style="margin-top:4px"></div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-ghost" data-close-modal="asgDetailsModal">Close</button>
        <button type="button" class="btn btn-primary" id="editAsgBtn"><i data-lucide="edit"></i> Edit Assignment</button>
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
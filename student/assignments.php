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
  <script defer src="https://unpkg.com/lucide@latest"></script>
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
          <div class="stat-grid" id="asgStats" style="grid-template-columns:repeat(4,1fr)"></div>

          <div class="card">
            <div class="filter-tabs" id="asgTabs" role="tablist"></div>

            <div class="toolbar">
              <div class="search-mini">
                <i data-lucide="search"></i>
                <input type="search" id="asgSearch" placeholder="Search assignments..." />
              </div>
              <select id="asgSubjectFilter" aria-label="Filter by subject">
                <option value="">All Subjects</option>
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
                <tbody></tbody>
              </table>
            </div>

            <div class="pagination" id="asgPagination"></div>
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
            <div id="deadlineList"><p class="empty-state">No Classroom assignments yet.</p></div>
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
            <div id="asgProgressDonut"></div>
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
            </select>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="asgDueDate">Due Date</label>
              <input type="date" class="form-control" id="asgDueDate" name="dueDate" required />
            </div>
            <div class="form-group">
              <label for="asgPoints">Points</label>
              <input type="number" class="form-control" id="asgPoints" name="points" placeholder="Points possible" min="0" />
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
        <div class="form-group"><span class="row-label">Status</span><div><span class="badge" id="assignmentDetailsStatus"></span></div></div>
        <div class="form-group"><span class="row-label">Description</span><p id="assignmentDetailsDescription">—</p></div>
        <div class="form-group" id="assignmentDetailsSubmissionGroup" hidden>
          <span class="row-label">Google Classroom submission</span>
          <p id="assignmentDetailsSubmission"></p>
        </div>
        <div class="form-group" id="assignmentDetailsTeacherSubmissionGroup" hidden>
          <span class="row-label">Your submission</span>
          <p id="assignmentDetailsTeacherSubmission"></p>
        </div>
        <div class="form-group" id="assignmentDetailsFilesGroup" hidden>
          <span class="row-label">Submitted files</span>
          <div id="assignmentDetailsFiles"></div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-primary" id="assignmentDetailsSubmitBtn" hidden>Submit file</button>
        <button type="button" class="btn btn-primary" data-close-modal="assignmentDetailsModal">Close</button>
      </div>
    </div>
  </div>

  <div class="modal-backdrop" id="submitAssignmentModal">
    <div class="modal" role="dialog" aria-labelledby="submitAssignmentTitle">
      <div class="modal-header">
        <h3 id="submitAssignmentTitle">Submit assignment</h3>
        <button type="button" class="modal-close" data-close-modal="submitAssignmentModal" aria-label="Close">
          <i data-lucide="x"></i>
        </button>
      </div>
      <form id="submitAssignmentForm">
        <div class="modal-body">
          <input type="hidden" id="submitAssignmentId" name="assignmentId" />
          <p id="submitAssignmentName" class="form-group"></p>
          <div class="form-group">
            <label for="submissionFile">Choose your coursework file (up to 10 MB; executable and active web files are blocked)</label>
            <input type="file" class="form-control" id="submissionFile" name="file" required />
          </div>
          <p id="submissionStatusMessage" class="subtitle" aria-live="polite"></p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-ghost" data-close-modal="submitAssignmentModal">Cancel</button>
          <button type="submit" class="btn btn-primary" id="submitAssignmentButton">Submit file</button>
        </div>
      </form>
    </div>
  </div>

  <script src="../js/data.js"></script>
  <script src="../js/auth.js"></script>
  <script src="../js/sidebar.js"></script>
  <script src="../js/google-integration.js"></script>
  <script src="../js/assignments.js"></script>
</body>
</html>

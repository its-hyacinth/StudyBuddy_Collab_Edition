<?php $expectedRole = 'student'; require_once __DIR__ . '/../includes/page_guard.php'; ?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta name="csrf-token" content="<?= e($_SESSION['csrf_token']) ?>">
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>StudyBuddy — Subjects</title>
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
            <span class="title-icon"><i data-lucide="book-open"></i></span>
            My Subjects
          </h1>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button type="button" class="btn btn-outline" id="syncClassroomBtn">
            <i data-lucide="refresh-cw"></i> Sync Classroom
          </button>
          <button type="button" class="btn btn-primary" id="addSubjectBtn">
            <i data-lucide="plus"></i> Add Subject
          </button>
        </div>
      </div>

      <div class="page-layout">
        <div class="page-main">
          <div class="subject-cards" id="subjectGrid">
            <p class="empty-state">Sync Google Classroom to load your courses.</p>
          </div>

          <div class="subject-tabs" id="subjectTabs" role="group" aria-label="Filter subject assignments"></div>

          <div class="card" id="subjectDetail">
            <p class="empty-state">Sync Google Classroom to view your subjects.</p>
          </div>
        </div>

        <aside class="page-aside">
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
              <button type="button" class="qa-btn green" data-action="add-task">
                <i data-lucide="plus-circle"></i> Add Task
              </button>
              <button type="button" class="qa-btn purple" data-action="view-schedule">
                <i data-lucide="calendar"></i> Schedule
              </button>
              <button type="button" class="qa-btn orange" data-action="open-drive">
                <i data-lucide="folder-open"></i> Resources
              </button>
            </div>
          </div>

          <div class="card" id="quickFacts">
            <div class="card-header">
              <div class="card-header-left">
                <div class="card-icon teal"><i data-lucide="lightbulb"></i></div>
                <h2 class="card-title">Quick Facts</h2>
              </div>
            </div>
            <p class="empty-state">No Classroom data yet.</p>
          </div>
        </aside>
      </div>
    </div>
  </div>

  <div class="modal-backdrop" id="addSubjectModal">
    <div class="modal" role="dialog" aria-labelledby="addSubjectTitle">
      <div class="modal-header">
        <h3 id="addSubjectTitle">Add Subject</h3>
        <button type="button" class="modal-close" data-close-modal="addSubjectModal" aria-label="Close">
          <i data-lucide="x"></i>
        </button>
      </div>
      <form id="addSubjectForm">
        <div class="modal-body">
          <div class="form-group">
            <label for="subjectName">Subject Name</label>
            <input type="text" class="form-control" id="subjectName" name="name" placeholder="Subject name" required />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="subjectRoom">Room</label>
              <input type="text" class="form-control" id="subjectRoom" name="room" placeholder="Room" />
            </div>
            <div class="form-group">
              <label for="subjectProfessor">Professor</label>
              <input type="text" class="form-control" id="subjectProfessor" name="professor" placeholder="Instructor" />
            </div>
          </div>
          <div class="form-group">
            <label>Color</label>
            <div class="color-picker" id="subjectColorPicker">
              <button type="button" class="color-swatch selected" data-color="#2563EB" style="background:#2563EB" aria-label="Blue"></button>
              <button type="button" class="color-swatch" data-color="#16A34A" style="background:#16A34A" aria-label="Green"></button>
              <button type="button" class="color-swatch" data-color="#7C3AED" style="background:#7C3AED" aria-label="Purple"></button>
              <button type="button" class="color-swatch" data-color="#EA580C" style="background:#EA580C" aria-label="Orange"></button>
              <button type="button" class="color-swatch" data-color="#0D9488" style="background:#0D9488" aria-label="Teal"></button>
              <button type="button" class="color-swatch" data-color="#E11D48" style="background:#E11D48" aria-label="Red"></button>
            </div>
            <input type="hidden" id="subjectColor" name="color" value="#2563EB" />
          </div>
          <div class="form-group">
            <label for="subjectDescription">Description</label>
            <textarea class="form-control" id="subjectDescription" name="description" placeholder="Brief description of the subject..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-ghost" data-close-modal="addSubjectModal">Cancel</button>
          <button type="submit" class="btn btn-primary">Add Subject</button>
        </div>
      </form>
    </div>
  </div>

  <div class="modal-backdrop" id="quickFactModal">
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="quickFactTitle">
      <div class="modal-header">
        <h3 id="quickFactTitle">Quick Fact Details</h3>
        <button type="button" class="modal-close" data-close-modal="quickFactModal" aria-label="Close">
          <i data-lucide="x"></i>
        </button>
      </div>
      <div class="modal-body" id="quickFactContent" aria-live="polite"></div>
      <div class="modal-footer">
        <button type="button" class="btn btn-primary" data-close-modal="quickFactModal">Done</button>
      </div>
    </div>
  </div>

  <script src="../js/data.js"></script>
  <script src="../js/auth.js"></script>
  <script src="../js/sidebar.js"></script>
  <script src="../js/google-integration.js"></script>
  <script src="../js/subjects.js"></script>
</body>
</html>

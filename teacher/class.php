<?php $expectedRole = 'teacher'; require_once __DIR__ . '/../includes/page_guard.php'; ?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta name="csrf-token" content="<?= e($_SESSION['csrf_token']) ?>">
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>StudyBuddy — Class</title>
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
          <a href="classes.php" class="subtitle" style="display:inline-flex;align-items:center;gap:6px;margin-bottom:6px">
            <i data-lucide="arrow-left"></i> My Classes
          </a>
          <h1 class="page-title" id="classTitle">Class</h1>
          <p class="subtitle" id="classMeta"></p>
        </div>
        <button type="button" class="btn btn-primary" id="addStudentBtn"><i data-lucide="user-plus"></i> Add student</button>
      </div>

      <div class="card" style="margin-bottom:16px">
        <div class="card-header">
          <div class="card-header-left">
            <div class="card-icon blue"><i data-lucide="key-round"></i></div>
            <h2 class="card-title">Class code</h2>
          </div>
        </div>
        <p class="subtitle">Students enter this code on My Subjects to join the class and receive its assignments.</p>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:12px">
          <strong id="joinCode" style="font-size:22px;letter-spacing:3px">------</strong>
          <button type="button" class="btn btn-outline" id="copyCodeBtn">Copy code</button>
          <button type="button" class="btn btn-ghost" id="regenCodeBtn">New code</button>
        </div>
      </div>

      <div class="page-layout">
        <div class="page-main">
          <div class="card">
            <div class="card-header">
              <div class="card-header-left">
                <div class="card-icon green"><i data-lucide="users"></i></div>
                <h2 class="card-title">People</h2>
              </div>
              <span class="subtitle" id="peopleCount"></span>
            </div>
            <div id="peopleList"><p class="empty-state">No students in this class yet.</p></div>
          </div>

          <div class="card" style="margin-top:16px">
            <div class="card-header">
              <div class="card-header-left">
                <div class="card-icon purple"><i data-lucide="clipboard-list"></i></div>
                <h2 class="card-title">Activity</h2>
              </div>
              <a href="assignments.php" class="subtitle">All assignments</a>
            </div>
            <div id="activityList"><p class="empty-state">No assignments for this class yet.</p></div>
          </div>
        </div>
        <aside class="page-aside">
          <div class="card">
            <div class="card-header">
              <div class="card-header-left">
                <div class="card-icon orange"><i data-lucide="info"></i></div>
                <h2 class="card-title">Class details</h2>
              </div>
              <a class="btn btn-outline btn-sm" id="editClassLink" href="classes.php"><i data-lucide="edit"></i> Edit details</a>
            </div>
            <div id="classDetails" class="subtitle"></div>
          </div>
        </aside>
      </div>
    </div>
  </div>

  <div class="modal-backdrop" id="addStudentModal">
    <div class="modal">
      <div class="modal-header">
        <h3>Add student</h3>
        <button type="button" class="modal-close" data-close-modal="addStudentModal" aria-label="Close"><i data-lucide="x"></i></button>
      </div>
      <form id="addStudentForm">
        <div class="modal-body">
          <div class="form-group">
            <label for="studentName">Name</label>
            <input class="form-control" id="studentName" required placeholder="Student name" />
          </div>
          <div class="form-group">
            <label for="studentEmail">Email</label>
            <input class="form-control" id="studentEmail" type="email" required placeholder="student@school.edu" />
          </div>
          <p class="subtitle">If this email already has a student account, the class and its assignments show up for them right away.</p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-ghost" data-close-modal="addStudentModal">Cancel</button>
          <button type="submit" class="btn btn-primary">Add student</button>
        </div>
      </form>
    </div>
  </div>

  <script src="../js/data.js"></script>
  <script src="../js/auth.js"></script>
  <script src="../js/sidebar.js"></script>
  <script src="../js/teacher-class.js"></script>
</body>
</html>

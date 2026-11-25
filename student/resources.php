<?php $expectedRole = 'student'; require_once __DIR__ . '/../includes/page_guard.php'; ?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta name="csrf-token" content="<?= e($_SESSION['csrf_token']) ?>">
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>StudyBuddy — Teacher Resources</title>
  <link rel="stylesheet" href="../css/style.css" />
  <link rel="stylesheet" href="../css/components.css" />
  <link rel="stylesheet" href="../css/pages.css" />
  <link rel="stylesheet" href="../css/student.css" />
  <script defer src="https://unpkg.com/lucide@latest"></script>
</head>
<body class="student-app student-resources-page">
  <div class="app-shell" id="appShell">
    <div class="page-content">
      <div class="page-header">
        <div>
          <h1 class="page-title">
            <span class="title-icon"><i data-lucide="folder-open"></i></span>
            Teacher Resources
          </h1>
          <p class="page-subtitle">View files your teachers shared with your classes and subjects.</p>
        </div>
      </div>

      <section class="card student-resource-library" aria-label="Shared teacher resources">
        <div class="student-resource-toolbar">
          <div class="search-mini">
            <i data-lucide="search"></i>
            <input type="search" id="resourceSearch" placeholder="Search resources..." aria-label="Search resources" />
          </div>
          <select class="form-control" id="resourceClassFilter" aria-label="Filter resources by class">
            <option value="">All classes</option>
          </select>
        </div>
        <p class="student-resource-count" id="resourceCount" aria-live="polite"></p>
        <div class="student-resource-list" id="studentResourceList" aria-live="polite">
          <p class="empty-state">Loading shared resources…</p>
        </div>
      </section>
    </div>
  </div>

  <script src="../js/data.js"></script>
  <script src="../js/auth.js"></script>
  <script src="../js/sidebar.js"></script>
  <script src="../js/student-resources.js"></script>
</body>
</html>

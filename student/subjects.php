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
          <p class="page-subtitle">BSIT_DAY_4-B · 1st Semester SY 2026-2027 · Synced from Google Classroom. Professors show as TBA until Classroom lists them.</p>
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
            <div class="subject-card" data-subject-id="subj_math">
              <div class="subject-card-top">
                <div class="subj-icon" style="background:#DBEAFE;color:#2563EB"><i data-lucide="calculator"></i></div>
                <div class="subj-info">
                  <h3>Mathematics</h3>
                  <p>Room 302 · Prof. Santos</p>
                </div>
                <div class="action-menu-wrap">
                  <button type="button" class="action-menu-btn" aria-label="Actions"><i data-lucide="more-vertical"></i></button>
                </div>
              </div>
              <div class="progress-row">
                <div class="progress-bar"><div class="fill math" style="width:75%"></div></div>
                <span class="progress-pct">75%</span>
              </div>
              <div class="subject-card-stats">
                <div class="ss"><div class="ss-val">5</div><div class="ss-lbl"><i data-lucide="clipboard-list"></i> Assignments</div></div>
                <div class="ss"><div class="ss-val">4</div><div class="ss-lbl"><i data-lucide="check-circle"></i> Done</div></div>
                <div class="ss"><div class="ss-val">1</div><div class="ss-lbl"><i data-lucide="clock"></i> Pending</div></div>
              </div>
            </div>
            <div class="subject-card" data-subject-id="subj_sci">
              <div class="subject-card-top">
                <div class="subj-icon" style="background:#DCFCE7;color:#16A34A"><i data-lucide="flask-conical"></i></div>
                <div class="subj-info">
                  <h3>Science</h3>
                  <p>Lab 105 · Prof. Reyes</p>
                </div>
              </div>
              <div class="progress-row">
                <div class="progress-bar"><div class="fill science" style="width:50%"></div></div>
                <span class="progress-pct">50%</span>
              </div>
              <div class="subject-card-stats">
                <div class="ss"><div class="ss-val">4</div><div class="ss-lbl"><i data-lucide="clipboard-list"></i> Assignments</div></div>
                <div class="ss"><div class="ss-val">2</div><div class="ss-lbl"><i data-lucide="check-circle"></i> Done</div></div>
                <div class="ss"><div class="ss-val">2</div><div class="ss-lbl"><i data-lucide="clock"></i> Pending</div></div>
              </div>
            </div>
            <div class="subject-card" data-subject-id="subj_eng">
              <div class="subject-card-top">
                <div class="subj-icon" style="background:#EDE9FE;color:#7C3AED"><i data-lucide="book-open"></i></div>
                <div class="subj-info">
                  <h3>English</h3>
                  <p>Room 210 · Prof. Cruz</p>
                </div>
              </div>
              <div class="progress-row">
                <div class="progress-bar"><div class="fill english" style="width:80%"></div></div>
                <span class="progress-pct">80%</span>
              </div>
              <div class="subject-card-stats">
                <div class="ss"><div class="ss-val">3</div><div class="ss-lbl"><i data-lucide="clipboard-list"></i> Assignments</div></div>
                <div class="ss"><div class="ss-val">3</div><div class="ss-lbl"><i data-lucide="check-circle"></i> Done</div></div>
                <div class="ss"><div class="ss-val">0</div><div class="ss-lbl"><i data-lucide="clock"></i> Pending</div></div>
              </div>
            </div>
            <div class="subject-card" data-subject-id="subj_cs">
              <div class="subject-card-top">
                <div class="subj-icon" style="background:#FFEDD5;color:#EA580C"><i data-lucide="code-2"></i></div>
                <div class="subj-info">
                  <h3>Computer Science</h3>
                  <p>Lab 401 · Prof. Garcia</p>
                </div>
              </div>
              <div class="progress-row">
                <div class="progress-bar"><div class="fill cs" style="width:60%"></div></div>
                <span class="progress-pct">60%</span>
              </div>
              <div class="subject-card-stats">
                <div class="ss"><div class="ss-val">4</div><div class="ss-lbl"><i data-lucide="clipboard-list"></i> Assignments</div></div>
                <div class="ss"><div class="ss-val">2</div><div class="ss-lbl"><i data-lucide="check-circle"></i> Done</div></div>
                <div class="ss"><div class="ss-val">2</div><div class="ss-lbl"><i data-lucide="clock"></i> Pending</div></div>
              </div>
            </div>
          </div>

          <div class="subject-tabs" id="subjectTabs" role="group" aria-label="Filter subject assignments">
            <button type="button" class="subject-tab active" data-filter="all" aria-pressed="true" aria-controls="subjectAssignmentList">All Subjects <span class="count">0</span></button>
            <button type="button" class="subject-tab" data-filter="pending" aria-pressed="false" aria-controls="subjectAssignmentList">Pending <span class="count">0</span></button>
            <button type="button" class="subject-tab" data-filter="completed" aria-pressed="false" aria-controls="subjectAssignmentList">Completed <span class="count">0</span></button>
          </div>

          <div class="card" id="subjectDetail">
            <div class="card-header">
              <div class="card-header-left">
                <div class="subj-icon" style="background:#DBEAFE;color:#2563EB;width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center"><i data-lucide="calculator"></i></div>
                <div>
                  <h2 class="card-title">Mathematics</h2>
                  <p style="font-size:12.5px;color:var(--text-muted);margin-top:2px">Room 302 · Prof. Santos</p>
                </div>
              </div>
            </div>
            <p style="font-size:13.5px;color:var(--text-body);margin-bottom:16px">Covers basic and advanced mathematical concepts, problem solving, and applications.</p>
            <div class="subject-detail-stats">
              <div class="detail-stat-box">
                <div class="ds-val">75%</div>
                <div class="ds-lbl">Progress</div>
                <div class="progress-bar"><div class="fill math" style="width:75%"></div></div>
              </div>
              <div class="detail-stat-box">
                <div class="ds-val">5</div>
                <div class="ds-lbl">Assignments</div>
                <a href="assignments.php">View all</a>
              </div>
              <div class="detail-stat-box">
                <div class="ds-val">1</div>
                <div class="ds-lbl">Pending</div>
                <a href="todo.php">View tasks</a>
              </div>
            </div>
            <h3 style="font-size:14px;margin:16px 0 12px">Recent Assignments</h3>
            <div class="list-item">
              <div class="item-meta">
                <div class="item-title">Algebra Homework Set 3</div>
                <div class="item-sub">Due Sep 12, 2025</div>
              </div>
              <span class="badge badge-upcoming">Upcoming</span>
            </div>
            <div class="list-item">
              <div class="item-meta">
                <div class="item-title">Math Quiz 1</div>
                <div class="item-sub">Due Sep 5, 2025</div>
              </div>
              <span class="badge badge-completed">Completed</span>
            </div>
          </div>
        </div>

        <aside class="page-aside">
          <div class="card" id="subjectOverview">
            <div class="card-header">
              <div class="card-header-left">
                <div class="card-icon blue"><i data-lucide="info"></i></div>
                <h2 class="card-title">Subject Overview</h2>
              </div>
            </div>
            <div style="text-align:center;padding:8px 0 16px">
              <div class="subj-icon" style="background:#DBEAFE;color:#2563EB;width:56px;height:56px;border-radius:14px;display:flex;align-items:center;justify-content:center;margin:0 auto 12px"><i data-lucide="calculator"></i></div>
              <h3 style="font-size:16px;margin-bottom:4px">Mathematics</h3>
              <p style="font-size:12.5px;color:var(--text-muted)">Select a subject to view details</p>
            </div>
            <div class="progress-row" style="margin-bottom:12px">
              <div class="progress-bar"><div class="fill math" style="width:75%"></div></div>
              <span class="progress-pct">75%</span>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12.5px">
              <div style="padding:10px;background:var(--page-bg);border-radius:8px;text-align:center">
                <div style="font-weight:700;font-size:18px;color:var(--text-heading)">5</div>
                <div style="color:var(--text-muted)">Assignments</div>
              </div>
              <div style="padding:10px;background:var(--page-bg);border-radius:8px;text-align:center">
                <div style="font-weight:700;font-size:18px;color:var(--text-heading)">4</div>
                <div style="color:var(--text-muted)">Completed</div>
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
            <div style="display:flex;flex-direction:column;gap:10px;font-size:13px">
              <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #F1F5F9">
                <span style="color:var(--text-muted)">Total Subjects</span>
                <span style="font-weight:600;color:var(--text-heading)">6</span>
              </div>
              <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #F1F5F9">
                <span style="color:var(--text-muted)">Avg. Progress</span>
                <span style="font-weight:600;color:var(--text-heading)">65%</span>
              </div>
              <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #F1F5F9">
                <span style="color:var(--text-muted)">Pending Tasks</span>
                <span style="font-weight:600;color:var(--text-heading)">4</span>
              </div>
              <div style="display:flex;justify-content:space-between;padding:8px 0">
                <span style="color:var(--text-muted)">Next Class</span>
                <span style="font-weight:600;color:var(--text-heading)">Mathematics</span>
              </div>
            </div>
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
            <input type="text" class="form-control" id="subjectName" name="name" placeholder="e.g. Mathematics" required />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="subjectRoom">Room</label>
              <input type="text" class="form-control" id="subjectRoom" name="room" placeholder="e.g. Room 302" />
            </div>
            <div class="form-group">
              <label for="subjectProfessor">Professor</label>
              <input type="text" class="form-control" id="subjectProfessor" name="professor" placeholder="e.g. Prof. Santos" />
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

  <script src="../js/data.js"></script>
  <script src="../js/auth.js"></script>
  <script src="../js/sidebar.js"></script>
  <script src="../js/google-integration.js"></script>
  <script src="../js/subjects.js"></script>
</body>
</html>

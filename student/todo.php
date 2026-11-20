<?php $expectedRole = 'student'; require_once __DIR__ . '/../includes/page_guard.php'; ?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta name="csrf-token" content="<?= e($_SESSION['csrf_token']) ?>">
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>StudyBuddy — To-Do List</title>
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
            <span class="title-icon"><i data-lucide="check-square"></i></span>
            To-Do List
          </h1>
          <p class="page-subtitle">Stay on top of your daily tasks and study goals.</p>
        </div>
        <button type="button" class="btn btn-primary" id="addTaskBtn">
          <i data-lucide="plus"></i> Add Task
        </button>
      </div>

      <div class="page-layout">
        <div class="page-main">
          <div class="filter-tabs" id="todoTabs" role="tablist">
            <button type="button" class="filter-tab active" data-filter="all">All <span class="count">8</span></button>
            <button type="button" class="filter-tab" data-filter="today">Today <span class="count">3</span></button>
            <button type="button" class="filter-tab" data-filter="upcoming">Upcoming <span class="count">3</span></button>
            <button type="button" class="filter-tab" data-filter="completed">Completed <span class="count">2</span></button>
          </div>

          <div class="card">
            <div id="todoList">
              <div class="todo-item" data-id="task_1" data-status="pending" data-today="true">
                <label class="custom-check">
                  <input type="checkbox" aria-label="Mark complete" />
                  <span class="box"></span>
                </label>
                <div class="todo-body">
                  <div class="todo-title">Review Algebra notes</div>
                  <div class="todo-meta">
                    <span class="subject-tag math">Mathematics</span>
                    <span class="todo-due"><i data-lucide="clock"></i> Today · 10:00 AM</span>
                  </div>
                </div>
                <span class="badge badge-pending">Pending</span>
                <div class="action-menu-wrap">
                  <button type="button" class="action-menu-btn" aria-label="Actions"><i data-lucide="more-horizontal"></i></button>
                </div>
              </div>

              <div class="todo-item" data-id="task_2" data-status="pending" data-today="true">
                <label class="custom-check">
                  <input type="checkbox" aria-label="Mark complete" />
                  <span class="box"></span>
                </label>
                <div class="todo-body">
                  <div class="todo-title">Finish lab report draft</div>
                  <div class="todo-meta">
                    <span class="subject-tag science">Science</span>
                    <span class="todo-due"><i data-lucide="clock"></i> Today · 2:00 PM</span>
                  </div>
                </div>
                <span class="badge badge-pending">Pending</span>
                <div class="action-menu-wrap">
                  <button type="button" class="action-menu-btn" aria-label="Actions"><i data-lucide="more-horizontal"></i></button>
                </div>
              </div>

              <div class="todo-item" data-id="task_4" data-status="pending" data-today="true">
                <label class="custom-check">
                  <input type="checkbox" aria-label="Mark complete" />
                  <span class="box"></span>
                </label>
                <div class="todo-body">
                  <div class="todo-title">Debug Python project</div>
                  <div class="todo-meta">
                    <span class="subject-tag cs">Computer Science</span>
                    <span class="todo-due"><i data-lucide="clock"></i> Today · 4:00 PM</span>
                  </div>
                </div>
                <span class="badge badge-pending">Pending</span>
                <div class="action-menu-wrap">
                  <button type="button" class="action-menu-btn" aria-label="Actions"><i data-lucide="more-horizontal"></i></button>
                </div>
              </div>

              <div class="todo-item" data-id="task_3" data-status="upcoming" data-today="false">
                <label class="custom-check">
                  <input type="checkbox" aria-label="Mark complete" />
                  <span class="box"></span>
                </label>
                <div class="todo-body">
                  <div class="todo-title">Read Chapter 5</div>
                  <div class="todo-meta">
                    <span class="subject-tag english">English</span>
                    <span class="todo-due"><i data-lucide="calendar"></i> Sep 13 · 6:00 PM</span>
                  </div>
                </div>
                <span class="badge badge-upcoming">Upcoming</span>
                <div class="action-menu-wrap">
                  <button type="button" class="action-menu-btn" aria-label="Actions"><i data-lucide="more-horizontal"></i></button>
                </div>
              </div>

              <div class="todo-item done" data-id="task_5" data-status="completed" data-today="false">
                <label class="custom-check">
                  <input type="checkbox" checked aria-label="Mark complete" />
                  <span class="box"></span>
                </label>
                <div class="todo-body">
                  <div class="todo-title">Memorize vocabulary list</div>
                  <div class="todo-meta">
                    <span class="subject-tag english">English</span>
                    <span class="todo-due"><i data-lucide="check"></i> Completed Sep 11</span>
                  </div>
                </div>
                <span class="badge badge-completed">Completed</span>
                <div class="action-menu-wrap">
                  <button type="button" class="action-menu-btn" aria-label="Actions"><i data-lucide="more-horizontal"></i></button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside class="page-aside">
          <div class="card" id="todayTasksAside">
            <div class="card-header">
              <div class="card-header-left">
                <div class="card-icon blue"><i data-lucide="sun"></i></div>
                <h2 class="card-title">Today's Tasks</h2>
              </div>
              <span class="badge badge-pending">3 left</span>
            </div>
            <div id="todayTasksList">
              <div class="list-item">
                <span class="dot math"></span>
                <div class="item-meta">
                  <div class="item-title">Review Algebra notes</div>
                  <div class="item-sub">10:00 AM</div>
                </div>
              </div>
              <div class="list-item">
                <span class="dot science"></span>
                <div class="item-meta">
                  <div class="item-title">Finish lab report draft</div>
                  <div class="item-sub">2:00 PM</div>
                </div>
              </div>
              <div class="list-item">
                <span class="dot cs"></span>
                <div class="item-meta">
                  <div class="item-title">Debug Python project</div>
                  <div class="item-sub">4:00 PM</div>
                </div>
              </div>
            </div>
          </div>

          <div class="card" id="quickAddAside">
            <div class="card-header">
              <div class="card-header-left">
                <div class="card-icon green"><i data-lucide="plus-circle"></i></div>
                <h2 class="card-title">Quick Add</h2>
              </div>
            </div>
            <form id="quickAddForm">
              <div class="form-group" style="margin-bottom:10px">
                <input type="text" class="form-control" id="quickTaskTitle" placeholder="What needs to be done?" />
              </div>
              <div class="form-row" style="margin-bottom:10px">
                <select class="form-control" id="quickTaskSubject" style="height:38px">
                  <option value="">Subject (optional)</option>
                  <option value="subj_math">Mathematics</option>
                  <option value="subj_sci">Science</option>
                  <option value="subj_eng">English</option>
                  <option value="subj_cs">Computer Science</option>
                </select>
                <input type="date" class="form-control" id="quickTaskDate" style="height:38px" />
              </div>
              <button type="submit" class="btn btn-primary btn-block btn-sm">
                <i data-lucide="plus"></i> Add Task
              </button>
            </form>
          </div>

          <div class="tip-card" id="studyReminderTip">
            <div class="tip-icon"><i data-lucide="lightbulb"></i></div>
            <p>"Break large tasks into smaller chunks. Completing one small step builds momentum for the rest."</p>
            <div class="tip-footer">
              <i data-lucide="bell"></i> Study Reminder · Updated daily
            </div>
          </div>
        </aside>
      </div>
    </div>
  </div>

  <div class="modal-backdrop" id="addTaskModal">
    <div class="modal" role="dialog" aria-labelledby="addTaskTitle">
      <div class="modal-header">
        <h3 id="addTaskTitle">Add Task</h3>
        <button type="button" class="modal-close" data-close-modal="addTaskModal" aria-label="Close">
          <i data-lucide="x"></i>
        </button>
      </div>
      <form id="addTaskForm">
        <div class="modal-body">
          <div class="form-group">
            <label for="taskTitle">Task Title</label>
            <input type="text" class="form-control" id="taskTitle" name="title" placeholder="What needs to be done?" required />
          </div>
          <div class="form-group">
            <label for="taskSubject">Subject</label>
            <select class="form-control" id="taskSubject" name="subjectId">
              <option value="">Select subject (optional)</option>
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
              <label for="taskDueDate">Due Date</label>
              <input type="date" class="form-control" id="taskDueDate" name="dueDate" required />
            </div>
            <div class="form-group">
              <label for="taskDueTime">Due Time</label>
              <input type="time" class="form-control" id="taskDueTime" name="dueTime" />
            </div>
          </div>
          <div class="form-group">
            <label for="taskNotes">Notes</label>
            <textarea class="form-control" id="taskNotes" name="notes" placeholder="Additional notes (optional)"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-ghost" data-close-modal="addTaskModal">Cancel</button>
          <button type="submit" class="btn btn-primary">Add Task</button>
        </div>
      </form>
    </div>
  </div>

  <div class="modal-backdrop" id="taskDetailsModal">
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="taskDetailsTitle">
      <div class="modal-header">
        <h3 id="taskDetailsTitle">Task Details</h3>
        <button type="button" class="modal-close" data-close-modal="taskDetailsModal" aria-label="Close task details">
          <i data-lucide="x"></i>
        </button>
      </div>
      <div class="modal-body">
        <div class="task-detail-status">
          <span class="task-detail-label">Status</span>
          <span class="badge" id="taskDetailsStatus"></span>
        </div>
        <div class="task-detail-grid">
          <div class="task-detail-field">
            <span class="task-detail-label">Subject</span>
            <strong class="task-detail-value" id="taskDetailsSubject"></strong>
          </div>
          <div class="task-detail-field">
            <span class="task-detail-label">Due date</span>
            <strong class="task-detail-value" id="taskDetailsDueDate"></strong>
          </div>
          <div class="task-detail-field">
            <span class="task-detail-label">Due time</span>
            <strong class="task-detail-value" id="taskDetailsDueTime"></strong>
          </div>
          <div class="task-detail-field task-detail-notes-field">
            <span class="task-detail-label">Notes</span>
            <p class="task-detail-value" id="taskDetailsNotes"></p>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-primary" data-close-modal="taskDetailsModal">Close</button>
      </div>
    </div>
  </div>

  <script src="../js/data.js"></script>
  <script src="../js/auth.js"></script>
  <script src="../js/sidebar.js"></script>
  <script src="../js/google-integration.js"></script>
  <script src="../js/todo.js"></script>
</body>
</html>

<?php $expectedRole = 'student'; require_once __DIR__ . '/../includes/page_guard.php'; ?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta name="csrf-token" content="<?= e($_SESSION['csrf_token']) ?>">
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>StudyBuddy — Study Progress</title>
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
            <span class="title-icon"><i data-lucide="trending-up"></i></span>
            Study Progress
          </h1>
          <p class="page-subtitle">Track your overall performance and subject-level progress over time.</p>
        </div>
      </div>

      <div class="page-layout">
        <div class="page-main">
          <div class="stat-grid" id="progressStats">
            <div class="stat-card" style="cursor:default">
              <div class="stat-icon blue"><i data-lucide="target"></i></div>
              <div class="stat-body">
                <div class="stat-label">Overall Progress</div>
                <div class="stat-value">68%</div>
                <div class="stat-delta up"><i data-lucide="trending-up"></i> +5% this week</div>
              </div>
            </div>
            <div class="stat-card" style="cursor:default">
              <div class="stat-icon green"><i data-lucide="check-circle"></i></div>
              <div class="stat-body">
                <div class="stat-label">Tasks Completed</div>
                <div class="stat-value">12/18</div>
                <div class="stat-delta up"><i data-lucide="trending-up"></i> 67% done</div>
              </div>
            </div>
            <div class="stat-card" style="cursor:default">
              <div class="stat-icon purple"><i data-lucide="clipboard-check"></i></div>
              <div class="stat-body">
                <div class="stat-label">Assignments Done</div>
                <div class="stat-value">5/16</div>
                <div class="stat-delta down"><i data-lucide="clock"></i> 11 pending</div>
              </div>
            </div>
            <div class="stat-card" style="cursor:default">
              <div class="stat-icon orange"><i data-lucide="clock"></i></div>
              <div class="stat-body">
                <div class="stat-label">Hours Studied</div>
                <div class="stat-value">24h</div>
                <div class="stat-delta up"><i data-lucide="target"></i> Goal: 30h/week</div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <div class="card-header-left">
                <div class="card-icon blue"><i data-lucide="bar-chart-2"></i></div>
                <h2 class="card-title">Progress Over Time</h2>
              </div>
              <div class="segmented" id="progressChartTabs" role="tablist">
                <button type="button" class="active" data-range="7days">7 Days</button>
                <button type="button" data-range="30days">30 Days</button>
                <button type="button" data-range="month">Month</button>
              </div>
            </div>
            <div id="progressChart">
              <div class="bar-chart">
                <div class="bar-col">
                  <div class="bar-val">45%</div>
                  <div class="bar" style="height:45%;background:#93C5FD"></div>
                  <div class="bar-label">Sep 9</div>
                </div>
                <div class="bar-col">
                  <div class="bar-val">52%</div>
                  <div class="bar" style="height:52%;background:#93C5FD"></div>
                  <div class="bar-label">Sep 10</div>
                </div>
                <div class="bar-col">
                  <div class="bar-val">48%</div>
                  <div class="bar" style="height:48%;background:#93C5FD"></div>
                  <div class="bar-label">Sep 11</div>
                </div>
                <div class="bar-col">
                  <div class="bar-val">58%</div>
                  <div class="bar" style="height:58%;background:#60A5FA"></div>
                  <div class="bar-label">Sep 12</div>
                </div>
                <div class="bar-col">
                  <div class="bar-val">62%</div>
                  <div class="bar" style="height:62%;background:#3B82F6"></div>
                  <div class="bar-label">Sep 13</div>
                </div>
                <div class="bar-col">
                  <div class="bar-val">65%</div>
                  <div class="bar" style="height:65%;background:#2563EB"></div>
                  <div class="bar-label">Sep 14</div>
                </div>
                <div class="bar-col">
                  <div class="bar-val">68%</div>
                  <div class="bar" style="height:68%;background:#1D4ED8"></div>
                  <div class="bar-label">Sep 15</div>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <div class="card-header-left">
                <div class="card-icon purple"><i data-lucide="book-open"></i></div>
                <h2 class="card-title">Subject Progress</h2>
              </div>
            </div>
            <div class="table-wrap">
              <table class="data-table" id="subjectProgressTable">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Progress</th>
                    <th>Assignments</th>
                    <th>Completed</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr data-subject-id="subj_eng">
                    <td>
                      <div class="cell-title">
                        <div class="cell-icon" style="background:#EDE9FE;color:#7C3AED"><i data-lucide="book-open"></i></div>
                        <div><div class="title">English</div></div>
                      </div>
                    </td>
                    <td>
                      <div class="progress-row">
                        <div class="progress-bar"><div class="fill english" style="width:80%"></div></div>
                        <span class="progress-pct">80%</span>
                      </div>
                    </td>
                    <td>3</td>
                    <td>3</td>
                    <td><span class="badge badge-completed">On Track</span></td>
                  </tr>
                  <tr data-subject-id="subj_math">
                    <td>
                      <div class="cell-title">
                        <div class="cell-icon" style="background:#DBEAFE;color:#2563EB"><i data-lucide="calculator"></i></div>
                        <div><div class="title">Mathematics</div></div>
                      </div>
                    </td>
                    <td>
                      <div class="progress-row">
                        <div class="progress-bar"><div class="fill math" style="width:75%"></div></div>
                        <span class="progress-pct">75%</span>
                      </div>
                    </td>
                    <td>5</td>
                    <td>4</td>
                    <td><span class="badge badge-completed">On Track</span></td>
                  </tr>
                  <tr data-subject-id="subj_fil">
                    <td>
                      <div class="cell-title">
                        <div class="cell-icon" style="background:#CCFBF1;color:#0D9488"><i data-lucide="languages"></i></div>
                        <div><div class="title">Filipino</div></div>
                      </div>
                    </td>
                    <td>
                      <div class="progress-row">
                        <div class="progress-bar"><div class="fill filipino" style="width:70%"></div></div>
                        <span class="progress-pct">70%</span>
                      </div>
                    </td>
                    <td>2</td>
                    <td>1</td>
                    <td><span class="badge badge-upcoming">In Progress</span></td>
                  </tr>
                  <tr data-subject-id="subj_cs">
                    <td>
                      <div class="cell-title">
                        <div class="cell-icon" style="background:#FFEDD5;color:#EA580C"><i data-lucide="code-2"></i></div>
                        <div><div class="title">Computer Science</div></div>
                      </div>
                    </td>
                    <td>
                      <div class="progress-row">
                        <div class="progress-bar"><div class="fill cs" style="width:60%"></div></div>
                        <span class="progress-pct">60%</span>
                      </div>
                    </td>
                    <td>4</td>
                    <td>2</td>
                    <td><span class="badge badge-upcoming">In Progress</span></td>
                  </tr>
                  <tr data-subject-id="subj_sci">
                    <td>
                      <div class="cell-title">
                        <div class="cell-icon" style="background:#DCFCE7;color:#16A34A"><i data-lucide="flask-conical"></i></div>
                        <div><div class="title">Science</div></div>
                      </div>
                    </td>
                    <td>
                      <div class="progress-row">
                        <div class="progress-bar"><div class="fill science" style="width:50%"></div></div>
                        <span class="progress-pct">50%</span>
                      </div>
                    </td>
                    <td>4</td>
                    <td>2</td>
                    <td><span class="badge badge-pending">Needs Attention</span></td>
                  </tr>
                  <tr data-subject-id="subj_hist">
                    <td>
                      <div class="cell-title">
                        <div class="cell-icon" style="background:#FCE7F3;color:#E11D48"><i data-lucide="landmark"></i></div>
                        <div><div class="title">History</div></div>
                      </div>
                    </td>
                    <td>
                      <div class="progress-row">
                        <div class="progress-bar"><div class="fill history" style="width:55%"></div></div>
                        <span class="progress-pct">55%</span>
                      </div>
                    </td>
                    <td>3</td>
                    <td>1</td>
                    <td><span class="badge badge-pending">Needs Attention</span></td>
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
                <div class="card-icon blue"><i data-lucide="calendar"></i></div>
                <h2 class="card-title">Mini Calendar</h2>
              </div>
            </div>
            <div id="progressMiniCalendar"></div>
          </div>

          <div class="card" id="progressDeadlines">
            <div class="card-header">
              <div class="card-header-left">
                <div class="card-icon red"><i data-lucide="alarm-clock"></i></div>
                <h2 class="card-title">Upcoming Deadlines</h2>
              </div>
            </div>
            <div id="progressDeadlineList">
              <div class="list-item">
                <span class="dot cs"></span>
                <div class="item-meta">
                  <div class="item-title">Python Mini Project</div>
                  <div class="item-sub">Overdue · Sep 10</div>
                </div>
              </div>
              <div class="list-item">
                <span class="dot math"></span>
                <div class="item-meta">
                  <div class="item-title">Algebra Homework Set 3</div>
                  <div class="item-sub">Due Sep 12</div>
                </div>
              </div>
              <div class="list-item">
                <span class="dot filipino"></span>
                <div class="item-meta">
                  <div class="item-title">Tula Analysis</div>
                  <div class="item-sub">Due Sep 16</div>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <div class="card-header-left">
                <div class="card-icon green"><i data-lucide="target"></i></div>
                <h2 class="card-title">Study Goals</h2>
              </div>
            </div>
            <div id="studyGoalsDonut">
              <div class="donut-wrap">
                <div class="donut">
                  <svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="36" fill="none" stroke="#E2E8F0" stroke-width="10"/><circle cx="50" cy="50" r="36" fill="none" stroke="#16A34A" stroke-width="10" stroke-dasharray="226.2" stroke-dashoffset="45.2" stroke-linecap="round"/></svg>
                  <div class="center-label">80%<small>Goal</small></div>
                </div>
                <div class="donut-legend">
                  <div class="donut-legend-row">
                    <div class="lbl"><span>Hours Studied</span><span>24/30</span></div>
                    <div class="progress-bar"><div class="fill green" style="width:80%"></div></div>
                  </div>
                  <div class="donut-legend-row">
                    <div class="lbl"><span>Weekly Target</span><span>30 hrs</span></div>
                    <div class="progress-bar"><div class="fill blue" style="width:80%"></div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="tip-card">
            <div class="tip-icon"><i data-lucide="trending-up"></i></div>
            <p>"Consistency beats intensity. Studying 30 minutes daily is more effective than cramming once a week."</p>
            <div class="tip-footer">
              <i data-lucide="sparkles"></i> Progress Tip · Keep it up!
            </div>
          </div>
        </aside>
      </div>
    </div>
  </div>

  <script src="../js/data.js"></script>
  <script src="../js/auth.js"></script>
  <script src="../js/sidebar.js"></script>
  <script src="../js/google-integration.js"></script>
  <script src="../js/progress.js"></script>
</body>
</html>

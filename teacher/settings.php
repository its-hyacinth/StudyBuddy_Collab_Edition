<?php
$expectedRole = 'teacher';
require_once __DIR__ . '/../includes/page_guard.php';

// ---------------------------------------------------------------------
// Database settings (match your XAMPP / phpMyAdmin)
// ---------------------------------------------------------------------
$DB = ['host' => 'localhost', 'name' => 'Studybuddy', 'user' => 'root', 'pass' => ''];

// name + email live in the `users` table
$USER_COLS = ['fullName' => 'full_name', 'email' => 'email'];
// everything else is stored as JSON in `app_state` (state_key = 'teacher_profile')
$EXTRA_FIELDS = ['employeeId', 'phone', 'school', 'department'];
$EXTRA_KEY    = 'teacher_profile';

// Logged-in user id (tries the common session keys)
$userId = $_SESSION['user_id'] ?? ($_SESSION['user']['id'] ?? ($_SESSION['id'] ?? null));

// Connect (never fatal: the page still loads and shows what went wrong)
$pdo = null;
$dbError = null;
try {
  $pdo = new PDO(
    "mysql:host={$DB['host']};dbname={$DB['name']};charset=utf8mb4",
    $DB['user'], $DB['pass'],
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
  );
} catch (PDOException $e) {
  $dbError = 'Database connection failed: ' . $e->getMessage();
}

// ---------------------------------------------------------------
// 1) Save handler: JS posts JSON back to this same page
// ---------------------------------------------------------------
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_SERVER['HTTP_X_PROFILE_SAVE'] ?? '') === '1') {
  header('Content-Type: application/json');
  $fail = function (int $code, string $msg) {
    http_response_code($code);
    echo json_encode(['success' => false, 'message' => $msg]);
    exit;
  };

  if (!$pdo)    $fail(500, $dbError ?: 'Database not connected');
  if (!$userId) $fail(401, 'Not logged in (no user id in session)');
  if (!hash_equals($_SESSION['csrf_token'] ?? '', $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '')) $fail(403, 'Invalid CSRF token');

  $in = json_decode(file_get_contents('php://input'), true);
  if (!is_array($in)) $fail(400, 'Invalid request');

  $sets = []; $vals = []; $extra = []; $clean = [];
  foreach (array_merge(array_keys($USER_COLS), $EXTRA_FIELDS) as $key) {
    if (!array_key_exists($key, $in)) continue;
    $v = trim((string)$in[$key]);
    if (mb_strlen($v) > 255) $fail(422, "$key is too long");
    if ($key === 'fullName' && $v === '') $fail(422, 'Full name is required');
    if ($key === 'email' && !filter_var($v, FILTER_VALIDATE_EMAIL)) $fail(422, 'Invalid email');
    if (isset($USER_COLS[$key])) { $sets[] = "`{$USER_COLS[$key]}` = ?"; $vals[] = $v; }
    else { $extra[$key] = $v; }
    $clean[$key] = $v;
  }
  if (!$clean) $fail(422, 'Nothing to update');

  try {
    $pdo->beginTransaction();

    if ($sets) {
      $vals[] = $userId;
      $pdo->prepare('UPDATE users SET ' . implode(', ', $sets) . ' WHERE id = ?')->execute($vals);
    }

    if ($extra) {
      $q = $pdo->prepare('SELECT state_value FROM app_state WHERE user_id = ? AND state_key = ?');
      $q->execute([$userId, $EXTRA_KEY]);
      $current = json_decode((string)$q->fetchColumn(), true);
      $merged = array_merge(is_array($current) ? $current : [], $extra);
      $pdo->prepare(
        'INSERT INTO app_state (user_id, state_key, state_value) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE state_value = VALUES(state_value)'
      )->execute([$userId, $EXTRA_KEY, json_encode($merged, JSON_UNESCAPED_UNICODE)]);
    }

    $pdo->commit();
  } catch (PDOException $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    if ($e->getCode() === '23000') $fail(409, 'That email is already in use');
    error_log($e->getMessage());
    $fail(500, 'Database error: ' . $e->getMessage()); // remove the detail once it works
  }

  // Keep other PHP-rendered pages in sync
  if (isset($clean['fullName'])) { $_SESSION['name'] = $clean['fullName']; $_SESSION['user']['name'] = $clean['fullName']; }
  if (isset($clean['email']))    { $_SESSION['email'] = $clean['email'];   $_SESSION['user']['email'] = $clean['email']; }

  echo json_encode(['success' => true]);
  exit;
}

// ---------------------------------------------------------------
// 2) Load the current values for display
// ---------------------------------------------------------------
$user = array_fill_keys(array_merge(array_keys($USER_COLS), $EXTRA_FIELDS), '');
$user['fullName'] = $_SESSION['name'] ?? ($_SESSION['user']['name'] ?? '');
$user['email']    = $_SESSION['email'] ?? ($_SESSION['user']['email'] ?? '');

if ($pdo && $userId) {
  try {
    $q = $pdo->prepare('SELECT full_name, email FROM users WHERE id = ?');
    $q->execute([$userId]);
    if ($row = $q->fetch()) {
      $user['fullName'] = (string)$row['full_name'];
      $user['email']    = (string)$row['email'];
    }

    $q = $pdo->prepare('SELECT state_value FROM app_state WHERE user_id = ? AND state_key = ?');
    $q->execute([$userId, $EXTRA_KEY]);
    $saved = json_decode((string)$q->fetchColumn(), true);
    if (is_array($saved)) {
      foreach ($EXTRA_FIELDS as $f) if (isset($saved[$f])) $user[$f] = (string)$saved[$f];
    }
  } catch (PDOException $e) {
    $dbError = 'Could not load profile: ' . $e->getMessage();
  }
} elseif ($pdo && !$userId) {
  $dbError = 'No user id found in the session (tried user_id, user.id, id).';
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta name="csrf-token" content="<?= e($_SESSION['csrf_token']) ?>">
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>StudyBuddy — Settings</title>
  <link rel="stylesheet" href="../css/style.css" />
  <link rel="stylesheet" href="../css/components.css" />
  <link rel="stylesheet" href="../css/pages.css" />
  <script src="https://unpkg.com/lucide@latest"></script>
  <script>window.SB_USER = <?= json_encode($user, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT) ?>;</script>
</head>
<body data-role="teacher">
  <div class="app-shell" id="appShell">
    <div class="page-content">
      <div class="page-header">
        <div>
          <h1 class="page-title">
            <span class="title-icon"><i data-lucide="settings"></i></span>
            Settings
          </h1>
          <p class="page-subtitle">Manage your profile, notifications, and connected accounts.</p>
        </div>
      </div>

      <?php if ($dbError): ?>
        <div class="card" style="border:1px solid var(--danger);color:var(--danger);margin-bottom:16px;">
          <?= e($dbError) ?>
        </div>
      <?php endif; ?>

      <div class="settings-layout">
        <nav class="settings-nav" id="settingsNav">
          <button type="button" class="active" data-panel="profile"><i data-lucide="user"></i> Profile</button>
          <button type="button" data-panel="notifications"><i data-lucide="bell"></i> Notifications</button>
          <button type="button" data-panel="appearance"><i data-lucide="palette"></i> Appearance</button>
          <button type="button" data-panel="connected"><i data-lucide="link"></i> Connected Accounts</button>
          <button type="button" data-panel="security"><i data-lucide="shield"></i> Security</button>
        </nav>

        <div class="page-main">
          <!-- Profile Panel -->
          <div class="settings-panel active" id="panel-profile">
            <div class="card">
              <div class="verified-banner" id="verifiedBanner">
                <i data-lucide="badge-check"></i>
                Your account is verified
              </div>
              <div class="card-header">
                <div class="card-header-left">
                  <div class="card-icon blue"><i data-lucide="user"></i></div>
                  <h2 class="card-title">Teacher Profile</h2>
                </div>
              </div>
              <form id="profileForm">
                <div class="form-row">
                  <div class="form-group">
                    <label for="profileFullName">Full Name</label>
                    <input class="form-control" type="text" id="profileFullName" value="<?= e($user['fullName']) ?>" />
                  </div>
                  <div class="form-group">
                    <label for="profileEmail">Email</label>
                    <input class="form-control" type="email" id="profileEmail" value="<?= e($user['email']) ?>" />
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label for="profileEmployeeId">Employee ID</label>
                    <input class="form-control" type="text" id="profileEmployeeId" value="<?= e($user['employeeId']) ?>" />
                  </div>
                  <div class="form-group">
                    <label for="profilePhone">Phone</label>
                    <input class="form-control" type="tel" id="profilePhone" value="<?= e($user['phone']) ?>" />
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label for="profileSchool">School</label>
                    <input class="form-control" type="text" id="profileSchool" value="<?= e($user['school']) ?>" />
                  </div>
                  <div class="form-group">
                    <label for="profileDepartment">Department</label>
                    <input class="form-control" type="text" id="profileDepartment" value="<?= e($user['department']) ?>" />
                  </div>
                </div>
                <div style="display:flex;justify-content:flex-end;margin-top:8px;">
                  <button type="submit" class="btn btn-primary" id="saveProfileBtn">Save Changes</button>
                </div>
              </form>
            </div>
          </div>

          <!-- Notifications Panel -->
          <div class="settings-panel" id="panel-notifications">
            <div class="card">
              <div class="card-header">
                <div class="card-header-left">
                  <div class="card-icon green"><i data-lucide="bell"></i></div>
                  <h2 class="card-title">Notification Preferences</h2>
                </div>
              </div>
              <div id="notificationSettings">
                <div class="settings-row">
                  <div>
                    <div class="row-label">Email Notifications</div>
                    <div class="row-value">Receive updates via email</div>
                  </div>
                  <label class="toggle-switch">
                    <input type="checkbox" id="notifEmail" checked />
                    <span class="slider"></span>
                  </label>
                </div>
                <div class="settings-row">
                  <div>
                    <div class="row-label">Push Notifications</div>
                    <div class="row-value">Browser push alerts</div>
                  </div>
                  <label class="toggle-switch">
                    <input type="checkbox" id="notifPush" checked />
                    <span class="slider"></span>
                  </label>
                </div>
                <div class="settings-row">
                  <div>
                    <div class="row-label">Assignment Deadlines</div>
                    <div class="row-value">Alerts for upcoming and overdue submissions</div>
                  </div>
                  <label class="toggle-switch">
                    <input type="checkbox" id="notifDeadlines" checked />
                    <span class="slider"></span>
                  </label>
                </div>
                <div class="settings-row">
                  <div>
                    <div class="row-label">Student Messages</div>
                    <div class="row-value">Notify when students send messages</div>
                  </div>
                  <label class="toggle-switch">
                    <input type="checkbox" id="notifMessages" checked />
                    <span class="slider"></span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- Appearance Panel -->
          <div class="settings-panel" id="panel-appearance">
            <div class="card">
              <div class="card-header">
                <div class="card-header-left">
                  <div class="card-icon purple"><i data-lucide="palette"></i></div>
                  <h2 class="card-title">Appearance</h2>
                </div>
              </div>
              <div id="appearanceSettings">
                <div class="settings-row">
                  <div>
                    <div class="row-label">Theme</div>
                    <div class="row-value">Choose your preferred color scheme</div>
                  </div>
                  <select id="themeSelect" class="form-control" style="width:auto;height:38px;">
                    <option value="light" selected>Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System</option>
                  </select>
                </div>
                <div class="settings-row">
                  <div>
                    <div class="row-label">Compact Mode</div>
                    <div class="row-value">Reduce spacing for more content</div>
                  </div>
                  <label class="toggle-switch">
                    <input type="checkbox" id="compactMode" />
                    <span class="slider"></span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- Connected Accounts Panel -->
          <div class="settings-panel" id="panel-connected">
            <div class="card">
              <div class="card-header">
                <div class="card-header-left">
                  <div class="card-icon blue"><i data-lucide="link"></i></div>
                  <h2 class="card-title">Connected Accounts</h2>
                </div>
              </div>
              <div id="connectedAccounts">
                <div class="connected-row" id="googleClassroomRow">
                  <div class="conn-icon">
                    <i data-lucide="school"></i>
                  </div>
                  <div class="conn-info">
                    <h4>Google Classroom</h4>
                    <p id="classroomConnectStatus">Not connected — import classes, roster, and coursework</p>
                  </div>
                  <button type="button" class="btn btn-outline btn-sm" id="connectGoogleClassroom">
                    Connect
                  </button>
                </div>
                <div class="connected-row" id="googleCalendarRow">
                  <div class="conn-icon">
                    <i data-lucide="calendar"></i>
                  </div>
                  <div class="conn-info">
                    <h4>Google Calendar</h4>
                    <p id="googleCalStatus">Not connected — sync your class schedule</p>
                  </div>
                  <button type="button" class="btn btn-outline btn-sm" id="connectGoogleCalendar">
                    Connect
                  </button>
                </div>
                <div class="connected-row" id="googleDriveRow">
                  <div class="conn-icon">
                    <i data-lucide="hard-drive"></i>
                  </div>
                  <div class="conn-info">
                    <h4>Google Drive</h4>
                    <p id="googleDriveStatus">Not connected — access shared files and resources</p>
                  </div>
                  <button type="button" class="btn btn-outline btn-sm" id="connectGoogleDrive">
                    Connect
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Security Panel -->
          <div class="settings-panel" id="panel-security">
            <div class="card">
              <div class="card-header">
                <div class="card-header-left">
                  <div class="card-icon red"><i data-lucide="shield"></i></div>
                  <h2 class="card-title">Security</h2>
                </div>
              </div>
              <form id="passwordForm">
                <div class="form-group">
                  <label for="currentPassword">Current Password</label>
                  <input class="form-control" type="password" id="currentPassword" placeholder="Enter current password" />
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label for="newPassword">New Password</label>
                    <input class="form-control" type="password" id="newPassword" placeholder="New password" />
                  </div>
                  <div class="form-group">
                    <label for="confirmPassword">Confirm Password</label>
                    <input class="form-control" type="password" id="confirmPassword" placeholder="Confirm new password" />
                  </div>
                </div>
                <div style="display:flex;justify-content:flex-end;">
                  <button type="submit" class="btn btn-primary" id="changePasswordBtn">Update Password</button>
                </div>
              </form>
              <div style="margin-top:24px;padding-top:24px;border-top:1px solid var(--border);">
                <div class="settings-row" style="border:none;padding:0;">
                  <div>
                    <div class="row-label" style="color:var(--danger)">Delete Account</div>
                    <div class="row-value">Permanently remove your account and all data</div>
                  </div>
                  <button type="button" class="btn btn-danger btn-sm" id="deleteAccountBtn">Delete Account</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside class="page-aside">
          <div class="card">
            <div style="text-align:center;padding:12px 0;">
              <div class="avatar" id="settingsAvatar" style="width:72px;height:72px;border-radius:50%;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:24px;margin:0 auto 12px;">JD</div>
              <h3 id="settingsDisplayName" style="font-size:16px;margin-bottom:4px;"><?= e($user['fullName']) ?></h3>
              <p style="font-size:12.5px;color:var(--text-muted);margin-bottom:8px;" id="settingsDisplayEmail"><?= e($user['email']) ?></p>
              <span class="badge badge-verified"><i data-lucide="badge-check"></i> Verified Teacher</span>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <div class="card-header-left">
                <div class="card-icon blue"><i data-lucide="info"></i></div>
                <h2 class="card-title">Account Info</h2>
              </div>
            </div>
            <div id="accountInfo">
              <div class="settings-row" style="cursor:default;">
                <div>
                  <div class="row-label">Employee ID</div>
                  <div class="row-value" id="infoEmployeeId"><?= e($user['employeeId']) ?></div>
                </div>
              </div>
              <div class="settings-row" style="cursor:default;">
                <div>
                  <div class="row-label">Department</div>
                  <div class="row-value" id="infoDepartment"><?= e($user['department']) ?></div>
                </div>
              </div>
              <div class="settings-row" style="cursor:default;border:none;">
                <div>
                  <div class="row-label">Member Since</div>
                  <div class="row-value">August 2019</div>
                </div>
              </div>
            </div>
          </div>

          <div class="tip-card">
            <div class="tip-icon"><i data-lucide="lightbulb"></i></div>
            <p>"Connect Google Calendar to keep your class schedule synced across all your devices automatically."</p>
            <div class="tip-footer"><i data-lucide="sparkles"></i> Settings tip</div>
          </div>
        </aside>
      </div>
    </div>
  </div>

  <script src="../js/data.js"></script>
  <script src="../js/auth.js"></script>
  <script src="../js/sidebar.js"></script>
  <script src="../js/google-integration.js"></script>
  <script src="../js/settings.js"></script>
</body>
</html>
<?php
$expectedRole = 'teacher';
require_once __DIR__ . '/../includes/page_guard.php';
require_once __DIR__ . '/../config/database.php';

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
  $pdo = db();
} catch (PDOException $e) {
  $dbError = 'Database connection failed.';
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
    if (isset($USER_COLS[$key])) { $sets[] = "{$USER_COLS[$key]} = ?"; $vals[] = $v; }
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
    if (sb_is_duplicate($e)) $fail(409, 'That email is already in use');
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
  <script defer src="https://unpkg.com/lucide@latest"></script>
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
              <div id="profileRows">
                <div class="settings-row" data-field="fullName">
                  <div>
                    <div class="row-label">Full Name</div>
                    <div class="row-value" id="profileFullName"><?= e($user['fullName'] ?: '—') ?></div>
                  </div>
                  <i data-lucide="chevron-right" class="chevron"></i>
                </div>
                <div class="settings-row" data-field="email">
                  <div>
                    <div class="row-label">Email</div>
                    <div class="row-value" id="profileEmail"><?= e($user['email'] ?: '—') ?></div>
                  </div>
                  <i data-lucide="chevron-right" class="chevron"></i>
                </div>
                <div class="settings-row" data-field="employeeId">
                  <div>
                    <div class="row-label">Employee ID</div>
                    <div class="row-value" id="profileEmployeeId"><?= e($user['employeeId'] ?: '—') ?></div>
                  </div>
                  <i data-lucide="chevron-right" class="chevron"></i>
                </div>
                <div class="settings-row" data-field="phone">
                  <div>
                    <div class="row-label">Phone</div>
                    <div class="row-value" id="profilePhone"><?= e($user['phone'] ?: '—') ?></div>
                  </div>
                  <i data-lucide="chevron-right" class="chevron"></i>
                </div>
                <div class="settings-row" data-field="school">
                  <div>
                    <div class="row-label">School</div>
                    <div class="row-value" id="profileSchool"><?= e($user['school'] ?: '—') ?></div>
                  </div>
                  <i data-lucide="chevron-right" class="chevron"></i>
                </div>
                <div class="settings-row" data-field="department">
                  <div>
                    <div class="row-label">Department</div>
                    <div class="row-value" id="profileDepartment"><?= e($user['department'] ?: '—') ?></div>
                  </div>
                  <i data-lucide="chevron-right" class="chevron"></i>
                </div>
                <div class="settings-row" data-field="password">
                  <div>
                    <div class="row-label">Password</div>
                    <div class="row-value">••••••••</div>
                  </div>
                  <i data-lucide="chevron-right" class="chevron"></i>
                </div>
              </div>
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
                <div class="connected-row">
                  <div class="conn-icon"><i data-lucide="refresh-cw"></i></div>
                  <div class="conn-info">
                    <h4>Sync Classroom</h4>
                    <p id="googleSetupNote">Checking the Google connection…</p>
                  </div>
                  <button type="button" class="btn btn-outline btn-sm" id="syncClassroomSettingsBtn">Sync now</button>
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
              <div class="settings-row" style="cursor:default;">
                <div>
                  <div class="row-label">Password</div>
                  <div class="row-value">Update your account password</div>
                </div>
                <button type="button" class="btn btn-primary btn-sm" id="changePasswordOptionBtn">Change Password</button>
              </div>
              <?php require __DIR__ . '/../includes/authenticator_panel.php'; ?>
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
                  <div class="row-value" id="infoEmployeeId"><?= e($user['employeeId'] ?: '—') ?></div>
                </div>
              </div>
              <div class="settings-row" style="cursor:default;">
                <div>
                  <div class="row-label">Phone</div>
                  <div class="row-value" id="infoPhone"><?= e($user['phone'] ?: '—') ?></div>
                </div>
              </div>
              <div class="settings-row" style="cursor:default;">
                <div>
                  <div class="row-label">School</div>
                  <div class="row-value" id="infoSchool"><?= e($user['school'] ?: '—') ?></div>
                </div>
              </div>
              <div class="settings-row" style="cursor:default;">
                <div>
                  <div class="row-label">Department</div>
                  <div class="row-value" id="infoDepartment"><?= e($user['department'] ?: '—') ?></div>
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

  <div class="modal-backdrop" id="editProfileModal">
    <div class="modal" role="dialog" aria-labelledby="editProfileTitle">
      <div class="modal-header">
        <h3 id="editProfileTitle">Edit Profile</h3>
        <button type="button" class="modal-close" data-close-modal="editProfileModal" aria-label="Close">
          <i data-lucide="x"></i>
        </button>
      </div>
      <form id="editProfileForm">
        <div class="modal-body">
          <input type="hidden" id="editField" name="field" />
          <div class="form-group">
            <label for="editValue" id="editFieldLabel">Value</label>
            <input type="text" class="form-control" id="editValue" name="value" required />
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-ghost" data-close-modal="editProfileModal">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Changes</button>
        </div>
      </form>
    </div>
  </div>

  <div class="modal-backdrop" id="changePasswordModal">
    <div class="modal" role="dialog" aria-labelledby="changePasswordTitle">
      <div class="modal-header">
        <h3 id="changePasswordTitle">Change Password</h3>
        <button type="button" class="modal-close" data-close-modal="changePasswordModal" aria-label="Close">
          <i data-lucide="x"></i>
        </button>
      </div>
      <form id="changePasswordForm">
        <div class="modal-body">
          <div class="form-group">
            <label for="currentPassword">Current password</label>
            <div class="input-icon-wrap has-password-toggle">
              <i data-lucide="lock" class="input-icon"></i>
              <input type="password" class="form-control" id="currentPassword" autocomplete="current-password" required />
              <button type="button" class="input-action" id="toggleCurrentPassword" aria-label="Show current password" aria-controls="currentPassword" aria-pressed="false">
                <i data-lucide="eye"></i>
              </button>
            </div>
          </div>
          <div class="form-group">
            <label for="newPassword">New password</label>
            <div class="input-icon-wrap has-password-toggle">
              <i data-lucide="lock" class="input-icon"></i>
              <input type="password" class="form-control" id="newPassword" autocomplete="new-password" minlength="8" required />
              <button type="button" class="input-action" id="toggleNewPassword" aria-label="Show new password" aria-controls="newPassword" aria-pressed="false">
                <i data-lucide="eye"></i>
              </button>
            </div>
          </div>
          <div class="form-group">
            <label for="confirmPassword">Confirm new password</label>
            <div class="input-icon-wrap has-password-toggle">
              <i data-lucide="lock" class="input-icon"></i>
              <input type="password" class="form-control" id="confirmPassword" autocomplete="new-password" minlength="8" required />
              <button type="button" class="input-action" id="toggleConfirmPassword" aria-label="Show confirm password" aria-controls="confirmPassword" aria-pressed="false">
                <i data-lucide="eye"></i>
              </button>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-ghost" data-close-modal="changePasswordModal">Cancel</button>
          <button type="submit" class="btn btn-primary">Update Password</button>
        </div>
      </form>
    </div>
  </div>

  <div class="modal-backdrop" id="deleteAccountModal">
    <div class="modal" role="dialog" aria-labelledby="deleteAccountTitle">
      <div class="modal-header">
        <h3 id="deleteAccountTitle">Delete Account</h3>
        <button type="button" class="modal-close" data-close-modal="deleteAccountModal" aria-label="Close"><i data-lucide="x"></i></button>
      </div>
      <form id="deleteAccountForm">
        <div class="modal-body">
          <p>This permanently deletes your account and StudyBuddy data. This cannot be undone.</p>
          <div class="form-group">
            <label for="deleteAccountPassword">Current password</label>
            <div class="input-icon-wrap has-password-toggle">
              <i data-lucide="lock" class="input-icon"></i>
              <input type="password" class="form-control" id="deleteAccountPassword" autocomplete="current-password" />
              <button type="button" class="input-action" id="toggleDeleteAccountPassword" aria-label="Show current password" aria-controls="deleteAccountPassword" aria-pressed="false">
                <i data-lucide="eye"></i>
              </button>
            </div>
          </div>
          <div class="form-group">
            <label for="deleteAccountCode">Authenticator or backup code, if enabled</label>
            <input type="text" class="form-control" id="deleteAccountCode" autocomplete="one-time-code" />
          </div>
          <div class="form-group">
            <label for="deleteAccountConfirmation">Type DELETE to confirm</label>
            <input type="text" class="form-control" id="deleteAccountConfirmation" autocomplete="off" required />
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-ghost" data-close-modal="deleteAccountModal">Cancel</button>
          <button type="submit" class="btn btn-danger">Delete Account</button>
        </div>
      </form>
    </div>
  </div>

  <script src="../js/data.js"></script>
  <script src="../js/auth.js"></script>
  <script src="../js/authenticator.js"></script>
  <script src="../js/sidebar.js"></script>
  <script src="../js/google-integration.js"></script>
  <script src="../js/settings.js"></script>
</body>
</html>
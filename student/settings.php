<?php
$expectedRole = 'student';
require_once __DIR__ . '/../includes/page_guard.php';
require_once __DIR__ . '/../config/database.php';

$studentUserId = (int)($_SESSION['user']['id'] ?? 0);
$studentProfileFields = ['studentId', 'phone', 'school', 'course', 'yearLevel'];

if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_SERVER['HTTP_X_PROFILE_SAVE'] ?? '') === '1') {
  header('Content-Type: application/json; charset=utf-8');
  verify_csrf();
  $input = json_decode(file_get_contents('php://input'), true);
  if (!is_array($input) || !$input) json_response(['success' => false, 'message' => 'No profile changes were submitted.'], 400);

  $name = array_key_exists('fullName', $input) ? trim((string)$input['fullName']) : null;
  $email = array_key_exists('email', $input) ? strtolower(trim((string)$input['email'])) : null;
  if ($name !== null && ($name === '' || mb_strlen($name) > 120)) json_response(['success' => false, 'message' => 'Enter a name of 1–120 characters.'], 422);
  if ($email !== null && (!filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 190)) json_response(['success' => false, 'message' => 'Enter a valid email address.'], 422);

  $extras = [];
  foreach ($studentProfileFields as $field) {
    if (!array_key_exists($field, $input)) continue;
    $value = trim((string)$input[$field]);
    if (mb_strlen($value) > 255) json_response(['success' => false, 'message' => 'Profile values must be 255 characters or fewer.'], 422);
    $extras[$field] = $value;
  }
  if ($name === null && $email === null && !$extras) json_response(['success' => false, 'message' => 'No supported profile fields were submitted.'], 422);

  $pdo = db();
  try {
    $pdo->beginTransaction();
    if ($name !== null || $email !== null) {
      $sets = [];
      $values = [];
      if ($name !== null) { $sets[] = 'full_name = ?'; $values[] = $name; }
      if ($email !== null) { $sets[] = 'email = ?'; $values[] = $email; }
      $values[] = $studentUserId;
      $pdo->prepare('UPDATE users SET ' . implode(', ', $sets) . ' WHERE id = ?')->execute($values);
    }
    if ($extras) {
      $statement = $pdo->prepare('SELECT state_value FROM app_state WHERE user_id = ? AND state_key = ?');
      $statement->execute([$studentUserId, 'student_profile']);
      $existing = json_decode((string)$statement->fetchColumn(), true);
      $profile = array_merge(is_array($existing) ? $existing : [], $extras);
      $pdo->prepare(
        'INSERT INTO app_state (user_id, state_key, state_value) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE state_value = VALUES(state_value)'
      )->execute([$studentUserId, 'student_profile', json_encode($profile, JSON_UNESCAPED_UNICODE)]);
    }
    $pdo->commit();
  } catch (PDOException $error) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    if (sb_is_duplicate($error)) json_response(['success' => false, 'message' => 'That email address is already in use.'], 409);
    error_log($error->getMessage());
    json_response(['success' => false, 'message' => 'Profile could not be saved. Please try again.'], 500);
  }

  if ($name !== null) $_SESSION['user']['name'] = $name;
  if ($email !== null) $_SESSION['user']['email'] = $email;
  json_response(['success' => true]);
}

$pdo = db();
$studentProfile = [
  'fullName' => (string)($_SESSION['user']['name'] ?? ''),
  'email' => (string)($_SESSION['user']['email'] ?? ''),
];
$statement = $pdo->prepare('SELECT full_name, email FROM users WHERE id = ?');
$statement->execute([$studentUserId]);
if ($row = $statement->fetch()) {
  $studentProfile['fullName'] = (string)$row['full_name'];
  $studentProfile['email'] = (string)$row['email'];
}
$statement = $pdo->prepare('SELECT state_value FROM app_state WHERE user_id = ? AND state_key = ?');
$statement->execute([$studentUserId, 'student_profile']);
$savedStudentProfile = json_decode((string)$statement->fetchColumn(), true);
if (is_array($savedStudentProfile)) $studentProfile = array_merge($studentProfile, $savedStudentProfile);
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
  <link rel="stylesheet" href="../css/student.css" />
  <script src="https://unpkg.com/lucide@latest"></script>
</head>
<body class="student-app">
  <div class="app-shell" id="appShell">
    <div class="page-content">
      <div class="page-header">
        <div>
          <h1 class="page-title">
            <span class="title-icon"><i data-lucide="settings"></i></span>
            Settings
          </h1>
          <p class="page-subtitle">Manage your account, preferences, and connected services.</p>
        </div>
      </div>

      <div class="settings-layout">
        <nav class="settings-nav" id="settingsNav" role="tablist">
          <button type="button" class="active" data-panel="account" role="tab">
            <i data-lucide="user"></i> Account
          </button>
          <button type="button" data-panel="notifications" role="tab">
            <i data-lucide="bell"></i> Notifications
          </button>
          <button type="button" data-panel="appearance" role="tab">
            <i data-lucide="palette"></i> Appearance
          </button>
          <button type="button" data-panel="privacy" role="tab">
            <i data-lucide="shield"></i> Privacy
          </button>
          <button type="button" data-panel="connected" role="tab">
            <i data-lucide="link"></i> Connected Accounts
          </button>
          <button type="button" data-panel="data" role="tab">
            <i data-lucide="database"></i> Data &amp; Storage
          </button>
          <button type="button" data-panel="help" role="tab">
            <i data-lucide="help-circle"></i> Help
          </button>
        </nav>

        <div class="settings-panels">
          <!-- Account -->
          <div class="settings-panel active card" id="panel-account" data-panel="account" role="tabpanel">
            <div class="card-header">
              <div class="card-header-left">
                <div class="card-icon blue"><i data-lucide="user"></i></div>
                <h2 class="card-title">Account</h2>
              </div>
            </div>
            <div class="verified-banner" id="verifiedBanner">
              <i data-lucide="badge-check"></i>
              Your account is verified
            </div>
            <div id="profileRows">
              <div class="settings-row" data-field="fullName">
                <div>
                  <div class="row-label">Full Name</div>
                  <div class="row-value" id="profileFullName">Juan Dela Cruz</div>
                </div>
                <i data-lucide="chevron-right" class="chevron"></i>
              </div>
              <div class="settings-row" data-field="email">
                <div>
                  <div class="row-label">Email</div>
                  <div class="row-value" id="profileEmail">juan.delacruz@email.com</div>
                </div>
                <i data-lucide="chevron-right" class="chevron"></i>
              </div>
              <div class="settings-row" data-field="studentId">
                <div>
                  <div class="row-label">Student ID</div>
                  <div class="row-value" id="profileStudentId">—</div>
                </div>
                <i data-lucide="chevron-right" class="chevron"></i>
              </div>
              <div class="settings-row" data-field="phone">
                <div>
                  <div class="row-label">Phone</div>
                  <div class="row-value" id="profilePhone">—</div>
                </div>
                <i data-lucide="chevron-right" class="chevron"></i>
              </div>
              <div class="settings-row" data-field="school">
                <div>
                  <div class="row-label">School</div>
                  <div class="row-value" id="profileSchool">—</div>
                </div>
                <i data-lucide="chevron-right" class="chevron"></i>
              </div>
              <div class="settings-row" data-field="course">
                <div>
                  <div class="row-label">Course</div>
                  <div class="row-value" id="profileCourse">—</div>
                </div>
                <i data-lucide="chevron-right" class="chevron"></i>
              </div>
              <div class="settings-row" data-field="yearLevel">
                <div>
                  <div class="row-label">School Level</div>
                  <div class="row-value" id="profileYearLevel">—</div>
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

          <!-- Notifications -->
          <div class="settings-panel card" id="panel-notifications" data-panel="notifications" role="tabpanel">
            <div class="card-header">
              <div class="card-header-left">
                <div class="card-icon purple"><i data-lucide="bell"></i></div>
                <h2 class="card-title">Notifications</h2>
              </div>
            </div>
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
                <div class="row-label">Deadline Reminders</div>
                <div class="row-value">Alerts before assignments are due</div>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" id="notifDeadlines" checked />
                <span class="slider"></span>
              </label>
            </div>
            <div class="settings-row">
              <div>
                <div class="row-label">Message Notifications</div>
                <div class="row-value">New messages from teachers</div>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" id="notifMessages" checked />
                <span class="slider"></span>
              </label>
            </div>
          </div>

          <!-- Appearance -->
          <div class="settings-panel card" id="panel-appearance" data-panel="appearance" role="tabpanel">
            <div class="card-header">
              <div class="card-header-left">
                <div class="card-icon teal"><i data-lucide="palette"></i></div>
                <h2 class="card-title">Appearance</h2>
              </div>
            </div>
            <div class="settings-row">
              <div>
                <div class="row-label">Theme</div>
                <div class="row-value">Choose your preferred theme</div>
              </div>
              <select class="form-control" id="themeSelect" style="width:auto;height:38px">
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

          <!-- Privacy -->
          <div class="settings-panel card" id="panel-privacy" data-panel="privacy" role="tabpanel">
            <div class="card-header">
              <div class="card-header-left">
                <div class="card-icon red"><i data-lucide="shield"></i></div>
                <h2 class="card-title">Privacy</h2>
              </div>
            </div>
            <div class="settings-row">
              <div>
                <div class="row-label">Profile Visibility</div>
                <div class="row-value">Who can see your profile</div>
              </div>
              <select class="form-control" id="profileVisibility" style="width:auto;height:38px">
                <option value="classmates">Classmates Only</option>
                <option value="teachers">Teachers Only</option>
                <option value="private">Private</option>
              </select>
            </div>
            <div class="settings-row">
              <div>
                <div class="row-label">Show Progress to Teachers</div>
                <div class="row-value">Allow teachers to view your study progress</div>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" id="showProgress" checked />
                <span class="slider"></span>
              </label>
            </div>
            <div class="settings-row">
              <div>
                <div class="row-label">Activity Status</div>
                <div class="row-value">Show when you're online</div>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" id="activityStatus" checked />
                <span class="slider"></span>
              </label>
            </div>
            <?php require __DIR__ . '/../includes/authenticator_panel.php'; ?>
          </div>

          <!-- Connected Accounts -->
          <div class="settings-panel card" id="panel-connected" data-panel="connected" role="tabpanel">
            <div class="card-header">
              <div class="card-header-left">
                <div class="card-icon green"><i data-lucide="link"></i></div>
                <h2 class="card-title">Connected Accounts</h2>
              </div>
            </div>
            <div class="connected-row" id="googleClassroomConnect">
              <div class="conn-icon"><i data-lucide="school"></i></div>
              <div class="conn-info">
                <h4>Google Classroom</h4>
                <p id="classroomConnectStatus">Not connected · Import classes and coursework</p>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" id="toggleGoogleClassroom" data-service="classroom" />
                <span class="slider"></span>
              </label>
            </div>
            <div class="connected-row" id="googleCalendarConnect">
              <div class="conn-icon"><i data-lucide="calendar"></i></div>
              <div class="conn-info">
                <h4>Google Calendar</h4>
                <p id="calendarConnectStatus">Not connected · Optional schedule overlay</p>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" id="toggleGoogleCalendar" data-service="calendar" />
                <span class="slider"></span>
              </label>
            </div>
            <div class="connected-row" id="googleDriveConnect">
              <div class="conn-icon"><i data-lucide="hard-drive"></i></div>
              <div class="conn-info">
                <h4>Google Drive</h4>
                <p id="driveConnectStatus">Not connected · Access your files</p>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" id="toggleGoogleDrive" data-service="drive" />
                <span class="slider"></span>
              </label>
            </div>
            <div class="connected-row">
              <div class="conn-icon"><img src="https://www.google.com/favicon.ico" alt="Google" style="width:20px;height:20px" onerror="this.style.display='none'" /></div>
              <div class="conn-info">
                <h4>Google Account</h4>
                <p id="googleAccountEmail">Classroom uses your Google account. Teachers stay TBA until Classroom lists them.</p>
              </div>
              <button type="button" class="btn btn-outline btn-sm" id="syncClassroomSettingsBtn">Sync now</button>
            </div>
            <p id="googleSetupNote" style="font-size:12px;color:var(--text-muted);margin-top:8px">Checking the Google connection…</p>
          </div>

          <!-- Data & Storage -->
          <div class="settings-panel card" id="panel-data" data-panel="data" role="tabpanel">
            <div class="card-header">
              <div class="card-header-left">
                <div class="card-icon orange"><i data-lucide="database"></i></div>
                <h2 class="card-title">Data &amp; Storage</h2>
              </div>
            </div>
            <div class="settings-row">
              <div>
                <div class="row-label">Local Storage Used</div>
                <div class="row-value" id="localStorageUsage">34.2 GB of 50 GB</div>
              </div>
            </div>
            <div style="padding:0 0 16px">
              <div class="progress-bar"><div class="fill blue" id="storageBar" style="width:68%"></div></div>
            </div>
            <div class="settings-row">
              <div>
                <div class="row-label">Export Data</div>
                <div class="row-value">Download all your StudyBuddy data</div>
              </div>
              <button type="button" class="btn btn-outline btn-sm" id="exportDataBtn">Export</button>
            </div>
            <div class="settings-row">
              <div>
                <div class="row-label">Data Sync</div>
                <div class="row-value">Study data is saved directly to your account.</div>
              </div>
            </div>
            <div class="settings-row">
              <div>
                <div class="row-label" style="color:var(--danger)">Delete Account</div>
                <div class="row-value">Permanently delete your account and data</div>
              </div>
              <button type="button" class="btn btn-ghost btn-sm danger" id="deleteAccountBtn"><i data-lucide="trash-2"></i> Delete</button>
            </div>
          </div>

          <!-- Help -->
          <div class="settings-panel card" id="panel-help" data-panel="help" role="tabpanel">
            <div class="card-header">
              <div class="card-header-left">
                <div class="card-icon blue"><i data-lucide="help-circle"></i></div>
                <h2 class="card-title">Help &amp; Support</h2>
              </div>
            </div>
            <div class="settings-row">
              <div>
                <div class="row-label">Help Center</div>
                <div class="row-value">Browse FAQs and guides</div>
              </div>
              <i data-lucide="external-link" class="chevron"></i>
            </div>
            <div class="settings-row">
              <div>
                <div class="row-label">Contact Support</div>
                <div class="row-value">Get help from our team</div>
              </div>
              <i data-lucide="chevron-right" class="chevron"></i>
            </div>
            <div class="settings-row">
              <div>
                <div class="row-label">Report a Bug</div>
                <div class="row-value">Let us know about issues</div>
              </div>
              <i data-lucide="chevron-right" class="chevron"></i>
            </div>
            <div class="settings-row">
              <div>
                <div class="row-label">App Version</div>
                <div class="row-value">StudyBuddy v1.0.0</div>
              </div>
            </div>
          </div>
        </div>

        <aside class="page-aside" style="position:sticky;top:calc(var(--header-height) + 16px)">
          <div class="card" id="accountOverview">
            <div style="text-align:center;padding:8px 0 16px">
              <div class="avatar" style="width:72px;height:72px;border-radius:50%;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700;margin:0 auto 12px" id="settingsAvatar">JD</div>
              <h3 style="font-size:16px;margin-bottom:4px" id="settingsName">Juan Dela Cruz</h3>
              <p style="font-size:12.5px;color:var(--text-muted);margin-bottom:8px" id="settingsRole">Student</p>
              <span class="badge badge-verified"><i data-lucide="badge-check"></i> Verified</span>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12.5px;margin-top:12px">
              <div style="padding:10px;background:var(--page-bg);border-radius:8px;text-align:center">
                <div style="font-weight:700;font-size:18px;color:var(--text-heading)" id="settingsSubjectCount">0</div>
                <div style="color:var(--text-muted)">Subjects</div>
              </div>
              <div style="padding:10px;background:var(--page-bg);border-radius:8px;text-align:center">
                <div style="font-weight:700;font-size:18px;color:var(--text-heading)" id="settingsProgressValue">0%</div>
                <div style="color:var(--text-muted)">Progress</div>
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
              <button type="button" class="qa-btn blue" data-action="edit-profile">
                <i data-lucide="user-pen"></i> Edit Profile
              </button>
              <button type="button" class="qa-btn green" data-action="connect-google">
                <i data-lucide="link"></i> Connect Google
              </button>
              <button type="button" class="qa-btn purple" data-action="export-data">
                <i data-lucide="download"></i> Export Data
              </button>
              <button type="button" class="qa-btn orange" data-action="logout">
                <i data-lucide="log-out"></i> Log Out
              </button>
            </div>
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
        <button type="button" class="modal-close" data-close-modal="deleteAccountModal" aria-label="Close">
          <i data-lucide="x"></i>
        </button>
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
          <div class="form-group" id="deleteAccountTotpWrap">
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

  <script>window.SB_USER = <?= json_encode($studentProfile, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT) ?>;</script>
  <script src="../js/data.js"></script>
  <script src="../js/auth.js"></script>
  <script src="../js/authenticator.js"></script>
  <script src="../js/sidebar.js"></script>
  <script src="../js/google-integration.js"></script>
  <script src="../js/settings.js"></script>
</body>
</html>

<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/bootstrap.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/google.php';
require_once __DIR__ . '/../includes/auth_lib.php';
require_once __DIR__ . '/../includes/google_token.php';

$action = (string)($_GET['action'] ?? $_POST['action'] ?? '');
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

function auth_signup_profile(array $fields): ?array
{
    $profile = [];
    foreach ($fields as $field) {
        $value = trim((string)($_POST[$field] ?? ''));
        if ($value === '' || mb_strlen($value) > 255) return null;
        $profile[$field] = $value;
    }
    return $profile;
}

function auth_save_signup_profile(PDO $pdo, int $userId, string $stateKey, array $profile): void
{
    $pdo->prepare(
        'INSERT INTO app_state (user_id, state_key, state_value) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE state_value = VALUES(state_value)'
    )->execute([$userId, $stateKey, json_encode($profile, JSON_UNESCAPED_UNICODE)]);
}

try {
    $pdo = db();
    if ($method === 'GET' && $action === 'session') {
        $pending = google_signup_pending();
        json_response([
            'ok' => true,
            'user' => $_SESSION['user'] ?? null,
            'csrf' => $_SESSION['csrf_token'],
            'googleSignup' => $pending ? ['email' => $pending['email'], 'name' => $pending['name']] : null,
            'googleSignInConfigured' => GOOGLE_CLIENT_ID !== '',
            'requiresTotp' => !empty($_SESSION['pending_totp']['challenge']),
            'challenge' => (string)($_SESSION['pending_totp']['challenge'] ?? ''),
            'remember' => !empty($_SESSION['pending_totp']['remember']),
        ]);
    }
    if ($method === 'GET' && $action === 'account') {
        $sessionUser = require_user();
        $row = fetch_user_by_id($pdo, (int)$sessionUser['id']);
        if (!$row) json_response(['ok' => false, 'message' => 'Account not found.'], 401);
        $_SESSION['user'] = user_from_row($row);
        json_response([
            'ok' => true,
            'hasPassword' => !empty($row['password_hash']),
            'totpEnabled' => (int)$row['totp_enabled'] === 1,
            'googleLinked' => !empty($row['google_sub']),
            'googleSignInConfigured' => GOOGLE_CLIENT_ID !== '',
            'email' => $row['email'],
        ]);
    }
    if ($method !== 'POST') json_response(['ok' => false, 'message' => 'Method not allowed.'], 405);
    verify_csrf();

    if ($action === 'register') {
        $name = trim((string)($_POST['name'] ?? ''));
        $email = strtolower(trim((string)($_POST['email'] ?? '')));
        $password = (string)($_POST['password'] ?? '');
        $role = (string)($_POST['role'] ?? 'student');
        if ($name === '' || mb_strlen($name) > 150 || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 8 || !in_array($role, ['student', 'teacher'], true)) {
            json_response(['ok' => false, 'message' => 'Enter a valid name, email, role, and a password of at least 8 characters.'], 422);
        }
        $profileFields = $role === 'student'
            ? ['studentId', 'phone', 'school', 'course', 'yearLevel']
            : ['employeeId', 'phone', 'school', 'department'];
        $signupProfile = auth_signup_profile($profileFields);
        if ($signupProfile === null) {
            $roleLabel = $role === 'student' ? 'student' : 'teacher';
            json_response(['ok' => false, 'message' => "Enter all required {$roleLabel} details. Each value must be 255 characters or fewer."], 422);
        }
        $stmt = $pdo->prepare('INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)');
        try {
            $pdo->beginTransaction();
            $stmt->execute([$name, $email, password_hash($password, PASSWORD_DEFAULT), $role]);
            $userId = sb_last_insert_id($pdo);
            $stateKey = $role === 'student' ? 'student_profile' : 'teacher_profile';
            auth_save_signup_profile($pdo, $userId, $stateKey, $signupProfile);
            $pdo->commit();
        } catch (PDOException $error) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            if (sb_is_duplicate($error)) json_response(['ok' => false, 'message' => 'An account with this email already exists.'], 409);
            throw $error;
        }
        $row = fetch_user_by_id($pdo, $userId);
        $user = establish_session($pdo, $row);
        json_response(['ok' => true, 'user' => $user, 'redirect' => role_redirect($role)]);
    }

    if ($action === 'login') {
        $email = strtolower(trim((string)($_POST['email'] ?? '')));
        $password = (string)($_POST['password'] ?? '');
        $remember = ($_POST['remember'] ?? '') === '1';
        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $password === '') {
            json_response(['ok' => false, 'message' => 'Enter the email and password for your account.'], 422);
        }
        if (too_many_login_attempts($pdo, $email)) {
            json_response(['ok' => false, 'message' => 'Too many failed sign-in attempts. Wait 15 minutes and try again.'], 429);
        }
        $stmt = $pdo->prepare('SELECT id, full_name, email, password_hash, role, google_sub, avatar_url, totp_secret, totp_enabled, totp_last_step FROM users WHERE email = ? LIMIT 1');
        $stmt->execute([$email]);
        $row = $stmt->fetch() ?: null;
        $dummy = '$2y$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
        $hash = (string)($row['password_hash'] ?? $dummy);
        $passwordOk = $hash !== '' && password_verify($password, $hash);
        if (!$row || empty($row['password_hash']) || !$passwordOk) {
            record_login_attempt($pdo, $email, false);
            json_response(['ok' => false, 'message' => 'Invalid email or password.'], 401);
        }
        record_login_attempt($pdo, $email, true);
        json_response(login_result_for_row($pdo, $row, $remember));
    }

    if ($action === 'verify-totp') {
        $token = (string)($_POST['challenge'] ?? '');
        $code = (string)($_POST['code'] ?? '');
        $remember = ($_POST['remember'] ?? '') === '1';
        if (!preg_match('/^[a-f0-9]{64}$/', $token)) json_response(['ok' => false, 'message' => 'The sign-in challenge expired. Enter your password again.'], 401);
        $stmt = $pdo->prepare('SELECT id, user_id, attempts, expires_at FROM auth_challenges WHERE token_hash = ? AND purpose = ? LIMIT 1');
        $stmt->execute([hash('sha256', $token), 'totp_login']);
        $challenge = $stmt->fetch();
        if (!$challenge || strtotime((string)$challenge['expires_at']) < time()) {
            json_response(['ok' => false, 'message' => 'The sign-in challenge expired. Enter your password again.'], 401);
        }
        if ((int)$challenge['attempts'] >= 5) {
            $pdo->prepare('DELETE FROM auth_challenges WHERE id = ?')->execute([(int)$challenge['id']]);
            json_response(['ok' => false, 'message' => 'Too many incorrect codes. Enter your password again.'], 429);
        }
        $row = fetch_user_by_id($pdo, (int)$challenge['user_id']);
        if (!$row || (int)$row['totp_enabled'] !== 1 || empty($row['totp_secret'])) {
            json_response(['ok' => false, 'message' => 'Authenticator is not active on this account.'], 401);
        }
        if (!accept_second_factor($pdo, $row, $code)) {
            $pdo->prepare('UPDATE auth_challenges SET attempts = attempts + 1 WHERE id = ?')->execute([(int)$challenge['id']]);
            json_response(['ok' => false, 'message' => 'That code is not correct. Use the current Google Authenticator code or a backup code.'], 401);
        }
        $pdo->prepare('DELETE FROM auth_challenges WHERE user_id = ?')->execute([(int)$row['id']]);
        $user = establish_session($pdo, $row);
        if ($remember) issue_remember_token($pdo, (int)$row['id']);
        json_response(['ok' => true, 'user' => $user, 'redirect' => role_redirect((string)$row['role'])]);
    }

    if ($action === 'google') {
        if (GOOGLE_CLIENT_ID === '') {
            json_response(['ok' => false, 'message' => 'Google sign-in is not configured. Add the OAuth client ID in config/google.php.'], 503);
        }
        try {
            $identity = google_verify_id_token((string)($_POST['credential'] ?? ''), GOOGLE_CLIENT_ID);
        } catch (RuntimeException $error) {
            json_response(['ok' => false, 'message' => $error->getMessage()], 401);
        }
        $remember = ($_POST['remember'] ?? '') === '1';
        $bySub = $pdo->prepare('SELECT id, full_name, email, password_hash, role, google_sub, avatar_url, totp_secret, totp_enabled, totp_last_step FROM users WHERE google_sub = ? LIMIT 1');
        $bySub->execute([$identity['sub']]);
        $row = $bySub->fetch() ?: null;
        if (!$row) {
            $byEmail = $pdo->prepare('SELECT id, google_sub FROM users WHERE email = ? LIMIT 1');
            $byEmail->execute([$identity['email']]);
            $existing = $byEmail->fetch();
            if ($existing && empty($existing['google_sub'])) {
                json_response(['ok' => false, 'message' => 'An account with this email already exists. Sign in with your password, then connect Google from Settings.'], 409);
            }
            if ($existing) {
                json_response(['ok' => false, 'message' => 'This email is already linked to a different Google account.'], 409);
            }
            $_SESSION['google_signup'] = $identity + ['expires' => time() + 600];
            json_response(['ok' => true, 'needsRole' => true, 'email' => $identity['email'], 'name' => $identity['name']]);
        }
        if ($identity['picture'] !== '' && $identity['picture'] !== (string)$row['avatar_url']) {
            $pdo->prepare('UPDATE users SET avatar_url = ?, email_verified = 1 WHERE id = ?')->execute([$identity['picture'], (int)$row['id']]);
            $row['avatar_url'] = $identity['picture'];
        }
        json_response(login_result_for_row($pdo, $row, $remember));
    }

    if ($action === 'google-complete') {
        $pending = google_signup_pending();
        if (!$pending) json_response(['ok' => false, 'message' => 'The Google sign-in step expired. Choose Continue with Google again.'], 401);
        $role = (string)($_POST['role'] ?? '');
        if (!in_array($role, ['student', 'teacher'], true)) json_response(['ok' => false, 'message' => 'Choose student or teacher.'], 422);
        $profileFields = $role === 'student'
            ? ['studentId', 'phone', 'school', 'course', 'yearLevel']
            : ['employeeId', 'phone', 'school', 'department'];
        $signupProfile = auth_signup_profile($profileFields);
        if ($signupProfile === null) {
            $roleLabel = $role === 'student' ? 'student' : 'teacher';
            json_response(['ok' => false, 'message' => "Enter all required {$roleLabel} details. Each value must be 255 characters or fewer."], 422);
        }
        $stmt = $pdo->prepare('INSERT INTO users (full_name, email, password_hash, role, google_sub, avatar_url, email_verified) VALUES (?, ?, NULL, ?, ?, ?, 1)');
        try {
            $pdo->beginTransaction();
            $stmt->execute([$pending['name'], $pending['email'], $role, $pending['sub'], $pending['picture'] !== '' ? $pending['picture'] : null]);
            $userId = sb_last_insert_id($pdo);
            $stateKey = $role === 'student' ? 'student_profile' : 'teacher_profile';
            auth_save_signup_profile($pdo, $userId, $stateKey, $signupProfile);
            $pdo->commit();
        } catch (PDOException $error) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            if (sb_is_duplicate($error)) json_response(['ok' => false, 'message' => 'An account with this email already exists. Sign in with your password instead.'], 409);
            throw $error;
        }
        unset($_SESSION['google_signup']);
        $row = fetch_user_by_id($pdo, $userId);
        $user = establish_session($pdo, $row);
        json_response(['ok' => true, 'user' => $user, 'redirect' => role_redirect($role)]);
    }

    if ($action === 'link-google') {
        $sessionUser = require_user();
        if (GOOGLE_CLIENT_ID === '') json_response(['ok' => false, 'message' => 'Google sign-in is not configured. Add the OAuth client ID in config/google.php.'], 503);
        try {
            $identity = google_verify_id_token((string)($_POST['credential'] ?? ''), GOOGLE_CLIENT_ID);
        } catch (RuntimeException $error) {
            json_response(['ok' => false, 'message' => $error->getMessage()], 401);
        }
        $row = fetch_user_by_id($pdo, (int)$sessionUser['id']);
        if (!$row) json_response(['ok' => false, 'message' => 'Account not found.'], 401);
        if (!empty($row['google_sub']) && $row['google_sub'] !== $identity['sub']) {
            json_response(['ok' => false, 'message' => 'This account is already connected to a different Google account.'], 409);
        }
        $owner = $pdo->prepare('SELECT id FROM users WHERE (google_sub = ? OR email = ?) AND id <> ? LIMIT 1');
        $owner->execute([$identity['sub'], $identity['email'], (int)$row['id']]);
        if ($owner->fetch()) json_response(['ok' => false, 'message' => 'That Google account is already used by another StudyBuddy account.'], 409);
        if (strtolower((string)$row['email']) !== $identity['email']) {
            json_response(['ok' => false, 'message' => 'Use the Google account for ' . $row['email'] . '.'], 422);
        }
        $pdo->prepare('UPDATE users SET google_sub = ?, avatar_url = COALESCE(NULLIF(?, \'\'), avatar_url), email_verified = 1 WHERE id = ?')
            ->execute([$identity['sub'], $identity['picture'], (int)$row['id']]);
        $row['google_sub'] = $identity['sub'];
        $_SESSION['user'] = user_from_row($row);
        json_response(['ok' => true]);
    }

    if ($action === 'unlink-google') {
        $sessionUser = require_user();
        $row = fetch_user_by_id($pdo, (int)$sessionUser['id']);
        if (!$row || empty($row['google_sub'])) json_response(['ok' => false, 'message' => 'Google is not connected.'], 422);
        if (empty($row['password_hash'])) json_response(['ok' => false, 'message' => 'Set a password before disconnecting Google, or you will not be able to sign in.'], 422);
        $pdo->prepare('UPDATE users SET google_sub = NULL WHERE id = ?')->execute([(int)$row['id']]);
        json_response(['ok' => true]);
    }

    if ($action === 'authenticator-start') {
        $sessionUser = require_user();
        $row = fetch_user_by_id($pdo, (int)$sessionUser['id']);
        if (!$row) json_response(['ok' => false, 'message' => 'Account not found.'], 401);
        $secret = random_bytes(20);
        $base32 = base32_encode_bytes($secret);
        $pdo->prepare('UPDATE users SET totp_pending_secret = ? WHERE id = ?')->execute([seal_string($secret), (int)$row['id']]);
        json_response([
            'ok' => true,
            'secret' => $base32,
            'otpauth' => otpauth_uri((string)$row['email'], $base32),
        ]);
    }

    if ($action === 'authenticator-confirm') {
        $sessionUser = require_user();
        $row = fetch_user_by_id($pdo, (int)$sessionUser['id']);
        if (!$row || empty($row['totp_pending_secret'])) {
            json_response(['ok' => false, 'message' => 'Start authenticator setup again, then enter the code.'], 422);
        }
        $secret = open_sealed_string((string)$row['totp_pending_secret']);
        $step = totp_match_step($secret, (string)($_POST['code'] ?? ''));
        if ($step === null) json_response(['ok' => false, 'message' => 'That code does not match Google Authenticator. Check the phone clock and try the current code.'], 422);
        $pdo->beginTransaction();
        $pdo->prepare('UPDATE users SET totp_secret = totp_pending_secret, totp_pending_secret = NULL, totp_enabled = 1, totp_last_step = ? WHERE id = ?')
            ->execute([$step, (int)$row['id']]);
        $codes = replace_backup_codes($pdo, (int)$row['id']);
        $pdo->commit();
        $_SESSION['user']['totpEnabled'] = true;
        json_response(['ok' => true, 'backupCodes' => $codes]);
    }

    if ($action === 'authenticator-disable') {
        $sessionUser = require_user();
        $row = fetch_user_by_id($pdo, (int)$sessionUser['id']);
        if (!$row || (int)$row['totp_enabled'] !== 1) json_response(['ok' => false, 'message' => 'Google Authenticator is not enabled.'], 422);
        if (!accept_second_factor($pdo, $row, (string)($_POST['code'] ?? ''))) {
            json_response(['ok' => false, 'message' => 'Enter a current authenticator code or an unused backup code to turn it off.'], 422);
        }
        $pdo->prepare('UPDATE users SET totp_secret = NULL, totp_pending_secret = NULL, totp_enabled = 0, totp_last_step = NULL WHERE id = ?')->execute([(int)$row['id']]);
        $pdo->prepare('DELETE FROM totp_backup_codes WHERE user_id = ?')->execute([(int)$row['id']]);
        $_SESSION['user']['totpEnabled'] = false;
        json_response(['ok' => true]);
    }

    if ($action === 'change-password') {
        $sessionUser = require_user();
        $row = fetch_user_by_id($pdo, (int)$sessionUser['id']);
        $current = (string)($_POST['currentPassword'] ?? '');
        $next = (string)($_POST['newPassword'] ?? '');
        if (strlen($next) < 8) json_response(['ok' => false, 'message' => 'The new password must be at least 8 characters.'], 422);
        if (!$row) json_response(['ok' => false, 'message' => 'Account not found.'], 401);
        if (!empty($row['password_hash'])) {
            if (!password_verify($current, (string)$row['password_hash'])) json_response(['ok' => false, 'message' => 'Your current password is incorrect.'], 422);
        } elseif ((int)$row['totp_enabled'] === 1 && !accept_second_factor($pdo, $row, (string)($_POST['code'] ?? ''))) {
            json_response(['ok' => false, 'message' => 'This account has no password yet. Enter a current Google Authenticator code to set one.'], 422);
        }
        $pdo->prepare('UPDATE users SET password_hash = ? WHERE id = ?')->execute([password_hash($next, PASSWORD_DEFAULT), (int)$row['id']]);
        $_SESSION['user']['hasPassword'] = true;
        json_response(['ok' => true]);
    }

    if ($action === 'delete-account') {
        $sessionUser = require_user();
        $row = fetch_user_by_id($pdo, (int)$sessionUser['id']);
        $password = (string)($_POST['password'] ?? '');
        if (($_POST['confirmation'] ?? '') !== 'DELETE') json_response(['ok' => false, 'message' => 'Type DELETE to confirm account deletion.'], 422);
        if (!$row) json_response(['ok' => false, 'message' => 'Account not found.'], 401);
        if (!empty($row['password_hash']) && !password_verify($password, (string)$row['password_hash'])) {
            json_response(['ok' => false, 'message' => 'Your password is incorrect.'], 422);
        }
        if ((int)$row['totp_enabled'] === 1 && !accept_second_factor($pdo, $row, (string)($_POST['code'] ?? ''))) {
            json_response(['ok' => false, 'message' => 'Enter a current Google Authenticator code or a backup code.'], 422);
        }
        if (empty($row['password_hash']) && (int)$row['totp_enabled'] !== 1 && $password !== '') {
            json_response(['ok' => false, 'message' => 'This account has no password. Leave the password blank and type DELETE.'], 422);
        }
        $userId = (int)$row['id'];
        $pdo->prepare('DELETE FROM users WHERE id = ?')->execute([$userId]);
        $cleanupWarning = remove_user_uploads($userId);
        clear_remember_cookie();
        destroy_login_session();
        json_response(['ok' => true, 'cleanupWarning' => $cleanupWarning, 'redirect' => 'index.php']);
    }

    if ($action === 'logout') {
        forget_current_browser($pdo);
        destroy_login_session();
        json_response(['ok' => true, 'redirect' => 'index.php']);
    }

    json_response(['ok' => false, 'message' => 'Unknown action.'], 400);
} catch (Throwable $error) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) $pdo->rollBack();
    error_log($error->__toString());
    $message = 'A server error occurred. Check the PHP error log.';
    if ($error instanceof PDOException) {
        $message = 'Sign-in cannot reach the StudyBuddy database. The hosted site needs SB_DB_HOST, SB_DB_NAME, SB_DB_USER, and SB_DB_PASS in its project settings. On this computer, start MySQL in XAMPP.';
    }
    json_response(['ok' => false, 'message' => $message], 500);
}

function google_signup_pending(): ?array {
    $pending = $_SESSION['google_signup'] ?? null;
    if (!is_array($pending) || (int)($pending['expires'] ?? 0) < time()) {
        unset($_SESSION['google_signup']);
        return null;
    }
    foreach (['sub', 'email', 'name'] as $key) {
        if (empty($pending[$key]) || !is_string($pending[$key])) return null;
    }
    $pending['picture'] = is_string($pending['picture'] ?? null) ? $pending['picture'] : '';
    return $pending;
}

function remove_user_uploads(int $userId): bool {
    $cleanupWarning = false;
    $uploadRoot = realpath(__DIR__ . '/../uploads');
    $userDir = $uploadRoot ? realpath($uploadRoot . DIRECTORY_SEPARATOR . $userId) : false;
    if ($userDir && dirname($userDir) === $uploadRoot) {
        foreach (scandir($userDir) ?: [] as $entry) {
            if ($entry === '.' || $entry === '..') continue;
            $path = $userDir . DIRECTORY_SEPARATOR . $entry;
            if ((is_file($path) || is_link($path)) && !unlink($path)) $cleanupWarning = true;
            elseif (is_dir($path)) $cleanupWarning = true;
        }
        if (!$cleanupWarning && !rmdir($userDir)) $cleanupWarning = true;
    }
    return $cleanupWarning;
}

<?php
declare(strict_types=1);

require_once __DIR__ . '/crypto.php';
require_once __DIR__ . '/totp.php';

function app_cookie_path(): string {
    $script = str_replace('\\', '/', (string)($_SERVER['SCRIPT_NAME'] ?? '/'));
    if (preg_match('#^(.*?)/(?:api|student|teacher|includes|config)(?:/|$)#', $script, $match)) {
        $base = $match[1];
    } else {
        $base = rtrim(dirname($script), '/');
        if ($base === '.' || $base === '/' || $base === '\\') $base = '';
    }
    return ($base === '' ? '' : $base) . '/';
}

function request_is_https(): bool {
    if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') return true;
    return strtolower((string)($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '')) === 'https';
}

function cookie_options(int $expires): array {
    return [
        'expires' => $expires,
        'path' => app_cookie_path(),
        'secure' => request_is_https(),
        'httponly' => true,
        'samesite' => 'Lax',
    ];
}

function user_initials(string $name): string {
    $parts = preg_split('/\s+/', trim($name)) ?: [];
    $out = '';
    foreach (array_slice($parts, 0, 2) as $part) $out .= mb_substr($part, 0, 1);
    return strtoupper($out);
}

function user_from_row(array $row): array {
    return [
        'id' => (int)$row['id'],
        'name' => (string)$row['full_name'],
        'email' => (string)$row['email'],
        'role' => (string)$row['role'],
        'avatarInitials' => user_initials((string)$row['full_name']),
        'avatarUrl' => ($row['avatar_url'] ?? '') !== '' ? (string)$row['avatar_url'] : null,
        'totpEnabled' => (int)($row['totp_enabled'] ?? 0) === 1,
        'hasPassword' => !empty($row['password_hash']),
        'googleLinked' => !empty($row['google_sub']),
    ];
}

function role_redirect(string $role): string {
    return $role === 'teacher' ? 'teacher/dashboard.php' : 'student/dashboard.php';
}

function establish_session(PDO $pdo, array $row): array {
    $user = user_from_row($row);
    $_SESSION['user'] = $user;
    session_regenerate_id(true);
    $_SESSION['user'] = $user;
    $pdo->prepare('UPDATE users SET last_login_at = NOW() WHERE id = ?')->execute([(int)$row['id']]);
    return $user;
}

function client_ip(): string {
    $ip = (string)($_SERVER['REMOTE_ADDR'] ?? '');
    return substr($ip, 0, 45);
}

function too_many_login_attempts(PDO $pdo, string $email): bool {
    $pdo->exec('DELETE FROM login_attempts WHERE created_at < (NOW() - INTERVAL 1 DAY)');
    $stmt = $pdo->prepare('SELECT COUNT(*) FROM login_attempts WHERE email = ? AND succeeded = 0 AND created_at > (NOW() - INTERVAL 15 MINUTE)');
    $stmt->execute([$email]);
    return (int)$stmt->fetchColumn() >= 8;
}

function record_login_attempt(PDO $pdo, string $email, bool $succeeded): void {
    $pdo->prepare('INSERT INTO login_attempts (email, ip_address, succeeded) VALUES (?, ?, ?)')
        ->execute([$email, client_ip(), $succeeded ? 1 : 0]);
}

function issue_totp_challenge(PDO $pdo, int $userId): string {
    $pdo->prepare('DELETE FROM auth_challenges WHERE user_id = ? OR expires_at < NOW()')->execute([$userId]);
    $token = bin2hex(random_bytes(32));
    $pdo->prepare('INSERT INTO auth_challenges (user_id, token_hash, purpose, attempts, expires_at) VALUES (?, ?, ?, 0, DATE_ADD(NOW(), INTERVAL 5 MINUTE))')
        ->execute([$userId, hash('sha256', $token), 'totp_login']);
    return $token;
}

function login_result_for_row(PDO $pdo, array $row, bool $remember): array {
    if ((int)($row['totp_enabled'] ?? 0) === 1) {
        return [
            'ok' => true,
            'requiresTotp' => true,
            'challenge' => issue_totp_challenge($pdo, (int)$row['id']),
            'remember' => $remember,
        ];
    }
    $user = establish_session($pdo, $row);
    if ($remember) issue_remember_token($pdo, (int)$row['id']);
    return ['ok' => true, 'user' => $user, 'redirect' => role_redirect((string)$row['role'])];
}

function normalize_backup_code(string $code): string {
    return strtolower((string)preg_replace('/[^A-Za-z0-9]/', '', $code));
}

function consume_backup_code(PDO $pdo, int $userId, string $code): bool {
    $normalized = normalize_backup_code($code);
    if (strlen($normalized) !== 8) return false;
    $stmt = $pdo->prepare('SELECT id, code_hash FROM totp_backup_codes WHERE user_id = ? AND used_at IS NULL');
    $stmt->execute([$userId]);
    foreach ($stmt->fetchAll() as $backup) {
        if (password_verify($normalized, (string)$backup['code_hash'])) {
            $update = $pdo->prepare('UPDATE totp_backup_codes SET used_at = NOW() WHERE id = ? AND used_at IS NULL');
            $update->execute([(int)$backup['id']]);
            return $update->rowCount() === 1;
        }
    }
    return false;
}

function accept_second_factor(PDO $pdo, array $row, string $code): bool {
    $secret = open_sealed_string((string)$row['totp_secret']);
    $step = totp_match_step($secret, $code);
    if ($step !== null) {
        $last = $row['totp_last_step'] === null ? null : (int)$row['totp_last_step'];
        if ($last !== null && $step <= $last) return false;
        $pdo->prepare('UPDATE users SET totp_last_step = ? WHERE id = ?')->execute([$step, (int)$row['id']]);
        return true;
    }
    return consume_backup_code($pdo, (int)$row['id'], $code);
}

function replace_backup_codes(PDO $pdo, int $userId): array {
    $pdo->prepare('DELETE FROM totp_backup_codes WHERE user_id = ?')->execute([$userId]);
    $codes = [];
    $insert = $pdo->prepare('INSERT INTO totp_backup_codes (user_id, code_hash) VALUES (?, ?)');
    for ($i = 0; $i < 8; $i++) {
        $raw = bin2hex(random_bytes(4));
        $display = substr($raw, 0, 4) . '-' . substr($raw, 4);
        $codes[] = $display;
        $insert->execute([$userId, password_hash($raw, PASSWORD_DEFAULT)]);
    }
    return $codes;
}

function issue_remember_token(PDO $pdo, int $userId): void {
    $pdo->prepare('DELETE FROM remember_tokens WHERE user_id = ? OR expires_at < NOW()')->execute([$userId]);
    $selector = bin2hex(random_bytes(12));
    $validator = bin2hex(random_bytes(32));
    $pdo->prepare('INSERT INTO remember_tokens (user_id, selector, validator_hash, expires_at) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY))')
        ->execute([$userId, $selector, hash('sha256', $validator)]);
    setcookie('sb_remember', $selector . ':' . $validator, cookie_options(time() + 60 * 60 * 24 * 30));
}

function clear_remember_cookie(): void {
    setcookie('sb_remember', '', cookie_options(time() - 42000));
}

function forget_current_browser(PDO $pdo): void {
    $cookie = (string)($_COOKIE['sb_remember'] ?? '');
    $parts = explode(':', $cookie, 2);
    if (count($parts) === 2 && preg_match('/^[a-f0-9]{24}$/', $parts[0])) {
        $pdo->prepare('DELETE FROM remember_tokens WHERE selector = ?')->execute([$parts[0]]);
    }
    clear_remember_cookie();
}

function destroy_login_session(): void {
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', [
            'expires' => time() - 42000,
            'path' => $params['path'] ?: app_cookie_path(),
            'domain' => $params['domain'],
            'secure' => (bool)$params['secure'],
            'httponly' => (bool)$params['httponly'],
            'samesite' => $params['samesite'] ?? 'Lax',
        ]);
    }
    session_destroy();
}

function fetch_user_by_id(PDO $pdo, int $id): ?array {
    $stmt = $pdo->prepare('SELECT id, full_name, email, password_hash, role, google_sub, avatar_url, email_verified, totp_secret, totp_pending_secret, totp_enabled, totp_last_step FROM users WHERE id = ? LIMIT 1');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function complete_google_oauth_login(PDO $pdo, array $identity, bool $remember): never {
    $home = app_cookie_path() . 'index.php';
    $go = static function (string $url): never {
        if (function_exists('sb_commit_session')) sb_commit_session();
        header('Location: ' . $url);
        exit;
    };
    $bySub = $pdo->prepare('SELECT id, full_name, email, password_hash, role, google_sub, avatar_url, totp_secret, totp_enabled, totp_last_step FROM users WHERE google_sub = ? LIMIT 1');
    $bySub->execute([$identity['sub']]);
    $row = $bySub->fetch() ?: null;
    if (!$row) {
        $byEmail = $pdo->prepare('SELECT id, google_sub FROM users WHERE email = ? LIMIT 1');
        $byEmail->execute([$identity['email']]);
        $existing = $byEmail->fetch();
        if ($existing && empty($existing['google_sub'])) {
            $go($home . '?' . http_build_query([
                'google' => 'error',
                'message' => 'An account with this email already exists. Sign in with your password.',
            ]));
        }
        if ($existing) {
            $go($home . '?' . http_build_query([
                'google' => 'error',
                'message' => 'This email is already linked to a different Google account.',
            ]));
        }
        $_SESSION['google_signup'] = $identity + ['expires' => time() + 600];
        $go($home);
    }
    if (($identity['picture'] ?? '') !== '' && $identity['picture'] !== (string)$row['avatar_url']) {
        $pdo->prepare('UPDATE users SET avatar_url = ?, email_verified = 1 WHERE id = ?')->execute([$identity['picture'], (int)$row['id']]);
        $row['avatar_url'] = $identity['picture'];
    }
    $result = login_result_for_row($pdo, $row, $remember);
    if (!empty($result['requiresTotp'])) {
        $_SESSION['pending_totp'] = ['challenge' => $result['challenge'], 'remember' => $remember];
        $go($home);
    }
    $go(app_cookie_path() . $result['redirect']);
}

<?php
declare(strict_types=1);

require_once __DIR__ . '/auth_lib.php';

function remember_restore(PDO $pdo): void {
    if (!empty($_SESSION['user'])) return;
    $cookie = (string)($_COOKIE['sb_remember'] ?? '');
    $parts = explode(':', $cookie, 2);
    if (count($parts) !== 2 || !preg_match('/^[a-f0-9]{24}$/', $parts[0]) || !preg_match('/^[a-f0-9]{64}$/', $parts[1])) {
        return;
    }
    [$selector, $validator] = $parts;
    $stmt = $pdo->prepare('SELECT rt.user_id, rt.validator_hash, rt.previous_validator_hash, rt.rotated_at, rt.expires_at, u.id, u.full_name, u.email, u.password_hash, u.role, u.google_sub, u.avatar_url, u.totp_enabled
        FROM remember_tokens rt
        INNER JOIN users u ON u.id = rt.user_id
        WHERE rt.selector = ? LIMIT 1');
    $stmt->execute([$selector]);
    $row = $stmt->fetch();
    if (!$row || strtotime((string)$row['expires_at']) < time()) {
        $pdo->prepare('DELETE FROM remember_tokens WHERE selector = ?')->execute([$selector]);
        clear_remember_cookie();
        return;
    }
    $presented = hash('sha256', $validator);
    $currentOk = hash_equals((string)$row['validator_hash'], $presented);
    $rotatedAt = $row['rotated_at'] ? strtotime((string)$row['rotated_at']) : 0;
    $previousOk = !empty($row['previous_validator_hash'])
        && hash_equals((string)$row['previous_validator_hash'], $presented)
        && $rotatedAt > time() - 120;
    if (!$currentOk && !$previousOk) {
        $pdo->prepare('DELETE FROM remember_tokens WHERE user_id = ?')->execute([(int)$row['user_id']]);
        clear_remember_cookie();
        return;
    }
    if ($currentOk && $rotatedAt < time() - 120) {
        $next = bin2hex(random_bytes(32));
        $pdo->prepare('UPDATE remember_tokens SET previous_validator_hash = validator_hash, validator_hash = ?, rotated_at = NOW() WHERE selector = ?')
            ->execute([hash('sha256', $next), $selector]);
        setcookie('sb_remember', $selector . ':' . $next, cookie_options(time() + 60 * 60 * 24 * 30));
    }
    establish_session($pdo, $row);
}

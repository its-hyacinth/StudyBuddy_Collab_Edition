<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/bootstrap.php';
require_once __DIR__ . '/../config/database.php';

$token = db_setting('SB_IMPORT_TOKEN', '');
$given = (string)($_SERVER['HTTP_X_IMPORT_TOKEN'] ?? '');
if ($token === '' || $given === '' || !hash_equals($token, $given)) {
    http_response_code(404);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Not found';
    exit;
}
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    json_response(['ok' => false, 'message' => 'Method not allowed.'], 405);
}

$payload = json_decode((string)file_get_contents('php://input'), true);
$users = is_array($payload['users'] ?? null) ? $payload['users'] : [];
$states = is_array($payload['states'] ?? null) ? $payload['states'] : [];
if (count($users) > 500 || count($states) > 5000) {
    json_response(['ok' => false, 'message' => 'Too many rows.'], 422);
}

$pdo = db();
$pdo->beginTransaction();
$userInsert = $pdo->prepare(
    'INSERT INTO users (id, full_name, email, password_hash, role, google_sub, avatar_url, email_verified, totp_secret, totp_pending_secret, totp_enabled, totp_last_step, last_login_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (email) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role,
        google_sub = EXCLUDED.google_sub,
        avatar_url = EXCLUDED.avatar_url,
        email_verified = EXCLUDED.email_verified,
        totp_secret = EXCLUDED.totp_secret,
        totp_pending_secret = EXCLUDED.totp_pending_secret,
        totp_enabled = EXCLUDED.totp_enabled,
        totp_last_step = EXCLUDED.totp_last_step'
);
foreach ($users as $user) {
    if (!is_array($user) || !filter_var((string)($user['email'] ?? ''), FILTER_VALIDATE_EMAIL)) continue;
    $userInsert->execute([
        (int)($user['id'] ?? 0) > 0 ? (int)$user['id'] : null,
        (string)($user['full_name'] ?? ''),
        strtolower((string)$user['email']),
        $user['password_hash'] ?? null,
        in_array(($user['role'] ?? ''), ['student', 'teacher'], true) ? $user['role'] : 'student',
        $user['google_sub'] ?? null,
        $user['avatar_url'] ?? null,
        (int)($user['email_verified'] ?? 0),
        $user['totp_secret'] ?? null,
        $user['totp_pending_secret'] ?? null,
        (int)($user['totp_enabled'] ?? 0),
        $user['totp_last_step'] ?? null,
        $user['last_login_at'] ?? null,
    ]);
}
$pdo->exec("SELECT setval(pg_get_serial_sequence('users','id'), GREATEST((SELECT COALESCE(MAX(id), 1) FROM users), 1))");

$stateInsert = $pdo->prepare(
    'INSERT INTO app_state (user_id, state_key, state_value) VALUES (?, ?, ?)
     ON CONFLICT (user_id, state_key) DO UPDATE SET state_value = EXCLUDED.state_value'
);
$savedStates = 0;
foreach ($states as $state) {
    if (!is_array($state)) continue;
    $userId = (int)($state['user_id'] ?? 0);
    $key = (string)($state['state_key'] ?? '');
    if ($userId <= 0 || $key === '' || !array_key_exists('state_value', $state)) continue;
    $stateInsert->execute([$userId, $key, (string)$state['state_value']]);
    $savedStates++;
}
$pdo->commit();
json_response(['ok' => true, 'users' => count($users), 'states' => $savedStates]);

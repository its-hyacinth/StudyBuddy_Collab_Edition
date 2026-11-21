<?php
declare(strict_types=1);
if (session_status() !== PHP_SESSION_ACTIVE) {
    require_once __DIR__ . '/auth_lib.php';
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => app_cookie_path(),
        'httponly' => true,
        'secure' => request_is_https(),
        'samesite' => 'Lax',
    ]);
    session_start();
    if (empty($_SESSION['user']) && !empty($_COOKIE['sb_remember'])) {
        try {
            require_once __DIR__ . '/../config/database.php';
            require_once __DIR__ . '/remember.php';
            remember_restore(db());
        } catch (Throwable $error) {
            error_log($error->getMessage());
        }
    }
}
if (empty($_SESSION['csrf_token'])) $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
function json_response(array $data, int $status=200): never {
    http_response_code($status); header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE); exit;
}
function require_user(): array {
    if (empty($_SESSION['user'])) json_response(['ok'=>false,'message'=>'Please log in.'], 401);
    return $_SESSION['user'];
}
function verify_csrf(): void {
    $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? ($_POST['csrf_token'] ?? '');
    if (!$token || !hash_equals($_SESSION['csrf_token'] ?? '', $token)) json_response(['ok'=>false,'message'=>'Invalid security token. Refresh the page and try again.'], 419);
}
function e(string $value): string { return htmlspecialchars($value, ENT_QUOTES, 'UTF-8'); }

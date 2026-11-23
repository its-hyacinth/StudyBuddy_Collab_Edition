<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/bootstrap.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/auth_lib.php';
require_once __DIR__ . '/../includes/google_api.php';

$action = (string)($_GET['action'] ?? '');
$user = $_SESSION['user'] ?? null;

function google_redirect(string $path, array $query): never {
    $join = str_contains($path, '?') ? '&' : '?';
    header('Location: ' . $path . $join . http_build_query($query));
    exit;
}

try {
    $pdo = db();

    if ($action === 'start') {
        if (empty($user['id'])) {
            header('Location: ' . app_cookie_path() . 'index.php');
            exit;
        }
        $next = google_safe_next((string)($_GET['next'] ?? ''), (string)$user['role']);
        if (!google_is_configured()) {
            google_redirect($next, ['google' => 'error', 'message' => 'Add the Google client ID and secret in config/google.php.']);
        }
        $_SESSION['google_oauth_state'] = bin2hex(random_bytes(16));
        $_SESSION['google_oauth_next'] = $next;
        $query = http_build_query([
            'client_id' => GOOGLE_CLIENT_ID,
            'redirect_uri' => google_redirect_uri(),
            'response_type' => 'code',
            'scope' => google_oauth_scopes(),
            'access_type' => 'offline',
            'prompt' => 'consent',
            'include_granted_scopes' => 'true',
            'state' => $_SESSION['google_oauth_state'],
        ], '', '&', PHP_QUERY_RFC3986);
        header('Location: https://accounts.google.com/o/oauth2/v2/auth?' . $query);
        exit;
    }

    if ($action === 'callback') {
        if (empty($user['id'])) {
            header('Location: ' . app_cookie_path() . 'index.php');
            exit;
        }
        $next = google_safe_next((string)($_SESSION['google_oauth_next'] ?? ''), (string)($user['role'] ?? 'student'));
        $expected = (string)($_SESSION['google_oauth_state'] ?? '');
        unset($_SESSION['google_oauth_next'], $_SESSION['google_oauth_state']);
        $state = (string)($_GET['state'] ?? '');
        if ($expected === '' || !hash_equals($expected, $state)) {
            google_redirect($next, ['google' => 'error', 'message' => 'Google sign-in could not be verified. Try again.']);
        }
        if (!empty($_GET['error'])) {
            google_redirect($next, ['google' => 'error', 'message' => 'Google connection was cancelled.']);
        }
        $token = google_exchange_code((string)($_GET['code'] ?? ''));
        $email = google_account_email((string)$token['access_token']);
        google_save_connection(
            $pdo,
            (int)$user['id'],
            $email,
            (string)$token['refresh_token'],
            (string)$token['access_token'],
            (int)($token['expires_in'] ?? 3600),
            (string)($token['scope'] ?? google_oauth_scopes())
        );
        google_redirect($next, ['google' => 'connected']);
    }

    if (empty($user['id'])) {
        json_response(['ok' => false, 'message' => 'Please log in.'], 401);
    }
    $userId = (int)$user['id'];

    if ($action === 'status') {
        json_response(google_status_payload($pdo, $userId));
    }

    if ($action === 'disconnect') {
        if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') json_response(['ok' => false, 'message' => 'Method not allowed.'], 405);
        verify_csrf();
        google_disconnect($pdo, $userId);
        json_response(['ok' => true]);
    }

    if ($action === 'classroom') {
        json_response(['ok' => true, 'live' => true] + google_classroom_payload($pdo, $userId));
    }

    if ($action === 'drive') {
        json_response(['ok' => true, 'live' => true] + google_drive_list(
            $pdo,
            $userId,
            (string)($_GET['view'] ?? 'my-drive'),
            (string)($_GET['parent'] ?? '')
        ));
    }

    if ($action === 'drive-update') {
        if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') json_response(['ok' => false, 'message' => 'Method not allowed.'], 405);
        verify_csrf();
        $patch = [];
        if (isset($_POST['starred'])) $patch['starred'] = $_POST['starred'] === '1';
        if (isset($_POST['trashed'])) $patch['trashed'] = $_POST['trashed'] === '1';
        google_drive_update($pdo, $userId, (string)($_POST['id'] ?? ''), $patch);
        json_response(['ok' => true]);
    }

    if ($action === 'drive-folder') {
        if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') json_response(['ok' => false, 'message' => 'Method not allowed.'], 405);
        verify_csrf();
        json_response(['ok' => true, 'folder' => google_drive_folder(
            $pdo,
            $userId,
            (string)($_POST['name'] ?? ''),
            (string)($_POST['parent'] ?? '')
        )]);
    }

    if ($action === 'calendar') {
        json_response(['ok' => true, 'events' => google_calendar_events(
            $pdo,
            $userId,
            (string)($_GET['start'] ?? ''),
            (string)($_GET['end'] ?? ''),
            (string)($_GET['timeZone'] ?? '')
        )]);
    }

    if ($action === 'calendar-save') {
        if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') json_response(['ok' => false, 'message' => 'Method not allowed.'], 405);
        verify_csrf();
        json_response(['ok' => true, 'event' => google_calendar_save($pdo, $userId, $_POST)]);
    }

    if ($action === 'calendar-delete') {
        if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') json_response(['ok' => false, 'message' => 'Method not allowed.'], 405);
        verify_csrf();
        google_calendar_delete($pdo, $userId, (string)($_POST['id'] ?? ''));
        json_response(['ok' => true]);
    }

    if ($action === 'drive-upload') {
        if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') json_response(['ok' => false, 'message' => 'Method not allowed.'], 405);
        verify_csrf();
        json_response(['ok' => true, 'file' => google_drive_upload(
            $pdo,
            $userId,
            $_FILES['file'] ?? [],
            (string)($_POST['parent'] ?? '')
        )]);
    }

    json_response(['ok' => false, 'message' => 'Unknown Google action.'], 404);
} catch (Throwable $error) {
    if ($action === 'start' || $action === 'callback') {
        $next = google_safe_next((string)($_SESSION['google_oauth_next'] ?? ''), (string)($user['role'] ?? 'student'));
        google_redirect($next, ['google' => 'error', 'message' => $error->getMessage()]);
    }
    $message = $error->getMessage();
    $status = str_contains($message, 'not connected') || str_contains($message, 'Connect the account') ? 409 : 502;
    if (str_contains($message, 'Database') || str_contains($message, 'SQLSTATE')) $status = 500;
    json_response(['ok' => false, 'message' => $message], $status);
}

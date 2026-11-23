<?php
declare(strict_types=1);

/**
 * Google OAuth for sign-in, Classroom, Drive, and Calendar.
 *
 * 1. Google Cloud Console → APIs & Services → Enable "Google Classroom API", "Google Drive API", and "Google Calendar API".
 * 2. OAuth consent screen → External → Testing. Add the Google account you will sign in with as a test user.
 * 3. Credentials → Create credentials → OAuth client ID → Web application.
 *    Authorized JavaScript origins: http://localhost
 *    Authorized redirect URI (copy exactly, including the query string):
 *    http://localhost/StudyBuddy_Collab_Edition/api/google.php?action=callback
 * 4. Paste the client ID and client secret below, or into config/google.local.php
 *    (that file overrides this one and should stay off any shared copy).
 */
$googleLocal = __DIR__ . '/google.local.php';
if (is_file($googleLocal)) {
    require_once $googleLocal;
}
if (!defined('GOOGLE_CLIENT_ID')) {
    define('GOOGLE_CLIENT_ID', '');
}
if (!defined('GOOGLE_CLIENT_SECRET')) {
    define('GOOGLE_CLIENT_SECRET', '');
}

function google_is_configured(): bool {
    return GOOGLE_CLIENT_ID !== '' && GOOGLE_CLIENT_SECRET !== '';
}

function google_redirect_uri(): string {
    $https = function_exists('request_is_https') && request_is_https();
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $base = function_exists('app_cookie_path') ? rtrim(app_cookie_path(), '/') : '';
    return ($https ? 'https' : 'http') . '://' . $host . $base . '/api/google.php?action=callback';
}

function google_oauth_scopes(): string {
    return implode(' ', [
        'openid',
        'email',
        'https://www.googleapis.com/auth/classroom.courses.readonly',
        'https://www.googleapis.com/auth/classroom.coursework.me.readonly',
        'https://www.googleapis.com/auth/classroom.coursework.students.readonly',
        'https://www.googleapis.com/auth/classroom.rosters.readonly',
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/calendar.events',
    ]);
}

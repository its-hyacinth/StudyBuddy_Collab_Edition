<?php
declare(strict_types=1);

/**
 * Google OAuth for sign-in, Classroom, Drive, and Calendar.
 *
 * 1. Google Cloud Console → APIs & Services → Enable "Google Classroom API", "Google Drive API", and "Google Calendar API".
 * 2. OAuth consent screen → External → Testing. Add the Google account you will sign in with as a test user.
 * 3. Credentials → Create credentials → OAuth client ID → Web application.
 *    Authorized JavaScript origins: http://localhost
 *    and https://studybuddy-zeta-umber.vercel.app
 *    Authorized redirect URIs (copy exactly, no extra slash or query):
 *    http://localhost/StudyBuddy_Collab_Edition/api/google-callback.php
 *    https://studybuddy-zeta-umber.vercel.app/api/google-callback.php
 * 4. For this computer, put the client ID and secret in config/google.local.php
 *    (that file stays off GitHub). For the hosted site, set GOOGLE_CLIENT_ID and
 *    GOOGLE_CLIENT_SECRET in the Vercel project environment.
 */
$googleLocal = __DIR__ . '/google.local.php';
if (is_file($googleLocal)) {
    require_once $googleLocal;
}
if (!defined('GOOGLE_CLIENT_ID')) {
    $googleClientId = getenv('GOOGLE_CLIENT_ID');
    if (!is_string($googleClientId) || $googleClientId === '') $googleClientId = (string)($_ENV['GOOGLE_CLIENT_ID'] ?? $_SERVER['GOOGLE_CLIENT_ID'] ?? '');
    define('GOOGLE_CLIENT_ID', $googleClientId);
}
if (!defined('GOOGLE_CLIENT_SECRET')) {
    $googleClientSecret = getenv('GOOGLE_CLIENT_SECRET');
    if (!is_string($googleClientSecret) || $googleClientSecret === '') $googleClientSecret = (string)($_ENV['GOOGLE_CLIENT_SECRET'] ?? $_SERVER['GOOGLE_CLIENT_SECRET'] ?? '');
    define('GOOGLE_CLIENT_SECRET', $googleClientSecret);
}

function google_is_configured(): bool {
    return GOOGLE_CLIENT_ID !== '' && GOOGLE_CLIENT_SECRET !== '';
}

function google_redirect_uri(): string {
    $https = function_exists('request_is_https') && request_is_https();
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    if ($host === '127.0.0.1') $host = 'localhost';
    $base = function_exists('app_cookie_path') ? rtrim(app_cookie_path(), '/') : '';
    return ($https ? 'https' : 'http') . '://' . $host . $base . '/api/google-callback.php';
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
        'https://www.googleapis.com/auth/calendar.calendarlist.readonly',
    ]);
}

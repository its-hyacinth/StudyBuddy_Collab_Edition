<?php
// StudyBuddy database configuration.
// XAMPP uses the defaults below. The hosted site reads SB_DB_HOST, SB_DB_NAME,
// SB_DB_USER, and SB_DB_PASS from the server environment instead.
declare(strict_types=1);
function db_setting(string $name, string $default): string {
    $value = getenv($name);
    return ($value === false || $value === '') ? $default : $value;
}
function db(): PDO {
    static $pdo = null;
    if ($pdo instanceof PDO) return $pdo;
    $host = db_setting('SB_DB_HOST', '127.0.0.1');
    $name = db_setting('SB_DB_NAME', 'Studybuddy');
    $user = db_setting('SB_DB_USER', 'root');
    $pass = db_setting('SB_DB_PASS', '');
    $dsn = 'mysql:host=' . $host . ';dbname=' . $name . ';charset=utf8mb4';
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    return $pdo;
}

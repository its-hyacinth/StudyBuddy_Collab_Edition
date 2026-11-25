<?php
require_once __DIR__ . '/bootstrap.php';
$expectedRole = $expectedRole ?? null;
if (empty($_SESSION['user'])) { header('Location: ' . (str_contains($_SERVER['PHP_SELF'], '/student/') || str_contains($_SERVER['PHP_SELF'], '/teacher/') ? '../index.php' : 'index.php')); exit; }
if ($expectedRole && ($_SESSION['user']['role'] ?? '') !== $expectedRole) {
    header('Location: ' . (($_SESSION['user']['role'] ?? '') === 'teacher' ? '../teacher/dashboard.php' : '../student/dashboard.php')); exit;
}
$sbUserJson = json_encode(
    $_SESSION['user'],
    JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT
);
if (!($_SERVER['REQUEST_METHOD'] === 'POST' && ($_SERVER['HTTP_X_PROFILE_SAVE'] ?? '') === '1')) {
    echo '<script>window.SB_SESSION=' . $sbUserJson . ';</script>';
}

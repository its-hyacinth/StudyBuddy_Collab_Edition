<?php
require_once __DIR__ . '/bootstrap.php';
$expectedRole = $expectedRole ?? null;
if (empty($_SESSION['user'])) { header('Location: ' . (str_contains($_SERVER['PHP_SELF'], '/student/') || str_contains($_SERVER['PHP_SELF'], '/teacher/') ? '../index.php' : 'index.php')); exit; }
if ($expectedRole && ($_SESSION['user']['role'] ?? '') !== $expectedRole) {
    header('Location: ' . (($_SESSION['user']['role'] ?? '') === 'teacher' ? '../teacher/dashboard.php' : '../student/dashboard.php')); exit;
}

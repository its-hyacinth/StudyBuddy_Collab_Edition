<?php
declare(strict_types=1);

/**
 * Vercel can only run PHP from the api directory. Apache on XAMPP still
 * opens each page directly, so this file is the entry point for the hosted site.
 */
$root = dirname(__DIR__);

if (PHP_SAPI === 'cli-server') {
    $localPath = parse_url((string)($_SERVER['REQUEST_URI'] ?? '/'), PHP_URL_PATH) ?: '/';
    $localFile = $root . rawurldecode($localPath);
    if (is_file($localFile) && !str_ends_with(strtolower($localFile), '.php')) {
        return false;
    }
}

$path = '/';
if (isset($_GET['__path']) && is_string($_GET['__path'])) {
    $path = $_GET['__path'];
    unset($_GET['__path'], $_REQUEST['__path']);
    $_SERVER['QUERY_STRING'] = http_build_query($_GET);
} else {
    $path = (string)(parse_url((string)($_SERVER['REQUEST_URI'] ?? '/'), PHP_URL_PATH) ?: '/');
}

$path = rawurldecode(str_replace('\\', '/', $path));
$pathOnly = parse_url($path, PHP_URL_PATH);
$path = is_string($pathOnly) ? $pathOnly : '/';
if ($path === '' || $path[0] !== '/') $path = '/' . ltrim($path, '/');

$script = str_replace('\\', '/', (string)($_SERVER['SCRIPT_NAME'] ?? ''));
if (preg_match('#^(.*?)/api/index\.php$#', $script, $match) && $match[1] !== '' && str_starts_with($path, $match[1] . '/')) {
    $path = substr($path, strlen($match[1])) ?: '/';
}

$relative = trim($path, '/');
if ($relative === '') $relative = 'index.php';
if (str_ends_with($relative, '/')) $relative .= 'index.php';
if (!str_ends_with(strtolower($relative), '.php') && is_file($root . '/' . $relative . '.php')) {
    $relative .= '.php';
}

$top = explode('/', $relative, 2)[0];
$allowedTop = $top === 'index.php' || $top === 'signup.php' || in_array($top, ['student', 'teacher', 'api'], true);
$realRoot = realpath($root);
$realTarget = realpath($root . '/' . $relative);
$target = $realTarget === false ? '' : str_replace('\\', '/', $realTarget);
$rootPath = $realRoot === false ? '' : str_replace('\\', '/', $realRoot);
$self = str_replace('\\', '/', (string)realpath(__FILE__));
$inside = $target !== '' && $rootPath !== '' && ($target === $rootPath || str_starts_with($target, $rootPath . '/'));

if (
    !$allowedTop
    || !$inside
    || !is_file($target)
    || !str_ends_with(strtolower($target), '.php')
    || str_contains($relative, '..')
    || preg_match('#^(?:includes|config)(?:/|$)#', $relative)
) {
    http_response_code(404);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Not found';
    exit;
}

if ($target === $self) $target = $rootPath . '/index.php';

$public = '/' . ltrim(substr($target, strlen($rootPath)), '/');
$_SERVER['SCRIPT_NAME'] = $public;
$_SERVER['PHP_SELF'] = $public;
$_SERVER['SCRIPT_FILENAME'] = $target;

chdir(dirname($target));
require $target;

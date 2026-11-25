<?php
declare(strict_types=1);
require_once __DIR__ . '/../includes/bootstrap.php';
require_once __DIR__ . '/../config/database.php';

$user = require_user();
$pdo = db();
$userId = (int)$user['id'];
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    if ($method === 'GET') {
        header('Cache-Control: no-store, private');
        $count = $pdo->prepare('SELECT COUNT(*) FROM notifications WHERE user_id=? AND is_read=0');
        $count->execute([$userId]);
        $items = $pdo->prepare('SELECT id,title,body,target_url,is_read,created_at FROM notifications WHERE user_id=? ORDER BY created_at DESC,id DESC LIMIT 25');
        $items->execute([$userId]);
        json_response([
            'ok' => true,
            'unreadCount' => (int)$count->fetchColumn(),
            'items' => $items->fetchAll(),
        ]);
    }

    if ($method === 'POST') {
        verify_csrf();
        $input = json_decode(file_get_contents('php://input'), true);
        if (!is_array($input)) json_response(['ok'=>false,'message'=>'Invalid JSON request.'], 400);
        $action = (string)($input['action'] ?? '');

        if ($action === 'read-all') {
            $pdo->prepare('UPDATE notifications SET is_read=1 WHERE user_id=? AND is_read=0')->execute([$userId]);
            json_response(['ok'=>true]);
        }
        if ($action === 'read') {
            $id = filter_var($input['id'] ?? null, FILTER_VALIDATE_INT);
            if (!$id || $id < 1) json_response(['ok'=>false,'message'=>'Invalid notification.'], 400);
            $pdo->prepare('UPDATE notifications SET is_read=1 WHERE user_id=? AND id=?')->execute([$userId, $id]);
            json_response(['ok'=>true]);
        }

        json_response(['ok'=>false,'message'=>'Unsupported notification action.'], 400);
    }

    json_response(['ok'=>false,'message'=>'Method not allowed.'], 405);
} catch (Throwable $error) {
    error_log($error->__toString());
    json_response(['ok'=>false,'message'=>'Notifications could not be loaded.'], 500);
}

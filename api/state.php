<?php
declare(strict_types=1);
require_once __DIR__ . '/../includes/bootstrap.php';
require_once __DIR__ . '/../config/database.php';

$user = require_user();
$pdo = db();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

/*
 * The existing JavaScript data helpers expect whole collections to be read
 * and written at once. Keep that interface so the current UI and Classroom
 * sync code continue to work, while storing each collection in its own
 * MySQL table. app_state is retained for settings/progress and compatibility.
 */
$collections = [
    'studybuddy_subjects'   => ['table'=>'subjects', 'columns'=>['external_id','name','code','description','payload_json','sort_order']],
    'studybuddy_assignments'=> ['table'=>'assignments', 'columns'=>['external_id','subject_external_id','title','description','due_date','status','payload_json','sort_order']],
    'studybuddy_tasks'      => ['table'=>'tasks', 'columns'=>['external_id','title','description','due_date','status','payload_json','sort_order']],
    'studybuddy_schedule'   => ['table'=>'schedules', 'columns'=>['external_id','title','schedule_date','day_name','start_time','end_time','room','payload_json','sort_order']],
    'studybuddy_classes'    => ['table'=>'classes', 'columns'=>['external_id','class_name','subject_name','section','room','payload_json','sort_order']],
    'studybuddy_students'   => ['table'=>'students', 'columns'=>['external_id','student_name','email','student_number','payload_json','sort_order']],
    'studybuddy_grades'     => ['table'=>'grades', 'columns'=>['external_id','student_external_id','assignment_external_id','score','max_score','payload_json','sort_order']],
    'studybuddy_messages'   => ['table'=>'messages', 'columns'=>['external_id','sender_name','recipient_name','message_body','is_read','payload_json','sort_order']],
    'studybuddy_resources'  => ['table'=>'resources', 'columns'=>['external_id','title','description','file_url','payload_json','sort_order']],
    'studybuddy_drive'      => ['table'=>'drive_files', 'columns'=>['external_id','title','mime_type','file_url','payload_json','sort_order']],
];

$studentKeys = ['studybuddy_subjects','studybuddy_assignments','studybuddy_tasks','studybuddy_schedule','studybuddy_classes','studybuddy_progress','studybuddy_settings','studybuddy_drive'];
$teacherKeys = ['studybuddy_assignments','studybuddy_schedule','studybuddy_classes','studybuddy_students','studybuddy_grades','studybuddy_messages','studybuddy_resources','studybuddy_settings'];
$allowed = ($user['role'] ?? '') === 'teacher' ? $teacherKeys : $studentKeys;

require_once __DIR__ . '/../includes/collections.php';

try {
    if ($method === 'GET') {
        $isBatch = isset($_GET['keys']);
        $keysParam = $isBatch ? $_GET['keys'] : ($_GET['key'] ?? '');
        if (!is_string($keysParam)) json_response(['ok'=>false,'message'=>'Invalid data key.'], 400);
        $keys = $isBatch ? array_values(array_unique(explode(',', $keysParam))) : [$keysParam];
        if (!$keys || in_array('', $keys, true) || array_diff($keys, $allowed)) {
            json_response(['ok'=>false,'message'=>'Invalid data key for this account role.'], 403);
        }

        $values = [];
        if ($isBatch) {
            $placeholders = implode(',', array_fill(0, count($keys), '?'));
            $batch = $pdo->prepare("SELECT state_key, state_value FROM app_state WHERE user_id=? AND state_key IN ($placeholders)");
            $batch->execute(array_merge([(int)$user['id']], $keys));
            foreach ($batch->fetchAll() as $row) {
                $values[$row['state_key']] = json_decode((string)$row['state_value'], true);
            }
        }
        foreach ($keys as $key) {
            if (array_key_exists($key, $values)) continue;
            if (isset($collections[$key])) {
                $table = $collections[$key]['table'];
                $stmt = $pdo->prepare("SELECT payload_json FROM {$table} WHERE user_id = ? ORDER BY sort_order ASC, id ASC");
                $stmt->execute([(int)$user['id']]);
                $rows = $stmt->fetchAll(PDO::FETCH_COLUMN);
                if ($rows) {
                    $values[$key] = array_map(static fn($json) => json_decode((string)$json, true) ?? [], $rows);
                    continue;
                }
            }

            $stmt = $pdo->prepare('SELECT state_value FROM app_state WHERE user_id=? AND state_key=?');
            $stmt->execute([(int)$user['id'], $key]);
            $row = $stmt->fetch();
            $legacyValue = $row ? json_decode($row['state_value'], true) : null;
            // Lazy migration: older versions stored whole collections only in app_state.
            if (isset($collections[$key]) && is_array($legacyValue)) {
                $pdo->beginTransaction();
                persistCollectionRows($pdo, (int)$user['id'], $key, $legacyValue, $collections);
                $pdo->commit();
            }
            $values[$key] = $legacyValue;
        }
        json_response($isBatch ? ['ok'=>true,'values'=>$values] : ['ok'=>true,'value'=>$values[$keys[0]]]);
    }

    if ($method === 'POST') {
        verify_csrf();
        $input = json_decode(file_get_contents('php://input'), true);
        if (!is_array($input)) json_response(['ok'=>false,'message'=>'Invalid JSON request.'], 400);
        $key = (string)($input['key'] ?? '');
        if (!in_array($key, $allowed, true)) json_response(['ok'=>false,'message'=>'Invalid data key for this account role.'], 403);
        $value = $input['value'] ?? null;
        $json = json_encode($value, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
        if ($json === false) json_response(['ok'=>false,'message'=>'The submitted data could not be encoded.'], 422);
        if ($key === 'studybuddy_classes' && is_array($value)) {
            require_once __DIR__ . '/../includes/join_codes.php';
            sb_ensure_join_codes($pdo);
        }

        $pdo->beginTransaction();
        $notifyKey = ($user['role'] ?? '') === 'student'
            && in_array($key, ['studybuddy_assignments','studybuddy_tasks'], true)
            && is_array($value);
        $deliverAssignments = ($user['role'] ?? '') === 'teacher'
            && $key === 'studybuddy_assignments'
            && is_array($value);
        $previousAssignments = [];
        if ($deliverAssignments) {
            require_once __DIR__ . '/../includes/assignment_delivery.php';
            $previousAssignments = sb_load_user_collection($pdo, (int)$user['id'], $key, $collections);
        }
        $existingIds = $notifyKey ? existingCollectionIds($pdo, (int)$user['id'], $key, $collections) : [];
        $stmt = $pdo->prepare('INSERT INTO app_state(user_id,state_key,state_value) VALUES(?,?,?) ON DUPLICATE KEY UPDATE state_value=VALUES(state_value)');
        $stmt->execute([(int)$user['id'], $key, $json]);

        if (isset($collections[$key])) {
            if (!is_array($value)) {
                $pdo->rollBack();
                json_response(['ok'=>false,'message'=>'This data collection must be an array.'], 422);
            }
            persistCollectionRows($pdo, (int)$user['id'], $key, $value, $collections);
            if ($key === 'studybuddy_classes') {
                require_once __DIR__ . '/../includes/join_codes.php';
                sb_sync_join_codes($pdo, (int)$user['id'], $value);
            }
        }
        if ($notifyKey) notifyStudentCollectionAdditions($pdo, (int)$user['id'], $key, $value, $existingIds);
        $delivery = null;
        $mailQueue = [];
        if ($deliverAssignments) {
            $delivery = deliver_teacher_assignments(
                $pdo,
                (int)$user['id'],
                (string)($user['name'] ?? 'Your teacher'),
                $previousAssignments,
                $value,
                $collections
            );
            $mailQueue = $delivery['mailQueue'] ?? [];
            unset($delivery['mailQueue']);
        }
        $pdo->commit();
        foreach ($mailQueue as $message) {
            if (sb_send_assignment_mail($message)) $delivery['emailed']++;
            else $delivery['emailFailed']++;
        }
        json_response($delivery ? ['ok'=>true, 'delivery'=>$delivery] : ['ok'=>true]);
    }

    if ($method === 'DELETE') {
        verify_csrf();
        $key = (string)($_GET['key'] ?? '');
        if (!in_array($key, $allowed, true)) json_response(['ok'=>false,'message'=>'Invalid data key for this account role.'], 403);
        $pdo->beginTransaction();
        $pdo->prepare('DELETE FROM app_state WHERE user_id=? AND state_key=?')->execute([(int)$user['id'], $key]);
        if (isset($collections[$key])) {
            $table = $collections[$key]['table'];
            $pdo->prepare("DELETE FROM {$table} WHERE user_id=?")->execute([(int)$user['id']]);
        }
        $pdo->commit();
        json_response(['ok'=>true]);
    }

    json_response(['ok'=>false,'message'=>'Method not allowed.'], 405);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    error_log($e->__toString());
    json_response(['ok'=>false,'message'=>'Database operation failed. Check database setup and the PHP error log.'], 500);
}

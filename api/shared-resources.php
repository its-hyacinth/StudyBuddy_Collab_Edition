<?php
declare(strict_types=1);
require_once __DIR__ . '/../includes/bootstrap.php';
require_once __DIR__ . '/../config/database.php';

$user = require_user();
$pdo = null;
try {
    $pdo = db();
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    if ($method === 'POST') {
        if (($user['role'] ?? '') !== 'teacher') {
            json_response(['ok'=>false,'message'=>'Only teachers can share resources.'], 403);
        }
        verify_csrf();

        $pdo->beginTransaction();
        $resourceQuery = $pdo->prepare('SELECT id, payload_json FROM resources WHERE user_id = ? FOR UPDATE');
        $resourceQuery->execute([(int)$user['id']]);
        $rows = $resourceQuery->fetchAll();
        $resources = [];
        $sharedCount = 0;
        foreach ($rows as $row) {
            $resource = json_decode((string)$row['payload_json'], true);
            if (!is_array($resource)) continue;
            if (($resource['type'] ?? '') !== 'folder' && !empty($resource['url'])) {
                $resource['shared'] = true;
                $sharedCount++;
            }
            $resources[] = $resource;
            $payload = json_encode($resource, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
            if ($payload === false) throw new RuntimeException('Unable to encode a resource.');
            $pdo->prepare('UPDATE resources SET payload_json = ? WHERE id = ? AND user_id = ?')
                ->execute([$payload, (int)$row['id'], (int)$user['id']]);
        }
        if ($sharedCount === 0) {
            $pdo->rollBack();
            json_response(['ok'=>false,'message'=>'Upload a file or add a Google Drive link before sharing resources.'], 422);
        }

        $state = json_encode($resources, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
        $pdo->prepare(
            'INSERT INTO app_state(user_id, state_key, state_value) VALUES(?,?,?)
             ON DUPLICATE KEY UPDATE state_value = VALUES(state_value)'
        )->execute([(int)$user['id'], 'studybuddy_resources', $state]);

        $students = linkedStudentsForTeacher($pdo, (int)$user['id']);
        $pdo->commit();
        json_response(['ok'=>true,'resourceCount'=>$sharedCount,'studentCount'=>count($students)]);
    }

    if ($method !== 'GET') json_response(['ok'=>false,'message'=>'Method not allowed.'], 405);
    if (($user['role'] ?? '') !== 'student') {
        json_response(['ok'=>false,'message'=>'Only students can view shared resources.'], 403);
    }

    $email = strtolower(trim((string)($user['email'] ?? '')));
    if ($email === '') json_response(['ok'=>true,'resources'=>[]]);
    $teachers = linkedTeachersForStudent($pdo, $email);
    $resources = [];
    $resourceQuery = $pdo->prepare(
        'SELECT payload_json FROM resources WHERE user_id = ? ORDER BY sort_order ASC, id ASC'
    );
    foreach ($teachers as $teacherId => $teacherName) {
        $resourceQuery->execute([$teacherId]);
        foreach ($resourceQuery->fetchAll(PDO::FETCH_COLUMN) as $payload) {
            $resource = json_decode((string)$payload, true);
            if (!is_array($resource) || empty($resource['shared']) || empty($resource['url'])) continue;
            if (($resource['type'] ?? '') === 'folder') continue;
            $resource['teacherName'] = $teacherName;
            $resources[] = $resource;
        }
    }
    json_response(['ok'=>true,'resources'=>$resources]);
} catch (Throwable $error) {
    if ($pdo instanceof PDO && $pdo->inTransaction()) $pdo->rollBack();
    error_log($error->__toString());
    json_response(['ok'=>false,'message'=>'Unable to load shared resources.'], 500);
}

function linkedStudentsForTeacher(PDO $pdo, int $teacherId): array {
    $query = $pdo->prepare(
        "SELECT s.payload_json, c.external_id AS class_external_id,
                c.payload_json AS class_payload_json, u.id AS student_user_id
         FROM students s
         JOIN classes c ON c.user_id = s.user_id
         JOIN users u ON u.role = 'student' AND LOWER(u.email) = LOWER(s.email)
         WHERE s.user_id = ?"
    );
    $query->execute([$teacherId]);
    $students = [];
    foreach ($query->fetchAll() as $row) {
        $student = json_decode((string)$row['payload_json'], true);
        $class = json_decode((string)$row['class_payload_json'], true);
        if (!is_array($student) || !is_array($class)) continue;
        $studentClassId = (string)($student['classId'] ?? '');
        $classId = (string)($class['id'] ?? $row['class_external_id'] ?? '');
        if ($studentClassId !== '' && $studentClassId === $classId) {
            $students[(int)$row['student_user_id']] = true;
        }
    }
    return array_keys($students);
}

function linkedTeachersForStudent(PDO $pdo, string $email): array {
    $query = $pdo->prepare(
        "SELECT s.user_id, s.payload_json, c.external_id AS class_external_id,
                c.payload_json AS class_payload_json, t.full_name AS teacher_name
         FROM students s
         JOIN users t ON t.id = s.user_id AND t.role = 'teacher'
         JOIN classes c ON c.user_id = s.user_id
         WHERE LOWER(s.email) = ?"
    );
    $query->execute([$email]);
    $teachers = [];
    foreach ($query->fetchAll() as $row) {
        $student = json_decode((string)$row['payload_json'], true);
        $class = json_decode((string)$row['class_payload_json'], true);
        if (!is_array($student) || !is_array($class)) continue;
        $studentClassId = (string)($student['classId'] ?? '');
        $classId = (string)($class['id'] ?? $row['class_external_id'] ?? '');
        if ($studentClassId === '' || $studentClassId !== $classId) continue;
        $teachers[(int)$row['user_id']] = (string)$row['teacher_name'];
    }
    return $teachers;
}

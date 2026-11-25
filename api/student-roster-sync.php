<?php
declare(strict_types=1);
require_once __DIR__ . '/../includes/bootstrap.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/collections.php';
require_once __DIR__ . '/../includes/assignment_delivery.php';

$user = require_user();
if (($user['role'] ?? '') !== 'teacher') {
    json_response(['ok' => false, 'message' => 'Only teachers can sync their student roster.'], 403);
}
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    json_response(['ok' => false, 'message' => 'Method not allowed.'], 405);
}
verify_csrf();
sb_commit_session();

$pdo = db();
$teacherId = (int)$user['id'];
$collections = sb_collections();

try {
    $pdo->beginTransaction();
    $students = sb_load_user_collection($pdo, $teacherId, 'studybuddy_students', $collections);
    $userIds = [];
    $emails = [];
    foreach ($students as $student) {
        if (!is_array($student)) continue;
        $studentUserId = (int)($student['userId'] ?? 0);
        if ($studentUserId > 0) $userIds[$studentUserId] = $studentUserId;
        $email = strtolower(trim((string)($student['email'] ?? '')));
        if ($email !== '') $emails[$email] = $email;
    }

    $accountsById = [];
    $accountsByEmail = [];
    if ($userIds || $emails) {
        $filters = [];
        $params = [];
        if ($userIds) {
            $filters[] = 'u.id IN (' . implode(',', array_fill(0, count($userIds), '?')) . ')';
            array_push($params, ...array_values($userIds));
        }
        if ($emails) {
            $filters[] = 'LOWER(u.email) IN (' . implode(',', array_fill(0, count($emails), '?')) . ')';
            array_push($params, ...array_values($emails));
        }
        $query = "SELECT u.id, u.full_name, u.email, profile.state_value AS profile_json
             FROM users u
             LEFT JOIN app_state profile
               ON profile.user_id = u.id AND profile.state_key = 'student_profile'
             WHERE u.role = 'student' AND (" . implode(' OR ', $filters) . ')';
        $statement = $pdo->prepare($query);
        $statement->execute($params);
        foreach ($statement->fetchAll(PDO::FETCH_ASSOC) as $account) {
            $accountsById[(int)$account['id']] = $account;
            $accountsByEmail[strtolower((string)$account['email'])] = $account;
        }
    }

    $updated = 0;
    $linked = 0;
    foreach ($students as &$student) {
        if (!is_array($student)) continue;
        $studentUserId = (int)($student['userId'] ?? 0);
        $email = strtolower(trim((string)($student['email'] ?? '')));
        $account = $studentUserId > 0 ? ($accountsById[$studentUserId] ?? null) : null;
        if (!$account && $email !== '') $account = $accountsByEmail[$email] ?? null;
        if (!$account) continue;

        $profile = json_decode((string)($account['profile_json'] ?? ''), true);
        $profile = is_array($profile) ? $profile : [];
        $before = $student;
        $student['userId'] = (int)$account['id'];
        $student['name'] = (string)$account['full_name'];
        $student['email'] = (string)$account['email'];
        foreach (['studentId' => 'studentId', 'course' => 'course', 'yearLevel' => 'year'] as $profileKey => $studentKey) {
            if (array_key_exists($profileKey, $profile)) {
                $student[$studentKey] = trim((string)$profile[$profileKey]);
            }
        }
        $linked += 1;
        if ($student !== $before) $updated += 1;
    }
    unset($student);

    if ($updated > 0) {
        sb_save_user_collection($pdo, $teacherId, 'studybuddy_students', $students, $collections);
    }
    $pdo->commit();
    json_response(['ok' => true, 'linked' => $linked, 'updated' => $updated]);
} catch (PDOException $error) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    error_log($error->__toString());
    json_response(['ok' => false, 'message' => 'Student information could not be synced. Please try again.'], 500);
}

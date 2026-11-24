<?php
declare(strict_types=1);
require_once __DIR__ . '/../includes/bootstrap.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/collections.php';
require_once __DIR__ . '/../includes/join_codes.php';
require_once __DIR__ . '/../includes/assignment_delivery.php';

$user = require_user();
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    json_response(['ok' => false, 'message' => 'Method not allowed.'], 405);
}
verify_csrf();
$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) json_response(['ok' => false, 'message' => 'Invalid JSON request.'], 400);

$pdo = db();
$collections = sb_collections();

try {
    sb_ensure_join_codes($pdo);
    if (($user['role'] ?? '') === 'student') {
        $code = strtoupper(preg_replace('/[^A-Z0-9]/', '', (string)($input['code'] ?? '')) ?? '');
        if (strlen($code) < 5) json_response(['ok' => false, 'message' => 'Enter the class code from your teacher.'], 422);
        $lookup = $pdo->prepare('SELECT teacher_id, class_external_id FROM class_join_codes WHERE code=?');
        $lookup->execute([$code]);
        $match = $lookup->fetch();
        if (!$match) json_response(['ok' => false, 'message' => 'That class code was not found. Ask your teacher to open the class and copy the code again.'], 404);

        $teacherId = (int)$match['teacher_id'];
        $classId = (string)$match['class_external_id'];
        $classes = sb_load_user_collection($pdo, $teacherId, 'studybuddy_classes', $collections);
        $class = null;
        foreach ($classes as $item) {
            if (is_array($item) && (string)($item['id'] ?? '') === $classId) $class = $item;
        }
        if (!$class) json_response(['ok' => false, 'message' => 'This class is no longer available.'], 404);
        $teacher = $pdo->prepare('SELECT full_name FROM users WHERE id=?');
        $teacher->execute([$teacherId]);
        $teacherName = (string)($teacher->fetchColumn() ?: 'Your teacher');

        $pdo->beginTransaction();
        deliver_joined_class(
            $pdo,
            $teacherId,
            $teacherName,
            $class,
            (int)$user['id'],
            (string)($user['name'] ?? ''),
            (string)($user['email'] ?? ''),
            $collections
        );
        $pdo->commit();
        json_response(['ok' => true, 'className' => sb_class_display($class), 'classId' => $classId]);
    }

    if (($user['role'] ?? '') !== 'teacher') {
        json_response(['ok' => false, 'message' => 'This account cannot change a class roster.'], 403);
    }

    $classId = trim((string)($input['classId'] ?? ''));
    $studentName = trim((string)($input['name'] ?? ''));
    $studentEmail = strtolower(trim((string)($input['email'] ?? '')));
    if ($classId === '' || $studentName === '' || !filter_var($studentEmail, FILTER_VALIDATE_EMAIL)) {
        json_response(['ok' => false, 'message' => 'Student name, a valid email, and the class are required.'], 422);
    }
    $classes = sb_load_user_collection($pdo, (int)$user['id'], 'studybuddy_classes', $collections);
    $class = null;
    foreach ($classes as $item) {
        if (is_array($item) && (string)($item['id'] ?? '') === $classId) $class = $item;
    }
    if (!$class) json_response(['ok' => false, 'message' => 'Open the class from My Classes and try again.'], 404);

    $account = $pdo->prepare("SELECT id, full_name, email FROM users WHERE email=? AND role='student' LIMIT 1");
    $account->execute([$studentEmail]);
    $studentUser = $account->fetch();

    $pdo->beginTransaction();
    if ($studentUser) {
        deliver_joined_class(
            $pdo,
            (int)$user['id'],
            (string)($user['name'] ?? 'Your teacher'),
            $class,
            (int)$studentUser['id'],
            $studentName !== '' ? $studentName : (string)$studentUser['full_name'],
            $studentEmail,
            $collections
        );
    } else {
        $students = sb_load_user_collection($pdo, (int)$user['id'], 'studybuddy_students', $collections);
        $found = false;
        foreach ($students as &$student) {
            if (!is_array($student) || strtolower(trim((string)($student['email'] ?? ''))) !== $studentEmail) continue;
            $ids = is_array($student['classIds'] ?? null) ? $student['classIds'] : [];
            if (!empty($student['classId'])) $ids[] = (string)$student['classId'];
            $ids[] = $classId;
            $student['classIds'] = array_values(array_unique(array_map('strval', $ids)));
            $student['name'] = $studentName;
            $student['status'] = 'active';
            $found = true;
            break;
        }
        unset($student);
        if (!$found) {
            $students[] = [
                'id' => 'stu_' . bin2hex(random_bytes(4)),
                'name' => $studentName,
                'email' => $studentEmail,
                'course' => (string)($class['course'] ?? ''),
                'year' => (string)($class['year'] ?? ''),
                'section' => (string)($class['block'] ?? ''),
                'standing' => 'regular',
                'classId' => $classId,
                'classIds' => [$classId],
                'subjectCode' => (string)($class['subjectCode'] ?? $class['code'] ?? ''),
                'gpa' => 0,
                'status' => 'active',
                'source' => 'teacher',
            ];
        }
        sb_save_user_collection($pdo, (int)$user['id'], 'studybuddy_students', $students, $collections);
    }
    $pdo->commit();
    json_response([
        'ok' => true,
        'linked' => (bool)$studentUser,
        'message' => $studentUser
            ? 'Student added. Their StudyBuddy account now shows this class and its assignments.'
            : 'Student added to this class. They will see it after they sign up with this email and join with the class code.',
    ]);
} catch (Throwable $error) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    error_log($error->__toString());
    json_response(['ok' => false, 'message' => 'Could not update this class. Please try again.'], 500);
}

<?php
declare(strict_types=1);
require_once __DIR__ . '/../includes/bootstrap.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/collections.php';
require_once __DIR__ . '/../includes/assignment_delivery.php';
require_once __DIR__ . '/../includes/google_mail.php';

$user = require_user();
if (($user['role'] ?? '') !== 'teacher') {
    json_response(['ok' => false, 'message' => 'Only teachers can send messages to students.'], 403);
}
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    json_response(['ok' => false, 'message' => 'Method not allowed.'], 405);
}
verify_csrf();
sb_commit_session();

$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) {
    json_response(['ok' => false, 'message' => 'Invalid message request.'], 400);
}

$rosterStudentId = is_scalar($input['studentId'] ?? null) ? trim((string)$input['studentId']) : '';
$classId = is_scalar($input['classId'] ?? null) ? trim((string)$input['classId']) : '';
$subject = is_scalar($input['subject'] ?? null) ? trim((string)$input['subject']) : '';
$body = is_scalar($input['body'] ?? null) ? trim((string)$input['body']) : '';
if ($rosterStudentId === '' || $body === '') {
    json_response(['ok' => false, 'message' => 'Select a student and enter a message.'], 422);
}
if (mb_strlen($subject) > 180 || mb_strlen($body) > 10000) {
    json_response(['ok' => false, 'message' => 'The subject or message is too long.'], 422);
}

$teacherId = (int)$user['id'];
try {
    $pdo = db();
    $collections = sb_collections();
    $students = sb_load_user_collection($pdo, $teacherId, 'studybuddy_students', $collections);
    $student = null;
    foreach ($students as $rosterEntry) {
        if (is_array($rosterEntry) && (string)($rosterEntry['id'] ?? '') === $rosterStudentId) {
            $student = $rosterEntry;
            break;
        }
    }
    if (!$student) {
        json_response(['ok' => false, 'message' => 'The selected student is not on your roster.'], 404);
    }

    $recipientEmail = strtolower(trim((string)($student['email'] ?? '')));
    $studentUserId = (int)($student['userId'] ?? 0);
    if ($studentUserId > 0) {
        $account = $pdo->prepare("SELECT email FROM users WHERE id = ? AND role = 'student' LIMIT 1");
        $account->execute([$studentUserId]);
        $currentEmail = $account->fetchColumn();
        if (is_string($currentEmail) && trim($currentEmail) !== '') {
            $recipientEmail = strtolower(trim($currentEmail));
        }
    }
    if (!filter_var($recipientEmail, FILTER_VALIDATE_EMAIL)) {
        json_response(['ok' => false, 'message' => 'The selected student has no valid email address on file.'], 422);
    }

    $classLabel = '';
    if ($classId !== '') {
        $classes = sb_load_user_collection($pdo, $teacherId, 'studybuddy_classes', $collections);
        $classFound = false;
        foreach ($classes as $class) {
            if (is_array($class) && (string)($class['id'] ?? '') === $classId) {
                $classFound = true;
                $classCode = trim((string)($class['subjectCode'] ?? $class['code'] ?? ''));
                $className = trim((string)($class['name'] ?? $class['subject'] ?? ''));
                $classLabel = trim($classCode . ($classCode !== '' && $className !== '' ? ' - ' : '') . $className);
                break;
            }
        }
        if (!$classFound) {
            json_response(['ok' => false, 'message' => 'The selected class is not on your class list.'], 422);
        }
        if ($classLabel === '') $classLabel = 'Class';
    }
} catch (PDOException $error) {
    error_log($error->__toString());
    json_response(['ok' => false, 'message' => 'The message could not be sent. Please try again.'], 500);
}

$teacherName = trim((string)($user['name'] ?? 'Your teacher')) ?: 'Your teacher';
$studentName = trim((string)($student['name'] ?? 'Student')) ?: 'Student';
$mailSubject = $subject !== '' ? $subject : 'Message from ' . $teacherName;
$mailBody = "Hello " . $studentName . ",\n\n" . $body;
if ($classLabel !== '') $mailBody .= "\n\nClass: " . $classLabel;
$mailBody .= "\n\n--\n" . $teacherName . "\nStudyBuddy";

try {
    google_send_email($pdo, $teacherId, $recipientEmail, $mailSubject, $mailBody);
} catch (RuntimeException | PDOException $error) {
    error_log('Student email delivery failed: ' . $error->getMessage());
    $message = $error->getMessage();
    $status = $error instanceof PDOException ? 500 : 502;
    if (str_starts_with($message, 'Connect Google') || str_starts_with($message, 'Reconnect Google')) $status = 409;
    json_response(['ok' => false, 'message' => $message], $status);
}

json_response(['ok' => true, 'recipientEmail' => $recipientEmail]);

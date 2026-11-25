<?php
declare(strict_types=1);
require_once __DIR__ . '/../includes/bootstrap.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/collections.php';
require_once __DIR__ . '/../includes/assignment_delivery.php';

$user = require_user();
$pdo = db();
$collections = sb_collections();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

function sb_submission_download(PDO $pdo, array $user, array $collections): never {
    $gradeId = trim((string)($_GET['file'] ?? ''));
    if ($gradeId === '') json_response(['ok' => false, 'message' => 'Submission not found.'], 404);

    $grade = null;
    if (($user['role'] ?? '') === 'teacher') {
        foreach (sb_load_user_collection($pdo, (int)$user['id'], 'studybuddy_grades', $collections) as $item) {
            if (is_array($item) && (string)($item['id'] ?? '') === $gradeId) {
                $grade = $item;
                break;
            }
        }
    } elseif (($user['role'] ?? '') === 'student') {
        $assignments = sb_load_user_collection($pdo, (int)$user['id'], 'studybuddy_assignments', $collections);
        foreach ($assignments as $assignment) {
            if (!is_array($assignment) || (string)($assignment['submission']['gradeId'] ?? '') !== $gradeId) continue;
            $teacherId = (int)($assignment['teacherId'] ?? 0);
            if ($teacherId < 1) break;
            foreach (sb_load_user_collection($pdo, $teacherId, 'studybuddy_grades', $collections) as $item) {
                if (is_array($item) && (string)($item['id'] ?? '') === $gradeId
                    && (int)($item['studentId'] ?? 0) === (int)$user['id']) {
                    $grade = $item;
                    break 2;
                }
            }
            break;
        }
    }

    $path = (string)($grade['submission']['storagePath'] ?? '');
    $uploadsDir = realpath(__DIR__ . '/../uploads');
    $filePath = $path !== '' ? realpath(__DIR__ . '/../' . $path) : false;
    if (!$grade || !$uploadsDir || !$filePath
        || !str_starts_with($filePath, $uploadsDir . DIRECTORY_SEPARATOR)
        || !is_file($filePath)) {
        json_response(['ok' => false, 'message' => 'Submission file not found.'], 404);
    }

    $name = preg_replace('/[\r\n"\\\\]/', '_', (string)($grade['submission']['fileName'] ?? 'submission')) ?: 'submission';
    $fallbackName = preg_replace('/[^A-Za-z0-9._ -]/', '_', $name) ?: 'submission';
    header('Content-Type: application/octet-stream');
    header('X-Content-Type-Options: nosniff');
    header("Content-Disposition: attachment; filename=\"{$fallbackName}\"; filename*=UTF-8''" . rawurlencode($name));
    header('Content-Length: ' . (string)filesize($filePath));
    readfile($filePath);
    exit;
}

if ($method === 'GET') sb_submission_download($pdo, $user, $collections);
if ($method !== 'POST') json_response(['ok' => false, 'message' => 'Method not allowed.'], 405);
if (($user['role'] ?? '') !== 'student') json_response(['ok' => false, 'message' => 'Only students can submit assignment files.'], 403);
verify_csrf();

$assignmentId = trim((string)($_POST['assignmentId'] ?? ''));
if ($assignmentId === '') json_response(['ok' => false, 'message' => 'Choose an assignment to submit.'], 422);
if (empty($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    json_response(['ok' => false, 'message' => 'Choose a file to upload.'], 422);
}

$file = $_FILES['file'];
if ((int)$file['size'] < 1 || (int)$file['size'] > 10 * 1024 * 1024) {
    json_response(['ok' => false, 'message' => 'Choose a file smaller than 10 MB.'], 413);
}
$allowedExtensions = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'png', 'jpg', 'jpeg'];
$extension = strtolower(pathinfo((string)$file['name'], PATHINFO_EXTENSION));
if (!in_array($extension, $allowedExtensions, true)) {
    json_response(['ok' => false, 'message' => 'This file type is not allowed.'], 422);
}

$studentId = (int)$user['id'];
$studentAssignments = sb_load_user_collection($pdo, $studentId, 'studybuddy_assignments', $collections);
$studentCopy = null;
foreach ($studentAssignments as $item) {
    if (is_array($item) && (string)($item['id'] ?? '') === $assignmentId) {
        $studentCopy = $item;
        break;
    }
}
$teacherId = (int)($studentCopy['teacherId'] ?? 0);
$teacherAssignmentId = (string)($studentCopy['teacherAssignmentId'] ?? '');
if (!$studentCopy || ($studentCopy['source'] ?? '') !== 'teacher' || $teacherId < 1 || $teacherAssignmentId === '') {
    json_response(['ok' => false, 'message' => 'This assignment does not accept StudyBuddy file submissions.'], 404);
}

$teacherAssignments = sb_load_user_collection($pdo, $teacherId, 'studybuddy_assignments', $collections);
$teacherAssignment = null;
foreach ($teacherAssignments as $item) {
    if (is_array($item) && (string)($item['id'] ?? '') === $teacherAssignmentId) {
        $teacherAssignment = $item;
        break;
    }
}
$teacherClasses = sb_load_user_collection($pdo, $teacherId, 'studybuddy_classes', $collections);
$teacherStudents = sb_load_user_collection($pdo, $teacherId, 'studybuddy_students', $collections);
$isRostered = false;
if ($teacherAssignment) {
    foreach (sb_roster_for_assignment($teacherAssignment, $teacherClasses, $teacherStudents) as $rosterStudent) {
        if (strtolower(trim((string)($rosterStudent['email'] ?? ''))) === strtolower(trim((string)($user['email'] ?? '')))) {
            $isRostered = true;
            break;
        }
    }
}
if (!$teacherAssignment || !$isRostered) {
    json_response(['ok' => false, 'message' => 'This assignment is no longer available to your account.'], 404);
}

$originalName = basename(str_replace('\\', '/', (string)$file['name']));
$originalName = trim(preg_replace('/[\r\n\x00-\x1F]/', '_', $originalName) ?: '');
if ($originalName === '') $originalName = 'submission.' . $extension;
$storageDir = __DIR__ . '/../uploads/' . $studentId;
if (!is_dir($storageDir) && !mkdir($storageDir, 0750, true)) {
    json_response(['ok' => false, 'message' => 'Could not create upload folder.'], 500);
}
$storedName = bin2hex(random_bytes(16)) . '.' . $extension;
$absolutePath = $storageDir . '/' . $storedName;
if (!move_uploaded_file((string)$file['tmp_name'], $absolutePath)) {
    json_response(['ok' => false, 'message' => 'Could not save uploaded file.'], 500);
}

$gradeId = 'submission_' . hash('sha256', $studentId . ':' . $teacherAssignmentId);
try {
$submittedAt = date(DATE_ATOM);
$grades = sb_load_user_collection($pdo, $teacherId, 'studybuddy_grades', $collections);
$submission = [
    'gradeId' => $gradeId,
    'fileName' => $originalName,
    'storagePath' => 'uploads/' . $studentId . '/' . $storedName,
    'submittedAt' => $submittedAt,
];
$grade = [
    'id' => $gradeId,
    'studentId' => $studentId,
    'student' => (string)($user['name'] ?? $user['full_name'] ?? 'Student'),
    'studentEmail' => (string)($user['email'] ?? ''),
    'assignmentId' => $teacherAssignmentId,
    'assignment' => (string)($teacherAssignment['title'] ?? 'Assignment'),
    'classId' => (string)($teacherAssignment['classId'] ?? ''),
    'class' => (string)($studentCopy['subject'] ?? 'Class'),
    'score' => null,
    'max' => (float)($teacherAssignment['points'] ?? 0),
    'status' => 'pending',
    'submission' => $submission,
];
$foundGrade = false;
$previousStoragePath = null;
foreach ($grades as $index => $item) {
    if (!is_array($item) || (string)($item['id'] ?? '') !== $gradeId) continue;
    $previousStoragePath = (string)($item['submission']['storagePath'] ?? '');
    $grades[$index] = $grade;
    $foundGrade = true;
    break;
}
if (!$foundGrade) $grades[] = $grade;

$studentAssignments = array_map(static function ($assignment) use ($assignmentId, $submission) {
    if (!is_array($assignment) || (string)($assignment['id'] ?? '') !== $assignmentId) return $assignment;
    $assignment['submission'] = [
        'gradeId' => $submission['gradeId'],
        'fileName' => $submission['fileName'],
        'submittedAt' => $submission['submittedAt'],
    ];
    return $assignment;
}, $studentAssignments);
$teacherAssignments = array_map(static function ($assignment) use ($teacherAssignmentId, $grades) {
    if (!is_array($assignment) || (string)($assignment['id'] ?? '') !== $teacherAssignmentId) return $assignment;
    $assignment['submissions'] = count(array_filter($grades, static fn($grade) =>
        is_array($grade) && (string)($grade['assignmentId'] ?? '') === $teacherAssignmentId
    ));
    return $assignment;
}, $teacherAssignments);

    $pdo->beginTransaction();
    sb_save_user_collection($pdo, $teacherId, 'studybuddy_grades', $grades, $collections);
    sb_save_user_collection($pdo, $teacherId, 'studybuddy_assignments', $teacherAssignments, $collections);
    sb_save_user_collection($pdo, $studentId, 'studybuddy_assignments', $studentAssignments, $collections);
    $pdo->prepare('INSERT INTO notifications (user_id, title, body) VALUES (?,?,?)')
        ->execute([$teacherId, 'Assignment submitted', $grade['student'] . ' submitted ' . $grade['assignment'] . '.']);
    $pdo->commit();
    if ($previousStoragePath !== '' && $previousStoragePath !== $submission['storagePath']) {
        $oldPath = realpath(__DIR__ . '/../' . $previousStoragePath);
        $uploadsDir = realpath(__DIR__ . '/../uploads');
        if ($oldPath && $uploadsDir && str_starts_with($oldPath, $uploadsDir . DIRECTORY_SEPARATOR) && is_file($oldPath)) {
            unlink($oldPath);
        }
    }
} catch (Throwable $error) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    if (is_file($absolutePath)) unlink($absolutePath);
    error_log($error->__toString());
    json_response(['ok' => false, 'message' => 'Could not save your submission. Please try again.'], 500);
}

json_response(['ok' => true, 'submission' => [
    'gradeId' => $gradeId,
    'fileName' => $originalName,
    'submittedAt' => $submittedAt,
]]);

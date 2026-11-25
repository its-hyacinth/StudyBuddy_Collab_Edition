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

function sb_ensure_submission_storage(PDO $pdo): void {
    $blobType = defined('SB_DB_DRIVER') && SB_DB_DRIVER === 'pgsql' ? 'BYTEA' : 'LONGBLOB';
    $pdo->exec("CREATE TABLE IF NOT EXISTS assignment_submissions (
        submission_id VARCHAR(100) PRIMARY KEY,
        teacher_id BIGINT NOT NULL,
        student_id BIGINT NOT NULL,
        assignment_id VARCHAR(120) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_content {$blobType} NOT NULL,
        submitted_at VARCHAR(40) NOT NULL
    )");
}

try {
    sb_ensure_submission_storage($pdo);
} catch (Throwable $error) {
    error_log('Could not initialize assignment submission storage: ' . $error->getMessage());
    json_response(['ok' => false, 'message' => 'The submission database is unavailable. Please contact your administrator.'], 500);
}

function sb_submission_download(PDO $pdo, array $user, array $collections): never {
    $gradeId = trim((string)($_GET['file'] ?? ''));
    if ($gradeId === '') json_response(['ok' => false, 'message' => 'Submission not found.'], 404);

    $grade = null;
    $teacherId = 0;
    $studentId = 0;
    if (($user['role'] ?? '') === 'teacher') {
        foreach (sb_load_user_collection($pdo, (int)$user['id'], 'studybuddy_grades', $collections) as $item) {
            if (is_array($item) && (string)($item['id'] ?? '') === $gradeId) {
                $grade = $item;
                $teacherId = (int)$user['id'];
                $studentId = (int)($item['studentId'] ?? 0);
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
                    $studentId = (int)$user['id'];
                    break 2;
                }
            }
            break;
        }
    }

    if (!$grade || $teacherId < 1 || $studentId < 1) {
        json_response(['ok' => false, 'message' => 'Submission file not found.'], 404);
    }
    $stmt = $pdo->prepare('SELECT file_name, file_content FROM assignment_submissions WHERE submission_id=? AND teacher_id=? AND student_id=?');
    $stmt->execute([$gradeId, $teacherId, $studentId]);
    $storedFile = $stmt->fetch();
    if (!$storedFile) json_response(['ok' => false, 'message' => 'Submission file not found.'], 404);

    $contents = $storedFile['file_content'];
    if (is_resource($contents)) $contents = stream_get_contents($contents);
    if (!is_string($contents)) json_response(['ok' => false, 'message' => 'Submission file could not be read.'], 500);

    $name = preg_replace('/[\r\n"\\\\]/', '_', (string)($storedFile['file_name'] ?? 'submission')) ?: 'submission';
    $fallbackName = preg_replace('/[^A-Za-z0-9._ -]/', '_', $name) ?: 'submission';
    header('Content-Type: application/octet-stream');
    header('X-Content-Type-Options: nosniff');
    header("Content-Disposition: attachment; filename=\"{$fallbackName}\"; filename*=UTF-8''" . rawurlencode($name));
    header('Content-Length: ' . (string)strlen($contents));
    echo $contents;
    exit;
}

if ($method === 'GET') sb_submission_download($pdo, $user, $collections);
if ($method !== 'POST') json_response(['ok' => false, 'message' => 'Method not allowed.'], 405);
if (($user['role'] ?? '') !== 'student') json_response(['ok' => false, 'message' => 'Only students can submit assignment files.'], 403);
verify_csrf();

$requestSize = (int)($_SERVER['CONTENT_LENGTH'] ?? 0);
if ($requestSize > 0 && empty($_POST) && empty($_FILES)) {
    json_response(['ok' => false, 'message' => 'The upload request is too large or could not be received. Choose a smaller file and try again.'], 413);
}
$assignmentId = trim((string)($_POST['assignmentId'] ?? ''));
if ($assignmentId === '') json_response(['ok' => false, 'message' => 'Choose an assignment to submit.'], 422);
$upload = $_FILES['file'] ?? null;
if (!is_array($upload)) {
    json_response(['ok' => false, 'message' => 'Choose a file to upload.'], 422);
}
if (($upload['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
    $error = (int)$upload['error'];
    $message = match ($error) {
        UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE => 'The file exceeds the server upload limit. Choose a smaller file.',
        UPLOAD_ERR_PARTIAL => 'The file only partially uploaded. Please try again.',
        UPLOAD_ERR_NO_FILE => 'Choose a file to upload.',
        UPLOAD_ERR_NO_TMP_DIR, UPLOAD_ERR_CANT_WRITE => 'The server could not receive the file. Please try again later.',
        UPLOAD_ERR_EXTENSION => 'The server blocked this file upload.',
        default => 'The file could not be uploaded. Please try again.',
    };
    $status = in_array($error, [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true)
        ? 413
        : (in_array($error, [UPLOAD_ERR_NO_TMP_DIR, UPLOAD_ERR_CANT_WRITE], true) ? 500 : 422);
    json_response(['ok' => false, 'message' => $message], $status);
}

$file = $upload;
if ((int)$file['size'] < 1) json_response(['ok' => false, 'message' => 'The selected file is empty.'], 422);
if ((int)$file['size'] > 4 * 1024 * 1024) {
    json_response(['ok' => false, 'message' => 'Choose a file no larger than 4 MB for Vercel uploads.'], 413);
}
$extension = strtolower(pathinfo((string)$file['name'], PATHINFO_EXTENSION));
$blockedExtensions = [
    'php', 'php3', 'php4', 'php5', 'php7', 'phtml', 'phar', 'asp', 'aspx', 'jsp', 'shtml',
    'html', 'htm', 'xhtml', 'svg', 'js', 'mjs', 'cjs', 'css', 'exe', 'dll', 'com', 'bat',
    'cmd', 'sh', 'bash', 'cgi', 'pl', 'msi', 'jar', 'war', 'htaccess', 'user.ini',
];
if (in_array($extension, $blockedExtensions, true)) {
    json_response(['ok' => false, 'message' => 'This file type cannot be submitted. Choose a document, archive, image, or coursework file.'], 422);
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

try {
    $deadlinePassed = sb_assignment_deadline_passed($teacherAssignment);
} catch (Throwable $error) {
    error_log('Could not validate assignment submission deadline: ' . $error->getMessage());
    json_response(['ok' => false, 'message' => 'The assignment deadline could not be verified. Please contact your teacher.'], 500);
}
if ($deadlinePassed) {
    json_response(['ok' => false, 'message' => 'The deadline has passed. This assignment no longer accepts submissions.'], 409);
}

$originalName = basename(str_replace('\\', '/', (string)$file['name']));
$originalName = trim(preg_replace('/[\r\n\x00-\x1F]/', '_', $originalName) ?: '');
if ($originalName === '') $originalName = 'submission.' . $extension;
$fileContents = file_get_contents((string)$file['tmp_name']);
if (!is_string($fileContents)) {
    json_response(['ok' => false, 'message' => 'The server could not read the uploaded file. Please try again.'], 500);
}

$gradeId = 'submission_' . hash('sha256', $studentId . ':' . $teacherAssignmentId);
$blobStream = null;
try {
$submittedAt = date(DATE_ATOM);
$grades = sb_load_user_collection($pdo, $teacherId, 'studybuddy_grades', $collections);
$submission = [
    'gradeId' => $gradeId,
    'fileName' => $originalName,
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
foreach ($grades as $index => $item) {
    if (!is_array($item) || (string)($item['id'] ?? '') !== $gradeId) continue;
    $grades[$index] = $grade;
    $foundGrade = true;
    break;
}
if (!$foundGrade) $grades[] = $grade;

$studentAssignments = array_map(static function ($assignment) use ($assignmentId, $submission, $teacherAssignment) {
    if (!is_array($assignment) || (string)($assignment['id'] ?? '') !== $assignmentId) return $assignment;
    $assignment['submission'] = [
        'gradeId' => $submission['gradeId'],
        'fileName' => $submission['fileName'],
        'submittedAt' => $submission['submittedAt'],
        'score' => null,
        'max' => (float)($teacherAssignment['points'] ?? 0),
        'status' => 'pending',
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
    $pdo->prepare('DELETE FROM assignment_submissions WHERE submission_id=?')->execute([$gradeId]);
    $blobStream = fopen('php://temp', 'w+b');
    if (!is_resource($blobStream) || fwrite($blobStream, $fileContents) !== strlen($fileContents) || !rewind($blobStream)) {
        throw new RuntimeException('Could not prepare uploaded file for database storage.');
    }
    $store = $pdo->prepare('INSERT INTO assignment_submissions (submission_id, teacher_id, student_id, assignment_id, file_name, file_content, submitted_at) VALUES (?,?,?,?,?,?,?)');
    $store->bindValue(1, $gradeId);
    $store->bindValue(2, $teacherId, PDO::PARAM_INT);
    $store->bindValue(3, $studentId, PDO::PARAM_INT);
    $store->bindValue(4, $teacherAssignmentId);
    $store->bindValue(5, $originalName);
    $store->bindValue(6, $blobStream, PDO::PARAM_LOB);
    $store->bindValue(7, $submittedAt);
    $store->execute();
    fclose($blobStream);
    $blobStream = null;
    sb_save_user_collection($pdo, $teacherId, 'studybuddy_grades', $grades, $collections);
    sb_save_user_collection($pdo, $teacherId, 'studybuddy_assignments', $teacherAssignments, $collections);
    sb_save_user_collection($pdo, $studentId, 'studybuddy_assignments', $studentAssignments, $collections);
    $pdo->prepare('INSERT INTO notifications (user_id, title, body) VALUES (?,?,?)')
        ->execute([$teacherId, 'Assignment submitted', $grade['student'] . ' submitted ' . $grade['assignment'] . '.']);
    $pdo->commit();
} catch (Throwable $error) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    if (is_resource($blobStream)) fclose($blobStream);
    error_log($error->__toString());
    json_response(['ok' => false, 'message' => 'Could not save your submission. Please try again.'], 500);
}

json_response(['ok' => true, 'submission' => [
    'gradeId' => $gradeId,
    'fileName' => $originalName,
    'submittedAt' => $submittedAt,
]]);

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

function sb_ensure_assignment_attachment_storage(PDO $pdo): void {
    $blobType = defined('SB_DB_DRIVER') && SB_DB_DRIVER === 'pgsql' ? 'BYTEA' : 'LONGBLOB';
    $pdo->exec("CREATE TABLE IF NOT EXISTS assignment_attachments (
        assignment_id VARCHAR(120) NOT NULL,
        teacher_id BIGINT NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        content_type VARCHAR(255) NOT NULL,
        file_size INT NOT NULL,
        file_content {$blobType} NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (teacher_id, assignment_id)
    )");
}

function sb_find_assignment_by_id(array $assignments, string $assignmentId): ?array {
    foreach ($assignments as $assignment) {
        if (is_array($assignment) && (string)($assignment['id'] ?? '') === $assignmentId) return $assignment;
    }
    return null;
}

function sb_assignment_attachment_download(PDO $pdo, array $user, array $collections): never {
    $requestedId = trim((string)($_GET['assignment'] ?? ''));
    if ($requestedId === '' || strlen($requestedId) > 120) {
        json_response(['ok' => false, 'message' => 'Attachment not found.'], 404);
    }

    $teacherId = 0;
    $assignmentId = '';
    $assignment = null;
    if (($user['role'] ?? '') === 'teacher') {
        $teacherId = (int)$user['id'];
        $assignment = sb_find_assignment_by_id(
            sb_load_user_collection($pdo, $teacherId, 'studybuddy_assignments', $collections),
            $requestedId
        );
        $assignmentId = $requestedId;
    } elseif (($user['role'] ?? '') === 'student') {
        $copy = sb_find_assignment_by_id(
            sb_load_user_collection($pdo, (int)$user['id'], 'studybuddy_assignments', $collections),
            $requestedId
        );
        if ($copy && ($copy['source'] ?? '') === 'teacher') {
            $teacherId = (int)($copy['teacherId'] ?? 0);
            $assignmentId = (string)($copy['teacherAssignmentId'] ?? '');
            if ($teacherId > 0 && $assignmentId !== '') {
                $assignment = sb_find_assignment_by_id(
                    sb_load_user_collection($pdo, $teacherId, 'studybuddy_assignments', $collections),
                    $assignmentId
                );
                $studentEmail = strtolower(trim((string)($user['email'] ?? '')));
                $isRostered = false;
                if ($assignment && $studentEmail !== '' && !sb_is_classroom_assignment($assignment)) {
                    $teacherClasses = sb_load_user_collection($pdo, $teacherId, 'studybuddy_classes', $collections);
                    $teacherStudents = sb_load_user_collection($pdo, $teacherId, 'studybuddy_students', $collections);
                    foreach (sb_roster_for_assignment($assignment, $teacherClasses, $teacherStudents) as $student) {
                        if (strtolower(trim((string)($student['email'] ?? ''))) === $studentEmail) {
                            $isRostered = true;
                            break;
                        }
                    }
                }
                if ((string)($copy['id'] ?? '') !== sb_student_copy_id($teacherId, $assignmentId)
                    || empty($copy['attachment'])
                    || !$isRostered) {
                    $assignment = null;
                }
            }
        }
    }

    if ($teacherId < 1 || !$assignment || empty($assignment['attachment'])) {
        json_response(['ok' => false, 'message' => 'Attachment not found.'], 404);
    }

    $stmt = $pdo->prepare('SELECT file_name, content_type, file_size, file_content FROM assignment_attachments WHERE assignment_id=? AND teacher_id=?');
    $stmt->execute([$assignmentId, $teacherId]);
    $storedFile = $stmt->fetch();
    if (!$storedFile) json_response(['ok' => false, 'message' => 'Attachment not found.'], 404);

    $contents = $storedFile['file_content'];
    if (is_resource($contents)) $contents = stream_get_contents($contents);
    if (!is_string($contents)) {
        json_response(['ok' => false, 'message' => 'The attachment could not be read.'], 500);
    }

    $name = preg_replace('/[\r\n"\\\\]/', '_', (string)($storedFile['file_name'] ?? 'assignment-attachment')) ?: 'assignment-attachment';
    $fallbackName = preg_replace('/[^A-Za-z0-9._ -]/', '_', $name) ?: 'assignment-attachment';
    $contentType = strtolower(trim((string)($storedFile['content_type'] ?? '')));
    if (!preg_match('/^[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]+$/i', $contentType)) {
        $contentType = 'application/octet-stream';
    }
    $inlineTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'text/plain'];
    $disposition = in_array($contentType, $inlineTypes, true) ? 'inline' : 'attachment';
    header('Content-Type: ' . $contentType);
    header('X-Content-Type-Options: nosniff');
    header('Cache-Control: private, no-store');
    header("Content-Disposition: {$disposition}; filename=\"{$fallbackName}\"; filename*=UTF-8''" . rawurlencode($name));
    header('Content-Length: ' . (string)strlen($contents));
    echo $contents;
    exit;
}

try {
    sb_ensure_assignment_attachment_storage($pdo);
} catch (Throwable $error) {
    error_log('Could not initialize assignment attachment storage: ' . $error->getMessage());
    json_response(['ok' => false, 'message' => 'The attachment database is unavailable. Please contact your administrator.'], 500);
}

if ($method === 'GET') sb_assignment_attachment_download($pdo, $user, $collections);
if ($method !== 'POST') json_response(['ok' => false, 'message' => 'Method not allowed.'], 405);
if (($user['role'] ?? '') !== 'teacher') {
    json_response(['ok' => false, 'message' => 'Only teachers can add assignment attachments.'], 403);
}
verify_csrf();

$requestSize = (int)($_SERVER['CONTENT_LENGTH'] ?? 0);
if ($requestSize > 0 && empty($_POST) && empty($_FILES)) {
    json_response(['ok' => false, 'message' => 'The upload request is too large or could not be received. Choose a smaller file and try again.'], 413);
}
$assignmentId = trim((string)($_POST['assignmentId'] ?? ''));
if ($assignmentId === '' || strlen($assignmentId) > 120) {
    json_response(['ok' => false, 'message' => 'Choose a valid assignment.'], 422);
}
$upload = $_FILES['file'] ?? null;
if (!is_array($upload)) json_response(['ok' => false, 'message' => 'Choose a file to attach.'], 422);
if (($upload['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
    $error = (int)$upload['error'];
    $message = match ($error) {
        UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE => 'The file exceeds the server upload limit. Choose a smaller file.',
        UPLOAD_ERR_PARTIAL => 'The file only partially uploaded. Please try again.',
        UPLOAD_ERR_NO_FILE => 'Choose a file to attach.',
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
if ((int)($file['size'] ?? 0) < 1) json_response(['ok' => false, 'message' => 'The selected file is empty.'], 422);
if ((int)$file['size'] > 4 * 1024 * 1024) {
    json_response(['ok' => false, 'message' => 'Choose a file no larger than 4 MB.'], 413);
}
$extension = strtolower(pathinfo((string)($file['name'] ?? ''), PATHINFO_EXTENSION));
$blockedExtensions = [
    'php', 'php3', 'php4', 'php5', 'php7', 'phtml', 'phar', 'asp', 'aspx', 'jsp', 'shtml',
    'html', 'htm', 'xhtml', 'svg', 'js', 'mjs', 'cjs', 'css', 'exe', 'dll', 'com', 'bat',
    'cmd', 'sh', 'bash', 'cgi', 'pl', 'msi', 'jar', 'war', 'htaccess', 'user.ini',
];
if (in_array($extension, $blockedExtensions, true)) {
    json_response(['ok' => false, 'message' => 'This file type cannot be attached. Choose a document, archive, image, or coursework file.'], 422);
}

$teacherId = (int)$user['id'];
$assignments = sb_load_user_collection($pdo, $teacherId, 'studybuddy_assignments', $collections);
$assignment = sb_find_assignment_by_id($assignments, $assignmentId);
if (!$assignment || !empty($assignment['classroomWorkId']) || ($assignment['source'] ?? '') === 'classroom') {
    json_response(['ok' => false, 'message' => 'This assignment is no longer available for editing.'], 404);
}

$originalName = basename(str_replace('\\', '/', (string)($file['name'] ?? '')));
$originalName = trim(preg_replace('/[\r\n\x00-\x1F]/', '_', $originalName) ?: '');
if ($originalName === '') $originalName = 'assignment-attachment';
if (function_exists('mb_substr')) $originalName = mb_substr($originalName, 0, 255, 'UTF-8');
else $originalName = substr($originalName, 0, 255);
$fileContents = file_get_contents((string)($file['tmp_name'] ?? ''));
if (!is_string($fileContents)) {
    json_response(['ok' => false, 'message' => 'The server could not read the selected file. Please try again.'], 500);
}
$finfo = new finfo(FILEINFO_MIME_TYPE);
$detectedType = $finfo->file((string)$file['tmp_name']);
$contentType = is_string($detectedType) ? $detectedType : 'application/octet-stream';
$metadata = [
    'fileName' => $originalName,
    'contentType' => $contentType,
    'size' => strlen($fileContents),
];

$blobStream = null;
try {
    $pdo->beginTransaction();
    $pdo->prepare('DELETE FROM assignment_attachments WHERE assignment_id=? AND teacher_id=?')->execute([$assignmentId, $teacherId]);
    $blobStream = fopen('php://temp', 'w+b');
    if (!is_resource($blobStream) || fwrite($blobStream, $fileContents) !== strlen($fileContents) || !rewind($blobStream)) {
        throw new RuntimeException('Could not prepare assignment attachment for database storage.');
    }
    $store = $pdo->prepare('INSERT INTO assignment_attachments (assignment_id, teacher_id, file_name, content_type, file_size, file_content) VALUES (?,?,?,?,?,?)');
    $store->bindValue(1, $assignmentId);
    $store->bindValue(2, $teacherId, PDO::PARAM_INT);
    $store->bindValue(3, $originalName);
    $store->bindValue(4, $contentType);
    $store->bindValue(5, $metadata['size'], PDO::PARAM_INT);
    $store->bindValue(6, $blobStream, PDO::PARAM_LOB);
    $store->execute();
    fclose($blobStream);
    $blobStream = null;
    $pdo->commit();
} catch (Throwable $error) {
    if (is_resource($blobStream)) fclose($blobStream);
    if ($pdo->inTransaction()) $pdo->rollBack();
    error_log('Could not save assignment attachment: ' . $error->getMessage());
    json_response(['ok' => false, 'message' => 'The attachment could not be saved. Please try again.'], 500);
}

json_response(['ok' => true, 'attachment' => $metadata]);

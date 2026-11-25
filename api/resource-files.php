<?php
declare(strict_types=1);
require_once __DIR__ . '/../includes/bootstrap.php';
require_once __DIR__ . '/../config/database.php';

$user = require_user();
$pdo = db();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

function sb_ensure_resource_file_storage(PDO $pdo): void {
    $blobType = defined('SB_DB_DRIVER') && SB_DB_DRIVER === 'pgsql' ? 'BYTEA' : 'LONGBLOB';
    $pdo->exec("CREATE TABLE IF NOT EXISTS resource_files (
        resource_id VARCHAR(100) PRIMARY KEY,
        teacher_id BIGINT NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        content_type VARCHAR(255) NOT NULL,
        file_size INT NOT NULL,
        file_content {$blobType} NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
}

function sb_resource_student_has_teacher(PDO $pdo, int $teacherId, int $studentId): bool {
    $query = $pdo->prepare(
        "SELECT s.payload_json, c.external_id AS class_external_id, c.payload_json AS class_payload_json
         FROM students s
         JOIN classes c ON c.user_id = s.user_id
         JOIN users u ON u.id = ? AND u.role = 'student' AND LOWER(u.email) = LOWER(s.email)
         WHERE s.user_id = ?"
    );
    $query->execute([$studentId, $teacherId]);
    foreach ($query->fetchAll() as $row) {
        $student = json_decode((string)$row['payload_json'], true);
        $class = json_decode((string)$row['class_payload_json'], true);
        if (!is_array($student) || !is_array($class)) continue;
        $studentClassId = (string)($student['classId'] ?? '');
        $classId = (string)($class['id'] ?? $row['class_external_id'] ?? '');
        if ($studentClassId !== '' && $studentClassId === $classId) return true;
    }
    return false;
}

function sb_resource_file_download(PDO $pdo, array $user): never {
    $resourceId = trim((string)($_GET['resource'] ?? ''));
    if ($resourceId === '' || strlen($resourceId) > 100) {
        json_response(['ok' => false, 'message' => 'Resource file not found.'], 404);
    }

    $query = $pdo->prepare(
        'SELECT teacher_id, file_name, content_type, file_content FROM resource_files WHERE resource_id = ?'
    );
    $query->execute([$resourceId]);
    $file = $query->fetch();
    if (!$file) json_response(['ok' => false, 'message' => 'Resource file not found.'], 404);

    $teacherId = (int)$file['teacher_id'];
    if (($user['role'] ?? '') === 'teacher') {
        if ($teacherId !== (int)$user['id']) {
            json_response(['ok' => false, 'message' => 'Resource file not found.'], 404);
        }
    } elseif (($user['role'] ?? '') === 'student') {
        $resourceQuery = $pdo->prepare('SELECT payload_json FROM resources WHERE user_id = ? AND external_id = ?');
        $resourceQuery->execute([$teacherId, $resourceId]);
        $resource = json_decode((string)($resourceQuery->fetchColumn() ?: ''), true);
        if (!is_array($resource) || empty($resource['shared'])
            || !sb_resource_student_has_teacher($pdo, $teacherId, (int)$user['id'])) {
            json_response(['ok' => false, 'message' => 'Resource file not found.'], 404);
        }
    } else {
        json_response(['ok' => false, 'message' => 'This account cannot access resource files.'], 403);
    }

    $contents = $file['file_content'];
    if (is_resource($contents)) $contents = stream_get_contents($contents);
    if (!is_string($contents)) {
        json_response(['ok' => false, 'message' => 'The resource file could not be read.'], 500);
    }

    $name = preg_replace('/[\r\n"\\\\]/', '_', (string)($file['file_name'] ?? 'resource')) ?: 'resource';
    $fallbackName = preg_replace('/[^A-Za-z0-9._ -]/', '_', $name) ?: 'resource';
    $contentType = strtolower(trim((string)($file['content_type'] ?? '')));
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
    sb_ensure_resource_file_storage($pdo);
} catch (Throwable $error) {
    error_log('Could not initialize resource file storage: ' . $error->getMessage());
    json_response(['ok' => false, 'message' => 'Resource file storage is unavailable. Please contact your administrator.'], 500);
}

if ($method === 'GET') sb_resource_file_download($pdo, $user);

if ($method === 'DELETE') {
    if (($user['role'] ?? '') !== 'teacher') {
        json_response(['ok' => false, 'message' => 'Only teachers can delete resource files.'], 403);
    }
    verify_csrf();
    $resourceId = trim((string)($_GET['resource'] ?? ''));
    if ($resourceId === '' || strlen($resourceId) > 100) {
        json_response(['ok' => false, 'message' => 'Resource file not found.'], 404);
    }
    $delete = $pdo->prepare('DELETE FROM resource_files WHERE resource_id = ? AND teacher_id = ?');
    $delete->execute([$resourceId, (int)$user['id']]);
    if ($delete->rowCount() < 1) json_response(['ok' => false, 'message' => 'Resource file not found.'], 404);
    json_response(['ok' => true]);
}

if ($method !== 'POST') json_response(['ok' => false, 'message' => 'Method not allowed.'], 405);
if (($user['role'] ?? '') !== 'teacher') {
    json_response(['ok' => false, 'message' => 'Only teachers can upload resource files.'], 403);
}
verify_csrf();

$requestSize = (int)($_SERVER['CONTENT_LENGTH'] ?? 0);
if ($requestSize > 0 && empty($_POST) && empty($_FILES)) {
    json_response(['ok' => false, 'message' => 'The upload request is too large or could not be received. Choose a smaller file and try again.'], 413);
}
$upload = $_FILES['file'] ?? null;
if (!is_array($upload)) json_response(['ok' => false, 'message' => 'Choose a file to upload.'], 422);
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

$fileSize = (int)($upload['size'] ?? 0);
if ($fileSize < 1) json_response(['ok' => false, 'message' => 'The selected file is empty.'], 422);
if ($fileSize > 4 * 1024 * 1024) {
    json_response(['ok' => false, 'message' => 'Choose a file no larger than 4 MB.'], 413);
}
$extension = strtolower(pathinfo((string)($upload['name'] ?? ''), PATHINFO_EXTENSION));
$allowedExtensions = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'zip', 'png', 'jpg', 'jpeg'];
if (!in_array($extension, $allowedExtensions, true)) {
    json_response(['ok' => false, 'message' => 'This file type is not allowed.'], 422);
}
$temporaryPath = (string)($upload['tmp_name'] ?? '');
if ($temporaryPath === '' || !is_uploaded_file($temporaryPath)) {
    json_response(['ok' => false, 'message' => 'The uploaded file could not be verified. Please try again.'], 422);
}
$contents = file_get_contents($temporaryPath);
if (!is_string($contents)) {
    json_response(['ok' => false, 'message' => 'The server could not read the uploaded file. Please try again.'], 500);
}

$originalName = basename(str_replace('\\', '/', (string)($upload['name'] ?? 'resource')));
$originalName = trim(preg_replace('/[\r\n\x00-\x1F]/', '_', $originalName) ?: '');
if ($originalName === '') $originalName = 'resource.' . $extension;
if (function_exists('mb_substr')) $originalName = mb_substr($originalName, 0, 255, 'UTF-8');
else $originalName = substr($originalName, 0, 255);
$finfo = new finfo(FILEINFO_MIME_TYPE);
$detectedType = $finfo->file($temporaryPath);
$contentType = is_string($detectedType) ? $detectedType : 'application/octet-stream';
$resourceId = 'resource_' . bin2hex(random_bytes(24));
$blobStream = fopen('php://temp', 'w+b');

try {
    if (!is_resource($blobStream) || fwrite($blobStream, $contents) !== strlen($contents) || !rewind($blobStream)) {
        throw new RuntimeException('Could not prepare resource file for database storage.');
    }
    $store = $pdo->prepare(
        'INSERT INTO resource_files (resource_id, teacher_id, file_name, content_type, file_size, file_content) VALUES (?,?,?,?,?,?)'
    );
    $store->bindValue(1, $resourceId);
    $store->bindValue(2, (int)$user['id'], PDO::PARAM_INT);
    $store->bindValue(3, $originalName);
    $store->bindValue(4, $contentType);
    $store->bindValue(5, strlen($contents), PDO::PARAM_INT);
    $store->bindValue(6, $blobStream, PDO::PARAM_LOB);
    $store->execute();
    fclose($blobStream);
} catch (Throwable $error) {
    if (is_resource($blobStream)) fclose($blobStream);
    error_log('Could not save resource file: ' . $error->getMessage());
    json_response(['ok' => false, 'message' => 'The resource file could not be saved. Please try again.'], 500);
}

json_response([
    'ok' => true,
    'resourceId' => $resourceId,
    'name' => $originalName,
    'url' => 'api/resource-files.php?resource=' . rawurlencode($resourceId),
]);

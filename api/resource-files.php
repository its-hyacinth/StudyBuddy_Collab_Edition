<?php
declare(strict_types=1);
require_once __DIR__ . '/../includes/bootstrap.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/shared_resource_access.php';

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
    $pdo->exec("CREATE TABLE IF NOT EXISTS resource_downloads (
        teacher_id BIGINT NOT NULL,
        resource_id VARCHAR(120) NOT NULL,
        download_count INT NOT NULL DEFAULT 0,
        PRIMARY KEY (teacher_id, resource_id)
    )");
}

function sb_record_resource_download(PDO $pdo, int $teacherId, string $resourceId): void {
    if (defined('SB_DB_DRIVER') && SB_DB_DRIVER === 'pgsql') {
        $sql = 'INSERT INTO resource_downloads (teacher_id, resource_id, download_count) VALUES (?,?,1)
                ON CONFLICT (teacher_id, resource_id) DO UPDATE
                SET download_count = resource_downloads.download_count + 1';
    } else {
        $sql = 'INSERT INTO resource_downloads (teacher_id, resource_id, download_count) VALUES (?,?,1)
                ON DUPLICATE KEY UPDATE download_count = download_count + 1';
    }
    $pdo->prepare($sql)->execute([$teacherId, $resourceId]);
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
        if (!is_array($resource)
            || !sb_student_can_access_shared_resource($pdo, $teacherId, (int)$user['id'], $resource, true)) {
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
    if (($user['role'] ?? '') === 'student') {
        try {
            sb_record_resource_download($pdo, $teacherId, $resourceId);
        } catch (Throwable $error) {
            error_log('Could not record resource download: ' . $error->getMessage());
            json_response(['ok' => false, 'message' => 'The resource download could not be recorded. Please try again.'], 500);
        }
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

if ($method === 'GET' && isset($_GET['stats'])) {
    if (($user['role'] ?? '') !== 'teacher') {
        json_response(['ok' => false, 'message' => 'Only teachers can view resource download totals.'], 403);
    }
    $query = $pdo->prepare('SELECT resource_id, download_count FROM resource_downloads WHERE teacher_id = ?');
    $query->execute([(int)$user['id']]);
    $downloads = [];
    foreach ($query->fetchAll() as $row) {
        $downloads[(string)$row['resource_id']] = (int)$row['download_count'];
    }
    json_response(['ok' => true, 'downloads' => $downloads]);
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
    $pdo->beginTransaction();
    $delete = $pdo->prepare('DELETE FROM resource_files WHERE resource_id = ? AND teacher_id = ?');
    $delete->execute([$resourceId, (int)$user['id']]);
    $fileDeleted = $delete->rowCount() > 0;
    $deleteDownloads = $pdo->prepare('DELETE FROM resource_downloads WHERE resource_id = ? AND teacher_id = ?');
    $deleteDownloads->execute([$resourceId, (int)$user['id']]);
    $downloadsDeleted = $deleteDownloads->rowCount() > 0;
    $resourceQuery = $pdo->prepare('SELECT 1 FROM resources WHERE user_id = ? AND external_id = ?');
    $resourceQuery->execute([(int)$user['id'], $resourceId]);
    $resourceExists = $resourceQuery->fetchColumn() !== false;
    if (!$fileDeleted && !$downloadsDeleted && !$resourceExists) {
        $pdo->rollBack();
        json_response(['ok' => false, 'message' => 'Resource file not found.'], 404);
    }
    $pdo->commit();
    json_response(['ok' => true]);
}

if ($method !== 'POST') json_response(['ok' => false, 'message' => 'Method not allowed.'], 405);
if (str_contains(strtolower((string)($_SERVER['CONTENT_TYPE'] ?? '')), 'application/json')) {
    $input = json_decode((string)file_get_contents('php://input'), true);
    if (is_array($input) && ($input['action'] ?? '') === 'track-download') {
        if (($user['role'] ?? '') !== 'student') {
            json_response(['ok' => false, 'message' => 'Only students can record shared resource downloads.'], 403);
        }
        verify_csrf();
        $resourceId = trim((string)($input['resourceId'] ?? ''));
        if ($resourceId === '' || strlen($resourceId) > 120) {
            json_response(['ok' => false, 'message' => 'Choose a valid shared resource.'], 422);
        }
        $resourceQuery = $pdo->prepare('SELECT user_id, payload_json FROM resources WHERE external_id = ?');
        $resourceQuery->execute([$resourceId]);
        $teacherId = 0;
        foreach ($resourceQuery->fetchAll() as $row) {
            $resource = json_decode((string)$row['payload_json'], true);
            $resourceUrl = is_array($resource) ? parse_url((string)($resource['url'] ?? '')) : false;
            $isGoogleDriveUrl = is_array($resourceUrl)
                && ($resourceUrl['scheme'] ?? '') === 'https'
                && in_array(strtolower((string)($resourceUrl['host'] ?? '')), ['drive.google.com', 'docs.google.com'], true);
            $candidateTeacherId = (int)$row['user_id'];
            if (is_array($resource) && $isGoogleDriveUrl
                && sb_student_can_access_shared_resource($pdo, $candidateTeacherId, (int)$user['id'], $resource)) {
                $teacherId = $candidateTeacherId;
                break;
            }
        }
        if ($teacherId < 1) {
            json_response(['ok' => false, 'message' => 'Shared resource not found.'], 404);
        }
        try {
            sb_record_resource_download($pdo, $teacherId, $resourceId);
        } catch (Throwable $error) {
            error_log('Could not record shared resource download: ' . $error->getMessage());
            json_response(['ok' => false, 'message' => 'The resource download could not be recorded. Please try again.'], 500);
        }
        json_response(['ok' => true]);
    }
}
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

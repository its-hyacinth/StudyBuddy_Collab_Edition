<?php
declare(strict_types=1);

require_once __DIR__ . '/crypto.php';
require_once __DIR__ . '/../config/google.php';

function google_ensure_table(PDO $pdo): void {
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS google_connections (
            user_id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
            google_email VARCHAR(190) NULL,
            refresh_token TEXT NOT NULL,
            access_token TEXT NULL,
            access_expires_at DATETIME NULL,
            scopes VARCHAR(1000) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT fk_google_conn_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB'
    );
}

function google_http(string $method, string $url, array $headers = [], ?string $body = null): array {
    if (!function_exists('curl_init')) {
        throw new RuntimeException('PHP cURL is required for Google Classroom and Drive.');
    }
    $ch = curl_init($url);
    $options = [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_PROTOCOLS => CURLPROTO_HTTPS,
    ];
    if ($body !== null) {
        $options[CURLOPT_POSTFIELDS] = $body;
    }
    curl_setopt_array($ch, $options);
    $raw = curl_exec($ch);
    $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    if (!is_string($raw)) {
        throw new RuntimeException('Google request failed' . ($error !== '' ? ': ' . $error : '.'));
    }
    $decoded = json_decode($raw, true);
    return ['status' => $status, 'json' => is_array($decoded) ? $decoded : [], 'raw' => $raw];
}

function google_connection_row(PDO $pdo, int $userId): ?array {
    google_ensure_table($pdo);
    $stmt = $pdo->prepare('SELECT * FROM google_connections WHERE user_id = ?');
    $stmt->execute([$userId]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function google_status_payload(PDO $pdo, int $userId): array {
    $row = google_connection_row($pdo, $userId);
    return [
        'ok' => true,
        'configured' => google_is_configured(),
        'connected' => $row !== null,
        'email' => $row['google_email'] ?? null,
        'scopes' => (string)($row['scopes'] ?? ''),
        'redirectUri' => google_redirect_uri(),
    ];
}

function google_save_connection(PDO $pdo, int $userId, string $email, string $refreshToken, string $accessToken, int $expiresIn, string $scopes): void {
    google_ensure_table($pdo);
    $expiresAt = date('Y-m-d H:i:s', time() + max(30, $expiresIn - 60));
    $stmt = $pdo->prepare(
        'INSERT INTO google_connections (user_id, google_email, refresh_token, access_token, access_expires_at, scopes)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
            google_email = VALUES(google_email),
            refresh_token = VALUES(refresh_token),
            access_token = VALUES(access_token),
            access_expires_at = VALUES(access_expires_at),
            scopes = VALUES(scopes)'
    );
    $stmt->execute([
        $userId,
        $email,
        seal_string($refreshToken),
        seal_string($accessToken),
        $expiresAt,
        substr($scopes, 0, 1000),
    ]);
}

function google_exchange_code(string $code, bool $requireRefresh = true): array {
    $response = google_http('POST', 'https://oauth2.googleapis.com/token', [
        'Content-Type: application/x-www-form-urlencoded',
    ], http_build_query([
        'code' => $code,
        'client_id' => GOOGLE_CLIENT_ID,
        'client_secret' => GOOGLE_CLIENT_SECRET,
        'redirect_uri' => google_redirect_uri(),
        'grant_type' => 'authorization_code',
    ]));
    if ($response['status'] !== 200 || empty($response['json']['access_token']) || ($requireRefresh && empty($response['json']['refresh_token']))) {
        $message = (string)($response['json']['error_description'] ?? $response['json']['error'] ?? 'Google did not return a refresh token.');
        throw new RuntimeException($message);
    }
    return $response['json'];
}

function google_identity(string $accessToken): array {
    $response = google_http('GET', 'https://www.googleapis.com/oauth2/v2/userinfo', [
        'Authorization: Bearer ' . $accessToken,
    ]);
    $email = strtolower(trim((string)($response['json']['email'] ?? '')));
    $verified = $response['json']['verified_email'] ?? false;
    $emailOk = $verified === true || $verified === 'true' || $verified === 1;
    if ($response['status'] !== 200 || !$emailOk || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new RuntimeException('Google did not return a verified email address.');
    }
    $sub = trim((string)($response['json']['id'] ?? ''));
    if ($sub === '') throw new RuntimeException('Google account identifier is missing.');
    $name = trim((string)($response['json']['name'] ?? ''));
    if ($name === '') $name = strstr($email, '@', true) ?: 'StudyBuddy User';
    $picture = trim((string)($response['json']['picture'] ?? ''));
    if (strlen($picture) > 500 || !preg_match('#^https://#', $picture)) $picture = '';
    return ['sub' => $sub, 'email' => $email, 'name' => $name, 'picture' => $picture];
}

function google_account_email(string $accessToken): string {
    $response = google_http('GET', 'https://www.googleapis.com/oauth2/v2/userinfo', [
        'Authorization: Bearer ' . $accessToken,
    ]);
    $email = strtolower(trim((string)($response['json']['email'] ?? '')));
    if ($response['status'] !== 200 || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new RuntimeException('Google did not return an email address for this account.');
    }
    return $email;
}

function google_access_token(PDO $pdo, int $userId): string {
    $row = google_connection_row($pdo, $userId);
    if (!$row) {
        throw new RuntimeException('Google is not connected.');
    }
    $expires = $row['access_expires_at'] ? strtotime((string)$row['access_expires_at']) : 0;
    if (!empty($row['access_token']) && $expires > time() + 30) {
        return open_sealed_string((string)$row['access_token']);
    }
    $refresh = open_sealed_string((string)$row['refresh_token']);
    $response = google_http('POST', 'https://oauth2.googleapis.com/token', [
        'Content-Type: application/x-www-form-urlencoded',
    ], http_build_query([
        'client_id' => GOOGLE_CLIENT_ID,
        'client_secret' => GOOGLE_CLIENT_SECRET,
        'refresh_token' => $refresh,
        'grant_type' => 'refresh_token',
    ]));
    if ($response['status'] !== 200 || empty($response['json']['access_token'])) {
        $pdo->prepare('DELETE FROM google_connections WHERE user_id = ?')->execute([$userId]);
        throw new RuntimeException('Google access expired. Connect the account again.');
    }
    $access = (string)$response['json']['access_token'];
    $expiresAt = date('Y-m-d H:i:s', time() + max(30, (int)($response['json']['expires_in'] ?? 3600) - 60));
    $pdo->prepare('UPDATE google_connections SET access_token = ?, access_expires_at = ? WHERE user_id = ?')
        ->execute([seal_string($access), $expiresAt, $userId]);
    return $access;
}

function google_api_get(string $url, string $accessToken): array {
    $response = google_http('GET', $url, ['Authorization: Bearer ' . $accessToken]);
    if ($response['status'] === 401) {
        throw new RuntimeException('Google rejected the saved connection. Connect the account again.');
    }
    if ($response['status'] < 200 || $response['status'] >= 300) {
        $message = (string)($response['json']['error']['message'] ?? 'Google API request failed.');
        if (str_contains(strtolower($message), 'insufficient') || str_contains(strtolower($message), 'scope')) {
            $message = 'Reconnect Google so StudyBuddy can use Classroom, Drive, and Calendar.';
        }
        throw new RuntimeException($message);
    }
    return $response['json'];
}

function google_api_pages(string $url, string $accessToken, string $listKey, int $maxPages = 5): array {
    $items = [];
    $pageUrl = $url;
    for ($page = 0; $page < $maxPages && $pageUrl !== ''; $page++) {
        $json = google_api_get($pageUrl, $accessToken);
        foreach ($json[$listKey] ?? [] as $item) {
            if (is_array($item)) $items[] = $item;
        }
        $token = (string)($json['nextPageToken'] ?? '');
        if ($token === '') break;
        $join = str_contains($url, '?') ? '&' : '?';
        $pageUrl = $url . $join . 'pageToken=' . rawurlencode($token);
    }
    return $items;
}

function google_classroom_payload(PDO $pdo, int $userId): array {
    $access = google_access_token($pdo, $userId);
    $courses = google_api_pages(
        'https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE&pageSize=50',
        $access,
        'courses'
    );
    $out = [];
    $submissionErrors = [];
    foreach ($courses as $course) {
        $courseId = (string)($course['id'] ?? '');
        if ($courseId === '') continue;
        $teacherName = '';
        try {
            $teachers = google_api_get(
                'https://classroom.googleapis.com/v1/courses/' . rawurlencode($courseId) . '/teachers?pageSize=10',
                $access
            );
            foreach ($teachers['teachers'] ?? [] as $teacher) {
                $name = trim((string)($teacher['profile']['name']['fullName'] ?? ''));
                if ($name !== '') {
                    $teacherName = $name;
                    break;
                }
            }
        } catch (Throwable $error) {
            $teacherName = '';
        }
        $courseWork = [];
        try {
            $courseWork = google_api_pages(
                'https://classroom.googleapis.com/v1/courses/' . rawurlencode($courseId) . '/courseWork?pageSize=50',
                $access,
                'courseWork',
                3
            );
        } catch (Throwable $error) {
            $courseWork = [];
        }
        $submissionsByWork = [];
        $submissionFetchFailed = false;
        if ($courseWork) {
            try {
                $submissions = google_api_pages(
                    'https://classroom.googleapis.com/v1/courses/' . rawurlencode($courseId)
                        . '/courseWork/-/studentSubmissions?userId=me&pageSize=100',
                    $access,
                    'studentSubmissions',
                    10
                );
                foreach ($submissions as $submission) {
                    $workId = (string)($submission['courseWorkId'] ?? '');
                    if ($workId !== '') $submissionsByWork[$workId] = $submission;
                }
            } catch (Throwable $error) {
                $submissionFetchFailed = true;
                $submissionErrors[] = ['courseId' => $courseId, 'message' => $error->getMessage()];
            }
        }
        foreach ($courseWork as &$work) {
            $workId = (string)($work['id'] ?? '');
            $work['studentSubmission'] = $submissionsByWork[$workId] ?? null;
            if ($submissionFetchFailed) $work['studentSubmissionError'] = true;
        }
        unset($work);
        $course['teacherName'] = $teacherName;
        $course['courseWork'] = $courseWork;
        $out[] = $course;
    }
    $row = google_connection_row($pdo, $userId);
    return ['courses' => $out, 'email' => $row['google_email'] ?? '', 'submissionErrors' => $submissionErrors];
}

function google_drive_id_ok(string $id): bool {
    return $id === '' || (bool)preg_match('/^[A-Za-z0-9_-]{1,128}$/', $id);
}

function google_drive_bytes_label(int $bytes): string {
    if ($bytes <= 0) return '—';
    if ($bytes < 1024) return $bytes . ' B';
    if ($bytes < 1048576) return (string)round($bytes / 1024) . ' KB';
    if ($bytes < 1073741824) return number_format($bytes / 1048576, 1) . ' MB';
    return number_format($bytes / 1073741824, 2) . ' GB';
}

function google_drive_map_file(array $file): array {
    $mime = (string)($file['mimeType'] ?? '');
    $type = 'pdf';
    if ($mime === 'application/vnd.google-apps.folder') $type = 'folder';
    elseif (str_contains($mime, 'document') || str_contains($mime, 'wordprocessing') || $mime === 'text/plain') $type = 'doc';
    elseif (str_contains($mime, 'spreadsheet') || str_contains($mime, 'excel')) $type = 'sheet';
    elseif (str_contains($mime, 'presentation') || str_contains($mime, 'powerpoint')) $type = 'slide';
    elseif ($mime === 'application/pdf') $type = 'pdf';
    elseif (str_starts_with($mime, 'image/')) $type = 'image';
    $modified = (string)($file['modifiedTime'] ?? '');
    $owners = $file['owners'] ?? [];
    $owner = is_array($owners) && isset($owners[0]['displayName']) ? (string)$owners[0]['displayName'] : 'Me';
    return [
        'id' => (string)($file['id'] ?? ''),
        'name' => (string)($file['name'] ?? 'Untitled'),
        'type' => $type,
        'mimeType' => $mime,
        'owner' => $owner,
        'modified' => strlen($modified) >= 10 ? substr($modified, 0, 10) : '',
        'size' => google_drive_bytes_label((int)($file['size'] ?? 0)),
        'sizeBytes' => (int)($file['size'] ?? 0),
        'starred' => !empty($file['starred']),
        'trashed' => !empty($file['trashed']),
        'shared' => !empty($file['shared']),
        'url' => (string)($file['webViewLink'] ?? ''),
        'parentId' => (string)($file['parents'][0] ?? ''),
        'source' => 'google',
    ];
}

function google_drive_list(PDO $pdo, int $userId, string $view, string $parent): array {
    if (!google_drive_id_ok($parent)) {
        throw new RuntimeException('That Drive folder is not valid.');
    }
    $access = google_access_token($pdo, $userId);
    $parentId = $parent !== '' ? $parent : 'root';
    $queries = [
        'my-drive' => "'" . $parentId . "' in parents and trashed = false",
        'shared' => 'sharedWithMe = true and trashed = false',
        'recent' => 'trashed = false',
        'starred' => 'starred = true and trashed = false',
        'trash' => 'trashed = true',
        'folders' => "mimeType = 'application/vnd.google-apps.folder' and trashed = false",
    ];
    if (!isset($queries[$view])) $view = 'my-drive';
    $order = $view === 'recent' ? '&orderBy=modifiedTime%20desc&pageSize=25' : '&pageSize=100';
    $url = 'https://www.googleapis.com/drive/v3/files?fields=' . rawurlencode('files(id,name,mimeType,modifiedTime,size,starred,trashed,shared,webViewLink,parents,owners(displayName)),nextPageToken')
        . '&q=' . rawurlencode($queries[$view]) . $order . '&supportsAllDrives=false';
    $files = array_map('google_drive_map_file', google_api_pages($url, $access, 'files', $view === 'recent' ? 1 : 3));
    $trail = [];
    if ($view === 'my-drive' && $parent !== '') {
        $current = $parent;
        for ($i = 0; $i < 8 && $current !== ''; $i++) {
            $meta = google_api_get(
                'https://www.googleapis.com/drive/v3/files/' . rawurlencode($current) . '?fields=id,name,parents',
                $access
            );
            array_unshift($trail, ['id' => (string)($meta['id'] ?? $current), 'name' => (string)($meta['name'] ?? 'Folder')]);
            $current = (string)($meta['parents'][0] ?? '');
            if ($current === '') break;
        }
    }
    $about = google_api_get('https://www.googleapis.com/drive/v3/about?fields=storageQuota', $access);
    $quota = $about['storageQuota'] ?? [];
    $recentUrl = 'https://www.googleapis.com/drive/v3/files?pageSize=4&orderBy=modifiedTime%20desc&q=' . rawurlencode('trashed = false and mimeType != \'application/vnd.google-apps.folder\'')
        . '&fields=' . rawurlencode('files(id,name,mimeType,modifiedTime,size,webViewLink)');
    $recent = array_map('google_drive_map_file', google_api_get($recentUrl, $access)['files'] ?? []);
    return [
        'files' => $files,
        'trail' => $trail,
        'recent' => $recent,
        'storage' => [
            'usageBytes' => (int)($quota['usage'] ?? 0),
            'limitBytes' => (int)($quota['limit'] ?? 0),
        ],
    ];
}

function google_drive_update(PDO $pdo, int $userId, string $fileId, array $patch): void {
    if (!google_drive_id_ok($fileId) || $fileId === '') {
        throw new RuntimeException('That Drive file is not valid.');
    }
    $access = google_access_token($pdo, $userId);
    $body = [];
    if (array_key_exists('starred', $patch)) $body['starred'] = (bool)$patch['starred'];
    if (array_key_exists('trashed', $patch)) $body['trashed'] = (bool)$patch['trashed'];
    if (!$body) throw new RuntimeException('Nothing to update.');
    $response = google_http(
        'PATCH',
        'https://www.googleapis.com/drive/v3/files/' . rawurlencode($fileId),
        ['Authorization: Bearer ' . $access, 'Content-Type: application/json'],
        json_encode($body)
    );
    if ($response['status'] < 200 || $response['status'] >= 300) {
        throw new RuntimeException((string)($response['json']['error']['message'] ?? 'Google Drive could not update that file.'));
    }
}

function google_drive_folder(PDO $pdo, int $userId, string $name, string $parent): array {
    if (!google_drive_id_ok($parent)) throw new RuntimeException('That Drive folder is not valid.');
    $name = trim($name);
    if ($name === '' || strlen($name) > 180) throw new RuntimeException('Enter a folder name.');
    $access = google_access_token($pdo, $userId);
    $meta = ['name' => $name, 'mimeType' => 'application/vnd.google-apps.folder'];
    if ($parent !== '') $meta['parents'] = [$parent];
    $response = google_http(
        'POST',
        'https://www.googleapis.com/drive/v3/files',
        ['Authorization: Bearer ' . $access, 'Content-Type: application/json'],
        json_encode($meta)
    );
    if ($response['status'] < 200 || $response['status'] >= 300) {
        throw new RuntimeException((string)($response['json']['error']['message'] ?? 'Google Drive could not create the folder.'));
    }
    return google_drive_map_file($response['json']);
}

function google_drive_upload(PDO $pdo, int $userId, array $file, string $parent): array {
    if (!google_drive_id_ok($parent)) throw new RuntimeException('That Drive folder is not valid.');
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        throw new RuntimeException('Choose a file to upload.');
    }
    if (($file['size'] ?? 0) > 10 * 1024 * 1024) {
        throw new RuntimeException('Maximum upload size is 10 MB.');
    }
    $original = basename((string)($file['name'] ?? 'file'));
    $ext = strtolower(pathinfo($original, PATHINFO_EXTENSION));
    $allowed = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'png', 'jpg', 'jpeg'];
    if (!in_array($ext, $allowed, true)) {
        throw new RuntimeException('This file type is not allowed.');
    }
    $access = google_access_token($pdo, $userId);
    $meta = ['name' => $original];
    if ($parent !== '') $meta['parents'] = [$parent];
    $boundary = 'sb' . bin2hex(random_bytes(8));
    $bytes = file_get_contents((string)$file['tmp_name']);
    if ($bytes === false) throw new RuntimeException('Could not read the uploaded file.');
    $mime = mime_content_type((string)$file['tmp_name']) ?: 'application/octet-stream';
    $payload = "--{$boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n"
        . json_encode($meta) . "\r\n--{$boundary}\r\nContent-Type: {$mime}\r\n\r\n"
        . $bytes . "\r\n--{$boundary}--";
    $response = google_http(
        'POST',
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,modifiedTime,size,webViewLink,parents',
        [
            'Authorization: Bearer ' . $access,
            'Content-Type: multipart/related; boundary=' . $boundary,
        ],
        $payload
    );
    if ($response['status'] < 200 || $response['status'] >= 300) {
        throw new RuntimeException((string)($response['json']['error']['message'] ?? 'Google Drive rejected the upload.'));
    }
    return google_drive_map_file($response['json']);
}

function google_calendar_zone(string $zone): string {
    $zone = trim($zone);
    return in_array($zone, timezone_identifiers_list(), true) ? $zone : 'Asia/Manila';
}

function google_calendar_primary_zone(string $accessToken): string {
    $calendar = google_api_get(
        'https://www.googleapis.com/calendar/v3/users/me/calendarList/primary',
        $accessToken
    );
    $zone = trim((string)($calendar['timeZone'] ?? ''));
    if ($zone === '' || !in_array($zone, timezone_identifiers_list(), true)) {
        throw new RuntimeException('Google Calendar did not provide a valid primary calendar timezone.');
    }
    return $zone;
}

function google_calendar_when(?array $point): array {
    if (!$point) return ['date' => '', 'time' => ''];
    if (!empty($point['date'])) return ['date' => substr((string)$point['date'], 0, 10), 'time' => ''];
    try {
        $when = new DateTime((string)($point['dateTime'] ?? ''));
    } catch (Throwable $error) {
        return ['date' => '', 'time' => ''];
    }
    return ['date' => $when->format('Y-m-d'), 'time' => $when->format('H:i')];
}

function google_calendar_is_holiday_calendar(array $calendar): bool {
    $calendarId = strtolower(trim((string)($calendar['id'] ?? '')));
    $calendarName = strtolower(trim(implode(' ', array_filter([
        (string)($calendar['summary'] ?? ''),
        (string)($calendar['summaryOverride'] ?? ''),
    ]))));
    return str_contains($calendarId, '#holiday@group.v.calendar.google.com')
        || str_contains($calendarName, 'holiday');
}

function google_calendar_events(PDO $pdo, int $userId, string $startDate, string $endDate, string $zone): array {
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $startDate) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $endDate)) {
        throw new RuntimeException('Choose a valid date range.');
    }
    $access = google_access_token($pdo, $userId);
    $zone = google_calendar_primary_zone($access);
    $tz = new DateTimeZone($zone);
    $start = new DateTime($startDate . ' 00:00:00', $tz);
    $end = new DateTime($endDate . ' 23:59:59', $tz);
    $calendarList = google_api_pages(
        'https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=250',
        $access,
        'items',
        10
    );
    $calendars = array_values(array_filter($calendarList, static function (array $calendar): bool {
        $isPrimary = !empty($calendar['primary']);
        $isVisible = empty($calendar['hidden']) && (($calendar['selected'] ?? true) !== false);
        return $isPrimary || ($isVisible && google_calendar_is_holiday_calendar($calendar));
    }));
    if (!$calendars) throw new RuntimeException('No Google Calendar or holiday calendars are available to sync.');

    $query = http_build_query([
        'timeMin' => $start->format(DateTime::RFC3339),
        'timeMax' => $end->format(DateTime::RFC3339),
        'singleEvents' => 'true',
        'orderBy' => 'startTime',
        'maxResults' => 250,
        'timeZone' => $zone,
    ]);
    $events = [];
    foreach ($calendars as $calendar) {
        $calendarId = trim((string)($calendar['id'] ?? ''));
        if ($calendarId === '') continue;
        $isHoliday = empty($calendar['primary']);
        $calendarName = (string)($calendar['summaryOverride'] ?? $calendar['summary'] ?? '');
        $items = google_api_pages(
            'https://www.googleapis.com/calendar/v3/calendars/' . rawurlencode($calendarId) . '/events?' . $query,
            $access,
            'items',
            3
        );
        foreach ($items as $item) {
            if (($item['status'] ?? '') === 'cancelled') continue;
            $startPoint = google_calendar_when($item['start'] ?? null);
            $endPoint = google_calendar_when($item['end'] ?? null);
            if ($startPoint['date'] === '') continue;
            $eventId = (string)($item['id'] ?? '');
            $events[] = [
                'id' => $isHoliday
                    ? 'gcal_holiday_' . substr(hash('sha256', $calendarId . ':' . $eventId), 0, 24)
                    : 'gcal_' . $eventId,
                'googleEventId' => $eventId,
                'googleCalendarId' => $calendarId,
                'calendarName' => $calendarName,
                'title' => (string)($item['summary'] ?? 'Untitled event'),
                'subject' => $isHoliday ? 'Google Holidays' : 'Google Calendar',
                'date' => $startPoint['date'],
                'startTime' => $startPoint['time'],
                'endTime' => $endPoint['date'] === $startPoint['date'] ? $endPoint['time'] : '',
                'allDay' => $startPoint['time'] === '',
                'room' => (string)($item['location'] ?? ''),
                'type' => 'event',
                'source' => 'google-calendar',
                'calendarSource' => $isHoliday ? 'google-holiday' : 'google',
                'readOnly' => $isHoliday,
                'studyBuddyScheduleId' => (string)($item['extendedProperties']['private']['studybuddyScheduleId'] ?? ''),
                'url' => (string)($item['htmlLink'] ?? ''),
            ];
        }
    }
    return $events;
}

function google_calendar_event_id(string $id): string {
    $id = trim($id);
    if ($id === '' || strlen($id) > 1024 || !preg_match('/^[A-Za-z0-9_-]+$/', $id)) {
        throw new RuntimeException('That Google Calendar event is not valid.');
    }
    return $id;
}

function google_calendar_save(PDO $pdo, int $userId, array $input): array {
    $title = trim((string)($input['title'] ?? ''));
    $date = (string)($input['date'] ?? '');
    $startTime = (string)($input['startTime'] ?? '');
    $endTime = (string)($input['endTime'] ?? '');
    $room = trim((string)($input['room'] ?? ''));
    if ($title === '' || strlen($title) > 200) throw new RuntimeException('Enter an event title.');
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) throw new RuntimeException('Enter a valid date.');
    if (!preg_match('/^\d{2}:\d{2}$/', $startTime) || !preg_match('/^\d{2}:\d{2}$/', $endTime) || $endTime <= $startTime) {
        throw new RuntimeException('End time must be later than start time.');
    }
    if (strlen($room) > 200) $room = substr($room, 0, 200);
    $access = google_access_token($pdo, $userId);
    $zone = google_calendar_primary_zone($access);
    $body = [
        'summary' => $title,
        'location' => $room,
        'description' => trim((string)($input['subject'] ?? '')),
        'start' => ['dateTime' => $date . 'T' . $startTime . ':00', 'timeZone' => $zone],
        'end' => ['dateTime' => $date . 'T' . $endTime . ':00', 'timeZone' => $zone],
    ];
    $eventId = trim((string)($input['googleEventId'] ?? ''));
    if ($eventId !== '') {
        $eventId = google_calendar_event_id($eventId);
        $response = google_http(
            'PATCH',
            'https://www.googleapis.com/calendar/v3/calendars/primary/events/' . rawurlencode($eventId),
            ['Authorization: Bearer ' . $access, 'Content-Type: application/json'],
            json_encode($body)
        );
    } else {
        $response = google_http(
            'POST',
            'https://www.googleapis.com/calendar/v3/calendars/primary/events',
            ['Authorization: Bearer ' . $access, 'Content-Type: application/json'],
            json_encode($body)
        );
    }
    if ($response['status'] < 200 || $response['status'] >= 300) {
        $message = (string)($response['json']['error']['message'] ?? 'Google Calendar could not save that event.');
        if (str_contains(strtolower($message), 'insufficient') || str_contains(strtolower($message), 'scope')) {
            $message = 'Reconnect Google so StudyBuddy can use Google Calendar.';
        }
        throw new RuntimeException($message);
    }
    $item = $response['json'];
    $startPoint = google_calendar_when($item['start'] ?? null);
    $endPoint = google_calendar_when($item['end'] ?? null);
    return [
        'id' => 'gcal_' . (string)($item['id'] ?? ''),
        'googleEventId' => (string)($item['id'] ?? ''),
        'title' => (string)($item['summary'] ?? $title),
        'subject' => 'Google Calendar',
        'date' => $startPoint['date'] ?: $date,
        'startTime' => $startPoint['time'] ?: $startTime,
        'endTime' => $endPoint['time'] ?: $endTime,
        'room' => (string)($item['location'] ?? $room),
        'type' => 'event',
        'source' => 'google-calendar',
        'calendarSource' => 'google',
        'url' => (string)($item['htmlLink'] ?? ''),
    ];
}

function google_calendar_sync_schedule(PDO $pdo, int $userId, array $events, string $date, string $zone): array {
    if ($date !== '' && (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)
        || !checkdate((int)substr($date, 5, 2), (int)substr($date, 8, 2), (int)substr($date, 0, 4)))) {
        throw new RuntimeException('Choose a valid date to sync.');
    }
    if (count($events) > 100) {
        throw new RuntimeException('Sync fewer schedule events at a time.');
    }
    $zone = google_calendar_zone($zone);
    $today = (new DateTimeImmutable('now', new DateTimeZone($zone)))->format('Y-m-d');
    if ($date !== '' && $date !== $today) {
        throw new RuntimeException('Only today’s schedule can be synced from the dashboard.');
    }

    $access = google_access_token($pdo, $userId);
    $calendarZone = google_calendar_primary_zone($access);
    $synced = 0;
    $failed = [];
    foreach ($events as $entry) {
        $title = is_array($entry) ? trim((string)($entry['title'] ?? '')) : 'Untitled event';
        try {
            if (!is_array($entry)) throw new RuntimeException('Invalid schedule event.');
            $entryId = trim((string)($entry['id'] ?? ''));
            if ($entryId === '' || strlen($entryId) > 180) throw new RuntimeException('This event has no valid schedule ID.');
            $eventDate = trim((string)($entry['date'] ?? ''));
            if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $eventDate)
                || !checkdate((int)substr($eventDate, 5, 2), (int)substr($eventDate, 8, 2), (int)substr($eventDate, 0, 4))) {
                throw new RuntimeException('Enter a valid schedule date.');
            }
            if ($date !== '' && $eventDate !== $date) throw new RuntimeException('This event is not scheduled for today.');
            if ($title === '' || strlen($title) > 200) throw new RuntimeException('Enter an event title.');

            $startTime = trim((string)($entry['startTime'] ?? ''));
            $endTime = trim((string)($entry['endTime'] ?? ''));
            if (($startTime === '') !== ($endTime === '')) throw new RuntimeException('Both start and end times are required.');
            if ($startTime !== '' && (!preg_match('/^\d{2}:\d{2}$/', $startTime)
                || !preg_match('/^\d{2}:\d{2}$/', $endTime) || $endTime <= $startTime)) {
                throw new RuntimeException('Enter a valid start and end time.');
            }

            $room = trim((string)($entry['room'] ?? ''));
            $body = [
                'summary' => $title,
                'location' => substr($room, 0, 200),
                'description' => trim((string)($entry['subject'] ?? '')),
                'extendedProperties' => ['private' => ['studybuddyScheduleId' => $entryId]],
            ];
            if ($startTime === '') {
                $body['start'] = ['date' => $eventDate];
                $body['end'] = ['date' => (new DateTimeImmutable($eventDate, new DateTimeZone($calendarZone)))->modify('+1 day')->format('Y-m-d')];
            } else {
                $body['start'] = ['dateTime' => $eventDate . 'T' . $startTime . ':00', 'timeZone' => $calendarZone];
                $body['end'] = ['dateTime' => $eventDate . 'T' . $endTime . ':00', 'timeZone' => $calendarZone];
            }

            $eventId = substr(hash('sha256', 'studybuddy:' . $userId . ':' . $entryId), 0, 40);
            $body['id'] = $eventId;
            $url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events/' . rawurlencode($eventId);
            $headers = ['Authorization: Bearer ' . $access, 'Content-Type: application/json'];
            $updateBody = $body;
            unset($updateBody['id']);
            $response = google_http('PATCH', $url, $headers, json_encode($updateBody));
            if ($response['status'] === 404) {
                $response = google_http(
                    'POST',
                    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
                    $headers,
                    json_encode($body)
                );
                if ($response['status'] === 409) {
                    $response = google_http('PATCH', $url, $headers, json_encode($updateBody));
                }
            }
            if ($response['status'] < 200 || $response['status'] >= 300) {
                $message = (string)($response['json']['error']['message'] ?? 'Google Calendar rejected this event.');
                if (str_contains(strtolower($message), 'insufficient') || str_contains(strtolower($message), 'scope')) {
                    $message = 'Reconnect Google so StudyBuddy can use Google Calendar.';
                }
                throw new RuntimeException($message);
            }
            $synced++;
        } catch (Throwable $error) {
            $failed[] = ['title' => $title !== '' ? $title : 'Untitled event', 'message' => $error->getMessage()];
        }
    }
    return ['synced' => $synced, 'failed' => $failed];
}

function google_calendar_delete(PDO $pdo, int $userId, string $eventId): void {
    $eventId = google_calendar_event_id($eventId);
    $access = google_access_token($pdo, $userId);
    $response = google_http(
        'DELETE',
        'https://www.googleapis.com/calendar/v3/calendars/primary/events/' . rawurlencode($eventId),
        ['Authorization: Bearer ' . $access]
    );
    if ($response['status'] !== 204 && ($response['status'] < 200 || $response['status'] >= 300)) {
        throw new RuntimeException((string)($response['json']['error']['message'] ?? 'Google Calendar could not delete that event.'));
    }
}

function google_disconnect(PDO $pdo, int $userId): void {
    $row = google_connection_row($pdo, $userId);
    if (!$row) return;
    try {
        $refresh = open_sealed_string((string)$row['refresh_token']);
        google_http('POST', 'https://oauth2.googleapis.com/revoke', [
            'Content-Type: application/x-www-form-urlencoded',
        ], http_build_query(['token' => $refresh]));
    } catch (Throwable $error) {
        error_log($error->getMessage());
    }
    $pdo->prepare('DELETE FROM google_connections WHERE user_id = ?')->execute([$userId]);
}

function google_safe_next(string $next, string $role): string {
    $base = rtrim(app_cookie_path(), '/');
    $path = (string)(parse_url($next, PHP_URL_PATH) ?? '');
    $pattern = '#^' . preg_quote($base, '#') . '/(student|teacher)/[a-z0-9_-]+\.php$#';
    if (!preg_match($pattern, $path)) {
        $folder = $role === 'teacher' ? 'teacher' : 'student';
        return $base . '/' . $folder . '/settings.php';
    }
    return $path;
}

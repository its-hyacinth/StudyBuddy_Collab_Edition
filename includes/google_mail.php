<?php
declare(strict_types=1);

require_once __DIR__ . '/google_api.php';

const GOOGLE_GMAIL_SEND_SCOPE = 'https://www.googleapis.com/auth/gmail.send';

function google_send_email(PDO $pdo, int $userId, string $to, string $subject, string $body): void {
    if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
        throw new RuntimeException('The student email address is invalid.');
    }

    $connection = google_connection_row($pdo, $userId);
    if (!$connection) {
        throw new RuntimeException('Connect Google in Settings > Connected Accounts to send email.');
    }

    $scopes = preg_split('/\s+/', trim((string)($connection['scopes'] ?? ''))) ?: [];
    if (!in_array(GOOGLE_GMAIL_SEND_SCOPE, $scopes, true) && !in_array('https://mail.google.com/', $scopes, true)) {
        throw new RuntimeException('Reconnect Google in Settings > Connected Accounts and approve Gmail send access.');
    }

    $cleanSubject = str_replace(["\r", "\n"], ' ', $subject);
    $mime = 'To: ' . $to . "\r\n"
        . 'Subject: ' . mb_encode_mimeheader($cleanSubject, 'UTF-8', 'B', "\r\n") . "\r\n"
        . "MIME-Version: 1.0\r\n"
        . "Content-Type: text/plain; charset=UTF-8\r\n"
        . "Content-Transfer-Encoding: base64\r\n\r\n"
        . chunk_split(base64_encode($body), 76, "\r\n");
    $raw = rtrim(strtr(base64_encode($mime), '+/', '-_'), '=');
    $payload = json_encode(['raw' => $raw], JSON_UNESCAPED_SLASHES);
    if (!is_string($payload)) {
        throw new RuntimeException('The email could not be prepared for delivery.');
    }

    $accessToken = google_access_token($pdo, $userId);
    $response = google_http(
        'POST',
        'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
        [
            'Authorization: Bearer ' . $accessToken,
            'Content-Type: application/json',
        ],
        $payload
    );

    if ($response['status'] >= 200 && $response['status'] < 300) return;

    $googleMessage = strtolower((string)($response['json']['error']['message'] ?? ''));
    if ($response['status'] === 401) {
        throw new RuntimeException('Reconnect Google in Settings > Connected Accounts and try again.');
    }
    if ($response['status'] === 403 && (str_contains($googleMessage, 'insufficient') || str_contains($googleMessage, 'scope'))) {
        throw new RuntimeException('Reconnect Google in Settings > Connected Accounts and approve Gmail send access.');
    }
    if ($response['status'] === 403 && (str_contains($googleMessage, 'not been used') || str_contains($googleMessage, 'disabled') || str_contains($googleMessage, 'not enabled'))) {
        throw new RuntimeException('Enable the Gmail API in the Google Cloud project, then try again.');
    }
    throw new RuntimeException('Google could not send the email (HTTP ' . $response['status'] . '). Check the Gmail API setup and try again.');
}

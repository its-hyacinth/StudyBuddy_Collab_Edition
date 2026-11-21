<?php
declare(strict_types=1);

function app_key_bytes(): string {
    static $key = null;
    if ($key !== null) return $key;
    $path = __DIR__ . '/../config/secrets.php';
    if (!is_file($path)) {
        $hex = bin2hex(random_bytes(32));
        $php = "<?php\ndeclare(strict_types=1);\nconst SB_APP_KEY = '{$hex}';\n";
        if (file_put_contents($path, $php, LOCK_EX) === false) {
            throw new RuntimeException('Could not create config/secrets.php. Check that the config folder is writable.');
        }
    }
    require_once $path;
    if (!defined('SB_APP_KEY') || !preg_match('/^[a-f0-9]{64}$/', SB_APP_KEY)) {
        throw new RuntimeException('config/secrets.php does not contain a valid SB_APP_KEY.');
    }
    $decoded = hex2bin(SB_APP_KEY);
    if ($decoded === false || strlen($decoded) !== 32) {
        throw new RuntimeException('config/secrets.php does not contain a valid SB_APP_KEY.');
    }
    $key = $decoded;
    return $key;
}

function seal_string(string $plain): string {
    $iv = random_bytes(12);
    $tag = '';
    $cipher = openssl_encrypt($plain, 'aes-256-gcm', app_key_bytes(), OPENSSL_RAW_DATA, $iv, $tag);
    if ($cipher === false || strlen($tag) !== 16) {
        throw new RuntimeException('Could not protect the authenticator secret.');
    }
    return base64_encode($iv . $tag . $cipher);
}

function open_sealed_string(string $encoded): string {
    $blob = base64_decode($encoded, true);
    if ($blob === false || strlen($blob) < 29) {
        throw new RuntimeException('Stored authenticator secret is unreadable.');
    }
    $iv = substr($blob, 0, 12);
    $tag = substr($blob, 12, 16);
    $cipher = substr($blob, 28);
    $plain = openssl_decrypt($cipher, 'aes-256-gcm', app_key_bytes(), OPENSSL_RAW_DATA, $iv, $tag);
    if ($plain === false) {
        throw new RuntimeException('Stored authenticator secret could not be decrypted.');
    }
    return $plain;
}

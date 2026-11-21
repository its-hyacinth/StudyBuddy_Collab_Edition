<?php
declare(strict_types=1);

function base32_encode_bytes(string $bytes): string {
    $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    $bits = '';
    $length = strlen($bytes);
    for ($i = 0; $i < $length; $i++) {
        $bits .= str_pad(decbin(ord($bytes[$i])), 8, '0', STR_PAD_LEFT);
    }
    $out = '';
    foreach (str_split($bits, 5) as $chunk) {
        if (strlen($chunk) < 5) $chunk = str_pad($chunk, 5, '0', STR_PAD_RIGHT);
        $out .= $alphabet[bindec($chunk)];
    }
    return $out;
}

function base32_decode_string(string $secret): string {
    $secret = strtoupper((string)preg_replace('/[^A-Za-z2-7]/', '', $secret));
    $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    $bits = '';
    $length = strlen($secret);
    for ($i = 0; $i < $length; $i++) {
        $pos = strpos($alphabet, $secret[$i]);
        if ($pos === false) continue;
        $bits .= str_pad(decbin($pos), 5, '0', STR_PAD_LEFT);
    }
    $out = '';
    foreach (str_split($bits, 8) as $chunk) {
        if (strlen($chunk) !== 8) continue;
        $out .= chr(bindec($chunk));
    }
    return $out;
}

function totp_code(string $secretBytes, int $timestamp, int $period = 30, int $digits = 6): string {
    $counter = intdiv($timestamp, $period);
    $packed = pack('N2', ($counter >> 32) & 0xFFFFFFFF, $counter & 0xFFFFFFFF);
    $hash = hash_hmac('sha1', $packed, $secretBytes, true);
    $offset = ord($hash[19]) & 0x0F;
    $binary = ((ord($hash[$offset]) & 0x7F) << 24)
        | ((ord($hash[$offset + 1]) & 0xFF) << 16)
        | ((ord($hash[$offset + 2]) & 0xFF) << 8)
        | (ord($hash[$offset + 3]) & 0xFF);
    $mod = 10 ** $digits;
    return str_pad((string)($binary % $mod), $digits, '0', STR_PAD_LEFT);
}

/** Returns the matching time-step, or null when the code is not valid. */
function totp_match_step(string $secretBytes, string $code, ?int $timestamp = null, int $window = 1, int $period = 30): ?int {
    $code = preg_replace('/\s+/', '', $code) ?? '';
    if (!preg_match('/^\d{6}$/', $code)) return null;
    $timestamp = $timestamp ?? time();
    $base = intdiv($timestamp, $period);
    for ($offset = -$window; $offset <= $window; $offset++) {
        $step = $base + $offset;
        $candidate = totp_code($secretBytes, $step * $period, $period);
        if (hash_equals($candidate, $code)) return $step;
    }
    return null;
}

function otpauth_uri(string $email, string $base32Secret): string {
    $label = rawurlencode('StudyBuddy:' . $email);
    $issuer = rawurlencode('StudyBuddy');
    $secret = rawurlencode($base32Secret);
    return "otpauth://totp/{$label}?secret={$secret}&issuer={$issuer}&algorithm=SHA1&digits=6&period=30";
}

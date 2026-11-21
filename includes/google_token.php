<?php
declare(strict_types=1);

function google_http_get(string $url): string {
    if (!function_exists('curl_init')) {
        throw new RuntimeException('PHP cURL is required to verify Google sign-in.');
    }
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_PROTOCOLS => CURLPROTO_HTTPS,
    ]);
    $body = curl_exec($ch);
    $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if (!is_string($body) || $status !== 200) {
        throw new RuntimeException('Could not download Google signing keys.');
    }
    return $body;
}

function google_b64url_decode(string $data): string {
    $remainder = strlen($data) % 4;
    if ($remainder) $data .= str_repeat('=', 4 - $remainder);
    $decoded = base64_decode(strtr($data, '-_', '+/'), true);
    if ($decoded === false) throw new RuntimeException('Invalid Google token encoding.');
    return $decoded;
}

function google_asn1_len(int $length): string {
    if ($length < 128) return chr($length);
    $encoded = ltrim(pack('N', $length), "\x00");
    return chr(0x80 | strlen($encoded)) . $encoded;
}

function google_asn1_int(string $bytes): string {
    if ($bytes !== '' && (ord($bytes[0]) & 0x80)) $bytes = "\x00" . $bytes;
    return "\x02" . google_asn1_len(strlen($bytes)) . $bytes;
}

function google_asn1_seq(string $body): string {
    return "\x30" . google_asn1_len(strlen($body)) . $body;
}

function google_jwk_to_pem(array $jwk): string {
    if (($jwk['kty'] ?? '') !== 'RSA' || empty($jwk['n']) || empty($jwk['e'])) {
        throw new RuntimeException('Google signing key is not an RSA key.');
    }
    $modulus = google_b64url_decode((string)$jwk['n']);
    $exponent = google_b64url_decode((string)$jwk['e']);
    $rsa = google_asn1_seq(google_asn1_int($modulus) . google_asn1_int($exponent));
    $algorithm = hex2bin('300d06092a864886f70d0101010500');
    $bitString = "\x03" . google_asn1_len(strlen($rsa) + 1) . "\x00" . $rsa;
    $spki = google_asn1_seq($algorithm . $bitString);
    return "-----BEGIN PUBLIC KEY-----\n" . chunk_split(base64_encode($spki), 64, "\n") . "-----END PUBLIC KEY-----\n";
}

function google_signing_keys(): array {
    $cache = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'studybuddy_google_certs.json';
    $decoded = null;
    if (is_file($cache) && (time() - filemtime($cache)) < 3600) {
        $decoded = json_decode((string)file_get_contents($cache), true);
    }
    if (!is_array($decoded) || empty($decoded['keys'])) {
        $decoded = json_decode(google_http_get('https://www.googleapis.com/oauth2/v3/certs'), true);
        if (!is_array($decoded) || empty($decoded['keys'])) {
            throw new RuntimeException('Google signing keys were empty.');
        }
        file_put_contents($cache, json_encode($decoded));
    }
    $keys = [];
    foreach ($decoded['keys'] as $jwk) {
        if (is_array($jwk) && !empty($jwk['kid'])) $keys[(string)$jwk['kid']] = $jwk;
    }
    return $keys;
}

function google_verify_id_token(string $idToken, string $clientId, ?array $keys = null): array {
    if ($clientId === '') {
        throw new RuntimeException('Google sign-in is not configured. Add the OAuth client ID in config/google.php.');
    }
    $parts = explode('.', $idToken);
    if (count($parts) !== 3) throw new RuntimeException('Google sign-in token is malformed.');
    $header = json_decode(google_b64url_decode($parts[0]), true);
    $claims = json_decode(google_b64url_decode($parts[1]), true);
    $signature = google_b64url_decode($parts[2]);
    if (!is_array($header) || !is_array($claims) || ($header['alg'] ?? '') !== 'RS256' || empty($header['kid'])) {
        throw new RuntimeException('Google sign-in token uses an unsupported algorithm.');
    }
    $keys = $keys ?? google_signing_keys();
    $jwk = $keys[(string)$header['kid']] ?? null;
    if (!is_array($jwk)) throw new RuntimeException('Google sign-in token was signed by an unknown key.');
    $verified = openssl_verify($parts[0] . '.' . $parts[1], $signature, google_jwk_to_pem($jwk), OPENSSL_ALGO_SHA256);
    if ($verified !== 1) throw new RuntimeException('Google sign-in token signature is invalid.');

    $issuer = (string)($claims['iss'] ?? '');
    if ($issuer !== 'accounts.google.com' && $issuer !== 'https://accounts.google.com') {
        throw new RuntimeException('Google sign-in token issuer is invalid.');
    }
    $audience = $claims['aud'] ?? '';
    $audiences = is_array($audience) ? $audience : [$audience];
    if (!in_array($clientId, $audiences, true)) {
        throw new RuntimeException('Google sign-in token was issued for a different application.');
    }
    $now = time();
    if ((int)($claims['exp'] ?? 0) < $now) throw new RuntimeException('Google sign-in token has expired.');
    if ((int)($claims['iat'] ?? 0) > $now + 60) throw new RuntimeException('Google sign-in token is not valid yet.');
    $email = strtolower(trim((string)($claims['email'] ?? '')));
    $verifiedEmail = $claims['email_verified'] ?? false;
    $emailOk = $verifiedEmail === true || $verifiedEmail === 'true' || $verifiedEmail === 1;
    if (!$emailOk || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new RuntimeException('Google did not provide a verified email address.');
    }
    $sub = trim((string)($claims['sub'] ?? ''));
    if ($sub === '' || strlen($sub) > 255) throw new RuntimeException('Google account identifier is missing.');
    $name = trim((string)($claims['name'] ?? ''));
    if ($name === '') $name = strstr($email, '@', true) ?: 'StudyBuddy User';
    if (mb_strlen($name) > 150) $name = mb_substr($name, 0, 150);
    $picture = trim((string)($claims['picture'] ?? ''));
    if (strlen($picture) > 500 || !preg_match('#^https://#', $picture)) $picture = '';
    return ['sub' => $sub, 'email' => $email, 'name' => $name, 'picture' => $picture];
}

<?php
declare(strict_types=1);

/**
 * Sessions live in the database so sign-in still works when each request
 * is handled by a different server, as on the hosted site.
 */
class StudyBuddySessionHandler implements SessionHandlerInterface {
    private ?PDO $pdo = null;
    private bool $ready = false;

    public function open(string $path, string $name): bool {
        require_once __DIR__ . '/../config/database.php';
        $this->pdo = db();
        $this->ensureTable();
        return true;
    }

    public function close(): bool {
        $this->pdo = null;
        return true;
    }

    public function read(string $id): string|false {
        if (!$this->validId($id) || !$this->pdo) return '';
        $stmt = $this->pdo->prepare('SELECT data FROM php_sessions WHERE id = ? AND expires_at > ?');
        $stmt->execute([$id, time()]);
        $data = $stmt->fetchColumn();
        if ($data === false || $data === null) return '';
        $decoded = base64_decode((string)$data, true);
        return $decoded === false ? '' : $decoded;
    }

    public function write(string $id, string $data): bool {
        if (!$this->validId($id) || !$this->pdo) return false;
        $expires = time() + sb_session_lifetime();
        $payload = base64_encode($data);
        if ($this->driver() === 'pgsql') {
            $sql = 'INSERT INTO php_sessions (id, data, expires_at) VALUES (?, ?, ?)
                ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, expires_at = EXCLUDED.expires_at';
        } else {
            $sql = 'INSERT INTO php_sessions (id, data, expires_at) VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE data = VALUES(data), expires_at = VALUES(expires_at)';
        }
        $this->pdo->prepare($sql)->execute([$id, $payload, $expires]);
        if (random_int(1, 50) === 1) $this->gc(sb_session_lifetime());
        return true;
    }

    public function destroy(string $id): bool {
        if (!$this->validId($id) || !$this->pdo) return true;
        $this->pdo->prepare('DELETE FROM php_sessions WHERE id = ?')->execute([$id]);
        return true;
    }

    public function gc(int $max_lifetime): int|false {
        if (!$this->pdo) return 0;
        $stmt = $this->pdo->prepare('DELETE FROM php_sessions WHERE expires_at < ?');
        $stmt->execute([time()]);
        return $stmt->rowCount();
    }

    private function validId(string $id): bool {
        return (bool)preg_match('/^[A-Za-z0-9,-]{1,128}$/', $id);
    }

    private function driver(): string {
        return defined('SB_DB_DRIVER') ? (string)SB_DB_DRIVER : (string)$this->pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
    }

    private function ensureTable(): void {
        if ($this->ready || !$this->pdo) return;
        $this->pdo->exec(
            'CREATE TABLE IF NOT EXISTS php_sessions (
                id VARCHAR(128) NOT NULL PRIMARY KEY,
                data TEXT NOT NULL,
                expires_at BIGINT NOT NULL
            )'
        );
        $this->ready = true;
    }
}

function sb_session_lifetime(): int {
    return 60 * 60 * 24 * 14;
}

function sb_commit_session(): void {
    if (session_status() === PHP_SESSION_ACTIVE) session_write_close();
}

function sb_start_session(): void {
    if (session_status() === PHP_SESSION_ACTIVE) return;
    ini_set('session.gc_maxlifetime', (string)sb_session_lifetime());
    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    session_name('SBSESSID');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => app_cookie_path(),
        'httponly' => true,
        'secure' => request_is_https(),
        'samesite' => 'Lax',
    ]);
    try {
        session_set_save_handler(new StudyBuddySessionHandler(), true);
        session_start();
    } catch (Throwable $error) {
        error_log('Database session store unavailable: ' . $error->getMessage());
        if (session_status() !== PHP_SESSION_ACTIVE) {
            session_set_save_handler(new SessionHandler(), true);
            session_start();
        }
    }
}

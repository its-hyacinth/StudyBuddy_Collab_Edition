<?php
declare(strict_types=1);

function sb_ensure_join_codes(PDO $pdo): void {
    static $ready = false;
    if ($ready) return;
    $pdo->exec('CREATE TABLE IF NOT EXISTS class_join_codes (
        code VARCHAR(16) PRIMARY KEY,
        teacher_id BIGINT NOT NULL,
        class_external_id VARCHAR(120) NOT NULL
    )');
    $ready = true;
}

function sb_sync_join_codes(PDO $pdo, int $teacherId, array $classes): void {
    sb_ensure_join_codes($pdo);
    $pdo->prepare('DELETE FROM class_join_codes WHERE teacher_id=?')->execute([$teacherId]);
    $insert = $pdo->prepare('INSERT INTO class_join_codes (code, teacher_id, class_external_id) VALUES (?,?,?)');
    $seen = [];
    foreach ($classes as $class) {
        if (!is_array($class)) continue;
        $code = strtoupper(trim((string)($class['joinCode'] ?? '')));
        $classId = trim((string)($class['id'] ?? ''));
        if ($code === '' || $classId === '' || isset($seen[$code])) continue;
        $seen[$code] = true;
        try {
            $insert->execute([$code, $teacherId, $classId]);
        } catch (Throwable $error) {
            error_log('Join code ' . $code . ' could not be saved: ' . $error->getMessage());
        }
    }
}

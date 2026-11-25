<?php
declare(strict_types=1);

function sb_uploaded_teacher_resource(array $resource): bool {
    if (($resource['source'] ?? '') === 'upload') return true;
    if (($resource['source'] ?? '') === 'google-drive') return false;
    $path = parse_url((string)($resource['url'] ?? ''), PHP_URL_PATH);
    return is_string($path) && preg_match('#(?:^|/)uploads/#i', $path) === 1;
}

function sb_shared_resource_matches_classes(array $resource, array $classes): bool {
    $resourceClassId = trim((string)($resource['classId'] ?? ''));
    $resourceClassName = sb_normalize_resource_class_name((string)($resource['class'] ?? ''));
    foreach ($classes as $class) {
        if (!is_array($class)) continue;
        $classId = (string)($class['id'] ?? '');
        if ($resourceClassId !== '') {
            if ($resourceClassId === $classId) return true;
            continue;
        }
        if ($resourceClassName === '') continue;

        $code = trim((string)($class['subjectCode'] ?? $class['code'] ?? ''));
        $name = trim((string)($class['name'] ?? $class['subject'] ?? 'Untitled class'));
        $subject = $code !== '' && stripos($name, $code) === false ? $code . ' · ' . $name : $name;
        $course = sb_shared_resource_course_code((string)($class['course'] ?? ''));
        $year = sb_shared_resource_year_label((string)($class['year'] ?? ''));
        $block = trim((string)($class['block'] ?? ''));
        $classBlock = implode(' · ', array_filter([
            $course,
            $year,
            $block !== '' ? 'Block ' . $block : '',
        ]));
        $labels = [
            $subject,
            $name,
            (string)($class['subject'] ?? ''),
            $code,
            $classBlock !== '' ? $classBlock . ' — ' . $subject : '',
        ];
        foreach ($labels as $label) {
            if ($label !== '' && $resourceClassName === sb_normalize_resource_class_name($label)) return true;
        }
    }
    return false;
}

function sb_student_teacher_classes(PDO $pdo, int $teacherId, int $studentId): array {
    $query = $pdo->prepare(
        "SELECT s.payload_json, c.external_id AS class_external_id, c.payload_json AS class_payload_json
         FROM students s
         JOIN classes c ON c.user_id = s.user_id
         JOIN users u ON u.id = ? AND u.role = 'student' AND LOWER(u.email) = LOWER(s.email)
         WHERE s.user_id = ?"
    );
    $query->execute([$studentId, $teacherId]);
    $classes = [];
    foreach ($query->fetchAll() as $row) {
        $student = json_decode((string)$row['payload_json'], true);
        $class = json_decode((string)$row['class_payload_json'], true);
        if (!is_array($student) || !is_array($class)
            || strtolower((string)($student['status'] ?? 'active')) === 'inactive') continue;
        $classId = (string)($class['id'] ?? $row['class_external_id'] ?? '');
        $studentClassIds = array_map('strval', is_array($student['classIds'] ?? null) ? $student['classIds'] : []);
        if (!empty($student['classId'])) $studentClassIds[] = (string)$student['classId'];
        if ($classId === '' || !in_array($classId, $studentClassIds, true)) continue;
        $class['id'] = $classId;
        $classes[$classId] = $class;
    }
    return array_values($classes);
}

function sb_student_can_access_shared_resource(
    PDO $pdo,
    int $teacherId,
    int $studentId,
    array $resource,
    bool $uploadedOnly = false
): bool {
    if (empty($resource['shared']) || ($uploadedOnly && !sb_uploaded_teacher_resource($resource))) return false;
    return sb_shared_resource_matches_classes(
        $resource,
        sb_student_teacher_classes($pdo, $teacherId, $studentId)
    );
}

function sb_normalize_resource_class_name(string $value): string {
    return strtolower(preg_replace('/[^A-Za-z0-9]/', '', trim($value)) ?? '');
}

function sb_shared_resource_course_code(string $value): string {
    $courses = [
        'BEEd' => 'Bachelor of Elementary Education',
        'BSEd-English' => 'Bachelor of Secondary Education – English',
        'BSEd-Filipino' => 'Bachelor of Secondary Education – Filipino',
        'BSEd-Math' => 'Bachelor of Secondary Education – Mathematics',
        'AB Political Science' => 'Bachelor of Arts in Political Science',
        'BSBA-FM' => 'Bachelor of Science in Business Administration – Financial Management',
        'BSHM' => 'Bachelor of Science in Hospitality Management',
        'BSIT' => 'Bachelor of Science in Information Technology',
    ];
    $normalized = strtolower(trim($value));
    foreach ($courses as $code => $name) {
        $courseCode = strtolower($code);
        $courseName = strtolower($name);
        if ($normalized === $courseCode || $normalized === $courseName
            || ($normalized !== '' && (str_contains($courseName, $normalized) || str_contains($normalized, $courseCode)))) {
            return $code;
        }
    }
    return trim($value);
}

function sb_shared_resource_year_label(string $value): string {
    $normalized = strtolower(trim($value));
    foreach (['first' => '1st Year', 'second' => '2nd Year', 'third' => '3rd Year', 'fourth' => '4th Year'] as $word => $label) {
        if (str_contains($normalized, $word)) return $label;
    }
    if (preg_match('/[1-4]/', $normalized, $match)) {
        return ['1st Year', '2nd Year', '3rd Year', '4th Year'][(int)$match[0] - 1];
    }
    return trim($value);
}

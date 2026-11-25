<?php
declare(strict_types=1);

/**
 * When a teacher saves assignments, copy each one to the students in that
 * block, add an in-app notification, and queue an email. The student calendar
 * reads assignment due dates, so the copy is what places the deadline there.
 */

function sb_course_catalog(): array {
    return [
        ['code' => 'BEEd', 'name' => 'Bachelor of Elementary Education'],
        ['code' => 'BSEd-English', 'name' => 'Bachelor of Secondary Education – English'],
        ['code' => 'BSEd-Filipino', 'name' => 'Bachelor of Secondary Education – Filipino'],
        ['code' => 'BSEd-Math', 'name' => 'Bachelor of Secondary Education – Mathematics'],
        ['code' => 'AB Political Science', 'name' => 'Bachelor of Arts in Political Science'],
        ['code' => 'BSBA-FM', 'name' => 'Bachelor of Science in Business Administration – Financial Management'],
        ['code' => 'BSHM', 'name' => 'Bachelor of Science in Hospitality Management'],
        ['code' => 'BSIT', 'name' => 'Bachelor of Science in Information Technology'],
    ];
}

function sb_normalize_course(string $value): string {
    $raw = strtolower(trim($value));
    if ($raw === '') return '';
    foreach (sb_course_catalog() as $course) {
        $code = strtolower($course['code']);
        $name = strtolower($course['name']);
        if ($raw === $code || $raw === $name || str_contains($name, $raw) || str_contains($raw, $code)) {
            return $course['code'];
        }
    }
    return trim($value);
}

function sb_normalize_year(string $value): string {
    $text = strtolower(trim($value));
    foreach (['first' => '1', 'second' => '2', 'third' => '3', 'fourth' => '4'] as $word => $number) {
        if (str_contains($text, $word)) return $number;
    }
    return preg_match('/[1-4]/', $text, $digit) ? $digit[0] : '';
}

function sb_year_label(string $value): string {
    $labels = ['1' => '1st Year', '2' => '2nd Year', '3' => '3rd Year', '4' => '4th Year'];
    $number = sb_normalize_year($value);
    return $labels[$number] ?? trim($value);
}

function sb_normalize_block(string $value): string {
    $text = strtolower($value);
    $text = str_replace(['block', 'section'], '', $text);
    return preg_replace('/[^a-z0-9]/', '', $text) ?? '';
}

function sb_is_irregular(array $student): bool {
    $standing = strtolower(trim((string)($student['standing'] ?? '')));
    return $standing === 'irregular' || $standing === 'irreg';
}

function sb_student_matches_class(array $student, array $class, bool $includeIrregular): bool {
    if (strtolower((string)($student['status'] ?? 'active')) === 'inactive') return false;
    $enrolledIds = is_array($student['classIds'] ?? null) ? $student['classIds'] : [];
    $enrolled = ((string)($student['classId'] ?? '') !== '' && (string)$student['classId'] === (string)($class['id'] ?? ''))
        || in_array((string)($class['id'] ?? ''), array_map('strval', $enrolledIds), true);
    if (sb_is_irregular($student)) return $includeIrregular && $enrolled;
    if ($enrolled) return true;
    $course = sb_normalize_course((string)($student['course'] ?? ''));
    $year = sb_normalize_year((string)($student['year'] ?? ''));
    $block = sb_normalize_block((string)($student['section'] ?? ''));
    $classCourse = sb_normalize_course((string)($class['course'] ?? ''));
    $classYear = sb_normalize_year((string)($class['year'] ?? ''));
    $classBlock = sb_normalize_block((string)($class['block'] ?? ''));
    return $course !== '' && $year !== '' && $block !== ''
        && $course === $classCourse && $year === $classYear && $block === $classBlock;
}

function sb_block_label(array $class): string {
    $parts = array_filter([
        sb_normalize_course((string)($class['course'] ?? '')),
        sb_year_label((string)($class['year'] ?? '')),
        trim((string)($class['block'] ?? '')) !== '' ? 'Block ' . trim((string)$class['block']) : '',
    ]);
    return implode(' · ', $parts);
}

function sb_class_display(array $class): string {
    $code = trim((string)($class['subjectCode'] ?? $class['code'] ?? ''));
    $name = trim((string)($class['name'] ?? $class['subject'] ?? 'Class'));
    $subject = ($code !== '' && !str_contains(strtoupper($name), strtoupper($code))) ? $code . ' · ' . $name : $name;
    $block = sb_block_label($class);
    return $block !== '' ? $block . ' — ' . $subject : $subject;
}

function sb_deadline_label(string $date, string $time): string {
    $parsed = DateTime::createFromFormat('Y-m-d', $date);
    $label = $parsed ? $parsed->format('M j, Y') : $date;
    if (preg_match('/^(\d{2}):(\d{2})/', $time, $match)) {
        $hour = (int)$match[1];
        $label .= ' at ' . (($hour % 12) ?: 12) . ':' . $match[2] . ' ' . ($hour >= 12 ? 'PM' : 'AM');
    }
    return $label;
}

function sb_assignment_deadline_passed(array $assignment, ?DateTimeImmutable $now = null): bool {
    $dueDate = trim((string)($assignment['dueDate'] ?? ''));
    if ($dueDate === '') return false;
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $dueDate)) {
        throw new InvalidArgumentException('Assignment due date is invalid.');
    }

    $dueTime = trim((string)($assignment['dueTime'] ?? ''));
    if ($dueTime === '') $dueTime = '23:59';
    if (!preg_match('/^\d{2}:\d{2}(?::\d{2})?$/', $dueTime)) {
        throw new InvalidArgumentException('Assignment due time is invalid.');
    }
    $dueTime = substr($dueTime, 0, 5);
    $timeZoneName = trim((string)($assignment['timeZone'] ?? 'Asia/Manila'));
    $timeZone = new DateTimeZone($timeZoneName !== '' ? $timeZoneName : 'Asia/Manila');
    $deadline = DateTimeImmutable::createFromFormat('!Y-m-d H:i', $dueDate . ' ' . $dueTime, $timeZone);
    $parseErrors = DateTimeImmutable::getLastErrors();
    if ($deadline === false || ($parseErrors !== false && ($parseErrors['warning_count'] || $parseErrors['error_count']))) {
        throw new InvalidArgumentException('Assignment deadline is invalid.');
    }

    $currentTime = ($now ?? new DateTimeImmutable('now', $timeZone))->setTimezone($timeZone);
    return $currentTime->format('Y-m-d H:i') > $deadline->format('Y-m-d H:i');
}

function sb_load_user_collection(PDO $pdo, int $userId, string $key, array $collections): array {
    if (isset($collections[$key])) {
        $table = $collections[$key]['table'];
        $stmt = $pdo->prepare("SELECT payload_json FROM {$table} WHERE user_id=? ORDER BY sort_order ASC, id ASC");
        $stmt->execute([$userId]);
        $rows = $stmt->fetchAll(PDO::FETCH_COLUMN);
        if ($rows) {
            return array_map(static fn($json) => json_decode((string)$json, true) ?: [], $rows);
        }
    }
    $stmt = $pdo->prepare('SELECT state_value FROM app_state WHERE user_id=? AND state_key=?');
    $stmt->execute([$userId, $key]);
    $decoded = json_decode((string)($stmt->fetchColumn() ?: 'null'), true);
    return is_array($decoded) ? $decoded : [];
}

function sb_save_user_collection(PDO $pdo, int $userId, string $key, array $items, array $collections): void {
    $items = array_values($items);
    $json = json_encode($items, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    if ($json === false) $json = '[]';
    $stmt = $pdo->prepare('INSERT INTO app_state(user_id,state_key,state_value) VALUES(?,?,?) ON DUPLICATE KEY UPDATE state_value=VALUES(state_value)');
    $stmt->execute([$userId, $key, $json]);
    if (isset($collections[$key])) persistCollectionRows($pdo, $userId, $key, $items, $collections);
}

function sync_teacher_submission_grades(PDO $pdo, int $teacherId, array $grades, array $collections): void {
    $studentAssignments = [];
    $changedStudents = [];
    foreach ($grades as $grade) {
        if (!is_array($grade) || empty($grade['submission']['gradeId'])) continue;
        $studentId = (int)($grade['studentId'] ?? 0);
        $assignmentId = (string)($grade['assignmentId'] ?? '');
        if ($studentId < 1 || $assignmentId === '') continue;

        if (!isset($studentAssignments[$studentId])) {
            $studentAssignments[$studentId] = sb_load_user_collection($pdo, $studentId, 'studybuddy_assignments', $collections);
        }
        $matched = false;
        foreach ($studentAssignments[$studentId] as &$assignment) {
            if (!is_array($assignment)
                || (int)($assignment['teacherId'] ?? 0) !== $teacherId
                || (string)($assignment['teacherAssignmentId'] ?? '') !== $assignmentId
                || (string)($assignment['submission']['gradeId'] ?? '') !== (string)$grade['submission']['gradeId']) {
                continue;
            }
            $assignment['submission']['score'] = is_numeric($grade['score'] ?? null) ? (float)$grade['score'] : null;
            $assignment['submission']['max'] = is_numeric($grade['max'] ?? null) ? (float)$grade['max'] : null;
            $assignment['submission']['status'] = ($grade['status'] ?? '') === 'graded' ? 'graded' : 'pending';
            $matched = true;
            break;
        }
        unset($assignment);
        if ($matched) $changedStudents[$studentId] = true;
    }

    foreach (array_keys($changedStudents) as $studentId) {
        sb_save_user_collection($pdo, (int)$studentId, 'studybuddy_assignments', $studentAssignments[$studentId], $collections);
    }
}

function sb_refresh_student_submission_grades(PDO $pdo, int $studentId, array $assignments, array $collections): array {
    $gradesByTeacher = [];
    foreach ($assignments as &$assignment) {
        if (!is_array($assignment) || empty($assignment['submission']['gradeId'])) continue;
        $teacherId = (int)($assignment['teacherId'] ?? 0);
        $assignmentId = (string)($assignment['teacherAssignmentId'] ?? '');
        $gradeId = (string)$assignment['submission']['gradeId'];
        if ($teacherId < 1 || $assignmentId === '') continue;

        if (!isset($gradesByTeacher[$teacherId])) {
            $gradesByTeacher[$teacherId] = sb_load_user_collection($pdo, $teacherId, 'studybuddy_grades', $collections);
        }
        foreach ($gradesByTeacher[$teacherId] as $grade) {
            if (!is_array($grade)
                || (int)($grade['studentId'] ?? 0) !== $studentId
                || (string)($grade['assignmentId'] ?? '') !== $assignmentId
                || (string)($grade['submission']['gradeId'] ?? '') !== $gradeId) {
                continue;
            }
            $assignment['submission']['score'] = is_numeric($grade['score'] ?? null) ? (float)$grade['score'] : null;
            $assignment['submission']['max'] = is_numeric($grade['max'] ?? null)
                ? (float)$grade['max']
                : (is_numeric($assignment['submission']['max'] ?? null) ? (float)$assignment['submission']['max'] : null);
            $assignment['submission']['status'] = ($grade['status'] ?? '') === 'graded' ? 'graded' : 'pending';
            break;
        }
    }
    unset($assignment);
    return array_values($assignments);
}

function sb_indexed(array $rows): array {
    $indexed = [];
    foreach ($rows as $row) {
        if (is_array($row) && isset($row['id'])) $indexed[(string)$row['id']] = $row;
    }
    return $indexed;
}

function sb_is_classroom_assignment(array $assignment): bool {
    return ($assignment['source'] ?? '') === 'classroom' || !empty($assignment['classroomWorkId']);
}

function sb_student_copy_id(int $teacherId, string $assignmentId): string {
    return 'tchr_' . $teacherId . '_' . $assignmentId;
}

function sb_roster_for_assignment(array $assignment, array $classes, array $students): array {
    $classId = (string)($assignment['classId'] ?? '');
    $class = null;
    foreach ($classes as $item) {
        if (is_array($item) && (string)($item['id'] ?? '') === $classId) { $class = $item; break; }
    }
    if (!$class) return [];
    $includeIrregular = ($assignment['includeIrregular'] ?? true) !== false;
    $roster = [];
    foreach ($students as $student) {
        if (!is_array($student)) continue;
        if (sb_student_matches_class($student, $class, $includeIrregular)) $roster[] = $student;
    }
    return $roster;
}

function deliver_teacher_assignments(PDO $pdo, int $teacherId, string $teacherName, array $previous, array $current, array $collections): array {
    $classes = sb_load_user_collection($pdo, $teacherId, 'studybuddy_classes', $collections);
    $students = sb_load_user_collection($pdo, $teacherId, 'studybuddy_students', $collections);
    $accounts = $pdo->query("SELECT id, email, full_name FROM users WHERE role='student'")->fetchAll();
    $accountsByEmail = [];
    foreach ($accounts as $account) {
        $email = strtolower(trim((string)$account['email']));
        if ($email !== '') $accountsByEmail[$email] = $account;
    }

    $previousById = sb_indexed($previous);
    $currentById = sb_indexed($current);
    $notified = 0;
    $unmatched = 0;
    $mailQueue = [];
    $touchedStudents = [];

    $syncCopy = function (array $assignment, bool $announce, string $noticeTitle, bool $removeAll = false, bool $dueChanged = false) use (
        $pdo, $teacherId, $teacherName, $classes, $students, $accountsByEmail, $collections,
        &$notified, &$unmatched, &$mailQueue, &$touchedStudents, $previousById
    ): void {
        $assignmentId = (string)($assignment['id'] ?? '');
        if ($assignmentId === '' || sb_is_classroom_assignment($assignment)) return;
        $roster = $removeAll ? [] : sb_roster_for_assignment($assignment, $classes, $students);
        $previousAssignment = $previousById[$assignmentId] ?? null;
        $previousRoster = is_array($previousAssignment)
            ? sb_roster_for_assignment($previousAssignment, $classes, $students)
            : [];
        $wanted = [];
        foreach ($roster as $student) $wanted[strtolower(trim((string)($student['email'] ?? '')))] = $student;
        $previousEmails = [];
        foreach ($previousRoster as $student) {
            $email = strtolower(trim((string)($student['email'] ?? '')));
            if ($email !== '') $previousEmails[$email] = true;
        }
        $class = null;
        foreach ($classes as $item) {
            if (is_array($item) && (string)($item['id'] ?? '') === (string)($assignment['classId'] ?? '')) $class = $item;
        }
        $classLabel = is_array($class) ? sb_class_display($class) : trim((string)($assignment['subject'] ?? 'Class'));
        $dueLabel = sb_deadline_label((string)($assignment['dueDate'] ?? ''), (string)($assignment['dueTime'] ?? ''));
        $copyId = sb_student_copy_id($teacherId, $assignmentId);

        if ($announce && !$removeAll) {
            foreach ($roster as $student) {
                $email = strtolower(trim((string)($student['email'] ?? '')));
                if ($email === '' || !isset($accountsByEmail[$email])) $unmatched++;
            }
        }

        $emails = array_unique(array_merge(array_keys(array_filter($wanted)), array_keys($previousEmails)));
        foreach ($emails as $email) {
            if ($email === '' || !isset($accountsByEmail[$email])) continue;
            $account = $accountsByEmail[$email];
            $studentUserId = (int)$account['id'];
            if (!isset($touchedStudents[$studentUserId])) {
                $touchedStudents[$studentUserId] = sb_load_user_collection($pdo, $studentUserId, 'studybuddy_assignments', $collections);
            }
            $list = $touchedStudents[$studentUserId];
            $keep = [];
            $existing = null;
            foreach ($list as $item) {
                if (!is_array($item)) continue;
                $same = (string)($item['id'] ?? '') === $copyId || (string)($item['teacherAssignmentId'] ?? '') === $assignmentId;
                if ($same) { $existing = $item; continue; }
                $keep[] = $item;
            }
            $stillReceives = isset($wanted[$email]);
            if (!$stillReceives) {
                if ($existing) {
                    $touchedStudents[$studentUserId] = $keep;
                    if ($announce) {
                        $title = (string)($assignment['title'] ?? 'Assignment');
                        $pdo->prepare('INSERT INTO notifications (user_id, title, body, target_url) VALUES (?,?,?,?)')
                            ->execute([$studentUserId, 'Assignment removed', $title . ' was removed from your calendar.', 'assignments.php']);
                        $notified++;
                        $mailQueue[] = [
                            'to' => (string)$account['email'],
                            'name' => (string)($account['full_name'] ?? 'Student'),
                            'subject' => 'Assignment removed: ' . $title,
                            'body' => "Hello " . (string)($account['full_name'] ?? 'Student') . ",\n\n"
                                . $title . " was removed and taken off your StudyBuddy calendar.\n",
                        ];
                    }
                }
                continue;
            }
            $copy = [
                'id' => $copyId,
                'teacherAssignmentId' => $assignmentId,
                'teacherId' => $teacherId,
                'title' => (string)($assignment['title'] ?? 'Assignment'),
                'description' => (string)($assignment['description'] ?? ''),
                'dueDate' => (string)($assignment['dueDate'] ?? ''),
                'dueTime' => (string)($assignment['dueTime'] ?? ''),
                'timeZone' => (string)($assignment['timeZone'] ?? 'Asia/Manila'),
                'status' => (string)($existing['status'] ?? 'upcoming'),
                'subject' => (string)($assignment['subject'] ?? ($class['subject'] ?? $classLabel)),
                'subjectCode' => (string)($assignment['subjectCode'] ?? ''),
                'classId' => (string)($assignment['classId'] ?? ''),
                'course' => (string)($assignment['course'] ?? ''),
                'year' => (string)($assignment['year'] ?? ''),
                'block' => (string)($assignment['block'] ?? ''),
                'points' => $assignment['points'] ?? null,
                'source' => 'teacher',
                'submission' => $existing['submission'] ?? null,
                'attachment' => $assignment['attachment'] ?? null,
            ];
            if ($copy['status'] === '') $copy['status'] = 'upcoming';
            $keep[] = $copy;
            $touchedStudents[$studentUserId] = $keep;
            $tell = $announce && ($dueChanged || !$existing);
            if (!$tell) continue;
            $body = $copy['title'] . ' is due ' . $dueLabel . ($classLabel !== '' ? ' · ' . $classLabel : '');
            $pdo->prepare('INSERT INTO notifications (user_id, title, body, target_url) VALUES (?,?,?,?)')
                ->execute([$studentUserId, $noticeTitle, $body, 'assignments.php?assignment=' . rawurlencode($copyId)]);
            $notified++;
            $mailQueue[] = [
                'to' => (string)$account['email'],
                'name' => (string)($account['full_name'] ?? 'Student'),
                'subject' => $noticeTitle . ': ' . $copy['title'],
                'body' => "Hello " . (string)($account['full_name'] ?? 'Student') . ",\n\n"
                    . $teacherName . " posted an assignment for " . ($classLabel !== '' ? $classLabel : 'your class') . ".\n\n"
                    . $copy['title'] . "\n"
                    . "Due: " . $dueLabel . "\n"
                    . ($copy['description'] !== '' ? "\n" . $copy['description'] . "\n" : '')
                    . "\nIt is on your StudyBuddy calendar. Sign in to open it.\n",
            ];
        }
    };

    foreach ($current as $assignment) {
        if (!is_array($assignment) || sb_is_classroom_assignment($assignment)) continue;
        $id = (string)($assignment['id'] ?? '');
        $previousAssignment = $previousById[$id] ?? null;
        $isNew = !is_array($previousAssignment);
        $dueChanged = is_array($previousAssignment) && (
            (string)($previousAssignment['dueDate'] ?? '') !== (string)($assignment['dueDate'] ?? '')
            || (string)($previousAssignment['dueTime'] ?? '') !== (string)($assignment['dueTime'] ?? '')
            || (string)($previousAssignment['timeZone'] ?? 'Asia/Manila') !== (string)($assignment['timeZone'] ?? 'Asia/Manila')
        );
        $audienceChanged = is_array($previousAssignment) && (
            (string)($previousAssignment['classId'] ?? '') !== (string)($assignment['classId'] ?? '')
            || (($previousAssignment['includeIrregular'] ?? true) !== false) !== (($assignment['includeIrregular'] ?? true) !== false)
        );
        $changed = $isNew || $dueChanged || $audienceChanged || json_encode([
            $previousAssignment['title'] ?? '', $previousAssignment['description'] ?? '', $previousAssignment['points'] ?? '',
        ]) !== json_encode([
            $assignment['title'] ?? '', $assignment['description'] ?? '', $assignment['points'] ?? '',
        ]);
        if (!$changed) continue;
        $notice = $dueChanged && !$isNew ? 'Assignment deadline updated' : 'New assignment';
        $syncCopy($assignment, $isNew || $dueChanged || $audienceChanged, $notice, false, $dueChanged);
    }

    foreach ($previous as $assignment) {
        if (!is_array($assignment) || sb_is_classroom_assignment($assignment)) continue;
        $id = (string)($assignment['id'] ?? '');
        if ($id === '' || isset($currentById[$id])) continue;
        $syncCopy($assignment, true, 'Assignment removed', true);
    }

    foreach ($touchedStudents as $studentUserId => $items) {
        sb_save_user_collection($pdo, (int)$studentUserId, 'studybuddy_assignments', $items, $collections);
    }

    return [
        'notified' => $notified,
        'emailed' => 0,
        'emailFailed' => 0,
        'unmatched' => $unmatched,
        'mailQueue' => $mailQueue,
    ];
}

function sb_send_assignment_mail(array $message): bool {
    $to = trim((string)($message['to'] ?? ''));
    if (!filter_var($to, FILTER_VALIDATE_EMAIL)) return false;
    $subject = str_replace(["\r", "\n"], ' ', (string)($message['subject'] ?? 'StudyBuddy assignment'));
    $body = (string)($message['body'] ?? '');
    $host = preg_replace('/:\d+$/', '', (string)($_SERVER['HTTP_HOST'] ?? 'localhost')) ?: 'localhost';
    $from = 'StudyBuddy <noreply@' . $host . '>';
    $headers = "From: {$from}\r\nReply-To: {$from}\r\nContent-Type: text/plain; charset=UTF-8";
    return @mail($to, $subject, $body, $headers);
}

function deliver_joined_class(PDO $pdo, int $teacherId, string $teacherName, array $class, int $studentUserId, string $studentName, string $studentEmail, array $collections): void {
    $classId = (string)($class['id'] ?? '');
    if ($classId === '') throw new RuntimeException('This class is missing an id.');
    $email = strtolower(trim($studentEmail));
    $students = sb_load_user_collection($pdo, $teacherId, 'studybuddy_students', $collections);
    $found = false;
    foreach ($students as &$student) {
        if (!is_array($student)) continue;
        if (strtolower(trim((string)($student['email'] ?? ''))) !== $email) continue;
        $student['name'] = $studentName !== '' ? $studentName : (string)($student['name'] ?? 'Student');
        $ids = is_array($student['classIds'] ?? null) ? $student['classIds'] : [];
        if (!empty($student['classId'])) $ids[] = (string)$student['classId'];
        $ids[] = $classId;
        $student['classIds'] = array_values(array_unique(array_map('strval', $ids)));
        if (trim((string)($student['classId'] ?? '')) === '') $student['classId'] = $classId;
        $student['status'] = 'active';
        $student['standing'] = (string)($student['standing'] ?? 'regular');
        $found = true;
        break;
    }
    unset($student);
    if (!$found) {
        $students[] = [
            'id' => 'stu_join_' . $studentUserId,
            'name' => $studentName !== '' ? $studentName : 'Student',
            'email' => $studentEmail,
            'course' => (string)($class['course'] ?? ''),
            'year' => (string)($class['year'] ?? ''),
            'section' => (string)($class['block'] ?? ''),
            'standing' => 'regular',
            'classId' => $classId,
            'classIds' => [$classId],
            'subjectCode' => (string)($class['subjectCode'] ?? $class['code'] ?? ''),
            'gpa' => 0,
            'status' => 'active',
            'source' => 'join-code',
        ];
    }
    sb_save_user_collection($pdo, $teacherId, 'studybuddy_students', $students, $collections);

    $subjects = sb_load_user_collection($pdo, $studentUserId, 'studybuddy_subjects', $collections);
    $alreadyJoined = false;
    foreach ($subjects as $subject) {
        if (is_array($subject) && (string)($subject['id'] ?? '') === $classId) $alreadyJoined = true;
    }
    if (!$alreadyJoined) {
        $subjects[] = [
            'id' => $classId,
            'name' => (string)($class['name'] ?? 'Class'),
            'shortName' => (string)($class['name'] ?? 'Class'),
            'short' => (string)($class['short'] ?? 'cs'),
            'code' => (string)($class['subjectCode'] ?? $class['code'] ?? ''),
            'section' => (string)($class['block'] ?? ''),
            'course' => (string)($class['course'] ?? ''),
            'year' => (string)($class['year'] ?? ''),
            'color' => '#2563EB',
            'icon' => 'book-open',
            'room' => (string)($class['room'] ?? ''),
            'professor' => $teacherName,
            'description' => (string)($class['description'] ?? ''),
            'source' => 'teacher',
            'progress' => 0,
            'assignments' => 0,
            'completed' => 0,
            'pending' => 0,
        ];
        sb_save_user_collection($pdo, $studentUserId, 'studybuddy_subjects', $subjects, $collections);
    }

    $teacherAssignments = sb_load_user_collection($pdo, $teacherId, 'studybuddy_assignments', $collections);
    $studentAssignments = sb_load_user_collection($pdo, $studentUserId, 'studybuddy_assignments', $collections);
    $kept = [];
    $existingIds = [];
    foreach ($studentAssignments as $item) {
        if (!is_array($item)) continue;
        $kept[] = $item;
        $existingIds[(string)($item['teacherAssignmentId'] ?? $item['id'] ?? '')] = true;
    }
    foreach ($teacherAssignments as $assignment) {
        if (!is_array($assignment) || sb_is_classroom_assignment($assignment)) continue;
        if ((string)($assignment['classId'] ?? '') !== $classId) continue;
        $assignmentId = (string)($assignment['id'] ?? '');
        if ($assignmentId === '' || isset($existingIds[$assignmentId])) continue;
        $kept[] = [
            'id' => sb_student_copy_id($teacherId, $assignmentId),
            'teacherAssignmentId' => $assignmentId,
            'teacherId' => $teacherId,
            'title' => (string)($assignment['title'] ?? 'Assignment'),
            'description' => (string)($assignment['description'] ?? ''),
            'dueDate' => (string)($assignment['dueDate'] ?? ''),
            'dueTime' => (string)($assignment['dueTime'] ?? ''),
            'timeZone' => (string)($assignment['timeZone'] ?? 'Asia/Manila'),
            'status' => 'upcoming',
            'subject' => (string)($assignment['subject'] ?? $class['subject'] ?? $class['name'] ?? ''),
            'subjectId' => $classId,
            'subjectCode' => (string)($assignment['subjectCode'] ?? ''),
            'classId' => $classId,
            'course' => (string)($class['course'] ?? ''),
            'year' => (string)($class['year'] ?? ''),
            'block' => (string)($class['block'] ?? ''),
            'points' => $assignment['points'] ?? null,
            'source' => 'teacher',
            'submission' => null,
            'attachment' => $assignment['attachment'] ?? null,
        ];
    }
    sb_save_user_collection($pdo, $studentUserId, 'studybuddy_assignments', $kept, $collections);
    if (!$alreadyJoined) {
        $label = sb_class_display($class);
        $pdo->prepare('INSERT INTO notifications (user_id, title, body, target_url) VALUES (?,?,?,?)')
            ->execute([$studentUserId, 'You joined a class', $label !== '' ? $label : (string)($class['name'] ?? 'Class'), 'subjects.php?subject=' . rawurlencode($classId)]);
    }
}


<?php
declare(strict_types=1);

if (function_exists('persistCollectionRows')) return;

function sb_collections(): array {
    return [
        'studybuddy_subjects'   => ['table'=>'subjects', 'columns'=>['external_id','name','code','description','payload_json','sort_order']],
        'studybuddy_assignments'=> ['table'=>'assignments', 'columns'=>['external_id','subject_external_id','title','description','due_date','status','payload_json','sort_order']],
        'studybuddy_tasks'      => ['table'=>'tasks', 'columns'=>['external_id','title','description','due_date','status','payload_json','sort_order']],
        'studybuddy_schedule'   => ['table'=>'schedules', 'columns'=>['external_id','title','schedule_date','day_name','start_time','end_time','room','payload_json','sort_order']],
        'studybuddy_classes'    => ['table'=>'classes', 'columns'=>['external_id','class_name','subject_name','section','room','payload_json','sort_order']],
        'studybuddy_students'   => ['table'=>'students', 'columns'=>['external_id','student_name','email','student_number','payload_json','sort_order']],
        'studybuddy_grades'     => ['table'=>'grades', 'columns'=>['external_id','student_external_id','assignment_external_id','score','max_score','payload_json','sort_order']],
        'studybuddy_messages'   => ['table'=>'messages', 'columns'=>['external_id','sender_name','recipient_name','message_body','is_read','payload_json','sort_order']],
        'studybuddy_resources'  => ['table'=>'resources', 'columns'=>['external_id','title','description','file_url','payload_json','sort_order']],
        'studybuddy_drive'      => ['table'=>'drive_files', 'columns'=>['external_id','title','mime_type','file_url','payload_json','sort_order']],
    ];
}
function cleanDateValue(mixed $value): ?string {
    $value = trim((string)($value ?? ''));
    return preg_match('/^\d{4}-\d{2}-\d{2}$/', $value) ? $value : null;
}
function cleanTimeValue(mixed $value): ?string {
    $value = trim((string)($value ?? ''));
    if (preg_match('/^\d{2}:\d{2}(:\d{2})?$/', $value)) return strlen($value) === 5 ? $value . ':00' : $value;
    return null;
}
function firstValue(array $row, array $keys, mixed $default = null): mixed {
    foreach ($keys as $key) if (array_key_exists($key, $row)) return $row[$key];
    return $default;
}
function collectionRow(string $key, array $row, int $index): array {
    $id = (string)firstValue($row, ['id','externalId','classroomWorkId','classroomId'], 'row_' . $index);
    $json = json_encode($row, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    $common = ['external_id'=>$id, 'payload_json'=>$json, 'sort_order'=>$index];
    switch ($key) {
        case 'studybuddy_subjects':
            return $common + ['name'=>(string)firstValue($row,['name','title'],'Untitled subject'), 'code'=>firstValue($row,['code']), 'description'=>firstValue($row,['description'])];
        case 'studybuddy_assignments':
            return $common + ['subject_external_id'=>firstValue($row,['subjectId']), 'title'=>(string)firstValue($row,['title','name'],'Untitled assignment'), 'description'=>firstValue($row,['description']), 'due_date'=>cleanDateValue(firstValue($row,['dueDate','due_date'])), 'status'=>(string)firstValue($row,['status'],'upcoming')];
        case 'studybuddy_tasks':
            return $common + ['title'=>(string)firstValue($row,['title','name'],'Untitled task'), 'description'=>firstValue($row,['description']), 'due_date'=>cleanDateValue(firstValue($row,['dueDate','due_date'])), 'status'=>(string)firstValue($row,['status'],'pending')];
        case 'studybuddy_schedule':
            return $common + ['title'=>(string)firstValue($row,['title','subject'],'Class schedule'), 'schedule_date'=>cleanDateValue(firstValue($row,['date','scheduleDate','schedule_date'])), 'day_name'=>firstValue($row,['day','dayName','day_name']), 'start_time'=>cleanTimeValue(firstValue($row,['startTime','start_time','start'])), 'end_time'=>cleanTimeValue(firstValue($row,['endTime','end_time','end'])), 'room'=>firstValue($row,['room'])];
        case 'studybuddy_classes':
            return $common + ['class_name'=>(string)firstValue($row,['name','className'],'Class'), 'subject_name'=>firstValue($row,['subject']), 'section'=>firstValue($row,['section']), 'room'=>firstValue($row,['room'])];
        case 'studybuddy_students':
            return $common + ['student_name'=>(string)firstValue($row,['name','fullName'],'Student'), 'email'=>firstValue($row,['email']), 'student_number'=>firstValue($row,['studentNumber','student_number'])];
        case 'studybuddy_grades':
            return $common + ['student_external_id'=>firstValue($row,['studentId','student_id']), 'assignment_external_id'=>firstValue($row,['assignmentId','assignment_id']), 'score'=>is_numeric(firstValue($row,['score','grade'])) ? (float)firstValue($row,['score','grade']) : null, 'max_score'=>is_numeric(firstValue($row,['maxPoints','maxScore','max_score'])) ? (float)firstValue($row,['maxPoints','maxScore','max_score']) : null];
        case 'studybuddy_messages':
            return $common + ['sender_name'=>firstValue($row,['sender','senderName']), 'recipient_name'=>firstValue($row,['recipient','recipientName']), 'message_body'=>(string)firstValue($row,['text','message','body'],''), 'is_read'=>!empty($row['read']) ? 1 : 0];
        case 'studybuddy_resources':
            return $common + ['title'=>(string)firstValue($row,['title','name'],'Resource'), 'description'=>firstValue($row,['description']), 'file_url'=>firstValue($row,['url','fileUrl','file_url'])];
        case 'studybuddy_drive':
            return $common + ['title'=>(string)firstValue($row,['name','title'],'Drive file'), 'mime_type'=>firstValue($row,['mimeType','mime_type']), 'file_url'=>firstValue($row,['url','webViewLink','file_url'])];
    }
    return $common;
}
function persistCollectionRows(PDO $pdo, int $userId, string $key, array $value, array $collections): void {
    $table = $collections[$key]['table'];
    $pdo->prepare("DELETE FROM {$table} WHERE user_id=?")->execute([$userId]);
    $columns = $collections[$key]['columns'];
    $placeholders = implode(',', array_fill(0, count($columns) + 1, '?'));
    $columnSql = implode(',', $columns);
    $insert = $pdo->prepare("INSERT INTO {$table}(user_id,{$columnSql}) VALUES({$placeholders})");
    foreach (array_values($value) as $index => $item) {
        if (!is_array($item)) continue;
        $mapped = collectionRow($key, $item, $index);
        $params = [$userId];
        foreach ($columns as $column) $params[] = $mapped[$column] ?? null;
        $insert->execute($params);
    }
}
function existingCollectionIds(PDO $pdo, int $userId, string $key, array $collections): array {
    $table = $collections[$key]['table'];
    $stmt = $pdo->prepare("SELECT external_id FROM {$table} WHERE user_id=?");
    $stmt->execute([$userId]);
    $ids = $stmt->fetchAll(PDO::FETCH_COLUMN);
    if ($ids) return array_fill_keys(array_map('strval', $ids), true);

    $stmt = $pdo->prepare('SELECT state_value FROM app_state WHERE user_id=? AND state_key=?');
    $stmt->execute([$userId, $key]);
    $legacy = json_decode((string)($stmt->fetchColumn() ?: 'null'), true);
    $existing = [];
    if (is_array($legacy)) {
        foreach (array_values($legacy) as $index => $item) {
            if (!is_array($item)) continue;
            $id = (string)firstValue($item, ['id','externalId','classroomWorkId','classroomId'], 'row_' . $index);
            $existing[$id] = true;
        }
    }
    return $existing;
}
function notifyStudentCollectionAdditions(PDO $pdo, int $userId, string $key, array $items, array $existingIds): void {
    $seen = $existingIds;
    $insert = $pdo->prepare('INSERT INTO notifications (user_id,title,body,target_url) VALUES (?,?,?,?)');
    foreach (array_values($items) as $index => $item) {
        if (!is_array($item)) continue;
        $id = (string)firstValue($item, ['id','externalId','classroomWorkId','classroomId'], 'row_' . $index);
        if (isset($seen[$id])) continue;
        $seen[$id] = true;

        $itemTitle = trim((string)firstValue($item, ['title','name'], ''));
        if ($itemTitle === '') $itemTitle = $key === 'studybuddy_tasks' ? 'Untitled task' : 'Untitled activity';
        $isTask = $key === 'studybuddy_tasks';
        $isClassroom = !$isTask && (($item['source'] ?? '') === 'classroom' || !empty($item['classroomWorkId']));
        $title = $isTask ? 'New task added' : ($isClassroom ? 'New Google Classroom activity' : 'New activity added');
        $subject = trim((string)($item['subject'] ?? ''));
        $body = $itemTitle . ($subject !== '' ? ' · ' . $subject : '');
        $targetUrl = $isTask
            ? 'todo.php?task=' . rawurlencode($id)
            : 'assignments.php?assignment=' . rawurlencode($id);
        $insert->execute([$userId, $title, $body, $targetUrl]);
    }
}


<?php
require_once __DIR__ . '/../includes/bootstrap.php';
require_once __DIR__ . '/../config/database.php';
$action = $_GET['action'] ?? $_POST['action'] ?? '';
if ($action === 'session' && $_SERVER['REQUEST_METHOD'] === 'GET') {
 json_response(['ok'=>true,'user'=>$_SESSION['user'] ?? null,'csrf'=>$_SESSION['csrf_token']]);
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_response(['ok'=>false,'message'=>'Method not allowed.'],405);
verify_csrf();
try {
 $pdo=db();
 if ($action === 'register') {
  $name=trim((string)($_POST['name'] ?? '')); $email=strtolower(trim((string)($_POST['email'] ?? '')));
  $password=(string)($_POST['password'] ?? ''); $role=(string)($_POST['role'] ?? 'student');
  if ($name==='' || !filter_var($email,FILTER_VALIDATE_EMAIL) || strlen($password)<8 || !in_array($role,['student','teacher'],true)) json_response(['ok'=>false,'message'=>'Enter a valid name, email, role, and password with at least 8 characters.'],422);
  $stmt=$pdo->prepare('INSERT INTO users(full_name,email,password_hash,role) VALUES(?,?,?,?)');
  try {$stmt->execute([$name,$email,password_hash($password,PASSWORD_DEFAULT),$role]);} catch(PDOException $e) { if ($e->getCode()==='23000') json_response(['ok'=>false,'message'=>'An account with this email already exists.'],409); throw $e; }
  $id=(int)$pdo->lastInsertId(); session_regenerate_id(true);
  $_SESSION['user']=['id'=>$id,'name'=>$name,'email'=>$email,'role'=>$role,'avatarInitials'=>initials($name)];
  json_response(['ok'=>true,'user'=>$_SESSION['user'],'redirect'=>$role==='teacher'?'teacher/dashboard.php':'student/dashboard.php']);
 }
 if ($action === 'login') {
  $email=strtolower(trim((string)($_POST['email'] ?? ''))); $password=(string)($_POST['password'] ?? '');
  $stmt=$pdo->prepare('SELECT id,full_name,email,password_hash,role FROM users WHERE email=? LIMIT 1'); $stmt->execute([$email]); $row=$stmt->fetch();
  if (!$row || !password_verify($password,$row['password_hash'])) json_response(['ok'=>false,'message'=>'Invalid email or password.'],401);
  session_regenerate_id(true); $_SESSION['user']=['id'=>(int)$row['id'],'name'=>$row['full_name'],'email'=>$row['email'],'role'=>$row['role'],'avatarInitials'=>initials($row['full_name'])];
  json_response(['ok'=>true,'user'=>$_SESSION['user'],'redirect'=>$row['role']==='teacher'?'teacher/dashboard.php':'student/dashboard.php']);
 }
 if ($action === 'logout') { $_SESSION=[]; if (ini_get('session.use_cookies')) { $p=session_get_cookie_params(); setcookie(session_name(),'',time()-42000,$p['path'],$p['domain'],$p['secure'],$p['httponly']); } session_destroy(); json_response(['ok'=>true,'redirect'=>'index.php']); }
 json_response(['ok'=>false,'message'=>'Unknown action.'],400);
} catch(Throwable $e) { error_log($e->__toString()); json_response(['ok'=>false,'message'=>'A server error occurred. Check the PHP error log.'],500); }
function initials(string $name): string { $parts=preg_split('/\s+/',trim($name)); $out=''; foreach(array_slice($parts,0,2) as $p) $out.=mb_substr($p,0,1); return strtoupper($out); }

<?php
require_once __DIR__ . '/../includes/bootstrap.php'; require_once __DIR__ . '/../config/database.php';
$user=require_user(); if ($_SERVER['REQUEST_METHOD']!=='POST') json_response(['ok'=>false,'message'=>'Method not allowed.'],405); verify_csrf();
if (empty($_FILES['file']) || $_FILES['file']['error']!==UPLOAD_ERR_OK) json_response(['ok'=>false,'message'=>'Choose a file to upload.'],422);
$f=$_FILES['file']; if ($f['size']>10*1024*1024) json_response(['ok'=>false,'message'=>'Maximum upload size is 10 MB.'],413);
$allowed=['pdf','doc','docx','ppt','pptx','xls','xlsx','txt','png','jpg','jpeg']; $ext=strtolower(pathinfo($f['name'],PATHINFO_EXTENSION));
if (!in_array($ext,$allowed,true)) json_response(['ok'=>false,'message'=>'This file type is not allowed.'],422);
$dir=__DIR__.'/../uploads/'.(int)$user['id']; if (!is_dir($dir) && !mkdir($dir,0750,true)) json_response(['ok'=>false,'message'=>'Could not create upload folder.'],500);
$name=bin2hex(random_bytes(16)).'.'.$ext; if (!move_uploaded_file($f['tmp_name'],$dir.'/'.$name)) json_response(['ok'=>false,'message'=>'Could not save uploaded file.'],500);
json_response(['ok'=>true,'name'=>basename($f['name']),'url'=>'uploads/'.(int)$user['id'].'/'.$name]);

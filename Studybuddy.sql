-- StudyBuddy database schema
-- Import this file through phpMyAdmin. Google API integrations are not configured here.
CREATE DATABASE IF NOT EXISTS Studybuddy CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE Studybuddy;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NULL,
  role ENUM('student','teacher') NOT NULL DEFAULT 'student',
  google_sub VARCHAR(255) NULL,
  avatar_url VARCHAR(500) NULL,
  email_verified TINYINT(1) NOT NULL DEFAULT 0,
  totp_secret VARCHAR(255) NULL,
  totp_pending_secret VARCHAR(255) NULL,
  totp_enabled TINYINT(1) NOT NULL DEFAULT 0,
  totp_last_step BIGINT NULL,
  last_login_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_google_sub (google_sub)
) ENGINE=InnoDB;

-- Compatibility store for settings/progress and the existing JavaScript data-helper contract.
-- Collection data is also written to its dedicated relational table below.
CREATE TABLE IF NOT EXISTS app_state (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  state_key VARCHAR(80) NOT NULL,
  state_value LONGTEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_state (user_id,state_key),
  CONSTRAINT fk_app_state_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS subjects (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  external_id VARCHAR(120) NULL,
  name VARCHAR(180) NOT NULL,
  code VARCHAR(50) NULL,
  description TEXT NULL,
  payload_json LONGTEXT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_subject_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_subject_user (user_id),
  INDEX idx_subject_external (user_id,external_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS assignments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  external_id VARCHAR(120) NULL,
  subject_id BIGINT UNSIGNED NULL,
  subject_external_id VARCHAR(120) NULL,
  title VARCHAR(220) NOT NULL,
  description TEXT NULL,
  due_date DATE NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'upcoming',
  payload_json LONGTEXT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_assignment_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_assignment_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
  INDEX idx_assignment_user_due (user_id,due_date),
  INDEX idx_assignment_external (user_id,external_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tasks (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  external_id VARCHAR(120) NULL,
  title VARCHAR(220) NOT NULL,
  description TEXT NULL,
  due_date DATE NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  payload_json LONGTEXT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_task_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_task_user (user_id),
  INDEX idx_task_external (user_id,external_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS schedules (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  external_id VARCHAR(120) NULL,
  title VARCHAR(220) NOT NULL,
  schedule_date DATE NULL,
  day_name VARCHAR(20) NULL,
  start_time TIME NULL,
  end_time TIME NULL,
  room VARCHAR(100) NULL,
  payload_json LONGTEXT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_schedule_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_schedule_user_date (user_id,schedule_date),
  INDEX idx_schedule_external (user_id,external_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS study_materials (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  subject_id BIGINT UNSIGNED NULL,
  title VARCHAR(220) NOT NULL,
  file_path VARCHAR(500) NULL,
  external_url VARCHAR(1000) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_material_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_material_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(220) NOT NULL,
  body TEXT NULL,
  target_url VARCHAR(1000) NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notification_user (user_id,is_read)
) ENGINE=InnoDB;

-- Teacher portal collections.
CREATE TABLE IF NOT EXISTS classes (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  external_id VARCHAR(120) NULL,
  class_name VARCHAR(220) NOT NULL,
  subject_name VARCHAR(220) NULL,
  section VARCHAR(100) NULL,
  room VARCHAR(100) NULL,
  payload_json LONGTEXT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_class_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_class_user (user_id,external_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS students (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  external_id VARCHAR(120) NULL,
  student_name VARCHAR(180) NOT NULL,
  email VARCHAR(190) NULL,
  student_number VARCHAR(80) NULL,
  payload_json LONGTEXT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_student_owner FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_student_owner (user_id,external_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS grades (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  external_id VARCHAR(120) NULL,
  student_external_id VARCHAR(120) NULL,
  assignment_external_id VARCHAR(120) NULL,
  score DECIMAL(10,2) NULL,
  max_score DECIMAL(10,2) NULL,
  payload_json LONGTEXT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_grade_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_grade_owner (user_id,external_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS assignment_submissions (
  submission_id VARCHAR(100) PRIMARY KEY,
  teacher_id BIGINT UNSIGNED NOT NULL,
  student_id BIGINT UNSIGNED NOT NULL,
  assignment_id VARCHAR(120) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_content LONGBLOB NOT NULL,
  submitted_at VARCHAR(40) NOT NULL,
  INDEX idx_submission_teacher_student (teacher_id,student_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS messages (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  external_id VARCHAR(120) NULL,
  sender_name VARCHAR(180) NULL,
  recipient_name VARCHAR(180) NULL,
  message_body TEXT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  payload_json LONGTEXT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_message_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_message_owner (user_id,external_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS resources (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  external_id VARCHAR(120) NULL,
  title VARCHAR(220) NOT NULL,
  description TEXT NULL,
  file_url VARCHAR(1000) NULL,
  payload_json LONGTEXT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_resource_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_resource_owner (user_id,external_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS drive_files (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  external_id VARCHAR(120) NULL,
  title VARCHAR(220) NOT NULL,
  mime_type VARCHAR(150) NULL,
  file_url VARCHAR(1000) NULL,
  payload_json LONGTEXT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_drive_file_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_drive_file_owner (user_id,external_id)
) ENGINE=InnoDB;

-- Sign-in security: Google Authenticator challenges, one-time backup codes,
-- persistent "remember me" tokens, and failed-login tracking.
CREATE TABLE IF NOT EXISTS auth_challenges (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL,
  purpose ENUM('totp_login') NOT NULL,
  attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_challenge_token (token_hash),
  INDEX idx_challenge_user (user_id, purpose),
  CONSTRAINT fk_challenge_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS totp_backup_codes (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  code_hash VARCHAR(255) NOT NULL,
  used_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_backup_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_backup_user (user_id, used_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS remember_tokens (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  selector CHAR(24) NOT NULL,
  validator_hash CHAR(64) NOT NULL,
  previous_validator_hash CHAR(64) NULL,
  rotated_at DATETIME NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_remember_selector (selector),
  CONSTRAINT fk_remember_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS google_connections (
  user_id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
  google_email VARCHAR(190) NULL,
  refresh_token TEXT NOT NULL,
  access_token TEXT NULL,
  access_expires_at DATETIME NULL,
  scopes VARCHAR(1000) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_google_conn_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS php_sessions (
  id VARCHAR(128) NOT NULL PRIMARY KEY,
  data MEDIUMTEXT NOT NULL,
  expires_at BIGINT NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS login_attempts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(190) NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  succeeded TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_attempt_email_time (email, created_at)
) ENGINE=InnoDB;

-- Upgrade columns for users importing over the earlier PHP/MySQL draft.
ALTER TABLE users MODIFY password_hash VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_sub VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500) NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_secret VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_pending_secret VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_enabled TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_last_step BIGINT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at DATETIME NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_google_sub ON users (google_sub);
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS external_id VARCHAR(120) NULL;
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS payload_json LONGTEXT NULL;
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS external_id VARCHAR(120) NULL;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS subject_external_id VARCHAR(120) NULL;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS payload_json LONGTEXT NULL;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS external_id VARCHAR(120) NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS payload_json LONGTEXT NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS external_id VARCHAR(120) NULL;
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS payload_json LONGTEXT NULL;
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS class_join_codes (
  code VARCHAR(16) PRIMARY KEY,
  teacher_id BIGINT NOT NULL,
  class_external_id VARCHAR(120) NOT NULL
);
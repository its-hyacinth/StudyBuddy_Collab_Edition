-- StudyBuddy database schema
-- Import this file through phpMyAdmin. Google API integrations are not configured here.
CREATE DATABASE IF NOT EXISTS Studybuddy CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE Studybuddy;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('student','teacher') NOT NULL DEFAULT 'student',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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

-- Upgrade columns for users importing over the earlier PHP/MySQL draft.
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

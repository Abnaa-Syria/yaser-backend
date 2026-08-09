-- Remove homework, live sessions, attendance, and survey features.
-- Idempotent-friendly for MySQL (drops FKs/tables/columns only when present).

SET FOREIGN_KEY_CHECKS = 0;

-- Drop FKs referencing live sessions (ignore if already gone via prepared checks below)
-- payments
SET @fk := (SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payments' AND COLUMN_NAME = 'liveSessionId' AND REFERENCED_TABLE_NAME IS NOT NULL LIMIT 1);
SET @sql := IF(@fk IS NOT NULL, CONCAT('ALTER TABLE `payments` DROP FOREIGN KEY `', @fk, '`'), 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- live_class_attendance
SET @fk := (SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'live_class_attendance' AND COLUMN_NAME = 'liveSessionId' AND REFERENCED_TABLE_NAME IS NOT NULL LIMIT 1);
SET @sql := IF(@fk IS NOT NULL, CONCAT('ALTER TABLE `live_class_attendance` DROP FOREIGN KEY `', @fk, '`'), 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- survey_responses.sessionId
SET @fk := (SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'survey_responses' AND COLUMN_NAME = 'sessionId' AND REFERENCED_TABLE_NAME IS NOT NULL LIMIT 1);
SET @sql := IF(@fk IS NOT NULL, CONCAT('ALTER TABLE `survey_responses` DROP FOREIGN KEY `', @fk, '`'), 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- payment_instructor_credits.liveSessionId FK
SET @fk := (SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payment_instructor_credits' AND COLUMN_NAME = 'liveSessionId' AND REFERENCED_TABLE_NAME IS NOT NULL LIMIT 1);
SET @sql := IF(@fk IS NOT NULL, CONCAT('ALTER TABLE `payment_instructor_credits` DROP FOREIGN KEY `', @fk, '`'), 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

DROP TABLE IF EXISTS `survey_responses`;
DROP TABLE IF EXISTS `survey_questions`;
DROP TABLE IF EXISTS `homework_submissions`;
DROP TABLE IF EXISTS `homework_lessons`;
DROP TABLE IF EXISTS `homeworks`;
DROP TABLE IF EXISTS `live_class_attendance`;
DROP TABLE IF EXISTS `live_sessions`;

DELETE FROM `student_playback_notes` WHERE `sourceType` = 'LIVE_SESSION';

SET @exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payments' AND COLUMN_NAME = 'liveSessionId');
SET @sql := IF(@exists > 0, 'ALTER TABLE `payments` DROP COLUMN `liveSessionId`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

DELETE FROM `payment_instructor_credits` WHERE `reason` = 'COURSE_LIVE_SESSION';

SET @idx := (SELECT INDEX_NAME FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payment_instructor_credits' AND COLUMN_NAME = 'liveSessionId' LIMIT 1);
SET @sql := IF(@idx IS NOT NULL, CONCAT('DROP INDEX `', @idx, '` ON `payment_instructor_credits`'), 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payment_instructor_credits' AND COLUMN_NAME = 'liveSessionId');
SET @sql := IF(@exists > 0, 'ALTER TABLE `payment_instructor_credits` DROP COLUMN `liveSessionId`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx2 := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payment_instructor_credits' AND INDEX_NAME = 'payment_instructor_credits_paymentId_instructorId_reason_key');
SET @sql := IF(@idx2 = 0, 'CREATE UNIQUE INDEX `payment_instructor_credits_paymentId_instructorId_reason_key` ON `payment_instructor_credits`(`paymentId`, `instructorId`, `reason`)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'student_performance' AND COLUMN_NAME = 'classesAttended');
SET @sql := IF(@exists > 0, 'ALTER TABLE `student_performance` DROP COLUMN `classesAttended`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'student_performance' AND COLUMN_NAME = 'classesMissed');
SET @sql := IF(@exists > 0, 'ALTER TABLE `student_performance` DROP COLUMN `classesMissed`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'student_performance' AND COLUMN_NAME = 'homeworkCompleted');
SET @sql := IF(@exists > 0, 'ALTER TABLE `student_performance` DROP COLUMN `homeworkCompleted`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'student_performance' AND COLUMN_NAME = 'homeworkLate');
SET @sql := IF(@exists > 0, 'ALTER TABLE `student_performance` DROP COLUMN `homeworkLate`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'lessons' AND COLUMN_NAME = 'isLive');
SET @sql := IF(@exists > 0, 'ALTER TABLE `lessons` DROP COLUMN `isLive`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE `courses` SET `type` = 'RECORDED' WHERE `type` = 'HYBRID';
ALTER TABLE `courses` MODIFY `type` ENUM('RECORDED') NOT NULL DEFAULT 'RECORDED';

ALTER TABLE `student_playback_notes` MODIFY `sourceType` ENUM('RECORDED_LESSON') NOT NULL;

UPDATE `notifications` SET `type` = 'GENERAL' WHERE `type` IN ('HOMEWORK_DUE', 'CLASS_REMINDER');
ALTER TABLE `notifications` MODIFY `type` ENUM('EXAM_AVAILABLE', 'GRADE_POSTED', 'SUBSCRIPTION_EXPIRING', 'GENERAL') NOT NULL DEFAULT 'GENERAL';

ALTER TABLE `payment_instructor_credits` MODIFY `reason` ENUM('COURSE_RECORDED', 'PRIVATE_SESSION') NOT NULL;

SET FOREIGN_KEY_CHECKS = 1;

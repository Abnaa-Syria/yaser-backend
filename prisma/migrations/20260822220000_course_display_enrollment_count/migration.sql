-- Additive only: public enrollment display override columns.
-- Safe: ADD COLUMN with defaults; no drops, no data rewrites.

SET @col1 := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'courses'
    AND COLUMN_NAME = 'useDisplayEnrollmentCount'
);
SET @sql1 := IF(@col1 = 0,
  'ALTER TABLE `courses` ADD COLUMN `useDisplayEnrollmentCount` BOOLEAN NOT NULL DEFAULT true',
  'SELECT 1');
PREPARE stmt1 FROM @sql1;
EXECUTE stmt1;
DEALLOCATE PREPARE stmt1;

SET @col2 := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'courses'
    AND COLUMN_NAME = 'displayEnrollmentCount'
);
SET @sql2 := IF(@col2 = 0,
  'ALTER TABLE `courses` ADD COLUMN `displayEnrollmentCount` INTEGER NOT NULL DEFAULT 2106',
  'SELECT 1');
PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- Additive only: new table + settings upsert. No drops, no truncates.

CREATE TABLE IF NOT EXISTS `device_replacement_requests` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `oldDeviceId` VARCHAR(191) NOT NULL,
    `newFingerprint` VARCHAR(191) NOT NULL,
    `newDeviceName` VARCHAR(191) NULL,
    `newOs` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `reviewedById` VARCHAR(191) NULL,
    `reviewedAt` DATETIME(3) NULL,
    `note` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `device_replacement_requests_studentId_status_idx`(`studentId`, `status`),
    INDEX `device_replacement_requests_status_createdAt_idx`(`status`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Foreign keys (ignore if already present)
SET @fk1 := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'device_replacement_requests'
    AND CONSTRAINT_NAME = 'device_replacement_requests_studentId_fkey'
);
SET @sql1 := IF(@fk1 = 0,
  'ALTER TABLE `device_replacement_requests` ADD CONSTRAINT `device_replacement_requests_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
  'SELECT 1');
PREPARE s1 FROM @sql1; EXECUTE s1; DEALLOCATE PREPARE s1;

SET @fk2 := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'device_replacement_requests'
    AND CONSTRAINT_NAME = 'device_replacement_requests_oldDeviceId_fkey'
);
SET @sql2 := IF(@fk2 = 0,
  'ALTER TABLE `device_replacement_requests` ADD CONSTRAINT `device_replacement_requests_oldDeviceId_fkey` FOREIGN KEY (`oldDeviceId`) REFERENCES `user_devices`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
  'SELECT 1');
PREPARE s2 FROM @sql2; EXECUTE s2; DEALLOCATE PREPARE s2;

SET @fk3 := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'device_replacement_requests'
    AND CONSTRAINT_NAME = 'device_replacement_requests_reviewedById_fkey'
);
SET @sql3 := IF(@fk3 = 0,
  'ALTER TABLE `device_replacement_requests` ADD CONSTRAINT `device_replacement_requests_reviewedById_fkey` FOREIGN KEY (`reviewedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT 1');
PREPARE s3 FROM @sql3; EXECUTE s3; DEALLOCATE PREPARE s3;

INSERT INTO `platform_settings` (`id`, `key`, `value`, `updatedAt`)
SELECT UUID(), 'MAX_TRUSTED_DEVICES', CAST('2' AS JSON), CURRENT_TIMESTAMP(3)
WHERE NOT EXISTS (SELECT 1 FROM `platform_settings` WHERE `key` = 'MAX_TRUSTED_DEVICES');

UPDATE `platform_settings`
SET `value` = CAST('2' AS JSON), `updatedAt` = CURRENT_TIMESTAMP(3)
WHERE `key` = 'MAX_TRUSTED_DEVICES';

INSERT INTO `platform_settings` (`id`, `key`, `value`, `updatedAt`)
SELECT UUID(), 'PUBLIC_PAGE_VISIBILITY',
  CAST('{\"home\":true,\"explore\":true,\"packages\":false,\"instructors\":true,\"events\":true,\"about\":true,\"contact\":true,\"faq\":true,\"blogs\":true,\"library\":true,\"teach\":true,\"guide\":true,\"terms\":true,\"privacy\":true,\"refund\":true}' AS JSON),
  CURRENT_TIMESTAMP(3)
WHERE NOT EXISTS (SELECT 1 FROM `platform_settings` WHERE `key` = 'PUBLIC_PAGE_VISIBILITY');

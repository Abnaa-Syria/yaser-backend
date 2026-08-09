-- Phase C: exam question media (imageUrl) + email verification for Yaser USMLE.
-- Additive migration only: no table drops or destructive data rewrites.

ALTER TABLE `exam_questions`
  ADD COLUMN `imageUrl` TEXT NULL;

ALTER TABLE `users`
  ADD COLUMN `emailVerifiedAt` DATETIME(3) NULL,
  ADD COLUMN `emailVerificationToken` VARCHAR(191) NULL,
  ADD COLUMN `emailVerificationExpires` DATETIME(3) NULL;

CREATE UNIQUE INDEX `users_emailVerificationToken_key` ON `users`(`emailVerificationToken`);

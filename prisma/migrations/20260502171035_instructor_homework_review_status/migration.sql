-- AlterTable
ALTER TABLE `homework_submissions` ADD COLUMN `instructorReviewStatus` ENUM('NOT_OPENED', 'OPENED', 'CLOSED') NOT NULL DEFAULT 'NOT_OPENED';

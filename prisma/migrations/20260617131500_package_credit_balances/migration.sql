-- AlterTable
ALTER TABLE `user_subscriptions`
  MODIFY `endDate` DATETIME(3) NULL,
  ADD COLUMN `liveCohortsUsed` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `recordedCohortsUsed` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `privateSessionsUsed` INTEGER NOT NULL DEFAULT 0;

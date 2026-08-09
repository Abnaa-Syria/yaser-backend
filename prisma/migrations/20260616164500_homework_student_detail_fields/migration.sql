-- AlterTable
ALTER TABLE `homeworks`
  ADD COLUMN `requirements` JSON NULL,
  ADD COLUMN `submissionTips` JSON NULL;

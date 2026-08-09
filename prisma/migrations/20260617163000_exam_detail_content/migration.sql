-- AlterTable
ALTER TABLE `exams`
  ADD COLUMN `coveredTopics` JSON NULL,
  ADD COLUMN `examStructure` JSON NULL,
  ADD COLUMN `importantInstructions` JSON NULL,
  ADD COLUMN `preparationTips` JSON NULL,
  ADD COLUMN `readyMessage` TEXT NULL;

/*
  Warnings:

  - You are about to alter the column `status` on the `homework_submissions` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(8))` to `Enum(EnumId(7))`.
  - You are about to drop the column `attachmentUrl` on the `homeworks` table. All the data in the column will be lost.
  - You are about to drop the column `lessonId` on the `homeworks` table. All the data in the column will be lost.
  - Added the required column `cohortId` to the `homeworks` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `homeworks` DROP FOREIGN KEY `homeworks_lessonId_fkey`;

-- AlterTable
ALTER TABLE `homework_submissions` ADD COLUMN `content` TEXT NULL,
    MODIFY `status` ENUM('PENDING', 'GRADED') NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `homeworks` DROP COLUMN `attachmentUrl`,
    DROP COLUMN `lessonId`,
    ADD COLUMN `attachments` JSON NULL,
    ADD COLUMN `cohortId` VARCHAR(191) NOT NULL,
    ADD COLUMN `type` ENUM('TEXT', 'FILE', 'LINK') NOT NULL DEFAULT 'TEXT';

-- CreateIndex
CREATE INDEX `homeworks_cohortId_idx` ON `homeworks`(`cohortId`);

-- AddForeignKey
ALTER TABLE `homeworks` ADD CONSTRAINT `homeworks_cohortId_fkey` FOREIGN KEY (`cohortId`) REFERENCES `cohorts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

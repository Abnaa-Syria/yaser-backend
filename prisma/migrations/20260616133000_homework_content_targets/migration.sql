-- AlterTable
ALTER TABLE `homeworks`
  ADD COLUMN `targetType` ENUM('COHORT', 'COURSE', 'UNIT', 'LESSONS') NOT NULL DEFAULT 'COHORT',
  ADD COLUMN `courseId` VARCHAR(191) NULL,
  ADD COLUMN `unitId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `homework_lessons` (
  `id` VARCHAR(191) NOT NULL,
  `homeworkId` VARCHAR(191) NOT NULL,
  `lessonId` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  UNIQUE INDEX `homework_lessons_homeworkId_lessonId_key`(`homeworkId`, `lessonId`),
  INDEX `homework_lessons_lessonId_idx`(`lessonId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `homeworks_courseId_idx` ON `homeworks`(`courseId`);

-- CreateIndex
CREATE INDEX `homeworks_unitId_idx` ON `homeworks`(`unitId`);

-- AddForeignKey
ALTER TABLE `homeworks` ADD CONSTRAINT `homeworks_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `homeworks` ADD CONSTRAINT `homeworks_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `units`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `homework_lessons` ADD CONSTRAINT `homework_lessons_homeworkId_fkey` FOREIGN KEY (`homeworkId`) REFERENCES `homeworks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `homework_lessons` ADD CONSTRAINT `homework_lessons_lessonId_fkey` FOREIGN KEY (`lessonId`) REFERENCES `lessons`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

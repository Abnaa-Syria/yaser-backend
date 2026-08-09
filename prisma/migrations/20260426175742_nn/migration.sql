-- AlterTable
ALTER TABLE `course_reviews` ADD COLUMN `isFeatured` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `enrollments` ADD COLUMN `completedLessonsCount` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `isCompleted` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `progressPercentage` DOUBLE NOT NULL DEFAULT 0.0;

-- AlterTable
ALTER TABLE `lesson_progress` ADD COLUMN `lastAccessedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `timeSpentSeconds` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `watchPercentage` INTEGER NOT NULL DEFAULT 0,
    MODIFY `isCompleted` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `completedAt` DATETIME(3) NULL;

-- CreateIndex
CREATE INDEX `lesson_progress_studentId_idx` ON `lesson_progress`(`studentId`);

-- RedefineIndex
CREATE INDEX `lesson_progress_lessonId_idx` ON `lesson_progress`(`lessonId`);

/*
  Warnings:

  - You are about to drop the column `instructorId` on the `courses` table. All the data in the column will be lost.
  - You are about to drop the column `classId` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the `class_reviews` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `classes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `enrollments` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[studentId,lessonId,cohortId]` on the table `lesson_progress` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `class_reviews` DROP FOREIGN KEY `class_reviews_classId_fkey`;

-- DropForeignKey
ALTER TABLE `class_reviews` DROP FOREIGN KEY `class_reviews_studentId_fkey`;

-- DropForeignKey
ALTER TABLE `classes` DROP FOREIGN KEY `classes_instructorId_fkey`;

-- DropForeignKey
ALTER TABLE `classes` DROP FOREIGN KEY `classes_lessonId_fkey`;

-- DropForeignKey
ALTER TABLE `courses` DROP FOREIGN KEY `courses_instructorId_fkey`;

-- DropForeignKey
ALTER TABLE `enrollments` DROP FOREIGN KEY `enrollments_classId_fkey`;

-- DropForeignKey
ALTER TABLE `enrollments` DROP FOREIGN KEY `enrollments_courseId_fkey`;

-- DropForeignKey
ALTER TABLE `enrollments` DROP FOREIGN KEY `enrollments_studentId_fkey`;

-- DropForeignKey
ALTER TABLE `payments` DROP FOREIGN KEY `payments_classId_fkey`;

-- DropIndex
DROP INDEX `lesson_progress_studentId_lessonId_key` ON `lesson_progress`;

-- AlterTable
ALTER TABLE `courses` DROP COLUMN `instructorId`,
    ADD COLUMN `introVideoUrl` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `exams` ADD COLUMN `lessonId` VARCHAR(191) NULL,
    ADD COLUMN `type` ENUM('FINAL', 'UNIT', 'LESSON', 'STANDALONE') NOT NULL DEFAULT 'STANDALONE';

-- AlterTable
ALTER TABLE `lesson_progress` ADD COLUMN `cohortId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `lessons` ADD COLUMN `videoUrl` TEXT NULL;

-- AlterTable
ALTER TABLE `packages` ADD COLUMN `liveCohortsLimit` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `privateSessionsLimit` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `recordedCohortsLimit` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `payments` DROP COLUMN `classId`,
    ADD COLUMN `cohortId` VARCHAR(191) NULL;

-- DropTable
DROP TABLE `class_reviews`;

-- DropTable
DROP TABLE `classes`;

-- DropTable
DROP TABLE `enrollments`;

-- CreateTable
CREATE TABLE `cohorts` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` ENUM('LIVE', 'RECORDED') NOT NULL DEFAULT 'LIVE',
    `status` ENUM('UPCOMING', 'ONGOING', 'COMPLETED') NOT NULL DEFAULT 'UPCOMING',
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `price` DOUBLE NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `instructorId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `cohorts_courseId_idx`(`courseId`),
    INDEX `cohorts_instructorId_idx`(`instructorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cohort_enrollments` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `cohortId` VARCHAR(191) NOT NULL,
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `isCompleted` BOOLEAN NOT NULL DEFAULT false,
    `completedLessonsCount` INTEGER NOT NULL DEFAULT 0,
    `progressPercentage` DOUBLE NOT NULL DEFAULT 0.0,

    UNIQUE INDEX `cohort_enrollments_cohortId_studentId_key`(`cohortId`, `studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `live_sessions` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `type` ENUM('GROUP', 'PRIVATE') NOT NULL DEFAULT 'GROUP',
    `status` ENUM('UPCOMING', 'ONGOING', 'COMPLETED', 'MISSED') NOT NULL DEFAULT 'UPCOMING',
    `startTime` DATETIME(3) NOT NULL,
    `endTime` DATETIME(3) NOT NULL,
    `meetingUrl` TEXT NULL,
    `recordingUrl` TEXT NULL,
    `instructorId` VARCHAR(191) NOT NULL,
    `cohortId` VARCHAR(191) NULL,
    `studentId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `live_sessions_instructorId_idx`(`instructorId`),
    INDEX `live_sessions_cohortId_idx`(`cohortId`),
    INDEX `live_sessions_studentId_idx`(`studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `instructor_availabilities` (
    `id` VARCHAR(191) NOT NULL,
    `instructorId` VARCHAR(191) NOT NULL,
    `startTime` DATETIME(3) NOT NULL,
    `endTime` DATETIME(3) NOT NULL,
    `status` ENUM('AVAILABLE', 'BOOKED') NOT NULL DEFAULT 'AVAILABLE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `instructor_availabilities_instructorId_startTime_key`(`instructorId`, `startTime`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cohort_reviews` (
    `id` VARCHAR(191) NOT NULL,
    `cohortId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `rating` INTEGER NOT NULL DEFAULT 5,
    `comment` TEXT NULL,
    `isVisible` BOOLEAN NOT NULL DEFAULT true,
    `isFeaturedOnHome` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `cohort_reviews_cohortId_studentId_key`(`cohortId`, `studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cms_posts` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `content` JSON NOT NULL,
    `thumbnail` VARCHAR(191) NULL,
    `published` BOOLEAN NOT NULL DEFAULT false,
    `authorId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `cms_posts_slug_key`(`slug`),
    INDEX `cms_posts_authorId_idx`(`authorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cms_announcements` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `activeUntil` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cms_banners` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NULL,
    `imageUrl` TEXT NOT NULL,
    `link` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `order` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `platform_settings` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `value` JSON NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `platform_settings_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `email_templates` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `subject` VARCHAR(191) NOT NULL,
    `body` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `email_templates_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `exams_lessonId_idx` ON `exams`(`lessonId`);

-- CreateIndex
CREATE INDEX `lesson_progress_cohortId_idx` ON `lesson_progress`(`cohortId`);

-- CreateIndex
CREATE UNIQUE INDEX `lesson_progress_studentId_lessonId_cohortId_key` ON `lesson_progress`(`studentId`, `lessonId`, `cohortId`);

-- AddForeignKey
ALTER TABLE `cohorts` ADD CONSTRAINT `cohorts_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cohorts` ADD CONSTRAINT `cohorts_instructorId_fkey` FOREIGN KEY (`instructorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cohort_enrollments` ADD CONSTRAINT `cohort_enrollments_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cohort_enrollments` ADD CONSTRAINT `cohort_enrollments_cohortId_fkey` FOREIGN KEY (`cohortId`) REFERENCES `cohorts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `live_sessions` ADD CONSTRAINT `live_sessions_instructorId_fkey` FOREIGN KEY (`instructorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `live_sessions` ADD CONSTRAINT `live_sessions_cohortId_fkey` FOREIGN KEY (`cohortId`) REFERENCES `cohorts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `live_sessions` ADD CONSTRAINT `live_sessions_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `instructor_availabilities` ADD CONSTRAINT `instructor_availabilities_instructorId_fkey` FOREIGN KEY (`instructorId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exams` ADD CONSTRAINT `exams_lessonId_fkey` FOREIGN KEY (`lessonId`) REFERENCES `lessons`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cohort_reviews` ADD CONSTRAINT `cohort_reviews_cohortId_fkey` FOREIGN KEY (`cohortId`) REFERENCES `cohorts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cohort_reviews` ADD CONSTRAINT `cohort_reviews_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_cohortId_fkey` FOREIGN KEY (`cohortId`) REFERENCES `cohorts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lesson_progress` ADD CONSTRAINT `lesson_progress_cohortId_fkey` FOREIGN KEY (`cohortId`) REFERENCES `cohorts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cms_posts` ADD CONSTRAINT `cms_posts_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

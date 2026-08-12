-- CreateTable
CREATE TABLE `flashcard_progress` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `flashcardId` VARCHAR(191) NOT NULL,
    `difficulty` ENUM('EASY', 'MEDIUM', 'HARD') NOT NULL,
    `nextDueAt` DATETIME(3) NOT NULL,
    `lastReviewedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `flashcard_progress_studentId_flashcardId_key`(`studentId`, `flashcardId`),
    INDEX `flashcard_progress_studentId_nextDueAt_idx`(`studentId`, `nextDueAt`),
    INDEX `flashcard_progress_flashcardId_idx`(`flashcardId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_flashcards` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `front` TEXT NOT NULL,
    `frontAr` TEXT NULL,
    `back` TEXT NOT NULL,
    `backAr` TEXT NULL,
    `explanation` TEXT NULL,
    `explanationAr` TEXT NULL,
    `courseId` VARCHAR(191) NULL,
    `unitId` VARCHAR(191) NULL,
    `lessonId` VARCHAR(191) NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `student_flashcards_studentId_idx`(`studentId`),
    INDEX `student_flashcards_courseId_idx`(`courseId`),
    INDEX `student_flashcards_unitId_idx`(`unitId`),
    INDEX `student_flashcards_lessonId_idx`(`lessonId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_flashcard_progress` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `studentFlashcardId` VARCHAR(191) NOT NULL,
    `difficulty` ENUM('EASY', 'MEDIUM', 'HARD') NOT NULL,
    `nextDueAt` DATETIME(3) NOT NULL,
    `lastReviewedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `student_flashcard_progress_studentId_studentFlashcardId_key`(`studentId`, `studentFlashcardId`),
    INDEX `student_flashcard_progress_studentId_nextDueAt_idx`(`studentId`, `nextDueAt`),
    INDEX `student_flashcard_progress_studentFlashcardId_idx`(`studentFlashcardId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `flashcard_progress` ADD CONSTRAINT `flashcard_progress_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `flashcard_progress` ADD CONSTRAINT `flashcard_progress_flashcardId_fkey` FOREIGN KEY (`flashcardId`) REFERENCES `flashcards`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `student_flashcards` ADD CONSTRAINT `student_flashcards_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `student_flashcards` ADD CONSTRAINT `student_flashcards_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `student_flashcards` ADD CONSTRAINT `student_flashcards_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `units`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `student_flashcards` ADD CONSTRAINT `student_flashcards_lessonId_fkey` FOREIGN KEY (`lessonId`) REFERENCES `lessons`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `student_flashcard_progress` ADD CONSTRAINT `student_flashcard_progress_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `student_flashcard_progress` ADD CONSTRAINT `student_flashcard_progress_studentFlashcardId_fkey` FOREIGN KEY (`studentFlashcardId`) REFERENCES `student_flashcards`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Default SRS interval settings
INSERT INTO `platform_settings` (`id`, `key`, `value`, `updatedAt`)
SELECT UUID(), 'FLASHCARD_INTERVAL_EASY_DAYS', CAST('30' AS JSON), CURRENT_TIMESTAMP(3)
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `platform_settings` WHERE `key` = 'FLASHCARD_INTERVAL_EASY_DAYS');

INSERT INTO `platform_settings` (`id`, `key`, `value`, `updatedAt`)
SELECT UUID(), 'FLASHCARD_INTERVAL_MEDIUM_DAYS', CAST('7' AS JSON), CURRENT_TIMESTAMP(3)
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `platform_settings` WHERE `key` = 'FLASHCARD_INTERVAL_MEDIUM_DAYS');

INSERT INTO `platform_settings` (`id`, `key`, `value`, `updatedAt`)
SELECT UUID(), 'FLASHCARD_INTERVAL_HARD_DAYS', CAST('3' AS JSON), CURRENT_TIMESTAMP(3)
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `platform_settings` WHERE `key` = 'FLASHCARD_INTERVAL_HARD_DAYS');

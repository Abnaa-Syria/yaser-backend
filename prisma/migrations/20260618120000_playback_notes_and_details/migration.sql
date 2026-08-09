-- CreateTable
CREATE TABLE `student_playback_notes` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `sourceType` ENUM('LIVE_SESSION', 'RECORDED_LESSON') NOT NULL,
    `sourceId` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `timestampSeconds` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `student_playback_notes_studentId_sourceType_sourceId_idx`(`studentId`, `sourceType`, `sourceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `student_playback_notes` ADD CONSTRAINT `student_playback_notes_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

/*
  Warnings:

  - A unique constraint covering the columns `[passwordResetToken]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `certificates` DROP FOREIGN KEY `certificates_issuedById_fkey`;

-- DropForeignKey
ALTER TABLE `certificates` DROP FOREIGN KEY `certificates_studentId_fkey`;

-- DropForeignKey
ALTER TABLE `payout_requests` DROP FOREIGN KEY `payout_requests_instructorId_fkey`;

-- DropForeignKey
ALTER TABLE `wallets` DROP FOREIGN KEY `wallets_instructorId_fkey`;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `passwordResetExpires` DATETIME(3) NULL,
    ADD COLUMN `passwordResetToken` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `users_passwordResetToken_key` ON `users`(`passwordResetToken`);

-- AddForeignKey
ALTER TABLE `certificates` ADD CONSTRAINT `certificates_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `certificates` ADD CONSTRAINT `certificates_issuedById_fkey` FOREIGN KEY (`issuedById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wallets` ADD CONSTRAINT `wallets_instructorId_fkey` FOREIGN KEY (`instructorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payout_requests` ADD CONSTRAINT `payout_requests_instructorId_fkey` FOREIGN KEY (`instructorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

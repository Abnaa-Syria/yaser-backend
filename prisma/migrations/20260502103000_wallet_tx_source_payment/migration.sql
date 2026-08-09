-- Idempotent link from wallet earning rows to payments
ALTER TABLE `wallet_transactions` ADD COLUMN `sourcePaymentId` VARCHAR(191) NULL;
CREATE UNIQUE INDEX `wallet_transactions_sourcePaymentId_key` ON `wallet_transactions`(`sourcePaymentId`);

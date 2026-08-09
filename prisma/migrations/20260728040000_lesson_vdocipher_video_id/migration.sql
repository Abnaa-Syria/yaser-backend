-- Add VdoCipher video ID for secure OTP-based lesson playback.
ALTER TABLE `lessons` ADD COLUMN `vdoCipherVideoId` VARCHAR(191) NULL;

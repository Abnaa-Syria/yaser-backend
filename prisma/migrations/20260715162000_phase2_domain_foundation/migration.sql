-- Phase 2 domain foundation for Yaser USMLE.
-- Additive migration only: no table drops or destructive data rewrites.

ALTER TABLE `users`
  ADD COLUMN `legacyPasswordRehashedAt` DATETIME(3) NULL;

ALTER TABLE `courses`
  ADD COLUMN `titleAr` VARCHAR(191) NULL,
  ADD COLUMN `slug` VARCHAR(191) NULL,
  ADD COLUMN `shortDescription` TEXT NULL,
  ADD COLUMN `shortDescriptionAr` TEXT NULL,
  ADD COLUMN `descriptionAr` TEXT NULL,
  ADD COLUMN `coverImage` TEXT NULL,
  ADD COLUMN `isFeatured` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `displayOrder` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `publishStatus` ENUM('DRAFT','PUBLISHED','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN `seoTitle` VARCHAR(191) NULL,
  ADD COLUMN `seoTitleAr` VARCHAR(191) NULL,
  ADD COLUMN `seoDescription` TEXT NULL,
  ADD COLUMN `seoDescriptionAr` TEXT NULL,
  ADD COLUMN `seoKeywords` TEXT NULL;

CREATE UNIQUE INDEX `courses_slug_key` ON `courses`(`slug`);
CREATE INDEX `courses_publishStatus_idx` ON `courses`(`publishStatus`);
CREATE INDEX `courses_displayOrder_idx` ON `courses`(`displayOrder`);

ALTER TABLE `categories`
  ADD COLUMN `nameAr` VARCHAR(191) NULL,
  ADD COLUMN `descriptionAr` TEXT NULL,
  ADD COLUMN `status` ENUM('DRAFT','PUBLISHED','ARCHIVED') NOT NULL DEFAULT 'PUBLISHED',
  ADD COLUMN `displayOrder` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `seoTitle` VARCHAR(191) NULL,
  ADD COLUMN `seoTitleAr` VARCHAR(191) NULL,
  ADD COLUMN `seoDescription` TEXT NULL,
  ADD COLUMN `seoDescriptionAr` TEXT NULL;

CREATE INDEX `categories_status_idx` ON `categories`(`status`);
CREATE INDEX `categories_displayOrder_idx` ON `categories`(`displayOrder`);

ALTER TABLE `units`
  ADD COLUMN `titleAr` VARCHAR(191) NULL,
  ADD COLUMN `slug` VARCHAR(191) NULL,
  ADD COLUMN `description` TEXT NULL,
  ADD COLUMN `descriptionAr` TEXT NULL,
  ADD COLUMN `imageUrl` TEXT NULL,
  ADD COLUMN `status` ENUM('DRAFT','PUBLISHED','ARCHIVED') NOT NULL DEFAULT 'PUBLISHED';

CREATE UNIQUE INDEX `units_courseId_slug_key` ON `units`(`courseId`, `slug`);
CREATE INDEX `units_status_idx` ON `units`(`status`);

ALTER TABLE `lessons`
  ADD COLUMN `titleAr` VARCHAR(191) NULL,
  ADD COLUMN `slug` VARCHAR(191) NULL,
  ADD COLUMN `description` TEXT NULL,
  ADD COLUMN `descriptionAr` TEXT NULL,
  ADD COLUMN `content` TEXT NULL,
  ADD COLUMN `contentAr` TEXT NULL,
  ADD COLUMN `isPreview` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `status` ENUM('DRAFT','PUBLISHED','ARCHIVED') NOT NULL DEFAULT 'PUBLISHED';

CREATE UNIQUE INDEX `lessons_sectionId_slug_key` ON `lessons`(`sectionId`, `slug`);
CREATE INDEX `lessons_status_idx` ON `lessons`(`status`);

ALTER TABLE `exams`
  ADD COLUMN `titleAr` VARCHAR(191) NULL,
  ADD COLUMN `descriptionAr` TEXT NULL;

ALTER TABLE `exam_questions`
  ADD COLUMN `questionTextAr` TEXT NULL,
  ADD COLUMN `explanation` TEXT NULL,
  ADD COLUMN `explanationAr` TEXT NULL;

ALTER TABLE `lesson_resources`
  ADD COLUMN `titleAr` VARCHAR(191) NULL,
  MODIFY `fileUrl` TEXT NULL,
  ADD COLUMN `externalUrl` TEXT NULL,
  ADD COLUMN `mimeType` VARCHAR(191) NULL,
  ADD COLUMN `fileSizeBytes` INTEGER NULL,
  ADD COLUMN `isDownloadable` BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN `isVisible` BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);

CREATE INDEX `lesson_resources_isVisible_idx` ON `lesson_resources`(`isVisible`);

ALTER TABLE `course_pricing_tiers`
  ADD COLUMN `label` VARCHAR(191) NULL,
  ADD COLUMN `labelAr` VARCHAR(191) NULL,
  ADD COLUMN `originalPrice` DOUBLE NULL,
  ADD COLUMN `currency` VARCHAR(191) NOT NULL DEFAULT 'USD',
  ADD COLUMN `durationValue` INTEGER NULL,
  ADD COLUMN `durationUnit` ENUM('DAY','WEEK','MONTH','YEAR','LIFETIME') NULL,
  ADD COLUMN `displayOrder` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `description` TEXT NULL,
  ADD COLUMN `descriptionAr` TEXT NULL,
  ADD COLUMN `badge` VARCHAR(191) NULL;

CREATE INDEX `course_pricing_tiers_courseId_isActive_idx` ON `course_pricing_tiers`(`courseId`, `isActive`);
CREATE INDEX `course_pricing_tiers_displayOrder_idx` ON `course_pricing_tiers`(`displayOrder`);

ALTER TABLE `course_packages`
  ADD COLUMN `slug` VARCHAR(191) NULL,
  ADD COLUMN `shortDescription` TEXT NULL,
  ADD COLUMN `shortDescriptionAr` TEXT NULL,
  ADD COLUMN `coverImage` TEXT NULL,
  ADD COLUMN `originalPrice` DOUBLE NULL,
  ADD COLUMN `currency` VARCHAR(191) NOT NULL DEFAULT 'USD',
  ADD COLUMN `publishStatus` ENUM('DRAFT','PUBLISHED','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN `isFeatured` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `displayOrder` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `seoTitle` VARCHAR(191) NULL,
  ADD COLUMN `seoTitleAr` VARCHAR(191) NULL,
  ADD COLUMN `seoDescription` TEXT NULL,
  ADD COLUMN `seoDescriptionAr` TEXT NULL;

CREATE UNIQUE INDEX `course_packages_slug_key` ON `course_packages`(`slug`);
CREATE INDEX `course_packages_publishStatus_idx` ON `course_packages`(`publishStatus`);
CREATE INDEX `course_packages_displayOrder_idx` ON `course_packages`(`displayOrder`);

ALTER TABLE `course_package_purchases`
  ADD COLUMN `accessStartsAt` DATETIME(3) NULL,
  ADD COLUMN `activatedAt` DATETIME(3) NULL;

CREATE INDEX `course_package_purchases_expiresAt_idx` ON `course_package_purchases`(`expiresAt`);

ALTER TABLE `course_package_pricing_tiers`
  ADD COLUMN `label` VARCHAR(191) NULL,
  ADD COLUMN `labelAr` VARCHAR(191) NULL,
  ADD COLUMN `originalPrice` DOUBLE NULL,
  ADD COLUMN `currency` VARCHAR(191) NOT NULL DEFAULT 'USD',
  ADD COLUMN `durationValue` INTEGER NULL,
  ADD COLUMN `durationUnit` ENUM('DAY','WEEK','MONTH','YEAR','LIFETIME') NULL,
  ADD COLUMN `displayOrder` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `description` TEXT NULL,
  ADD COLUMN `descriptionAr` TEXT NULL;

CREATE INDEX `course_package_pricing_tiers_packageId_isActive_idx` ON `course_package_pricing_tiers`(`packageId`, `isActive`);
CREATE INDEX `course_package_pricing_tiers_displayOrder_idx` ON `course_package_pricing_tiers`(`displayOrder`);

ALTER TABLE `course_purchases`
  ADD COLUMN `accessStartsAt` DATETIME(3) NULL,
  ADD COLUMN `activatedAt` DATETIME(3) NULL;

CREATE INDEX `course_purchases_expiresAt_idx` ON `course_purchases`(`expiresAt`);

ALTER TABLE `payments`
  ADD COLUMN `studentNote` TEXT NULL,
  ADD COLUMN `adminNote` TEXT NULL,
  ADD COLUMN `rejectionReason` TEXT NULL,
  ADD COLUMN `paymentDestinationSnapshot` JSON NULL,
  ADD COLUMN `priceSnapshot` JSON NULL,
  ADD COLUMN `reviewedById` VARCHAR(191) NULL,
  ADD COLUMN `reviewedAt` DATETIME(3) NULL,
  ADD COLUMN `activatedAt` DATETIME(3) NULL,
  ADD COLUMN `accessStartsAt` DATETIME(3) NULL,
  ADD COLUMN `accessExpiresAt` DATETIME(3) NULL;

CREATE INDEX `payments_reviewedById_idx` ON `payments`(`reviewedById`);
ALTER TABLE `payments` ADD CONSTRAINT `payments_reviewedById_fkey` FOREIGN KEY (`reviewedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `contact_submissions`
  ADD COLUMN `phone` VARCHAR(191) NULL;

CREATE TABLE `flashcards` (
  `id` VARCHAR(191) NOT NULL,
  `lessonId` VARCHAR(191) NOT NULL,
  `front` TEXT NOT NULL,
  `frontAr` TEXT NULL,
  `back` TEXT NOT NULL,
  `backAr` TEXT NULL,
  `explanation` TEXT NULL,
  `explanationAr` TEXT NULL,
  `displayOrder` INTEGER NOT NULL DEFAULT 0,
  `status` ENUM('DRAFT','PUBLISHED','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  `createdById` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `flashcards_lessonId_idx` ON `flashcards`(`lessonId`);
CREATE INDEX `flashcards_status_idx` ON `flashcards`(`status`);
CREATE INDEX `flashcards_displayOrder_idx` ON `flashcards`(`displayOrder`);
ALTER TABLE `flashcards` ADD CONSTRAINT `flashcards_lessonId_fkey` FOREIGN KEY (`lessonId`) REFERENCES `lessons`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `flashcards` ADD CONSTRAINT `flashcards_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE `study_plans` (
  `id` VARCHAR(191) NOT NULL,
  `studentId` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `goal` TEXT NULL,
  `targetDate` DATETIME(3) NULL,
  `isArchived` BOOLEAN NOT NULL DEFAULT false,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `study_plans_studentId_idx` ON `study_plans`(`studentId`);
CREATE INDEX `study_plans_targetDate_idx` ON `study_plans`(`targetDate`);
ALTER TABLE `study_plans` ADD CONSTRAINT `study_plans_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE `study_plan_items` (
  `id` VARCHAR(191) NOT NULL,
  `planId` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `notes` TEXT NULL,
  `scheduledAt` DATETIME(3) NULL,
  `status` ENUM('TODO','IN_PROGRESS','DONE','SKIPPED') NOT NULL DEFAULT 'TODO',
  `priority` INTEGER NOT NULL DEFAULT 0,
  `order` INTEGER NOT NULL DEFAULT 0,
  `courseId` VARCHAR(191) NULL,
  `unitId` VARCHAR(191) NULL,
  `lessonId` VARCHAR(191) NULL,
  `completedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `study_plan_items_planId_idx` ON `study_plan_items`(`planId`);
CREATE INDEX `study_plan_items_courseId_idx` ON `study_plan_items`(`courseId`);
CREATE INDEX `study_plan_items_unitId_idx` ON `study_plan_items`(`unitId`);
CREATE INDEX `study_plan_items_lessonId_idx` ON `study_plan_items`(`lessonId`);
CREATE INDEX `study_plan_items_scheduledAt_idx` ON `study_plan_items`(`scheduledAt`);
CREATE INDEX `study_plan_items_status_idx` ON `study_plan_items`(`status`);
ALTER TABLE `study_plan_items` ADD CONSTRAINT `study_plan_items_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `study_plans`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `study_plan_items` ADD CONSTRAINT `study_plan_items_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `study_plan_items` ADD CONSTRAINT `study_plan_items_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `units`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `study_plan_items` ADD CONSTRAINT `study_plan_items_lessonId_fkey` FOREIGN KEY (`lessonId`) REFERENCES `lessons`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE `instructor_applications` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `phone` VARCHAR(191) NULL,
  `specialty` TEXT NULL,
  `experience` TEXT NULL,
  `message` TEXT NOT NULL,
  `documentUrl` TEXT NULL,
  `status` ENUM('NEW','REVIEWING','ACCEPTED','REJECTED','ARCHIVED') NOT NULL DEFAULT 'NEW',
  `adminNotes` TEXT NULL,
  `reviewedById` VARCHAR(191) NULL,
  `reviewedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `instructor_applications_status_idx` ON `instructor_applications`(`status`);
CREATE INDEX `instructor_applications_email_idx` ON `instructor_applications`(`email`);
CREATE INDEX `instructor_applications_reviewedById_idx` ON `instructor_applications`(`reviewedById`);
ALTER TABLE `instructor_applications` ADD CONSTRAINT `instructor_applications_reviewedById_fkey` FOREIGN KEY (`reviewedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE `legacy_import_runs` (
  `id` VARCHAR(191) NOT NULL,
  `source` VARCHAR(191) NOT NULL DEFAULT 'WORDPRESS',
  `mode` VARCHAR(191) NOT NULL DEFAULT 'DRY_RUN',
  `status` ENUM('DRY_RUN','RUNNING','COMPLETED','FAILED') NOT NULL DEFAULT 'DRY_RUN',
  `sourceDescription` TEXT NULL,
  `options` JSON NULL,
  `summary` JSON NULL,
  `errorLog` JSON NULL,
  `usersRead` INTEGER NOT NULL DEFAULT 0,
  `usersImported` INTEGER NOT NULL DEFAULT 0,
  `usersSkipped` INTEGER NOT NULL DEFAULT 0,
  `conflictsCount` INTEGER NOT NULL DEFAULT 0,
  `failuresCount` INTEGER NOT NULL DEFAULT 0,
  `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `finishedAt` DATETIME(3) NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `legacy_import_runs_source_status_idx` ON `legacy_import_runs`(`source`, `status`);

CREATE TABLE `legacy_external_id_maps` (
  `id` VARCHAR(191) NOT NULL,
  `runId` VARCHAR(191) NULL,
  `source` VARCHAR(191) NOT NULL DEFAULT 'WORDPRESS',
  `sourceTable` VARCHAR(191) NOT NULL,
  `legacyId` VARCHAR(191) NOT NULL,
  `entityType` VARCHAR(191) NOT NULL,
  `targetId` VARCHAR(191) NOT NULL,
  `metadata` JSON NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE UNIQUE INDEX `legacy_external_id_maps_source_sourceTable_legacyId_entityType_key` ON `legacy_external_id_maps`(`source`, `sourceTable`, `legacyId`, `entityType`);
CREATE INDEX `legacy_external_id_maps_runId_idx` ON `legacy_external_id_maps`(`runId`);
CREATE INDEX `legacy_external_id_maps_entityType_targetId_idx` ON `legacy_external_id_maps`(`entityType`, `targetId`);
ALTER TABLE `legacy_external_id_maps` ADD CONSTRAINT `legacy_external_id_maps_runId_fkey` FOREIGN KEY (`runId`) REFERENCES `legacy_import_runs`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE `legacy_import_conflicts` (
  `id` VARCHAR(191) NOT NULL,
  `runId` VARCHAR(191) NULL,
  `source` VARCHAR(191) NOT NULL DEFAULT 'WORDPRESS',
  `sourceTable` VARCHAR(191) NULL,
  `legacyId` VARCHAR(191) NULL,
  `entityType` VARCHAR(191) NOT NULL,
  `conflictType` VARCHAR(191) NOT NULL,
  `severity` VARCHAR(191) NOT NULL DEFAULT 'REVIEW',
  `message` TEXT NOT NULL,
  `payload` JSON NULL,
  `resolvedAt` DATETIME(3) NULL,
  `resolutionNote` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `legacy_import_conflicts_runId_idx` ON `legacy_import_conflicts`(`runId`);
CREATE INDEX `legacy_import_conflicts_entityType_idx` ON `legacy_import_conflicts`(`entityType`);
CREATE INDEX `legacy_import_conflicts_conflictType_idx` ON `legacy_import_conflicts`(`conflictType`);
CREATE INDEX `legacy_import_conflicts_resolvedAt_idx` ON `legacy_import_conflicts`(`resolvedAt`);
ALTER TABLE `legacy_import_conflicts` ADD CONSTRAINT `legacy_import_conflicts_runId_fkey` FOREIGN KEY (`runId`) REFERENCES `legacy_import_runs`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE `legacy_import_checkpoints` (
  `id` VARCHAR(191) NOT NULL,
  `runId` VARCHAR(191) NOT NULL,
  `step` VARCHAR(191) NOT NULL,
  `cursor` VARCHAR(191) NULL,
  `processed` INTEGER NOT NULL DEFAULT 0,
  `metadata` JSON NULL,
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE UNIQUE INDEX `legacy_import_checkpoints_runId_step_key` ON `legacy_import_checkpoints`(`runId`, `step`);
ALTER TABLE `legacy_import_checkpoints` ADD CONSTRAINT `legacy_import_checkpoints_runId_fkey` FOREIGN KEY (`runId`) REFERENCES `legacy_import_runs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

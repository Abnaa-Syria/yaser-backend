-- Backfill: graded submissions are considered closed in the instructor queue
UPDATE `homework_submissions` SET `instructorReviewStatus` = 'CLOSED' WHERE `status` = 'GRADED';

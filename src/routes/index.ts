import { Router } from 'express';
import { platformFeatures } from '../config/features.config.js';
import { disabledFeature } from '../middlewares/featureFlag.middleware.js';

import authRoutes from '../modules/auth/auth.routes.js';
import profileRoutes from '../modules/profile/profile.routes.js';
import adminUserRoutes from '../modules/admin/users/admin-user.routes.js';
import adminStudentRoutes from '../modules/admin/students/admin-student.routes.js';
import publicInstructorRoutes from '../modules/public/instructors/public-instructor.routes.js';
import instructorPanelRoutes from '../modules/instructor-panel/instructor-panel.routes.js';
import adminInstructorRoutes from '../modules/admin/instructors/admin-instructor.routes.js';
import publicCourseRoutes from '../modules/public/courses/public-course.routes.js';
import studentCourseRoutes from '../modules/student/courses/student-course.routes.js';
import adminCourseRoutes from '../modules/admin/courses/admin-course.routes.js';
import adminUnitRoutes from '../modules/admin/units/admin-unit.routes.js';
import adminLessonRoutes from '../modules/admin/lessons/admin-lesson.routes.js';
import instructorExamRoutes from '../modules/instructor/exams/instructor-exam.routes.js';
import studentExamRoutes from '../modules/student/exams/student-exam.routes.js';
import adminExamRoutes from '../modules/admin/exams/admin-exam.routes.js';
import publicPackageRoutes from '../modules/public/packages/public-package.routes.js';
import studentFinancialRoutes from '../modules/student/financials/student-financial.routes.js';
import adminFinancialRoutes from '../modules/admin/financials/admin-financial.routes.js';
import adminCouponRoutes from '../modules/admin/coupons/admin-coupon.routes.js';
import notificationRoutes from '../modules/notifications/notification.routes.js';
import adminCmsRoutes from '../modules/admin/cms/admin-cms.routes.js';
import publicCmsRoutes from '../modules/public/cms/public-cms.routes.js';
import publicSiteSettingsRoutes from '../modules/public/settings/public-site-settings.routes.js';
import supportRoutes from '../modules/support/support.routes.js';
import studentCouponRoutes from '../modules/student/coupons/student-coupon.routes.js';
import instructorAvailabilityRoutes from '../modules/instructor/availability/instructor-availability.routes.js';
import studentBookingRoutes from '../modules/student/booking/student-booking.routes.js';
import adminDashboardRoutes from '../modules/admin/dashboard/admin-dashboard.routes.js';
import adminEnrollmentRoutes from '../modules/admin/enrollments/admin-enrollment.routes.js';
import adminSettingsRoutes from '../modules/admin/settings/admin-settings.routes.js';
import adminRoleRoutes from '../modules/admin/roles/admin-role.routes.js';
import adminSubscriptionRoutes from '../modules/admin/subscriptions/admin-subscription.routes.js';
import adminCategoryRoutes from '../modules/admin/categories/admin-category.routes.js';
import studentProgressRoutes from '../modules/student/progress/student-progress.routes.js';
import adminResourceRoutes from '../modules/admin/resources/admin-resource.routes.js';
import studentResourceRoutes from '../modules/student/resources/student-resource.routes.js';
import publicReviewRoutes from '../modules/public/reviews/public-review.routes.js';
import studentReviewRoutes from '../modules/student/reviews/student-review.routes.js';
import adminReviewRoutes from '../modules/admin/reviews/admin-review.routes.js';
import studentQnaRoutes from '../modules/student/qna/student-qna.routes.js';
import instructorQnaRoutes from '../modules/instructor/qna/instructor-qna.routes.js';
import instructorWalletRoutes from '../modules/instructor/wallet/instructor-wallet.routes.js';
import instructorPerformanceRoutes from '../modules/instructor/performance/instructor-performance.routes.js';
import instructorDashboardRoutes from '../modules/instructor/dashboard/instructor-dashboard.routes.js';
import instructorClassRoutes from '../modules/instructor/classes/instructor-class.routes.js';
import instructorCourseRoutes from '../modules/instructor/courses/instructor-course.routes.js';
import instructorStudentRoutes from '../modules/instructor/students/instructor-student.routes.js';
import adminPayoutRoutes from '../modules/admin/payouts/admin-payout.routes.js';
import publicCategoryRoutes from '../modules/public/categories/public-category.routes.js';
import studentWishlistRoutes from '../modules/student/wishlist/student-wishlist.routes.js';
import studentCertificateRoutes from '../modules/student/certificates/student-certificate.routes.js';
import adminCertificateRoutes from '../modules/admin/certificates/admin-certificate.routes.js';
import adminSectionRoutes from '../modules/admin/sections/admin-section.routes.js';
import adminAuditLogRoutes from '../modules/admin/audit-logs/admin-audit-log.routes.js';
import paymentWebhookRoutes from '../modules/webhooks/payment-webhook.routes.js';
import publicCertificateRoutes from '../modules/public/certificates/public-certificate.routes.js';
import studentRecordingRoutes from '../modules/student/recordings/student-recording.routes.js';
import studentPlaybackRoutes from '../modules/student/playback/student-playback.routes.js';
import adminVdocipherRoutes from '../modules/admin/vdocipher/admin-vdocipher.routes.js';
import publicContactRoutes from '../modules/public/contact/public-contact.routes.js';
import adminContactRoutes from '../modules/admin/contact/admin-contact.routes.js';
import adminEventRoutes from '../modules/admin/events/admin-event.routes.js';
import publicEventRoutes from '../modules/public/events/public-event.routes.js';
import adminFlashcardRoutes from '../modules/admin/flashcards/admin-flashcard.routes.js';
import adminQnaRoutes from '../modules/admin/qna/admin-qna.routes.js';
import studentFlashcardRoutes from '../modules/student/flashcards/student-flashcard.routes.js';
import studentStudyPlanRoutes from '../modules/student/study-plans/student-study-plan.routes.js';
import studentGamificationRoutes from '../modules/student/gamification/gamification.routes.js';
import publicInstructorApplicationRoutes from '../modules/public/instructor-applications/public-instructor-application.routes.js';
import adminInstructorApplicationRoutes from '../modules/admin/instructor-applications/admin-instructor-application.routes.js';
import adminGamificationRoutes from '../modules/admin/gamification/admin-gamification.routes.js';
import publicSitemapRoutes from '../modules/public/sitemap/public-sitemap.routes.js';
import publicPrivateSessionRequestRoutes from '../modules/public/private-session-requests/public-private-session-request.routes.js';
import adminPrivateSessionRequestRoutes from '../modules/admin/private-session-requests/admin-private-session-request.routes.js';
import adminTrialRoutes from '../modules/admin/trial/admin-trial.routes.js';
import { publicTrialRouter, trialRouter } from '../modules/trial/trial.routes.js';
import mediaRoutes from '../modules/media/media.routes.js';
import { maintenanceGuard } from '../middlewares/maintenance.middleware.js';

const apiRouter = Router();

apiRouter.use(maintenanceGuard);

// =====================================
// AUTH & PROFILE
// =====================================
apiRouter.use('/auth', authRoutes);
apiRouter.use('/profile', profileRoutes);
apiRouter.use('/media', mediaRoutes);

// =====================================
// STUDENT ROUTES
// =====================================
apiRouter.use('/student/courses', studentCourseRoutes);
apiRouter.use('/student/exams', studentExamRoutes);
apiRouter.use('/student/financials', studentFinancialRoutes);
apiRouter.use('/student/coupons', studentCouponRoutes);
// Slot-based booking retired — private 1-1 is contact-form leads only.
apiRouter.use('/student/bookings', disabledFeature('privateBooking'));
apiRouter.use('/student/progress', studentProgressRoutes);
apiRouter.use('/student/study-plans', studentStudyPlanRoutes);
apiRouter.use('/student/flashcards', studentFlashcardRoutes);
apiRouter.use('/student/gamification', studentGamificationRoutes);
apiRouter.use('/student/wishlist', studentWishlistRoutes);
apiRouter.use('/student/recordings', studentRecordingRoutes);
apiRouter.use('/student', studentPlaybackRoutes);
apiRouter.use('/student', studentResourceRoutes);
apiRouter.use('/student', studentReviewRoutes);
apiRouter.use('/student', studentQnaRoutes);
apiRouter.use('/student', studentCertificateRoutes);

// =====================================
// INSTRUCTOR ROUTES
// =====================================
apiRouter.use('/instructor-panel', platformFeatures.instructorSelfService ? instructorPanelRoutes : disabledFeature('instructorSelfService'));
apiRouter.use('/instructor/dashboard', platformFeatures.instructorSelfService ? instructorDashboardRoutes : disabledFeature('instructorSelfService'));
apiRouter.use('/instructor/classes', platformFeatures.instructorSelfService ? instructorClassRoutes : disabledFeature('instructorSelfService'));
apiRouter.use('/instructor/courses', platformFeatures.instructorSelfService ? instructorCourseRoutes : disabledFeature('instructorSelfService'));
apiRouter.use('/instructor/students', platformFeatures.instructorSelfService ? instructorStudentRoutes : disabledFeature('instructorSelfService'));
apiRouter.use('/instructor/exams', platformFeatures.instructorSelfService ? instructorExamRoutes : disabledFeature('instructorSelfService'));
apiRouter.use('/instructor/availability', platformFeatures.instructorSelfService && platformFeatures.privateBooking ? instructorAvailabilityRoutes : disabledFeature('privateBooking'));
apiRouter.use('/instructor/wallet', platformFeatures.instructorSelfService && platformFeatures.wallet ? instructorWalletRoutes : disabledFeature('wallet'));
apiRouter.use('/instructor/performance', platformFeatures.instructorSelfService ? instructorPerformanceRoutes : disabledFeature('instructorSelfService'));
apiRouter.use('/instructor', platformFeatures.instructorSelfService ? instructorQnaRoutes : disabledFeature('instructorSelfService'));

// =====================================
// ADMIN ROUTES
// =====================================
apiRouter.use('/admin/users', adminUserRoutes);
apiRouter.use('/admin/students', adminStudentRoutes);
apiRouter.use('/admin/instructors', adminInstructorRoutes);
apiRouter.use('/admin/courses', adminCourseRoutes);
apiRouter.use('/admin/units', adminUnitRoutes);
apiRouter.use('/admin/sections', adminSectionRoutes);
apiRouter.use('/admin/lessons', adminLessonRoutes);
apiRouter.use('/admin/vdocipher', adminVdocipherRoutes);
apiRouter.use('/admin/exams', adminExamRoutes);
apiRouter.use('/admin/financials', adminFinancialRoutes);
apiRouter.use('/admin/coupons', adminCouponRoutes);
apiRouter.use('/admin/cms', adminCmsRoutes);
apiRouter.use('/admin/dashboard', adminDashboardRoutes);
apiRouter.use('/admin/enrollments', adminEnrollmentRoutes);
apiRouter.use('/admin/settings', adminSettingsRoutes);
apiRouter.use('/admin/gamification', adminGamificationRoutes);
apiRouter.use('/admin/trial', adminTrialRoutes);
apiRouter.use('/admin/roles', adminRoleRoutes);
apiRouter.use('/admin/audit-logs', adminAuditLogRoutes);
apiRouter.use('/admin/subscriptions', adminSubscriptionRoutes);
apiRouter.use('/admin/categories', adminCategoryRoutes);
apiRouter.use('/admin/flashcards', adminFlashcardRoutes);
apiRouter.use('/admin/qna', adminQnaRoutes);
apiRouter.use('/admin/instructor-applications', adminInstructorApplicationRoutes);
apiRouter.use(
  '/admin/private-session-requests',
  platformFeatures.privateBooking ? adminPrivateSessionRequestRoutes : disabledFeature('privateBooking')
);
apiRouter.use('/admin/certificates', adminCertificateRoutes);
apiRouter.use('/admin/events', platformFeatures.communityEvents ? adminEventRoutes : disabledFeature('communityEvents'));
apiRouter.use('/admin', adminResourceRoutes);
apiRouter.use('/admin', adminReviewRoutes);
if (platformFeatures.wallet) {
  apiRouter.use('/admin', adminPayoutRoutes);
} else {
  apiRouter.use('/admin/payouts', disabledFeature('wallet'));
  apiRouter.use('/admin/instructors/:instructorId/commission', disabledFeature('wallet'));
}
apiRouter.use('/admin', adminContactRoutes);

// =====================================
// PUBLIC ROUTES & OTHERS
// =====================================
apiRouter.use(
  '/instructors',
  platformFeatures.publicInstructorCatalog || platformFeatures.privateBooking
    ? publicInstructorRoutes
    : disabledFeature('publicInstructorCatalog')
);
apiRouter.use('/courses', publicCourseRoutes);
apiRouter.use('/courses', publicReviewRoutes);
apiRouter.use('/packages', publicPackageRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/webhooks', paymentWebhookRoutes);
apiRouter.use('/public', publicCmsRoutes);
apiRouter.use('/public', publicSiteSettingsRoutes);
apiRouter.use('/public', publicContactRoutes);
apiRouter.use('/public', publicSitemapRoutes);
apiRouter.use('/public/trial', publicTrialRouter);
apiRouter.use('/trial', trialRouter);
apiRouter.use('/public/instructor-applications', publicInstructorApplicationRoutes);
apiRouter.use(
  '/public/private-session-requests',
  platformFeatures.privateBooking ? publicPrivateSessionRequestRoutes : disabledFeature('privateBooking')
);
apiRouter.use('/public/events', platformFeatures.communityEvents ? publicEventRoutes : disabledFeature('communityEvents'));
apiRouter.use('/categories', publicCategoryRoutes);
apiRouter.use('/certificates', publicCertificateRoutes);
apiRouter.use('/', supportRoutes);

export default apiRouter;

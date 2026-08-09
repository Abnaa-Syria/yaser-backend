import { Router } from 'express';
import { protect } from '../../../middlewares/auth.middleware.js';
import { requirePermission } from '../../../middlewares/permission.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as reviewController from './admin-review.controller.js';
import * as reviewValidation from './admin-review.validation.js';

const router = Router();

router.use(protect);
router.use(requirePermission('course:manage'));

router.get(
  '/reviews/export-pdf',
  validate(reviewValidation.exportReviewsPdfSchema),
  reviewController.exportReviewsPdf
);

router.get(
  '/reviews',
  validate(reviewValidation.listReviewsSchema),
  reviewController.getReviews
);

router.get(
  '/reviews/:reviewId',
  validate(reviewValidation.reviewIdParamSchema),
  reviewController.getReview
);

router.patch(

  '/reviews/:reviewId/visibility',
  validate(reviewValidation.toggleVisibilitySchema),
  reviewController.toggleVisibility
);

router.delete(
  '/reviews/:reviewId',
  validate(reviewValidation.reviewIdParamSchema),
  reviewController.deleteReview
);

export default router;

import { Router } from 'express';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as reviewController from './public-review.controller.js';
import * as reviewValidation from './public-review.validation.js';

const router = Router();

router.get(
  '/:courseId/reviews',
  validate(reviewValidation.getReviewsSchema),
  reviewController.getCourseReviews
);

export default router;

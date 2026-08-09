import { Router } from 'express';
import { protect } from '../../../middlewares/auth.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as reviewController from './student-review.controller.js';
import * as reviewValidation from './student-review.validation.js';
const router = Router();
router.use(protect);
router.post('/courses/:courseId/reviews', validate(reviewValidation.createReviewSchema), reviewController.createReview);
router.patch('/reviews/:reviewId', validate(reviewValidation.updateReviewSchema), reviewController.updateReview);
export default router;
//# sourceMappingURL=student-review.routes.js.map
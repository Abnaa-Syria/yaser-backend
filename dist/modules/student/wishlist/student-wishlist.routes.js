import { Router } from 'express';
import { protect } from '../../../middlewares/auth.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as wishlistController from './student-wishlist.controller.js';
import * as wishlistValidation from './student-wishlist.validation.js';
const router = Router();
router.use(protect);
router.get('/', wishlistController.getWishlist);
router.post('/:courseId', validate(wishlistValidation.courseIdParamSchema), wishlistController.addToWishlist);
router.delete('/:courseId', validate(wishlistValidation.courseIdParamSchema), wishlistController.removeFromWishlist);
export default router;
//# sourceMappingURL=student-wishlist.routes.js.map
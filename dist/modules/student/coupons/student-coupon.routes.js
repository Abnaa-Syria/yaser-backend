import { Router } from 'express';
import * as couponController from './student-coupon.controller.js';
import { protect } from '../../../middlewares/auth.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as couponValidation from './student-coupon.validation.js';
const router = Router();
router.use(protect);
router.post('/validate', validate(couponValidation.validateCouponSchema), couponController.validateCoupon);
export default router;
//# sourceMappingURL=student-coupon.routes.js.map
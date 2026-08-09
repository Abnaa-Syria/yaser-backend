import { Router } from 'express';
import * as couponController from './admin-coupon.controller.js';
import { protect } from '../../../middlewares/auth.middleware.js';
import { requirePermission } from '../../../middlewares/permission.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as couponValidation from './admin-coupon.validation.js';

const router = Router();

router.use(protect);
router.use(requirePermission('finance:manage'));

router.post('/', validate(couponValidation.createCouponSchema), couponController.createCoupon);
router.get('/', couponController.getCoupons);
router.get('/:id', validate(couponValidation.couponIdParamSchema), couponController.getCoupon);

router.patch('/:id', validate(couponValidation.updateCouponSchema), couponController.updateCoupon);
router.delete('/:id', validate(couponValidation.couponIdParamSchema), couponController.deleteCoupon);
router.get('/:id/usages', validate(couponValidation.couponIdParamSchema), couponController.getUsage);

export default router;

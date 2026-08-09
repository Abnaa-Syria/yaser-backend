import { Router } from 'express';
import * as financialController from './student-financial.controller.js';
import { protect } from '../../../middlewares/auth.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as financialValidation from './student-financial.validation.js';
import { AppError } from '../../../utils/AppError.js';
import { getRoleName } from '../../../utils/role-query.js';
import { requireFeature } from '../../../middlewares/featureFlag.middleware.js';
import { paymentProofUpload } from '../../../middlewares/paymentProofUpload.middleware.js';
const router = Router();
const restrictToStudent = (req, res, next) => {
    if (getRoleName(req.user) !== 'STUDENT') {
        return next(new AppError('Forbidden. Only students can perform this action.', 403));
    }
    next();
};
router.use(protect);
router.post('/payment-proof', restrictToStudent, paymentProofUpload.single('proof'), financialController.uploadPaymentProof);
router.post('/checkout/course/:courseId', restrictToStudent, validate(financialValidation.courseCheckoutSchema), financialController.courseCheckout);
router.post('/checkout/package/:packageId', restrictToStudent, validate(financialValidation.packageCheckoutSchema), financialController.packageCheckout);
router.post('/checkout/private/:availabilityId', restrictToStudent, requireFeature('privateBooking'), validate(financialValidation.privateCheckoutSchema), financialController.privateCheckout);
router.post('/checkout/live-session/:liveSessionId', restrictToStudent, requireFeature('liveSessions'), validate(financialValidation.liveSessionCheckoutSchema), financialController.liveSessionCheckout);
router.get('/my-payments', financialController.getMyPayments);
router.get('/my-courses', financialController.getMyPurchasedCourses);
router.get('/my-package-balances', financialController.getMyPurchasedCourses);
router.get('/my-subscriptions', financialController.getMyPurchasedCourses);
export default router;
//# sourceMappingURL=student-financial.routes.js.map
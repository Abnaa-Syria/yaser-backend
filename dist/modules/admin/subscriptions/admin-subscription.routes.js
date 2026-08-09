import { Router } from 'express';
import { protect } from '../../../middlewares/auth.middleware.js';
import { requirePermission } from '../../../middlewares/permission.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as subscriptionController from './admin-subscription.controller.js';
import * as subscriptionValidation from './admin-subscription.validation.js';
const router = Router();
router.use(protect);
router.use(requirePermission('finance:manage'));
router.get('/lookups', subscriptionController.getLookupData);
router.get('/', subscriptionController.getSubscriptions);
router.post('/', validate(subscriptionValidation.createSubscriptionSchema), subscriptionController.createSubscription);
router.patch('/:id/status', validate(subscriptionValidation.updateStatusSchema), subscriptionController.updateSubscriptionStatus);
router.get('/enrollments', subscriptionController.getEnrollments);
router.post('/enrollments', validate(subscriptionValidation.createEnrollmentSchema), subscriptionController.createEnrollment);
export default router;
//# sourceMappingURL=admin-subscription.routes.js.map
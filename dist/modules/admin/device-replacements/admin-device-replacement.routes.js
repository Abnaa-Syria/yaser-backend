import { Router } from 'express';
import { protect } from '../../../middlewares/auth.middleware.js';
import { requirePermission } from '../../../middlewares/permission.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import { reviewDeviceReplacementSchema } from '../../auth/device-replacement.service.js';
import * as controller from './admin-device-replacement.controller.js';
const router = Router();
router.use(protect);
router.use(requirePermission('user:manage'));
router.get('/', controller.listRequests);
router.post('/:id/approve', validate(reviewDeviceReplacementSchema), controller.approveRequest);
router.post('/:id/reject', validate(reviewDeviceReplacementSchema), controller.rejectRequest);
export default router;
//# sourceMappingURL=admin-device-replacement.routes.js.map
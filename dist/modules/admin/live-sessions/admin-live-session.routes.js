import { Router } from 'express';
import * as liveSessionController from './admin-live-session.controller.js';
import { protect } from '../../../middlewares/auth.middleware.js';
import { requirePermission } from '../../../middlewares/permission.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as liveSessionValidation from './admin-live-session.validation.js';
const router = Router();
router.use(protect);
router.use(requirePermission('course:manage'));
router.get('/', liveSessionController.listLiveSessions);
router.post('/', validate(liveSessionValidation.createLiveSessionSchema), liveSessionController.createLiveSession);
router.patch('/:id', validate(liveSessionValidation.updateLiveSessionSchema), liveSessionController.updateLiveSession);
router.delete('/:id', validate(liveSessionValidation.liveSessionIdParamSchema), liveSessionController.deleteLiveSession);
export default router;
//# sourceMappingURL=admin-live-session.routes.js.map
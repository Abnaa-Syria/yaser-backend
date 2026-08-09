import { Router } from 'express';
import * as liveSessionController from './instructor-live-session.controller.js';
import { protect } from '../../../middlewares/auth.middleware.js';
import { requireRole } from '../../../middlewares/role.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as liveSessionValidation from './instructor-live-session.validation.js';
const router = Router();
router.use(protect);
router.use(requireRole('INSTRUCTOR'));
router.get('/', liveSessionController.listMyLiveSessions);
router.post('/', validate(liveSessionValidation.createInstructorLiveSessionSchema), liveSessionController.createMyLiveSession);
router.patch('/:id', validate(liveSessionValidation.updateInstructorLiveSessionSchema), liveSessionController.updateMyLiveSession);
router.delete('/:id', validate(liveSessionValidation.liveSessionIdParamSchema), liveSessionController.deleteMyLiveSession);
export default router;
//# sourceMappingURL=instructor-live-session.routes.js.map
import { Router } from 'express';
import * as sessionController from './instructor-session.controller.js';
import { protect } from '../../../middlewares/auth.middleware.js';
import { requireRole } from '../../../middlewares/role.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as sessionValidation from './instructor-session.validation.js';
const router = Router();
router.use(protect);
router.use(requireRole('INSTRUCTOR'));
router.get('/:courseId/sessions', validate(sessionValidation.courseIdParamSchema), sessionController.listSessions);
router.post('/:courseId/sessions', validate(sessionValidation.createSessionSchema), sessionController.createSession);
router.patch('/:courseId/sessions/:sessionId', validate(sessionValidation.updateSessionSchema), sessionController.updateSession);
router.delete('/:courseId/sessions/:sessionId', validate(sessionValidation.sessionIdParamSchema), sessionController.deleteSession);
export default router;
//# sourceMappingURL=instructor-session.routes.js.map
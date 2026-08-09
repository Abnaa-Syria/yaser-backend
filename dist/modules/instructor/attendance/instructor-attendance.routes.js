import { Router } from 'express';
import * as attendanceController from './instructor-attendance.controller.js';
import { protect } from '../../../middlewares/auth.middleware.js';
import { requireRole } from '../../../middlewares/role.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as attendanceValidation from './instructor-attendance.validation.js';
const router = Router();
router.use(protect);
router.use(requireRole('INSTRUCTOR'));
router.get('/sessions', validate(attendanceValidation.listAttendanceSessionsQuerySchema), attendanceController.listSessions);
router.get('/sessions/:sessionId', validate(attendanceValidation.sessionIdParamSchema), attendanceController.getSessionDetail);
router.patch('/sessions/:sessionId/students/:studentId', validate(attendanceValidation.markAttendanceSchema), attendanceController.markAttendance);
export default router;
//# sourceMappingURL=instructor-attendance.routes.js.map
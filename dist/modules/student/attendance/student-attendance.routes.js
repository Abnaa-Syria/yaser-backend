import { Router } from 'express';
import { protect } from '../../../middlewares/auth.middleware.js';
import { requireRole } from '../../../middlewares/role.middleware.js';
import * as attendanceController from './student-attendance.controller.js';
const router = Router();
router.use(protect);
router.use(requireRole('STUDENT'));
router.get('/', attendanceController.getMyAttendance);
export default router;
//# sourceMappingURL=student-attendance.routes.js.map
import { Router } from 'express';
import * as panelController from './instructor-panel.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import * as panelValidation from './instructor-panel.validation.js';
const router = Router();
router.use(protect);
router.use(requireRole('INSTRUCTOR'));
router.get('/dashboard', panelController.getDashboard);
router.get('/classes', validate(panelValidation.listClassesSchema), panelController.getClasses);
router.get('/performance', panelController.getPerformance);
export default router;
//# sourceMappingURL=instructor-panel.routes.js.map
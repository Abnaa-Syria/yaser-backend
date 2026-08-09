import { Router } from 'express';
import * as performanceController from './instructor-performance.controller.js';
import { protect } from '../../../middlewares/auth.middleware.js';
import { requireRole } from '../../../middlewares/role.middleware.js';

const router = Router();

router.use(protect);
router.use(requireRole('INSTRUCTOR'));

router.get('/export-pdf', performanceController.exportPerformancePdf);
router.get('/', performanceController.getPerformance);

export default router;

import { Router } from 'express';
import { protect } from '../../../middlewares/auth.middleware.js';
import { requirePermission } from '../../../middlewares/permission.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as auditController from './admin-audit-log.controller.js';
import * as auditValidation from './admin-audit-log.validation.js';

const router = Router();

router.use(protect);
router.use(requirePermission('audit:read'));

router.get('/', validate(auditValidation.listAuditLogsSchema), auditController.getAuditLogs);

export default router;

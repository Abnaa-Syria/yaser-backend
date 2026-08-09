import { Router } from 'express';
import { protect } from '../../../middlewares/auth.middleware.js';
import { requirePermission } from '../../../middlewares/permission.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as adminTrialController from './admin-trial.controller.js';
import * as adminTrialValidation from './admin-trial.validation.js';

const router = Router();

router.use(protect);
router.use(requirePermission('settings:manage'));

router.get('/', adminTrialController.getTrialAdmin);
router.patch(
  '/settings',
  validate(adminTrialValidation.updateTrialSettingsSchema),
  adminTrialController.patchTrialSettings
);
router.put(
  '/courses',
  validate(adminTrialValidation.replaceTrialCoursesSchema),
  adminTrialController.putTrialCourses
);

router.get(
  '/sessions',
  validate(adminTrialValidation.listTrialSessionsSchema),
  adminTrialController.listSessions
);
router.post(
  '/sessions/:id/revoke',
  validate(adminTrialValidation.revokeTrialSessionSchema),
  adminTrialController.revokeSession
);
router.post(
  '/sessions/:id/restore',
  validate(adminTrialValidation.trialSessionIdParamSchema),
  adminTrialController.restoreSession
);

export default router;

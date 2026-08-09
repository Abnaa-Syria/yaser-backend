import { Router } from 'express';
import { protect } from '../../../middlewares/auth.middleware.js';
import { requirePermission } from '../../../middlewares/permission.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import { brandingLogoUpload } from '../../../middlewares/brandingLogoUpload.middleware.js';
import * as adminSettingsController from './admin-settings.controller.js';
import * as adminSettingsValidation from './admin-settings.validation.js';

const router = Router();

router.use(protect);
router.use(requirePermission('settings:manage'));

router.get('/', adminSettingsController.getSettings);
router.patch('/', validate(adminSettingsValidation.updateSettingsSchema), adminSettingsController.updateSettings);
router.post('/logo', brandingLogoUpload.single('logo'), adminSettingsController.uploadLogo);

router.get('/emails', adminSettingsController.getEmailTemplates);
router.post('/emails', validate(adminSettingsValidation.createEmailTemplateSchema), adminSettingsController.createEmailTemplate);
router.patch('/emails/:id', validate(adminSettingsValidation.updateEmailTemplateSchema), adminSettingsController.updateEmailTemplate);
router.delete('/emails/:id', adminSettingsController.deleteEmailTemplate);
router.post(
  '/emails/preview',
  validate(adminSettingsValidation.previewEmailTemplateSchema),
  adminSettingsController.previewEmailTemplate
);
router.post(
  '/emails/send-test',
  validate(adminSettingsValidation.sendTestEmailTemplateSchema),
  adminSettingsController.sendTestEmailTemplate
);

export default router;

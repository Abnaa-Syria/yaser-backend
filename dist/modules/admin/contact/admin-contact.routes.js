import { Router } from 'express';
import { protect } from '../../../middlewares/auth.middleware.js';
import { requirePermission } from '../../../middlewares/permission.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import { updateContactSubmissionSchema } from '../../public/contact/public-contact.validation.js';
import * as adminContactController from './admin-contact.controller.js';
const router = Router();
router.use(protect);
router.use(requirePermission('cms:manage'));
router.get('/contact-submissions', adminContactController.listSubmissions);
router.patch('/contact-submissions/:id', validate(updateContactSubmissionSchema), adminContactController.updateSubmissionStatus);
export default router;
//# sourceMappingURL=admin-contact.routes.js.map
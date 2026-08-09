import { Router } from 'express';
import { validate } from '../../../middlewares/validate.middleware.js';
import { contactSubmissionSchema } from './public-contact.validation.js';
import * as publicContactController from './public-contact.controller.js';
const router = Router();
router.post('/contact', validate(contactSubmissionSchema), publicContactController.submitContact);
export default router;
//# sourceMappingURL=public-contact.routes.js.map
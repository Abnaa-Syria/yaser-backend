import { Router } from 'express';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as controller from './public-instructor-application.controller.js';
import * as validation from './public-instructor-application.validation.js';
const router = Router();
router.post('/', validate(validation.submitInstructorApplicationSchema), controller.submitInstructorApplication);
export default router;
//# sourceMappingURL=public-instructor-application.routes.js.map
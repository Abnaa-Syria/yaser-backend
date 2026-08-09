import { Router } from 'express';
import * as classController from './student-class.controller.js';
import { protect } from '../../../middlewares/auth.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as classValidation from './student-class.validation.js';
const router = Router();
router.use(protect);
router.get('/', classController.getMyClasses);
router.get('/:id', validate(classValidation.classIdParamSchema), classController.getClass);
router.post('/:id/enroll', validate(classValidation.classIdParamSchema), classController.enroll);
router.delete('/:id/unenroll', validate(classValidation.classIdParamSchema), classController.unenroll);
export default router;
//# sourceMappingURL=student-class.routes.js.map
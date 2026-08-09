import { Router } from 'express';
import * as packageController from './public-package.controller.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as packageValidation from './public-package.validation.js';
const router = Router();
router.get('/', packageController.getPackages);
router.get('/:id', validate(packageValidation.packageIdParamSchema), packageController.getPackage);
export default router;
//# sourceMappingURL=public-package.routes.js.map
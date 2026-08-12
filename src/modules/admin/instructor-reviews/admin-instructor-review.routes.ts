import { Router } from 'express';
import { protect } from '../../../middlewares/auth.middleware.js';
import { requirePermission } from '../../../middlewares/permission.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as controller from './admin-instructor-review.controller.js';
import * as validation from './admin-instructor-review.validation.js';

const router = Router();

router.use(protect);
router.use(requirePermission('course:manage'));

router.get('/', validate(validation.listInstructorReviewsSchema), controller.list);
router.post('/', validate(validation.createInstructorReviewSchema), controller.create);
router.patch('/:id', validate(validation.updateInstructorReviewSchema), controller.update);
router.delete('/:id', validate(validation.instructorReviewIdParamSchema), controller.remove);

export default router;

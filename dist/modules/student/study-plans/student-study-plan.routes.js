import { Router } from 'express';
import { protect } from '../../../middlewares/auth.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as controller from './student-study-plan.controller.js';
import * as validation from './student-study-plan.validation.js';
const router = Router();
router.use(protect);
router.get('/', controller.listMyStudyPlans);
router.post('/', validate(validation.createStudyPlanSchema), controller.createStudyPlan);
router.patch('/:id', validate(validation.updateStudyPlanSchema), controller.updateStudyPlan);
router.delete('/:id', validate(validation.studyPlanIdParamSchema), controller.deleteStudyPlan);
router.post('/:id/items', validate(validation.createStudyPlanItemSchema), controller.createStudyPlanItem);
router.patch('/:id/items/:itemId', validate(validation.updateStudyPlanItemSchema), controller.updateStudyPlanItem);
router.delete('/:id/items/:itemId', validate(validation.studyPlanItemIdParamSchema), controller.deleteStudyPlanItem);
export default router;
//# sourceMappingURL=student-study-plan.routes.js.map
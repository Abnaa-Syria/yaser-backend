import { Router } from 'express';
import { protect } from '../../../middlewares/auth.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as resourceController from './student-resource.controller.js';
import * as resourceValidation from './student-resource.validation.js';

const router = Router();

router.use(protect);

router.get(
  '/lessons/:lessonId/resources',
  validate(resourceValidation.lessonIdParamSchema),
  resourceController.getLessonResources
);

export default router;

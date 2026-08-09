import { Router } from 'express';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as categoryController from './public-category.controller.js';
import * as categoryValidation from './public-category.validation.js';

const router = Router();

router.get('/', categoryController.getCategories);
router.get('/:slug', validate(categoryValidation.slugParamSchema), categoryController.getCategoryBySlug);

export default router;

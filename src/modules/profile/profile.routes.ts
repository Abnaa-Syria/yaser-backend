import { Router } from 'express';
import * as profileController from './profile.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';

import * as profileValidation from './profile.validation.js';
import { changePasswordSchema } from '../auth/auth.validation.js';

const router = Router();

router.use(protect);

router.get('/me', profileController.getMe);
router.patch('/me', validate(profileValidation.updateProfileSchema), profileController.updateMe);
router.patch('/me/avatar', validate(profileValidation.updateAvatarSchema), profileController.updateAvatar);
router.patch('/change-password', validate(changePasswordSchema), profileController.changePassword);

export default router;

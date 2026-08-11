import { Router } from 'express';
import { protect } from '../../../middlewares/auth.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as playbackController from './student-playback.controller.js';
import * as playbackValidation from './student-playback.validation.js';
const router = Router();
router.use(protect);
router.get('/lessons/:lessonId/playback', validate(playbackValidation.lessonPlaybackParamSchema), playbackController.getLessonPlayback);
export default router;
//# sourceMappingURL=student-playback.routes.js.map
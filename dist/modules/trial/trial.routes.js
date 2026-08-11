import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { validate } from '../../middlewares/validate.middleware.js';
import { protectTrial } from '../../middlewares/trial.middleware.js';
import * as trialController from './trial.controller.js';
import * as trialValidation from './trial.validation.js';
const isDev = process.env.NODE_ENV !== 'production';
export const trialStartLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isDev ? 50 : 10,
    message: {
        success: false,
        message: 'Too many trial start attempts. Please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => isDev && req.ip === '::1',
});
/** Public: config + start */
export const publicTrialRouter = Router();
publicTrialRouter.get('/', trialController.getPublicConfig);
publicTrialRouter.post('/start', trialStartLimiter, validate(trialValidation.startTrialSchema), trialController.start);
/** Authenticated trial session routes */
export const trialRouter = Router();
trialRouter.use(protectTrial);
trialRouter.get('/me', trialController.me);
trialRouter.get('/courses', trialController.listCourses);
trialRouter.get('/recordings', trialController.recordings);
trialRouter.get('/flashcards', trialController.flashcards);
trialRouter.get('/exams', trialController.listExams);
trialRouter.get('/exams/:id', validate(trialValidation.examIdParamSchema), trialController.getExam);
trialRouter.post('/exams/:id/start', validate(trialValidation.examIdParamSchema), trialController.startExam);
trialRouter.post('/exams/:id/submit', validate(trialValidation.submitTrialExamSchema), trialController.submitExam);
trialRouter.get('/exams/:id/results/:submissionId', validate(trialValidation.examResultParamSchema), trialController.examResults);
trialRouter.get('/courses/:id/units', validate(trialValidation.courseIdParamSchema), trialController.courseUnits);
trialRouter.get('/lessons/:lessonId/playback', validate(trialValidation.lessonIdParamSchema), trialController.lessonPlayback);
//# sourceMappingURL=trial.routes.js.map
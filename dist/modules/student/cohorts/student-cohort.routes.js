import { Router } from 'express';
import * as cohortController from './student-cohort.controller.js';
import { protect } from '../../../middlewares/auth.middleware.js';
import { AppError } from '../../../utils/AppError.js';
import { getRoleName } from '../../../utils/role-query.js';
const router = Router();
// Middleware to restrict access strictly to STUDENT role
const restrictToStudent = (req, res, next) => {
    if (getRoleName(req.user) !== 'STUDENT') {
        return next(new AppError('Forbidden. Only students can perform this action.', 403));
    }
    next();
};
router.use(protect);
router.use(restrictToStudent);
router.post('/:id/enroll', cohortController.enrollCohortHandler);
export default router;
//# sourceMappingURL=student-cohort.routes.js.map
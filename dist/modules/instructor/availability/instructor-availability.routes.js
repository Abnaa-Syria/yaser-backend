import { Router } from 'express';
import * as availabilityController from './instructor-availability.controller.js';
import { protect } from '../../../middlewares/auth.middleware.js';
import { AppError } from '../../../utils/AppError.js';
import { getRoleName } from '../../../utils/role-query.js';
const router = Router();
// Middleware to restrict access strictly to INSTRUCTOR role
const restrictToInstructor = (req, res, next) => {
    if (getRoleName(req.user) !== 'INSTRUCTOR') {
        return next(new AppError('Forbidden. Only instructors can perform this action.', 403));
    }
    next();
};
router.use(protect);
router.use(restrictToInstructor);
router.get('/', availabilityController.listAvailabilityHandler);
router.post('/', availabilityController.addAvailabilityHandler);
router.patch('/:id', availabilityController.updateAvailabilityPriceHandler);
router.delete('/:id', availabilityController.deleteAvailabilityHandler);
export default router;
//# sourceMappingURL=instructor-availability.routes.js.map
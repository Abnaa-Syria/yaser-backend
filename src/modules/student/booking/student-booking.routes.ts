import { Router, Request, Response, NextFunction } from 'express';
import * as bookingController from './student-booking.controller.js';
import { protect } from '../../../middlewares/auth.middleware.js';
import { AppError } from '../../../utils/AppError.js';
import { getRoleName } from '../../../utils/role-query.js';

const router = Router();

// Middleware to restrict access strictly to STUDENT role
const restrictToStudent = (req: Request, res: Response, next: NextFunction) => {
  if (getRoleName(req.user!) !== 'STUDENT') {
    return next(new AppError('Forbidden. Only students can perform this action.', 403));
  }
  next();
};

router.use(protect);
router.use(restrictToStudent);

router.get('/available-slots', bookingController.listAvailableSlotsHandler);
router.post('/:availabilityId/book', bookingController.bookSessionHandler);

export default router;

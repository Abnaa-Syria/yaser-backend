import { NextFunction, Request, Response } from 'express';
import { platformFeatures, PlatformFeature } from '../config/features.config.js';
import { AppError } from '../utils/AppError.js';

const FEATURE_LABELS: Record<PlatformFeature, string> = {
  wallet: 'Wallet',
  communityEvents: 'Community events',
  publicInstructorCatalog: 'Public instructor catalog',
  instructorSelfService: 'Instructor self-service',
  privateBooking: 'Private booking',
  multiInstructor: 'Multi-instructor',
};

export const disabledFeature = (feature: PlatformFeature) => {
  return (_req: Request, _res: Response, next: NextFunction) => {
    next(new AppError(`${FEATURE_LABELS[feature]} is disabled for the current Yaser USMLE product scope.`, 404));
  };
};

export const requireFeature = (feature: PlatformFeature) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (platformFeatures[feature]) return next();
    return disabledFeature(feature)(req, res, next);
  };
};

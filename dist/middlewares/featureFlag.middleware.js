import { platformFeatures } from '../config/features.config.js';
import { AppError } from '../utils/AppError.js';
const FEATURE_LABELS = {
    wallet: 'Wallet',
    liveSessions: 'Live sessions',
    communityEvents: 'Community events',
    publicInstructorCatalog: 'Public instructor catalog',
    instructorSelfService: 'Instructor self-service',
    privateBooking: 'Private booking',
    multiInstructor: 'Multi-instructor',
};
export const disabledFeature = (feature) => {
    return (_req, _res, next) => {
        next(new AppError(`${FEATURE_LABELS[feature]} is disabled for the current Yaser USMLE product scope.`, 404));
    };
};
export const requireFeature = (feature) => {
    return (req, res, next) => {
        if (platformFeatures[feature])
            return next();
        return disabledFeature(feature)(req, res, next);
    };
};
//# sourceMappingURL=featureFlag.middleware.js.map
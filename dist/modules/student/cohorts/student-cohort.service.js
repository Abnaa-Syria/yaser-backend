import { AppError } from '../../../utils/AppError.js';
const DEPRECATED = 'Cohort enrollment is no longer supported. Purchase the course for lifetime access.';
export const enrollInCohort = async (..._args) => {
    throw new AppError(DEPRECATED, 410);
};
//# sourceMappingURL=student-cohort.service.js.map
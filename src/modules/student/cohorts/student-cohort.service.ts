import { AppError } from '../../../utils/AppError.js';

const DEPRECATED = 'Cohort enrollment is no longer supported. Purchase the course for lifetime access.';

export const enrollInCohort = async (..._args: unknown[]) => {
  throw new AppError(DEPRECATED, 410);
};

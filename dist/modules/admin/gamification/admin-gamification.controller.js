import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
import * as gamificationService from '../../student/gamification/gamification.service.js';
export const listChallenges = catchAsync(async (_req, res) => {
    const data = await gamificationService.adminListChallenges();
    successResponse({ res, data });
});
export const createChallenge = catchAsync(async (req, res) => {
    const data = await gamificationService.adminCreateChallenge(req.body);
    successResponse({ res, data, message: 'Challenge created', statusCode: 201 });
});
export const getStats = catchAsync(async (_req, res) => {
    const data = await gamificationService.adminStats();
    successResponse({ res, data });
});
export const seedBadges = catchAsync(async (_req, res) => {
    const data = await gamificationService.seedBadgeDefinitions();
    successResponse({ res, data, message: 'Badges seeded' });
});
//# sourceMappingURL=admin-gamification.controller.js.map
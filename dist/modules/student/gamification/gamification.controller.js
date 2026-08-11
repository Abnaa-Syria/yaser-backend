import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
import * as gamificationService from './gamification.service.js';
export const getMe = catchAsync(async (req, res) => {
    const data = await gamificationService.getMyGamification(req.user.id);
    successResponse({ res, data });
});
export const getLeaderboard = catchAsync(async (req, res) => {
    const scope = req.query.scope === 'course' ? 'course' : 'global';
    const period = req.query.period === 'week' ? 'week' : 'all';
    const courseId = typeof req.query.courseId === 'string' ? req.query.courseId : undefined;
    const data = await gamificationService.getLeaderboard({
        userId: req.user.id,
        scope,
        courseId,
        period,
        limit: Number(req.query.limit) || 50,
    });
    successResponse({ res, data });
});
export const getBadges = catchAsync(async (req, res) => {
    const data = await gamificationService.listBadgesCatalog(req.user.id);
    successResponse({ res, data });
});
export const getCurrentChallenge = catchAsync(async (req, res) => {
    const data = await gamificationService.getCurrentChallenge(req.user.id);
    successResponse({ res, data });
});
export const patchPrivacy = catchAsync(async (req, res) => {
    const data = await gamificationService.updateDisplayOptOut(req.user.id, !!req.body?.displayNameOptOut);
    successResponse({ res, data, message: 'Privacy updated' });
});
export const postFlashcardSession = catchAsync(async (req, res) => {
    const sessionKey = typeof req.body?.sessionKey === 'string' && req.body.sessionKey
        ? req.body.sessionKey.slice(0, 64)
        : String(Date.now());
    const data = await gamificationService.awardFlashcardSessionXp(req.user.id, sessionKey);
    successResponse({ res, data });
});
//# sourceMappingURL=gamification.controller.js.map
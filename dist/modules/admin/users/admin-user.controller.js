import * as adminUserService from './admin-user.service.js';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
export const getAllUsers = catchAsync(async (req, res) => {
    const result = await adminUserService.getAllUsers(req.query);
    successResponse({
        res,
        data: result.users,
        message: 'Users retrieved successfully',
        meta: {
            ...result.pagination,
            ...(result.studentListStats ? { studentStats: result.studentListStats } : {}),
        },
    });
});
export const getUser = catchAsync(async (req, res) => {
    const user = await adminUserService.getUserById(req.params.id);
    successResponse({ res, data: user, message: 'User details retrieved' });
});
export const updateUser = catchAsync(async (req, res) => {
    const user = await adminUserService.updateUser(req.params.id, req.body);
    successResponse({ res, data: user, message: 'User updated successfully' });
});
export const toggleActive = catchAsync(async (req, res) => {
    const result = await adminUserService.toggleUserActive(req.params.id, req.user.id);
    successResponse({
        res,
        data: result,
        message: `User account ${result.isActive ? 'activated' : 'deactivated'}`,
    });
});
export const setUserPassword = catchAsync(async (req, res) => {
    const result = await adminUserService.setUserPasswordByAdmin(req.params.id, req.body.newPassword, req.user.id);
    successResponse({ res, data: result, message: 'Password updated successfully' });
});
export const deleteUser = catchAsync(async (req, res) => {
    const result = await adminUserService.deleteUser(req.params.id, req.user.id);
    successResponse({ res, data: result, message: 'User deleted successfully' });
});
export const grantPermission = catchAsync(async (req, res) => {
    const expiresAt = req.body.expiresAt ? new Date(req.body.expiresAt) : null;
    const result = await adminUserService.grantUserPermission(req.params.id, req.body.permissionId, expiresAt, req.user.id);
    successResponse({ res, data: result, message: 'Permission granted', statusCode: 201 });
});
export const revokePermission = catchAsync(async (req, res) => {
    const result = await adminUserService.revokeUserPermission(req.params.id, req.params.permissionId, req.user.id);
    successResponse({ res, data: result, message: 'Permission revoked' });
});
export const getUserSessions = catchAsync(async (req, res) => {
    const result = await adminUserService.getUserSessions(req.params.id);
    successResponse({ res, data: result });
});
export const getUserDevices = catchAsync(async (req, res) => {
    const result = await adminUserService.getUserDevices(req.params.id);
    successResponse({ res, data: result });
});
export const forceLogout = catchAsync(async (req, res) => {
    const result = await adminUserService.forceLogoutUser(req.params.id, req.user.id);
    successResponse({ res, data: result, message: 'User sessions terminated' });
});
//# sourceMappingURL=admin-user.controller.js.map
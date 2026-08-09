import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
import * as roleService from './admin-role.service.js';
export const getRoles = catchAsync(async (_req, res) => {
    const data = await roleService.getAllRoles();
    successResponse({ res, data });
});
export const createRole = catchAsync(async (req, res) => {
    const data = await roleService.createRole(req.body);
    successResponse({
        res,
        data,
        message: 'Role created successfully',
        statusCode: 201,
    });
});
export const updateRole = catchAsync(async (req, res) => {
    const data = await roleService.updateRole(req.params.id, req.body);
    successResponse({ res, data, message: 'Role updated successfully' });
});
export const deleteRole = catchAsync(async (req, res) => {
    const data = await roleService.deleteRole(req.params.id);
    successResponse({ res, data, message: 'Role deleted successfully' });
});
export const getPermissions = catchAsync(async (_req, res) => {
    const data = await roleService.getAllPermissions();
    successResponse({ res, data });
});
export const setRolePermissions = catchAsync(async (req, res) => {
    const data = await roleService.setRolePermissions(req.params.id, req.body.permissions);
    successResponse({ res, data, message: 'Role permissions updated' });
});
//# sourceMappingURL=admin-role.controller.js.map
import { Request, Response } from 'express';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
import * as roleService from './admin-role.service.js';

export const getRoles = catchAsync(async (_req: Request, res: Response) => {
  const data = await roleService.getAllRoles();
  successResponse({ res, data });
});

export const createRole = catchAsync(async (req: Request, res: Response) => {
  const data = await roleService.createRole(req.body);
  successResponse({
    res,
    data,
    message: 'Role created successfully',
    statusCode: 201,
  });
});

export const updateRole = catchAsync(async (req: Request, res: Response) => {
  const data = await roleService.updateRole(req.params.id as string, req.body);
  successResponse({ res, data, message: 'Role updated successfully' });
});

export const deleteRole = catchAsync(async (req: Request, res: Response) => {
  const data = await roleService.deleteRole(req.params.id as string);
  successResponse({ res, data, message: 'Role deleted successfully' });
});

export const getPermissions = catchAsync(async (_req: Request, res: Response) => {
  const data = await roleService.getAllPermissions();
  successResponse({ res, data });
});

export const setRolePermissions = catchAsync(async (req: Request, res: Response) => {
  const data = await roleService.setRolePermissions(req.params.id as string, req.body.permissions);
  successResponse({ res, data, message: 'Role permissions updated' });
});


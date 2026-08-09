import { Request, Response } from 'express';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
import * as wishlistService from './student-wishlist.service.js';

export const getWishlist = catchAsync(async (req: Request, res: Response) => {
  const data = await wishlistService.getMyWishlist(req.user.id);
  return successResponse({ res, data });
});

export const addToWishlist = catchAsync(async (req: Request, res: Response) => {
  const data = await wishlistService.addToWishlist(req.user.id, String(req.params.courseId));
  return successResponse({ 
    res, 
    data, 
    statusCode: 201, 
    message: 'Course added to wishlist' 
  });
});

export const removeFromWishlist = catchAsync(async (req: Request, res: Response) => {
  await wishlistService.removeFromWishlist(req.user.id, String(req.params.courseId));
  return successResponse({ 
    res, 
    message: 'Course removed from wishlist' 
  });
});

import { Request, Response } from 'express';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
import * as publicCmsService from './public-cms.service.js';

export const getLandingPage = catchAsync(async (req: Request, res: Response) => {
  const data = await publicCmsService.getLandingPageData();
  successResponse({ res, data, message: 'Landing page data retrieved successfully' });
});

export const getPublicPosts = catchAsync(async (req: Request, res: Response) => {
  const result = await publicCmsService.getPublicPosts(req.query as Record<string, unknown>);
  successResponse({
    res,
    data: result.posts,
    message: 'Posts retrieved successfully',
    meta: result.pagination,
  });
});

export const getPublicPostBySlug = catchAsync(async (req: Request, res: Response) => {
  const data = await publicCmsService.getPublicPostBySlug(String(req.params.slug));
  successResponse({ res, data, message: 'Post retrieved successfully' });
});

export const getPublicBanners = catchAsync(async (req: Request, res: Response) => {
  const data = await publicCmsService.getPublicBanners();
  successResponse({ res, data, message: 'Banners retrieved successfully' });
});

export const getPublicCmsPage = catchAsync(async (req: Request, res: Response) => {
  const data = await publicCmsService.getPublicCmsPageBySlug(String(req.params.slug));
  successResponse({ res, data, message: 'Page retrieved successfully' });
});

export const getPublicCmsPages = catchAsync(async (req: Request, res: Response) => {
  const data = await publicCmsService.getPublicCmsPagesIndex();
  successResponse({ res, data, message: 'Pages retrieved successfully' });
});

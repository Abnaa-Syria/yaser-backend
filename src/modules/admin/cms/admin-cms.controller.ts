import { Request, Response } from 'express';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
import { AppError } from '../../../utils/AppError.js';
import * as cmsService from './admin-cms.service.js';

export const toggleReview = catchAsync(async (req: Request, res: Response) => {
  const data = await cmsService.toggleReviewVisibility(req.params.id as string);
  successResponse({ res, data, message: 'Review visibility toggled successfully' });
});

export const togglePackage = catchAsync(async (req: Request, res: Response) => {
  const data = await cmsService.togglePackageVisibility(req.params.id as string);
  successResponse({ res, data, message: 'Package visibility toggled successfully' });
});

export const updateFaq = catchAsync(async (req: Request, res: Response) => {
  const data = await cmsService.upsertSection('FAQ', req.body.faqs);
  successResponse({ res, data, message: 'FAQ updated successfully' });
});

export const updateAboutUs = catchAsync(async (req: Request, res: Response) => {
  const data = await cmsService.upsertSection('ABOUT_US', req.body);
  successResponse({ res, data, message: 'About Us updated successfully' });
});

export const updateHero = catchAsync(async (req: Request, res: Response) => {
  const data = await cmsService.updateHeroSection(req.body);
  successResponse({ res, data, message: 'Homepage hero updated successfully' });
});

export const getSections = catchAsync(async (req: Request, res: Response) => {
  const data = await cmsService.getAllSections();
  successResponse({ res, data });
});

export const createSection = catchAsync(async (req: Request, res: Response) => {
  const data = await cmsService.createSection(req.body);
  successResponse({ res, data, message: 'CMS Section created successfully', statusCode: 201 });
});

export const updateSection = catchAsync(async (req: Request, res: Response) => {
  const data = await cmsService.updateSectionById(req.params.id as string, req.body);
  successResponse({ res, data, message: 'CMS Section updated successfully' });
});

export const deleteSection = catchAsync(async (req: Request, res: Response) => {
  await cmsService.deleteSection(req.params.id as string);
  successResponse({ res, message: 'CMS Section deleted successfully' });
});

// --- FAQ ---
export const getFaqs = catchAsync(async (req: Request, res: Response) => {
  const data = await cmsService.getFaqSection();
  successResponse({ res, data });
});

export const addFaqItem = catchAsync(async (req: Request, res: Response) => {
  const data = await cmsService.addFaqItem(req.body);
  successResponse({ res, data, message: 'FAQ item added successfully' });
});

export const updateFaqItem = catchAsync(async (req: Request, res: Response) => {
  const data = await cmsService.updateFaqItem(req.params.id as string, req.body);
  successResponse({ res, data, message: 'FAQ item updated successfully' });
});

export const deleteFaqItem = catchAsync(async (req: Request, res: Response) => {
  const data = await cmsService.deleteFaqItem(req.params.id as string);
  successResponse({ res, data, message: 'FAQ item deleted successfully' });
});

// --- Reviews ---
export const getAllReviews = catchAsync(async (req: Request, res: Response) => {
  const data = await cmsService.getAllReviews();
  successResponse({ res, data });
});

export const toggleFeatureReview = catchAsync(async (req: Request, res: Response) => {
  const data = await cmsService.toggleFeatureReview(req.params.id as string, req.body.isFeatured);
  successResponse({ res, data, message: 'Review feature status updated' });
});

// --- Packages ---
export const getAllPackages = catchAsync(async (req: Request, res: Response) => {
  const data = await cmsService.getAllPackages();
  successResponse({ res, data });
});

export const updatePackageStatus = catchAsync(async (req: Request, res: Response) => {
  const data = await cmsService.updatePackageStatus(req.params.id as string, req.body);
  successResponse({ res, data, message: 'Package status updated successfully' });
});

export const createPackage = catchAsync(async (req: Request, res: Response) => {
  const data = await cmsService.createPackage(req.body);
  successResponse({ res, data, message: 'Package created successfully', statusCode: 201 });
});

export const updatePackage = catchAsync(async (req: Request, res: Response) => {
  const data = await cmsService.updatePackage(req.params.id as string, req.body);
  successResponse({ res, data, message: 'Package updated successfully' });
});

export const deletePackage = catchAsync(async (req: Request, res: Response) => {
  await cmsService.deletePackage(req.params.id as string);
  successResponse({ res, message: 'Package deleted successfully' });
});

// --- Posts ---
export const getPosts = catchAsync(async (req: Request, res: Response) => {
  const data = await cmsService.getAllPosts(req.query);
  successResponse({ res, data, results: (data as any).posts.length, message: 'Posts fetched successfully' });
});

export const createPost = catchAsync(async (req: Request, res: Response) => {
  const data = await cmsService.createPost(req.user.id, req.body);
  successResponse({ res, data, message: 'Post created successfully', statusCode: 201 });
});

export const updatePost = catchAsync(async (req: Request, res: Response) => {
  const data = await cmsService.updatePost(req.params.id as string, req.body);
  successResponse({ res, data, message: 'Post updated successfully' });
});

export const deletePost = catchAsync(async (req: Request, res: Response) => {
  await cmsService.deletePost(req.params.id as string);
  successResponse({ res, message: 'Post deleted successfully' });
});

// --- Banners ---
export const getBanners = catchAsync(async (req: Request, res: Response) => {
  const data = await cmsService.getAllBanners();
  successResponse({ res, data, results: data.length });
});

export const createBanner = catchAsync(async (req: Request, res: Response) => {
  const data = await cmsService.createBanner(req.body);
  successResponse({ res, data, message: 'Banner created successfully', statusCode: 201 });
});

export const updateBanner = catchAsync(async (req: Request, res: Response) => {
  const data = await cmsService.updateBanner(req.params.id as string, req.body);
  successResponse({ res, data, message: 'Banner updated successfully' });
});

export const deleteBanner = catchAsync(async (req: Request, res: Response) => {
  await cmsService.deleteBanner(req.params.id as string);
  successResponse({ res, message: 'Banner deleted successfully' });
});

// --- CMS Pages ---
export const getCmsPages = catchAsync(async (req: Request, res: Response) => {
  const data = await cmsService.getAllCmsPages();
  successResponse({ res, data, results: data.length });
});

export const getCmsPage = catchAsync(async (req: Request, res: Response) => {
  const data = await cmsService.getCmsPageBySlug(req.params.slug as string);
  if (!data) throw new AppError('Page not found', 404);
  successResponse({ res, data });
});

export const updateCmsPage = catchAsync(async (req: Request, res: Response) => {
  const data = await cmsService.updateCmsPageBySlug(req.params.slug as string, req.body);
  successResponse({ res, data, message: 'Page updated successfully' });
});


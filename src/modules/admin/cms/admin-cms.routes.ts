import { Router } from 'express';
import { protect } from '../../../middlewares/auth.middleware.js';
import { requirePermission } from '../../../middlewares/permission.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as adminCmsController from './admin-cms.controller.js';
import { 
  faqSchema, 
  aboutUsSchema,
  heroSchema,
  createSectionSchema, 
  updateSectionSchema,
  addFaqSchema,
  updateFaqSchema,
  featureReviewSchema,
  packageStatusSchema,
  createPackageSchema,
  updatePackageSchema,
  createPostSchema,
  updatePostSchema,
  createBannerSchema,
  updateCmsPageSchema,
} from './admin-cms.validation.js';


const router = Router();

router.use(protect);
router.use(requirePermission('cms:manage'));

router.patch('/reviews/:id/toggle', adminCmsController.toggleReview);
router.patch('/packages/:id/visibility', adminCmsController.togglePackage);
router.patch('/faq', validate(faqSchema), adminCmsController.updateFaq);
router.patch('/about-us', validate(aboutUsSchema), adminCmsController.updateAboutUs);
router.patch('/hero', validate(heroSchema), adminCmsController.updateHero);

// --- FAQ Management ---
router.get('/faq', adminCmsController.getFaqs);
router.post('/faq', validate(addFaqSchema), adminCmsController.addFaqItem);
router.patch('/faq/:id', validate(updateFaqSchema), adminCmsController.updateFaqItem);
router.delete('/faq/:id', adminCmsController.deleteFaqItem);

// --- Reviews & Social Proof ---
router.get('/reviews', adminCmsController.getAllReviews);
router.patch('/reviews/:id/feature', validate(featureReviewSchema), adminCmsController.toggleFeatureReview);

// --- Packages Control ---
router.get('/packages', adminCmsController.getAllPackages);
router.post('/packages', validate(createPackageSchema), adminCmsController.createPackage);
router.patch('/packages/:id', validate(updatePackageSchema), adminCmsController.updatePackage);
router.delete('/packages/:id', adminCmsController.deletePackage);
router.patch('/packages/:id/status', validate(packageStatusSchema), adminCmsController.updatePackageStatus);

// --- Section CRUD ---
router.get('/sections', adminCmsController.getSections);
router.post('/sections', validate(createSectionSchema), adminCmsController.createSection);
router.patch('/sections/:id', validate(updateSectionSchema), adminCmsController.updateSection);
router.delete('/sections/:id', adminCmsController.deleteSection);

// Posts
router.get('/posts', adminCmsController.getPosts);
router.post('/posts', validate(createPostSchema), adminCmsController.createPost);
router.patch('/posts/:id', validate(updatePostSchema), adminCmsController.updatePost);
router.delete('/posts/:id', adminCmsController.deletePost);

// Banners
router.get('/banners', adminCmsController.getBanners);
router.post('/banners', validate(createBannerSchema), adminCmsController.createBanner);
router.patch('/banners/:id', adminCmsController.updateBanner);
router.delete('/banners/:id', adminCmsController.deleteBanner);

// CMS Pages (Contact, Terms, Guide, etc.)
router.get('/pages', adminCmsController.getCmsPages);
router.get('/pages/:slug', adminCmsController.getCmsPage);
router.patch('/pages/:slug', validate(updateCmsPageSchema), adminCmsController.updateCmsPage);

export default router;


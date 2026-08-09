import { Router } from 'express';
import * as publicCmsController from './public-cms.controller.js';
const router = Router();
router.get('/landing-page', publicCmsController.getLandingPage);
router.get('/banners', publicCmsController.getPublicBanners);
router.get('/posts', publicCmsController.getPublicPosts);
router.get('/posts/:slug', publicCmsController.getPublicPostBySlug);
router.get('/pages', publicCmsController.getPublicCmsPages);
router.get('/pages/:slug', publicCmsController.getPublicCmsPage);
export default router;
//# sourceMappingURL=public-cms.routes.js.map
import { Router } from 'express';
import * as publicSitemapController from './public-sitemap.controller.js';
const router = Router();
router.get('/sitemap.xml', publicSitemapController.getSitemap);
export default router;
//# sourceMappingURL=public-sitemap.routes.js.map
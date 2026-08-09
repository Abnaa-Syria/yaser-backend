import { Router } from 'express';
import * as publicSiteSettingsController from './public-site-settings.controller.js';

const router = Router();

router.get('/settings', publicSiteSettingsController.getPublicSiteSettings);

export default router;

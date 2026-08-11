import { catchAsync } from '../../../utils/catchAsync.js';
import * as publicSitemapService from './public-sitemap.service.js';
export const getSitemap = catchAsync(async (req, res) => {
    const xml = await publicSitemapService.buildSitemapXml();
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.status(200).send(xml);
});
//# sourceMappingURL=public-sitemap.controller.js.map
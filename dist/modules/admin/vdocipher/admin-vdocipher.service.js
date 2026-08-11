import { listVdoCipherVideos } from '../../../integrations/vdocipher/vdocipher.client.js';
import { isVdoCipherConfigured } from '../../../config/vdocipher.config.js';
export const getLibraryStatus = () => ({
    configured: isVdoCipherConfigured(),
});
export const listVideos = async (query) => {
    return listVdoCipherVideos(query);
};
//# sourceMappingURL=admin-vdocipher.service.js.map
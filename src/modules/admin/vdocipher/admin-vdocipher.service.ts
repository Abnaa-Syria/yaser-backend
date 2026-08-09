import { listVdoCipherVideos } from '../../../integrations/vdocipher/vdocipher.client.js';
import { isVdoCipherConfigured } from '../../../config/vdocipher.config.js';

export const getLibraryStatus = () => ({
  configured: isVdoCipherConfigured(),
});

export const listVideos = async (query: { page?: number; limit?: number; q?: string }) => {
  return listVdoCipherVideos(query);
};

import apiClient from '../api/client';

/**
 * Category service — the ONLY module responsible for public category API requests.
 *
 * Endpoints confirmed from the Laravel backend (routes/api.php + CategoryController):
 *   GET /categories   public listing of active categories with skill/job counts
 */
export const categoryService = {
  /** Fetch active categories for public browsing. */
  getCategories: async (params = {}) => {
    const response = await apiClient.get('/categories', { params });
    return response.data; // { success, message, data }
  },
};

export default categoryService;

import apiClient from '../api/client';

/**
 * Search service — the ONLY module responsible for global marketplace search.
 *
 * Calls GET /api/v1/search?q=... which returns both jobs and freelancers
 * matching the query with partial word matching, case-insensitive search,
 * and multi-word support.
 */
export const searchService = {
  /**
   * Global marketplace search across jobs and freelancers.
   *
   * @param {string} query - The search query (supports multiple words, partial matching)
   * @param {Object} options - Optional parameters
   * @param {number} [options.per_page=10] - Results per category
   * @returns {Promise<Object>} { success, data: { jobs, freelancers, jobs_total, freelancers_total } }
   */
  search: async (query, options = {}) => {
    const params = { q: query };
    if (options.per_page) {
      params.per_page = options.per_page;
    }
    const response = await apiClient.get('/search', { params });
    return response.data;
  },
};

export default searchService;

import apiClient from '../api/client';

export const portfolioService = {
  /**
   * Get current freelancer's portfolio items.
   */
  async getPortfolio() {
    const response = await apiClient.get('/freelancer/portfolio');
    return response.data;
  },

  /**
   * Create a new portfolio item. Supports multipart/form-data for image uploads.
   */
  async createPortfolioItem(data) {
    const isFormData = data instanceof FormData;
    const response = await apiClient.post('/freelancer/portfolio', data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return response.data;
  },

  /**
   * Get a single portfolio item.
   */
  async getPortfolioItem(id) {
    const response = await apiClient.get(`/freelancer/portfolio/${id}`);
    return response.data;
  },

  /**
   * Update a portfolio item. Supports multipart/form-data.
   */
  async updatePortfolioItem(id, data) {
    const isFormData = data instanceof FormData;
    const response = await apiClient.post(`/freelancer/portfolio/${id}`, data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
      params: { _method: 'PUT' },
    });
    return response.data;
  },

  /**
   * Delete a portfolio item.
   */
  async deletePortfolioItem(id) {
    const response = await apiClient.delete(`/freelancer/portfolio/${id}`);
    return response.data;
  },

  /**
   * Reorder portfolio items: items = [{ id, order }, ...]
   */
  async reorderPortfolio(items) {
    const response = await apiClient.put('/freelancer/portfolio-reorder', { items });
    return response.data;
  },

  /**
   * Public portfolio items for a freelancer.
   */
  async getPublicPortfolio(userId) {
    const response = await apiClient.get(`/freelancers/${userId}/portfolio`);
    return response.data;
  },
};

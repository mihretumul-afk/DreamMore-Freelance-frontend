import apiClient from '../api/client';

/**
 * Review service — manages contract reviews and ratings.
 *
 * Endpoints:
 *   POST /contracts/:contractId/review    submit a review
 *   GET  /reviews/:reviewId               view a single review
 *   GET  /users/:userId/reviews           user's public reviews
 */
export const reviewService = {
  /** Submit a review for a completed contract. */
  submitReview: async (contractId, payload) => {
    const response = await apiClient.post(`/contracts/${contractId}/review`, payload);
    return response.data;
  },

  /** Get a single review by ID. */
  getReview: async (reviewId) => {
    const response = await apiClient.get(`/reviews/${reviewId}`);
    return response.data;
  },

  /** Get reviews for a user (public). */
  getUserReviews: async (userId, params = {}) => {
    const response = await apiClient.get(`/users/${userId}/reviews`, { params });
    return response.data;
  },
};

export default reviewService;

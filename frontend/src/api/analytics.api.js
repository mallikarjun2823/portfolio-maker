import apiClient from './client';

/**
 * Analytics API
 * Provides aggregated portfolio analytics
 */
export const analyticsService = {
  /**
   * Get portfolio analytics
   * @param {Object} params - Query parameters for analytics
   */
  async getAnalytics(params = {}) {
    // Analytics endpoint expects a POST with parameters in the request body
    const response = await apiClient.post('/analytics/', params);
    return response.data;
  },
};

export default analyticsService;

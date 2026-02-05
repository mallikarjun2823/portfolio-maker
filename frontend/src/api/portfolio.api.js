import apiClient from './client';

/**
 * Portfolio API
 * Handles portfolio CRUD operations
 * Backend enforces ownership via IsPortfolioOwner permission
 */
export const portfolioService = {
  /**
   * List portfolios
   * Returns public portfolios + user's own portfolios
   * Backend includes is_owner flag for permission checking
   */
  async getPortfolios() {
    const response = await apiClient.get('/portfolios/');
    return response.data;
  },

  /**
   * Get single portfolio by ID
   * Backend includes is_owner flag
   */
  async getPortfolio(id) {
    const response = await apiClient.get(`/portfolios/${id}/`);
    return response.data;
  },

  /**
   * Create new portfolio
   * User becomes owner automatically
   */
  async createPortfolio(data) {
    const response = await apiClient.post('/portfolios/', data);
    return response.data;
  },

  /**
   * Update portfolio (owner only)
   */
  async updatePortfolio(id, data) {
    const response = await apiClient.put(`/portfolios/${id}/`, data);
    return response.data;
  },

  /**
   * Delete portfolio (owner only)
   */
  async deletePortfolio(id) {
    const response = await apiClient.delete(`/portfolios/${id}/`);
    return response.data;
  },
};

export default portfolioService;

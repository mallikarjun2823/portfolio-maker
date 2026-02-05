import apiClient from './client';

/**
 * Projects API (Portfolio-scoped)
 * All operations require portfolio_id context
 */
export const projectService = {
  /**
   * List projects for a portfolio
   */
  async getProjects(portfolioId, params = {}) {
    const response = await apiClient.get(`/portfolios/${portfolioId}/projects/`, { params });
    return response.data;
  },

  /**
   * Get single project
   */
  async getProject(portfolioId, projectId) {
    const response = await apiClient.get(`/portfolios/${portfolioId}/projects/${projectId}/`);
    return response.data;
  },

  /**
   * Create project (owner only)
   */
  async createProject(portfolioId, data) {
    const response = await apiClient.post(`/portfolios/${portfolioId}/projects/`, data);
    return response.data;
  },

  /**
   * Update project (owner only)
   */
  async updateProject(portfolioId, projectId, data) {
    const response = await apiClient.put(`/portfolios/${portfolioId}/projects/${projectId}/`, data);
    return response.data;
  },

  /**
   * Delete project (owner only)
   */
  async deleteProject(portfolioId, projectId) {
    const response = await apiClient.delete(`/portfolios/${portfolioId}/projects/${projectId}/`);
    return response.data;
  },
};

/**
 * Skills API (Portfolio-scoped)
 */
export const skillService = {
  async getSkills(portfolioId) {
    const response = await apiClient.get(`/portfolios/${portfolioId}/skills/`);
    return response.data;
  },

  async createSkill(portfolioId, data) {
    const response = await apiClient.post(`/portfolios/${portfolioId}/skills/`, data);
    return response.data;
  },

  async updateSkill(portfolioId, skillId, data) {
    const response = await apiClient.put(`/portfolios/${portfolioId}/skills/${skillId}/`, data);
    return response.data;
  },

  async deleteSkill(portfolioId, skillId) {
    const response = await apiClient.delete(`/portfolios/${portfolioId}/skills/${skillId}/`);
    return response.data;
  },
};

/**
 * Education API (Portfolio-scoped)
 */
export const educationService = {
  async getEducation(portfolioId) {
    const response = await apiClient.get(`/portfolios/${portfolioId}/education/`);
    return response.data;
  },

  async createEducation(portfolioId, data) {
    const response = await apiClient.post(`/portfolios/${portfolioId}/education/`, data);
    return response.data;
  },

  async updateEducation(portfolioId, educationId, data) {
    const response = await apiClient.put(`/portfolios/${portfolioId}/education/${educationId}/`, data);
    return response.data;
  },

  async deleteEducation(portfolioId, educationId) {
    const response = await apiClient.delete(`/portfolios/${portfolioId}/education/${educationId}/`);
    return response.data;
  },
};

/**
 * Social Links API (Portfolio-scoped)
 */
export const socialLinkService = {
  async getSocialLinks(portfolioId) {
    const response = await apiClient.get(`/portfolios/${portfolioId}/social-links/`);
    return response.data;
  },

  async createSocialLink(portfolioId, data) {
    const response = await apiClient.post(`/portfolios/${portfolioId}/social-links/`, data);
    return response.data;
  },

  async updateSocialLink(portfolioId, socialLinkId, data) {
    const response = await apiClient.put(`/portfolios/${portfolioId}/social-links/${socialLinkId}/`, data);
    return response.data;
  },

  async deleteSocialLink(portfolioId, socialLinkId) {
    const response = await apiClient.delete(`/portfolios/${portfolioId}/social-links/${socialLinkId}/`);
    return response.data;
  },
};

/**
 * Documents API (Portfolio-scoped)
 */
export const documentService = {
  async getDocuments(portfolioId) {
    const response = await apiClient.get(`/portfolios/${portfolioId}/documents/`);
    return response.data;
  },

  async uploadDocument(portfolioId, formData) {
    const response = await apiClient.post(`/portfolios/${portfolioId}/documents/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async deleteDocument(portfolioId, documentId) {
    const response = await apiClient.delete(`/portfolios/${portfolioId}/documents/${documentId}/`);
    return response.data;
  },
};

/**
 * Portfolio Versions API
 */
export const versionService = {
  async getVersions(portfolioId) {
    const response = await apiClient.get(`/portfolios/${portfolioId}/versions/`);
    return response.data;
  },

  async getVersion(portfolioId, versionNumber) {
    const response = await apiClient.get(`/portfolios/${portfolioId}/versions/${versionNumber}/`);
    return response.data;
  },

  async createVersion(portfolioId, data) {
    const response = await apiClient.post(`/portfolios/${portfolioId}/versions/`, data);
    return response.data;
  },

  async revertVersion(portfolioId, versionNumber) {
    const response = await apiClient.post(`/portfolios/${portfolioId}/versions/${versionNumber}/revert/`);
    return response.data;
  },
};

export default {
  projectService,
  skillService,
  educationService,
  socialLinkService,
  documentService,
  versionService,
};

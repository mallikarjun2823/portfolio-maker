import apiClient from './client';

export const authService = {
  async register(data) {
    const response = await apiClient.post('/auth/register/', data);
    return response.data;
  },

  async login(credentials) {
    const response = await apiClient.post('/auth/login/', credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('username', response.data.username);
    }
    return response.data;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
  },

  isAuthenticated() {
    return !!localStorage.getItem('token');
  },

  getUsername() {
    return localStorage.getItem('username');
  },
};

export const portfolioService = {
  async getPortfolios() {
    const response = await apiClient.get('/portfolios/');
    return response.data;
  },

  async getPortfolio(id) {
    const response = await apiClient.get(`/portfolios/${id}/`);
    return response.data;
  },

  async createPortfolio(data) {
    const response = await apiClient.post('/portfolios/', data);
    return response.data;
  },

  async updatePortfolio(id, data) {
    const response = await apiClient.put(`/portfolios/${id}/`, data);
    return response.data;
  },

  async deletePortfolio(id) {
    const response = await apiClient.delete(`/portfolios/${id}/`);
    return response.data;
  },
};

export const projectService = {
  async getProjects(portfolioId, params = {}) {
    const response = await apiClient.get(`/portfolios/${portfolioId}/projects/`, { params });
    return response.data;
  },

  async getProject(portfolioId, projectId) {
    const response = await apiClient.get(`/portfolios/${portfolioId}/projects/${projectId}/`);
    return response.data;
  },

  async createProject(portfolioId, data) {
    const response = await apiClient.post(`/portfolios/${portfolioId}/projects/`, data);
    return response.data;
  },

  async updateProject(portfolioId, projectId, data) {
    const response = await apiClient.put(`/portfolios/${portfolioId}/projects/${projectId}/`, data);
    return response.data;
  },

  async deleteProject(portfolioId, projectId) {
    const response = await apiClient.delete(`/portfolios/${portfolioId}/projects/${projectId}/`);
    return response.data;
  },
};

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

export const analyticsService = {
  async getAnalytics(params) {
    const response = await apiClient.post('/analytics/', params);
    return response.data;
  },
};

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

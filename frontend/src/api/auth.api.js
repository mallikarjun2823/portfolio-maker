import apiClient from './client';

/**
 * Authentication API
 * Handles user registration, login, and token management
 */
export const authService = {
  /**
   * Register a new user
   */
  async register(data) {
    const response = await apiClient.post('/auth/register/', data);
    return response.data;
  },

  /**
   * Login and receive JWT token
   */
  async login(credentials) {
    const response = await apiClient.post('/auth/login/', credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('username', response.data.username);
    }
    return response.data;
  },

  /**
   * Logout and clear credentials
   */
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!localStorage.getItem('token');
  },

  /**
   * Get stored username
   */
  getUsername() {
    return localStorage.getItem('username');
  },

  /**
   * Get stored token
   */
  getToken() {
    return localStorage.getItem('token');
  },
};

export default authService;

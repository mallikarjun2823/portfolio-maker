import apiClient from './client';

/**
 * User Profile API
 * Handles current user's profile operations
 */
export const profileService = {
  /**
   * Get current user's profile
   */
  async getProfile() {
    const response = await apiClient.get('/me/profile/');
    return response.data;
  },

  /**
   * Update current user's profile
   * Accepts FormData for multipart uploads (avatar)
   */
  async updateProfile(formData) {
    const response = await apiClient.put('/me/profile/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
};

export default profileService;

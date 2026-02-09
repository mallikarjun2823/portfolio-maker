import React, { createContext, useState, useEffect } from 'react';
import { authService } from '../api/auth.api';
import { profileService } from '../api/profile.api';

/**
 * Auth Context
 * Provides authentication state and user context throughout the app
 */
export const AuthContext = createContext({
  user: null,
  profile: null,
  loading: true,
  isAuthenticated: false,
  login: async () => {},
  logout: () => {},
  register: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Load user profile on mount if token exists
   */
  const loadUserProfile = async () => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');

    if (!token || !username) {
      setLoading(false);
      return;
    }

    try {
      setUser({ username });
      const profileData = await profileService.getProfile();
      setProfile(profileData);
    } catch (error) {
      console.error('Failed to load profile:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserProfile();
  }, []);

  /**
   * Login handler
   */
  const login = async (credentials) => {
    const data = await authService.login(credentials);
    setUser({ username: data.username });

    try {
      const profileData = await profileService.getProfile();
      setProfile(profileData);
    } catch (error) {
      console.error('Failed to load profile after login:', error);
    }

    return data;
  };

  /**
   * Logout handler
   */
  const logout = () => {
    authService.logout();
    setUser(null);
    setProfile(null);
  };

  /**
   * Register handler
   */
  const register = async (data) => {
    const result = await authService.register(data);
    return result;
  };

  /**
   * Refresh profile data
   */
  const refreshProfile = async () => {
    if (!user) return;

    try {
      const profileData = await profileService.getProfile();
      setProfile(profileData);
    } catch (error) {
      console.error('Failed to refresh profile:', error);
    }
  };

  const value = {
    user,
    profile,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    register,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;

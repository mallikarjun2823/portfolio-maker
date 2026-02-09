import { useState, useEffect } from 'react';
import { authService } from '../api/auth.api';
import { profileService } from '../api/profile.api';

/**
 * Lightweight auth hook that uses only useState/useEffect.
 * Reads token/username from localStorage via authService and
 * optionally loads profile from backend.
 */
export function useAuth() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const token = authService.getToken();
      const username = authService.getUsername();
      if (!token || !username) {
        setLoading(false);
        return;
      }

      setUser({ username });

      try {
        const profileData = await profileService.getProfile();
        if (mounted) setProfile(profileData);
      } catch (err) {
        // invalid token or failed profile load
        authService.logout();
        if (mounted) {
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, []);

  const login = async (credentials) => {
    const data = await authService.login(credentials);
    setUser({ username: data.username });
    try {
      const profileData = await profileService.getProfile();
      setProfile(profileData);
    } catch (err) {
      // ignore
    }
    return data;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setProfile(null);
  };

  const register = async (payload) => {
    const data = await authService.register(payload);
    return data;
  };

  const refreshProfile = async () => {
    if (!user) return null;
    try {
      const profileData = await profileService.getProfile();
      setProfile(profileData);
      return profileData;
    } catch (err) { return null; }
  };

  return {
    user,
    profile,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    register,
    refreshProfile,
  };
}

export default useAuth;

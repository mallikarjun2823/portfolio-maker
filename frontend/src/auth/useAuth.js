import { useContext } from 'react';
import { AuthContext } from './AuthProvider';

/**
 * Hook to access auth context
 * Provides user, profile, and auth methods
 */
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

export default useAuth;

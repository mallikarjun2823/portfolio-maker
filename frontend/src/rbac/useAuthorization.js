import { useAuth } from '../auth';
import { can, canAny, canAll, getUserRoleForResource } from './can';

/**
 * Hook for checking permissions
 * Provides permission checking functions bound to current user
 * 
 * @param {Object} resource - Optional resource to check permissions against
 * @returns {Object} Permission checking utilities
 */
export function useAuthorization(resource = null) {
  const { user, isAuthenticated } = useAuth();

  return {
    can: (permission) => can(user, permission, resource),
    canAny: (permissions) => canAny(user, permissions, resource),
    canAll: (permissions) => canAll(user, permissions, resource),
    role: getUserRoleForResource(user, resource),
    isAuthenticated,
    user,
  };
}

export default useAuthorization;

import { useMemo, useCallback } from 'react';
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

  const checkCan = useCallback(
    (permission) => can(user, permission, resource),
    [user, resource]
  );

  const checkCanAny = useCallback(
    (permissions) => canAny(user, permissions, resource),
    [user, resource]
  );

  const checkCanAll = useCallback(
    (permissions) => canAll(user, permissions, resource),
    [user, resource]
  );

  const role = useMemo(
    () => getUserRoleForResource(user, resource),
    [user, resource]
  );

  return useMemo(
    () => ({
      can: checkCan,
      canAny: checkCanAny,
      canAll: checkCanAll,
      role,
      isAuthenticated,
      user,
    }),
    [checkCan, checkCanAny, checkCanAll, role, isAuthenticated, user]
  );
}

export default useAuthorization;

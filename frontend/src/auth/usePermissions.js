import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { can, canAny, canAll } from '../rbac';

/**
 * Hook to check permissions
 * Returns permission checking functions bound to current user
 */
export function usePermissions(resource = null) {
  const { user } = useAuth();

  return useMemo(() => ({
    can: (permission) => can(user, permission, resource),
    canAny: (permissions) => canAny(user, permissions, resource),
    canAll: (permissions) => canAll(user, permissions, resource),
    user,
  }), [user, resource]);
}

export default usePermissions;

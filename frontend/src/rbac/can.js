import { ROLES, getPermissionsForRole } from './roles';

/**
 * Determine user's role for a specific resource
 * Backend sends is_owner flag for portfolios and related resources
 */
export function getUserRoleForResource(user, resource) {
  if (!user) {
    return ROLES.ANONYMOUS;
  }
  
  // Check if resource indicates ownership
  if (resource && resource.is_owner) {
    return ROLES.OWNER;
  }
  
  // Authenticated but not owner
  if (user && !resource?.is_owner) {
    // If viewing someone else's portfolio
    if (resource) {
      return ROLES.VIEWER;
    }
    // General authenticated user (e.g., creating own portfolio)
    return ROLES.AUTHENTICATED;
  }
  
  return ROLES.AUTHENTICATED;
}

/**
 * Check if user can perform an action on a resource
 * This is the primary permission check function
 * 
 * @param {Object} user - Current user object
 * @param {string} permission - Permission constant from PERMISSIONS
 * @param {Object} resource - Resource being accessed (must have is_owner flag from backend)
 * @returns {boolean} - Whether the user has permission
 */
export function can(user, permission, resource = null) {
  const role = getUserRoleForResource(user, resource);
  const rolePermissions = getPermissionsForRole(role);
  return rolePermissions.includes(permission);
}

/**
 * Check if user can perform any of the given permissions
 */
export function canAny(user, permissions, resource = null) {
  return permissions.some(permission => can(user, permission, resource));
}

/**
 * Check if user can perform all of the given permissions
 */
export function canAll(user, permissions, resource = null) {
  return permissions.every(permission => can(user, permission, resource));
}

/**
 * Filter a list of permissions to only those the user has
 */
export function filterPermissions(user, permissions, resource = null) {
  return permissions.filter(permission => can(user, permission, resource));
}

export default can;

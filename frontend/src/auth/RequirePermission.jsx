import React from 'react';
import { usePermissions } from './usePermissions';

/**
 * Component that only renders children if user has required permission
 * 
 * @param {string} permission - Required permission
 * @param {Object} resource - Resource to check permission against
 * @param {React.ReactNode} children - Content to render if permitted
 * @param {React.ReactNode} fallback - Content to render if not permitted
 */
export function RequirePermission({ permission, resource, children, fallback = null }) {
  const { can } = usePermissions(resource);

  if (!can(permission)) {
    return fallback;
  }

  return <>{children}</>;
}

/**
 * Component that renders children if user has ANY of the required permissions
 */
export function RequireAnyPermission({ permissions, resource, children, fallback = null }) {
  const { canAny } = usePermissions(resource);

  if (!canAny(permissions)) {
    return fallback;
  }

  return <>{children}</>;
}

/**
 * Component that renders children if user has ALL of the required permissions
 */
export function RequireAllPermissions({ permissions, resource, children, fallback = null }) {
  const { canAll } = usePermissions(resource);

  if (!canAll(permissions)) {
    return fallback;
  }

  return <>{children}</>;
}

export default RequirePermission;

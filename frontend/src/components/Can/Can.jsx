import React from 'react';
import { useAuth } from '../../auth';
import { can, canAny, canAll } from '../../rbac';

/**
 * Conditional rendering component based on permissions
 * Only renders children if user has required permissions
 * 
 * @param {Object} props
 * @param {React.Component} props.children - Component to render if permitted
 * @param {string|string[]} props.perform - Permission(s) to check
 * @param {Object} props.on - Resource to check permission against
 * @param {React.Component} props.fallback - Component to render if not permitted
 * @param {string} props.mode - 'any', 'all', or 'single' (default: 'single')
 */
const Can = ({ 
  children, 
  perform, 
  on = null, 
  fallback = null,
  mode = 'single' 
}) => {
  const { user } = useAuth();

  let hasPermission = false;

  if (Array.isArray(perform)) {
    if (mode === 'any') {
      hasPermission = canAny(user, perform, on);
    } else if (mode === 'all') {
      hasPermission = canAll(user, perform, on);
    } else {
      // Default to 'any' for arrays
      hasPermission = canAny(user, perform, on);
    }
  } else {
    hasPermission = can(user, perform, on);
  }

  if (!hasPermission) {
    return fallback;
  }

  return children;
};

export default Can;

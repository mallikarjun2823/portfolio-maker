import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth';
import { can } from '../../rbac';

/**
 * ProtectedRoute - Wraps routes that require authentication and/or specific permissions
 * 
 * @param {Object} props
 * @param {React.Component} props.children - Component to render if authorized
 * @param {string} props.permission - Required permission (optional)
 * @param {Object} props.resource - Resource to check permission against (optional)
 * @param {string} props.redirectTo - Path to redirect if unauthorized (default: '/login')
 * @param {React.Component} props.fallback - Component to render if unauthorized (instead of redirect)
 */
const ProtectedRoute = ({ 
  children, 
  permission = null, 
  resource = null, 
  redirectTo = '/login',
  fallback = null 
}) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Show nothing while checking auth
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh' 
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // If permission is required, check it
  if (permission && !can(user, permission, resource)) {
    if (fallback) {
      return fallback;
    }
    
    return (
      <div style={{ 
        padding: '2rem', 
        textAlign: 'center' 
      }}>
        <h2>Access Denied</h2>
        <p>You don't have permission to access this resource.</p>
      </div>
    );
  }

  // User is authenticated and has required permissions
  return children;
};

export default ProtectedRoute;

/**
 * Permission definitions
 * These map to backend permission checks and define what actions users can perform
 */

export const PERMISSIONS = {
  // Portfolio permissions
  PORTFOLIO_CREATE: 'portfolio:create',
  PORTFOLIO_VIEW: 'portfolio:view',
  PORTFOLIO_EDIT: 'portfolio:edit',
  PORTFOLIO_DELETE: 'portfolio:delete',
  PORTFOLIO_PUBLISH: 'portfolio:publish',
  
  // Project permissions
  PROJECT_CREATE: 'project:create',
  PROJECT_VIEW: 'project:view',
  PROJECT_EDIT: 'project:edit',
  PROJECT_DELETE: 'project:delete',
  
  // Skill permissions
  SKILL_CREATE: 'skill:create',
  SKILL_VIEW: 'skill:view',
  SKILL_EDIT: 'skill:edit',
  SKILL_DELETE: 'skill:delete',
  
  // Education permissions
  EDUCATION_CREATE: 'education:create',
  EDUCATION_VIEW: 'education:view',
  EDUCATION_EDIT: 'education:edit',
  EDUCATION_DELETE: 'education:delete',
  
  // Social link permissions
  SOCIAL_LINK_CREATE: 'social_link:create',
  SOCIAL_LINK_VIEW: 'social_link:view',
  SOCIAL_LINK_EDIT: 'social_link:edit',
  SOCIAL_LINK_DELETE: 'social_link:delete',
  
  // Document permissions
  DOCUMENT_UPLOAD: 'document:upload',
  DOCUMENT_VIEW: 'document:view',
  DOCUMENT_DELETE: 'document:delete',
  
  // Version permissions
  VERSION_CREATE: 'version:create',
  VERSION_VIEW: 'version:view',
  VERSION_REVERT: 'version:revert',
  
  // Analytics permissions
  ANALYTICS_VIEW: 'analytics:view',
  
  // Profile permissions
  PROFILE_VIEW: 'profile:view',
  PROFILE_EDIT: 'profile:edit',
};

export default PERMISSIONS;

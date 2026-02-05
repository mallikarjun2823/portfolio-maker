/**
 * Legacy service exports
 * This file re-exports from the new modular API structure
 * Kept for backward compatibility during migration
 * 
 * New code should import directly from api/*.api.js files
 */

export { default as authService } from './auth.api';
export { default as profileService } from './profile.api';
export { default as portfolioService } from './portfolio.api';
export { default as analyticsService } from './analytics.api';
export {
  projectService,
  skillService,
  educationService,
  socialLinkService,
  documentService,
  versionService,
} from './resources.api';


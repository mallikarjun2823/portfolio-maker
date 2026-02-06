# Portfolio Maker - RBAC Architecture & UI Documentation

## Overview
This is a professional portfolio management application built with React, featuring a comprehensive Role-Based Access Control (RBAC) system and a modern, visually rich UI.

## Architecture

### Technology Stack
- **Frontend Framework**: React 18+ with Hooks
- **Routing**: React Router v6
- **Styling**: CSS Variables with Modern Design System
- **Authentication**: JWT-based with Context API
- **Authorization**: Custom RBAC Implementation

## RBAC System

### Role Definitions

The application uses an ownership-based permission model:

- **OWNER**: Full access to their own portfolio and resources
- **VIEWER**: Read-only access to public portfolios
- **AUTHENTICATED**: General logged-in users
- **ANONYMOUS**: Unauthenticated users

### Permission Structure

Permissions follow a `resource:action` naming convention:

```javascript
// Examples
PERMISSIONS.PORTFOLIO_VIEW
PERMISSIONS.PORTFOLIO_EDIT
PERMISSIONS.PROJECT_CREATE
PERMISSIONS.SKILL_DELETE
```

### Components

#### 1. ProtectedRoute
Wraps routes requiring authentication/permissions:

```jsx
<ProtectedRoute permission={PERMISSIONS.PORTFOLIO_EDIT} resource={portfolio}>
  <EditPortfolio />
</ProtectedRoute>
```

#### 2. Can Component
Conditional rendering based on permissions:

```jsx
<Can perform={PERMISSIONS.PROJECT_EDIT} on={project}>
  <Button onClick={handleEdit}>Edit</Button>
</Can>
```

#### 3. useAuthorization Hook
Access permission checks in components:

```jsx
const { can, canAny, role } = useAuthorization(resource);

if (can(PERMISSIONS.PORTFOLIO_EDIT)) {
  // Show edit interface
}
```

### Permission Checking Functions

```javascript
import { can, canAny, canAll } from './rbac';

// Single permission check
can(user, PERMISSIONS.PORTFOLIO_VIEW, resource)

// Check if user has any of the permissions
canAny(user, [PERMISSIONS.PORTFOLIO_EDIT, PERMISSIONS.PORTFOLIO_DELETE], resource)

// Check if user has all permissions
canAll(user, [PERMISSIONS.PORTFOLIO_VIEW, PERMISSIONS.ANALYTICS_VIEW], resource)
```

## Design System

### CSS Variables

All styling uses CSS custom properties for consistency:

```css
/* Colors */
--color-primary-600
--color-secondary-500
--color-success-600
--color-danger-600

/* Spacing */
--spacing-xs (4px)
--spacing-sm (8px)
--spacing-md (16px)
--spacing-lg (24px)

/* Typography */
--font-size-sm (14px)
--font-size-base (16px)
--font-size-lg (18px)

/* Shadows & Radius */
--shadow-sm
--shadow-md
--radius-lg
```

### Professional Components

#### Icon Component
SVG-based icon system (no emojis):

```jsx
<Icon name="dashboard" size={20} />
<Icon name="projects" size={24} />
```

#### Button Component
Feature-rich button with variants and states:

```jsx
<Button 
  variant="primary" 
  size="md"
  icon="add"
  loading={isSubmitting}
  onClick={handleCreate}
>
  Create Portfolio
</Button>
```

#### Card Component
Modern card layout with header/footer:

```jsx
<Card 
  title="My Portfolio"
  hoverable
  footer={<Button>View Details</Button>}
>
  {content}
</Card>
```

## Layout Architecture

### Sidebar Navigation
- Collapsible sidebar with smooth transitions
- Active route highlighting
- Responsive mobile menu
- Professional icon system

### Header
- Contextual page titles
- User profile menu
- Action buttons (CTA)
- Dropdown menus

### Main Content Area
- Consistent padding and spacing
- Smooth page transitions
- Responsive grid system

## Routing Structure

```
/login                          - Public route
/                              - Protected: Dashboard
/projects                      - Protected: Projects list
/portfolios                    - Protected: Portfolio explorer
/portfolios/:id                - Protected: Portfolio detail
  ├── overview                 - Portfolio overview
  ├── projects                 - Projects section
  ├── skills                   - Skills section
  ├── education                - Education section
  ├── social                   - Social links
  ├── documents                - Document uploads
  └── versions                 - Version history
/profile                       - Protected: User profile
/analytics                     - Protected: Analytics dashboard
/resume                        - Protected: Resume builder
/activity                      - Protected: Activity feed
```

## Authentication Flow

1. User logs in via `/login`
2. JWT token stored in localStorage
3. AuthProvider validates token
4. User context available throughout app
5. Protected routes check authentication
6. Permission checks on resources

## Best Practices

### Component Organization
```
components/
  ComponentName/
    ComponentName.jsx    - React component
    ComponentName.css    - Component styles
```

### Using RBAC
```jsx
// Always check permissions before rendering UI
import { Can } from './components';
import { PERMISSIONS } from './rbac';

function PortfolioActions({ portfolio }) {
  return (
    <>
      <Can perform={PERMISSIONS.PORTFOLIO_EDIT} on={portfolio}>
        <Button>Edit</Button>
      </Can>
      
      <Can perform={PERMISSIONS.PORTFOLIO_DELETE} on={portfolio}>
        <Button variant="danger">Delete</Button>
      </Can>
    </>
  );
}
```

### Using Hooks
```jsx
import { useAuthorization } from './rbac';
import { PERMISSIONS } from './rbac';

function MyComponent({ portfolio }) {
  const { can, role } = useAuthorization(portfolio);
  
  const isOwner = role === 'owner';
  const canEdit = can(PERMISSIONS.PORTFOLIO_EDIT);
  
  return (
    <div>
      {isOwner && <OwnerDashboard />}
      {canEdit && <EditButton />}
    </div>
  );
}
```

## Styling Guidelines

### Use Utility Classes
```jsx
<div className="flex items-center gap-3 p-4">
  <Icon name="info" />
  <span className="text-muted">Information</span>
</div>
```

### Component-Specific Styles
```css
/* Use BEM-like naming */
.component-name { }
.component-name__element { }
.component-name--modifier { }
```

### Responsive Design
```css
@media (max-width: 768px) {
  /* Mobile styles */
}

@media (min-width: 769px) {
  /* Desktop styles */
}
```

## Performance Considerations

- Lazy load routes with React.lazy()
- Memoize permission checks with useMemo/useCallback
- Debounce search and filter operations
- Virtual scrolling for large lists

## Security

- All routes protected by authentication
- Permission checks on both frontend and backend
- JWT token validation
- CSRF protection
- XSS prevention through React's built-in escaping

## Future Enhancements

- Role management UI
- Permission delegation
- Audit logging
- Real-time collaboration with WebSockets
- Advanced analytics
- Multi-factor authentication

## Development

### Running the Application
```bash
cd frontend
npm install
npm start
```

### Building for Production
```bash
npm run build
```

### Testing
```bash
npm test
```

---

Built with ❤️ using React and modern web standards.

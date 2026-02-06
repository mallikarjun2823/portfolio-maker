# Portfolio Maker - Frontend

A professional, RBAC-enabled React application for creating and managing portfolios.

## Features

✨ **Professional UI/UX**
- Modern design system with CSS variables
- Smooth animations and transitions
- Responsive layout for all devices
- Professional icon system (no emojis)
- Rich component library

🔐 **Role-Based Access Control (RBAC)**
- Owner, Viewer, and Authenticated roles
- Fine-grained permission system
- Protected routes and components
- Conditional rendering based on permissions

🎨 **Design System**
- Comprehensive CSS variable system
- Reusable utility classes
- Consistent spacing and typography
- Professional color palette
- Shadow and radius tokens

## Quick Start

### Prerequisites
- Node.js 16+ and npm
- Backend API running (see main README)

### Installation

```bash
cd frontend
npm install
```

### Environment Setup

Create `.env` file in the frontend directory:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

### Development

```bash
npm start
```

The app will open at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

## Project Structure

```
frontend/
├── src/
│   ├── api/              # API client and service layer
│   ├── auth/             # Authentication context and hooks
│   ├── components/       # Reusable UI components
│   │   ├── Button/
│   │   ├── Card/
│   │   ├── Can/          # Permission-based rendering
│   │   ├── Icon/         # SVG icon system
│   │   ├── Layout/       # Main app layout
│   │   ├── ProtectedRoute/  # Route protection
│   │   └── ...
│   ├── pages/            # Page components
│   ├── rbac/             # RBAC logic and utilities
│   ├── styles/           # Global styles and variables
│   └── utils/            # Helper functions
├── ARCHITECTURE.md       # Detailed architecture docs
└── package.json
```

## Component Library

### Icon
Professional SVG icon system

```jsx
import { Icon } from './components';

<Icon name="dashboard" size={20} />
<Icon name="projects" size={24} />
<Icon name="settings" size={16} />
```

Available icons: `dashboard`, `projects`, `explore`, `portfolio`, `settings`, `analytics`, `resume`, `activity`, `add`, `edit`, `delete`, `save`, `close`, `logout`, `menu`, `chevronLeft`, `chevronRight`, `check`, `alert`, `info`, `star`, `eye`, `lock`, `unlock`, `share`, `download`, `upload`, `sparkles`

### Button
Feature-rich button component

```jsx
import { Button } from './components';

<Button variant="primary" size="md">
  Click Me
</Button>

<Button variant="danger" icon="delete" onClick={handleDelete}>
  Delete
</Button>

<Button loading={isSubmitting} type="submit">
  Save
</Button>
```

**Props:**
- `variant`: `primary`, `secondary`, `outline`, `danger`, `success`, `ghost`
- `size`: `sm`, `md`, `lg`
- `icon`: Icon name to display before text
- `iconRight`: Icon name to display after text
- `loading`: Show loading spinner
- `fullWidth`: Full width button
- `disabled`: Disabled state

### Card
Professional card container

```jsx
import { Card } from './components';

<Card title="My Portfolio" hoverable>
  <p>Portfolio content...</p>
</Card>

<Card 
  header={<CustomHeader />}
  footer={<Button>View More</Button>}
>
  Content here
</Card>
```

**Props:**
- `title`: Card title (string)
- `header`: Custom header component
- `footer`: Footer content
- `noPadding`: Remove default padding
- `hoverable`: Add hover effect
- `onClick`: Click handler

### Layout
Main application layout with sidebar

The Layout component automatically wraps all protected routes and provides:
- Collapsible sidebar navigation
- User profile menu
- Page titles
- Responsive mobile menu

### ProtectedRoute
Route protection with authentication and permissions

```jsx
import { ProtectedRoute } from './components';
import { PERMISSIONS } from './rbac';

<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>

<ProtectedRoute 
  permission={PERMISSIONS.PORTFOLIO_EDIT}
  resource={portfolio}
>
  <EditPortfolio />
</ProtectedRoute>
```

**Props:**
- `permission`: Required permission (optional)
- `resource`: Resource to check permission against
- `redirectTo`: Redirect path if unauthorized (default: `/login`)
- `fallback`: Component to render instead of redirect

### Can
Conditional rendering based on permissions

```jsx
import { Can } from './components';
import { PERMISSIONS } from './rbac';

<Can perform={PERMISSIONS.PROJECT_EDIT} on={project}>
  <Button onClick={handleEdit}>Edit</Button>
</Can>

<Can 
  perform={[PERMISSIONS.PORTFOLIO_EDIT, PERMISSIONS.PORTFOLIO_DELETE]}
  mode="any"
  on={portfolio}
>
  <AdminTools />
</Can>
```

**Props:**
- `perform`: Permission(s) to check (string or array)
- `on`: Resource to check against
- `mode`: `single`, `any`, or `all` (for arrays)
- `fallback`: Component to render if not permitted

## RBAC Usage

### Permissions

```javascript
import { PERMISSIONS } from './rbac';

PERMISSIONS.PORTFOLIO_VIEW
PERMISSIONS.PORTFOLIO_EDIT
PERMISSIONS.PORTFOLIO_DELETE
PERMISSIONS.PROJECT_CREATE
// ... and more
```

### useAuthorization Hook

```jsx
import { useAuthorization } from './rbac';
import { PERMISSIONS } from './rbac';

function MyComponent({ portfolio }) {
  const { can, canAny, role } = useAuthorization(portfolio);
  
  if (can(PERMISSIONS.PORTFOLIO_EDIT)) {
    return <EditInterface />;
  }
  
  if (canAny([PERMISSIONS.PORTFOLIO_VIEW, PERMISSIONS.ANALYTICS_VIEW])) {
    return <ViewerInterface />;
  }
  
  return <PublicInterface />;
}
```

### Permission Checking Functions

```javascript
import { can, canAny, canAll } from './rbac';

// Check single permission
if (can(user, PERMISSIONS.PORTFOLIO_EDIT, portfolio)) {
  // User can edit
}

// Check if user has any permission
if (canAny(user, [PERMISSIONS.PORTFOLIO_EDIT, PERMISSIONS.PORTFOLIO_DELETE], portfolio)) {
  // User has at least one permission
}

// Check if user has all permissions
if (canAll(user, [PERMISSIONS.PORTFOLIO_VIEW, PERMISSIONS.ANALYTICS_VIEW], portfolio)) {
  // User has all permissions
}
```

## Styling Guide

### Using CSS Variables

```css
.my-component {
  color: var(--color-primary-600);
  padding: var(--spacing-lg);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  transition: all var(--transition-fast);
}
```

### Utility Classes

```jsx
<div className="flex items-center gap-3 p-4">
  <Icon name="info" />
  <span className="text-muted">Information</span>
</div>

<div className="grid gap-4 mt-5 mb-3">
  <Card hoverable>Content 1</Card>
  <Card hoverable>Content 2</Card>
</div>
```

Common utilities:
- **Layout**: `flex`, `grid`, `items-center`, `justify-between`
- **Spacing**: `p-4`, `mt-3`, `mb-2`, `gap-3`
- **Text**: `text-center`, `text-muted`, `font-semibold`
- **Display**: `hidden`, `block`, `inline-flex`

## API Integration

### Authentication

```jsx
import { useAuth } from './auth';

function MyComponent() {
  const { user, login, logout, isAuthenticated, loading } = useAuth();
  
  const handleLogin = async () => {
    await login({ username, password });
  };
  
  return (
    <div>
      {isAuthenticated ? (
        <p>Welcome, {user.username}</p>
      ) : (
        <LoginForm onSubmit={handleLogin} />
      )}
    </div>
  );
}
```

### Service Layer

```jsx
import { portfolioService } from './api/services';

// Get portfolios
const portfolios = await portfolioService.getPortfolios();

// Get single portfolio
const portfolio = await portfolioService.getPortfolio(id);

// Create portfolio
const newPortfolio = await portfolioService.createPortfolio(data);

// Update portfolio
const updated = await portfolioService.updatePortfolio(id, data);

// Delete portfolio
await portfolioService.deletePortfolio(id);
```

## Best Practices

### 1. Always Check Permissions

```jsx
// ❌ Don't
<button onClick={handleDelete}>Delete</button>

// ✅ Do
<Can perform={PERMISSIONS.PORTFOLIO_DELETE} on={portfolio}>
  <button onClick={handleDelete}>Delete</button>
</Can>
```

### 2. Use the Design System

```jsx
// ❌ Don't
<button style={{ background: '#3b82f6', padding: '12px' }}>
  Click Me
</button>

// ✅ Do
<Button variant="primary" size="md">
  Click Me
</Button>
```

### 3. Handle Loading States

```jsx
// ❌ Don't
<button onClick={handleSubmit}>Submit</button>

// ✅ Do
<Button onClick={handleSubmit} loading={isSubmitting}>
  Submit
</Button>
```

### 4. Use Professional Icons

```jsx
// ❌ Don't
<span>📊 Dashboard</span>

// ✅ Do
<Icon name="dashboard" size={20} />
<span>Dashboard</span>
```

## Deployment

### Environment Variables

Production `.env`:
```env
VITE_API_BASE_URL=https://api.yourapp.com/api
```

### Build & Deploy

```bash
npm run build
```

The `dist/` folder can be deployed to any static hosting service:
- Netlify
- Vercel
- AWS S3 + CloudFront
- GitHub Pages

## Troubleshooting

### Icons Not Showing
Make sure to import Icon component:
```jsx
import { Icon } from './components';
```

### Styles Not Applied
Check that component CSS files are imported:
```jsx
import './ComponentName.css';
```

### RBAC Not Working
Ensure backend sends `is_owner` flag in API responses:
```json
{
  "id": 1,
  "title": "My Portfolio",
  "is_owner": true
}
```

## Contributing

1. Follow the existing code style
2. Use professional icons (no emojis)
3. Check permissions before rendering UI
4. Use the design system (CSS variables)
5. Test on multiple screen sizes

## License

MIT License - see LICENSE file for details

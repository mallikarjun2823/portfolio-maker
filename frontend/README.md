# Portfolio Frontend

A clean, minimal React application for managing portfolios.

## Tech Stack

- React 18 (functional components only)
- React Router 6 (navigation)
- Axios (API calls)
- No Redux or complex state libraries

## Features

### Core Screens

1. **Portfolio Dashboard** - View portfolio status and quick navigation
2. **Projects & Skills** - Paginated, sortable project list
3. **Analytics** - Date range filtering with metrics
4. **Resume Preview** - Template selection and download
5. **Activity Timeline** - Chronological activity log

## Getting Started

### Prerequisites

- Node.js 14+
- Backend API running on `http://localhost:8000`

### Installation

```bash
npm install
```

### Development

```bash
npm start
```

Runs the app on `http://localhost:3000`

### Production Build

```bash
npm run build
```

Creates optimized production bundle in `build/` directory.

## Project Structure

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── PortfolioDashboard.js
│   │   ├── ProjectsSkills.js
│   │   ├── Analytics.js
│   │   ├── ResumePreview.js
│   │   └── ActivityTimeline.js
│   ├── api.js          # Centralized API layer
│   ├── App.js          # Router setup
│   ├── App.css         # Minimal styling
│   └── index.js        # Entry point
└── package.json
```

## API Integration

All API calls are centralized in `src/api.js`. The app assumes:

- Backend exposes REST APIs at `/api/*`
- APIs return JSON
- Authentication token is stored in `localStorage.authToken`

## Design Principles

- **Separation of concerns**: Data fetching, state management, and UI rendering are clearly separated
- **Minimal and clean**: No heavy UI libraries or unnecessary abstractions
- **Production-ready**: Proper loading states, error handling, and user feedback
- **Clear and maintainable**: Meaningful names, avoid over-abstraction

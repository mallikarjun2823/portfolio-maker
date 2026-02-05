import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth';
import Layout from './components/Layout/Layout';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Projects from './pages/Projects/Projects';
import Portfolios from './pages/Portfolios/Portfolios';
import PortfolioDetail from './pages/PortfolioDetail/PortfolioDetail';
import PortfolioOverview from './pages/PortfolioDetail/sections/Overview';
import PortfolioProjects from './pages/PortfolioDetail/sections/Projects';
import PortfolioSkills from './pages/PortfolioDetail/sections/Skills';
import PortfolioEducation from './pages/PortfolioDetail/sections/Education';
import PortfolioSocial from './pages/PortfolioDetail/sections/Social';
import PortfolioDocuments from './pages/PortfolioDetail/sections/Documents';
import PortfolioVersions from './pages/PortfolioDetail/sections/Versions';
import Profile from './pages/Profile/Profile';
import Analytics from './pages/Analytics/Analytics';
import Resume from './pages/Resume/Resume';
import Activity from './pages/Activity/Activity';
import './styles/global.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
      <div className="spinner-border" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <Layout>{children}</Layout>;
};

// Public Route Component (redirects to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
      <div className="spinner-border" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>;
  }
  
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects"
        element={
          <ProtectedRoute>
            <Projects />
          </ProtectedRoute>
        }
      />
      <Route
        path="/portfolios"
        element={
          <ProtectedRoute>
            <Portfolios />
          </ProtectedRoute>
        }
      />
      <Route
        path="/portfolios/:id"
        element={
          <ProtectedRoute>
            <PortfolioDetail />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<PortfolioOverview />} />
        <Route path="projects" element={<PortfolioProjects />} />
        <Route path="skills" element={<PortfolioSkills />} />
        <Route path="education" element={<PortfolioEducation />} />
        <Route path="social" element={<PortfolioSocial />} />
        <Route path="documents" element={<PortfolioDocuments />} />
        <Route path="versions" element={<PortfolioVersions />} />
      </Route>
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <Analytics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/resume"
        element={
          <ProtectedRoute>
            <Resume />
          </ProtectedRoute>
        }
      />
      <Route
        path="/activity"
        element={
          <ProtectedRoute>
            <Activity />
          </ProtectedRoute>
        }
      />

      {/* Catch all - redirect to dashboard */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  console.log('App render');
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

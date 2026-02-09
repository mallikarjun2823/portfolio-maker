import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './auth';
import { Layout, ProtectedRoute } from './components';
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
import { PERMISSIONS } from './rbac';
import './styles/global.css';

// Loading Component
const LoadingScreen = () => (
  <div style={{ 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    minHeight: '100vh',
    background: 'var(--color-gray-50)'
  }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: '48px',
        height: '48px',
        border: '4px solid var(--color-gray-200)',
        borderTop: '4px solid var(--color-primary-600)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
        margin: '0 auto 16px'
      }}></div>
      <p style={{ color: 'var(--color-gray-600)' }}>Loading...</p>
    </div>
  </div>
);

// Public Route Component (redirects to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

// Protected Layout Wrapper
const ProtectedLayout = ({ children }) => {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
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

      {/* Protected Routes with Layout */}
      <Route
        path="/"
        element={
          <ProtectedLayout>
            <Dashboard />
          </ProtectedLayout>
        }
      />
      <Route
        path="/projects"
        element={
          <ProtectedLayout>
            <Projects />
          </ProtectedLayout>
        }
      />
      <Route
        path="/portfolios"
        element={
          <ProtectedLayout>
            <Portfolios />
          </ProtectedLayout>
        }
      />
      <Route
        path="/portfolios/:id"
        element={
          <ProtectedLayout>
            <PortfolioDetail />
          </ProtectedLayout>
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
          <ProtectedLayout>
            <Profile />
          </ProtectedLayout>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedLayout>
            <Analytics />
          </ProtectedLayout>
        }
      />
      <Route
        path="/resume"
        element={
          <ProtectedLayout>
            <Resume />
          </ProtectedLayout>
        }
      />
      <Route
        path="/activity"
        element={
          <ProtectedLayout>
            <Activity />
          </ProtectedLayout>
        }
      />

      {/* Catch all - redirect to dashboard */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;

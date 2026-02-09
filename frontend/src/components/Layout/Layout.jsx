import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth';
import { portfolioService } from '../../api/services';
import Icon from '../Icon/Icon';
import './Layout.css';

const Layout = ({ children }) => {
  
  const { user, profile, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [myPortfolioId, setMyPortfolioId] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const portfolios = await portfolioService.getPortfolios();
        const mine = portfolios.find(p => p.is_owner);
        if (mounted && mine) setMyPortfolioId(mine.id);
      } catch (e) {
        // ignore
      }
    })();
    const onCreated = (e) => {
      try {
        const id = e?.detail?.id;
        if (id) setMyPortfolioId(id);
      } catch (err) {}
    };
    window.addEventListener('portfolio:created', onCreated);
    return () => { mounted = false; window.removeEventListener('portfolio:created', onCreated); };
  }, []);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const isActive = (path) => {
    const pathname = window.location.pathname || '/';
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: 'dashboard' },
    { path: '/projects', label: 'Projects', icon: 'projects' },
    { path: '/portfolios', label: 'Explore', icon: 'explore' },
    myPortfolioId ? { path: `/portfolios/${myPortfolioId}`, label: 'My Portfolio', icon: 'portfolio' } : null,
    { path: '/profile', label: 'Profile', icon: 'settings' },
    { path: '/analytics', label: 'Analytics', icon: 'analytics' },
    { path: '/resume', label: 'Resume', icon: 'resume' },
    { path: '/activity', label: 'Activity', icon: 'activity' },
  ].filter(Boolean);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const toggleUserMenu = () => setUserMenuOpen(v => !v);

  return (
    <div className="layout-container">
      {/* Sidebar Navigation */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <div className="sidebar-header">
          <Link to="/" className="sidebar-logo">
            <span className="logo-icon">P</span>
            {sidebarOpen && <span className="logo-text">Portfolio Maker</span>}
          </Link>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-nav-item ${isActive(item.path) ? 'active' : ''}`}
              title={item.label}
            >
              <span className="nav-icon">
                <Icon name={item.icon} size={20} />
              </span>
              {sidebarOpen && <span className="nav-label">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button 
            className="sidebar-toggle-btn" 
            onClick={toggleSidebar}
            title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <Icon name={sidebarOpen ? 'chevronLeft' : 'chevronRight'} size={20} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-container">
        {/* Top Header */}
        <header className="top-header">
          <div className="header-left">
            <button className="mobile-menu-btn" onClick={toggleSidebar}>
              <Icon name="menu" size={24} />
            </button>
            <h2 className="page-title">{navItems.find(item => isActive(item.path))?.label || 'Dashboard'}</h2>
          </div>

          <div className="header-right">
            <button
              className="btn btn-primary btn-sm"
              onClick={() => { window.location.href = myPortfolioId ? `/portfolios/${myPortfolioId}` : '/portfolios'; }}
            >
              <Icon name="sparkles" size={16} />
              {myPortfolioId ? 'View Portfolio' : 'Create Portfolio'}
            </button>
            
            <div className={`user-menu ${userMenuOpen ? 'open' : ''}`} onClick={toggleUserMenu} role="button" tabIndex={0}>
              <div className="user-avatar">
                {profile?.avatar ? (
                  <img src={profile.avatar} alt={user?.username} />
                ) : (
                  <div className="avatar-placeholder">
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              <div className="user-info hide-mobile">
                <span className="user-name">{user?.username || 'User'}</span>
              </div>

              <div className={`user-dropdown ${userMenuOpen ? 'show' : ''}`} onClick={(e) => e.stopPropagation()}>
                <Link to="/profile" className="user-dropdown-item">Profile</Link>
                <Link to="/settings" className="user-dropdown-item">Settings</Link>
                <Link to="/analytics" className="user-dropdown-item">Analytics</Link>
                <div className="user-dropdown-divider" />
                <button onClick={handleLogout} className="user-dropdown-item logout">Logout</button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="main-content fade-in">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;

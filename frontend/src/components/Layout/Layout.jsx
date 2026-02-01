import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../../api/services';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const username = authService.getUsername();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/projects', label: 'Projects' },
    { path: '/portfolios', label: 'Portfolios' },
    { path: '/analytics', label: 'Analytics' },
    { path: '/resume', label: 'Resume' },
    { path: '/activity', label: 'Activity' },
  ];

  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-light bg-light">
        <div className="container-fluid">
          <Link to="/" className="navbar-brand">Portfolio Maker</Link>

          <div className="d-flex align-items-center">
            <div className="me-3 d-none d-lg-block">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-link d-inline-block px-2 ${isActive(item.path) ? 'fw-bold' : ''}`}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="d-flex align-items-center">
              {username && <span className="me-2 text-muted">{username}</span>}
              <button onClick={handleLogout} className="btn btn-outline-secondary btn-sm">Logout</button>
              <button
                className="btn btn-link d-lg-none ms-2"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? 'Close' : 'Menu'}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="bg-light px-3 py-2 d-lg-none">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`d-block py-1 ${isActive(item.path) ? 'fw-bold' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <button onClick={handleLogout} className="btn btn-outline-secondary btn-sm mt-2">Logout</button>
          </div>
        )}
      </nav>

      <main className="container py-4">{children}</main>
    </div>
  );
};

export default Layout;

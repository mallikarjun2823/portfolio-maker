import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth';
import { portfolioService } from '../../api/services';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
    return () => { mounted = false; };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/projects', label: 'Projects' },
    { path: '/portfolios', label: 'Explore' },
    { path: '/profile', label: 'Profile' },
    { path: '/analytics', label: 'Analytics' },
    { path: '/resume', label: 'Resume' },
    { path: '/activity', label: 'Activity' },
  ];

  // Insert 'My Portfolio' in nav if user has one
  if (myPortfolioId) {
    // insert after Explore
    navItems.splice(3, 0, { path: `/portfolios/${myPortfolioId}`, label: 'My Portfolio' });
  }

  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-light bg-light">
        <div className="container-fluid">
          <Link to="/" className="navbar-brand">Portfolio Maker</Link>

          <div className="d-flex align-items-center">
            <div className="me-3 d-none d-lg-block d-flex align-items-center">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-link d-inline-block px-2 ${isActive(item.path) ? 'fw-bold' : ''}`}
                >
                  {item.label}
                </Link>
              ))}

              {/* CTA: Create Portfolio if user doesn't have one */}
              {!myPortfolioId && (
                <button className="btn btn-primary btn-sm ms-3" onClick={() => navigate('/portfolios')}>Create Portfolio</button>
              )}
            </div>

            <div className="d-flex align-items-center">
              {user?.username && <span className="me-2 text-muted">{user.username}</span>}
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

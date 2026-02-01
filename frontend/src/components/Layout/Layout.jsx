import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../../api/services';
import styles from './Layout.module.css';

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
    { path: '/', label: 'Dashboard', icon: '🏠' },
    { path: '/projects', label: 'Projects', icon: '📂' },
    { path: '/portfolios', label: 'Portfolios', icon: '🗂️' },
    { path: '/analytics', label: 'Analytics', icon: '📊' },
    { path: '/resume', label: 'Resume', icon: '📄' },
    { path: '/activity', label: 'Activity', icon: '🕒' },
  ];

  return (
    <div className={styles.layout}>
      <nav className={styles.navbar}>
        <div className={styles.navContainer}>
          <Link to="/" className={styles.navBrand}>
            <span className={styles.navLogo}>📁</span>
            <span className={styles.navTitle}>Portfolio Maker</span>
          </Link>

          <div className={styles.navLinks}>
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`${styles.navLink} ${isActive(item.path) ? styles.active : ''}`}
              >
                <span>{item.icon}</span> {item.label}
              </Link>
            ))}
          </div>

          <div className={styles.userSection}>
            {username && <span className={styles.username}>👤 {username}</span>}
            <button onClick={handleLogout} className={styles.logoutButton}>
              Logout
            </button>
          </div>

          <button
            className={styles.mobileMenuButton}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className={styles.mobileNav}>
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`${styles.navLink} ${isActive(item.path) ? styles.active : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span>{item.icon}</span> {item.label}
              </Link>
            ))}
            <button onClick={handleLogout} className={styles.logoutButton} style={{ marginTop: '8px' }}>
              Logout
            </button>
          </div>
        )}
      </nav>

      <main className={styles.main}>{children}</main>
    </div>
  );
};

export default Layout;

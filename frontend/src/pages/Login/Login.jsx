import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth';
import { Button, Icon } from '../../components';
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage';
import { parseFieldErrors } from '../../utils/errorParser';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [nonFieldError, setNonFieldError] = useState(null);
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(null);
    setFieldErrors(prev => ({ ...prev, [e.target.name]: null }));
    setNonFieldError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        await login({
          username: formData.username,
          password: formData.password,
        });
        navigate('/');
      } else {
        await register({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        });
        await login({
          username: formData.username,
          password: formData.password,
        });
        navigate('/');
      }
    } catch (err) {
      console.error('Auth error:', err);
      const parsed = parseFieldErrors(err);
      setFieldErrors(parsed.fieldErrors || {});
      setNonFieldError(parsed.nonField || (err.response?.data?.message || `${isLogin ? 'Login' : 'Registration'} failed. Please try again.`));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Header */}
        <div className="login-header">
          <div className="login-logo">
            <div className="logo-icon-large">P</div>
            <h1 className="login-title">Portfolio Maker</h1>
          </div>
          <div className="login-subtitle">
            <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
            <p>{isLogin ? 'Sign in to manage your portfolio' : 'Start building your professional portfolio'}</p>
          </div>
        </div>

        {/* Error Message */}
        {(error || nonFieldError) && (
          <div className="login-error">
            <ErrorMessage message={nonFieldError || error} />
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username" className="form-label">
              <Icon name="portfolio" size={18} />
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              className={`form-input ${fieldErrors.username ? 'error' : ''}`}
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter your username"
              required
              autoComplete="username"
            />
            {fieldErrors.username && (
              <span className="form-error">{fieldErrors.username}</span>
            )}
          </div>

          {!isLogin && (
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                <Icon name="info" size={18} />
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className={`form-input ${fieldErrors.email ? 'error' : ''}`}
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
                autoComplete="email"
              />
              {fieldErrors.email && (
                <span className="form-error">{fieldErrors.email}</span>
              )}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              <Icon name="lock" size={18} />
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className={`form-input ${fieldErrors.password ? 'error' : ''}`}
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
              autoComplete={isLogin ? 'current-password' : 'new-password'}
            />
            {fieldErrors.password && (
              <span className="form-error">{fieldErrors.password}</span>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            icon={isLogin ? null : 'sparkles'}
          >
            {isLogin ? 'Sign In' : 'Create Account'}
          </Button>
        </form>

        {/* Toggle */}
        <div className="login-toggle">
          <div className="divider">
            <span>OR</span>
          </div>
          <p className="toggle-text">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
            {' '}
            <button
              type="button"
              className="toggle-button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
                setFieldErrors({});
                setNonFieldError(null);
                setFormData({ username: '', email: '', password: '' });
              }}
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="login-footer">
        <p>&copy; 2026 Portfolio Maker. All rights reserved.</p>
      </div>
    </div>
  );
};

export default Login;

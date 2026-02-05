import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth';
import Button from '../../components/Button/Button';
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage';
import { parseFieldErrors } from '../../utils/errorParser';

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
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card">
              <div className="card-body">
                <div className="text-center mb-3">
                  <div className="display-6 text-primary">Portfolio Maker</div>
                  <h3 className="h5 mt-2">{isLogin ? 'Welcome Back' : 'Create Account'}</h3>
                  <p className="text-muted">{isLogin ? 'Sign in to your portfolio' : 'Start building your portfolio'}</p>
                </div>

                {(error || nonFieldError) && <ErrorMessage message={nonFieldError || error} />}

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="username" className="form-label">Username *</label>
                    <input id="username" name="username" type="text" className="form-control" value={formData.username} onChange={handleChange} required autoComplete="username" />
                    {fieldErrors.username && <div className="form-text text-danger">{fieldErrors.username}</div>}
                  </div>

                  {!isLogin && (
                    <div className="mb-3">
                      <label htmlFor="email" className="form-label">Email *</label>
                      <input id="email" name="email" type="email" className="form-control" value={formData.email} onChange={handleChange} required autoComplete="email" />
                      {fieldErrors.email && <div className="form-text text-danger">{fieldErrors.email}</div>}
                    </div>
                  )}

                  <div className="mb-3">
                    <label htmlFor="password" className="form-label">Password *</label>
                    <input id="password" name="password" type="password" className="form-control" value={formData.password} onChange={handleChange} required autoComplete={isLogin ? 'current-password' : 'new-password'} />
                    {fieldErrors.password && <div className="form-text text-danger">{fieldErrors.password}</div>}
                  </div>

                  <div className="d-grid mb-3">
                    <Button type="submit" fullWidth disabled={loading}>{loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}</Button>
                  </div>
                </form>

                <div className="text-center my-2">OR</div>

                <p className="text-center">
                  {isLogin ? "Don't have an account? " : 'Already have an account? '}
                  <button className="btn btn-link p-0" onClick={() => { setIsLogin(!isLogin); setError(null); setFormData({ username: '', email: '', password: '' }); }}>
                    {isLogin ? 'Sign Up' : 'Sign In'}
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
};

export default Login;

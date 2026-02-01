import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../api/services';
import Button from '../../components/Button/Button';
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage';

const Login = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

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

                {error && <ErrorMessage message={error} />}

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="username" className="form-label">Username</label>
                    <input id="username" name="username" type="text" className="form-control" value={formData.username} onChange={handleChange} required autoComplete="username" />
                  </div>

                  {!isLogin && (
                    <div className="mb-3">
                      <label htmlFor="email" className="form-label">Email</label>
                      <input id="email" name="email" type="email" className="form-control" value={formData.email} onChange={handleChange} required autoComplete="email" />
                    </div>
                  )}

                  <div className="mb-3">
                    <label htmlFor="password" className="form-label">Password</label>
                    <input id="password" name="password" type="password" className="form-control" value={formData.password} onChange={handleChange} required autoComplete={isLogin ? 'current-password' : 'new-password'} />
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
          </div>

          <Button
            type="submit"
            fullWidth
            disabled={loading}
            className={styles.submitButton}
          >
            {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
          </Button>
        </form>

        <div className={styles.divider}>
          <span className={styles.dividerText}>OR</span>
        </div>

        <p className={styles.toggleText}>
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <span
            className={styles.toggleLink}
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
              setFormData({ username: '', email: '', password: '' });
            }}
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;

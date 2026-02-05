import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { portfolioService } from '../../api/services';
import { parseFieldErrors } from '../../utils/errorParser';

const Portfolios = () => {
  const navigate = useNavigate();
  const [portfolios, setPortfolios] = useState([]); // other people's portfolios
  const [myPortfolio, setMyPortfolio] = useState(null); // current user's portfolio
  const [hasPortfolio, setHasPortfolio] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({ title: '', summary: '', status: 'DRAFT' });
  const [creating, setCreating] = useState(false);
  const [portfolioFieldErrors, setPortfolioFieldErrors] = useState({});
  const [portfolioNonFieldError, setPortfolioNonFieldError] = useState(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const data = await portfolioService.getPortfolios();
      const my = (data || []).find(p => p.is_owner) || null;
      const others = (data || []).filter(p => !p.is_owner);
      setMyPortfolio(my);
      setPortfolios(others);
      // determine if current user already has a portfolio
      setHasPortfolio(!!my);
    } catch (e) {
      setError('Failed to load portfolios');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setCreating(true);
      setPortfolioFieldErrors({});
      setPortfolioNonFieldError(null);
      const created = await portfolioService.createPortfolio(form);
      navigate('/');
    } catch (err) {
      console.error('Create portfolio error:', err);
      const parsed = parseFieldErrors(err);
      setPortfolioFieldErrors(parsed.fieldErrors || {});
      setPortfolioNonFieldError(parsed.nonField || 'Failed to create portfolio');
    } finally {
      setCreating(false);
    }
  };

  

  if (loading) return <div className="p-4 text-center"><div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div></div>;

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h4 mb-0">Portfolios</h1>
        {!hasPortfolio && (
          <button className="btn btn-outline-primary" onClick={() => window.scrollTo(0, document.body.scrollHeight)}>Create New</button>
        )}
      </div>

      {/* Show current user's portfolio separately */}
      {myPortfolio && (
        <div className="mb-3">
          <div className="card">
            <div className="card-body d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0">My Portfolio: {myPortfolio.title}</h5>
                <p className="mb-0 small text-muted">{myPortfolio.summary}</p>
              </div>
              <div className="d-flex gap-2">
                <button className="btn btn-outline-primary btn-sm" onClick={() => navigate(`/portfolios/${myPortfolio.id}`)}>Open</button>
                <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate('/profile')}>Edit</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Other portfolios list */}
      {portfolios.length === 0 ? (
        <div className="card">
          <div className="card-body">
            <h5 className="card-title">No portfolios yet</h5>
            <p className="card-text text-muted">No public portfolios found.</p>
            {!hasPortfolio && (
              <button className="btn btn-primary" onClick={() => window.scrollTo(0, document.body.scrollHeight)}>Create Portfolio</button>
            )}
          </div>
        </div>
      ) : (
        <div className="row g-3">
          {portfolios.map(p => (
            <div className="col-md-6" key={p.id}>
              <div className="card">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <h5 className="mb-1">{p.title}</h5>
                      <div className="text-muted">{p.summary}</div>
                    </div>
                  </div>
                  <div className="d-flex gap-2">
                    <button className="btn btn-sm btn-outline-primary" onClick={() => navigate(`/portfolios/${p.id}`)}>Open</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Only show create form when the current user doesn't already have a portfolio */}
      {!hasPortfolio && (
        <div className="mt-4">
          <div className="card">
            <div className="card-body">
              <h5>Create Portfolio</h5>
            {error && <div className="alert alert-danger">{error}</div>}
            {portfolioNonFieldError && <div className="alert alert-danger">{portfolioNonFieldError}</div>}
            <form onSubmit={handleCreate} className="row g-3">
              <div className="col-12">
                <label className="form-label">Title *</label>
                <input name="title" className="form-control" placeholder="Title" value={form.title} onChange={(e) => { setForm({ ...form, title: e.target.value }); setPortfolioFieldErrors(prev => ({ ...prev, title: null })); setPortfolioNonFieldError(null); }} required />
                {portfolioFieldErrors.title && <div className="form-text text-danger">{portfolioFieldErrors.title}</div>}
              </div>
              <div className="col-12">
                <label className="form-label">Short Summary *</label>
                <textarea name="summary" className="form-control" placeholder="Short summary" value={form.summary} onChange={(e) => { setForm({ ...form, summary: e.target.value }); setPortfolioFieldErrors(prev => ({ ...prev, summary: null })); setPortfolioNonFieldError(null); }} rows={4} required />
                {portfolioFieldErrors.summary && <div className="form-text text-danger">{portfolioFieldErrors.summary}</div>}
              </div>
              <div className="col-md-4">
                <select name="status" className="form-select" value={form.status} onChange={handleChange}>
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                </select>
              </div>
              <div className="col-12 d-flex gap-2">
                <button type="submit" className="btn btn-primary" disabled={creating}>{creating ? 'Creating…' : 'Create Portfolio'}</button>
                <button type="button" className="btn btn-outline-secondary" onClick={() => setForm({ title: '', summary: '', status: 'DRAFT' })}>Reset</button>
              </div>
            </form>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};

export default Portfolios;

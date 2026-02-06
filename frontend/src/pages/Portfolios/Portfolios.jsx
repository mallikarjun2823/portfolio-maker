import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { portfolioService } from '../../api/services';
import { parseFieldErrors } from '../../utils/errorParser';

const Portfolios = () => {
  const navigate = useNavigate();
  const [hasPortfolio, setHasPortfolio] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({ title: '', summary: '', status: 'DRAFT' });
  const [creating, setCreating] = useState(false);
  const [portfolioFieldErrors, setPortfolioFieldErrors] = useState({});
  const [portfolioNonFieldError, setPortfolioNonFieldError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await portfolioService.getPortfolios();
        const my = (data || []).find(p => p.is_owner) || null;
        if (mounted) setHasPortfolio(!!my);
      } catch (e) {
        if (mounted) setError('Failed to load portfolio info');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setCreating(true);
      setPortfolioFieldErrors({});
      setPortfolioNonFieldError(null);
      const created = await portfolioService.createPortfolio(form);
      // notify top-level layout so header button updates to 'View Portfolio'
      try { window.dispatchEvent(new CustomEvent('portfolio:created', { detail: created })); } catch (e) {}
      navigate(`/portfolios/${created.id}`);
    } catch (err) {
      const parsed = parseFieldErrors(err);
      setPortfolioFieldErrors(parsed.fieldErrors || {});
      setPortfolioNonFieldError(parsed.nonField || 'Failed to create portfolio');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h4 mb-0">Explore</h1>
        <Link to="/projects" className="text-primary">Browse Projects →</Link>
      </div>


      {loading ? (
        <div className="p-4 text-center">
          <div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div>
        </div>
      ) : (
        !hasPortfolio && (
          <div className="card">
            <div className="card-body">
              <h5>Create Portfolio</h5>
              {error && <div className="alert alert-danger">{error}</div>}
              {portfolioNonFieldError && <div className="alert alert-danger">{portfolioNonFieldError}</div>}
              <form onSubmit={handleCreate} className="row g-3 mt-2">
                <div className="col-12">
                  <label className="form-label">Title *</label>
                  <input name="title" className="form-control" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                  {portfolioFieldErrors.title && <div className="form-text text-danger">{portfolioFieldErrors.title}</div>}
                </div>
                <div className="col-12">
                  <label className="form-label">Short Summary *</label>
                  <textarea name="summary" className="form-control" placeholder="Short summary" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} rows={4} required />
                  {portfolioFieldErrors.summary && <div className="form-text text-danger">{portfolioFieldErrors.summary}</div>}
                </div>
                <div className="col-md-4">
                  <select name="status" className="form-select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
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
        )
      )}
    </div>
  );
};

export default Portfolios;

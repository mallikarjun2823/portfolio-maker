import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { portfolioService } from '../../api/services';

const Portfolios = () => {
  const navigate = useNavigate();
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({ title: '', summary: '', status: 'draft' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const data = await portfolioService.getPortfolios();
      setPortfolios(data || []);
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
      const created = await portfolioService.createPortfolio(form);
      // navigate to dashboard (will pick up first portfolio)
      navigate('/');
    } catch (err) {
      setError('Failed to create portfolio');
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <div className="p-4 text-center"><div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div></div>;

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h4 mb-0">Portfolios</h1>
        <button className="btn btn-outline-primary" onClick={() => window.scrollTo(0, document.body.scrollHeight)}>Create New</button>
      </div>

      {portfolios.length === 0 ? (
        <div className="card">
          <div className="card-body">
            <h5 className="card-title">No portfolios yet</h5>
            <p className="card-text text-muted">Create your first portfolio to get started.</p>
            <button className="btn btn-primary" onClick={() => window.scrollTo(0, document.body.scrollHeight)}>Create Portfolio</button>
          </div>
        </div>
      ) : (
        <div className="row g-3">
          {portfolios.map(p => (
            <div className="col-md-6" key={p.id}>
              <div className="card">
                <div className="card-body d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="mb-1">{p.title}</h5>
                    <div className="text-muted">{p.summary}</div>
                  </div>
                  <div>
                    <button className="btn btn-sm btn-outline-primary" onClick={() => navigate('/')}>Open</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4">
        <div className="card">
          <div className="card-body">
            <h5>Create Portfolio</h5>
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={handleCreate} className="row g-3">
              <div className="col-12">
                <input name="title" className="form-control" placeholder="Title" value={form.title} onChange={handleChange} required />
              </div>
              <div className="col-12">
                <textarea name="summary" className="form-control" placeholder="Short summary" value={form.summary} onChange={handleChange} rows={4} />
              </div>
              <div className="col-md-4">
                <select name="status" className="form-select" value={form.status} onChange={handleChange}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
              <div className="col-12 d-flex gap-2">
                <button type="submit" className="btn btn-primary" disabled={creating}>{creating ? 'Creating…' : 'Create Portfolio'}</button>
                <button type="button" className="btn btn-outline-secondary" onClick={() => setForm({ title: '', summary: '', status: 'draft' })}>Reset</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Portfolios;

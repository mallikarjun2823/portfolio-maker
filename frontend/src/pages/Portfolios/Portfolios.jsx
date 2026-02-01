import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { portfolioService } from '../../api/services';
import Card from '../../components/Card/Card';
import Button from '../../components/Button/Button';
import LoadingSkeleton from '../../components/LoadingSkeleton/LoadingSkeleton';
import EmptyState from '../../components/EmptyState/EmptyState';
import styles from './Portfolios.module.css';

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

  if (loading) return <div style={{ padding: 24 }}><LoadingSkeleton type="title" count={1} /></div>;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <h1>Portfolios</h1>
        <Button onClick={() => window.scrollTo(0, document.body.scrollHeight)}>Create New</Button>
      </div>

      {portfolios.length === 0 ? (
        <EmptyState
          icon="📁"
          title="No portfolios yet"
          description="Create your first portfolio to get started."
        />
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {portfolios.map(p => (
            <Card key={p.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0 }}>{p.title}</h3>
                  <div style={{ color: '#6b7280' }}>{p.summary}</div>
                </div>
                <div>
                  <Button onClick={() => navigate('/')}>Open</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div style={{ marginTop: 32 }}>
        <Card>
          <h2>Create Portfolio</h2>
          {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
          <form onSubmit={handleCreate} style={{ display: 'grid', gap: 8 }}>
            <input name="title" placeholder="Title" value={form.title} onChange={handleChange} required />
            <textarea name="summary" placeholder="Short summary" value={form.summary} onChange={handleChange} rows={4} />
            <select name="status" value={form.status} onChange={handleChange}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button type="submit" disabled={creating}>{creating ? 'Creating…' : 'Create Portfolio'}</Button>
              <Button type="button" onClick={() => setForm({ title: '', summary: '', status: 'draft' })}>Reset</Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Portfolios;

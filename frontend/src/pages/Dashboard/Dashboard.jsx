import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { portfolioService, projectService, skillService } from '../../api/services';

const Dashboard = () => {
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState(null);
  const [stats, setStats] = useState({ projects: 0, skills: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch portfolios
      const portfolios = await portfolioService.getPortfolios();
      
      if (portfolios.length > 0) {
        const userPortfolio = portfolios[0];
        setPortfolio(userPortfolio);

        // Fetch stats in parallel
        const [projects, skills] = await Promise.all([
          projectService.getProjects(userPortfolio.id),
          skillService.getSkills(userPortfolio.id),
        ]);

        setStats({
          projects: projects.length,
          skills: skills.length,
        });
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger" role="alert">
          <strong>Dashboard Error:</strong> {error}
        </div>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="container py-4">
        <div className="card">
          <div className="card-body">
            <h1 className="card-title">Welcome to Portfolio Maker</h1>
            <p className="card-text">You don't have a portfolio yet. Create one to get started.</p>
            <button className="btn btn-primary" onClick={() => navigate('/portfolios')}>Create Portfolio</button>
          </div>
        </div>
      </div>
    );
  }

  const actions = [
    {
      title: 'View Projects',
      description: 'Explore and manage your portfolio projects',
      path: '/projects',
    },
    {
      title: 'View Analytics',
      description: 'Insights and metrics about your portfolio',
      path: '/analytics',
    },
    {
      title: 'Resume Preview',
      description: 'Generate and preview your resume',
      path: '/resume',
    },
    {
      title: 'Activity Timeline',
      description: 'View your portfolio history and changes',
      path: '/activity',
    },
  ];

  return (
    <div className="container py-4">
      <div className="mb-4">
        <h1 className="h3">{portfolio.title}</h1>
        <p className="text-muted">{portfolio.summary}</p>
      </div>

      <div className="row mb-4">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h6 className="card-subtitle mb-2 text-muted">Portfolio Status</h6>
              <span className={`badge ${portfolio.status === 'PUBLISHED' ? 'bg-success' : 'bg-secondary'}`}>{portfolio.status}</span>
              <div className="text-muted mt-2">Last updated: {formatDate(portfolio.updated_at)}</div>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="row">
            <div className="col-6">
              <div className="card text-center">
                <div className="card-body">
                  <div className="h4 mb-0">{stats.projects}</div>
                  <small className="text-muted">Projects</small>
                </div>
              </div>
            </div>
            <div className="col-6">
              <div className="card text-center">
                <div className="card-body">
                  <div className="h4 mb-0">{stats.skills}</div>
                  <small className="text-muted">Skills</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        {actions.map((action, index) => (
          <div className="col-md-3 mb-3" key={index}>
            <div className="card h-100" onClick={() => navigate(action.path)} style={{ cursor: 'pointer' }}>
              <div className="card-body">
                <h5 className="card-title">{action.title}</h5>
                <p className="card-text text-muted">{action.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;

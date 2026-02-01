import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { portfolioService, projectService, skillService } from '../../api/services';
import Card from '../../components/Card/Card';
import Badge from '../../components/Badge/Badge';
import Button from '../../components/Button/Button';
import LoadingSkeleton from '../../components/LoadingSkeleton/LoadingSkeleton';
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage';
import styles from './Dashboard.module.css';

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
      <div className={styles.dashboard}>
        <div className={styles.header}>
          <LoadingSkeleton type="title" count={1} />
          <LoadingSkeleton type="text" count={1} />
        </div>
        <LoadingSkeleton type="card" count={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.dashboard}>
        <ErrorMessage title="Dashboard Error" message={error} />
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.header}>
          <h1 className={styles.title}>Welcome to Portfolio Maker</h1>
          <p className={styles.subtitle}>You don't have a portfolio yet. Create one to get started.</p>
          <div style={{ marginTop: 18 }}>
            <Button onClick={() => navigate('/portfolios')}>Create Portfolio</Button>
          </div>
        </div>
      </div>
    );
  }

  const actions = [
    {
      icon: '📂',
      title: 'View Projects',
      description: 'Explore and manage your portfolio projects',
      path: '/projects',
    },
    {
      icon: '📊',
      title: 'View Analytics',
      description: 'Insights and metrics about your portfolio',
      path: '/analytics',
    },
    {
      icon: '📄',
      title: 'Resume Preview',
      description: 'Generate and preview your resume',
      path: '/resume',
    },
    {
      icon: '🕒',
      title: 'Activity Timeline',
      description: 'View your portfolio history and changes',
      path: '/activity',
    },
  ];

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h1 className={styles.title}>{portfolio.title}</h1>
        <p className={styles.subtitle}>{portfolio.summary}</p>
      </div>

      {/* Status Section */}
      <div className={styles.statusSection}>
        <Card>
          <div className={styles.statusCard}>
            <div className={styles.statusInfo}>
              <span className={styles.statusLabel}>Portfolio Status</span>
              <div className={styles.statusValue}>
                <Badge status={portfolio.status} />
              </div>
              <div className={styles.timestamp}>
                Last updated: {formatDate(portfolio.updated_at)}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <div className={styles.statValue}>{stats.projects}</div>
          <div className={styles.statLabel}>Projects</div>
        </Card>
        <Card className={styles.statCard}>
          <div className={styles.statValue}>{stats.skills}</div>
          <div className={styles.statLabel}>Skills</div>
        </Card>
      </div>

      {/* Action Cards */}
      <div className={styles.actionsGrid}>
        {actions.map((action, index) => (
          <Card key={index} onClick={() => navigate(action.path)}>
            <div className={styles.actionCard}>
              <div className={styles.actionIcon}>{action.icon}</div>
              <h3 className={styles.actionTitle}>{action.title}</h3>
              <p className={styles.actionDescription}>{action.description}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;

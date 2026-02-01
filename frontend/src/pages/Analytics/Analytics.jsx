import React, { useState, useEffect } from 'react';
import { analyticsService, portfolioService } from '../../api/services';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Button from '../../components/Button/Button';
import LoadingSkeleton from '../../components/LoadingSkeleton/LoadingSkeleton';
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage';
import EmptyState from '../../components/EmptyState/EmptyState';

const Analytics = () => {
  const [portfolio, setPortfolio] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Date range state - default to last 30 days
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  useEffect(() => {
    loadPortfolio();
  }, []);

  useEffect(() => {
    if (portfolio) {
      loadAnalytics();
    }
  }, [portfolio, startDate, endDate]);

  const loadPortfolio = async () => {
    try {
      const portfolios = await portfolioService.getPortfolios();
      if (portfolios.length > 0) {
        setPortfolio(portfolios[0]);
      }
    } catch (err) {
      console.error('Error loading portfolio:', err);
      setError('Failed to load portfolio');
    }
  };

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        start_date: startDate,
        end_date: endDate,
        group_by: 'day',
        metrics: ['count'],
        entity_type: 'project',
        entity_ids: [portfolio.id],
      };

      const data = await analyticsService.getAnalytics(params);
      setAnalyticsData(data);
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError(err.response?.data?.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const formatChartData = () => {
    if (!analyticsData?.data) return [];
    
    return analyticsData.data.map((item) => ({
      date: new Date(item.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      count: item.count || 0,
    }));
  };

  if (loading && !analyticsData) {
    return (
      <div className="p-4 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-4">
        <ErrorMessage title="Analytics Error" message={error} />
      </div>
    );
  }

  const chartData = formatChartData();

  return (
    <div className="container py-4">
      <div className="mb-3">
        <h1 className="h4">Analytics</h1>
        <p className="text-muted">Insights and metrics about your portfolio activity</p>
      </div>

      <div className="row g-3 align-items-end mb-3">
        <div className="col-auto">
          <label className="form-label">Start Date</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="form-control" max={endDate} />
        </div>
        <div className="col-auto">
          <label className="form-label">End Date</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="form-control" min={startDate} max={new Date().toISOString().split('T')[0]} />
        </div>
        <div className="col-auto">
          <Button onClick={loadAnalytics} variant="secondary">Refresh</Button>
        </div>
      </div>

      <div className="mb-4">
        <h2 className="h5">Project Activity Over Time</h2>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} name="Projects" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState icon={null} title="No Data Available" description="No analytics data for the selected date range" />
        )}
      </div>

      <div>
        <h2 className="h5">Activity Distribution</h2>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#2563eb" name="Activity Count" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState icon={null} title="No Data Available" description="No analytics data for the selected date range" />
        )}
      </div>
    </div>
  );
};

export default Analytics;

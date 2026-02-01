import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPortfolios } from '../api'

export default function PortfolioDashboard() {
  const [portfolio, setPortfolio] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    getPortfolios()
      .then(res => {
        const portfolios = res.data
        setPortfolio(portfolios[0] || null)
      })
      .catch(err => setError(err.message || 'Failed to load portfolio'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading">Loading...</div>
  if (error) return <div className="error">Error: {error}</div>
  if (!portfolio) return <div className="error">No portfolio found</div>

  return (
    <div className="dashboard">
      <h1>{portfolio.title || 'My Portfolio'}</h1>
      
      <div className="portfolio-meta">
        <p><strong>Status:</strong> {portfolio.status}</p>
        <p><strong>Last Updated:</strong> {new Date(portfolio.updated_at).toLocaleString()}</p>
      </div>

      <div className="action-buttons">
        <button onClick={() => navigate('/projects')}>View Projects</button>
        <button onClick={() => navigate('/analytics')}>View Analytics</button>
        <button onClick={() => navigate('/resume')}>Resume Preview</button>
        <button onClick={() => navigate('/activities')}>Activity Timeline</button>
      </div>
    </div>
  )
}

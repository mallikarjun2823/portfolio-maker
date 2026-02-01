import React, { useEffect, useState } from 'react'
import { getAnalytics } from '../api'

export default function Analytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const fetchAnalytics = () => {
    setLoading(true)
    const params = {}
    if (startDate) params.start_date = startDate
    if (endDate) params.end_date = endDate

    getAnalytics(params)
      .then(res => setData(res.data))
      .catch(err => setError(err.message || 'Failed to load analytics'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const handleApply = () => {
    fetchAnalytics()
  }

  if (loading) return <div className="loading">Loading...</div>
  if (error) return <div className="error">Error: {error}</div>

  return (
    <div className="analytics-screen">
      <h1>Analytics</h1>

      <div className="date-picker">
        <label>
          Start Date:
          <input 
            type="date" 
            value={startDate} 
            onChange={e => setStartDate(e.target.value)} 
          />
        </label>
        <label>
          End Date:
          <input 
            type="date" 
            value={endDate} 
            onChange={e => setEndDate(e.target.value)} 
          />
        </label>
        <button onClick={handleApply}>Apply</button>
      </div>

      {data && (
        <div className="charts">
          <div className="chart">
            <h3>Profile Views</h3>
            <p className="metric">{data.profile_views || 0}</p>
          </div>
          <div className="chart">
            <h3>Total Projects</h3>
            <p className="metric">{data.total_projects || 0}</p>
          </div>
        </div>
      )}
    </div>
  )
}

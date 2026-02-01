import React, { useEffect, useState } from 'react'
import { getActivities } from '../api'

export default function ActivityTimeline() {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  useEffect(() => {
    setLoading(true)
    getActivities({ page })
      .then(res => {
        setActivities(res.data.results || [])
        setHasMore(!!res.data.next)
      })
      .catch(err => setError(err.message || 'Failed to load activities'))
      .finally(() => setLoading(false))
  }, [page])

  if (loading) return <div className="loading">Loading...</div>
  if (error) return <div className="error">Error: {error}</div>

  return (
    <div className="activity-screen">
      <h1>Activity Timeline</h1>

      <div className="timeline">
        {activities.length === 0 ? (
          <p>No activities found</p>
        ) : (
          activities.map(activity => (
            <div key={activity.id} className="activity-item">
              <div className="activity-time">
                {new Date(activity.timestamp).toLocaleString()}
              </div>
              <div className="activity-content">
                <strong>{activity.action}</strong>
                <p>{activity.description}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="pagination">
        <button onClick={() => setPage(p => p - 1)} disabled={page === 1}>
          Previous
        </button>
        <span>Page {page}</span>
        <button onClick={() => setPage(p => p + 1)} disabled={!hasMore}>
          Next
        </button>
      </div>
    </div>
  )
}

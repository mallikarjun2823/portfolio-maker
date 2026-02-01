import React, { useEffect, useState } from 'react'
import { getProjects } from '../api'

export default function ProjectsSkills() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [sorting, setSorting] = useState('-created_at') // newest first
  const [hasMore, setHasMore] = useState(false)

  const portfolioId = 1 // Assuming first portfolio

  useEffect(() => {
    setLoading(true)
    getProjects(portfolioId, { page, ordering: sorting })
      .then(res => {
        setProjects(res.data.results || [])
        setHasMore(!!res.data.next)
      })
      .catch(err => setError(err.message || 'Failed to load projects'))
      .finally(() => setLoading(false))
  }, [page, sorting])

  const handleSortChange = (e) => {
    setSorting(e.target.value)
    setPage(1)
  }

  if (loading) return <div className="loading">Loading...</div>
  if (error) return <div className="error">Error: {error}</div>

  return (
    <div className="projects-screen">
      <h1>Projects & Skills</h1>

      <div className="controls">
        <label>
          Sort by:
          <select value={sorting} onChange={handleSortChange}>
            <option value="-created_at">Newest First</option>
            <option value="created_at">Oldest First</option>
          </select>
        </label>
      </div>

      <div className="projects-list">
        {projects.length === 0 ? (
          <p>No projects found</p>
        ) : (
          projects.map(project => (
            <div key={project.id} className="project-card">
              <h3>{project.title}</h3>
              <p>{project.description}</p>
              {project.skills && project.skills.length > 0 && (
                <div className="skills">
                  <strong>Skills:</strong> {project.skills.map(s => s.name).join(', ')}
                </div>
              )}
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

import React, { useEffect, useState } from 'react'
import { getResumes, generateResume, downloadResume } from '../api'

export default function ResumePreview() {
  const [resumes, setResumes] = useState([])
  const [selectedTemplate, setSelectedTemplate] = useState('classic')
  const [currentResume, setCurrentResume] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const portfolioId = 1 // Assuming first portfolio
  const templates = ['classic', 'modern', 'minimal']

  useEffect(() => {
    loadResumes()
  }, [])

  const loadResumes = () => {
    setLoading(true)
    getResumes(portfolioId)
      .then(res => {
        const docs = res.data.results || []
        setResumes(docs)
        if (docs.length > 0) setCurrentResume(docs[0])
      })
      .catch(err => setError(err.message || 'Failed to load resumes'))
      .finally(() => setLoading(false))
  }

  const handleGenerate = () => {
    setLoading(true)
    setError(null)
    generateResume(portfolioId, selectedTemplate)
      .then(res => {
        setCurrentResume(res.data)
        loadResumes()
      })
      .catch(err => setError(err.message || 'Failed to generate resume'))
      .finally(() => setLoading(false))
  }

  const handleDownload = () => {
    if (!currentResume) return
    downloadResume(portfolioId, currentResume.id)
      .then(res => {
        const url = window.URL.createObjectURL(new Blob([res.data]))
        const link = document.createElement('a')
        link.href = url
        link.download = `resume_${currentResume.id}.pdf`
        link.click()
      })
      .catch(err => setError(err.message || 'Failed to download'))
  }

  if (loading) return <div className="loading">Loading...</div>
  if (error) return <div className="error">Error: {error}</div>

  return (
    <div className="resume-screen">
      <h1>Resume Preview</h1>

      <div className="controls">
        <label>
          Template:
          <select value={selectedTemplate} onChange={e => setSelectedTemplate(e.target.value)}>
            {templates.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>
        <button onClick={handleGenerate}>Generate Resume</button>
        <button onClick={handleDownload} disabled={!currentResume}>
          Download Resume
        </button>
      </div>

      {currentResume && (
        <div className="resume-preview">
          <h3>{currentResume.title || 'Resume'}</h3>
          <div className="preview-content">
            {currentResume.content || 'Resume content will appear here'}
          </div>
        </div>
      )}
    </div>
  )
}

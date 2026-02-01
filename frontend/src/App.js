import React from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import PortfolioDashboard from './components/PortfolioDashboard'
import ProjectsSkills from './components/ProjectsSkills'
import Analytics from './components/Analytics'
import ResumePreview from './components/ResumePreview'
import ActivityTimeline from './components/ActivityTimeline'
import './App.css'

export default function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <nav className="navbar">
          <h2>Portfolio Manager</h2>
          <div className="nav-links">
            <Link to="/">Dashboard</Link>
            <Link to="/projects">Projects</Link>
            <Link to="/analytics">Analytics</Link>
            <Link to="/resume">Resume</Link>
            <Link to="/activities">Activities</Link>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<PortfolioDashboard />} />
            <Route path="/projects" element={<ProjectsSkills />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/resume" element={<ResumePreview />} />
            <Route path="/activities" element={<ActivityTimeline />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

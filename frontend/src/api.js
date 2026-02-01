import axios from 'axios'

const API_BASE = '/api'
const token = localStorage.getItem('authToken')

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  }
})

// Portfolio APIs
export const getPortfolios = () => api.get('/portfolios/')
export const getPortfolio = (id) => api.get(`/portfolios/${id}/`)

// Projects APIs
export const getProjects = (portfolioId, params = {}) => 
  api.get(`/portfolios/${portfolioId}/projects/`, { params })

// Skills APIs
export const getSkills = (portfolioId) => 
  api.get(`/portfolios/${portfolioId}/skills/`)

// Analytics APIs
export const getAnalytics = (params = {}) => 
  api.get('/analytics/', { params })

// Resume/Document APIs
export const getResumes = (portfolioId) => 
  api.get(`/portfolios/${portfolioId}/documents/`)

export const generateResume = (portfolioId, template) => 
  api.post(`/portfolios/${portfolioId}/documents/generate/`, { template })

export const downloadResume = (portfolioId, docId) => 
  api.get(`/portfolios/${portfolioId}/documents/${docId}/download/`, { 
    responseType: 'blob' 
  })

// Activity APIs
export const getActivities = (params = {}) => 
  api.get('/activities/', { params })

export default api

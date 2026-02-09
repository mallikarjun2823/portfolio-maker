import React, { useState, useEffect } from 'react';
 
import {
  portfolioService,
  projectService,
  skillService,
  educationService,
  socialLinkService,
  documentService,
  versionService
} from '../../api/services';
import { RequirePermission } from '../../auth';
import { PERMISSIONS } from '../../rbac';
import Card from '../../components/Card/Card';
import { parseFieldErrors } from '../../utils/errorParser';

const Dashboard = () => {
  
  
  // Data states
  const [portfolio, setPortfolio] = useState(null);
  const [projects, setProjects] = useState([]);
  const [skills, setSkills] = useState([]);
  const [education, setEducation] = useState([]);
  const [socialLinks, setSocialLinks] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [versions, setVersions] = useState([]);
  const [otherPortfolios, setOtherPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Active section
  const [activeSection, setActiveSection] = useState('overview');
  
  // Modal states
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [showEducationModal, setShowEducationModal] = useState(false);
  const [showSocialLinkModal, setShowSocialLinkModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [showPortfolioEditModal, setShowPortfolioEditModal] = useState(false);
  
  // Edit states
  const [editingProject, setEditingProject] = useState(null);
  const [editingSkill, setEditingSkill] = useState(null);
  const [editingEducation, setEditingEducation] = useState(null);
  const [editingSocialLink, setEditingSocialLink] = useState(null);
  
  // Form states
  const [portfolioForm, setPortfolioForm] = useState({ title: '', summary: '', status: 'DRAFT' });
  const [projectForm, setProjectForm] = useState({ title: '', description: '', tech_stack: '', project_url: '', status: 'DRAFT' });
  const [skillForm, setSkillForm] = useState({ name: '', proficiency_level: 'BEGINNER', years_of_experience: 0, skill_certification: '', status: 'DRAFT' });
  const [educationForm, setEducationForm] = useState({ institution: '', degree: '', start_year: new Date().getFullYear(), end_year: '', status: 'DRAFT' });
  const [socialLinkForm, setSocialLinkForm] = useState({ platform: '', url: '', status: 'DRAFT' });
  const [documentForm, setDocumentForm] = useState({ file: null, doc_type: 'resume' });
  const [versionForm, setVersionForm] = useState({ change_note: '', is_draft: false });
  
  // Error states
  const [portfolioFieldErrors, setPortfolioFieldErrors] = useState({});
  const [portfolioNonFieldError, setPortfolioNonFieldError] = useState(null);
  const [projectFieldErrors, setProjectFieldErrors] = useState({});
  const [projectNonFieldError, setProjectNonFieldError] = useState(null);
  const [skillFieldErrors, setSkillFieldErrors] = useState({});
  const [skillNonFieldError, setSkillNonFieldError] = useState(null);
  const [educationFieldErrors, setEducationFieldErrors] = useState({});
  const [educationNonFieldError, setEducationNonFieldError] = useState(null);
  const [socialLinkFieldErrors, setSocialLinkFieldErrors] = useState({});
  const [socialLinkNonFieldError, setSocialLinkNonFieldError] = useState(null);
  const [documentError, setDocumentError] = useState(null);
  const [versionError, setVersionError] = useState(null);
  
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);

          const portfolios = await portfolioService.getPortfolios();
      
      // Separate the current user's portfolio (if any) from other portfolios
      const userPortfolio = portfolios.find(p => p.is_owner) || null;
      const others = portfolios.filter(p => !(p.is_owner));
      setPortfolio(userPortfolio);
      setOtherPortfolios(others);

      // If user has a portfolio, fetch its related data
      if (userPortfolio) {
        setPortfolioForm({ title: userPortfolio.title, summary: userPortfolio.summary, status: userPortfolio.status });

        const [
          projectsData,
          skillsData,
          educationData,
          socialLinksData,
          documentsData,
          versionsData
        ] = await Promise.all([
          projectService.getProjects(userPortfolio.id).catch(() => []),
          skillService.getSkills(userPortfolio.id).catch(() => []),
          educationService.getEducation(userPortfolio.id).catch(() => []),
          socialLinkService.getSocialLinks(userPortfolio.id).catch(() => []),
          documentService.getDocuments(userPortfolio.id).catch(() => []),
          versionService.getVersions(userPortfolio.id).catch(() => [])
        ]);

        setProjects(projectsData);
        setSkills(skillsData);
        setEducation(educationData);
        setSocialLinks(socialLinksData);
        setDocuments(documentsData);
        setVersions(versionsData);
      } else {
        // No user portfolio — clear per-portfolio data
        setProjects([]);
        setSkills([]);
        setEducation([]);
        setSocialLinks([]);
        setDocuments([]);
        setVersions([]);
      }
    } catch (err) {
      console.error('Error loading portfolio:', err);
      setError('Failed to load portfolio data');
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

  // Portfolio handlers
  const handlePortfolioUpdate = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setPortfolioFieldErrors({});
      setPortfolioNonFieldError(null);
      await portfolioService.updatePortfolio(portfolio.id, portfolioForm);
      await loadAllData();
      setShowPortfolioEditModal(false);
    } catch (err) {
      const parsed = parseFieldErrors(err);
      setPortfolioFieldErrors(parsed.fieldErrors || {});
      setPortfolioNonFieldError(parsed.nonField || 'Failed to update portfolio');
    } finally {
      setSubmitting(false);
    }
  };

  // Project handlers
  const handleProjectSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setProjectFieldErrors({});
      setProjectNonFieldError(null);
      if (editingProject) {
        await projectService.updateProject(portfolio.id, editingProject.id, projectForm);
      } else {
        await projectService.createProject(portfolio.id, projectForm);
      }
      await loadAllData();
      setShowProjectModal(false);
      setEditingProject(null);
      setProjectForm({ title: '', description: '', tech_stack: '', project_url: '', status: 'DRAFT' });
    } catch (err) {
      const parsed = parseFieldErrors(err);
      setProjectFieldErrors(parsed.fieldErrors || {});
      setProjectNonFieldError(parsed.nonField || 'Failed to save project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleProjectDelete = async (projectId) => {
    if (!confirm('Delete this project?')) return;
    try {
      await projectService.deleteProject(portfolio.id, projectId);
      await loadAllData();
    } catch (err) {
      alert('Failed to delete project');
    }
  };

  const openProjectModal = (project = null) => {
    if (project) {
      setEditingProject(project);
      setProjectForm({
        title: project.title,
        description: project.description,
        tech_stack: project.tech_stack,
        project_url: project.project_url,
        status: project.status
      });
    } else {
      setEditingProject(null);
      setProjectForm({ title: '', description: '', tech_stack: '', project_url: '', status: 'DRAFT' });
    }
    setProjectFieldErrors({});
    setProjectNonFieldError(null);
    setShowProjectModal(true);
  };

  // Skill handlers
  const handleSkillSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setSkillFieldErrors({});
      setSkillNonFieldError(null);
      if (editingSkill) {
        await skillService.updateSkill(portfolio.id, editingSkill.id, skillForm);
      } else {
        await skillService.createSkill(portfolio.id, skillForm);
      }
      await loadAllData();
      setShowSkillModal(false);
      setEditingSkill(null);
      setSkillForm({ name: '', proficiency_level: 'BEGINNER', years_of_experience: 0, skill_certification: '', status: 'DRAFT' });
    } catch (err) {
      const parsed = parseFieldErrors(err);
      setSkillFieldErrors(parsed.fieldErrors || {});
      setSkillNonFieldError(parsed.nonField || 'Failed to save skill');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkillDelete = async (skillId) => {
    if (!confirm('Delete this skill?')) return;
    try {
      await skillService.deleteSkill(portfolio.id, skillId);
      await loadAllData();
    } catch (err) {
      alert('Failed to delete skill');
    }
  };

  const openSkillModal = (skill = null) => {
    if (skill) {
      setEditingSkill(skill);
      setSkillForm({
        name: skill.name,
        proficiency_level: skill.proficiency_level,
        years_of_experience: skill.years_of_experience,
        skill_certification: skill.skill_certification || '',
        status: skill.status
      });
    } else {
      setEditingSkill(null);
      setSkillForm({ name: '', proficiency_level: 'BEGINNER', years_of_experience: 0, skill_certification: '', status: 'DRAFT' });
    }
    setSkillFieldErrors({});
    setSkillNonFieldError(null);
    setShowSkillModal(true);
  };

  // Education handlers
  const handleEducationSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setEducationFieldErrors({});
      setEducationNonFieldError(null);
      if (editingEducation) {
        await educationService.updateEducation(portfolio.id, editingEducation.id, educationForm);
      } else {
        await educationService.createEducation(portfolio.id, educationForm);
      }
      await loadAllData();
      setShowEducationModal(false);
      setEditingEducation(null);
      setEducationForm({ institution: '', degree: '', start_year: new Date().getFullYear(), end_year: '', status: 'DRAFT' });
    } catch (err) {
      const parsed = parseFieldErrors(err);
      setEducationFieldErrors(parsed.fieldErrors || {});
      setEducationNonFieldError(parsed.nonField || 'Failed to save education');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEducationDelete = async (educationId) => {
    if (!confirm('Delete this education record?')) return;
    try {
      await educationService.deleteEducation(portfolio.id, educationId);
      await loadAllData();
    } catch (err) {
      alert('Failed to delete education');
    }
  };

  const openEducationModal = (edu = null) => {
    if (edu) {
      setEditingEducation(edu);
      setEducationForm({
        institution: edu.institution,
        degree: edu.degree,
        start_year: edu.start_year,
        end_year: edu.end_year || '',
        status: edu.status
      });
    } else {
      setEditingEducation(null);
      setEducationForm({ institution: '', degree: '', start_year: new Date().getFullYear(), end_year: '', status: 'DRAFT' });
    }
    setEducationFieldErrors({});
    setEducationNonFieldError(null);
    setShowEducationModal(true);
  };

  // Social Link handlers
  const handleSocialLinkSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setSocialLinkFieldErrors({});
      setSocialLinkNonFieldError(null);
      if (editingSocialLink) {
        await socialLinkService.updateSocialLink(portfolio.id, editingSocialLink.id, socialLinkForm);
      } else {
        await socialLinkService.createSocialLink(portfolio.id, socialLinkForm);
      }
      await loadAllData();
      setShowSocialLinkModal(false);
      setEditingSocialLink(null);
      setSocialLinkForm({ platform: '', url: '', status: 'DRAFT' });
    } catch (err) {
      const parsed = parseFieldErrors(err);
      setSocialLinkFieldErrors(parsed.fieldErrors || {});
      setSocialLinkNonFieldError(parsed.nonField || 'Failed to save social link');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSocialLinkDelete = async (socialLinkId) => {
    if (!confirm('Delete this social link?')) return;
    try {
      await socialLinkService.deleteSocialLink(portfolio.id, socialLinkId);
      await loadAllData();
    } catch (err) {
      alert('Failed to delete social link');
    }
  };

  const openSocialLinkModal = (link = null) => {
    if (link) {
      setEditingSocialLink(link);
      setSocialLinkForm({
        platform: link.platform,
        url: link.url,
        status: link.status
      });
    } else {
      setEditingSocialLink(null);
      setSocialLinkForm({ platform: '', url: '', status: 'DRAFT' });
    }
    setSocialLinkFieldErrors({});
    setSocialLinkNonFieldError(null);
    setShowSocialLinkModal(true);
  };

  // Document handlers
  const handleDocumentUpload = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setDocumentError(null);
      const formData = new FormData();
      formData.append('file', documentForm.file);
      formData.append('doc_type', documentForm.doc_type);
      await documentService.uploadDocument(portfolio.id, formData);
      await loadAllData();
      setShowDocumentModal(false);
      setDocumentForm({ file: null, doc_type: 'resume' });
    } catch (err) {
      setDocumentError(err.response?.data?.message || 'Failed to upload document');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDocumentDelete = async (documentId) => {
    if (!confirm('Delete this document?')) return;
    try {
      await documentService.deleteDocument(portfolio.id, documentId);
      await loadAllData();
    } catch (err) {
      alert('Failed to delete document');
    }
  };

  // Version handlers
  const handleVersionCreate = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setVersionError(null);
      await versionService.createVersion(portfolio.id, versionForm);
      await loadAllData();
      setShowVersionModal(false);
      setVersionForm({ change_note: '', is_draft: false });
    } catch (err) {
      setVersionError(err.response?.data?.message || 'Failed to create version');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVersionRevert = async (versionNumber) => {
    if (!confirm(`Revert to version ${versionNumber}? This will restore the portfolio to that state.`)) return;
    try {
      await versionService.revertVersion(portfolio.id, versionNumber);
      await loadAllData();
    } catch (err) {
      alert('Failed to revert to version');
    }
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
          <strong>Error:</strong> {error}
        </div>
      </div>
    );
  }

  // Keep rendering the page even when the user doesn't have a portfolio.
  // We show the "Create Portfolio" CTA and list of other portfolios below.
  // (Do not early-return so the public portfolios list is always visible)
  
  // const isOwner = portfolio.is_owner;  // computed later safely

  const isOwner = portfolio && portfolio.is_owner;

  return (
    <div className="container py-4">
      {/* My Portfolio Header (separate area) */}
      {portfolio ? (
        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <h1 className="h3">{portfolio.title}</h1>
              <p className="text-muted">{portfolio.summary}</p>
            </div>
              <div className="d-flex gap-2">
              <button className="btn btn-outline-primary btn-sm" onClick={() => { window.location.href = `/portfolios/${portfolio.id}/overview`; }}>
                Open My Portfolio
              </button>
              {isOwner && (
                <button className="btn btn-outline-secondary btn-sm" onClick={() => setShowPortfolioEditModal(true)}>
                  Edit
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-4">
          <Card>
            <Card.Body className="d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0">You don't have a portfolio yet</h5>
                <p className="mb-0 text-muted">Create a portfolio to manage your projects and resume.</p>
              </div>
              <div>
                <button className="btn btn-primary" onClick={() => { window.location.href = '/portfolios'; }}>Create Portfolio</button>
              </div>
            </Card.Body>
          </Card>
        </div>
      )}

      {/* Stats Cards - unified Card component styling */}
      <div className="row mb-4">
        <div className="col-md-3">
          <Card className="h-100">
            <Card.Body>
              <h6 className="card-subtitle mb-2 text-muted">Portfolio Status</h6>
              <span className={`badge ${portfolio?.status === 'PUBLISHED' ? 'bg-success' : 'bg-secondary'}`}>
                {portfolio?.status || '—'}
              </span>
              <div className="text-muted mt-2 small">Last updated: {portfolio?.updated_at ? formatDate(portfolio.updated_at) : '—'}</div>
            </Card.Body>
          </Card>
        </div>
        <div className="col-md-3">
          <Card className="h-100 text-center">
            <Card.Body>
              <div className="h4 mb-0">{projects?.length ?? 0}</div>
              <small className="text-muted">Projects</small>
            </Card.Body>
          </Card>
        </div>
        <div className="col-md-3">
          <Card className="h-100 text-center">
            <Card.Body>
              <div className="h4 mb-0">{skills?.length ?? 0}</div>
              <small className="text-muted">Skills</small>
            </Card.Body>
          </Card>
        </div>
        <div className="col-md-3">
          <Card className="h-100 text-center">
            <Card.Body>
              <div className="h4 mb-0">{education?.length ?? 0}</div>
              <small className="text-muted">Education</small>
            </Card.Body>
          </Card>
        </div>
      </div>

      {/* Quick Actions removed to avoid redundancy; actions are available in section cards */}

      {/* Other Portfolios (public/others) */}
      <div className="mb-4">
        <h5>All Portfolios</h5>
        {otherPortfolios.length === 0 ? (
          <p className="text-muted">No other portfolios found.</p>
        ) : (
          <div className="mt-2">
            {otherPortfolios.map(p => (
              <div key={p.id} className="mb-3">
                <Card>
                  <Card.Body className="d-flex justify-content-between align-items-center">
                    <div>
                      <h5 className="mb-1">{p.title}</h5>
                      <p className="text-muted small mb-0">{p.summary}</p>
                      <div className="mt-1">
                        <span className={`badge ${p.status === 'PUBLISHED' ? 'bg-success' : 'bg-secondary'}`}>{p.status}</span>
                      </div>
                    </div>
                    <div className="text-end">
                      <button className="btn btn-link" onClick={() => navigate(`/portfolios/${p.id}/overview`)}>Open</button>
                    </div>
                  </Card.Body>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Portfolio overview removed from Dashboard — use sidebar 'My Portfolio' */}

      {/* MODALS - Only render if owner */}
      {isOwner && (
        <>
          {/* Portfolio Edit Modal */}
          {showPortfolioEditModal && (
            <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Edit Portfolio</h5>
                    <button type="button" className="btn-close" onClick={() => setShowPortfolioEditModal(false)}></button>
                  </div>
                  <form onSubmit={handlePortfolioUpdate}>
                    <div className="modal-body">
                      {portfolioNonFieldError && <div className="alert alert-danger">{portfolioNonFieldError}</div>}
                      <div className="mb-3">
                        <label className="form-label">Title *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={portfolioForm.title}
                          onChange={(e) => setPortfolioForm({ ...portfolioForm, title: e.target.value })}
                          required
                        />
                        {portfolioFieldErrors.title && <div className="text-danger small">{portfolioFieldErrors.title}</div>}
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Summary *</label>
                        <textarea
                          className="form-control"
                          rows={4}
                          value={portfolioForm.summary}
                          onChange={(e) => setPortfolioForm({ ...portfolioForm, summary: e.target.value })}
                          required
                        />
                        {portfolioFieldErrors.summary && <div className="text-danger small">{portfolioFieldErrors.summary}</div>}
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Status</label>
                        <select
                          className="form-select"
                          value={portfolioForm.status}
                          onChange={(e) => setPortfolioForm({ ...portfolioForm, status: e.target.value })}
                        >
                          <option value="DRAFT">Draft</option>
                          <option value="PUBLISHED">Published</option>
                        </select>
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button type="button" className="btn btn-secondary" onClick={() => setShowPortfolioEditModal(false)}>Cancel</button>
                      <button type="submit" className="btn btn-primary" disabled={submitting}>
                        {submitting ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Project Modal */}
          {showProjectModal && (
            <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
              <div className="modal-dialog modal-lg">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">{editingProject ? 'Edit Project' : 'Add Project'}</h5>
                    <button type="button" className="btn-close" onClick={() => setShowProjectModal(false)}></button>
                  </div>
                  <form onSubmit={handleProjectSubmit}>
                    <div className="modal-body">
                      {projectNonFieldError && <div className="alert alert-danger">{projectNonFieldError}</div>}
                      <div className="mb-3">
                        <label className="form-label">Title *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={projectForm.title}
                          onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                          required
                        />
                        {projectFieldErrors.title && <div className="text-danger small">{projectFieldErrors.title}</div>}
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Description *</label>
                        <textarea
                          className="form-control"
                          rows={4}
                          value={projectForm.description}
                          onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                          required
                        />
                        {projectFieldErrors.description && <div className="text-danger small">{projectFieldErrors.description}</div>}
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Tech Stack</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g., React, Node.js, PostgreSQL"
                          value={projectForm.tech_stack}
                          onChange={(e) => setProjectForm({ ...projectForm, tech_stack: e.target.value })}
                        />
                        {projectFieldErrors.tech_stack && <div className="text-danger small">{projectFieldErrors.tech_stack}</div>}
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Project URL</label>
                        <input
                          type="url"
                          className="form-control"
                          placeholder="https://example.com"
                          value={projectForm.project_url}
                          onChange={(e) => setProjectForm({ ...projectForm, project_url: e.target.value })}
                        />
                        {projectFieldErrors.project_url && <div className="text-danger small">{projectFieldErrors.project_url}</div>}
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Status</label>
                        <select
                          className="form-select"
                          value={projectForm.status}
                          onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value })}
                        >
                          <option value="DRAFT">Draft</option>
                          <option value="PUBLISHED">Published</option>
                        </select>
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button type="button" className="btn btn-secondary" onClick={() => setShowProjectModal(false)}>Cancel</button>
                      <button type="submit" className="btn btn-primary" disabled={submitting}>
                        {submitting ? 'Saving...' : (editingProject ? 'Update' : 'Create')}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Skill Modal */}
          {showSkillModal && (
            <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">{editingSkill ? 'Edit Skill' : 'Add Skill'}</h5>
                    <button type="button" className="btn-close" onClick={() => setShowSkillModal(false)}></button>
                  </div>
                  <form onSubmit={handleSkillSubmit}>
                    <div className="modal-body">
                      {skillNonFieldError && <div className="alert alert-danger">{skillNonFieldError}</div>}
                      <div className="mb-3">
                        <label className="form-label">Skill Name *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={skillForm.name}
                          onChange={(e) => setSkillForm({ ...skillForm, name: e.target.value })}
                          required
                        />
                        {skillFieldErrors.name && <div className="text-danger small">{skillFieldErrors.name}</div>}
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Proficiency Level</label>
                        <select
                          className="form-select"
                          value={skillForm.proficiency_level}
                          onChange={(e) => setSkillForm({ ...skillForm, proficiency_level: e.target.value })}
                        >
                          <option value="BEGINNER">Beginner</option>
                          <option value="INTERMEDIATE">Intermediate</option>
                          <option value="ADVANCED">Advanced</option>
                          <option value="EXPERT">Expert</option>
                        </select>
                        {skillFieldErrors.proficiency_level && <div className="text-danger small">{skillFieldErrors.proficiency_level}</div>}
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Years of Experience</label>
                        <input
                          type="number"
                          className="form-control"
                          min="0"
                          value={skillForm.years_of_experience}
                          onChange={(e) => setSkillForm({ ...skillForm, years_of_experience: parseInt(e.target.value) || 0 })}
                        />
                        {skillFieldErrors.years_of_experience && <div className="text-danger small">{skillFieldErrors.years_of_experience}</div>}
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Certification (optional)</label>
                        <input
                          type="text"
                          className="form-control"
                          value={skillForm.skill_certification}
                          onChange={(e) => setSkillForm({ ...skillForm, skill_certification: e.target.value })}
                        />
                        {skillFieldErrors.skill_certification && <div className="text-danger small">{skillFieldErrors.skill_certification}</div>}
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Status</label>
                        <select
                          className="form-select"
                          value={skillForm.status}
                          onChange={(e) => setSkillForm({ ...skillForm, status: e.target.value })}
                        >
                          <option value="DRAFT">Draft</option>
                          <option value="PUBLISHED">Published</option>
                        </select>
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button type="button" className="btn btn-secondary" onClick={() => setShowSkillModal(false)}>Cancel</button>
                      <button type="submit" className="btn btn-primary" disabled={submitting}>
                        {submitting ? 'Saving...' : (editingSkill ? 'Update' : 'Create')}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Education Modal */}
          {showEducationModal && (
            <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">{editingEducation ? 'Edit Education' : 'Add Education'}</h5>
                    <button type="button" className="btn-close" onClick={() => setShowEducationModal(false)}></button>
                  </div>
                  <form onSubmit={handleEducationSubmit}>
                    <div className="modal-body">
                      {educationNonFieldError && <div className="alert alert-danger">{educationNonFieldError}</div>}
                      <div className="mb-3">
                        <label className="form-label">Institution *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={educationForm.institution}
                          onChange={(e) => setEducationForm({ ...educationForm, institution: e.target.value })}
                          required
                        />
                        {educationFieldErrors.institution && <div className="text-danger small">{educationFieldErrors.institution}</div>}
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Degree *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={educationForm.degree}
                          onChange={(e) => setEducationForm({ ...educationForm, degree: e.target.value })}
                          required
                        />
                        {educationFieldErrors.degree && <div className="text-danger small">{educationFieldErrors.degree}</div>}
                      </div>
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Start Year *</label>
                          <input
                            type="number"
                            className="form-control"
                            min="1900"
                            max={new Date().getFullYear() + 10}
                            value={educationForm.start_year}
                            onChange={(e) => setEducationForm({ ...educationForm, start_year: parseInt(e.target.value) })}
                            required
                          />
                          {educationFieldErrors.start_year && <div className="text-danger small">{educationFieldErrors.start_year}</div>}
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label">End Year (optional)</label>
                          <input
                            type="number"
                            className="form-control"
                            min="1900"
                            max={new Date().getFullYear() + 10}
                            value={educationForm.end_year}
                            onChange={(e) => setEducationForm({ ...educationForm, end_year: e.target.value ? parseInt(e.target.value) : '' })}
                          />
                          {educationFieldErrors.end_year && <div className="text-danger small">{educationFieldErrors.end_year}</div>}
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Status</label>
                        <select
                          className="form-select"
                          value={educationForm.status}
                          onChange={(e) => setEducationForm({ ...educationForm, status: e.target.value })}
                        >
                          <option value="DRAFT">Draft</option>
                          <option value="PUBLISHED">Published</option>
                        </select>
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button type="button" className="btn btn-secondary" onClick={() => setShowEducationModal(false)}>Cancel</button>
                      <button type="submit" className="btn btn-primary" disabled={submitting}>
                        {submitting ? 'Saving...' : (editingEducation ? 'Update' : 'Create')}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Social Link Modal */}
          {showSocialLinkModal && (
            <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">{editingSocialLink ? 'Edit Social Link' : 'Add Social Link'}</h5>
                    <button type="button" className="btn-close" onClick={() => setShowSocialLinkModal(false)}></button>
                  </div>
                  <form onSubmit={handleSocialLinkSubmit}>
                    <div className="modal-body">
                      {socialLinkNonFieldError && <div className="alert alert-danger">{socialLinkNonFieldError}</div>}
                      <div className="mb-3">
                        <label className="form-label">Platform *</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g., GitHub, LinkedIn, Twitter"
                          value={socialLinkForm.platform}
                          onChange={(e) => setSocialLinkForm({ ...socialLinkForm, platform: e.target.value })}
                          required
                        />
                        {socialLinkFieldErrors.platform && <div className="text-danger small">{socialLinkFieldErrors.platform}</div>}
                      </div>
                      <div className="mb-3">
                        <label className="form-label">URL *</label>
                        <input
                          type="url"
                          className="form-control"
                          placeholder="https://github.com/username"
                          value={socialLinkForm.url}
                          onChange={(e) => setSocialLinkForm({ ...socialLinkForm, url: e.target.value })}
                          required
                        />
                        {socialLinkFieldErrors.url && <div className="text-danger small">{socialLinkFieldErrors.url}</div>}
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Status</label>
                        <select
                          className="form-select"
                          value={socialLinkForm.status}
                          onChange={(e) => setSocialLinkForm({ ...socialLinkForm, status: e.target.value })}
                        >
                          <option value="DRAFT">Draft</option>
                          <option value="PUBLISHED">Published</option>
                        </select>
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button type="button" className="btn btn-secondary" onClick={() => setShowSocialLinkModal(false)}>Cancel</button>
                      <button type="submit" className="btn btn-primary" disabled={submitting}>
                        {submitting ? 'Saving...' : (editingSocialLink ? 'Update' : 'Create')}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Document Upload Modal */}
          {showDocumentModal && (
            <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Upload Document</h5>
                    <button type="button" className="btn-close" onClick={() => setShowDocumentModal(false)}></button>
                  </div>
                  <form onSubmit={handleDocumentUpload}>
                    <div className="modal-body">
                      {documentError && <div className="alert alert-danger">{documentError}</div>}
                      <div className="mb-3">
                        <label className="form-label">Document Type *</label>
                        <select
                          className="form-select"
                          value={documentForm.doc_type}
                          onChange={(e) => setDocumentForm({ ...documentForm, doc_type: e.target.value })}
                        >
                          <option value="resume">Resume</option>
                          <option value="certificate">Certificate</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">File *</label>
                        <input
                          type="file"
                          className="form-control"
                          onChange={(e) => setDocumentForm({ ...documentForm, file: e.target.files[0] })}
                          required
                        />
                        <div className="form-text">Maximum file size: 10MB</div>
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button type="button" className="btn btn-secondary" onClick={() => setShowDocumentModal(false)}>Cancel</button>
                      <button type="submit" className="btn btn-primary" disabled={submitting || !documentForm.file}>
                        {submitting ? 'Uploading...' : 'Upload'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Version Snapshot Modal */}
          {showVersionModal && (
            <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Create Version Snapshot</h5>
                    <button type="button" className="btn-close" onClick={() => setShowVersionModal(false)}></button>
                  </div>
                  <form onSubmit={handleVersionCreate}>
                    <div className="modal-body">
                      {versionError && <div className="alert alert-danger">{versionError}</div>}
                      <div className="mb-3">
                        <label className="form-label">Change Note *</label>
                        <textarea
                          className="form-control"
                          rows={3}
                          placeholder="Describe what changed in this version..."
                          value={versionForm.change_note}
                          onChange={(e) => setVersionForm({ ...versionForm, change_note: e.target.value })}
                          required
                        />
                      </div>
                      <div className="mb-3 form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="isDraft"
                          checked={versionForm.is_draft}
                          onChange={(e) => setVersionForm({ ...versionForm, is_draft: e.target.checked })}
                        />
                        <label className="form-check-label" htmlFor="isDraft">
                          Mark as draft version
                        </label>
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button type="button" className="btn btn-secondary" onClick={() => setShowVersionModal(false)}>Cancel</button>
                      <button type="submit" className="btn btn-primary" disabled={submitting}>
                        {submitting ? 'Creating...' : 'Create Snapshot'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;

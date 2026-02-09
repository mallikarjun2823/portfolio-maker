import React, { useState, useEffect } from 'react';
import { useParams, NavLink, Outlet } from 'react-router-dom';
import {
  portfolioService,
  projectService,
  skillService,
  educationService,
  socialLinkService,
  documentService,
  versionService
} from '../../api/services';
import { parseFieldErrors } from '../../utils/errorParser';
import Card from '../../components/Card/Card';
import Badge from '../../components/Badge/Badge';
import Button from '../../components/Button/Button';
import LoadingSkeleton from '../../components/LoadingSkeleton/LoadingSkeleton';
import EmptyState from '../../components/EmptyState/EmptyState';
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage';

const PortfolioDetail = () => {
  console.log('PortfolioDetail mounted');
  const { id } = useParams();
  
  
  // Data states
  const [portfolio, setPortfolio] = useState(null);
  const [projects, setProjects] = useState([]);
  const [skills, setSkills] = useState([]);
  const [education, setEducation] = useState([]);
  const [socialLinks, setSocialLinks] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Active tab is now handled via nested routes
  
  // Modal states
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [showEducationModal, setShowEducationModal] = useState(false);
  const [showSocialLinkModal, setShowSocialLinkModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [showRevertModal, setShowRevertModal] = useState(false);
  const [revertTarget, setRevertTarget] = useState(null);
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
    console.log('Triggered loadAllData for portfolio id', id);
  }, [id]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      const portfolioData = await portfolioService.getPortfolio(id);
      setPortfolio(portfolioData);
      setPortfolioForm({ title: portfolioData.title, summary: portfolioData.summary, status: portfolioData.status });

      const [
        projectsData,
        skillsData,
        educationData,
        socialLinksData,
        documentsData,
        versionsData
      ] = await Promise.all([
        projectService.getProjects(id).catch(() => []),
        skillService.getSkills(id).catch(() => []),
        educationService.getEducation(id).catch(() => []),
        socialLinkService.getSocialLinks(id).catch(() => []),
        documentService.getDocuments(id).catch(() => []),
        versionService.getVersions(id).catch(() => [])
      ]);

      setProjects(projectsData);
      setSkills(skillsData);
      setEducation(educationData);
      setSocialLinks(socialLinksData);
      setDocuments(documentsData);
      setVersions(versionsData);
    } catch (err) {
      console.error('Error loading portfolio:', err);
      setError('Failed to load portfolio data');
    } finally {
      setLoading(false);
    }
  };

  // Portfolio handlers
  const handlePortfolioUpdate = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setPortfolioFieldErrors({});
      setPortfolioNonFieldError(null);
      await portfolioService.updatePortfolio(id, portfolioForm);
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

  const handlePortfolioDelete = async () => {
    if (!confirm('Are you sure you want to delete this portfolio? This action cannot be undone.')) return;
    try {
      await portfolioService.deletePortfolio(id);
      window.location.href = '/portfolios';
    } catch (err) {
      alert('Failed to delete portfolio');
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
        await projectService.updateProject(id, editingProject.id, projectForm);
      } else {
        await projectService.createProject(id, projectForm);
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
      await projectService.deleteProject(id, projectId);
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
        await skillService.updateSkill(id, editingSkill.id, skillForm);
      } else {
        await skillService.createSkill(id, skillForm);
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
      await skillService.deleteSkill(id, skillId);
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
        await educationService.updateEducation(id, editingEducation.id, educationForm);
      } else {
        await educationService.createEducation(id, educationForm);
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
      await educationService.deleteEducation(id, educationId);
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
        await socialLinkService.updateSocialLink(id, editingSocialLink.id, socialLinkForm);
      } else {
        await socialLinkService.createSocialLink(id, socialLinkForm);
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
      await socialLinkService.deleteSocialLink(id, socialLinkId);
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
      await documentService.uploadDocument(id, formData);
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
      await documentService.deleteDocument(id, documentId);
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
      await versionService.createVersion(id, versionForm);
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
    // Backwards-compatible: open modal
    setRevertTarget(versionNumber);
    setShowRevertModal(true);
  };

  const handleConfirmRevert = async () => {
    if (!revertTarget) return;
    try {
      setSubmitting(true);
      await versionService.revertVersion(id, revertTarget);
      setShowRevertModal(false);
      setRevertTarget(null);
      await loadAllData();
    } catch (err) {
      alert('Failed to revert to version');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error || !portfolio) {
    return (
      <div className="container py-4">
        <ErrorMessage title="Error" message={error || 'Portfolio not found'} />
        <Button variant="primary" onClick={() => navigate('/portfolios')}>Back to Portfolios</Button>
      </div>
    );
  }

  const isOwner = portfolio.is_owner;

  return (
    <div className="container py-4">
      {/* Portfolio Header */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <h1 className="h3">{portfolio.title}</h1>
              <p className="text-muted">{portfolio.summary}</p>
              <div className="d-flex gap-2">
                <Badge variant={portfolio.status === 'PUBLISHED' ? 'success' : 'secondary'}>
                  {portfolio.status}
                </Badge>
                <small className="text-muted">
                  Created: {new Date(portfolio.created_at).toLocaleDateString()}
                </small>
              </div>
            </div>
            {isOwner && (
              <div className="d-flex gap-2">
                <Button variant="outline-primary" size="sm" onClick={() => setShowPortfolioEditModal(true)}>
                  Edit
                </Button>
                <Button variant="outline-danger" size="sm" onClick={handlePortfolioDelete}>
                  Delete
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section navigation (route-based) */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <NavLink to="overview" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
            Overview
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="projects" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
            Projects ({projects.length})
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="skills" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
            Skills ({skills.length})
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="education" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
            Education ({education.length})
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="social" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
            Social Links ({socialLinks.length})
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="documents" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
            Documents ({documents.length})
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="versions" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
            Versions ({versions.length})
          </NavLink>
        </li>
      </ul>

      {/* Render the active section via nested route outlet. Pass data + handlers via context */}
      <Outlet context={{
        portfolio,
        projects,
        skills,
        education,
        socialLinks,
        documents,
        versions,
        isOwner,
        openProjectModal,
        openSkillModal,
        openEducationModal,
        openSocialLinkModal,
        handleProjectDelete,
        handleSkillDelete,
        handleEducationDelete,
        handleSocialLinkDelete,
        handleDocumentDelete,
        setShowDocumentModal,
        setShowVersionModal,
        setShowProjectModal,
        setShowSkillModal,
        setShowEducationModal,
        setShowSocialLinkModal,
        setShowRevertModal,
        setRevertTarget,
      }} />

      {/* Modals */}
      {showPortfolioEditModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
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

      {showProjectModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
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

      {showSkillModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
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

      {showEducationModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
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

      {showSocialLinkModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
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

      {showDocumentModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
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

      {showVersionModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
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

      {showRevertModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Revert</h5>
                <button type="button" className="btn-close" onClick={() => { setShowRevertModal(false); setRevertTarget(null); }}></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to revert to version {revertTarget}? This will restore the portfolio and recreate non-file items from that snapshot.</p>
                <div className="alert alert-warning small">Note: document files are not restored; IDs for recreated items will change.</div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowRevertModal(false); setRevertTarget(null); }}>Cancel</button>
                <button type="button" className="btn btn-danger" onClick={handleConfirmRevert} disabled={submitting}>
                  {submitting ? 'Reverting...' : `Revert to v${revertTarget}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioDetail;

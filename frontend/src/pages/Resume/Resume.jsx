import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { portfolioService, projectService, skillService, educationService, socialLinkService } from '../../api/services';
import { parseFieldErrors } from '../../utils/errorParser';
import Card from '../../components/Card/Card';
import Badge from '../../components/Badge/Badge';
import Button from '../../components/Button/Button';
import LoadingSkeleton from '../../components/LoadingSkeleton/LoadingSkeleton';
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage';
import EmptyState from '../../components/EmptyState/EmptyState';

const Resume = () => {
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState(null);
  const [projects, setProjects] = useState([]);
  const [skills, setSkills] = useState([]);
  const [education, setEducation] = useState([]);
  const [socialLinks, setSocialLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal states
  const [showEducationModal, setShowEducationModal] = useState(false);
  const [showSocialLinkModal, setShowSocialLinkModal] = useState(false);
  const [editingEducation, setEditingEducation] = useState(null);
  const [editingSocialLink, setEditingSocialLink] = useState(null);
  const [educationFieldErrors, setEducationFieldErrors] = useState({});
  const [educationNonFieldError, setEducationNonFieldError] = useState(null);
  const [socialLinkFieldErrors, setSocialLinkFieldErrors] = useState({});
  const [socialLinkNonFieldError, setSocialLinkNonFieldError] = useState(null);
  const [educationForm, setEducationForm] = useState({
    institution: '',
    degree: '',
    start_year: new Date().getFullYear(),
    end_year: '',
    status: 'PUBLISHED'
  });
  const [socialLinkForm, setSocialLinkForm] = useState({
    platform: '',
    url: '',
    status: 'DRAFT'
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadResumeData();
  }, []);

  const loadResumeData = async () => {
    try {
      setLoading(true);
      setError(null);

      const portfolios = await portfolioService.getPortfolios();
      
      if (portfolios.length > 0) {
        const userPortfolio = portfolios[0];
        setPortfolio(userPortfolio);

        const [projectsData, skillsData, educationData, socialLinksData] = await Promise.all([
          projectService.getProjects(userPortfolio.id),
          skillService.getSkills(userPortfolio.id),
          educationService.getEducation(userPortfolio.id),
          socialLinkService.getSocialLinks(userPortfolio.id),
        ]);

        // Filter only published items
        setProjects(projectsData.filter(p => p.status === 'PUBLISHED'));
        setSkills(skillsData.filter(s => s.status === 'PUBLISHED'));
        setEducation(educationData);
        setSocialLinks(socialLinksData);
      }
    } catch (err) {
      console.error('Error loading resume data:', err);
      setError(err.response?.data?.message || 'Failed to load resume data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    window.print();
  };

  const handleEducationSubmit = async (e) => {
    e.preventDefault();
    if (!portfolio) return;

    try {
      setSubmitting(true);
      setEducationModalError(null);
      if (editingEducation) {
        await educationService.updateEducation(portfolio.id, editingEducation.id, educationForm);
      } else {
        await educationService.createEducation(portfolio.id, educationForm);
      }
      setShowEducationModal(false);
      setEditingEducation(null);
      setEducationForm({
        institution: '',
        degree: '',
        start_year: new Date().getFullYear(),
        end_year: '',
        status: 'PUBLISHED'
      });
      await loadResumeData();
    } catch (err) {
      console.error('Error saving education:', err);
      const errorMsg = err.response?.data?.detail || err.response?.data?.message || (err.response?.data && JSON.stringify(err.response.data)) || 'Failed to save education';
      setEducationModalError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSocialLinkSubmit = async (e) => {
    e.preventDefault();
    if (!portfolio) return;

    try {
      setSubmitting(true);
      setSocialLinkModalError(null);
      if (editingSocialLink) {
        await socialLinkService.updateSocialLink(portfolio.id, editingSocialLink.id, socialLinkForm);
      } else {
        await socialLinkService.createSocialLink(portfolio.id, socialLinkForm);
      }
      setShowSocialLinkModal(false);
      setEditingSocialLink(null);
      setSocialLinkForm({ platform: '', url: '' });
      await loadResumeData();
    } catch (err) {
      console.error('Error saving social link:', err);
      const errorMsg = err.response?.data?.detail || err.response?.data?.message || (err.response?.data && JSON.stringify(err.response.data)) || 'Failed to save social link';
      setSocialLinkModalError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEducation = async (educationId) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await educationService.deleteEducation(portfolio.id, educationId);
      await loadResumeData();
    } catch (err) {
      console.error('Error deleting education:', err);
      setError('Failed to delete education');
    }
  };

  const handleDeleteSocialLink = async (socialLinkId) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await socialLinkService.deleteSocialLink(portfolio.id, socialLinkId);
      await loadResumeData();
    } catch (err) {
      console.error('Error deleting social link:', err);
      setError('Failed to delete social link');
    }
  };


  const handleEditEducation = (edu) => {
    setEditingEducation(edu);
    setEducationForm({
      institution: edu.institution,
      degree: edu.degree,
      start_year: edu.start_year,
      end_year: edu.end_year || '',
      status: edu.status
    });
    setShowEducationModal(true);
  };

  const handleEditSocialLink = (link) => {
    setEditingSocialLink(link);
    setSocialLinkForm({
      platform: link.platform,
      url: link.url,
      status: link.status || 'DRAFT'
    });
    setShowSocialLinkModal(true);
  };

  if (loading) {
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
        <ErrorMessage title="Resume Error" message={error} />
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="container py-4">
        <div className="card">
          <div className="card-body">
            <h1 className="card-title">Resume & Profile</h1>
            <p className="card-text">You don't have a portfolio yet. Create one to build your resume.</p>
            <button className="btn btn-primary" onClick={() => navigate('/portfolios')}>Create Portfolio</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h4 mb-0">Resume & Profile</h1>
          {portfolio && <p className="text-muted mb-0">{portfolio.title}</p>}
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-primary btn-sm" onClick={() => setShowEducationModal(true)}>
            <i className="bi bi-plus-circle me-1"></i>Education
          </button>
          <button className="btn btn-outline-primary btn-sm" onClick={() => setShowSocialLinkModal(true)}>
            <i className="bi bi-plus-circle me-1"></i>Social Link
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleExport}>
            <i className="bi bi-printer me-1"></i>Export
          </button>
        </div>
      </div>

      <Card>
        <div>
          {portfolio && (
            <>
              <h2 className="h5 mb-2">{portfolio.title}</h2>
              <p className="text-muted mb-4">{portfolio.summary}</p>
            </>
          )}

          {/* Education Section */}
          {education.length > 0 && (
            <div className="mb-4">
              <h3 className="h6 mb-3">Education</h3>
              <div className="row g-2">
                {education.map((edu) => (
                  <div key={edu.id} className="col-12">
                    <div className="p-3 border rounded">
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <h5 className="mb-1">{edu.degree}</h5>
                          <p className="text-muted mb-1">{edu.institution}</p>
                          <small className="text-muted">{edu.start_year} - {edu.end_year || 'Present'}</small>
                        </div>
                        <div className="d-flex gap-1">
                          {edu.is_owner && (
                            <>
                              <button 
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => handleEditEducation(edu)}
                                title="Edit"
                              >
                                <i className="bi bi-pencil me-1"></i>Edit
                              </button>
                              <button 
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDeleteEducation(edu.id)}
                                title="Delete"
                              >
                                <i className="bi bi-trash me-1"></i>Delete
                              </button>
                              
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects Section */}
          {projects.length > 0 && (
            <div className="mb-4">
              <h3 className="h6 mb-3">Projects</h3>
              <div className="row g-3">
                {projects.map((project) => (
                  <div key={project.id} className="col-md-6">
                    <div className="p-3 border rounded h-100">
                      <h5 className="mb-2">{project.title}</h5>
                      <p className="text-muted small mb-2">{project.description}</p>
                      {project.tech_stack && (
                        <div className="mb-2">
                          <small><strong>Tech:</strong> {project.tech_stack}</small>
                        </div>
                      )}
                      {project.project_url && (
                        <a href={project.project_url} target="_blank" rel="noopener noreferrer" className="small link-primary">
                          View Project →
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills Section */}
          {skills.length > 0 && (
            <div className="mb-4">
              <h3 className="h6 mb-3">Skills</h3>
              <div className="d-flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <div key={skill.id} className="badge bg-light text-dark p-2">
                    <div className="fw-semibold">{skill.name}</div>
                    <small>{skill.proficiency_level}</small>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Social Links Section */}
          {socialLinks.length > 0 && (
            <div>
              <h3 className="h6 mb-3">Connect</h3>
              <div className="d-flex flex-wrap gap-2">
                {socialLinks.map((link) => (
                  <div key={link.id} className="d-flex gap-1 align-items-center">
                    <a 
                      href={link.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="btn btn-sm btn-outline-primary"
                    >
                      <i className="bi bi-link-45deg me-1"></i>{link.platform}
                    </a>
                    {link.is_owner && (
                      <>
                        <button 
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => handleEditSocialLink(link)}
                          title="Edit"
                          style={{width: '28px', height: '28px', padding: '0', display: 'inline-flex', alignItems: 'center', justifyContent: 'center'}}
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button 
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDeleteSocialLink(link.id)}
                          title="Delete"
                          style={{width: '28px', height: '28px', padding: '0', display: 'inline-flex', alignItems: 'center', justifyContent: 'center'}}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                        
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {education.length === 0 && projects.length === 0 && skills.length === 0 && socialLinks.length === 0 && (
            <EmptyState
              icon={null}
              title="Build Your Resume"
              description="Add education, projects, and social links to build a complete resume"
            />
          )}
        </div>
      </Card>

      {/* Education Modal */}
      {showEducationModal && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editingEducation ? 'Edit Education' : 'Add Education'}</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => {
                    setShowEducationModal(false);
                    setEditingEducation(null);
                  }}
                ></button>
              </div>
              <form onSubmit={handleEducationSubmit}>
                <div className="modal-body">
                  {educationModalError && <div className="mb-3"><ErrorMessage message={educationModalError} /></div>}
                  <div className="mb-3">
                    <label className="form-label">Institution *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={educationForm.institution}
                      onChange={(e) => setEducationForm({...educationForm, institution: e.target.value})}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Degree *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g., Bachelor of Science"
                      value={educationForm.degree}
                      onChange={(e) => setEducationForm({...educationForm, degree: e.target.value})}
                      required
                    />
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Start Year *</label>
                      <input
                        type="number"
                        className="form-control"
                        min="1950"
                        max="2030"
                        value={educationForm.start_year}
                        onChange={(e) => setEducationForm({...educationForm, start_year: parseInt(e.target.value)})}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">End Year</label>
                      <input
                        type="number"
                        className="form-control"
                        min="1950"
                        max="2030"
                        placeholder="Leave empty if current"
                        value={educationForm.end_year}
                        onChange={(e) => setEducationForm({...educationForm, end_year: e.target.value ? parseInt(e.target.value) : ''})}
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      value={educationForm.status}
                      onChange={(e) => setEducationForm({...educationForm, status: e.target.value})}
                    >
                      <option value="PUBLISHED">Published</option>
                      <option value="DRAFT">Draft</option>
                      <option value="ARCHIVED">Archived</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowEducationModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Social Link Modal */}
      {showSocialLinkModal && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editingSocialLink ? 'Edit Social Link' : 'Add Social Link'}</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => {
                    setShowSocialLinkModal(false);
                    setEditingSocialLink(null);
                  }}
                ></button>
              </div>
              <form onSubmit={handleSocialLinkSubmit}>
                <div className="modal-body">
                  {socialLinkModalError && <div className="mb-3"><ErrorMessage message={socialLinkModalError} /></div>}
                  <div className="mb-3">
                    <label className="form-label">Platform *</label>
                    <select
                      className="form-select"
                      value={socialLinkForm.platform}
                      onChange={(e) => setSocialLinkForm({...socialLinkForm, platform: e.target.value})}
                      required
                    >
                      <option value="">Select Platform</option>
                      <option value="LinkedIn">LinkedIn</option>
                      <option value="GitHub">GitHub</option>
                      <option value="Twitter">Twitter</option>
                      <option value="Portfolio">Portfolio</option>
                      <option value="YouTube">YouTube</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">URL *</label>
                    <input
                      type="url"
                      className="form-control"
                      placeholder="https://..."
                      value={socialLinkForm.url}
                      onChange={(e) => setSocialLinkForm({...socialLinkForm, url: e.target.value})}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      value={socialLinkForm.status}
                      onChange={(e) => setSocialLinkForm({...socialLinkForm, status: e.target.value})}
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="PUBLISHED">Published</option>
                      <option value="ARCHIVED">Archived</option>
                    </select>
                    {socialLinkFieldErrors.status && <div className="text-danger small mt-1">{socialLinkFieldErrors.status}</div>}
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowSocialLinkModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Resume;

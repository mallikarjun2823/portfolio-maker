import React, { useState, useEffect } from 'react';
import { portfolioService, projectService, skillService, educationService, socialLinkService } from '../../api/services';
import Button from '../../components/Button/Button';
import LoadingSkeleton from '../../components/LoadingSkeleton/LoadingSkeleton';
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage';

const Resume = () => {
  const [portfolio, setPortfolio] = useState(null);
  const [projects, setProjects] = useState([]);
  const [skills, setSkills] = useState([]);
  const [education, setEducation] = useState([]);
  const [socialLinks, setSocialLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [template, setTemplate] = useState('classic');
  
  // Modal states
  const [showEducationModal, setShowEducationModal] = useState(false);
  const [showSocialLinkModal, setShowSocialLinkModal] = useState(false);
  const [editingEducation, setEditingEducation] = useState(null);
  const [editingSocialLink, setEditingSocialLink] = useState(null);
  const [educationForm, setEducationForm] = useState({
    institution: '',
    degree: '',
    field_of_study: '',
    start_year: '',
    end_year: '',
    status: 'completed'
  });
  const [socialLinkForm, setSocialLinkForm] = useState({
    platform: '',
    url: '',
    username: ''
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
      if (editingEducation) {
        await educationService.updateEducation(portfolio.id, editingEducation.id, educationForm);
        setEditingEducation(null);
      } else {
        await educationService.createEducation(portfolio.id, educationForm);
      }
      setShowEducationModal(false);
      setEducationForm({
        institution: '',
        degree: '',
        field_of_study: '',
        start_year: '',
        end_year: '',
        status: 'completed'
      });
      await loadResumeData(); // Reload data
    } catch (err) {
      console.error('Error saving education:', err);
      setError('Failed to save education');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEducation = async (educationId) => {
    if (!window.confirm('Are you sure you want to delete this education entry?')) return;

    try {
      await educationService.deleteEducation(portfolio.id, educationId);
      await loadResumeData(); // Reload data
    } catch (err) {
      console.error('Error deleting education:', err);
      setError('Failed to delete education');
    }
  };

  const handleEditEducation = (education) => {
    setEditingEducation(education);
    setEducationForm({
      institution: education.institution,
      degree: education.degree,
      field_of_study: education.field_of_study || '',
      start_year: education.start_year,
      end_year: education.end_year || '',
      status: education.status || 'completed'
    });
    setShowEducationModal(true);
  };

  const handleDeleteSocialLink = async (socialLinkId) => {
    if (!window.confirm('Are you sure you want to delete this social link?')) return;

    try {
      await socialLinkService.deleteSocialLink(portfolio.id, socialLinkId);
      await loadResumeData(); // Reload data
    } catch (err) {
      console.error('Error deleting social link:', err);
      setError('Failed to delete social link');
    }
  };

  const closeEducationModal = () => {
    setShowEducationModal(false);
    setEditingEducation(null);
    setEducationForm({
      institution: '',
      degree: '',
      field_of_study: '',
      start_year: '',
      end_year: '',
      status: 'completed'
    });
  };

  const closeSocialLinkModal = () => {
    setShowSocialLinkModal(false);
    setEditingSocialLink(null);
    setSocialLinkForm({
      platform: '',
      url: '',
      username: ''
    });
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
        <p>No portfolio found</p>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h4 mb-0">Resume & Profile</h1>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-primary btn-sm" onClick={() => setShowEducationModal(true)}>
            <i className="bi bi-plus-circle me-1"></i>Add Education
          </button>
          <button className="btn btn-outline-primary btn-sm" onClick={() => setShowSocialLinkModal(true)}>
            <i className="bi bi-plus-circle me-1"></i>Add Social Link
          </button>
          <select className="form-select form-select-sm" value={template} onChange={(e) => setTemplate(e.target.value)}>
            <option value="classic">Classic Template</option>
            <option value="modern">Modern Template</option>
          </select>
          <Button onClick={handleExport}>Export / Print</Button>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="mb-4">
            <h2 className="h5 mb-1">{portfolio.title}</h2>
            <p className="text-muted">{portfolio.summary}</p>
          </div>

          {education.length > 0 && (
            <div className="mb-3">
              <h3 className="h6">Education</h3>
              {education.map((edu) => (
                <div key={edu.id} className="mb-2 p-2 border rounded bg-white position-relative">
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between">
                        <div>
                          <div className="fw-semibold">{edu.degree}</div>
                          <div className="text-muted">{edu.institution}</div>
                        </div>
                        <div className="text-muted">{edu.start_year} - {edu.end_year || 'Present'}</div>
                      </div>
                      {edu.field_of_study && <div className="mt-1">Field of Study: {edu.field_of_study}</div>}
                    </div>
                    <div className="d-flex gap-1 ms-2">
                      <button 
                        className="btn btn-sm btn-outline-primary btn-sm"
                        onClick={() => handleEditEducation(edu)}
                        title="Edit education"
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button 
                        className="btn btn-sm btn-outline-danger btn-sm"
                        onClick={() => handleDeleteEducation(edu.id)}
                        title="Delete education"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {projects.length > 0 && (
            <div className="mb-3">
              <h3 className="h6">Projects</h3>
              {projects.map((project) => (
                <div key={project.id} className="mb-3">
                  <div className="fw-semibold">{project.title}</div>
                  <div className="text-muted">{project.description}</div>
                  {project.tech_stack && <div className="mt-1"><strong>Technologies:</strong> {project.tech_stack}</div>}
                  {project.project_url && <div className="mt-1"><strong>URL:</strong> {project.project_url}</div>}
                </div>
              ))}
            </div>
          )}

          {skills.length > 0 && (
            <div>
              <h3 className="h6">Skills</h3>
              <div className="d-flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <div key={skill.id} className="p-2 border rounded bg-white">
                    <strong>{skill.name}</strong> - {skill.proficiency_level}{skill.years_of_experience ? ` (${skill.years_of_experience} years)` : ''}
                  </div>
                ))}
              </div>
            </div>
          )}

          {socialLinks.length > 0 && (
            <div className="mt-3">
              <h3 className="h6">Social Links</h3>
              <div className="d-flex flex-wrap gap-2">
                {socialLinks.map((link) => (
                  <div key={link.id} className="position-relative">
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary btn-sm">
                      <i className="bi bi-link-45deg me-1"></i>{link.platform}
                    </a>
                    <div className="d-flex gap-1 position-absolute top-0 end-0">
                      <button 
                        className="btn btn-sm btn-outline-primary btn-sm"
                        onClick={() => handleEditSocialLink(link)}
                        title="Edit social link"
                        style={{width: '24px', height: '24px', padding: '0'}}
                      >
                        <i className="bi bi-pencil" style={{fontSize: '10px'}}></i>
                      </button>
                      <button 
                        className="btn btn-sm btn-outline-danger btn-sm"
                        onClick={() => handleDeleteSocialLink(link.id)}
                        title="Delete social link"
                        style={{width: '24px', height: '24px', padding: '0'}}
                      >
                        <i className="bi bi-trash" style={{fontSize: '10px'}}></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Education Modal */}
      {showEducationModal && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editingEducation ? 'Edit Education' : 'Add Education'}</h5>
                <button type="button" className="btn-close" onClick={closeEducationModal}></button>
              </div>
              <form onSubmit={handleEducationSubmit}>
                <div className="modal-body">
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
                      placeholder="e.g., Bachelor of Science, Master of Arts"
                      value={educationForm.degree}
                      onChange={(e) => setEducationForm({...educationForm, degree: e.target.value})}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Field of Study</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g., Computer Science, Business Administration"
                      value={educationForm.field_of_study}
                      onChange={(e) => setEducationForm({...educationForm, field_of_study: e.target.value})}
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
                        onChange={(e) => setEducationForm({...educationForm, start_year: e.target.value})}
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
                        onChange={(e) => setEducationForm({...educationForm, end_year: e.target.value})}
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
                      <option value="completed">Completed</option>
                      <option value="in_progress">In Progress</option>
                      <option value="planned">Planned</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowEducationModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Creating...' : 'Add Education'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Social Link Modal */}
      {showSocialLinkModal && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editingSocialLink ? 'Edit Social Link' : 'Add Social Link'}</h5>
                <button type="button" className="btn-close" onClick={closeSocialLinkModal}></button>
              </div>
              <form onSubmit={handleSocialLinkSubmit}>
                <div className="modal-body">
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
                      <option value="Facebook">Facebook</option>
                      <option value="Instagram">Instagram</option>
                      <option value="YouTube">YouTube</option>
                      <option value="Website">Personal Website</option>
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
                    <label className="form-label">Username</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Your username/handle on this platform"
                      value={socialLinkForm.username}
                      onChange={(e) => setSocialLinkForm({...socialLinkForm, username: e.target.value})}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowSocialLinkModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Creating...' : 'Add Social Link'}
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

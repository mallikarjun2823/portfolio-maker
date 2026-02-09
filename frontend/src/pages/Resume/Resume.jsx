import React, { useState, useEffect } from 'react';
import { portfolioService, projectService, skillService, educationService, socialLinkService } from '../../api/services';
import { useAuth } from '../../auth';
import { parseFieldErrors } from '../../utils/errorParser';
import Card from '../../components/Card/Card';
import Badge from '../../components/Badge/Badge';
import Button from '../../components/Button/Button';
import LoadingSkeleton from '../../components/LoadingSkeleton/LoadingSkeleton';
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage';
import EmptyState from '../../components/EmptyState/EmptyState';

const Resume = () => {
  
  const { profile } = useAuth();
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
      setEducationNonFieldError(null);
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
      setEducationNonFieldError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSocialLinkSubmit = async (e) => {
    e.preventDefault();
    if (!portfolio) return;

    try {
      setSubmitting(true);
      setSocialLinkNonFieldError(null);
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
      setSocialLinkNonFieldError(errorMsg);
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
                <button className="btn btn-primary" onClick={() => { window.location.href = '/portfolios'; }}>Create Portfolio</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 no-print">
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

      {/* Print styles: show only `.resume-print-area` when printing */}
      <style>{`@media print{ body *{visibility:hidden} .resume-print-area, .resume-print-area *{visibility:visible} .resume-print-area{position:fixed;left:0;top:0;width:100%} .no-print{display:none !important} }`}</style>

      {/* Printable resume layout */}
      <div className="resume-print-area" style={{ maxWidth: 800, margin: '0 auto', background: '#fff', padding: 28 }}>
        <header style={{ textAlign: 'center', marginBottom: 18 }}>
          <h1 style={{ margin: 0, fontSize: 22 }}>{profile?.full_name || portfolio.title}</h1>
          <div style={{ color: '#333', marginTop: 6 }}>{profile?.headline || portfolio.summary}</div>
          <div style={{ marginTop: 8, color: '#333', fontSize: 12 }}>
            {profile?.email && <span style={{ marginRight: 12 }}>{profile.email}</span>}
            {profile?.phone && <span style={{ marginRight: 12 }}>{profile.phone}</span>}
            {socialLinks.map((s) => (
              <span key={s.id} style={{ marginLeft: 8 }}>
                <a href={s.url} target="_blank" rel="noreferrer" style={{ color: '#066', textDecoration: 'underline' }}>{s.platform}</a>
              </span>
            ))}
          </div>
        </header>

        <section style={{ marginBottom: 12 }}>
          <h2 style={{ fontSize: 14, margin: '8px 0' }}>Education</h2>
          {education.map((edu) => (
            <div key={edu.id} style={{ marginBottom: 8 }}>
              <div style={{ fontWeight: 700 }}>{edu.institution} — {edu.degree}</div>
              <div style={{ color: '#666', fontSize: 12 }}>{edu.start_year} — {edu.end_year || 'Present'}</div>
            </div>
          ))}
        </section>

        <section style={{ marginBottom: 12 }}>
          <h2 style={{ fontSize: 14, margin: '8px 0' }}>Projects</h2>
          {projects.map((p) => (
            <div key={p.id} style={{ marginBottom: 8 }}>
              <div style={{ fontWeight: 700 }}>{p.title} <span style={{ fontSize: 12, color: '#666' }}>{p.status === 'PUBLISHED' ? '' : '(Draft)'}</span></div>
              <div style={{ color: '#333', fontSize: 13 }}>{p.description}</div>
              {p.tech_stack && <div style={{ color: '#666', fontSize: 12 }}>Tech: {p.tech_stack}</div>}
            </div>
          ))}
        </section>

        <section style={{ marginBottom: 12 }}>
          <h2 style={{ fontSize: 14, margin: '8px 0' }}>Technical Skills</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {skills.map(s => (
              <div key={s.id} style={{ padding: '4px 8px', background: '#f3f4f6', borderRadius: 4, fontSize: 12 }}>{s.name}</div>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: 12 }}>
          <h2 style={{ fontSize: 14, margin: '8px 0' }}>Certifications</h2>
          <div style={{ color: '#666', fontSize: 13 }}>
            No certifications listed.
          </div>
        </section>

        <footer style={{ marginTop: 16, borderTop: '1px solid #eee', paddingTop: 8, fontSize: 12, color: '#666' }}>
          Generated by Portfolio Maker
        </footer>

      </div>

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
                  {educationNonFieldError && <div className="mb-3"><ErrorMessage message={educationNonFieldError} /></div>}
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
                  {socialLinkNonFieldError && <div className="mb-3"><ErrorMessage message={socialLinkNonFieldError} /></div>}
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

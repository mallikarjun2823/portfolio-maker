import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { portfolioService, projectService, skillService } from '../../api/services';
import { parseFieldErrors } from '../../utils/errorParser';
import Card from '../../components/Card/Card';
import Badge from '../../components/Badge/Badge';
import Button from '../../components/Button/Button';
import LoadingSkeleton from '../../components/LoadingSkeleton/LoadingSkeleton';
import EmptyState from '../../components/EmptyState/EmptyState';
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage';

const Projects = () => {
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState(null);
  const [projects, setProjects] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortOrder, setSortOrder] = useState('newest');
  
  // Modal states
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [projectForm, setProjectForm] = useState({
    title: '',
    description: '',
    tech_stack: '',
    project_url: '',
    status: 'completed'
  });
  const [skillForm, setSkillForm] = useState({
    name: '',
    proficiency_level: 'BEGINNER',
    years_of_experience: 0,
    certification: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [editingSkill, setEditingSkill] = useState(null);
  const [projectFieldErrors, setProjectFieldErrors] = useState({});
  const [projectNonFieldError, setProjectNonFieldError] = useState(null);
  const [skillFieldErrors, setSkillFieldErrors] = useState({});
  const [skillNonFieldError, setSkillNonFieldError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    console.log('Loading portfolios and projects...');
    try {
      setLoading(true);
      setError(null);

      const portfolios = await portfolioService.getPortfolios();
      
      if (portfolios.length > 0) {
        const userPortfolio = portfolios[0];
        setPortfolio(userPortfolio);

        const [projectsData, skillsData] = await Promise.all([
          projectService.getProjects(userPortfolio.id),
          skillService.getSkills(userPortfolio.id),
        ]);

        setProjects(projectsData);
        setSkills(skillsData);
      }
    } catch (err) {
      console.error('Error loading projects:', err);
      setError(err.response?.data?.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const getSortedProjects = () => {
    const sorted = [...projects];
    if (sortOrder === 'newest') {
      sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else {
      sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    }
    return sorted;
  };

  const getSkillsForProject = (project) => {
    // Extract skills from tech_stack
    if (!project.tech_stack) return [];
    return project.tech_stack.split(',').map(s => s.trim()).filter(Boolean);
  };

  const handleProjectSubmit = async (e) => {
    e.preventDefault();
    if (!portfolio) return;

    try {
      setSubmitting(true);
      setProjectNonFieldError(null);
      setProjectFieldErrors({});
      if (editingProject) {
        await projectService.updateProject(portfolio.id, editingProject.id, projectForm);
        setEditingProject(null);
      } else {
        await projectService.createProject(portfolio.id, projectForm);
      }
      setShowProjectModal(false);
      setProjectForm({
        title: '',
        description: '',
        tech_stack: '',
        project_url: '',
        status: 'completed'
      });
      await loadData(); // Reload data
    } catch (err) {
      console.error('Error saving project:', err);
      const parsed = parseFieldErrors(err);
      setProjectFieldErrors(parsed.fieldErrors || {});
      setProjectNonFieldError(parsed.nonField || 'Failed to save project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkillSubmit = async (e) => {
    e.preventDefault();
    if (!portfolio) return;
    try {
      setSubmitting(true);
      setSkillNonFieldError(null);
      setSkillFieldErrors({});
      // backend expects 'skill_certification' field name
      const payload = {
        name: skillForm.name,
        proficiency_level: skillForm.proficiency_level,
        years_of_experience: skillForm.years_of_experience,
        skill_certification: skillForm.certification || null,
      };

      if (editingSkill) {
        await skillService.updateSkill(portfolio.id, editingSkill.id, payload);
        setEditingSkill(null);
      } else {
        await skillService.createSkill(portfolio.id, payload);
      }

      setShowSkillModal(false);
      setSkillForm({
        name: '',
        proficiency_level: 'BEGINNER',
        years_of_experience: 0,
        certification: ''
      });
      await loadData(); // Reload data
    } catch (err) {
      console.error('Error saving skill:', err);
      const parsed = parseFieldErrors(err);
      setSkillFieldErrors(parsed.fieldErrors || {});
      setSkillNonFieldError(parsed.nonField || 'Failed to save skill');
    
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditProject = (project) => {
    setEditingProject(project);
    setProjectForm({
      title: project.title,
      description: project.description,
      tech_stack: project.tech_stack || '',
      project_url: project.project_url || '',
      status: project.status
    });
    setShowProjectModal(true);
  };

  const handleEditSkill = (skill) => {
    setEditingSkill(skill);
    setSkillForm({
      name: skill.name,
      proficiency_level: skill.proficiency_level,
      years_of_experience: skill.years_of_experience || 0,
      certification: skill.skill_certification || ''
    });
    setShowSkillModal(true);
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;

    try {
      await projectService.deleteProject(portfolio.id, projectId);
      await loadData(); // Reload data
    } catch (err) {
      console.error('Error deleting project:', err);
      setError('Failed to delete project');
    }
  };

  const handleDeleteSkill = async (skillId) => {
    if (!window.confirm('Are you sure you want to delete this skill?')) return;

    try {
      await skillService.deleteSkill(portfolio.id, skillId);
      await loadData(); // Reload data
    } catch (err) {
      console.error('Error deleting skill:', err);
      setError('Failed to delete skill');
    }
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

  if (!portfolio) {
    return (
      <div className="container py-4">
        <div className="card">
          <div className="card-body">
            <h1 className="card-title">Projects & Skills</h1>
            <p className="card-text">You don't have a portfolio yet. Create one to manage your projects and skills.</p>
            <button className="btn btn-primary" onClick={() => navigate('/portfolios')}>Create Portfolio</button>
          </div>
        </div>
      </div>
    );
  }

  const sortedProjects = getSortedProjects();

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h4 mb-0">Projects & Skills</h1>
        <div className="d-flex gap-2">
          {portfolio?.is_owner && (
            <>
              <button className="btn btn-primary btn-sm" onClick={() => setShowProjectModal(true)}>
                <i className="bi bi-plus-circle me-1"></i>Add Project
              </button>
              <button className="btn btn-outline-primary btn-sm" onClick={() => setShowSkillModal(true)}>
                <i className="bi bi-plus-circle me-1"></i>Add Skill
              </button>
            </>
          )}
          <select className="form-select form-select-sm" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} style={{width: 'auto'}}>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {sortedProjects.length === 0 ? (
        <EmptyState
          icon={null}
          title="No Projects Yet"
          description="Your portfolio doesn't have any projects. Start building your portfolio by adding projects."
        />
      ) : (
        <div className="row g-3">
          {sortedProjects.map((project) => (
            <div className="col-md-6" key={project.id}>
              <Card>
                <div>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h5 className="mb-0">{project.title}</h5>
                    <div className="d-flex gap-1">
                      {project.is_owner && (
                        <>
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleEditProject(project)}
                            title="Edit project"
                          >
                            <i className="bi bi-pencil me-1"></i>Edit
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeleteProject(project.id)}
                            title="Delete project"
                          >
                            <i className="bi bi-trash me-1"></i>Delete
                          </button>
                        </>
                      )}
                      <Badge status={project.status} size="small" />
                    </div>
                  </div>
                  <p className="text-muted">{project.description}</p>

                  {project.tech_stack && (
                    <div className="mb-2">
                      <small className="text-muted">Tech Stack: </small>
                      <div>{project.tech_stack}</div>
                    </div>
                  )}

                  <div className="mb-2">
                    {getSkillsForProject(project).slice(0, 5).map((skill, idx) => (
                      <span key={idx} className="badge bg-light text-dark me-1">{skill}</span>
                    ))}
                  </div>

                  {project.project_url && (
                    <div>
                      <a href={project.project_url} target="_blank" rel="noopener noreferrer" className="link-primary">
                        View Project →
                      </a>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}

      {skills.length > 0 && (
        <div className="mt-4">
          <h2 className="h5 mb-3">All Skills ({skills.length})</h2>
          <Card>
            <div className="d-flex flex-wrap gap-2">
              {skills.map((skill) => (
                <div key={skill.id} className="p-2 border rounded bg-white position-relative">
                  <div className="d-flex justify-content-between align-items-start mb-1">
                    <div className="fw-semibold mb-1">{skill.name}</div>
                    <div className="d-flex gap-1">
                      {skill.is_owner && (
                        <>
                          <button
                            className="btn btn-sm btn-outline-primary btn-sm"
                            onClick={() => handleEditSkill(skill)}
                            title="Edit skill"
                          >
                            <i className="bi bi-pencil me-1"></i>Edit
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger btn-sm"
                            onClick={() => handleDeleteSkill(skill.id)}
                            title="Delete skill"
                          >
                            <i className="bi bi-trash me-1"></i>Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-muted small">{skill.proficiency_level} · {skill.years_of_experience || 0} years</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Add Project Modal */}
      {showProjectModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editingProject ? 'Edit Project' : 'Add New Project'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowProjectModal(false)}></button>
              </div>
              <form onSubmit={handleProjectSubmit}>
                <div className="modal-body">
                  {projectNonFieldError && <div className="mb-3"><ErrorMessage message={projectNonFieldError} /></div>}
                  <div className="mb-3">
                    <label className="form-label">Title *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={projectForm.title}
                      onChange={(e) => { setProjectForm({...projectForm, title: e.target.value}); setProjectFieldErrors({...projectFieldErrors, title: null}); }}
                      required
                    />
                    {projectFieldErrors.title && <div className="text-danger small mt-1">{projectFieldErrors.title}</div>}
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Description *</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={projectForm.description}
                      onChange={(e) => { setProjectForm({...projectForm, description: e.target.value}); setProjectFieldErrors({...projectFieldErrors, description: null}); }}
                      required
                    />
                    {projectFieldErrors.description && <div className="text-danger small mt-1">{projectFieldErrors.description}</div>}
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Tech Stack</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g., React, Node.js, Python"
                      value={projectForm.tech_stack}
                      onChange={(e) => { setProjectForm({...projectForm, tech_stack: e.target.value}); setProjectFieldErrors({...projectFieldErrors, tech_stack: null}); }}
                    />
                    {projectFieldErrors.tech_stack && <div className="text-danger small mt-1">{projectFieldErrors.tech_stack}</div>}
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Project URL</label>
                    <input
                      type="url"
                      className="form-control"
                      placeholder="https://..."
                      value={projectForm.project_url}
                      onChange={(e) => { setProjectForm({...projectForm, project_url: e.target.value}); setProjectFieldErrors({...projectFieldErrors, project_url: null}); }}
                    />
                    {projectFieldErrors.project_url && <div className="text-danger small mt-1">{projectFieldErrors.project_url}</div>}
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      value={projectForm.status}
                      onChange={(e) => { setProjectForm({...projectForm, status: e.target.value}); setProjectFieldErrors({...projectFieldErrors, status: null}); }}
                    >
                      <option value="completed">Completed</option>
                      <option value="in_progress">In Progress</option>
                      <option value="planned">Planned</option>
                    </select>
                    {projectFieldErrors.status && <div className="text-danger small mt-1">{projectFieldErrors.status}</div>}
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowProjectModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Creating...' : (editingProject ? 'Update Project' : 'Create Project')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Skill Modal */}
      {showSkillModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editingSkill ? 'Edit Skill' : 'Add New Skill'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowSkillModal(false)}></button>
              </div>
              <form onSubmit={handleSkillSubmit}>
                <div className="modal-body">
                  {skillNonFieldError && <div className="mb-3"><ErrorMessage message={skillNonFieldError} /></div>}
                  <div className="mb-3">
                    <label className="form-label">Skill Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={skillForm.name}
                      onChange={(e) => { setSkillForm({...skillForm, name: e.target.value}); setSkillFieldErrors({...skillFieldErrors, name: null}); }}
                      required
                    />
                    {skillFieldErrors.name && <div className="text-danger small mt-1">{skillFieldErrors.name}</div>}
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Proficiency Level</label>
                    <select
                      className="form-select"
                      value={skillForm.proficiency_level}
                      onChange={(e) => { setSkillForm({...skillForm, proficiency_level: e.target.value}); setSkillFieldErrors({...skillFieldErrors, proficiency_level: null}); }}
                    >
                      <option value="BEGINNER">Beginner</option>
                      <option value="INTERMEDIATE">Intermediate</option>
                      <option value="ADVANCED">Advanced</option>
                      <option value="EXPERT">Expert</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Years of Experience</label>
                    <input
                      type="number"
                      className="form-control"
                      min="0"
                      max="50"
                      value={skillForm.years_of_experience}
                      onChange={(e) => { setSkillForm({...skillForm, years_of_experience: parseInt(e.target.value) || 0}); setSkillFieldErrors({...skillFieldErrors, years_of_experience: null}); }}
                    />
                    {skillFieldErrors.years_of_experience && <div className="text-danger small mt-1">{skillFieldErrors.years_of_experience}</div>}
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Certification</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g., AWS Certified, Google Cloud Professional"
                      value={skillForm.certification}
                      onChange={(e) => { setSkillForm({...skillForm, certification: e.target.value}); setSkillFieldErrors({...skillFieldErrors, certification: null}); }}
                    />
                    {skillFieldErrors.certification && <div className="text-danger small mt-1">{skillFieldErrors.certification}</div>}
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowSkillModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Creating...' : (editingSkill ? 'Update Skill' : 'Create Skill')}
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

export default Projects;

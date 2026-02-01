import React, { useState, useEffect } from 'react';
import { portfolioService, projectService, skillService } from '../../api/services';
import Card from '../../components/Card/Card';
import Badge from '../../components/Badge/Badge';
import Button from '../../components/Button/Button';
import LoadingSkeleton from '../../components/LoadingSkeleton/LoadingSkeleton';
import EmptyState from '../../components/EmptyState/EmptyState';
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage';

const Projects = () => {
  const [portfolio, setPortfolio] = useState(null);
  const [projects, setProjects] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortOrder, setSortOrder] = useState('newest');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
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
        <ErrorMessage title="Projects Error" message={error} />
      </div>
    );
  }

  const sortedProjects = getSortedProjects();

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h4 mb-0">Projects & Skills</h1>
        <div>
          <select className="form-select" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
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
                    <Badge status={project.status} size="small" />
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
                <div key={skill.id} className="p-2 border rounded bg-white">
                  <div className="fw-semibold mb-1">{skill.name}</div>
                  <div className="text-muted small">{skill.proficiency_level} · {skill.years_of_experience || 0} years</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Projects;

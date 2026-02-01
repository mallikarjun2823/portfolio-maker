import React, { useState, useEffect } from 'react';
import { portfolioService, projectService, skillService, educationService } from '../../api/services';
import Button from '../../components/Button/Button';
import LoadingSkeleton from '../../components/LoadingSkeleton/LoadingSkeleton';
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage';

const Resume = () => {
  const [portfolio, setPortfolio] = useState(null);
  const [projects, setProjects] = useState([]);
  const [skills, setSkills] = useState([]);
  const [education, setEducation] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [template, setTemplate] = useState('classic');

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

        const [projectsData, skillsData, educationData] = await Promise.all([
          projectService.getProjects(userPortfolio.id),
          skillService.getSkills(userPortfolio.id),
          educationService.getEducation(userPortfolio.id),
        ]);

        // Filter only published items
        setProjects(projectsData.filter(p => p.status === 'PUBLISHED'));
        setSkills(skillsData.filter(s => s.status === 'PUBLISHED'));
        setEducation(educationData.filter(e => e.status === 'PUBLISHED'));
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
        <h1 className="h4 mb-0">Resume Preview</h1>
        <div className="d-flex gap-2">
          <select className="form-select" value={template} onChange={(e) => setTemplate(e.target.value)}>
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
                <div key={edu.id} className="mb-2">
                  <div className="d-flex justify-content-between">
                    <div>
                      <div className="fw-semibold">{edu.degree}</div>
                      <div className="text-muted">{edu.institution}</div>
                    </div>
                    <div className="text-muted">{edu.start_year} - {edu.end_year || 'Present'}</div>
                  </div>
                  {edu.field_of_study && <div className="mt-1">Field of Study: {edu.field_of_study}</div>}
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
        </div>
      </div>
    </div>
  );
};

export default Resume;

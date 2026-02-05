import React from 'react';
import Card from '../../components/Card/Card';
import Button from '../../components/Button/Button';

export default function PortfolioOverview({ portfolio, projects = [], skills = [], isOwner, onAddProject, onAddSkill, onAddEducation, onAddSocialLink, onUploadDocument, onCreateVersion }) {
  if (!portfolio) return null;

  return (
    <div>
      <h4 className="mb-3">Portfolio Overview</h4>
      <div className="row g-3">
        <div className="col-md-6">
          <Card>
            <Card.Body>
              <h5>Recent Projects</h5>
              {projects.slice(0, 3).map(p => (
                <div key={p.id} className="mb-2">
                  <div className="d-flex justify-content-between">
                    <strong>{p.title}</strong>
                    <span className={`badge ${p.status === 'PUBLISHED' ? 'bg-success' : 'bg-secondary'}`}>
                      {p.status}
                    </span>
                  </div>
                  <small className="text-muted">{p.description?.substring(0, 120)}{p.description && p.description.length>120 ? '...' : ''}</small>
                </div>
              ))}
              {projects.length === 0 && <p className="text-muted">No projects yet</p>}
            </Card.Body>
          </Card>
        </div>

        <div className="col-md-6">
          <Card>
            <Card.Body>
              <h5>Skills Summary</h5>
              <div className="d-flex flex-wrap gap-2">
                {skills.slice(0, 8).map(s => (
                  <span key={s.id} className="badge bg-info">{s.name}</span>
                ))}
                {skills.length === 0 && <p className="text-muted">No skills yet</p>}
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>

      <div className="mt-3 d-flex gap-2 flex-wrap">
        {isOwner && (
          <>
            <Button variant="primary" onClick={onAddProject}>Add Project</Button>
            <Button variant="primary" onClick={onAddSkill}>Add Skill</Button>
            <Button variant="primary" onClick={onAddEducation}>Add Education</Button>
            <Button variant="primary" onClick={onAddSocialLink}>Add Social Link</Button>
            <Button variant="primary" onClick={onUploadDocument}>Upload Document</Button>
            <Button variant="secondary" onClick={onCreateVersion}>Create Snapshot</Button>
          </>
        )}
      </div>
    </div>
  );
}

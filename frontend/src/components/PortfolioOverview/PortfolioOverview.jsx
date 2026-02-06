import React, { useState } from 'react';
import Card from '../../components/Card/Card';
import Button from '../../components/Button/Button';
import { useAuthorization } from '../../rbac';
import { PERMISSIONS } from '../../rbac';

export default function PortfolioOverview({ portfolio, projects = [], skills = [], isOwner, onAddProject, onAddSkill, onAddEducation, onAddSocialLink, onUploadDocument, onCreateVersion }) {
  if (!portfolio) return null;
  const { can } = useAuthorization(portfolio);
  const [open, setOpen] = useState(false);

  return (
    <div>
      <h4 className="mb-3">Portfolio Overview</h4>
      <div className="row g-3">
        <div className="col-md-6">
          <Card>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Recent Projects</h5>
                {can(PERMISSIONS.PROJECT_CREATE) && (
                  <Button variant="primary" size="sm" onClick={onAddProject}>Add</Button>
                )}
              </div>
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
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Skills Summary</h5>
                {can(PERMISSIONS.PROJECT_CREATE) && (
                  <Button variant="primary" size="sm" onClick={onAddSkill}>Add</Button>
                )}
              </div>
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

      {/* Actions moved to inline header buttons for simplicity */}
    </div>
  );
}

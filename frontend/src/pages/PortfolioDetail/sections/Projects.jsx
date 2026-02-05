import React from 'react';
import { useOutletContext } from 'react-router-dom';
import Card from '../../../components/Card/Card';
import Badge from '../../../components/Badge/Badge';
import Button from '../../../components/Button/Button';
import EmptyState from '../../../components/EmptyState/EmptyState';

export default function Projects() {
  const { projects, isOwner, openProjectModal, handleProjectDelete } = useOutletContext();

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>Projects</h4>
        {isOwner && (
          <Button variant="primary" onClick={() => openProjectModal()}>Add Project</Button>
        )}
      </div>
      {projects.length === 0 ? (
        <EmptyState message="No projects yet" />
      ) : (
        <div className="row g-3">
          {projects.map(project => (
            <div className="col-md-6" key={project.id}>
              <Card>
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <h5>{project.title}</h5>
                      <Badge variant={project.status === 'PUBLISHED' ? 'success' : 'secondary'}>
                        {project.status}
                      </Badge>
                    </div>
                    {isOwner && (
                      <div className="d-flex gap-1">
                        <Button variant="outline-primary" size="sm" onClick={() => openProjectModal(project)}>
                          Edit
                        </Button>
                        <Button variant="outline-danger" size="sm" onClick={() => handleProjectDelete(project.id)}>
                          Delete
                        </Button>
                      </div>
                    )}
                  </div>
                  <p className="text-muted">{project.description}</p>
                  {project.tech_stack && (
                    <div className="mb-2">
                      <strong>Tech Stack:</strong> {project.tech_stack}
                    </div>
                  )}
                  {project.project_url && (
                    <a href={project.project_url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary">
                      View Project
                    </a>
                  )}
                </Card.Body>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

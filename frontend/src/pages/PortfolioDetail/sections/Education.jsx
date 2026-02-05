import React from 'react';
import { useOutletContext } from 'react-router-dom';
import Card from '../../../components/Card/Card';
import Button from '../../../components/Button/Button';
import EmptyState from '../../../components/EmptyState/EmptyState';

export default function Education() {
  const { education, isOwner, openEducationModal, handleEducationDelete } = useOutletContext();

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>Education</h4>
        {isOwner && (
          <Button variant="primary" onClick={() => openEducationModal()}>Add Education</Button>
        )}
      </div>
      {education.length === 0 ? (
        <EmptyState message="No education records yet" />
      ) : (
        <div className="row g-3">
          {education.map(edu => (
            <div className="col-md-6" key={edu.id}>
              <Card>
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h5>{edu.institution}</h5>
                      <p className="mb-1">{edu.degree}</p>
                      <small className="text-muted">
                        {edu.start_year} - {edu.end_year || 'Present'}
                      </small>
                    </div>
                    {isOwner && (
                      <div className="d-flex gap-1">
                        <Button variant="outline-primary" size="sm" onClick={() => openEducationModal(edu)}>
                          Edit
                        </Button>
                        <Button variant="outline-danger" size="sm" onClick={() => handleEducationDelete(edu.id)}>
                          Delete
                        </Button>
                      </div>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

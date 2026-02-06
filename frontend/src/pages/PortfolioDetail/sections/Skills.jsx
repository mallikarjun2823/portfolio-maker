import React from 'react';
import { useOutletContext } from 'react-router-dom';
import Card from '../../../components/Card/Card';
import Badge from '../../../components/Badge/Badge';
import Button from '../../../components/Button/Button';
import EmptyState from '../../../components/EmptyState/EmptyState';
import { useAuthorization } from '../../../rbac';
import { PERMISSIONS } from '../../../rbac';

export default function Skills() {
  const { skills, isOwner, openSkillModal, handleSkillDelete } = useOutletContext();

  const { can } = useAuthorization();

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>Skills</h4>
        {isOwner && (
          <Button variant="primary" onClick={() => openSkillModal()}>Add Skill</Button>
        )}
      </div>
      {skills.length === 0 ? (
        <EmptyState message="No skills yet" />
      ) : (
        <div className="row g-3">
          {skills.map(skill => (
            <div className="col-md-4" key={skill.id}>
              <Card>
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <h6>{skill.name}</h6>
                      <Badge variant="info">{skill.proficiency_level}</Badge>
                    </div>
                                    {can(PERMISSIONS.SKILL_EDIT) && (
                                      <div className="d-flex gap-1">
                                        <Button variant="outline-primary" size="sm" onClick={() => openSkillModal(skill)}>
                                          Edit
                                        </Button>
                                        <Button variant="outline-danger" size="sm" onClick={() => handleSkillDelete(skill.id)}>
                                          Delete
                                        </Button>
                                      </div>
                                    )}
                  </div>
                  <div className="small text-muted">
                    {skill.years_of_experience} years experience
                  </div>
                  {skill.skill_certification && (
                    <div className="small mt-1">
                      <strong>Certification:</strong> {skill.skill_certification}
                    </div>
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

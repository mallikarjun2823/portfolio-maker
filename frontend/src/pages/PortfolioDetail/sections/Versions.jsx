import React from 'react';
import { useOutletContext } from 'react-router-dom';
import Badge from '../../../components/Badge/Badge';
import Button from '../../../components/Button/Button';
import EmptyState from '../../../components/EmptyState/EmptyState';

export default function Versions() {
  const { versions, isOwner, setShowVersionModal, handleVersionRevert } = useOutletContext();

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>Version History</h4>
        {isOwner && (
          <Button variant="primary" onClick={() => setShowVersionModal(true)}>Create Snapshot</Button>
        )}
      </div>
      {versions.length === 0 ? (
        <EmptyState message="No versions yet" />
      ) : (
        <div className="list-group">
          {versions.map(version => (
            <div className="list-group-item" key={version.id}>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6>Version {version.version_number}</h6>
                  <p className="mb-1">{version.change_note}</p>
                  <small className="text-muted">
                    Created: {new Date(version.created_at).toLocaleDateString()} by {version.created_by_username}
                  </small>
                  <div className="mt-1">
                    <Badge variant={version.is_draft ? 'secondary' : 'success'}>
                      {version.is_draft ? 'Draft' : 'Published'}
                    </Badge>
                  </div>
                </div>
                {isOwner && (
                  <Button variant="outline-primary" size="sm" onClick={() => handleVersionRevert(version.version_number)}>
                    Revert to This Version
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

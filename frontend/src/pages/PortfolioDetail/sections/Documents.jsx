import React from 'react';
import { useOutletContext } from 'react-router-dom';
import Card from '../../../components/Card/Card';
import Button from '../../../components/Button/Button';
import EmptyState from '../../../components/EmptyState/EmptyState';

export default function Documents() {
  const { documents, isOwner, setShowDocumentModal, handleDocumentDelete } = useOutletContext();

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>Documents</h4>
        {isOwner && (
          <Button variant="primary" onClick={() => setShowDocumentModal(true)}>Upload Document</Button>
        )}
      </div>
      {documents.length === 0 ? (
        <EmptyState message="No documents yet" />
      ) : (
        <div className="row g-3">
          {documents.map(doc => (
            <div className="col-md-4" key={doc.id}>
              <Card>
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h6>{doc.doc_type}</h6>
                      <small className="text-muted">
                        Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                      </small>
                      <div className="mt-2">
                        <a href={doc.file} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary">
                          View Document
                        </a>
                      </div>
                    </div>
                    {isOwner && (
                      <Button variant="outline-danger" size="sm" onClick={() => handleDocumentDelete(doc.id)}>
                        Delete
                      </Button>
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

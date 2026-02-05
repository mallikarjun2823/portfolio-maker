import React from 'react';
import { useOutletContext } from 'react-router-dom';
import Card from '../../../components/Card/Card';
import Button from '../../../components/Button/Button';
import EmptyState from '../../../components/EmptyState/EmptyState';

export default function Social() {
  const { socialLinks, isOwner, openSocialLinkModal, handleSocialLinkDelete } = useOutletContext();

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>Social Links</h4>
        {isOwner && (
          <Button variant="primary" onClick={() => openSocialLinkModal()}>Add Social Link</Button>
        )}
      </div>
      {socialLinks.length === 0 ? (
        <EmptyState message="No social links yet" />
      ) : (
        <div className="row g-3">
          {socialLinks.map(link => (
            <div className="col-md-4" key={link.id}>
              <Card>
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h6>{link.platform}</h6>
                      <a href={link.url} target="_blank" rel="noopener noreferrer" className="small">
                        {link.url}
                      </a>
                    </div>
                    {isOwner && (
                      <div className="d-flex gap-1">
                        <Button variant="outline-primary" size="sm" onClick={() => openSocialLinkModal(link)}>
                          Edit
                        </Button>
                        <Button variant="outline-danger" size="sm" onClick={() => handleSocialLinkDelete(link.id)}>
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

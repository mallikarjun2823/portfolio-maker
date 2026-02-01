import React from 'react';
import Button from '../Button/Button';

const EmptyState = ({ icon, title, description, action, actionLabel }) => {
  return (
    <div className="card text-center">
      <div className="card-body">
        {icon && <div className="mb-3 display-6 text-muted">{icon}</div>}
        <h5 className="card-title">{title}</h5>
        {description && <p className="card-text text-muted">{description}</p>}
        {action && actionLabel && <Button onClick={action}>{actionLabel}</Button>}
      </div>
    </div>
  );
};

export default EmptyState;

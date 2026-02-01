import React from 'react';

const Badge = ({ status, size = 'medium' }) => {
  const statusLower = status?.toLowerCase() || 'draft';
  const colorClass = statusLower === 'published' ? 'bg-success' : 'bg-secondary';
  const sizeClass = size === 'small' ? 'py-1 px-2' : 'py-2 px-3';

  return <span className={`badge ${colorClass} ${sizeClass}`}>{status}</span>;
};

export default Badge;

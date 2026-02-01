import React from 'react';

const ErrorMessage = ({ title = 'Error', message }) => {
  if (!message) return null;

  return (
    <div className="alert alert-danger d-flex align-items-start" role="alert">
      <div className="me-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-exclamation-circle" viewBox="0 0 16 16">
          <path d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14zM8 4a.905.905 0 0 1 .9.9v3.6a.905.905 0 0 1-.9.9.905.905 0 0 1-.9-.9V4.9A.905.905 0 0 1 8 4zm0 7.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
        </svg>
      </div>
      <div>
        <strong>{title}:</strong>
        <div>{message}</div>
      </div>
    </div>
  );
};

export default ErrorMessage;

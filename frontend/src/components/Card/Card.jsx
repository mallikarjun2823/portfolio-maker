import React from 'react';
import './Card.css';

/**
 * Professional Card Component
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Card content
 * @param {string} props.title - Optional card title
 * @param {React.ReactNode} props.header - Optional custom header
 * @param {React.ReactNode} props.footer - Optional footer content
 * @param {boolean} props.noPadding - Remove default padding
 * @param {boolean} props.hoverable - Add hover effect
 * @param {Function} props.onClick - Click handler (makes card clickable)
 * @param {string} props.className - Additional CSS classes
 */
const Card = ({ 
  children, 
  title,
  header,
  footer,
  noPadding = false,
  hoverable = false,
  onClick,
  className = '',
  ...rest
}) => {
  const classes = [
    'card-component',
    hoverable && 'card-hoverable',
    onClick && 'card-clickable',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} onClick={onClick} {...rest}>
      {(title || header) && (
        <div className="card-header">
          {header || <h3 className="card-title">{title}</h3>}
        </div>
      )}
      <div className={`card-body ${noPadding ? 'no-padding' : ''}`}>
        {children}
      </div>
      {footer && (
        <div className="card-footer">
          {footer}
        </div>
      )}
    </div>
  );
};

// Subcomponents for dot-notation usage: <Card.Body />, <Card.Header />, <Card.Footer />
const CardHeader = ({ children, className = '' }) => (
  <div className={["card-header", className].filter(Boolean).join(' ')}>
    {children}
  </div>
);

const CardBody = ({ children, className = '' }) => (
  <div className={["card-body", className].filter(Boolean).join(' ')}>
    {children}
  </div>
);

const CardFooter = ({ children, className = '' }) => (
  <div className={["card-footer", className].filter(Boolean).join(' ')}>
    {children}
  </div>
);

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card;

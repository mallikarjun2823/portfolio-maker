import React from 'react';

const Button = ({
  children,
  onClick,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  fullWidth = false,
  type = 'button',
  className = '',
}) => {
  const btnVariant = variant.startsWith('outline') ? variant.replace('outline-', 'btn-outline-') : `btn-${variant}`;
  const sizeClass = size === 'small' ? 'btn-sm' : size === 'large' ? 'btn-lg' : '';
  const fullClass = fullWidth ? 'w-100' : '';

  const classes = ['btn', btnVariant, sizeClass, fullClass, className].filter(Boolean).join(' ');

  return (
    <button type={type} className={classes} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
};

export default Button;

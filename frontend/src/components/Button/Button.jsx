import React from 'react';
import Icon from '../Icon/Icon';
import './Button.css';

/**
 * Professional Button Component
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Button content
 * @param {'primary'|'secondary'|'outline'|'danger'|'success'|'ghost'} props.variant - Button style variant
 * @param {'sm'|'md'|'lg'} props.size - Button size
 * @param {boolean} props.disabled - Disabled state
 * @param {boolean} props.loading - Loading state (shows spinner)
 * @param {boolean} props.fullWidth - Full width button
 * @param {string} props.icon - Icon name to display before text
 * @param {string} props.iconRight - Icon name to display after text
 * @param {Function} props.onClick - Click handler
 * @param {'button'|'submit'|'reset'} props.type - Button type
 * @param {string} props.className - Additional CSS classes
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  iconRight,
  onClick,
  type = 'button',
  className = '',
  ...rest
}) => {
  const classes = [
    'btn-component',
    `btn-${variant}`,
    `btn-${size}`,
    fullWidth && 'btn-full-width',
    loading && 'btn-loading',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && (
        <span className="btn-spinner">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25" />
            <path d="M14 8a6 6 0 0 1-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
      )}
      {!loading && icon && (
        <Icon name={icon} size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20} />
      )}
      <span className="btn-text">{children}</span>
      {!loading && iconRight && (
        <Icon name={iconRight} size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20} />
      )}
    </button>
  );
};

export default Button;

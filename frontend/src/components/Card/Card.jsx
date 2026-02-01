import React from 'react';

const Card = ({ children, className = '', onClick, noPadding = false }) => {
  const clickableClass = onClick ? 'cursor-pointer' : '';
  const classes = ['card', clickableClass, className].filter(Boolean).join(' ');

  return (
    <div className={classes} onClick={onClick}>
      {noPadding ? <div className="p-0">{children}</div> : <div className="card-body">{children}</div>}
    </div>
  );
};

export default Card;

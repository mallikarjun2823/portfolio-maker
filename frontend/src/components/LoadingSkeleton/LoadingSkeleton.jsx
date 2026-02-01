import React from 'react';
// import styles from './LoadingSkeleton.module.css';

const LoadingSkeleton = ({ type = 'text', count = 1 }) => {
  // const skeletonClass = styles[type] || styles.text;
  
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="placeholder-glow">
          <span className="placeholder col-12"></span>
        </div>
      ))}
    </>
  );
};

export default LoadingSkeleton;

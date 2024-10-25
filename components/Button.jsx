import React from 'react';
import styles from '@/styles/Button.module.css';

const Button = ({ children, className, variant = "solid", ...props }) => {
  return (
    <button
      className={`${styles.button} ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;

import React from 'react';
import styles from '@/styles/Input.module.css';

function Input({ className, ...props }) {
  return (
    <input
      className={`${styles.input} ${className}`}
      {...props}
    />
  );
}

export default Input;

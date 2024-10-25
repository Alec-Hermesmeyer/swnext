import React from 'react';
import styles from '@/styles/Progress.module.css';

export default function Progress({ value, max = 100, ariaLabel }) {
  const percentage = (value / max) * 100;

  return (
    <div className={styles.progressContainer} role="progressbar" aria-label={ariaLabel} aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
      <div
        className={styles.progressBar}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

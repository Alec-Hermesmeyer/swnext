import React, { useState } from 'react';
import styles from '@/styles/Tooltip.module.css';

const Tooltip = ({ children }) => {
  return <div className={styles.tooltip}>{children}</div>;
};

const TooltipProvider = ({ children }) => {
  return <div className={styles.tooltipProvider}>{children}</div>;
};

const TooltipTrigger = ({ children, asChild }) => {
  return <div className={styles.tooltipTrigger}>{children}</div>;
};

const TooltipContent = ({ children, side = 'top', isVisible = false }) => {
  const contentClassName = `${styles.tooltipContent} ${styles[`tooltipContent-${side}`]} ${isVisible ? styles['tooltipContent-show'] : ''}`;
  
  return <div className={contentClassName}>{children}</div>;
};

// Attach subcomponents to the main component
Tooltip.Provider = TooltipProvider;
Tooltip.Trigger = TooltipTrigger;
Tooltip.Content = TooltipContent;

export default Tooltip;

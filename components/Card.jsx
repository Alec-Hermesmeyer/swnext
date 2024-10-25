import React from 'react';
import styles from '@/styles/Card.module.css';

const Card = ({ children, className }) => (
  <div className={`${styles.card} ${className}`}>{children}</div>
);

const CardHeader = ({ children, className }) => (
  <div className={`${styles.cardHeader} ${className}`}>{children}</div>
);

const CardTitle = ({ children, className }) => (
  <h2 className={`${styles.cardTitle} ${className}`}>{children}</h2>
);

const CardDescription = ({ children, className }) => (
  <p className={`${styles.cardDescription} ${className}`}>{children}</p>
);

const CardContent = ({ children, className }) => (
  <div className={`${styles.cardContent} ${className}`}>{children}</div>
);

const CardFooter = ({ children, className }) => (
  <div className={`${styles.cardFooter} ${className}`}>{children}</div>
);

// Attach subcomponents to the main Card component
Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;

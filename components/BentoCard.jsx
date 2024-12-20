import React from "react";
import styles from "@/styles/BentoCard.module.css";

const BentoCard = ({ imageSrc, title, subtitle, description, onClick }) => {
  return (
    <div className={styles.card} onClick={onClick}>
      {imageSrc && (
        <div className={styles.imageContainer}>
          <img src={imageSrc} alt={title} className={styles.image} />
        </div>
      )}
      <div className={styles.content}>
        <h3 className={styles.title}>{title}</h3>
        {subtitle && <h4 className={styles.subtitle}>{subtitle}</h4>}
        {description && <p className={styles.description}>{description}</p>}
      </div>
    </div>
  );
};

export default BentoCard;

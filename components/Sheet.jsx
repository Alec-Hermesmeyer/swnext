"use client";
import { useState } from "react";
import styles from "@/styles/Sheet.module.css";

const Sheet = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSheet = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      <div onClick={toggleSheet}>
        {children[0]} {/* This is the SheetTrigger */}
      </div>
      {isOpen && (
        <div className={styles.overlay}>
          <div className={styles.sheet}>
            {children[1]} {/* This is the SheetContent */}
            <button onClick={toggleSheet} className={styles.closeButton}>
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

const SheetTrigger = ({ asChild, children }) => {
  return asChild ? children : <button>{children}</button>;
};

const SheetContent = ({ children }) => {
  return <div>{children}</div>;
};

// Attach subcomponents to the main component
Sheet.Trigger = SheetTrigger;
Sheet.Content = SheetContent;

export default Sheet;

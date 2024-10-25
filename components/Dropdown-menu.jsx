"use client"
import React, { useState } from "react";
import styles from "@/styles/DropdownMenu.module.css";


const DropdownMenu = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleTriggerClick = () => {
    setIsOpen((prev) => !prev);
  };

  // Map through the children to pass props appropriately
  const clonedChildren = React.Children.map(children, (child) => {
    if (child.type === DropdownMenuTrigger) {
      return React.cloneElement(child, {
        onClick: handleTriggerClick,
      });
    }

    if (child.type === DropdownMenuContent) {
      return React.cloneElement(child, {
        isOpen: isOpen,
      });
    }

    return child;
  });

  return <div className={styles.dropdownMenu}>{clonedChildren}</div>;
};

const DropdownMenuTrigger = ({ children, onClick }) => {
  return (
    <div onClick={onClick} className={styles.dropdownMenuTrigger}>
      {children}
    </div>
  );
};

const DropdownMenuContent = ({ children, isOpen, align = "left" }) => {
  if (!isOpen) return null;

  return (
    <div className={`${styles.dropdownMenuContent} ${styles[`align-${align}`]}`}>
      <div>{children}</div>
    </div>
  );
};

const DropdownMenuItem = ({ children, onClick }) => {
  return (
    <button onClick={onClick} className={styles.dropdownMenuItem}>
      {children}
    </button>
  );
};

const DropdownMenuLabel = ({ children }) => {
  return <div className={styles.dropdownMenuLabel}>{children}</div>;
};

const DropdownMenuSeparator = () => {
  return <div className={styles.dropdownMenuSeparator}></div>;
};

// Attach subcomponents to the main component
DropdownMenu.Trigger = DropdownMenuTrigger;
DropdownMenu.Content = DropdownMenuContent;
DropdownMenu.Item = DropdownMenuItem;
DropdownMenu.Label = DropdownMenuLabel;
DropdownMenu.Separator = DropdownMenuSeparator;

export default DropdownMenu;

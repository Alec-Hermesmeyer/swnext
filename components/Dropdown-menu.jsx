"use client"

import React, { useState } from "react";
import styles from "@/styles/DropdownMenu.module.css";

const DropdownMenu = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleTriggerClick = () => {
    setIsOpen((prev) => !prev);
  };

  const clonedChildren = React.Children.map(children, (child) => {
    if (child.type === DropdownMenuTrigger) {
      return React.cloneElement(child, { onClick: handleTriggerClick });
    } else if (child.type === DropdownMenuContent) {
      return React.cloneElement(child, { isOpen });
    }
    return child;
  });

  return <div className={styles.dropdownMenu}>{clonedChildren}</div>;
};

const DropdownMenuTrigger = ({ children, onClick }) => (
  <div onClick={onClick} className={styles.dropdownMenuTrigger}>
    {children}
  </div>
);

const DropdownMenuContent = ({ children, isOpen, align = "left" }) => {
  if (!isOpen) return null;
  return (
    <div className={`${styles.dropdownMenuContent} ${styles[`align-${align}`]}`}>
      <div>{children}</div>
    </div>
  );
};

const DropdownMenuItem = ({ children, onClick }) => (
  <button onClick={onClick} className={styles.dropdownMenuItem}>
    {children}
  </button>
);

const DropdownMenuLabel = ({ children }) => (
  <div className={styles.dropdownMenuLabel}>{children}</div>
);

const DropdownMenuSeparator = () => (
  <div className={styles.dropdownMenuSeparator}></div>
);

DropdownMenu.Trigger = DropdownMenuTrigger;
DropdownMenu.Content = DropdownMenuContent;
DropdownMenu.Item = DropdownMenuItem;
DropdownMenu.Label = DropdownMenuLabel;
DropdownMenu.Separator = DropdownMenuSeparator;

export default DropdownMenu;

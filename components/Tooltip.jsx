import React, { useState } from 'react';

const Tooltip = ({ children }) => {
  return <div className="relative">{children}</div>;
};

const TooltipProvider = ({ children }) => {
  return <div className="relative">{children}</div>;
};

const TooltipTrigger = ({ children, asChild }) => {
  return <div className="cursor-pointer">{children}</div>;
};

const TooltipContent = ({ children, side = 'top', isVisible = false }) => {
  const contentClassName = `absolute z-10 px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-lg ${
    side === 'top' ? 'bottom-full left-1/2 transform -translate-x-1/2 mb-1' :
    side === 'bottom' ? 'top-full left-1/2 transform -translate-x-1/2 mt-1' :
    side === 'left' ? 'right-full top-1/2 transform -translate-y-1/2 mr-1' :
    'left-full top-1/2 transform -translate-y-1/2 ml-1'
  } ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'} transition-opacity duration-200`;
  
  return <div className={contentClassName}>{children}</div>;
};

// Attach subcomponents to the main component
Tooltip.Provider = TooltipProvider;
Tooltip.Trigger = TooltipTrigger;
Tooltip.Content = TooltipContent;

export default Tooltip;

import React from 'react';

const Button = ({ children, className = "", variant = "solid", ...props }) => {
  const variantClasses = {
    solid: "bg-blue-500 hover:bg-blue-600 text-white",
    outline: "border border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white",
    ghost: "text-blue-500 hover:bg-blue-50"
  };

  return (
    <button
      className={`px-4 py-2 rounded-md font-medium transition-colors ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;

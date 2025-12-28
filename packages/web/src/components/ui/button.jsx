<<<<<<< HEAD
export function Button({ children, className = '', variant = 'default', ...props }) {
  const base = 'px-4 py-2 inline-flex items-center justify-center';
=======
import React from "react";
import clsx from "clsx"; // optional, for cleaner conditional class merging

export function Button({
  children,
  className = "",
  variant = "default", // default variant
  size = "md",          // size: sm, md, lg
  ...props
}) {
  const base = "inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";

  const variantClasses = {
    default: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-400",
    success: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500",
    error: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
  };

  const sizeClasses = {
    sm: "px-2 py-1 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

>>>>>>> origin/main
  return (
    <button
      className={clsx(base, variantClasses[variant], sizeClasses[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
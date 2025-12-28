import React from "react";
import clsx from "clsx"; // optional, for cleaner class merging

export function Alert({ children, className = "", style = {}, variant = "default" }) {
  // You can define variants for different alert types
  const baseClasses = "p-4 rounded-xl border";
  const variantClasses = {
    default: "bg-blue-50 border-blue-300 text-blue-800",
    success: "bg-green-50 border-green-300 text-green-800",
    error: "bg-red-50 border-red-300 text-red-800",
    warning: "bg-yellow-50 border-yellow-300 text-yellow-800",
  };

  return (
    <div className={clsx(baseClasses, variantClasses[variant], className)} style={style}>
      {children}
    </div>
  );
}

export function AlertDescription({ children, className = "" }) {
  return <div className={`text-sm text-gray-700 ${className}`}>{children}</div>;
}

export default Alert;
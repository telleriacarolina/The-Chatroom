import React from "react";
import clsx from "clsx"; // optional, for cleaner class merging

export function Alert({ children, className = "", style = {}, variant = "default" }) {
  // You can define variants for different alert types
  const baseClasses = "p-4 rounded-xl border-2 shadow-lg";
  const variantClasses = {
    default: "bg-card border-kawaii text-foreground",
    success: "bg-green-900/80 border-green-500 text-white",
    error: "bg-passion/90 border-chocolate text-white shadow-glow-red",
    warning: "bg-yellow-900/80 border-yellow-500 text-white",
    info: "bg-card border-kawaii text-foreground",
  };

  return (
    <div className={clsx(baseClasses, variantClasses[variant], className)} style={style}>
      {children}
    </div>
  );
}

export function AlertDescription({ children, className = "" }) {
  return <div className={`text-sm ${className}`}>{children}</div>;
}

export default Alert;
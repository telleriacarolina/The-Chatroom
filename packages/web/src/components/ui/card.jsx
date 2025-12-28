import React from "react";
import clsx from "clsx";

export function Card({ children, className = "", variant = "default", style = {}, ...props }) {
  const base = "bg-white rounded-xl shadow-md overflow-hidden transition-shadow hover:shadow-lg";

  const variantClasses = {
    default: "border border-gray-200",
    outlined: "border border-gray-300 bg-gray-50",
    elevated: "shadow-lg",
  };

  return (
    <div className={clsx(base, variantClasses[variant], className)} style={style} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "", ...props }) {
  return <div className={clsx("px-6 py-4 border-b border-gray-200", className)} {...props}>{children}</div>;
}

export function CardTitle({ children, className = "" }) {
  return <h3 className={clsx("text-lg font-semibold", className)}>{children}</h3>;
}

export function CardDescription({ children, className = "" }) {
  return <p className={clsx("text-sm text-gray-600", className)}>{children}</p>;
}

export function CardContent({ children, className = "" }) {
  return <div className={clsx("p-6", className)}>{children}</div>;
}

export default Card;

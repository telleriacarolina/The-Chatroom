import React from "react";
import clsx from "clsx";

export function Card({ children, className = "", variant = "default", style = {}, ...props }) {
  const base = "bg-card text-card-foreground rounded-2xl shadow-xl overflow-hidden transition-all duration-300 border-2 border-chocolate";

  const variantClasses = {
    default: "hover:shadow-2xl hover:scale-[1.02]",
    outlined: "border-4 border-chocolate shadow-3d",
    elevated: "shadow-3d-lg hover:shadow-2xl",
    passion: "border-passion border-4 shadow-glow-red",
  };

  return (
    <div className={clsx(base, variantClasses[variant], className)} style={style} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "", ...props }) {
  return <div className={clsx("px-4 sm:px-6 py-4 border-b-2 border-chocolate", className)} {...props}>{children}</div>;
}

export function CardTitle({ children, className = "" }) {
  return <h3 className={clsx("text-lg sm:text-xl font-bold text-foreground drop-shadow-text", className)}>{children}</h3>;
}

export function CardDescription({ children, className = "" }) {
  return <p className={clsx("text-sm sm:text-base text-muted-foreground/80", className)}>{children}</p>;
}

export function CardContent({ children, className = "" }) {
  return <div className={clsx("p-4 sm:p-6", className)}>{children}</div>;
}

export default Card;

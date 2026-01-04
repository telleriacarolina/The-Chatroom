import React from "react";
import clsx from "clsx";

export function Button({
  children,
  className = "",
  variant = "default",
  size = "md",
  ...props
}) {
  const base = "inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

  const variantClasses = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground focus:ring-ring",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:ring-secondary",
    ghost: "hover:bg-accent hover:text-accent-foreground focus:ring-accent",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive",
  };

  const sizeClasses = {
    sm: "h-9 px-3 text-sm",
    md: "h-10 px-4 py-2",
    lg: "h-11 px-8 text-lg",
    icon: "h-10 w-10",
  };

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
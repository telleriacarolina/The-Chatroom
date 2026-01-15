import React from "react";
import clsx from "clsx";

export function Button({
  children,
  className = "",
  variant = "default",
  size = "md",
  disabled,
  ...props
}) {
  const base = "inline-flex items-center justify-center font-bold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-burgundy disabled:opacity-50 disabled:pointer-events-none active:scale-95 min-h-[44px] sm:min-h-[48px]";

  const variantClasses = {
    default: "bg-gradient-pink text-chocolate border-2 border-chocolate hover:shadow-glow-pink hover:scale-105 focus:ring-kawaii shadow-lg",
    outline: "border-2 border-chocolate text-foreground bg-transparent hover:bg-chocolate/20 focus:ring-kawaii",
    success: "bg-green-600 text-white border-2 border-chocolate hover:bg-green-700 focus:ring-green-500 shadow-lg",
    error: "bg-gradient-red text-white border-2 border-chocolate hover:shadow-glow-red hover:scale-105 focus:ring-passion shadow-lg",
    ghost: "hover:bg-chocolate/20 text-foreground border-2 border-transparent hover:border-chocolate",
    passion: "bg-passion text-white border-2 border-chocolate hover:shadow-glow-red hover:scale-105 focus:ring-passion shadow-3d",
    kawaii: "bg-kawaii text-chocolate border-2 border-chocolate hover:shadow-glow-pink hover:scale-105 focus:ring-kawaii shadow-3d",
  };

  const sizeClasses = {
    sm: "px-3 py-2 text-sm h-11 sm:h-12",
    md: "px-4 sm:px-6 py-2 sm:py-3 text-base",
    lg: "px-6 sm:px-8 py-3 sm:py-4 text-lg",
    icon: "p-2 w-11 h-11 sm:w-12 sm:h-12",
  };
  
  return (
    <button
      className={clsx(base, variantClasses[variant], sizeClasses[size], className)}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
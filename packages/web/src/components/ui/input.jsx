import React from "react";

export function Input({ className = "", ...props }) {
  return (
    <input
      className={`w-full px-3 sm:px-4 py-2 sm:py-3 min-h-[44px] border-2 border-chocolate rounded-xl bg-card text-foreground placeholder:text-muted-foreground/60 shadow-inner focus:outline-none focus:ring-2 focus:ring-kawaii focus:border-kawaii disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ${className}`}
      {...props}
    />
  );
}

export default Input;

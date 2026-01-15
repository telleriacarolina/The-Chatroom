import * as React from "react"

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
}

export function Progress({ className = '', value = 0, ...props }: ProgressProps) {
  return (
    <div
      className={`relative h-4 w-full overflow-hidden rounded-full bg-chocolate border-2 border-chocolate ${className}`}
      {...props}
    >
      <div
        className="h-full w-full flex-1 bg-gradient-pink transition-all shadow-inner"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </div>
  );
}

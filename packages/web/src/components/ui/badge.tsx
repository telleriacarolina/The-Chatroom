export function Badge({ children, className = '', variant = 'default', ...props }) {
  const variants = {
    default: 'bg-kawaii text-chocolate border-chocolate hover:shadow-glow-pink',
    secondary: 'bg-passion text-white border-chocolate hover:shadow-glow-red',
    destructive: 'bg-destructive text-destructive-foreground border-chocolate hover:bg-destructive/90',
    outline: 'border-2 border-chocolate text-foreground bg-transparent hover:bg-chocolate/20',
    success: 'bg-green-600 text-white border-chocolate hover:bg-green-700',
  };
  
  const baseClasses = 'inline-flex items-center rounded-full border-2 px-2.5 py-0.5 text-xs sm:text-sm font-bold transition-all duration-200';
  const variantClasses = variants[variant] || variants.default;
  
  return (
    <div className={`${baseClasses} ${variantClasses} ${className}`} {...props}>
      {children}
    </div>
  );
}

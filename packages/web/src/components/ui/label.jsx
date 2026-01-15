export function Label({ children, className = '', ...props }) {
  return (
    <label className={`block text-sm sm:text-base font-bold text-foreground ${className}`} {...props}>
      {children}
    </label>
  );
}

export default Label;

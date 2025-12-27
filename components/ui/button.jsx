export function Button({ children, className = '', variant, ...props }) {
  const base = 'px-4 py-2 inline-flex items-center justify-center';
  return (
    <button className={`${base} ${className}`} {...props}>
      {children}
    </button>
  );
}

export default Button;

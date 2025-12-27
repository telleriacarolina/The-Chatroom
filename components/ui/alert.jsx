export function Alert({ children, className = '', style }) {
  return (
    <div className={`p-3 border ${className}`} style={style}>
      {children}
    </div>
  );
}

export function AlertDescription({ children, className = '' }) {
  return <div className={`text-sm ${className}`}>{children}</div>;
}

export default Alert;

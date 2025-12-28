export function Card({ children, className = '', style = {}, ...props }) {
  return (
    <div className={`bg-white ${className}`} style={style} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', ...props }) {
  return <div className={`p-4 ${className}`} {...props}>{children}</div>;
}

export function CardTitle({ children, className = '' }) {
  return <h3 className={`${className} font-semibold`}>{children}</h3>;
}

export function CardDescription({ children }) {
  return <p className="text-sm text-gray-600">{children}</p>;
}

export function CardContent({ children, className = '' }) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}

export function Card({ children, className = '', style }) {
  return (
    <div className={`bg-white ${className}`} style={style}>
      {children}
    </div>
  );
}

export function CardHeader({ children }) {
  return <div className="p-4">{children}</div>;
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

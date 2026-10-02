export function Card({ className = "", children }) {
  return (
    <div
      className={`bg-gray-800 border border-gray-700 rounded-xl shadow-md text-gray-100 ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className = "", children }) {
  return (
    <div className={`p-4 flex items-center justify-between ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ className = "", children }) {
  return (
    <h2 className={`text-lg font-semibold text-gray-100 ${className}`}>
      {children}
    </h2>
  );
}

export function CardContent({ className = "", children }) {
  return <div className={`p-4 text-gray-200 ${className}`}>{children}</div>;
}

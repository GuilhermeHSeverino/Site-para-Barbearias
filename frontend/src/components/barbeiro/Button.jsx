export function Button({ variant = "default", className = "", ...props }) {
  const base =
    "px-4 py-2 rounded-lg font-medium transition-colors duration-200";

  const variants = {
    default: "bg-blue-600 text-white hover:bg-blue-500",
    outline:
      "border border-gray-500 text-gray-200 hover:bg-gray-700 hover:text-white",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

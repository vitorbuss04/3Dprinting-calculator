import React from 'react';

// --- Card ---
export const Card: React.FC<{ children: React.ReactNode; className?: string; title?: string }> = ({ children, className = '', title }) => (
  <div className={`bg-white border border-gray-200 rounded-xl p-5 shadow-sm ${className}`}>
    {title && <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>}
    {children}
  </div>
);

// --- Input Field ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  subLabel?: string;
}

export const Input: React.FC<InputProps> = ({ label, subLabel, className = '', ...props }) => (
  <div className="flex flex-col gap-1 mb-3">
    <label className="text-sm font-medium text-gray-700">
      {label}
      {subLabel && <span className="text-xs text-gray-500 ml-1">({subLabel})</span>}
    </label>
    <input
      className={`bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-400 ${className}`}
      {...props}
    />
  </div>
);

// --- Select Field ---
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { value: string | number; label: string }[];
}

export const Select: React.FC<SelectProps> = ({ label, options, className = '', ...props }) => (
  <div className="flex flex-col gap-1 mb-3">
    <label className="text-sm font-medium text-gray-700">{label}</label>
    <select
      className={`bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none ${className}`}
      {...props}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

// --- Button ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseStyle = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-sm",
    secondary: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm",
    danger: "bg-red-600 hover:bg-red-700 text-white shadow-sm",
    ghost: "bg-transparent hover:bg-gray-100 text-gray-600 border border-gray-200",
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};
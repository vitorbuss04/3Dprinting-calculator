import React from 'react';

// --- Card ---
export const Card: React.FC<{ children: React.ReactNode; className?: string; title?: string }> = ({ children, className = '', title }) => (
  <div className={`bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg ${className}`}>
    {title && <h3 className="text-lg font-semibold text-slate-200 mb-4">{title}</h3>}
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
    <label className="text-sm font-medium text-slate-300">
      {label}
      {subLabel && <span className="text-xs text-slate-500 ml-1">({subLabel})</span>}
    </label>
    <input
      className={`bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${className}`}
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
    <label className="text-sm font-medium text-slate-300">{label}</label>
    <select
      className={`bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none ${className}`}
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
    primary: "bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-900/20",
    secondary: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/20",
    danger: "bg-red-600 hover:bg-red-500 text-white",
    ghost: "bg-transparent hover:bg-slate-700 text-slate-300 border border-slate-700",
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};
import React from 'react';

// --- Card ---
export const Card: React.FC<{ children: React.ReactNode; className?: string; title?: string }> = ({ children, className = '', title }) => (
  <div className={`bg-white border border-gray-100 rounded-2xl p-6 shadow-xl shadow-gray-200/50 transition-all duration-300 ${className}`}>
    {title && <h3 className="text-lg font-bold text-gray-800 mb-5 tracking-tight">{title}</h3>}
    {children}
  </div>
);

// --- Input Field (Correct Controlled Component Pattern) ---
interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  label: string;
  subLabel?: string;
  icon?: React.ReactNode;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const Input: React.FC<InputProps> = ({ label, subLabel, icon, className = '', value, onChange, ...rest }) => (
  <div className="flex flex-col gap-1.5 mb-4 group">
    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 group-focus-within:text-blue-600 transition-colors">
      {label}
      {subLabel && <span className="text-[10px] lowercase font-medium ml-1">({subLabel})</span>}
    </label>
    <div className="relative flex items-center">
      {icon && (
        <div className="absolute left-4 text-gray-400 group-focus-within:text-blue-500 transition-colors pointer-events-none z-10 flex items-center justify-center">
          {icon}
        </div>
      )}
      <input
        value={value} // Explicitly pass value
        onChange={onChange} // Explicitly pass onChange
        className={`w-full bg-gray-50/50 border border-gray-200 text-gray-900 rounded-xl py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white outline-none transition-all placeholder-gray-400 text-sm ${icon ? 'pl-12 pr-4' : 'px-4'} ${className}`}
        {...rest}
      />
    </div>
  </div>
);

// --- Select Field (Correct Controlled Component Pattern) ---
interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'value' | 'onChange'> {
  label: string;
  options: { value: string | number; label: string }[];
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export const Select: React.FC<SelectProps> = ({ label, options, className = '', value, onChange, ...rest }) => (
  <div className="flex flex-col gap-1.5 mb-4">
    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">{label}</label>
    <select
      value={value} // Explicitly pass value
      onChange={onChange} // Explicitly pass onChange
      className={`bg-gray-50/50 border border-gray-200 text-gray-900 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white outline-none transition-all text-sm appearance-none ${className}`}
      {...rest}
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
  const baseStyle = "px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:scale-100";
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 hover:shadow-blue-300",
    secondary: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200 hover:shadow-emerald-300",
    danger: "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-100 hover:shadow-red-200",
    ghost: "bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 shadow-sm",
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};
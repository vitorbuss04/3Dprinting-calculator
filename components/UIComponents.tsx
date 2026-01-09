import React from 'react';

export const neuMain = "bg-[#f0f0f0]";
// Sombras levemente mais suaves e com maior difusão para evitar o aspecto "estranho"
export const neuShadowOut = "shadow-[10px_10px_20px_#d1d1d1,-10px_-10px_20px_#ffffff]";
export const neuShadowIn = "shadow-[inset_6px_6px_12px_#d1d1d1,inset_-6px_-6px_12px_#ffffff]";
export const neuButton = "shadow-[6px_6px_12px_#d1d1d1,-6px_-6px_12px_#ffffff] active:shadow-[inset_4px_4px_8px_#d1d1d1,inset_-4px_-4px_8px_#ffffff] active:scale-[0.98]";

// --- Card ---
export const Card: React.FC<{ children: React.ReactNode; className?: string; title?: string }> = ({ children, className = '', title }) => (
  <div className={`${neuMain} ${neuShadowOut} rounded-[2.5vw] p-[2vw] transition-all duration-500 flex flex-col overflow-visible ${className}`}>
    {title && (
      <div className="mb-[2vh] flex items-center gap-3 shrink-0 overflow-visible">
        <h3 className="text-[clamp(0.6rem,1vw,0.85rem)] font-black text-gray-500 uppercase tracking-[0.3em]">{title}</h3>
        <div className="h-px flex-1 bg-gray-200/50"></div>
      </div>
    )}
    <div className="flex-1 min-h-0 relative overflow-visible">
      {children}
    </div>
  </div>
);

// --- Input Field ---
export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string; subLabel?: string; icon?: React.ReactNode }> = ({ label, subLabel, icon, className = '', ...props }) => (
  <div className="flex flex-col gap-1.5 mb-5 group shrink-0 overflow-visible">
    <label className="text-[clamp(0.55rem,0.8vw,0.75rem)] font-black text-gray-400 uppercase tracking-widest ml-5 transition-colors group-focus-within:text-blue-500">
      {label}
      {subLabel && <span className="text-[0.6rem] lowercase font-bold ml-1 opacity-60">({subLabel})</span>}
    </label>
    <div className="relative flex items-center overflow-visible p-1">
      {icon && (
        <div className="absolute left-6 text-gray-400 group-focus-within:text-blue-500 transition-colors pointer-events-none z-10 flex items-center justify-center">
          {icon}
        </div>
      )}
      <input
        className={`w-full ${neuMain} ${neuShadowIn} border-none text-gray-700 rounded-2xl py-3.5 focus:ring-0 outline-none transition-all placeholder-gray-300 text-sm font-bold ${icon ? 'pl-16 pr-6' : 'px-6'} ${className}`}
        {...props}
      />
    </div>
  </div>
);

// --- Select Field ---
export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; options: { value: string | number; label: string }[] }> = ({ label, options, className = '', ...props }) => (
  <div className="flex flex-col gap-1.5 mb-5 shrink-0 overflow-visible">
    <label className="text-[clamp(0.55rem,0.8vw,0.75rem)] font-black text-gray-400 uppercase tracking-widest ml-5">{label}</label>
    <div className="p-1 overflow-visible">
      <div className={`relative ${neuMain} ${neuShadowIn} rounded-2xl`}>
        <select
          className={`w-full bg-transparent border-none text-gray-700 px-6 py-3.5 focus:ring-0 outline-none transition-all text-sm font-bold appearance-none cursor-pointer ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </div>
      </div>
    </div>
  </div>
);

// --- Button ---
export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' }> = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseStyle = `px-8 py-4 rounded-2xl font-black text-[clamp(0.55rem,0.75vw,0.7rem)] uppercase tracking-[0.25em] transition-all duration-300 flex items-center justify-center gap-3 shrink-0 ${neuButton}`;
  const variants = {
    primary: "text-blue-600",
    secondary: "text-emerald-600",
    danger: "text-red-500",
    ghost: "text-gray-400",
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

import React from 'react';
import { cn } from '../../utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
    containerClassName?: string;
}

export const Input: React.FC<InputProps> = ({
    className,
    containerClassName,
    label,
    error,
    icon,
    id,
    ...props
}) => {
    return (
        <div className={cn("w-full space-y-1", containerClassName)}>
            {label && (
                <label htmlFor={id} className="block text-[10px] font-technical font-bold uppercase tracking-widest text-slate-500 ml-0.5">
                    {label}
                </label>
            )}
            <div className="relative group">
                {icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">
                        {icon}
                    </div>
                )}
                <input
                    id={id}
                    className={cn(
                        "w-full bg-slate-900 border border-slate-800 rounded-none px-4 py-2 outline-none transition-all duration-150",
                        "font-technical text-sm",
                        "focus:border-primary focus:bg-slate-800/50",
                        "placeholder:text-slate-700 text-slate-200",
                        icon && "pl-10",
                        error && "border-red-500 focus:border-red-500",
                        className
                    )}
                    {...props}
                />
            </div>
            {error && <p className="text-[10px] font-technical text-red-500 mt-1">{error}</p>}
        </div>
    );
};

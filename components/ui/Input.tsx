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
        <div className={cn("w-full space-y-1.5", containerClassName)}>
            {label && (
                <label htmlFor={id} className="block text-sm font-medium text-gray-600 ml-1 dark:text-gray-400">
                    {label}
                </label>
            )}
            <div className="relative group">
                {icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                        {icon}
                    </div>
                )}
                <input
                    id={id}
                    className={cn(
                        "w-full bg-white/50 backdrop-blur-sm border border-gray-200 rounded-xl px-4 py-2.5 outline-none transition-all duration-300",
                        "focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white",
                        "placeholder:text-gray-400 text-gray-800",
                        "dark:bg-dark-surface/50 dark:border-white/10 dark:text-gray-100 dark:focus:bg-dark-surface dark:placeholder:text-gray-600",
                        icon && "pl-10",
                        error && "border-red-500 focus:ring-red-500/20 focus:border-red-500",
                        className
                    )}
                    {...props}
                />
            </div>
            {error && <p className="text-xs text-red-500 ml-1">{error}</p>}
        </div>
    );
};

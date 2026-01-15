import React from 'react';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'neumorphic';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    className,
    variant = 'primary',
    size = 'md',
    isLoading,
    leftIcon,
    children,
    ...props
}) => {
    const baseStyles = "inline-flex items-center justify-center font-semibold transition-all duration-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";

    const variants = {
        primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30 focus:ring-blue-500 border border-transparent dark:shadow-blue-500/10",
        secondary: "bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/30 focus:ring-emerald-500 border border-transparent dark:shadow-emerald-500/10",
        ghost: "bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-transparent dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white",
        neumorphic: "bg-[#f0f2f5] text-gray-700 shadow-[5px_5px_8px_#d1d5db,-5px_-5px_8px_#ffffff] hover:shadow-[inset_5px_5px_8px_#d1d5db,inset_-5px_-5px_8px_#ffffff] border border-gray-100 dark:bg-[#1a1f2e] dark:text-gray-300 dark:shadow-[5px_5px_8px_#0e1119,-5px_-5px_8px_#262d43] dark:hover:shadow-[inset_5px_5px_8px_#0e1119,inset_-5px_-5px_8px_#262d43] dark:border-white/5"
    };

    const sizes = {
        sm: "px-3 py-1.5 text-xs",
        md: "px-5 py-2.5 text-sm",
        lg: "px-8 py-3.5 text-base"
    };

    return (
        <button
            className={cn(baseStyles, variants[variant], sizes[size], className)}
            disabled={isLoading || props.disabled}
            {...props}
        >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
            {children}
        </button>
    );
};

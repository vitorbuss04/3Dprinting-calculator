import React from 'react';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
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
    const baseStyles = "inline-flex items-center justify-center font-technical font-bold uppercase tracking-wider transition-all duration-150 rounded-none focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed active:translate-y-[1px]";

    const variants = {
        primary: "bg-primary text-white hover:bg-orange-600 border border-primary active:bg-orange-700",
        secondary: "bg-secondary text-slate-950 hover:bg-cyan-400 border border-secondary active:bg-cyan-500",
        ghost: "bg-transparent text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent",
        outline: "bg-transparent text-white border border-slate-700 hover:border-primary hover:text-primary"
    };

    const sizes = {
        sm: "px-3 py-1.5 text-[10px]",
        md: "px-5 py-2.5 text-xs",
        lg: "px-8 py-3.5 text-sm"
    };

    return (
        <button
            className={cn(baseStyles, variants[variant], sizes[size], className)}
            disabled={isLoading || props.disabled}
            {...props}
        >
            {isLoading && <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />}
            {!isLoading && leftIcon && <div className="mr-2 flex items-center justify-center">{leftIcon}</div>}
            <span className="inline-flex items-center whitespace-nowrap">{children}</span>
        </button>
    );
};

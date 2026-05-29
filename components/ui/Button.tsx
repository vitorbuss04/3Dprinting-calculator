import React from 'react';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
}

const getVariantStyles = (variant: 'primary' | 'secondary' | 'ghost' | 'outline') => {
    switch (variant) {
        case 'primary':
            return "bg-primary text-white hover:bg-orange-600 border border-primary active:bg-orange-700";
        case 'secondary':
            return "bg-secondary text-slate-950 hover:bg-cyan-400 border border-secondary active:bg-cyan-500";
        case 'ghost':
            return "bg-transparent text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent";
        case 'outline':
            return "bg-transparent text-white border border-slate-700 hover:border-primary hover:text-primary";
        default:
            return "";
    }
};

const getSizeStyles = (size: 'sm' | 'md' | 'lg') => {
    switch (size) {
        case 'sm':
            return "px-3 py-1.5 text-[10px]";
        case 'md':
            return "px-5 py-2.5 text-xs";
        case 'lg':
            return "px-8 py-3.5 text-sm";
        default:
            return "";
    }
};

export const Button: React.FC<ButtonProps> = ({
    className,
    variant = 'primary',
    size = 'md',
    isLoading,
    leftIcon,
    children,
    type = 'button',
    disabled,
    onClick,
    onMouseEnter,
    onMouseLeave,
    id,
    style,
    title,
    tabIndex,
    form,
}) => {
    const baseStyles = "inline-flex items-center justify-center font-technical font-bold uppercase tracking-wider transition-all duration-150 rounded-none focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed active:translate-y-[1px]";

    return (
        <button
            className={cn(baseStyles, getVariantStyles(variant), getSizeStyles(size), className)}
            disabled={isLoading || disabled}
            type={type}
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            id={id}
            style={style}
            title={title}
            tabIndex={tabIndex}
            form={form}
        >
            {isLoading && <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />}
            {!isLoading && leftIcon && <div className="mr-2 flex items-center justify-center">{leftIcon}</div>}
            <span className="inline-flex items-center whitespace-nowrap">{children}</span>
        </button>
    );
};


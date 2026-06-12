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
            return "bg-primary text-white hover:bg-primary-hover border border-transparent active:opacity-90";
        case 'secondary':
            return "bg-canvas text-primary hover:bg-surface-strong border border-hairline active:bg-surface-strong";
        case 'ghost':
            return "bg-transparent text-muted hover:text-ink hover:bg-surface-strong border border-transparent";
        case 'outline':
            return "bg-transparent text-body border border-hairline hover:bg-surface-soft hover:text-ink";
        default:
            return "";
    }
};

const getSizeStyles = (size: 'sm' | 'md' | 'lg') => {
    switch (size) {
        case 'sm':
            return "px-4 py-1.5 text-xs h-8";
        case 'md':
            return "px-6 py-2.5 text-sm h-10";
        case 'lg':
            return "px-8 py-3.5 text-base h-12";
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
    const baseStyles = "inline-flex items-center justify-center font-sans font-medium transition-all duration-150 rounded-full focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";

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


import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'industrial' | 'outline' | 'default';
    children: React.ReactNode;
}

const getVariantStyles = (variant: 'industrial' | 'outline' | 'default') => {
    switch (variant) {
        case 'default':
            return "bg-slate-900 border border-slate-800";
        case 'industrial':
            return "bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-colors duration-200";
        case 'outline':
            return "bg-transparent border border-slate-800";
        default:
            return "";
    }
};

export const Card: React.FC<CardProps> = ({
    className,
    variant = 'industrial',
    children,
    id,
    style,
    onClick,
    onMouseEnter,
    onMouseLeave,
    title,
}) => {
    return (
        <div
            className={cn(
                "rounded-none p-6",
                getVariantStyles(variant),
                className
            )}
            id={id}
            style={style}
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            title={title}
        >
            {children}
        </div>
    );
};


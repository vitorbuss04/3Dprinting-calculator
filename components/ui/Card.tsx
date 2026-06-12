import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'industrial' | 'outline' | 'default';
    children: React.ReactNode;
}

const getVariantStyles = (variant: 'industrial' | 'outline' | 'default') => {
    switch (variant) {
        case 'default':
            return "bg-surface-card border border-hairline shadow-sm";
        case 'industrial':
            return "bg-surface-card border border-hairline hover:border-border-strong hover:shadow-md transition-all duration-200 shadow-sm";
        case 'outline':
            return "bg-transparent border border-hairline";
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
                "rounded-2xl p-6",
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


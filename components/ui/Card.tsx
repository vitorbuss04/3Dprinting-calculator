import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'industrial' | 'outline' | 'default';
    children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
    className,
    variant = 'industrial',
    children,
    ...props
}) => {
    const variants = {
        default: "bg-slate-900 border border-slate-800",
        industrial: "bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-colors duration-200",
        outline: "bg-transparent border border-slate-800"
    };

    return (
        <div
            className={cn(
                "rounded-none p-6",
                variants[variant],
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};

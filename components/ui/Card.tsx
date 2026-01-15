import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'glass' | 'neumorphic' | 'default';
    children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
    className,
    variant = 'glass',
    children,
    ...props
}) => {
    const variants = {
        default: "bg-white border border-gray-100 shadow-sm dark:bg-dark-surface dark:border-dark-border",
        glass: "backdrop-blur-xl bg-white/70 border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:bg-dark-surface/70 dark:border-white/10 dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]",
        neumorphic: "bg-[#f0f2f5] shadow-[6px_6px_10px_0_rgba(163,177,198,0.5),-6px_-6px_10px_0_rgba(255,255,255,0.8)] border border-white/40 dark:bg-[#1a1f2e] dark:shadow-[5px_5px_10px_#0e1119,-5px_-5px_10px_#262d43] dark:border-white/5"
    };

    return (
        <div
            className={cn(
                "rounded-2xl p-6 transition-all duration-300",
                variants[variant],
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};

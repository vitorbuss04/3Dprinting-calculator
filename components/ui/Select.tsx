import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../../utils/cn';

interface SelectOption {
    value: string | number;
    label: string;
    disabled?: boolean;
}

interface SelectProps {
    label?: string;
    options: SelectOption[];
    value: string | number;
    onChange: (value: string | number) => void;
    className?: string;
    placeholder?: string;
    icon?: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({
    label,
    options,
    value,
    onChange,
    className,
    placeholder = "Selecione...",
    icon
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (option: SelectOption) => {
        if (option.disabled) return;
        onChange(option.value);
        setIsOpen(false);
    };

    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div className="w-full space-y-1.5" ref={containerRef}>
            {label && (
                <label className="block text-sm font-medium text-gray-600 ml-1 dark:text-gray-400">
                    {label}
                </label>
            )}
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        "w-full bg-white/50 backdrop-blur-sm border border-gray-200 rounded-xl px-4 py-2.5 flex items-center justify-between outline-none transition-all duration-300",
                        "focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white",
                        isOpen && "ring-2 ring-blue-500/20 border-blue-500 bg-white dark:bg-dark-surface",
                        "dark:bg-dark-surface/50 dark:border-white/10 dark:text-gray-100 dark:focus:bg-dark-surface",
                        icon && "pl-10",
                        className
                    )}
                >
                    {icon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            {icon}
                        </div>
                    )}
                    <span className={cn("truncate text-sm", !selectedOption ? "text-gray-400" : "text-gray-800 dark:text-gray-100")}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                    <ChevronDown
                        size={16}
                        className={cn(
                            "text-gray-400 transition-transform duration-200 flex-shrink-0 ml-2",
                            isOpen && "rotate-180 text-blue-500"
                        )}
                    />
                </button>

                {isOpen && (
                    <div className="absolute top-full left-0 w-full mt-2 bg-white/90 backdrop-blur-xl border border-white/20 rounded-xl shadow-xl shadow-gray-200/50 z-50 overflow-hidden max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-200 dark:bg-dark-surface/95 dark:border-white/10 dark:shadow-black/20">
                        {options.map((opt) => (
                            <div
                                key={opt.value}
                                onClick={() => handleSelect(opt)}
                                className={cn(
                                    "px-4 py-2.5 text-sm cursor-pointer transition-colors flex items-center justify-between",
                                    opt.disabled ? "opacity-50 cursor-not-allowed bg-gray-50 dark:bg-white/5" : "hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-white/5 dark:hover:text-blue-400",
                                    opt.value === value ? "bg-blue-50 text-blue-700 font-medium dark:bg-blue-500/10 dark:text-blue-400" : "text-gray-700 dark:text-gray-300"
                                )}
                            >
                                <span className="truncate">{opt.label}</span>
                                {opt.value === value && <Check size={14} className="text-blue-600" />}
                            </div>
                        ))}
                        {options.length === 0 && (
                            <div className="px-4 py-3 text-sm text-gray-400 text-center">
                                Sem opções disponíveis
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

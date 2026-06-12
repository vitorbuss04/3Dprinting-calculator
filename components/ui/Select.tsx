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
        <div className="w-full space-y-1" ref={containerRef}>
            {label && (
                <label className="block text-xs font-sans font-medium text-muted ml-0.5">
                    {label}
                </label>
            )}
            <div className="relative group">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        "w-full bg-canvas border border-hairline rounded-lg px-4 py-2.5 flex items-center justify-between outline-none transition-all duration-150",
                        "font-sans text-sm text-ink",
                        "focus:border-primary focus:bg-canvas",
                        "hover:border-border-strong",
                        isOpen && "border-primary ring-1 ring-primary bg-canvas",
                        icon && "pl-10",
                        className
                    )}
                >
                    {icon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors">
                            {icon}
                        </div>
                    )}
                    <span className={cn("truncate font-sans text-sm", !selectedOption ? "text-muted-soft" : "text-ink")}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                    <ChevronDown
                        size={14}
                        className={cn(
                            "text-muted transition-transform duration-200 flex-shrink-0 ml-2",
                            isOpen && "rotate-180 text-primary"
                        )}
                    />
                </button>

                {isOpen && (
                    <div className="absolute top-full left-0 w-full mt-1.5 bg-surface-elevated border border-hairline rounded-xl shadow-lg shadow-black/5 z-50 overflow-hidden max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                        {options.map((opt) => (
                            <div
                                key={opt.value}
                                onClick={() => handleSelect(opt)}
                                className={cn(
                                    "px-4 py-2.5 text-sm font-sans cursor-pointer transition-all duration-100 flex items-center justify-between border-l-2",
                                    opt.disabled 
                                        ? "opacity-30 cursor-not-allowed border-l-transparent" 
                                        : "hover:bg-surface-soft hover:text-ink hover:border-l-primary border-l-transparent",
                                    opt.value === value 
                                        ? "bg-primary-soft text-primary font-medium border-l-primary" 
                                        : "text-body"
                                )}
                            >
                                <span className="truncate">{opt.label}</span>
                                {opt.value === value && <Check size={12} className="text-primary shrink-0" />}
                            </div>
                        ))}
                        {options.length === 0 && (
                            <div className="px-4 py-3 text-xs font-sans text-muted text-center">
                                Sem opções disponíveis
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

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
                <label className="block text-[10px] font-technical font-bold uppercase tracking-widest text-slate-500 ml-0.5">
                    {label}
                </label>
            )}
            <div className="relative group">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        "w-full bg-slate-900 border border-slate-800 rounded-none px-4 py-2 flex items-center justify-between outline-none transition-all duration-150",
                        "font-technical text-sm",
                        "focus:border-primary focus:bg-slate-800/50",
                        "hover:border-slate-700",
                        isOpen && "border-primary bg-slate-800/50",
                        icon && "pl-10",
                        className
                    )}
                >
                    {icon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">
                            {icon}
                        </div>
                    )}
                    <span className={cn("truncate font-technical text-sm", !selectedOption ? "text-slate-700" : "text-slate-200")}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                    <ChevronDown
                        size={14}
                        className={cn(
                            "text-slate-600 transition-transform duration-200 flex-shrink-0 ml-2",
                            isOpen && "rotate-180 text-primary"
                        )}
                    />
                </button>

                {isOpen && (
                    <div className="absolute top-full left-0 w-full mt-0.5 bg-slate-950 border border-slate-800 rounded-none shadow-2xl shadow-black/50 z-50 overflow-hidden max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                        {options.map((opt) => (
                            <div
                                key={opt.value}
                                onClick={() => handleSelect(opt)}
                                className={cn(
                                    "px-4 py-2.5 text-sm font-technical cursor-pointer transition-all duration-100 flex items-center justify-between border-l-2",
                                    opt.disabled 
                                        ? "opacity-30 cursor-not-allowed border-l-transparent" 
                                        : "hover:bg-slate-800/80 hover:text-white hover:border-l-primary border-l-transparent",
                                    opt.value === value 
                                        ? "bg-slate-900 text-primary font-bold border-l-primary" 
                                        : "text-slate-400"
                                )}
                            >
                                <span className="truncate">{opt.label}</span>
                                {opt.value === value && <Check size={12} className="text-primary shrink-0" />}
                            </div>
                        ))}
                        {options.length === 0 && (
                            <div className="px-4 py-3 text-[10px] font-technical text-slate-600 text-center uppercase tracking-widest">
                                Sem opções disponíveis
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

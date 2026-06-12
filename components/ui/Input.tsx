import React from 'react';
import { cn } from '../../utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
    containerClassName?: string;
}

export const Input: React.FC<InputProps> = ({
    className,
    containerClassName,
    label,
    error,
    icon,
    id,
    type = 'text',
    value,
    onChange,
    placeholder,
    disabled,
    required,
    min,
    max,
    step,
    defaultValue,
    onKeyDown,
    onKeyUp,
    onFocus,
    onBlur,
    name,
    readOnly,
    autoComplete,
}) => {
    return (
        <div className={cn("w-full space-y-1", containerClassName)}>
            {label && (
                <label htmlFor={id} className="block text-xs font-sans font-medium text-muted ml-0.5">
                    {label}
                </label>
            )}
            <div className="relative group">
                {icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors">
                        {icon}
                    </div>
                )}
                <input
                     id={id}
                     className={cn(
                         "w-full bg-canvas border border-hairline rounded-lg px-4 py-2.5 outline-none transition-all duration-150",
                         "font-sans text-sm text-ink",
                         "focus:border-primary focus:ring-1 focus:ring-primary focus:bg-canvas",
                         "placeholder:text-muted-soft",
                         icon && "pl-10",
                         error && "border-red focus:border-red focus:ring-red",
                         className
                     )}
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    disabled={disabled}
                    required={required}
                    min={min}
                    max={max}
                    step={step}
                    defaultValue={defaultValue}
                    onKeyDown={onKeyDown}
                    onKeyUp={onKeyUp}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    name={name}
                    readOnly={readOnly}
                    autoComplete={autoComplete}
                />
            </div>
            {error && <p className="text-xs font-sans text-red mt-1">{error}</p>}
        </div>
    );
};


import { SelectHTMLAttributes, forwardRef } from 'react';
import { CaretDown } from '@phosphor-icons/react';

interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    helperText?: string;
    options: SelectOption[];
    placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ className = '', label, error, helperText, options, placeholder, disabled, ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        {label}
                    </label>
                )}
                <div className="relative">
                    <select
                        ref={ref}
                        disabled={disabled}
                        className={`
              w-full 
              appearance-none 
              rounded-lg 
              border 
              bg-white 
              px-3 py-2 
              pr-10 
              text-sm 
              text-slate-900 
              transition-colors 
              focus:outline-none 
              focus:ring-2 
              focus:ring-primary/20 
              disabled:cursor-not-allowed 
              disabled:opacity-50
              ${error
                                ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
                                : 'border-slate-300 focus:border-primary'
                            }
              ${className}
            `}
                        {...props}
                    >
                        {placeholder && (
                            <option value="" disabled selected>
                                {placeholder}
                            </option>
                        )}
                        {options.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-500">
                        <CaretDown size={16} weight="bold" />
                    </div>
                </div>
                {error && (
                    <p className="mt-1 text-sm text-red-500 animate-fadeIn">{error}</p>
                )}
                {helperText && !error && (
                    <p className="mt-1 text-sm text-slate-500">{helperText}</p>
                )}
            </div>
        );
    }
);

Select.displayName = 'Select';

export default Select;

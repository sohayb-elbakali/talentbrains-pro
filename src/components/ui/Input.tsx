import { InputHTMLAttributes, forwardRef, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
    onRightIconClick?: () => void;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className = '', label, error, helperText, leftIcon, rightIcon, onRightIconClick, disabled, ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        {label}
                    </label>
                )}
                <div className="relative">
                    {leftIcon && (
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            {leftIcon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        disabled={disabled}
                        className={`
              w-full 
              rounded-lg 
              border 
              bg-white 
              px-3 py-2 
              text-sm 
              text-slate-900 
              placeholder:text-slate-400 
              transition-colors 
              focus:outline-none 
              focus:ring-2 
              focus:ring-primary/20 
              disabled:cursor-not-allowed 
              disabled:opacity-50
              ${leftIcon ? 'pl-10' : ''}
              ${rightIcon ? 'pr-10' : ''}
              ${error
                                ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
                                : 'border-slate-300 focus:border-primary'
                            }
              ${className}
            `}
                        {...props}
                    />
                    {rightIcon && (
                        <div
                            className={`absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 ${onRightIconClick ? 'cursor-pointer pointer-events-auto hover:text-slate-600' : 'pointer-events-none'}`}
                            onClick={onRightIconClick}
                        >
                            {rightIcon}
                        </div>
                    )}
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

Input.displayName = 'Input';

export default Input;

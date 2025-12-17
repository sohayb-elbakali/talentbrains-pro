import { TextareaHTMLAttributes, forwardRef } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    helperText?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className = '', label, error, helperText, disabled, rows = 4, ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        {label}
                    </label>
                )}
                <textarea
                    ref={ref}
                    disabled={disabled}
                    rows={rows}
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
            resize-y
            ${error
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
                            : 'border-slate-300 focus:border-primary'
                        }
            ${className}
          `}
                    {...props}
                />
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

Textarea.displayName = 'Textarea';

export default Textarea;

import { ReactNode, ButtonHTMLAttributes } from 'react';
import { CircleNotch } from '@phosphor-icons/react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children?: ReactNode;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    icon?: ReactNode;
    iconPosition?: 'left' | 'right';
    fullWidth?: boolean;
}

/**
 * Unified Button Component
 * Follows the classic, restrained design system:
 * - Primary: Blue (bg-primary)
 * - Secondary: slate-100 background
 * - Outline: white with border
 * - Ghost: transparent
 * - Danger/Success: semantic colors only
 */
export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    icon,
    iconPosition = 'left',
    fullWidth = false,
    className = '',
    disabled,
    ...props
}: ButtonProps) {
    const baseClasses = `
    inline-flex items-center justify-center gap-2 
    font-medium rounded-lg 
    transition-colors duration-200
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

    const variantClasses = {
        primary: 'bg-primary text-white hover:bg-blue-700',
        secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200',
        outline: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300',
        ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900',
        danger: 'bg-red-600 text-white hover:bg-red-700',
        success: 'bg-green-600 text-white hover:bg-green-700',
    };

    const sizeClasses = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base',
    };

    const widthClass = fullWidth ? 'w-full' : '';

    return (
        <button
            className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${widthClass}
        ${className}
      `}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <>
                    <CircleNotch size={size === 'sm' ? 16 : 20} weight="regular" className="animate-spin" />
                    <span>Loading...</span>
                </>
            ) : (
                <>
                    {icon && iconPosition === 'left' && icon}
                    {children}
                    {icon && iconPosition === 'right' && icon}
                </>
            )}
        </button>
    );
}

/**
 * IconButton for icon-only buttons
 */
export function IconButton({
    children,
    variant = 'ghost',
    size = 'md',
    className = '',
    ...props
}: Omit<ButtonProps, 'icon' | 'iconPosition' | 'fullWidth'>) {
    const baseClasses = `
    inline-flex items-center justify-center 
    rounded-lg transition-colors duration-200
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

    const variantClasses = {
        primary: 'bg-primary text-white hover:bg-blue-700',
        secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
        outline: 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-primary',
        ghost: 'bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-900',
        danger: 'bg-red-600 text-white hover:bg-red-700',
        success: 'bg-green-600 text-white hover:bg-green-700',
    };

    const sizeClasses = {
        sm: 'p-1.5',
        md: 'p-2',
        lg: 'p-3',
    };

    return (
        <button
            className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
            {...props}
        >
            {children}
        </button>
    );
}

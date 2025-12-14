import { ReactNode } from 'react';

interface CardProps {
    children: ReactNode;
    className?: string;
    hover?: boolean;
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

/**
 * Unified Card Component
 * Style: rounded-2xl, border border-slate-200, shadow-sm, bg-white
 * Use this for all card-based UI elements
 */
export default function Card({
    children,
    className = '',
    hover = false,
    padding = 'md'
}: CardProps) {
    const paddingClasses = {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
    };

    const hoverClasses = hover
        ? 'hover:shadow-md hover:border-primary transition-all duration-200'
        : '';

    return (
        <div
            className={`
        bg-white 
        rounded-2xl 
        border 
        border-slate-200 
        shadow-sm 
        ${paddingClasses[padding]} 
        ${hoverClasses} 
        ${className}
      `}
        >
            {children}
        </div>
    );
}

/**
 * Card Header component for consistent card titles
 */
export function CardHeader({
    title,
    subtitle,
    action,
    className = ''
}: {
    title: string;
    subtitle?: string;
    action?: ReactNode;
    className?: string;
}) {
    return (
        <div className={`flex items-start justify-between mb-4 ${className}`}>
            <div>
                <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
            </div>
            {action && <div>{action}</div>}
        </div>
    );
}

/**
 * Card Content wrapper for consistent spacing
 */
export function CardContent({
    children,
    className = ''
}: {
    children: ReactNode;
    className?: string;
}) {
    return <div className={className}>{children}</div>;
}

/**
 * Card Footer for actions at the bottom of cards
 */
export function CardFooter({
    children,
    className = ''
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <div className={`pt-4 border-t border-slate-200 mt-4 ${className}`}>
            {children}
        </div>
    );
}

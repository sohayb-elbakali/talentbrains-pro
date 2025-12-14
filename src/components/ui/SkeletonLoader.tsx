import React from 'react';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
    width?: string | number;
    height?: string | number;
    count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
    className = '',
    variant = 'text',
    width,
    height,
    count = 1,
}) => {
    const baseClasses = 'animate-pulse bg-gray-200';

    const variantClasses = {
        text: 'h-4 rounded',
        circular: 'rounded-full',
        rectangular: '',
        rounded: 'rounded-xl',
    };

    const style: React.CSSProperties = {
        width: width || '100%',
        height: height || (variant === 'text' ? '1rem' : '100%'),
    };

    const skeletonElement = (
        <div
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            style={style}
        />
    );

    if (count === 1) {
        return skeletonElement;
    }

    return (
        <>
            {Array.from({ length: count }).map((_, index) => (
                <div key={index} className="mb-2">
                    {skeletonElement}
                </div>
            ))}
        </>
    );
};

// Card Skeleton for job/application cards
export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: count }).map((_, index) => (
                <div
                    key={index}
                    className="bg-white rounded-xl shadow-md border border-gray-200 p-5 animate-pulse"
                >
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-4">
                        <Skeleton variant="circular" width={48} height={48} />
                        <div className="flex-1">
                            <Skeleton width="70%" height={20} className="mb-2" />
                            <Skeleton width="50%" height={16} />
                        </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-2 mb-4">
                        <Skeleton height={28} />
                        <Skeleton height={28} />
                    </div>

                    {/* Button */}
                    <Skeleton height={40} className="rounded-lg" />
                </div>
            ))}
        </div>
    );
};

// Stats Skeleton for dashboard
export const StatsSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: count }).map((_, index) => (
                <div
                    key={index}
                    className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-6 animate-pulse"
                >
                    <div className="flex items-center justify-between mb-4">
                        <Skeleton variant="circular" width={48} height={48} />
                    </div>
                    <Skeleton width="60%" height={32} className="mb-2" />
                    <Skeleton width="80%" height={16} />
                </div>
            ))}
        </div>
    );
};

// Profile Skeleton
export const ProfileSkeleton: React.FC = () => {
    return (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 animate-pulse">
            <div className="flex items-center gap-4 mb-6">
                <Skeleton variant="circular" width={80} height={80} />
                <div className="flex-1">
                    <Skeleton width="40%" height={24} className="mb-2" />
                    <Skeleton width="60%" height={16} />
                </div>
            </div>
            <div className="space-y-4">
                <Skeleton height={20} count={3} />
            </div>
        </div>
    );
};

export default Skeleton;

import { cn } from '../../lib/utils';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular';
    width?: string | number;
    height?: string | number;
    animate?: boolean;
}

export function Skeleton({
    className,
    variant = 'rectangular',
    width,
    height,
    animate = true,
}: SkeletonProps) {
    const baseClasses = cn(
        'bg-slate-200',
        animate && 'animate-pulse',
        variant === 'circular' && 'rounded-full',
        variant === 'text' && 'rounded h-4',
        variant === 'rectangular' && 'rounded-lg',
        className
    );

    return (
        <div
            className={baseClasses}
            style={{
                width: width,
                height: height,
            }}
        />
    );
}

// Pre-built skeleton layouts for common patterns
export function CardSkeleton({ className }: { className?: string }) {
    return (
        <div className={cn('bg-white rounded-xl border border-slate-200 p-6 space-y-4', className)}>
            <div className="flex items-center gap-4">
                <Skeleton variant="circular" className="w-12 h-12" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                </div>
            </div>
            <Skeleton className="h-20 w-full" />
            <div className="flex gap-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-14 rounded-full" />
            </div>
        </div>
    );
}

export function JobCardSkeleton({ className }: { className?: string }) {
    return (
        <div className={cn('bg-white rounded-xl border border-slate-200 overflow-hidden', className)}>
            <div className="h-1 bg-slate-200" />
            <div className="p-6 space-y-4">
                <div className="flex items-start gap-4">
                    <Skeleton className="w-16 h-16 rounded-xl" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                </div>
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <Skeleton className="w-8 h-8 rounded-lg" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                    <div className="flex items-center gap-3">
                        <Skeleton className="w-8 h-8 rounded-lg" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-6 w-16 rounded-md" />
                    <Skeleton className="h-6 w-20 rounded-md" />
                </div>
                <Skeleton className="h-12 w-full rounded-xl" />
            </div>
        </div>
    );
}

export function ProfileSkeleton({ className }: { className?: string }) {
    return (
        <div className={cn('space-y-6', className)}>
            {/* Header Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center gap-6">
                    <Skeleton variant="circular" className="w-24 h-24" />
                    <div className="flex-1 space-y-3">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-32" />
                        <div className="flex gap-2">
                            <Skeleton className="h-6 w-20 rounded-lg" />
                            <Skeleton className="h-6 w-24 rounded-lg" />
                        </div>
                    </div>
                </div>
            </div>
            {/* Content Cards */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
                <Skeleton className="h-5 w-32" />
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-full" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-full" />
                    </div>
                </div>
            </div>
        </div>
    );
}

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                <div className="flex gap-4">
                    {Array.from({ length: columns }).map((_, i) => (
                        <Skeleton key={i} className="h-4 flex-1" />
                    ))}
                </div>
            </div>
            {/* Rows */}
            <div className="divide-y divide-slate-100">
                {Array.from({ length: rows }).map((_, rowIndex) => (
                    <div key={rowIndex} className="px-6 py-4">
                        <div className="flex gap-4 items-center">
                            {Array.from({ length: columns }).map((_, colIndex) => (
                                <Skeleton
                                    key={colIndex}
                                    className="h-4 flex-1"
                                    style={{ opacity: 1 - rowIndex * 0.1 }}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-xl border border-slate-200 p-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-8 w-16" />
                            </div>
                            <Skeleton className="w-12 h-12 rounded-lg" />
                        </div>
                    </div>
                ))}
            </div>
            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <TableSkeleton rows={5} columns={4} />
                </div>
                <div className="space-y-4">
                    <CardSkeleton />
                    <CardSkeleton />
                </div>
            </div>
        </div>
    );
}

export function ListSkeleton({ items = 5 }: { items?: number }) {
    return (
        <div className="space-y-4">
            {Array.from({ length: items }).map((_, i) => (
                <CardSkeleton key={i} />
            ))}
        </div>
    );
}

export default Skeleton;

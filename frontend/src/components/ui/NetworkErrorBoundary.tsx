import { motion, AnimatePresence } from 'framer-motion';
import { WifiX, ArrowClockwise, Warning, CloudSlash } from '@phosphor-icons/react';
import { useNetworkStatus } from '../../hooks/useNetworkResilience';

interface NetworkErrorBoundaryProps {
    children: React.ReactNode;
    error: Error | null;
    isLoading: boolean;
    isRetrying?: boolean;
    retryCount?: number;
    onRetry?: () => void;
    loadingComponent?: React.ReactNode;
}

/**
 * Network-aware error boundary component
 * Shows appropriate UI for offline state, errors, and loading
 */
export function NetworkErrorBoundary({
    children,
    error,
    isLoading,
    isRetrying = false,
    retryCount = 0,
    onRetry,
    loadingComponent,
}: NetworkErrorBoundaryProps) {
    const { isOnline, networkStatus } = useNetworkStatus();

    // Show loading state
    if (isLoading && !error) {
        return <>{loadingComponent || <DefaultLoadingSkeleton />}</>;
    }

    // Show offline state
    if (!isOnline) {
        return (
            <OfflineCard
                onRetry={onRetry}
                message="You're currently offline. Some features may be unavailable."
            />
        );
    }

    // Show error state with retry
    if (error) {
        const isNetworkError =
            error.message?.includes('fetch') ||
            error.message?.includes('network') ||
            error.message?.includes('timeout');

        return (
            <ErrorCard
                error={error}
                isNetworkError={isNetworkError}
                isRetrying={isRetrying}
                retryCount={retryCount}
                onRetry={onRetry}
            />
        );
    }

    // Show slow connection warning overlay if needed
    if (networkStatus === 'slow') {
        return (
            <div className="relative">
                <SlowConnectionBanner />
                {children}
            </div>
        );
    }

    return <>{children}</>;
}

/**
 * Offline state card
 */
function OfflineCard({
    message,
    onRetry,
}: {
    message: string;
    onRetry?: () => void;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center"
        >
            <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CloudSlash size={32} className="text-amber-600" weight="duotone" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
                You're Offline
            </h3>
            <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">{message}</p>

            {onRetry && (
                <button
                    onClick={onRetry}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium text-sm transition-colors"
                >
                    <ArrowClockwise size={18} />
                    Try Again
                </button>
            )}

            <p className="text-xs text-slate-400 mt-4">
                We'll automatically retry when you're back online
            </p>
        </motion.div>
    );
}

/**
 * Error state card with retry functionality
 */
function ErrorCard({
    error,
    isNetworkError,
    isRetrying,
    retryCount,
    onRetry,
}: {
    error: Error;
    isNetworkError: boolean;
    isRetrying: boolean;
    retryCount: number;
    onRetry?: () => void;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center"
        >
            <div
                className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isNetworkError
                        ? 'bg-gradient-to-br from-amber-100 to-orange-100'
                        : 'bg-gradient-to-br from-red-100 to-pink-100'
                    }`}
            >
                {isNetworkError ? (
                    <WifiX size={32} className="text-amber-600" weight="duotone" />
                ) : (
                    <Warning size={32} className="text-red-500" weight="duotone" />
                )}
            </div>

            <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {isNetworkError ? 'Connection Problem' : 'Something Went Wrong'}
            </h3>

            <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">
                {isNetworkError
                    ? "We couldn't connect to the server. Please check your internet connection."
                    : error.message || 'An unexpected error occurred. Please try again.'}
            </p>

            {onRetry && (
                <button
                    onClick={onRetry}
                    disabled={isRetrying}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium text-sm transition-colors"
                >
                    {isRetrying ? (
                        <>
                            <ArrowClockwise size={18} className="animate-spin" />
                            Retrying{retryCount > 0 ? ` (${retryCount})` : '...'}
                        </>
                    ) : (
                        <>
                            <ArrowClockwise size={18} />
                            Try Again
                        </>
                    )}
                </button>
            )}
        </motion.div>
    );
}

/**
 * Slow connection warning banner
 */
function SlowConnectionBanner() {
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-2 mb-4 flex items-center gap-2 text-sm text-amber-700"
            >
                <WifiX size={16} className="flex-shrink-0" />
                <span>Slow connection detected. Some content may load slowly.</span>
            </motion.div>
        </AnimatePresence>
    );
}

/**
 * Default loading skeleton
 */
function DefaultLoadingSkeleton() {
    return (
        <div className="space-y-4">
            {/* Stats skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm animate-pulse"
                    >
                        <div className="h-3 w-20 bg-slate-200 rounded mb-3" />
                        <div className="h-8 w-16 bg-slate-200 rounded" />
                    </div>
                ))}
            </div>

            {/* Content skeleton */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 animate-pulse">
                <div className="h-5 w-40 bg-slate-200 rounded mb-6" />
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-200 rounded-lg" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 w-3/4 bg-slate-200 rounded" />
                                <div className="h-3 w-1/2 bg-slate-200 rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/**
 * Inline retry button for smaller components
 */
export function RetryButton({
    onRetry,
    isRetrying,
    size = 'md',
}: {
    onRetry: () => void;
    isRetrying?: boolean;
    size?: 'sm' | 'md';
}) {
    const sizeClasses = {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-4 py-2 text-sm',
    };

    return (
        <button
            onClick={onRetry}
            disabled={isRetrying}
            className={`inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-lg font-medium transition-colors ${sizeClasses[size]}`}
        >
            <ArrowClockwise
                size={size === 'sm' ? 14 : 16}
                className={isRetrying ? 'animate-spin' : ''}
            />
            {isRetrying ? 'Retrying...' : 'Retry'}
        </button>
    );
}

/**
 * Simple offline indicator for inline use
 */
export function InlineOfflineIndicator() {
    const { isOnline } = useNetworkStatus();

    if (isOnline) return null;

    return (
        <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
            <WifiX size={12} weight="bold" />
            <span>Offline</span>
        </div>
    );
}

export default NetworkErrorBoundary;

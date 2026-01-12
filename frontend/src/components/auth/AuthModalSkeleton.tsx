import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface SkeletonProps {
    className?: string;
    animate?: boolean;
}

function SkeletonPulse({ className, animate = true }: SkeletonProps) {
    return (
        <div
            className={cn(
                'bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 rounded-lg',
                animate && 'animate-shimmer bg-[length:200%_100%]',
                className
            )}
        />
    );
}

interface AuthModalSkeletonProps {
    mode?: 'signin' | 'signup';
}

/**
 * Premium skeleton loader for AuthModal
 * Creates a beautiful shimmer effect that matches the actual form layout
 */
export default function AuthModalSkeleton({ mode = 'signin' }: AuthModalSkeletonProps) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
        >
            {/* Header skeleton */}
            <div className="p-5">
                <div className="space-y-3 mb-6">
                    <SkeletonPulse className="h-7 w-48" />
                    <SkeletonPulse className="h-4 w-64" />
                </div>

                {/* User type selector skeleton (only for signup) */}
                {mode === 'signup' && (
                    <div className="grid grid-cols-2 gap-3 mb-5">
                        <div className="p-4 rounded-2xl border border-slate-200 flex flex-col items-center gap-2">
                            <SkeletonPulse className="w-8 h-8 rounded-full" />
                            <SkeletonPulse className="h-4 w-16" />
                        </div>
                        <div className="p-4 rounded-2xl border border-slate-200 flex flex-col items-center gap-2">
                            <SkeletonPulse className="w-8 h-8 rounded-full" />
                            <SkeletonPulse className="h-4 w-16" />
                        </div>
                    </div>
                )}

                {/* Form fields skeleton */}
                <div className="space-y-4">
                    {/* Full Name field (signup only) */}
                    {mode === 'signup' && (
                        <div className="space-y-2">
                            <SkeletonPulse className="h-4 w-24" />
                            <div className="relative">
                                <SkeletonPulse className="h-12 w-full rounded-xl" />
                            </div>
                        </div>
                    )}

                    {/* Email field */}
                    <div className="space-y-2">
                        <SkeletonPulse className="h-4 w-16" />
                        <div className="relative">
                            <SkeletonPulse className="h-12 w-full rounded-xl" />
                        </div>
                    </div>

                    {/* Password field */}
                    <div className="space-y-2">
                        <SkeletonPulse className="h-4 w-20" />
                        <div className="relative">
                            <SkeletonPulse className="h-12 w-full rounded-xl" />
                        </div>
                    </div>

                    {/* Confirm Password field (signup only) */}
                    {mode === 'signup' && (
                        <div className="space-y-2">
                            <SkeletonPulse className="h-4 w-36" />
                            <div className="relative">
                                <SkeletonPulse className="h-12 w-full rounded-xl" />
                            </div>
                        </div>
                    )}

                    {/* Submit button skeleton */}
                    <div className="pt-2">
                        <SkeletonPulse className="h-12 w-full rounded-xl" />
                    </div>

                    {/* Divider and switch mode skeleton */}
                    <div className="pt-4 space-y-4">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200"></div>
                            </div>
                            <div className="relative flex justify-center">
                                <SkeletonPulse className="h-4 w-40 bg-white" />
                            </div>
                        </div>
                        <div className="flex justify-center">
                            <SkeletonPulse className="h-4 w-32" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Add shimmer keyframes via inline style */}
            <style>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        .animate-shimmer {
          animation: shimmer 1.5s ease-in-out infinite;
        }
      `}</style>
        </motion.div>
    );
}

/**
 * Full-page auth loading skeleton
 * For when the entire auth page is loading
 */
export function AuthPageSkeleton() {
    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
            >
                <AuthModalSkeleton />
            </motion.div>
        </div>
    );
}

/**
 * Inline loading state for auth forms
 * Shows loader within the current form context
 */
export function AuthFormLoadingSkeleton() {
    return (
        <div className="space-y-4 animate-pulse">
            <div className="flex items-center justify-center py-8">
                <div className="relative">
                    {/* Spinning ring */}
                    <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-blue-500 animate-spin" />
                    {/* Inner glow */}
                    <div className="absolute inset-0 rounded-full bg-blue-500/10 animate-pulse" />
                </div>
            </div>
            <div className="text-center">
                <p className="text-sm text-slate-500 font-medium">Authenticating...</p>
            </div>
        </div>
    );
}

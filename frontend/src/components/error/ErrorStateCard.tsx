import { motion } from 'framer-motion';
import { WifiSlash, ArrowClockwise, WarningCircle, CloudSlash } from '@phosphor-icons/react';
import { isNetworkError } from '../utils/networkErrorHandler';

interface ErrorStateCardProps {
  error: any;
  onRetry?: () => void;
  title?: string;
  message?: string;
  compact?: boolean;
}

/**
 * Reusable error state card component
 * Shows appropriate UI based on error type
 */
export default function ErrorStateCard({
  error,
  onRetry,
  title,
  message,
  compact = false,
}: ErrorStateCardProps) {
  const isNetwork = isNetworkError(error);
  const isOffline = !navigator.onLine;

  const getErrorConfig = () => {
    if (isOffline) {
      return {
        icon: WifiSlash,
        iconBg: 'bg-blue-100',
        iconColor: 'text-primary',
        title: title || 'No Connection',
        message: message || 'Check your internet connection and try again',
      };
    }

    if (isNetwork) {
      return {
        icon: CloudSlash,
        iconBg: 'bg-slate-100',
        iconColor: 'text-slate-600',
        title: title || 'Connection Error',
        message: message || 'Unable to reach the server. Please try again',
      };
    }

    return {
      icon: WarningCircle,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      title: title || 'Error',
      message: message || 'Something went wrong. Please try again',
    };
  };

  const config = getErrorConfig();
  const Icon = config.icon;

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200"
      >
        <div className="flex items-center gap-3">
          <div className={`${config.iconBg} p-2 rounded-lg`}>
            <Icon size={20} weight="regular" className={config.iconColor} />
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-sm">{config.title}</p>
            <p className="text-slate-600 text-xs">{config.message}</p>
          </div>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <ArrowClockwise size={16} weight="regular" />
            Retry
          </button>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8"
    >
      {/* Icon */}
      <div className="flex justify-center mb-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          className={`${config.iconBg} p-4 rounded-2xl`}
        >
          <Icon size={32} weight="regular" className={config.iconColor} />
        </motion.div>
      </div>

      {/* Title */}
      <h3 className="text-2xl font-bold text-slate-900 text-center mb-4">
        {config.title}
      </h3>

      {/* Message */}
      <p className="text-slate-600 text-center mb-6">{config.message}</p>

      {/* Error details (only in development) */}
      {import.meta.env.DEV && error?.message && (
        <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <p className="text-xs font-mono text-slate-700 break-all">
            {error.message}
          </p>
        </div>
      )}

      {/* Retry button */}
      {onRetry && (
        <button
          onClick={onRetry}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          <ArrowClockwise size={20} weight="regular" />
          Try Again
        </button>
      )}
    </motion.div>
  );
}

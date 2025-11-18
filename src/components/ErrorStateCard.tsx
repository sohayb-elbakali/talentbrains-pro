import { motion } from 'framer-motion';
import { WifiOff, RefreshCw, AlertCircle, ServerCrash } from 'lucide-react';
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
        icon: WifiOff,
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        title: title || 'No Connection',
        message: message || 'Check your internet connection and try again',
      };
    }

    if (isNetwork) {
      return {
        icon: ServerCrash,
        iconBg: 'bg-orange-100',
        iconColor: 'text-orange-600',
        title: title || 'Connection Error',
        message: message || 'Unable to reach the server. Please try again',
      };
    }

    return {
      icon: AlertCircle,
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
        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200"
      >
        <div className="flex items-center gap-3">
          <div className={`${config.iconBg} p-2 rounded-lg`}>
            <Icon className={`h-5 w-5 ${config.iconColor}`} />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{config.title}</p>
            <p className="text-gray-600 text-xs">{config.message}</p>
          </div>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
          >
            <RefreshCw className="h-4 w-4" />
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
      className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 p-8"
    >
      {/* Icon */}
      <div className="flex justify-center mb-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          className={`${config.iconBg} p-4 rounded-2xl shadow-lg`}
        >
          <Icon className={`h-10 w-10 ${config.iconColor}`} />
        </motion.div>
      </div>

      {/* Title */}
      <h3 className="text-2xl font-bold text-gray-900 text-center mb-4">
        {config.title}
      </h3>

      {/* Message */}
      <p className="text-gray-600 text-center mb-6">{config.message}</p>

      {/* Error details (only in development) */}
      {process.env.NODE_ENV === 'development' && error?.message && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs font-mono text-gray-700 break-all">
            {error.message}
          </p>
        </div>
      )}

      {/* Retry button */}
      {onRetry && (
        <button
          onClick={onRetry}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 shadow-lg"
        >
          <RefreshCw className="h-5 w-5" />
          Try Again
        </button>
      )}
    </motion.div>
  );
}

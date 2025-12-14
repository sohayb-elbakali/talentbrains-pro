import { Component, ErrorInfo, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';
import { isNetworkError } from "../../utils/networkErrorHandler";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isNetworkError: boolean;
}

/**
 * Error boundary specifically for network errors
 * Shows a friendly UI when network requests fail
 */
export default class NetworkErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      isNetworkError: false,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      isNetworkError: isNetworkError(error),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('NetworkErrorBoundary caught error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      isNetworkError: false,
    });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full"
          >
            <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 p-8">
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                  className={`${this.state.isNetworkError
                    ? 'bg-blue-100'
                    : 'bg-red-100'
                    } p-4 rounded-2xl shadow-lg`}
                >
                  {this.state.isNetworkError ? (
                    <WifiOff className="h-10 w-10 text-primary" />
                  ) : (
                    <AlertTriangle className="h-10 w-10 text-red-600" />
                  )}
                </motion.div>
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">
                {this.state.isNetworkError
                  ? 'Connection Issue'
                  : 'Something Went Wrong'}
              </h2>

              {/* Message */}
              <p className="text-gray-600 text-center mb-6">
                {this.state.isNetworkError
                  ? 'Unable to connect to the server. Please check your internet connection and try again.'
                  : 'An unexpected error occurred. Please try refreshing the page.'}
              </p>

              {/* Error details (only in development) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs font-mono text-gray-700 break-all">
                    {this.state.error.message}
                  </p>
                </div>
              )}

              {/* Retry button */}
              <button
                onClick={this.handleRetry}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-hover transition-all transform hover:scale-105 shadow-lg"
              >
                <RefreshCw className="h-5 w-5" />
                Try Again
              </button>
            </div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

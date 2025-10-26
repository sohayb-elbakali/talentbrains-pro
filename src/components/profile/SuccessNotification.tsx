import { CheckCircle, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SuccessNotificationProps {
  show: boolean;
  message: string;
  onClose: () => void;
  autoClose?: boolean;
  duration?: number;
}

export default function SuccessNotification({
  show,
  message,
  onClose,
  autoClose = true,
  duration = 5000,
}: SuccessNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      if (autoClose) {
        const timer = setTimeout(() => {
          setIsVisible(false);
          setTimeout(onClose, 300); // Wait for animation to complete
        }, duration);
        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [show, autoClose, duration, onClose]);

  if (!show) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <div
        className={`bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg transition-all duration-300 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
        }`}
      >
        <div className="flex items-start">
          <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-green-800">{message}</p>
          </div>
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 300);
            }}
            className="ml-4 text-green-400 hover:text-green-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

interface ErrorNotificationProps {
  show: boolean;
  message: string;
  onClose: () => void;
  autoClose?: boolean;
  duration?: number;
}

export function ErrorNotification({
  show,
  message,
  onClose,
  autoClose = true,
  duration = 7000,
}: ErrorNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      if (autoClose) {
        const timer = setTimeout(() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }, duration);
        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [show, autoClose, duration, onClose]);

  if (!show) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <div
        className={`bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg transition-all duration-300 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
        }`}
      >
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-red-800">{message}</p>
          </div>
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 300);
            }}
            className="ml-4 text-red-400 hover:text-red-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

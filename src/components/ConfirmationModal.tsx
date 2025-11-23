import { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Info, XCircle, CheckCircle, X } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | ReactNode;
  confirmText?: string;
  cancelText?: string;
  confirmButtonClass?: string;
  type?: 'info' | 'warning' | 'danger' | 'success';
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmButtonClass,
  type = 'info',
}: ConfirmationModalProps) {
  // Get styling based on type
  const getTypeConfig = () => {
    switch (type) {
      case 'danger':
        return {
          icon: XCircle,
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          gradient: 'from-red-50 to-pink-50',
          buttonClass: confirmButtonClass || 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800',
          borderColor: 'border-red-200',
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          iconBg: 'bg-yellow-100',
          iconColor: 'text-yellow-600',
          gradient: 'from-yellow-50 to-orange-50',
          buttonClass: confirmButtonClass || 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700',
          borderColor: 'border-yellow-200',
        };
      case 'success':
        return {
          icon: CheckCircle,
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600',
          gradient: 'from-green-50 to-emerald-50',
          buttonClass: confirmButtonClass || 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700',
          borderColor: 'border-green-200',
        };
      default: // info
        return {
          icon: Info,
          iconBg: 'bg-blue-100',
          iconColor: 'text-primary',
          gradient: 'from-blue-50 to-white',
          buttonClass: confirmButtonClass || 'bg-primary hover:bg-primary-hover',
          borderColor: 'border-blue-200',
        };
    }
  };

  const config = getTypeConfig();
  const Icon = config.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.3 }}
            className={`relative bg-gradient-to-br ${config.gradient} rounded-2xl shadow-2xl max-w-md w-full border-2 ${config.borderColor} overflow-hidden`}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/50 transition-colors text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Content */}
            <div className="p-8">
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                  className={`${config.iconBg} p-4 rounded-2xl shadow-lg`}
                >
                  <Icon className={`h-10 w-10 ${config.iconColor}`} />
                </motion.div>
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-gray-900 text-center mb-4">
                {title}
              </h3>

              {/* Message */}
              <div className="text-gray-700 text-center mb-8 leading-relaxed">
                {message}
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 bg-white border-2 border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm"
                >
                  {cancelText}
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`flex-1 px-6 py-3 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 ${config.buttonClass}`}
                >
                  {confirmText}
                </button>
              </div>
            </div>

            {/* Decorative gradient line at bottom */}
            <div className={`h-1 w-full bg-gradient-to-r ${config.buttonClass}`}></div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

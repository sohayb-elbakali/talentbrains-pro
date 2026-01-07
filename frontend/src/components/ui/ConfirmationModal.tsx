import { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Warning, Info, XCircle, CheckCircle, X } from "@phosphor-icons/react";

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
          buttonClass: confirmButtonClass || 'bg-red-600 hover:bg-red-700',
        };
      case 'warning':
        return {
          icon: Warning,
          iconBg: 'bg-orange-100',
          iconColor: 'text-orange-600',
          buttonClass: confirmButtonClass || 'bg-orange-600 hover:bg-orange-700',
        };
      case 'success':
        return {
          icon: CheckCircle,
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600',
          buttonClass: confirmButtonClass || 'bg-green-600 hover:bg-green-700',
        };
      default: // info
        return {
          icon: Info,
          iconBg: 'bg-blue-100',
          iconColor: 'text-primary',
          buttonClass: confirmButtonClass || 'bg-primary hover:bg-blue-700',
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
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.2 }}
            className="relative bg-white rounded-2xl shadow-sm max-w-md w-full border border-slate-200 overflow-hidden"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-slate-50 transition-colors text-slate-500 hover:text-slate-700"
            >
              <X size={20} weight="regular" />
            </button>

            {/* Content */}
            <div className="p-8">
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                  className={`${config.iconBg} p-4 rounded-2xl`}
                >
                  <Icon size={32} weight="regular" className={config.iconColor} />
                </motion.div>
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-slate-900 text-center mb-4">
                {title}
              </h3>

              {/* Message */}
              <div className="text-slate-600 text-center mb-8 leading-relaxed">
                {message}
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium hover:bg-slate-50 hover:border-slate-300 transition-colors"
                >
                  {cancelText}
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`flex-1 px-6 py-3 text-white rounded-lg font-medium transition-colors ${config.buttonClass}`}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { ReactNode, useState } from 'react';
import Button from '../ui/Button';

interface ProfileUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  loading?: boolean;
  onSave?: () => void;
  onCancel?: () => void;
  hasUnsavedChanges?: boolean;
}

export default function ProfileUpdateModal({
  isOpen,
  onClose,
  title,
  children,
  loading = false,
  onSave,
  onCancel,
  hasUnsavedChanges = false,
}: ProfileUpdateModalProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    if (hasUnsavedChanges) {
      setShowConfirmDialog(true);
    } else {
      onClose();
    }
  };

  const handleConfirmClose = () => {
    setShowConfirmDialog(false);
    onClose();
  };

  const handleCancelDialog = () => {
    setShowConfirmDialog(false);
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      handleClose();
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-900">{title}</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              icon={<X className="h-5 w-5" />}
              className="!p-2"
            />
          </div>

          {/* Content */}
          <div className="overflow-y-auto flex-1 p-0">
            {children}
          </div>

          {/* Footer */}
          {(onSave || onCancel) && (
            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </Button>
              {onSave && (
                <Button
                  variant="primary"
                  onClick={onSave}
                  loading={loading}
                >
                  Save Changes
                </Button>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* Confirm Close Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex justify-center items-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6"
          >
            <div className="text-center">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Unsaved Changes</h3>
              <p className="text-sm text-slate-600 mb-6">
                You have unsaved changes. Are you sure you want to close without saving?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleCancelDialog}
                  className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                >
                  Keep Editing
                </button>
                <button
                  onClick={handleConfirmClose}
                  className="flex-1 px-4 py-2.5 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600 transition-colors"
                >
                  Discard Changes
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}


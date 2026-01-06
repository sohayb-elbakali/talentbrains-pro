import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { ReactNode } from 'react';
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
  if (!isOpen) return null;

  const handleClose = () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to close without saving?'
      );
      if (!confirmed) return;
    }
    onClose();
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      handleClose();
    }
  };

  return (
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
  );
}

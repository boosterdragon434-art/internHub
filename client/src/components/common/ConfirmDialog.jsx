import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { FiAlertTriangle } from 'react-icons/fi';

/**
 * Reusable Confirmation dialog popup.
 */
const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  description = 'This action cannot be undone. Please confirm to proceed.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  loading = false,
  variant = 'danger', // danger, primary
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col items-center text-center">
        <div className={`p-3 rounded-full mb-4 ${
          variant === 'danger'
            ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400'
            : 'bg-accent-50 dark:bg-accent-950/20 text-accent-600 dark:text-accent-400'
        }`}>
          <FiAlertTriangle className="h-6 w-6" />
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {description}
        </p>
        <div className="flex items-center gap-3 mt-6 w-full">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            className="flex-1"
            onClick={onConfirm}
            loading={loading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;

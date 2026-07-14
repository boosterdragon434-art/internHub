import React, { createContext, useContext } from 'react';
import { Toaster, toast } from 'react-hot-toast';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const showSuccess = (message) => {
    toast.success(message, {
      iconTheme: {
        primary: '#10B981', // emerald-500
        secondary: '#FFFFFF',
      },
    });
  };

  const showError = (message) => {
    toast.error(message, {
      iconTheme: {
        primary: '#EF4444', // red-500
        secondary: '#FFFFFF',
      },
    });
  };

  const showInfo = (message) => {
    toast(message, {
      icon: 'ℹ️',
    });
  };

  return (
    <ToastContext.Provider value={{ success: showSuccess, error: showError, info: showInfo }}>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          className: '!bg-white dark:!bg-slate-900 !text-slate-800 dark:!text-slate-100 !border !border-slate-200 dark:!border-slate-800 !shadow-2xl !rounded-2xl',
          style: {
            fontFamily: "'Inter', sans-serif",
            backdropFilter: 'blur(12px)',
          }
        }}
      />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
export { toast };

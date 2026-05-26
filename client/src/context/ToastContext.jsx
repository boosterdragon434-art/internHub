import React, { createContext, useContext } from 'react';
import { Toaster, toast } from 'react-hot-toast';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const showSuccess = (message) => {
    toast.success(message, {
      style: {
        background: '#1E293B',
        color: '#F8FAFC',
        border: '1px solid #334155',
        borderRadius: '0.75rem',
        fontFamily: 'Inter, sans-serif',
      },
      iconTheme: {
        primary: '#14B8A6',
        secondary: '#1E293B',
      },
    });
  };

  const showError = (message) => {
    toast.error(message, {
      style: {
        background: '#1E293B',
        color: '#F8FAFC',
        border: '1px solid #334155',
        borderRadius: '0.75rem',
        fontFamily: 'Inter, sans-serif',
      },
      iconTheme: {
        primary: '#F43F5E',
        secondary: '#1E293B',
      },
    });
  };

  const showInfo = (message) => {
    toast(message, {
      style: {
        background: '#1E293B',
        color: '#F8FAFC',
        border: '1px solid #334155',
        borderRadius: '0.75rem',
        fontFamily: 'Inter, sans-serif',
      },
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

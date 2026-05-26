import React from 'react';

/**
 * Reusable Loader components (inline and full-screen overlay styles).
 */
export const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
  };

  return (
    <div
      className={`animate-spin rounded-full border-slate-200 border-t-accent-600 dark:border-slate-800 dark:border-t-accent-500 ${sizes[size]} ${className}`}
      role="status"
    />
  );
};

export const FullPageLoader = ({ message = 'Loading...' }) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-sm">
      <Spinner size="lg" />
      <p className="mt-4 text-sm font-semibold text-slate-600 dark:text-slate-400 animate-pulse">
        {message}
      </p>
    </div>
  );
};

export default Spinner;

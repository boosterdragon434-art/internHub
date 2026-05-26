import React from 'react';
import Button from './Button';

/**
 * Reusable empty state view with illustration, title, description, and action button.
 */
const EmptyState = ({
  title = 'No records found',
  description = 'We couldn\'t find any entries matching your request.',
  icon: Icon,
  actionText,
  onActionClick,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/40 ${className}`}>
      {Icon && (
        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400 dark:text-slate-500 mb-4 ring-8 ring-slate-100/50 dark:ring-slate-800/20">
          <Icon className="h-10 w-10" />
        </div>
      )}
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">
        {title}
      </h3>
      <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 max-w-sm">
        {description}
      </p>
      {actionText && onActionClick && (
        <Button
          variant="outline"
          size="sm"
          className="mt-5 shadow-sm"
          onClick={onActionClick}
        >
          {actionText}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;

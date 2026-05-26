import React from 'react';
import { getApplicationStatusColor, getPaymentStatusColor } from '../../utils/formatters';

/**
 * Reusable Badge component for application and payment statuses.
 */
const Badge = ({ status, type = 'application', className = '' }) => {
  const colorClass =
    type === 'application'
      ? getApplicationStatusColor(status)
      : getPaymentStatusColor(status);

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide ${colorClass} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80" />
      {status}
    </span>
  );
};

export default Badge;

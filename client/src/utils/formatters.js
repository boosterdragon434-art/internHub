/**
 * Formats a ISO date string into a readable format (e.g. 24 May 2026).
 * @param {string|Date} dateString 
 * @returns {string}
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Formats a number as Indian Currency (INR).
 * @param {number} amount 
 * @returns {string}
 */
export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Formats an internship fee/amount dynamically.
 * Supports pure numbers, ranges (e.g. "500-1000"), and descriptive strings (e.g. "Discussed after application").
 * @param {string|number} val 
 * @param {string} defaultValue 
 * @returns {string}
 */
export const formatDisplayAmount = (val, defaultValue = 'Free') => {
  if (val === undefined || val === null || val === '') return defaultValue;
  
  if (typeof val === 'number') {
    return val > 0 ? formatCurrency(val) : defaultValue;
  }
  
  const trimmed = String(val).trim();
  if (!trimmed) return defaultValue;
  
  // If it's a pure number string (e.g., "500")
  if (/^\d+$/.test(trimmed)) {
    const num = Number(trimmed);
    return num > 0 ? formatCurrency(num) : defaultValue;
  }
  
  // If it is a range string (e.g., "500-1000" or "500 - 1000")
  const rangeMatch = trimmed.match(/^(\d+)\s*-\s*(\d+)$/);
  if (rangeMatch) {
    const min = Number(rangeMatch[1]);
    const max = Number(rangeMatch[2]);
    return `${formatCurrency(min)} - ${formatCurrency(max)}`;
  }
  
  // Return descriptive string directly (e.g., "Discussed after application")
  return trimmed;
};

/**
 * Capitalizes the first letter of a string.
 * @param {string} str 
 * @returns {string}
 */
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Returns Tailwind class names for badge colors based on application status.
 * @param {string} status 
 * @returns {string} Tailwind classes
 */
export const getApplicationStatusColor = (status) => {
  switch (status) {
    case 'Applied':
      return 'bg-secondary-100 text-secondary-800 dark:bg-secondary-900/30 dark:text-secondary-400 border border-secondary-200 dark:border-secondary-800/50';
    case 'Under Review':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50';
    case 'Approved':
      return 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400 border border-teal-200 dark:border-teal-800/50';
    case 'Payment Pending':
      return 'bg-accent-100 text-accent-800 dark:bg-accent-900/30 dark:text-accent-400 border border-accent-200 dark:border-accent-800/50';
    case 'Payment Verification Pending':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-800/50';
    case 'Payment Completed':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800/50';
    case 'Joined':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50';
    case 'Completed':
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50';
    case 'Rejected':
      return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50';
    default:
      return 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400 border border-slate-200 dark:border-slate-800/50';
  }
};

/**
 * Returns Tailwind class names for badge colors based on payment status.
 * @param {string} status 
 * @returns {string} Tailwind classes
 */
export const getPaymentStatusColor = (status) => {
  switch (status) {
    case 'paid':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50';
    case 'pending_verification':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-800/50';
    case 'failed':
      return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50';
    case 'refunded':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50';
    default:
      return 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400 border border-slate-200 dark:border-slate-800/50';
  }
};

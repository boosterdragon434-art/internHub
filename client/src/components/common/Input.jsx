import React, { forwardRef } from 'react';

/**
 * Reusable input element with label, error messages, prefix icon support, and styling transitions.
 */
const Input = forwardRef(({
  label,
  name,
  type = 'text',
  error,
  icon: Icon,
  className = '',
  textarea = false,
  rows = 4,
  options = [], // For select fields
  placeholder = '',
  required = false,
  ...props
}, ref) => {
  const inputId = `input_${name}`;

  const inputBaseStyles = `block w-full px-4 py-3 text-xs bg-white dark:bg-slate-900 text-slate-950 dark:text-slate-50 border rounded-xl focus:outline-none focus:ring-4 transition-all duration-300 ease-out ${
    error
      ? 'border-rose-500/80 focus:ring-rose-500/10 focus:border-rose-500'
      : 'border-slate-200 dark:border-slate-800 focus:ring-accent-500/10 focus:border-accent-500'
  } ${Icon ? 'pl-10' : ''}`;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5"
        >
          {label}{' '}
          <span className={`text-[10px] font-normal ${required ? 'text-rose-500/90 dark:text-rose-400/90' : 'text-slate-400/80 dark:text-slate-500/85'}`}>
            ({required ? 'Required' : 'Optional'})
          </span>
        </label>
      )}

      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Icon className="h-5 w-5" />
          </div>
        )}

        {textarea ? (
          <textarea
            id={inputId}
            name={name}
            rows={rows}
            ref={ref}
            className={`${inputBaseStyles} resize-none`}
            placeholder={placeholder}
            required={required}
            {...props}
          />
        ) : type === 'select' ? (
          <select
            id={inputId}
            name={name}
            ref={ref}
            className={`${inputBaseStyles} appearance-none bg-no-repeat`}
            style={{
              backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`,
              backgroundPosition: 'right 0.75rem center',
              backgroundSize: '1.25rem',
            }}
            required={required}
            {...props}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            id={inputId}
            name={name}
            type={type}
            ref={ref}
            className={inputBaseStyles}
            placeholder={placeholder}
            required={required}
            {...props}
          />
        )}
      </div>

      {error && (
        <p className="mt-1.5 text-xs text-rose-500 font-medium animate-pulse">
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;

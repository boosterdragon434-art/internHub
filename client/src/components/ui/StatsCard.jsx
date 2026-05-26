import React from 'react';
import { motion } from 'framer-motion';

/**
 * Reusable premium dashboard statistics card with hover effects and animations.
 */
const StatsCard = ({
  title,
  value,
  icon: Icon,
  trend, // { type: 'up'|'down', text: '12% vs last month' }
  color = 'indigo', // indigo, teal, amber, rose, purple
}) => {
  const colorSchemes = {
    indigo: {
      bg: 'bg-accent-50 dark:bg-accent-950/20',
      text: 'text-accent-600 dark:text-accent-400',
      ring: 'ring-accent-100 dark:ring-accent-900/10',
    },
    teal: {
      bg: 'bg-secondary-50 dark:bg-secondary-950/20',
      text: 'text-secondary-600 dark:text-secondary-400',
      ring: 'ring-secondary-100 dark:ring-secondary-900/10',
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-950/20',
      text: 'text-amber-600 dark:text-amber-400',
      ring: 'ring-amber-100 dark:ring-amber-900/10',
    },
    rose: {
      bg: 'bg-rose-50 dark:bg-rose-950/20',
      text: 'text-rose-600 dark:text-rose-400',
      ring: 'ring-rose-100 dark:ring-rose-900/10',
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-950/20',
      text: 'text-purple-600 dark:text-purple-400',
      ring: 'ring-purple-100 dark:ring-purple-900/10',
    },
  };

  const scheme = colorSchemes[color] || colorSchemes.indigo;

  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="bg-white dark:bg-slate-900 p-6 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex items-center justify-between overflow-hidden relative"
    >
      <div className="flex-1">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {title}
        </p>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mt-1">
          {value}
        </h3>
        {trend && (
          <div className="flex items-center gap-1.5 mt-2">
            <span
              className={`text-xs font-bold ${
                trend.type === 'up'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {trend.type === 'up' ? '↑' : '↓'} {trend.value}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
              {trend.text}
            </span>
          </div>
        )}
      </div>

      {Icon && (
        <div className={`p-4 rounded-xl ${scheme.bg} ${scheme.text} ring-8 ${scheme.ring}`}>
          <Icon className="h-6 w-6" />
        </div>
      )}
    </motion.div>
  );
};

export default StatsCard;

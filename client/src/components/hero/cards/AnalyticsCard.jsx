import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp } from 'lucide-react';

/**
 * Analytics card with mini bar chart. Bars use CSS animation, not Framer Motion.
 */
const AnalyticsCard = ({ delay = 0, reducedMotion = false }) => {
  const bars = [40, 65, 45, 80, 60, 90, 70];

  return (
    <motion.div
      initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 15, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={reducedMotion ? { duration: 0 } : { delay, duration: 0.5, type: 'spring', stiffness: 90, damping: 16 }}
      className="bg-white/75 backdrop-blur-xl border border-white/30 rounded-2xl p-3.5 sm:p-4 shadow-lg shadow-blue-500/5 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
      role="presentation"
      aria-label="Analytics showing 1,248 applications with 18 percent increase"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-medium text-slate-500 font-hero-body">Applications</span>
        </div>
        <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 rounded-md">
          <TrendingUp className="w-3 h-3 text-blue-600" />
          <span className="text-xs font-bold text-blue-600 font-hero-body">+18%</span>
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-800 font-hero-body">1,248</p>
      {/* Mini bar chart — CSS animation instead of Framer Motion loops */}
      <div className="flex items-end gap-1 mt-2.5 h-7">
        {bars.map((h, i) => (
          <div
            key={i}
            className={`flex-1 rounded-sm bg-gradient-to-t from-blue-500 to-blue-400 ${reducedMotion ? '' : 'hero-bar-grow'}`}
            style={reducedMotion
              ? { height: `${h}%` }
              : { '--bar-height': `${h}%`, animationDelay: `${delay + 0.5 + i * 0.06}s` }
            }
          />
        ))}
      </div>
    </motion.div>
  );
};

export default React.memo(AnalyticsCard);

import React from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

/**
 * Attendance card with CSS-animated SVG ring. No Framer Motion loops.
 */
const AttendanceCard = ({ delay = 0, reducedMotion = false }) => {
  const pct = 98;
  const C = 2 * Math.PI * 18; // circumference, r=18
  const offset = C - (pct / 100) * C;

  return (
    <motion.div
      initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 15, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={reducedMotion ? { duration: 0 } : { delay, duration: 0.5, type: 'spring', stiffness: 90, damping: 16 }}
      className="bg-white/75 backdrop-blur-xl border border-white/30 rounded-2xl p-3.5 sm:p-4 shadow-lg shadow-blue-500/5 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
      role="presentation"
      aria-label="Attendance rate of 98 percent"
    >
      <div className="flex items-center gap-3">
        <Clock className="w-4 h-4 text-slate-400" />
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-hero-body">Attendance</span>
      </div>
      <div className="mt-2.5 flex items-center gap-3">
        <div className="relative w-11 h-11 shrink-0">
          <svg className="w-11 h-11 -rotate-90" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="18" fill="none" stroke="#E2E8F0" strokeWidth="3" />
            <circle
              cx="20" cy="20" r="18" fill="none"
              stroke="#2563EB"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={reducedMotion ? offset : C}
              className={reducedMotion ? '' : 'hero-ring-fill'}
              style={reducedMotion ? {} : { '--ring-target': offset, animationDelay: `${delay + 0.3}s` }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-blue-600 font-hero-body">
            {pct}%
          </span>
        </div>
        <span className="text-2xl font-bold text-slate-800 font-hero-body">98%</span>
      </div>
    </motion.div>
  );
};

export default React.memo(AttendanceCard);

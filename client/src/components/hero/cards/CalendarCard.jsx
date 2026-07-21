import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Video } from 'lucide-react';

/**
 * Calendar/interview card. CSS-only hover.
 */
const CalendarCard = ({ delay = 0, reducedMotion = false }) => (
  <motion.div
    initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 15, scale: 0.97 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={reducedMotion ? { duration: 0 } : { delay, duration: 0.5, type: 'spring', stiffness: 90, damping: 16 }}
    className="bg-white/75 backdrop-blur-xl border border-white/30 rounded-2xl p-3.5 sm:p-4 shadow-lg shadow-orange-500/5 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
    role="presentation"
    aria-label="Calendar showing interview scheduled for today"
  >
    <div className="flex items-center gap-2 mb-2">
      <Calendar className="w-4 h-4 text-orange-500" />
      <span className="text-xs font-medium text-slate-500 font-hero-body">Today</span>
    </div>
    <div className="flex items-center gap-2.5">
      <div className="w-1 h-8 rounded-full bg-gradient-to-b from-orange-400 to-orange-500" />
      <div>
        <h4 className="text-sm font-semibold text-slate-800 font-hero-body">Interview</h4>
        <div className="flex items-center gap-1.5 mt-0.5">
          <Video className="w-3 h-3 text-slate-400" />
          <span className="text-xs text-slate-500 font-hero-body">2:00 PM</span>
        </div>
      </div>
    </div>
  </motion.div>
);

export default React.memo(CalendarCard);

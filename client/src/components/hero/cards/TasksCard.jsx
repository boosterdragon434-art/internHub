import React from 'react';
import { motion } from 'framer-motion';
import { FileText, AlertCircle } from 'lucide-react';

/**
 * Tasks/offer-letters card. Pulse uses CSS animation, not Framer Motion.
 */
const TasksCard = ({ delay = 0, reducedMotion = false }) => (
  <motion.div
    initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 15, scale: 0.97 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={reducedMotion ? { duration: 0 } : { delay, duration: 0.5, type: 'spring', stiffness: 90, damping: 16 }}
    className="bg-white/75 backdrop-blur-xl border border-white/30 rounded-2xl p-3.5 sm:p-4 shadow-lg shadow-orange-500/5 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
    role="presentation"
    aria-label="Tasks showing pending offer letters"
  >
    <div className="flex items-center gap-2 mb-2">
      <FileText className="w-4 h-4 text-slate-500" />
      <span className="text-xs font-medium text-slate-500 font-hero-body">Offer Letters</span>
    </div>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full bg-orange-500 ${reducedMotion ? '' : 'hero-pulse-dot'}`} />
        <span className="text-sm font-semibold text-orange-600 font-hero-body">3 Pending</span>
      </div>
      <AlertCircle className="w-4 h-4 text-orange-400" />
    </div>
  </motion.div>
);

export default React.memo(TasksCard);

import React from 'react';
import { motion } from 'framer-motion';
import { User, CheckCircle } from 'lucide-react';

/**
 * Student profile card. CSS-only hover lift.
 */
const StudentCard = ({ delay = 0, reducedMotion = false }) => (
  <motion.div
    initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 15, scale: 0.97 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={reducedMotion ? { duration: 0 } : { delay, duration: 0.5, type: 'spring', stiffness: 90, damping: 16 }}
    className="bg-white/75 backdrop-blur-xl border border-white/30 rounded-2xl p-3.5 sm:p-4 shadow-lg shadow-blue-500/5 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/8"
    role="presentation"
    aria-label="Student profile card showing Rahul Sharma, MCA, Approved status"
  >
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
        <User className="w-5 h-5 text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="text-sm font-semibold text-slate-800 truncate font-hero-body">Rahul Sharma</h4>
        <p className="text-xs text-slate-500 font-hero-body">MCA</p>
      </div>
    </div>
    <div className="mt-2.5 flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 rounded-lg w-fit">
      <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
      <span className="text-xs font-semibold text-blue-700 font-hero-body">Approved</span>
    </div>
  </motion.div>
);

export default React.memo(StudentCard);

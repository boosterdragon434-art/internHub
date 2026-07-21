import React from 'react';
import { motion } from 'framer-motion';
import { Building2, Users } from 'lucide-react';

/**
 * Company card. CSS-only hover lift.
 */
const CompanyCard = ({ delay = 0, reducedMotion = false }) => (
  <motion.div
    initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 15, scale: 0.97 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={reducedMotion ? { duration: 0 } : { delay, duration: 0.5, type: 'spring', stiffness: 90, damping: 16 }}
    className="bg-white/75 backdrop-blur-xl border border-white/30 rounded-2xl p-3.5 sm:p-4 shadow-lg shadow-orange-500/5 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-500/8"
    role="presentation"
    aria-label="Company card showing InnovateX with 14 active interns"
  >
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center shrink-0 shadow-md shadow-orange-500/20">
        <Building2 className="w-5 h-5 text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="text-sm font-semibold text-slate-800 truncate font-hero-body">InnovateX</h4>
        <div className="flex items-center gap-1 mt-0.5">
          <Users className="w-3 h-3 text-slate-400" />
          <p className="text-xs text-slate-500 font-hero-body">14 Active Interns</p>
        </div>
      </div>
    </div>
  </motion.div>
);

export default React.memo(CompanyCard);

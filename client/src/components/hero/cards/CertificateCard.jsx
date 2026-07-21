import React from 'react';
import { motion } from 'framer-motion';
import { Award, Download } from 'lucide-react';

/**
 * Certificate card. CSS-only hover.
 */
const CertificateCard = ({ delay = 0, reducedMotion = false }) => (
  <motion.div
    initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 15, scale: 0.97 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={reducedMotion ? { duration: 0 } : { delay, duration: 0.5, type: 'spring', stiffness: 90, damping: 16 }}
    className="bg-white/75 backdrop-blur-xl border border-white/30 rounded-2xl p-3.5 sm:p-4 shadow-lg shadow-orange-500/5 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
    role="presentation"
    aria-label="Certificate generated notification"
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center shadow-sm shadow-orange-500/20">
          <Award className="w-4 h-4 text-white" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-800 font-hero-body">Certificate</h4>
          <p className="text-xs text-orange-600 font-medium font-hero-body">Generated ✓</p>
        </div>
      </div>
      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
        <Download className="w-3.5 h-3.5 text-slate-400" />
      </div>
    </div>
  </motion.div>
);

export default React.memo(CertificateCard);

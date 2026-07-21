import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Send } from 'lucide-react';

/**
 * AI assistant widget card. Pulse indicator uses CSS animation, not Framer Motion.
 */
const AIAssistantCard = ({ delay = 0, reducedMotion = false }) => (
  <motion.div
    initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 15, scale: 0.97 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={reducedMotion ? { duration: 0 } : { delay, duration: 0.5, type: 'spring', stiffness: 90, damping: 16 }}
    className="bg-gradient-to-br from-white/80 to-blue-50/50 backdrop-blur-xl border border-blue-100/40 rounded-2xl p-3.5 sm:p-4 shadow-lg shadow-blue-500/5 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/8"
    role="presentation"
    aria-label="AI Assistant widget for generating offer letters"
  >
    <div className="flex items-center gap-2 mb-2.5">
      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
        <Sparkles className="w-3.5 h-3.5 text-white" />
      </div>
      <h4 className="text-sm font-semibold text-slate-800 font-hero-body">AI Assistant</h4>
      {/* CSS pulse — no JS animation loop */}
      <div className={`ml-auto w-2 h-2 rounded-full bg-blue-500 ${reducedMotion ? '' : 'hero-pulse-dot'}`} />
    </div>
    <div className="flex items-center gap-2 bg-white/60 rounded-xl px-3 py-2 border border-slate-200/40">
      <span className="text-xs text-slate-500 flex-1 font-hero-body">Generate Offer Letter</span>
      <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center shrink-0">
        <Send className="w-3 h-3 text-white" />
      </div>
    </div>
  </motion.div>
);

export default React.memo(AIAssistantCard);
